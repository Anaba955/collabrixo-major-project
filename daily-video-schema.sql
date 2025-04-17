-- Daily.co video conferencing tables
-- This schema tracks rooms created with the Daily.co SDK

-- Daily.co rooms table
CREATE TABLE IF NOT EXISTS daily_video_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(100) NOT NULL UNIQUE,
    url VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Daily room participants table (optional - for tracking usage)
CREATE TABLE IF NOT EXISTS daily_room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(100) REFERENCES daily_video_rooms(room_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    session_id VARCHAR(100),
    device_info JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_rooms_created_by ON daily_video_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_daily_rooms_created_at ON daily_video_rooms(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_rooms_expires_at ON daily_video_rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_daily_participants_room ON daily_room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_daily_participants_user ON daily_room_participants(user_id);

-- View to get active Daily.co rooms
CREATE OR REPLACE VIEW vw_active_daily_rooms AS
SELECT 
    r.id,
    r.room_id,
    r.url,
    r.created_by,
    r.created_at,
    r.expires_at,
    COUNT(p.id) AS participant_count
FROM 
    daily_video_rooms r
LEFT JOIN 
    daily_room_participants p ON r.room_id = p.room_id AND p.left_at IS NULL
WHERE 
    r.is_deleted = FALSE AND
    (r.expires_at IS NULL OR r.expires_at > CURRENT_TIMESTAMP)
GROUP BY 
    r.id, r.room_id, r.url, r.created_by, r.created_at, r.expires_at
ORDER BY 
    r.created_at DESC;

-- Function to record a join event
CREATE OR REPLACE FUNCTION join_daily_room(p_room_id VARCHAR, p_user_id UUID, p_session_id VARCHAR, p_device_info JSONB DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    v_participant_id UUID;
BEGIN
    -- Update room last used timestamp
    UPDATE daily_video_rooms
    SET last_used_at = CURRENT_TIMESTAMP
    WHERE room_id = p_room_id;
    
    -- Insert participant record
    INSERT INTO daily_room_participants (room_id, user_id, session_id, device_info)
    VALUES (p_room_id, p_user_id, p_session_id, p_device_info)
    RETURNING id INTO v_participant_id;
    
    RETURN v_participant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record a leave event
CREATE OR REPLACE FUNCTION leave_daily_room(p_session_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE daily_room_participants
    SET left_at = CURRENT_TIMESTAMP
    WHERE session_id = p_session_id AND left_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-cleanup expired rooms
CREATE OR REPLACE FUNCTION cleanup_expired_daily_rooms()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Mark expired rooms as deleted
    UPDATE daily_video_rooms
    SET is_deleted = TRUE
    WHERE is_deleted = FALSE 
      AND expires_at < CURRENT_TIMESTAMP;
      
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql; 
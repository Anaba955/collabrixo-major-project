'use server';

import { createClient } from "@/utils/supabase/server";

/**
 * Create a Daily.co room - this runs on the server to keep API keys secure
 */
export async function createDailyRoom(userId: string, roomName?: string) {
  try {
    // Get API key from environment variable (set in your .env file)
    const DAILY_API_KEY = process.env.DAILY_API_KEY;
    
    // For demo purposes, we'll handle the case where you don't have an API key yet
    if (!DAILY_API_KEY) {
      console.warn('No Daily.co API key found. Using demo URL instead.');
      // Return a demo URL that will still allow testing without an API key
      const demoRoomName = roomName || `demo-${userId.substring(0, 8)}-${Date.now()}`;
      return { 
        success: true, 
        url: `https://testing-j.daily.co/${demoRoomName}`,
        demoMode: true
      };
    }
    
    // Generate room name if not provided
    const roomId = roomName || `meeting-${userId.substring(0, 8)}-${Date.now()}`;
    
    // Create room using Daily.co API
    const res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomId,
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 3600, // Room expires in 1 hour
          max_participants: 4 // Limit for free tier
        }
      })
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Failed to create Daily.co room: ${res.status} ${JSON.stringify(errorData)}`);
    }
    
    const data = await res.json();
    
    // Record room creation in database for tracking (optional)
    try {
      const supabase = await createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('daily_video_rooms').upsert({
          room_id: data.name,
          url: data.url,
          created_by: user.id,
          created_at: new Date().toISOString(),
          expires_at: new Date(data.config.exp * 1000).toISOString()
        });
      }
    } catch (dbError) {
      // Non-critical error - log but don't fail the room creation
      console.error('Failed to record Daily.co room in database:', dbError);
    }
    
    return { 
      success: true, 
      url: data.url,
      roomId: data.name,
      expiresAt: data.config.exp
    };
  } catch (error) {
    console.error('Error creating Daily.co room:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error creating meeting room'
    };
  }
} 
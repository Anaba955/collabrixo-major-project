'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Clean up stale conferences and check if a room ID already exists
 */
async function checkAndCleanupConferences(roomId: string) {
  try {
    const supabase = await createClient();
    
    // Check if this exact room ID already exists
    const { data: existingConference, error: checkError } = await supabase
      .from('video_conferences')
      .select('conference_id, created_at, is_active')
      .eq('room_id', roomId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is what we want
      console.error("Error checking for existing conference:", checkError);
      // If there was a real error (not just "not found"), throw it
      throw new Error(`Error checking for existing room: ${checkError.message}`);
    }
    
    // If this exact room ID exists and is still active, return a message
    if (existingConference && existingConference.is_active) {
      return {
        exists: true,
        message: "A conference with this room ID already exists and is active"
      };
    }
    
    // If it exists but is inactive, we'll mark it as ended to avoid the unique constraint
    if (existingConference && !existingConference.is_active) {
      // Update the ended_at timestamp to make it clear this is a completed conference
      const { error: updateError } = await supabase
        .from('video_conferences')
        .update({ 
          ended_at: new Date().toISOString(),
          is_active: false 
        })
        .eq('conference_id', existingConference.conference_id);
      
      if (updateError) {
        console.error("Error updating stale conference:", updateError);
      }
    }
    
    // Clean up any stale conferences that are more than 24 hours old and still marked as active
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { error: cleanupError } = await supabase
      .from('video_conferences')
      .update({ 
        ended_at: new Date().toISOString(),
        is_active: false 
      })
      .eq('is_active', true)
      .lt('created_at', oneDayAgo.toISOString());
    
    if (cleanupError) {
      console.error("Error cleaning up stale conferences:", cleanupError);
    }
    
    return { exists: false };
  } catch (error) {
    console.error("Error in checkAndCleanupConferences:", error);
    return { 
      exists: false, 
      error: (error as Error).message 
    };
  }
}

/**
 * Create a new video conference record
 */
export async function createVideoConference(roomId: string, title?: string, projectId?: string) {
  try {
    console.log("Server action: Creating video conference with roomId:", roomId);
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Auth error:", userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    if (!user) {
      throw new Error('Authentication required: No user found');
    }
    
    console.log("Creating conference for user:", user.id);
    
    // Check if video_conferences table exists using a direct query
    try {
      // Attempt to query the table directly to see if it exists
      const { error: tableCheckError } = await supabase
        .from('video_conferences')
        .select('conference_id')
        .limit(1);
        
      if (tableCheckError) {
        if (tableCheckError.code === '42P01') { // PostgreSQL code for undefined_table
          throw new Error('Database schema error: video_conferences table does not exist. Please run the video-conference-schema.sql file in your Supabase SQL Editor.');
        } else {
          throw new Error(`Error accessing video_conferences table: ${tableCheckError.message}`);
        }
      }
    } catch (tableErr: any) {
      console.error("Table check error:", tableErr);
      throw new Error(`Database schema error: ${tableErr.message}`);
    }
    
    // Check if this room ID already exists and clean up stale conferences
    const checkResult = await checkAndCleanupConferences(roomId);
    if (checkResult.exists) {
      throw new Error(`Room ID "${roomId}" already exists. Please try again with a different room ID.`);
    }
    
    // Create the conference record
    const { data, error } = await supabase
      .from('video_conferences')
      .insert({
        room_id: roomId,
        created_by: user.id,
        project_id: projectId || null,
        title: title || `Meeting: ${new Date().toLocaleString()}`,
        is_active: true
      })
      .select('conference_id')
      .single();
    
    if (error) {
      console.error("Insert error:", error);
      throw new Error(`Database insert error: ${error.message}`);
    }
    
    console.log("Conference created successfully with ID:", data.conference_id);
    return { success: true, conferenceId: data.conference_id };
  } catch (error: any) {
    console.error('Error creating video conference:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown server error', 
      details: error.stack
    };
  }
}

/**
 * Join a video conference
 */
export async function joinVideoConference(roomId: string) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    
    // Call the join_conference function
    const { data, error } = await supabase
      .rpc('join_conference', {
        p_room_id: roomId,
        p_user_id: user.id
      });
    
    if (error) throw error;
    
    return { success: true, participantId: data };
  } catch (error) {
    console.error('Error joining video conference:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Leave a video conference
 */
export async function leaveVideoConference(roomId: string) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    
    // Call the leave_conference function
    const { error } = await supabase
      .rpc('leave_conference', {
        p_room_id: roomId,
        p_user_id: user.id
      });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error leaving video conference:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * End a video conference (for conference creator only)
 */
export async function endVideoConference(conferenceId: string) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    
    // First check if user is the creator
    const { data: conference, error: fetchError } = await supabase
      .from('video_conferences')
      .select('created_by')
      .eq('conference_id', conferenceId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Only the creator can end the conference
    if (conference.created_by !== user.id) {
      throw new Error('Only the creator can end this conference');
    }
    
    // Call the end_conference function
    const { error } = await supabase
      .rpc('end_conference', {
        p_conference_id: conferenceId
      });
    
    if (error) throw error;
    
    revalidatePath('/protected');
    return { success: true };
  } catch (error) {
    console.error('Error ending video conference:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get active conferences
 */
export async function getActiveConferences() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    
    // Get active conferences
    const { data, error } = await supabase
      .from('vw_active_conferences')
      .select('*');
    
    if (error) throw error;
    
    return { success: true, conferences: data };
  } catch (error) {
    console.error('Error fetching active conferences:', error);
    return { success: false, error: (error as Error).message, conferences: [] };
  }
}

/**
 * Get conference history for current user
 */
export async function getUserConferenceHistory() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    
    // Get user's conference history
    const { data, error } = await supabase
      .from('vw_user_conferences')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { success: true, history: data };
  } catch (error) {
    console.error('Error fetching conference history:', error);
    return { success: false, error: (error as Error).message, history: [] };
  }
} 
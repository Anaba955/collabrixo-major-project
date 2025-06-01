"use client";
import React, { useEffect, useState, useRef } from 'react';
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clipboard, Video, VideoOff, Mic, MicOff, PhoneOff, Users, Link as LinkIcon } from "lucide-react";
import { createVideoConference, leaveVideoConference } from "@/app/actions/video-conference";

interface VideoConferenceProps {
  userId: string;
  userName?: string;
  projectId?: string;
}

export default function VideoConference({ userId, userName, projectId }: VideoConferenceProps) {
  const [roomId, setRoomId] = useState<string>("");
  const [conferenceId, setConferenceId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinLink, setJoinLink] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [participants, setParticipants] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [blurEnabled, setBlurEnabled] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const blurredStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const supabaseClient = createClient();
  
  // Function to set up local media that can be called from anywhere in the component
  const setupLocalMedia = async () => {
    if (!isActive) return;
    
    try {
      // First check if media devices are available at all
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support media devices. Please use a modern browser.");
      }
      
      // Ensure at least one of audio or video is enabled
      // If both are disabled, default to audio
      const useAudio = audioEnabled || (!audioEnabled && !videoEnabled);
      const useVideo = videoEnabled ? { width: 640, height: 480 } : false;
      
      const constraints = {
        audio: useAudio,
        video: useVideo
      };
      
      console.log("Media constraints:", constraints);
      
      // Try to enumerate devices first to check if camera/mic exist
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');
      
      if (videoEnabled && !hasCamera) {
        setError('No camera detected on your device. You can still join with audio only.');
        constraints.video = false; // Disable video if no camera found
      }
      
      if (audioEnabled && !hasMicrophone) {
        setError('No microphone detected on your device. You can still join with video only.');
        constraints.audio = false; // Disable audio if no mic found
      }
      
      // Make a final check - at least one must be enabled
      if (!constraints.audio && !constraints.video) {
        console.log("Both audio and video would be disabled. Defaulting to audio-only mode.");
        constraints.audio = true; // Default to audio if both would be disabled
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // If blur is enabled, process the stream through the blur filter
        if (blurEnabled && constraints.video) {
          applyBackgroundBlur(stream);
        } else {
          // Use the original stream directly
          updateLocalStream(stream);
        }
      } catch (mediaError: any) {
        console.error('Error accessing specific media devices:', mediaError);
        
        // Try again with reduced constraints if first attempt failed
        if ((constraints.audio && constraints.video) && 
            (mediaError.name === 'NotAllowedError' || mediaError.name === 'NotFoundError')) {
          
          try {
            // First try with audio only if video failed
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            updateLocalStream(audioOnlyStream);
            
            setError('Camera access was denied or not available. Meeting joined with audio only.');
            setVideoEnabled(false);
            
            // Set up audio-only interface
            if (videoContainerRef.current) {
              videoContainerRef.current.innerHTML = '';
              videoContainerRef.current.className = 'relative w-full bg-gray-900 rounded-md flex items-center justify-center';
              videoContainerRef.current.style.height = '300px';
              
              const audioIndicator = document.createElement('div');
              audioIndicator.className = 'text-white text-lg';
              audioIndicator.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg><p>Audio Only Mode</p>';
              videoContainerRef.current.appendChild(audioIndicator);
            }
            
            return; // Successfully got audio-only stream
          } catch (audioError) {
            console.error('Error accessing audio-only:', audioError);
            // Fall through to the general error
          }
        }
        
        // Provide specific error messages based on error types
        let errorMessage = 'Could not access camera or microphone. ';
        
        if (mediaError.name === 'NotAllowedError') {
          errorMessage += 'You denied permission. Please check your browser settings and allow access to your camera and microphone.';
        } else if (mediaError.name === 'NotFoundError') {
          errorMessage += 'No camera or microphone found. Please connect a device and try again.';
        } else if (mediaError.name === 'NotReadableError') {
          errorMessage += 'Your camera or microphone is already in use by another application.';
        } else if (mediaError.name === 'OverconstrainedError') {
          errorMessage += 'Your camera does not meet the required constraints (resolution may be too high).';
        } else {
          errorMessage += `Error: ${mediaError.message || mediaError.name}`;
        }
        
        setError(errorMessage);
        
        // Add a UI element to indicate no media
        if (videoContainerRef.current) {
          videoContainerRef.current.innerHTML = '';
          videoContainerRef.current.className = 'relative w-full bg-gray-900 rounded-md flex items-center justify-center';
          videoContainerRef.current.style.height = '300px';
          
          const errorElement = document.createElement('div');
          errorElement.className = 'text-white text-center p-4';
          errorElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"></path></svg><p class="mt-2">Media access error</p>`;
          videoContainerRef.current.appendChild(errorElement);
        }
      }
    } catch (error: any) {
      console.error('Error setting up media devices:', error);
      setError(`Media device error: ${error.message}`);
    }
  };
  
  // Function to update the local stream (used by both normal and blurred streams)
  const updateLocalStream = (stream: MediaStream) => {
    // Stop any previous stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Update our stream reference
    localStreamRef.current = stream;
    
    // Update the video element if it exists
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    
    // Create a video container if it doesn't exist
    if (videoContainerRef.current) {
      const localVideoElement = document.createElement('video');
      localVideoElement.id = 'local-video';
      localVideoElement.autoplay = true;
      localVideoElement.muted = true; // Mute local video to prevent feedback
      localVideoElement.playsInline = true;
      localVideoElement.srcObject = stream;
      localVideoElement.className = 'absolute bottom-2 right-2 w-1/4 h-auto rounded-md border-2 border-gray-800';
      
      videoContainerRef.current.innerHTML = '';
      videoContainerRef.current.className = 'relative w-full bg-gray-900 rounded-md';
      videoContainerRef.current.style.height = '300px';
      videoContainerRef.current.appendChild(localVideoElement);
    }
    
    // Update all peer connections with the new stream
    Object.values(peerConnectionsRef.current).forEach(peerConnection => {
      // Remove any existing tracks
      const senders = peerConnection.getSenders();
      senders.forEach(sender => {
        if (sender.track?.kind === 'video') {
          peerConnection.removeTrack(sender);
        }
      });
      
      // Add the new video track from the stream
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) {
          peerConnection.addTrack(videoTrack, stream);
        }
      }
    });
  };

  // Function to apply background blur effect
  const applyBackgroundBlur = async (inputStream: MediaStream) => {
    try {
      console.log('Starting background blur application...');
      
      // Create canvas element if it doesn't exist
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        console.error('Could not get canvas context');
        // Fall back to non-blurred stream
        updateLocalStream(inputStream);
        return;
      }
      
      // Create a video element to receive the input stream
      const videoElement = document.createElement('video');
      videoElement.srcObject = inputStream;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      
      // Get audio tracks for stream creation later
      const audioTracks = inputStream.getAudioTracks();
      
      // Wait for video to start playing
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play()
            .then(() => {
              console.log('Video element is now playing');
              resolve();
            })
            .catch(err => {
              console.error('Error playing video element:', err);
              // We should still resolve to continue with processing
              resolve();
            });
        };
      });
      
      console.log('Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      
      // Make sure canvas dimensions match video
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      
      // Create a new output stream from the canvas
      const outputStream = canvas.captureStream(30); // 30 FPS
      
      // Add audio tracks from the original stream
      audioTracks.forEach(track => {
        outputStream.addTrack(track);
      });
      
      // Store reference to blurred stream
      blurredStreamRef.current = outputStream;
      
      // Update the stream that's used locally and sent to peers
      updateLocalStream(outputStream);
      
      // Strong blur effect - draw video to canvas with blur filter
      const drawBlurredFrame = () => {
        if (!ctx || !videoElement || !blurEnabled) {
          console.log('Stopping blur rendering - conditions not met');
          return;
        }
        
        try {
          // Clear the canvas first
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Apply blur - using a stronger blur value (15px instead of 10px)
          ctx.filter = 'blur(15px)';
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          
          // Draw the video frame at a slightly reduced size in the center (no blur)
          // to create a more realistic "portrait mode" effect
          const scaleFactor = 0.85; // Adjust to control how much of the person remains in focus
          const scaledWidth = canvas.width * scaleFactor;
          const scaledHeight = canvas.height * scaleFactor;
          const offsetX = (canvas.width - scaledWidth) / 2;
          const offsetY = (canvas.height - scaledHeight) / 2;
          
          // Remove the blur filter before drawing the center portion
          ctx.filter = 'none';
          ctx.drawImage(
            videoElement, 
            // Source rectangle (center portion of the video)
            canvas.width * (1 - scaleFactor) / 2, 
            canvas.height * (1 - scaleFactor) / 2,
            canvas.width * scaleFactor,
            canvas.height * scaleFactor,
            // Destination rectangle
            offsetX, offsetY, 
            scaledWidth, scaledHeight
          );
          
          // Request next frame if blur is still enabled
          if (blurEnabled) {
            requestAnimationFrame(drawBlurredFrame);
          }
        } catch (renderError) {
          console.error('Error rendering blurred frame:', renderError);
          // If we encounter an error during rendering, keep trying
          if (blurEnabled) {
            requestAnimationFrame(drawBlurredFrame);
          }
        }
      };
      
      // Start the rendering loop
      console.log('Starting blur rendering loop');
      drawBlurredFrame();
      
      // Log to confirm blur was applied
      console.log('Background blur applied successfully');
      
    } catch (error) {
      console.error('Error applying background blur:', error);
      // Fall back to non-blurred stream
      updateLocalStream(inputStream);
      
      // Since we couldn't apply blur, update the state to match
      setBlurEnabled(false);
      setError('Failed to apply background blur. Using normal video instead.');
    }
  };

  // Toggle background blur effect
  const toggleBlur = async () => {
    console.log('Toggle blur clicked, current state:', blurEnabled);
    
    // Only proceed if we have an active video stream
    if (!localStreamRef.current || !localStreamRef.current.getVideoTracks().length) {
      console.log('No video tracks available, cannot apply blur');
      setError('Video must be enabled to use background blur');
      return;
    }
    
    // Store original stream reference before making changes
    const originalStream = localStreamRef.current;
    
    // Change state after validation
    const newBlurState = !blurEnabled;
    setBlurEnabled(newBlurState);
    
    try {
      console.log('Applying new blur state:', newBlurState);
      
      if (newBlurState) {
        // Apply blur to the current stream
        console.log('Attempting to apply background blur...');
        await applyBackgroundBlur(originalStream);
      } else {
        // If turning off blur, we need to get a fresh camera stream
        console.log('Getting fresh camera stream to remove blur');
        
        // Create a safety backup of current stream in case we can't get a new one
        const backupStream = originalStream;
        
        try {
          const freshStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: audioEnabled
          });
          
          // If we had audio in the previous stream, we need to maintain it
          if (audioEnabled && originalStream) {
            const audioTrack = originalStream.getAudioTracks()[0];
            if (audioTrack) {
              // Remove any existing audio tracks from the fresh stream
              freshStream.getAudioTracks().forEach(track => {
                freshStream.removeTrack(track);
              });
              // Add the existing audio track to the fresh stream
              freshStream.addTrack(audioTrack);
            }
          }
          
          updateLocalStream(freshStream);
          console.log('Successfully removed blur effect');
        } catch (error) {
          console.error('Error getting fresh camera stream:', error);
          setError('Failed to disable background blur. Using original stream as fallback.');
          
          // Revert to original stream if we can't get a fresh one
          setBlurEnabled(true); // Keep blur state true since we couldn't disable it
          updateLocalStream(backupStream);
        }
      }
    } catch (error) {
      console.error('Error in toggle blur:', error);
      setError('Failed to toggle background blur. Please try again.');
      
      // Make sure we always have a stream by falling back to the original
      updateLocalStream(originalStream);
    }
  };
  
  // Generate a room ID if not provided
  useEffect(() => {
    // Generate a more unique room ID by including timestamp and more random characters
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    
    const newRoomId = projectId 
      ? `project-${projectId.substring(0, 8)}-${timestamp}-${randomStr}`
      : `user-${userId.substring(0, 8)}-${timestamp}-${randomStr}`;
    
    setRoomId(newRoomId);
    
    // Generate a join link with the room ID
    const baseUrl = window.location.origin;
    setJoinLink(`${baseUrl}/protected/video/${newRoomId}`);
  }, [userId, projectId]);

  // Setup WebRTC connection when meeting is active
  useEffect(() => {
    if (!isActive) return;

    // Create a channel for signaling
    const roomChannel = supabaseClient.channel(`room:${roomId}`);
    
    // Listen for offers from other peers
    roomChannel
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.sender !== userId) {
          console.log('Received offer from:', payload.sender);
          const peerConnection = createPeerConnection(payload.sender);
          
          // Store the offer SDP for answer creation
          await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.offer));
          
          // Create and send answer
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          roomChannel.send({
            type: 'broadcast',
            event: 'answer',
            payload: {
              sender: userId,
              target: payload.sender,
              answer: answer
            }
          });
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.target === userId) {
          console.log('Received answer from:', payload.sender);
          const peerConnection = peerConnectionsRef.current[payload.sender];
          
          if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.answer));
          }
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        // Handle ICE candidate if it's intended for us
        if ((payload.target === userId || payload.target === 'all') && payload.sender !== userId) {
          console.log('Received ICE candidate for:', payload.sender);
          const peerConnection = peerConnectionsRef.current[payload.sender] || 
                                 createPeerConnection(payload.sender);
                                 
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        }
      })
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        if (payload.userId !== userId) {
          console.log('User joined:', payload.userId);
          setParticipants(prev => prev + 1);
          
          // Initiate connection to the new participant
          initiateConnection(payload.userId);
        }
      })
      .on('broadcast', { event: 'leave' }, ({ payload }) => {
        if (payload.userId !== userId) {
          console.log('User left:', payload.userId);
          setParticipants(prev => Math.max(1, prev - 1));
          
          // Clean up peer connection
          if (peerConnectionsRef.current[payload.userId]) {
            peerConnectionsRef.current[payload.userId].close();
            delete peerConnectionsRef.current[payload.userId];
            
            // Remove video element
            const remoteVideo = document.getElementById(`remote-video-${payload.userId}`);
            if (remoteVideo && videoContainerRef.current) {
              videoContainerRef.current.removeChild(remoteVideo);
            }
          }
        }
      })
      .subscribe();
    
    // Announce user is joining the room
    roomChannel.send({
      type: 'broadcast',
      event: 'join',
      payload: {
        userId: userId,
        userName: userName || 'Anonymous'
      }
    });
    
    // Initialize media when joining
    setupLocalMedia();
    
    // Cleanup function
    return () => {
      // Send leave message
      if (roomChannel) {
        roomChannel.send({
          type: 'broadcast',
          event: 'leave',
          payload: {
            userId: userId
          }
        });
        roomChannel.unsubscribe();
      }
      
      // Stop local media stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach(connection => {
        connection.close();
      });
      peerConnectionsRef.current = {};

      // Update database if we have a conferenceId
      if (conferenceId) {
        leaveVideoConference(roomId).catch(console.error);
      }
    };
  }, [isActive, roomId, userId, userName, audioEnabled, videoEnabled, conferenceId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      setError('Failed to copy link to clipboard');
    }
  };

  // Create a new RTCPeerConnection for a peer
  const createPeerConnection = (peerId: string) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          peerConnection.addTrack(track, localStreamRef.current);
        }
      });
    }
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to the peer
        supabaseClient.channel(`room:${roomId}`).send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            sender: userId,
            target: peerId,
            candidate: event.candidate
          }
        });
      }
    };
    
    // Handle remote track
    peerConnection.ontrack = (event) => {
      console.log('Received remote track from:', peerId);
      
      // Create a video element for the remote stream if it doesn't exist
      let remoteVideo = document.getElementById(`remote-video-${peerId}`) as HTMLVideoElement;
      
      if (!remoteVideo && videoContainerRef.current) {
        remoteVideo = document.createElement('video');
        remoteVideo.id = `remote-video-${peerId}`;
        remoteVideo.autoplay = true;
        remoteVideo.playsInline = true;
        remoteVideo.className = 'absolute top-0 left-0 w-full h-full object-cover rounded-md';
        videoContainerRef.current.insertBefore(remoteVideo, videoContainerRef.current.firstChild);
      }
      
      // Set the remote stream
      if (remoteVideo && event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
      }
    };
    
    // Store the connection
    peerConnectionsRef.current[peerId] = peerConnection;
    
    return peerConnection;
  };
  
  // Initiate connection to a peer
  const initiateConnection = async (peerId: string) => {
    console.log('Initiating connection to:', peerId);
    const peerConnection = createPeerConnection(peerId);
    
    try {
      // Create and send an offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      supabaseClient.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: 'offer',
        payload: {
          sender: userId,
          target: peerId,
          offer: offer
        }
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      setError('Failed to establish connection with peer');
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
      
      // If both audio and video would be disabled, show warning and keep audio enabled
      if (!audioEnabled && videoEnabled) {
        setError("Cannot disable both audio and video. Audio has been automatically enabled.");
        toggleAudio(); // Re-enable audio
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
      
      // If both audio and video would be disabled, show warning and keep video enabled
      if (audioEnabled && !videoEnabled) {
        setError("Cannot disable both audio and video. Video has been automatically enabled.");
        toggleVideo(); // Re-enable video
      }
    }
  };

  const startMeeting = async () => {
    // Create a record in the database first
    try {
      setError(null);
      const title = `Meeting started by ${userName || userId}`;
      console.log("Starting meeting with roomId:", roomId, "title:", title, "projectId:", projectId);
      
      const result = await createVideoConference(roomId, title, projectId);
      
      console.log("Result from createVideoConference:", result);
      
      if (!result.success) {
        // Check for duplicate key violation
        if (result.error && result.error.includes("duplicate key value")) {
          // Generate a new room ID with more randomness to avoid collision
          const timestamp = Date.now().toString(36);
          const randomStr = Math.random().toString(36).substring(2, 10);
          const newRoomId = `user-${userId.substring(0, 8)}-${timestamp}-${randomStr}`;
          
          setRoomId(newRoomId);
          setError("Room ID was already in use. A new room ID has been generated. Please try again.");
          return;
        }
        
        throw new Error(result.error || 'Failed to create video conference');
      }
      
      setConferenceId(result.conferenceId);
      setIsActive(true);
    } catch (err: any) {
      console.error('Error starting meeting:', err);
      
      // Provide more detailed error information
      const errorMessage = err.message || 'Unknown error';
      
      // Format a user-friendly error message
      let detailedError = `Failed to start meeting: ${errorMessage}.`;
      
      // Add schema setup suggestion if it seems to be a database issue
      if (errorMessage.includes("database") || errorMessage.includes("table") || errorMessage.includes("SQL")) {
        detailedError += " Please make sure the database schema is properly set up by running the video-conference-schema.sql in your Supabase SQL Editor.";
      }
      
      setError(detailedError);
    }
  };

  const endMeeting = async () => {
    try {
      setError(null);
      
      // Database cleanup will be handled by the useEffect cleanup function
      
      setIsActive(false);
      setConferenceId(null);
    } catch (err) {
      console.error('Error ending meeting:', err);
      setError('Failed to end meeting. Please try again.');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Video Conference</CardTitle>
        <CardDescription>
          Start a video call and invite team members
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            {error.includes("camera") || error.includes("microphone") ? (
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (isActive) {
                      // If already in a meeting, try to reinitialize media
                      setupLocalMedia();
                    } else {
                      // Reset error to try again
                      setError(null);
                    }
                  }}
                >
                  Try Again
                </Button>
              </div>
            ) : null}
          </div>
        )}
        
        {!isActive ? (
          <div className="flex flex-col space-y-4">
            <div className="flex flex-row justify-between items-center">
              <div className="flex-1">
                <h3 className="text-sm font-medium">Meeting Link</h3>
                <p className="text-xs text-gray-500 truncate">{joinLink}</p>
              </div>
              <Button 
                size="sm" 
                variant={copied ? "outline" : "default"} 
                onClick={copyToClipboard}
                className="ml-2"
              >
                <Clipboard className="h-4 w-4 mr-1" />
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
            <Button onClick={startMeeting} className="w-full">
              <Video className="h-4 w-4 mr-2" />
              Start Meeting
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div 
              ref={videoContainerRef} 
              className="relative w-full bg-gray-900 rounded-md"
              style={{ height: '300px' }}
            >
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="hidden" 
              />
            </div>
            
            <div className="flex justify-between">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleVideo}
                >
                  {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleAudio}
                >
                  {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button 
                  variant={blurEnabled ? "secondary" : "outline"}
                  size="icon"
                  onClick={toggleBlur}
                  disabled={!videoEnabled}
                  title={videoEnabled ? "Toggle background blur" : "Enable video to use background blur"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={endMeeting}
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center">
                <div className="flex items-center mr-4">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="text-sm">{participants}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={copyToClipboard}
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  {copied ? "Copied!" : "Invite"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
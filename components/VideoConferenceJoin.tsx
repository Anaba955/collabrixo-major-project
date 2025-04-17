"use client";
import React, { useEffect, useState, useRef } from 'react';
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Users, Link as LinkIcon } from "lucide-react";
import { useRouter } from 'next/navigation';
import { joinVideoConference, leaveVideoConference } from "@/app/actions/video-conference";

interface VideoConferenceJoinProps {
  roomId: string;
  userId: string;
  userName?: string;
}

export default function VideoConferenceJoin({ roomId, userId, userName }: VideoConferenceJoinProps) {
  const [copied, setCopied] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [participants, setParticipants] = useState(1); // Start with 1 (self)
  const [joinLink, setJoinLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [blurEnabled, setBlurEnabled] = useState(false); // State for background blur
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const blurredStreamRef = useRef<MediaStream | null>(null); // Ref for the blurred stream
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // Ref for canvas element used in blur
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const supabaseClient = createClient();
  const router = useRouter();
  
  useEffect(() => {
    // Generate a join link with the room ID
    const baseUrl = window.location.origin;
    setJoinLink(`${baseUrl}/protected/video/${roomId}`);
  }, [roomId]);

  // Setup WebRTC connection when user joins
  useEffect(() => {
    if (!isActive) return;

    // Create a channel for signaling
    const roomChannel = supabaseClient.channel(`room:${roomId}`);
    
    // Listen for offers, answers, and ICE candidates
    roomChannel
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.sender !== userId && (payload.target === userId || payload.target === 'all')) {
          console.log('Received offer from:', payload.sender);
          const peerConnection = createPeerConnection(payload.sender);
          
          // Set the remote description (the offer)
          await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.offer));
          
          // Create and send an answer
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
          
          // If we're already in the call, send an offer to the new participant
          initiateConnection(payload.userId);
        }
      })
      .on('broadcast', { event: 'leave' }, ({ payload }) => {
        if (payload.userId !== userId) {
          console.log('User left:', payload.userId);
          setParticipants(prev => Math.max(1, prev - 1));
          
          // Remove the peer connection
          if (peerConnectionsRef.current[payload.userId]) {
            peerConnectionsRef.current[payload.userId].close();
            delete peerConnectionsRef.current[payload.userId];
            
            // Remove the video element
            const remoteVideo = document.getElementById(`remote-video-${payload.userId}`);
            if (remoteVideo && videoContainerRef.current) {
              videoContainerRef.current.removeChild(remoteVideo);
            }
          }
        }
      })
      .subscribe();
      
    // Announce that we're joining the room
    roomChannel.send({
      type: 'broadcast',
      event: 'join',
      payload: {
        userId: userId,
        userName: userName || 'Anonymous'
      }
    });
    
    // Setup local media stream
    setupLocalMedia();
    
    // Cleanup function
    return () => {
      // Send leave message
      roomChannel.send({
        type: 'broadcast',
        event: 'leave',
        payload: {
          userId: userId
        }
      });
      roomChannel.unsubscribe();
      
      // Stop the local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach(connection => {
        connection.close();
      });
      peerConnectionsRef.current = {};
      
      // Update database
      if (roomId) {
        leaveVideoConference(roomId).catch(console.error);
      }
    };
  }, [isActive, roomId, userId, userName, audioEnabled, videoEnabled]);

  // Setup local media stream
  const setupLocalMedia = async () => {
    try {
      // Ensure at least one of audio or video is enabled
      // If both are disabled, default to audio
      const useAudio = audioEnabled || (!audioEnabled && !videoEnabled);
      const useVideo = videoEnabled ? { width: 640, height: 480 } : false;
      
      const constraints = {
        audio: useAudio,
        video: useVideo
      };
      
      console.log("Media constraints:", constraints);
      
      // Make a final check - at least one must be enabled
      if (!constraints.audio && !constraints.video) {
        console.log("Both audio and video would be disabled. Defaulting to audio-only mode.");
        constraints.audio = true; // Default to audio if both would be disabled
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // If blur is enabled, process the stream through the blur filter
      if (blurEnabled && constraints.video) {
        applyBackgroundBlur(stream);
      } else {
        // Use the original stream directly
        updateLocalStream(stream);
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError('Could not access camera or microphone. Please check permissions.');
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
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    
    // Create the video container
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

  // Create a RTCPeerConnection for a specific peer
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
        // Send the ICE candidate to the peer
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
    
    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      console.log('Received track from:', peerId);
      
      // Create or find the remote video element
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
  
  // Initiate a connection to a peer
  const initiateConnection = async (peerId: string) => {
    console.log('Initiating connection to:', peerId);
    const peerConnection = createPeerConnection(peerId);
    
    try {
      // Create an offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Send the offer to the peer
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

  const joinMeeting = async () => {
    try {
      setError(null);
      
      // Update database to record join
      const result = await joinVideoConference(roomId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to join video conference');
      }
      
      setParticipantId(result.participantId);
      setIsActive(true);
    } catch (err) {
      console.error('Error joining meeting:', err);
      setError('Failed to join meeting. This room may no longer be active.');
    }
  };

  const leaveMeeting = async () => {
    try {
      setError(null);
      setIsActive(false);
      
      // Database cleanup will be handled by the useEffect cleanup
      
      router.push('/protected');
    } catch (err) {
      console.error('Error leaving meeting:', err);
      setError('Failed to leave meeting properly');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Join Video Conference</CardTitle>
        <CardDescription>
          Room ID: {roomId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {!isActive ? (
          <div className="flex flex-col space-y-4">
            <Button onClick={joinMeeting} className="w-full">
              <Video className="h-4 w-4 mr-2" />
              Join Meeting
            </Button>
            <p className="text-sm text-center text-gray-500">
              You'll be asked to allow camera and microphone access
            </p>
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
                  onClick={leaveMeeting}
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
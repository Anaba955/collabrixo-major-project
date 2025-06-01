"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clipboard, Video, VideoOff, Mic, MicOff, PhoneOff, Users, Link as LinkIcon } from "lucide-react";
import Script from 'next/script';
import { createDailyRoom } from "@/app/actions/daily-video";

interface DailyVideoComponentProps {
  userId: string;
  userName?: string;
  projectId?: string;
}

export default function DailyVideoComponent({ userId, userName, projectId }: DailyVideoComponentProps) {
  const [roomUrl, setRoomUrl] = useState<string>("");
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [sdkReady, setSdkReady] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [usingFallbackScript, setUsingFallbackScript] = useState(false);
  const [usingIframeFallback, setUsingIframeFallback] = useState(false);
  const [loadingCustomScript, setLoadingCustomScript] = useState(false);
  
  const callFrameRef = useRef<any>(null);
  const callWrapperRef = useRef<HTMLDivElement>(null);
  
  // Helper function to log messages both to console and debug UI
  const debugLog = (message: string, data?: any) => {
    const logMessage = data ? `${message}: ${JSON.stringify(data)}` : message;
    console.log(logMessage);
    setDebugLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${logMessage}`]);
  };

  // Add a check at the component level to validate Daily.co availability
  useEffect(() => {
    // Check if Daily.co SDK is available after a short delay
    const checkSDKTimer = setTimeout(() => {
      if (!window.DailyIframe && sdkReady) {
        debugLog('Daily.co SDK not available despite onLoad event firing');
        setSdkReady(false);
        setError('Daily.co SDK failed to initialize properly. Please try refreshing the page.');
      }
    }, 3000);
    
    return () => clearTimeout(checkSDKTimer);
  }, [sdkReady]);

  // Use this to directly test if the SDK is available
  const isDailyAvailable = () => {
    return typeof window !== 'undefined' && window.DailyIframe !== undefined;
  };

  // Add a manual loader for the Daily.co SDK to handle edge cases
  const loadDailySDKManually = () => {
    if (isDailyAvailable() || loadingCustomScript) return;
    
    setLoadingCustomScript(true);
    debugLog('Attempting to load Daily.co SDK manually via DOM');
    
    try {
      // Create and append script manually
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.async = true;
      script.onload = () => {
        debugLog('Manual script loading succeeded');
        setSdkReady(true);
        setLoadingCustomScript(false);
      };
      script.onerror = () => {
        debugLog('Manual script loading failed');
        setLoadingCustomScript(false);
        switchToIframeFallback();
      };
      
      document.body.appendChild(script);
    } catch (err) {
      debugLog('Error during manual script loading', err);
      setLoadingCustomScript(false);
      switchToIframeFallback();
    }
  };

  // Create a room when the component mounts
  useEffect(() => {
    debugLog('Component mounted');
    
    if (!roomUrl) {
      createRoom();
    }
    
    // Try to detect the SDK manually after a short delay
    const sdkCheckTimeout = setTimeout(() => {
      if (!sdkReady && window.DailyIframe) {
        debugLog('SDK detected but not marked as ready - fixing state');
        setSdkReady(true);
      } else if (!sdkReady && !window.DailyIframe) {
        debugLog('SDK not detected after timeout - trying manual load');
        loadDailySDKManually();
      }
    }, 2000);
    
    // Display browser info for debugging
    debugLog('Browser info', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screen: `${window.screen.width}x${window.screen.height}`
    });
    
    return () => clearTimeout(sdkCheckTimeout);
  }, []);
  
  // Handle SDK script loading
  const handleDailyScriptLoad = () => {
    debugLog('Daily.co script loaded successfully');
    setSdkReady(true);
  };

  // Add error handler for script loading
  const handleDailyScriptError = () => {
    debugLog('Failed to load Daily.co script from primary CDN');
    
    if (!usingFallbackScript) {
      // If we haven't tried the fallback yet, use it now
      debugLog('Attempting to load from fallback CDN');
      setUsingFallbackScript(true);
    } else {
      // Both CDNs failed
      debugLog('Both primary and fallback CDNs failed to load Daily.co SDK');
      setError('Failed to load the Daily.co SDK. Please check your internet connection and try again.');
    }
  };
  
  // Create a Daily.co room
  const createRoom = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the server action to create a room
      const result = await createDailyRoom(userId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create meeting room');
      }
      
      console.log('Daily.co room created successfully:', result);
      
      // Validate that the URL is properly formatted
      try {
        const url = new URL(result.url);
        if (!url.hostname || !url.pathname) {
          throw new Error('Invalid room URL format');
        }
      } catch (urlError) {
        console.error('Invalid room URL:', result.url, urlError);
        throw new Error(`The generated room URL (${result.url}) is not valid. Please check your Daily.co configuration.`);
      }
      
      setRoomUrl(result.url);
      
      // Show demo mode notice if applicable
      if (result.demoMode) {
        setError(
          "Using demo mode: You're using the public Daily.co demo domain. " +
          "This works for testing but has limitations. For full functionality, " +
          "sign up for a free Daily.co account and add your API key to your environment variables."
        );
      }
    } catch (err) {
      console.error('Error creating Daily.co room:', err);
      setError(`Failed to create meeting room: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // If we're in development mode, show more helpful information
      if (process.env.NODE_ENV === 'development') {
        console.info('Development tips for Daily.co setup:', {
          step1: 'Sign up at https://daily.co/signup',
          step2: 'Get API key from the Developer dashboard',
          step3: 'Add DAILY_API_KEY to your .env.local file',
          step4: 'Restart your development server'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a method to open the meeting in a new tab as a fallback
  const openMeetingInNewTab = () => {
    if (roomUrl) {
      debugLog('Opening meeting in new tab', roomUrl);
      window.open(roomUrl, '_blank');
    }
  };

  // Add a function to switch to iframe fallback mode
  const switchToIframeFallback = () => {
    if (!roomUrl) return;
    
    debugLog('Switching to iframe fallback mode');
    
    // Clean up any existing call frame first
    if (callFrameRef.current) {
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
    
    setUsingIframeFallback(true);
    setIsActive(true);
    setError(null);
  };

  // Add a function to manually check for SDK availability
  const forceCheckSDKAvailability = () => {
    debugLog('Manually checking SDK availability');
    
    if (typeof window !== 'undefined' && window.DailyIframe) {
      debugLog('Daily.co SDK found manually, forcing ready state');
      setSdkReady(true);
      return true;
    }
    
    debugLog('Daily.co SDK not found in manual check');
    return false;
  };

  // Modify startMeeting function to perform a manual check first
  const startMeeting = () => {
    // Force check SDK availability - try to recover from false negative
    if (!sdkReady) {
      const isAvailable = forceCheckSDKAvailability();
      if (!isAvailable && roomUrl) {
        debugLog('SDK still not ready after manual check, using iframe fallback');
        switchToIframeFallback();
        return;
      }
    }
    
    if (!roomUrl) {
      setError("No meeting room available. Please try again.");
      return;
    }
    
    setError(null);
    setUsingIframeFallback(false);
    debugLog('Starting meeting with URL', roomUrl);
    
    try {
      // Make sure the Daily object is available
      if (!window.DailyIframe) {
        debugLog('Daily.co SDK not available, using iframe fallback');
        switchToIframeFallback();
        return;
      }
      
      debugLog('Creating Daily.co call frame');
      
      // Cleanup any existing call frame
      if (callFrameRef.current) {
        debugLog('Cleaning up existing call frame');
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
      
      // Ensure the container is empty and has the right styles
      const container = document.getElementById('daily-container');
      if (!container) {
        debugLog('Container not found in DOM');
        throw new Error('Video container not found in the DOM');
      }
      
      // Clear container and ensure it's visible
      container.innerHTML = '';
      container.style.display = 'block';
      container.style.height = '300px';
      container.style.minHeight = '300px';
      container.style.backgroundColor = '#f9fafb';
      
      debugLog('Creating Daily frame with factory method');
      
      // Use the factory method which is more reliable
      callFrameRef.current = window.DailyIframe.createFrame(container, {
        url: roomUrl,
        showLeaveButton: true,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '1px solid #e2e8f0',
          borderRadius: '8px'
        }
      });
      
      if (!callFrameRef.current) {
        throw new Error('Failed to create Daily.co frame');
      }
      
      // Add event listeners
      callFrameRef.current
        .on('joining-meeting', () => debugLog('Joining meeting...'))
        .on('joined-meeting', handleJoinedMeeting)
        .on('participant-joined', handleParticipantUpdate)
        .on('participant-left', handleParticipantUpdate)
        .on('left-meeting', handleLeftMeeting)
        .on('error', handleCallError);
      
      debugLog('Joining call as', userName || userId);
      
      // Note: no need to call join here since we provided the URL in createFrame
      callFrameRef.current.join({ userName: userName || userId });
      
      setIsActive(true);
    } catch (err) {
      console.error('Error starting Daily.co meeting:', err);
      
      // If there's an error, try the iframe fallback
      debugLog('Error creating Daily.co frame, using iframe fallback');
      switchToIframeFallback();
    }
  };
  
  // End the meeting
  const endMeeting = () => {
    debugLog('Ending meeting');
    if (callFrameRef.current) {
      callFrameRef.current.destroy();
      callFrameRef.current = null;
      
      // Clear the container
      if (callWrapperRef.current) {
        callWrapperRef.current.innerHTML = '';
      }
    }
    
    setIsActive(false);
    setParticipants(0);
  };
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      debugLog('Component unmounting, cleaning up');
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
      }
    };
  }, []);
  
  // Handle meeting events
  const handleJoinedMeeting = (event: any) => {
    debugLog('Joined Daily.co meeting:', event);
    updateParticipantCount();
  };
  
  const handleParticipantUpdate = () => {
    updateParticipantCount();
  };
  
  const handleLeftMeeting = (event: any) => {
    console.log('Left Daily.co meeting:', event);
    endMeeting();
  };
  
  const handleCallError = (event: any) => {
    console.error('Daily.co meeting error:', event);
    
    // Handle specific error types
    if (event.errorMsg?.includes('does not exist')) {
      setError(`Meeting room not found: The room URL ${roomUrl} is not valid. This usually happens when you're in demo mode without a Daily.co account, or your Daily.co domain is incorrect. Please sign up for a Daily.co account and add your API key to your environment variables.`);
      
      // Force recreation of the room
      createRoom();
    } else {
      setError(`Meeting error: ${event.errorMsg || 'Unknown error'}. Please try again or check your Daily.co account.`);
    }
  };
  
  const updateParticipantCount = () => {
    if (callFrameRef.current) {
      const participants = callFrameRef.current.participants();
      setParticipants(Object.keys(participants).length);
    }
  };
  
  // Copy meeting URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setError('Failed to copy link to clipboard');
    }
  };
  
  // Add the script based on which CDN we're using
  const scriptSrc = usingFallbackScript 
    ? "https://cdn.jsdelivr.net/npm/@daily-co/daily-js/dist/daily.min.js" 
    : "https://unpkg.com/@daily-co/daily-js";

  return (
    <>
      <Script 
        src={scriptSrc}
        onLoad={handleDailyScriptLoad}
        onError={handleDailyScriptError}
        strategy="afterInteractive"
      />
      
      <Card className="w-full mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Video Conference (Daily.co SDK)</CardTitle>
            <CardDescription>
              Start a video call using the Daily.co platform
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDebugMode(!debugMode)}
            className="text-xs"
          >
            {debugMode ? 'Hide Debug' : 'Debug'}
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-medium mb-1">Error:</p>
              <p className="mb-2">{error}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Refresh Page
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={createRoom}
                >
                  Try Again
                </Button>
                {roomUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={openMeetingInNewTab}
                  >
                    Open in New Tab
                  </Button>
                )}
                {!isActive && (
                  <a 
                    href="https://www.daily.co/signup" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center"
                  >
                    Sign up for Daily.co →
                  </a>
                )}
              </div>
            </div>
          )}
          
          {debugMode && (
            <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded text-xs font-mono overflow-auto max-h-40">
              <p className="font-medium mb-1">Debug Info:</p>
              <div className="flex items-center gap-2 mb-2">
                <span>SDK Ready: <span className={sdkReady ? "text-green-600" : "text-red-600"}>{sdkReady ? "Yes" : "No"}</span></span>
                <span>Room URL: <span className={roomUrl ? "text-green-600" : "text-red-600"}>{roomUrl ? "Set" : "Not Set"}</span></span>
                <span>Active: <span className={isActive ? "text-green-600" : "text-red-600"}>{isActive ? "Yes" : "No"}</span></span>
                <span>Daily Available: <span className={isDailyAvailable() ? "text-green-600" : "text-red-600"}>{isDailyAvailable() ? "Yes" : "No"}</span></span>
              </div>
              {!sdkReady && (
                <div className="flex gap-2 mb-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs py-0 h-6"
                    onClick={loadDailySDKManually}
                    disabled={loadingCustomScript}
                  >
                    {loadingCustomScript ? 'Loading...' : 'Try Manual SDK Load'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs py-0 h-6"
                    onClick={() => {
                      debugLog('Forcing SDK ready state');
                      setSdkReady(true);
                    }}
                  >
                    Force SDK Ready
                  </Button>
                </div>
              )}
              <div className="text-gray-700">
                <p>Logs:</p>
                {debugLogs.map((log, i) => (
                  <div key={i} className="text-xs">{log}</div>
                ))}
              </div>
            </div>
          )}
          
          {/* Show a special message if the SDK isn't available after 3 seconds */}
          {!isDailyAvailable() && sdkReady && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
              <p className="font-medium">Warning: SDK Accessibility Issue</p>
              <p className="mb-2 text-sm">The Daily.co SDK appears to be loaded but is not accessible. This could be due to content security policies or ad blockers.</p>
              <div className="text-xs">
                <p className="mb-1">Troubleshooting steps:</p>
                <ol className="list-decimal list-inside">
                  <li>Check if you have an ad blocker enabled that might be blocking the Daily.co script</li>
                  <li>Try using a different browser</li>
                  <li>Check your browser's console for error messages</li>
                  <li>Ensure your network allows access to https://unpkg.com and daily.co domains</li>
                </ol>
              </div>
            </div>
          )}
          
          {!isActive ? (
            <div className="flex flex-col space-y-4">
              <div className="flex flex-row justify-between items-center">
                <div className="flex-1">
                  <h3 className="text-sm font-medium">Meeting Link</h3>
                  <p className="text-xs text-gray-500 truncate">
                    {roomUrl || "Generating meeting link..."}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant={copied ? "outline" : "default"} 
                  onClick={copyToClipboard}
                  className="ml-2"
                  disabled={!roomUrl || isLoading}
                >
                  <Clipboard className="h-4 w-4 mr-1" />
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
              <Button 
                onClick={startMeeting} 
                className="w-full"
                disabled={isLoading || !roomUrl}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting Up Meeting...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    {sdkReady ? 'Start Meeting with Daily.co' : 'Start Meeting Anyway'}
                  </>
                )}
              </Button>
              {!sdkReady && isDailyAvailable() && (
                <div className="text-xs text-center text-amber-600">
                  Note: SDK not reporting as ready, but should work anyway
                </div>
              )}
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchToIframeFallback}
                  className="flex-1"
                >
                  Use Direct Iframe
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openMeetingInNewTab}
                  className="flex-1"
                >
                  Open in Browser Tab
                </Button>
              </div>
              <div className="text-xs text-center text-gray-500">
                This component uses the Daily.co SDK which provides a free tier for video conferencing
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {usingIframeFallback ? (
                // Direct iframe embedding as fallback
                <div 
                  className="relative w-full bg-gray-50 rounded-md border border-gray-200 overflow-hidden"
                  style={{ height: '300px' }}
                >
                  <iframe
                    src={roomUrl}
                    allow="camera; microphone; fullscreen; speaker; display-capture"
                    className="w-full h-full border-0"
                    style={{ borderRadius: '8px' }}
                  ></iframe>
                </div>
              ) : (
                // Regular Daily.co SDK approach
                <div 
                  id="daily-container"
                  ref={callWrapperRef} 
                  className="relative w-full bg-gray-50 rounded-md border border-gray-200"
                  style={{ 
                    height: '300px',
                    display: 'block',
                    overflow: 'hidden'
                  }}
                >
                  {/* Placeholder is rendered inside the div but gets replaced by Daily.co */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-4">
                      <svg className="animate-spin mx-auto h-6 w-6 text-gray-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm text-gray-500">Loading Daily.co meeting interface...</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={endMeeting}
                  >
                    <PhoneOff className="h-4 w-4 mr-1" />
                    End Meeting
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openMeetingInNewTab}
                  >
                    Open in Tab
                  </Button>
                  {!usingIframeFallback && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={switchToIframeFallback}
                    >
                      Try Iframe Mode
                    </Button>
                  )}
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
              
              <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                <p className="font-medium">SDK Controls:</p>
                <p>The Daily.co interface provides built-in controls for camera, microphone, screen sharing, and more.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// Add TypeScript interface for the global Daily object
declare global {
  interface Window {
    DailyIframe: any;
  }
} 
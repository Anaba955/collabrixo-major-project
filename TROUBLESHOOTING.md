# Video Conferencing Troubleshooting Guide

This document provides detailed troubleshooting steps for common issues that may arise when using the WebRTC-based video conferencing feature.

## Database Setup Issues

### "Failed to create video conference" Error

This error typically occurs when the database schema is not set up correctly.

**Solution:**
1. Verify that all required tables exist by running:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('video_conferences', 'video_participants');
   ```

2. If tables don't exist, run the `video-conference-schema.sql` script in the Supabase SQL Editor.

3. Check if the required functions exist:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN ('join_conference', 'leave_conference', 'end_conference');
   ```

4. Verify your RLS (Row Level Security) policies are correctly configured:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename IN ('video_conferences', 'video_participants');
   ```

### Database Connection Issues

**Solution:**
1. Check your Supabase URL and API key in your environment variables.
2. Verify that your Supabase project is active and not in maintenance mode.
3. Ensure your project has not exceeded usage limits or quotas.

## WebRTC Issues

### Camera or Microphone Access Denied

**Error Message:** "NotAllowedError: Permission denied" or "NotReadableError: Could not start video source"

**Solution:**
1. Check browser permissions by clicking the lock/info icon in the address bar.
2. Grant camera and microphone permissions.
3. For persistent issues, try:
   ```javascript
   // Reset permissions and try again
   navigator.mediaDevices.getUserMedia({ audio: true, video: true })
     .then(stream => {
       // Use the stream
       stream.getTracks().forEach(track => track.stop()); // Clean up
     })
     .catch(error => console.error('Permission error:', error));
   ```

### Connection Issues Between Peers

**Error Message:** "ICE connection failed" or "Failed to add ICE candidate"

**Solution:**
1. Check if STUN servers are configured correctly:
   ```javascript
   const configuration = {
     iceServers: [
       { urls: 'stun:stun.l.google.com:19302' },
       { urls: 'stun:stun1.l.google.com:19302' },
     ]
   };
   ```

2. Verify that your network allows WebRTC traffic (some corporate networks block it).

3. Add additional STUN/TURN servers for better connectivity:
   ```javascript
   const configuration = {
     iceServers: [
       { urls: 'stun:stun.l.google.com:19302' },
       { urls: 'stun:stun1.l.google.com:19302' },
       { 
         urls: 'turn:your-turn-server.com:3478',
         username: 'username',
         credential: 'password'
       }
     ]
   };
   ```

### Signaling Issues with Supabase Realtime

**Error Message:** "Failed to send offer" or "Failed to receive answer"

**Solution:**
1. Verify Supabase Realtime is enabled in your project settings.
2. Check the Supabase channel connection:
   ```javascript
   // Debug Supabase channel connection
   console.log('Channel status:', channel.state);
   
   channel.on('system', { event: '*' }, (payload) => {
     console.log('Supabase system event:', payload);
   });
   ```

3. Check browser console for any error messages related to WebSocket connections.

## Video/Audio Quality Issues

### Poor Video Quality

**Solution:**
1. Try specifying constraints for better quality:
   ```javascript
   const constraints = {
     video: {
       width: { ideal: 1280 },
       height: { ideal: 720 },
       frameRate: { ideal: 30 }
     },
     audio: true
   };
   
   navigator.mediaDevices.getUserMedia(constraints)
     .then(stream => {
       // Use the high-quality stream
     });
   ```

### Audio Echo or Feedback

**Solution:**
1. Use headphones to prevent speaker output from being picked up by the microphone.
2. Enable echo cancellation in the audio constraints:
   ```javascript
   const constraints = {
     audio: {
       echoCancellation: true,
       noiseSuppression: true,
       autoGainControl: true
     },
     video: true
   };
   ```

## Browser Compatibility Issues

**Solution:**
1. Verify you're using a supported browser:
   - Chrome 55+
   - Firefox 44+
   - Safari 11+
   - Edge 79+ (Chromium-based)

2. Add browser detection and show a warning for unsupported browsers:
   ```javascript
   function checkBrowserCompatibility() {
     const isWebRTCSupported = 
       navigator.mediaDevices && 
       navigator.mediaDevices.getUserMedia && 
       window.RTCPeerConnection;
       
     if (!isWebRTCSupported) {
       alert('Your browser does not support WebRTC. Please use Chrome, Firefox, Safari, or Edge.');
       return false;
     }
     return true;
   }
   ```

## Browser Camera and Microphone Permissions

When you see the error "Could not access camera or microphone", it usually means your browser is blocking access to these devices. Here's how to fix it in different browsers:

### Chrome

1. Click the lock/info icon in the address bar (left of the URL)
2. Click on "Site settings"
3. Look for "Camera" and "Microphone" and make sure they are set to "Allow"
4. If they're set to "Block", change them to "Allow"
5. Refresh the page and try again

### Firefox

1. Click the lock/info icon in the address bar
2. Expand the permissions section
3. Find "Use the Camera" and "Use the Microphone" 
4. Remove any blocks or click "Allow" for each
5. Refresh the page and try again

### Safari

1. Click Safari in the menu bar (top of screen)
2. Select "Settings..." or "Preferences..."
3. Go to the "Websites" tab
4. Select "Camera" and "Microphone" from the left sidebar
5. Find your website in the list and set permissions to "Allow"
6. Refresh the page and try again

### Edge

1. Click the lock/info icon in the address bar
2. Click "Site permissions"
3. Make sure "Camera" and "Microphone" are set to "Allow"
4. Refresh the page and try again

### Private Browsing/Incognito Mode

If you're using a private or incognito window, you may need to grant permissions each time you visit the site. Some browsers restrict media access in private browsing by default.

### Audio-Only Mode

If your camera is not working but your microphone is, the application will automatically try to join in audio-only mode. This can happen if:

1. Your camera is being used by another application
2. Your camera is disconnected or disabled
3. You denied camera access but allowed microphone access

### Common Hardware Issues

If permissions are correctly set but you still can't access your devices:

1. **Camera/Microphone in use**: Close other applications that might be using your camera or microphone (Zoom, Teams, other video conferencing apps, etc.)

2. **Hardware disabled**: Some laptops have physical switches or function keys to disable the camera/microphone. Check if these are enabled.

3. **Device selection**: If you have multiple cameras or microphones, your browser might be trying to use the wrong one. You can add this code to specify a particular device:

   ```javascript
   // Get the list of devices
   const devices = await navigator.mediaDevices.enumerateDevices();
   
   // Print them to console to see what's available
   console.log(devices);
   
   // Then specify the exact device ID you want to use
   const constraints = {
     audio: {deviceId: {exact: 'your-audio-device-id'}},
     video: {deviceId: {exact: 'your-video-device-id'}}
   };
   ```

4. **System permissions**: Some operating systems have their own permissions settings:
   - Windows: Go to Settings > Privacy > Camera/Microphone
   - macOS: Go to System Preferences > Security & Privacy > Privacy > Camera/Microphone
   - Linux: This varies by distribution, but check system settings

## Advanced Debugging

### WebRTC Connection Debugging

Add these event listeners to diagnose connection issues:

```javascript
peerConnection.addEventListener('icecandidateerror', (event) => {
  console.error('ICE Candidate Error:', event);
});

peerConnection.addEventListener('connectionstatechange', () => {
  console.log('Connection state:', peerConnection.connectionState);
});

peerConnection.addEventListener('iceconnectionstatechange', () => {
  console.log('ICE connection state:', peerConnection.iceConnectionState);
});

peerConnection.addEventListener('icegatheringstatechange', () => {
  console.log('ICE gathering state:', peerConnection.iceGatheringState);
});

peerConnection.addEventListener('signalingstatechange', () => {
  console.log('Signaling state:', peerConnection.signalingState);
});
```

### Network Analysis

For detailed network analysis:

1. Open Chrome DevTools > Network tab
2. Filter for "WebSocket" to see Supabase Realtime connections
3. Use "webrtc-internals" in Chrome:
   - Navigate to chrome://webrtc-internals/ in Chrome
   - This provides detailed statistics about all WebRTC connections

## Common Specific Errors

### DOMException: Could not start video source

This often occurs when:
- Camera is being used by another application
- Camera hardware has failed
- Multiple getUserMedia calls with different constraints

**Solution:**
```javascript
// Release all tracks before requesting again
function releaseMediaDevices() {
  const videoElement = document.querySelector('video');
  if (videoElement && videoElement.srcObject) {
    const tracks = videoElement.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    videoElement.srcObject = null;
  }
}
```

### Peer Connection Failed: ICE Failed

This typically happens when peers cannot establish a direct connection due to NAT/firewall issues.

**Solution:**
1. Implement a TURN server as fallback:
   ```javascript
   const configuration = {
     iceServers: [
       { urls: 'stun:stun.l.google.com:19302' },
       {
         urls: 'turn:turnserver.example.org',
         username: 'username',
         credential: 'password'
       }
     ],
     iceTransportPolicy: 'all', // Try 'relay' if direct connection fails
   };
   ```

2. Consider a service like Twilio's Network Traversal Service if building a production application.

## Logs to Collect When Reporting Issues

If you need to report an issue to the development team, please provide:

1. Browser console logs (press F12 to open developer tools)
2. Network logs from the Network tab in developer tools
3. WebRTC-internals data (from Chrome)
4. Database logs from Supabase Dashboard
5. Information about your network environment (corporate network, VPN, etc.)
6. Steps to reproduce the issue

## Performance Optimization

If your video conferences are consuming too many resources:

1. Limit video resolution for large meetings:
   ```javascript
   // Adjust resolution based on participant count
   function adjustVideoQuality(participantCount) {
     const constraints = {
       video: {
         width: participantCount > 4 ? { ideal: 640 } : { ideal: 1280 },
         height: participantCount > 4 ? { ideal: 480 } : { ideal: 720 },
         frameRate: participantCount > 6 ? { max: 15 } : { ideal: 30 }
       }
     };
     
     return navigator.mediaDevices.getUserMedia(constraints);
   }
   ```

2. Consider implementing bandwidth estimation and adapting quality accordingly.

## Security Considerations

If you're having issues related to security:

1. Ensure all your WebRTC traffic is encrypted (which happens by default).
2. Make sure your signaling channel (Supabase Realtime) uses secure WebSockets (wss://).
3. Implement proper authentication for joining conferences.
4. Consider implementing end-to-end encryption for highly sensitive communications. 
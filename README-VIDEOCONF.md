# Video Conferencing Feature - Setup Guide

This guide will help you set up and use the WebRTC-based video conferencing feature in your application.

## Database Setup

Before using the video conferencing feature, you need to set up the required database tables and functions:

1. **Log in to your Supabase Dashboard**
   - Go to https://app.supabase.com/ and log in to your account
   - Select your project

2. **Access the SQL Editor**
   - From the left navigation menu, click on "SQL Editor"
   - Click "New query" to create a new SQL query

3. **Run the Schema SQL**
   - Copy the entire contents of the `video-conference-schema.sql` file into the SQL Editor
   - Click "Run" to execute the query, which will create all necessary tables and functions
   - Verify that no errors are displayed in the results panel

4. **Create Sample Data (Optional)**
   - To test the functionality, you can also run the `video-conference-sample-data.sql` script
   - This will create a test video conference room for your user
   - Note the room ID that is displayed in the results, which you can use to test joining the room

5. **Clean Up Existing Data (if needed)**
   - If you encounter "duplicate key" errors or other data issues:
   - Run the `video-conference-cleanup.sql` script to fix stale or problematic data
   - This script will clean up:
     - Stale conferences (active but more than 24 hours old)
     - Orphaned participant records
     - Participants still marked as present in inactive conferences

## Troubleshooting Database Issues

If you encounter errors when starting a meeting:

1. **"Duplicate key value violates unique constraint" Error**
   - This means you're trying to create a conference with a room ID that already exists
   - Try again - the application will automatically generate a new unique room ID
   - Or run the cleanup script (`video-conference-cleanup.sql`) to mark old rooms as inactive

2. **Check Table Existence**
   - Run the following SQL in the Supabase SQL Editor to verify the tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('video_conferences', 'video_participants');
   ```
   - You should see both table names in the results

3. **Verify RPC Functions**
   - Run the following SQL to verify the functions exist:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN ('join_conference', 'leave_conference', 'end_conference');
   ```
   - You should see all three function names in the results

## Using the Video Conferencing Feature

### Starting a Meeting

1. Navigate to the protected page
2. In the Video Conference section, click "Start Meeting"
3. Your camera and microphone will be requested - allow access
4. The meeting will start and you'll see your video
5. Copy the link to share with others

### Joining a Meeting

1. Click on a meeting link you've received
2. On the Join Meeting page, click "Join Meeting"
3. Your camera and microphone will be requested - allow access
4. You'll be connected to the meeting and see other participants

### Controls During a Meeting

- **Toggle Video**: Turn your camera on/off
- **Toggle Audio**: Mute/unmute your microphone
- **Background Blur**: Toggle the background blur effect for privacy
- **End/Leave Meeting**: Close the connection and exit the meeting
- **Invite**: Copy the meeting link to share with others
- **Participants**: Shows how many people are currently in the meeting

### Background Blur Feature

The background blur feature helps provide privacy by blurring your surroundings while keeping you in focus:

1. To activate background blur, click the blur icon in the controls bar (circle with dot in center)
2. The blur effect will be applied in real-time to your video feed
3. All other participants will see your video with the background blurred
4. You can toggle the effect on/off at any time during the meeting
5. The effect uses a portrait-mode style where your face and upper body remain in focus while the background is blurred

#### Troubleshooting Background Blur

If the background blur is not working:

1. **Check Browser Support**: 
   - Make sure you're using a modern browser (Chrome 76+, Firefox 79+, Safari 14.1+, or Edge 79+)
   - The blur effect uses Canvas API and requires good browser support

2. **Check Console Logs**:
   - Open your browser developer tools (F12 or right-click → Inspect)
   - Look for any error messages related to canvas, rendering, or blur
   - You should see log messages like "Background blur applied successfully" when toggling

3. **If Camera Turns Off When Activating Blur**:
   - This issue has been fixed in the latest version
   - If you still experience this problem, try refreshing the page
   - Make sure your camera is working properly outside of the application
   - Some older devices or browser versions might have compatibility issues with the canvas-based blur

4. **Performance Issues**:
   - Background blur is CPU-intensive and may not work well on older devices
   - Try reducing the video resolution if your device struggles:
   ```javascript
   // Reduced resolution
   const constraints = {
     video: { width: 320, height: 240 },
     audio: true
   };
   ```

5. **Visual Verification**:
   - When blur is activated, the control button should change to a highlighted state
   - You should see a distinct difference in your video with the center portion remaining clear
   - If you can't see any difference, try adjusting lighting and ensuring your camera is working properly

6. **Try a Hard Refresh**:
   - Sometimes clearing the browser cache resolves rendering issues
   - Press Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac) to perform a hard refresh

7. **Camera Permission Issues**:
   - If your camera feed disappears when toggling blur, check that you've granted persistent camera permissions
   - Some browsers may require you to reauthorize camera access when the video stream is restarted

8. **Fallback Option**:
   - If blur doesn't work on your device, you can use background images or a physical privacy screen

## Security Considerations

- This implementation uses WebRTC with STUN servers for NAT traversal
- All communication between peers is direct and encrypted
- Signaling is handled through Supabase Realtime channels
- All meeting activities are logged in the database
- Background blur enhances privacy by hiding your surroundings

## Technical Debugging

### Common Issues:

1. **"Failed to create video conference"** - Make sure the database schema is set up correctly by running the `video-conference-schema.sql` file.

2. **"Room ID was already in use"** - The system detected a duplicate room ID and generated a new one. Try starting the meeting again with the new ID.

3. **Camera or microphone access denied** - You need to grant permissions in your browser settings.

4. **Connection issues between peers** - This could be due to firewall restrictions or NAT traversal problems.

5. **Background blur performance issues** - If your device struggles with the blur effect, try disabling it to improve performance.

### Checking Browser Console:

For additional debugging information, open your browser's developer console to check for:
- WebRTC connection errors
- Permission issues with media devices
- Database interaction errors
- Canvas/rendering errors related to background blur

## Database Maintenance

To keep your video conferencing system running smoothly:

1. Run the cleanup script periodically (`video-conference-cleanup.sql`)
2. Monitor the size of your video conference tables in Supabase
3. Consider implementing a scheduled function to automatically clean up old data

## Need More Help?

If you continue to experience issues, check:
1. Your Supabase project's permissions and RLS policies
2. Your browser's permissions for camera and microphone
3. Network restrictions that might block WebRTC connections
4. Your device's CPU performance if background blur is causing lag 
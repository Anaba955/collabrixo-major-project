# Daily.co Video Conferencing Integration

This guide explains how to set up and use the Daily.co video conferencing component in your application.

## Overview

The Daily.co integration provides an alternative video conferencing option using a third-party SDK instead of the custom WebRTC implementation. Daily.co offers:

- A generous free tier with up to 4 participants
- Pre-built UI components and controls
- Easy setup without complex WebRTC code
- Screen sharing, chat, and recording capabilities
- Cross-platform compatibility

## Setup Instructions

### 1. Sign Up for Daily.co

1. Create a free account at [daily.co](https://www.daily.co/signup)
2. Navigate to the Developer section and get your API key

### 2. Add API Key to Environment Variables

Add your Daily.co API key to your `.env.local` file:

```
DAILY_API_KEY=your_daily_api_key_here
```

### 3. Run Database Migration

Execute the `daily-video-schema.sql` script in your Supabase SQL Editor to create the necessary tables for tracking Daily.co rooms:

```sql
-- Run the SQL script provided in daily-video-schema.sql
```

### 4. Deploy Your Application

After adding the API key and running the database migration, deploy your application or restart your development server to apply the changes.

## Features

The Daily.co integration includes:

- **Room Creation**: Automatic generation of meeting rooms with secure API key handling
- **Participant Management**: Support for up to 4 participants in the free tier
- **UI Controls**: Pre-built interface for camera, microphone, screen sharing, and chat
- **Session Tracking**: Optional database tracking of room usage and participants
- **Customizable Theme**: The interface can be themed to match your application

## Component Usage

The `DailyVideoComponent` is used in your application like this:

```tsx
import DailyVideoComponent from "@/components/DailyVideoComponent";

// Inside your component or page
<DailyVideoComponent userId={user.id} userName={user.email} />
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| userId | string | Required - User ID for creating the room |
| userName | string | Optional - User name displayed in the meeting |
| projectId | string | Optional - Can be used to associate rooms with projects |

## Comparison with WebRTC Implementation

| Feature | Daily.co | Custom WebRTC |
|---------|----------|--------------|
| Setup Complexity | Simple - SDK based | Complex - Custom code |
| Customization | Limited - Pre-built UI | Full control |
| Participant Limit | 4 (free tier) | Unlimited |
| Features | Chat, screen sharing, recordings | Basic video/audio |
| Backend Requirements | API key only | Custom signaling |
| Browser Support | Excellent | Good but needs polyfills |
| Cost | Free up to 4 participants | Free but hosting costs |

## Working in Demo Mode

If you don't have a Daily.co API key set up, the component will work in "demo mode" with some limitations:

- You'll see a notice that you're using demo mode
- Room URLs will be created with a placeholder domain
- You'll need to replace `your-domain.daily.co` with your actual Daily.co domain

## Troubleshooting

### Room Creation Fails

- Verify your API key is correctly set in environment variables
- Check your Daily.co account limits and usage
- Ensure your server can make outbound API calls to Daily.co

### Cannot Join Meetings

- Ensure your browser allows camera and microphone access
- Check for browser console errors related to the Daily.co SDK
- Verify the room hasn't expired (rooms expire after 1 hour by default)

### Interface Not Showing

- Make sure the Daily.co script is loading correctly
- Check for JavaScript errors in the browser console
- Verify you're on a supported browser (Chrome, Firefox, Safari, Edge)

## Advanced Usage

### Custom Room Expiration

You can modify the room expiration time in the `createDailyRoom` function:

```typescript
// In app/actions/daily-video.ts
exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours instead of 1
```

### Recording Meetings

Daily.co supports cloud recording with paid plans. To enable recording:

```typescript
// In app/actions/daily-video.ts
properties: {
  // ... other properties
  enable_recording: 'cloud',
}
```

## Need More Help?

For additional support:
- Review the [Daily.co documentation](https://docs.daily.co)
- Check the Daily.co API docs at https://docs.daily.co/reference
- Contact your application administrator 
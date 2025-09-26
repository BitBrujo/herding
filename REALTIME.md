# Real-time Subscriptions System

This document describes the comprehensive real-time system implemented for the Herding meeting scheduler.

## Overview

The real-time system provides instant updates when participants respond to meeting time slots, creating a collaborative experience where all participants can see changes happen live.

## Architecture

### Core Components

1. **`useRealtime.ts`** - Generic Supabase real-time subscription manager
2. **`useMeetingRealtime.ts`** - Meeting-specific real-time subscriptions
3. **`RealtimeStatus.tsx`** - Reusable connection status component
4. **`AvailabilityResponder.tsx`** - Updated with real-time integration

### Key Features

- **Instant Updates**: Live updates when other participants respond
- **Optimistic UI**: Immediate feedback with rollback on errors
- **Connection Management**: Automatic reconnection and error handling
- **Visual Indicators**: Real-time activity highlights and connection status
- **Performance**: Efficient subscriptions with proper cleanup

## Usage

### Basic Real-time Hook

```typescript
import { useMeetingRealtime } from '@/lib/useMeetingRealtime';

const { data, realtimeState, refreshData } = useMeetingRealtime({
  eventId: 'meeting-id',
  participantId: 'participant-id',
  onParticipantResponse: (participantId, slotId, response) => {
    console.log('New response from:', participantId);
  },
  onScoreUpdate: (slotId, newScore) => {
    console.log('Score updated:', newScore);
  }
});
```

### Connection Status Component

```tsx
import { RealtimeStatus } from '@/components/RealtimeStatus';

<RealtimeStatus
  state={realtimeState}
  showText={true}
  className="text-sm"
/>
```

## Real-time Data Flow

1. **Participant Response**: User responds to time slot
2. **Optimistic Update**: UI updates immediately
3. **API Call**: Request sent to backend
4. **Database Change**: Supabase updates availability table
5. **Real-time Event**: Change broadcast to all subscribers
6. **Score Recalculation**: Backend updates meeting slot scores
7. **Live Updates**: All connected clients receive updates instantly

## Monitored Tables

The system subscribes to changes in:

- **`availability`** - Participant responses to time slots
- **`meeting_slots`** - Time slot proposals and scores
- **`participants`** - Participant additions/updates
- **`events`** - Meeting configuration changes

## Error Handling

### Connection Recovery
- Automatic reconnection with exponential backoff
- Maximum 5 reconnection attempts
- Visual indicators for connection states

### Optimistic Updates
- Immediate UI feedback
- Rollback on API errors
- Error messages with retry options

## Performance Optimizations

### Efficient Subscriptions
- Single channel per meeting
- Filtered by event ID to reduce noise
- Automatic cleanup on component unmount

### Smart Updates
- Debounced real-time highlights (3-second duration)
- Minimal re-renders with React.memo patterns
- Selective data loading based on connection state

## Visual Indicators

### Connection Status
- 🟢 **Live**: Connected and receiving updates
- 🟡 **Connecting**: Attempting to connect
- 🔴 **Offline**: No connection
- ⚠️ **Error**: Connection failed with error message

### Activity Indicators
- Blue pulse animation for recent responses
- Participant count badges (e.g., "3/5 responded")
- Score highlighting when updated by others
- Ring animation around recently updated time slots

## Integration Examples

### Basic Component Integration

```tsx
export function MeetingComponent({ eventId, participantId }) {
  const { data, realtimeState } = useMeetingRealtime({
    eventId,
    participantId,
    onParticipantResponse: useCallback((pid, sid) => {
      // Handle new responses
      showNotification(`${participantName} responded`);
    }, []),
  });

  return (
    <div>
      <RealtimeStatus state={realtimeState} />
      {data.timeSlots.map(slot => (
        <TimeSlotCard key={slot.id} slot={slot} />
      ))}
    </div>
  );
}
```

### Custom Event Handlers

```tsx
const config = {
  eventId: meeting.id,
  participantId: currentUser.id,

  // Called when someone else responds
  onParticipantResponse: (participantId, slotId, response) => {
    if (participantId !== currentUser.id) {
      toast.success(`${getParticipantName(participantId)} responded`);
    }
  },

  // Called when scores are recalculated
  onScoreUpdate: (slotId, newScore) => {
    updateLocalScore(slotId, newScore);
  },

  // Called when new participants join
  onParticipantJoin: (participant) => {
    toast.info(`${participant.name} joined the meeting`);
  }
};
```

## Best Practices

### Component Design
- Use `useMeetingRealtime` for meeting-specific data
- Include `RealtimeStatus` for connection feedback
- Implement optimistic updates for better UX
- Handle loading and error states gracefully

### Performance
- Limit real-time subscriptions to visible components
- Use React.memo for expensive components
- Cleanup subscriptions on unmount
- Debounce rapid updates to prevent UI thrashing

### Error Handling
- Always show connection status to users
- Provide manual refresh options
- Gracefully degrade when real-time fails
- Log errors for debugging but don't expose technical details

## Debugging

### Console Logs
The system logs connection events to the console:
- "Connected to real-time updates for meeting {id}"
- "Disconnected from real-time updates for meeting {id}"
- "Real-time error for meeting {id}: {error}"

### Connection State Monitoring
Monitor the `realtimeState` object for debugging:

```typescript
useEffect(() => {
  console.log('Real-time state:', realtimeState);
}, [realtimeState]);
```

### Testing Real-time Features
1. Open the same meeting in multiple browser tabs/windows
2. Respond to time slots in one tab
3. Verify updates appear instantly in other tabs
4. Test connection recovery by disabling/enabling network

## Future Enhancements

### Planned Features
- Participant presence indicators (who's currently viewing)
- Typing indicators for notes
- Real-time chat/comments
- Push notifications for important updates
- Conflict resolution for simultaneous edits

### Performance Improvements
- Redis caching for high-traffic meetings
- WebSocket connection pooling
- Progressive loading for large meetings
- Offline-first architecture with sync

## Troubleshooting

### Common Issues

**No real-time updates**
- Check Supabase connection and environment variables
- Verify RLS policies allow real-time subscriptions
- Check browser console for connection errors

**Slow updates**
- Monitor network connection quality
- Check for rate limiting on Supabase
- Verify efficient query patterns

**Memory leaks**
- Ensure components properly unmount
- Check for orphaned event listeners
- Monitor subscription cleanup

**Connection instability**
- Check for network proxy issues
- Verify WebSocket support in environment
- Monitor reconnection attempts and delays
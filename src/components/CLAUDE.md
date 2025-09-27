# Components Layer - CLAUDE.md

This file provides guidance for working with React components in the HerdingKatz application.

## Component Architecture

The `src/components/` directory is organized into logical groups:

### Core UI Components (`/ui/`)
- `Button.tsx` - Base button component with variants
- `Card.tsx` - Container component for content sections
- Based on shadcn/ui design system (New York style, gray base color)

### Layout Components (`/layout/`)
- `AppShell.tsx` - Main application wrapper with navigation
- `Navigation.tsx` - App navigation and routing logic

### Feature Components (Root Level)

#### Core Scheduling Components
- `AvailabilityGrid.tsx` - Interactive drag-select grid with pink heat map
- `AvailabilityResponder.tsx` - Participant availability input interface
- `ParticipantNameEntry.tsx` - Name-only signup with "Herd Details" display
- `MeetingCreator.tsx` - Herd creation form with collapsible "Herd Options (for picky Katz)"
- `TimeSlotProposer.tsx` - Time slot suggestion and proposal system

#### AI & Chat Components
- `LLMChatWindow.tsx` - Natural language scheduling assistant
- `LLMPromptBox.tsx` - LLM prompt input component
- `AIRobotButton.tsx` - AI assistance toggle button
- `AIRobotChat.tsx` - AI chat interface component

#### Real-time Components
- `RealtimeStatus.tsx` - Connection status indicator

### Authentication Components (`/auth/`)
- `AuthProvider.tsx` - Supabase auth context provider
- `OptionalLoginPrompt.tsx` - Non-intrusive login suggestion
- `QuickSignup.tsx` - Streamlined signup process
- `UserMenu.tsx` - User account management dropdown

### Icon Components (`/icons/`)
- `ParticipantIcon.tsx` - Animated cat icons with wagging tail tip

## Development Guidelines

### Component Patterns

#### Functional Components with TypeScript
```typescript
interface ComponentProps {
  // Required props
  herdId: string;
  participantId: string;
  // Optional props
  className?: string;
  maxParticipants?: number;
  onUpdate?: (data: UpdateData) => void;
}

export function ComponentName({
  herdId,
  participantId,
  className,
  maxParticipants,
  onUpdate
}: ComponentProps) {
  // Component implementation
}
```

#### Real-time Component Pattern
```typescript
export function RealtimeComponent({ herdId }: { herdId: string }) {
  const [data, setData] = useState<DataType[]>([]);
  const { isConnected } = useRealtime();

  useEffect(() => {
    const subscription = supabase
      .channel(`herd_${herdId}`)
      .on('postgres_changes', { /* config */ }, (payload) => {
        // Handle real-time updates
        setData(prev => updateData(prev, payload));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [herdId]);

  return (
    // Component JSX
  );
}
```

### Key Component Guidelines

#### AvailabilityGrid.tsx
- **Purpose**: Interactive time selection with pink gradient heat map
- **Features**: Drag-and-select, real-time updates, color-coded availability
- **Props**: `event`, `currentParticipant`, `participants`, `onAvailabilityChange`
- **State**: Handles selection state, hover effects, optimistic updates
- **Real-time**: Subscribes to availability changes across all participants
- **Visual**: Pink gradient system (light → dark based on availability percentage)

#### LLMChatWindow.tsx
- **Purpose**: Natural language interface for scheduling constraints with real-time grid updates
- **Features**: Chat interface, quick prompts, AI processing, automatic grid marking, cat-themed RoboKatz
- **Props**: `participantName`, `participantId`, `eventId`, `eventContext`, `isOpen`, `onClose`, `onAvailabilityUpdate`
- **Integration**: Connects to `/api/llm/chat` with full event context for accurate parsing
- **Real-time Updates**: Automatically marks grid cells when parsing natural language (e.g., "I can't do mornings")
- **Parsing Engine**: Uses `availability-parser.ts` for high-accuracy natural language processing
- **Context Aware**: Receives full event details (dates, times, participants) for intelligent suggestions
- **UX**: Overlay design, mobile-responsive, accessibility support, confidence scores displayed
- **Performance**: Handles complex availability updates (48-96 time slots) with optimistic UI updates

#### AIRobotChat.tsx & AIRobotButton.tsx
- **Purpose**: AI assistance components for herd creation and scheduling
- **Features**: Expandable chat interface, AI-powered suggestions, context-aware help
- **Integration**: Works with LLM endpoints for natural language processing
- **UX**: Smooth transitions, persistent chat state, cat-themed branding

#### ParticipantNameEntry.tsx
- **Purpose**: Friction-free participant registration with herd information
- **Features**: Name-only signup, "Herd Details" display, participant count limits
- **Props**: `eventTitle`, `onNameSubmit`, `maxParticipants`, `participantCount`
- **Flow**: Name input → create participant → redirect to grid
- **Validation**: Basic name validation, participant limit checking
- **Display**: Shows formatted time ranges and current/max participant counts

#### MeetingCreator.tsx
- **Purpose**: Streamlined herd creation with progressive disclosure
- **Features**: Collapsible "Herd Options (for picky Katz)", instant share link generation
- **Fields**: Essential (name + timezone), Advanced (date, time range, max participants)
- **Props**: `onMeetingCreated`, `onCancel`
- **UX**: Progressive disclosure, clear validation messages, cat-themed language

#### ParticipantIcon.tsx
- **Purpose**: Animated cat representation with playful branding
- **Features**: Wagging tail tip animation, scalable SVG, customizable colors
- **Props**: `className`, `width`, `height`
- **Animation**: CSS keyframes for tail tip wagging (1.5s cycle)
- **Usage**: Used throughout interface for cat-themed branding

### State Management Patterns

#### Local State
- Use `useState` for component-specific state
- Use `useReducer` for complex state logic
- Implement optimistic updates for better UX

#### Real-time State
- Subscribe to Supabase real-time channels
- Handle connection state changes gracefully
- Clean up subscriptions on unmount

#### Global State
- Use React Context for auth state
- Keep global state minimal
- Prefer prop drilling for component communication

### Styling Guidelines

#### Tailwind CSS
- Use utility classes for styling
- Implement responsive design with breakpoint prefixes
- Use CSS variables for theme consistency

#### Component Variants
```typescript
// Button variants example
const buttonVariants = {
  default: "bg-gray-900 text-white hover:bg-gray-800",
  secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
  ghost: "hover:bg-gray-100 text-gray-900"
};
```

#### Dark Mode Support
- Use CSS variables for color themes
- Test components in both light and dark modes
- Ensure sufficient color contrast

### Accessibility Guidelines

#### Keyboard Navigation
- Implement proper tab order
- Support arrow key navigation for grids
- Provide keyboard shortcuts for common actions

#### Screen Readers
- Use semantic HTML elements
- Provide aria-labels for interactive elements
- Announce dynamic content changes

#### Visual Accessibility
- Maintain color contrast ratios
- Don't rely solely on color for information
- Provide alternative text for visual elements

### Testing Considerations

#### Unit Testing
- Test component rendering with different props
- Test user interactions (clicks, inputs, selections, drag-and-select)
- Mock real-time subscriptions and API calls
- Test animated cat icon behavior
- Test collapsible section functionality

#### Integration Testing
- Test component communication and data flow
- Verify real-time updates across components
- Test responsive behavior at different screen sizes
- Test participant limit enforcement across components
- Verify pink heat map color calculations and updates

#### Accessibility Testing
- Test keyboard navigation including grid navigation
- Verify screen reader compatibility with cat-themed content
- Check color contrast for pink gradient system
- Test animations don't interfere with accessibility

### Performance Guidelines

#### Optimization
- Use React.memo for expensive re-renders
- Implement proper dependency arrays in useEffect
- Debounce user inputs for API calls

#### Real-time Performance
- Limit subscription scope to necessary data
- Implement efficient update patterns
- Handle high-frequency updates gracefully

#### Bundle Size
- Import only necessary dependencies
- Use dynamic imports for large components
- Optimize image and asset loading

## Common Patterns

### Error Boundaries
```typescript
export function ComponentWithErrorBoundary() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <ActualComponent />
    </ErrorBoundary>
  );
}
```

### Loading States
```typescript
export function ComponentWithLoading() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return <ActualContent />;
}
```

### Conditional Rendering
```typescript
export function ConditionalComponent({ user, isAuthenticated }: Props) {
  return (
    <>
      {isAuthenticated ? (
        <AuthenticatedView user={user} />
      ) : (
        <GuestView />
      )}
    </>
  );
}
```
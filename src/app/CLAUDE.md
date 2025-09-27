# App Layer - CLAUDE.md

This file provides guidance for working with the Next.js 15 App Router structure in HerdingKatz.

## App Router Structure

The `src/app/` directory contains the Next.js 15 App Router implementation with the following key areas:

### Core Pages
- `page.tsx` - Landing page with "Create Herd", "Join Herd", and "Login (optional)" buttons
- `layout.tsx` - Root layout with global providers and styles
- `globals.css` - Global Tailwind CSS styles and custom properties

### Feature Pages
- `create/page.tsx` - Herd creation form with collapsible "Herd Options (for picky Katz)"
- `event/[token]/page.tsx` - Main scheduling interface with grid, chat, and herd details
- `dashboard/page.tsx` - User dashboard for managing herds
- `auth/callback/page.tsx` - Supabase auth callback handler

### API Routes (`/api/`)

#### Herd Management
- `meetings/route.ts` - Create new herds with max_participants limit, list herds
- `meetings/[id]/route.ts` - Get/update specific herd
- `meetings/[id]/timeslots/route.ts` - Manage proposed time slots

#### Participant Management
- `participants/route.ts` - Create participants with limit enforcement (name-only signup)
- `participants/[id]/route.ts` - Update participant info

#### Availability System
- `availability/route.ts` - Handle availability updates
- `timeslots/[id]/responses/route.ts` - Manage participant responses to time slots

#### LLM Integration
- `llm/chat/route.ts` - Natural language chat processing
- `llm/analyze/route.ts` - Analyze availability patterns
- `llm/config/route.ts` - LLM configuration management
- `llm/models/route.ts` - Available model information
- `llm/local/route.ts` - Local LLM processing
- `llm/herd-params/route.ts` - Herd parameter extraction from natural language
- `llm/herd-params/stream/route.ts` - Streaming herd parameter extraction

## Development Guidelines

### Page Components
- Use Server Components by default, Client Components only when needed
- Implement proper loading states and error boundaries
- Handle real-time data with Supabase subscriptions
- Maintain mobile responsiveness across all pages

### API Route Patterns
```typescript
// Standard API response pattern
export async function GET(request: Request) {
  try {
    // Handle request
    return NextResponse.json({ data, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
```

### Route Parameters
- Use dynamic routes: `[token]`, `[id]` for parameterized pages
- Extract params with: `const { token } = params`
- Validate parameters before processing

### Error Handling
- Implement proper error pages (error.tsx, not-found.tsx)
- Use try-catch blocks in API routes
- Return consistent error response format
- Handle Supabase errors gracefully

### Real-time Integration
- Use Supabase real-time subscriptions in page components
- Clean up subscriptions on component unmount
- Handle connection state changes
- Implement optimistic updates for better UX

### Authentication
- Optional authentication with graceful fallback
- Handle auth state in layout components
- Protect routes when necessary
- Support anonymous participation

## Key Patterns

### Herd Token Flow
1. Create herd → Generate unique token
2. Share token via URL: `/event/[token]`
3. Participants (Katz) access via token (no auth required)
4. Participant limit enforcement on join attempts

### API Data Flow
1. Pages fetch initial data server-side
2. Real-time updates via Supabase subscriptions
3. Optimistic updates for immediate feedback
4. Error recovery with proper fallbacks

### LLM Integration Flow (Enhanced Chat Window)
1. **User input** → Natural language in LLMChatWindow ("I can't do mornings")
2. **Context passing** → Chat window sends full event context (eventId, participantId, dates, times)
3. **API processing** → `/api/llm/chat` uses `availability-parser.ts` for high-accuracy parsing
4. **Parsed updates** → Returns structured availability updates array
5. **Direct application** → Event page `handleLLMAvailabilityUpdate` processes updates without additional API calls
6. **Real-time grid** → Pink heat map updates instantly via optimistic updates and database saves
7. **Multi-slot handling** → Efficiently processes bulk updates (48-96 time slots from single statement)
8. **Stream responses** → Better UX via `/api/llm/herd-params/stream` for herd parameter extraction

## Testing Considerations

### Page Testing
- Test both authenticated and anonymous flows
- Verify real-time updates across multiple tabs
- Test mobile responsiveness for cat-themed interface
- Validate error states and loading states
- Test collapsible "Herd Options (for picky Katz)" functionality

### API Testing
- Test all CRUD operations with max_participants enforcement
- Verify proper error responses including participant limit messages
- Test rate limiting and validation
- Check real-time subscription triggers
- Validate participant limit enforcement across concurrent requests

### Integration Testing
- Test complete herd creation and participation flows end-to-end
- Verify LLM chat integration with cat-themed language
- Test multi-participant scenarios up to max limits
- Validate timezone handling and 12-hour time formatting
- Test animated cat icon and tail wagging across different contexts
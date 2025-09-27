# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **HerdingKatz** - a streamlined AI-powered meeting scheduling system built with Next.js 15. The system focuses on simplicity and ease of use, featuring drag-and-select availability grids, real-time heat maps, and natural language LLM chat assistance for optimal scheduling coordination. The application uses playful cat-themed branding throughout the interface.

### Technology Stack
- **Framework**: Next.js 15.5.4 with App Router and React 19
- **Database**: Supabase with real-time subscriptions
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **TypeScript**: Full TypeScript support with strict mode
- **Build Tool**: Turbopack enabled by default

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Start with custom hostname (for remote access)
npm run dev -- --hostname 100.87.169.2

# Build for production with Turbopack
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── CLAUDE.md       # App-specific development guidelines
│   ├── page.tsx        # Main landing page with herd creation and join options
│   ├── layout.tsx      # Root layout
│   ├── globals.css     # Global styles
│   ├── create/page.tsx # Herd creation form with collapsible options
│   ├── event/[token]/page.tsx # Main scheduling interface with grid and chat
│   └── api/            # API routes
│       ├── meetings/   # Herd management endpoints
│       ├── participants/ # Participant management with limits enforcement
│       ├── availability/ # Availability updates
│       └── llm/        # Natural language processing and chat
├── components/         # React components
│   ├── CLAUDE.md       # Component-specific development guidelines
│   ├── ui/            # shadcn/ui base components
│   ├── MeetingCreator.tsx      # Herd creation form with collapsible options
│   ├── AvailabilityGrid.tsx    # Interactive drag-select grid with heat map
│   ├── ParticipantNameEntry.tsx # Name-only signup with herd details display
│   ├── LLMChatWindow.tsx       # Natural language scheduling assistant
│   ├── RealtimeStatus.tsx      # Connection status indicator
│   ├── icons/ParticipantIcon.tsx # Animated cat icon with wagging tail
│   └── layout/AppShell.tsx     # Main app layout wrapper
└── lib/                # Core utilities and logic
    ├── CLAUDE.md       # Library-specific development guidelines
    ├── supabase.ts     # Supabase client configuration
    ├── database.ts     # Database schema types (events, participants, availability)
    ├── types.ts        # TypeScript type definitions
    ├── timezone-utils.ts # Timezone handling utilities
    ├── scoring.ts      # Availability scoring and recommendation algorithms
    ├── llm-client.ts   # LLM integration and natural language processing
    ├── availability-parser.ts # Natural language availability parsing engine
    ├── auth-optional.ts # Optional authentication helpers
    ├── useRealtime.ts  # Core real-time subscription management
    ├── useMeetingRealtime.ts # Herd-specific real-time hooks
    └── utils.ts        # General utility functions
```

## Hierarchical Documentation

This project uses a hierarchical documentation structure with specialized CLAUDE.md files for each major directory:

- **`/CLAUDE.md`** (this file): Project overview, core concepts, and general guidelines
- **`/src/app/CLAUDE.md`**: Next.js App Router patterns, API routes, and page development
- **`/src/components/CLAUDE.md`**: React component architecture, patterns, and UI guidelines
- **`/src/lib/CLAUDE.md`**: Utility libraries, database layer, real-time systems, and core business logic

**When working in a specific area, consult the relevant CLAUDE.md file for detailed guidance on that layer's patterns, conventions, and best practices.**

## Core Features & User Flow

### 🎯 **Streamlined User Experience**

**For Herd Organizers:**
1. **Simple Herd Creation**: Streamlined form with collapsible "Herd Options (for picky Katz)"
2. **Progressive Disclosure**: Essential fields first (name + timezone), advanced options on-demand
3. **Instant Share Link**: Get shareable URL immediately after creation
4. **Real-time Heat Map**: Visual feedback showing participant availability overlap
5. **Participant Limits**: Enforced max participant limits with clear error messages

**For Participants (Katz):**
1. **No Account Required**: Anonymous participation with name-only entry
2. **Herd Details Display**: Clear view of date range, time window, and participant limits
3. **Drag-and-Select Grid**: Intuitive availability selection interface
4. **Real-time Updates**: See other participants' responses instantly
5. **Natural Language Chat**: LLM assistant for complex scheduling constraints

### 🔥 **Visual Heat Map System**
- **Color-coded Grid**: Pink gradient system (light to dark based on availability)
- **Current Participant Highlight**: Special pink shading when participant is available
- **Hover Details**: Shows which specific participants are available/unavailable
- **Real-time Updates**: Grid updates instantly as participants respond
- **Auto-save**: All selections saved automatically

### 🤖 **LLM Chat Integration (Key Innovation)**
- **Natural Language Input**: "I can't do Tuesday mornings" or "I prefer afternoons"
- **Quick Prompts**: Common availability statements for fast input
- **Smart Processing**: Converts natural language to availability updates using advanced parsing
- **Real-time Grid Updates**: Chat responses automatically mark grid cells with pink availability
- **Contextual AI**: Full event context (dates, times, participants) for intelligent suggestions
- **Chat Window**: Overlay interface accessible from grid page with cat-themed RoboKatz assistant
- **High Accuracy**: Parsing confidence scores of 0.8-1.0 for precise availability detection

### ⚡ **Real-time Coordination**
- **Live Collaboration**: Multiple participants can respond simultaneously
- **Instant Feedback**: Changes appear immediately across all devices
- **Connection Status**: Visual indicators for connection health
- **Multi-tab Support**: Works across multiple browser windows/tabs

## Database Schema

The system uses 6 main tables in Supabase (defined in `/src/lib/database.sql`):

1. **events**: Core herd details (title, date range, time window, timezone, duration, max_participants)
2. **participants**: Participant information (name, email optional, role, timezone)
3. **availability**: Time slot availability for each participant (date, time, status)
4. **messages**: LLM conversation history and natural language processing
5. **meeting_slots**: Finalized meeting times with attendance scores
6. **llm_context**: AI conversation state and learned preferences

## Key Configuration

- **Path Aliases**: `@/*` maps to `./src/*`
- **shadcn/ui**: New York style, gray base color, CSS variables
- **ESLint**: Custom rules for unused variables and TypeScript
- **Real-time**: Configured with 10 events per second limit

## Environment Variables

Required Supabase environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## API Endpoints

### Core Herd Management
- `POST /api/meetings` - Create new herd (includes max_participants limit)
- `GET /api/meetings` - List all herds (used to find by share token)

### Participant Management
- `POST /api/participants` - Create participant with limit enforcement
- `GET /api/participants?event_id={id}` - Get herd participants

### Core User Flow
1. **Herd Creation**: `POST /api/meetings` with collapsible options → get share token
2. **Participant Join**: `POST /api/participants` with name only + limit check → get participant ID
3. **Grid Display**: Load participants and availability data for heat map
4. **Availability Updates**: Save drag-select changes to availability table
5. **LLM Chat**: Process natural language and update availability accordingly

## Development Notes

### TypeScript
- Uses strict mode with comprehensive type definitions
- Database types are auto-generated from Supabase schema
- Proper typing for all API responses and real-time data

### Component Architecture
- **AvailabilityGrid.tsx**: Main drag-select interface with pink heat map visualization
- **ParticipantNameEntry.tsx**: Name-only signup with "Herd Details" display
- **LLMChatWindow.tsx**: Natural language scheduling assistant
- **MeetingCreator.tsx**: Herd creation form with collapsible "Herd Options (for picky Katz)"
- **ParticipantIcon.tsx**: Animated cat icon with wagging tail tip
- **Real-time Ready**: Framework prepared for Supabase real-time subscriptions

### Key Design Principles
1. **Cat-themed Branding**: Playful "Katz" terminology and animated cat icons
2. **Progressive Disclosure**: Essential fields first, advanced options collapsible
3. **Visual Feedback**: Pink gradient heat maps, instant updates
4. **Natural Language**: LLM chat for complex scheduling constraints
5. **Anonymous Access**: No accounts required, name-only participation
6. **Mobile Responsive**: Grid adapts to different screen sizes
7. **Participant Limits**: Enforced max participant caps with clear messaging

## Testing the Streamlined User Flow

### **End-to-End Testing**
1. **Herd Creation**: Test collapsible form → verify "Herd Options (for picky Katz)" functionality
2. **Participant Flow**:
   - Access share link → enter name only → view "Herd Details"
   - Test drag-and-select availability → verify auto-save
   - Test pink heat map visualization → verify gradient system
3. **LLM Chat**:
   - Open chat window → test natural language input
   - Try quick prompts → verify suggestions
   - Test availability updates from chat
4. **Participant Limits**: Test max participant enforcement and error messages

### **Multi-User Testing**
1. **Concurrent Access**: Open same herd link in multiple browser tabs
2. **Real-time Updates**: Set availability in one tab → verify instant updates in others
3. **Heat Map Changes**: Watch pink gradient change as participants respond
4. **Chat Coordination**: Test LLM assistance with multiple participants
5. **Limit Testing**: Verify participant cap enforcement across multiple users

### **Core User Scenarios**
1. **Simple Herd**: 2-3 participants, basic time selection with default settings
2. **Complex Constraints**: Use LLM chat for "I can't do mornings" type constraints
3. **Large Group**: Test with max participants to verify heat map and limit effectiveness
4. **Picky Katz**: Test all advanced options in collapsible section

## Server Access

The development server is configured to run on:
- **Local**: http://100.87.169.2:3002 (or next available port)
- **Network**: Accessible from allowed IP ranges

## Git Commit Guidelines

- **Never include Claude Code attribution** in commit messages (no "🤖 Generated with [Claude Code]" or "Co-Authored-By: Claude" lines)
- Use clean, descriptive commit messages focusing on what was changed and why
- Follow conventional commit format when appropriate

## Code Style Guidelines

- **Comments:** DO NOT add code comments unless explicitly requested
- **File Creation:** NEVER create new files unless absolutely necessary for the task
- **Documentation:** NEVER proactively create documentation files (*.md) or README files
- **Editing Preference:** ALWAYS prefer editing existing files over creating new ones
- **Error Handling:** Always run lint and typecheck commands after significant changes
- **Real-time**: Always handle null checks for real-time data and connection states
- **Types**: Use proper TypeScript types, avoid 'any' except for Supabase JSON
- **Optimistic Updates**: Implement immediate UI feedback with proper rollback patterns
- **Subscriptions**: Always cleanup real-time subscriptions on component unmount

## Component Usage Guidelines

### AvailabilityGrid Component
```typescript
import { AvailabilityGrid } from '@/components/AvailabilityGrid';

<AvailabilityGrid
  event={event}
  currentParticipant={participant}
  participants={participantAvailability}
  onAvailabilityChange={handleAvailabilityChange}
/>
```

### LLM Chat Integration
```typescript
import { LLMChatWindow } from '@/components/LLMChatWindow';

<LLMChatWindow
  participantName={participant.name}
  isOpen={showChatWindow}
  onClose={() => setShowChatWindow(false)}
  onAvailabilityUpdate={handleLLMAvailabilityUpdate}
/>
```

### Development Best Practices
- Use drag-and-select for availability input in AvailabilityGrid
- Implement real-time heat map updates with pink gradient system
- Handle natural language processing for LLM chat integration
- Maintain mobile responsiveness across all components
- Test multi-user scenarios with multiple browser tabs
- Enforce participant limits with clear error messaging
- Use cat-themed branding and language throughout the interface
- Prioritize progressive disclosure in UI design
- Implement optimistic updates for better user experience
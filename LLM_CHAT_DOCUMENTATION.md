# HerdingKatz LLM Chat System Documentation

## 🐱 **Overview**

The HerdingKatz LLM Chat system provides natural language scheduling assistance through an intelligent chat interface that helps participants coordinate availability using conversational input instead of manual grid selection.

## 🛠️ **Core Components**

### **LLMChatWindow** - Main Scheduling Assistant
- **Location**: `/src/components/LLMChatWindow.tsx`
- **Purpose**: Natural language availability input for event participants
- **Features**: Chat interface, quick prompts, automatic availability updates

### **AIRobotChat** - Herd Creation Assistant
- **Location**: `/src/components/AIRobotChat.tsx`
- **Purpose**: Help with herd parameter configuration during creation
- **Features**: Parameter extraction, streaming responses, smart suggestions

### **AIRobotButton** - Entry Point
- **Location**: `/src/components/AIRobotButton.tsx`
- **Purpose**: Toggle button to open AI assistance
- **Features**: Cat-themed branding, simple activation

## ⚙️ **Configuration Parameters**

### **LLM Client Configuration** (`/src/lib/llm-client.ts`)

#### **Connection Settings**
```typescript
interface LLMConfig {
  endpoint: string;        // API endpoint URL
  model: string;          // Model name to use
  temperature?: number;   // Response creativity (0-1)
  maxTokens?: number;     // Maximum response length
  apiKey?: string;        // Authentication key
}
```

#### **Supported Providers**
- **Ollama**: Local models (e.g., `http://localhost:11434`)
- **LocalAI**: Self-hosted OpenAI-compatible API
- **OpenAI-Compatible**: Any API following OpenAI format

#### **Default Values**
- `temperature`: `0.7` (balanced creativity)
- `maxTokens`: `2000` (reasonable response length)

### **API Configuration** (`/src/app/api/llm/config/route.ts`)

#### **GET /api/llm/config**
Retrieves current LLM configuration:
```json
{
  "endpoint": "http://localhost:11434",
  "model": "llama2",
  "temperature": 0.7,
  "maxTokens": 2000,
  "hasApiKey": true
}
```

#### **POST /api/llm/config**
Updates LLM configuration:
```json
{
  "endpoint": "http://localhost:11434",
  "model": "llama2:13b",
  "temperature": 0.5,
  "maxTokens": 1500,
  "apiKey": "optional-api-key"
}
```

## 🎯 **Usage Examples**

### **Basic Chat Integration**
```typescript
import { LLMChatWindow } from '@/components/LLMChatWindow';

<LLMChatWindow
  participantName="Alice"
  isOpen={showChatWindow}
  onClose={() => setShowChatWindow(false)}
  onAvailabilityUpdate={handleAvailabilityUpdate}
/>
```

### **Herd Creation Assistance**
```typescript
import { AIRobotButton } from '@/components/AIRobotButton';

<AIRobotButton
  onParameterUpdate={(updates) => {
    // updates = { maxParticipants: 10, timezone: "PST" }
    setFormData(prev => ({ ...prev, ...updates }));
  }}
/>
```

## 🗣️ **Natural Language Processing**

### **Supported Input Patterns**

#### **Availability Statements**
- "I can't do mornings" → Marks morning slots unavailable
- "I prefer afternoons" → Prioritizes afternoon slots
- "I'm free Tuesday and Thursday" → Marks specific days available
- "No meetings on Friday" → Blocks all Friday slots
- "Early morning or late afternoon only" → Restricts to time ranges

#### **Time-based Constraints**
- "Before 11 AM doesn't work" → Sets morning restriction
- "After 6 PM is perfect" → Sets evening preference
- "Lunch time meetings are fine" → Midday availability
- "I need 2 hours between meetings" → Spacing requirements

#### **Day-specific Preferences**
- "Weekends work better for me" → Weekend preference
- "Mondays are busy" → Monday restriction
- "Wednesday through Friday available" → Range specification
- "Only Tuesdays in March" → Specific date constraints

### **Quick Prompts**
Pre-configured common phrases for fast input:
```typescript
const quickPrompts = [
  "I can't do mornings",
  "I prefer afternoons",
  "Weekends work better for me",
  "I'm free Tuesday and Thursday",
  "No meetings on Friday",
  "Early morning or late afternoon only"
];
```

## 🔒 **Restrictions & Security**

### **Content Filtering**
- Scheduling-focused conversations only
- No personal information storage beyond names
- Automatic context limitation to herd-specific data

### **Rate Limiting**
- Real-time events: 10 per second maximum
- API requests: Standard Next.js throttling
- Token usage: Configurable via `maxTokens`

### **Data Privacy**
- No persistent conversation storage unless explicitly enabled
- Participant data limited to scheduling context
- Optional anonymous mode for sensitive scenarios

### **API Security**
```typescript
// Environment variables required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

// Optional LLM configuration
LLM_ENDPOINT=http://localhost:11434
LLM_MODEL=llama2
LLM_API_KEY=optional_key
```

## 🚀 **Engagement Features**

### **Interactive Elements**

#### **Visual Feedback**
- Robot cat icons with animated tails
- Pink gradient color scheme matching cat theme
- Smooth scrolling chat interface
- Typing indicators with bouncing dots

#### **Smart Suggestions**
- Context-aware quick prompts
- Automatic availability interpretation
- Time slot recommendations based on group patterns
- Conflict resolution suggestions

#### **Real-time Updates**
- Immediate grid updates from chat input
- Live participant activity indicators
- Instant feedback on scheduling changes
- Synchronized multi-user experience

### **Personality & Tone**

#### **System Prompt** (`/src/app/api/llm/chat/route.ts`)
```typescript
const SCHEDULING_SYSTEM_PROMPT = `You are a helpful AI scheduling assistant for Herding Katz, a smart group scheduling platform.

Your responsibilities:
- Help users find optimal meeting times
- Resolve scheduling conflicts diplomatically
- Provide clear, actionable recommendations
- Use natural, conversational language
- Focus on solutions and positive outcomes

Key guidelines:
- Be empathetic when people have conflicts
- Explain scheduling recommendations with data
- Suggest alternatives when conflicts arise
- Keep responses concise but helpful
- Use encouraging, collaborative language`;
```

#### **Cat-themed Language**
- "Katz" instead of "users" or "participants"
- Playful but professional tone
- Encouraging group coordination messaging
- Fun emojis and friendly language patterns

## 🔧 **Customization Options**

### **Model Tuning**

#### **Temperature Settings**
- `0.1-0.3`: Highly focused, consistent responses
- `0.4-0.7`: Balanced creativity and reliability (recommended)
- `0.8-1.0`: More creative but potentially inconsistent

#### **Response Length**
- `500-1000`: Concise responses for mobile
- `1000-2000`: Standard detailed responses (default)
- `2000+`: Comprehensive explanations

### **UI Customization**

#### **Chat Window Styling**
```css
/* Custom scrollbar styling in globals.css */
.chat-messages-scroll::-webkit-scrollbar {
  width: 8px;
}

.chat-messages-scroll::-webkit-scrollbar-thumb {
  background: #f9a8d4; /* Pink theme */
  border-radius: 4px;
}
```

#### **Color Theme Variables**
- Primary: Pink/Rose gradients
- Accent: Purple highlights
- Background: Soft pink/white gradients
- Text: Gray scale for readability

### **Feature Toggles**

#### **Component Props**
```typescript
interface LLMChatWindowProps {
  participantName: string;           // Required: User identification
  isOpen: boolean;                   // Required: Visibility control
  onClose: () => void;              // Required: Close handler
  onAvailabilityUpdate?: (message: string) => void; // Optional: Update callback
}
```

#### **Advanced Configuration**
```typescript
// Optional configuration for advanced use cases
interface AdvancedConfig {
  enableStreaming?: boolean;         // Real-time response streaming
  contextMemory?: boolean;          // Remember conversation history
  autoSave?: boolean;               // Automatic availability updates
  multiLanguage?: boolean;          // i18n support
  customPrompts?: string[];         // Additional quick prompts
}
```

## 📊 **Performance Optimization**

### **Response Times**
- Local models (Ollama): 1-5 seconds typical
- Remote APIs: 2-10 seconds depending on provider
- Streaming responses: Start displaying immediately

### **Memory Management**
- Conversation history limited to current session
- Automatic cleanup on component unmount
- Efficient re-rendering with React optimizations

### **Error Handling**
```typescript
// Graceful degradation patterns
try {
  const response = await llmClient.chat(messages);
  return response;
} catch (error) {
  // Fallback to simple pattern matching
  return generateFallbackResponse(userMessage);
}
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Robot Cat Icon Not Displaying**
- **Cause**: Import or compilation errors
- **Solution**: Check `/src/components/icons/RobotCatIcon.tsx` exists
- **Verification**: Ensure `fill="currentColor"` in SVG

#### **Chat Window Not Scrolling**
- **Cause**: CSS flex layout conflicts
- **Solution**: Fixed height with `overflow-y-auto`
- **Enhancement**: Custom scrollbar styling applied

#### **LLM Not Responding**
- **Cause**: Configuration or network issues
- **Check**: `/api/llm/config` endpoint status
- **Debug**: Console logs for API errors

### **Configuration Validation**

#### **Test LLM Connection**
```bash
curl -X GET http://localhost:3000/api/llm/config
curl -X GET http://localhost:11434/api/tags  # For Ollama
```

#### **Verify Component Integration**
```typescript
// Test robot cat icon rendering
<RobotCatIcon className="h-6 w-6 text-pink-600" />

// Test chat window
<LLMChatWindow
  participantName="Test User"
  isOpen={true}
  onClose={() => {}}
/>
```

## 📚 **API Reference**

### **Core Endpoints**

#### **POST /api/llm/chat**
Main chat processing endpoint:
```typescript
Request: {
  message: string;              // User input message
  eventId?: string;            // Optional: herd context
  participantId?: string;      // Optional: user context
  context?: Record<string, any>; // Optional: additional context
}

Response: {
  success: boolean;
  response: string;            // LLM generated response
  model: string;              // Model used
  processingTime: number;     // Response time in ms
  context: Record<string, any>; // Enhanced context
}
```

#### **POST /api/llm/herd-params**
Parameter extraction for herd creation:
```typescript
Request: {
  message: string;             // Natural language herd description
  currentParams?: Record<string, any>; // Existing parameters
}

Response: {
  success: boolean;
  extractedParams: {
    title?: string;
    maxParticipants?: number;
    timezone?: string;
    dateStart?: string;
    dateEnd?: string;
    // ... other herd parameters
  };
  explanation: string;         // What was understood
}
```

### **Streaming Endpoints**

#### **POST /api/llm/herd-params/stream**
Streaming parameter extraction:
```typescript
// Returns Server-Sent Events stream
Content-Type: text/plain; charset=utf-8
Transfer-Encoding: chunked

data: {"type": "progress", "message": "Analyzing your request..."}
data: {"type": "params", "params": {"title": "Team Meeting"}}
data: {"type": "complete", "finalParams": {...}}
```

## 🎨 **Design Guidelines**

### **Visual Consistency**
- Cat-themed icons throughout
- Pink/rose color palette
- Smooth animations and transitions
- Mobile-responsive design

### **User Experience**
- Progressive disclosure of features
- Immediate visual feedback
- Error states with helpful messages
- Accessible keyboard navigation

### **Brand Integration**
- "Katz" terminology consistently
- Playful but professional tone
- Robot cat mascot as primary icon
- HerdingKatz brand colors and fonts

---

## 🚀 **Getting Started**

1. **Install Dependencies**: All required packages included in Next.js project
2. **Configure LLM**: Set up local Ollama or remote API endpoint
3. **Test Components**: Verify robot cat icons and chat scrolling
4. **Customize Settings**: Adjust temperature, prompts, and styling as needed
5. **Deploy**: Standard Next.js deployment with environment variables

For additional support or customization needs, refer to the component source code and API implementations in the `/src` directory.
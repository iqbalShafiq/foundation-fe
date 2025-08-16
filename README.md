# Foundation Chat App

A modern React chat application with real-time streaming responses, built with TypeScript and Vite. Features a Claude/ChatGPT-inspired dark theme interface with comprehensive chat management capabilities.

## ✨ Features

### 🔐 Authentication & User Management
- **JWT-based Authentication**: Secure login/register system
- **User Profiles**: Account information and preferences management
- **Protected Routes**: Automatic redirect to login for unauthenticated users

### 💬 Advanced Chat Features
- **Real-time Streaming**: Live streaming responses with Server-Sent Events (SSE)
- **Multiple AI Models**: Support for Fast, Standard, Fast Reasoning, and Reasoning models
- **Conversation Management**: Create, view, and manage multiple conversations
- **Message History**: Persistent chat history across sessions
- **Search Functionality**: Search through conversations and messages
- **Feedback System**: Rate and provide feedback on AI responses

### 🎨 Modern UI/UX
- **Dark Theme**: Elegant dark interface with consistent color palette
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Modern Components**: Reusable UI component system
- **Smooth Animations**: Polished transitions and interactions
- **Accessibility**: ARIA-compliant and keyboard navigation support

### ⚙️ Settings & Preferences
- **User Preferences**: Customizable chat settings
- **Model Selection**: Easy switching between AI models
- **Account Management**: Profile and security settings

## 🛠 Tech Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7.x
- **Styling**: Tailwind CSS 4.x with custom dark theme
- **Routing**: React Router DOM 7.x
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Markdown**: React Markdown with syntax highlighting
- **Code Quality**: ESLint + TypeScript ESLint

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend service running on `http://localhost:8000`

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd foundation-fe
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:5173`

### Environment Setup

Create a `.env.local` file for environment variables:
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Alert.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts
│   ├── auth/                  # Authentication components
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── chat/                  # Chat-related components
│   │   ├── AllConversations.tsx
│   │   ├── Chat.tsx
│   │   ├── ChatHeader.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ConversationSidebar.tsx
│   │   ├── FeedbackModal.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── SearchModal.tsx
│   │   ├── SidebarButton.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── UserProfile.tsx
│   ├── settings/              # Settings components
│   │   ├── Settings.tsx
│   │   ├── AccountInformation.tsx
│   │   ├── PreferencesSection.tsx
│   │   └── SettingsSidebar.tsx
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx        # Authentication state management
├── services/
│   └── api.ts                 # API service layer
├── types/                     # TypeScript type definitions
│   ├── auth.ts
│   ├── chat.ts
│   └── preferences.ts
├── utils/                     # Utility functions
│   ├── dateUtils.ts
│   └── modelStorage.ts
├── App.tsx
└── main.tsx
```

## 🔌 API Integration

### Authentication Endpoints
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration  
- `GET /auth/me` - Get current user information
- `POST /auth/logout` - User logout

### Chat Endpoints
- `GET /conversations` - Get user conversations
- `POST /conversations` - Create new conversation
- `GET /conversations/{id}/messages` - Get conversation messages
- `POST /chat` - Send message with streaming response
- `POST /messages/{id}/feedback` - Submit message feedback

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler check
```

## 🔐 Authentication Flow

1. **Registration**: Users create account with username, email, and password
2. **Login**: Returns JWT token stored in localStorage
3. **Authorization**: Token automatically included in API requests via Axios interceptors
4. **Route Protection**: Unauthenticated users redirected to login page
5. **Auto-refresh**: Token validation and refresh handling

## 💬 Chat System Architecture

### Message Flow
1. User types message in `ChatInput`
2. Message sent to backend via streaming endpoint
3. Real-time response chunks received via SSE
4. `TypingIndicator` shows AI is responding
5. Response rendered with markdown support
6. Message saved to conversation history

### Model Management
- Dynamic model selection via `ModelSelector`
- Model preferences stored locally
- Support for different AI model types and capabilities

## 🎨 UI Component System

The app uses a comprehensive design system with reusable components:

### Dark Theme Palette
- **Backgrounds**: `bg-gray-900` (main), `bg-gray-800` (secondary), `bg-gray-700` (cards)
- **Text**: `text-gray-100` (primary), `text-gray-200` (secondary), `text-gray-400` (muted)
- **Accents**: `bg-blue-600` (primary actions), `bg-green-600` (success), `bg-red-600` (error)

### Component Usage
```tsx
import { Button, Input, Card, Alert } from './components/ui';

// Use components with consistent styling
<Button variant="primary" size="lg">Send Message</Button>
<Input label="Email" icon={Mail} />
<Card padding="lg">Content here</Card>
<Alert variant="success">Success message</Alert>
```

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for all components
- Follow established component patterns
- Implement proper error handling
- Include loading states for async operations

### Component Creation
1. Check existing UI components first
2. Follow dark theme design tokens
3. Include proper TypeScript types
4. Add to component index exports

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
The app is configured for static deployment. Ensure your backend API supports CORS for your domain.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the established code patterns
4. Ensure TypeScript compliance
5. Test thoroughly before submitting PR

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related Projects

- **Backend**: Foundation Chat API (FastAPI)
- **Documentation**: See `CLAUDE.md` for detailed development guidelines

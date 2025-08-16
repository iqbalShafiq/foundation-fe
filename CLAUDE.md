# Foundation Chat - Development Guidelines

## UI Component System

This project uses a reusable component system located in `src/components/ui/`. Always use these components instead of creating custom styled elements.

### Available Components

#### Button (`src/components/ui/Button.tsx`)
```tsx
import { Button } from '../components/ui';
import { LogIn, Plus } from 'lucide-react';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With icons
<Button icon={LogIn} iconPosition="left">Login</Button>
<Button icon={Plus} iconPosition="right">Add Item</Button>

// Loading state
<Button loading={isLoading}>Save Changes</Button>
```

#### Input (`src/components/ui/Input.tsx`)
```tsx
import { Input } from '../components/ui';
import { Mail, Lock } from 'lucide-react';

// Basic usage
<Input 
  label="Email" 
  placeholder="Enter your email"
  type="email"
/>

// With icon
<Input 
  label="Email"
  icon={Mail}
  iconPosition="left"
  placeholder="Enter your email"
/>

// With error state
<Input 
  label="Password"
  icon={Lock}
  type="password"
  error="Password is required"
/>

// With helper text
<Input 
  label="Username"
  helperText="Must be at least 3 characters"
/>
```

#### Card (`src/components/ui/Card.tsx`)
```tsx
import { Card } from '../components/ui';

// Basic usage
<Card>
  <h2>Card Title</h2>
  <p>Card content here</p>
</Card>

// With custom padding and shadow
<Card padding="lg" shadow="lg">
  <h2>Large Padded Card</h2>
</Card>

// No padding for custom layouts
<Card padding="none">
  <div className="p-4 border-b">Header</div>
  <div className="p-4">Content</div>
</Card>
```

#### Alert (`src/components/ui/Alert.tsx`)
```tsx
import { Alert } from '../components/ui';

// Different variants
<Alert variant="error">
  Something went wrong!
</Alert>

<Alert variant="success" title="Success!">
  Your changes have been saved.
</Alert>

<Alert variant="warning" title="Warning">
  This action cannot be undone.
</Alert>

<Alert variant="info">
  Here's some helpful information.
</Alert>
```

### Design Tokens

#### Dark Theme Colors (Primary Color Palette)
The application uses a modern dark theme throughout. Always use these color tokens:

**Backgrounds:**
- **Main Background**: `bg-gray-900` (darkest background)
- **Secondary Background**: `bg-gray-800` (chat area, modals)
- **Card/Component Background**: `bg-gray-700` (message bubbles, inputs)
- **Hover States**: `bg-gray-600` (interactive elements)

**Text Colors:**
- **Primary Text**: `text-gray-100` (headers, main content)
- **Secondary Text**: `text-gray-200` (usernames, labels)
- **Muted Text**: `text-gray-400` (timestamps, descriptions)
- **Disabled Text**: `text-gray-500`

**Interactive Elements:**
- **Primary Action**: `bg-blue-600 hover:bg-blue-700` (send buttons, primary actions)
- **Secondary Action**: `bg-gray-700 hover:bg-gray-600 border-gray-600`
- **Success**: `text-green-400 bg-green-900/30`
- **Error**: `text-red-400 bg-red-900/20`
- **Warning**: `text-yellow-400 bg-yellow-900/30`
- **Info**: `text-blue-400 bg-blue-900/30`

**Borders:**
- **Primary Border**: `border-gray-700`
- **Secondary Border**: `border-gray-600`
- **Interactive Border**: `border-gray-500` (hover states)

#### Typography
- **Font Family**: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Text Sizes**: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`
- **Font Weights**: `font-medium`, `font-semibold`, `font-bold`

#### Spacing
- **Padding**: `p-2`, `p-4`, `p-6`, `p-8`
- **Margin**: `m-2`, `m-4`, `m-6`, `m-8`
- **Gap**: `gap-2`, `gap-4`, `gap-6`, `gap-8`

#### Borders & Shadows
- **Border Radius**: `rounded-lg`, `rounded-xl`, `rounded-2xl` (modern chat bubbles)
- **Shadows**: `shadow-sm`, `shadow-md`, `shadow-lg`
- **Modern Bubble Radius**: User messages use `rounded-2xl rounded-tr-md`, bot messages use `rounded-2xl rounded-tl-md`

## Component Creation Guidelines

### When creating new pages or components:

1. **Always check existing UI components first** - Use components from `src/components/ui/`
2. **If a component doesn't exist**, create it in the UI directory following the established patterns
3. **Use consistent dark theme styling** - Follow the dark theme color tokens above
4. **Make components reusable** - Accept props for variants, sizes, and states
5. **Include proper TypeScript types** - All props should be typed
6. **Export from index.ts** - Add new components to `src/components/ui/index.ts`
7. **Use modern transitions** - Include `transition-all duration-200` for smooth interactions

### Chat Component Patterns

#### Modern Message Bubble
```tsx
// User message bubble
<div className="flex items-start space-x-3 py-3 flex-row-reverse space-x-reverse">
  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
    <User className="h-5 w-5" />
  </div>
  <div className="flex-1 max-w-3xl text-right">
    <div className="inline-block px-5 py-3 bg-blue-600 text-white ml-auto rounded-2xl rounded-tr-md shadow-md">
      {/* Message content */}
    </div>
  </div>
</div>

// Bot message bubble
<div className="flex items-start space-x-3 py-3">
  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
    <Bot className="h-5 w-5" />
  </div>
  <div className="flex-1 max-w-3xl">
    <div className="inline-block px-5 py-3 bg-gray-700 text-gray-100 rounded-2xl rounded-tl-md shadow-md">
      {/* Message content */}
    </div>
  </div>
</div>
```

#### Modern Input Field
```tsx
<textarea
  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-2xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
  placeholder="Type your message..."
/>
```

#### Form Patterns (Dark Theme)
```tsx
// Standard form layout - Dark Theme
<Card className="w-full max-w-md mx-auto bg-gray-800 border-gray-700">
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-100">Page Title</h2>
      <p className="text-gray-400">Page description</p>
    </div>
    
    <form className="space-y-4">
      <Input label="Field Label" />
      <Button className="w-full" type="submit">
        Submit
      </Button>
    </form>
  </div>
</Card>
```

### Layout Patterns (Dark Theme)
```tsx
// Full screen centered layout - Dark Theme
<div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
  {/* Content here */}
</div>

// Chat layout pattern
<div className="flex h-screen bg-gray-900">
  <div className="w-80 bg-gray-900 border-r border-gray-700">
    {/* Sidebar */}
  </div>
  <div className="flex-1 flex flex-col bg-gray-800">
    {/* Main content */}
  </div>
</div>

// Container with max width - Dark Theme
<div className="max-w-4xl mx-auto px-4 py-8 bg-gray-800">
  {/* Content here */}
</div>
```

## File Organization

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Alert.tsx
│   │   └── index.ts     # Export all UI components
│   ├── auth/            # Authentication specific components
│   ├── chat/            # Chat specific components
│   └── layout/          # Layout components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── services/            # API services
├── types/               # TypeScript types
└── utils/               # Utility functions
```

## Best Practices

1. **Component Naming**: Use PascalCase for component names
2. **Props Interface**: Always define TypeScript interfaces for props
3. **Default Props**: Use default parameters instead of defaultProps
4. **Styling**: Use Tailwind classes, avoid inline styles
5. **Accessibility**: Include proper ARIA attributes and semantic HTML
6. **Responsiveness**: Consider mobile-first design with responsive classes
7. **Performance**: Use React.memo for expensive components, useMemo for expensive calculations

## Dark Theme Guidelines

### Key Principles
1. **Consistent Dark Palette**: Always use the defined gray scale (`gray-900` to `gray-100`)
2. **High Contrast**: Ensure proper contrast ratios for accessibility
3. **Blue Accents**: Use `blue-600` for primary actions and accents
4. **Smooth Transitions**: Include `transition-all duration-200` for interactive elements
5. **Modern Borders**: Use `border-gray-700` for primary borders, `border-gray-600` for secondary

### Component-Specific Guidelines

#### Modal Components
- Background: `bg-gray-800`
- Border: `border-gray-700`
- Title text: `text-gray-100`
- Close button hover: `hover:text-gray-200`

#### Chat Components
- Main background: `bg-gray-900`
- Chat area: `bg-gray-800`
- Message bubbles: User (`bg-blue-600`), Bot (`bg-gray-700`)
- Input field: `bg-gray-700 border-gray-600`
- Avatars: `bg-blue-600` for both users and bots

#### Interactive Elements
- Hover states: Lighten by one shade (e.g., `gray-700` → `gray-600`)
- Focus rings: `focus:ring-2 focus:ring-blue-500`
- Disabled states: Use `gray-500` for text, reduce opacity to 50%

## Authentication Pages

Authentication pages should use the established dark theme pattern:
- Dark centered layout with `Card` component (`bg-gray-800 border-gray-700`)
- Form inputs using `Input` component with dark styling
- Submit button using `Button` component with blue accent
- Error handling using `Alert` component with dark variants
- Links for navigation with `text-gray-400 hover:text-gray-200`
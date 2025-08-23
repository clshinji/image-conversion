# Project Structure & Organization

## Root Directory Layout

```
svg-to-png-converter/
├── .kiro/                      # Kiro IDE configuration
│   ├── specs/                  # Feature specifications
│   │   └── svg-to-png-converter/
│   │       ├── requirements.md # Detailed requirements
│   │       ├── design.md      # Technical design
│   │       └── tasks.md       # Implementation tasks
│   └── steering/              # AI assistant guidance
│       ├── product.md         # Product overview
│       ├── tech.md           # Technology stack
│       └── structure.md      # This file
├── index.html                 # Main application file
├── styles.css                # Complete stylesheet
├── script.js                 # All JavaScript logic
├── test.svg                  # Sample SVG for testing
└── .DS_Store                 # macOS system file
```

## Code Organization Principles

### HTML Structure (`index.html`)
- **Semantic HTML5**: Use appropriate semantic elements
- **Japanese Language**: `lang="ja"` attribute and Japanese text content
- **Accessibility**: Proper ARIA labels and semantic structure
- **Component Sections**:
  - Header with title and description
  - Upload section with drag-and-drop area
  - File info display section
  - Preview section (SVG and PNG side-by-side)
  - Controls section with buttons
  - Message area for feedback

### CSS Organization (`styles.css`)
- **Reset and Base Styles**: Normalize browser defaults
- **Component-based**: Styles organized by UI component
- **Responsive Design**: Mobile-first approach with media queries
- **Modern CSS**: Flexbox, Grid, CSS custom properties, gradients
- **Visual Hierarchy**: Clear typography and spacing system
- **Interactive States**: Hover, focus, active, disabled states

### JavaScript Architecture (`script.js`)
- **Class-based Structure**: Separate concerns into distinct classes
- **Global State**: Single `appState` instance for centralized state management
- **Event-driven**: UI updates triggered by state changes
- **Error Boundaries**: Comprehensive error handling at each layer

## Class Responsibilities

### `AppState`
- Centralized application state management
- State change notifications to UI
- Validation of state transitions
- History tracking for user operations

### `FileHandler`
- File validation (type, size, format)
- SVG content reading and parsing
- Preview generation and display
- File metadata extraction

### `SVGConverter`
- Canvas creation and SVG rendering
- PNG generation from Canvas
- Quality and size optimization
- Conversion error handling

### `UIController`
- Event listener management
- UI state synchronization
- User feedback (messages, loading states)
- Responsive behavior coordination

## Naming Conventions

### Files
- Use lowercase with hyphens for multi-word names
- Clear, descriptive names indicating purpose

### JavaScript
- **Classes**: PascalCase (e.g., `AppState`, `FileHandler`)
- **Variables/Functions**: camelCase (e.g., `currentFile`, `handleFileSelection`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **DOM Elements**: camelCase with descriptive names (e.g., `uploadArea`, `convertBtn`)

### CSS
- **Classes**: kebab-case (e.g., `.upload-area`, `.preview-content`)
- **IDs**: camelCase matching JavaScript (e.g., `#uploadArea`, `#convertBtn`)
- **BEM methodology** for complex components when needed

## State Management Flow

1. **User Action** → Event Handler
2. **Event Handler** → AppState Update
3. **AppState Change** → Notify Listeners
4. **Listeners** → UI Updates
5. **UI Updates** → Visual Feedback

## Error Handling Strategy

- **Validation Errors**: User-friendly Japanese messages
- **Processing Errors**: Graceful degradation with retry options
- **State Recovery**: Reset to safe state on critical errors
- **User Guidance**: Clear next steps in error messages

## Development Workflow

1. **Feature Development**: Update specs first, then implement
2. **Testing**: Manual testing in browser with various SVG files
3. **Debugging**: Use browser DevTools and console logging
4. **Validation**: Check responsive design and error scenarios
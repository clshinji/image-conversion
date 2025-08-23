---
inclusion: always
---

# Code Structure & Architecture Guidelines

## File Organization
- **Single-file architecture**: Keep HTML, CSS, and JavaScript in separate files but minimal
- **No external dependencies**: Use only vanilla web technologies
- **Test files**: Include sample SVG files for development and testing

## JavaScript Architecture Patterns

### Class Structure (Required)
```javascript
class AppState {
  // Centralized state management with change notifications
}

class FileHandler {
  // File validation, reading, and metadata extraction
}

class SVGConverter {
  // Canvas-based SVG to PNG conversion logic
}

class UIController {
  // Event handling and UI state synchronization
}
```

### State Management Rules
- Use single `appState` instance for centralized state
- All UI updates must be triggered by state changes
- Implement observer pattern for state change notifications
- Validate all state transitions before applying

### Error Handling Requirements
- Wrap all file operations in try-catch blocks
- Provide Japanese error messages for all user-facing errors
- Implement graceful degradation for conversion failures
- Always provide recovery options or clear next steps

## Naming Conventions

### JavaScript
- **Classes**: PascalCase (`AppState`, `FileHandler`)
- **Methods/Variables**: camelCase (`handleFileUpload`, `currentFile`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `SUPPORTED_FORMATS`)
- **DOM References**: camelCase matching element IDs (`uploadArea`, `previewContainer`)

### CSS
- **Classes**: kebab-case (`.upload-area`, `.preview-container`)
- **IDs**: camelCase to match JavaScript references (`#uploadArea`, `#previewContainer`)
- **CSS Custom Properties**: kebab-case with descriptive prefixes (`--color-primary`, `--spacing-large`)

### HTML
- **IDs**: camelCase for JavaScript integration
- **Classes**: kebab-case for styling
- **Data attributes**: kebab-case (`data-file-type`, `data-conversion-status`)

## Code Organization Rules

### HTML Structure
- Use semantic HTML5 elements (`<main>`, `<section>`, `<article>`)
- Include `lang="ja"` attribute for Japanese content
- Implement proper ARIA labels for accessibility
- Group related functionality in logical sections

### CSS Organization
- Start with CSS reset/normalize
- Organize by component, not by property type
- Use mobile-first responsive design approach
- Implement consistent spacing and typography scales
- Define interactive states for all clickable elements

### JavaScript Structure
- Initialize classes in dependency order
- Use event delegation for dynamic content
- Implement proper cleanup for Canvas and Blob objects
- Handle async operations with proper error boundaries

## Performance Guidelines
- Limit SVG file size to 10MB maximum
- Clean up Canvas contexts after PNG generation
- Revoke object URLs after download completion
- Implement loading states for long-running operations

## UI/UX Implementation Rules
- All user-facing text must be in polite Japanese (丁寧語)
- Provide immediate visual feedback for all user actions
- Show progress indicators for file processing
- Display clear success/error states with actionable messages
- Ensure responsive design works on mobile devices
---
inclusion: always
---

# Technology Stack & Implementation Guidelines

## Required Technologies
- **Vanilla JavaScript ES6+**: No external frameworks or libraries allowed
- **HTML5 Canvas API**: Primary method for SVG to PNG conversion
- **File API + FileReader**: Handle SVG file uploads and content reading
- **Drag and Drop API**: Enable intuitive file upload UX

## Critical Browser APIs
- `Canvas.getContext('2d')` - Core conversion engine
- `FileReader.readAsText()` - SVG content extraction
- `DOMParser.parseFromString()` - Safe SVG parsing
- `URL.createObjectURL()` + `URL.revokeObjectURL()` - Download management

## Mandatory Architecture Pattern
Use exactly these four classes with specific responsibilities:
```javascript
class AppState {
  // Single source of truth for application state
  // Must implement observer pattern for UI updates
}

class FileHandler {
  // File validation (10MB limit, SVG format check)
  // Error handling with Japanese messages
}

class SVGConverter {
  // Canvas-based conversion logic
  // Memory cleanup after each conversion
}

class UIController {
  // Event delegation and DOM manipulation
  // State change listeners only
}
```

## Code Style Requirements
- **Japanese UI Text**: All user-facing content in polite Japanese (丁寧語)
- **Error Handling**: Wrap all async operations in try-catch with Japanese error messages
- **Memory Management**: Always call `URL.revokeObjectURL()` and clear Canvas contexts
- **State Updates**: UI changes only through AppState notifications, never direct DOM manipulation

## Performance Constraints
- **File Size**: 10MB maximum, validate before processing
- **Canvas Cleanup**: Clear context and revoke URLs after each conversion
- **Timeout Handling**: Implement 30-second timeout for large file conversions
- **Mobile Optimization**: Test on iOS Safari and Android Chrome

## File Organization
- Single HTML file with embedded CSS and JavaScript (production)
- Separate files during development: `index.html`, `styles.css`, `script.js`
- Include test SVG files for validation

## Browser Compatibility
- **Required**: ES6 classes, Canvas API, File API, Drag/Drop API
- **Target**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile**: iOS Safari 12+, Android Chrome 60+
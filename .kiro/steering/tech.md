# Technology Stack & Build System

## Core Technologies

- **HTML5**: Semantic markup with modern web standards
- **CSS3**: Advanced styling with gradients, flexbox, grid, and responsive design
- **Vanilla JavaScript**: ES6+ features, no external frameworks or libraries
- **Canvas API**: For SVG to PNG conversion processing
- **File API**: For reading uploaded files
- **Drag and Drop API**: For intuitive file upload experience

## Browser APIs Used

- `FileReader` - Reading SVG file content
- `Canvas 2D Context` - Drawing SVG content for conversion
- `Blob` and `URL.createObjectURL()` - Generating downloadable PNG files
- `DOMParser` - Parsing SVG content safely

## Architecture Patterns

- **Class-based Organization**: Separate classes for different concerns
  - `AppState` - Centralized state management
  - `FileHandler` - File operations and validation
  - `SVGConverter` - Conversion logic
  - `UIController` - UI interactions and updates

- **Event-driven Architecture**: UI updates triggered by state changes
- **Separation of Concerns**: Clear boundaries between data, logic, and presentation

## Code Style Guidelines

- **Japanese Comments**: All code comments and UI text in Japanese
- **Descriptive Naming**: Use clear, descriptive variable and function names
- **Error Handling**: Comprehensive try-catch blocks with user-friendly messages
- **State Management**: Centralized state with proper change notifications
- **Responsive Design**: Mobile-first CSS approach

## File Structure

```
/
├── index.html          # Main application entry point
├── styles.css          # All styling and responsive design
├── script.js           # Complete application logic
└── test.svg           # Sample SVG file for testing
```

## Development Commands

Since this is a client-side only application:

- **Local Development**: Open `index.html` directly in browser or use a local server
- **Testing**: Use browser developer tools and manual testing
- **Debugging**: Browser DevTools console and network tab

## Browser Compatibility

- **Target**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Minimum**: Browsers supporting ES6, Canvas API, and File API
- **Mobile**: Responsive design for iOS Safari and Android Chrome

## Performance Considerations

- **File Size Limits**: 10MB maximum for SVG files
- **Memory Management**: Clean up Canvas and Blob objects after use
- **Processing Timeout**: Handle large file conversion timeouts gracefully
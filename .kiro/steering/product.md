---
inclusion: always
---

# Product Guidelines

## Core Product Principles

- **Client-side Only**: All processing must happen in the browser - never send files to servers
- **Japanese Interface**: All UI text, error messages, and user-facing content must be in Japanese
- **Privacy First**: Emphasize that files never leave the user's device
- **Single File Architecture**: Keep the application as a single HTML file with embedded CSS and JavaScript

## User Experience Requirements

### File Handling
- Support drag-and-drop and file picker for SVG uploads
- Maximum file size: 10MB
- Show clear file validation errors in Japanese
- Display file metadata (name, size, dimensions)

### Conversion Workflow
1. Upload SVG file
2. Display SVG preview
3. Convert to PNG using Canvas API
4. Show PNG preview side-by-side with original
5. Enable download of converted PNG

### UI/UX Standards
- Clean, minimal interface with clear visual hierarchy
- Responsive design for mobile, tablet, and desktop
- Loading states during conversion process
- Success/error feedback with Japanese messages
- Accessible design with proper ARIA labels

## Technical Constraints

- **No External Dependencies**: Use only vanilla JavaScript, HTML5, and CSS3
- **Browser Compatibility**: Support modern browsers with Canvas API and File API
- **Performance**: Handle files up to 10MB efficiently
- **Error Recovery**: Graceful handling of conversion failures with user guidance

## Content Guidelines

- Use polite Japanese (丁寧語) for all user-facing text
- Provide clear instructions for each step
- Error messages should be helpful and actionable
- Success messages should confirm completion and next steps

## Quality Standards

- Validate SVG content before processing
- Maintain image quality during conversion
- Handle edge cases (corrupted files, unsupported SVG features)
- Provide fallback options when conversion fails
# Morse Code Typing System

A comprehensive Morse code learning and typing application with practice and challenge modes, featuring real-time feedback, scoring, and adaptive timing.

## Features

### Core Functionality

- **Single-key input**: Uses spacebar (configurable) for all Morse code input
- **Real-time timing analysis**: Distinguishes dots, dashes, and pauses based on press duration
- **Adaptive timing**: Adjusts thresholds based on user WPM settings
- **Visual feedback**: Progress bars, character prediction, timing guides, and target word highlighting

### Practice Mode

- Free-form Morse code typing
- Real-time character prediction
- Word completion detection
- Statistics tracking (characters, words, time, WPM)

### Challenge Mode

- **Random word challenges**: Fetches random words from API for typing practice
- **Real-time highlighting**: Target word highlights in green as you type correct characters
- **Scoring system**: Points awarded based on word length using arithmetic series formula
- **Performance feedback**: Success/failure dialogs with detailed scoring
- **Score persistence**: Maintains score across mode switches

### Additional Features

- **Export options**: Plain text, Morse log, and detailed JSON reports
- **Settings**: Customizable key binding, WPM targets, themes, and custom Morse codes
- **Audio feedback**: Beeps for dots and dashes
- **Responsive UI**: Dark/light theme support

## Project Structure

```
morse-typing-system/
├── index.html                    # Main UI layout (moved from src/html/)
├── css/
│   └── styles.css                # Styling with themes and animations
├── js/
│   └── modules/
│       ├── App.js                # Main application logic and UI orchestration
│       ├── MorseInputHandler.js  # Key input handling and timing
│       ├── MorseParser.js        # Morse-to-text conversion and custom codes
│       └── TimingEngine.js       # WPM calculations and timing thresholds
├── netlify.toml                  # Netlify deployment configuration
├── .gitignore                    # Git ignore rules
├── babel.config.cjs              # Babel configuration
├── package.json                  # Dependencies and scripts
├── PROJECT_COMPLETE.md           # Project completion documentation
├── README.md                     # This file
├── spec_morse_typing.txt         # Project specifications
├── src/                          # Original source files (for development)
│   ├── css/
│   ├── html/
│   └── js/
└── test/
    └── unit/                     # Comprehensive unit test suite
        ├── App.test.js           # App logic and Challenge mode tests
        ├── MorseInputHandler.test.js
        ├── MorseParser.test.js
        └── TimingEngine.test.js
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. For local development, open `index.html` in your browser

## Deployment to Netlify

### Option 1: Direct Upload

1. Build/copy files to root structure:
   ```bash
   # Files are already restructured for deployment
   # index.html, css/, js/ are at root level
   ```
2. Go to [Netlify](https://netlify.com)
3. Drag and drop the entire project folder or zip it first
4. Netlify will automatically detect and deploy

### Option 2: Git Integration

1. Push your code to GitHub/GitLab
2. Connect your repository to Netlify
3. Netlify will auto-deploy on pushes to main branch

### Configuration

- `netlify.toml` configures the build settings
- Publish directory is set to root (`.`)
- No build command needed (static site)
- SPA redirect configured for client-side routing

## Usage

### Basic Operation

1. **Choose Mode**:

   - **Practice**: Free typing with statistics
   - **Challenge**: Type random words for points

2. **Morse Code Input**:
   - Press and hold spacebar for dots (50-200ms)
   - Press and hold longer for dashes (300-800ms)
   - Pause between elements (50-300ms)
   - Pause longer between letters (500-1200ms)
   - Pause even longer between words (1500ms+)

### Challenge Mode Features

- **Target Word Display**: Shows the word you need to type
- **Real-time Highlighting**: Correctly typed characters turn green in the target word
- **Scoring**: Earn points based on word length (longer words = more points)
- **Feedback Dialogs**: Success shows points earned, failure shows final score before reset

### Settings

- Click "Settings" to adjust:
  - Key binding (default: spacebar)
  - Target WPM for timing calibration
  - Theme (dark/light)
  - Custom Morse code mappings
  - Unknown character handling

### Export Options

- **Text**: Plain text output
- **Morse Log**: Detailed timing and sequence data
- **JSON Report**: Comprehensive session statistics

## Architecture

### Core Modules

- **App.js**: Main orchestrator handling UI, mode switching, Challenge logic, and user interactions
- **MorseInputHandler.js**: Manages keyboard input, detects press/release events, and classifies timing
- **MorseParser.js**: Converts Morse sequences to characters, supports custom mappings
- **TimingEngine.js**: Calculates WPM, manages timing thresholds, classifies pauses

### Challenge Mode Logic

- **Word Fetching**: Retrieves random words from external API
- **Progress Tracking**: Monitors typing progress against target word
- **Scoring Algorithm**: Uses `score(n) = n(n+1)/2` for arithmetic series progression
- **State Management**: Handles score persistence and mode transitions

### Timing Specifications

- **Dot**: 50-200ms press
- **Dash**: 300-800ms press
- **Element separator**: 50-300ms pause
- **Letter separator**: 500-1200ms pause
- **Word separator**: 1500ms+ pause

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Test coverage includes:

- Input handling and timing classification
- Morse code parsing and character lookup
- Timing calculations and WPM computation
- Challenge mode logic and scoring
- UI interactions and export functionality
- Mode switching and state management

## Development

### Adding New Features

1. Create new functionality in appropriate module
2. Add comprehensive tests in `test/unit/`
3. Update UI components if needed
4. Ensure all tests pass

### Morse Code Reference

Supports standard International Morse Code plus custom mappings:

- A: .-
- B: -...
- C: -.-.
- D: -..
- E: .
- F: ..-.
- G: --.
- H: ....
- I: ..
- J: .---
- K: -.-
- L: .-..
- M: --
- N: -.
- O: ---
- P: .--.
- Q: --.-
- R: .-.
- S: ...
- T: -
- U: ..-
- V: ...-
- W: .--
- X: -..-
- Y: -.--
- Z: --..
- Numbers 0-9 and custom characters

## License

This project is open source. See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Author

© 2025 - Developed by Eggplant203 🍆

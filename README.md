# EssentiaTest: Music Analysis Visualization

A data visualization demonstration that analyzes audio files from a Hugging Face dataset using `essentia.js` within a `p5.js` project.

## Features

### Audio Analysis
- **Essentia.js Integration**: Uses both imperative and neural methods for music information retrieval (MIR)
- **Energy Analysis**: Measures audio energy levels using RMS
- **Mood Detection**: Estimates mood based on spectral analysis
- **Key Detection**: Identifies the musical key of each audio clip
- **Tempo Estimation**: Calculates BPM using beat tracking
- **Structure Classification**: Categorizes clips into song sections (hook, verse, pre-chorus, chorus, outro)

### Visualization Modes

#### 1. Energy/Mood Grid
- **X-axis**: Energy level (low to high)
- **Y-axis**: Mood/affect (sad to happy)
- Positions audio clips based on their analyzed energy and mood characteristics

#### 2. Circle of Fifths
- Arranges audio clips around the circle of fifths based on their detected musical key
- Shows harmonic relationships between different clips

#### 3. Song Structure Categories
- Groups clips into 5 categories: Hook, Verse, Pre-Chorus, Chorus, Outro
- Based on analysis of energy levels and onset detection

### Audio Playback Controls
- **Play/Pause**: Click the play button to start/stop playback
- **Scrubbing**: Click on the progress bar to seek to specific timestamps
- **Restart**: Click the restart button to return to the beginning
- **State Management**: Only one audio clip can play at a time

### UI/UX Features
- **Fullscreen Canvas**: Responsive design that adapts to screen resizing
- **Mode Switching**: Dropdown menu to change between visualization modes
- **Modern Design**: Dark theme with orange accents inspired by jaffx.audio color palette
- **Interactive Elements**: Hover effects and visual feedback

## Technical Implementation

### Libraries Used
- **p5.js**: Canvas rendering and interaction handling
- **p5.sound.js**: Audio playback capabilities
- **essentia.js**: Music information retrieval and analysis

### Architecture
- **AudioManager.js**: Handles audio loading, playback, and state management
- **EssentiaAnalyzer.js**: Performs music analysis using Essentia.js algorithms
- **AudioPlayerUI.js**: Creates interactive UI components for each audio clip
- **sketch.js**: Main application logic and visualization rendering

### Data Source
- **Dataset**: `joeljaffesd/jamlog` on Hugging Face
- **Content**: Collection of solo guitar and bass guitar recordings
- **Fallback**: Mock data generation when dataset is unavailable

## Usage

1. **Start the Application**: Open `index.html` in a web browser
2. **Select Visualization Mode**: Use the dropdown in the top-left to change modes
3. **Interact with Audio**: Click on any audio player to control playback
4. **Explore Analysis**: See how clips are positioned based on their musical characteristics

## Development

### Local Server
To run locally with proper CORS handling:
```bash
cd assignments/assignment4
python3 -m http.server 8080
```
Then visit `http://localhost:8080`

### File Structure
```
assignment4/
├── index.html
├── sketch.js
├── style.css
├── js/
│   ├── AudioManager.js
│   ├── EssentiaAnalyzer.js
│   └── AudioPlayerUI.js
└── libraries/
    ├── p5.min.js
    ├── p5.sound.min.js
    └── essentia.js-core.min.js (loaded from CDN)
```

## Future Enhancements
- Real-time audio analysis during playback
- Additional visualization modes (tempo/rhythm grid, genre clustering)
- User-uploaded audio file support
- Export functionality for analysis results
- Performance optimizations for larger datasets
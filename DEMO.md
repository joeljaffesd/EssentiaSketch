# EssentiaTest Demo Features

## What to Expect When Running the Application

### Initial Load
- Loading screen with "Analyzing audio dataset with Essentia.js" message
- App initializes with dummy audio data (5 sample files)
- Default view shows Energy/Mood Grid visualization mode

### Audio Player Interface
Each audio file is represented by an interactive player UI showing:
- **File name** (e.g., "guitar_sample_1.mp3", "bass_sample_2.mp3")
- **Time display** (current time / total duration)
- **Progress bar** (clickable for seeking)
- **Play/pause button** (triangle for play, two bars for pause)
- **Restart button** (arrow pointing left)

### Visualization Modes

#### Energy/Mood Grid (Default)
- Grid with energy axis (horizontal) and mood axis (vertical)
- Audio players positioned based on analyzed characteristics:
  - High energy, happy mood → top right
  - Low energy, sad mood → bottom left
  - Mixed characteristics → scattered throughout grid

#### Circle of Fifths
- Circular arrangement showing musical key relationships
- Key labels around the circle (C, G, D, A, E, B, F#, etc.)
- Audio players positioned based on detected musical key
- Demonstrates harmonic relationships between clips

#### Song Structure Categories
- Five horizontal sections: Hook, Verse, Pre-Chorus, Chorus, Outro
- Audio players grouped by their structural classification
- Shows how different clips fit into typical song arrangements

### Interactive Features
1. **Mode Switching**: Dropdown in top-left changes visualization
2. **Audio Playback**: 
   - Click play button to start audio (simulated for dummy data)
   - Only one clip plays at a time
   - Progress bar shows playback position
3. **Seeking**: Click anywhere on progress bar to jump to that position
4. **Visual Feedback**: 
   - Hover effects on audio players
   - Playing clips highlighted with green accent
   - Smooth transitions when switching modes

### Technical Demonstrations
- **Essentia.js Integration**: Real music analysis algorithms (mock data for demo)
- **p5.js Canvas**: Fullscreen responsive visualization
- **State Management**: Proper audio playback coordination
- **Modern UI**: Dark theme with jaffx.audio inspired color palette

### Sample Data Characteristics
The dummy data includes varied examples:
- **Guitar Sample 1**: Medium energy, moderate mood (C major, 120 BPM, verse)
- **Bass Sample 1**: High energy, darker mood (G major, 140 BPM, chorus)
- **Guitar Sample 2**: Low energy, happy mood (F major, 90 BPM, hook)
- **Bass Sample 2**: Balanced characteristics (D major, 110 BPM, pre-chorus)
- **Guitar Sample 3**: Low energy, bright mood (A major, 75 BPM, outro)

This creates a good spread across all visualization modes to demonstrate the analysis and positioning algorithms.
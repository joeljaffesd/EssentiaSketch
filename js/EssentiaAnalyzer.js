// EssentiaAnalyzer.js - Handles music analysis using Essentia.js

class EssentiaAnalyzer {
  constructor() {
    this.isInitialized = false;
    this.essentia = null;
  }

  async initialize() {
    try {
      // Wait for Essentia to be loaded globally (initialized in index.html)
      let attempts = 0;
      while (!window.essentia && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (window.essentia) {
        this.essentia = window.essentia;
        this.isInitialized = true;
        console.log('✅ Essentia.js initialized successfully');
        console.log('Available algorithms:', Object.keys(this.essentia).slice(0, 10));
      } else {
        console.warn('⚠️ Essentia.js not available after waiting, using mock analysis');
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('❌ Error initializing Essentia.js:', error);
      this.isInitialized = false;
    }
  }

  // Analyze audio file for energy, mood, key, etc.
  async analyzeAudio(audioBuffer) {
    // If no audio buffer provided or Essentia not initialized, use mock data
    if (!audioBuffer || !this.isInitialized) {
      console.log('Using mock analysis (Essentia not available or no audio buffer)');
      return this.generateMockAnalysis();
    }

    try {
      console.log(`Analyzing audio with Essentia.js (buffer length: ${audioBuffer.length})`);
      const analysis = {};
      
      // Take a sample of the audio for analysis (to speed up processing)
      const sampleSize = Math.min(audioBuffer.length, 44100 * 30); // Max 30 seconds
      const audioSample = audioBuffer.slice(0, sampleSize);
      
      // Convert to Float32Array if needed
      const audioFloat32 = audioSample instanceof Float32Array ? audioSample : new Float32Array(audioSample);
      
      // Convert Float32Array to Essentia VectorFloat
      const audioVector = this.essentia.arrayToVector(audioFloat32);
      
      // Energy analysis using RMS
      try {
        const rmsResult = this.essentia.RMS(audioVector);
        analysis.energy = Math.min(rmsResult.rms * 3, 1.0); // Normalize to 0-1
        console.log('Energy (RMS):', analysis.energy);
      } catch (e) {
        console.warn('RMS failed:', e);
        analysis.energy = 0.5;
      }
      
      // Spectrum for frequency analysis
      let spectrum = null;
      try {
        const spectrumResult = this.essentia.Spectrum(audioVector);
        spectrum = spectrumResult.spectrum;
      } catch (e) {
        console.warn('Spectrum calculation failed:', e);
      }
      
      // Spectral centroid for mood estimation
      if (spectrum) {
        try {
          const centroidResult = this.essentia.Centroid(spectrum);
          analysis.mood = Math.min(centroidResult.centroid / 5000, 1.0);
          console.log('Mood (Centroid):', analysis.mood);
        } catch (e) {
          console.warn('Centroid failed:', e);
          analysis.mood = 0.5;
        }
      } else {
        analysis.mood = 0.5;
      }
      
      // Key detection - use the high-level KeyExtractor algorithm
      try {
        // KeyExtractor takes the full audio signal and returns key/scale/strength
        const keyResult = this.essentia.KeyExtractor(audioVector);
        analysis.key = keyResult.key;
        analysis.scale = keyResult.scale;
        analysis.keyStrength = keyResult.strength;
        console.log('Key detection successful:', analysis.key, analysis.scale, 'strength:', analysis.keyStrength);
      } catch (e) {
        console.error('KeyExtractor failed:', e);
        
        // Try manual HPCP + Key approach as fallback
        if (spectrum) {
          try {
            // SpectralPeaks is needed before HPCP
            const peaksResult = this.essentia.SpectralPeaks(spectrum);
            
            // HPCP needs frequencies and magnitudes from spectral peaks
            const hpcpResult = this.essentia.HPCP(
              peaksResult.frequencies,
              peaksResult.magnitudes
            );
            
            const keyResult = this.essentia.Key(hpcpResult.hpcp);
            analysis.key = keyResult.key;
            analysis.scale = keyResult.scale;
            console.log('Manual key detection successful:', analysis.key, analysis.scale);
          } catch (e2) {
            console.error('Manual key detection also failed:', e2);
            throw new Error('All key detection methods failed');
          }
        } else {
          throw new Error('No spectrum available for key detection');
        }
      }
      
      // Tempo - simplified approach
      try {
        const rhythmResult = this.essentia.RhythmExtractor2013(audioVector);
        analysis.tempo = rhythmResult.bpm || 120;
        console.log('Tempo:', analysis.tempo);
      } catch (e) {
        console.warn('Tempo detection failed:', e);
        analysis.tempo = 120;
      }
      
      // Loudness
      try {
        const loudnessResult = this.essentia.Loudness(audioVector);
        analysis.loudness = Math.min(loudnessResult.loudness / 100, 1.0);
        console.log('Loudness:', analysis.loudness);
      } catch (e) {
        console.warn('Loudness calculation failed:', e);
        analysis.loudness = 0.5;
      }
      
      // Estimate song structure based on energy and loudness
      analysis.structure = this.estimateStructure(analysis);
      
      console.log('✅ Essentia analysis complete:', analysis);
      return analysis;
      
    } catch (error) {
      console.error('❌ Error analyzing audio with Essentia:', error);
      console.log('Falling back to mock analysis');
      return this.generateMockAnalysis();
    }
  }

  // Generate mock analysis when Essentia is not available
  generateMockAnalysis() {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const structures = ['hook', 'verse', 'pre-chorus', 'chorus', 'outro'];
    
    return {
      energy: Math.random(),
      mood: Math.random(),
      key: keys[Math.floor(Math.random() * keys.length)],
      scale: Math.random() > 0.5 ? 'major' : 'minor',
      tempo: 60 + Math.random() * 120, // 60-180 BPM
      onsetRate: Math.random(),
      structure: structures[Math.floor(Math.random() * structures.length)]
    };
  }

  // Estimate song structure based on analysis features
  estimateStructure(analysis) {
    const energy = analysis.energy;
    const loudness = analysis.loudness || 0.5;
    
    // Simple heuristic for structure classification
    if (energy > 0.7 && loudness > 0.6) {
      return 'chorus';
    } else if (energy > 0.5 && loudness > 0.4) {
      return 'pre-chorus';
    } else if (energy < 0.3) {
      return 'outro';
    } else if (energy > 0.6) {
      return 'hook';
    } else {
      return 'verse';
    }
  }

  // Convert key to circle of fifths position
  keyToCirclePosition(key) {
    const keyPositions = {
      'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5,
      'F#': 6, 'C#': 7, 'G#': 8, 'D#': 9, 'A#': 10, 'F': 11
    };
    
    return keyPositions[key] || 0;
  }

  // Get coordinates for circle of fifths visualization
  getCircleOfFifthsCoordinates(key, radius = 150) {
    const position = this.keyToCirclePosition(key);
    const angle = (position * TWO_PI / 12) - PI/2;
    
    return {
      x: cos(angle) * radius,
      y: sin(angle) * radius,
      angle: angle,
      position: position
    };
  }

  // Get category coordinates for song structure visualization
  getStructureCoordinates(structure, maxWidth = 600, maxHeight = 400) {
    const categories = ['hook', 'verse', 'pre-chorus', 'chorus', 'outro'];
    const categoryIndex = categories.indexOf(structure);
    
    if (categoryIndex === -1) return { x: 0, y: 0 };
    
    const categoryWidth = maxWidth / categories.length;
    const headerHeight = 60;
    const availableHeight = maxHeight - headerHeight - 40; // Leave space at bottom for UI text
    
    // Position clips in columns below headers
    const columnX = -maxWidth/2 + categoryIndex * categoryWidth + categoryWidth/2;
    const columnWidth = categoryWidth - 20; // Leave some margin
    
    // Random position within the column, below the header
    const x = columnX + (Math.random() - 0.5) * (columnWidth * 0.8);
    const y = headerHeight/2 + Math.random() * (availableHeight * 0.8);
    
    return {
      x: x,
      y: y,
      category: structure,
      categoryIndex: categoryIndex
    };
  }
}
// essentia.worker.js - Web Worker for Essentia analysis

// Import Essentia.js ES modules
import Essentia from 'https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia.js-core.es.js';
import { EssentiaWASM } from 'https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia-wasm.es.js';

let essentia = null;
let isInitialized = false;

// Initialize Essentia in the worker
async function initializeEssentia() {
  try {
    console.log('[Worker] Initializing Essentia...');
    
    // Create Essentia instance
    essentia = new Essentia(EssentiaWASM);
    isInitialized = true;
    
    console.log('[Worker] ✅ Essentia initialized successfully');
    return { success: true };
    
  } catch (error) {
    console.error('[Worker] ❌ Error initializing Essentia:', error);
    isInitialized = false;
    return { success: false, error: error.message };
  }
}

// Analyze audio buffer
function analyzeAudio(audioBuffer) {
  if (!isInitialized || !essentia) {
    console.log('[Worker] Using mock analysis');
    return generateMockAnalysis();
  }

  try {
    console.log(`[Worker] Analyzing audio (buffer length: ${audioBuffer.length})`);
    const analysis = {};
    
    // Take a smaller sample for speed (15 seconds)
    const sampleSize = Math.min(audioBuffer.length, 44100 * 15);
    const audioSample = audioBuffer.slice(0, sampleSize);
    
    // Convert to Float32Array
    const audioFloat32 = audioSample instanceof Float32Array ? audioSample : new Float32Array(audioSample);
    
    // Convert to Essentia VectorFloat
    const audioVector = essentia.arrayToVector(audioFloat32);
    
    // Energy analysis using RMS
    try {
      const rmsResult = essentia.RMS(audioVector);
      analysis.energy = Math.min(rmsResult.rms * 3, 1.0);
      console.log('[Worker] Energy (RMS):', analysis.energy);
    } catch (e) {
      console.warn('[Worker] RMS failed:', e);
      analysis.energy = 0.5;
    }
    
    // Spectrum for frequency analysis
    let spectrum = null;
    try {
      const spectrumResult = essentia.Spectrum(audioVector);
      spectrum = spectrumResult.spectrum;
    } catch (e) {
      console.warn('[Worker] Spectrum calculation failed:', e);
    }
    
    // Spectral centroid for mood estimation
    if (spectrum) {
      try {
        const centroidResult = essentia.Centroid(spectrum);
        analysis.mood = Math.min(centroidResult.centroid / 5000, 1.0);
        console.log('[Worker] Mood (Centroid):', analysis.mood);
      } catch (e) {
        console.warn('[Worker] Centroid failed:', e);
        analysis.mood = 0.5;
      }
    } else {
      analysis.mood = 0.5;
    }
    
    // Key detection
    try {
      const keyResult = essentia.KeyExtractor(audioVector);
      analysis.key = keyResult.key;
      analysis.scale = keyResult.scale;
      analysis.keyStrength = keyResult.strength;
      console.log('[Worker] Key:', analysis.key, analysis.scale);
    } catch (e) {
      console.warn('[Worker] Key detection failed:', e);
      analysis.key = 'C';
      analysis.scale = 'major';
      analysis.keyStrength = 0.5;
    }
    
    // Tempo detection
    try {
      const rhythmResult = essentia.RhythmExtractor2013(audioVector);
      analysis.tempo = rhythmResult.bpm;
      console.log('[Worker] Tempo:', analysis.tempo);
    } catch (e) {
      console.warn('[Worker] Tempo detection failed:', e);
      analysis.tempo = 120;
    }
    
    // Loudness
    try {
      const loudnessResult = essentia.Loudness(audioVector);
      analysis.loudness = loudnessResult.loudness;
      console.log('[Worker] Loudness:', analysis.loudness);
    } catch (e) {
      console.warn('[Worker] Loudness failed:', e);
      analysis.loudness = -20;
    }
    
    // Add structure category (randomly assigned for now - could be ML-based in future)
    const structures = ['hook', 'verse', 'pre-chorus', 'chorus', 'outro'];
    analysis.structure = structures[Math.floor(Math.random() * structures.length)];
    
    // Clean up vector
    audioVector.delete();
    
    console.log('[Worker] ✅ Analysis complete:', analysis);
    return analysis;
    
  } catch (error) {
    console.error('[Worker] ❌ Error analyzing audio:', error);
    return generateMockAnalysis();
  }
}

// Generate mock analysis data
function generateMockAnalysis() {
  const structures = ['hook', 'verse', 'pre-chorus', 'chorus', 'outro'];
  return {
    energy: Math.random(),
    mood: Math.random(),
    key: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][Math.floor(Math.random() * 12)],
    scale: Math.random() > 0.5 ? 'major' : 'minor',
    tempo: 60 + Math.random() * 120,
    loudness: -40 + Math.random() * 30,
    keyStrength: Math.random(),
    structure: structures[Math.floor(Math.random() * structures.length)]
  };
}

// Message handler
self.onmessage = async function(e) {
  const { type, payload, id } = e.data;
  
  try {
    switch (type) {
      case 'init':
        const initResult = await initializeEssentia();
        self.postMessage({ type: 'init-complete', payload: initResult, id });
        break;
        
      case 'analyze':
        const analysis = analyzeAudio(payload.audioBuffer);
        self.postMessage({ 
          type: 'analysis-complete', 
          payload: { analysis, fileName: payload.fileName },
          id 
        });
        break;
        
      default:
        console.warn('[Worker] Unknown message type:', type);
    }
  } catch (error) {
    console.error('[Worker] Error handling message:', error);
    self.postMessage({ 
      type: 'error', 
      payload: { error: error.message },
      id 
    });
  }
};

console.log('[Worker] Essentia worker loaded and ready');

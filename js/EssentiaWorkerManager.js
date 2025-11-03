// EssentiaWorkerManager.js - Manages Web Worker for Essentia analysis

class EssentiaWorkerManager {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.messageId = 0;
    this.pendingMessages = new Map();
  }

  async initialize() {
    try {
      console.log('🔧 Initializing Essentia Web Worker...');
      
      // Create the worker
      this.worker = new Worker('js/essentia.worker.js', { type: 'module' });
      
      // Set up message handler
      this.worker.onmessage = (e) => this.handleMessage(e);
      
      // Set up error handler
      this.worker.onerror = (error) => {
        console.error('❌ Worker error:', error);
      };
      
      // Send init message and wait for response
      const initResult = await this.sendMessage('init', {});
      
      if (initResult.success) {
        this.isInitialized = true;
        console.log('✅ Essentia Web Worker initialized successfully');
        return true;
      } else {
        console.warn('⚠️ Worker initialization failed:', initResult.error);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error initializing worker:', error);
      this.isInitialized = false;
      return false;
    }
  }

  handleMessage(e) {
    const { type, payload, id } = e.data;
    
    // Find the pending promise for this message
    const pending = this.pendingMessages.get(id);
    
    if (!pending) {
      console.warn('Received message with unknown id:', id);
      return;
    }
    
    // Remove from pending
    this.pendingMessages.delete(id);
    
    // Resolve or reject based on message type
    if (type === 'error') {
      pending.reject(new Error(payload.error));
    } else {
      pending.resolve(payload);
    }
  }

  sendMessage(type, payload) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      
      // Store the promise callbacks
      this.pendingMessages.set(id, { resolve, reject });
      
      // Send message to worker
      this.worker.postMessage({ type, payload, id });
      
      // Timeout after 60 seconds
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error('Worker message timeout'));
        }
      }, 60000);
    });
  }

  async analyzeAudio(audioBuffer, fileName = 'unknown') {
    if (!this.isInitialized) {
      console.warn('⚠️ Worker not initialized, using mock analysis');
      return this.generateMockAnalysis();
    }

    try {
      console.log(`🔄 [Worker] Sending ${fileName} for analysis...`);
      
      // Send audio buffer to worker
      const result = await this.sendMessage('analyze', {
        audioBuffer: audioBuffer,
        fileName: fileName
      });
      
      console.log(`✅ [Worker] Analysis complete for ${fileName}`);
      return result.analysis;
      
    } catch (error) {
      console.error(`❌ [Worker] Error analyzing ${fileName}:`, error);
      return this.generateMockAnalysis();
    }
  }

  generateMockAnalysis() {
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

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('🛑 Worker terminated');
    }
  }

  // Utility methods for visualization

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
    let categoryIndex = categories.indexOf(structure);
    
    // If structure not found, assign to a random category
    if (categoryIndex === -1) {
      categoryIndex = Math.floor(Math.random() * categories.length);
      console.warn(`Unknown structure "${structure}", randomly assigned to ${categories[categoryIndex]}`);
    }
    
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
      category: structure || categories[categoryIndex],
      categoryIndex: categoryIndex
    };
  }
}

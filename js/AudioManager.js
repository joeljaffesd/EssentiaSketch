// AudioManager.js - Handles audio playback and state management

class AudioManager {
  constructor() {
    this.audioFiles = [];
    this.currentPlayingAudio = null;
    this.loadedAudioObjects = new Map();
    this.audioContext = null; // Will be initialized when needed
  }

  // Load audio files from Hugging Face dataset
  async loadAudioDataset() {
    try {
      console.log('🔄 Loading audio dataset from Hugging Face...');
      
      // First, get the main directory structure
      const mainUrl = 'https://huggingface.co/api/datasets/joeljaffesd/jamlog/tree/main';
      console.log(`🔗 Fetching main directory: ${mainUrl}`);
      
      const mainResponse = await fetch(mainUrl, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!mainResponse.ok) {
        throw new Error(`HTTP ${mainResponse.status}: ${mainResponse.statusText}`);
      }
      
      const mainData = await mainResponse.json();
      console.log('📊 Main directory contents:', mainData);
      
      // Find all subdirectories (date folders)
      const subdirectories = mainData.filter(item => item.type === 'directory');
      console.log(`📁 Found ${subdirectories.length} subdirectories`);
      
      // Collect all audio files from all subdirectories
      let allAudioFiles = [];
      
      for (const dir of subdirectories) {
        try {
          console.log(`🔍 Exploring directory: ${dir.path}`);
          
          // First check if there's an 'audio' subdirectory
          const dirUrl = `https://huggingface.co/api/datasets/joeljaffesd/jamlog/tree/main/${dir.path}`;
          const dirResponse = await fetch(dirUrl, {
            headers: { 'Accept': 'application/json' }
          });
          
          if (dirResponse.ok) {
            const dirData = await dirResponse.json();
            
            // Look for audio subdirectory
            const audioSubdir = dirData.find(item => item.type === 'directory' && item.path.endsWith('/audio'));
            
            if (audioSubdir) {
              console.log(`🎵 Found audio subdirectory: ${audioSubdir.path}`);
              
              // Fetch files from the audio subdirectory
              const audioUrl = `https://huggingface.co/api/datasets/joeljaffesd/jamlog/tree/main/${audioSubdir.path}`;
              const audioResponse = await fetch(audioUrl, {
                headers: { 'Accept': 'application/json' }
              });
              
              if (audioResponse.ok) {
                const audioData = await audioResponse.json();
                
                // Filter for audio files
                const audioFiles = audioData.filter(file => {
                  const isFile = file.type === 'file';
                  const isAudio = file.path && (
                    file.path.endsWith('.mp3') || 
                    file.path.endsWith('.wav') || 
                    file.path.endsWith('.ogg') ||
                    file.path.endsWith('.m4a') ||
                    file.path.endsWith('.flac')
                  );
                  return isFile && isAudio;
                });
                
                console.log(`🎶 Found ${audioFiles.length} audio files in ${audioSubdir.path}`);
                allAudioFiles.push(...audioFiles);
              }
            } else {
              // Fallback: look for audio files directly in the date directory
              const audioFiles = dirData.filter(file => {
                const isFile = file.type === 'file';
                const isAudio = file.path && (
                  file.path.endsWith('.mp3') || 
                  file.path.endsWith('.wav') || 
                  file.path.endsWith('.ogg') ||
                  file.path.endsWith('.m4a') ||
                  file.path.endsWith('.flac')
                );
                return isFile && isAudio;
              });
              
              console.log(`🎶 Found ${audioFiles.length} audio files directly in ${dir.path}`);
              allAudioFiles.push(...audioFiles);
            }
            
          }
        } catch (dirError) {
          console.warn(`⚠️ Failed to explore ${dir.path}:`, dirError.message);
        }
      }
      
      if (allAudioFiles.length === 0) {
        throw new Error('No audio files found in any subdirectory');
      }
      
      // Create audio file objects with metadata
      this.audioFiles = allAudioFiles.map((file, index) => ({
        id: index,
        name: file.path.split('/').pop(),
        url: `https://huggingface.co/datasets/joeljaffesd/jamlog/resolve/main/${file.path}`,
        path: file.path,
        size: file.size || 'Unknown',
        duration: 0,
        analysis: null,
        audioElement: null,
        isLoaded: false,
        isPlaying: false,
        currentTime: 0
      }));
      
      console.log(`🎵 Successfully loaded ${this.audioFiles.length} audio files:`);
      this.audioFiles.forEach(file => {
        console.log(`  - ${file.name} (${file.size} bytes)`);
      });
      
      return this.audioFiles;
      
    } catch (error) {
      console.error('❌ Error loading audio dataset from Hugging Face:', error);
      console.log('📦 Falling back to dummy data for demonstration...');
      
      // Fallback: create dummy data for testing
      this.audioFiles = this.createDummyAudioData();
      return this.audioFiles;
    }
  }

  createDummyAudioData() {
    // Create dummy audio data for testing when dataset isn't available
    return [
      {
        id: 0,
        name: 'guitar_sample_1.mp3',
        url: null, // Will be handled differently for dummy data
        duration: 120,
        analysis: {
          energy: 0.7,
          mood: 0.6,
          key: 'C',
          tempo: 120,
          structure: 'verse'
        },
        isLoaded: true,
        isPlaying: false,
        currentTime: 0
      },
      {
        id: 1,
        name: 'bass_sample_1.mp3',
        url: null,
        duration: 95,
        analysis: {
          energy: 0.8,
          mood: 0.3,
          key: 'G',
          tempo: 140,
          structure: 'chorus'
        },
        isLoaded: true,
        isPlaying: false,
        currentTime: 0
      },
      {
        id: 2,
        name: 'guitar_sample_2.mp3',
        url: null,
        duration: 180,
        analysis: {
          energy: 0.4,
          mood: 0.8,
          key: 'F',
          tempo: 90,
          structure: 'hook'
        },
        isLoaded: true,
        isPlaying: false,
        currentTime: 0
      },
      {
        id: 3,
        name: 'bass_sample_2.mp3',
        url: null,
        duration: 156,
        analysis: {
          energy: 0.6,
          mood: 0.5,
          key: 'D',
          tempo: 110,
          structure: 'pre-chorus'
        },
        isLoaded: true,
        isPlaying: false,
        currentTime: 0
      },
      {
        id: 4,
        name: 'guitar_sample_3.mp3',
        url: null,
        duration: 203,
        analysis: {
          energy: 0.2,
          mood: 0.7,
          key: 'A',
          tempo: 75,
          structure: 'outro'
        },
        isLoaded: true,
        isPlaying: false,
        currentTime: 0
      }
    ];
  }

  // Load and analyze audio file
  async loadAudio(audioFile) {
    if (audioFile.isLoaded) return audioFile;

    try {
      if (audioFile.url) {
        // Load real audio file
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = audioFile.url;
        
        return new Promise((resolve, reject) => {
          audio.addEventListener('loadedmetadata', () => {
            audioFile.duration = audio.duration;
            audioFile.audioElement = audio;
            audioFile.isLoaded = true;
            this.loadedAudioObjects.set(audioFile.id, audio);
            resolve(audioFile);
          });
          
          audio.addEventListener('error', (e) => {
            console.error('Error loading audio:', e);
            reject(e);
          });
          
          audio.load();
        });
      } else {
        // Dummy data is already "loaded"
        audioFile.isLoaded = true;
        return audioFile;
      }
      
    } catch (error) {
      console.error('Error loading audio file:', error);
      return audioFile;
    }
  }

  // Load audio buffer for analysis with Essentia
  async loadAudioBuffer(audioFile) {
    try {
      console.log(`Loading audio buffer for analysis: ${audioFile.name}`);
      
      // Fetch the audio file as an ArrayBuffer
      const response = await fetch(audioFile.url);
      const arrayBuffer = await response.arrayBuffer();
      
      // Create audio context if not exists
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to mono and get channel data
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert Float32Array to regular array for Essentia
      return Array.from(channelData);
      
    } catch (error) {
      console.error(`Error loading audio buffer for ${audioFile.name}:`, error);
      return null;
    }
  }

  // Play audio file
  async playAudio(audioFile) {
    // Stop any currently playing audio
    this.stopAll();
    
    if (!audioFile.isLoaded) {
      await this.loadAudio(audioFile);
    }
    
    if (audioFile.audioElement) {
      audioFile.audioElement.play();
      audioFile.isPlaying = true;
      this.currentPlayingAudio = audioFile;
      
      // Set up event listeners
      audioFile.audioElement.addEventListener('timeupdate', () => {
        audioFile.currentTime = audioFile.audioElement.currentTime;
      });
      
      audioFile.audioElement.addEventListener('ended', () => {
        audioFile.isPlaying = false;
        this.currentPlayingAudio = null;
      });
    } else {
      // For dummy data, simulate playback
      audioFile.isPlaying = true;
      this.currentPlayingAudio = audioFile;
      console.log(`Playing dummy audio: ${audioFile.name}`);
    }
  }

  // Pause audio
  pauseAudio(audioFile) {
    if (audioFile.audioElement) {
      audioFile.audioElement.pause();
    }
    audioFile.isPlaying = false;
    if (this.currentPlayingAudio === audioFile) {
      this.currentPlayingAudio = null;
    }
  }

  // Stop all audio
  stopAll() {
    this.audioFiles.forEach(audioFile => {
      if (audioFile.isPlaying) {
        this.pauseAudio(audioFile);
      }
      if (audioFile.audioElement) {
        audioFile.audioElement.currentTime = 0;
        audioFile.currentTime = 0;
      }
    });
    this.currentPlayingAudio = null;
  }

  // Seek to specific time
  seekTo(audioFile, time) {
    if (audioFile.audioElement) {
      audioFile.audioElement.currentTime = time;
      audioFile.currentTime = time;
    }
  }

  // Get formatted time string
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
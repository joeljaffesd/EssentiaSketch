// CacheManager.js - Handles localStorage caching of audio analysis data

class CacheManager {
  constructor() {
    this.storageKey = 'essentiaSketch_audioAnalysis';
    this.cache = this.loadCache();
    this.maxCacheSize = 500; // Maximum number of files to cache
    this.cacheVersion = '1.0'; // Increment this to invalidate old caches
  }

  // Load cache from localStorage
  loadCache() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        console.log('📦 No cache found, starting fresh');
        return { version: this.cacheVersion, data: {} };
      }

      const parsed = JSON.parse(stored);
      
      // Check cache version
      if (parsed.version !== this.cacheVersion) {
        console.log('📦 Cache version mismatch, clearing old cache');
        this.clearCache();
        return { version: this.cacheVersion, data: {} };
      }

      console.log(`📦 Loaded cache with ${Object.keys(parsed.data).length} entries`);
      return parsed;
      
    } catch (error) {
      console.error('❌ Error loading cache:', error);
      return { version: this.cacheVersion, data: {} };
    }
  }

  // Save cache to localStorage
  saveCache() {
    try {
      const serialized = JSON.stringify(this.cache);
      
      // Check if storage quota would be exceeded
      const estimatedSize = new Blob([serialized]).size;
      if (estimatedSize > 4.5 * 1024 * 1024) { // 4.5MB limit (leave some buffer)
        console.warn('⚠️ Cache size approaching localStorage limit, pruning old entries');
        this.pruneCache();
      }
      
      localStorage.setItem(this.storageKey, serialized);
      console.log(`💾 Saved cache with ${Object.keys(this.cache.data).length} entries`);
      
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('❌ localStorage quota exceeded, pruning cache');
        this.pruneCache();
        // Try saving again after pruning
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
        } catch (e) {
          console.error('❌ Still cannot save after pruning:', e);
        }
      } else {
        console.error('❌ Error saving cache:', error);
      }
    }
  }

  // Generate a unique key for an audio file
  generateFileKey(audioFile) {
    // Use the file path as the primary identifier, plus size as validation
    return `${audioFile.path}_${audioFile.size}`;
  }

  // Check if analysis exists in cache for a file
  hasCachedAnalysis(audioFile) {
    const key = this.generateFileKey(audioFile);
    return key in this.cache.data;
  }

  // Get cached analysis for a file
  getCachedAnalysis(audioFile) {
    const key = this.generateFileKey(audioFile);
    const cached = this.cache.data[key];
    
    if (cached) {
      // Update last accessed timestamp
      cached.lastAccessed = Date.now();
      console.log(`✅ Cache hit for ${audioFile.name}`);
      return cached.analysis;
    }
    
    console.log(`❌ Cache miss for ${audioFile.name}`);
    return null;
  }

  // Store analysis in cache
  setCachedAnalysis(audioFile, analysis) {
    const key = this.generateFileKey(audioFile);
    
    this.cache.data[key] = {
      fileName: audioFile.name,
      path: audioFile.path,
      size: audioFile.size,
      analysis: analysis,
      cachedAt: Date.now(),
      lastAccessed: Date.now()
    };
    
    // Check if we need to prune
    if (Object.keys(this.cache.data).length > this.maxCacheSize) {
      this.pruneCache();
    }
    
    // Save to localStorage
    this.saveCache();
    console.log(`💾 Cached analysis for ${audioFile.name}`);
  }

  // Remove entries that haven't been accessed recently
  pruneCache() {
    const entries = Object.entries(this.cache.data);
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Keep only the most recent 70% of maxCacheSize
    const keepCount = Math.floor(this.maxCacheSize * 0.7);
    const toKeep = entries.slice(-keepCount);
    
    // Rebuild cache with kept entries
    this.cache.data = Object.fromEntries(toKeep);
    
    console.log(`🧹 Pruned cache from ${entries.length} to ${toKeep.length} entries`);
  }

  // Clear all cache
  clearCache() {
    this.cache = { version: this.cacheVersion, data: {} };
    localStorage.removeItem(this.storageKey);
    console.log('🗑️ Cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    const entries = Object.values(this.cache.data);
    const totalEntries = entries.length;
    
    if (totalEntries === 0) {
      return {
        totalEntries: 0,
        cacheSize: 0,
        oldestEntry: null,
        newestEntry: null
      };
    }
    
    const timestamps = entries.map(e => e.cachedAt);
    const oldestEntry = new Date(Math.min(...timestamps));
    const newestEntry = new Date(Math.max(...timestamps));
    
    // Estimate cache size
    const cacheSize = new Blob([JSON.stringify(this.cache)]).size;
    
    return {
      totalEntries,
      cacheSize,
      cacheSizeMB: (cacheSize / (1024 * 1024)).toFixed(2),
      oldestEntry,
      newestEntry
    };
  }

  // Export cache as JSON (for debugging)
  exportCache() {
    return JSON.stringify(this.cache, null, 2);
  }

  // Import cache from JSON (for debugging)
  importCache(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (imported.version === this.cacheVersion) {
        this.cache = imported;
        this.saveCache();
        console.log('✅ Cache imported successfully');
        return true;
      } else {
        console.error('❌ Cache version mismatch');
        return false;
      }
    } catch (error) {
      console.error('❌ Error importing cache:', error);
      return false;
    }
  }
}

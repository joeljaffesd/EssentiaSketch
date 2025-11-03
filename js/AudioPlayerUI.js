// AudioPlayerUI.js - UI components for audio playback controls

class AudioPlayerUI {
  constructor(audioManager, x, y, width, height) {
    this.audioManager = audioManager;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.isHovered = false;
    this.minimized = true; // Start minimized
    this.minimizedRadius = 25; // Size of minimized circle
    this.isStartingPlayback = false; // Flag to prevent minimizing during playback start
  }

  // Draw the audio player UI
  draw(audioFile) {
    // Clear starting playback flag if audio is now playing
    if (this.isStartingPlayback && audioFile.isPlaying) {
      this.isStartingPlayback = false;
    }
    
    push();
    translate(this.x, this.y);
    
    if (this.minimized) {
      this.drawMinimized(audioFile);
    } else {
      this.drawExpanded(audioFile);
    }
    
    pop();
  }

  // Draw minimized circle version
  drawMinimized(audioFile) {
    const radius = this.minimizedRadius;
    
    // Circle background
    fill(this.isHovered ? colors.primary : colors.surface);
    stroke(audioFile.isPlaying ? colors.accent : colors.primary);
    strokeWeight(audioFile.isPlaying ? 3 : 2);
    circle(0, 0, radius * 2);
    
    // Play/pause icon in center
    fill(colors.text);
    noStroke();
    const iconSize = radius * 0.6;
    
    if (audioFile.isPlaying) {
      // Pause icon
      const barWidth = iconSize * 0.25;
      const barHeight = iconSize * 0.8;
      rect(-iconSize * 0.3, -barHeight/2, barWidth, barHeight);
      rect(iconSize * 0.05, -barHeight/2, barWidth, barHeight);
    } else {
      // Play icon
      triangle(-iconSize * 0.3, -iconSize * 0.4, 
               -iconSize * 0.3, iconSize * 0.4, 
               iconSize * 0.3, 0);
    }
    
    // Track name (truncated if too long)
    fill(colors.text);
    textAlign(CENTER);
    textSize(10);
    const displayName = audioFile.name.length > 12 ? 
                       audioFile.name.substring(0, 10) + '...' : 
                       audioFile.name;
    text(displayName, 0, radius + 15);
  }

  // Draw expanded full UI
  drawExpanded(audioFile) {
    // Background
    fill(this.isHovered ? colors.surface : color(26, 26, 26));
    stroke(audioFile.isPlaying ? colors.accent : colors.primary);
    strokeWeight(audioFile.isPlaying ? 2 : 1);
    rect(0, 0, this.width, this.height, 8);
    
    // Track name
    fill(colors.text);
    textAlign(LEFT);
    textSize(12);
    text(audioFile.name, 10, 20);
    
    // Time display
    const currentTimeStr = this.audioManager.formatTime(audioFile.currentTime);
    const durationStr = this.audioManager.formatTime(audioFile.duration);
    textAlign(RIGHT);
    text(`${currentTimeStr} / ${durationStr}`, this.width - 10, 20);
    
    // Progress bar
    const progressBarY = 30;
    const progressBarHeight = 4;
    const progressBarWidth = this.width - 20;
    
    // Background track
    fill(colors.background);
    noStroke();
    rect(10, progressBarY, progressBarWidth, progressBarHeight, 2);
    
    // Progress
    const progress = audioFile.duration > 0 ? audioFile.currentTime / audioFile.duration : 0;
    fill(audioFile.isPlaying ? colors.accent : colors.primary);
    rect(10, progressBarY, progressBarWidth * progress, progressBarHeight, 2);
    
    // Control buttons
    this.drawControlButtons(audioFile);
  }

  drawControlButtons(audioFile) {
    const buttonY = 45;
    const buttonSize = 20;
    const buttonSpacing = 30;
    
    // Play/Pause button
    const playButtonX = 10;
    fill(audioFile.isPlaying ? colors.accent : colors.primary);
    noStroke();
    
    if (audioFile.isPlaying) {
      // Pause icon
      rect(playButtonX + 6, buttonY + 5, 3, 10);
      rect(playButtonX + 11, buttonY + 5, 3, 10);
    } else {
      // Play icon
      triangle(playButtonX + 6, buttonY + 5, 
               playButtonX + 6, buttonY + 15, 
               playButtonX + 14, buttonY + 10);
    }
    
    // Restart button
    const restartButtonX = playButtonX + buttonSpacing;
    fill(colors.secondary);
    rect(restartButtonX + 2, buttonY + 8, 16, 4);
    triangle(restartButtonX, buttonY + 10, 
             restartButtonX + 6, buttonY + 6, 
             restartButtonX + 6, buttonY + 14);
  }

  // Check if mouse is over this UI element
  checkHover(mouseX, mouseY) {
    if (this.minimized) {
      // Check if mouse is over the circle
      const distance = dist(mouseX, mouseY, this.x, this.y);
      this.isHovered = distance <= this.minimizedRadius;
    } else {
      // Check if mouse is over the rectangle
      this.isHovered = mouseX >= this.x && mouseX <= this.x + this.width &&
                       mouseY >= this.y && mouseY <= this.y + this.height;
    }
    return this.isHovered;
  }

  // Handle mouse clicks
  handleClick(mouseX, mouseY, audioFile) {
    if (!this.checkHover(mouseX, mouseY)) return false;
    
    if (this.minimized) {
      // Clicked on minimized circle - expand and start playback
      this.expand();
      this.isStartingPlayback = true;
      // Start playback asynchronously
      this.startPlayback(audioFile);
      return true;
    }
    
    // Handle expanded UI clicks
    const localX = mouseX - this.x;
    const localY = mouseY - this.y;
    
    // Check progress bar click (scrubbing)
    if (localY >= 30 && localY <= 34 && localX >= 10 && localX <= this.width - 10) {
      const progress = (localX - 10) / (this.width - 20);
      const seekTime = progress * audioFile.duration;
      this.audioManager.seekTo(audioFile, seekTime);
      return true;
    }
    
    // Check play/pause button
    if (localY >= 45 && localY <= 65 && localX >= 10 && localX <= 30) {
      if (audioFile.isPlaying) {
        this.audioManager.pauseAudio(audioFile);
      } else {
        this.audioManager.playAudio(audioFile);
      }
      return true;
    }
    
    // Check restart button
    if (localY >= 45 && localY <= 65 && localX >= 40 && localX <= 60) {
      this.audioManager.seekTo(audioFile, 0);
      if (!audioFile.isPlaying) {
        this.audioManager.playAudio(audioFile);
      }
      return true;
    }
    
    return false;
  }

  // Start playback asynchronously
  async startPlayback(audioFile) {
    try {
      await this.audioManager.playAudio(audioFile);
      
      // Wait a short time to see if playback actually started
      setTimeout(() => {
        if (!audioFile.isPlaying) {
          // Playback didn't start (likely due to browser autoplay policy)
          this.isStartingPlayback = false;
          this.minimize();
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to start playback:', error);
      this.isStartingPlayback = false;
      this.minimize();
    }
  }

  // Expand the UI to full size
  expand() {
    this.minimized = false;
  }

  // Minimize the UI to circle
  minimize() {
    this.minimized = true;
  }
}
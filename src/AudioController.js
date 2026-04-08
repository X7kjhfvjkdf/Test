/**
 * AudioController - Web Audio API based sound system
 * Handles ambient sounds, interaction sounds, and 3D spatial audio
 */

export class AudioController {
  constructor(settings) {
    this.settings = settings;
    this.audioContext = null;
    this.masterGain = null;
    this.ambientNode = null;
    this.isInitialized = false;
    
    // Sound state
    this.masterVolume = 1;
  }
  
  async init() {
    try {
      // Initialize Web Audio API
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.audioContext.destination);
      
      // Create ambient drone
      await this.createAmbientDrone();
      
      this.isInitialized = true;
      console.log('✅ AudioController initialized');
    } catch (error) {
      console.warn('⚠️ Audio initialization failed:', error);
      this.isInitialized = false;
    }
  }
  
  async createAmbientDrone() {
    if (!this.audioContext) return;
    
    // Create multiple oscillators for rich ambient sound
    const frequencies = [55, 110, 220]; // Low frequencies for drone
    
    this.ambientNode = this.audioContext.createGain();
    this.ambientNode.gain.value = 0.15;
    this.ambientNode.connect(this.masterGain);
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = freq;
      
      // Detune slightly for richness
      oscillator.detune.value = (index - 1) * 5;
      
      const gain = this.audioContext.createGain();
      gain.gain.value = 0.3 / (index + 1);
      
      oscillator.connect(gain);
      gain.connect(this.ambientNode);
      oscillator.start();
    });
    
    // Add subtle modulation
    const lfo = this.audioContext.createOscillator();
    lfo.frequency.value = 0.1;
    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 0.02;
    
    lfo.connect(lfoGain);
    lfoGain.connect(this.ambientNode.gain);
    lfo.start();
  }
  
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  playBookInteraction(position = null) {
    if (!this.isInitialized || !this.settings.soundEnabled) return;
    
    const now = this.audioContext.currentTime;
    
    // Create page rustle sound
    const bufferSize = this.audioContext.sampleRate * 0.3;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    // Filter for paper-like sound
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start();
    
    // Add subtle chime for magical effect
    const chime = this.audioContext.createOscillator();
    chime.frequency.value = 880 + Math.random() * 440;
    chime.type = 'sine';
    
    const chimeGain = this.audioContext.createGain();
    chimeGain.gain.setValueAtTime(0.1, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
    
    chime.connect(chimeGain);
    chimeGain.connect(this.masterGain);
    chime.start(now);
    chime.stop(now + 1.0);
  }
  
  createSpatialSound(position) {
    if (!this.isInitialized || !this.audioContext) return null;
    
    const panner = this.audioContext.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.positionX.value = position.x;
    panner.positionY.value = position.y;
    panner.positionZ.value = position.z;
    panner.connect(this.masterGain);
    
    return panner;
  }
  
  setMasterVolume(volume) {
    this.masterVolume = volume;
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }
  
  updateListenerPosition(position, direction) {
    if (!this.audioContext || !this.isInitialized) return;
    
    const listener = this.audioContext.listener;
    
    if (listener.positionX) {
      listener.positionX.value = position.x;
      listener.positionY.value = position.y;
      listener.positionZ.value = position.z;
      
      listener.forwardX.value = direction.x;
      listener.forwardY.value = direction.y;
      listener.forwardZ.value = direction.z;
    } else {
      // Fallback for older browsers
      listener.setPosition(position.x, position.y, position.z);
      listener.setOrientation(direction.x, direction.y, direction.z, 0, 1, 0);
    }
  }
  
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

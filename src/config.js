/**
 * Configuration for Interstellar Library
 * Centralized settings for performance, visuals, and gameplay
 */

export const CONFIG = {
  // Graphics quality levels (0=low, 1=medium, 2=high)
  qualityLevel: 2,
  
  // Render distances for each quality level
  renderDistances: [40, 70, 100],
  
  // Camera settings
  fov: 75,
  nearClip: 0.1,
  farClip: 500,
  cameraHeight: 1.7,
  
  // Renderer settings
  antialias: true,
  shadows: false, // Disabled for better performance
  
  // Scene settings
  backgroundColor: 0x0a0a0f,
  fogDensity: 0.015,
  
  // Chunk settings
  chunkSize: 64,
  chunkHeight: 40,
  
  // Lighting configuration
  lighting: {
    ambientTop: 0x443322,
    ambientBottom: 0x111122,
    ambientIntensity: 0.6,
    directionalColor: 0xffaa66,
    directionalIntensity: 0.8,
    pointColor1: 0xff8844,
    pointIntensity1: 0.5,
    pointColor2: 0xffaa66,
    pointIntensity2: 0.4
  },
  
  // Movement settings
  movement: {
    baseSpeed: 10,
    sprintMultiplier: 2.0,
    damping: 0.92,
    mouseSensitivity: 0.002,
    verticalSpeed: 8
  },
  
  // Particle settings
  particles: {
    count: 2000,
    size: 0.05,
    color: 0xffaa66
  },
  
  // Book colors palette (warm tones)
  bookColors: [
    0x8B4513, // SaddleBrown
    0xA0522D, // Sienna
    0xCD853F, // Peru
    0xD2691E, // Chocolate
    0xDEB887, // Burlywood
    0xF4A460, // SandyBrown
    0xDAA520, // Goldenrod
    0xB8860B, // DarkGoldenrod
    0x5C4033, // DarkBrown
    0x654321  // Brown
  ],
  
  // Performance thresholds
  performance: {
    targetFPS: 60,
    minFPS: 30,
    maxDrawCalls: 800,
    maxChunks: 4
  }
};

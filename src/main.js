/**
 * Interstellar Library - Infinite WebGL Experience
 * Main entry point
 * 
 * A procedurally generated infinite library inspired by the Tesseract scene from Interstellar
 * Features: First-person flight, chunk-based generation, interactive books, particle effects
 */

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import { ChunkManager } from './ChunkManager.js';
import { ParticleSystem } from './ParticleSystem.js';
import { AudioController } from './AudioController.js';
import { InputController } from './InputController.js';
import { CONFIG } from './config.js';

class InterstellarLibrary {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingBar = document.getElementById('loading-bar');
    this.loadingText = document.getElementById('loading-text');
    this.fpsCounter = document.getElementById('fps-counter');
    this.startPrompt = document.getElementById('start-prompt');
    
    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.controls = null;
    
    // Game systems
    this.chunkManager = null;
    this.particleSystem = null;
    this.audioController = null;
    this.inputController = null;
    
    // State
    this.isInitialized = false;
    this.isPlaying = false;
    this.lastTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    this.deltaTime = 0;
    
    // Performance tracking
    this.activeChunks = 0;
    this.drawCalls = 0;
    
    // Settings
    this.settings = {
      speed: 0.5,
      bloomStrength: 0.6,
      particlesEnabled: true,
      soundEnabled: true,
      collisionsEnabled: false
    };
  }
  
  async init() {
    try {
      this.updateLoadingProgress(10, 'Initializing renderer...');
      await this.initRenderer();
      
      this.updateLoadingProgress(30, 'Setting up camera...');
      await this.initCamera();
      
      this.updateLoadingProgress(40, 'Creating scene...');
      await this.initScene();
      
      this.updateLoadingProgress(50, 'Loading controls...');
      await this.initControls();
      
      this.updateLoadingProgress(60, 'Initializing lighting...');
      await this.initLighting();
      
      this.updateLoadingProgress(70, 'Setting up post-processing...');
      await this.initPostProcessing();
      
      this.updateLoadingProgress(80, 'Loading game systems...');
      await this.initGameSystems();
      
      this.updateLoadingProgress(90, 'Finalizing...');
      await this.setupEventListeners();
      
      this.updateLoadingProgress(100, 'Ready!');
      
      setTimeout(() => {
        this.loadingScreen.classList.add('hidden');
        this.isInitialized = true;
        this.animate();
      }, 500);
      
      console.log('✅ Interstellar Library initialized successfully');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this.loadingText.textContent = 'Failed to initialize. Please refresh.';
      this.loadingText.style.color = '#ff4444';
    }
  }
  
  updateLoadingProgress(percent, text) {
    this.loadingBar.style.width = `${percent}%`;
    this.loadingText.textContent = text;
  }
  
  async initRenderer() {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: CONFIG.antialias,
      powerPreference: 'high-performance',
      alpha: false,
      depth: true,
      stencil: false,
      failIfMajorPerformanceCaveat: false
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.shadowMap.enabled = CONFIG.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    this.container.appendChild(this.renderer.domElement);
    
    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize());
  }
  
  async initCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.fov,
      aspect,
      CONFIG.nearClip,
      CONFIG.farClip
    );
    this.camera.position.set(0, CONFIG.cameraHeight, 5);
  }
  
  async initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.backgroundColor);
    this.scene.fog = new THREE.FogExp2(
      CONFIG.backgroundColor,
      CONFIG.fogDensity
    );
  }
  
  async initControls() {
    this.controls = new PointerLockControls(this.camera, document.body);
    
    this.startPrompt.addEventListener('click', () => {
      if (!this.isPlaying) {
        this.controls.lock();
      }
    });
    
    this.controls.addEventListener('lock', () => {
      this.isPlaying = true;
      this.startPrompt.classList.add('hidden');
      this.audioController?.resume();
    });
    
    this.controls.addEventListener('unlock', () => {
      this.isPlaying = false;
      this.startPrompt.classList.remove('hidden');
    });
  }
  
  async initLighting() {
    // Ambient light for base illumination
    const ambientLight = new THREE.HemisphereLight(
      CONFIG.lighting.ambientTop,
      CONFIG.lighting.ambientBottom,
      CONFIG.lighting.ambientIntensity
    );
    this.scene.add(ambientLight);
    
    // Warm directional light for bookshelf highlights
    const dirLight = new THREE.DirectionalLight(
      CONFIG.lighting.directionalColor,
      CONFIG.lighting.directionalIntensity
    );
    dirLight.position.set(10, 20, 10);
    if (CONFIG.shadows) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
    }
    this.scene.add(dirLight);
    
    // Point lights for atmospheric glow
    const pointLight1 = new THREE.PointLight(
      CONFIG.lighting.pointColor1,
      CONFIG.lighting.pointIntensity1,
      50
    );
    pointLight1.position.set(-10, 5, -10);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(
      CONFIG.lighting.pointColor2,
      CONFIG.lighting.pointIntensity2,
      50
    );
    pointLight2.position.set(10, 8, -15);
    this.scene.add(pointLight2);
  }
  
  async initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    
    // Render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Bloom pass for glow effect
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.settings.bloomStrength,
      0.5,
      0.85
    );
    this.composer.addPass(this.bloomPass);
    
    // Vignette pass for cinematic look
    const vignettePass = new ShaderPass(VignetteShader);
    vignettePass.uniforms['darkness'].value = 0.4;
    vignettePass.uniforms['offset'].value = 0.6;
    this.composer.addPass(vignettePass);
    
    // Film pass for grain effect
    const filmPass = new FilmPass(
      0.15,  // noise intensity
      0.5,   // scanline intensity
      648,   // scanline count
      false  // grayscale
    );
    this.composer.addPass(filmPass);
  }
  
  async initGameSystems() {
    this.chunkManager = new ChunkManager(this.scene, this.camera, this.settings);
    await this.chunkManager.init();
    
    this.particleSystem = new ParticleSystem(this.scene, this.camera, this.settings);
    await this.particleSystem.init();
    
    this.audioController = new AudioController(this.settings);
    await this.audioController.init();
    
    this.inputController = new InputController(
      this.camera,
      this.controls,
      this.settings,
      this.chunkManager,
      this.particleSystem,
      this.audioController
    );
    await this.inputController.init();
  }
  
  async setupEventListeners() {
    // UI Controls
    document.getElementById('speed-slider').addEventListener('input', (e) => {
      this.settings.speed = e.target.value / 100;
    });
    
    document.getElementById('bloom-slider').addEventListener('input', (e) => {
      this.settings.bloomStrength = e.target.value / 100;
      this.bloomPass.strength = this.settings.bloomStrength;
    });
    
    document.getElementById('particles-toggle').addEventListener('click', (e) => {
      this.settings.particlesEnabled = !this.settings.particlesEnabled;
      e.target.classList.toggle('active');
      e.target.textContent = this.settings.particlesEnabled ? 'ON' : 'OFF';
      this.particleSystem.setEnabled(this.settings.particlesEnabled);
    });
    
    document.getElementById('sound-toggle').addEventListener('click', (e) => {
      this.settings.soundEnabled = !this.settings.soundEnabled;
      e.target.classList.toggle('active');
      e.target.textContent = this.settings.soundEnabled ? 'ON' : 'OFF';
      this.audioController.setMasterVolume(this.settings.soundEnabled ? 1 : 0);
    });
    
    document.getElementById('collision-toggle').addEventListener('click', (e) => {
      this.settings.collisionsEnabled = !this.settings.collisionsEnabled;
      e.target.classList.toggle('active');
      e.target.textContent = this.settings.collisionsEnabled ? 'ON' : 'OFF';
    });
  }
  
  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Cap delta time to prevent physics issues
    const cappedDeltaTime = Math.min(this.deltaTime, 0.1);
    
    if (this.isInitialized) {
      // Update systems
      this.inputController.update(cappedDeltaTime);
      this.chunkManager.update(cappedDeltaTime, this.camera.position);
      this.particleSystem.update(cappedDeltaTime, this.camera.position);
      
      // Render
      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
      
      // Update FPS counter
      this.updateFPS();
    }
  }
  
  updateFPS() {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = currentTime;
      
      this.activeChunks = this.chunkManager?.getActiveChunkCount() || 0;
      this.fpsCounter.textContent = `FPS: ${this.fps} | Chunks: ${this.activeChunks}`;
      
      // Auto-adjust quality based on FPS
      this.autoAdjustQuality();
    }
  }
  
  autoAdjustQuality() {
    if (this.fps < 30 && CONFIG.qualityLevel > 0) {
      // Reduce quality
      CONFIG.qualityLevel--;
      this.chunkManager?.setRenderDistance(CONFIG.renderDistances[CONFIG.qualityLevel]);
    } else if (this.fps > 55 && CONFIG.qualityLevel < 2) {
      // Increase quality
      CONFIG.qualityLevel++;
      this.chunkManager?.setRenderDistance(CONFIG.renderDistances[CONFIG.qualityLevel]);
    }
  }
}

// Initialize application
const app = new InterstellarLibrary();
app.init();

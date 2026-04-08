import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
// import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js'; // Удалено для оптимизации

import { CONFIG, getPreset } from './config.js';
import { InputController } from './InputController.js';
import { ChunkManager } from './ChunkManager.js';
import { ParticleSystem } from './ParticleSystem.js';
import { AudioController } from './AudioController.js';

class App {
  constructor() {
    this.container = document.getElementById('app');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Применение пресета настроек
    this.settings = getPreset(CONFIG.performance.quality);
    
    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initPostProcessing();
    this.initControllers();
    this.initWorld();
    this.initUI();
    
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
    
    window.addEventListener('resize', this.onResize.bind(this));
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      powerPreference: 'high-performance',
      antialias: this.settings.performance.antialias // FALSE для оптимизации
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.settings.performance.pixelRatio));
    this.renderer.shadowMap.enabled = false; // Тени отключены для производительности
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.visuals.fogColor);
    this.scene.fog = new THREE.FogExp2(CONFIG.visuals.fogColor, CONFIG.visuals.fogDensity);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      this.width / this.height,
      CONFIG.camera.near,
      this.settings.performance.farClip
    );
    this.camera.position.set(0, 1.7, 5); // Стартовая позиция
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom (свечение)
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      CONFIG.visuals.bloomStrength,
      CONFIG.visuals.bloomRadius,
      CONFIG.visuals.bloomThreshold
    );
    this.composer.addPass(bloomPass);

    // FilmPass удален для повышения FPS
  }

  initControllers() {
    this.input = new InputController(this.camera);
    this.audio = new AudioController();
  }

  initWorld() {
    this.chunkManager = new ChunkManager(this.scene);
    this.particles = new ParticleSystem(this.scene, this.camera);
    
    // Освещение
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, CONFIG.visuals.ambientLight);
    this.scene.add(hemiLight);

    // Точечные источники света (фонари в библиотеке)
    // Генерируются процедурно вместе с чанками или статично
    const pointLight = new THREE.PointLight(0xffaa00, CONFIG.visuals.pointLightIntensity, 20);
    pointLight.position.set(0, 4, 0);
    this.scene.add(pointLight);
  }

  initUI() {
    // Минималистичный UI
    const ui = document.createElement('div');
    ui.style.position = 'absolute';
    ui.style.top = '10px';
    ui.style.left = '10px';
    ui.style.color = '#fff';
    ui.style.fontFamily = 'monospace';
    ui.style.pointerEvents = 'none';
    ui.innerHTML = `
      <h1>INTERSTELLAR LIBRARY</h1>
      <p>FPS: <span id="fps">0</span></p>
      <p>Chunks: <span id="chunks">0</span></p>
      <p>Quality: ${CONFIG.performance.quality}</p>
      <p style="font-size: 0.8em; opacity: 0.7">WASD - Move | Mouse - Look | Shift - Sprint</p>
    `;
    document.body.appendChild(ui);
    
    this.uiFps = document.getElementById('fps');
    this.uiChunks = document.getElementById('chunks');

    // Клик для захвата курсора
    document.addEventListener('click', () => {
      this.input.lockPointer();
      this.audio.resume();
    });
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame(this.animate);
    
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // Обновление ввода и физики
    this.input.update(delta);
    
    // Перемещение камеры
    this.camera.position.add(this.input.velocity.clone().multiplyScalar(delta));
    
    // Ограничение высоты
    this.camera.position.y = Math.max(0.5, Math.min(this.camera.position.y, CONFIG.world.floorHeight - 0.5));

    // Обновление мира
    this.chunkManager.update(this.camera.position);
    this.particles.update(delta, this.camera.position);

    // Рендер
    this.composer.render();

    // UI Stats
    if (time % 0.5 < 0.02) {
      this.uiFps.textContent = Math.round(1 / delta);
      this.uiChunks.textContent = this.chunkManager.activeChunks.size;
    }
  }
}

// Запуск
window.addEventListener('DOMContentLoaded', () => {
  new App();
});

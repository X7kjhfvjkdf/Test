/**
 * ParticleSystem - Dust particles floating in the library
 * GPU-accelerated particle system for atmospheric effects
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class ParticleSystem {
  constructor(scene, camera, settings) {
    this.scene = scene;
    this.camera = camera;
    this.settings = settings;
    
    this.particles = null;
    this.particleCount = CONFIG.particles.count;
    this.isEnabled = true;
    
    // Particle data
    this.positions = null;
    this.velocities = null;
    this.sizes = null;
    this.randomness = null;
  }
  
  async init() {
    // Create particle geometry
    const geometry = new THREE.BufferGeometry();
    
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.randomness = new Float32Array(this.particleCount * 3);
    
    for (let i = 0; i < this.particleCount; i++) {
      // Position - spread throughout the library space
      this.positions[i * 3] = (Math.random() - 0.5) * 100;
      this.positions[i * 3 + 1] = Math.random() * 20;
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      
      // Velocity - slow drifting motion
      this.velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      this.velocities[i * 3 + 1] = Math.random() * 0.3;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      
      // Size variation
      this.sizes[i] = CONFIG.particles.size * (0.5 + Math.random() * 1.5);
      
      // Randomness for shader animation
      this.randomness[i * 3] = Math.random();
      this.randomness[i * 3 + 1] = Math.random();
      this.randomness[i * 3 + 2] = Math.random();
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute('randomness', new THREE.BufferAttribute(this.randomness, 3));
    
    // Create custom shader material for particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(CONFIG.particles.color) },
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 randomness;
        
        uniform float time;
        uniform float pixelRatio;
        
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec3 pos = position;
          
          // Gentle floating motion
          pos.x += sin(time * 0.5 + randomness.x * 6.28) * 0.5;
          pos.y += cos(time * 0.3 + randomness.y * 6.28) * 0.3;
          pos.z += sin(time * 0.4 + randomness.z * 6.28) * 0.5;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size attenuation based on distance
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          
          // Color variation
          vColor = vec3(1.0, 0.9 + randomness.x * 0.1, 0.7 + randomness.y * 0.3);
          vAlpha = 0.3 + randomness.z * 0.4;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          // Circular particle with soft edge
          float r = distance(gl_PointCoord, vec2(0.5));
          if (r > 0.5) discard;
          
          // Soft glow effect
          float alpha = 1.0 - smoothstep(0.0, 0.5, r);
          alpha *= vAlpha;
          
          gl_FragColor = vec4(color * vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
    
    console.log('✅ ParticleSystem initialized');
  }
  
  update(deltaTime, cameraPosition) {
    if (!this.isEnabled || !this.particles) return;
    
    const time = performance.now() * 0.001;
    this.particles.material.uniforms.time.value = time;
    
    // Update particle positions to follow camera (infinite effect)
    const positions = this.particles.geometry.attributes.position.array;
    
    for (let i = 0; i < this.particleCount; i++) {
      // Wrap particles around camera
      const px = positions[i * 3];
      const py = positions[i * 3 + 1];
      const pz = positions[i * 3 + 2];
      
      const dx = px - cameraPosition.x;
      const dz = pz - cameraPosition.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance > 50) {
        // Reposition particle in front of camera
        const angle = Math.atan2(dz, dx);
        const newDistance = 40 + Math.random() * 10;
        const newX = cameraPosition.x + Math.cos(angle) * newDistance;
        const newZ = cameraPosition.z + Math.sin(angle) * newDistance;
        
        positions[i * 3] = newX;
        positions[i * 3 + 1] = py;
        positions[i * 3 + 2] = newZ;
      }
    }
    
    this.particles.geometry.attributes.position.needsUpdate = true;
  }
  
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (this.particles) {
      this.particles.visible = enabled;
    }
  }
  
  dispose() {
    if (this.particles) {
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.scene.remove(this.particles);
    }
  }
}

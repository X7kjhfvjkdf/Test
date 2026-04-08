/**
 * InputController - Handles all user input
 * Keyboard, mouse, and mobile touch controls
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class InputController {
  constructor(camera, controls, settings, chunkManager, particleSystem, audioController) {
    this.camera = camera;
    this.controls = controls;
    this.settings = settings;
    this.chunkManager = chunkManager;
    this.particleSystem = particleSystem;
    this.audioController = audioController;
    
    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.isSprinting = false;
    
    // Velocity for smooth movement
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    
    // Raycaster for interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;
    
    // Mobile controls
    this.leftJoystick = null;
    this.rightJoystick = null;
    this.leftJoystickData = { x: 0, y: 0, active: false };
    this.rightJoystickData = { x: 0, y: 0, active: false };
  }
  
  async init() {
    this.setupKeyboardListeners();
    this.setupMouseListeners();
    this.setupMobileControls();
    
    console.log('✅ InputController initialized');
  }
  
  setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
  }
  
  setupMouseListeners() {
    document.addEventListener('mousedown', (e) => this.onMouseDown(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
  }
  
  setupMobileControls() {
    const leftJoystick = document.getElementById('joystick-left');
    const rightJoystick = document.getElementById('joystick-right');
    
    if (leftJoystick && rightJoystick) {
      this.setupJoystick(leftJoystick, this.leftJoystickData);
      this.setupJoystick(rightJoystick, this.rightJoystickData);
    }
  }
  
  setupJoystick(element, data) {
    const knob = element.querySelector('.mobile-joystick-knob');
    const maxDistance = 35;
    let startX, startY;
    
    element.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      data.active = true;
    });
    
    element.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!data.active) return;
      
      const touch = e.changedTouches[0];
      let dx = touch.clientX - startX;
      let dy = touch.clientY - startY;
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > maxDistance) {
        const ratio = maxDistance / distance;
        dx *= ratio;
        dy *= ratio;
      }
      
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      data.x = dx / maxDistance;
      data.y = dy / maxDistance;
    });
    
    element.addEventListener('touchend', (e) => {
      e.preventDefault();
      data.active = false;
      data.x = 0;
      data.y = 0;
      knob.style.transform = 'translate(-50%, -50%)';
    });
  }
  
  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'Space':
        this.moveUp = true;
        break;
      case 'ControlLeft':
      case 'ControlRight':
        this.moveDown = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = true;
        break;
    }
  }
  
  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'Space':
        this.moveUp = false;
        break;
      case 'ControlLeft':
      case 'ControlRight':
        this.moveDown = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = false;
        break;
    }
  }
  
  onMouseDown(event) {
    if (this.controls.isLocked && event.button === 0) {
      this.handleInteraction();
    }
  }
  
  onMouseMove(event) {
    if (this.controls.isLocked) {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      this.updateHoverEffect();
    }
  }
  
  updateHoverEffect() {
    // Reset previous hover
    if (this.hoveredObject && this.hoveredObject.material) {
      if (this.hoveredObject.userData.originalColor) {
        this.hoveredObject.material.emissiveIntensity = 0.1;
      }
    }
    
    // Check for new hover
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const interactables = this.chunkManager.getInteractables(this.camera.position, 15);
    
    if (interactables.length > 0) {
      const closest = interactables[0].object;
      if (closest.userData.isBook || closest.userData.isFloatingBook) {
        this.hoveredObject = closest;
        
        // Highlight effect
        if (closest.material) {
          closest.material.emissiveIntensity = 0.4;
        }
        
        // Trigger particle burst
        if (this.particleSystem.isEnabled) {
          // Could add localized particle effect here
        }
      }
    }
  }
  
  handleInteraction() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const interactables = this.chunkManager.getInteractables(this.camera.position, 10);
    
    if (interactables.length > 0) {
      const clicked = interactables[0].object;
      
      if (clicked.userData.isBook || clicked.userData.isFloatingBook) {
        // Visual feedback - pulse effect
        if (clicked.material) {
          const originalIntensity = clicked.material.emissiveIntensity;
          clicked.material.emissiveIntensity = 1.0;
          
          setTimeout(() => {
            clicked.material.emissiveIntensity = originalIntensity;
          }, 200);
        }
        
        // Play sound
        this.audioController?.playBookInteraction(clicked.position);
        
        // Animate book
        if (clicked.userData.isBook) {
          clicked.rotation.y += Math.PI / 4;
          clicked.position.y += 0.1;
        } else if (clicked.userData.isFloatingBook) {
          clicked.rotation.x += 0.5;
          clicked.rotation.z += 0.5;
        }
      }
    }
  }
  
  update(deltaTime) {
    if (!this.controls.isLocked) return;
    
    // Apply damping
    this.velocity.multiplyScalar(CONFIG.movement.damping);
    
    // Calculate movement direction
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.y = Number(this.moveUp) - Number(this.moveDown);
    
    // Add mobile joystick input
    if (this.leftJoystickData.active) {
      this.direction.x += this.leftJoystickData.x;
      this.direction.z -= this.leftJoystickData.y;
    }
    
    // Normalize horizontal movement
    this.direction.x = Math.max(-1, Math.min(1, this.direction.x));
    this.direction.z = Math.max(-1, Math.min(1, this.direction.z));
    
    // Calculate speed
    let speed = CONFIG.movement.baseSpeed * this.settings.speed;
    if (this.isSprinting) {
      speed *= CONFIG.movement.sprintMultiplier;
    }
    
    // Apply movement
    if (this.direction.length() > 0) {
      // Get camera direction
      const cameraDirection = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDirection);
      cameraDirection.y = 0;
      cameraDirection.normalize();
      
      const cameraRight = new THREE.Vector3();
      cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
      
      // Move forward/backward
      const moveVector = new THREE.Vector3();
      moveVector.addScaledVector(cameraDirection, -this.direction.z);
      moveVector.addScaledVector(cameraRight, this.direction.x);
      moveVector.normalize();
      
      this.velocity.x += moveVector.x * speed * deltaTime;
      this.velocity.z += moveVector.z * speed * deltaTime;
      
      // Move up/down
      if (this.direction.y !== 0) {
        this.velocity.y += this.direction.y * CONFIG.movement.verticalSpeed * deltaTime;
      }
    }
    
    // Apply velocity to camera
    this.camera.position.x += this.velocity.x * deltaTime;
    this.camera.position.y += this.velocity.y * deltaTime;
    this.camera.position.z += this.velocity.z * deltaTime;
    
    // Update audio listener position
    const audioDirection = new THREE.Vector3();
    this.camera.getWorldDirection(audioDirection);
    this.audioController?.updateListenerPosition(this.camera.position, audioDirection);
    
    // Handle mobile look control
    if (this.rightJoystickData.active) {
      // Could implement touch-based look control here
    }
  }
}

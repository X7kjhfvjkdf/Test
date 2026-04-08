/**
 * ChunkManager - Procedural chunk-based library generation
 * Handles infinite terrain generation with seamless transitions
 */

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class ChunkManager {
  constructor(scene, camera, settings) {
    this.scene = scene;
    this.camera = camera;
    this.settings = settings;
    
    this.chunks = new Map();
    this.chunkSize = CONFIG.chunkSize;
    this.chunkHeight = CONFIG.chunkHeight;
    this.renderDistance = CONFIG.renderDistances[CONFIG.qualityLevel];
    
    // Materials (reused for performance)
    this.bookshelfMaterial = null;
    this.bookMaterials = [];
    
    // Geometry caches
    this.bookGeometries = [];
    
    // Seeded random for consistent generation
    this.seed = 12345;
  }
  
  async init() {
    // Create shared materials
    this.bookshelfMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.8,
      metalness: 0.1
    });
    
    // Create book materials with different colors
    CONFIG.bookColors.forEach(color => {
      this.bookMaterials.push(new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.6,
        metalness: 0.2,
        emissive: color,
        emissiveIntensity: 0.1
      }));
    });
    
    // Generate book geometries with varying sizes
    for (let i = 0; i < 20; i++) {
      const width = 0.1 + Math.random() * 0.15;
      const height = 0.2 + Math.random() * 0.25;
      const depth = 0.15 + Math.random() * 0.1;
      
      this.bookGeometries.push(
        new THREE.BoxGeometry(width, height, depth)
      );
    }
    
    // Generate initial chunks around origin
    this.updateChunks(new THREE.Vector3(0, 0, 0));
    
    console.log('✅ ChunkManager initialized');
  }
  
  /**
   * Seeded random number generator
   */
  seededRandom(x, z, offset = 0) {
    let n = x * 3711 + z * 65537 + offset * 1013904223;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) & 0x7fffffff) / 0x7fffffff;
  }
  
  /**
   * Get chunk key from coordinates
   */
  getChunkKey(chunkX, chunkZ) {
    return `${chunkX},${chunkZ}`;
  }
  
  /**
   * Parse chunk key to coordinates
   */
  parseChunkKey(key) {
    const [x, z] = key.split(',').map(Number);
    return { x, z };
  }
  
  /**
   * Generate a single chunk
   */
  generateChunk(chunkX, chunkZ) {
    const chunkGroup = new THREE.Group();
    chunkGroup.position.set(
      chunkX * this.chunkSize,
      0,
      chunkZ * this.chunkSize
    );
    
    const booksPerShelf = 8;
    const shelvesPerColumn = 6;
    const aisleWidth = 4;
    const shelfDepth = 0.4;
    
    // Create bookshelf columns along the chunk
    for (let x = 0; x < this.chunkSize; x += aisleWidth) {
      for (let z = 0; z < this.chunkSize; z += aisleWidth) {
        // Use seeded random to determine if this position has shelves
        const rand = this.seededRandom(chunkX, chunkZ, x * 1000 + z);
        
        if (rand > 0.3) {
          // Create bookshelf column
          const shelfX = x - this.chunkSize / 2;
          const shelfZ = z - this.chunkSize / 2;
          
          // Determine orientation (0 = along X, 1 = along Z)
          const orientation = this.seededRandom(chunkX, chunkZ, x + z) > 0.5 ? 0 : 1;
          
          // Create multiple shelves vertically
          for (let shelf = 0; shelf < shelvesPerColumn; shelf++) {
            const shelfY = 0.5 + shelf * 0.8;
            
            // Shelf base
            const shelfLength = aisleWidth * 0.8;
            const shelfBase = new THREE.Mesh(
              new THREE.BoxGeometry(
                orientation === 0 ? shelfLength : shelfDepth,
                0.05,
                orientation === 0 ? shelfDepth : shelfLength
              ),
              this.bookshelfMaterial
            );
            shelfBase.position.set(shelfX, shelfY, shelfZ);
            chunkGroup.add(shelfBase);
            
            // Add books on shelf
            const bookCount = Math.floor(booksPerShelf * (0.7 + this.seededRandom(chunkX, chunkZ, shelf) * 0.3));
            
            for (let b = 0; b < bookCount; b++) {
              const bookGeoIndex = Math.floor(this.seededRandom(chunkX, chunkZ, b) * this.bookGeometries.length);
              const bookMatIndex = Math.floor(this.seededRandom(chunkX, chunkZ, b + 1) * this.bookMaterials.length);
              
              const book = new THREE.Mesh(
                this.bookGeometries[bookGeoIndex],
                this.bookMaterials[bookMatIndex]
              );
              
              const offset = (b - bookCount / 2) * 0.12;
              const bookX = orientation === 0 ? shelfX + offset : shelfX + (this.seededRandom(chunkX, chunkZ, b) - 0.5) * shelfDepth * 0.5;
              const bookZ = orientation === 0 ? shelfZ + (this.seededRandom(chunkX, chunkZ, b) - 0.5) * shelfDepth * 0.5 : shelfZ + offset;
              
              book.position.set(bookX, shelfY + 0.3, bookZ);
              
              // Slight rotation variation
              book.rotation.y = (this.seededRandom(chunkX, chunkZ, b + 2) - 0.5) * 0.3;
              book.rotation.z = (this.seededRandom(chunkX, chunkZ, b + 3) - 0.5) * 0.1;
              book.rotation.x = (this.seededRandom(chunkX, chunkZ, b + 4) - 0.5) * 0.1;
              
              // Store metadata for interaction
              book.userData = {
                isBook: true,
                originalColor: this.bookMaterials[bookMatIndex].color.clone(),
                chunkKey: this.getChunkKey(chunkX, chunkZ)
              };
              
              chunkGroup.add(book);
            }
          }
        }
      }
    }
    
    // Add some floating books for atmosphere
    const floatingBookCount = 5;
    for (let i = 0; i < floatingBookCount; i++) {
      const bookGeoIndex = Math.floor(this.seededRandom(chunkX, chunkZ, i + 100) * this.bookGeometries.length);
      const bookMatIndex = Math.floor(this.seededRandom(chunkX, chunkZ, i + 101) * this.bookMaterials.length);
      
      const floatingBook = new THREE.Mesh(
        this.bookGeometries[bookGeoIndex],
        this.bookMaterials[bookMatIndex].clone()
      );
      
      floatingBook.position.set(
        (this.seededRandom(chunkX, chunkZ, i + 102) - 0.5) * this.chunkSize * 0.8,
        3 + this.seededRandom(chunkX, chunkZ, i + 103) * 3,
        (this.seededRandom(chunkX, chunkZ, i + 104) - 0.5) * this.chunkSize * 0.8
      );
      
      floatingBook.rotation.set(
        this.seededRandom(chunkX, chunkZ, i + 105) * Math.PI,
        this.seededRandom(chunkX, chunkZ, i + 106) * Math.PI,
        this.seededRandom(chunkX, chunkZ, i + 107) * Math.PI
      );
      
      floatingBook.userData = {
        isFloatingBook: true,
        floatSpeed: 0.5 + this.seededRandom(chunkX, chunkZ, i + 108) * 0.5,
        floatOffset: this.seededRandom(chunkX, chunkZ, i + 109) * Math.PI * 2
      };
      
      // Make it emissive for glow effect
      floatingBook.material.emissiveIntensity = 0.3;
      
      chunkGroup.add(floatingBook);
    }
    
    return chunkGroup;
  }
  
  /**
   * Update chunks based on camera position
   */
  updateChunks(cameraPosition) {
    const currentChunkX = Math.floor(cameraPosition.x / this.chunkSize);
    const currentChunkZ = Math.floor(cameraPosition.z / this.chunkSize);
    const renderRadius = Math.ceil(this.renderDistance / this.chunkSize);
    
    const activeKeys = new Set();
    
    // Generate/load chunks within render distance
    for (let x = -renderRadius; x <= renderRadius; x++) {
      for (let z = -renderRadius; z <= renderRadius; z++) {
        const chunkX = currentChunkX + x;
        const chunkZ = currentChunkZ + z;
        const key = this.getChunkKey(chunkX, chunkZ);
        
        activeKeys.add(key);
        
        if (!this.chunks.has(key)) {
          const chunk = this.generateChunk(chunkX, chunkZ);
          this.scene.add(chunk);
          this.chunks.set(key, chunk);
        }
      }
    }
    
    // Unload chunks outside render distance
    for (const [key, chunk] of this.chunks) {
      if (!activeKeys.has(key)) {
        this.scene.remove(chunk);
        
        // Clean up geometries and materials
        chunk.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose();
          }
        });
        
        this.chunks.delete(key);
      }
    }
  }
  
  /**
   * Main update loop
   */
  update(deltaTime, cameraPosition) {
    this.updateChunks(cameraPosition);
    
    // Animate floating books
    const time = performance.now() * 0.001;
    this.chunks.forEach((chunk) => {
      chunk.traverse((child) => {
        if (child.userData.isFloatingBook) {
          child.position.y += Math.sin(time * child.userData.floatSpeed + child.userData.floatOffset) * 0.002;
          child.rotation.y += deltaTime * 0.2;
        }
      });
    });
  }
  
  /**
   * Get count of active chunks
   */
  getActiveChunkCount() {
    return this.chunks.size;
  }
  
  /**
   * Set render distance
   */
  setRenderDistance(distance) {
    this.renderDistance = distance;
  }
  
  /**
   * Get all interactive objects in range
   */
  getInteractables(cameraPosition, range = 10) {
    const interactables = [];
    const currentChunkX = Math.floor(cameraPosition.x / this.chunkSize);
    const currentChunkZ = Math.floor(cameraPosition.z / this.chunkSize);
    
    // Check nearby chunks
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const key = this.getChunkKey(currentChunkX + x, currentChunkZ + z);
        const chunk = this.chunks.get(key);
        
        if (chunk) {
          chunk.traverse((child) => {
            if (child.userData.isBook || child.userData.isFloatingBook) {
              const distance = child.position.distanceTo(cameraPosition);
              if (distance < range) {
                interactables.push({ object: child, distance });
              }
            }
          });
        }
      }
    }
    
    return interactables.sort((a, b) => a.distance - b.distance);
  }
}

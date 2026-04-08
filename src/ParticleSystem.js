import * as THREE from 'three';
import { CONFIG } from './config.js';

/**
 * Оптимизированная система частиц (пыль).
 * Использует стандартный PointsMaterial вместо кастомных шейдеров.
 */
export class ParticleSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.count = CONFIG.particles.count;
    this.speed = CONFIG.particles.speed;
    
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);
    this.velocities = []; // Храним скорости отдельно

    // Инициализация позиций и скоростей
    const range = 60; // Область разлета частиц
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.positions[i3] = (Math.random() - 0.5) * range;
      this.positions[i3 + 1] = Math.random() * 10; // Высота от 0 до 10
      this.positions[i3 + 2] = (Math.random() - 0.5) * range;

      this.velocities.push({
        x: (Math.random() - 0.5) * this.speed,
        y: Math.random() * this.speed * 0.2, // Медленно вверх
        z: (Math.random() - 0.5) * this.speed
      });
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // Простой материал для максимальной производительности
    this.material = new THREE.PointsMaterial({
      color: CONFIG.particles.color,
      size: CONFIG.particles.size,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
    
    // Привязка к камере для эффекта "мира", а не локальных частиц
    // Но чтобы они не улетали, будем двигать их относительно камеры в update
  }

  update(delta, playerPosition) {
    const positions = this.geometry.attributes.position.array;
    
    // Двигаем частицы и обновляем позиции
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      
      // Обновление позиции
      positions[i3] += this.velocities[i].x;
      positions[i3 + 1] += this.velocities[i].y;
      positions[i3 + 2] += this.velocities[i].z;

      // Гравитация/ветер (очень слабый)
      if (positions[i3 + 1] > 6) {
        positions[i3 + 1] = 0; // Респаун снизу
      }

      // Бесконечный цикл вокруг игрока (телепортация если далеко)
      // Простая логика: частицы живут в мире, но мы их не сбрасываем жестко
      // Для оптимизации можно просто двигать всю систему за камерой,
      // но тогда не будет ощущения движения сквозь пыль.
      // Оставим мировые координаты для параллакса.
    }

    this.geometry.attributes.position.needsUpdate = true;
    
    // Синхронизируем систему частиц с позицией игрока, чтобы она всегда была вокруг
    // Но с небольшим отставанием или привязкой к чанкам, чтобы не было "плавающего" эффекта
    this.points.position.copy(playerPosition);
  }

  dispose() {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}

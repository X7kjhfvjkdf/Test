/**
 * Конфигурация проекта Interstellar Library
 * Оптимизировано для производительности (InstancedMesh, низкий полигонаж)
 */

export const CONFIG = {
  // --- Производительность ---
  performance: {
    quality: 'medium', // 'low', 'medium', 'high'
    targetFPS: 60,
    maxChunks: 3,      // Количество активных чанков вокруг игрока
    chunkSize: 64,     // Размер чанка в метрах
    renderDistances: [30, 50, 70], // Low, Medium, High (в метрах)
    farClip: 300,      // Дальняя плоскость отсечения
    shadowMapSize: 1024,
    antialias: false,  // ОТКЛЮЧЕНО для производительности
    pixelRatio: 1,     // Фиксированный pixel ratio
  },

  // --- Генерация мира (Левел-дизайн) ---
  world: {
    corridorWidth: 3.5,   // Ширина прохода между стеллажами
    shelfDepth: 0.4,      // Глубина полки
    shelfHeight: 0.35,    // Высота одной полки
    floorHeight: 6.0,     // Высота этажа (до потолка)
    blocksize: 8,         // Размер блока застройки (стеллажи + проход)
    bookDensity: 0.85,    // Плотность заполнения полок книгами (0-1)
    floatingBooks: false, // ОТКЛЮЧЕНО: никаких летающих книг
  },

  // --- Камера и управление ---
  camera: {
    fov: 75,
    near: 0.1,
    sensitivity: 0.002,
    moveSpeed: 10.0,
    sprintMultiplier: 2.5,
    damping: 0.92,        // Более резкое торможение
    verticalLimit: [-1, 10], // Ограничение по высоте Y
  },

  // --- Визуальные эффекты ---
  visuals: {
    fogColor: 0x050302,   // Очень темный, почти черный с оттенком
    fogDensity: 0.025,    // Плотный туман для скрытия подгрузки
    ambientLight: 0.15,   // Слабый общий свет
    pointLightIntensity: 1.2,
    bloomThreshold: 0.6,
    bloomStrength: 0.4,   // Умеренное свечение
    bloomRadius: 0.5,
    chromaticAberration: 0.0, // ОТКЛЮЧЕНО
    filmGrain: 0.05,      // Минимальный шум
  },

  // --- Аудио ---
  audio: {
    enabled: true,
    masterVolume: 0.4,
    ambienceVolume: 0.3,
    sfxVolume: 0.6,
    maxDistance: 20,      // Дистанция затухания звуков
  },

  // --- Частицы ---
  particles: {
    count: 500,          // Сильно уменьшено (было 2000)
    size: 0.03,
    color: 0xffaa00,
    speed: 0.05,
  }
};

// Автоматический выбор пресета в зависимости от качества
export const getPreset = (quality) => {
  const base = CONFIG;
  if (quality === 'low') {
    return {
      ...base,
      performance: { ...base.performance, renderDistance: base.performance.renderDistances[0], maxChunks: 2 },
      particles: { ...base.particles, count: 200 },
      visuals: { ...base.visuals, bloomStrength: 0.1, fogDensity: 0.04 }
    };
  }
  if (quality === 'high') {
    return {
      ...base,
      performance: { ...base.performance, renderDistance: base.performance.renderDistances[2], antialias: true, maxChunks: 4 },
      particles: { ...base.particles, count: 1000 },
      visuals: { ...base.visuals, bloomStrength: 0.6 }
    };
  }
  return base; // medium
};

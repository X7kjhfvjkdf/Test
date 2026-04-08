import * as THREE from 'three';
import { CONFIG } from './config.js';

/**
 * Менеджер чанков с использованием InstancedMesh для высокой производительности.
 * Генерирует реалистичную библиотеку: пол, потолок, стеллажи по стенам коридоров.
 */
export class ChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    this.activeChunks = new Set();
    
    // Геометрии и материалы (переиспользуемые)
    this.bookGeo = new THREE.BoxGeometry(1, 1, 1);
    this.shelfGeo = new THREE.BoxGeometry(1, 1, 1);
    
    // Материалы
    this.bookMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      roughness: 0.7, 
      metalness: 0.1 
    });
    
    this.shelfMat = new THREE.MeshStandardMaterial({ 
      color: 0x3d2817, // Темное дерево
      roughness: 0.9, 
      metalness: 0.0 
    });

    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2
    });

    this.ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x0f0f0f,
      roughness: 0.9
    });

    // Пул инстансов
    this.meshes = {}; 
    
    // Настройки
    this.chunkSize = CONFIG.performance.chunkSize;
    this.blockSize = CONFIG.world.blocksize;
    this.renderDistance = CONFIG.performance.renderDistances[1];
  }

  update(playerPosition) {
    const currentChunkX = Math.floor(playerPosition.x / this.chunkSize);
    const currentChunkZ = Math.floor(playerPosition.z / this.chunkSize);

    const newActiveChunks = new Set();
    const radius = Math.ceil(this.renderDistance / this.chunkSize);

    // Определяем активные чанки
    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        const cx = currentChunkX + x;
        const cz = currentChunkZ + z;
        const key = `${cx},${cz}`;
        
        // Проверка по расстоянию (круглая зона загрузки)
        const dist = Math.sqrt((x * this.chunkSize)**2 + (z * this.chunkSize)**2);
        if (dist > this.renderDistance) continue;

        newActiveChunks.add(key);
        if (!this.chunks.has(key)) {
          this.createChunk(cx, cz);
        }
      }
    }

    // Выгрузка старых чанков
    for (const key of this.activeChunks) {
      if (!newActiveChunks.has(key)) {
        this.destroyChunk(key);
      }
    }

    this.activeChunks = newActiveChunks;
  }

  createChunk(cx, cz) {
    const key = `${cx},${cz}`;
    const offsetX = cx * this.chunkSize;
    const offsetZ = cz * this.chunkSize;

    const chunkGroup = new THREE.Group();
    chunkGroup.position.set(offsetX, 0, offsetZ);

    // 1. Генерация пола и потолка (на весь чанк)
    this.addFloorCeiling(chunkGroup, this.chunkSize);

    // 2. Генерация стеллажей и книг
    // Сетка блоков внутри чанка
    const blocksPerSide = Math.floor(this.chunkSize / this.blockSize);
    
    // Данные для инстансинга
    const shelfData = [];
    const bookData = [];

    for (let bx = 0; bx < blocksPerSide; bx++) {
      for (let bz = 0; bz < blocksPerSide; bz++) {
        // Простая шахматная логика или логика коридоров
        // Здесь: создаем "острова" стеллажей с коридорами вокруг
        // Если (bx + bz) % 2 !== 0 -> тут проход, иначе стеллажи
        
        const isCorridor = (bx + bz) % 2 !== 0;
        
        if (!isCorridor) {
          // Координаты центра блока стеллажа
          const blockX = bx * this.blockSize + this.blockSize / 2;
          const blockZ = bz * this.blockSize + this.blockSize / 2;
          
          this.generateShelfBlock(blockX, blockZ, shelfData, bookData);
        }
      }
    }

    // Создаем InstancedMesh для полок
    if (shelfData.length > 0) {
      const mesh = new THREE.InstancedMesh(this.shelfGeo, this.shelfMat, shelfData.length);
      const matrix = new THREE.Matrix4();
      const dummy = new THREE.Object3D();

      shelfData.forEach(d => {
        dummy.position.set(d.x, d.y, d.z);
        dummy.scale.set(d.w, d.h, d.d);
        dummy.updateMatrix();
        mesh.setMatrixAt(d.i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      chunkGroup.add(mesh);
    }

    // Создаем InstancedMesh для книг
    if (bookData.length > 0) {
      const mesh = new THREE.InstancedMesh(this.bookGeo, this.bookMat, bookData.length);
      const matrix = new THREE.Matrix4();
      const dummy = new THREE.Object3D();
      const color = new THREE.Color();

      bookData.forEach(d => {
        dummy.position.set(d.x, d.y, d.z);
        dummy.rotation.set(d.rx, d.ry, d.rz);
        dummy.scale.set(d.w, d.h, d.d);
        dummy.updateMatrix();
        mesh.setMatrixAt(d.i, dummy.matrix);
        
        // Вариативность цветов книг
        const hue = 0.08 + Math.random() * 0.05; // Золотисто-коричневые тона
        const sat = 0.3 + Math.random() * 0.4;
        const val = 0.4 + Math.random() * 0.4;
        color.setHSL(hue, sat, val);
        mesh.setColorAt(d.i, color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      
      // Добавляем данные для интерактивности (упрощенно)
      mesh.userData.isBooks = true;
      chunkGroup.add(mesh);
    }

    this.chunks.set(key, chunkGroup);
    this.scene.add(chunkGroup);
  }

  addFloorCeiling(group, size) {
    // Пол
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      this.floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    group.add(floor);

    // Потолок
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      this.ceilingMat
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = CONFIG.world.floorHeight;
    ceiling.receiveShadow = true;
    group.add(ceiling);
  }

  generateShelfBlock(centerX, centerZ, shelfData, bookData) {
    const shelfDepth = CONFIG.world.shelfDepth;
    const shelfUnitWidth = 1.0; // Базовая ширина секции
    const shelfHeightUnit = CONFIG.world.shelfHeight;
    const totalHeight = CONFIG.world.floorHeight;
    const levels = Math.floor(totalHeight / shelfHeightUnit);

    // Стеллаж представляет собой две стенки и полки между ними
    // Для упрощения и оптимизации делаем "монолитные" колонны полок
    
    const blockHalf = this.blockSize / 2;
    
    // Генерируем 4 стороны квадрата стеллажа (или крест)
    // Для простоты: две длинные полки вдоль X и две вдоль Z в центре блока
    
    const positions = [
      { axis: 'x', x: centerX, z: centerZ - 1.5, w: 6, d: shelfDepth },
      { axis: 'x', x: centerX, z: centerZ + 1.5, w: 6, d: shelfDepth },
      { axis: 'z', x: centerX - 1.5, z: centerZ, w: shelfDepth, d: 6 },
      { axis: 'z', x: centerX + 1.5, z: centerZ, w: shelfDepth, d: 6 },
    ];

    let sIndex = 0;
    let bIndex = bookData.length;

    positions.forEach(pos => {
      // Создаем полки (горизонтальные пластины)
      for (let l = 1; l < levels; l++) {
        const y = l * shelfHeightUnit;
        // Добавляем полку как инстанс
        shelfData.push({
          i: sIndex++,
          x: pos.axis === 'x' ? centerX : pos.x,
          y: y,
          z: pos.axis === 'z' ? centerZ : pos.z,
          w: pos.axis === 'x' ? pos.w : shelfDepth,
          h: 0.05, // Толщина полки
          d: pos.axis === 'x' ? shelfDepth : pos.d
        });

        // Заполняем книгу над этой полкой
        if (Math.random() < CONFIG.world.bookDensity) {
          this.fillBooksOnShelf(
            pos.axis, 
            pos.axis === 'x' ? centerX : pos.x, 
            y + shelfHeightUnit/2, 
            pos.axis === 'z' ? centerZ : pos.z,
            pos.axis === 'x' ? pos.w : shelfDepth,
            pos.axis === 'x' ? shelfDepth : pos.d,
            bookData,
            bIndex
          );
          bIndex = bookData.length;
        }
      }
      
      // Вертикальные стойки (упрощенно - просто длинные бруски по краям)
      // Можно добавить в shelfData, но для экономии оставим только полки и книги
    });
  }

  fillBooksOnShelf(axis, x, y, z, lenW, lenD, bookData, startIndex) {
    // Параметры книги
    const bookW = 0.03; // Толщина
    const bookH = 0.25 + Math.random() * 0.1; // Высота
    const bookD = 0.15 + Math.random() * 0.1; // Глубина

    // Сколько книг влезает
    const count = Math.floor(lenW / (bookW + 0.01));
    
    let idx = startIndex;

    for (let i = 0; i < count; i++) {
      if (Math.random() > 0.95) continue; // Пропуски в ряду

      let bx, bz, brY, bw, bd;

      if (axis === 'x') {
        // Полка вдоль X
        bx = x - lenW/2 + bookW/2 + i * (bookW + 0.01);
        bz = z + (Math.random() - 0.5) * (lenD - bookD);
        brY = (Math.random() - 0.5) * 0.2; // Небольшой наклон
        bw = bookW;
        bd = bookD;
      } else {
        // Полка вдоль Z
        bz = z - lenD/2 + bookW/2 + i * (bookW + 0.01);
        bx = x + (Math.random() - 0.5) * (lenW - bookD);
        brY = (Math.random() - 0.5) * 0.2;
        bw = bookD;
        bd = bookW;
      }

      bookData.push({
        i: idx++,
        x: bx,
        y: y,
        z: bz,
        w: bw,
        h: bookH,
        d: bd,
        rx: 0,
        ry: brY,
        rz: (Math.random() - 0.5) * 0.1
      });
    }
  }

  destroyChunk(key) {
    const chunk = this.chunks.get(key);
    if (chunk) {
      this.scene.remove(chunk);
      // Очистка памяти (геометрии и материалы общие, не удаляем)
      // Удаляем только инстанс-меши если нужно, но здесь они собраны в группе
      this.chunks.delete(key);
    }
  }

  dispose() {
    this.chunks.forEach((chunk, key) => this.destroyChunk(key));
    this.bookGeo.dispose();
    this.shelfGeo.dispose();
    this.bookMat.dispose();
    this.shelfMat.dispose();
    this.floorMat.dispose();
    this.ceilingMat.dispose();
  }
}

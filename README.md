# Generated entirely by Qwen Coder, please don't take it seriously.

# Interstellar Library - Infinite WebGL Experience

An immersive WebGL scene featuring first-person flight through an infinitely generated library, stylistically inspired by the Tesseract scene from *Interstellar*.

![Interstellar Library](./public/preview.png)

## Features

- **Infinite Procedural Generation**: Chunk-based library generation with seamless transitions
- **First-Person Flight Controls**: WASD movement, mouse look, sprint, vertical movement
- **Interactive Books**: Click on books to trigger visual and audio reactions
- **Atmospheric Effects**: 
  - Volumetric-style lighting with warm amber/golden tones
  - Floating dust particles with GPU-accelerated shaders
  - Levitating books with gentle animation
- **Post-Processing**: Bloom, vignette, film grain for cinematic look
- **3D Spatial Audio**: Ambient drone and interactive sound effects
- **Mobile Support**: Virtual joysticks for touch devices
- **Performance Optimization**: 
  - Dynamic quality adjustment based on FPS
  - Frustum culling and chunk unloading
  - Instanced rendering where possible

## Tech Stack

- **Three.js** (r183+) - WebGL rendering
- **Vite** - Build tool and dev server
- **Web Audio API** - Spatial audio
- **Custom GLSL Shaders** - Particle effects

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Controls

### Desktop
| Key | Action |
|-----|--------|
| W/A/S/D | Move forward/left/backward/right |
| Mouse | Look around |
| Shift | Sprint (2x speed) |
| Space | Move up |
| Ctrl | Move down |
| Click | Interact with books |

### Mobile
- Left joystick: Movement
- Right joystick: Look (future enhancement)
- Tap: Interact

## Settings Panel

Access the settings panel in the top-left corner:
- **Speed**: Adjust movement speed
- **Bloom**: Control glow intensity
- **Particles**: Toggle dust particles
- **Sound**: Toggle audio on/off
- **Collisions**: Enable/disable collision detection (future feature)

## Configuration

Edit `src/config.js` to customize:
- Graphics quality levels
- Render distances
- Camera FOV and clipping
- Lighting colors and intensities
- Movement parameters
- Particle count and appearance
- Book color palette

## Performance Targets

| Platform | Target FPS | Max Draw Calls | Max VRAM |
|----------|-----------|----------------|----------|
| Desktop | 60+ | ≤800 | ≤512 MB |
| Mobile (Flagship) | 45+ | ≤600 | ≤384 MB |
| Mobile (Budget) | 30+ | ≤400 | ≤256 MB |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Project Structure

```
/workspace
├── index.html          # Main HTML entry point
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
├── src/
│   ├── main.js         # Application entry point
│   ├── config.js       # Global configuration
│   ├── ChunkManager.js # Procedural chunk generation
│   ├── ParticleSystem.js # GPU particle effects
│   ├── InputController.js # Input handling
│   └── AudioController.js # Web Audio API
└── public/             # Static assets
```

## Development Notes

### Shader Documentation

#### Particle Vertex Shader
- **Uniforms**: `time`, `color`, `pixelRatio`
- **Attributes**: `size`, `randomness`
- **Algorithm**: Sine/cosine-based floating motion with distance attenuation

#### Particle Fragment Shader
- Creates soft-edged circular particles
- Additive blending for glow effect

### Chunk Generation Algorithm

1. Seeded random ensures consistent generation per coordinate
2. Each chunk contains:
   - Bookshelf columns with variable orientation
   - Books with varied sizes and colors
   - Floating atmospheric books
3. Chunks load/unload based on camera distance

### Performance Optimizations

- Material reuse across all chunks
- Geometry caching for book meshes
- Frustum culling via Three.js
- Dynamic render distance adjustment
- Particle wrapping (infinite illusion)

## License

ISC License - See LICENSE file for details

All code is original. Book colors and designs are procedurally generated.

## Credits

Inspired by the Tesseract library scene from Christopher Nolan's *Interstellar* (2014).

This project uses no assets from the film - all visuals are procedurally generated.

---

**Built with ❤️ using Three.js and WebGL**

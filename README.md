# Black Hole Salvage

A 3D space mining game built with vanilla JavaScript and Three.js for Ludum Dare 58. Navigate the dangerous edge of a black hole's event horizon while mining asteroids for precious minerals.

## Game Overview

You're piloting a salvage ship on the edge of a black hole. Your mission: mine asteroids for iron ore before the gravitational pull drags you into the void. Balance your warp speed to stay ahead of the crushing gravity while your ship's laser automatically targets and destroys asteroids. Collect the mineral debris before time runs out!

## Core Gameplay

- **Survival**: Maintain enough warp speed to escape the black hole's pull
- **Mining**: Your laser automatically targets asteroids within range
- **Collection**: Destroyed asteroids explode into collectible mineral particles
- **Resource Management**: Balance fuel consumption with warp speed
- **Distance Management**: Warp 2.2 is equilibrium - lower pulls you in, higher pushes you out

## Implemented Features

### Visual & Environment
- **3D Scene**: Full 3D space environment with black hole and accretion disk
- **Starfield Skybox**:
- **Animated Accretion Disk**: Swirling matter around the black hole
- **3D Ship Model**: GLB model with realistic scale and movement
- **Dynamic Camera**: Smooth cinematic intro animation with waypoint system
- **Particle Effects**: 160-280 brown mineral chunks per asteroid explosion

### Ship Systems
- **Automatic Laser**: Red targeting laser that locks onto nearest asteroid in front
- **Shield System**: Cyan force field that flashes on collision
- **Warp Drive**: Adjustable warp speed (0.0-6.5) with arrow keys
- **Fuel System**: Fuel consumption based on warp level (warp/10 per second)
- **Cargo Hold**: 20-ton capacity for collected iron ore
- **Ship Banking**: Ship tilts and pitches based on movement direction

### Asteroid System
- **Procedural Spawning**: Random asteroids spawn every 5 seconds
- **5 Unique Models**: Variety of asteroid shapes and sizes
- **Health System**: 1-5 seconds of laser fire to destroy
- **Smart Targeting**: Only targets asteroids in front of ship
- **Collision Detection**: Shield damage on impact
- **Retargeting**: Laser retargets when asteroid is destroyed or hits ship

### Mining & Collection
- **Particle Explosions**: Asteroids explode into 160-280 collectible chunks
- **Mineral Variety**: 6 different geometric shapes (cubes, tetrahedrons, octahedrons, etc.)
- **Brown Color Palette**: 7 shades of brown/earth tones
- **Tumbling Motion**: Particles rotate realistically as they fly
- **Auto-Collection**: Particles collected within 8 units of ship
- **Iron Tracking**: 0.5-2.0 tons per asteroid explosion

### HUD & UI
- **Status Bars**: Real-time warp, fuel, and iron cargo displays
- **Distance Meter**: Shows clicks to event horizon (large cyan display)
- **Animated UI Panel**: Slides up from bottom with custom graphics
- **Black HUD Element**: Decorative hexagonal HUD element
- **Visual Feedback**: Bars update in real-time with color coding

### Game Flow
- **Main Menu**: Title screen with scrolling intro text
- **Controls Modal**: Volume controls and instructions
- **Cinematic Intro**: 4-waypoint ship fly-in animation
- **Game Over State**: Modal when pulled into black hole
- **Game Reset**: Properly resets all systems on restart
- **Menu System**: Full navigation between menu and gameplay

### Technical Features
- **ES6 Modules**: Modern JavaScript module system with Import Maps
- **GLTFLoader**: Dynamic loading of 3D models
- **Audio System**: Background music and sound effects
- **Input System**: WASD movement, arrow key controls, mouse support
- **Pointer Lock**: FPS-style camera control during gameplay
- **Asset Caching**: Efficient loading and reuse of 3D models
- **Memory Management**: Proper cleanup of particles and asteroids
- **Performance**: Smooth 60fps with hundreds of particles

## Quick Start

1. **Clone or download** this repository
2. **Start a local server**:
   ```bash
   # Using Python (recommended)
   python3 -m http.server 8000
   
   # Or using Node.js
   npm install
   npm start
   ```
3. **Open your browser** and go to `http://localhost:8000`
4. **Start coding** your game!

## Project Structure

```
ld58/
├── index.html              # Main HTML file
├── package.json            # Project configuration
├── README.md              # This file
├── src/                   # Source code
│   ├── core/             # Core game systems
│   │   ├── Game.js       # Main game class
│   │   └── GameObject.js # Base game object class
│   ├── objects/          # Game objects
│   │   ├── Player.js     # Player controller
│   │   └── Camera.js     # Camera system
│   └── utils/            # Utility classes
│       ├── AssetLoader.js    # Asset loading system
│       ├── InputHandler.js   # Input handling
│       └── GameUtils.js      # Utility functions
├── assets/               # Game assets
│   ├── textures/        # Texture files
│   ├── models/          # 3D models
│   └── sounds/          # Audio files
└── build/               # Build output (if needed)
```

## Controls

### Ship Movement
- **W**: Move up (screen coordinates)
- **S**: Move down (screen coordinates)
- **A**: Move left (screen coordinates)
- **D**: Move right (screen coordinates)

### Ship Systems
- **Up Arrow**: Increase warp speed (+0.1)
- **Down Arrow**: Decrease warp speed (-0.1)

### Game Controls
- **F1**: Toggle debug position display
- **ESC**: Open/Close menu
- **Mouse**: Camera control (during pointer lock)

### How to Play

1. **Balance Your Warp Speed**: 
   - Warp 2.2 is equilibrium (no change in distance)
   - Below 2.2: You're being pulled toward the black hole
   - Above 2.2: You're escaping from the black hole

2. **Manage Your Fuel**:
   - Fuel consumption = warp speed ÷ 10 per second
   - Higher warp = faster fuel drain
   - If fuel runs out, warp decreases by 0.2/second

3. **Mine Asteroids**:
   - Laser automatically targets nearest asteroid in front
   - Takes 1-5 seconds to destroy each asteroid
   - Avoid collisions - they reduce your distance!

4. **Collect Iron**:
   - Destroyed asteroids explode into mineral chunks
   - Fly within 8 units to auto-collect
   - Each asteroid yields 0.5-2.0 tons

5. **Survive**:
   - Don't let distance reach 0!
   - Balance mining with avoiding collisions
   - Keep enough fuel for emergency acceleration

## Game Mechanics

### Distance System
- Start: 100 clicks from event horizon
- Each collision: Lose clicks equal to your warp speed
- Reach 0 clicks: Game Over (pulled into black hole)

### Warp Speed Effects
- **Below 2.2**: Distance decreases (being pulled in)
- **At 2.2**: Distance stable (equilibrium)
- **Above 2.2**: Distance increases (escaping)

### Collision Damage
- Damage = Current warp speed
- Shield flashes on impact
- Asteroid bounces away after collision
- Laser retargets after collision

## Technical Architecture

### Core Systems
- **Game.js**: Main game loop, scene management, asteroid spawning
- **MenuManager.js**: Menu system, game state transitions
- **InputHandler.js**: Keyboard and mouse input handling
- **AssetLoader.js**: GLB model loading and caching
- **AudioManager.js**: Music and sound effects

### Key Features
- **Waypoint Animation System**: Smooth camera transitions between points
- **Particle System**: Dynamic explosion effects with physics
- **Laser Targeting**: Distance-based automatic targeting with line rendering
- **Resource Management**: Fuel consumption and cargo tracking
- **Collision Detection**: Sphere-based collision with shield effects

## Browser Compatibility

- **Chrome 90+** (Recommended)
- **Firefox 88+**
- **Safari 14+**
- **Edge 90+**

Requires WebGL support and ES6 module compatibility.

## Performance Notes

- Game runs at 60fps with hundreds of particles
- Optimized for desktop browsers
- Particle explosions may impact performance on lower-end devices
- Debug mode (F1) shows position coordinates for development

## Development

Built for Ludum Dare 58 in 48 hours. The game demonstrates:
- Procedural content generation (asteroids, particles, stars)
- Physics-based gameplay mechanics
- Real-time resource management
- 3D rendering with Three.js r180
- Audio and visual feedback systems

## Credits

**Game Design & Programming**: Keith Kritselis
**Created for**: Ludum Dare 58 (2025)
**Theme**: This Vessel
**Tech Stack**: Vanilla JavaScript, Three.js, HTML5, CSS3

## License

This project is available for educational purposes and game jam learning.
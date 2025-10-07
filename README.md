# Black Hole Salvage

A 3D space mining game built with vanilla JavaScript and Three.js for Ludum Dare 58. Navigate the dangerous edge of a black hole's event horizon while mining asteroids for precious minerals.

## Game Overview

You're piloting a salvage ship on the edge of a black hole. Your mission: mine asteroids for precious minerals before the gravitational pull drags you into the void. Balance your warp speed to stay ahead of the crushing gravity while your ship's laser automatically targets and destroys asteroids. Collect mineral debris, fill your cargo hold, then hyperjump to the nearest processing station to sell your haul and upgrade your ship!

## Core Gameplay

- **Survival**: Maintain enough warp speed to escape the black hole's pull
- **Mining**: Your laser automatically targets asteroids within range
- **Collection**: Destroyed asteroids explode into collectible mineral particles
- **Resource Management**: Balance fuel consumption with warp speed
- **Distance Management**: Warp 2.2 is equilibrium - lower pulls you in, higher pushes you out
- **Trading & Upgrades**: Hyperjump to station to sell cargo and purchase ship upgrades
- **Progression**: Upgrade your ship, weapons, engines, and extractors for better performance

## Implemented Features

### Visual & Environment
- **3D Scene**: Full 3D space environment with black hole and accretion disk
- **Starfield Skybox**: 10,000+ procedurally placed stars
- **Animated Accretion Disk**: Swirling matter around the black hole
- **3D Ship Model**: GLB model with realistic scale and movement
- **Dynamic Camera**: Smooth cinematic intro animation with waypoint system
- **Particle Effects**: 160-280 brown mineral chunks per asteroid explosion
- **Debris Stream**: 6 particles every 0.1s streaming towards camera for sense of motion
- **Progressive Red Screen**: Danger overlay intensifies as you approach event horizon (< 20 clicks)
- **Visual Warnings**: Yellow tutorial hints and red danger alerts

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
- **Passive Collection**: 0.05-0.15 tons/second from debris stream (scales with extractor upgrades)
- **14 Mineral Types**: From common Iron to legendary Voidstone

### HUD & UI
- **Status Bars**: Real-time warp, fuel, and iron cargo displays
- **Distance Meter**: Shows clicks to event horizon (large cyan display)
- **Animated UI Panel**: Slides up from bottom with custom graphics
- **Black HUD Element**: Decorative hexagonal HUD element
- **Visual Feedback**: Bars update in real-time with color coding

### Trading Station System
- **Hyperjump**: Press SPACEBAR to instantly jump to Proxima Processing Station
- **Automatic Selling**: Cargo automatically sold for credits (50 CR per ton of iron)
- **Mission Reset**: Fuel refilled to max and distance reset to 100 clicks each mission
- **3D Ship Viewer**: Rotating display of your current ship
- **Currency System**: Accumulate credits to purchase upgrades
- **Mineral Markets Tab**: View all 14 available minerals with rarity, value, and bonus effects

### Upgrade System
- **Ships** (3 options):
  - Salvager-Class (starter): 6.5 warp, 100 fuel, 20t cargo, 1 slot
  - Hauler-Class (5,000 CR): 7.5 warp, 150 fuel, 40t cargo, 2 slots
  - Racer-Class (8,000 CR): 9.5 warp, 120 fuel, 15t cargo, 1 slot
- **Weapons** (4 options):
  - Mining Laser Mk I (starter): Range 30, Power 1.0x
  - Mining Laser Mk II (1,500 CR): Range 35, Power 1.25x
  - Mining Laser Mk III (3,500 CR): Range 40, Power 1.5x
  - Plasma Cutter (10,000 CR): Range 45, Power 10.0x
- **Engines** (4 options):
  - Standard Drive (starter): 6.5 warp, 100% fuel efficiency
  - Efficient Drive (2,000 CR): 7.0 warp, 75% fuel efficiency
  - Advanced Drive (4,500 CR): 8.0 warp, 50% fuel efficiency
  - Hyperspace Drive (12,000 CR): 11.0 warp, 30% fuel efficiency
- **Extractors** (4 options):
  - Basic Collector (starter): 1.0x collection, 3 elements
  - Collector Mk II (2,500 CR): 1.5x collection, 6 elements
  - Collector Mk III (6,000 CR): 2.0x collection, 9 elements
  - Quantum Collector (15,000 CR): 3.0x collection, all 14 elements
- **JSON-Driven**: All upgrade data in separate JSON files for easy modification

### Tutorial System
- **Controls Hint**: Shown when animation completes and manual control begins
- **Shield Collision Hint**: "Try to avoid hitting the asteroids, they knock you closer to the black hole"
- **Debris Collection Hint**: "Fly through the debris field to capture more elements"
- **Cargo Full Hint**: "The Cargo hold is full! Great job! Now hit the SPACEBAR to initiate the hyperjump"
- **Danger Warning**: Red pulsing "DANGER: Approaching Event Horizon" when distance < 40 clicks
- **Contextual Display**: Messages appear only once per mission and at appropriate times

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
│   ├── data/             # Game data (JSON)
│   │   ├── loot.json     # 14 mineral types with rarity and values
│   │   ├── ships.json    # Ship upgrades and stats
│   │   ├── weapons.json  # Weapon upgrades
│   │   ├── engines.json  # Engine/propulsion upgrades
│   │   └── extractors.json # Extractor upgrades
│   ├── objects/          # Game objects
│   │   ├── Player.js     # Player controller
│   │   └── Camera.js     # Camera system
│   └── utils/            # Utility classes
│       ├── AssetLoader.js    # Asset loading system
│       ├── InputHandler.js   # Input handling
│       ├── MenuManager.js    # Menu and station UI
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
- **SPACEBAR**: Hyperjump to trading station

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

6. **Trade & Upgrade**:
   - Press SPACEBAR to hyperjump to trading station
   - Cargo automatically sold for 50 CR per ton
   - Purchase better ships, weapons, engines, and extractors
   - Return with full fuel and fresh distance to mine again

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
- **Game.js**: Main game loop, scene management, asteroid spawning, upgrade system
- **MenuManager.js**: Menu system, game state transitions, trading station UI
- **InputHandler.js**: Keyboard and mouse input handling
- **AssetLoader.js**: GLB model loading and JSON data loading
- **AudioManager.js**: Music and sound effects

### Key Features
- **Waypoint Animation System**: Smooth camera transitions between points
- **Particle System**: Dynamic explosion effects with physics
- **Debris Stream System**: Camera-space particles for motion feedback
- **Laser Targeting**: Distance-based automatic targeting with line rendering
- **Resource Management**: Fuel consumption, cargo tracking, and currency
- **Collision Detection**: Sphere-based collision with shield effects
- **Trading Station**: 3D ship viewer with tabbed upgrade interface
- **Tutorial System**: Context-sensitive hints and warnings
- **Upgrade System**: JSON-driven progression with stat effects

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
- Procedural content generation (asteroids, particles, stars, debris streams)
- Physics-based gameplay mechanics
- Real-time resource management
- 3D rendering with Three.js r180
- Audio and visual feedback systems
- Data-driven progression with JSON
- Economy and upgrade systems
- Context-aware tutorial system

## Credits

**Game Design & Programming**: Keith Kritselis
**Created for**: Ludum Dare 58 (2025)
**Theme**: This Vessel
**Tech Stack**: Vanilla JavaScript, Three.js, HTML5, CSS3

## License

This project is available for educational purposes and game jam learning.
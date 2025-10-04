# LD58 Game Framework

A complete HTML5 3D game framework built with vanilla JavaScript and Three.js for Ludum Dare 58.

## Features

- **Complete Game Framework**: Ready-to-use game architecture with scene management, game objects, and input handling
- **Three.js Integration**: Full 3D rendering with lighting, shadows, and materials
- **Input System**: Keyboard, mouse, and touch input support with event callbacks
- **Asset Loading**: Texture, model, and audio loading with caching and progress tracking
- **Game Objects**: Base GameObject class with collision detection and physics
- **Player Controller**: First-person player with movement, jumping, and mouse look
- **Camera System**: Flexible camera with follow modes and smooth movement
- **Utilities**: Comprehensive utility functions for math, colors, arrays, and more
- **Debug Mode**: Built-in debug information display (F1 to toggle)

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

- **WASD**: Move player
- **Mouse**: Look around
- **Space**: Jump
- **F1**: Toggle debug mode

## Creating Your Game

### 1. Modify the Game Class

Edit `src/core/Game.js` to add your game logic:

```javascript
// Add new game objects
createInitialObjects() {
    // Your custom objects here
    this.createEnemies();
    this.createCollectibles();
    this.createEnvironment();
}

// Add game mechanics
update(deltaTime) {
    // Your game logic here
    this.checkCollisions();
    this.updateEnemies(deltaTime);
    this.updateUI();
}
```

### 2. Create Custom Game Objects

Extend the GameObject class:

```javascript
class Enemy extends GameObject {
    constructor() {
        super();
        this.createMesh();
        this.addTag('enemy');
        this.enableCollision();
    }
    
    update(deltaTime, inputHandler) {
        // Enemy AI logic
        this.moveTowardsPlayer();
        super.update(deltaTime, inputHandler);
    }
}
```

### 3. Add Assets

Place your assets in the appropriate folders:
- Textures: `assets/textures/`
- Models: `assets/models/`
- Sounds: `assets/sounds/`

### 4. Customize the UI

Edit `index.html` to modify the user interface:

```html
<div id="ui">
    <div id="score">Score: 0</div>
    <div id="health">Health: 100</div>
    <!-- Your custom UI elements -->
</div>
```

## Framework Classes

### Game
The main game class that manages the scene, camera, renderer, and game loop.

### GameObject
Base class for all game objects with position, rotation, scale, and collision detection.

### Player
First-person player controller with movement, jumping, and mouse look.

### Camera
Flexible camera system with follow modes and smooth movement.

### InputHandler
Handles keyboard, mouse, and touch input with event callbacks.

### AssetLoader
Loads textures, models, and audio with caching and progress tracking.

### GameUtils
Utility functions for math, colors, arrays, and common operations.

## Development Tips

1. **Use the debug mode** (F1) to monitor performance and game state
2. **Check the browser console** for errors and debug information
3. **Test on different devices** - the framework supports touch input
4. **Optimize performance** by limiting the number of objects and using efficient materials
5. **Use the utility functions** in GameUtils for common operations

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License - feel free to use this framework for your game jam project!

## Support

If you encounter any issues or have questions, check the browser console for error messages and debug information.
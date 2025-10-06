class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.gameObjects = [];
        this.inputHandler = null;
        this.assetLoader = null;
        this.gameLoop = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
        this.isInitialized = false;
        this.debugMode = false;
        this.shipDebugMode = false; // Disabled for testing animation (will auto-enable after last waypoint)
        this.animationLooping = false; // Animation plays once
        
        // Game state
        this.gameState = {
            score: 0,
            level: 1,
            lives: 3,
            time: 0
        };
        
        // Ship stats
        this.shipStats = {
            warp: 2.2,          // Current warp level (0.0 - 11.0)
            warpMax: 6.5,       // Max warp for base ship
            fuel: 100,          // Current fuel (0 - 100%)
            fuelMax: 100,       // Max fuel capacity
            iron: 0.0,          // Current iron cargo (tons)
            cargoMax: 20.0,     // Max cargo capacity (tons)
            distance: 100.0     // Distance to event horizon (clicks)
        };
        
        // Player economy
        this.credits = 0;
        this.ironPrice = 50; // Credits per ton of iron
        
        // Owned upgrades
        this.ownedUpgrades = {
            ship: 'base_ship',
            weapon: 'laser_mk1',
            engine: 'standard_drive',
            extractor: 'basic_collector'
        };
        
        // Fuel consumption timer
        this.fuelConsumptionTimer = 0;
        
        // Equilibrium warp speed (neither approaching nor escaping)
        this.equilibriumWarp = 2.2;
        
        // Trading station
        this.stationScene = null;
        this.stationCamera = null;
        this.stationRenderer = null;
        this.stationShip = null;
        
        // Asteroid system
        this.asteroidModels = [];
        this.asteroids = [];
        this.asteroidSpawnTimer = 0;
        this.asteroidSpawnInterval = 5.0; // seconds
        
        // Laser system
        this.laserRange = 30; // Units
        this.laserBeam = null;
        this.currentLaserTarget = null;
        
        // Particle system for explosions
        this.particles = [];
        
        // Debris stream system
        this.debrisParticles = [];
        this.debrisSpawnTimer = 0;
        this.debrisSpawnInterval = 0.1; // Spawn debris every 0.1 seconds
        this.passiveIronTimer = 0;
        this.passiveIronInterval = 1.0; // Collect passive iron every second
        
        // Game over state
        this.isGameOver = false;
        
        // Tutorial message tracking
        this.tutorialShown = {
            shieldHit: false,
            asteroidDestroyed: false,
            cargoFull: false,
            controls: false
        };
        
        // Warning states
        this.dangerWarningShown = false;
    }

    async init() {
        try {
            console.log('Initializing game...');
            
            // Setup Three.js
            this.setupRenderer();
            this.setupScene();
            this.setupCamera();
            this.setupLighting();
            
            // Setup game systems
            this.setupInput();
            this.setupAssetLoader();
            
            // Load initial assets
            await this.loadAssets();
            
            // Create initial game objects
            await this.createInitialObjects();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('Game initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }

    setupRenderer() {
        const container = document.getElementById('gameContainer');
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        
        // Use container dimensions instead of window dimensions
        const width = Math.min(container.clientWidth, 1280);
        const height = container.clientHeight;
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x87CEEB, 1); // Sky blue
        
        container.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011); // Deep space background
        
        // Create skydome with starfield
        this.createSkydome();
    }

    setupCamera() {
        const container = document.getElementById('gameContainer');
        const width = Math.min(container.clientWidth, 1280);
        const height = container.clientHeight;
        
        this.camera = new THREE.PerspectiveCamera(
            75, 
            width / height, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 8, 15);
        this.camera.lookAt(0, 0, 0);
    }

    setupLighting() {
        // Ambient light - increased intensity for better visibility
        const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        
        // Point light - increased intensity
        const pointLight = new THREE.PointLight(0xffffff, 1.0, 100);
        pointLight.position.set(0, 10, 0);
        this.scene.add(pointLight);
    }

    createSkydome() {
        // Create a large sphere for the starfield
        const skydomeGeometry = new THREE.SphereGeometry(500, 64, 32);
        
        // Load the starfield texture
        const textureLoader = new THREE.TextureLoader();
        const starTexture = textureLoader.load('assets/textures/starmap.png');
        
        const skydomeMaterial = new THREE.MeshBasicMaterial({
            map: starTexture,
            side: THREE.BackSide, // Render inside the sphere
            transparent: true,
            opacity: 0.8
        });
        
        const skydome = new THREE.Mesh(skydomeGeometry, skydomeMaterial);
        this.scene.add(skydome);
        
        console.log('Skydome created with starfield texture');
    }

    setupInput() {
        this.inputHandler = new InputHandler();
        this.inputHandler.init();
        
        // Toggle debug mode
        this.inputHandler.onKeyDown('F1', () => {
            this.toggleDebugMode();
        });
        
        // Hyperjump to trading station
        this.inputHandler.onKeyDown('Space', () => {
            // Only allow hyperjump when game is running and player is in control
            if (this.isRunning && this.shipDebugMode && !this.isGameOver) {
                this.openTradingStation();
            }
        });
    }

    setupAssetLoader() {
        this.assetLoader = new AssetLoader();
    }

    async loadAssets() {
        const loadingElement = document.getElementById('loading');
        
        try {
            // Load basic textures
            const textures = {
            };
            
            // Load all JSON data files
            const [lootData, shipsData, weaponsData, enginesData, extractorsData] = await Promise.all([
                fetch('src/data/loot.json').then(r => r.json()),
                fetch('src/data/ships.json').then(r => r.json()),
                fetch('src/data/weapons.json').then(r => r.json()),
                fetch('src/data/engines.json').then(r => r.json()),
                fetch('src/data/extractors.json').then(r => r.json())
            ]);
            
            this.lootTable = lootData.lootTable || [];
            this.shipsData = shipsData.ships || [];
            this.weaponsData = weaponsData.weapons || [];
            this.enginesData = enginesData.engines || [];
            this.extractorsData = extractorsData.extractors || [];
            
            console.log('Loaded game data:');
            console.log('- Minerals:', this.lootTable.length);
            console.log('- Ships:', this.shipsData.length);
            console.log('- Weapons:', this.weaponsData.length);
            console.log('- Engines:', this.enginesData.length);
            console.log('- Extractors:', this.extractorsData.length);
            
            // Store loaded assets
            this.assets = { textures };
            
            loadingElement.textContent = 'Assets loaded!';
            setTimeout(() => {
                loadingElement.style.display = 'none';
            }, 1000);
            
        } catch (error) {
            console.warn('Some assets failed to load:', error);
            // Continue without those assets
            this.assets = { textures: {} };
            this.lootTable = [];
            this.shipsData = [];
            this.weaponsData = [];
            this.enginesData = [];
            this.extractorsData = [];
            loadingElement.style.display = 'none';
        }
    }

    async createInitialObjects() {
        // Create a refractive glass sphere
        this.createGlassSphere();
        
        // Create accretion disk planes
        this.createAccretionDisk();
        
        // Create ship (async)
        await this.createShip();
        
        // Load asteroid models (async)
        await this.loadAsteroidModels();
        
        console.log('Glass sphere, accretion disk, ship, and asteroids created');
    }

    createGlassSphere() {
        // Create sphere geometry (25% larger)
        const sphereGeometry = new THREE.SphereGeometry(3.5, 32, 32);
        
        // Create refractive glass material
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            roughness: 0.0,
            metalness: 0.0,
            transmission: 0.9,
            thickness: 1.0,
            ior: 1.5, // Index of refraction (glass)
            clearcoat: 1.0,
            clearcoatRoughness: 0.0
        });
        
        const glassSphere = new THREE.Mesh(sphereGeometry, glassMaterial);
        glassSphere.position.set(0, 0, 0);
        this.scene.add(glassSphere);
        
        // Store reference for future use
        this.glassSphere = glassSphere;
    }

    createAccretionDisk() {
        // Load the swirl texture
        const textureLoader = new THREE.TextureLoader();
        const swirlTexture = textureLoader.load('assets/textures/swirl.png');
        
        // Set texture properties
        swirlTexture.wrapS = THREE.RepeatWrapping;
        swirlTexture.wrapT = THREE.RepeatWrapping;

        // Create inner ring (closer to black hole)
        const innerRingGeometry = new THREE.RingGeometry(2.25, 8, 32);
        const innerRingMaterial = new THREE.ShaderMaterial({
            uniforms: {
                texture1: { value: swirlTexture },
                color: { value: new THREE.Color(0xff6600) },
                time: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D texture1;
                uniform vec3 color;
                uniform float time;
                varying vec2 vUv;
                
                // Inigo Quilez domain warping functions
                const mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );
                
                float noise( in vec2 p ) {
                    return sin(p.x)*sin(p.y);
                }
                
                float fbm4( vec2 p ) {
                    float f = 0.0;
                    f += 0.5000*noise( p ); p = m*p*2.02;
                    f += 0.2500*noise( p ); p = m*p*2.03;
                    f += 0.1250*noise( p ); p = m*p*2.01;
                    f += 0.0625*noise( p );
                    return f/0.9375;
                }
                
                float fbm6( vec2 p ) {
                    float f = 0.0;
                    f += 0.500000*(0.5+0.5*noise( p )); p = m*p*2.02;
                    f += 0.250000*(0.5+0.5*noise( p )); p = m*p*2.03;
                    f += 0.125000*(0.5+0.5*noise( p )); p = m*p*2.01;
                    f += 0.062500*(0.5+0.5*noise( p )); p = m*p*2.04;
                    f += 0.031250*(0.5+0.5*noise( p )); p = m*p*2.01;
                    f += 0.015625*(0.5+0.5*noise( p ));
                    return f/0.96875;
                }
                
                vec2 fbm4_2( vec2 p ) {
                    return vec2(fbm4(p), fbm4(p+vec2(7.8)));
                }
                
                vec2 fbm6_2( vec2 p ) {
                    return vec2(fbm6(p+vec2(16.8)), fbm6(p+vec2(11.5)));
                }
                
                float warpedPattern( vec2 q ) {
                    q += 0.03*sin( vec2(0.27,0.23)*time + length(q)*vec2(4.1,4.3));
                    
                    vec2 o = fbm4_2( 0.9*q );
                    o += 0.04*sin( vec2(0.12,0.14)*time + length(o));
                    vec2 n = fbm6_2( 3.0*o );
                    
                    float f = 0.5 + 0.5*fbm4( 1.8*q + 6.0*n );
                    return mix( f, f*f*f*3.5, f*abs(n.x) );
                }
                
                void main() {
                    vec4 texColor = texture2D(texture1, vUv);
                    
                    // Create domain warped pattern (smaller scale)
                    vec2 warpedUV = vUv * 4.0;
                    float warpPattern = warpedPattern(warpedUV + time * 0.1);
                    
                    // Create swirling motion with warping
                    vec2 swirlUV = vUv;
                    float angle = time * 0.2 + length(vUv - 0.5) * 1.5;
                    swirlUV.x = cos(angle) * (vUv.x - 0.5) - sin(angle) * (vUv.y - 0.5) + 0.5;
                    swirlUV.y = sin(angle) * (vUv.x - 0.5) + cos(angle) * (vUv.y - 0.5) + 0.5;
                    
                    float swirlPattern = warpedPattern(swirlUV * 3.0 + time * 0.15);
                    
                    // Combine patterns
                    float glowIntensity = (warpPattern + swirlPattern) * 0.5;
                    glowIntensity = smoothstep(0.2, 0.8, glowIntensity);
                    
                    // Apply orange tint and add glow with increased contrast
                    vec3 finalColor = texColor.rgb * color;
                    finalColor += vec3(1.0, 0.5, 0.0) * glowIntensity * 0.4;
                    
                    // Increase contrast
                    finalColor = (finalColor - 0.5) * 1.5 + 0.5;
                    finalColor = clamp(finalColor, 0.0, 1.0);
                    
                    gl_FragColor = vec4(finalColor, texColor.a);
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
        innerRing.rotation.x = 0; // Face the camera (vertical)
        innerRing.position.set(0, 0, 0);
        this.scene.add(innerRing);

        // Create outer ring (further from black hole)
        const outerRingGeometry = new THREE.RingGeometry(5, 8, 32);
        const outerRingMaterial = new THREE.ShaderMaterial({
            uniforms: {
                texture1: { value: swirlTexture },
                color: { value: new THREE.Color(0xff4400) },
                time: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D texture1;
                uniform vec3 color;
                uniform float time;
                varying vec2 vUv;
                
                // Inigo Quilez domain warping functions
                const mat2 m = mat2( 0.80,  0.60, -0.60,  0.80 );
                
                float noise( in vec2 p ) {
                    return sin(p.x)*sin(p.y);
                }
                
                float fbm4( vec2 p ) {
                    float f = 0.0;
                    f += 0.5000*noise( p ); p = m*p*2.02;
                    f += 0.2500*noise( p ); p = m*p*2.03;
                    f += 0.1250*noise( p ); p = m*p*2.01;
                    f += 0.0625*noise( p );
                    return f/0.9375;
                }
                
                float fbm6( vec2 p ) {
                    float f = 0.0;
                    f += 0.500000*(0.5+0.5*noise( p )); p = m*p*2.02;
                    f += 0.250000*(0.5+0.5*noise( p )); p = m*p*2.03;
                    f += 0.125000*(0.5+0.5*noise( p )); p = m*p*2.01;
                    f += 0.062500*(0.5+0.5*noise( p )); p = m*p*2.04;
                    f += 0.031250*(0.5+0.5*noise( p )); p = m*p*2.01;
                    f += 0.015625*(0.5+0.5*noise( p ));
                    return f/0.96875;
                }
                
                vec2 fbm4_2( vec2 p ) {
                    return vec2(fbm4(p), fbm4(p+vec2(7.8)));
                }
                
                vec2 fbm6_2( vec2 p ) {
                    return vec2(fbm6(p+vec2(16.8)), fbm6(p+vec2(11.5)));
                }
                
                float warpedPattern( vec2 q ) {
                    q += 0.02*sin( vec2(0.27,0.23)*time + length(q)*vec2(3.1,3.3));
                    
                    vec2 o = fbm4_2( 0.7*q );
                    o += 0.03*sin( vec2(0.12,0.14)*time + length(o));
                    vec2 n = fbm6_2( 2.5*o );
                    
                    float f = 0.5 + 0.5*fbm4( 1.5*q + 5.0*n );
                    return mix( f, f*f*f*3.0, f*abs(n.x) );
                }
                
                void main() {
                    vec4 texColor = texture2D(texture1, vUv);
                    
                    // Create domain warped pattern (smaller scale, slower for outer ring)
                    vec2 warpedUV = vUv * 3.0;
                    float warpPattern = warpedPattern(warpedUV + time * 0.08);
                    
                    // Create swirling motion with warping
                    vec2 swirlUV = vUv;
                    float angle = time * 0.15 + length(vUv - 0.5) * 1.2;
                    swirlUV.x = cos(angle) * (vUv.x - 0.5) - sin(angle) * (vUv.y - 0.5) + 0.5;
                    swirlUV.y = sin(angle) * (vUv.x - 0.5) + cos(angle) * (vUv.y - 0.5) + 0.5;
                    
                    float swirlPattern = warpedPattern(swirlUV * 2.5 + time * 0.12);
                    
                    // Combine patterns
                    float glowIntensity = (warpPattern + swirlPattern) * 0.5;
                    glowIntensity = smoothstep(0.15, 0.7, glowIntensity);
                    
                    // Apply orange tint and add glow with increased contrast
                    vec3 finalColor = texColor.rgb * color;
                    finalColor += vec3(1.0, 0.4, 0.0) * glowIntensity * 0.3;
                    
                    // Increase contrast
                    finalColor = (finalColor - 0.5) * 1.5 + 0.5;
                    finalColor = clamp(finalColor, 0.0, 1.0);
                    
                    gl_FragColor = vec4(finalColor, texColor.a);
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        outerRing.rotation.x = -Math.PI / 2 + (-20 * Math.PI / 180); // Rotate 20 degrees from horizontal
        outerRing.position.set(0, 0, 0);
        this.scene.add(outerRing);

        // Create black backing disks
        this.createBlackDisks();

        // Create disk cover
        this.createDiskCover();

        // Store references for future use
        this.accretionDisk = {
            innerRing: innerRing,
            outerRing: outerRing,
            swirlTexture: swirlTexture
        };
    }

    createBlackDisks() {
        // Create black disk behind inner ring (vertical)
        const innerBlackGeometry = new THREE.RingGeometry(2.25, 8, 32);
        const innerBlackMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, // Black
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const innerBlackDisk = new THREE.Mesh(innerBlackGeometry, innerBlackMaterial);
        innerBlackDisk.rotation.x = 0; // Face the camera (vertical)
        innerBlackDisk.position.set(0, 0, -0.1); // Slightly behind the inner ring
        this.scene.add(innerBlackDisk);

        // Create black disk below outer ring (horizontal)
        const outerBlackGeometry = new THREE.RingGeometry(5, 8, 32);
        const outerBlackMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, // Black
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const outerBlackDisk = new THREE.Mesh(outerBlackGeometry, outerBlackMaterial);
        outerBlackDisk.rotation.x = -Math.PI / 2 + (-20 * Math.PI / 180); // Same rotation as outer ring
        outerBlackDisk.position.set(0, -0.1, 0); // Slightly below the outer ring
        this.scene.add(outerBlackDisk);

        // Store references
        this.blackDisks = {
            innerBlack: innerBlackDisk,
            outerBlack: outerBlackDisk
        };
    }

    createDiskCover() {
        // Load the disk cover texture
        const textureLoader = new THREE.TextureLoader();
        const diskCoverTexture = textureLoader.load('assets/textures/disk_cover.png');
        
        // Set texture properties
        diskCoverTexture.wrapS = THREE.RepeatWrapping;
        diskCoverTexture.wrapT = THREE.RepeatWrapping;

        // Create disk cover geometry (same size as inner ring)
        const diskCoverGeometry = new THREE.RingGeometry(2.25, 8, 32);
        const diskCoverMaterial = new THREE.MeshBasicMaterial({
            map: diskCoverTexture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0
        });
        const diskCover = new THREE.Mesh(diskCoverGeometry, diskCoverMaterial);
        diskCover.rotation.x = 0; // Face the camera (vertical, same as inner ring)
        diskCover.position.set(0, 0, 0.1); // Slightly in front of the inner ring
        this.scene.add(diskCover);

        // Store reference
        this.diskCover = diskCover;
    }

    async createShip() {
        try {
            // Try to load the GLB model
            const gltf = await this.assetLoader.loadGLTF('assets/models/base_ship.glb');
            
            // Get the ship model from the loaded GLTF
            const shipModel = gltf.scene;
            
            // Position and scale the ship
            shipModel.scale.setScalar(1.0); // Adjust scale as needed
            shipModel.position.set(-50, 20, -30);
            shipModel.rotation.y = Math.PI / 4; // Point towards center
            
            // Enable shadows
            shipModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            this.scene.add(shipModel);
            
        // Store ship reference
        this.ship = shipModel;
        
        // Set initial position
        this.ship.position.set(-27.34, 9.33, -8.64);
        this.ship.rotation.set(0.000, -2.146, 0.000);
        
        // Create shield effect
        this.createShipShield();
        
        // Create laser beam
        this.createLaserBeam();
        
        this.shipAnimation = {
            isAnimating: false,
            startTime: 0,
            currentWaypoint: 0,
            waypoints: [
                {
                    position: new THREE.Vector3(-27.34, 9.33, -8.64),
                    rotation: new THREE.Euler(0.000, -2.146, 0.000),
                    duration: 1.5, // seconds to reach this waypoint from previous
                    cameraTrack: false // camera stays static
                },
                {
                    position: new THREE.Vector3(0.33, 5.00, 10.02),
                    rotation: new THREE.Euler(0.000, -2.146, 0.000),
                    duration: 0.5,
                    cameraTrack: true // camera starts tracking ship
                },
                {
                    position: new THREE.Vector3(7.68, 5.00, 13.69),
                    rotation: new THREE.Euler(0.000, -2.413, 0.000),
                    duration: 1.0,
                    cameraTrack: true // camera continues tracking
                },
                {
                    position: new THREE.Vector3(5.68, 5.66, 25.35),
                    rotation: new THREE.Euler(0.000, -2.548, 0.000),
                    duration: 1.5,
                    cameraTrack: true // camera continues tracking
                }
            ],
            initialCameraPosition: new THREE.Vector3(0, 8, 15),
            initialCameraLookAt: new THREE.Vector3(0, 0, 0)
        };
            
            console.log('Ship model loaded successfully from GLB file');
            
        } catch (error) {
            console.warn('Failed to load ship model, using procedural fallback:', error);
            // Fallback to procedural ship
            this.createProceduralShip();
        }
    }

    createProceduralShip() {
        // Create a procedural ship using Three.js primitives as fallback
        const shipGroup = new THREE.Group();
        
        // Main hull (elongated box)
        const hullGeometry = new THREE.BoxGeometry(4, 1, 8);
        const hullMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x666666,
            shininess: 100,
            specular: 0x333333
        });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.set(0, 0, 0);
        shipGroup.add(hull);
        
        // Cockpit (smaller box on top)
        const cockpitGeometry = new THREE.BoxGeometry(2, 0.8, 3);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x444444,
            shininess: 150,
            specular: 0x222222
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 0.9, -1);
        shipGroup.add(cockpit);
        
        // Wings (flat boxes)
        const wingGeometry = new THREE.BoxGeometry(8, 0.2, 2);
        const wingMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x555555,
            shininess: 80,
            specular: 0x333333
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(0, -0.4, 0);
        shipGroup.add(leftWing);
        
        // Engine pods (cylinders)
        const engineGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
        const engineMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 200,
            specular: 0x111111
        });
        
        const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        leftEngine.position.set(-2, -0.5, 2);
        leftEngine.rotation.z = Math.PI / 2;
        shipGroup.add(leftEngine);
        
        const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
        rightEngine.position.set(2, -0.5, 2);
        rightEngine.rotation.z = Math.PI / 2;
        shipGroup.add(rightEngine);
        
        // Position and scale the ship
        shipGroup.scale.setScalar(0.5); // Scale down
        shipGroup.position.set(-50, 20, -30);
        shipGroup.rotation.y = Math.PI / 4; // Point towards center
        
        // Enable shadows
        shipGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        this.scene.add(shipGroup);
        
        // Store ship reference
        this.ship = shipGroup;
        
        // Set initial position
        this.ship.position.set(-27.34, 9.33, -8.64);
        this.ship.rotation.set(0.000, -2.146, 0.000);
        
        // Create shield effect
        this.createShipShield();
        
        // Create laser beam
        this.createLaserBeam();
        
        this.shipAnimation = {
            isAnimating: false,
            startTime: 0,
            currentWaypoint: 0,
            waypoints: [
                {
                    position: new THREE.Vector3(-27.34, 9.33, -8.64),
                    rotation: new THREE.Euler(0.000, -2.146, 0.000),
                    duration: 1.5, // seconds to reach this waypoint from previous
                    cameraTrack: false // camera stays static
                },
                {
                    position: new THREE.Vector3(0.33, 5.00, 10.02),
                    rotation: new THREE.Euler(0.000, -2.146, 0.000),
                    duration: 0.5,
                    cameraTrack: true // camera starts tracking ship
                },
                {
                    position: new THREE.Vector3(7.68, 5.00, 13.69),
                    rotation: new THREE.Euler(0.000, -2.413, 0.000),
                    duration: 1.0,
                    cameraTrack: true // camera continues tracking
                },
                {
                    position: new THREE.Vector3(5.68, 5.66, 25.35),
                    rotation: new THREE.Euler(0.000, -2.548, 0.000),
                    duration: 1.5,
                    cameraTrack: true // camera continues tracking
                }
            ],
            initialCameraPosition: new THREE.Vector3(0, 8, 15),
            initialCameraLookAt: new THREE.Vector3(0, 0, 0)
        };
        
        console.log('Procedural ship created successfully');
    }
    
    createShipShield() {
        if (!this.ship) return;
        
        // Calculate bounding box of ship
        const bbox = new THREE.Box3().setFromObject(this.ship);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        bbox.getSize(size);
        bbox.getCenter(center);
        
        // Create an egg-shaped (ellipsoid) shield
        // Use sphere geometry and scale it to match ship dimensions
        const shieldGeometry = new THREE.SphereGeometry(1, 32, 32);
        const shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff, // Cyan shield color
            transparent: true,
            opacity: 0, // Hidden by default
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending, // Makes it glow
            depthWrite: false, // Don't write to depth buffer when transparent
            depthTest: true
        });
        
        this.shipShield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        
        // Scale to match ship bounding box (egg shape - slightly taller)
        this.shipShield.scale.set(
            size.x * 0.7,  // Width
            size.y * 0.9,  // Height (slightly more for egg shape)
            size.z * 0.7   // Depth
        );
        
        // Position shield at center of ship's bounding box (in ship's local space)
        const localCenter = this.ship.worldToLocal(center.clone());
        this.shipShield.position.copy(localCenter);
        
        // Make sure it's invisible initially
        this.shipShield.visible = false;
        
        // Add shield as child of ship so it moves with the ship
        this.ship.add(this.shipShield);
        
        console.log('Ship shield created at local position:', localCenter);
    }
    
    flashShield() {
        if (!this.shipShield) return;
        
        // Make shield visible and flash to 90% opacity (10% transparency)
        this.shipShield.visible = true;
        this.shipShield.material.opacity = 0.9;
        
        // Fade out over 0.5 seconds
        const fadeStart = performance.now();
        const fadeDuration = 500; // milliseconds
        
        const fadeShield = (currentTime) => {
            const elapsed = currentTime - fadeStart;
            const progress = Math.min(elapsed / fadeDuration, 1);
            
            // Fade from 0.9 to 0
            this.shipShield.material.opacity = 0.9 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(fadeShield);
            } else {
                // Hide shield completely when animation is done
                this.shipShield.visible = false;
            }
        };
        
        requestAnimationFrame(fadeShield);
    }
    
    createLaserBeam() {
        if (!this.ship) return;
        
        // Create a line geometry for the laser beam
        const laserGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
            0, 0, 0,  // Start point (at ship)
            0, 0, 0   // End point (will be updated)
        ]);
        laserGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create glowing material for laser
        const laserMaterial = new THREE.LineBasicMaterial({
            color: 0xff0000, // Red laser
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        
        this.laserBeam = new THREE.Line(laserGeometry, laserMaterial);
        this.laserBeam.visible = false; // Hidden by default
        
        // Add to ship so it moves with the ship
        this.ship.add(this.laserBeam);
        
        console.log('Laser beam created');
    }
    
    updateLaserBeam(target) {
        if (!this.laserBeam || !this.ship || !target) return;
        
        // Calculate laser end point in ship's local space
        const targetWorld = target.position.clone();
        const shipWorld = this.ship.position.clone();
        const laserEnd = this.ship.worldToLocal(targetWorld);
        
        // Update laser geometry
        const positions = this.laserBeam.geometry.attributes.position.array;
        positions[0] = 0; // Start at ship center (local)
        positions[1] = 0;
        positions[2] = 0;
        positions[3] = laserEnd.x; // End at target (local)
        positions[4] = laserEnd.y;
        positions[5] = laserEnd.z;
        
        this.laserBeam.geometry.attributes.position.needsUpdate = true;
        this.laserBeam.visible = true;
    }
    
    hideLaserBeam() {
        if (this.laserBeam) {
            this.laserBeam.visible = false;
        }
    }
    
    createParticleExplosion(position, velocity) {
        const particleCount = 160 + Math.floor(Math.random() * 120); // 160-280 particles
        const ironAmount = 0.5 + Math.random() * 1.5; // 0.5-2.0 tons per explosion
        const ironPerParticle = ironAmount / particleCount;
        
        // Array of different geometries for variety
        const geometries = [
            new THREE.BoxGeometry(0.15, 0.15, 0.15),
            new THREE.BoxGeometry(0.2, 0.1, 0.1),
            new THREE.TetrahedronGeometry(0.12),
            new THREE.OctahedronGeometry(0.1),
            new THREE.BoxGeometry(0.1, 0.2, 0.1),
            new THREE.DodecahedronGeometry(0.08)
        ];
        
        // Brown/earth tone colors
        const brownColors = [
            0x8B4513, // Saddle brown
            0xA0522D, // Sienna
            0x6B4423, // Dark brown
            0x8B7355, // Burlywood
            0x704214, // Sepia
            0x9B5C34, // Rust brown
            0x654321  // Dark brown
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Random spread direction (wider spread)
            const spread = 5;
            const particleVelocity = new THREE.Vector3(
                velocity.x + (Math.random() - 0.5) * spread,
                velocity.y + (Math.random() - 0.5) * spread,
                velocity.z + (Math.random() - 0.5) * spread
            );
            
            // Random geometry and color
            const geometry = geometries[Math.floor(Math.random() * geometries.length)].clone();
            const color = brownColors[Math.floor(Math.random() * brownColors.length)];
            
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1.0
            });
            
            const particleMesh = new THREE.Mesh(geometry, particleMaterial);
            particleMesh.position.copy(position);
            
            // Random initial rotation
            particleMesh.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            this.scene.add(particleMesh);
            
            // Random rotation speed for tumbling effect
            const rotationSpeed = {
                x: (Math.random() - 0.5) * 4,
                y: (Math.random() - 0.5) * 4,
                z: (Math.random() - 0.5) * 4
            };
            
            // Store particle data
            this.particles.push({
                mesh: particleMesh,
                velocity: particleVelocity,
                rotationSpeed: rotationSpeed,
                lifetime: 10.0, // seconds
                age: 0,
                ironValue: ironPerParticle,
                collected: false
            });
        }
        
        console.log(`Created ${particleCount} particles with ${ironAmount.toFixed(2)} tons of iron`);
    }
    
    updateParticles(deltaTime) {
        if (!this.ship) return;
        
        const collectionRange = 8; // Units - range for automatic collection
        
        this.particles = this.particles.filter(particle => {
            // Age the particle
            particle.age += deltaTime;
            
            // Remove if too old
            if (particle.age >= particle.lifetime) {
                this.scene.remove(particle.mesh);
                if (particle.mesh.geometry) particle.mesh.geometry.dispose();
                if (particle.mesh.material) particle.mesh.material.dispose();
                return false;
            }
            
            // Move particle
            particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            
            // Rotate particle for tumbling effect
            if (particle.rotationSpeed) {
                particle.mesh.rotation.x += particle.rotationSpeed.x * deltaTime;
                particle.mesh.rotation.y += particle.rotationSpeed.y * deltaTime;
                particle.mesh.rotation.z += particle.rotationSpeed.z * deltaTime;
            }
            
            // Fade out over time
            const fadeStart = particle.lifetime * 0.7;
            if (particle.age > fadeStart) {
                const fadeProgress = (particle.age - fadeStart) / (particle.lifetime - fadeStart);
                particle.mesh.material.opacity = 1.0 - fadeProgress;
            }
            
            // Check for collection
            if (!particle.collected) {
                const distance = particle.mesh.position.distanceTo(this.ship.position);
                if (distance < collectionRange) {
                    // Collect the particle (apply extractor upgrade multiplier)
                    particle.collected = true;
                    const extractorMultiplier = this.getExtractorMultiplier();
                    const ironCollected = particle.ironValue * extractorMultiplier;
                    this.shipStats.iron = Math.min(this.shipStats.cargoMax, this.shipStats.iron + ironCollected);
                    
                    // Remove particle
                    this.scene.remove(particle.mesh);
                    if (particle.mesh.geometry) particle.mesh.geometry.dispose();
                    if (particle.mesh.material) particle.mesh.material.dispose();
                    return false;
                }
            }
            
            return true;
        });
    }
    
    spawnDebrisParticle() {
        if (!this.ship || !this.camera) return;
        
        // Spawn particles in front of the camera view, always streaming towards camera
        // Get camera's forward direction
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        
        // Spawn particles ahead of the camera (in its view)
        const spawnDistance = 40 + Math.random() * 30; // 40-70 units ahead
        const horizontalSpread = (Math.random() - 0.5) * 60; // Wide horizontal spread
        const verticalSpread = (Math.random() - 0.5) * 20; // Less vertical spread
        
        // Start from camera position and move forward
        const spawnPosition = this.camera.position.clone();
        spawnPosition.add(cameraDirection.clone().multiplyScalar(spawnDistance));
        
        // Add horizontal spread (perpendicular to camera direction)
        const right = new THREE.Vector3();
        right.crossVectors(cameraDirection, this.camera.up).normalize();
        spawnPosition.add(right.multiplyScalar(horizontalSpread));
        
        // Add vertical spread (along camera's up vector)
        const up = this.camera.up.clone();
        spawnPosition.add(up.multiplyScalar(verticalSpread));
        
        // Small debris size
        const size = 0.1 + Math.random() * 0.2;
        const geometries = [
            new THREE.BoxGeometry(size, size, size),
            new THREE.TetrahedronGeometry(size * 0.8),
            new THREE.OctahedronGeometry(size * 0.6)
        ];
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        
        // Gray/brown colors for space debris
        const colors = [0x555555, 0x666666, 0x777777, 0x8B7355, 0x704214];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(spawnPosition);
        
        // Random initial rotation
        mesh.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        
        this.scene.add(mesh);
        
        // Calculate velocity towards camera (backwards from spawn point)
        // Speed is based on warp level for sense of motion
        const directionToCamera = cameraDirection.clone().negate(); // Opposite of camera forward
        const baseSpeed = 15 + (this.shipStats.warp * 3); // Speed scales with warp
        const velocity = directionToCamera.multiplyScalar(baseSpeed);
        
        // Random rotation speed
        const rotationSpeed = {
            x: (Math.random() - 0.5) * 3,
            y: (Math.random() - 0.5) * 3,
            z: (Math.random() - 0.5) * 3
        };
        
        this.debrisParticles.push({
            mesh: mesh,
            velocity: velocity,
            rotationSpeed: rotationSpeed,
            lifetime: 10.0,
            age: 0
        });
    }
    
    updateDebrisParticles(deltaTime) {
        if (!this.ship || !this.camera) return;
        
        // Get camera direction once per frame
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        const directionToCamera = cameraDirection.clone().negate();
        
        this.debrisParticles = this.debrisParticles.filter(debris => {
            // Age the debris
            debris.age += deltaTime;
            
            // Remove if too old or if it's passed behind the camera
            const distanceFromCamera = debris.mesh.position.distanceTo(this.camera.position);
            if (debris.age >= debris.lifetime || distanceFromCamera < 5) {
                this.scene.remove(debris.mesh);
                if (debris.mesh.geometry) debris.mesh.geometry.dispose();
                if (debris.mesh.material) debris.mesh.material.dispose();
                return false;
            }
            
            // Update velocity based on current warp (always towards camera)
            const baseSpeed = 15 + (this.shipStats.warp * 3);
            debris.velocity = directionToCamera.clone().multiplyScalar(baseSpeed);
            
            // Move debris towards camera
            debris.mesh.position.add(debris.velocity.clone().multiplyScalar(deltaTime));
            
            // Rotate debris
            debris.mesh.rotation.x += debris.rotationSpeed.x * deltaTime;
            debris.mesh.rotation.y += debris.rotationSpeed.y * deltaTime;
            debris.mesh.rotation.z += debris.rotationSpeed.z * deltaTime;
            
            // Fade out as it gets older
            const fadeStart = debris.lifetime * 0.6;
            if (debris.age > fadeStart) {
                const fadeProgress = (debris.age - fadeStart) / (debris.lifetime - fadeStart);
                debris.mesh.material.opacity = 0.8 * (1.0 - fadeProgress);
            }
            
            return true;
        });
    }
    
    async loadAsteroidModels() {
        console.log('Loading asteroid models...');
        const modelPaths = [
            'assets/models/astroid01.glb',
            'assets/models/astroid02.glb',
            'assets/models/astroid03.glb',
            'assets/models/astroid04.glb',
            'assets/models/astroid05.glb'
        ];
        
        for (const path of modelPaths) {
            try {
                const gltf = await this.assetLoader.loadGLTF(path);
                this.asteroidModels.push(gltf.scene.clone());
                console.log(`Loaded asteroid: ${path}`);
            } catch (error) {
                console.error(`Failed to load asteroid ${path}:`, error);
            }
        }
        
        console.log(`${this.asteroidModels.length} asteroid models loaded`);
    }
    
    spawnAsteroid() {
        if (this.asteroidModels.length === 0 || !this.ship || !this.camera) return;
        
        // Select random asteroid model
        const randomIndex = Math.floor(Math.random() * this.asteroidModels.length);
        const asteroidClone = this.asteroidModels[randomIndex].clone();
        
        // Get camera forward direction
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        
        // Spawn distance ahead of ship
        const spawnDistance = 80 + Math.random() * 40; // 80-120 units ahead
        
        // Random offset from center (spread pattern)
        const spreadRadius = 30;
        const offsetX = (Math.random() - 0.5) * spreadRadius;
        const offsetY = (Math.random() - 0.5) * spreadRadius;
        
        // Calculate spawn position ahead of camera direction
        const spawnPosition = new THREE.Vector3()
            .copy(this.ship.position)
            .add(cameraDirection.multiplyScalar(spawnDistance))
            .add(new THREE.Vector3(offsetX, offsetY, 0));
        
        asteroidClone.position.copy(spawnPosition);
        
        // Random scale
        const scale = 0.5 + Math.random() * 1.5; // 0.5 to 2.0
        asteroidClone.scale.setScalar(scale);
        
        // Random rotation speed
        const rotationSpeed = {
            x: (Math.random() - 0.5) * 2, // -1 to 1
            y: (Math.random() - 0.5) * 2,
            z: (Math.random() - 0.5) * 2
        };
        
        // Calculate velocity based on current warp speed
        // Asteroids move toward the ship at a speed relative to warp
        const baseSpeed = (this.shipStats.warp + 2) * 3; // Faster as warp increases
        const velocity = new THREE.Vector3()
            .subVectors(this.ship.position, spawnPosition)
            .normalize()
            .multiplyScalar(baseSpeed);
        
        // Enable shadows
        asteroidClone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Add to scene
        this.scene.add(asteroidClone);
        
        // Random health: 1-5 seconds of laser time to destroy
        const health = 1.0 + Math.random() * 4.0;
        
        // Store asteroid data with velocity
        this.asteroids.push({
            mesh: asteroidClone,
            rotationSpeed: rotationSpeed,
            velocity: velocity, // Constant velocity set at spawn
            isColliding: false, // Track if already collided to prevent multiple hits
            health: health, // Seconds of laser fire to destroy
            maxHealth: health
        });
        
        console.log(`Spawned asteroid at (${spawnPosition.x.toFixed(1)}, ${spawnPosition.y.toFixed(1)}, ${spawnPosition.z.toFixed(1)})`);
    }
    
    updateAsteroids(deltaTime) {
        if (!this.ship) return;
        
        // Get ship's forward direction (in world space)
        const shipForward = new THREE.Vector3(0, 0, -1);
        shipForward.applyQuaternion(this.ship.quaternion);
        
        // Find closest asteroid within laser range for targeting
        let closestAsteroid = null;
        let closestDistance = this.laserRange;
        
        this.asteroids.forEach(asteroid => {
            const distance = asteroid.mesh.position.distanceTo(this.ship.position);
            
            // Check if asteroid is in front of ship
            const toAsteroid = new THREE.Vector3().subVectors(asteroid.mesh.position, this.ship.position).normalize();
            const dotProduct = shipForward.dot(toAsteroid);
            const isInFront = dotProduct > 0; // Positive dot product means in front
            
            if (distance < closestDistance && asteroid.health > 0 && isInFront) {
                closestDistance = distance;
                closestAsteroid = asteroid;
            }
        });
        
        // Update laser targeting
        if (closestAsteroid) {
            this.currentLaserTarget = closestAsteroid;
            this.updateLaserBeam(closestAsteroid.mesh);
            
            // Deal damage to targeted asteroid (apply weapon upgrade multiplier)
            const weaponMultiplier = this.getWeaponMultiplier();
            closestAsteroid.health -= deltaTime * weaponMultiplier;
            
            // Check if asteroid is destroyed
            if (closestAsteroid.health <= 0) {
                // Create particle explosion
                this.createParticleExplosion(
                    closestAsteroid.mesh.position.clone(),
                    closestAsteroid.velocity.clone()
                );
                
                // Remove asteroid from scene
                this.scene.remove(closestAsteroid.mesh);
                this.asteroids = this.asteroids.filter(a => a !== closestAsteroid);
                
                // Clear target so laser retargets
                this.currentLaserTarget = null;
                this.hideLaserBeam();
                
                // Show tutorial message on first asteroid destruction
                if (!this.tutorialShown.asteroidDestroyed) {
                    this.showTutorialMessage("Fly through the debris field to capture more elements", 'warning', 6000);
                    this.tutorialShown.asteroidDestroyed = true;
                }
                
                console.log('Asteroid destroyed!');
            }
        } else {
            this.currentLaserTarget = null;
            this.hideLaserBeam();
        }
        
        // Remove asteroids that are too far behind the player
        this.asteroids = this.asteroids.filter(asteroid => {
            const distance = asteroid.mesh.position.distanceTo(this.ship.position);
            if (distance > 150) {
                this.scene.remove(asteroid.mesh);
                return false;
            }
            return true;
        });
        
        // Update each asteroid
        this.asteroids.forEach(asteroid => {
            // Rotate asteroid smoothly
            asteroid.mesh.rotation.x += asteroid.rotationSpeed.x * deltaTime;
            asteroid.mesh.rotation.y += asteroid.rotationSpeed.y * deltaTime;
            asteroid.mesh.rotation.z += asteroid.rotationSpeed.z * deltaTime;
            
            // Move with constant velocity (smooth movement)
            const movement = asteroid.velocity.clone().multiplyScalar(deltaTime);
            asteroid.mesh.position.add(movement);
            
            // Check for collision with ship
            const distance = asteroid.mesh.position.distanceTo(this.ship.position);
            const collisionRadius = 5; // Collision detection radius
            
            if (distance < collisionRadius && !asteroid.isColliding) {
                // New collision detected - apply damage immediately
                const damage = this.shipStats.warp; // Damage equals current warp speed
                this.shipStats.distance = Math.max(0, this.shipStats.distance - damage);
                
                // Mark as colliding to prevent multiple hits
                asteroid.isColliding = true;
                
                // Flash the shield effect
                this.flashShield();
                
                // Show tutorial message on first shield hit
                if (!this.tutorialShown.shieldHit) {
                    this.showTutorialMessage("Try to avoid hitting the asteroids, they knock you closer to the black hole", 'warning', 6000);
                    this.tutorialShown.shieldHit = true;
                }
                
                // Stop targeting this asteroid if it's currently targeted
                if (this.currentLaserTarget === asteroid) {
                    this.currentLaserTarget = null;
                    this.hideLaserBeam();
                }
                
                // Slow down the asteroid to 1/2 speed
                asteroid.velocity.multiplyScalar(0.5);
                
                // Push asteroid away in a random cardinal direction
                const pushDistance = 3 + Math.random() * 3; // 3-6 units away
                const directions = [
                    new THREE.Vector3(pushDistance, 0, 0),  // right
                    new THREE.Vector3(-pushDistance, 0, 0), // left
                    new THREE.Vector3(0, pushDistance, 0),  // up
                    new THREE.Vector3(0, -pushDistance, 0)  // down
                ];
                const randomDirection = directions[Math.floor(Math.random() * directions.length)];
                asteroid.mesh.position.add(randomDirection);
                
                console.log(`Asteroid collision! Lost ${damage.toFixed(1)} clicks. Distance: ${this.shipStats.distance.toFixed(1)}`);
            }
        });
    }

    createShipPlaceholder() {
        // Create a simple ship placeholder
        const shipGeometry = new THREE.BoxGeometry(2, 0.5, 4);
        const shipMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xaaaaaa,
            transparent: false,
            opacity: 1.0,
            shininess: 100,
            specular: 0x666666
        });
        const ship = new THREE.Mesh(shipGeometry, shipMaterial);
        
        // Position ship off-screen initially (upper left)
        ship.position.set(-50, 20, -30);
        ship.rotation.y = Math.PI / 4; // Point towards center
        ship.castShadow = true;
        ship.receiveShadow = true;
        this.scene.add(ship);
        
        // Store ship reference
        this.ship = ship;
        this.shipAnimation = {
            isAnimating: false,
            startTime: 0,
            duration: 3.0, // 3 seconds
            startPosition: new THREE.Vector3(-50, 20, -30),
            endPosition: new THREE.Vector3(0, 5, 25), // Behind camera
            startRotation: new THREE.Euler(0, Math.PI / 4, 0),
            endRotation: new THREE.Euler(0, Math.PI, 0) // Point away from black hole
        };
    }

    updateShipAnimation(deltaTime) {
        if (!this.ship || !this.shipAnimation.isAnimating) return;
        
        const anim = this.shipAnimation;
        const totalElapsed = this.gameState.time - anim.startTime;
        
        // Calculate total duration of all segments
        let totalDuration = 0;
        for (let i = 1; i < anim.waypoints.length; i++) {
            totalDuration += anim.waypoints[i].duration;
        }
        
        // Calculate overall progress (0 to 1)
        let overallProgress = Math.min(totalElapsed / totalDuration, 1.0);
        
        // Apply ease-out only near the very end (last 20% of animation)
        let easedProgress = overallProgress;
        if (overallProgress > 0.8) {
            const endPhase = (overallProgress - 0.8) / 0.2; // 0 to 1 in the last 20%
            easedProgress = 0.8 + (0.2 * (1.0 - Math.pow(1.0 - endPhase, 3))); // Cubic ease-out
        }
        
        // Find which segment we're in based on eased progress
        let accumulatedTime = 0;
        let currentSegment = 0;
        let segmentProgress = 0;
        
        for (let i = 1; i < anim.waypoints.length; i++) {
            const segmentDuration = anim.waypoints[i].duration;
            const segmentStartTime = accumulatedTime;
            const segmentEndTime = accumulatedTime + segmentDuration;
            
            if (easedProgress * totalDuration <= segmentEndTime) {
                currentSegment = i - 1;
                const timeInSegment = (easedProgress * totalDuration) - segmentStartTime;
                segmentProgress = timeInSegment / segmentDuration;
                break;
            }
            
            accumulatedTime += segmentDuration;
        }
        
        // If we're at the very end
        if (overallProgress >= 1.0) {
            currentSegment = anim.waypoints.length - 2;
            segmentProgress = 1.0;
        }
        
        // Get current and next waypoint
        const fromWaypoint = anim.waypoints[currentSegment];
        const toWaypoint = anim.waypoints[currentSegment + 1];
        
        // Interpolate position (no additional easing - already applied)
        this.ship.position.lerpVectors(fromWaypoint.position, toWaypoint.position, segmentProgress);
        
        // Interpolate rotation
        this.ship.rotation.x = THREE.MathUtils.lerp(fromWaypoint.rotation.x, toWaypoint.rotation.x, segmentProgress);
        this.ship.rotation.y = THREE.MathUtils.lerp(fromWaypoint.rotation.y, toWaypoint.rotation.y, segmentProgress);
        this.ship.rotation.z = THREE.MathUtils.lerp(fromWaypoint.rotation.z, toWaypoint.rotation.z, segmentProgress);
        
        // Update camera based on FROM waypoint settings
        if (fromWaypoint.cameraTrack) {
            // Camera tracks ship
            this.camera.position.copy(anim.initialCameraPosition);
            this.camera.lookAt(this.ship.position);
        } else {
            // Camera stays static
            this.camera.position.copy(anim.initialCameraPosition);
            this.camera.lookAt(anim.initialCameraLookAt);
        }
        
        // Smooth transition to tracking when switching from static to tracking
        if (currentSegment === 0 && segmentProgress >= 0.99 && toWaypoint.cameraTrack && !fromWaypoint.cameraTrack) {
            const lookTarget = new THREE.Vector3();
            lookTarget.lerpVectors(anim.initialCameraLookAt, this.ship.position, (segmentProgress - 0.99) / 0.01);
            this.camera.lookAt(lookTarget);
        }
        
        // Update waypoint counter for debug display
        anim.currentWaypoint = currentSegment;
        
        // Check if animation is complete
        if (overallProgress >= 1.0) {
            if (this.animationLooping) {
                // Restart the animation
                anim.currentWaypoint = 0;
                anim.startTime = this.gameState.time;
                console.log('Animation looping - restarting');
            } else {
                anim.isAnimating = false;
                this.shipDebugMode = true; // Enable manual controls
                this.showUIPanel(); // Show UI panel
                
                // Show controls hint
                if (!this.tutorialShown.controls) {
                    this.showTutorialMessage("WASD controls / ARROW keys for acceleration / SPACEBAR for hyperjump", 'warning', 7000);
                    this.tutorialShown.controls = true;
                }
                
                console.log('Ship animation complete - manual controls enabled');
            }
        }
    }
    
    showUIPanel() {
        const uiPanel = document.getElementById('ui-panel');
        if (uiPanel) {
            uiPanel.classList.add('visible');
            console.log('UI panel sliding up');
            
            // Show black-hud after UI panel finishes animating (0.8s)
            setTimeout(() => {
                const blackHud = document.getElementById('black-hud');
                if (blackHud) {
                    blackHud.classList.add('visible');
                    console.log('Black HUD fading in');
                }
                
                const distanceDisplay = document.getElementById('distance-display');
                if (distanceDisplay) {
                    distanceDisplay.classList.add('visible');
                    console.log('Distance display showing');
                }
                
                // Show HUD bars at the same time
                this.showHudBars();
            }, 800);
        }
    }
    
    hideUIPanel() {
        const uiPanel = document.getElementById('ui-panel');
        const blackHud = document.getElementById('black-hud');
        const hudBars = document.getElementById('hud-bars');
        const distanceDisplay = document.getElementById('distance-display');
        
        // Hide black-hud, hud-bars, and distance display first
        if (blackHud) {
            blackHud.classList.remove('visible');
        }
        if (hudBars) {
            hudBars.classList.remove('visible');
        }
        if (distanceDisplay) {
            distanceDisplay.classList.remove('visible');
        }
        
        if (uiPanel) {
            uiPanel.classList.remove('visible');
            console.log('UI panel sliding down');
        }
    }
    
    showHudBars() {
        const hudBars = document.getElementById('hud-bars');
        if (hudBars) {
            hudBars.classList.add('visible');
            this.updateHudBars(); // Initialize with current values
            console.log('HUD bars showing');
        }
    }
    
    updateHudBars() {
        // Update Warp bar (0.0 - 11.0, display current/max)
        const warpBar = document.getElementById('bar-warp');
        const warpValue = document.getElementById('value-warp');
        if (warpBar && warpValue) {
            const warpPercent = (this.shipStats.warp / 11.0) * 100;
            warpBar.style.height = `${warpPercent}%`;
            warpValue.textContent = this.shipStats.warp.toFixed(1);
        }
        
        // Update Fuel bar (0 - 100%)
        const fuelBar = document.getElementById('bar-fuel');
        const fuelValue = document.getElementById('value-fuel');
        if (fuelBar && fuelValue) {
            const fuelPercent = (this.shipStats.fuel / this.shipStats.fuelMax) * 100;
            fuelBar.style.height = `${fuelPercent}%`;
            fuelValue.textContent = `${Math.round(this.shipStats.fuel)}%`;
        }
        
        // Update Iron/Cargo bar (0.0 - cargoMax tons)
        const ironBar = document.getElementById('bar-iron');
        const ironValue = document.getElementById('value-iron');
        if (ironBar && ironValue) {
            const ironPercent = (this.shipStats.iron / this.shipStats.cargoMax) * 100;
            ironBar.style.height = `${ironPercent}%`;
            ironValue.textContent = `${this.shipStats.iron.toFixed(1)}t`;
        }
    }
    
    updateDistanceDisplay() {
        const distanceValue = document.getElementById('distance-value');
        if (distanceValue) {
            distanceValue.textContent = this.shipStats.distance.toFixed(1);
        }
    }

    // COMMENTED OUT - Camera animation disabled for debugging
    // updateCameraFollow(progress) {
    //     if (!this.ship) return;
    //     
    //     const anim = this.shipAnimation;
    //     
    //     // Camera stays static initially, then starts tracking the ship
    //     if (progress < 0.2) {
    //         // Keep camera at initial position
    //         this.camera.position.copy(anim.initialCameraPosition);
    //         this.camera.lookAt(anim.initialCameraLookAt);
    //     } else if (progress < 0.8) {
    //         // Smoothly transition to tracking the ship
    //         const trackProgress = (progress - 0.2) / 0.6; // Normalize to 0-1
    //         
    //         // Camera stays in place but starts looking at the ship
    //         this.camera.position.copy(anim.initialCameraPosition);
    //         
    //         // Lerp look target between black hole and ship
    //         const lookTarget = new THREE.Vector3();
    //         lookTarget.lerpVectors(anim.initialCameraLookAt, this.ship.position, trackProgress);
    //         this.camera.lookAt(lookTarget);
    //     } else {
    //         // Continue tracking ship
    //         this.camera.position.copy(anim.initialCameraPosition);
    //         this.camera.lookAt(this.ship.position);
    //     }
    // }

    startShipFlyIn() {
        if (!this.ship || this.shipAnimation.isAnimating) return;
        
        this.shipAnimation.isAnimating = true;
        this.shipAnimation.startTime = this.gameState.time;
        this.shipAnimation.currentWaypoint = 0;
        
        // Reset ship to first waypoint
        const firstWaypoint = this.shipAnimation.waypoints[0];
        this.ship.position.copy(firstWaypoint.position);
        this.ship.rotation.copy(firstWaypoint.rotation);
        
        // Reset camera to initial position
        this.camera.position.copy(this.shipAnimation.initialCameraPosition);
        this.camera.lookAt(this.shipAnimation.initialCameraLookAt);
        
        console.log('Starting ship waypoint animation');
    }

    updateAccretionAnimation(deltaTime) {
        if (!this.accretionDisk) return;
        
        // Rotate the rings to create swirling motion (clockwise, eighth speed)
        this.accretionDisk.innerRing.rotation.z += deltaTime * 0.25; // Clockwise
        this.accretionDisk.outerRing.rotation.z += deltaTime * 0.1875; // Slower clockwise
        
        // Update shader time uniforms for noise animation
        if (this.accretionDisk.innerRing.material.uniforms) {
            this.accretionDisk.innerRing.material.uniforms.time.value += deltaTime;
        }
        if (this.accretionDisk.outerRing.material.uniforms) {
            this.accretionDisk.outerRing.material.uniforms.time.value += deltaTime;
        }
    }


    addGameObject(gameObject) {
        this.gameObjects.push(gameObject);
        if (gameObject.mesh) {
            this.scene.add(gameObject.mesh);
        }
    }

    removeGameObject(gameObject) {
        const index = this.gameObjects.indexOf(gameObject);
        if (index > -1) {
            this.gameObjects.splice(index, 1);
            if (gameObject.mesh) {
                this.scene.remove(gameObject.mesh);
            }
        }
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop = this.loop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    stop() {
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
    }

    pause() {
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        console.log('Game paused');
    }

    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop = this.loop.bind(this);
            requestAnimationFrame(this.gameLoop);
            console.log('Game resumed');
        }
    }

    loop(currentTime) {
        if (!this.isRunning) return;
        
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(this.deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime) {
        // Check for game over conditions
        if (this.checkGameOverConditions()) {
            return; // Stop updating if game is over
        }
        
        // Update game state
        this.gameState.time += deltaTime;
        
        // Update all game objects
        this.gameObjects.forEach(gameObject => {
            if (gameObject.update) {
                gameObject.update(deltaTime, this.inputHandler);
            }
        });
        
        // Update accretion disk animation
        this.updateAccretionAnimation(deltaTime);
        
        // Update ship - use animation or manual controls based on debug mode
        if (!this.shipDebugMode) {
            this.updateShipAnimation(deltaTime);
        } else {
            this.updateShipDebugControls(deltaTime);
            // Camera moves with ship and continues tracking it
            this.camera.lookAt(this.ship.position);
        }
        
        // Update fuel consumption and distance (runs every second when ship is under manual control)
        if (this.shipDebugMode) {
            this.fuelConsumptionTimer += deltaTime;
            if (this.fuelConsumptionTimer >= 1.0) {
                // Consume fuel based on warp level: warp / 10 per second (apply propulsion upgrade reduction)
                const baseFuelConsumption = this.shipStats.warp / 10;
                const fuelReduction = this.getFuelReduction();
                const fuelConsumption = baseFuelConsumption * (1 - fuelReduction);
                this.shipStats.fuel = Math.max(0, this.shipStats.fuel - fuelConsumption);
                
                // Update distance based on warp difference from equilibrium
                const warpDifference = this.shipStats.warp - this.equilibriumWarp;
                this.shipStats.distance = Math.max(0, this.shipStats.distance + warpDifference);
                
                this.fuelConsumptionTimer = 0;
                
                // If out of fuel, decrease warp speed
                if (this.shipStats.fuel <= 0) {
                    this.shipStats.warp = Math.max(0, this.shipStats.warp - 0.2);
                }
            }
            
            // Spawn asteroids every 5 seconds
            this.asteroidSpawnTimer += deltaTime;
            if (this.asteroidSpawnTimer >= this.asteroidSpawnInterval) {
                this.spawnAsteroid();
                this.asteroidSpawnTimer = 0;
            }
        }
        
        // Update asteroids (only if not game over)
        if (!this.isGameOver) {
            this.updateAsteroids(deltaTime);
        }
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update debris stream (when in manual control)
        if (this.shipDebugMode) {
            // Spawn debris particles
            this.debrisSpawnTimer += deltaTime;
            if (this.debrisSpawnTimer >= this.debrisSpawnInterval) {
                // Spawn multiple debris particles for dense effect (doubled)
                for (let i = 0; i < 6; i++) {
                    this.spawnDebrisParticle();
                }
                this.debrisSpawnTimer = 0;
            }
            
            // Update debris particles
            this.updateDebrisParticles(deltaTime);
            
            // Passive iron collection from debris stream
            this.passiveIronTimer += deltaTime;
            if (this.passiveIronTimer >= this.passiveIronInterval) {
                // Collect small amount of iron passively (0.05 - 0.15 tons per second)
                const passiveIronAmount = 0.05 + Math.random() * 0.1;
                const extractorMultiplier = this.getExtractorMultiplier();
                const ironCollected = passiveIronAmount * extractorMultiplier;
                this.shipStats.iron = Math.min(this.shipStats.cargoMax, this.shipStats.iron + ironCollected);
                this.passiveIronTimer = 0;
            }
        }
        
        // Update HUD bars if visible
        const hudBars = document.getElementById('hud-bars');
        if (hudBars && hudBars.classList.contains('visible')) {
            this.updateHudBars();
            
            // Check if cargo is full and show tutorial message
            if (this.shipStats.iron >= this.shipStats.cargoMax && !this.tutorialShown.cargoFull) {
                this.showTutorialMessage("The Cargo hold is full! Great job! Now hit the SPACEBAR to initiate the hyperjump to the nearest processing planet.", 'warning', 8000);
                this.tutorialShown.cargoFull = true;
            }
        }
        
        // Update distance display if visible
        const distanceDisplay = document.getElementById('distance-display');
        if (distanceDisplay && distanceDisplay.classList.contains('visible')) {
            this.updateDistanceDisplay();
        }
        
        // Update debug info (only if debug mode is enabled)
        if (this.debugMode) {
            this.updateDebugInfo();
        }
        
        // Update danger warning and overlay based on distance
        if (this.shipDebugMode) {
            // Show danger warning when distance < 40
            if (this.shipStats.distance < 40 && !this.dangerWarningShown) {
                this.showTutorialMessage("DANGER: Approaching Event Horizon", 'danger', 0); // 0 = stays visible
                this.dangerWarningShown = true;
            } else if (this.shipStats.distance >= 40 && this.dangerWarningShown) {
                // Hide danger warning if player escapes
                const messageEl = document.getElementById('tutorial-message');
                if (messageEl && messageEl.classList.contains('danger')) {
                    messageEl.style.display = 'none';
                }
                this.dangerWarningShown = false;
            }
            
            // Update red screen overlay (progressive red when distance < 20)
            this.updateDangerOverlay();
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const container = document.getElementById('gameContainer');
        const width = Math.min(container.clientWidth, 1280);
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        const debugElement = document.getElementById('debug');
        debugElement.style.display = (this.debugMode || this.shipDebugMode) ? 'block' : 'none';
    }

    toggleShipDebugMode() {
        this.shipDebugMode = !this.shipDebugMode;
        const debugElement = document.getElementById('debug');
        debugElement.style.display = (this.debugMode || this.shipDebugMode) ? 'block' : 'none';
        
        if (this.shipDebugMode) {
            console.log('Ship Debug Mode ENABLED');
            console.log('Controls: WASD = Move, Q/E = Up/Down, Arrow Keys = Rotate, R = Reset');
            console.log('Current Position:', this.ship.position);
            console.log('Current Rotation:', this.ship.rotation);
        } else {
            console.log('Ship Debug Mode DISABLED');
        }
    }

    updateShipDebugControls(deltaTime) {
        if (!this.ship) return;
        
        // Store home rotation on first call
        if (!this.shipHomeRotation) {
            this.shipHomeRotation = {
                x: this.ship.rotation.x,
                y: this.ship.rotation.y,
                z: this.ship.rotation.z
            };
        }
        
        const moveSpeed = 10 * deltaTime; // units per second
        const rotationAmount = 0.3; // Maximum rotation in radians
        const rotationSpeed = 8.0; // How fast to interpolate rotation
        
        // Get camera's right and up vectors for screen-space movement
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        
        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(this.camera.up, cameraDirection).normalize();
        
        const cameraUp = new THREE.Vector3(0, 1, 0); // Always move vertically in world space
        
        // Movement controls based on screen coordinates (WASD)
        const movement = new THREE.Vector3();
        
        // Target rotation offsets from home position
        let targetPitch = 0; // X-axis rotation
        let targetRoll = 0;  // Z-axis rotation
        
        if (this.inputHandler.isKeyPressed('KeyW')) {
            // Move up on screen (world Y-axis up)
            movement.add(cameraUp.clone().multiplyScalar(moveSpeed));
            // Tilt nose up
            targetPitch = -rotationAmount;
        }
        if (this.inputHandler.isKeyPressed('KeyS')) {
            // Move down on screen (world Y-axis down)
            movement.add(cameraUp.clone().multiplyScalar(-moveSpeed));
            // Tilt nose down
            targetPitch = rotationAmount;
        }
        if (this.inputHandler.isKeyPressed('KeyA')) {
            // Move left on screen
            movement.add(cameraRight.clone().multiplyScalar(moveSpeed));
            // Bank left
            targetRoll = rotationAmount;
        }
        if (this.inputHandler.isKeyPressed('KeyD')) {
            // Move right on screen
            movement.add(cameraRight.clone().multiplyScalar(-moveSpeed));
            // Bank right
            targetRoll = -rotationAmount;
        }
        
        // Warp control with arrow keys
        if (this.inputHandler.isKeyPressed('ArrowUp')) {
            // Increase warp (0.1 increments, up to warpMax)
            this.shipStats.warp = Math.min(this.shipStats.warp + 0.1, this.shipStats.warpMax);
        }
        if (this.inputHandler.isKeyPressed('ArrowDown')) {
            // Decrease warp (0.1 increments, down to 0.0)
            this.shipStats.warp = Math.max(this.shipStats.warp - 0.1, 0.0);
        }
        
        // Apply movement to both ship and camera
        this.ship.position.add(movement);
        this.camera.position.add(movement);
        
        // Smoothly interpolate ship rotation
        const targetRotationX = this.shipHomeRotation.x + targetPitch;
        const targetRotationZ = this.shipHomeRotation.z + targetRoll;
        
        this.ship.rotation.x = THREE.MathUtils.lerp(
            this.ship.rotation.x,
            targetRotationX,
            rotationSpeed * deltaTime
        );
        this.ship.rotation.z = THREE.MathUtils.lerp(
            this.ship.rotation.z,
            targetRotationZ,
            rotationSpeed * deltaTime
        );
    }

    updateDebugInfo() {
        const debugElement = document.getElementById('debug');
        
        // Always show ship position if ship exists
        if (this.ship) {
            let statusHtml = '';
            if (this.shipDebugMode) {
                statusHtml = `
                    <div style="color: #ffd700; font-weight: bold; margin-top: 10px;">
                        <strong>MANUAL CONTROL MODE</strong>
                    </div>
                    <div style="margin-top: 10px; font-size: 11px; color: #ffd700;">
                        <strong>Controls:</strong><br>
                        WASD: Move Screen Up/Down/Left/Right<br>
                        Camera moves with ship
                    </div>
                `;
            } else {
                const anim = this.shipAnimation;
                statusHtml = `
                    <div style="color: #ff6b6b; font-weight: bold; margin-top: 10px;">
                        ANIMATION MODE
                    </div>
                    <div style="font-size: 12px; margin-top: 5px;">
                        Waypoint: ${anim.currentWaypoint + 1} / ${anim.waypoints.length}<br>
                        Camera Tracking: ${anim.waypoints[Math.min(anim.currentWaypoint + 1, anim.waypoints.length - 1)].cameraTrack ? 'ON' : 'OFF'}
                    </div>
                `;
            }
            
            const html = `
                <div style="background: rgba(0, 0, 0, 0.8); padding: 15px; border-radius: 10px;">
                    <div style="color: #ff6b6b; font-weight: bold; font-size: 16px; margin-bottom: 10px;">
                        SHIP POSITION & ROTATION
                    </div>
                    <div style="color: #4CAF50; font-weight: bold;">Position:</div>
                    <div>X: ${this.ship.position.x.toFixed(2)}</div>
                    <div>Y: ${this.ship.position.y.toFixed(2)}</div>
                    <div>Z: ${this.ship.position.z.toFixed(2)}</div>
                    <div style="color: #2196F3; font-weight: bold; margin-top: 10px;">Rotation:</div>
                    <div>X: ${this.ship.rotation.x.toFixed(3)} (${(this.ship.rotation.x * 180 / Math.PI).toFixed(1)}°)</div>
                    <div>Y: ${this.ship.rotation.y.toFixed(3)} (${(this.ship.rotation.y * 180 / Math.PI).toFixed(1)}°)</div>
                    <div>Z: ${this.ship.rotation.z.toFixed(3)} (${(this.ship.rotation.z * 180 / Math.PI).toFixed(1)}°)</div>
                    ${statusHtml}
                    <div style="margin-top: 10px; background: #1a1a1a; padding: 8px; font-family: monospace; font-size: 10px; border-radius: 5px; color: #00ff00;">
                        Position:<br>
                        new THREE.Vector3(${this.ship.position.x.toFixed(2)}, ${this.ship.position.y.toFixed(2)}, ${this.ship.position.z.toFixed(2)})<br><br>
                        Rotation:<br>
                        new THREE.Euler(${this.ship.rotation.x.toFixed(3)}, ${this.ship.rotation.y.toFixed(3)}, ${this.ship.rotation.z.toFixed(3)})
                    </div>
                </div>
            `;
            debugElement.innerHTML = html;
            debugElement.style.display = 'block';
        }
    }

    showError(message) {
        const loadingElement = document.getElementById('loading');
        loadingElement.innerHTML = `<div style="color: red;">Error: ${message}</div>`;
    }

    // Game state methods
    addScore(points) {
        this.gameState.score += points;
    }

    loseLife() {
        this.gameState.lives--;
        if (this.gameState.lives <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        console.log('Game Over! Consumed by the black hole.');
        this.isGameOver = true;
        this.stop();
        
        // Disable pointer lock so cursor is visible for clicking
        if (this.inputHandler) {
            this.inputHandler.disablePointerLock();
        }
        
        // Show game over modal
        const gameOverModal = document.getElementById('game-over-modal');
        if (gameOverModal) {
            gameOverModal.classList.add('show');
        }
    }
    
    checkGameOverConditions() {
        // Check if distance reached 0 (pulled into event horizon)
        if (this.shipStats.distance <= 0 && !this.isGameOver) {
            this.gameOver();
            return true;
        }
        return false;
    }
    
    resetGame() {
        console.log('Resetting game...');
        
        // Reset game over flag
        this.isGameOver = false;
        
        // Reset ship stats
        this.shipStats = {
            warp: 2.2,
            warpMax: 6.5,
            fuel: 100,
            fuelMax: 100,
            iron: 0.0,
            cargoMax: 20.0,
            distance: 100.0
        };
        
        // Reset timers
        this.fuelConsumptionTimer = 0;
        this.asteroidSpawnTimer = 0;
        
        // Remove all asteroids from scene (do this first)
        console.log(`Removing ${this.asteroids.length} asteroids`);
        this.asteroids.forEach(asteroid => {
            if (asteroid.mesh && asteroid.mesh.parent) {
                this.scene.remove(asteroid.mesh);
                // Dispose of geometry and materials
                if (asteroid.mesh.geometry) asteroid.mesh.geometry.dispose();
                if (asteroid.mesh.material) {
                    if (Array.isArray(asteroid.mesh.material)) {
                        asteroid.mesh.material.forEach(mat => mat.dispose());
                    } else {
                        asteroid.mesh.material.dispose();
                    }
                }
            }
        });
        this.asteroids = [];
        console.log('All asteroids removed');
        
        // Remove all particles
        console.log(`Removing ${this.particles.length} particles`);
        this.particles.forEach(particle => {
            if (particle.mesh) {
                this.scene.remove(particle.mesh);
                if (particle.mesh.geometry) particle.mesh.geometry.dispose();
                if (particle.mesh.material) particle.mesh.material.dispose();
            }
        });
        this.particles = [];
        console.log('All particles removed');
        
        // Remove all debris particles
        console.log(`Removing ${this.debrisParticles.length} debris particles`);
        this.debrisParticles.forEach(debris => {
            if (debris.mesh) {
                this.scene.remove(debris.mesh);
                if (debris.mesh.geometry) debris.mesh.geometry.dispose();
                if (debris.mesh.material) debris.mesh.material.dispose();
            }
        });
        this.debrisParticles = [];
        console.log('All debris particles removed');
        
        // Hide laser beam
        this.hideLaserBeam();
        this.currentLaserTarget = null;
        
        // Reset camera to initial position
        this.camera.position.set(0, 8, 15);
        this.camera.lookAt(0, 0, 0);
        console.log('Camera reset to:', this.camera.position, 'looking at origin');
        
        // Reset ship to initial position
        if (this.ship && this.shipAnimation && this.shipAnimation.waypoints.length > 0) {
            const firstWaypoint = this.shipAnimation.waypoints[0];
            this.ship.position.copy(firstWaypoint.position);
            this.ship.rotation.copy(firstWaypoint.rotation);
            console.log('Ship reset to:', this.ship.position);
        }
        
        // Reset ship animation state
        if (this.shipAnimation) {
            this.shipAnimation.isAnimating = false;
            this.shipAnimation.currentWaypoint = 0;
            this.shipAnimation.startTime = 0;
        }
        
        // Disable manual controls
        this.shipDebugMode = false;
        
        // Clear ship home rotation
        this.shipHomeRotation = null;
        
        // Hide UI elements
        this.hideUIPanel();
        
        // Force a render to show the reset scene
        this.render();
        
        console.log('Game reset complete');
    }

    nextLevel() {
        this.gameState.level++;
        console.log(`Level ${this.gameState.level}`);
        // Add level progression logic here
    }
    
    // Tutorial and Warning System
    showTutorialMessage(message, type = 'warning', duration = 5000) {
        const messageEl = document.getElementById('tutorial-message');
        if (!messageEl) return;
        
        messageEl.textContent = message;
        messageEl.className = type; // 'warning' or 'danger'
        messageEl.style.display = 'block';
        
        // Auto-hide after duration
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, duration);
    }
    
    updateDangerOverlay() {
        const overlayEl = document.getElementById('danger-overlay');
        if (!overlayEl) return;
        
        const distance = this.shipStats.distance;
        
        if (distance < 20) {
            // Progressive red screen: opacity increases as distance approaches 0
            // At 20 clicks: 0% opacity
            // At 0 clicks: 80% opacity
            const opacity = ((20 - distance) / 20) * 0.8;
            overlayEl.style.opacity = opacity;
        } else {
            overlayEl.style.opacity = 0;
        }
    }
    
    // Upgrade Multiplier Helpers
    getWeaponMultiplier() {
        if (!this.ownedUpgrades.weapon || !this.weaponsData) return 1.0;
        
        const weapon = this.weaponsData.find(w => w.id === this.ownedUpgrades.weapon);
        return weapon ? weapon.power : 1.0;
    }
    
    getFuelReduction() {
        if (!this.ownedUpgrades.engine || !this.enginesData) return 0.0;
        
        const engine = this.enginesData.find(e => e.id === this.ownedUpgrades.engine);
        return engine ? (1.0 - engine.fuelEfficiency) : 0.0;
    }
    
    getExtractorMultiplier() {
        if (!this.ownedUpgrades.extractor || !this.extractorsData) return 1.0;
        
        const extractor = this.extractorsData.find(e => e.id === this.ownedUpgrades.extractor);
        return extractor ? extractor.collectionMultiplier : 1.0;
    }
    
    // Trading Station System
    getUpgradeData() {
        // Return the loaded JSON data
        return {
            ships: this.shipsData || [],
            weapons: this.weaponsData || [],
            propulsion: this.enginesData || [],
            extractors: this.extractorsData || []
        };
    }
    
    setupStationViewer() {
        const viewerContainer = document.getElementById('station-ship-viewer');
        if (!viewerContainer) return;
        
        // Create separate scene and camera for station
        this.stationScene = new THREE.Scene();
        this.stationCamera = new THREE.PerspectiveCamera(
            45,
            viewerContainer.clientWidth / viewerContainer.clientHeight,
            0.1,
            1000
        );
        this.stationCamera.position.set(5, 3, 8);
        this.stationCamera.lookAt(0, 0, 0);
        
        // Create renderer for station viewer
        this.stationRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.stationRenderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
        this.stationRenderer.setClearColor(0x000000, 0);
        viewerContainer.appendChild(this.stationRenderer.domElement);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.stationScene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.stationScene.add(directionalLight);
        
        // Clone the player's ship for display
        if (this.ship) {
            this.stationShip = this.ship.clone();
            this.stationShip.position.set(0, 0, 0);
            this.stationShip.rotation.set(0, 0, 0);
            this.stationScene.add(this.stationShip);
        }
        
        // Start rotation animation
        const rotateShip = () => {
            if (this.stationShip && document.getElementById('station-modal').classList.contains('show')) {
                this.stationShip.rotation.y += 0.01;
                this.stationRenderer.render(this.stationScene, this.stationCamera);
                requestAnimationFrame(rotateShip);
            }
        };
        rotateShip();
    }
    
    openTradingStation() {
        console.log('Opening trading station...');
        
        // Pause game
        this.stop();
        
        // Disable pointer lock
        if (this.inputHandler) {
            this.inputHandler.disablePointerLock();
        }
        
        // Force exit pointer lock (backup)
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // Ensure cursor is visible
        document.body.style.cursor = 'default';
        
        // Sell cargo
        const ironSold = this.shipStats.iron;
        const cargoValue = Math.floor(ironSold * this.ironPrice);
        this.credits += cargoValue;
        this.shipStats.iron = 0; // Clear cargo
        
        console.log(`Sold ${ironSold.toFixed(1)}t iron for ${cargoValue} credits. Total: ${this.credits}`);
        
        // Update UI
        this.updateStationUI(cargoValue, ironSold);
        
        // Setup 3D viewer
        setTimeout(() => this.setupStationViewer(), 100);
        
        // Populate upgrades
        this.populateStationUpgrades();
        
        // Populate mineral markets
        this.populateMineralMarkets();
        
        // Show modal
        const modal = document.getElementById('station-modal');
        if (modal) {
            modal.classList.add('show');
        }
        
        // Setup tab switching
        this.setupStationTabs();
        
        // Setup return button
        const returnBtn = document.getElementById('station-return-btn');
        if (returnBtn) {
            returnBtn.onclick = () => this.closeTradingStation();
        }
    }
    
    closeTradingStation() {
        console.log('Closing trading station...');
        
        // Reset cursor style
        document.body.style.cursor = '';
        
        // Hide modal
        const modal = document.getElementById('station-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        // Clean up station renderer
        if (this.stationRenderer) {
            const viewerContainer = document.getElementById('station-ship-viewer');
            if (viewerContainer && this.stationRenderer.domElement) {
                viewerContainer.removeChild(this.stationRenderer.domElement);
            }
            this.stationRenderer.dispose();
            this.stationRenderer = null;
        }
        
        // Clear station scene
        if (this.stationShip) {
            this.stationScene.remove(this.stationShip);
            this.stationShip = null;
        }
        
        // Reset stats for new mission
        this.shipStats.fuel = this.shipStats.fuelMax;
        this.shipStats.distance = 100.0;
        this.shipStats.warp = 2.2; // Reset to equilibrium warp
        
        // Reset timers
        this.fuelConsumptionTimer = 0;
        this.debrisSpawnTimer = 0;
        this.passiveIronTimer = 0;
        
        // Reset tutorial flags for new mission
        this.tutorialShown.shieldHit = false;
        this.tutorialShown.asteroidDestroyed = false;
        this.tutorialShown.cargoFull = false;
        this.tutorialShown.controls = false;
        this.dangerWarningShown = false;
        
        // Hide any visible messages
        const messageEl = document.getElementById('tutorial-message');
        if (messageEl) {
            messageEl.style.display = 'none';
        }
        
        // Reset danger overlay
        const overlayEl = document.getElementById('danger-overlay');
        if (overlayEl) {
            overlayEl.style.opacity = 0;
        }
        
        // Update HUD to show new values
        this.updateHudBars();
        this.updateDistanceDisplay();
        
        console.log('New mission started: Fuel refilled, distance reset to 100 clicks');
        
        // Resume game
        this.start();
    }
    
    updateStationUI(cargoValue, ironSold) {
        const creditsEl = document.getElementById('station-credits');
        const cargoValueEl = document.getElementById('station-cargo-value');
        const ironSoldEl = document.getElementById('station-iron-sold');
        
        if (creditsEl) creditsEl.textContent = this.credits;
        if (cargoValueEl) cargoValueEl.textContent = cargoValue;
        if (ironSoldEl) ironSoldEl.textContent = ironSold.toFixed(1) + 't';
        
        // Update HUD bars
        this.updateHudBars();
    }
    
    setupStationTabs() {
        const tabs = document.querySelectorAll('.station-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                
                // Remove active from all tabs and contents
                document.querySelectorAll('.station-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.station-tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active to clicked tab and corresponding content
                tab.classList.add('active');
                document.getElementById(`tab-${tabName}`).classList.add('active');
            });
        });
    }
    
    populateStationUpgrades() {
        const upgradeData = this.getUpgradeData();
        
        // Map category to owned upgrade key
        const categoryToKey = {
            'ships': 'ship',
            'weapons': 'weapon',
            'propulsion': 'engine',
            'extractors': 'extractor'
        };
        
        // Populate each tab
        Object.keys(upgradeData).forEach(category => {
            const tabContent = document.getElementById(`tab-${category}`);
            if (!tabContent) return;
            
            tabContent.innerHTML = '';
            
            upgradeData[category].forEach(item => {
                const ownershipKey = categoryToKey[category];
                const isOwned = this.ownedUpgrades[ownershipKey] === item.id;
                const canAfford = this.credits >= item.price;
                
                // Build detailed description based on category
                let detailsHTML = `<p>${item.description}</p>`;
                
                if (category === 'ships' && item.stats) {
                    detailsHTML += `<p style="color: #00ffff; font-size: 12px; margin-top: 5px;">
                        Warp: ${item.stats.warpMax} | Fuel: ${item.stats.fuelMax} | Cargo: ${item.stats.cargoMax}t | Slots: ${item.extractorSlots}
                    </p>`;
                } else if (category === 'weapons') {
                    detailsHTML += `<p style="color: #00ffff; font-size: 12px; margin-top: 5px;">
                        Range: ${item.range} | Power: ${item.power}x
                    </p>`;
                } else if (category === 'propulsion') {
                    detailsHTML += `<p style="color: #00ffff; font-size: 12px; margin-top: 5px;">
                        Max Warp: ${item.maxWarpSpeed} | Fuel Efficiency: ${Math.round(item.fuelEfficiency * 100)}%
                    </p>`;
                } else if (category === 'extractors') {
                    detailsHTML += `<p style="color: #00ffff; font-size: 12px; margin-top: 5px;">
                        Collection: ${item.collectionMultiplier}x | Elements: ${item.elements.length}
                    </p>`;
                }
                
                const upgradeEl = document.createElement('div');
                upgradeEl.className = 'upgrade-item';
                upgradeEl.innerHTML = `
                    <div class="upgrade-info">
                        <h3>${item.name}</h3>
                        ${detailsHTML}
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="upgrade-price">${item.price === 0 ? 'Free' : item.price + ' CR'}</div>
                        <button class="upgrade-buy-btn" 
                                ${isOwned || !canAfford ? 'disabled' : ''}
                                data-category="${category}"
                                data-id="${item.id}"
                                data-price="${item.price}">
                            ${isOwned ? 'OWNED' : 'BUY'}
                        </button>
                    </div>
                `;
                
                // Add click handler
                const buyBtn = upgradeEl.querySelector('.upgrade-buy-btn');
                if (buyBtn && !isOwned && canAfford) {
                    buyBtn.addEventListener('click', () => {
                        this.purchaseUpgrade(category, item);
                    });
                }
                
                tabContent.appendChild(upgradeEl);
            });
        });
    }
    
    purchaseUpgrade(category, item) {
        if (this.credits < item.price) {
            console.log('Not enough credits!');
            return;
        }
        
        // Deduct credits
        this.credits -= item.price;
        
        // Map category to owned upgrade key
        const categoryToKey = {
            'ships': 'ship',
            'weapons': 'weapon',
            'propulsion': 'engine',
            'extractors': 'extractor'
        };
        
        const upgradeCategoryKey = categoryToKey[category];
        this.ownedUpgrades[upgradeCategoryKey] = item.id;
        
        // Apply stats based on category
        if (category === 'ships' && item.stats) {
            this.shipStats.warpMax = item.stats.warpMax;
            this.shipStats.fuelMax = item.stats.fuelMax;
            this.shipStats.cargoMax = item.stats.cargoMax;
            // Refill fuel on ship purchase
            this.shipStats.fuel = item.stats.fuelMax;
        } else if (category === 'propulsion' && item.maxWarpSpeed) {
            // Update warp max based on engine
            this.shipStats.warpMax = item.maxWarpSpeed;
        }
        
        console.log(`Purchased ${item.name} for ${item.price} credits`);
        
        // Refresh UI
        this.updateStationUI(0, 0);
        this.populateStationUpgrades();
    }
    
    populateMineralMarkets() {
        const marketsTab = document.getElementById('tab-markets');
        if (!marketsTab || !this.lootTable) return;
        
        // Create table HTML
        let tableHTML = `
            <table class="mineral-table">
                <thead>
                    <tr>
                        <th>Mineral</th>
                        <th>Rarity</th>
                        <th>Value</th>
                        <th>Bonus Effect</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Sort by value (high to low)
        const sortedMinerals = [...this.lootTable].sort((a, b) => b.value - a.value);
        
        sortedMinerals.forEach(mineral => {
            const rarityClass = `rarity-${mineral.rarity.toLowerCase()}`;
            tableHTML += `
                <tr>
                    <td><span class="mineral-name">${mineral.name}</span></td>
                    <td><span class="mineral-rarity ${rarityClass}">${mineral.rarity}</span></td>
                    <td><span class="mineral-value">${mineral.value} CR</span></td>
                    <td><span class="mineral-bonus">${mineral.bonus}</span></td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        marketsTab.innerHTML = tableHTML;
    }
}


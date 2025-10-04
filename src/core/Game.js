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
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x87CEEB, 1); // Sky blue
        
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
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
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
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
        
        console.log('Glass sphere, accretion disk, and ship created');
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
                console.log('Ship animation complete - manual controls enabled');
            }
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
        
        // Update debug info (only if debug mode is enabled)
        if (this.debugMode) {
            this.updateDebugInfo();
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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
        
        const moveSpeed = 10 * deltaTime; // units per second
        
        // Get camera's right and up vectors for screen-space movement
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        
        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(this.camera.up, cameraDirection).normalize();
        
        const cameraUp = new THREE.Vector3(0, 1, 0); // Always move vertically in world space
        
        // Movement controls based on screen coordinates (WASD)
        const movement = new THREE.Vector3();
        
        if (this.inputHandler.isKeyPressed('KeyW')) {
            // Move up on screen (world Y-axis up)
            movement.add(cameraUp.clone().multiplyScalar(moveSpeed));
        }
        if (this.inputHandler.isKeyPressed('KeyS')) {
            // Move down on screen (world Y-axis down)
            movement.add(cameraUp.clone().multiplyScalar(-moveSpeed));
        }
        if (this.inputHandler.isKeyPressed('KeyA')) {
            // Move left on screen
            movement.add(cameraRight.clone().multiplyScalar(moveSpeed));
        }
        if (this.inputHandler.isKeyPressed('KeyD')) {
            // Move right on screen
            movement.add(cameraRight.clone().multiplyScalar(-moveSpeed));
        }
        
        // Apply movement to both ship and camera
        this.ship.position.add(movement);
        this.camera.position.add(movement);
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
        console.log('Game Over!');
        this.stop();
        // Add game over logic here
    }

    nextLevel() {
        this.gameState.level++;
        console.log(`Level ${this.gameState.level}`);
        // Add level progression logic here
    }
}


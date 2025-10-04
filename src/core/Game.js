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
        this.debugMode = false;
        
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
            this.createInitialObjects();
            
            // Start game loop
            this.start();
            
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

    createInitialObjects() {
        // Create a refractive glass sphere
        this.createGlassSphere();
        
        // Create accretion disk planes
        this.createAccretionDisk();
        
        console.log('Glass sphere and accretion disk created');
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
        
        // Update debug info
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
        debugElement.style.display = this.debugMode ? 'block' : 'none';
    }

    updateDebugInfo() {
        const debugElement = document.getElementById('debug');
        debugElement.innerHTML = `
            <div>FPS: ${Math.round(1 / this.deltaTime)}</div>
            <div>Delta Time: ${this.deltaTime.toFixed(4)}s</div>
            <div>Game Objects: ${this.gameObjects.length}</div>
            <div>Camera Position: ${this.camera.position.x.toFixed(2)}, ${this.camera.position.y.toFixed(2)}, ${this.camera.position.z.toFixed(2)}</div>
            <div>Score: ${this.gameState.score}</div>
            <div>Time: ${this.gameState.time.toFixed(2)}s</div>
        `;
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


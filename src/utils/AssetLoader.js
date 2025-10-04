class AssetLoader {
    constructor() {
        this.loader = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.loader);
        this.modelLoader = new THREE.ObjectLoader(this.loader);
        this.audioLoader = new THREE.AudioLoader(this.loader);
        
        // Asset cache
        this.textures = new Map();
        this.models = new Map();
        this.audio = new Map();
        
        // Loading state
        this.loadingCount = 0;
        this.loadedCount = 0;
        this.isLoading = false;
        
        this.setupLoadingManager();
    }

    setupLoadingManager() {
        this.loader.onStart = (url, itemsLoaded, itemsTotal) => {
            this.loadingCount = itemsTotal;
            this.loadedCount = itemsLoaded;
            this.isLoading = true;
            console.log(`Loading assets: ${itemsLoaded}/${itemsTotal}`);
        };

        this.loader.onLoad = () => {
            this.isLoading = false;
            console.log('All assets loaded successfully');
        };

        this.loader.onProgress = (url, itemsLoaded, itemsTotal) => {
            this.loadedCount = itemsLoaded;
            const progress = (itemsLoaded / itemsTotal) * 100;
            console.log(`Loading progress: ${progress.toFixed(1)}%`);
        };

        this.loader.onError = (url) => {
            console.error(`Failed to load asset: ${url}`);
        };
    }

    // Texture loading
    async loadTexture(url, options = {}) {
        if (this.textures.has(url)) {
            return this.textures.get(url);
        }

        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                url,
                (texture) => {
                    // Apply default options
                    texture.wrapS = options.wrapS || THREE.RepeatWrapping;
                    texture.wrapT = options.wrapT || THREE.RepeatWrapping;
                    texture.magFilter = options.magFilter || THREE.LinearFilter;
                    texture.minFilter = options.minFilter || THREE.LinearMipmapLinearFilter;
                    
                    if (options.repeat) {
                        texture.repeat.set(options.repeat.x, options.repeat.y);
                    }
                    
                    this.textures.set(url, texture);
                    resolve(texture);
                },
                (progress) => {
                    console.log(`Loading texture ${url}: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
                },
                (error) => {
                    console.error(`Failed to load texture: ${url}`, error);
                    reject(error);
                }
            );
        });
    }

    // Load multiple textures
    async loadTextures(urls, options = {}) {
        const promises = urls.map(url => this.loadTexture(url, options));
        return Promise.all(promises);
    }

    // Model loading
    async loadModel(url) {
        if (this.models.has(url)) {
            return this.models.get(url);
        }

        return new Promise((resolve, reject) => {
            this.modelLoader.load(
                url,
                (object) => {
                    this.models.set(url, object);
                    resolve(object);
                },
                (progress) => {
                    console.log(`Loading model ${url}: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
                },
                (error) => {
                    console.error(`Failed to load model: ${url}`, error);
                    reject(error);
                }
            );
        });
    }

    // Audio loading
    async loadAudio(url) {
        if (this.audio.has(url)) {
            return this.audio.get(url);
        }

        return new Promise((resolve, reject) => {
            this.audioLoader.load(
                url,
                (audioBuffer) => {
                    this.audio.set(url, audioBuffer);
                    resolve(audioBuffer);
                },
                (progress) => {
                    console.log(`Loading audio ${url}: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
                },
                (error) => {
                    console.error(`Failed to load audio: ${url}`, error);
                    reject(error);
                }
            );
        });
    }

    // Create procedural textures
    createProceduralTexture(type, options = {}) {
        const canvas = document.createElement('canvas');
        canvas.width = options.width || 256;
        canvas.height = options.height || 256;
        const context = canvas.getContext('2d');

        switch (type) {
            case 'checkerboard':
                return this.createCheckerboardTexture(canvas, context, options);
            case 'noise':
                return this.createNoiseTexture(canvas, context, options);
            case 'gradient':
                return this.createGradientTexture(canvas, context, options);
            case 'solid':
                return this.createSolidTexture(canvas, context, options);
            default:
                throw new Error(`Unknown procedural texture type: ${type}`);
        }
    }

    createCheckerboardTexture(canvas, context, options) {
        const size = options.checkSize || 32;
        const color1 = options.color1 || '#ffffff';
        const color2 = options.color2 || '#000000';

        for (let x = 0; x < canvas.width; x += size) {
            for (let y = 0; y < canvas.height; y += size) {
                context.fillStyle = (x / size + y / size) % 2 === 0 ? color1 : color2;
                context.fillRect(x, y, size, size);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createNoiseTexture(canvas, context, options) {
        const imageData = context.createImageData(canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random();
            data[i] = noise * 255;     // Red
            data[i + 1] = noise * 255; // Green
            data[i + 2] = noise * 255; // Blue
            data[i + 3] = 255;         // Alpha
        }

        context.putImageData(imageData, 0, 0);
        return new THREE.CanvasTexture(canvas);
    }

    createGradientTexture(canvas, context, options) {
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        const color1 = options.color1 || '#ff0000';
        const color2 = options.color2 || '#0000ff';
        
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        return new THREE.CanvasTexture(canvas);
    }

    createSolidTexture(canvas, context, options) {
        const color = options.color || '#ffffff';
        context.fillStyle = color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        return new THREE.CanvasTexture(canvas);
    }

    // Create materials
    createMaterial(type, options = {}) {
        switch (type) {
            case 'basic':
                return new THREE.MeshBasicMaterial(options);
            case 'lambert':
                return new THREE.MeshLambertMaterial(options);
            case 'phong':
                return new THREE.MeshPhongMaterial(options);
            case 'standard':
                return new THREE.MeshStandardMaterial(options);
            case 'toon':
                return new THREE.MeshToonMaterial(options);
            default:
                return new THREE.MeshBasicMaterial(options);
        }
    }

    // Get loading progress
    getLoadingProgress() {
        if (this.loadingCount === 0) return 1;
        return this.loadedCount / this.loadingCount;
    }

    // Check if loading is complete
    isLoadingComplete() {
        return !this.isLoading && this.loadedCount >= this.loadingCount;
    }

    // Clear cache
    clearCache() {
        this.textures.clear();
        this.models.clear();
        this.audio.clear();
    }

    // Get cached asset
    getCachedTexture(url) {
        return this.textures.get(url);
    }

    getCachedModel(url) {
        return this.models.get(url);
    }

    getCachedAudio(url) {
        return this.audio.get(url);
    }

    // Preload common assets
    async preloadCommonAssets() {
        const commonTextures = [
            'assets/textures/grass.jpg',
            'assets/textures/stone.jpg',
            'assets/textures/wood.jpg',
            'assets/textures/metal.jpg',
            'assets/textures/water.jpg'
        ];

        const promises = commonTextures.map(url => 
            this.loadTexture(url).catch(error => {
                console.warn(`Failed to preload texture: ${url}`);
                return null;
            })
        );

        await Promise.all(promises);
    }
}


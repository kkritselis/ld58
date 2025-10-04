class Camera extends GameObject {
    constructor(game, target = null) {
        super();
        
        this.game = game;
        this.target = target;
        this.camera = null;
        
        // Camera settings
        this.followDistance = 10;
        this.followHeight = 5;
        this.smoothing = 5;
        this.minDistance = 5;
        this.maxDistance = 20;
        
        // Camera state
        this.currentDistance = this.followDistance;
        this.currentHeight = this.followHeight;
        this.lookOffset = new THREE.Vector3(0, 2, 0);
        
        // Mouse controls
        this.mouseSensitivity = 0.002;
        this.pitch = 0;
        this.yaw = 0;
        this.maxPitch = Math.PI / 2 - 0.1;
        this.minPitch = -Math.PI / 2 + 0.1;
        
        this.init();
    }

    init() {
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Set initial position
        this.updatePosition();
    }

    setTarget(target) {
        this.target = target;
    }

    update(deltaTime, inputHandler) {
        if (!this.target) return;
        
        // Handle mouse input for camera rotation
        if (inputHandler && inputHandler.mouseDelta) {
            this.yaw -= inputHandler.mouseDelta.x * this.mouseSensitivity;
            this.pitch -= inputHandler.mouseDelta.y * this.mouseSensitivity;
            
            // Clamp pitch
            this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
        }
        
        // Handle zoom with scroll wheel
        if (inputHandler && inputHandler.scrollDelta) {
            this.currentDistance -= inputHandler.scrollDelta * 0.5;
            this.currentDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.currentDistance));
        }
        
        // Update camera position
        this.updatePosition();
        
        // Make camera look at target
        if (this.target.position) {
            const lookAtPosition = this.target.position.clone().add(this.lookOffset);
            this.camera.lookAt(lookAtPosition);
        }
    }

    updatePosition() {
        if (!this.target) return;
        
        // Calculate desired position
        const targetPosition = this.target.position.clone();
        
        // Apply rotation
        const offset = new THREE.Vector3(
            Math.sin(this.yaw) * Math.cos(this.pitch) * this.currentDistance,
            Math.sin(this.pitch) * this.currentDistance + this.currentHeight,
            Math.cos(this.yaw) * Math.cos(this.pitch) * this.currentDistance
        );
        
        const desiredPosition = targetPosition.clone().add(offset);
        
        // Smooth camera movement
        this.position.lerp(desiredPosition, this.smoothing * 0.016); // Assuming 60fps
        
        // Update camera position
        this.camera.position.copy(this.position);
    }

    // Camera shake effect
    shake(intensity = 1, duration = 0.5) {
        const originalPosition = this.camera.position.clone();
        const startTime = Date.now();
        
        const shakeLoop = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                this.camera.position.copy(originalPosition);
                return;
            }
            
            // Calculate shake offset
            const shakeIntensity = intensity * (1 - progress);
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * shakeIntensity,
                (Math.random() - 0.5) * shakeIntensity,
                (Math.random() - 0.5) * shakeIntensity
            );
            
            this.camera.position.copy(originalPosition).add(offset);
            
            requestAnimationFrame(shakeLoop);
        };
        
        shakeLoop();
    }

    // Set camera mode
    setFollowMode(distance, height, smoothing = 5) {
        this.followDistance = distance;
        this.followHeight = height;
        this.smoothing = smoothing;
        this.currentDistance = distance;
        this.currentHeight = height;
    }

    setFixedMode(position, lookAt) {
        this.camera.position.copy(position);
        this.camera.lookAt(lookAt);
    }

    // Get camera for Three.js renderer
    getCamera() {
        return this.camera;
    }

    // Screen space to world space conversion
    screenToWorld(screenPosition, distance = 10) {
        const vector = new THREE.Vector3();
        vector.set(
            (screenPosition.x / window.innerWidth) * 2 - 1,
            -(screenPosition.y / window.innerHeight) * 2 + 1,
            0.5
        );
        
        vector.unproject(this.camera);
        const direction = vector.sub(this.camera.position).normalize();
        
        return this.camera.position.clone().add(direction.multiplyScalar(distance));
    }

    // World space to screen space conversion
    worldToScreen(worldPosition) {
        const vector = worldPosition.clone();
        vector.project(this.camera);
        
        return {
            x: (vector.x + 1) / 2 * window.innerWidth,
            y: -(vector.y - 1) / 2 * window.innerHeight,
            z: vector.z
        };
    }
}


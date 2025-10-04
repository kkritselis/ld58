class Player extends GameObject {
    constructor() {
        super();
        
        // Player properties
        this.speed = 5;
        this.jumpForce = 10;
        this.isGrounded = false;
        this.health = 100;
        this.maxHealth = 100;
        
        // Movement state
        this.moveDirection = new THREE.Vector3();
        this.isMoving = false;
        
        // Create player mesh
        this.createMesh();
        
        // Enable collision
        this.enableCollision();
        this.addTag('player');
    }

    createMesh() {
        // Create a simple capsule-like player
        const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.castShadow = true;
        this.setMesh(mesh);
    }

    update(deltaTime, inputHandler) {
        if (!this.active) return;
        
        // Handle input
        this.handleInput(inputHandler, deltaTime);
        
        // Apply gravity
        this.applyGravity(deltaTime);
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Apply to mesh
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.copy(this.rotation);
        }
        
        // Update bounding volumes
        this.updateBoundingVolumes();
    }

    handleInput(inputHandler, deltaTime) {
        if (!inputHandler) return;
        
        // Reset movement direction
        this.moveDirection.set(0, 0, 0);
        this.isMoving = false;
        
        // Movement input
        if (inputHandler.isKeyPressed('KeyW')) {
            this.moveDirection.z -= 1;
            this.isMoving = true;
        }
        if (inputHandler.isKeyPressed('KeyS')) {
            this.moveDirection.z += 1;
            this.isMoving = true;
        }
        if (inputHandler.isKeyPressed('KeyA')) {
            this.moveDirection.x -= 1;
            this.isMoving = true;
        }
        if (inputHandler.isKeyPressed('KeyD')) {
            this.moveDirection.x += 1;
            this.isMoving = true;
        }
        
        // Normalize movement direction
        if (this.isMoving) {
            this.moveDirection.normalize();
            
            // Apply movement
            const moveVector = this.moveDirection.clone().multiplyScalar(this.speed);
            this.velocity.x = moveVector.x;
            this.velocity.z = moveVector.z;
            
            // Rotate player to face movement direction
            if (this.moveDirection.length() > 0) {
                const targetRotation = Math.atan2(this.moveDirection.x, this.moveDirection.z);
                this.rotation.y = targetRotation;
            }
        } else {
            // Apply friction
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
        }
        
        // Jump
        if (inputHandler.isKeyPressed('Space') && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
        
        // Mouse look
        if (inputHandler.isPointerLocked()) {
            const mouseDelta = inputHandler.getMouseDelta();
            this.rotation.y -= mouseDelta.x * 0.002;
            this.rotation.x -= mouseDelta.y * 0.002;
            
            // Clamp vertical rotation
            this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
        }
    }

    applyGravity(deltaTime) {
        if (!this.isGrounded) {
            this.velocity.y -= 20 * deltaTime; // Gravity
            
            // Simple ground check
            if (this.position.y <= 1) {
                this.position.y = 1;
                this.velocity.y = 0;
                this.isGrounded = true;
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    die() {
        console.log('Player died!');
        this.setActive(false);
        // Add death logic here
    }

    onCollision(other) {
        // Handle collisions with other objects
        if (other.hasTag('enemy')) {
            this.takeDamage(10);
        } else if (other.hasTag('collectible')) {
            // Handle collectible pickup
            other.destroy();
        }
    }
}


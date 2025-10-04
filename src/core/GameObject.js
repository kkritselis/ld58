class GameObject {
    constructor() {
        this.mesh = null;
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();
        this.scale = new THREE.Vector3(1, 1, 1);
        this.velocity = new THREE.Vector3();
        this.angularVelocity = new THREE.Euler();
        
        // GameObject properties
        this.active = true;
        this.visible = true;
        this.collisionEnabled = false;
        this.boundingBox = null;
        this.boundingSphere = null;
        
        // Tags for identification
        this.tags = [];
        
        // Custom properties
        this.properties = {};
    }

    setMesh(mesh) {
        if (this.mesh) {
            // Remove old mesh if it exists
            this.mesh.parent?.remove(this.mesh);
        }
        
        this.mesh = mesh;
        if (mesh) {
            mesh.position.copy(this.position);
            mesh.rotation.copy(this.rotation);
            mesh.scale.copy(this.scale);
            mesh.visible = this.visible;
        }
    }

    update(deltaTime, inputHandler) {
        if (!this.active) return;
        
        // Update position based on velocity
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Update rotation based on angular velocity
        this.rotation.x += this.angularVelocity.x * deltaTime;
        this.rotation.y += this.angularVelocity.y * deltaTime;
        this.rotation.z += this.angularVelocity.z * deltaTime;
        
        // Apply to mesh
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.copy(this.rotation);
            this.mesh.scale.copy(this.scale);
            this.mesh.visible = this.visible;
        }
        
        // Update bounding volumes
        this.updateBoundingVolumes();
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    setRotation(x, y, z) {
        this.rotation.set(x, y, z);
        if (this.mesh) {
            this.mesh.rotation.copy(this.rotation);
        }
    }

    setScale(x, y, z) {
        this.scale.set(x, y, z);
        if (this.mesh) {
            this.mesh.scale.copy(this.scale);
        }
    }

    translate(deltaX, deltaY, deltaZ) {
        this.position.add(deltaX, deltaY, deltaZ);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    rotate(deltaX, deltaY, deltaZ) {
        this.rotation.x += deltaX;
        this.rotation.y += deltaY;
        this.rotation.z += deltaZ;
        if (this.mesh) {
            this.mesh.rotation.copy(this.rotation);
        }
    }

    lookAt(target) {
        if (this.mesh) {
            this.mesh.lookAt(target);
            this.rotation.copy(this.mesh.rotation);
        }
    }

    setActive(active) {
        this.active = active;
        if (this.mesh) {
            this.mesh.visible = active && this.visible;
        }
    }

    setVisible(visible) {
        this.visible = visible;
        if (this.mesh) {
            this.mesh.visible = visible && this.active;
        }
    }

    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
        }
    }

    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index > -1) {
            this.tags.splice(index, 1);
        }
    }

    hasTag(tag) {
        return this.tags.includes(tag);
    }

    setProperty(key, value) {
        this.properties[key] = value;
    }

    getProperty(key, defaultValue = null) {
        return this.properties.hasOwnProperty(key) ? this.properties[key] : defaultValue;
    }

    enableCollision() {
        this.collisionEnabled = true;
        this.updateBoundingVolumes();
    }

    disableCollision() {
        this.collisionEnabled = false;
        this.boundingBox = null;
        this.boundingSphere = null;
    }

    updateBoundingVolumes() {
        if (!this.collisionEnabled || !this.mesh) return;
        
        // Update bounding box
        if (this.mesh.geometry) {
            this.mesh.geometry.computeBoundingBox();
            this.boundingBox = this.mesh.geometry.boundingBox.clone();
            this.boundingBox.applyMatrix4(this.mesh.matrixWorld);
        }
        
        // Update bounding sphere
        if (this.mesh.geometry) {
            this.mesh.geometry.computeBoundingSphere();
            this.boundingSphere = this.mesh.geometry.boundingSphere.clone();
            this.boundingSphere.applyMatrix4(this.mesh.matrixWorld);
        }
    }

    checkCollision(other) {
        if (!this.collisionEnabled || !other.collisionEnabled) return false;
        
        // Simple sphere collision check
        if (this.boundingSphere && other.boundingSphere) {
            const distance = this.boundingSphere.center.distanceTo(other.boundingSphere.center);
            const combinedRadius = this.boundingSphere.radius + other.boundingSphere.radius;
            return distance < combinedRadius;
        }
        
        return false;
    }

    getDistanceTo(other) {
        return this.position.distanceTo(other.position);
    }

    getDirectionTo(other) {
        return other.position.clone().sub(this.position).normalize();
    }

    // Override these methods in subclasses
    onCollision(other) {
        // Override in subclasses
    }

    onDestroy() {
        // Override in subclasses
    }

    destroy() {
        this.onDestroy();
        this.setActive(false);
        this.setVisible(false);
        
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }
}


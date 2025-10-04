class InputHandler {
    constructor() {
        this.keys = new Map();
        this.mouseButtons = new Map();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.scrollDelta = 0;
        this.lastMousePosition = { x: 0, y: 0 };
        
        // Event callbacks
        this.keyDownCallbacks = new Map();
        this.keyUpCallbacks = new Map();
        this.mouseDownCallbacks = new Map();
        this.mouseUpCallbacks = new Map();
        
        // Pointer lock
        this.pointerLocked = false;
        this.pointerLockElement = null;
    }

    init() {
        this.setupKeyboardEvents();
        this.setupMouseEvents();
        this.setupPointerLock();
    }

    setupKeyboardEvents() {
        // Key down
        document.addEventListener('keydown', (event) => {
            this.keys.set(event.code, true);
            
            // Call key down callbacks
            if (this.keyDownCallbacks.has(event.code)) {
                this.keyDownCallbacks.get(event.code).forEach(callback => callback(event));
            }
        });

        // Key up
        document.addEventListener('keyup', (event) => {
            this.keys.set(event.code, false);
            
            // Call key up callbacks
            if (this.keyUpCallbacks.has(event.code)) {
                this.keyUpCallbacks.get(event.code).forEach(callback => callback(event));
            }
        });
    }

    setupMouseEvents() {
        // Mouse move
        document.addEventListener('mousemove', (event) => {
            this.mousePosition.x = event.clientX;
            this.mousePosition.y = event.clientY;
            
            // Calculate mouse delta
            this.mouseDelta.x = event.movementX || event.clientX - this.lastMousePosition.x;
            this.mouseDelta.y = event.movementY || event.clientY - this.lastMousePosition.y;
            
            this.lastMousePosition.x = event.clientX;
            this.lastMousePosition.y = event.clientY;
        }, { passive: false });

        // Mouse down
        document.addEventListener('mousedown', (event) => {
            this.mouseButtons.set(event.button, true);
            
            // Call mouse down callbacks
            if (this.mouseDownCallbacks.has(event.button)) {
                this.mouseDownCallbacks.get(event.button).forEach(callback => callback(event));
            }
            
            // Request pointer lock on left click
            if (event.button === 0) { // Left mouse button
                this.requestPointerLock();
            }
        }, { passive: false });

        // Mouse up
        document.addEventListener('mouseup', (event) => {
            this.mouseButtons.set(event.button, false);
            
            // Call mouse up callbacks
            if (this.mouseUpCallbacks.has(event.button)) {
                this.mouseUpCallbacks.get(event.button).forEach(callback => callback(event));
            }
        }, { passive: false });

        // Mouse wheel
        document.addEventListener('wheel', (event) => {
            this.scrollDelta = event.deltaY;
            event.preventDefault();
        }, { passive: false });

        // Context menu
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        }, { passive: false });
    }

    setupPointerLock() {
        // Pointer lock change
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement === this.pointerLockElement;
        });

        // Pointer lock error
        document.addEventListener('pointerlockerror', () => {
            console.warn('Pointer lock failed');
            this.pointerLocked = false;
        });
    }

    // Key state methods
    isKeyPressed(keyCode) {
        return this.keys.get(keyCode) || false;
    }

    isKeyDown(keyCode) {
        return this.keys.get(keyCode) || false;
    }

    isKeyUp(keyCode) {
        return !this.keys.get(keyCode);
    }

    // Mouse button state methods
    isMouseButtonPressed(button) {
        return this.mouseButtons.get(button) || false;
    }

    isMouseButtonDown(button) {
        return this.mouseButtons.get(button) || false;
    }

    isMouseButtonUp(button) {
        return !this.mouseButtons.get(button);
    }

    // Mouse position methods
    getMousePosition() {
        return { ...this.mousePosition };
    }

    getMouseDelta() {
        return { ...this.mouseDelta };
    }

    getScrollDelta() {
        return this.scrollDelta;
    }

    // Reset mouse delta (call this after processing)
    resetMouseDelta() {
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        this.scrollDelta = 0;
    }

    // Event callback methods
    onKeyDown(keyCode, callback) {
        if (!this.keyDownCallbacks.has(keyCode)) {
            this.keyDownCallbacks.set(keyCode, []);
        }
        this.keyDownCallbacks.get(keyCode).push(callback);
    }

    onKeyUp(keyCode, callback) {
        if (!this.keyUpCallbacks.has(keyCode)) {
            this.keyUpCallbacks.set(keyCode, []);
        }
        this.keyUpCallbacks.get(keyCode).push(callback);
    }

    onMouseDown(button, callback) {
        if (!this.mouseDownCallbacks.has(button)) {
            this.mouseDownCallbacks.set(button, []);
        }
        this.mouseDownCallbacks.get(button).push(callback);
    }

    onMouseUp(button, callback) {
        if (!this.mouseUpCallbacks.has(button)) {
            this.mouseUpCallbacks.set(button, []);
        }
        this.mouseUpCallbacks.get(button).push(callback);
    }

    // Pointer lock methods
    requestPointerLock(element = document.body) {
        this.pointerLockElement = element;
        element.requestPointerLock();
    }

    exitPointerLock() {
        document.exitPointerLock();
    }

    isPointerLocked() {
        return this.pointerLocked;
    }

    // Input combination methods
    isAnyKeyPressed(keys) {
        return keys.some(key => this.isKeyPressed(key));
    }

    isAllKeysPressed(keys) {
        return keys.every(key => this.isKeyPressed(key));
    }

    // Gamepad support (basic)
    getGamepadState() {
        const gamepads = navigator.getGamepads();
        return gamepads.filter(gamepad => gamepad !== null);
    }

    // Touch support (basic)
    setupTouchEvents() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchCurrentX = 0;
        let touchCurrentY = 0;

        document.addEventListener('touchstart', (event) => {
            if (event.touches.length > 0) {
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
                touchCurrentX = touchStartX;
                touchCurrentY = touchStartY;
            }
            event.preventDefault();
        });

        document.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                touchCurrentX = event.touches[0].clientX;
                touchCurrentY = event.touches[0].clientY;
                
                // Convert touch movement to mouse delta
                this.mouseDelta.x = touchCurrentX - touchStartX;
                this.mouseDelta.y = touchCurrentY - touchStartY;
                
                touchStartX = touchCurrentX;
                touchStartY = touchCurrentY;
            }
            event.preventDefault();
        });

        document.addEventListener('touchend', (event) => {
            this.mouseDelta.x = 0;
            this.mouseDelta.y = 0;
            event.preventDefault();
        });
    }

    // Cleanup
    destroy() {
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('wheel', this.handleWheel);
    }
}


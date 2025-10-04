class GameUtils {
    // Math utilities
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static randomVector3(min = -1, max = 1) {
        return new THREE.Vector3(
            this.random(min, max),
            this.random(min, max),
            this.random(min, max)
        );
    }

    static randomColor() {
        return new THREE.Color(Math.random(), Math.random(), Math.random());
    }

    // Distance and collision utilities
    static distance2D(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static distance3D(pos1, pos2) {
        return pos1.distanceTo(pos2);
    }

    static pointInCircle(px, py, cx, cy, radius) {
        const distance = this.distance2D(px, py, cx, cy);
        return distance <= radius;
    }

    static pointInRect(px, py, rx, ry, width, height) {
        return px >= rx && px <= rx + width && py >= ry && py <= ry + height;
    }

    static circlesOverlap(x1, y1, r1, x2, y2, r2) {
        const distance = this.distance2D(x1, y1, x2, y2);
        return distance <= (r1 + r2);
    }

    static rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
    }

    // Vector utilities
    static normalizeVector2(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    }

    static dotProduct2D(x1, y1, x2, y2) {
        return x1 * x2 + y1 * y2;
    }

    static crossProduct2D(x1, y1, x2, y2) {
        return x1 * y2 - y1 * x2;
    }

    static angleBetweenVectors2D(x1, y1, x2, y2) {
        const dot = this.dotProduct2D(x1, y1, x2, y2);
        const mag1 = Math.sqrt(x1 * x1 + y1 * y1);
        const mag2 = Math.sqrt(x2 * x2 + y2 * y2);
        return Math.acos(dot / (mag1 * mag2));
    }

    // Easing functions
    static easeInQuad(t) {
        return t * t;
    }

    static easeOutQuad(t) {
        return t * (2 - t);
    }

    static easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    static easeInCubic(t) {
        return t * t * t;
    }

    static easeOutCubic(t) {
        return (--t) * t * t + 1;
    }

    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    // Time utilities
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    static formatScore(score) {
        return score.toString().padStart(6, '0');
    }

    // Color utilities
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    static hslToRgb(h, s, l) {
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        
        let r, g, b;
        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    // Array utilities
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static removeFromArray(array, item) {
        const index = array.indexOf(item);
        if (index > -1) {
            array.splice(index, 1);
        }
        return array;
    }

    static uniqueArray(array) {
        return [...new Set(array)];
    }

    // Object utilities
    static deepClone(obj) {
        if (obj === null || typeof obj !== "object") return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === "object") {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    static mergeObjects(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    target[key] = target[key] || {};
                    this.mergeObjects(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    // String utilities
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static camelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    static kebabCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    // DOM utilities
    static createElement(tag, className = '', content = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    }

    static getElementById(id) {
        return document.getElementById(id);
    }

    static querySelector(selector) {
        return document.querySelector(selector);
    }

    static querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    }

    // Local storage utilities
    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    static loadFromLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }

    static removeFromLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    }

    // Performance utilities
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Debug utilities
    static logObject(obj, label = 'Object') {
        console.log(`${label}:`, JSON.stringify(obj, null, 2));
    }

    static measureTime(label, func) {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`${label} took ${(end - start).toFixed(2)} milliseconds`);
        return result;
    }

    static async measureTimeAsync(label, func) {
        const start = performance.now();
        const result = await func();
        const end = performance.now();
        console.log(`${label} took ${(end - start).toFixed(2)} milliseconds`);
        return result;
    }
}


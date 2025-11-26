/**
 * ObjectPool - Generic object pooling for performance optimization
 * Reuses objects to avoid garbage collection overhead
 */
class ObjectPool {
    /**
     * Create an object pool
     * @param {Function} createFn - Function to create new objects
     * @param {Function} resetFn - Function to reset objects for reuse
     * @param {number} initialSize - Initial pool size
     */
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
        this.totalCreated = 0;

        // Pre-populate pool
        this.expand(initialSize);
    }

    /**
     * Expand the pool by creating new objects
     * @param {number} count - Number of objects to create
     */
    expand(count) {
        for (let i = 0; i < count; i++) {
            const obj = this.createFn();
            obj.__poolId = this.totalCreated++;
            this.pool.push(obj);
        }
    }

    /**
     * Get an object from the pool
     * @returns {Object} Object from pool or newly created
     */
    get() {
        let obj;

        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            // Pool is empty, create new object
            obj = this.createFn();
            obj.__poolId = this.totalCreated++;
        }

        this.active.push(obj);
        return obj;
    }

    /**
     * Return an object to the pool
     * @param {Object} obj - Object to return
     */
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index > -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    /**
     * Release all active objects back to the pool
     */
    releaseAll() {
        while (this.active.length > 0) {
            const obj = this.active.pop();
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    /**
     * Get the number of active objects
     * @returns {number} Active count
     */
    getActiveCount() {
        return this.active.length;
    }

    /**
     * Get the number of available objects in pool
     * @returns {number} Available count
     */
    getAvailableCount() {
        return this.pool.length;
    }

    /**
     * Get total number of objects created
     * @returns {number} Total created
     */
    getTotalCreated() {
        return this.totalCreated;
    }

    /**
     * Get all active objects
     * @returns {Array} Array of active objects
     */
    getActive() {
        return [...this.active];
    }

    /**
     * Clear the pool completely
     */
    clear() {
        this.pool = [];
        this.active = [];
    }

    /**
     * Get pool statistics
     * @returns {Object} Pool stats
     */
    getStats() {
        return {
            active: this.active.length,
            available: this.pool.length,
            totalCreated: this.totalCreated
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObjectPool;
}

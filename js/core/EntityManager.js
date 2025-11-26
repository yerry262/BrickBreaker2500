/**
 * EntityManager - Manages all game entities with object pooling support
 */
class EntityManager {
    /**
     * Create an entity manager
     * @param {EventBus} eventBus - Event bus for entity events
     */
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.entities = new Map();
        this.entitiesByType = new Map();
        this.pools = new Map();
        this.nextId = 1;
    }

    /**
     * Create an object pool for a specific entity type
     * @param {string} type - Entity type name
     * @param {Function} createFn - Function to create new entities
     * @param {Function} resetFn - Function to reset entities
     * @param {number} size - Initial pool size
     */
    createPool(type, createFn, resetFn, size = 10) {
        const pool = new ObjectPool(createFn, resetFn, size);
        this.pools.set(type, pool);
    }

    /**
     * Create a new entity
     * @param {string} type - Entity type
     * @param {Object} data - Entity data to apply
     * @returns {Object} Created entity
     */
    createEntity(type, data = {}) {
        const id = this.nextId++;
        let entity;

        // Check if we have a pool for this type
        if (this.pools.has(type)) {
            entity = this.pools.get(type).get();
        } else {
            entity = { type };
        }

        // Assign id and apply data
        entity.id = id;
        entity.type = type;
        Object.assign(entity, data);

        // Store entity
        this.entities.set(id, entity);

        // Store by type for quick lookups
        if (!this.entitiesByType.has(type)) {
            this.entitiesByType.set(type, new Set());
        }
        this.entitiesByType.get(type).add(id);

        // Emit creation event
        this.eventBus.emit('entity:created', { entity, type });

        return entity;
    }

    /**
     * Destroy an entity
     * @param {number} id - Entity ID to destroy
     */
    destroyEntity(id) {
        const entity = this.entities.get(id);
        if (!entity) return;

        const type = entity.type;

        // Remove from main map
        this.entities.delete(id);

        // Remove from type map
        if (this.entitiesByType.has(type)) {
            this.entitiesByType.get(type).delete(id);
        }

        // Return to pool if available
        if (this.pools.has(type)) {
            this.pools.get(type).release(entity);
        }

        // Emit destruction event
        this.eventBus.emit('entity:destroyed', { entity, type });
    }

    /**
     * Get an entity by ID
     * @param {number} id - Entity ID
     * @returns {Object|null} Entity or null
     */
    getEntity(id) {
        return this.entities.get(id) || null;
    }

    /**
     * Get all entities of a specific type
     * @param {string} type - Entity type
     * @returns {Array} Array of entities
     */
    getEntitiesByType(type) {
        const ids = this.entitiesByType.get(type);
        if (!ids) return [];

        return Array.from(ids).map(id => this.entities.get(id)).filter(e => e);
    }

    /**
     * Get all entities
     * @returns {Array} Array of all entities
     */
    getAllEntities() {
        return Array.from(this.entities.values());
    }

    /**
     * Get entity count by type
     * @param {string} type - Entity type
     * @returns {number} Count
     */
    getCountByType(type) {
        const ids = this.entitiesByType.get(type);
        return ids ? ids.size : 0;
    }

    /**
     * Get total entity count
     * @returns {number} Total count
     */
    getTotalCount() {
        return this.entities.size;
    }

    /**
     * Find entities matching a predicate
     * @param {Function} predicate - Filter function
     * @returns {Array} Matching entities
     */
    findEntities(predicate) {
        return this.getAllEntities().filter(predicate);
    }

    /**
     * Find first entity matching a predicate
     * @param {Function} predicate - Filter function
     * @returns {Object|null} First matching entity or null
     */
    findEntity(predicate) {
        for (const entity of this.entities.values()) {
            if (predicate(entity)) {
                return entity;
            }
        }
        return null;
    }

    /**
     * Check if an entity exists
     * @param {number} id - Entity ID
     * @returns {boolean} True if exists
     */
    hasEntity(id) {
        return this.entities.has(id);
    }

    /**
     * Clear all entities
     * @param {string} type - Optional type to clear (clears all if not specified)
     */
    clear(type = null) {
        if (type) {
            // Clear specific type
            const ids = this.entitiesByType.get(type);
            if (ids) {
                for (const id of ids) {
                    this.destroyEntity(id);
                }
            }
        } else {
            // Clear all
            for (const id of this.entities.keys()) {
                this.destroyEntity(id);
            }
            this.nextId = 1;
        }
    }

    /**
     * Get pool statistics for a type
     * @param {string} type - Entity type
     * @returns {Object|null} Pool stats or null
     */
    getPoolStats(type) {
        const pool = this.pools.get(type);
        return pool ? pool.getStats() : null;
    }

    /**
     * Get all pool statistics
     * @returns {Object} All pool stats
     */
    getAllPoolStats() {
        const stats = {};
        for (const [type, pool] of this.pools) {
            stats[type] = pool.getStats();
        }
        return stats;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityManager;
}

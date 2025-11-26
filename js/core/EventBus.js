/**
 * EventBus - Central event system for inter-system communication
 * Decouples game systems and enables loose coupling architecture
 */
class EventBus {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event only once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, []);
        }
        this.onceListeners.get(event).push(callback);
    }

    /**
     * Emit an event with optional data
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data = null) {
        // Call regular listeners
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`EventBus error in "${event}":`, error);
                }
            });
        }

        // Call once listeners and remove them
        if (this.onceListeners.has(event)) {
            const onceCallbacks = this.onceListeners.get(event);
            this.onceListeners.delete(event);
            onceCallbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`EventBus once error in "${event}":`, error);
                }
            });
        }
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Remove all listeners for an event
     * @param {string} event - Event name (optional, clears all if not provided)
     */
    clear(event = null) {
        if (event) {
            this.listeners.delete(event);
            this.onceListeners.delete(event);
        } else {
            this.listeners.clear();
            this.onceListeners.clear();
        }
    }

    /**
     * Get the number of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        const regular = this.listeners.has(event) ? this.listeners.get(event).length : 0;
        const once = this.onceListeners.has(event) ? this.onceListeners.get(event).length : 0;
        return regular + once;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBus;
}

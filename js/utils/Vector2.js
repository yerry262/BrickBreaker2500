/**
 * Vector2 - 2D Vector utility class for physics calculations
 */
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Set vector components
     * @param {number} x - X component
     * @param {number} y - Y component
     * @returns {Vector2} This vector for chaining
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Add another vector to this one
     * @param {Vector2} other - Vector to add
     * @returns {Vector2} This vector for chaining
     */
    add(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    /**
     * Subtract another vector from this one
     * @param {Vector2} other - Vector to subtract
     * @returns {Vector2} This vector for chaining
     */
    subtract(other) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    /**
     * Multiply vector by a scalar
     * @param {number} scalar - Scalar value
     * @returns {Vector2} This vector for chaining
     */
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Divide vector by a scalar
     * @param {number} scalar - Scalar value
     * @returns {Vector2} This vector for chaining
     */
    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }

    /**
     * Get the magnitude (length) of the vector
     * @returns {number} Magnitude
     */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Get the squared magnitude (faster than magnitude)
     * @returns {number} Squared magnitude
     */
    magnitudeSquared() {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * Normalize the vector (make it unit length)
     * @returns {Vector2} This vector for chaining
     */
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }

    /**
     * Limit the magnitude of the vector
     * @param {number} max - Maximum magnitude
     * @returns {Vector2} This vector for chaining
     */
    limit(max) {
        const magSq = this.magnitudeSquared();
        if (magSq > max * max) {
            this.divide(Math.sqrt(magSq)).multiply(max);
        }
        return this;
    }

    /**
     * Get the dot product with another vector
     * @param {Vector2} other - Other vector
     * @returns {number} Dot product
     */
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    /**
     * Get the cross product with another vector (2D returns scalar)
     * @param {Vector2} other - Other vector
     * @returns {number} Cross product
     */
    cross(other) {
        return this.x * other.y - this.y * other.x;
    }

    /**
     * Get the angle of this vector in radians
     * @returns {number} Angle in radians
     */
    angle() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Rotate the vector by an angle
     * @param {number} angle - Angle in radians
     * @returns {Vector2} This vector for chaining
     */
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Linearly interpolate towards another vector
     * @param {Vector2} other - Target vector
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Vector2} This vector for chaining
     */
    lerp(other, t) {
        this.x += (other.x - this.x) * t;
        this.y += (other.y - this.y) * t;
        return this;
    }

    /**
     * Clone this vector
     * @returns {Vector2} New vector with same values
     */
    clone() {
        return new Vector2(this.x, this.y);
    }

    /**
     * Copy values from another vector
     * @param {Vector2} other - Vector to copy from
     * @returns {Vector2} This vector for chaining
     */
    copy(other) {
        this.x = other.x;
        this.y = other.y;
        return this;
    }

    /**
     * Check if vectors are equal
     * @param {Vector2} other - Vector to compare
     * @returns {boolean} True if equal
     */
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }

    /**
     * Convert to string representation
     * @returns {string} String representation
     */
    toString() {
        return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    /**
     * Convert to array
     * @returns {number[]} Array [x, y]
     */
    toArray() {
        return [this.x, this.y];
    }

    // Static methods

    /**
     * Calculate distance between two vectors
     * @param {Vector2} a - First vector
     * @param {Vector2} b - Second vector
     * @returns {number} Distance
     */
    static distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate squared distance between two vectors
     * @param {Vector2} a - First vector
     * @param {Vector2} b - Second vector
     * @returns {number} Squared distance
     */
    static distanceSquared(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    }

    /**
     * Create a vector from an angle
     * @param {number} angle - Angle in radians
     * @returns {Vector2} Unit vector at angle
     */
    static fromAngle(angle) {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }

    /**
     * Create a random unit vector
     * @returns {Vector2} Random unit vector
     */
    static random() {
        const angle = Math.random() * Math.PI * 2;
        return Vector2.fromAngle(angle);
    }

    /**
     * Create a zero vector
     * @returns {Vector2} Zero vector
     */
    static zero() {
        return new Vector2(0, 0);
    }

    /**
     * Create a unit vector pointing up
     * @returns {Vector2} Up vector
     */
    static up() {
        return new Vector2(0, -1);
    }

    /**
     * Create a unit vector pointing down
     * @returns {Vector2} Down vector
     */
    static down() {
        return new Vector2(0, 1);
    }

    /**
     * Create a unit vector pointing left
     * @returns {Vector2} Left vector
     */
    static left() {
        return new Vector2(-1, 0);
    }

    /**
     * Create a unit vector pointing right
     * @returns {Vector2} Right vector
     */
    static right() {
        return new Vector2(1, 0);
    }

    /**
     * Add two vectors and return new vector
     * @param {Vector2} a - First vector
     * @param {Vector2} b - Second vector
     * @returns {Vector2} Sum vector
     */
    static add(a, b) {
        return new Vector2(a.x + b.x, a.y + b.y);
    }

    /**
     * Subtract two vectors and return new vector
     * @param {Vector2} a - First vector
     * @param {Vector2} b - Second vector
     * @returns {Vector2} Difference vector
     */
    static subtract(a, b) {
        return new Vector2(a.x - b.x, a.y - b.y);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Vector2;
}

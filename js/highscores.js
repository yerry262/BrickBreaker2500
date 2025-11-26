/**
 * HighScoreManager - Handles high score tracking with Firebase + localStorage fallback
 */
class HighScoreManager {
    constructor(storageKey = 'brickbreaker_local_scores') {
        this.storageKey = storageKey;
        this.maxScores = 100;
        this.localScores = this.loadLocalScores();
        this.isLoading = false;
        this.lastFirebaseSync = 0;
        this.syncInterval = 300000; // Sync every 5 minutes (reduced from 30 seconds)
        this.cachedFirebaseScores = null;
        this.cacheDuration = 300000; // Cache for 5 minutes
        this.lastCacheTime = 0;
        
        // Migrate old scores if needed
        this.migrateOldScores();
        
        // Don't start automatic background sync - only fetch when needed
        // this.startBackgroundSync();
    }

    // ==================== LOCAL STORAGE METHODS ====================

    /**
     * Load scores from localStorage
     */
    loadLocalScores() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('Could not load local high scores:', e);
            return [];
        }
    }

    /**
     * Save scores to localStorage
     */
    saveLocalScores(scores = this.localScores) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(scores));
        } catch (e) {
            console.warn('Could not save local high scores:', e);
        }
    }

    // ==================== FIREBASE METHODS ====================

    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseService && window.firebaseService.initialized) {
                    resolve(true);
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    /**
     * Check if score qualifies for high score list
     */
    async isHighScore(score) {
        if (score <= 0) return false;

        try {
            // Try Firebase first
            if (window.firebaseService && window.firebaseService.isAvailable()) {
                return await window.firebaseService.isHighScore(score);
            }
        } catch (error) {
            console.warn('Failed to check Firebase high score, using local:', error);
        }

        // Fallback to local check
        if (this.localScores.length < this.maxScores) return true;
        return score > this.localScores[this.localScores.length - 1].score;
    }

    /**
     * Get the predicted rank for a score (before submission)
     */
    async getPredictedRank(score) {
        if (score <= 0) return -1;

        try {
            // Try Firebase first
            if (window.firebaseService && window.firebaseService.isAvailable()) {
                const scores = await this.getTopScores(100);
                let rank = 1;
                for (const entry of scores) {
                    if (score > entry.score) break;
                    rank++;
                }
                return Math.min(rank, 100);
            }
        } catch (error) {
            console.warn('Failed to get Firebase rank, using local:', error);
        }

        // Fallback to local
        let rank = 1;
        for (const entry of this.localScores) {
            if (score > entry.score) break;
            rank++;
        }
        return Math.min(rank, this.localScores.length + 1);
    }

    /**
     * Add a new high score
     */
    async addScore(name, score, level = 1) {
        if (score <= 0) return -1;

        // Validate and sanitize name (max 8 characters, alphanumeric)
        name = name.trim().substring(0, 8).toUpperCase();
        name = name.replace(/[^A-Z0-9]/g, '');
        if (!name) name = 'PLAYER';

        const scoreEntry = {
            name: name,
            score: parseInt(score),
            level: parseInt(level),
            date: new Date().toISOString()
        };

        // Always add to local storage immediately
        this.localScores.push(scoreEntry);
        this.localScores.sort((a, b) => b.score - a.score);
        this.localScores = this.localScores.slice(0, this.maxScores);
        this.saveLocalScores();

        // Try to add to Firebase
        try {
            if (window.firebaseService && window.firebaseService.isAvailable()) {
                await window.firebaseService.addScore(name, score, level);
                console.log('✅ Score saved to Firebase');
            }
        } catch (error) {
            console.warn('Failed to save to Firebase, score saved locally:', error);
        }

        // Return local rank
        return this.localScores.findIndex(s => 
            s.name === scoreEntry.name && 
            s.score === scoreEntry.score && 
            s.date === scoreEntry.date
        ) + 1;
    }

    /**
     * Get the highest score
     */
    async getHighScore() {
        try {
            // Try Firebase first for most up-to-date high score
            if (window.firebaseService && window.firebaseService.isAvailable()) {
                const firebaseHigh = await window.firebaseService.getHighestScore();
                const localHigh = this.localScores.length > 0 ? this.localScores[0].score : 0;
                return Math.max(firebaseHigh, localHigh);
            }
        } catch (error) {
            console.warn('Failed to get Firebase high score, using local:', error);
        }

        // Fallback to local
        return this.localScores.length > 0 ? this.localScores[0].score : 0;
    }

    /**
     * Get top N scores (prioritizes Firebase, falls back to local)
     * Uses caching to minimize Firebase reads
     */
    async getTopScores(limit = 100, forceRefresh = false) {
        try {
            // Check if we should use cached data
            const now = Date.now();
            if (!forceRefresh && this.cachedFirebaseScores && (now - this.lastCacheTime) < this.cacheDuration) {
                console.log('📋 Using cached Firebase scores');
                return this.cachedFirebaseScores.slice(0, limit);
            }

            // Try Firebase first
            if (window.firebaseService && window.firebaseService.isAvailable()) {
                console.log('🔄 Fetching fresh scores from Firebase...');
                const firebaseScores = await window.firebaseService.getTopScores(limit);
                
                // Cache the results
                this.cachedFirebaseScores = firebaseScores;
                this.lastCacheTime = now;
                
                // Merge with local scores (in case some local scores are higher than Firebase)
                const allScores = [...firebaseScores, ...this.localScores];
                
                // Deduplicate by score+name combination and sort
                const uniqueScores = [];
                const seen = new Set();
                
                for (const score of allScores) {
                    const key = `${score.score}_${score.name}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueScores.push(score);
                    }
                }
                
                uniqueScores.sort((a, b) => b.score - a.score);
                return uniqueScores.slice(0, limit);
            }
        } catch (error) {
            console.warn('Failed to get Firebase scores, using local:', error);
        }

        // Fallback to local scores
        return this.localScores.slice(0, limit);
    }

    /**
     * Get rank for a given score
     */
    getRank(score) {
        if (score <= 0) return -1;
        
        for (let i = 0; i < this.localScores.length; i++) {
            if (score >= this.localScores[i].score) {
                return i + 1;
            }
        }
        
        return this.localScores.length + 1;
    }

    /**
     * Display scores in a container element
     */
    async displayScores(containerId, forceRefresh = false) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Show loading indicator
        this.isLoading = true;
        container.innerHTML = '<div class="loading-scores">🔄 Loading leaderboard...</div>';

        try {
            const scores = await this.getTopScores(100, forceRefresh);
            this.isLoading = false;

            if (scores.length === 0) {
                container.innerHTML = '<p class="no-scores">No high scores yet! Be the first! 🎯</p>';
                return;
            }

            let html = '<div class="leaderboard-header">';
            
            // Show Firebase status
            if (window.firebaseService && window.firebaseService.isAvailable()) {
                const cacheStatus = this.cachedFirebaseScores ? 
                    `🔄 Global Leaderboard • ${forceRefresh ? 'Fresh data' : 'Cached data'}` : 
                    '🌐 Global Leaderboard';
                html += `<div class="sync-status online">${cacheStatus}</div>`;
            } else {
                html += '<div class="sync-status offline">📱 Local Scores</div>';
            }
            
            html += '</div>';
            html += `
                <table class="scores-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Name</th>
                            <th>Score</th>
                            <th>Level</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            scores.forEach((entry, index) => {
                const rank = index + 1;
                let medal = '';
                if (rank === 1) medal = '🥇';
                else if (rank === 2) medal = '🥈';
                else if (rank === 3) medal = '🥉';

                html += `
                    <tr class="rank-${rank}">
                        <td>${rank} ${medal}</td>
                        <td>${entry.name}</td>
                        <td>${entry.score.toLocaleString()}</td>
                        <td>${entry.level || 1}</td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            
            // Add sync info
            if (window.firebaseService && window.firebaseService.isAvailable()) {
                const lastUpdate = new Date(this.lastCacheTime).toLocaleTimeString();
                html += `<div class="sync-info">🔄 Global scores • Last updated: ${lastUpdate}</div>`;
            } else {
                html += '<div class="sync-info">📱 Local scores only • Connect to internet for global leaderboard</div>';
            }
            
            container.innerHTML = html;
        } catch (error) {
            this.isLoading = false;
            console.error('Error displaying scores:', error);
            container.innerHTML = '<p class="error-scores">❌ Error loading scores. Please try again.</p>';
        }
    }

    // ==================== CACHE MANAGEMENT ====================

    /**
     * Force refresh scores from Firebase (clears cache)
     */
    async refreshScores() {
        this.cachedFirebaseScores = null;
        this.lastCacheTime = 0;
        return await this.getTopScores(100, true);
    }

    /**
     * Clear the score cache (forces fresh fetch on next request)
     */
    clearCache() {
        this.cachedFirebaseScores = null;
        this.lastCacheTime = 0;
        console.log('📋 Score cache cleared');
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Test Firebase connection
     */
    async testConnection() {
        if (window.firebaseService) {
            return await window.firebaseService.testConnection();
        }
        return { success: false, error: 'Firebase service not available' };
    }

    /**
     * Migrate old localStorage scores to new format (if needed)
     */
    migrateOldScores() {
        const oldKeys = ['gameHighScores', 'bubbleBounceBlitzScores'];
        
        for (const oldKey of oldKeys) {
            const oldScores = localStorage.getItem(oldKey);
            
            if (oldScores && !localStorage.getItem(this.storageKey)) {
                try {
                    const scores = JSON.parse(oldScores);
                    this.localScores = scores.map(score => ({
                        ...score,
                        level: score.level || 1 // Add level if missing
                    }));
                    this.saveLocalScores();
                    localStorage.removeItem(oldKey); // Clean up old storage
                    console.log('✅ Migrated old scores to new format');
                    break;
                } catch (error) {
                    console.warn('Failed to migrate old scores:', error);
                }
            }
        }
    }

    /**
     * Clear all local scores (Firebase scores remain)
     */
    clearLocalScores() {
        this.localScores = [];
        this.saveLocalScores();
    }

    /**
     * Export local scores as JSON string
     */
    exportScores() {
        return JSON.stringify(this.localScores, null, 2);
    }

    /**
     * Import scores from JSON string
     */
    importScores(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (Array.isArray(imported)) {
                this.localScores = imported.slice(0, this.maxScores);
                this.localScores.sort((a, b) => b.score - a.score);
                this.saveLocalScores();
                return true;
            }
        } catch (e) {
            console.warn('Could not import scores:', e);
        }
        return false;
    }
}

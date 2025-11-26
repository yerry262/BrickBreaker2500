/**
 * HighScoreManager - Handles high score tracking with localStorage
 */
class HighScoreManager {
    constructor(storageKey = 'bubbleBounceBlitzScores') {
        this.storageKey = storageKey;
        this.maxScores = 100;
        this.scores = this.loadScores();
    }

    /**
     * Load scores from localStorage
     */
    loadScores() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('Could not load high scores:', e);
            return [];
        }
    }

    /**
     * Save scores to localStorage
     */
    saveScores() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
        } catch (e) {
            console.warn('Could not save high scores:', e);
        }
    }

    /**
     * Check if score qualifies for high score list
     */
    isHighScore(score) {
        if (score <= 0) return false;
        if (this.scores.length < this.maxScores) return true;
        return score > this.scores[this.scores.length - 1].score;
    }

    /**
     * Add a new high score
     */
    addScore(name, score, level = 1) {
        // Validate and sanitize name (max 8 characters, alphanumeric)
        name = name.trim().substring(0, 8).toUpperCase();
        name = name.replace(/[^A-Z0-9]/g, '');
        if (!name) name = 'PLAYER';

        const entry = {
            name: name,
            score: score,
            level: level,
            date: new Date().toISOString()
        };

        this.scores.push(entry);

        // Sort by score descending
        this.scores.sort((a, b) => b.score - a.score);

        // Keep only top 100
        this.scores = this.scores.slice(0, this.maxScores);

        this.saveScores();

        // Return rank (1-based)
        return this.scores.findIndex(s => 
            s.name === entry.name && 
            s.score === entry.score && 
            s.date === entry.date
        ) + 1;
    }

    /**
     * Get the highest score
     */
    getHighScore() {
        return this.scores.length > 0 ? this.scores[0].score : 0;
    }

    /**
     * Get top N scores
     */
    getTopScores(limit = 100) {
        return this.scores.slice(0, limit);
    }

    /**
     * Get rank for a given score
     */
    getRank(score) {
        if (score <= 0) return -1;
        
        for (let i = 0; i < this.scores.length; i++) {
            if (score >= this.scores[i].score) {
                return i + 1;
            }
        }
        
        return this.scores.length + 1;
    }

    /**
     * Display scores in a container element
     */
    displayScores(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.scores.length === 0) {
            container.innerHTML = '<p class="no-scores">No high scores yet! Be the first!</p>';
            return;
        }

        let html = `
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

        this.scores.forEach((entry, index) => {
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
                    <td>${entry.level}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    /**
     * Clear all high scores
     */
    clearScores() {
        this.scores = [];
        this.saveScores();
    }

    /**
     * Export scores as JSON string
     */
    exportScores() {
        return JSON.stringify(this.scores, null, 2);
    }

    /**
     * Import scores from JSON string
     */
    importScores(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (Array.isArray(imported)) {
                this.scores = imported.slice(0, this.maxScores);
                this.scores.sort((a, b) => b.score - a.score);
                this.saveScores();
                return true;
            }
        } catch (e) {
            console.warn('Could not import scores:', e);
        }
        return false;
    }
}

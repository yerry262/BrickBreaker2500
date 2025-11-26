class HighScoreManager {
    constructor() {
        this.storageKey = 'bubbleBounceBlitzHighScores';
        this.maxScores = 100;
        this.scores = this.loadScores();
    }

    loadScores() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    saveScores() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
    }

    isHighScore(score) {
        if (this.scores.length < this.maxScores) return true;
        return score > this.scores[this.scores.length - 1].score;
    }

    addScore(name, score) {
        // Validate name (up to 8 letters, alphanumeric)
        name = name.trim().substring(0, 8).toUpperCase();
        if (!name) name = 'PLAYER';

        this.scores.push({
            name: name,
            score: score,
            date: new Date().toISOString()
        });

        // Sort by score descending
        this.scores.sort((a, b) => b.score - a.score);

        // Keep only top 100
        this.scores = this.scores.slice(0, this.maxScores);

        this.saveScores();
    }

    getHighScore() {
        return this.scores.length > 0 ? this.scores[0].score : 0;
    }

    getTopScores(limit = 100) {
        return this.scores.slice(0, limit);
    }

    displayScores(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.scores.length === 0) {
            container.innerHTML = '<p class="no-scores">No high scores yet!</p>';
            return;
        }

        let html = '<table class="scores-table"><thead><tr><th>Rank</th><th>Name</th><th>Score</th></tr></thead><tbody>';
        
        this.scores.forEach((entry, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
            html += `<tr class="rank-${rank}">
                <td>${rank} ${medal}</td>
                <td>${entry.name}</td>
                <td>${entry.score.toLocaleString()}</td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }
}
/**
 * Firebase Service - Handles all Firebase/Firestore operations
 * Provides async high score management with cloud synchronization
 */
class FirebaseService {
    constructor() {
        this.db = null;
        this.isOnline = navigator.onLine;
        this.collectionName = 'brickbreaker_scores';
        this.initialized = false;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🟢 Firebase: Back online');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('🔴 Firebase: Gone offline');
        });
        
        this.init();
    }

    async init() {
        try {
            // Wait for Firebase to be loaded
            await this.waitForFirebase();
            this.db = window.firebaseDb;
            this.initialized = true;
            console.log('🟢 Firebase: Initialized successfully');
        } catch (error) {
            console.error('🔴 Firebase: Initialization failed', error);
            this.initialized = false;
        }
    }

    waitForFirebase() {
        return new Promise((resolve, reject) => {
            const checkFirebase = () => {
                if (window.firebaseDb) {
                    resolve();
                } else if (window.firebaseError) {
                    reject(new Error('Firebase failed to load'));
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    isAvailable() {
        return this.initialized && this.isOnline && this.db;
    }

    /**
     * Add a new high score to Firebase
     */
    async addScore(name, score, level) {
        if (!this.isAvailable()) {
            throw new Error('Firebase not available');
        }

        try {
            // Import Firestore functions dynamically
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            const scoreData = {
                name: name.trim().substring(0, 8).toUpperCase() || 'PLAYER',
                score: parseInt(score),
                level: parseInt(level),
                timestamp: serverTimestamp(),
                gameVersion: '2.0'
            };

            const docRef = await addDoc(collection(this.db, this.collectionName), scoreData);
            console.log('🟢 Firebase: Score added with ID:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('🔴 Firebase: Error adding score:', error);
            throw error;
        }
    }

    /**
     * Get top scores from Firebase (with limit)
     */
    async getTopScores(limit = 100) {
        if (!this.isAvailable()) {
            throw new Error('Firebase not available');
        }

        try {
            const { collection, query, orderBy, limit: firestoreLimit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            const scoresQuery = query(
                collection(this.db, this.collectionName),
                orderBy('score', 'desc'),
                firestoreLimit(limit)
            );

            const querySnapshot = await getDocs(scoresQuery);
            const scores = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                scores.push({
                    id: doc.id,
                    name: data.name,
                    score: data.score,
                    level: data.level,
                    date: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString()
                });
            });

            console.log('🟢 Firebase: Retrieved', scores.length, 'scores');
            return scores;
        } catch (error) {
            console.error('🔴 Firebase: Error getting scores:', error);
            throw error;
        }
    }

    /**
     * Check if a score qualifies as a high score
     */
    async isHighScore(score) {
        if (!this.isAvailable()) {
            return true; // Assume it's a high score if we can't check
        }

        try {
            const { collection, query, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            // Get the 100th highest score
            const scoresQuery = query(
                collection(this.db, this.collectionName),
                orderBy('score', 'desc'),
                limit(100)
            );

            const querySnapshot = await getDocs(scoresQuery);
            
            // If less than 100 scores, it's automatically a high score
            if (querySnapshot.size < 100) {
                return true;
            }

            // Check if the score beats the 100th highest score
            const scores = [];
            querySnapshot.forEach((doc) => {
                scores.push(doc.data().score);
            });
            
            const lowestHighScore = Math.min(...scores);
            return parseInt(score) > lowestHighScore;
        } catch (error) {
            console.error('🔴 Firebase: Error checking high score:', error);
            return true; // Assume it's a high score on error
        }
    }

    /**
     * Get the highest score from Firebase
     */
    async getHighestScore() {
        if (!this.isAvailable()) {
            return 0;
        }

        try {
            const { collection, query, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
            
            const scoresQuery = query(
                collection(this.db, this.collectionName),
                orderBy('score', 'desc'),
                limit(1)
            );

            const querySnapshot = await getDocs(scoresQuery);
            
            if (!querySnapshot.empty) {
                const highestScore = querySnapshot.docs[0].data().score;
                return highestScore;
            }
            
            return 0;
        } catch (error) {
            console.error('🔴 Firebase: Error getting highest score:', error);
            return 0;
        }
    }

    /**
     * Test Firebase connection
     */
    async testConnection() {
        if (!this.isAvailable()) {
            return { success: false, error: 'Firebase not available' };
        }

        try {
            await this.getHighestScore();
            return { success: true, message: 'Firebase connection successful' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Create global Firebase service instance
window.firebaseService = new FirebaseService();
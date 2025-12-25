/**
 * StorageManager - Handles all localStorage operations for voice recordings
 */
class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'voiceNotes';
        this.MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
    }

    /**
     * Convert Blob to Base64 string for storage
     */
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Convert Base64 string back to Blob
     */
    base64ToBlob(base64String) {
        const parts = base64String.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);

        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }

        return new Blob([uInt8Array], { type: contentType });
    }

    /**
     * Save a new recording to localStorage
     */
    async saveRecording(audioBlob, duration) {
        try {
            // Check storage size before saving
            if (!this.checkStorageSpace()) {
                throw new Error('Storage limit reached. Please delete some recordings.');
            }

            const base64Audio = await this.blobToBase64(audioBlob);
            const recordings = this.getAllRecordings();

            const newRecording = {
                id: Date.now(),
                title: `Recording ${recordings.length + 1}`,
                audioData: base64Audio,
                duration: duration,
                timestamp: new Date().toISOString(),
                starred: false,
                shared: false
            };

            recordings.unshift(newRecording); // Add to beginning
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recordings));

            return newRecording;
        } catch (error) {
            console.error('Error saving recording:', error);
            throw error;
        }
    }

    /**
     * Get all recordings from localStorage
     */
    getAllRecordings() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error retrieving recordings:', error);
            return [];
        }
    }

    /**
     * Get a single recording by ID
     */
    getRecording(id) {
        const recordings = this.getAllRecordings();
        return recordings.find(rec => rec.id === id);
    }

    /**
     * Update a recording (title, starred status, etc.)
     */
    updateRecording(id, updates) {
        try {
            const recordings = this.getAllRecordings();
            const index = recordings.findIndex(rec => rec.id === id);

            if (index !== -1) {
                recordings[index] = { ...recordings[index], ...updates };
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recordings));
                return recordings[index];
            }

            return null;
        } catch (error) {
            console.error('Error updating recording:', error);
            throw error;
        }
    }

    /**
     * Delete a recording by ID
     */
    deleteRecording(id) {
        try {
            const recordings = this.getAllRecordings();
            const filtered = recordings.filter(rec => rec.id !== id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error deleting recording:', error);
            return false;
        }
    }

    /**
     * Get filtered recordings (starred, shared, etc.)
     */
    getFilteredRecordings(filter) {
        const recordings = this.getAllRecordings();

        switch (filter) {
            case 'starred':
                return recordings.filter(rec => rec.starred);
            case 'shared':
                return recordings.filter(rec => rec.shared);
            case 'all':
            default:
                return recordings;
        }
    }

    /**
     * Search recordings by title
     */
    searchRecordings(query) {
        const recordings = this.getAllRecordings();
        const lowerQuery = query.toLowerCase();

        return recordings.filter(rec =>
            rec.title.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Check if there's enough storage space
     */
    checkStorageSpace() {
        try {
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }

            return totalSize < this.MAX_STORAGE_SIZE;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get storage usage statistics
     */
    getStorageStats() {
        try {
            const recordings = this.getAllRecordings();
            let totalSize = 0;

            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }

            return {
                recordingCount: recordings.length,
                usedSpace: (totalSize / 1024 / 1024).toFixed(2), // MB
                maxSpace: (this.MAX_STORAGE_SIZE / 1024 / 1024).toFixed(2), // MB
                percentUsed: ((totalSize / this.MAX_STORAGE_SIZE) * 100).toFixed(1)
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Clear all recordings (with confirmation)
     */
    clearAllRecordings() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing recordings:', error);
            return false;
        }
    }

    /**
     * Export recording as downloadable file
     */
    exportRecording(id) {
        const recording = this.getRecording(id);
        if (!recording) return null;

        const blob = this.base64ToBlob(recording.audioData);
        return {
            blob,
            filename: `${recording.title.replace(/\s+/g, '_')}_${new Date(recording.timestamp).getTime()}.webm`
        };
    }
}
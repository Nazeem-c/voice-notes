/**
 * AudioRecorder - Handles microphone recording using MediaRecorder API
 */
class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.recordingStartTime = null;
        this.isRecording = false;
        this.isPaused = false;
    }

    /**
     * Request microphone permission and initialize stream
     */
    async requestPermission() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            return { success: true, stream: this.stream };
        } catch (error) {
            console.error('Microphone permission denied:', error);
            return {
                success: false,
                error: error.name === 'NotAllowedError'
                    ? 'Microphone access denied. Please allow microphone access in your browser settings.'
                    : 'Unable to access microphone. Please check your device settings.'
            };
        }
    }

    /**
     * Check if MediaRecorder is supported
     */
    static isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    }

    /**
     * Get supported MIME types
     */
    static getSupportedMimeType() {
        const types = [
            'audio/webm',
            'audio/webm;codecs=opus',
            'audio/ogg;codecs=opus',
            'audio/mp4'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return 'audio/webm'; // Fallback
    }

    /**
     * Start recording
     */
    async startRecording() {
        if (this.isRecording) return { success: false, error: 'Already recording' };

        try {
            // Request permission if not already granted
            if (!this.stream) {
                const permissionResult = await this.requestPermission();
                if (!permissionResult.success) {
                    return permissionResult;
                }
            }

            // Reset chunks
            this.audioChunks = [];

            // Create MediaRecorder
            const mimeType = AudioRecorder.getSupportedMimeType();
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: mimeType,
                audioBitsPerSecond: 128000
            });

            // Handle data available
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            // Handle recording stop
            this.mediaRecorder.onstop = () => {
                // Will be handled by stopRecording method
            };

            // Handle errors
            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
            };

            // Start recording
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.recordingStartTime = Date.now();
            this.isRecording = true;
            this.isPaused = false;

            return { success: true };
        } catch (error) {
            console.error('Error starting recording:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Pause recording
     */
    pauseRecording() {
        console.log('pauseRecording called. isRecording:', this.isRecording, 'isPaused:', this.isPaused);
        if (!this.isRecording || this.isPaused) {
            console.warn('Cannot pause: isRecording=' + this.isRecording + ', isPaused=' + this.isPaused);
            return false;
        }

        try {
            console.log('Calling mediaRecorder.pause()');
            this.mediaRecorder.pause();
            this.isPaused = true;
            console.log('Recording paused successfully');
            return true;
        } catch (error) {
            console.error('Error pausing recording:', error);
            return false;
        }
    }

    /**
     * Resume recording
     */
    resumeRecording() {
        console.log('resumeRecording called. isRecording:', this.isRecording, 'isPaused:', this.isPaused);
        if (!this.isRecording || !this.isPaused) {
            console.warn('Cannot resume: isRecording=' + this.isRecording + ', isPaused=' + this.isPaused);
            return false;
        }

        try {
            console.log('Calling mediaRecorder.resume()');
            this.mediaRecorder.resume();
            this.isPaused = false;
            console.log('Recording resumed successfully');
            return true;
        } catch (error) {
            console.error('Error resuming recording:', error);
            return false;
        }
    }

    /**
     * Stop recording and return audio blob
     */
    async stopRecording() {
        if (!this.isRecording) {
            return { success: false, error: 'Not recording' };
        }

        return new Promise((resolve) => {
            this.mediaRecorder.onstop = () => {
                const mimeType = AudioRecorder.getSupportedMimeType();
                const audioBlob = new Blob(this.audioChunks, { type: mimeType });
                const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);

                this.isRecording = false;
                this.isPaused = false;

                resolve({
                    success: true,
                    audioBlob: audioBlob,
                    duration: duration,
                    mimeType: mimeType
                });
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Get current recording duration in seconds
     */
    getCurrentDuration() {
        if (!this.isRecording) return 0;
        return Math.floor((Date.now() - this.recordingStartTime) / 1000);
    }

    /**
     * Get current recording state
     */
    getState() {
        return {
            isRecording: this.isRecording,
            isPaused: this.isPaused,
            duration: this.getCurrentDuration()
        };
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        this.audioChunks = [];
        this.isRecording = false;
        this.isPaused = false;
    }

    /**
     * Check if microphone is available
     */
    static async checkMicrophoneAvailability() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            return audioInputs.length > 0;
        } catch (error) {
            console.error('Error checking microphone:', error);
            return false;
        }
    }
}
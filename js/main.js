/**
 * Main Application - Orchestrates all components
 */
class VoiceNotesApp {
    constructor() {
        this.recorder = new AudioRecorder();
        this.visualizer = new WaveformVisualizer('waveformCanvas');
        this.storage = new StorageManager();
        this.ui = new UIController();

        this.isRecording = false;
        this.isPaused = false;
        this.timerInterval = null;
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.searchDebounceTimer = null;
        this.searchDebounceDelay = 300;

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        // Check browser support
        if (!AudioRecorder.isSupported()) {
            this.ui.showError('Your browser does not support audio recording');
            return;
        }

        // Setup event listeners
        this.setupEventListeners();

        // Load and display recordings
        this.loadRecordings();

        // Initialize persistent recording UI
        this.openRecordingModal();

        // Handle window resize
        window.addEventListener('resize', () => {
            this.visualizer.handleResize();
        });

        console.log('Voice Notes App initialized');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Initial Start Recording Button
        document.getElementById('startRecordingBtn').addEventListener('click', () => {
            this.switchToRecordingInterface();
        });

        // Expand modal button
        const expandBtn = document.getElementById('expandModalBtn');
        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                this.ui.toggleModalExpansion();
            });
        }

        // Cancel recording button
        const cancelBtn = document.getElementById('cancelRecordingBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelRecording();
            });
        }

        // Pause button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', (e) => {
                console.log('Pause button clicked!');
                this.togglePause();
            });
        } else {
            console.warn('Pause button not found in DOM');
        }

        // Record button (hidden but functional)
        document.getElementById('recordBtn').addEventListener('click', () => {
            this.toggleRecording();
        });

        // Done button
        document.getElementById('doneBtn').addEventListener('click', () => {
            this.stopAndSaveRecording();
        });

        // Search input with debouncing
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;

            // Clear previous debounce timer
            if (this.searchDebounceTimer) {
                clearTimeout(this.searchDebounceTimer);
            }

            // Set new debounce timer
            this.searchDebounceTimer = setTimeout(() => {
                this.loadRecordings();
                this.searchDebounceTimer = null;
            }, this.searchDebounceDelay);
        });

        // Filter tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Delegate event listeners for dynamic content
        document.getElementById('notesList').addEventListener('click', (e) => {
            this.handleNoteAction(e);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isRecording) {
                this.closeRecordingModal();
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.note-actions')) {
                document.querySelectorAll('.note-dropdown.active').forEach(d => d.classList.remove('active'));
            }
        });
    }

    /**
     * Toggle pause/resume recording
     */
    togglePause() {
        if (!this.isRecording) {
            console.warn('Not recording, cannot pause');
            return;
        }

        const pauseBtn = document.getElementById('pauseBtn');
        if (!pauseBtn) {
            console.error('Pause button not found');
            return;
        }

        const isPaused = pauseBtn.classList.contains('paused');
        console.log('Toggling pause. Current state paused:', isPaused);

        if (isPaused) {
            console.log('Resuming recording...');
            this.ui.stopAllPlayback(); // Ensure no audio plays when resuming recording
            const resumed = this.recorder.resumeRecording();
            console.log('Resume result:', resumed);
            if (resumed) {
                this.visualizer.start();
                this.resumeTimer();
                pauseBtn.classList.remove('paused');
                pauseBtn.setAttribute('aria-label', 'Pause recording');
                this.isPaused = false;
                console.log('Recording resumed successfully');
            } else {
                console.error('Failed to resume recording');
            }
        } else {
            console.log('Pausing recording...');
            const paused = this.recorder.pauseRecording();
            console.log('Pause result:', paused);
            if (paused) {
                this.visualizer.stop();
                this.pauseTimer();
                pauseBtn.classList.add('paused');
                pauseBtn.setAttribute('aria-label', 'Resume recording');
                this.isPaused = true;
                console.log('Recording paused successfully');
            } else {
                console.error('Failed to pause recording');
            }
        }
    }

    /**
     * Pause timer
     */
    pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Resume timer
     */
    resumeTimer() {
        if (!this.timerInterval) {
            const currentSeconds = parseInt(document.getElementById('timerDisplay').textContent.split(':')[0]) * 60 +
                parseInt(document.getElementById('timerDisplay').textContent.split(':')[1]);
            let seconds = currentSeconds;

            this.timerInterval = setInterval(() => {
                seconds++;
                this.ui.updateTimer(seconds);
            }, 1000);
        }
    }

    /**
     * Switch to full recording interface and start recording
     */
    async switchToRecordingInterface() {
        console.log('Switching to recording interface...');

        // Stop any current playback before starting recording
        this.ui.stopAllPlayback();

        const startBtn = document.getElementById('startRecordingBtn');
        const interfaceDiv = document.getElementById('recordingInterface');
        const modalContainer = document.querySelector('.modal-container');

        startBtn.style.display = 'none';
        interfaceDiv.style.display = 'flex';

        // Expand modal styling
        modalContainer.classList.remove('initial-state');
        modalContainer.style.width = '22.5rem';
        modalContainer.style.padding = '1.5rem';

        // Resize visualizer to match new container size
        this.visualizer.handleResize();

        // Start recording logic
        this.ui.updateTimer(0);

        try {
            console.log('Requesting permission...');
            const permissionResult = await this.recorder.requestPermission();
            if (permissionResult.success) {
                console.log('Permission granted, initializing visualizer...');
                await this.visualizer.initialize(permissionResult.stream);
                this.visualizer.drawIdle();
                console.log('Starting recording...');
                await this.startRecording();
            } else {
                console.error('Permission denied:', permissionResult.error);
                this.ui.showError(permissionResult.error);
                this.closeRecordingModal();
            }
        } catch (error) {
            console.error('Error in switchToRecordingInterface:', error);
            this.ui.showError('Failed to start recording');
            this.closeRecordingModal();
        }
    }

    /**
     * Open recording modal (Initialize persistent state)
     */
    async openRecordingModal() {
        this.ui.showRecordingModal();
        // Reset to initial state
        const startBtn = document.getElementById('startRecordingBtn');
        const interfaceDiv = document.getElementById('recordingInterface');
        const modalContainer = document.querySelector('.modal-container');

        startBtn.style.display = 'flex';
        interfaceDiv.style.display = 'none';
        modalContainer.style.width = 'auto';
        modalContainer.style.height = 'auto'; // Reset height
        modalContainer.style.padding = '0'; // Reset padding for transparent container
        modalContainer.classList.add('initial-state');
        modalContainer.classList.remove('expanded'); // Ensure not expanded on open
    }

    /**
     * Close recording modal
     */
    async closeRecordingModal() {
        if (this.isRecording) {
            await this.recorder.stopRecording();
            this.isRecording = false;
            this.isPaused = false;
            this.ui.setRecordingState(false);
            this.clearTimer();
            this.visualizer.stop();
            this.recorder.cleanup();
        }

        // Reset UI to initial state instead of hiding completely
        this.openRecordingModal();
    }

    /**
     * Toggle recording on/off
     */
    async toggleRecording() {
        if (this.isRecording) {
            await this.stopAndSaveRecording();
        } else {
            await this.startRecording();
        }
    }

    /**
     * Start recording
     */
    async startRecording() {
        // Stop any audio playback before starting recording
        this.ui.stopAllPlayback();

        const result = await this.recorder.startRecording();

        if (result.success) {
            this.isRecording = true;
            this.isPaused = false;
            this.ui.setRecordingState(true);
            this.visualizer.start();
            this.startTimer();
        } else {
            this.ui.showError(result.error);
        }
    }

    /**
     * Cancel recording (stop without saving)
     */
    async cancelRecording() {
        if (!this.isRecording) return;

        console.log('Cancelling recording...');

        // Stop the recorder
        await this.recorder.stopRecording();

        // Update UI state
        this.isRecording = false;
        this.isPaused = false;
        this.ui.setRecordingState(false);
        this.clearTimer();
        this.visualizer.stop();

        // Cleanup resources
        this.recorder.cleanup();

        // Reset UI to initial state
        this.openRecordingModal();

        this.ui.showSuccess('Recording cancelled');
    }

    /**
     * Stop recording and save
     */
    async stopAndSaveRecording() {
        if (!this.isRecording) return;

        console.log('Stopping recording...');
        const result = await this.recorder.stopRecording();

        if (result.success) {
            try {
                // Save to storage
                const savedRecording = await this.storage.saveRecording(
                    result.audioBlob,
                    result.duration
                );

                // Stop visualizer
                this.visualizer.stop();

                // Update UI
                this.isRecording = false;
                this.isPaused = false;
                this.ui.setRecordingState(false);
                this.clearTimer();

                // Reset UI to initial state
                this.openRecordingModal();

                // Reload recordings list and highlight new note
                this.loadRecordings(savedRecording.id);
            } catch (error) {
                console.error('Save error:', error);
                this.ui.showError(error.message);
            }
        } else {
            this.ui.showError('Failed to stop recording');
        }

        // Cleanup
        this.recorder.cleanup();
    }

    /**
     * Start timer
     */
    startTimer() {
        let seconds = 0;
        this.ui.updateTimer(seconds);

        this.timerInterval = setInterval(() => {
            seconds++;
            this.ui.updateTimer(seconds);
        }, 1000);
    }

    /**
     * Clear timer
     */
    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Load and display recordings
     */
    loadRecordings(highlightId = null) {
        let recordings;

        if (this.searchQuery) {
            recordings = this.storage.searchRecordings(this.searchQuery);
        } else {
            recordings = this.storage.getFilteredRecordings(this.currentFilter);
        }

        this.ui.renderNotes(recordings, highlightId);
    }

    /**
     * Set filter
     */
    setFilter(filter) {
        this.currentFilter = filter;

        // Clear pending search debounce when filter changes
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
            this.searchDebounceTimer = null;
        }

        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.loadRecordings();
    }

    /**
     * Handle note actions (play, delete, star, download)
     */
    handleNoteAction(e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);

        if (!action && btn.classList.contains('play-btn')) {
            this.playRecording(id);
            return;
        }

        switch (action) {
            case 'more':
                this.ui.toggleDropdown(id);
                break;
            case 'star':
                this.toggleStar(id);
                break;
            case 'download':
                this.downloadRecording(id);
                break;
            case 'delete':
                this.deleteRecording(id);
                break;
        }
    }

    /**
     * Play recording
     */
    playRecording(id) {
        if (this.isRecording && !this.isPaused) {
            console.warn('Cannot play audio while recording is active and not paused');
            return;
        }

        const recording = this.storage.getRecording(id);
        if (!recording) return;

        const blob = this.storage.base64ToBlob(recording.audioData);
        // Pass the known duration from storage to the UI controller
        this.ui.playRecording(id, blob, recording.duration);
    }

    /**
     * Toggle star status
     */
    toggleStar(id) {
        const recording = this.storage.getRecording(id);
        if (!recording) return;

        this.storage.updateRecording(id, { starred: !recording.starred });
        this.loadRecordings();
    }

    /**
     * Download recording
     */
    downloadRecording(id) {
        const exportData = this.storage.exportRecording(id);
        if (!exportData) return;

        const url = URL.createObjectURL(exportData.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportData.filename;
        a.click();
        URL.revokeObjectURL(url);

        this.ui.showSuccess('Recording downloaded!');
    }

    /**
     * Delete recording
     */
    deleteRecording(id) {
        if (!confirm('Are you sure you want to delete this recording?')) {
            return;
        }

        const success = this.storage.deleteRecording(id);

        if (success) {
            this.loadRecordings();
            this.ui.showSuccess('Recording deleted');
        } else {
            this.ui.showError('Failed to delete recording');
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new VoiceNotesApp();
    });
} else {
    window.app = new VoiceNotesApp();
}
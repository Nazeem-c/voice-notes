/**
 * UIController - Manages all UI interactions and DOM updates
 */
class UIController {
    constructor() {
        this.currentFilter = 'all';
        this.currentPlayingId = null;
        this.currentDuration = 0;
        this.audioPlayer = document.getElementById('audioPlayer');
        this.inlineMobilePlayer = document.getElementById('inlineMobilePlayer');
        this.inlineMobilePlayerPlayPause = document.getElementById('inlineMobilePlayerPlayPause');
        this.inlineMobilePlayerClose = document.getElementById('inlineMobilePlayerClose');
        this.isMobile = window.innerWidth < 768;
        this.setupAudioPlayerListeners();
        this.setupMobilePlayerListeners();
    }

    /**
     * Show recording modal
     */
    showRecordingModal() {
        const modal = document.getElementById('recordingModal');
        modal.classList.add('active');
        // Don't prevent body scrolling - modal is fixed overlay
    }

    /**
     * Hide recording modal
     */
    hideRecordingModal() {
        const modal = document.getElementById('recordingModal');
        modal.classList.remove('active');
        const container = modal.querySelector('.modal-container');
        if (container) container.classList.remove('expanded');
        // No need to reset overflow since we don't set it
    }

    /**
     * Toggle modal expansion
     */
    toggleModalExpansion() {
        const container = document.querySelector('.modal-container');
        if (container) {
            container.classList.toggle('expanded');
            const btn = document.getElementById('expandModalBtn');
            if (btn) {
                const isExpanded = container.classList.contains('expanded');
                btn.setAttribute('aria-label', isExpanded ? 'Collapse' : 'Expand');
            }
        }
    }

    /**
     * Update timer display
     */
    /**
     * Update timer display
     */
    updateTimer(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const formatted = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = formatted;
    }

    /**
     * Toggle recording indicator
     */
    /**
     * Toggle recording indicator
     */
    setRecordingState(isRecording) {
        const indicator = document.querySelector('.recording-indicator');
        const recordBtn = document.getElementById('recordBtn');
        const doneBtn = document.getElementById('doneBtn');

        if (isRecording) {
            if (indicator) indicator.classList.add('active');
            if (recordBtn) recordBtn.style.display = 'none'; // Hide record button
            if (doneBtn) doneBtn.style.display = 'flex';   // Show done button
        } else {
            if (indicator) indicator.classList.remove('active');
            if (recordBtn) recordBtn.style.display = 'flex'; // Show record button
            if (doneBtn) doneBtn.style.display = 'none';   // Hide done button
        }
    }

    /**
     * Render all notes/recordings
     */
    /**
     * Render all notes/recordings
     */
    renderNotes(recordings, highlightId = null) {
        const container = document.getElementById('notesList');
        const emptyState = document.getElementById('emptyState');

        if (recordings.length === 0) {
            emptyState.style.display = 'block';
            container.querySelectorAll('.note-card').forEach(card => card.remove());
            return;
        }

        emptyState.style.display = 'none';

        const existingIds = new Set(Array.from(container.querySelectorAll('.note-card')).map(card => parseInt(card.dataset.id)));
        const newIds = new Set(recordings.map(r => r.id));

        // Remove notes that are no longer in the recordings
        existingIds.forEach(id => {
            if (!newIds.has(id)) {
                const card = container.querySelector(`[data-id="${id}"]`);
                if (card) {
                    card.classList.add('note-delete-animation');
                    setTimeout(() => card.remove(), 300);
                }
            }
        });

        // Render each recording
        recordings.forEach((recording, index) => {
            let noteCard = container.querySelector(`[data-id="${recording.id}"]`);
            
            if (!noteCard) {
                // New note - create and animate
                noteCard = this.createNoteCard(recording);
                noteCard.classList.add('note-add-animation');
                if (highlightId && recording.id === highlightId) {
                    noteCard.classList.add('new-note-highlight');
                }
                container.insertBefore(noteCard, container.children[index] || null);
            } else {
                // Existing note - reorder if necessary
                if (noteCard !== container.children[index]) {
                    container.insertBefore(noteCard, container.children[index] || null);
                }
            }
        });
    }

    /**
     * Create a note card element
     */
    createNoteCard(recording) {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.dataset.id = recording.id;

        const date = new Date(recording.timestamp);
        const formattedDate = this.formatDate(date);
        const duration = this.formatDuration(recording.duration);

        card.innerHTML = `
            <div class="note-header">
                <div class="note-meta">
                    <div class="note-date">${formattedDate}</div>
                    <h3 class="note-title">${recording.title}</h3>
                </div>
            </div>
            
            <div class="note-body">
                <div class="audio-player">
                    <button class="play-btn" data-id="${recording.id}" aria-label="Play recording" title="Play recording">
                        <img src="assets/icons/play.svg" alt="Play" width="14" height="14">
                    </button>
                    
                    <div class="progress-container">
                        <div class="progress-bar" data-id="${recording.id}">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                    </div>

                    <div class="duration-text" data-id="${recording.id}">
                        <span class="current-time">00:00</span><span class="separator"> / </span>${duration}
                    </div>
                </div>

                <div class="note-actions">
                    <button class="action-btn" data-action="transcript" data-id="${recording.id}" aria-label="Transcript" title="Transcript">
                        <img src="assets/icons/transcript.svg" alt="Transcript" width="18" height="18">
                    </button>
                    <button class="action-btn" data-action="summary" data-id="${recording.id}" aria-label="Summary" title="Summary">
                        <img src="assets/icons/edit.svg" alt="Summary" width="18" height="18">
                    </button>
                    <button class="action-btn" data-action="share" data-id="${recording.id}" aria-label="Share" title="Share">
                        <img src="assets/icons/share.svg" alt="Share" width="18" height="18">
                    </button>
                    <button class="action-btn" data-action="download" data-id="${recording.id}" aria-label="Download" title="Download">
                        <img src="assets/icons/download.svg" alt="Download" width="18" height="18">
                    </button>
                    <button class="action-btn" data-action="more" data-id="${recording.id}" aria-label="More" title="More">
                        <img src="assets/icons/more.svg" alt="More" width="18" height="18">
                    </button>
                    
                    <div class="note-dropdown" id="dropdown-${recording.id}">
                        <button class="dropdown-item delete" data-action="delete" data-id="${recording.id}">
                            <img src="assets/icons/trash.svg" alt="Delete" width="16" height="16">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Toggle dropdown menu
     */
    toggleDropdown(id) {
        // Close all other dropdowns
        document.querySelectorAll('.note-dropdown.active').forEach(d => {
            if (d.id !== `dropdown-${id}`) d.classList.remove('active');
        });

        const dropdown = document.getElementById(`dropdown-${id}`);
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    /**
     * Format date for header (e.g. Today, Yesterday, Sep 13)
     */
    formatDateHeader(date) {
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    /**
     * Format date for display (Legacy/Full)
     */
    formatDate(date) {
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return `Today · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        } else if (diffDays === 2) {
            return `Yesterday · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
                ' · ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
    }

    /**
     * Format duration in MM:SS
     */
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    /**
     * Setup audio player event listeners
     */
    setupAudioPlayerListeners() {
        // Use requestAnimationFrame for smoother progress updates
        const updateProgressLoop = () => {
            if (this.currentPlayingId && !this.audioPlayer.paused) {
                this.updatePlaybackProgress(this.currentPlayingId);
                requestAnimationFrame(updateProgressLoop);
            }
        };

        this.audioPlayer.addEventListener('play', () => {
            requestAnimationFrame(updateProgressLoop);
        });

        this.audioPlayer.addEventListener('timeupdate', () => {
            // Keep this as a fallback and for when paused/seeking
            if (this.currentPlayingId) {
                this.updatePlaybackProgress(this.currentPlayingId);
            }
        });

        this.audioPlayer.addEventListener('ended', () => {
            if (this.currentPlayingId) {
                this.resetPlayButton(this.currentPlayingId);
                this.currentPlayingId = null;
            }
        });

        // Add seeking functionality to progress bars
        document.addEventListener('click', (e) => {
            const progressBar = e.target.closest('.progress-bar');
            if (progressBar && this.currentPlayingId) {
                this.seekToPosition(progressBar, e);
            }
        });

        // Add drag functionality
        let isDragging = false;
        let currentProgressBar = null;

        document.addEventListener('mousedown', (e) => {
            const progressBar = e.target.closest('.progress-bar');
            if (progressBar && this.currentPlayingId) {
                isDragging = true;
                currentProgressBar = progressBar;
                this.seekToPosition(progressBar, e);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging && currentProgressBar) {
                this.seekToPosition(currentProgressBar, e);
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            currentProgressBar = null;
        });
    }

    /**
     * Setup mobile player listeners
     */
    setupMobilePlayerListeners() {
        if (this.inlineMobilePlayerClose) {
            this.inlineMobilePlayerClose.addEventListener('click', () => {
                this.closeMobilePlayer();
            });
        }

        if (this.inlineMobilePlayerPlayPause) {
            this.inlineMobilePlayerPlayPause.addEventListener('click', () => {
                if (this.audioPlayer.paused) {
                    this.audioPlayer.play();
                    this.inlineMobilePlayerPlayPause.textContent = '⏸';
                } else {
                    this.audioPlayer.pause();
                    this.inlineMobilePlayerPlayPause.textContent = '▶';
                }
            });
        }

        this.audioPlayer.addEventListener('play', () => {
            if (this.inlineMobilePlayerPlayPause) {
                this.inlineMobilePlayerPlayPause.textContent = '⏸';
            }
        });

        this.audioPlayer.addEventListener('pause', () => {
            if (this.inlineMobilePlayerPlayPause) {
                this.inlineMobilePlayerPlayPause.textContent = '▶';
            }
        });

        this.audioPlayer.addEventListener('timeupdate', () => {
            this.updateMobilePlayerProgress();
        });

        this.audioPlayer.addEventListener('ended', () => {
            this.closeMobilePlayer();
        });

        // Mobile player seeking logic
        const mobileProgressContainer = document.getElementById('inlineMobilePlayerProgressContainer');
        if (mobileProgressContainer) {
            let isDraggingMobile = false;

            const handleSeek = (e) => {
                const rect = mobileProgressContainer.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const offsetX = clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, offsetX / rect.width));
                const duration = this.currentDuration || this.audioPlayer.duration;
                if (duration && isFinite(duration)) {
                    this.audioPlayer.currentTime = percentage * duration;
                }
            };

            mobileProgressContainer.addEventListener('mousedown', (e) => {
                isDraggingMobile = true;
                handleSeek(e);
            });

            mobileProgressContainer.addEventListener('touchstart', (e) => {
                isDraggingMobile = true;
                handleSeek(e);
            }, { passive: false });

            document.addEventListener('mousemove', (e) => {
                if (isDraggingMobile) handleSeek(e);
            });

            document.addEventListener('touchmove', (e) => {
                if (isDraggingMobile) {
                    // Prevent scrolling while seeking
                    if (e.cancelable) e.preventDefault();
                    handleSeek(e);
                }
            }, { passive: false });

            document.addEventListener('mouseup', () => {
                isDraggingMobile = false;
            });

            document.addEventListener('touchend', () => {
                isDraggingMobile = false;
            });
        }

        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth < 768;
        });
    }

    /**
     * Show inline mobile player
     */
    showMobilePlayer(recordingTitle) {
        if (this.inlineMobilePlayer) {
            this.inlineMobilePlayer.classList.add('active');
            document.body.classList.add('player-active');
        }
    }

    /**
     * Close inline mobile player
     */
    closeMobilePlayer() {
        if (this.inlineMobilePlayer) {
            this.inlineMobilePlayer.classList.remove('active');
            document.body.classList.remove('player-active');
            this.audioPlayer.pause();
            if (this.currentPlayingId) {
                this.updatePlayButton(this.currentPlayingId, false);
            }
        }
    }

    /**
     * Update inline mobile player progress
     */
    updateMobilePlayerProgress() {
        if (!this.inlineMobilePlayer || !this.inlineMobilePlayer.classList.contains('active')) {
            return;
        }

        const duration = this.currentDuration || this.audioPlayer.duration || 0;
        const currentTime = this.audioPlayer.currentTime || 0;

        if (duration > 0) {
            const progress = (currentTime / duration) * 100;
            const progressFill = document.getElementById('inlineMobilePlayerProgressFill');
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
        }

        const timeDisplay = document.getElementById('inlineMobilePlayerTime');
        if (timeDisplay) {
            timeDisplay.textContent = this.formatDuration(Math.floor(currentTime));
        }

        const durationDisplay = document.getElementById('inlineMobilePlayerDuration');
        if (durationDisplay) {
            durationDisplay.textContent = this.formatDuration(Math.floor(duration));
        }
    }

    /**
     * Seek to position in audio based on click/drag
     */
    seekToPosition(progressBar, event) {
        const rect = progressBar.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, offsetX / rect.width));

        // Use stored duration if available and valid
        const duration = (this.currentDuration && this.currentDuration > 0) ? this.currentDuration : this.audioPlayer.duration;

        if (duration && isFinite(duration)) {
            this.audioPlayer.currentTime = percentage * duration;
        }
    }

    /**
     * Play audio recording
     */
    async playRecording(id, audioBlob, duration) {
        // Stop current playback if any
        if (this.currentPlayingId && this.currentPlayingId !== id) {
            this.audioPlayer.pause();
            this.resetPlayButton(this.currentPlayingId);
            if (this.isMobile) {
                this.closeMobilePlayer();
            }
        }

        // Toggle play/pause for same recording
        if (this.currentPlayingId === id) {
            if (this.audioPlayer.paused) {
                this.audioPlayer.play();
                this.updatePlayButton(id, true);
                if (this.isMobile) {
                    const recording = document.querySelector(`[data-id="${id}"]`);
                    const recordingTitle = recording?.querySelector('.note-title')?.textContent || 'Recording';
                    this.showMobilePlayer(recordingTitle);
                }
            } else {
                this.audioPlayer.pause();
                this.updatePlayButton(id, false);
                if (this.isMobile) {
                    this.closeMobilePlayer();
                }
            }
            return;
        }

        // Play new recording
        this.currentPlayingId = id;
        this.currentDuration = duration || 0; // Store duration
        this.audioPlayer.src = URL.createObjectURL(audioBlob);

        // Ensure progress updates immediately when metadata is loaded
        this.audioPlayer.addEventListener('loadedmetadata', () => {
            // Update duration if not provided or if player has a better one (unlikely for blobs)
            if (!this.currentDuration && isFinite(this.audioPlayer.duration)) {
                this.currentDuration = this.audioPlayer.duration;
            }
            this.updatePlaybackProgress(id);
        }, { once: true });

        await this.audioPlayer.play();
        this.updatePlayButton(id, true);

        // Force an immediate progress update
        this.updatePlaybackProgress(id);

        // Show mobile player overlay if on mobile
        if (this.isMobile) {
            const recording = document.querySelector(`[data-id="${id}"]`);
            const recordingTitle = recording?.querySelector('.note-title')?.textContent || 'Recording';
            this.showMobilePlayer(recordingTitle);
        }
    }

    /**
     * Update play button icon
     */
    updatePlayButton(id, isPlaying) {
        const btn = document.querySelector(`.play-btn[data-id="${id}"]`);
        if (!btn) return;

        btn.innerHTML = isPlaying
            ? `<img src="assets/icons/pause.svg" alt="Pause" width="14" height="14">`
            : `<img src="assets/icons/play.svg" alt="Play" width="14" height="14">`;
    }

    /**
     * Reset play button to default state
     */
    resetPlayButton(id) {
        this.updatePlayButton(id, false);
        const progressFill = document.querySelector(`.progress-bar[data-id="${id}"] .progress-fill`);
        if (progressFill) {
            progressFill.style.width = '0%';
        }
        const currentTime = document.querySelector(`.note-card[data-id="${id}"] .current-time`);
        if (currentTime) {
            currentTime.textContent = '00:00';
        }
    }

    /**
     * Update playback progress bar
     */
    updatePlaybackProgress(id) {
        // Use stored duration as primary source, fallback to player duration
        let duration = this.currentDuration;
        if ((!duration || duration === 0) && isFinite(this.audioPlayer.duration)) {
            duration = this.audioPlayer.duration;
        }

        // Avoid division by zero
        if (!duration || duration === 0) duration = 1;

        const progress = (this.audioPlayer.currentTime / duration) * 100;
        const progressFill = document.querySelector(`.progress-bar[data-id="${id}"] .progress-fill`);
        const currentTimeSpan = document.querySelector(`.duration-text[data-id="${id}"] .current-time`);

        if (progressFill) {
            // Handle NaN case
            const validProgress = isNaN(progress) ? 0 : Math.max(0, Math.min(100, progress));
            progressFill.style.width = `${validProgress}%`;
        }

        if (currentTimeSpan) {
            const validTime = isNaN(this.audioPlayer.currentTime) ? 0 : this.audioPlayer.currentTime;
            currentTimeSpan.textContent = this.formatDuration(Math.floor(validTime));
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #ff3b30;
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 20rem;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Stop all audio playback
     */
    stopAllPlayback() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
        }

        if (this.currentPlayingId) {
            this.updatePlayButton(this.currentPlayingId, false);
        }

        if (this.isMobile) {
            this.closeMobilePlayer();
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #34c759;
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 20rem;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}
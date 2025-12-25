/**
 * WaveformVisualizer - Real-time audio waveform visualization using Canvas API
 */
class WaveformVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.animationId = null;
        this.isAnimating = false;

        // Setup ResizeObserver to handle dynamic resizing (e.g., transitions)
        this.resizeObserver = new ResizeObserver(() => {
            this.setupCanvas();
        });
        this.resizeObserver.observe(this.canvas);

        this.setupCanvas();
    }

    /**
     * Setup canvas with proper dimensions
     */
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        // Update buffer size to match display size
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        // Scale context to match dpr
        this.ctx.scale(dpr, dpr);
        
        // Note: We don't set style.width/height here to allow CSS to control the display size
        // This enables the ResizeObserver to work correctly with CSS transitions
    }

    /**
     * Initialize audio context and analyser
     */
    async initialize(stream) {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Resume context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;

            // Connect stream to analyser
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);

            // Create data array for waveform
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            return true;
        } catch (error) {
            console.error('Error initializing waveform:', error);
            return false;
        }
    }

    /**
     * Start waveform animation
     */
    start() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.draw();
    }

    /**
     * Stop waveform animation
     */
    stop() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.clearCanvas();
    }

    /**
     * Main drawing loop - Smooth liquid wave that reacts to amplitude
     */
    draw() {
        if (!this.isAnimating) return;

        this.animationId = requestAnimationFrame(() => this.draw());

        // Get frequency data for amplitude
        const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(frequencyData);

        // Calculate average volume (amplitude)
        let sum = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            sum += frequencyData[i];
        }
        const average = sum / frequencyData.length;
        // Boost sensitivity: Scale up more aggressively
        const amplitude = (average / 128.0) * 3.0; 

        // Clear canvas
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        this.ctx.clearRect(0, 0, width, height);

        // Wave parameters
        const time = Date.now() * 0.005; // Faster animation
        const waveCount = 1; // Only one wave layer
        const waveColors = [
            'rgba(59, 130, 246, 0.8)'   // Strong blue
        ];

        // Draw multiple wave layers
        for (let i = 0; i < waveCount; i++) {
            this.ctx.fillStyle = waveColors[i];
            this.ctx.beginPath();

            const phase = time + i * Math.PI / 2;
            const frequency = 0.01 + i * 0.005 + (amplitude * 0.002); // Frequency reacts slightly to volume
            const baseHeight = height * 0.6; // Position wave in the lower part
            // Increase wave height significantly based on amplitude
            const waveHeight = (height * 0.35) * Math.max(0.1, amplitude); 

            this.ctx.moveTo(0, height); // Start from bottom left

            for (let x = 0; x <= width; x += 5) {
                const y = baseHeight + Math.sin(x * frequency + phase) * waveHeight;
                this.ctx.lineTo(x, y);
            }

            this.ctx.lineTo(width, height); // End at bottom right
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    /**
     * Draw frequency bars overlay for richer visualization
     */
    drawFrequencyBars(width, height) {
        const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(frequencyData);

        const barCount = 50;
        const barWidth = width / barCount;
        const centerY = height / 2;

        this.ctx.fillStyle = 'rgba(0, 122, 255, 0.15)';

        for (let i = 0; i < barCount; i++) {
            const index = Math.floor((i / barCount) * frequencyData.length);
            const value = frequencyData[index] / 255.0;
            const barHeight = value * (height / 3);

            const x = i * barWidth;
            const y = centerY - barHeight / 2;

            this.ctx.fillRect(x, y, barWidth - 2, barHeight);
        }
    }

    /**
     * Alternative: Circular waveform (Loom-style)
     */
    drawCircular() {
        if (!this.isAnimating) return;

        this.animationId = requestAnimationFrame(() => this.drawCircular());

        this.analyser.getByteFrequencyData(this.dataArray);

        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        this.ctx.fillStyle = 'rgba(135, 176, 255, 0.05)';
        this.ctx.fillRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 4;
        const bars = 60;

        for (let i = 0; i < bars; i++) {
            const index = Math.floor((i / bars) * this.dataArray.length);
            const value = this.dataArray[index] / 255.0;
            const angle = (Math.PI * 2 * i) / bars;

            const barHeight = value * radius * 0.8;
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);

            this.ctx.strokeStyle = `rgba(0, 122, 255, ${0.3 + value * 0.7})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
    }

    /**
     * Draw idle state (no audio)
     */
    drawIdle() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        this.ctx.clearRect(0, 0, width, height);

        // Draw subtle calm wave
        this.ctx.fillStyle = 'rgba(147, 197, 253, 0.2)';
        this.ctx.beginPath();

        const baseHeight = height * 0.7;
        const waveHeight = height * 0.05;
        const frequency = 0.01;

        this.ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 5) {
            const y = baseHeight + Math.sin(x * frequency) * waveHeight;
            this.ctx.lineTo(x, y);
        }
        this.ctx.lineTo(width, height);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * Clear canvas
     */
    clearCanvas() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        this.ctx.clearRect(0, 0, width, height);
        this.drawIdle();
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stop();

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.analyser = null;
        this.dataArray = null;
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.setupCanvas();
    }
}
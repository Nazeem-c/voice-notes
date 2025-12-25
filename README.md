# Voice Notes App 🎙️

A premium, production-ready web application for recording, managing, and playing back audio notes with real-time liquid waveform visualization.

## ✨ Features

- **Real-time Audio Recording** - Record high-quality audio directly from your microphone.
- **Dynamic Liquid Waveform** - Beautiful, multi-layered, amplitude-reactive liquid waveform display during recording.
- **Pause & Resume** - Full control over your recording sessions with integrated pause/resume functionality.
- **Smart Audio Management** - Automatically pauses playback when recording starts or resumes; allows reviewing notes while recording is paused.
- **Premium Mobile Experience** - Dedicated sticky mobile player with a draggable progress indicator and touch support.
- **Local Storage** - Recordings are saved securely in your browser's local storage.
- **Search & Filter** - High-performance search with debouncing and category-based filtering (All, Shared, Starred).
- **Note Management** - Easily star, download, or delete recordings via a clean, intuitive interface.
- **Responsive Design** - Optimized for all devices with a mobile-first, sleek white theme.
- **No Dependencies** - Built entirely with Vanilla JavaScript, HTML5, and CSS3.

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome 60+, Firefox 55+, Safari 14+, Edge 79+)
- Local web server (for development)
- HTTPS connection (required for microphone access in production)

### Installation

1. **Clone or download this repository:**
   ```bash
   git clone <your-repo-url>
   cd voice-notes-app
   ```

2. **Serve the application locally:**

   **Option A: Using Python (Recommended)**
   ```bash
   # Python 3
   python3 -m http.server 8000
   ```

   **Option B: Using Node.js**
   ```bash
   # Install http-server globally
   npm install -g http-server
   # Run server
   http-server -p 8000
   ```

3. **Open your browser:**
   ```
   http://localhost:8000
   ```

4. **Grant microphone permissions when prompted.**

## 📁 Project Structure

```
voice-notes-app/
├── index.html                  # Main HTML structure
├── assets/
│   └── icons/                 # SVG icon library
├── css/
│   ├── styles.css             # Core design system and components
│   ├── recording-modal.css    # Advanced recording interface styles
│   └── responsive.css         # Mobile-specific optimizations
├── js/
│   ├── main.js               # Application orchestration and state management
│   ├── audioRecorder.js      # MediaRecorder API wrapper
│   ├── waveformVisualizer.js # Canvas-based liquid waveform engine
│   ├── storageManager.js     # LocalStorage operations
│   └── uiController.js       # DOM manipulation and playback logic
└── README.md                  # Documentation
```

## 🎯 Usage

### Recording Audio
1. Click the **"+"** button in the header.
2. The recording interface will expand into a sleek floating pill.
3. Use the **Record/Pause** button to manage your session.
4. Watch the **Liquid Waveform** react to your voice in real-time.
5. Click **"Done"** to save or **"Cancel"** to discard.

### Playing Recordings
1. Tap the **Play** button on any note card.
2. On mobile, a **Sticky Player** appears at the top for easy control.
3. **Drag the pointer** on the progress bar to seek to any position.
4. Playback automatically stops if you start a new recording.

### Managing Recordings
- **Search**: Type in the search bar (results update instantly with built-in debouncing).
- **Filter**: Switch between "All", "Shared", and "Starred" tabs.
- **More Menu**: Click the "three dots" icon to access the **Delete** feature.
- **Download**: Click the download icon to save the audio file locally.

## 🔧 Technical Details

### Web APIs Used
- **MediaRecorder API** - For high-quality audio capture.
- **Web Audio API** - For real-time frequency analysis and visualization.
- **Canvas API** - For the high-performance liquid waveform rendering.
- **ResizeObserver** - Ensures the waveform stays perfectly scaled during UI transitions.
- **requestAnimationFrame** - Powers smooth 60fps animations and progress tracking.

### Storage & Performance
- **Format**: WebM/Opus (128 kbps) for optimal quality-to-size ratio.
- **Persistence**: Base64-encoded audio stored in `localStorage`.
- **Search**: Debounced input handling to prevent UI lag during filtering.

## 📄 License

This project is open source and available for personal and commercial use.

---

**Built with ❤️ using Vanilla JavaScript**
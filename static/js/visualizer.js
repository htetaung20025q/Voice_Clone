/**
 * BurmaVoice Audio Waveform Visualizer & Playback Engine
 * Uses Web Audio API AnalyserNode and HTML5 Canvas with high-DPI rendering.
 */

class AudioWaveformVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.audioElement = null;
    this.animationId = null;
    this.isPlaying = false;
    this.staticPeaks = [];

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.drawIdle();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;

    if (!this.isPlaying) {
      if (this.staticPeaks.length > 0) {
        this.drawStaticPeaks();
      } else {
        this.drawIdle();
      }
    }
  }

  initAudioContext(audioEl) {
    this.audioElement = audioEl;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      try {
        this.source = this.audioCtx.createMediaElementSource(audioEl);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      } catch (e) {
        console.warn("MediaElementSource already connected or cross-origin:", e);
      }
    }
  }

  generateStaticPeaks(count = 60) {
    this.staticPeaks = [];
    for (let i = 0; i < count; i++) {
      // Natural speech envelope simulation
      const base = Math.sin((i / count) * Math.PI);
      const rand = 0.2 + 0.8 * Math.random();
      this.staticPeaks.push(Math.max(0.1, base * rand));
    }
  }

  drawIdle() {
    if (!this.ctx || this.isPlaying) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const barCount = 50;
    const barWidth = (this.width / barCount) * 0.6;
    const gap = (this.width / barCount) * 0.4;
    const centerY = this.height / 2;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap);
      const h = 4;
      this.ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
      this.roundRect(this.ctx, x, centerY - h / 2, barWidth, h, 2);
    }
  }

  drawStaticPeaks(progress = 0) {
    if (!this.ctx || this.isPlaying) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const barCount = this.staticPeaks.length || 50;
    const barWidth = (this.width / barCount) * 0.65;
    const gap = (this.width / barCount) * 0.35;
    const centerY = this.height / 2;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap);
      const norm = this.staticPeaks[i] || 0.2;
      const h = Math.max(4, norm * (this.height * 0.8));
      const isPast = (i / barCount) <= progress;

      if (isPast) {
        // Gradient for played portion
        const grad = this.ctx.createLinearGradient(0, centerY - h/2, 0, centerY + h/2);
        grad.addColorStop(0, '#818cf8');
        grad.addColorStop(1, '#6366f1');
        this.ctx.fillStyle = grad;
      } else {
        this.ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
      }

      this.roundRect(this.ctx, x, centerY - h / 2, barWidth, h, 2);
    }
  }

  startVisualization(audioEl) {
    this.initAudioContext(audioEl);
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.isPlaying = true;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!this.isPlaying) return;

      this.animationId = requestAnimationFrame(render);
      this.analyser.getByteFrequencyData(dataArray);

      this.ctx.clearRect(0, 0, this.width, this.height);

      const barCount = 48;
      const barWidth = (this.width / barCount) * 0.65;
      const gap = (this.width / barCount) * 0.35;
      const centerY = this.height / 2;
      const step = Math.floor(bufferLength / barCount);

      const progress = this.audioElement ? (this.audioElement.currentTime / (this.audioElement.duration || 1)) : 0;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] || 0;
        const norm = val / 255.0;
        const h = Math.max(4, norm * (this.height * 0.88));
        const x = i * (barWidth + gap);
        const isPast = (i / barCount) <= progress;

        const grad = this.ctx.createLinearGradient(0, centerY - h/2, 0, centerY + h/2);
        if (isPast) {
          grad.addColorStop(0, '#38bdf8');
          grad.addColorStop(0.5, '#6366f1');
          grad.addColorStop(1, '#a855f7');
        } else {
          grad.addColorStop(0, 'rgba(129, 140, 248, 0.45)');
          grad.addColorStop(1, 'rgba(99, 102, 241, 0.25)');
        }

        this.ctx.fillStyle = grad;
        this.roundRect(this.ctx, x, centerY - h / 2, barWidth, h, 3);
      }
    };

    render();
  }

  stopVisualization() {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.drawStaticPeaks();
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
}

window.AudioWaveformVisualizer = AudioWaveformVisualizer;

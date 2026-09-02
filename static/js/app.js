/**
 * BurmaVoice Frontend Controller
 * Manages voices, text preprocessing, TTS API requests, audio playback, and visualizer.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // State Management
  const state = {
    selectedVoiceId: 'thiri',
    voices: [],
    samples: [],
    speed: 1.0,
    pitch: 1.0,
    isSynthesizing: false,
    currentAudioBlob: null,
    currentAudioUrl: null,
    history: JSON.parse(localStorage.getItem('burmavoice_history') || '[]')
  };

  // DOM Elements
  const elements = {
    voiceGrid: document.getElementById('voiceGrid'),
    voiceCountBadge: document.getElementById('voiceCountBadge'),
    sampleChips: document.getElementById('sampleChips'),
    ttsTextInput: document.getElementById('ttsTextInput'),
    clearTextBtn: document.getElementById('clearTextBtn'),
    charCount: document.getElementById('charCount'),
    syllableCount: document.getElementById('syllableCount'),
    speedRange: document.getElementById('speedRange'),
    speedValue: document.getElementById('speedValue'),
    pitchRange: document.getElementById('pitchRange'),
    pitchValue: document.getElementById('pitchValue'),
    synthesizeBtn: document.getElementById('synthesizeBtn'),
    btnText: document.getElementById('btnText'),
    btnIcon: document.getElementById('btnIcon'),
    audioElement: document.getElementById('audioElement'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    playIcon: document.getElementById('playIcon'),
    stopBtn: document.getElementById('stopBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    audioScrubber: document.getElementById('audioScrubber'),
    currentTime: document.getElementById('currentTime'),
    totalDuration: document.getElementById('totalDuration'),
    playerStatusBadge: document.getElementById('playerStatusBadge'),
    canvasOverlay: document.getElementById('canvasOverlay'),
    metricsPanel: document.getElementById('metricsPanel'),
    metricInference: document.getElementById('metricInference'),
    metricDuration: document.getElementById('metricDuration'),
    metricVoice: document.getElementById('metricVoice'),
    historyList: document.getElementById('historyList'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    statusIndicator: document.getElementById('statusIndicator'),
    deviceText: document.getElementById('deviceText'),
    deviceBadge: document.getElementById('deviceBadge')
  };

  // Initialize Waveform Visualizer
  const visualizer = new AudioWaveformVisualizer('waveformCanvas');

  // --- 1. Client-Side Syllable Counting ---
  function countMyanmarSyllables(text) {
    if (!text || !text.trim()) return 0;
    // Standard Myanmar syllable break regex
    const pattern = /(?<![\u1039])(?=[\u1000-\u1021\u1023-\u102A\u104E\u1040-\u1049])/g;
    const cleaned = text.replace(/[\uFEFF\u200B\u200C\u200D]/g, '').trim();
    const parts = cleaned.split(pattern);
    return parts.filter(p => p && p.trim().length > 0).length;
  }

  function updateTextMetrics() {
    const text = elements.ttsTextInput.value || '';
    const charLen = text.length;
    const syllLen = countMyanmarSyllables(text);

    elements.charCount.textContent = `${charLen.toLocaleString()} အက္ခရာ (Chars)`;
    elements.syllableCount.textContent = `${syllLen.toLocaleString()} ဝဏ္ဏ (Syllables)`;
  }

  // --- 2. API Fetching (Voices, Samples, Health) ---
  async function fetchHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        elements.statusIndicator.textContent = data.model_loaded ? 'Ready (Loaded)' : 'Online (Active)';
        elements.deviceText.textContent = `${data.compute_device.toUpperCase()} Engine`;
        elements.deviceBadge.classList.remove('hidden');
      }
    } catch (e) {
      elements.statusIndicator.textContent = 'Offline / Connecting';
      elements.statusIndicator.classList.replace('text-emerald-400', 'text-amber-400');
    }
  }

  async function fetchVoices() {
    try {
      const res = await fetch('/api/voices');
      const data = await res.json();
      if (data.success && data.voices) {
        state.voices = data.voices;
        renderVoiceCards();
        elements.voiceCountBadge.textContent = `${data.voices.length} Profiles Available`;
      }
    } catch (e) {
      console.error('Failed to fetch voices:', e);
    }
  }

  async function fetchSamples() {
    try {
      const res = await fetch('/api/samples');
      const data = await res.json();
      if (data.success && data.samples) {
        state.samples = data.samples;
        renderSampleChips();
      }
    } catch (e) {
      console.error('Failed to fetch samples:', e);
    }
  }

  // --- 3. UI Rendering ---
  function renderVoiceCards() {
    elements.voiceGrid.innerHTML = '';
    state.voices.forEach(voice => {
      const isSelected = voice.id === state.selectedVoiceId;
      const card = document.createElement('div');
      card.className = `glass-panel-interactive rounded-2xl p-4 cursor-pointer flex flex-col justify-between border ${
        isSelected ? 'voice-card-active' : 'border-slate-800/80 hover:border-slate-700'
      }`;
      card.dataset.voiceId = voice.id;

      card.innerHTML = `
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center space-x-3">
            <span class="text-2xl p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">${voice.avatar || '🎙️'}</span>
            <div>
              <h4 class="font-semibold text-sm text-white font-burmese">${voice.name}</h4>
              <span class="text-[11px] text-brand-400 font-medium">${voice.gender} • ${voice.category}</span>
            </div>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full ${isSelected ? 'bg-brand-500 text-white font-bold' : 'badge-subtle text-slate-400'}">
            ${voice.tag.split('/')[0].trim()}
          </span>
        </div>
        <p class="text-xs text-slate-400 font-burmese line-clamp-2">${voice.description}</p>
      `;

      card.addEventListener('click', () => {
        state.selectedVoiceId = voice.id;
        renderVoiceCards();
      });

      elements.voiceGrid.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function renderSampleChips() {
    elements.sampleChips.innerHTML = '';
    state.samples.forEach((sample, idx) => {
      const chip = document.createElement('button');
      chip.className = 'px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xs text-slate-300 transition hover:text-white flex items-center space-x-1.5 font-burmese cursor-pointer';
      chip.innerHTML = `<span>${sample.title}</span>`;
      chip.addEventListener('click', () => {
        elements.ttsTextInput.value = sample.text;
        updateTextMetrics();
        elements.ttsTextInput.focus();
      });
      elements.sampleChips.appendChild(chip);
    });
  }

  function renderHistory() {
    if (!state.history || state.history.length === 0) {
      elements.historyList.innerHTML = '<p class="text-xs text-slate-500 italic text-center py-4 font-burmese">မှတ်တမ်း မရှိသေးပါ</p>';
      return;
    }

    elements.historyList.innerHTML = '';
    state.history.slice(0, 8).forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800/60 text-xs transition';
      row.innerHTML = `
        <div class="flex-1 min-w-0 pr-3">
          <div class="flex items-center space-x-2 mb-0.5">
            <span class="font-medium text-slate-300 font-burmese">${item.voiceName || 'သီရိ'}</span>
            <span class="text-[10px] text-slate-500 font-mono">${item.duration || '0.0'}s</span>
          </div>
          <p class="text-slate-400 font-burmese truncate text-[11px]">${item.text}</p>
        </div>
        <button class="p-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-white transition cursor-pointer" title="Play clip">
          <i data-lucide="play" class="w-3.5 h-3.5"></i>
        </button>
      `;

      const playBtn = row.querySelector('button');
      playBtn.addEventListener('click', () => {
        elements.ttsTextInput.value = item.text;
        state.selectedVoiceId = item.voiceId || 'thiri';
        renderVoiceCards();
        updateTextMetrics();
        if (item.audioBase64) {
          loadAudioFromBase64(item.audioBase64, item.metadata);
        } else {
          synthesize();
        }
      });

      elements.historyList.appendChild(row);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function saveHistoryItem(item) {
    state.history.unshift(item);
    if (state.history.length > 15) state.history.pop();
    localStorage.setItem('burmavoice_history', JSON.stringify(state.history));
    renderHistory();
  }

  // --- 4. Speech Synthesis Flow ---
  async function synthesize() {
    const text = elements.ttsTextInput.value.trim();
    if (!text) {
      alert('ကျေးဇူးပြု၍ စာသား ရိုက်ထည့်ပေးပါ (Please enter Myanmar text).');
      elements.ttsTextInput.focus();
      return;
    }

    if (state.isSynthesizing) return;

    // Set Loading State
    state.isSynthesizing = true;
    elements.synthesizeBtn.disabled = true;
    elements.btnText.textContent = 'အသံဖန်တီးနေသည်... (Generating)';
    elements.btnIcon.setAttribute('data-lucide', 'loader-2');
    elements.btnIcon.classList.add('animate-spin');
    elements.playerStatusBadge.textContent = 'Synthesizing speech...';
    if (window.lucide) window.lucide.createIcons();

    try {
      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          voice_id: state.selectedVoiceId,
          speed: parseFloat(state.speed),
          pitch: state.pitch !== 1.0 ? parseFloat(state.pitch) : null,
          return_base64: true
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Synthesis request failed');
      }

      const result = await response.json();
      loadAudioFromBase64(result.audio_base64, result.metadata);

      // Save to History
      const activeVoice = state.voices.find(v => v.id === state.selectedVoiceId);
      saveHistoryItem({
        id: Date.now(),
        text: text,
        voiceId: state.selectedVoiceId,
        voiceName: activeVoice ? activeVoice.name : 'သီရိ',
        duration: result.metadata.duration_seconds,
        audioBase64: result.audio_base64,
        metadata: result.metadata
      });

    } catch (err) {
      console.error('Synthesis error:', err);
      alert(`Synthesis Error: ${err.message}`);
      elements.playerStatusBadge.textContent = 'Synthesis failed';
    } finally {
      state.isSynthesizing = false;
      elements.synthesizeBtn.disabled = false;
      elements.btnText.textContent = 'အသံဖန်တီးမည် (Generate Speech)';
      elements.btnIcon.setAttribute('data-lucide', 'sparkles');
      elements.btnIcon.classList.remove('animate-spin');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function loadAudioFromBase64(base64Data, metadata = {}) {
    // Update Audio Source
    elements.audioElement.src = base64Data;
    elements.audioElement.load();

    // Enable player controls
    elements.playPauseBtn.disabled = false;
    elements.stopBtn.disabled = false;
    elements.downloadBtn.disabled = false;
    elements.audioScrubber.disabled = false;
    elements.canvasOverlay.classList.add('opacity-0', 'pointer-events-none');
    elements.playerStatusBadge.textContent = 'Audio ready';

    // Update Telemetry Panel
    if (metadata) {
      elements.metricInference.textContent = `${metadata.inference_time_seconds || 0}s`;
      elements.metricDuration.textContent = `${metadata.duration_seconds || 0}s`;
      elements.metricVoice.textContent = metadata.voice || 'Natural';
      elements.metricsPanel.classList.remove('hidden');
    }

    // Prepare visualizer static waveform peaks
    visualizer.generateStaticPeaks(50);
    visualizer.drawStaticPeaks(0);

    // Auto play
    elements.audioElement.play().catch(e => console.log('Autoplay prevented:', e));
  }

  // --- 5. Audio Player Event Listeners ---
  elements.audioElement.addEventListener('play', () => {
    elements.playIcon.setAttribute('data-lucide', 'pause');
    if (window.lucide) window.lucide.createIcons();
    visualizer.startVisualization(elements.audioElement);
    elements.playerStatusBadge.textContent = 'Playing...';
  });

  elements.audioElement.addEventListener('pause', () => {
    elements.playIcon.setAttribute('data-lucide', 'play');
    if (window.lucide) window.lucide.createIcons();
    visualizer.stopVisualization();
    elements.playerStatusBadge.textContent = 'Paused';
  });

  elements.audioElement.addEventListener('ended', () => {
    elements.playIcon.setAttribute('data-lucide', 'play');
    if (window.lucide) window.lucide.createIcons();
    visualizer.stopVisualization();
    elements.audioScrubber.value = 0;
    elements.currentTime.textContent = '00:00';
    elements.playerStatusBadge.textContent = 'Playback finished';
  });

  elements.audioElement.addEventListener('timeupdate', () => {
    const cur = elements.audioElement.currentTime;
    const dur = elements.audioElement.duration || 1;
    elements.currentTime.textContent = formatTime(cur);
    elements.totalDuration.textContent = formatTime(dur);
    elements.audioScrubber.value = (cur / dur) * 100;

    if (!visualizer.isPlaying) {
      visualizer.drawStaticPeaks(cur / dur);
    }
  });

  elements.audioElement.addEventListener('loadedmetadata', () => {
    elements.totalDuration.textContent = formatTime(elements.audioElement.duration);
  });

  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Play/Pause Button
  elements.playPauseBtn.addEventListener('click', () => {
    if (elements.audioElement.paused) {
      elements.audioElement.play();
    } else {
      elements.audioElement.pause();
    }
  });

  // Stop Button
  elements.stopBtn.addEventListener('click', () => {
    elements.audioElement.pause();
    elements.audioElement.currentTime = 0;
    elements.audioScrubber.value = 0;
    elements.currentTime.textContent = '00:00';
    visualizer.stopVisualization();
  });

  // Scrubber Seek
  elements.audioScrubber.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const dur = elements.audioElement.duration || 1;
    elements.audioElement.currentTime = (val / 100) * dur;
  });

  // Download WAV
  elements.downloadBtn.addEventListener('click', () => {
    if (!elements.audioElement.src) return;
    const a = document.createElement('a');
    a.href = elements.audioElement.src;
    a.download = `burmavoice_${state.selectedVoiceId}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // Sliders
  elements.speedRange.addEventListener('input', (e) => {
    state.speed = parseFloat(e.target.value);
    elements.speedValue.textContent = `${state.speed.toFixed(2)}x`;
  });

  elements.pitchRange.addEventListener('input', (e) => {
    state.pitch = parseFloat(e.target.value);
    if (Math.abs(state.pitch - 1.0) < 0.04) {
      elements.pitchValue.textContent = 'Default';
    } else {
      elements.pitchValue.textContent = `${state.pitch.toFixed(2)}x`;
    }
  });

  // Input listener for live counter
  elements.ttsTextInput.addEventListener('input', updateTextMetrics);

  // Clear text
  elements.clearTextBtn.addEventListener('click', () => {
    elements.ttsTextInput.value = '';
    updateTextMetrics();
    elements.ttsTextInput.focus();
  });

  // Clear History
  elements.clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    localStorage.removeItem('burmavoice_history');
    renderHistory();
  });

  // Synthesize Button
  elements.synthesizeBtn.addEventListener('click', synthesize);

  // Keyboard shortcut: Ctrl + Enter
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      synthesize();
    }
  });

  // Initial Load
  await Promise.all([fetchHealth(), fetchVoices(), fetchSamples()]);
  renderHistory();
  updateTextMetrics();

  // Set default sample prompt in text area
  if (state.samples.length > 0 && !elements.ttsTextInput.value) {
    elements.ttsTextInput.value = state.samples[0].text;
    updateTextMetrics();
  }
});

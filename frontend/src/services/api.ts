/**
 * API Service for communicating with BurmaVoice FastAPI backend.
 */

export interface VoiceInfo {
  id: string;
  name: string;
  myanmar_name: string;
  gemini_voice: string;
  gender: string;
  persona: string;
  persona_mm: string;
  tone: string;
  sample_tag: string;
  sample_text: string;
}

export interface StyleInfo {
  id: string;
  name: string;
  myanmar_name: string;
  description: string;
  prompt_instruction: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  gemini_configured: boolean;
  model: string;
  environment: string;
}

export interface TTSRequest {
  text: string;
  voice: string;
  style: string;
  language?: string;
  speed?: number;
  pitch?: number;
}

export interface TTSResponseMetadata {
  voice: string;
  voice_name: string;
  style: string;
  language: string;
  character_count: number;
  duration_seconds: number;
  format: string;
  sample_rate: number;
  latency_ms: number;
  is_mock?: boolean;
  is_replicated?: boolean;
  voice_session_id?: string;
}

export interface TTSResult {
  audioBlob: Blob;
  audioUrl: string;
  metadata: TTSResponseMetadata;
}

export interface VoiceConsentScript {
  id: string;
  name: string;
  consent_statement: string;
  default_sample: string;
}

export interface VoiceReplicationResponse {
  success: boolean;
  voice_session_id: string;
  expires_at: string;
  duration_seconds: number;
  sample_rate: number;
  message: string;
}

export interface VoiceSessionStatus {
  voice_session_id: string;
  is_valid: boolean;
  expires_at: string;
  seconds_remaining: number;
  duration_seconds: number;
  sample_rate: number;
}

export interface ReplicatedTTSRequest {
  voice_session_id: string;
  text: string;
  language_code?: string;
  speed?: number;
  pitch?: number;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class VoiceStudioAPI {
  /**
   * Health check to check server connectivity.
   */
  static async getHealth(): Promise<HealthResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        status: 'offline',
        version: '1.0.0',
        gemini_configured: false,
        model: 'unknown',
        environment: 'local',
      };
    }
  }

  /**
   * Fetch all supported Myanmar AI voices.
   */
  static async getVoices(): Promise<VoiceInfo[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/voices`);
      if (!res.ok) throw new Error('Failed to fetch voices');
      return await res.json();
    } catch {
      // Local fallback
      return [
        {
          id: 'thiri',
          name: 'Thiri',
          myanmar_name: 'သီရိ',
          gemini_voice: 'Kore',
          gender: 'Female (အမျိုးသမီး)',
          persona: 'Natural & Clear',
          persona_mm: 'သဘာဝကျပြီး ကြည်လင်ပြတ်သားသော အသံ',
          tone: 'Warm, balanced, and articulate',
          sample_tag: 'General Reading, SaaS, Tutorials',
          sample_text: 'မင်္ဂလာပါရှင်။ သီရိ မှ ကြိုဆိုပါတယ်။ သင့်ရဲ့ စာသားများကို သဘာဝကျသော အသံအဖြစ် ဖန်တီးပေးနိုင်ပါတယ်။'
        },
        {
          id: 'aung',
          name: 'Aung',
          myanmar_name: 'အောင်',
          gemini_voice: 'Puck',
          gender: 'Male (အမျိုးသား)',
          persona: 'Friendly & Engaging',
          persona_mm: 'ဖော်ရွေ၍ သွက်လက်တက်ကြွသော အသံ',
          tone: 'Approachable, conversational, and energetic',
          sample_tag: 'Podcasts, Social Media, Casual',
          sample_text: 'မင်္ဂလာပါ ခင်ဗျာ။ အောင် ပါ။ ပေါ့ဒ်ကတ်စ် နဲ့ ဗီဒီယိုတွေအတွက် အကောင်းဆုံး အသံထွက်ပေးမှာပါ။'
        },
        {
          id: 'may',
          name: 'May',
          myanmar_name: 'မေ',
          gemini_voice: 'Aoede',
          gender: 'Female (အမျိုးသမီး)',
          persona: 'Formal & News Broadcasting',
          persona_mm: 'သတင်းကြေညာနှင့် တရားဝင် အခမ်းအနား အသံ',
          tone: 'Formal, poised, and melodic',
          sample_tag: 'News, Documentaries, Presentations',
          sample_text: 'ဒီကနေ့ ထူးခြားတဲ့ သတင်းအချက်အလက်များကို မေ က တင်ဆက်ပေးသွားမှာ ဖြစ်ပါတယ်။'
        },
        {
          id: 'min',
          name: 'Min',
          myanmar_name: 'မင်း',
          gemini_voice: 'Fenrir',
          gender: 'Male (အမျိုးသား)',
          persona: 'Dynamic & Commercials',
          persona_mm: 'ကြော်ငြာနှင့် ပရိုမိုးရှင်း အသံ',
          tone: 'High energy, punchy, and modern',
          sample_tag: 'Commercials, Gaming, Promos',
          sample_text: 'အခုပဲ စတင်လိုက်ပါ။ အထူး အစီအစဉ်သစ်များ မကြာမီ လာပါတော့မယ်။'
        },
        {
          id: 'nandar',
          name: 'Nandar',
          myanmar_name: 'နန္ဒာ',
          gemini_voice: 'Leda',
          gender: 'Female (အမျိုးသမီး)',
          persona: 'Gentle & Storytelling',
          persona_mm: 'ညင်သာ၍ စိတ်အေးချမ်းစေသော ဇာတ်လမ်းပြော အသံ',
          tone: 'Soothing, expressive, and gentle',
          sample_tag: 'Audiobooks, Meditation, Stories',
          sample_text: 'ရှေးရှေးတုန်းက သာယာလှပတဲ့ မြို့ကလေးတစ်မြို့မှာ နေထိုင်ကြတဲ့...'
        },
        {
          id: 'kyaw',
          name: 'Kyaw Thu',
          myanmar_name: 'ကျော်သူ',
          gemini_voice: 'Charon',
          gender: 'Male (အမျိုးသား)',
          persona: 'Deep & Authoritative',
          persona_mm: 'ဩဇာညောင်းပြီး လေးနက်သော အသံ',
          tone: 'Resonant, deep, and trustworthy',
          sample_tag: 'Narration, History, Explainer',
          sample_text: 'သမိုင်းဝင် အဖြစ်အပျက်များနှင့် လေးနက်သော အကြောင်းအရာများကို ကျော်သူ က ရှင်းလင်းတင်ပြပါမည်။'
        }
      ];
    }
  }

  /**
   * Fetch available speaking styles.
   */
  static async getStyles(): Promise<StyleInfo[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/styles`);
      if (!res.ok) throw new Error('Failed to fetch styles');
      return await res.json();
    } catch {
      return [
        { id: 'natural', name: 'Natural', myanmar_name: 'သဘာဝအတိုင်း', description: 'Natural conversational cadence.', prompt_instruction: 'Speak naturally.' },
        { id: 'professional', name: 'Professional', myanmar_name: 'ကျွမ်းကျင်ပုံစံ', description: 'Formal executive tone.', prompt_instruction: 'Speak professionally.' },
        { id: 'friendly', name: 'Friendly', myanmar_name: 'ဖော်ရွေသော', description: 'Warm and cheerful tone.', prompt_instruction: 'Speak friendly.' },
        { id: 'storytelling', name: 'Storytelling', myanmar_name: 'ဇာတ်လမ်းပြော', description: 'Expressive dramatic nuance.', prompt_instruction: 'Speak with storytelling cadence.' },
        { id: 'news', name: 'News', myanmar_name: 'သတင်းကြေညာ', description: 'Objective broadcast delivery.', prompt_instruction: 'Speak like a news anchor.' },
        { id: 'calm', name: 'Calm', myanmar_name: 'အေးဆေးငြိမ်သက်', description: 'Relaxing steady cadence.', prompt_instruction: 'Speak calmly.' },
      ];
    }
  }

  /**
   * Synthesize speech using BurmaVoice API.
   */
  static async synthesize(req: TTSRequest): Promise<TTSResult> {
    const trimmed = req.text.trim();
    if (!trimmed) {
      throw new Error('Text is required to generate speech.');
    }
    if (trimmed.length > 5000) {
      throw new Error('Text exceeds the maximum allowed length of 5,000 characters.');
    }

    const startTime = performance.now();
    const res = await fetch(`${API_BASE}/api/v1/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: trimmed,
        voice: req.voice || 'thiri',
        style: req.style || 'natural',
        language: req.language || 'myanmar',
        speed: req.speed || 1.0,
        pitch: req.pitch || 0.0,
      }),
    });

    if (!res.ok) {
      let errorMessage = "We couldn't generate the voice. Please try again.";
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = `Synthesis failed with server status ${res.status}`;
      }
      throw new Error(errorMessage);
    }

    const durationHeader = res.headers.get('X-Audio-Duration');
    const latencyHeader = res.headers.get('X-Audio-Latency-Ms');
    const voiceHeader = res.headers.get('X-Audio-Voice');
    const voiceNameHeader = res.headers.get('X-Audio-Voice-Name');
    const styleHeader = res.headers.get('X-Audio-Style');
    const langHeader = res.headers.get('X-Audio-Language');
    const mockHeader = res.headers.get('X-Audio-Mock');

    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const clientLatency = Math.round(performance.now() - startTime);

    const metadata: TTSResponseMetadata = {
      voice: voiceHeader || req.voice || 'thiri',
      voice_name: voiceNameHeader || req.voice || 'Thiri',
      style: styleHeader || req.style || 'natural',
      language: langHeader || req.language || 'myanmar',
      character_count: trimmed.length,
      duration_seconds: durationHeader ? parseFloat(durationHeader) : 0,
      format: 'audio/wav',
      sample_rate: 24000,
      latency_ms: latencyHeader ? parseFloat(latencyHeader) : clientLatency,
      is_mock: mockHeader === 'true',
    };

    return { audioBlob, audioUrl, metadata };
  }

  /**
   * Fetch official Google Cloud Voice Replication consent statements.
   */
  static async getConsentScripts(): Promise<VoiceConsentScript[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/voice/consent-scripts`);
      if (!res.ok) throw new Error('Failed to fetch consent scripts');
      return await res.json();
    } catch {
      return [
        {
          id: 'my-MM',
          name: 'မြန်မာ (Burmese)',
          consent_statement: 'ကျွန်ုပ်သည် ဤအသံ၏ပိုင်ရှင်ဖြစ်ပြီး Google Cloud ကိုအသုံးပြုခြင်းဖြင့် ကျွန်ုပ်၏အသံ၏ ပေါင်းစပ်ပုံစံတစ်ခု ဖန်တီးရန် သဘောတူပါသည်။',
          default_sample: 'မင်္ဂလာပါ။ ဒီနေ့ကောင်းမွန်တဲ့နေ့တစ်နေ့ဖြစ်ပါစေ။',
        },
        {
          id: 'en-US',
          name: 'English (US)',
          consent_statement: 'I am the owner of this voice and I consent to Google Cloud using this voice to create a synthetic voice model.',
          default_sample: 'Hello. This is a voice replication test.',
        }
      ];
    }
  }

  /**
   * Create a temporary Voice Replication key by uploading reference and consent audio.
   */
  static async replicateVoice(
    sourceFile: File,
    consentFile: File,
    consentConfirmed: boolean,
    languageCode: string = 'my-MM'
  ): Promise<VoiceReplicationResponse> {
    if (!consentConfirmed) {
      throw new Error('Please confirm that you own this voice or have permission to use it.');
    }
    if (!sourceFile) {
      throw new Error('Please upload a voice sample.');
    }
    if (!consentFile) {
      throw new Error('Please upload the required consent recording.');
    }

    const formData = new FormData();
    formData.append('source_audio', sourceFile);
    formData.append('consent_audio', consentFile);
    formData.append('consent_confirmed', String(consentConfirmed));
    formData.append('language_code', languageCode);

    const res = await fetch(`${API_BASE}/api/v1/voice/replicate`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      let errorMessage = 'Voice replication failed. Please try again.';
      try {
        const errJson = await res.json();
        errorMessage = errJson.detail || errJson.message || errorMessage;
      } catch {
        errorMessage = `Replication failed with status ${res.status}`;
      }
      throw new Error(errorMessage);
    }

    return await res.json();
  }

  /**
   * Synthesize speech using a verified temporary voice replication session.
   */
  static async synthesizeReplicated(req: ReplicatedTTSRequest): Promise<TTSResult> {
    const trimmed = req.text.trim();
    if (!trimmed) {
      throw new Error('Text is required to generate speech.');
    }
    if (trimmed.length > 5000) {
      throw new Error('Text exceeds the maximum allowed length of 5,000 characters.');
    }
    if (!req.voice_session_id) {
      throw new Error('A valid voice replication session is required.');
    }

    const startTime = performance.now();
    const res = await fetch(`${API_BASE}/api/v1/tts/voice-replication`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voice_session_id: req.voice_session_id,
        text: trimmed,
        language_code: req.language_code || 'my-MM',
        speed: req.speed || 1.0,
        pitch: req.pitch || 0.0,
      }),
    });

    if (!res.ok) {
      let errorMessage = 'Voice generation failed. Please try again.';
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = `Synthesis failed with server status ${res.status}`;
      }
      throw new Error(errorMessage);
    }

    const durationHeader = res.headers.get('X-Audio-Duration');
    const latencyHeader = res.headers.get('X-Audio-Latency-Ms');
    const langHeader = res.headers.get('X-Audio-Language');
    const mockHeader = res.headers.get('X-Audio-Mock');
    const sessionHeader = res.headers.get('X-Audio-Voice-Session');

    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const clientLatency = Math.round(performance.now() - startTime);

    const metadata: TTSResponseMetadata = {
      voice: 'replicated',
      voice_name: 'Replicated Voice (စိတ်ကြိုက်အသံ)',
      style: 'custom',
      language: langHeader || req.language_code || 'my-MM',
      character_count: trimmed.length,
      duration_seconds: durationHeader ? parseFloat(durationHeader) : 0,
      format: 'audio/wav',
      sample_rate: 24000,
      latency_ms: latencyHeader ? parseFloat(latencyHeader) : clientLatency,
      is_mock: mockHeader === 'true',
      is_replicated: true,
      voice_session_id: sessionHeader || req.voice_session_id,
    };

    return { audioBlob, audioUrl, metadata };
  }

  /**
   * Check status of a temporary voice session.
   */
  static async getSessionStatus(sessionId: string): Promise<VoiceSessionStatus> {
    const res = await fetch(`${API_BASE}/api/v1/voice/session/${encodeURIComponent(sessionId)}`);
    if (!res.ok) throw new Error('Session not found or expired');
    return await res.json();
  }
}

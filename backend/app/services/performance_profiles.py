"""
BurmeseATAN Voice Performance & Accent System.
Defines distinct speaking performance profiles separated from base voice identity.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class PerformanceProfile(BaseModel):
    """
    Speaking performance profile defining delivery characteristics,
    cadence, emotional intensity, pauses, and Burmese acoustic guidance.
    """
    id: str = Field(..., description="Unique profile identifier")
    name: str = Field(..., description="English title")
    name_mm: str = Field(..., description="Burmese title")
    category: str = Field(..., description="Category: FOOTBALL, EDUCATION, ENTERTAINMENT, BUSINESS, STANDARD")
    energy: str = Field(..., description="Energy level: Very High, High, Medium, Low, Variable")
    pacing: str = Field(..., description="Pacing: Fast and dynamic, Slow-Medium, Conversational, etc.")
    emotion: str = Field(..., description="Emotional intensity and mood")
    emphasis: str = Field(..., description="Emphasis rules and target keywords/concepts")
    pauses: str = Field(..., description="Pause duration and placement guidelines")
    pitch_variation: str = Field(..., description="Pitch variation: High, Medium, Controlled, Dynamic")
    delivery: str = Field(..., description="Delivery style description")
    speed_modifier: float = Field(default=1.0, description="Playback speed modifier (0.5 to 2.0)")
    pitch_modifier: str = Field(default="+0Hz", description="Pitch adjustment (e.g. +3Hz, -4Hz)")
    instructions: str = Field(..., description="Detailed generative directive for Gemini TTS")
    burmese_guidance: str = Field(..., description="Burmese phonetic, tonal, and rhythmic guidance")


# Central Performance Profiles Registry
PERFORMANCE_PROFILES: Dict[str, PerformanceProfile] = {
    # ==========================================
    # 1. FOOTBALL & SPORTS PROFILES
    # ==========================================
    "football_live": PerformanceProfile(
        id="football_live",
        name="Football Live Commentator",
        name_mm="ဘောလုံးတိုက်ရိုက် အသံလွှင့် ধারাভাষျ",
        category="FOOTBALL",
        energy="Very High",
        pacing="Fast and dynamic",
        emotion="Excited, reactive, electric, dramatic",
        emphasis="Explosive emphasis on critical match moments: GOAL, SHOT, SAVE, PENALTY, FOUL, COUNTER ATTACK, FINAL MINUTES",
        pauses="Short, sharp, natural pauses before and after crucial developments to build suspense",
        pitch_variation="High (dynamic crests and vocal surges)",
        delivery="Spontaneous real-time stadium commentary with infectious excitement",
        speed_modifier=1.18,
        pitch_modifier="+3Hz",
        instructions=(
            "Deliver an authentic live football match commentary performance. "
            "Your speech must be dynamic and reactive, not uniformly loud: "
            "Normal buildup play should be energetic yet controlled; "
            "Dangerous attacks should escalate rapidly in tempo and vocal intensity; "
            "Shots and goalmouth scrambles must surge with fast staccato syllables and urgent pitch; "
            "When a goal occurs or text indicates a score, release peak euphoric energy with resonant vocal power; "
            "After high-intensity moments, let the breath and excitement settle naturally back into focused match description. "
            "Infuse your delivery with the genuine adrenaline of a live stadium broadcast."
        ),
        burmese_guidance=(
            "Use punchy Burmese syllable clipping on rapid action verbs (e.g. ကန်သွင်းလိုက်ပြီ၊ ဂိုး၊ ကာကွယ်သွားတယ်၊ ပင်နယ်တီ). "
            "Elevate sentence-ending particles (ဗျာ၊ တယ်၊ ပြီ) with sharp acoustic punch during scoring chances. "
            "Maintain fluid Myanmar phonological flow without lagging on compound names and positions."
        )
    ),

    "football_highlights": PerformanceProfile(
        id="football_highlights",
        name="Football Match Highlights",
        name_mm="ပွဲစဉ် အနှစ်ချုပ် သုံးသပ်တင်ဆက်သူ",
        category="FOOTBALL",
        energy="High",
        pacing="Medium-Fast",
        emotion="Excited, triumphant, engaging",
        emphasis="Strong emphasis on turning points, key scores, tactical masterstrokes, and match outcomes",
        pauses="Measured dramatic pauses between distinct play sequences and highlight segments",
        pitch_variation="Medium-High",
        delivery="Engaging post-match recap narration with vibrant storytelling momentum",
        speed_modifier=1.10,
        pitch_modifier="+2Hz",
        instructions=(
            "Deliver a post-match highlights recap narration. "
            "Sound like an enthusiastic sports narrator reviewing the best moments of a thrilling fixture. "
            "Maintain an upbeat, driving tempo that carries the listener from chance to chance. "
            "Build anticipation as you describe the buildup to key goals, then celebrate the finish with polished broadcast punch. "
            "Reflect the drama of the match without the erratic screaming of live commentary."
        ),
        burmese_guidance=(
            "Accentuate Burmese temporal conjunctions (အပြီးတွင်၊ ချက်ချင်းဆိုသလို၊ ဒုတိယပိုင်းတွင်) with crisp cadence. "
            "Keep Burmese clause endings clear and decisive to emphasize match chronology."
        )
    ),

    "football_news": PerformanceProfile(
        id="football_news",
        name="Sports News Presenter",
        name_mm="အားကစား သတင်းကြေညာသူ",
        category="FOOTBALL",
        energy="Medium",
        pacing="Medium",
        emotion="Controlled, objective, polished",
        emphasis="Clear emphasis on team names, scores, player transfers, injury updates, and official tables",
        pauses="Standard broadcast breath pauses between news headlines and paragraphs",
        pitch_variation="Controlled (formal broadcast inflection)",
        delivery="Authoritative television and radio sports bulletin presenter",
        speed_modifier=1.02,
        pitch_modifier="+0Hz",
        instructions=(
            "Deliver a professional sports news broadcast bulletin. "
            "Speak with the poise, clarity, and authority of an experienced sports desk anchor. "
            "Maintain a steady, measured pace with immaculate diction on names, numbers, and tournament standings. "
            "Convey journalistic confidence without exaggerated emotional outbursts or stadium shouting."
        ),
        burmese_guidance=(
            "Ensure precise tonal distinction on Burmese numbers, scores, and dates. "
            "Deliver formal Burmese news particles (ဖြစ်ပါသည်၊ တင်ပြလိုက်ပါသည်) with polished studio resonance."
        )
    ),

    # ==========================================
    # 2. EDUCATION & TEACHING PROFILES
    # ==========================================
    "edu_teacher": PerformanceProfile(
        id="edu_teacher",
        name="Education — Teacher",
        name_mm="ဆရာ/ဆရာမ သင်ကြားပြသမှုပုံစံ",
        category="EDUCATION",
        energy="Medium",
        pacing="Slow-Medium",
        emotion="Friendly, patient, warm, encouraging",
        emphasis="Intentional emphasis on core vocabulary, fundamental concepts, definitions, and study advice",
        pauses="Frequent pedagogic pauses allowing student comprehension and mental processing",
        pitch_variation="Warm and varied (encouraging classroom inflection)",
        delivery="Patient, nurturing classroom teaching that inspires attention and understanding",
        speed_modifier=0.92,
        pitch_modifier="+2Hz",
        instructions=(
            "Deliver a warm, supportive teacher presentation in a classroom setting. "
            "Speak at an unhurried, thoughtful pace with deliberate clarity. "
            "Frame explanations with genuine patience, inserting thoughtful micro-pauses after important definitions. "
            "Use encouraging vocal warmth that makes complex subjects accessible and engaging for learners. "
            "Avoid rapid rushed sentences or dry robotic repetition."
        ),
        burmese_guidance=(
            "Pronounce Burmese grammatical particles (ဆိုတာ၊ ဖြစ်ပါတယ်၊ နားလည်အောင်) gently and distinctly. "
            "Pause naturally after subject clauses and topical markers (ကတော့၊ မှာတော့) to aid cognitive absorption."
        )
    ),

    "edu_lecturer": PerformanceProfile(
        id="edu_lecturer",
        name="Education — University Lecturer",
        name_mm="တက္ကသိုလ် ပါမောက္ခ ဟောပြောပို့ချချက်",
        category="EDUCATION",
        energy="Medium",
        pacing="Medium",
        emotion="Scholarly, authoritative, intellectual, composed",
        emphasis="Heavy emphasis on theoretical frameworks, methodologies, research principles, and critical analysis",
        pauses="Deliberate rhetorical pauses before crucial deductions and between structural points",
        pitch_variation="Measured, dignified, and steady",
        delivery="Structured academic lecture delivery for university halls and professional seminars",
        speed_modifier=0.96,
        pitch_modifier="-2Hz",
        instructions=(
            "Deliver a formal academic lecture suitable for a university auditorium or professional symposium. "
            "Speak with intellectual depth, dignity, and measured authority. "
            "Structure your vocal progression so logical steps, theorems, and conclusions stand out clearly. "
            "Use deliberate rhetorical pacing to command respect and sustained intellectual focus. "
            "Keep the cadence disciplined, scholarly, and completely devoid of superficial hype."
        ),
        burmese_guidance=(
            "Articulate formal literary Burmese terminology (သဘောတရား၊ နည်းစနစ်၊ သုတေသန) with impeccable classical diction. "
            "End analytical sentences with firm, authoritative lower-register tones."
        )
    ),

    "edu_tutorial": PerformanceProfile(
        id="edu_tutorial",
        name="Education — Step-by-Step Tutorial",
        name_mm="အဆင့်ဆင့် လမ်းညွှန်ရှင်းပြချက်",
        category="EDUCATION",
        energy="Medium",
        pacing="Medium, steady",
        emotion="Friendly, helpful, pragmatic, clear",
        emphasis="Clear emphasis on action verbs, step numbers, software buttons, and practical tips",
        pauses="Step-by-step sequential pauses giving the listener time to execute actions",
        pitch_variation="Accessible, friendly, engaging",
        delivery="Step-by-step instructional walk-through for videos, tutorials, and practical demonstrations",
        speed_modifier=0.98,
        pitch_modifier="+1Hz",
        instructions=(
            "Deliver an instructional tutorial voiceover for a practical step-by-step guide. "
            "Break down instructions into crisp, easily digestible segments. "
            "Emphasize each step clearly: 'ပထမဆုံးအနေနဲ့', 'ဒုတိယအဆင့်', 'နောက်ဆုံးမှာ'. "
            "Sound like a knowledgeable and supportive mentor guiding the user through an unfamiliar tool or process. "
            "Keep the delivery approachable, practical, and reliably consistent."
        ),
        burmese_guidance=(
            "Accentuate ordinal Burmese words (ပထမ၊ ဒုတိယ၊ ပြီးတဲ့နောက်) with distinct upward cadence. "
            "Keep imperative instructions (နှိပ်ပါ၊ ဖွင့်ပါ၊ ရွေးချယ်ပါ) friendly yet definitive."
        )
    ),

    "edu_kids": PerformanceProfile(
        id="edu_kids",
        name="Education — Children Learning",
        name_mm="ကလေးသူငယ်များအတွက် သင်ကြားရေး",
        category="EDUCATION",
        energy="High",
        pacing="Slow-Medium",
        emotion="Playful, cheerful, gentle, vibrant",
        emphasis="Bright emphasis on colors, animals, alphabets, manners, and joyful discoveries",
        pauses="Generous pauses for childlike wonder and repetition",
        pitch_variation="High and animated (melodic nursery tone)",
        delivery="Gentle, animated, and captivating children's educational program host",
        speed_modifier=0.90,
        pitch_modifier="+4Hz",
        instructions=(
            "Deliver an animated, loving, and cheerful presentation for young children. "
            "Speak with joyful musicality, smiling warmth, and playful curiosity. "
            "Pronounce words slowly with vivid emotional colors to capture young imaginations. "
            "Make learning feel like a delightful, magical adventure filled with wonder and affection."
        ),
        burmese_guidance=(
            "Elongate vowels warmly on endearing Burmese terms (သားသား၊ မီးမီး၊ လိမ္မာတယ်နော်). "
            "Infuse interrogatives (ဟုတ်ပြီလားကွယ်၊ ဘာလေးလဲ) with an affectionate melodic lift."
        )
    ),

    # ==========================================
    # 3. ENTERTAINMENT & STORYTELLING PROFILES
    # ==========================================
    "ent_storyteller": PerformanceProfile(
        id="ent_storyteller",
        name="Entertainment — Storyteller",
        name_mm="ဇာတ်လမ်းပြော ရသစုံ သရုပ်ဖော်သူ",
        category="ENTERTAINMENT",
        energy="Variable (dynamic shifts)",
        pacing="Variable (adapts to narrative tension)",
        emotion="Immersive, evocative, nuanced, captivating",
        emphasis="Dramatically underscores sensory details, character choices, revelations, and story climaxes",
        pauses="Atmospheric dramatic pauses that create suspense, tension, and contemplation",
        pitch_variation="High (sweeping dynamic emotional range)",
        delivery="Spellbinding literary audiobook and folklore narration with multi-layered emotional textures",
        speed_modifier=0.94,
        pitch_modifier="+0Hz",
        instructions=(
            "Deliver an evocative, cinematic storytelling performance. "
            "Do NOT speak the entire text with uniform drama; dynamically mold your delivery to the prose: "
            "Open world-building scenes with serene, atmospheric presence; "
            "Build suspense by slowing your tempo and dropping into an intimate, hushed tone; "
            "Surge with breathless speed, volume, and urgency during conflicts or sudden revelations; "
            "Conclude emotional chapters with lingering, resonant poetic stillness. "
            "Transport the listener directly into the physical ambiance of the tale."
        ),
        burmese_guidance=(
            "Sustain Burmese resonant finals (ဥပမာ- ည၊ တိတ်ဆိတ်ခြင်း၊ လေပြေ) to evoke deep atmospheric mood. "
            "Modulate pitch gracefully across traditional Myanmar storytelling phrases (ဟိုးရှေးရှေးတုန်းက၊ တစ်ခါတုန်းက)."
        )
    ),

    "ent_dramatic": PerformanceProfile(
        id="ent_dramatic",
        name="Entertainment — Dramatic Voice",
        name_mm="ရုပ်ရှင်အသံထွက်နှင့် အထူးဇာတ်ဝင်ခန်း",
        category="ENTERTAINMENT",
        energy="High",
        pacing="Medium",
        emotion="Intense, weighty, gripping, profound",
        emphasis="Heavy emphasis on fate, conflict, destiny, sacrifice, and dramatic turning points",
        pauses="Deep, resonant theatrical pauses between striking declarations",
        pitch_variation="Deep with commanding crests",
        delivery="Movie trailer narrator and dramatic cinematic audio theater actor",
        speed_modifier=0.92,
        pitch_modifier="-4Hz",
        instructions=(
            "Deliver a gripping cinematic movie trailer and theatrical drama performance. "
            "Infuse every phrase with gravitational weight, resonant chest voice, and undeniable intensity. "
            "Deliver lines as if the destiny of worlds or high emotional stakes hang on every word. "
            "Allow silence and deep reverberant breath to carry the tension between declarations."
        ),
        burmese_guidance=(
            "Employ deep chest resonance on Burmese solemn words (သေခြင်း၊ ကံကြမ္မာ၊ အဆုံးအဖြတ်). "
            "Articulate glottal stops firmly to convey uncompromising dramatic finality."
        )
    ),

    "ent_podcast": PerformanceProfile(
        id="ent_podcast",
        name="Entertainment — Podcast Host",
        name_mm="ပေါ့ဒ်ကတ်စ် ရင်းနှီးဖော်ရွေသော အသံ",
        category="ENTERTAINMENT",
        energy="Medium",
        pacing="Conversational, natural",
        emotion="Authentic, approachable, candid, curious",
        emphasis="Conversational stress on personal insights, relatable questions, and intriguing thoughts",
        pauses="Spontaneous, authentic conversational breathing and micro-hesitations",
        pitch_variation="Natural conversational variety",
        delivery="Unhurried, intimate podcast conversation that feels like sitting down with a trusted friend",
        speed_modifier=1.00,
        pitch_modifier="+0Hz",
        instructions=(
            "Deliver a relaxed, organic podcast host conversation. "
            "Sound completely unscripted, warm, and personally connected to the listener. "
            "Speak as if you are sharing a cup of tea with an old friend, trading candid insights and genuine thoughts. "
            "Let your tone be comfortable, reflective, and warmly engaging without studio stiffness."
        ),
        burmese_guidance=(
            "Use natural colloquial Burmese connective terms (တကယ်တော့၊ ကျွန်တော်တို့သိတဲ့အတိုင်း၊ စဉ်းစားကြည့်ရင်). "
            "Inflect rhetorical questions (မဟုတ်ဘူးလား၊ ဟုတ်တယ်မလား) with conversational rising intonation."
        )
    ),

    "ent_character": PerformanceProfile(
        id="ent_character",
        name="Entertainment — Character Voice",
        name_mm="ကာတွန်းနှင့် ဂိမ်းဇာတ်ကောင် သရုပ်ဆောင်",
        category="ENTERTAINMENT",
        energy="High",
        pacing="Dynamic, agile",
        emotion="Quirky, vibrant, expressive, imaginative",
        emphasis="Eccentric emphasis on character catchphrases, exclamations, and witty reactions",
        pauses="Sharp, comedic, and unpredictable timing",
        pitch_variation="Very High (theatrical character range)",
        delivery="Colorful anime, gaming, and cartoon voice acting performance",
        speed_modifier=1.05,
        pitch_modifier="+3Hz",
        instructions=(
            "Deliver a colorful character acting voice for animation, comics, or gaming. "
            "Embody a distinctive fictional persona with heightened emotional color, agile pitch, and vivid personality. "
            "Bring boundless zest and imaginative flair to every sentence."
        ),
        burmese_guidance=(
            "Inject theatrical elasticity into playful Burmese interjections (ဟားဟား၊ အိုး၊ ကဲ၊ လာစမ်းပါ). "
            "Give dialogue tags lively, stylized personality."
        )
    ),

    # ==========================================
    # 4. BUSINESS & COMMERCIAL PROFILES
    # ==========================================
    "biz_ad": PerformanceProfile(
        id="biz_ad",
        name="Business — Commercial Advertisement",
        name_mm="စီးပွားရေး ကြော်ငြာနှင့် အရောင်းမြှင့်တင်ရေး",
        category="BUSINESS",
        energy="High",
        pacing="Medium-Fast",
        emotion="Confident, upbeat, persuasive, exciting",
        emphasis="Maximal emphasis on product benefits, promotional offers, discounts, brand names, and calls to action",
        pauses="Snappy, impactful pauses that let value propositions hit the listener instantly",
        pitch_variation="High and persuasive (marketing hook inflection)",
        delivery="High-conversion radio, TV, and digital marketing voiceover with captivating charm",
        speed_modifier=1.08,
        pitch_modifier="+2Hz",
        instructions=(
            "Deliver a high-energy commercial advertisement voiceover designed to convert and inspire action. "
            "Speak with sparkling confidence, persuasive charm, and infectious positivity. "
            "Spotlight core customer benefits, special discounts, and limited-time opportunities with crisp vocal punch. "
            "Drive home the call-to-action ('အခုပဲ ဆက်သွယ်လိုက်ပါ', 'လက်မလွတ်တမ်း ဝယ်ယူလိုက်ပါ') with unforgettable momentum."
        ),
        burmese_guidance=(
            "Deliver promotional Burmese phrases (အထူးအခွင့်အရေး၊ လက်မလွတ်တမ်း၊ အခုပဲ) with bright, punchy consonants. "
            "Elevate phone numbers and brand names with crisp, upbeat clarity."
        )
    ),

    "biz_corporate": PerformanceProfile(
        id="biz_corporate",
        name="Business — Corporate Presentation",
        name_mm="ကော်ပိုရိတ် တင်ဆက်မှုနှင့် စီးပွားရေးအစီရင်ခံစာ",
        category="BUSINESS",
        energy="Medium",
        pacing="Medium, measured",
        emotion="Polished, poised, trustworthy, visionary",
        emphasis="Careful emphasis on strategic milestones, quarterly metrics, executive visions, and investor confidence",
        pauses="Measured executive pauses reflecting preparation, control, and weight",
        pitch_variation="Controlled, polished, and steady",
        delivery="Executive boardroom keynote and annual investor report presentation",
        speed_modifier=0.98,
        pitch_modifier="-1Hz",
        instructions=(
            "Deliver an executive corporate presentation suitable for boardrooms, investor meetings, and industry summits. "
            "Radiate professional composure, strategic vision, and steady authority. "
            "Articulate corporate achievements and financial indicators with clarity, precision, and confidence. "
            "Maintain an impeccably polished tone that builds unshakeable stakeholder trust."
        ),
        burmese_guidance=(
            "Enunciate professional Burmese business terminology (မဟာဗျူဟာ၊ ရင်းနှီးမြှုပ်နှံမှု၊ တိုးတက်မှု) cleanly and evenly. "
            "Keep sentence terminations calm, grounded, and dignified."
        )
    ),

    "biz_product": PerformanceProfile(
        id="biz_product",
        name="Business — Product Showcase",
        name_mm="ထုတ်ကုန် မိတ်ဆက်နှင့် အသွင်အပြင်ရှင်းလင်းချက်",
        category="BUSINESS",
        energy="Medium-High",
        pacing="Medium",
        emotion="Enthusiastic, modern, sleek, premium",
        emphasis="Crisp emphasis on design elegance, breakthrough technology features, and user satisfaction",
        pauses="Refined pauses following feature highlights to let luxury/quality sink in",
        pitch_variation="Modern, sleek, and engaging",
        delivery="Premium tech product launch and luxury showcase voiceover",
        speed_modifier=1.02,
        pitch_modifier="+1Hz",
        instructions=(
            "Deliver an elegant product launch and showcase voiceover. "
            "Convey modern innovation, sleek refinement, and supreme craftsmanship. "
            "Highlight technological capabilities and user delights with passionate yet sophisticated pride."
        ),
        burmese_guidance=(
            "Pronounce technical terms and product names with crisp, modern cosmopolitan flair. "
            "Maintain a smooth, sleek cadence on descriptive Burmese adjectives (ခေတ်မီဆန်းသစ်သော၊ ပြိုင်ဘက်ကင်း)."
        )
    ),

    "biz_announcement": PerformanceProfile(
        id="biz_announcement",
        name="Business — Public Announcement",
        name_mm="တရားဝင် ကြေညာချက်နှင့် အသိပေးစကား",
        category="BUSINESS",
        energy="Medium",
        pacing="Medium, measured",
        emotion="Formal, authoritative, dignified, clear",
        emphasis="High clarity on dates, regulations, compliance guidelines, safety protocols, and public directives",
        pauses="Clear broadcast boundary pauses ensuring complete acoustic clarity in public spaces",
        pitch_variation="Dignified, serious, commanding",
        delivery="Official enterprise, airport, station, or governmental public address announcer",
        speed_modifier=0.95,
        pitch_modifier="-2Hz",
        instructions=(
            "Deliver an official formal public address announcement. "
            "Speak with solemn dignity, crystal-clear projection, and unmistakable civic authority. "
            "Ensure every rule, date, and directive is communicated with total transparency and grave responsibility."
        ),
        burmese_guidance=(
            "Honor formal Burmese public announcement structures (မိဘပြည်သူများခင်ဗျာ၊ လေးစားစွာဖြင့် အသိပေးအပ်ပါသည်). "
            "Pronounce every syllable with uncompromising clarity and formal resonance."
        )
    ),

    # ==========================================
    # 5. STANDARD FOUNDATIONAL PROFILES
    # ==========================================
    "standard_natural": PerformanceProfile(
        id="standard_natural",
        name="Standard Natural",
        name_mm="သဘာဝကျသော စကားပြော",
        category="STANDARD",
        energy="Medium",
        pacing="Natural, conversational",
        emotion="Balanced, friendly, clear",
        emphasis="Natural conversational stress",
        pauses="Authentic human conversational breathing pauses",
        pitch_variation="Natural everyday contour",
        delivery="Clear, balanced, everyday conversational Myanmar speech",
        speed_modifier=1.00,
        pitch_modifier="+0Hz",
        instructions="Speak naturally, articulately, and expressively in a clear Burmese conversational tone with authentic human pauses.",
        burmese_guidance="Honor natural Myanmar sentence rhythms, smooth tone transitions, and everyday spoken cadence."
    ),

    "standard_professional": PerformanceProfile(
        id="standard_professional",
        name="Standard Professional",
        name_mm="ကျွမ်းကျင် ရုံးသုံးပုံစံ",
        category="STANDARD",
        energy="Medium",
        pacing="Medium",
        emotion="Polished, formal, articulate",
        emphasis="Clear stress on important facts and key topics",
        pauses="Deliberate executive pauses",
        pitch_variation="Controlled and executive",
        delivery="Polished, formal executive delivery",
        speed_modifier=1.00,
        pitch_modifier="+0Hz",
        instructions="Speak in a formal, articulate, and professional executive tone with polished diction.",
        burmese_guidance="Maintain dignified Burmese sentence cadence with clear tonal differentiation."
    ),

    "standard_friendly": PerformanceProfile(
        id="standard_friendly",
        name="Standard Friendly",
        name_mm="ဖော်ရွေ ရင်းနှီးသောပုံစံ",
        category="STANDARD",
        energy="Medium-High",
        pacing="Medium",
        emotion="Warm, cheerful, welcoming",
        emphasis="Warm stress on welcoming remarks and positive expressions",
        pauses="Natural conversational pauses",
        pitch_variation="Warm, cheerful melody",
        delivery="Warm, approachable social and customer-facing delivery",
        speed_modifier=1.02,
        pitch_modifier="+1Hz",
        instructions="Speak warmly, cheerfully, and in an approachable and friendly tone.",
        burmese_guidance="Soften final consonants warmly and inflect welcoming particles cheerfully."
    ),

    "standard_calm": PerformanceProfile(
        id="standard_calm",
        name="Standard Calm & Soothing",
        name_mm="အေးချမ်း ငြိမ်သက်သောပုံစံ",
        category="STANDARD",
        energy="Low-Medium",
        pacing="Slow, serene",
        emotion="Peaceful, gentle, mindful, relaxed",
        emphasis="Gentle, soothing emphasis on relaxing thoughts and comforting ideas",
        pauses="Generous tranquil pauses for contemplation",
        pitch_variation="Soft, gentle, even",
        delivery="Soothing meditative and relaxing bedtime cadence",
        speed_modifier=0.88,
        pitch_modifier="-1Hz",
        instructions="Speak in a peaceful, gentle, soothing, and relaxing cadence with quiet warmth.",
        burmese_guidance="Elongate vowels softly, avoiding abrupt tone drops, maintaining serene tranquility."
    )
}


def get_profile(profile_id: str) -> PerformanceProfile:
    """Retrieve performance profile by ID, falling back to standard_natural."""
    cleaned = profile_id.strip().lower()
    return PERFORMANCE_PROFILES.get(cleaned, PERFORMANCE_PROFILES["standard_natural"])


def list_profiles(category: Optional[str] = None) -> List[PerformanceProfile]:
    """List all performance profiles, optionally filtered by category."""
    profiles = list(PERFORMANCE_PROFILES.values())
    if category:
        cat_upper = category.strip().upper()
        profiles = [p for p in profiles if p.category == cat_upper]
    return profiles

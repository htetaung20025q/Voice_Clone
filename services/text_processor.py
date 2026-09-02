import re
import unicodedata
from typing import List, Dict, Any

class MyanmarTextProcessor:
    """
    Intelligent Myanmar Unicode Text Normalizer, Syllable Segmenter, and Chunker.
    Provides robust preprocessing for Myanmar Text-to-Speech (TTS) models.
    """

    # Myanmar Unicode Ranges
    # Consonants: \u1000-\u1021
    # Independent vowels: \u1023-\u102A, \u104E
    # Medials: \u103B-\u103E
    # Dependent vowels: \u102B-\u1035
    # Tone marks / signs: \u1036-\u1038
    # Asat: \u103A
    # Virama / Stack: \u1039
    # Digits: \u1040-\u1049
    # Punctuation: \u104A-\u104F

    # Myanmar syllable break pattern
    # Splits before a consonant or independent vowel, provided it is NOT preceded by
    # a stacking virama (\u1039) or a medial/vowel/tone mark that doesn't terminate a syllable.
    SYLLABLE_BREAK_PATTERN = re.compile(
        r"(?<![\u1039])(?=[\u1000-\u1021\u1023-\u102A\u104E\u1040-\u1049])"
    )

    # Burmese sentence boundaries: ။ (pe-ma), ၊ (poke-ma), newlines, standard stops
    SENTENCE_SPLIT_PATTERN = re.compile(r"([။၊\n\r\.\?!]+)")

    @classmethod
    def normalize_unicode(cls, text: str) -> str:
        """
        Normalizes Myanmar Unicode text to NFC canonical form and cleans up
        invisible characters, zero-width spaces, and duplicate whitespace.
        """
        if not text:
            return ""

        # Normalize Unicode NFC
        normalized = unicodedata.normalize("NFC", text)

        # Remove zero-width non-breaking spaces and BOM
        normalized = normalized.replace("\ufeff", "").replace("\u200b", " ")
        normalized = normalized.replace("\u200c", "").replace("\u200d", "")

        # Standardize Myanmar punctuation
        normalized = re.sub(r"[။]{2,}", "။", normalized)
        normalized = re.sub(r"[၊]{2,}", "၊", normalized)
        
        # Replace multiple spaces with a single space
        normalized = re.sub(r"[ \t]+", " ", normalized)
        
        # Clean extra newlines
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)

        return normalized.strip()

    @classmethod
    def segment_syllables(cls, text: str) -> List[str]:
        """
        Segments Myanmar text into discrete syllables using phonetic rules.
        """
        normalized = cls.normalize_unicode(text)
        if not normalized:
            return []

        # Split words by space first
        words = normalized.split()
        all_syllables: List[str] = []

        for word in words:
            # Handle Kinzi (\u1004\u103A\u1039) - prevent splitting inside Kinzi
            # Replace Kinzi temporarily with a token
            kinzi_token = "__KINZI__"
            kinzi_map = {}
            kinzis = re.findall(r"\u1004\u103A\u1039[\u1000-\u1021]", word)
            for idx, k in enumerate(kinzis):
                token = f"{kinzi_token}{idx}__"
                kinzi_map[token] = k
                word = word.replace(k, token, 1)

            # Apply syllable boundary pattern
            parts = cls.SYLLABLE_BREAK_PATTERN.split(word)
            sylls = [p for p in parts if p]

            # Restore Kinzi
            restored_sylls = []
            for s in sylls:
                for token, original in kinzi_map.items():
                    s = s.replace(token, original)
                restored_sylls.append(s)

            all_syllables.extend(restored_sylls)

        return all_syllables

    @classmethod
    def count_syllables(cls, text: str) -> int:
        """Returns the total number of syllables in Myanmar text."""
        return len(cls.segment_syllables(text))

    @classmethod
    def chunk_text(cls, text: str, max_chunk_chars: int = 200) -> List[str]:
        """
        Breaks long Myanmar text into natural phrase/sentence chunks suitable
        for smooth TTS synthesis and natural prosody pauses.
        """
        normalized = cls.normalize_unicode(text)
        if not normalized:
            return []

        # Split by sentence delimiters while keeping delimiters
        raw_parts = cls.SENTENCE_SPLIT_PATTERN.split(normalized)
        
        # Combine sentence with its delimiter
        sentences: List[str] = []
        i = 0
        while i < len(raw_parts):
            part = raw_parts[i].strip()
            if part:
                if i + 1 < len(raw_parts) and cls.SENTENCE_SPLIT_PATTERN.match(raw_parts[i + 1]):
                    delim = raw_parts[i + 1].strip()
                    sentences.append(f"{part} {delim}")
                    i += 2
                else:
                    sentences.append(part)
                    i += 1
            else:
                i += 1

        # Group sentences into bounded chunks
        chunks: List[str] = []
        current_chunk = ""

        for sent in sentences:
            if not current_chunk:
                current_chunk = sent
            elif len(current_chunk) + len(sent) + 1 <= max_chunk_chars:
                current_chunk += " " + sent
            else:
                chunks.append(current_chunk.strip())
                current_chunk = sent

        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks if chunks else [normalized]

    @classmethod
    def analyze_text(cls, text: str) -> Dict[str, Any]:
        """
        Performs full statistical and phonetic analysis on Myanmar text.
        """
        cleaned = cls.normalize_unicode(text)
        syllables = cls.segment_syllables(cleaned)
        chunks = cls.chunk_text(cleaned)

        return {
            "original_length": len(text),
            "cleaned_length": len(cleaned),
            "syllable_count": len(syllables),
            "word_count": len(cleaned.split()),
            "chunk_count": len(chunks),
            "chunks": chunks,
            "sample_syllables": syllables[:10],
            "cleaned_text": cleaned
        }

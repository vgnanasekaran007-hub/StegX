"""
StegX Text Steganography Engine
Methods: Whitespace, Unicode, Zero-Width Characters, Character Encoding, Synonym Replacement
"""
import re


# Zero-width characters
ZWS = '\u200b'   # Zero Width Space
ZWNJ = '\u200c'  # Zero Width Non-Joiner
ZWJ = '\u200d'   # Zero Width Joiner
ZWSP = '\ufeff'   # Zero Width No-Break Space

ZW_CHARS = {
    '00': ZWS,
    '01': ZWNJ,
    '10': ZWJ,
    '11': ZWSP,
}
ZW_REVERSE = {v: k for k, v in ZW_CHARS.items()}


def _text_to_bits(text: str) -> str:
    """Convert text to binary string."""
    return ''.join(format(byte, '08b') for byte in text.encode('utf-8'))


def _bits_to_text(bits: str) -> str:
    """Convert binary string back to text."""
    byte_list = []
    for i in range(0, len(bits), 8):
        chunk = bits[i:i+8]
        if len(chunk) == 8:
            byte_list.append(int(chunk, 2))
    return bytes(byte_list).decode('utf-8', errors='replace')


# ============================================================
# Whitespace Method
# ============================================================

class WhitespaceSteg:
    """Hide data using trailing whitespace (tabs and spaces) at end of lines."""

    @staticmethod
    def hide(cover_text: str, secret_text: str) -> str:
        """Hide secret text using trailing whitespace."""
        bits = _text_to_bits(secret_text)
        lines = cover_text.split('\n')

        if len(bits) > len(lines) * 8:
            raise ValueError(
                f"Secret text too long for cover. Need {len(bits)} bits, "
                f"have {len(lines) * 8} bits capacity."
            )

        result_lines = []
        bit_idx = 0

        for line in lines:
            stripped = line.rstrip()
            trailing = ''
            # Encode up to 8 bits per line
            for _ in range(8):
                if bit_idx < len(bits):
                    if bits[bit_idx] == '1':
                        trailing += '\t'
                    else:
                        trailing += ' '
                    bit_idx += 1
            result_lines.append(stripped + trailing)

        # Add length marker as first line's leading content (invisible)
        length_marker = f"{ZWS}{len(secret_text.encode('utf-8'))}{ZWS}"
        if result_lines:
            result_lines[0] = length_marker + result_lines[0]

        return '\n'.join(result_lines)

    @staticmethod
    def extract(stego_text: str) -> str:
        """Extract hidden text from trailing whitespace."""
        lines = stego_text.split('\n')

        # Extract length from marker
        first_line = lines[0] if lines else ""
        length = None
        if ZWS in first_line:
            parts = first_line.split(ZWS)
            for part in parts:
                if part.isdigit():
                    length = int(part)
                    break

        bits = []
        for line in lines:
            # Remove the ZWS markers from first line
            cleaned = line.replace(ZWS, '')
            content = cleaned.rstrip()
            trailing = line[len(content):]
            # Remove ZWS markers from trailing too
            trailing = trailing.replace(ZWS, '')

            for char in trailing:
                if char == '\t':
                    bits.append('1')
                elif char == ' ':
                    bits.append('0')

        text = _bits_to_text(''.join(bits))
        if length:
            return text[:length]
        return text.rstrip('\x00')


# ============================================================
# Unicode Homoglyph Method
# ============================================================

class UnicodeSteg:
    """Hide data using Unicode homoglyph substitution."""

    # Homoglyphs: ASCII char -> Unicode look-alike
    HOMOGLYPHS = {
        'a': '\u0430',  # Cyrillic а
        'c': '\u0441',  # Cyrillic с
        'e': '\u0435',  # Cyrillic е
        'o': '\u043e',  # Cyrillic о
        'p': '\u0440',  # Cyrillic р
        's': '\u0455',  # Cyrillic ѕ
        'x': '\u0445',  # Cyrillic х
        'y': '\u0443',  # Cyrillic у
        'i': '\u0456',  # Cyrillic і
        'A': '\u0410',  # Cyrillic А
        'B': '\u0412',  # Cyrillic В
        'C': '\u0421',  # Cyrillic С
        'E': '\u0415',  # Cyrillic Е
        'H': '\u041d',  # Cyrillic Н
        'K': '\u041a',  # Cyrillic К
        'M': '\u041c',  # Cyrillic М
        'O': '\u041e',  # Cyrillic О
        'P': '\u0420',  # Cyrillic Р
        'T': '\u0422',  # Cyrillic Т
        'X': '\u0425',  # Cyrillic Х
    }
    REVERSE_HOMOGLYPHS = {v: k for k, v in HOMOGLYPHS.items()}

    @staticmethod
    def hide(cover_text: str, secret_text: str) -> str:
        """Hide secret by replacing characters with homoglyphs where bit=1."""
        bits = _text_to_bits(secret_text)
        result = list(cover_text)

        # Find replaceable positions
        replaceable = []
        for i, char in enumerate(result):
            if char in UnicodeSteg.HOMOGLYPHS:
                replaceable.append(i)

        if len(bits) > len(replaceable):
            raise ValueError(
                f"Secret text too long. Need {len(bits)} replaceable chars, "
                f"found {len(replaceable)}."
            )

        # Add length prefix using zero-width chars
        length_bits = format(len(secret_text.encode('utf-8')), '032b')
        for i in range(min(32, len(replaceable))):
            if length_bits[i] == '1':
                result[replaceable[i]] = UnicodeSteg.HOMOGLYPHS[result[replaceable[i]]]

        # Encode data after length prefix
        for i in range(len(bits)):
            pos = replaceable[32 + i] if 32 + i < len(replaceable) else None
            if pos is None:
                break
            if bits[i] == '1':
                original_char = cover_text[pos]
                if original_char in UnicodeSteg.HOMOGLYPHS:
                    result[pos] = UnicodeSteg.HOMOGLYPHS[original_char]

        return ''.join(result)

    @staticmethod
    def extract(stego_text: str) -> str:
        """Extract hidden text by detecting homoglyphs."""
        bits = []
        for char in stego_text:
            if char in UnicodeSteg.REVERSE_HOMOGLYPHS:
                bits.append('1')
            elif char in UnicodeSteg.HOMOGLYPHS:
                bits.append('0')

        if len(bits) < 32:
            raise ValueError("Not enough data to extract")

        # First 32 bits are length
        length_bits = ''.join(bits[:32])
        length = int(length_bits, 2)

        data_bits = ''.join(bits[32:])
        text = _bits_to_text(data_bits)
        return text[:length]


# ============================================================
# Zero-Width Character Method
# ============================================================

class ZeroWidthSteg:
    """Hide data using zero-width Unicode characters inserted between visible text."""

    @staticmethod
    def hide(cover_text: str, secret_text: str) -> str:
        """Hide secret text using zero-width characters."""
        bits = _text_to_bits(secret_text)

        # Add length header (32 bits)
        length_bits = format(len(secret_text.encode('utf-8')), '032b')
        all_bits = length_bits + bits

        # Encode as pairs of bits -> zero-width chars
        zw_sequence = ''
        for i in range(0, len(all_bits), 2):
            pair = all_bits[i:i+2]
            if len(pair) < 2:
                pair = pair + '0'
            zw_sequence += ZW_CHARS.get(pair, ZWS)

        # Insert zero-width chars after the first character
        if len(cover_text) > 0:
            return cover_text[0] + zw_sequence + cover_text[1:]
        return zw_sequence + cover_text

    @staticmethod
    def extract(stego_text: str) -> str:
        """Extract hidden text from zero-width characters."""
        bits = []
        for char in stego_text:
            if char in ZW_REVERSE:
                bits.append(ZW_REVERSE[char])

        if not bits:
            raise ValueError("No zero-width characters found")

        all_bits = ''.join(bits)

        if len(all_bits) < 32:
            raise ValueError("Not enough data to extract length header")

        length = int(all_bits[:32], 2)
        data_bits = all_bits[32:]
        text = _bits_to_text(data_bits)
        return text[:length]


# ============================================================
# Character Encoding Method
# ============================================================

class CharEncodingSteg:
    """Hide data using alternate character encodings (full-width chars)."""

    @staticmethod
    def hide(cover_text: str, secret_text: str) -> str:
        """Hide by converting some chars to full-width Unicode equivalents."""
        bits = _text_to_bits(secret_text)

        # Find ASCII characters that can be converted to full-width
        replaceable = []
        result = list(cover_text)
        for i, char in enumerate(result):
            if 0x21 <= ord(char) <= 0x7E:
                replaceable.append(i)

        length_bits = format(len(secret_text.encode('utf-8')), '032b')
        all_bits = length_bits + bits

        if len(all_bits) > len(replaceable):
            raise ValueError("Secret text too long for cover text capacity")

        for i in range(len(all_bits)):
            if all_bits[i] == '1':
                pos = replaceable[i]
                # Convert ASCII to full-width Unicode (0xFF01-0xFF5E)
                ascii_val = ord(result[pos])
                fullwidth = chr(ascii_val - 0x21 + 0xFF01)
                result[pos] = fullwidth

        return ''.join(result)

    @staticmethod
    def extract(stego_text: str) -> str:
        """Extract by detecting full-width characters."""
        bits = []
        for char in stego_text:
            code = ord(char)
            if 0xFF01 <= code <= 0xFF5E:
                bits.append('1')
            elif 0x21 <= code <= 0x7E:
                bits.append('0')

        if len(bits) < 32:
            raise ValueError("Not enough data to extract")

        length = int(''.join(bits[:32]), 2)
        data_bits = ''.join(bits[32:])
        text = _bits_to_text(data_bits)
        return text[:length]


# ============================================================
# Synonym Replacement Method
# ============================================================

class SynonymSteg:
    """Hide data by replacing words with synonyms."""

    # Simple synonym pairs (word -> synonym)
    SYNONYMS = {
        'big': 'large', 'small': 'little', 'fast': 'quick', 'slow': 'sluggish',
        'happy': 'joyful', 'sad': 'unhappy', 'good': 'great', 'bad': 'terrible',
        'begin': 'start', 'end': 'finish', 'help': 'assist', 'hard': 'difficult',
        'easy': 'simple', 'rich': 'wealthy', 'poor': 'needy', 'old': 'ancient',
        'new': 'fresh', 'hot': 'warm', 'cold': 'chilly', 'nice': 'pleasant',
        'ugly': 'hideous', 'smart': 'clever', 'dumb': 'foolish', 'brave': 'courageous',
        'scared': 'afraid', 'strong': 'powerful', 'weak': 'feeble', 'clean': 'pure',
        'dirty': 'filthy', 'quiet': 'silent', 'loud': 'noisy', 'dark': 'dim',
        'bright': 'radiant', 'thin': 'slim', 'thick': 'dense', 'wet': 'damp',
        'dry': 'arid', 'full': 'complete', 'empty': 'vacant', 'real': 'genuine',
        'fake': 'counterfeit', 'true': 'correct', 'false': 'incorrect',
        'angry': 'furious', 'calm': 'peaceful', 'wild': 'untamed',
    }
    REVERSE_SYNONYMS = {v: k for k, v in SYNONYMS.items()}

    @staticmethod
    def hide(cover_text: str, secret_text: str) -> str:
        """Hide by selectively replacing words with synonyms."""
        bits = _text_to_bits(secret_text)
        words = cover_text.split()

        # Find replaceable words
        replaceable = []
        for i, word in enumerate(words):
            clean = word.strip('.,!?;:').lower()
            if clean in SynonymSteg.SYNONYMS:
                replaceable.append(i)

        length_bits = format(len(secret_text.encode('utf-8')), '032b')
        all_bits = length_bits + bits

        if len(all_bits) > len(replaceable):
            raise ValueError(
                f"Not enough replaceable words. Need {len(all_bits)}, found {len(replaceable)}."
            )

        for i in range(len(all_bits)):
            if all_bits[i] == '1':
                pos = replaceable[i]
                word = words[pos]
                clean = word.strip('.,!?;:').lower()
                prefix = ''
                suffix = ''
                # Preserve punctuation
                for c in word:
                    if c.isalpha():
                        break
                    prefix += c
                for c in reversed(word):
                    if c.isalpha():
                        break
                    suffix = c + suffix

                replacement = SynonymSteg.SYNONYMS.get(clean, clean)
                if word[len(prefix)] if prefix else word[0] == word[0].upper() if word else False:
                    replacement = replacement.capitalize()
                words[pos] = prefix + replacement + suffix

        return ' '.join(words)

    @staticmethod
    def extract(stego_text: str) -> str:
        """Extract by detecting synonym replacements."""
        words = stego_text.split()
        bits = []

        for word in words:
            clean = word.strip('.,!?;:').lower()
            if clean in SynonymSteg.REVERSE_SYNONYMS:
                bits.append('1')
            elif clean in SynonymSteg.SYNONYMS:
                bits.append('0')

        if len(bits) < 32:
            raise ValueError("Not enough data to extract")

        length = int(''.join(bits[:32]), 2)
        data_bits = ''.join(bits[32:])
        text = _bits_to_text(data_bits)
        return text[:length]


# ============================================================
# Auto-detect
# ============================================================

def auto_detect_method(stego_text: str) -> str:
    """Try to detect which method was used."""
    # Check for zero-width characters
    zw_chars_found = sum(1 for c in stego_text if c in ZW_REVERSE)
    if zw_chars_found > 5:
        return "zero_width"

    # Check for full-width characters
    fw_count = sum(1 for c in stego_text if 0xFF01 <= ord(c) <= 0xFF5E)
    if fw_count > 5:
        return "char_encoding"

    # Check for homoglyphs
    homoglyph_count = sum(1 for c in stego_text if c in UnicodeSteg.REVERSE_HOMOGLYPHS)
    if homoglyph_count > 5:
        return "unicode"

    # Check for synonym replacements
    words = stego_text.split()
    synonym_count = sum(1 for w in words
                        if w.strip('.,!?;:').lower() in SynonymSteg.REVERSE_SYNONYMS)
    if synonym_count > 3:
        return "synonym"

    # Default: try whitespace
    return "whitespace"


def text_extract(stego_text: str, method: str = None) -> str:
    """Extract text using specified or auto-detected method."""
    if method is None:
        method = auto_detect_method(stego_text)

    extractors = {
        "whitespace": WhitespaceSteg.extract,
        "unicode": UnicodeSteg.extract,
        "zero_width": ZeroWidthSteg.extract,
        "char_encoding": CharEncodingSteg.extract,
        "synonym": SynonymSteg.extract,
    }

    extractor = extractors.get(method)
    if extractor is None:
        raise ValueError(f"Unknown method: {method}")
    return extractor(stego_text)

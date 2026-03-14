/**
 * MyMemory free translation API wrapper.
 * No API key required. CORS-friendly. Rate limit: ~100 words/second per IP.
 * Falls back to the original text on any error.
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> {
  if (!text.trim() || sourceLang === targetLang) return text;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const response = await fetch(url);
    if (!response.ok) return text;
    const data = (await response.json()) as { responseData?: { translatedText?: string } };
    const translated = data.responseData?.translatedText;
    // MyMemory sometimes echoes the source or returns "INVALID_LANGUAGE_PAIR"
    if (!translated || translated === text || translated.includes("INVALID_LANGUAGE_PAIR")) {
      return text;
    }
    return translated;
  } catch {
    return text;
  }
}

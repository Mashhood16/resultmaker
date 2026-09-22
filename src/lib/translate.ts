export async function translateToUrdu(text: string): Promise<string> {
  if (!text) return text
  try {
    // Pre-process common abbreviations
    let processedText = text;
    // Replace "M." or "M " at the start or middle with "Muhammad"
    processedText = processedText.replace(/\bM\.\s*/gi, 'Muhammad ');
    processedText = processedText.replace(/^M\s+/gi, 'Muhammad ');

    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ur&dt=t&q=${encodeURIComponent(processedText)}`);
    const data = await res.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // fallback to English
  }
}

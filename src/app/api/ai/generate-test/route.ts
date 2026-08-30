import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const { topic, difficulty, className, subjectName, totalMarks, marksPerQuestion } = await req.json()

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const tMarks = parseInt(totalMarks) || 15
    const marksPerQ = parseFloat(marksPerQuestion) || 5
    const numQuestions = Math.max(1, Math.floor(tMarks / marksPerQ))

    const prompt = `You are an expert test creator. Generate a test for class ${className || 'Unknown'} of ${tMarks} marks for the subject ${subjectName || 'Unknown'} based on FBISE curriculum.
Topic: "${topic}"
Create exactly ${numQuestions} multiple-choice questions. Each question carries ${marksPerQ} marks. The difficulty level should be ${difficulty || 'medium'}.
    
Format the output as clean HTML. Do NOT include Markdown code block formatting (\`\`\`html). Use the following structure:
<div class="test-container space-y-6">
  <div class="question-block border p-4 rounded-md">
    <h3 class="text-lg font-semibold">1. [Question Text]</h3>
    <ul class="options-list mt-2 space-y-2">
      <li><label><input type="radio" name="q1" value="A"> A) [Option A]</label></li>
      <li><label><input type="radio" name="q1" value="B"> B) [Option B]</label></li>
      <li><label><input type="radio" name="q1" value="C"> C) [Option C]</label></li>
      <li><label><input type="radio" name="q1" value="D"> D) [Option D]</label></li>
    </ul>
    <div class="answer-key hidden text-green-600 font-bold mt-2">Correct Answer: [Correct Letter]</div>
  </div>
  ...
</div>`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    })

    let html = response.text || ''
    // Clean up if it returned markdown
    if (html.startsWith('```html')) html = html.substring(7)
    if (html.startsWith('```')) html = html.substring(3)
    if (html.endsWith('```')) html = html.substring(0, html.length - 3)
    html = html.trim()

    return NextResponse.json({ html })
  } catch (error) {
    console.error('AI Test Generation Error:', error)
    return NextResponse.json({ error: 'Failed to generate test' }, { status: 500 })
  }
}

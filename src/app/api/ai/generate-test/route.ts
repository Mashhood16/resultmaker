import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GoogleGenAI } from '@google/genai'

// In-memory rate limiting for AI test generation (10 requests per 5 minutes per user)
const testGenRateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkAIGenRateLimit(userId: string): boolean {
  const now = Date.now()
  const record = testGenRateLimitMap.get(userId)
  if (!record || record.resetAt <= now) {
    testGenRateLimitMap.set(userId, { count: 1, resetAt: now + 5 * 60 * 1000 })
    return true
  }
  if (record.count >= 10) {
    return false
  }
  record.count += 1
  return true
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'teacher' && session.user.role !== 'school' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden: Teacher access required.' }, { status: 403 })
  }

  if (!checkAIGenRateLimit(session.user.id)) {
    return NextResponse.json({ error: 'Rate limit exceeded. You can generate up to 10 tests every 5 minutes.' }, { status: 429 })
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const { 
      topic, difficulty, className, subjectName, 
      numMcqs, marksPerMcq,
      numShortQs, marksPerShortQ,
      numLongQs, marksPerLongQ 
    } = await req.json()

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0 || topic.length > 500) {
      return NextResponse.json({ error: 'Topic is required and must be between 1 and 500 characters.' }, { status: 400 })
    }

    const mcqCount = Math.max(0, parseInt(numMcqs) || 0)
    const shortCount = Math.max(0, parseInt(numShortQs) || 0)
    const longCount = Math.max(0, parseInt(numLongQs) || 0)

    if (mcqCount > 50 || shortCount > 30 || longCount > 20) {
      return NextResponse.json({ error: 'Question counts exceed allowed maximums (50 MCQs, 30 Short Qs, 20 Long Qs).' }, { status: 400 })
    }

    if (mcqCount === 0 && shortCount === 0 && longCount === 0) {
      return NextResponse.json({ error: 'At least one question section must have a count greater than zero.' }, { status: 400 })
    }

    const safeMarksPerMcq = Math.min(Math.max(0.5, parseFloat(marksPerMcq || '1')), 50)
    const safeMarksPerShortQ = Math.min(Math.max(0.5, parseFloat(marksPerShortQ || '3')), 50)
    const safeMarksPerLongQ = Math.min(Math.max(0.5, parseFloat(marksPerLongQ || '5')), 50)

    const totalMarks = (mcqCount * safeMarksPerMcq) + 
                       (shortCount * safeMarksPerShortQ) + 
                       (longCount * safeMarksPerLongQ)

    const prompt = `You are an expert test creator. Generate a test for class ${className || 'Unknown'} of ${totalMarks} total marks for the subject ${subjectName || 'Unknown'} based on FBISE curriculum.
Topic: "${topic}"

The test must contain the following sections based exactly on these requirements:
${mcqCount > 0 ? `- Section A: ${mcqCount} Multiple-Choice Questions (${marksPerMcq} marks each)` : ''}
${shortCount > 0 ? `- Section B: ${shortCount} Short Answer Questions (${marksPerShortQ} marks each)` : ''}
${longCount > 0 ? `- Section C: ${longCount} Long Answer Questions (${marksPerLongQ} marks each)` : ''}

For each question, display the marks next to it, e.g., "[5 Marks]". The difficulty level should be ${difficulty || 'medium'}.
    
Format the output as clean HTML. Do NOT include Markdown code block formatting (\`\`\`html). Use the following structure:
<div class="test-container space-y-8">
  ${mcqCount > 0 ? `
  <div class="section-block">
    <h2 class="text-xl font-bold mb-4 border-b pb-2">Section A: Multiple Choice Questions</h2>
    <div class="space-y-6">
      <div class="question-block border p-4 rounded-md">
        <h3 class="text-lg font-semibold flex justify-between">
          <span>1. [Question Text]</span>
          <span class="text-sm font-normal text-muted-foreground">[${marksPerMcq} Marks]</span>
        </h3>
        <ul class="options-list mt-2 space-y-2">
          <li><label><input type="radio" name="q1" value="A"> A) [Option A]</label></li>
          <li><label><input type="radio" name="q1" value="B"> B) [Option B]</label></li>
          <li><label><input type="radio" name="q1" value="C"> C) [Option C]</label></li>
          <li><label><input type="radio" name="q1" value="D"> D) [Option D]</label></li>
        </ul>
        <div class="answer-key hidden text-green-600 font-bold mt-2">Correct Answer: [Correct Letter]</div>
      </div>
      ...
    </div>
  </div>` : ''}

  ${shortCount > 0 ? `
  <div class="section-block mt-8">
    <h2 class="text-xl font-bold mb-4 border-b pb-2">Section B: Short Answer Questions</h2>
    <div class="space-y-6">
      <div class="question-block border p-4 rounded-md">
        <h3 class="text-lg font-semibold flex justify-between">
          <span>1. [Question Text]</span>
          <span class="text-sm font-normal text-muted-foreground">[${marksPerShortQ} Marks]</span>
        </h3>
        <div class="mt-4 border-b border-dashed border-gray-300 pb-8"></div>
        <div class="answer-key hidden text-green-600 font-bold mt-2">Expected Answer: [Brief explanation]</div>
      </div>
      ...
    </div>
  </div>` : ''}

  ${longCount > 0 ? `
  <div class="section-block mt-8">
    <h2 class="text-xl font-bold mb-4 border-b pb-2">Section C: Long Answer Questions</h2>
    <div class="space-y-6">
      <div class="question-block border p-4 rounded-md">
        <h3 class="text-lg font-semibold flex justify-between">
          <span>1. [Question Text]</span>
          <span class="text-sm font-normal text-muted-foreground">[${marksPerLongQ} Marks]</span>
        </h3>
        <div class="mt-4 border-b border-dashed border-gray-300 pb-24"></div>
        <div class="answer-key hidden text-green-600 font-bold mt-2">Expected Answer: [Detailed points]</div>
      </div>
      ...
    </div>
  </div>` : ''}
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

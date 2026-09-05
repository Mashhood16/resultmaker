import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'teacher' && session.user.role !== 'school' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden: Teacher access required.' }, { status: 403 })
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    const { imageUrl, textAnswers, totalMarks, testTitle, questionPaper, rubric } = await req.json()

    if (!imageUrl && !textAnswers) {
      return NextResponse.json({ error: 'Image URL or text answers required' }, { status: 400 })
    }

    const prompt = `You are a strict but fair AI teacher. You are grading a student's submission for the test: "${testTitle}". The total marks available for this test are ${totalMarks}.
${questionPaper ? `\nHere is the original Question Paper (HTML format) that the student is answering. You MUST use this to determine the maximum marks available for each question and the correct context:\n--- QUESTION PAPER ---\n${questionPaper}\n----------------------\n` : ''}
${rubric ? `\nPlease strictly follow this grading rubric / answer key:\n${rubric}\n` : ''}
Carefully analyze their answers${textAnswers ? ' provided below:' : ' in the attached image.'}
${textAnswers ? `\n--- STUDENT ANSWERS ---\n${textAnswers}\n-----------------------\n` : ''}

Provide your evaluation. Grade EACH question individually. Provide the marks and exactly ONE sentence of feedback in Roman Urdu for each question. If you deduct marks for a question, your one-sentence feedback MUST explicitly explain the specific mistake or missing information that caused the deduction. Also provide an overall total and a short overall summary in Roman Urdu.

Provide your evaluation in JSON format exactly like this (do NOT use markdown \`\`\`json block):
{
  "obtainedMarks": [integer],
  "overallFeedback": "[A very short (1-2 sentences max) feedback in Roman Urdu summarizing overall performance]",
  "questionBreakdown": [
    { "marks": [integer], "feedback": "[One sentence Roman Urdu feedback. If marks were deducted, strictly explain WHY.]" }
  ]
}`

    const contents: any[] = [prompt]

    if (imageUrl) {
      // Validate imageUrl to prevent SSRF
      let parsedUrl: URL
      try {
        parsedUrl = new URL(imageUrl)
      } catch {
        return NextResponse.json({ error: 'Invalid image URL format.' }, { status: 400 })
      }

      if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'res.cloudinary.com') {
        return NextResponse.json({ error: 'Forbidden: Image must be hosted on res.cloudinary.com.' }, { status: 400 })
      }

      // Fetch image from Cloudinary to pass to Gemini
      const imageResp = await fetch(imageUrl)
      if (!imageResp.ok) throw new Error('Failed to fetch image')
      
      const arrayBuffer = await imageResp.arrayBuffer()
      const base64Data = Buffer.from(arrayBuffer).toString('base64')
      const mimeType = imageResp.headers.get('content-type') || 'image/jpeg'

      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      })
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            obtainedMarks: { type: 'INTEGER', description: "The final total score as a whole number without decimals" },
            overallFeedback: { type: 'STRING', description: "A very short (1-2 sentences) overall feedback in Roman Urdu" },
            questionBreakdown: {
              type: 'ARRAY',
              description: "An array containing the marks and feedback for each individual question",
              items: {
                type: 'OBJECT',
                properties: {
                  marks: { type: 'INTEGER', description: "Marks awarded for this question" },
                  feedback: { type: 'STRING', description: "One sentence of feedback in Roman Urdu for this specific question. MUST explain deductions if any." }
                },
                required: ["marks", "feedback"]
              }
            }
          },
          required: ["obtainedMarks", "overallFeedback", "questionBreakdown"]
        }
      }
    })

    const result = JSON.parse(response.text || '{}')

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI Grading Error:', error)
    return NextResponse.json({ error: 'Failed to grade submission' }, { status: 500 })
  }
}

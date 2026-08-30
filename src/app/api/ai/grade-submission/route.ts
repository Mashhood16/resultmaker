import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { imageUrl, textAnswers, totalMarks, testTitle } = await req.json()

    if (!imageUrl && !textAnswers) {
      return NextResponse.json({ error: 'Image URL or text answers required' }, { status: 400 })
    }

    const prompt = `You are a strict but fair AI teacher. You are grading a student's submission for the test: "${testTitle}". The total marks available for this test are ${totalMarks}.
    
Carefully analyze their answers${textAnswers ? ' provided below:' : ' in the attached image.'}
${textAnswers ? `\n--- STUDENT ANSWERS ---\n${textAnswers}\n-----------------------\n` : ''}

Provide your evaluation in JSON format exactly like this (do NOT use markdown \`\`\`json block):
{
  "obtainedMarks": [number],
  "feedback": "[A short, encouraging paragraph summarizing what they got right and where they made mistakes]"
}`

    const contents: any[] = [prompt]

    if (imageUrl) {
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
        responseMimeType: 'application/json'
      }
    })

    const result = JSON.parse(response.text || '{}')

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI Grading Error:', error)
    return NextResponse.json({ error: 'Failed to grade submission' }, { status: 500 })
  }
}

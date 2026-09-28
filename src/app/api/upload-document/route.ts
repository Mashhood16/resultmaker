import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { auth } from '@/auth'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// In-memory rate limiting for document uploads (30 requests per minute per user)
const uploadRateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkUploadRateLimit(userId: string): boolean {
  const now = Date.now()
  const record = uploadRateLimitMap.get(userId)
  if (!record || record.resetAt <= now) {
    uploadRateLimitMap.set(userId, { count: 1, resetAt: now + 60 * 1000 })
    return true
  }
  if (record.count >= 30) {
    return false
  }
  record.count += 1
  return true
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'teacher' && session.user.role !== 'school' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges to upload files.' }, { status: 403 })
  }

  if (!checkUploadRateLimit(session.user.id)) {
    return NextResponse.json({ error: 'Rate limit exceeded. You can upload up to 30 files per minute.' }, { status: 429 })
  }

  try {
    const { file, fileName } = await req.json()
    if (!file || typeof file !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing file payload' }, { status: 400 })
    }

    // Limit payload size to ~20MB for documents (since Base64 adds 33% overhead, this is around 15MB file)
    if (file.length > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds maximum allowable size (15MB)' }, { status: 413 })
    }

    // Upload to Cloudinary with resource_type auto to handle PDFs and docs
    const uploadResponse = await cloudinary.uploader.upload(file, {
      folder: 'resultmaker_materials',
      resource_type: 'auto',
      public_id: fileName ? fileName.replace(/\.[^/.]+$/, "") : undefined // Use original name without extension if provided
    })

    return NextResponse.json({ 
      url: uploadResponse.secure_url, 
      format: uploadResponse.format || 'unknown',
      resource_type: uploadResponse.resource_type
    })
  } catch (error) {
    console.error('Upload Error:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}

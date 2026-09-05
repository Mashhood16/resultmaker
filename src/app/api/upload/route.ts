import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { auth } from '@/auth'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// In-memory rate limiting for image uploads (30 requests per minute per user)
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
    return NextResponse.json({ error: 'Rate limit exceeded. You can upload up to 30 images per minute.' }, { status: 429 })
  }

  try {
    const { image } = await req.json()
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing image payload' }, { status: 400 })
    }

    // Limit payload size to ~5MB
    if (image.length > 7 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image exceeds maximum allowable size (5MB)' }, { status: 413 })
    }

    // Validate that the image is a valid data URL with allowed MIME types
    const validMimePrefixes = [
      'data:image/jpeg;base64,',
      'data:image/png;base64,',
      'data:image/webp;base64,',
      'data:image/gif;base64,'
    ]
    if (!validMimePrefixes.some(prefix => image.startsWith(prefix))) {
      return NextResponse.json({ error: 'Invalid image format. Expected JPEG, PNG, WebP, or GIF data URL.' }, { status: 400 })
    }

    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'resultmaker_grading'
    })

    return NextResponse.json({ url: uploadResponse.secure_url })
  } catch (error) {
    console.error('Upload Error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}

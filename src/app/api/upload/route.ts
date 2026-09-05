import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { auth } from '@/auth'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Validate that the image is a valid data URL
    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format. Expected data URL.' }, { status: 400 })
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

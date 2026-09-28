import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { auth } from '@/auth'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET() {
  const session = await auth()
  if (!session?.user || !['teacher', 'school', 'admin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000)
    const folder = 'cendroclass_materials'
    
    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET!
    )

    return NextResponse.json({ 
      signature, 
      timestamp, 
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME
    })
  } catch (error) {
    console.error('Signature generation error:', error)
    return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 })
  }
}

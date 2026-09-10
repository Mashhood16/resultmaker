import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  const url = new URL(`/public/leaderboard/${params.classId}`, request.url)
  return NextResponse.redirect(url)
}

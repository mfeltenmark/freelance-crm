import { NextRequest, NextResponse } from 'next/server'
import { saveGeneratedCV } from '@/lib/google-drive-cv'

export async function POST(request: NextRequest) {
  try {
    const { cv, filename } = await request.json()
    const safeName = filename || `CV_${Date.now()}.json`
    const content = JSON.stringify(cv, null, 2)
    const webViewLink = await saveGeneratedCV(safeName, content)
    return NextResponse.json({ success: true, filename: safeName, webViewLink })
  } catch (e) {
    return NextResponse.json({ error: 'Kunde inte spara till Drive' }, { status: 500 })
  }
}

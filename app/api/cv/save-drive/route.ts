import { NextRequest, NextResponse } from 'next/server'
import { saveGeneratedCV } from '@/lib/google-drive-cv'

export async function POST(request: NextRequest) {
  try {
    const { html, filename } = await request.json()
    const safeName = filename || `CV_${Date.now()}.html`
    const webViewLink = await saveGeneratedCV(safeName, html)
    return NextResponse.json({ success: true, filename: safeName, webViewLink })
  } catch (e) {
    return NextResponse.json({ error: 'Kunde inte spara till Drive' }, { status: 500 })
  }
}

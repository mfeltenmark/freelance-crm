import { NextRequest, NextResponse } from 'next/server'
import { saveHTMLToDriver } from '@/lib/google-drive-cv'

export async function POST(request: NextRequest) {
  try {
    const { html, filename } = await request.json()
    if (!html) return NextResponse.json({ error: 'HTML saknas' }, { status: 400 })

    const htmlFilename = (filename || `CV_${Date.now()}`).replace(/\.pdf$/i, '.html')
    const webViewLink = await saveHTMLToDriver(htmlFilename, html)
    return NextResponse.json({ success: true, filename: htmlFilename, webViewLink })
  } catch (error) {
    console.error('CV save error:', error)
    return NextResponse.json({ error: 'Kunde inte spara till Drive' }, { status: 500 })
  }
}

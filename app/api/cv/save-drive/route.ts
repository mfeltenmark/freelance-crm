import { NextRequest, NextResponse } from 'next/server'
import { saveGeneratedCV } from '@/lib/google-drive-cv'

export async function POST(req: NextRequest) {
  try {
    const { cv, filename } = await req.json()

    const content = JSON.stringify(cv, null, 2)
    const safeName = filename || `CV_Mikael_Feltenmark_${new Date().toISOString().split('T')[0]}.json`

    await saveGeneratedCV(safeName, content)

    return NextResponse.json({ success: true, filename: safeName })
  } catch (error) {
    console.error('Save to Drive error:', error)
    return NextResponse.json({ error: 'Kunde inte spara till Drive' }, { status: 500 })
  }
}

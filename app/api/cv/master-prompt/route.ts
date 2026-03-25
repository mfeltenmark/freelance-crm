import { NextRequest, NextResponse } from 'next/server'
import { getMasterPrompt, saveMasterPrompt } from '@/lib/google-drive-cv'
import { CV_MASTER_PROMPT } from '@/lib/cv-master-prompt'

export async function GET() {
  try {
    const prompt = await getMasterPrompt()
    return NextResponse.json({ prompt: prompt || CV_MASTER_PROMPT })
  } catch (error) {
    return NextResponse.json({ prompt: CV_MASTER_PROMPT })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    await saveMasterPrompt(prompt)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save master prompt error:', error)
    return NextResponse.json({ error: 'Kunde inte spara master-prompt' }, { status: 500 })
  }
}

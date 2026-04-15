import { NextResponse } from 'next/server'
import { getMasterPrompt } from '@/lib/google-drive-cv'
import { CV_MASTER_PROMPT } from '@/lib/cv-master-prompt'

export async function POST(request: Request) {
  const { kravprofil, ovriga, riktning, sprak, model } = await request.json()

  const customMasterPrompt = await getMasterPrompt()
  const masterPrompt = customMasterPrompt || CV_MASTER_PROMPT

  const claudeModel = model === 'opus'
    ? 'claude-opus-4-5-20251101'
    : 'claude-sonnet-4-5-20251022'

  const languageInstruction = sprak === 'Engelska'
    ? 'Write the cover letter in English.'
    : 'Skriv motiveringen på svenska.'

  const userMessage = `
KRAVPROFIL / UPPDRAGSBESKRIVNING:
${kravprofil}

ANVÄNDARENS VAL:
CV-riktning: ${riktning}
Språk: ${sprak}
Övriga instruktioner: ${ovriga || 'Inga'}

${languageInstruction} Skriv en motivering/hisspitch på 3-5 meningar baserat på ovanstående. Texten ska vara personlig, direkt och affärsnära. Inga rubriker, bara löpande text. Svara ENDAST med motiveringen.
`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: claudeModel,
      max_tokens: 500,
      system: masterPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || ''
  return NextResponse.json({ coverLetter: text })
}

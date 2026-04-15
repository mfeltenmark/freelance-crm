import { NextResponse } from 'next/server'
import { CV_MASTER_PROMPT } from '@/lib/cv-master-prompt'
import { getMasterPrompt } from '@/lib/google-drive-cv'

export async function POST(request: Request) {
  const { kravprofil, ovriga, riktning, sprak, model } = await request.json()

  const modelId = model === 'opus'
    ? 'claude-opus-4-6'
    : 'claude-sonnet-4-6'

  const customMasterPrompt = await getMasterPrompt()
  const masterPrompt = customMasterPrompt || CV_MASTER_PROMPT

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
      model: modelId,
      max_tokens: 500,
      system: masterPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || ''
  return NextResponse.json({ coverLetter: text })
}

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { description, instructions, riktning, model } = await request.json()

  const modelId = model === 'opus'
    ? 'claude-opus-4-20250514'
    : 'claude-sonnet-4-20250514'

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
      messages: [{
        role: 'user',
        content: `Du är Mikael Feltenmark, senior konsult inom ${riktning}. Skriv en kort motivering/hisspitch på 3-5 meningar på svenska för detta uppdrag. Texten ska vara personlig, direkt och affärsnära. Inga rubriker, bara löpande text.

Uppdragsbeskrivning:
${description}

Övriga instruktioner:
${instructions || 'Inga'}

Svara ENDAST med motiveringen, ingen inledning eller förklaring.`,
      }],
    }),
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || ''
  return NextResponse.json({ coverLetter: text })
}

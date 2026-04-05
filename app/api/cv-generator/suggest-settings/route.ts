import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { description, instructions } = await request.json()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Analysera denna uppdragsbeskrivning och övriga instruktioner och föreslå lämpliga inställningar för CV-generering.

Uppdragsbeskrivning:
${description}

Övriga instruktioner:
${instructions || 'Inga'}

Svara ENDAST med ett JSON-objekt med dessa fält (använd exakt dessa värden):
{
  "riktning": ett av ["Produktledning / CPO", "Digital transformation", "Plattformsstrategi", "Agil coach / metodexpert", "Integrations-PM", "Interims-CTO", "Interim Head of Product", "Projektledning / PM"],
  "fokus": ett av ["Balanserat", "Strategisk tyngd", "Teknisk tyngd"],
  "ton": ett av ["Direkt och affärsnära", "Formell"],
  "lyft": ett av ["Automatiskt", "Plattformsstrategi", "Digital transformation", "Produktledning", "Ledarskap", "Förändringsledning"]
}`
      }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'
  const clean = text.replace(/```json|```/g, '').trim()
  const suggestions = JSON.parse(clean)
  return NextResponse.json(suggestions)
}

import { NextRequest, NextResponse } from 'next/server'
import { CV_MASTER_PROMPT } from '@/lib/cv-master-prompt'
import { readAllCVFiles, getMasterPrompt } from '@/lib/google-drive-cv'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { kravprofil, riktning, sprak, fokus, langd, ton, lyttFram, ovriga, model, antalUppdrag, inputMode } = body

    if (!kravprofil?.trim()) {
      return NextResponse.json({ error: 'Kravprofil saknas' }, { status: 400 })
    }

    const cvDatabaseText = await readAllCVFiles(kravprofil)
    const customMasterPrompt = await getMasterPrompt()
    const masterPrompt = customMasterPrompt || CV_MASTER_PROMPT

    const userMessage = inputMode === 'befintlig'
      ? `
DU FÅR EN BEFINTLIG CV-TEXT SOM MALL.
Din uppgift är att:
1. Bevara strukturen, tonen och innehållet från den inmatade texten så nära som möjligt
2. Formatera om den till rätt JSON-struktur enligt formatet i systemprompten
3. Komplettera med information från CV-databasen om något saknas eller kan förbättras
4. Anpassa språk till: ${sprak}

BEFINTLIG CV-TEXT:
${kravprofil}

ANVÄNDARENS VAL:
CV-riktning: ${riktning}
Språk: ${sprak}
Längd: ${langd}
Antal uppdrag: ${antalUppdrag || '5'}
Övriga instruktioner: ${ovriga || 'Inga'}

CV-DATABAS (för eventuell komplettering):
${cvDatabaseText || 'Inga CV-filer hittades.'}
`
      : `
KRAVPROFIL / UPPDRAGSBESKRIVNING:
${kravprofil}

ANVÄNDARENS VAL:
CV-riktning: ${riktning}
Språk: ${sprak}
Fokus: ${fokus}
Längd: ${langd}
Ton: ${ton}
Lyft fram: ${lyttFram}
Antal uppdrag att lista: ${antalUppdrag || '5'} (lista exakt detta antal)
Övriga instruktioner: ${ovriga || 'Inga'}

CV-DATABAS (dina befintliga CV-filer):
${cvDatabaseText || 'Inga CV-filer hittades i databasen. Använd enbart master-prompten.'}
`

    const claudeModel = model === 'opus'
      ? 'claude-opus-4-5'
      : 'claude-sonnet-4-5'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: claudeModel,
        max_tokens: 4096,
        system: masterPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Claude API error:', err)
      return NextResponse.json({ error: 'Claude API-fel' }, { status: 500 })
    }

    const data = await response.json()
    const rawText = data.content?.[0]?.text || ''

    let cvData
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim()
      cvData = JSON.parse(cleaned)
      cvData.language = sprak
    } catch {
      return NextResponse.json({ error: 'Kunde inte parsa CV-data', raw: rawText }, { status: 500 })
    }

    return NextResponse.json({ cv: cvData })
  } catch (error) {
    console.error('CV generate error:', error)
    return NextResponse.json({ error: 'Serverfel' }, { status: 500 })
  }
}

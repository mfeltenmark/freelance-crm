import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { cv } = await req.json()

    const html = buildCVHtml(cv)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json({ error: 'Serverfel' }, { status: 500 })
  }
}

function buildCVHtml(cv: any): string {
  const purple = '#5e3a8c'

  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; font-size: 11pt; color: #111; line-height: 1.5; padding: 40px 48px; max-width: 760px; margin: 0 auto; }
  h1 { font-size: 22pt; font-weight: 700; color: #111; letter-spacing: -0.5px; }
  .title { font-size: 12pt; color: ${purple}; font-weight: 400; margin-top: 4px; }
  .contact { font-size: 9.5pt; color: #555; margin-top: 6px; }
  .divider { border: none; border-top: 1.5px solid ${purple}; margin: 16px 0; }
  .thin-divider { border: none; border-top: 0.5px solid #ddd; margin: 12px 0; }
  .tagline { font-size: 11pt; color: #222; line-height: 1.6; margin-bottom: 20px; font-style: italic; }
  .section-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${purple}; margin-bottom: 10px; margin-top: 20px; }
  .competencies { display: flex; flex-wrap: wrap; gap: 6px; }
  .competency { font-size: 9.5pt; border: 0.5px solid ${purple}; color: ${purple}; padding: 3px 10px; border-radius: 2px; }
  .engagement { margin-bottom: 14px; }
  .engagement-header { display: flex; justify-content: space-between; align-items: baseline; }
  .engagement-client { font-weight: 700; font-size: 11pt; color: #111; }
  .engagement-period { font-size: 9.5pt; color: #777; }
  .engagement-role { font-size: 10pt; color: ${purple}; margin-bottom: 4px; }
  .engagement-desc { font-size: 10pt; color: #333; line-height: 1.55; }
  .reference { border-left: 2px solid ${purple}; padding-left: 12px; margin-bottom: 12px; }
  .reference-quote { font-size: 10pt; font-style: italic; color: #333; line-height: 1.55; }
  .reference-name { font-size: 9.5pt; font-weight: 700; color: #111; margin-top: 4px; }
  .reference-title { font-size: 9pt; color: #666; }
  .education-item { font-size: 10pt; color: #333; }
  .footer { margin-top: 32px; font-size: 8.5pt; color: #aaa; text-align: center; }
</style>
</head>
<body>
  <h1>${cv.name}</h1>
  <div class="title">${cv.title} | Tech & Change by Feltenmark AB</div>
  <div class="contact">${cv.contact.email} &nbsp;&bull;&nbsp; ${cv.contact.phone} &nbsp;&bull;&nbsp; ${cv.contact.linkedin} &nbsp;&bull;&nbsp; ${cv.contact.location}</div>
  <hr class="divider">
  <p class="tagline">${cv.tagline}</p>

  <div class="section-title">Kärnkompetenser</div>
  <div class="competencies">
    ${cv.competencies.map((c: string) => `<span class="competency">${c}</span>`).join('')}
  </div>

  <div class="section-title">Uppdragshistorik</div>
  ${cv.engagements.map((e: any) => `
    <div class="engagement">
      <div class="engagement-header">
        <span class="engagement-client">${e.client}</span>
        <span class="engagement-period">${e.period}</span>
      </div>
      <div class="engagement-role">${e.role}</div>
      <div class="engagement-desc">${e.description}</div>
    </div>
    <hr class="thin-divider">
  `).join('')}

  <div class="section-title">Utbildning</div>
  ${cv.education.map((e: any) => `
    <div class="education-item">${e.degree} &mdash; ${e.school}${e.year ? ' (' + e.year + ')' : ''}</div>
  `).join('')}

  ${cv.references?.length ? `
    <div class="section-title">Vad kunder säger</div>
    ${cv.references.map((r: any) => `
      <div class="reference">
        <div class="reference-quote">"${r.quote}"</div>
        <div class="reference-name">${r.name}</div>
        <div class="reference-title">${r.title}</div>
      </div>
    `).join('')}
  ` : ''}

  <div class="footer">techchange.io</div>
</body>
</html>`
}

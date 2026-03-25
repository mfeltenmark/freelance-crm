import { NextRequest, NextResponse } from 'next/server'

const purple = '#5e3a8c'

export async function POST(req: NextRequest) {
  try {
    const { cv } = await req.json()
    const html = buildCVHtml(cv)
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json({ error: 'Serverfel' }, { status: 500 })
  }
}

function buildCVHtml(cv: any): string {
  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: A4;
    margin: 28mm 32mm 24mm 32mm;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-break { page-break-inside: avoid; }
    .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8pt; color: #aaa; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; font-size: 10.5pt; color: #111; line-height: 1.55; }
  h1 { font-size: 21pt; font-weight: 700; color: #111; letter-spacing: -0.5px; }
  .title { font-size: 11.5pt; color: ${purple}; font-weight: 400; margin-top: 3px; }
  .contact { font-size: 9pt; color: #555; margin-top: 5px; }
  .divider { border: none; border-top: 1.5px solid ${purple}; margin: 14px 0; }
  .thin-divider { border: none; border-top: 0.5px solid #e0e0e0; margin: 10px 0; }
  .tagline { font-size: 10.5pt; color: #222; line-height: 1.6; margin-bottom: 16px; font-style: italic; }
  .section-title { font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${purple}; margin-bottom: 8px; margin-top: 16px; }
  .competencies { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 2px; }
  .competency { font-size: 9pt; border: 0.5px solid ${purple}; color: ${purple}; padding: 2px 9px; border-radius: 2px; }
  .engagement { margin-bottom: 12px; }
  .engagement-header { display: flex; justify-content: space-between; align-items: baseline; }
  .engagement-client { font-weight: 700; font-size: 10.5pt; color: #111; }
  .engagement-period { font-size: 9pt; color: #777; }
  .engagement-role { font-size: 9.5pt; color: ${purple}; margin-bottom: 3px; }
  .engagement-desc { font-size: 9.5pt; color: #333; line-height: 1.5; }
  .reference { border-left: 2px solid ${purple}; padding-left: 10px; margin-bottom: 10px; }
  .reference-quote { font-size: 9.5pt; font-style: italic; color: #333; line-height: 1.55; }
  .reference-name { font-size: 9pt; font-weight: 700; color: #111; margin-top: 3px; }
  .reference-title { font-size: 8.5pt; color: #666; }
  .education-item { font-size: 9.5pt; color: #333; margin-bottom: 3px; }
  .cert-item { font-size: 9.5pt; color: #333; margin-bottom: 3px; }
  .languages { font-size: 9.5pt; color: #333; }
  .footer { margin-top: 24px; font-size: 8pt; color: #aaa; text-align: center; }
</style>
<script>
  window.onload = function() { window.print(); }
</script>
</head>
<body>
  <h1>${cv.name}</h1>
  <div class="title">${cv.title} | Tech &amp; Change by Feltenmark AB</div>
  <div class="contact">${cv.contact.email} &nbsp;&bull;&nbsp; ${cv.contact.phone} &nbsp;&bull;&nbsp; ${cv.contact.linkedin} &nbsp;&bull;&nbsp; ${cv.contact.location}</div>
  <hr class="divider">
  <p class="tagline">${cv.tagline}</p>

  <div class="section-title">Kärnkompetenser</div>
  <div class="competencies">
    ${cv.competencies.map((c: string) => `<span class="competency">${c}</span>`).join('')}
  </div>

  <div class="section-title">Uppdragshistorik</div>
  ${cv.engagements.map((e: any) => `
    <div class="engagement no-break">
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
    <div class="education-item">${e.degree}, ${e.school}${e.year ? ` (${e.year})` : ''}</div>
  `).join('')}

  ${cv.certifications?.length ? `
    <div class="section-title">Certifieringar</div>
    ${cv.certifications.map((c: any) => `
      <div class="cert-item">${c.name} - ${c.issuer}, ${c.year}</div>
    `).join('')}
  ` : ''}

  ${cv.languages?.length ? `
    <div class="section-title">Språk</div>
    <div class="languages">${cv.languages.map((l: any) => `${l.language}: ${l.level}`).join('&nbsp;&nbsp;&bull;&nbsp;&nbsp;')}</div>
  ` : ''}

  ${cv.references?.length ? `
    <div class="section-title">Vad kunder säger</div>
    ${cv.references.map((r: any) => `
      <div class="reference no-break">
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

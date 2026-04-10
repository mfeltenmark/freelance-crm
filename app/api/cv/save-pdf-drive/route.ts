import { NextRequest, NextResponse } from 'next/server'
import { savePDFToDriver } from '@/lib/google-drive-cv'

export async function POST(request: NextRequest) {
  try {
    const { html, filename } = await request.json()
    if (!html) return NextResponse.json({ error: 'HTML saknas' }, { status: 400 })

    const chromium = await import('@sparticuz/chromium-min')
    const puppeteer = await import('puppeteer-core')

    const browser = await puppeteer.default.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
      ),
      headless: true,
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '28mm', right: '32mm', bottom: '24mm', left: '32mm' },
      printBackground: true,
    })
    await browser.close()

    const safeName = filename || `CV_${Date.now()}.pdf`
    const webViewLink = await savePDFToDriver(safeName, Buffer.from(pdf))
    return NextResponse.json({ success: true, filename: safeName, webViewLink })
  } catch (error) {
    console.error('PDF save error:', error)
    return NextResponse.json({ error: 'Kunde inte generera PDF' }, { status: 500 })
  }
}

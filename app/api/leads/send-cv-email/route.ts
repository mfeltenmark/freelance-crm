import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { to, subject, body } = await request.json()

  const html = `<p>${body.replace(/\n/g, '<br/>')}</p>`

  await resend.emails.send({
    from: 'Mikael Feltenmark <mikael@techchange.io>',
    to,
    subject,
    html,
  })

  return NextResponse.json({ ok: true })
}

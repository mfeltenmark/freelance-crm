import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { to, subject, body, attachment } = await request.json()

  const credentials = JSON.parse(process.env.GMAIL_LEADS_SERVICE_ACCOUNT!)
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
    ],
    subject: 'mikael@techchange.io',
  })

  const gmail = google.gmail({ version: 'v1', auth })

  const boundary = 'boundary_' + Date.now()

  let rawEmail: string

  if (attachment) {
    rawEmail = [
      `To: ${to}`,
      `From: Mikael Feltenmark <mikael@techchange.io>`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      body,
      '',
      `--${boundary}`,
      `Content-Type: application/pdf; name="${attachment.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      '',
      attachment.content,
      '',
      `--${boundary}--`,
    ].join('\r\n')
  } else {
    rawEmail = [
      `To: ${to}`,
      `From: Mikael Feltenmark <mikael@techchange.io>`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      body,
    ].join('\r\n')
  }

  const encoded = Buffer.from(rawEmail)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded },
  })

  return NextResponse.json({ ok: true })
}

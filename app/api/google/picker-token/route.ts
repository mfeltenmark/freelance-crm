import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}')
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    })
    const client = await auth.getClient()
    const tokenResponse = await (client as any).getAccessToken()
    return NextResponse.json({ accessToken: tokenResponse.token })
  } catch (error) {
    console.error('Picker token error:', error)
    return NextResponse.json({ error: 'Failed to get token' }, { status: 500 })
  }
}

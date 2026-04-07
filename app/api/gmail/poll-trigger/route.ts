import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/gmail/poll`, {
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  })
  const data = await response.json()
  return NextResponse.json(data)
}

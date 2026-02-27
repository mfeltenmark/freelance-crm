import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { preferences: true },
  })

  return NextResponse.json({ preferences: user?.preferences || {} })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  await prisma.user.upsert({
    where: { email: session.user.email },
    update: { preferences: body },
    create: {
      email: session.user.email,
      name: session.user.name || '',
      preferences: body,
    },
  })

  return NextResponse.json({ ok: true })
}

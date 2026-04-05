import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')

    const signals = await prisma.mailSignal.findMany({
      where: {
        status: status || 'pending',
        NOT: {
          from: {
            contains: 'techchange.io',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ signals })
  } catch (error) {
    console.error('Error fetching mail signals:', error)
    return NextResponse.json({ error: 'Failed to fetch mail signals' }, { status: 500 })
  }
}

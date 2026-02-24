import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')
  const upcoming = searchParams.get('upcoming')
  const limit = parseInt(searchParams.get('limit') || '10')
  try {
    const where: any = {}

    if (type) {
      where.type = type
    }

    if (upcoming === 'true') {
      where.activityDate = {
        gte: new Date(),
      }
    }
    const activities = await prisma.activity.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            title: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        activityDate: 'asc',
      },
      take: limit,
    })
    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

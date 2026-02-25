import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')
  const upcoming = searchParams.get('upcoming')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const leadId = searchParams.get('leadId')
  const contactId = searchParams.get('contactId')
  const limit = parseInt(searchParams.get('limit') || '50')

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

    // Date range filtering for calendar
    if (startDate || endDate) {
      where.activityDate = {}
      if (startDate) {
        where.activityDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.activityDate.lte = new Date(endDate)
      }
    }

    if (leadId) {
      where.leadId = leadId
    }

    if (contactId) {
      where.contactId = contactId
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      type,
      subject,
      description,
      activityDate,
      durationMinutes,
      leadId,
      contactId,
      metadata,
    } = body

    if (!type || !activityDate) {
      return NextResponse.json(
        { error: 'Type and activity date are required' },
        { status: 400 }
      )
    }

    const activity = await prisma.activity.create({
      data: {
        type,
        subject: subject || null,
        description: description || '',
        activityDate: new Date(activityDate),
        durationMinutes: durationMinutes || null,
        leadId: leadId || null,
        contactId: contactId || null,
        metadata: metadata || null,
      },
      include: {
        lead: true,
        contact: true,
      },
    })

    // Update lead's lastActivityDate if linked
    if (leadId) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { lastActivityDate: new Date() },
      })
    }

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}

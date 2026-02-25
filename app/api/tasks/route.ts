import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const leadId = searchParams.get('leadId')
  const overdue = searchParams.get('overdue')
  const dueDate = searchParams.get('dueDate')
  const sortBy = searchParams.get('sortBy') || 'dueDate'
  const sortOrder = searchParams.get('sortOrder') || 'asc'
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (priority) {
      where.priority = priority
    }
    
    if (leadId) {
      where.leadId = leadId
    }
    
    if (overdue === 'true') {
      where.dueDate = { lt: new Date() }
      where.status = { not: 'done' }
    }
    
    if (dueDate) {
      const date = new Date(dueDate)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      where.dueDate = {
        gte: date,
        lt: nextDay,
      }
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              title: true,
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.task.count({ where }),
    ])

    // Get stats
    const stats = await prisma.task.groupBy({
      by: ['status'],
      _count: true,
    })

    const overdueCount = await prisma.task.count({
      where: {
        dueDate: { lt: new Date() },
        status: { not: 'done' },
      },
    })

    return NextResponse.json({ 
      tasks, 
      total,
      stats,
      overdueCount,
      pagination: {
        limit,
        offset,
        hasMore: offset + tasks.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      title,
      description,
      priority = 'medium',
      dueDate,
      leadId,
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        status: 'todo',
        dueDate: dueDate ? new Date(dueDate) : null,
        leadId: leadId || null,
      },
      include: {
        lead: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

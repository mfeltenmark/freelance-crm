import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      activeLeads,
      totalLeads,
      wonThisMonth,
      totalClosed,
      pipelineValue,
      upcomingMilestones,
      recentLeads,
      overdueTaskCount,
      todayTaskCount,
    ] = await Promise.all([
      // Active leads count
      prisma.lead.count({ where: { status: 'ACTIVE' } }),

      // Total leads
      prisma.lead.count(),

      // Won this month
      prisma.lead.count({
        where: {
          stage: 'CLOSED_WON',
          updatedAt: { gte: startOfMonth },
        },
      }),

      // Total closed (for conversion rate)
      prisma.lead.count({
        where: {
          stage: { in: ['CLOSED_WON', 'CLOSED_LOST'] },
        },
      }),

      // Pipeline value (active leads)
      prisma.lead.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { estimatedValue: true },
      }),

      // Upcoming milestones: leads with nextStep set
      prisma.lead.findMany({
        where: {
          nextStep: { not: null },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          title: true,
          nextStep: true,
          nextStepDate: true,
          stage: true,
          estimatedValue: true,
          company: { select: { name: true } },
        },
        orderBy: [
          { nextStepDate: { sort: 'asc', nulls: 'last' } },
          { updatedAt: 'desc' },
        ],
        take: 5,
      }),

      // Recent leads (last 5 created)
      prisma.lead.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          title: true,
          stage: true,
          estimatedValue: true,
          createdAt: true,
          company: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Overdue tasks
      prisma.task.count({
        where: {
          dueDate: { lt: now },
          status: { not: 'done' },
        },
      }),

      // Today's tasks
      prisma.task.count({
        where: {
          dueDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
          status: { not: 'done' },
        },
      }),
    ])

    // Stage distribution
    const stageDistribution = await prisma.lead.groupBy({
      by: ['stage'],
      where: { status: 'ACTIVE' },
      _count: true,
      _sum: { estimatedValue: true },
    })

    // Won leads count for conversion rate
    const wonCount = await prisma.lead.count({ where: { stage: 'CLOSED_WON' } })
    const conversionRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0

    return NextResponse.json({
      stats: {
        activeLeads,
        totalLeads,
        wonThisMonth,
        conversionRate,
        pipelineValue: pipelineValue._sum.estimatedValue?.toString() || '0',
        overdueTaskCount,
        todayTaskCount,
      },
      stageDistribution: stageDistribution.map((s) => ({
        stage: s.stage,
        count: s._count,
        value: s._sum.estimatedValue?.toString() || '0',
      })),
      upcomingMilestones: upcomingMilestones.map((l) => ({
        ...l,
        estimatedValue: l.estimatedValue?.toString() || null,
      })),
      recentLeads: recentLeads.map((l) => ({
        ...l,
        estimatedValue: l.estimatedValue?.toString() || null,
      })),
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}

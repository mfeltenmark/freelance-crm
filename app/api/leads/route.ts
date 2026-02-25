import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { LeadStage, LeadStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Filters
    const stage = searchParams.get('stage') as LeadStage | null
    const status = searchParams.get('status') as LeadStatus | null
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    
    if (stage) {
      where.stage = stage
    }
    
    if (status) {
      where.status = status
    } else {
      // Default: show active leads
      where.status = { not: 'ON_HOLD' }
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Fetch leads with relations
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
          _count: {
            select: {
              activities: true,
              tasks: true,
              proposals: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.lead.count({ where }),
    ])

    // Calculate pipeline stats
    const pipelineStats = await prisma.lead.groupBy({
      by: ['stage'],
      where: { status: 'ACTIVE' },
      _count: true,
      _sum: {
        estimatedValue: true,
      },
    })

    return NextResponse.json({
      leads,
      total,
      pipelineStats,
      pagination: {
        limit,
        offset,
        hasMore: offset + leads.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
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
      stage = 'NEW',
      estimatedValue,
      closeProbability,
      source,
      expectedCloseDate,
      companyId,
      tags,
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.create({
      data: {
        title,
        description,
        stage,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        closeProbability: closeProbability || 50,
        source,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        companyId,
        tags: tags || [],
        firstContactDate: new Date(),
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}

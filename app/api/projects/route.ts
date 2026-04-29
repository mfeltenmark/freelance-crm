import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        lead: {
          select: {
            id: true,
            title: true,
            company: { select: { name: true } }
          }
        },
        phases: {
          include: {
            _count: { select: { sessions: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('GET /api/projects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, contractUrl, leadId, defaultRate, currency } = body

    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        contractUrl: contractUrl || null,
        leadId: leadId || null,
        defaultRate: defaultRate ?? 900,
        currency: currency || 'SEK'
      },
      include: {
        phases: true,
        lead: {
          select: {
            id: true,
            title: true,
            company: { select: { name: true } }
          }
        }
      }
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('POST /api/projects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

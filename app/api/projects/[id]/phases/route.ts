import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, billingType, fixedAmount, hourlyRate } = body

    if (!name || !billingType) {
      return NextResponse.json({ error: 'Name and billingType required' }, { status: 400 })
    }

    const phase = await prisma.projectPhase.create({
      data: {
        projectId: id,
        name,
        billingType,
        fixedAmount: fixedAmount || null,
        hourlyRate: hourlyRate || null
      }
    })

    return NextResponse.json({ phase }, { status: 201 })
  } catch (error) {
    console.error('POST /api/projects/[id]/phases error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

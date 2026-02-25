import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        company: true,
        activities: {
          orderBy: { activityDate: 'desc' },
          take: 10,
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          where: { status: { not: 'done' } },
        },
        proposals: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      title,
      description,
      stage,
      status,
      estimatedValue,
      closeProbability,
      source,
      expectedCloseDate,
      companyId,
      tags,
      lostReason,
    } = body

    // Build update data
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (stage !== undefined) updateData.stage = stage
    if (status !== undefined) updateData.status = status
    if (estimatedValue !== undefined) updateData.estimatedValue = estimatedValue ? parseFloat(estimatedValue) : null
    if (closeProbability !== undefined) updateData.closeProbability = closeProbability
    if (source !== undefined) updateData.source = source
    if (expectedCloseDate !== undefined) updateData.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null
    if (companyId !== undefined) updateData.companyId = companyId
    if (tags !== undefined) updateData.tags = tags
    if (lostReason !== undefined) updateData.lostReason = lostReason

    // Update lastActivityDate
    updateData.lastActivityDate = new Date()

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
      },
    })

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.lead.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}

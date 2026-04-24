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
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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
        transcript: true,
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
      isPaid,
      nextStep,
      nextStepDate,
      instructions,
      coverLetterText,
      cvDriveUrl,
      cvJsonData,
      contactId,
    } = body

    // Build update data
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (stage !== undefined) {
      updateData.stage = stage
      // Auto-sync status when stage changes
      if (stage === 'CLOSED_WON') {
        updateData.status = 'WON'
        updateData.closedAt = new Date()
      }
      if (stage === 'CLOSED_LOST') {
        updateData.status = 'LOST'
        updateData.closedAt = new Date()
      }
      if (['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATING'].includes(stage)) updateData.status = 'ACTIVE'
    }
    if (status !== undefined) updateData.status = status
    if (estimatedValue !== undefined) updateData.estimatedValue = estimatedValue ? parseFloat(estimatedValue) : null
    if (closeProbability !== undefined) updateData.closeProbability = closeProbability
    if (source !== undefined) updateData.source = source
    if (expectedCloseDate !== undefined) updateData.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null
    if (companyId !== undefined) updateData.companyId = companyId
    if (tags !== undefined) updateData.tags = tags
    if (lostReason !== undefined) updateData.lostReason = lostReason
    if (isPaid !== undefined) updateData.isPaid = isPaid
    if (nextStep !== undefined) updateData.nextStep = nextStep || null
    if (nextStepDate !== undefined) updateData.nextStepDate = nextStepDate ? new Date(nextStepDate) : null
    if (instructions !== undefined) updateData.instructions = instructions
    if (coverLetterText !== undefined) updateData.coverLetterText = coverLetterText
    if (cvDriveUrl !== undefined) updateData.cvDriveUrl = cvDriveUrl
    if (cvJsonData !== undefined) updateData.cvJsonData = cvJsonData
    if (contactId !== undefined) updateData.contactId = contactId || null

    // Update lastActivityDate
    updateData.lastActivityDate = new Date()

    // Read current lead before update to detect stage transitions
    const currentLead = await prisma.lead.findUnique({
      where: { id },
      select: { stage: true, expectedCloseDate: true },
    })

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
      },
    })

    // Auto-create activity log when stage transitions to WON or LOST
    if (stage === 'CLOSED_WON' && currentLead?.stage !== 'CLOSED_WON') {
      await prisma.activity.create({
        data: {
          leadId: id,
          type: 'NOTE',
          description: 'Uppdraget markerades som vunnet.',
          activityDate: new Date(),
        },
      })
    }
    if (stage === 'CLOSED_LOST' && currentLead?.stage !== 'CLOSED_LOST') {
      await prisma.activity.create({
        data: {
          leadId: id,
          type: 'NOTE',
          description: body.lostReason ? `Uppdraget markerades som förlorat. Anledning: ${body.lostReason}` : 'Uppdraget markerades som förlorat.',
          activityDate: new Date(),
        },
      })
    }

    // Auto-create preparation task when stage transitions to QUALIFIED
    const stagingToQualified =
      updateData.stage === 'QUALIFIED' && currentLead?.stage !== 'QUALIFIED'

    if (stagingToQualified) {
      const taskTitle = 'Förbered intervju/pitch'

      const existingTask = await prisma.task.findFirst({
        where: {
          leadId: id,
          title: taskTitle,
          status: { notIn: ['done', 'cancelled'] },
        },
      })

      if (!existingTask) {
        const closeDate = lead.expectedCloseDate ?? currentLead?.expectedCloseDate ?? null
        let dueDate: Date

        if (closeDate) {
          dueDate = new Date(closeDate)
          dueDate.setDate(dueDate.getDate() - 2)
        } else {
          dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 3)
        }

        await prisma.task.create({
          data: {
            title: taskTitle,
            leadId: id,
            dueDate,
            priority: 'high',
          },
        })
      }
    }

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

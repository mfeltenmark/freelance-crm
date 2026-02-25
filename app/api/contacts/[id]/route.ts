import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        company: true,
        activities: {
          orderBy: { activityDate: 'desc' },
          take: 20,
        },
      },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Also fetch leads associated with this contact's company
    let relatedLeads: any[] = []
    if (contact.companyId) {
      relatedLeads = await prisma.lead.findMany({
        where: { companyId: contact.companyId },
        select: {
          id: true,
          title: true,
          stage: true,
          status: true,
          estimatedValue: true,
        },
        take: 10,
      })
    }

    return NextResponse.json({ contact, relatedLeads })
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
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
      firstName,
      lastName,
      email,
      phone,
      title,
      linkedinUrl,
      twitterHandle,
      bio,
      companyId,
      isDecisionMaker,
      relationshipStrength,
      preferredContactMethod,
      timezone,
      notes,
      tags,
    } = body

    // Build update data
    const updateData: any = {}
    
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone || null
    if (title !== undefined) updateData.title = title || null
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl || null
    if (twitterHandle !== undefined) updateData.twitterHandle = twitterHandle || null
    if (bio !== undefined) updateData.bio = bio || null
    if (companyId !== undefined) updateData.companyId = companyId || null
    if (isDecisionMaker !== undefined) updateData.isDecisionMaker = isDecisionMaker
    if (relationshipStrength !== undefined) updateData.relationshipStrength = relationshipStrength
    if (preferredContactMethod !== undefined) updateData.preferredContactMethod = preferredContactMethod
    if (timezone !== undefined) updateData.timezone = timezone
    if (notes !== undefined) updateData.notes = notes || null
    if (tags !== undefined) updateData.tags = tags

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
      },
    })

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
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

    await prisma.contact.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}

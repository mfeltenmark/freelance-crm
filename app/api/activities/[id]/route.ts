import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { type, subject, description } = body

    const activity = await prisma.activity.update({
      where: { id: params.id },
      data: {
        ...(type && { type }),
        ...(subject !== undefined && { subject }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.activity.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 })
  }
}

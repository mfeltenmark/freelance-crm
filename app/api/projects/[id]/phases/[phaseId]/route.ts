import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  try {
    const { phaseId } = await params
    const body = await req.json()

    const phase = await prisma.projectPhase.update({
      where: { id: phaseId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.fixedAmount !== undefined && { fixedAmount: body.fixedAmount }),
        ...(body.hourlyRate !== undefined && { hourlyRate: body.hourlyRate })
      }
    })

    return NextResponse.json({ phase })
  } catch (error) {
    console.error('PATCH /api/projects/[id]/phases/[phaseId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  try {
    const { phaseId } = await params
    await prisma.projectPhase.delete({ where: { id: phaseId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/projects/[id]/phases/[phaseId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

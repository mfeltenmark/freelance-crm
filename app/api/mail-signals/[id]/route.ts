import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const signal = await prisma.mailSignal.findUnique({
      where: { id },
    })
    if (!signal) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(signal)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch signal' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const signal = await prisma.mailSignal.update({
      where: { id },
      data: { status: body.status },
    })
    return NextResponse.json(signal)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update signal' }, { status: 500 })
  }
}

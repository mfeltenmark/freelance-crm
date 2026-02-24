import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') || 'todo'
  const limit = parseInt(searchParams.get('limit') || '20')
  try {
    const tasks = await prisma.task.findMany({
      where: {
        status,
      },
      include: {
        lead: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: limit,
    })
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

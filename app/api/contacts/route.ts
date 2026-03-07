import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://mikael.techchange.io',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search')
  const companyId = searchParams.get('companyId')
  const isDecisionMaker = searchParams.get('isDecisionMaker')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }
    
    if (companyId) {
      where.companyId = companyId
    }
    
    if (isDecisionMaker === 'true') {
      where.isDecisionMaker = true
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
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
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.contact.count({ where }),
    ])

    return NextResponse.json({
      contacts,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + contacts.length < total,
      },
    }, { headers: CORS_HEADERS })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      firstName,
      lastName,
      email,
      phone,
      title,
      linkedinUrl,
      companyId,
      isDecisionMaker,
      notes,
      tags,
    } = body

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // Check if email already exists (only if email provided)
    if (email) {
      const existing = await prisma.contact.findFirst({
        where: { email },
      })
      
      if (existing) {
        return NextResponse.json(
          { error: 'A contact with this email already exists' },
          { status: 409, headers: CORS_HEADERS }
        )
      }
    }

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        title: title || null,
        linkedinUrl: linkedinUrl || null,
        companyId: companyId || null,
        isDecisionMaker: isDecisionMaker || false,
        notes: notes || null,
        tags: tags || [],
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json({ contact }, { status: 201, headers: CORS_HEADERS })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

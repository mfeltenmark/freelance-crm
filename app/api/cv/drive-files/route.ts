import { NextResponse } from 'next/server'
import { listCVFiles } from '@/lib/google-drive-cv'

export async function GET() {
  try {
    const rawFiles = await listCVFiles('raw')
    const generatedFiles = await listCVFiles('generated')

    return NextResponse.json({
      raw: rawFiles.map(f => ({ id: f.id, name: f.name, modified: f.modifiedTime })),
      generated: generatedFiles.map(f => ({ id: f.id, name: f.name, modified: f.modifiedTime })),
      total: (rawFiles.length || 0) + (generatedFiles.length || 0),
    })
  } catch (error) {
    console.error('Drive files error:', error)
    return NextResponse.json({ raw: [], generated: [], total: 0 })
  }
}

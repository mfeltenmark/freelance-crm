import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

const purple = '#5e3a8c'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: '#111111',
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 48,
    paddingRight: 48,
    lineHeight: 1.5,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Times-Bold',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    color: purple,
    marginBottom: 4,
  },
  contact: {
    fontSize: 9.5,
    color: '#555555',
    marginBottom: 0,
  },
  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: purple,
    marginTop: 14,
    marginBottom: 14,
  },
  thinDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#dddddd',
    marginTop: 10,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 11,
    color: '#222222',
    fontFamily: 'Times-Italic',
    lineHeight: 1.6,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
    color: purple,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 16,
  },
  competenciesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 4,
  },
  competency: {
    fontSize: 9.5,
    color: purple,
    borderWidth: 0.5,
    borderColor: purple,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 8,
    paddingRight: 8,
    marginBottom: 4,
  },
  engagementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  engagementClient: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    color: '#111111',
  },
  engagementPeriod: {
    fontSize: 9.5,
    color: '#777777',
  },
  engagementRole: {
    fontSize: 10,
    color: purple,
    marginBottom: 3,
  },
  engagementDesc: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.55,
  },
  referenceBlock: {
    borderLeftWidth: 2,
    borderLeftColor: purple,
    paddingLeft: 10,
    marginBottom: 10,
  },
  referenceQuote: {
    fontSize: 10,
    fontFamily: 'Times-Italic',
    color: '#333333',
    lineHeight: 1.55,
  },
  referenceName: {
    fontSize: 9.5,
    fontFamily: 'Times-Bold',
    color: '#111111',
    marginTop: 3,
  },
  referenceTitle: {
    fontSize: 9,
    color: '#666666',
  },
  educationItem: {
    fontSize: 10,
    color: '#333333',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8.5,
    color: '#aaaaaa',
  },
})

export async function POST(req: NextRequest) {
  try {
    const { cv } = await req.json()

    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: 'A4', style: styles.page },
        React.createElement(Text, { style: styles.name }, cv.name),
        React.createElement(Text, { style: styles.title }, `${cv.title} | Tech & Change by Feltenmark AB`),
        React.createElement(Text, { style: styles.contact }, `${cv.contact.email}  •  ${cv.contact.phone}  •  ${cv.contact.linkedin}  •  ${cv.contact.location}`),
        React.createElement(View, { style: styles.divider }),
        React.createElement(Text, { style: styles.tagline }, cv.tagline),

        React.createElement(Text, { style: styles.sectionTitle }, 'Kärnkompetenser'),
        React.createElement(
          View,
          { style: styles.competenciesRow },
          ...cv.competencies.map((c: string) =>
            React.createElement(Text, { key: c, style: styles.competency }, c)
          )
        ),

        React.createElement(Text, { style: styles.sectionTitle }, 'Uppdragshistorik'),
        ...cv.engagements.flatMap((e: any, i: number) => [
          React.createElement(
            View,
            { key: `eng-${i}` },
            React.createElement(
              View,
              { style: styles.engagementHeader },
              React.createElement(Text, { style: styles.engagementClient }, e.client),
              React.createElement(Text, { style: styles.engagementPeriod }, e.period)
            ),
            React.createElement(Text, { style: styles.engagementRole }, e.role),
            React.createElement(Text, { style: styles.engagementDesc }, e.description)
          ),
          React.createElement(View, { key: `div-${i}`, style: styles.thinDivider }),
        ]),

        React.createElement(Text, { style: styles.sectionTitle }, 'Utbildning'),
        ...cv.education.map((e: any, i: number) =>
          React.createElement(Text, { key: i, style: styles.educationItem }, `${e.degree} — ${e.school}${e.year ? ` (${e.year})` : ''}`)
        ),

        ...(cv.references?.length ? [
          React.createElement(Text, { style: styles.sectionTitle }, 'Vad kunder säger'),
          ...cv.references.map((r: any, i: number) =>
            React.createElement(
              View,
              { key: i, style: styles.referenceBlock },
              React.createElement(Text, { style: styles.referenceQuote }, `"${r.quote}"`),
              React.createElement(Text, { style: styles.referenceName }, r.name),
              React.createElement(Text, { style: styles.referenceTitle }, r.title)
            )
          ),
        ] : []),

        React.createElement(Text, { style: styles.footer, fixed: true }, 'techchange.io')
      )
    )

    const buffer = await renderToBuffer(doc)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="CV_Mikael_Feltenmark.pdf"',
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json({ error: 'PDF-generering misslyckades' }, { status: 500 })
  }
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data (optional - remove in production!)
  await prisma.activity.deleteMany()
  await prisma.proposal.deleteMany()
  await prisma.task.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.company.deleteMany()
  await prisma.emailTemplate.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Create sample companies
  const spotify = await prisma.company.create({
    data: {
      name: 'Spotify',
      website: 'https://spotify.com',
      industry: 'Music Streaming',
      employeeCount: '1000+',
      city: 'Stockholm',
      country: 'Sweden',
      description: 'Leading music streaming platform',
      tags: ['tech', 'b2c', 'entertainment'],
    },
  })

  const klarna = await prisma.company.create({
    data: {
      name: 'Klarna',
      website: 'https://klarna.com',
      industry: 'Fintech',
      employeeCount: '501-1000',
      city: 'Stockholm',
      country: 'Sweden',
      description: 'Buy now, pay later payment solution',
      tags: ['fintech', 'b2c', 'payments'],
    },
  })

  const ericsson = await prisma.company.create({
    data: {
      name: 'Ericsson',
      website: 'https://ericsson.com',
      industry: 'Telecommunications',
      employeeCount: '1000+',
      city: 'Stockholm',
      country: 'Sweden',
      description: 'Global telecommunications equipment and services',
      tags: ['telecom', 'b2b', 'enterprise'],
    },
  })

  console.log('✅ Created 3 sample companies')

  // Create sample contacts
  const contact1 = await prisma.contact.create({
    data: {
      firstName: 'Anna',
      lastName: 'Svensson',
      email: 'anna.svensson@spotify.com',
      phone: '+46701234567',
      title: 'Head of Design',
      companyId: spotify.id,
      isDecisionMaker: true,
      relationshipStrength: 4,
      tags: ['design', 'decision-maker'],
    },
  })

  const contact2 = await prisma.contact.create({
    data: {
      firstName: 'Erik',
      lastName: 'Andersson',
      email: 'erik.andersson@klarna.com',
      phone: '+46701234568',
      title: 'Product Manager',
      companyId: klarna.id,
      isDecisionMaker: true,
      relationshipStrength: 3,
      tags: ['product', 'decision-maker'],
    },
  })

  const contact3 = await prisma.contact.create({
    data: {
      firstName: 'Maria',
      lastName: 'Johansson',
      email: 'maria.johansson@ericsson.com',
      title: 'Engineering Manager',
      companyId: ericsson.id,
      isDecisionMaker: false,
      relationshipStrength: 2,
    },
  })

  console.log('✅ Created 3 sample contacts')

  // Create sample leads
  const lead1 = await prisma.lead.create({
    data: {
      title: 'UX Redesign - Mobile App',
      description: 'Complete redesign of the mobile app experience with focus on user engagement and retention.',
      companyId: spotify.id,
      stage: 'PROPOSAL',
      status: 'ACTIVE',
      estimatedValue: 450000,
      closeProbability: 75,
      leadScore: 85,
      source: 'LinkedIn',
      expectedCloseDate: new Date('2026-02-15'),
      firstContactDate: new Date('2026-01-05'),
      lastActivityDate: new Date('2026-01-10'),
      tags: ['ux', 'mobile', 'high-value'],
    },
  })

  const lead2 = await prisma.lead.create({
    data: {
      title: 'Payment Flow Optimization',
      description: 'Streamline the checkout process to reduce cart abandonment and improve conversion rates.',
      companyId: klarna.id,
      stage: 'NEGOTIATING',
      status: 'ACTIVE',
      estimatedValue: 320000,
      closeProbability: 60,
      leadScore: 72,
      source: 'Referral',
      expectedCloseDate: new Date('2026-02-28'),
      firstContactDate: new Date('2025-12-20'),
      lastActivityDate: new Date('2026-01-12'),
      tags: ['product', 'conversion', 'b2c'],
    },
  })

  const lead3 = await prisma.lead.create({
    data: {
      title: 'Network Infrastructure Consulting',
      description: 'Strategic consulting for 5G network optimization and deployment planning.',
      companyId: ericsson.id,
      stage: 'QUALIFIED',
      status: 'ACTIVE',
      estimatedValue: 850000,
      closeProbability: 40,
      leadScore: 65,
      source: 'Conference',
      expectedCloseDate: new Date('2026-03-30'),
      firstContactDate: new Date('2026-01-03'),
      lastActivityDate: new Date('2026-01-08'),
      tags: ['consulting', 'enterprise', 'technical'],
    },
  })

  const lead4 = await prisma.lead.create({
    data: {
      title: 'E-commerce Platform Audit',
      description: 'Security and performance audit of existing e-commerce infrastructure.',
      stage: 'NEW',
      status: 'ACTIVE',
      estimatedValue: 120000,
      closeProbability: 20,
      leadScore: 45,
      source: 'Website',
      expectedCloseDate: new Date('2026-02-10'),
      tags: ['audit', 'security'],
    },
  })

  console.log('✅ Created 4 sample leads')

  // Create sample activities
  await prisma.activity.create({
    data: {
      leadId: lead1.id,
      contactId: contact1.id,
      type: 'MEETING',
      subject: 'Initial Discovery Call',
      description: 'Discussed project scope, timeline, and budget. Anna is very interested in modern design patterns.',
      outcome: 'positive',
      activityDate: new Date('2026-01-05T10:00:00'),
      durationMinutes: 45,
      nextAction: 'Send proposal with timeline and pricing',
      nextActionDate: new Date('2026-01-12'),
    },
  })

  await prisma.activity.create({
    data: {
      leadId: lead1.id,
      contactId: contact1.id,
      type: 'EMAIL_SENT',
      subject: 'Proposal: UX Redesign Project',
      description: 'Sent detailed proposal with 3 phases: Research (2 weeks), Design (6 weeks), Implementation Support (2 weeks)',
      outcome: 'positive',
      activityDate: new Date('2026-01-10T14:30:00'),
      nextAction: 'Follow up on proposal feedback',
      nextActionDate: new Date('2026-01-17'),
    },
  })

  await prisma.activity.create({
    data: {
      leadId: lead2.id,
      contactId: contact2.id,
      type: 'CALL',
      subject: 'Budget Discussion',
      description: 'Erik mentioned budget approval process takes 2-3 weeks. They\'re comparing with 2 other vendors.',
      outcome: 'neutral',
      activityDate: new Date('2026-01-12T11:00:00'),
      durationMinutes: 30,
      nextAction: 'Send competitor comparison document',
      nextActionDate: new Date('2026-01-15'),
    },
  })

  await prisma.activity.create({
    data: {
      leadId: lead3.id,
      contactId: contact3.id,
      type: 'NOTE',
      subject: 'Conference Follow-up',
      description: 'Met Maria at Nordic Tech Summit. She\'s interested but needs to bring in decision maker. Will intro me to CTO.',
      outcome: 'positive',
      activityDate: new Date('2026-01-08T16:00:00'),
      nextAction: 'Wait for intro email from Maria',
    },
  })

  console.log('✅ Created 4 sample activities')

  // Create a sample proposal
  await prisma.proposal.create({
    data: {
      leadId: lead1.id,
      title: 'Spotify Mobile App UX Redesign',
      description: 'Comprehensive redesign of the mobile experience with focus on engagement and retention.',
      totalValue: 450000,
      currency: 'SEK',
      status: 'SENT',
      sentDate: new Date('2026-01-10'),
      estimatedDurationWeeks: 10,
      startDate: new Date('2026-02-01'),
      lineItems: [
        {
          name: 'User Research & Analysis',
          quantity: 80,
          rate: 1500,
          total: 120000,
        },
        {
          name: 'UX Design & Prototyping',
          quantity: 160,
          rate: 1500,
          total: 240000,
        },
        {
          name: 'Design System Development',
          quantity: 40,
          rate: 1500,
          total: 60000,
        },
        {
          name: 'Implementation Support',
          quantity: 20,
          rate: 1500,
          total: 30000,
        },
      ],
    },
  })

  console.log('✅ Created 1 sample proposal')

  // Create email templates
  await prisma.emailTemplate.create({
    data: {
      name: 'Initial Outreach - UX Project',
      category: 'outreach',
      subject: 'Quick question about {{company_name}}\'s user experience',
      body: `Hi {{first_name}},

I came across {{company_name}} and was impressed by your work in {{industry}}.

I specialize in UX optimization and have helped companies like [similar company] increase engagement by 40%+. I noticed a few opportunities in your current flow that could drive significant impact.

Would you be open to a brief call next week to explore if there's a fit?

Best regards,
[Your name]`,
      usageCount: 12,
      successRate: 35.5,
    },
  })

  await prisma.emailTemplate.create({
    data: {
      name: 'Follow-up - No Response',
      category: 'follow_up',
      subject: 'Re: {{previous_subject}}',
      body: `Hi {{first_name}},

Following up on my previous email. I know you're busy, so I'll keep this brief.

Based on {{company_name}}'s recent growth, I believe there's potential to improve {{area_of_interest}} by 30-40%.

If timing isn't right, no problem - would love to stay connected for the future.

Cheers,
[Your name]`,
      usageCount: 8,
      successRate: 28.0,
    },
  })

  await prisma.emailTemplate.create({
    data: {
      name: 'Proposal Sent',
      category: 'proposal',
      subject: 'Proposal: {{project_title}}',
      body: `Hi {{first_name}},

Thanks for the great conversation earlier! I've put together a proposal based on our discussion.

The proposal covers:
- {{scope_item_1}}
- {{scope_item_2}}
- {{scope_item_3}}

Timeline: {{duration}} weeks
Investment: {{total_value}} SEK

I've attached the full proposal. Let me know if you have any questions - happy to jump on a call to walk through it.

Looking forward to working together!

Best,
[Your name]`,
      usageCount: 15,
      successRate: 65.0,
    },
  })

  console.log('✅ Created 3 email templates')

  // Summary
  const stats = {
    companies: await prisma.company.count(),
    contacts: await prisma.contact.count(),
    leads: await prisma.lead.count(),
    activities: await prisma.activity.count(),
    proposals: await prisma.proposal.count(),
    templates: await prisma.emailTemplate.count(),
  }

  console.log('\n📊 Database seeded successfully!')
  console.log('-----------------------------------')
  console.log(`Companies:  ${stats.companies}`)
  console.log(`Contacts:   ${stats.contacts}`)
  console.log(`Leads:      ${stats.leads}`)
  console.log(`Activities: ${stats.activities}`)
  console.log(`Proposals:  ${stats.proposals}`)
  console.log(`Templates:  ${stats.templates}`)
  console.log('-----------------------------------\n')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

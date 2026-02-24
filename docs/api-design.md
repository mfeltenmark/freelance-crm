# API Design & Endpoints

## API Principles

1. **RESTful conventions** med Next.js Route Handlers
2. **TypeScript types** för alla requests/responses
3. **Zod validation** för input
4. **Consistent error handling**
5. **Pagination** för stora listor
6. **Rate limiting** på public endpoints

## Base URL
```
Development: http://localhost:3000/api
Production: https://your-app.vercel.app/api
```

## Authentication
```typescript
// All protected routes check for valid session
headers: {
  'Authorization': 'Bearer <session-token>'
}
```

---

## Leads API

### GET /api/leads
Hämta alla leads med filtering & pagination

**Query Parameters:**
```typescript
{
  stage?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiating' | 'closed_won' | 'closed_lost'
  status?: 'active' | 'won' | 'lost' | 'on_hold'
  source?: string
  minValue?: number
  maxValue?: number
  minScore?: number
  search?: string           // Sök i title, description, company name
  sortBy?: 'score' | 'value' | 'createdAt' | 'expectedCloseDate'
  sortOrder?: 'asc' | 'desc'
  page?: number             // Default: 1
  limit?: number            // Default: 50, max: 100
}
```

**Response:**
```typescript
{
  leads: Lead[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  aggregates: {
    totalValue: number
    weightedValue: number    // Sum of (value * probability)
    averageScore: number
  }
}
```

**Example:**
```bash
GET /api/leads?stage=proposal&sortBy=score&sortOrder=desc&limit=20
```

---

### GET /api/leads/:id
Hämta en specifik lead med alla relaterade data

**Response:**
```typescript
{
  lead: Lead
  company: Company
  contacts: Contact[]
  activities: Activity[]      // Senaste 50
  proposals: Proposal[]
  stats: {
    totalActivities: number
    lastActivityDate: string
    daysSinceLastActivity: number
    proposalsSent: number
  }
}
```

---

### POST /api/leads
Skapa ny lead

**Request Body:**
```typescript
{
  title: string              // Required
  description?: string
  
  companyId?: string         // If existing company
  companyName?: string       // Create new company
  
  estimatedValue?: number
  closeProbability?: number  // 0-100
  
  stage?: LeadStage         // Default: 'new'
  source?: string
  expectedCloseDate?: string // ISO date
  
  contactId?: string        // Link to existing contact
  
  tags?: string[]
}
```

**Response:**
```typescript
{
  lead: Lead
  message: "Lead created successfully"
}
```

**Validation Rules:**
- title: 3-255 characters
- estimatedValue: >= 0
- closeProbability: 0-100
- Must provide either companyId OR companyName

---

### PATCH /api/leads/:id
Uppdatera lead

**Request Body:**
```typescript
{
  title?: string
  description?: string
  stage?: LeadStage
  estimatedValue?: number
  closeProbability?: number
  expectedCloseDate?: string
  status?: 'active' | 'won' | 'lost' | 'on_hold'
  lostReason?: string        // Required if status = 'lost'
  tags?: string[]
}
```

**Special Logic:**
- Changing stage → Auto-update lastActivityDate
- Changing to 'closed_won' → Create won activity
- Changing to 'closed_lost' → Require lostReason

---

### DELETE /api/leads/:id
Soft delete lead (move to archived)

**Response:**
```typescript
{
  message: "Lead archived successfully"
  restorable: true           // Can undo within 30 days
}
```

---

### POST /api/leads/:id/score
Recalculate lead score

**Response:**
```typescript
{
  previousScore: number
  newScore: number
  factors: {
    companySize: number      // 0-20
    budgetMentioned: number  // 0-30
    decisionMaker: number    // 0-20
    source: number           // 0-30
    engagement: number       // 0-20
  }
}
```

---

## Activities API

### GET /api/activities
**Query Parameters:**
```typescript
{
  leadId?: string
  contactId?: string
  type?: ActivityType
  startDate?: string         // ISO date
  endDate?: string
  page?: number
  limit?: number
}
```

---

### POST /api/activities
Log ny aktivitet

**Request Body:**
```typescript
{
  leadId: string            // Required
  contactId?: string
  
  type: 'email_sent' | 'email_received' | 'call' | 'meeting' | 'note'
  subject?: string
  description: string       // Required
  
  outcome?: 'positive' | 'neutral' | 'negative' | 'no_response'
  
  activityDate?: string     // Default: now
  durationMinutes?: number
  
  nextAction?: string
  nextActionDate?: string   // Creates reminder
}
```

**Side Effects:**
- Updates lead.lastActivityDate
- Creates reminder if nextActionDate provided
- Triggers lead score recalculation

---

### POST /api/activities/bulk
Bulk import activities (ex. från email)

**Request Body:**
```typescript
{
  activities: Array<{
    leadId: string
    type: ActivityType
    subject: string
    description: string
    activityDate: string
  }>
}
```

**Response:**
```typescript
{
  imported: number
  failed: number
  errors: Array<{
    index: number
    error: string
  }>
}
```

---

## Companies API

### GET /api/companies
**Query Parameters:**
```typescript
{
  search?: string
  industry?: string
  minEmployees?: number
  page?: number
  limit?: number
}
```

---

### POST /api/companies
**Request Body:**
```typescript
{
  name: string              // Required
  website?: string
  industry?: string
  employeeCount?: string    // "1-10", "11-50", etc
  description?: string
}
```

---

### GET /api/companies/:id/enrich
Auto-enrich company data från external sources

**Response:**
```typescript
{
  enriched: {
    description?: string
    industry?: string
    employeeCount?: string
    logo?: string
    linkedinUrl?: string
  }
  source: 'clearbit' | 'linkedin' | 'manual'
}
```

---

## Contacts API

### GET /api/contacts
**Query Parameters:**
```typescript
{
  companyId?: string
  search?: string           // Name or email
  page?: number
  limit?: number
}
```

---

### POST /api/contacts
**Request Body:**
```typescript
{
  firstName: string
  lastName: string
  email: string             // Unique
  phone?: string
  title?: string
  companyId?: string
  linkedinUrl?: string
  isDecisionMaker?: boolean
}
```

**Validation:**
- email must be valid format
- Duplicate email → error
- If linkedinUrl provided → try to enrich profile

---

## Proposals API

### GET /api/proposals
**Query Parameters:**
```typescript
{
  leadId?: string
  status?: ProposalStatus
  page?: number
  limit?: number
}
```

---

### POST /api/proposals
**Request Body:**
```typescript
{
  leadId: string
  title: string
  description?: string
  
  lineItems: Array<{
    name: string
    quantity: number
    rate: number
    total: number
  }>
  
  totalValue: number
  currency?: string         // Default: 'SEK'
  
  estimatedDurationWeeks?: number
  startDate?: string
}
```

**Side Effects:**
- Auto-generates PDF
- Updates lead stage to 'proposal'
- Creates activity log

---

### POST /api/proposals/:id/send
Skicka proposal via email

**Request Body:**
```typescript
{
  recipientEmail: string
  subject?: string          // Default template
  message?: string          // Default template
}
```

**Response:**
```typescript
{
  sent: true
  sentDate: string
  trackingUrl: string       // For open tracking
}
```

---

### POST /api/proposals/:id/duplicate
Skapa ny version av proposal

**Response:**
```typescript
{
  newProposal: Proposal     // Version incremented
}
```

---

## Analytics API

### GET /api/analytics/dashboard
Dashboard metrics

**Response:**
```typescript
{
  pipeline: {
    totalLeads: number
    activeLeads: number
    totalValue: number
    weightedValue: number
    
    byStage: Array<{
      stage: string
      count: number
      value: number
    }>
  }
  
  recentActivity: {
    today: number
    thisWeek: number
    thisMonth: number
  }
  
  conversion: {
    winRate: number          // % of closed leads that won
    averageDealSize: number
    averageDaysToClose: number
  }
  
  topLeads: Lead[]           // Top 5 by score
  
  upcomingActions: Array<{
    type: 'follow_up' | 'proposal_due' | 'close_date'
    lead: Lead
    date: string
  }>
}
```

---

### GET /api/analytics/pipeline
Pipeline analysis över tid

**Query Parameters:**
```typescript
{
  startDate?: string        // Default: -90 days
  endDate?: string          // Default: today
  groupBy?: 'day' | 'week' | 'month'
}
```

**Response:**
```typescript
{
  timeSeries: Array<{
    date: string
    newLeads: number
    wonLeads: number
    lostLeads: number
    totalValue: number
    weightedValue: number
  }>
  
  funnel: Array<{
    stage: string
    entered: number
    converted: number
    conversionRate: number
    avgDaysInStage: number
  }>
}
```

---

### GET /api/analytics/sources
Lead source performance

**Response:**
```typescript
{
  sources: Array<{
    source: string
    totalLeads: number
    wonLeads: number
    winRate: number
    averageValue: number
    roi: number             // If cost per source tracked
  }>
}
```

---

## Templates API

### GET /api/templates
**Query Parameters:**
```typescript
{
  category?: 'outreach' | 'follow_up' | 'proposal' | 'closing'
  active?: boolean
}
```

---

### POST /api/templates
**Request Body:**
```typescript
{
  name: string
  category: string
  subject: string
  body: string              // Can include {{variables}}
}
```

---

### POST /api/templates/:id/render
Render template med lead data

**Request Body:**
```typescript
{
  leadId: string
}
```

**Response:**
```typescript
{
  subject: string           // Variables replaced
  body: string              // Variables replaced
  preview: string           // First 200 chars
}
```

---

## Search API

### GET /api/search
Global search across leads, companies, contacts

**Query Parameters:**
```typescript
{
  q: string                 // Required, min 2 chars
  types?: string[]          // ['leads', 'companies', 'contacts']
  limit?: number            // Default: 20
}
```

**Response:**
```typescript
{
  leads: Array<{
    id: string
    title: string
    companyName: string
    stage: string
    match: string           // What matched the search
  }>
  
  companies: Array<{
    id: string
    name: string
    industry: string
  }>
  
  contacts: Array<{
    id: string
    name: string
    email: string
    companyName: string
  }>
  
  total: number
}
```

---

## Webhooks API (För integrations)

### POST /api/webhooks/email
Receive email från external service

**Headers:**
```
X-Webhook-Secret: <shared-secret>
```

**Request Body:**
```typescript
{
  from: string
  to: string
  subject: string
  body: string
  threadId: string
  messageId: string
  receivedAt: string
}
```

**Logic:**
1. Identify lead från email address
2. Create activity
3. Update lead lastActivityDate
4. Check för keywords → auto-update stage

---

## Error Responses

All APIs följer samma error format:

```typescript
{
  error: {
    code: string             // VALIDATION_ERROR, NOT_FOUND, etc
    message: string
    details?: object         // Validation errors, etc
  }
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request (validation)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Rate Limited
- 500: Server Error

---

## Rate Limiting

**Authenticated users:**
- 1000 requests/hour
- 100 requests/minute per endpoint

**Public endpoints:**
- 100 requests/hour per IP

**Response headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1640000000
```

---

## Pagination Pattern

All list endpoints support:

**Request:**
```
?page=2&limit=50
```

**Response:**
```typescript
{
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}
```

**Link header** (GitHub-style):
```
Link: <https://api.../leads?page=3>; rel="next",
      <https://api.../leads?page=1>; rel="first",
      <https://api.../leads?page=10>; rel="last"
```

---

## API Client Example (Frontend)

```typescript
// lib/api/client.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error.message)
  }

  return response.json()
}

export const api = {
  leads: {
    list: (params?: LeadListParams) => 
      apiRequest<LeadsResponse>(`/leads?${new URLSearchParams(params)}`),
    
    get: (id: string) => 
      apiRequest<LeadDetailResponse>(`/leads/${id}`),
    
    create: (data: CreateLeadInput) => 
      apiRequest<Lead>('/leads', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: UpdateLeadInput) => 
      apiRequest<Lead>(`/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },
  
  activities: {
    create: (data: CreateActivityInput) =>
      apiRequest<Activity>('/activities', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  
  // ... more endpoints
}
```

---

## Future API Enhancements

1. **GraphQL Endpoint** för mer flexible queries
2. **Batch Operations** - uppdatera flera leads samtidigt
3. **Real-time Subscriptions** - WebSocket för live updates
4. **File Upload** - för proposals, attachments
5. **Export API** - CSV/Excel export med filters
6. **AI Endpoints** - Claude integration för email drafts

**API versioning** - när breaking changes:
```
/api/v2/leads
```

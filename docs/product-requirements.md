# User Stories & Product Requirements

## Personas

### Primary: Sara - Frilans UX Designer
- 5 år som frilansare
- 10-15 aktiva leads samtidigt
- Får leads från LinkedIn, referenser, tidigare kunder
- Största utmaning: Hålla koll på vem hon pratat med och när
- Behöver: Snabba överblick, påminnelser, professional impression

### Secondary: Erik - Tech Konsult
- Ny som frilansare (6 månader)
- 3-5 leads i månaden
- Behöver: System för att inte tappa leads, lära sig sales-process
- Vill: Data för att förstå vad som funkar

## Epic 1: Lead Capture & Organization

### Story 1.1: Quick Lead Entry
**Som** frilansare  
**Vill jag** kunna lägga till en ny lead på under 30 sekunder  
**För att** jag inte ska tappa momentum när någon visar intresse

**Acceptance Criteria:**
- Kan lägga till lead med bara namn + företag + källa
- Alla andra fält är valfria
- Finns keyboard shortcut (Cmd/Ctrl + K → "New Lead")
- Mobil-vänligt för när jag är på språng
- Auto-complete på företagsnamn om företaget redan finns

**Priority:** P0 (Must have)  
**Effort:** 2 points

### Story 1.2: Lead Import från LinkedIn
**Som** konsult  
**Vill jag** kunna importera leads direkt från LinkedIn Sales Navigator  
**För att** slippa dubbelarbete och få mer kontext

**Acceptance Criteria:**
- Chrome extension eller LinkedIn URL paste
- Hämtar: Namn, titel, företag, location, profil-bild
- Skapar automatiskt company record om ny
- Låter mig granska innan import

**Priority:** P2 (Nice to have)  
**Effort:** 5 points

### Story 1.3: Bulk Operations
**Som** användare med många leads  
**Vill jag** kunna utföra actions på flera leads samtidigt  
**För att** spara tid vid uppdateringar

**Acceptance Criteria:**
- Multi-select med checkboxes
- Batch update: stage, tags, assignment
- Batch delete med confirmation
- Export till CSV

**Priority:** P1 (Should have)  
**Effort:** 3 points

## Epic 2: Pipeline Management

### Story 2.1: Kanban Board View
**Som** visuell person  
**Vill jag** se alla mina leads i en Kanban-vy  
**För att** snabbt förstå var allt står

**Acceptance Criteria:**
- Kolumner per pipeline stage
- Drag & drop för att flytta leads mellan stages
- Visar lead title, company, value, score på kort
- Color-coded priority/score
- Collapse/expand kolumner
- Mobil: swipe för att flytta mellan stages

**Priority:** P0 (Must have)  
**Effort:** 5 points

**Design Notes:**
- Inspiration: Trello, Linear
- Max 50 leads synliga per kolumn (pagination)
- Smooth animations
- Optimistic updates (flytta direkt, sync i bakgrund)

### Story 2.2: Pipeline Stage Automation
**Som** effektiv användare  
**Vill jag** att vissa åtgärder auto-flyttar leads  
**För att** slippa manuellt uppdatera

**Acceptance Criteria:**
- Skicka proposal → flytta till "Proposal" stage
- Email med "yes" eller "accepted" → flyttar till "Negotiating"
- Inget svar på 2 veckor → notification
- Kan sätta custom rules per stage

**Priority:** P2 (Nice to have)  
**Effort:** 8 points

### Story 2.3: Custom Pipeline Stages
**Som** konsult i specifik nisch  
**Vill jag** definiera mina egna pipeline stages  
**För att** matcha min faktiska säljprocess

**Acceptance Criteria:**
- Lägg till/ta bort/rename stages
- Definiera sannolikheter per stage (20%, 50%, 80%)
- Sätt vilka stages som är "won" vs "lost"
- Migrera befintliga leads vid stage-ändringar

**Priority:** P1 (Should have)  
**Effort:** 5 points

## Epic 3: Activity Tracking

### Story 3.1: Email Integration
**Som** konsult som lever i Gmail  
**Vill jag** se alla emails med en lead direkt i CRM:et  
**För att** ha kontext utan att switcha verktyg

**Acceptance Criteria:**
- OAuth koppla till Gmail
- Auto-tracka emails till/från lead contacts
- Visa email thread i activity timeline
- Markera viktiga emails
- Quick reply från CRM interface

**Priority:** P1 (Should have)  
**Effort:** 13 points (complex)

### Story 3.2: Manual Activity Logging
**Som** användare som har calls och meetings  
**Vill jag** enkelt logga vad som sades  
**För att** komma ihåg detaljer nästa gång vi pratar

**Acceptance Criteria:**
- Quick log: Typ (call/meeting/note) + summary
- Optional: outcome, next steps, follow-up date
- Timeline visar all activities kronologiskt
- Kan filtrera på activity type
- Kan lägga till aktivitet från lead-vy med one-click

**Priority:** P0 (Must have)  
**Effort:** 3 points

### Story 3.3: Activity Reminders
**Som** glömsk person  
**Vill jag** få påminnelser om follow-ups  
**För att** ingen lead ska bli kall

**Acceptance Criteria:**
- Sätt "Follow up on X date" när man loggar activity
- Notifiering på dashboard + email
- Snooze reminder
- Auto-suggest follow-up baserat på last activity age
- "No activity in 7 days" warning på leads

**Priority:** P1 (Should have)  
**Effort:** 5 points

## Epic 4: Intelligence & Insights

### Story 4.1: Lead Scoring
**Som** person med begränsad tid  
**Vill jag** veta vilka leads jag borde fokusera på  
**För att** maximera min conversion rate

**Acceptance Criteria:**
- Score 0-100 baserat på:
  - Företagsstorlek (+20 för 50+ anställda)
  - Budget mentioned in notes (+30)
  - Decision maker contact (+20)
  - Source quality (+10-30)
  - Engagement level (+10-20)
- Synlig score på lead card
- Sort by score i list view
- "Hot leads" filter

**Priority:** P1 (Should have)  
**Effort:** 8 points

### Story 4.2: Pipeline Analytics
**Som** data-driven konsult  
**Vill jag** se metrics på min pipeline  
**För att** förstå vad som funkar och planera bättre

**Acceptance Criteria:**
- Dashboard med:
  - Pipeline value (total + weighted)
  - Conversion rate per stage
  - Average time in each stage
  - Win rate per source
  - Monthly revenue projection
- Datum-filter: This month, quarter, year, custom
- Export till CSV

**Priority:** P1 (Should have)  
**Effort:** 8 points

### Story 4.3: Revenue Forecasting
**Som** frilansare som planerar ekonomi  
**Vill jag** se projicerad omsättning  
**För att** veta om jag behöver pusha mer sales

**Acceptance Criteria:**
- Weighted pipeline value: Sum(value * probability)
- Trend graph: Forecasted vs actual closed
- Scenario planning: "If I close top 3 leads..."
- Monthly breakdown
- Confidence intervals baserat på historik

**Priority:** P2 (Nice to have)  
**Effort:** 8 points

## Epic 5: Communication & Proposals

### Story 5.1: Email Templates
**Som** person som skickar liknande emails ofta  
**Vill jag** ha färdiga templates  
**För att** spara tid och vara konsistent

**Acceptance Criteria:**
- Create/edit/delete templates
- Categories: Outreach, Follow-up, Proposal, Rejection
- Variables: {{first_name}}, {{company}}, {{service}}
- Preview före send
- Track vilka templates som får mest svar

**Priority:** P1 (Should have)  
**Effort:** 5 points

### Story 5.2: Proposal Builder
**Som** konsult som skriver många offerter  
**Vill jag** snabbt kunna generera proposals  
**För att** slippa börja från scratch varje gång

**Acceptance Criteria:**
- Template med line items (service, rate, hours)
- Auto-fyll med lead & company info
- Calculate total automatically
- Version control (save drafts, revisions)
- Export till PDF
- Track: sent date, viewed date, accepted/rejected
- Link till offert från lead-vy

**Priority:** P1 (Should have)  
**Effort:** 13 points

### Story 5.3: Email Sequences
**Som** konsult som vill nurture leads  
**Vill jag** sätta upp automated follow-up sequences  
**För att** hålla kontakt utan manuellt arbete

**Acceptance Criteria:**
- Create sequence: Email 1 (Day 0) → Email 2 (Day 3) → Email 3 (Day 7)
- Stop sequence if lead responds
- Personalized templates per step
- Analytics: Open rate, response rate, conversion
- Pause/resume sequences

**Priority:** P2 (Nice to have)  
**Effort:** 13 points

## Non-Functional Requirements

### Performance
- Lead list load < 1 second (för 500 leads)
- Kanban drag-drop känns instant (optimistic updates)
- Search results < 300ms
- Dashboard metrics load < 2 seconds

### UX/UI
- Mobile responsive (70% of features)
- Keyboard navigation för power users
- Dark mode support
- Offline mode: Läsa data, synk när online
- Export all data (GDPR)

### Security
- All data encrypted at rest
- 2FA för login
- Role-based access (för framtida team features)
- Audit log för sensitive changes
- Auto-logout efter 30 min inactivity

### Scalability
- Handle 1000 leads smoothly
- 10,000 activities
- Backup: Daily automated
- API rate limiting för integrations

## Metrics for Success

### User Engagement
- DAU: Minst 5 dagar/vecka
- Time in app: 15-30 min/dag
- Leads added: 5+ per vecka

### Business Impact
- Lead response time: < 24 hours
- Conversion rate increase: +20% vs spreadsheet
- Time saved: 5 hours/vecka vs manuell tracking
- Closed deal value: 20% högre (bättre prioritering)

## Edge Cases att tänka på

1. **Duplicate Detection**: Vad händer om samma företag läggs till två gånger?
2. **Merge Contacts**: Om två kontakter är samma person
3. **Restore Deleted**: Undo delete inom 30 dagar
4. **Bulk Import**: Import 100 leads från CSV, hur hanterar vi fel?
5. **Currency Handling**: Multi-currency support (SEK, EUR, USD)?
6. **Timezone**: Leads i olika tidszoner för global freelancing
7. **Data Migration**: Om användare vill flytta från annat CRM
8. **Offline Edits**: Conflict resolution när man kommer online

## Future Product Directions

### Marketplace Idea
**Templates & Workflows**: Låt power users sälja sina email templates, scoring algorithms, och pipeline configs till andra frilansare i samma bransch

### Community Features
- Anonymous benchmarking: "Din win rate är 15% vs 22% average för UX designers"
- Best practices sharing
- Industry-specific starter packs

### AI Superpowers (med Claude API)
- **Smart Inbox**: Auto-draft email responses
- **Meeting Notes**: Summarize meetings, extract action items
- **Proposal Generator**: "Skapa offert baserat på detta email"
- **Sentiment Tracking**: Är denna kund irriterad? Ska jag följa upp annorlunda?

---

**Pro Tips för Implementation:**
1. **Start Simple**: MVP = Lead list + Kanban + Activities. Bygg derifrån.
2. **User Testing från Dag 1**: Dela screens med andra frilansare, iterera snabbt
3. **Data First**: Perfekt UI kan vänta, men data-modellen måste vara solid
4. **Mobile**: Testa på telefon ofta - mycket usage mellan möten!

# Database Schema Design

## Core Tables

### 1. leads
```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Pipeline
    stage VARCHAR(50) NOT NULL DEFAULT 'new',
    -- new, contacted, qualified, proposal, negotiating, closed_won, closed_lost
    
    -- Value & Scoring
    estimated_value DECIMAL(12,2),
    close_probability INTEGER CHECK (close_probability BETWEEN 0 AND 100),
    lead_score INTEGER DEFAULT 0,
    
    -- Source tracking
    source VARCHAR(100),
    -- e.g., 'linkedin', 'referral', 'website', 'conference'
    source_details JSONB,
    
    -- Timeline
    expected_close_date DATE,
    first_contact_date TIMESTAMP,
    last_activity_date TIMESTAMP,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    -- active, won, lost, on_hold
    lost_reason TEXT,
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    
    -- Metadata
    tags TEXT[],
    custom_fields JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_close_date ON leads(expected_close_date);
```

### 2. contacts
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    
    -- Basic info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    title VARCHAR(150),
    
    -- Social
    linkedin_url VARCHAR(500),
    twitter_handle VARCHAR(100),
    
    -- Enrichment data
    profile_picture_url VARCHAR(500),
    bio TEXT,
    
    -- Communication preferences
    preferred_contact_method VARCHAR(50),
    timezone VARCHAR(50),
    
    -- Relationship
    is_decision_maker BOOLEAN DEFAULT false,
    decision_making_power VARCHAR(50),
    -- low, medium, high, final
    
    relationship_strength INTEGER CHECK (relationship_strength BETWEEN 1 AND 5),
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    custom_fields JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_company ON contacts(company_id);
```

### 3. companies
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500),
    industry VARCHAR(100),
    
    -- Size & firmographics
    employee_count VARCHAR(50),
    -- 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+
    revenue_range VARCHAR(50),
    
    -- Location
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    
    -- Enrichment
    description TEXT,
    linkedin_url VARCHAR(500),
    logo_url VARCHAR(500),
    
    -- Account info
    account_tier VARCHAR(50),
    -- prospect, small, medium, enterprise
    
    -- Metadata
    tags TEXT[],
    custom_fields JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_industry ON companies(industry);
```

### 4. activities
```sql
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id),
    
    -- Activity details
    type VARCHAR(50) NOT NULL,
    -- email_sent, email_received, call, meeting, note, task
    
    subject VARCHAR(255),
    description TEXT,
    
    -- Email specific
    email_thread_id VARCHAR(255),
    email_message_id VARCHAR(255),
    
    -- Outcome
    outcome VARCHAR(100),
    -- positive, neutral, negative, no_response
    
    sentiment_score DECIMAL(3,2),
    -- -1.0 to 1.0 from NLP analysis
    
    -- Timeline
    activity_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    
    -- Next action
    next_action TEXT,
    next_action_date TIMESTAMP,
    
    -- Metadata
    attachments JSONB,
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activities_lead ON activities(lead_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_date ON activities(activity_date DESC);
CREATE INDEX idx_activities_type ON activities(type);
```

### 5. proposals
```sql
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Value
    total_value DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'SEK',
    
    -- Deliverables
    line_items JSONB,
    -- [{name: "UX Design", quantity: 40, rate: 1500, total: 60000}]
    
    -- Timeline
    estimated_duration_weeks INTEGER,
    start_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    -- draft, sent, viewed, accepted, rejected, negotiating
    
    sent_date TIMESTAMP,
    viewed_date TIMESTAMP,
    accepted_date TIMESTAMP,
    
    -- Versions
    version_number INTEGER DEFAULT 1,
    parent_proposal_id UUID REFERENCES proposals(id),
    
    -- Files
    pdf_url VARCHAR(500),
    
    -- Metadata
    notes TEXT,
    custom_fields JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proposals_lead ON proposals(lead_id);
CREATE INDEX idx_proposals_status ON proposals(status);
```

### 6. email_templates
```sql
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    -- initial_outreach, follow_up, proposal, negotiation, closing
    
    subject VARCHAR(255),
    body TEXT NOT NULL,
    
    -- Variables available: {{first_name}}, {{company_name}}, etc.
    
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    -- % of emails sent that got responses
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 7. tasks
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'todo',
    -- todo, in_progress, done, cancelled
    
    priority VARCHAR(20) DEFAULT 'medium',
    -- low, medium, high, urgent
    
    -- Timeline
    due_date TIMESTAMP,
    completed_date TIMESTAMP,
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_lead ON tasks(lead_id);
CREATE INDEX idx_tasks_due ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
```

### 8. users (för framtida multi-user)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    role VARCHAR(50) DEFAULT 'owner',
    -- owner, admin, user
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);
```

## Relationships

```
companies 1 ---> * contacts
companies 1 ---> * leads

leads 1 ---> * activities
leads 1 ---> * proposals
leads 1 ---> * tasks

contacts 1 ---> * activities

users 1 ---> * leads (assigned_to)
users 1 ---> * tasks (assigned_to)
```

## Views för Analytics

### Pipeline Overview
```sql
CREATE VIEW pipeline_summary AS
SELECT 
    stage,
    COUNT(*) as lead_count,
    SUM(estimated_value) as total_value,
    AVG(lead_score) as avg_score,
    AVG(close_probability) as avg_probability,
    SUM(estimated_value * close_probability / 100) as weighted_value
FROM leads
WHERE status = 'active'
GROUP BY stage;
```

### Lead Source Performance
```sql
CREATE VIEW source_performance AS
SELECT 
    source,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'won' THEN 1 END) as won_count,
    ROUND(100.0 * COUNT(CASE WHEN status = 'won' THEN 1 END) / COUNT(*), 2) as win_rate,
    AVG(estimated_value) as avg_deal_size,
    AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_days_to_close
FROM leads
GROUP BY source
ORDER BY won_count DESC;
```

### Activity Metrics
```sql
CREATE VIEW activity_metrics AS
SELECT 
    DATE_TRUNC('week', activity_date) as week,
    type,
    COUNT(*) as activity_count,
    AVG(CASE 
        WHEN sentiment_score IS NOT NULL 
        THEN sentiment_score 
        END) as avg_sentiment
FROM activities
GROUP BY week, type
ORDER BY week DESC, activity_count DESC;
```

## Data Seeding Ideas

För development/testing, skapa:
- 3-5 template companies (olika storlekar/branscher)
- 10-15 sample leads i olika stages
- Realistiska aktiviteter (2-3 per lead)
- Ett par email templates att utgå från

## Future Enhancements

1. **lead_interactions** - Trackera varje touch-point separat
2. **email_sequences** - Automated drip campaigns
3. **deal_stages_custom** - Låt användaren definiera egna stages
4. **integrations** - OAuth tokens för Gmail, LinkedIn etc
5. **webhooks** - För att synca med andra verktyg
6. **audit_log** - Spåra alla ändringar för compliance



## **Implementation Plan: Playbook Integration + Clear/Refresh Button**

### **Priority 1: Add Clear/Refresh Button to Follow-Up Analysis** ✅

**Problem:** After completing an analysis session, users need a quick way to clear the transcript and suggestions to start a fresh analysis without clicking through all controls.

**Solution:** Add a "Clear Session" button that appears when there's transcript data, allowing users to instantly reset and start over.

**Changes to `src/pages/CallHistory.tsx`:**

1. **Add Clear Button After Status Bar (line ~554):**
   ```typescript
   {/* Clear Session Button - appears when there's data */}
   {(transcription.length > 0 || suggestions.length > 0) && !isListening && (
     <Button 
       onClick={() => {
         clearSession();
         toast({
           title: "Session Cleared",
           description: "Ready to start a new analysis"
         });
       }}
       variant="outline" 
       className="w-full gap-2"
     >
       <RefreshCw className="h-4 w-4" />
       Clear & Start Over
     </Button>
   )}
   ```

2. **Import RefreshCw icon (line ~1):**
   ```typescript
   import { 
     // ... existing imports
     RefreshCw
   } from 'lucide-react';
   ```

**Expected Result:**
- ✅ When transcript/suggestions exist and user is NOT recording, show "Clear & Start Over" button
- ✅ Clicking it calls `clearSession()` from the hook, wiping all data
- ✅ Shows toast confirmation
- ✅ User can immediately click "Start Analysis" or "Quick Notes" again

---

### **Priority 2: Playbook Integration into Knowledge Base** 📚

**Objective:** Parse the IONOS Sales Development Playbook PDF and import key sections into the existing Knowledge Base Manager, making it searchable and actionable.

**Strategy:** Use existing Knowledge Base infrastructure (`src/services/knowledgeBase.ts`) to store structured playbook content as documents with appropriate types and tags.

#### **Step 1: Parse Playbook PDF into Structured Documents**

From the playbook PDF analysis, extract these key sections as separate Knowledge Base documents:

1. **ICP Profile** (`type: 'process'`)
   - Title: "IONOS ICP - Ideal Customer Profile"
   - Content: Target industries (MSP, ISV, Distributor), revenue range ($5M-$500M), employee range (10-200), target regions, decision-maker titles
   - Tags: `['icp', 'qualification', 'target-market', 'msp', 'isv']`

2. **Cold Call Scripts** (`type: 'process'`)
   - Title: "IONOS Cold Call Opening Script"
   - Content: "Hello [First Name], this is [Your Name] from IONOS..." (full script)
   - Tags: `['cold-call', 'script', 'opening', 'prospecting']`

3. **Objection Handling - Price** (`type: 'objection_handling'`)
   - Title: "Handling 'Too Expensive' Objection"
   - Content: Specific rebuttals for price concerns
   - Tags: `['objection', 'price', 'cost', 'budget']`

4. **Objection Handling - AWS/Azure Competition** (`type: 'objection_handling'`)
   - Title: "Competitive Positioning vs AWS/Azure"
   - Content: "Many MSPs find AWS costly and complex. IONOS offers transparent pricing..."
   - Tags: `['objection', 'competitor', 'aws', 'azure', 'pricing']`

5. **Objection Handling - Timing** (`type: 'objection_handling'`)
   - Title: "Handling 'Not Right Now / Too Busy' Objection"
   - Content: Urgency/value-based responses
   - Tags: `['objection', 'timing', 'busy', 'urgency']`

6. **Qualification Questions** (`type: 'process'`)
   - Title: "IONOS Qualification Checklist"
   - Content: Key discovery questions (infrastructure needs, growth plans, current providers, decision timeline)
   - Tags: `['qualification', 'discovery', 'questions', 'bant']`

7. **Value Propositions** (`type: 'product_info'`)
   - Title: "IONOS Core Value Propositions"
   - Content: Transparent pricing, German engineering, scalability, white-label options
   - Tags: `['value-prop', 'benefits', 'differentiation']`

8. **12-Day Cadence Template** (`type: 'process'`)
   - Title: "IONOS 12-Day Outreach Cadence"
   - Content: Day-by-day sequence (LinkedIn → Email → Call → Follow-up)
   - Tags: `['cadence', 'outreach', 'sequence', 'prospecting']`

9. **LinkedIn Messaging Templates** (`type: 'general'`)
   - Title: "IONOS LinkedIn Connection & Message Templates"
   - Content: Initial connection message, follow-up messages
   - Tags: `['linkedin', 'social-selling', 'templates']`

10. **Email Templates** (`type: 'general'`)
    - Title: "IONOS Prospecting Email Templates"
    - Content: Subject lines + body copy for Days 2, 5, 9
    - Tags: `['email', 'templates', 'outreach']`

#### **Step 2: Create Playbook Import Utility**

**New File: `src/services/playbookImport.ts`**

```typescript
import { knowledgeBase } from './knowledgeBase';

interface PlaybookSection {
  title: string;
  content: string;
  type: 'product_info' | 'objection_handling' | 'pricing' | 'process' | 'competitor' | 'general';
  tags: string[];
}

export const ionosPlaybookSections: PlaybookSection[] = [
  {
    title: "IONOS ICP - Ideal Customer Profile",
    content: `**Target Industries:**
- Managed Service Providers (MSPs)
- Independent Software Vendors (ISVs)
- Distributors & Resellers

**Company Size:**
- Revenue: $5M - $500M annually
- Employees: 10 - 200

**Decision-Makers:**
- CTO, CIO, Product Director
- Head of IT, IT Director
- CEO (for smaller companies)

**Target Regions:**
- Primary: North America, Western Europe
- Secondary: LATAM, Asia-Pacific

**Key Indicators:**
- Using AWS/Azure/GCP (migration opportunity)
- Growing infrastructure needs
- Looking for white-label solutions (for MSPs)
- Need for transparent, predictable pricing`,
    type: 'process',
    tags: ['icp', 'qualification', 'target-market', 'msp', 'isv', 'distributor']
  },
  {
    title: "IONOS Cold Call Opening Script",
    content: `**Opening:**
"Hello [First Name], this is [Your Name] from IONOS. How are you today?"

[Wait for response]

**Purpose:**
"I'm reaching out because we work with MSPs/ISVs like [Company Name] who are looking to scale their infrastructure with transparent pricing and German engineering reliability."

**Permission:**
"Do you have a couple of minutes to discuss how we're helping companies like yours reduce cloud costs while improving performance?"

**If Yes - Discovery:**
"Great! Can you tell me about your current infrastructure setup? Are you using AWS, Azure, or another provider?"

**If No - Pivot:**
"No problem! Would early next week work better? I can send you some information in the meantime - what's your preferred email?"

**Key Principles:**
- Keep tone conversational, not scripted
- Use their first name naturally
- Reference their industry/company size
- Ask permission before diving into pitch`,
    type: 'process',
    tags: ['cold-call', 'script', 'opening', 'prospecting', 'phone']
  },
  {
    title: "Handling 'Too Expensive' Objection",
    content: `**When Prospect Says:** "IONOS seems more expensive than AWS/Azure"

**Response Framework:**

**1. Acknowledge & Clarify:**
"I appreciate you bringing that up. When you say 'expensive,' are you comparing our list pricing, or have you factored in the hidden costs with AWS like data transfer fees, storage egress, and unpredictable monthly bills?"

**2. Reframe to Total Cost:**
"Many MSPs initially think the same thing, but here's what they discovered:

- **AWS:** Advertised low rates, BUT:
  - Data transfer fees add 15-30% to monthly bills
  - Unpredictable pricing spikes
  - Complex billing requires dedicated staff
  - Reserved instances lock you in for 1-3 years

- **IONOS:** All-inclusive transparent pricing:
  - No surprise fees or egress charges
  - Flat monthly rate - you know exactly what you're paying
  - No long-term commitments required
  - Dedicated support included (not extra)"

**3. Social Proof:**
"We have MSPs who switched from AWS and reduced their infrastructure costs by 20-35% within the first quarter, while improving predictability."

**4. Trial Close:**
"Would it make sense to run a quick cost comparison based on your actual usage? I can show you apples-to-apples pricing in about 10 minutes."

**If Still Resistant:**
"I understand. What specific budget range are you targeting, and what features are non-negotiable? Let's see if we can find a package that works."`,
    type: 'objection_handling',
    tags: ['objection', 'price', 'cost', 'budget', 'aws', 'comparison']
  },
  {
    title: "Competitive Positioning vs AWS/Azure",
    content: `**When They Mention AWS/Azure/GCP:**

**Key Message:**
"Many of our MSP clients came from AWS/Azure. Here's why they switched:"

**1. Transparent Pricing:**
- AWS/Azure: Complex pricing with hidden fees, egress charges, unpredictable bills
- IONOS: Flat-rate pricing, no surprises, know your costs upfront

**2. Predictable Costs:**
- AWS/Azure: Monthly bills fluctuate 10-40% due to usage spikes and fees
- IONOS: Fixed monthly rate, easier to budget and pass costs to clients

**3. Support Quality:**
- AWS/Azure: Tiered support (extra cost), slow response times, impersonal
- IONOS: Dedicated support included, direct access to engineers, proactive monitoring

**4. White-Label Options (for MSPs):**
- AWS/Azure: Not designed for MSPs to resell
- IONOS: Full white-label capabilities, built for channel partners

**5. European Data Sovereignty:**
- AWS/Azure: Primarily US-based, GDPR concerns
- IONOS: German engineering, EU data centers, GDPR-native

**Quick Comparison Script:**
"If you're spending $10K/month with AWS, you're likely spending $1,500-$3,000 extra on data transfer fees, reserved capacity you're not using, and support contracts. With IONOS, that same infrastructure would cost you around $8,500 flat - no hidden fees, no surprises."

**Trial Close:**
"Would you be open to a 30-day proof of concept to compare performance and actual costs side-by-side?"`,
    type: 'objection_handling',
    tags: ['competitor', 'aws', 'azure', 'gcp', 'comparison', 'differentiation']
  },
  {
    title: "Handling 'Not Right Now / Too Busy' Objection",
    content: `**When Prospect Says:** "Not interested right now" or "Too busy to talk"

**Response Framework:**

**1. Acknowledge & Validate:**
"I completely understand - I know you're busy. That's actually why I called."

**2. Quick Value Hook:**
"I'll keep this to 60 seconds: We help MSPs like yours reduce cloud infrastructure costs by 20-35% without changing workflows. Is that something worth 2 minutes next week?"

**3. Create Urgency (if applicable):**
"We're running a special implementation rate this month for new partners - I'd hate for you to miss out if this could genuinely help your bottom line."

**4. Offer Low-Commitment Next Step:**
- "Can I send you a quick 2-minute video showing how we've helped companies like [Similar Company]?"
- "Would you prefer I email you some info and follow up in a few weeks?"
- "Who else on your team handles infrastructure decisions? Maybe they'd be interested?"

**If Still Resistant:**
"No problem at all. Can I ask - is it truly not a fit right now, or is there something specific about IONOS/cloud infrastructure that doesn't align with your priorities?"

[Listen for real objection]

**Alternative - The Permission Close:**
"Fair enough. Can I have permission to check back with you in [3/6] months when things settle down? When would be a better time of year for you - Q1, Q2, or later?"

**Key Principle:**
- Respect their time, but create a clear path for re-engagement
- Leave the door open with specific follow-up date`,
    type: 'objection_handling',
    tags: ['objection', 'timing', 'busy', 'not-interested', 'follow-up']
  },
  {
    title: "IONOS Qualification Checklist",
    content: `**BANT Framework for IONOS Sales:**

**Budget:**
- What's your current monthly cloud/infrastructure spend?
- How much of that is with AWS/Azure/GCP vs other providers?
- Do you have budget allocated for infrastructure improvements this year?

**Authority:**
- Who makes decisions about infrastructure purchases?
- Is there a formal approval process? (IT → Finance → Executive?)
- Are you the primary decision-maker, or would we need to involve others?

**Need:**
- What infrastructure challenges are you facing right now?
- Are you experiencing: Cost unpredictability? Performance issues? Support problems?
- What would "success" look like for your infrastructure in 6 months?
- Are you actively looking to switch providers, or just exploring options?

**Timeline:**
- When are you looking to make a decision?
- Is there a specific event driving this? (contract renewal, migration project, new product launch?)
- What would need to happen for you to move forward in the next 30/60/90 days?

**IONOS-Specific Questions:**

**Infrastructure Needs:**
- What type of workloads? (Web hosting, databases, APIs, VMs, storage?)
- Current scale? (# servers, data volume, traffic levels)
- Growth projections for next 12 months?

**Current Pain Points:**
- AWS/Azure billing surprises?
- Support quality issues?
- Compliance/GDPR concerns?
- White-label needs? (for MSPs)

**Disqualifiers (Automatic Pass):**
- Budget under $500/month (too small for direct sales)
- No decision authority and won't introduce you to DM
- "Just browsing" with no intent to switch in next 12 months
- Locked into multi-year contract with no exit clause

**Qualification Score:**
- 4/4 BANT = Hot Lead → Fast-track to demo
- 3/4 BANT = Warm Lead → Nurture with content + follow-up
- 2/4 BANT = Cold Lead → Long-term nurture campaign
- 0-1/4 BANT = Disqualify → Polite exit`,
    type: 'process',
    tags: ['qualification', 'discovery', 'questions', 'bant', 'needs-analysis']
  },
  {
    title: "IONOS Core Value Propositions",
    content: `**Primary Value Drivers:**

**1. Transparent, Predictable Pricing**
- What it means: Flat-rate monthly pricing, no hidden fees, no surprise charges
- Why it matters: MSPs can budget accurately and pass predictable costs to clients
- Proof point: "Customers report 100% billing predictability vs 30% variance with AWS"

**2. German Engineering & Reliability**
- What it means: Enterprise-grade infrastructure with 99.99% uptime SLA
- Why it matters: Reduces downtime, improves customer satisfaction
- Proof point: "10+ years serving European enterprises, now bringing that reliability to North America"

**3. White-Label Capabilities (for MSPs)**
- What it means: Full rebrand, client portal, custom pricing
- Why it matters: MSPs can resell as their own branded solution
- Proof point: "Over 200 MSPs worldwide use IONOS as their infrastructure backbone"

**4. All-Inclusive Support**
- What it means: Dedicated support included (not tiered/extra cost), direct engineer access
- Why it matters: Faster issue resolution, proactive monitoring
- Proof point: "Average response time under 15 minutes, 24/7/365"

**5. Flexible Scaling**
- What it means: Scale up/down without long-term commitments or penalties
- Why it matters: Pay for what you use, no 1-3 year reserved instance lock-in
- Proof point: "Add/remove resources in minutes, billing adjusts automatically"

**6. GDPR-Native & European Data Sovereignty**
- What it means: EU data centers, German data protection laws
- Why it matters: Full GDPR compliance by default, no US-based data concerns
- Proof point: "German company, EU infrastructure, GDPR compliant since day one"

**Positioning Statement:**
"IONOS delivers enterprise-grade cloud infrastructure with transparent pricing, German engineering reliability, and white-label capabilities built specifically for MSPs and ISVs who need predictable costs and stellar support."

**Competitive Differentiation (vs AWS/Azure):**
- AWS/Azure: Complex, unpredictable, enterprise-focused
- IONOS: Simple, transparent, channel-partner-focused

**ROI Messaging:**
"Companies switching to IONOS typically see:
- 20-35% reduction in total infrastructure costs
- 90% improvement in billing predictability
- 50% faster support response times
- Ability to offer infrastructure as a branded service to their clients"`,
    type: 'product_info',
    tags: ['value-prop', 'benefits', 'differentiation', 'ionos', 'positioning']
  },
  {
    title: "IONOS 12-Day Outreach Cadence",
    content: `**Prospecting Sequence for Cold Outreach:**

**Day 1 - LinkedIn Connection Request**
- Send personalized connection request
- Message: "Hi [Name], I work with MSPs/ISVs in [industry] to optimize cloud infrastructure costs. Would love to connect and share insights. - [Your Name]"
- Goal: Get accepted

**Day 2 - First Email (if no LinkedIn response)**
- Subject: "Quick question about [Company]'s infrastructure"
- Body: Brief intro, mention pain point, CTA for 15-min call
- Goal: Spark interest, get reply

**Day 3 - First Phone Call**
- Use cold call script
- Goal: Live conversation, book demo or get permission for follow-up
- Leave voicemail if no answer (reference email)

**Day 5 - LinkedIn Message (if connected)**
- Reference their company/industry
- Share case study or relevant content
- Goal: Engagement, start conversation

**Day 6 - Second Email**
- Subject: "Following up - [specific pain point]"
- Mention previous touchpoints
- Include customer testimonial or proof point
- Goal: Re-engage, different angle

**Day 8 - Second Phone Call**
- Reference prior attempts to connect
- Use "permission close": "Is this even on your radar?"
- Goal: Qualify in/out, schedule demo or graceful exit

**Day 9 - "Breakup" Email**
- Subject: "Should I close your file?"
- Assume they're not interested, offer to stop reaching out
- Goal: Get response (yes or no), create urgency

**Day 10 - LinkedIn Engagement**
- Comment on their company's post or share relevant article
- Goal: Stay visible, non-salesy touch

**Day 12 - Final Email**
- Subject: "Last one, I promise"
- Acknowledge you've tried multiple times
- Offer valuable resource (whitepaper, calculator, case study)
- Goal: Leave door open for future, provide value

**If No Response After Day 12:**
- Add to long-term nurture campaign (monthly touches)
- Monitor for trigger events (job change, funding, news)

**If Responded at Any Point:**
- Exit cadence, move to qualification/demo process
- Adjust follow-up based on their timeline

**Key Principles:**
- Multi-channel approach (LinkedIn + Email + Phone)
- Vary messaging/angle each touch
- Provide value, not just "checking in"
- Respect their time, but be persistent
- Always have clear CTA (book call, reply, view resource)`,
    type: 'process',
    tags: ['cadence', 'outreach', 'sequence', 'prospecting', 'multi-touch']
  },
  {
    title: "IONOS LinkedIn Connection & Message Templates",
    content: `**Initial Connection Request:**

**Template 1 (Mutual Connection):**
"Hi [Name], I see we're both connected to [Mutual Connection]. I work with MSPs/ISVs to optimize cloud costs. Would love to connect!"

**Template 2 (Industry-Specific):**
"Hi [Name], I help [Industry] companies reduce infrastructure complexity. Thought we should connect - [Your Name] at IONOS"

**Template 3 (Company-Specific):**
"Hi [Name], Saw [Company] is growing fast. I work with similar companies on cloud infrastructure - let's connect!"

---

**Follow-Up Message #1 (Day 5 - after accepted):**

**Subject:** Thanks for connecting!

**Body:**
"Hi [Name],

Thanks for connecting! I noticed [Company] is [specific observation - recent hire, new product, expansion].

I help MSPs/ISVs like yours reduce cloud infrastructure costs by 20-35% with transparent pricing and white-label options.

Curious - are you currently using AWS/Azure, or a different provider?

Best,
[Your Name]
IONOS"

---

**Follow-Up Message #2 (Day 10 - if no response):**

**Subject:** Quick question about [Company]'s infrastructure

**Body:**
"Hi [Name],

I know you're busy, so I'll keep this short.

We just helped [Similar Company] reduce their AWS bill from $12K/month to $8.5K/month - same performance, zero hidden fees.

Would a quick 15-minute call make sense to see if we could do the same for [Company]?

Two options that work this week:
- [Day] at [Time]
- [Day] at [Time]

Let me know!

[Your Name]
IONOS"

---

**Follow-Up Message #3 (Day 15 - last touch):**

**Subject:** Should I stop reaching out?

**Body:**
"Hi [Name],

I've reached out a few times about helping [Company] optimize cloud costs, but haven't heard back.

Totally fine if it's not a priority right now!

Just let me know:
- 'Yes, let's talk' → I'll send a calendar link
- 'Not interested' → I'll stop reaching out
- 'Maybe later' → I'll check back in [timeframe]

Thanks for your time!

[Your Name]"

---

**Key Principles:**
- Keep messages SHORT (under 100 words)
- Always personalize with company/industry details
- One clear CTA per message
- Use their first name
- Provide value, not just "checking in"
- Respect their time and inbox`,
    type: 'general',
    tags: ['linkedin', 'social-selling', 'templates', 'messages', 'outreach']
  },
  {
    title: "IONOS Prospecting Email Templates",
    content: `**Email Template #1 - Day 2 (First Touch)**

**Subject Line Options:**
- "Quick question about [Company]'s cloud infrastructure"
- "[Name], are you overpaying for AWS?"
- "15-minute call to save [Company] $X/month?"

**Body:**

"Hi [Name],

I'm [Your Name] from IONOS. I help MSPs and ISVs like [Company] reduce cloud infrastructure costs without sacrificing performance.

Quick question: Are you currently using AWS, Azure, or another provider?

Many of our clients came from AWS and saved 20-35% monthly by switching to our transparent, flat-rate pricing (no hidden egress fees or surprise charges).

Would a quick 15-minute call make sense to see if we could do the same for you?

Two times that work this week:
- [Day] at [Time]
- [Day] at [Time]

Let me know!

Best,
[Your Name]
IONOS
[Phone] | [LinkedIn]"

---

**Email Template #2 - Day 6 (Follow-Up)**

**Subject Line Options:**
- "Following up - [Company]'s infrastructure costs"
- "Re: Quick question about [Company]"
- "[Name], did you see this?"

**Body:**

"Hi [Name],

I sent you a note earlier this week about reducing cloud costs for [Company].

I wanted to share a quick case study:

**[Similar Company Name]** was spending $15K/month with AWS (plus unpredictable overages). They switched to IONOS and now pay $10.5K/month flat - no surprises, same performance.

The difference: transparent pricing, no data egress fees, and dedicated support included.

Would it make sense to run a cost comparison for [Company]? Takes about 10 minutes.

Reply 'Yes' and I'll send a calendar link.

Thanks,
[Your Name]"

---

**Email Template #3 - Day 9 ("Breakup" Email)**

**Subject Line:**
"Should I close your file?"

**Body:**

"Hi [Name],

I've reached out a couple of times about helping [Company] reduce cloud infrastructure costs, but I haven't heard back.

I'm assuming it's not a priority right now - no worries at all!

Just wanted to check:
- Are you still interested but just busy? (Let me know when to follow up)
- Not interested? (I'll stop reaching out)
- Want to talk but need different timing? (What works better - next month? next quarter?)

Either way, I appreciate your time.

Best,
[Your Name]
IONOS"

---

**Email Template #4 - Day 12 (Final Touch + Value)**

**Subject Line:**
"Last one, I promise + [Free Resource]"

**Body:**

"Hi [Name],

Last email from me (promise!).

I know you're busy and infrastructure might not be top priority right now.

No hard sell - just wanted to leave you with something valuable:

**[Resource]:**
- [Whitepaper: AWS vs IONOS Cost Comparison Calculator]
- [Case Study: How MSPs Reduce Costs by 30%]
- [Guide: Hidden Cloud Costs You're Probably Paying]

Download here: [Link]

If things change down the road and you want to revisit IONOS, you've got my info.

Take care,
[Your Name]
IONOS"

---

**Key Email Best Practices:**
- **Personalize:** Use company name, industry, recent news
- **Keep short:** Under 150 words
- **One clear CTA:** Book a call, reply, view resource
- **Social proof:** Include customer names, results, testimonials
- **Mobile-friendly:** Short paragraphs, bullet points
- **Test subject lines:** A/B test to see what resonates
- **Send timing:** Tuesday-Thursday, 9-11am or 2-4pm local time`,
    type: 'general',
    tags: ['email', 'templates', 'outreach', 'prospecting', 'cold-email']
  }
];

export function importIONOSPlaybook(): number {
  console.log('Importing IONOS Playbook into Knowledge Base...');
  
  let imported = 0;
  
  ionosPlaybookSections.forEach(section => {
    try {
      knowledgeBase.addDocument({
        title: section.title,
        content: section.content,
        type: section.type,
        tags: section.tags
      });
      imported++;
    } catch (error) {
      console.error(`Failed to import section: ${section.title}`, error);
    }
  });
  
  console.log(`Successfully imported ${imported} playbook sections`);
  return imported;
}
```

#### **Step 3: Add Playbook Import UI to Knowledge Base Manager**

**Changes to `src/components/KnowledgeBaseManager.tsx`:**

1. **Import the playbook import function (line ~24):**
   ```typescript
   import { importIONOSPlaybook } from '@/services/playbookImport';
   ```

2. **Add "Import Playbook" button next to existing Import/Export buttons (line ~158-176):**
   ```typescript
   <div className="flex items-center gap-2">
     {/* Existing Import button */}
     <input
       type="file"
       id="file-upload"
       className="hidden"
       accept=".json,.txt,.md"
       onChange={handleFileUpload}
     />
     <label htmlFor="file-upload">
       <Button variant="outline" size="sm" className="cursor-pointer">
         <Upload className="h-4 w-4 mr-1" />
         Import File
       </Button>
     </label>
     
     {/* NEW: Import IONOS Playbook button */}
     <Button 
       variant="outline" 
       size="sm" 
       onClick={() => {
         const imported = importIONOSPlaybook();
         refreshDocuments();
         alert(`Successfully imported ${imported} playbook sections into Knowledge Base!`);
       }}
     >
       <BookOpen className="h-4 w-4 mr-1" />
       Import IONOS Playbook
     </Button>
     
     {/* Existing Export button */}
     <Button variant="outline" size="sm" onClick={handleExport}>
       <Download className="h-4 w-4 mr-1" />
       Export
     </Button>
     
     {/* Existing Add Document button */}
     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
       ...
     </Dialog>
   </div>
   ```

**Expected Result:**
- ✅ One-click "Import IONOS Playbook" button in Knowledge Base Manager
- ✅ Imports all 10 playbook sections as structured, searchable documents
- ✅ Organized by type (objection_handling, process, product_info, general)
- ✅ Fully tagged for easy search (e.g., search "aws" → finds competitive positioning)
- ✅ Can be edited, updated, deleted like any other knowledge document

---

### **Priority 3: Integrate Playbook into Live Coaching** 🎯

**Objective:** Make playbook content appear contextually during live coaching sessions based on conversation keywords.

**Changes to `src/hooks/useRealTimeCoachingWithElevenLabs.ts`:**

1. **Import knowledge base service (line ~1):**
   ```typescript
   import { knowledgeBase } from '@/services/knowledgeBase';
   ```

2. **Add playbook context to coaching AI prompts (line ~90-100):**
   ```typescript
   const processTranscriptionForCoaching = useCallback(async (text: string) => {
     // ... existing code ...
     
     // NEW: Search playbook for relevant context
     const playbookResults = knowledgeBase.search(text, 3);
     const playbookContext = playbookResults.length > 0 
       ? `\n\nRELEVANT PLAYBOOK GUIDANCE:\n${playbookResults.map(r => 
           `- ${r.document.title}: ${r.matchedContent.substring(0, 150)}...`
         ).join('\n')}`
       : '';
     
     const response = await ionosAI.sendCoachingMessage([
       {
         role: 'system',
         content: `You are an AI sales coach. Provide concise, actionable coaching suggestions based on the conversation and IONOS playbook guidance.${playbookContext}`
       },
       {
         role: 'user',
         content: `Recent conversation:\n${transcription.slice(-3).map(t => t.text).join('\n')}\n\nLatest: ${text}\n\nProvide ONE brief coaching tip.`
       }
     ]);
     
     // ... rest of existing code ...
   }, [transcription]);
   ```

**Expected Result:**
- ✅ When customer says "too expensive" → AI suggests playbook-based objection handling
- ✅ When customer mentions "AWS" → AI references competitive positioning playbook section
- ✅ When customer says "not right now" → AI suggests timing objection response from playbook
- ✅ More relevant, consistent coaching based on proven sales methodology

---

### **Priority 4: Integrate Playbook into Follow-Up Analysis** 📊

**Objective:** Use playbook context when generating call summaries and coaching suggestions in the Follow-Up Analysis tab.

**Changes to `src/pages/CallHistory.tsx`:**

1. **Import knowledge base (line ~1):**
   ```typescript
   import { knowledgeBase } from '@/services/knowledgeBase';
   ```

2. **Update `generateCallSummary()` to include playbook context (line ~240-330):**
   ```typescript
   const generateCallSummary = async () => {
     // ... existing code ...
     
     // NEW: Search playbook for relevant context
     const playbookResults = knowledgeBase.search(fullTranscript, 5);
     const playbookContext = playbookResults.length > 0
       ? `\n\nRELEVANT PLAYBOOK SECTIONS:\n${playbookResults.map(r => 
           `- ${r.document.title} (${r.document.type})`
         ).join('\n')}`
       : '';
     
     const analysisPrompt = `
You are analyzing a sales call transcript. Extract ONLY information that is EXPLICITLY mentioned in the conversation.

TRANSCRIPT:
"${fullTranscript}"

CALL TYPE: ${selectedCallType}
${playbookContext}

CRITICAL RULES:
...
     `;
     
     // ... rest of existing code ...
   };
   ```

**Expected Result:**
- ✅ Call summaries reference playbook best practices
- ✅ Next steps align with 12-day cadence from playbook
- ✅ Qualification assessment based on ICP criteria from playbook
- ✅ More structured, actionable follow-up recommendations

---

### **Benefits of This Approach**

✅ **Playbook becomes actionable:**
- Not a static PDF, but a living knowledge base
- Searchable, editable, context-aware
- Automatically surfaces during calls and analysis

✅ **Consistent sales methodology:**
- All agents reference the same proven scripts and objection handling
- AI coaching reinforces playbook best practices
- Reduces ramp time for new agents

✅ **Easy to maintain:**
- Update playbook content in Knowledge Base Manager
- Changes immediately reflected in coaching suggestions
- No code changes needed for content updates

✅ **Clear/Refresh button:**
- Agents can quickly reset between calls
- No confusion from old transcripts lingering
- Faster workflow for back-to-back analysis sessions

---

### **Implementation Timeline**

**Phase 1 (Immediate - 30 minutes):**
1. Add "Clear & Start Over" button to Follow-Up Analysis
2. Test clear functionality across browsers

**Phase 2 (1-2 hours):**
1. Create `playbookImport.ts` with all 10 IONOS playbook sections
2. Add "Import IONOS Playbook" button to Knowledge Base Manager
3. Test one-click playbook import

**Phase 3 (1 hour):**
1. Integrate playbook search into Live Coaching hook
2. Integrate playbook search into Follow-Up Analysis
3. Test contextual playbook suggestions during calls

**Total Time:** ~3-4 hours of focused implementation

---

### **Testing Checklist**

**Clear/Refresh Button:**
- ✅ Button only appears when transcript/suggestions exist
- ✅ Button hidden during active recording
- ✅ Clicking clears all data instantly
- ✅ Toast confirmation appears
- ✅ Can immediately start new analysis after clearing

**Playbook Import:**
- ✅ Click "Import IONOS Playbook" → Shows success message
- ✅ All 10 sections appear in Knowledge Base Manager
- ✅ Each section has correct type and tags
- ✅ Search works (e.g., search "aws" → finds competitive positioning)
- ✅ Can edit/update playbook sections after import

**Playbook Integration - Live Coaching:**
- ✅ Start coaching, say "too expensive" → See price objection guidance
- ✅ Say "using AWS" → See competitive positioning reference
- ✅ Say "not right now" → See timing objection handling
- ✅ Playbook context appears naturally in coaching suggestions

**Playbook Integration - Follow-Up Analysis:**
- ✅ Analyze call with objections → Summary references playbook
- ✅ Next steps align with 12-day cadence
- ✅ Qualification assessment matches ICP criteria
- ✅ Email templates use playbook messaging


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
- Goal: Get accepted

**Day 2 - First Email**
- Subject: "Quick question about [Company]'s infrastructure"
- Body: Brief intro, mention pain point, CTA for 15-min call

**Day 3 - First Phone Call**
- Use cold call script
- Leave voicemail if no answer (reference email)

**Day 5 - LinkedIn Message (if connected)**
- Reference their company/industry
- Share case study or relevant content

**Day 6 - Second Email**
- Subject: "Following up - [specific pain point]"
- Include customer testimonial or proof point

**Day 8 - Second Phone Call**
- Use "permission close": "Is this even on your radar?"
- Goal: Qualify in/out, schedule demo or graceful exit

**Day 9 - "Breakup" Email**
- Subject: "Should I close your file?"
- Create urgency

**Day 10 - LinkedIn Engagement**
- Comment on their company's post or share relevant article

**Day 12 - Final Email**
- Subject: "Last one, I promise"
- Offer valuable resource (whitepaper, calculator, case study)

**If No Response After Day 12:**
- Add to long-term nurture campaign (monthly touches)

**Key Principles:**
- Multi-channel approach (LinkedIn + Email + Phone)
- Vary messaging/angle each touch
- Provide value, not just "checking in"
- Always have clear CTA`,
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

**Follow-Up Message #1 (Day 5):**
"Hi [Name], Thanks for connecting! I noticed [Company] is [specific observation]. I help MSPs/ISVs reduce cloud infrastructure costs by 20-35% with transparent pricing. Curious - are you currently using AWS/Azure?"

**Follow-Up Message #2 (Day 10):**
"Hi [Name], We just helped [Similar Company] reduce their AWS bill from $12K/month to $8.5K/month - same performance, zero hidden fees. Would a quick 15-minute call make sense?"

**Follow-Up Message #3 (Day 15 - last touch):**
"Hi [Name], I've reached out a few times about helping [Company] optimize cloud costs. Just let me know: 'Yes, let's talk' / 'Not interested' / 'Maybe later'"

**Key Principles:**
- Keep messages SHORT (under 100 words)
- Always personalize with company/industry details
- One clear CTA per message`,
    type: 'general',
    tags: ['linkedin', 'social-selling', 'templates', 'messages', 'outreach']
  },
  {
    title: "IONOS Prospecting Email Templates",
    content: `**Email #1 - Day 2 (First Touch)**
Subject: "Quick question about [Company]'s cloud infrastructure"

"Hi [Name], I'm [Your Name] from IONOS. I help MSPs and ISVs like [Company] reduce cloud infrastructure costs without sacrificing performance.

Quick question: Are you currently using AWS, Azure, or another provider?

Many of our clients came from AWS and saved 20-35% monthly by switching to our transparent, flat-rate pricing.

Would a quick 15-minute call make sense?"

---

**Email #2 - Day 6 (Follow-Up)**
Subject: "Following up - [Company]'s infrastructure costs"

"Hi [Name], I wanted to share a quick case study:

[Similar Company] was spending $15K/month with AWS (plus unpredictable overages). They switched to IONOS and now pay $10.5K/month flat.

Would it make sense to run a cost comparison for [Company]? Takes about 10 minutes."

---

**Email #3 - Day 9 ("Breakup")**
Subject: "Should I close your file?"

"Hi [Name], I've reached out a couple of times about helping [Company] reduce cloud infrastructure costs, but haven't heard back.

Just wanted to check:
- Still interested but just busy?
- Not interested? (I'll stop reaching out)
- Want to talk but need different timing?"

---

**Email #4 - Day 12 (Final + Value)**
Subject: "Last one, I promise + [Free Resource]"

"Hi [Name], Last email from me (promise!). No hard sell - just wanted to leave you with something valuable:

[Whitepaper: AWS vs IONOS Cost Comparison Calculator]

If things change down the road, you've got my info."

---

**Best Practices:**
- Personalize with company name, industry, recent news
- Keep under 150 words
- One clear CTA per email
- Send Tuesday-Thursday, 9-11am or 2-4pm local time`,
    type: 'general',
    tags: ['email', 'templates', 'outreach', 'prospecting', 'cold-email']
  }
];

export function importIONOSPlaybook(): number {
  // Check if playbook already imported to avoid duplicates
  const existing = knowledgeBase.getAllDocuments();
  const alreadyImported = existing.some(doc => doc.title === "IONOS ICP - Ideal Customer Profile");
  
  if (alreadyImported) {
    console.log('IONOS Playbook already imported, skipping to avoid duplicates');
    return 0;
  }

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

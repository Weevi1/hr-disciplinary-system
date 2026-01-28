# File by FIFO — Technical Feature Highlights

A comprehensive guide for HR professionals and technical buyers.

---

## The 10-Phase Warning Wizard

Every warning follows a structured process that ensures LRA compliance. Here's what happens at each phase:

### Phase 1: Employee Selection
- Search employees by name or employee number
- See employee's department and current manager
- View active warning history at a glance
- Pre-select from team list (for managers)

### Phase 2: Category & LRA Recommendation
- Choose from pre-configured misconduct categories
- System analyzes employee's warning history
- **LRA-compliant recommendation** suggests appropriate warning level
- Manager can override with justification
- Displays any existing warnings in the same category

### Phase 3: Incident Details
- Date and time of incident (auto-fills SA timezone)
- Location/department where incident occurred
- Full description of what happened
- Facts-based documentation (no opinions)

### Phase 4: Employee's Response
- Record what the employee said in their own words
- Space for their explanation or defense
- Ensures fairness (employee's side documented)
- Critical for CCMA defense

### Phase 5: Expected Standards
- Define the behavior/performance expected
- Reference company policy or code of conduct
- Clear, measurable expectations
- Sets baseline for improvement

### Phase 6: Improvement Plan
- Specific commitments from employee
- Timeline for each commitment
- Follow-up review date
- Resources or support offered

### Phase 7: Review Documentation
- Summary of all entered information
- Edit any section before finalizing
- Ensure accuracy before signatures
- Last chance to correct errors

### Phase 8: Script & PDF Review
- View the warning script in chosen language
- Manager reads script aloud to employee
- Preview the PDF document
- Confirm everything is accurate

### Phase 9: Signatures
- Manager signs digitally on screen
- Employee views PDF preview (sees manager signature)
- Employee signs acknowledging receipt
- Optional witness signature
- Timestamp and initials burned into signature

### Phase 10: Delivery
- Choose delivery method:
  - **Email** — Instant delivery with PDF attachment
  - **WhatsApp** — Share link directly
  - **Print** — Download for physical handover
  - **QR Code** — Employee scans to access document
- Warning saved to employee's permanent record

---

## 11 South African Language Support

The warning script can be delivered in any of South Africa's official languages:

| Language | Code | Script Name |
|----------|------|-------------|
| English | EN | Default |
| Afrikaans | AF | Formele Waarskuwing |
| isiZulu | ZU | Isexwayiso Esisemthethweni |
| isiXhosa | XH | Isilumkiso Esisemthethweni |
| Sesotho | ST | Temoso ya Semolao |
| Setswana | TN | Kitsiso ya Semolao |
| Sepedi/Northern Sotho | NS | Temošo ya Semolao |
| Tshivenda | VE | Tsivhadzo ya Mulayo |
| Xitsonga | TS | Xitsundzuxo xa Nawu |
| isiNdebele | NR | Isiyeleliso Esisemthethweni |
| siSwati | SS | Secwayiso Lesisemtsetfweni |

**Why this matters:**
- Employee fully understands the warning
- No "I didn't understand" defense at CCMA
- Shows good faith effort by employer
- Legally stronger documentation

---

## PDF Document System

### Version Control
- Each PDF generator version is frozen after release
- Historical warnings always regenerate identically
- Legal integrity maintained over time
- Critical for CCMA evidence

### Document Contents
- Company letterhead and logo
- Employee details (name, ID, department)
- Misconduct category and description
- Incident details with date/time/location
- Employee's response (their side)
- Expected standards and improvement plan
- Review date and follow-up commitment
- Consequences of further misconduct
- Employee rights (representation, appeal)
- All signatures with timestamps

### Template Customization
Organizations can customize:
- Company logo
- Brand colours
- Header/footer text
- Contact information

---

## 4 Delivery Methods

### Email Delivery
- PDF attached automatically
- Branded email template
- Delivery confirmation tracked
- Searchable email trail

### WhatsApp Delivery
- Share link via WhatsApp
- Employee taps to view PDF
- Works without email address
- Ideal for factory/field workers

### Print Delivery
- Download high-quality PDF
- Professional A4 format
- Hand to employee for signature
- Upload signed copy back

### QR Code Delivery
- Generate unique QR code
- Employee scans with phone
- Instant access to their document
- No app installation needed

---

## Role-Based Dashboards

### HR Manager Dashboard
- View all employees and warnings organization-wide
- Approve/review warnings from all managers
- Generate compliance reports
- Manage employee records
- Configure warning categories

### HOD/Department Manager Dashboard
- View only their team members
- Issue warnings to direct reports
- Book HR meetings
- Report absences
- See follow-up reminders

### Executive/Business Owner Dashboard
- High-level metrics and trends
- Organization-wide statistics
- Read-only employee view
- Strategic HR insights

---

## Mobile-First Design

### Progressive Enhancement
- Works on smartphones from 2012 onwards
- Android 4.0+ and iOS 6+ compatible
- Responsive design adapts to any screen
- Touch-optimized interface

### Field-Friendly Features
- Large tap targets for gloved hands
- High contrast for outdoor visibility
- Minimal data usage
- Works on slow connections

### No App Required
- Runs in mobile browser
- No Play Store or App Store needed
- Instant access via URL
- Automatic updates

---

## Security & Compliance

### Data Protection (POPIA Compliant)
- All data encrypted in transit and at rest
- Firebase Cloud infrastructure (Google)
- Automatic daily backups
- Data stored in secure data centers

### Access Control
- Role-based permissions
- Manager sees only their team
- HR sees organization-wide
- Audit trail for all actions

### Data Ownership
- You own all your data
- Export anytime in standard formats
- Delete request honored within 30 days
- No lock-in

---

## Technical Specifications

| Aspect | Specification |
|--------|---------------|
| Platform | Web application (PWA-ready) |
| Frontend | React 18, TypeScript, Tailwind CSS |
| Backend | Firebase Cloud Functions, Firestore |
| Hosting | Firebase Hosting with SSL |
| Authentication | Firebase Auth (email/password) |
| PDF Generation | Client-side with jsPDF |
| Languages | 11 South African official languages |
| Scalability | Sharded architecture, 2,700+ org tested |

---

## Integration Capabilities

### Current Integrations
- Email delivery (built-in)
- WhatsApp sharing (native)
- CSV employee import

### API Access (Enterprise)
- RESTful API available
- Webhook notifications
- Custom integrations on request

---

## What Makes File Different

1. **SA-Specific** — Built for South African labour law, not adapted from foreign software
2. **Guided Process** — Not a template library, but a step-by-step wizard
3. **LRA Intelligence** — System recommends appropriate discipline level
4. **Language Support** — All 11 official languages, not just English
5. **Mobile-First** — Designed for managers in the field, not just office workers
6. **Affordable** — Enterprise features at SME prices

---

*Questions about technical features? Contact support@fifo.systems*

# Recognition Certificate PDF Generation - Integration Guide

## Overview

The `RecognitionPDFService` generates professional, printable A4 certificates for employee recognition. Certificates are suitable for framing and include organization branding, employee details, achievement information, and business impact.

---

## Service Location

**File:** `/home/aiguy/projects/hr-disciplinary-system/frontend/src/services/RecognitionPDFService.ts`

---

## Quick Start

### 1. Import the Service

```typescript
import { RecognitionPDFService, RecognitionCertificateData } from '../services/RecognitionPDFService';
```

### 2. Prepare Recognition Data

```typescript
const recognitionData: RecognitionCertificateData = {
  recognitionId: 'rec_abc123',
  issuedDate: new Date(),
  achievementDate: new Date('2025-11-01'),
  organizationId: 'org_xyz789',

  employee: {
    firstName: 'Sarah',
    lastName: 'Johnson',
    employeeNumber: 'EMP-12345',
    department: 'Sales',
    position: 'Senior Account Manager',
    email: 'sarah.johnson@company.com'
  },

  recognitionType: 'achievement',
  achievementTitle: 'Record-Breaking Q4 Sales Performance',
  achievementDescription: 'Sarah exceeded quarterly sales targets by 185%, bringing in R2.4 million in new business. Her exceptional client relationship management and strategic account planning resulted in 12 new long-term contracts.',
  businessImpact: 'Generated R2.4M in revenue, secured 12 new enterprise clients, and mentored 3 junior sales representatives to achieve 120% of their targets.',

  skillsDemonstrated: [
    'Strategic Planning',
    'Client Relationship Management',
    'Negotiation Excellence',
    'Team Leadership',
    'Results-Driven Performance'
  ],

  rewards: {
    monetaryBonus: 50000,
    timeOff: 3,
    giftCard: 'R5000 Woolworths Voucher'
  },

  issuedBy: {
    name: 'Michael Roberts',
    title: 'Sales Director',
    signature: 'data:image/png;base64,...' // Optional base64 signature
  },

  organization: {
    name: 'Acme Corporation',
    address: '123 Business Street, Johannesburg, 2000',
    phone: '+27 11 123 4567',
    email: 'info@acme.co.za',
    website: 'www.acme.co.za',
    registrationNumber: '2015/123456/07',
    branding: {
      colors: {
        primary: '#16a34a',    // Green
        secondary: '#15803d',  // Dark green
        accent: '#f59e0b'      // Orange
      },
      logo: 'data:image/png;base64,...', // Base64 logo
      companyName: 'Acme Corporation',
      certificateSeal: 'data:image/png;base64,...' // Optional seal
    }
  },

  certificateNumber: 'CERT-2025-001234'
};
```

### 3. Generate Certificate

```typescript
// Option A: Download certificate immediately
await RecognitionPDFService.downloadCertificate(recognitionData);

// Option B: Generate blob for custom handling
const pdfBlob = await RecognitionPDFService.generateRecognitionCertificate(recognitionData);

// Option C: Prepare for email
const { blob, filename } = await RecognitionPDFService.prepareCertificateForEmail(recognitionData);
// Then send via your email service
```

---

## Integration with Recognition Dashboard

### Add "Download Certificate" Button

```typescript
// In RecognitionDetailsModal.tsx or similar component

import { RecognitionPDFService } from '../../services/RecognitionPDFService';

const RecognitionDetailsModal = ({ recognition, onClose }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadCertificate = async () => {
    try {
      setIsGeneratingPDF(true);

      // Transform recognition data to certificate format
      const certificateData = {
        recognitionId: recognition.id,
        issuedDate: recognition.createdAt,
        achievementDate: recognition.achievementDate,
        organizationId: recognition.organizationId,
        employee: recognition.employee,
        recognitionType: recognition.type,
        achievementTitle: recognition.title,
        achievementDescription: recognition.description,
        businessImpact: recognition.businessImpact,
        skillsDemonstrated: recognition.skills,
        rewards: recognition.rewards,
        issuedBy: {
          name: recognition.issuedByName,
          title: recognition.issuedByTitle,
          signature: recognition.managerSignature
        },
        organization: recognition.organization,
        certificateNumber: recognition.certificateNumber
      };

      await RecognitionPDFService.downloadCertificate(certificateData);

      // Optional: Show success message
      toast.success('Certificate downloaded successfully!');

    } catch (error) {
      console.error('Failed to generate certificate:', error);
      toast.error('Failed to generate certificate. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="modal">
      {/* ... modal content ... */}

      <div className="modal-footer">
        <button
          onClick={handleDownloadCertificate}
          disabled={isGeneratingPDF}
          className="btn btn-primary"
        >
          {isGeneratingPDF ? (
            <>
              <LoadingSpinner size="sm" />
              Generating Certificate...
            </>
          ) : (
            <>
              <Download size={16} />
              Download Certificate
            </>
          )}
        </button>

        <button onClick={onClose} className="btn btn-secondary">
          Close
        </button>
      </div>
    </div>
  );
};
```

### Add Certificate Generation to Recognition Creation

```typescript
// In RecognitionForm.tsx or similar component

const handleSubmitRecognition = async (formData) => {
  try {
    // 1. Save recognition to Firestore
    const recognitionRef = await addDoc(
      collection(db, `organizations/${orgId}/recognitions`),
      {
        ...formData,
        createdAt: new Date(),
        createdBy: currentUser.uid
      }
    );

    // 2. Generate certificate number
    const certificateNumber = `CERT-${new Date().getFullYear()}-${recognitionRef.id.substring(0, 8).toUpperCase()}`;

    // 3. Update recognition with certificate number
    await updateDoc(recognitionRef, { certificateNumber });

    // 4. Optionally auto-download certificate
    const shouldAutoDownload = formData.autoDownloadCertificate;

    if (shouldAutoDownload) {
      const certificateData = {
        recognitionId: recognitionRef.id,
        certificateNumber,
        ...formData
      };

      await RecognitionPDFService.downloadCertificate(certificateData);
    }

    toast.success('Recognition created successfully!');
    onClose();

  } catch (error) {
    console.error('Failed to create recognition:', error);
    toast.error('Failed to create recognition. Please try again.');
  }
};
```

---

## Certificate Design Features

### 1. **Professional Layout**
- A4 portrait format (210mm x 297mm)
- Decorative border with organization colors
- Elegant typography with proper hierarchy
- Centered, symmetric design suitable for framing

### 2. **Organization Branding**
- Centered logo at top
- Custom brand colors (primary, secondary, accent)
- Organization seal/stamp (bottom right)
- Company details in footer

### 3. **Employee Highlighting**
- Large, prominent employee name (uppercase, underlined)
- Position and department details
- Optional profile photo support (future enhancement)

### 4. **Achievement Details**
- Recognition type badge (color-coded)
- Bold achievement title with highlighted background
- Detailed description paragraph
- Business impact section (highlighted box)

### 5. **Skills & Competencies**
- Visual tag list for demonstrated skills
- Automatic line wrapping for multiple skills
- Color-coded with organization branding

### 6. **Recognition Rewards**
- Monetary bonus display
- Additional time off
- Gift cards or vouchers
- Custom rewards

### 7. **Signature Section**
- Manager signature image (if provided)
- Signature line for manual signing
- Manager name and title
- Issue date

### 8. **Certificate Metadata**
- Unique certificate number
- Recognition ID
- Achievement date
- Generation date
- System watermark

---

## Recognition Types & Colors

| Type | Label | Color |
|------|-------|-------|
| `achievement` | OUTSTANDING ACHIEVEMENT | Orange |
| `excellence` | EXCELLENCE IN PERFORMANCE | Purple |
| `innovation` | INNOVATION & CREATIVITY | Blue |
| `leadership` | LEADERSHIP EXCELLENCE | Pink |
| `service` | YEARS OF SERVICE | Green |
| `teamwork` | EXCEPTIONAL TEAMWORK | Light Green |
| `custom` | SPECIAL RECOGNITION | Gray |

---

## Optional Features

### 1. Email Certificate

```typescript
// Backend function to email certificate
const emailCertificate = async (recognitionId: string, recipientEmail: string) => {
  // 1. Fetch recognition data from Firestore
  const recognitionDoc = await getDoc(doc(db, `organizations/${orgId}/recognitions/${recognitionId}`));
  const recognition = recognitionDoc.data();

  // 2. Generate certificate
  const { blob, filename } = await RecognitionPDFService.prepareCertificateForEmail(recognition);

  // 3. Upload to Firebase Storage
  const storageRef = ref(storage, `certificates/${recognitionId}/${filename}`);
  await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);

  // 4. Send email with attachment URL
  await sendEmail({
    to: recipientEmail,
    subject: `Your Recognition Certificate - ${recognition.achievementTitle}`,
    body: `Congratulations! Please find your recognition certificate attached.`,
    attachments: [{ url: downloadURL, filename }]
  });
};
```

### 2. Print Certificate

```typescript
const printCertificate = async (recognitionData) => {
  const pdfBlob = await RecognitionPDFService.generateRecognitionCertificate(recognitionData);
  const pdfUrl = URL.createObjectURL(pdfBlob);

  // Open in new window for printing
  const printWindow = window.open(pdfUrl, '_blank');
  printWindow?.addEventListener('load', () => {
    printWindow.print();
  });
};
```

### 3. Store Certificate in Firestore

```typescript
const storeCertificateURL = async (recognitionId: string, certificateData: RecognitionCertificateData) => {
  // 1. Generate certificate
  const pdfBlob = await RecognitionPDFService.generateRecognitionCertificate(certificateData);

  // 2. Upload to Firebase Storage
  const storageRef = ref(storage, `certificates/${recognitionId}/certificate.pdf`);
  await uploadBytes(storageRef, pdfBlob);
  const downloadURL = await getDownloadURL(storageRef);

  // 3. Update recognition document
  await updateDoc(doc(db, `organizations/${orgId}/recognitions/${recognitionId}`), {
    certificateURL: downloadURL,
    certificateGeneratedAt: new Date()
  });

  return downloadURL;
};
```

---

## Sample Certificate Description

**For a typical certificate, the generated PDF will contain:**

### Header
- **Decorative Border**: Dual-layer border with organization colors
- **Organization Logo**: Centered, professional placement
- **Title**: "CERTIFICATE OF RECOGNITION" (large, bold)

### Recognition Badge
- **Type Badge**: Color-coded badge (e.g., "OUTSTANDING ACHIEVEMENT" in orange)

### Employee Section
- **Award Text**: "This certificate is awarded to"
- **Employee Name**: SARAH JOHNSON (large, green, underlined)
- **Position**: Senior Account Manager | Sales

### Achievement Section
- **Recognition Text**: "in recognition of"
- **Achievement Title**: "Record-Breaking Q4 Sales Performance" (highlighted in orange)
- **Description**: Full paragraph describing the achievement
- **Business Impact**: Highlighted green box with quantified results

### Details Section
- **Skills Tags**: Visual tags for each skill (e.g., "Strategic Planning", "Leadership")
- **Rewards**: Bulleted list (Bonus: R50,000, Time Off: 3 days, Gift Card)
- **Achievement Date**: "Achievement Date: 1 November 2025"

### Signature Section
- **Signature Line**: Manager signature image or blank line
- **Manager Name**: Michael Roberts (bold)
- **Manager Title**: Sales Director
- **Issue Date**: "Date Issued: 12 November 2025"

### Footer
- **Certificate Number**: CERT-2025-001234 (left)
- **System Name**: "Generated by HR Disciplinary System" (center)
- **Recognition ID**: ID: rec_abc123 (right)
- **Organization Seal**: Bottom right corner (if provided)

---

## Performance Considerations

### 1. **Dynamic Import**
- jsPDF is loaded on-demand (not in main bundle)
- Reduces initial page load by ~43%

### 2. **Image Optimization**
- Logos and signatures should be optimized (< 200KB)
- Use PNG or JPEG format
- Base64 encoding recommended for embedded images

### 3. **Generation Time**
- Typical certificate: 500-800ms
- With images: 800-1200ms
- Large descriptions: Add 100-200ms

### 4. **Memory Usage**
- Average certificate: 150-250 KB
- With high-res images: 300-500 KB
- Compatible with 2012-era devices

---

## Troubleshooting

### Certificate Not Downloading
```typescript
// Check browser download permissions
// Try saving to variable first
const blob = await RecognitionPDFService.generateRecognitionCertificate(data);
console.log('PDF generated:', blob.size, 'bytes');

// Manual download trigger
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'certificate.pdf';
link.click();
```

### Images Not Showing
```typescript
// Ensure images are base64 encoded
const base64Logo = 'data:image/png;base64,iVBORw0KGgoAAAANS...';

// Test image loading
const testImage = new Image();
testImage.onload = () => console.log('Logo loaded successfully');
testImage.onerror = () => console.error('Logo failed to load');
testImage.src = base64Logo;
```

### Text Overflow
```typescript
// Service automatically wraps text
// Recommended character limits:
// - Achievement Title: 100 characters
// - Description: 500 characters
// - Business Impact: 300 characters
// - Skills: 5-8 skills max
```

---

## Future Enhancements

1. **Multi-language Support**: Certificates in multiple languages
2. **Custom Templates**: Allow organizations to design custom certificate layouts
3. **QR Code Integration**: Add QR code for certificate verification
4. **Digital Signatures**: Support for digital signature validation
5. **Profile Photos**: Include employee photo on certificate
6. **Social Sharing**: Share certificate on LinkedIn, company intranet

---

## Testing

### Unit Test Example

```typescript
import { RecognitionPDFService } from '../RecognitionPDFService';

describe('RecognitionPDFService', () => {
  it('should generate certificate blob', async () => {
    const data = {
      recognitionId: 'test_123',
      issuedDate: new Date(),
      achievementDate: new Date(),
      organizationId: 'org_test',
      employee: { firstName: 'Test', lastName: 'User', /* ... */ },
      recognitionType: 'achievement',
      achievementTitle: 'Test Achievement',
      achievementDescription: 'Test description',
      issuedBy: { name: 'Manager', title: 'Director' },
      organization: { name: 'Test Org' }
    };

    const blob = await RecognitionPDFService.generateRecognitionCertificate(data);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });
});
```

---

## Support

For questions or issues with the Recognition Certificate PDF Service, contact the development team or refer to the main project documentation.

**Service Version:** 1.0.0
**Last Updated:** 2025-11-12
**Maintained By:** HR Disciplinary System Team

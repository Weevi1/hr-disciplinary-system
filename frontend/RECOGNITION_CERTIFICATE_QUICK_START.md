# Recognition Certificate PDF - Quick Start Guide

⚡ **Fast reference for developers integrating the Recognition Certificate PDF Service**

---

## 1. Import

```typescript
import { RecognitionPDFService, RecognitionCertificateData } from '../services/RecognitionPDFService';
```

---

## 2. Minimal Example (Required Fields Only)

```typescript
const certificateData: RecognitionCertificateData = {
  // IDs & Dates (required)
  recognitionId: 'rec_123',
  issuedDate: new Date(),
  achievementDate: new Date(),
  organizationId: 'org_456',

  // Employee (required)
  employee: {
    firstName: 'John',
    lastName: 'Doe',
    employeeNumber: 'EMP-001',
    department: 'Sales',
    position: 'Account Manager'
  },

  // Recognition (required)
  recognitionType: 'achievement',
  achievementTitle: 'Outstanding Sales Performance',
  achievementDescription: 'Exceeded targets by 150% in Q4 2025.',

  // Issuer (required)
  issuedBy: {
    name: 'Jane Smith',
    title: 'Sales Director'
  },

  // Organization (required)
  organization: {
    name: 'Acme Corporation'
  }
};

// Generate & download
await RecognitionPDFService.downloadCertificate(certificateData);
```

---

## 3. Full Example (All Optional Fields)

```typescript
const certificateData: RecognitionCertificateData = {
  // Required fields
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
    email: 'sarah@acme.com',              // Optional
    profilePhoto: 'data:image/png;...'    // Optional (future use)
  },

  recognitionType: 'achievement',
  achievementTitle: 'Record-Breaking Q4 Sales',
  achievementDescription: 'Sarah exceeded quarterly sales targets by 185%...',

  // Optional: Business impact
  businessImpact: 'Generated R2.4M in revenue, secured 12 new clients.',

  // Optional: Skills demonstrated
  skillsDemonstrated: [
    'Strategic Planning',
    'Client Management',
    'Negotiation'
  ],

  // Optional: Rewards
  rewards: {
    monetaryBonus: 50000,        // Optional
    timeOff: 3,                  // Optional (days)
    giftCard: 'R5000 Voucher',   // Optional
    other: 'Parking spot'        // Optional
  },

  issuedBy: {
    name: 'Michael Roberts',
    title: 'Sales Director',
    signature: 'data:image/png;...'  // Optional base64 image
  },

  organization: {
    name: 'Acme Corporation',
    address: '123 Business St',      // Optional
    phone: '+27 11 123 4567',        // Optional
    email: 'info@acme.com',          // Optional
    website: 'www.acme.com',         // Optional
    registrationNumber: '2015/123456/07', // Optional
    branding: {                      // Optional
      colors: {
        primary: '#16a34a',    // Green
        secondary: '#15803d',  // Dark green
        accent: '#f59e0b'      // Orange
      },
      logo: 'data:image/png;...',           // Base64
      companyName: 'Acme Corporation',
      certificateSeal: 'data:image/png;...' // Base64
    }
  },

  // Optional: Certificate tracking
  certificateNumber: 'CERT-2025-001234'
};

await RecognitionPDFService.downloadCertificate(certificateData);
```

---

## 4. Three Ways to Generate

### Method 1: Direct Download (Most Common)
```typescript
await RecognitionPDFService.downloadCertificate(certificateData);
// ✅ Automatically downloads with filename: Certificate_JohnDoe_2025-11-12.pdf
```

### Method 2: Get Blob (Custom Handling)
```typescript
const pdfBlob = await RecognitionPDFService.generateRecognitionCertificate(certificateData);
// ✅ Do whatever you want with the blob (upload, email, etc.)
```

### Method 3: Prepare for Email
```typescript
const { blob, filename } = await RecognitionPDFService.prepareCertificateForEmail(certificateData);
// ✅ Returns blob + suggested filename for email attachment
```

---

## 5. Recognition Types & Colors

```typescript
// Available types (affects badge color and label)
type RecognitionType =
  | 'achievement'   // Orange badge - "OUTSTANDING ACHIEVEMENT"
  | 'excellence'    // Purple badge - "EXCELLENCE IN PERFORMANCE"
  | 'innovation'    // Blue badge - "INNOVATION & CREATIVITY"
  | 'leadership'    // Pink badge - "LEADERSHIP EXCELLENCE"
  | 'service'       // Green badge - "YEARS OF SERVICE"
  | 'teamwork'      // Light Green badge - "EXCEPTIONAL TEAMWORK"
  | 'custom';       // Gray badge - "SPECIAL RECOGNITION"
```

---

## 6. React Component Integration

```typescript
const RecognitionCard = ({ recognition }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await RecognitionPDFService.downloadCertificate(recognition);
      toast.success('Certificate downloaded!');
    } catch (error) {
      toast.error('Download failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleDownload} disabled={loading}>
      {loading ? 'Generating...' : 'Download Certificate'}
    </button>
  );
};
```

---

## 7. Firestore Integration

### Save Certificate URL to Firestore
```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

const storeCertificate = async (recognitionId: string, certificateData: RecognitionCertificateData) => {
  // 1. Generate certificate
  const pdfBlob = await RecognitionPDFService.generateRecognitionCertificate(certificateData);

  // 2. Upload to Firebase Storage
  const storageRef = ref(storage, `certificates/${recognitionId}/certificate.pdf`);
  await uploadBytes(storageRef, pdfBlob);
  const downloadURL = await getDownloadURL(storageRef);

  // 3. Update Firestore document
  await updateDoc(doc(db, `organizations/${orgId}/recognitions/${recognitionId}`), {
    certificateURL: downloadURL,
    certificateGeneratedAt: new Date()
  });

  return downloadURL;
};
```

### Auto-generate on Recognition Creation
```typescript
const createRecognition = async (formData) => {
  // 1. Create recognition document
  const docRef = await addDoc(
    collection(db, `organizations/${orgId}/recognitions`),
    {
      ...formData,
      createdAt: new Date()
    }
  );

  // 2. Generate certificate number
  const certNumber = `CERT-${new Date().getFullYear()}-${docRef.id.substring(0, 8).toUpperCase()}`;

  // 3. Update with certificate number
  await updateDoc(docRef, { certificateNumber: certNumber });

  // 4. Auto-download certificate (optional)
  if (formData.autoDownloadCertificate) {
    await RecognitionPDFService.downloadCertificate({
      recognitionId: docRef.id,
      certificateNumber: certNumber,
      ...formData
    });
  }
};
```

---

## 8. Common Patterns

### Pattern 1: Generate Certificate Button in Modal
```typescript
<button
  onClick={() => RecognitionPDFService.downloadCertificate(recognitionData)}
  className="btn-primary"
>
  <Download size={16} />
  Download Certificate
</button>
```

### Pattern 2: Print Certificate
```typescript
const printCertificate = async (data: RecognitionCertificateData) => {
  const blob = await RecognitionPDFService.generateRecognitionCertificate(data);
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  printWindow?.addEventListener('load', () => printWindow.print());
};
```

### Pattern 3: Bulk Certificate Generation
```typescript
const generateMultipleCertificates = async (recognitions: RecognitionCertificateData[]) => {
  for (const recognition of recognitions) {
    await RecognitionPDFService.downloadCertificate(recognition);
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
  }
};
```

---

## 9. Image Encoding (Logo & Signature)

### Convert Image File to Base64
```typescript
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Usage
const logoFile = event.target.files[0];
const logoBase64 = await fileToBase64(logoFile);
// Result: 'data:image/png;base64,iVBORw0KGgo...'
```

### Download Image URL to Base64
```typescript
const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Usage
const logoBase64 = await urlToBase64('https://example.com/logo.png');
```

---

## 10. Error Handling

```typescript
const safeGenerateCertificate = async (data: RecognitionCertificateData) => {
  try {
    await RecognitionPDFService.downloadCertificate(data);
    return { success: true };
  } catch (error) {
    console.error('Certificate generation failed:', error);

    // Handle specific errors
    if (error.message.includes('jsPDF')) {
      return { success: false, error: 'PDF library failed to load' };
    } else if (error.message.includes('image')) {
      return { success: false, error: 'Logo or signature failed to load' };
    } else {
      return { success: false, error: 'Unknown error occurred' };
    }
  }
};
```

---

## 11. Performance Tips

### Tip 1: Optimize Images
```typescript
// Keep logo files under 200KB
// Recommended: 400px width, PNG or JPEG
// Use compression tools before converting to base64
```

### Tip 2: Cache Organization Data
```typescript
// Store organization branding in context to avoid re-fetching
const { organization } = useOrganization();

const certificateData = {
  ...recognitionData,
  organization // Cached organization data
};
```

### Tip 3: Lazy Load Service
```typescript
// Service already uses dynamic import for jsPDF
// First call: ~800ms (loads jsPDF)
// Subsequent calls: ~500ms (cached)
```

---

## 12. Testing

### Unit Test
```typescript
import { RecognitionPDFService } from './RecognitionPDFService';

describe('RecognitionPDFService', () => {
  it('generates certificate blob', async () => {
    const data = {
      recognitionId: 'test',
      issuedDate: new Date(),
      achievementDate: new Date(),
      organizationId: 'test',
      employee: { firstName: 'Test', lastName: 'User', /* ... */ },
      recognitionType: 'achievement' as const,
      achievementTitle: 'Test',
      achievementDescription: 'Test',
      issuedBy: { name: 'Manager', title: 'Director' },
      organization: { name: 'Test Org' }
    };

    const blob = await RecognitionPDFService.generateRecognitionCertificate(data);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });
});
```

### E2E Test
```typescript
test('downloads recognition certificate', async ({ page }) => {
  await page.goto('/recognitions');
  await page.click('[data-testid="recognition-card"]');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-testid="download-certificate-btn"]')
  ]);

  expect(download.suggestedFilename()).toContain('Certificate_');
  expect(download.suggestedFilename()).toContain('.pdf');
});
```

---

## 13. Common Issues

### Issue: "jsPDF is not defined"
**Solution:** Service uses dynamic import. Ensure async/await is used:
```typescript
await RecognitionPDFService.downloadCertificate(data); // ✅ Correct
RecognitionPDFService.downloadCertificate(data);       // ❌ Wrong (missing await)
```

### Issue: Logo not appearing
**Solution:** Check base64 encoding format:
```typescript
// ✅ Correct
logo: 'data:image/png;base64,iVBORw0KGgo...'

// ❌ Wrong (missing data URI prefix)
logo: 'iVBORw0KGgo...'
```

### Issue: Text overflow
**Solution:** Service auto-wraps text. Recommended limits:
- Achievement Title: 100 characters
- Description: 500 characters
- Business Impact: 300 characters
- Skills: 5-8 skills max

---

## 14. TypeScript Types

```typescript
// Complete type definition
interface RecognitionCertificateData {
  recognitionId: string;
  issuedDate: Date;
  achievementDate: Date;
  organizationId: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department: string;
    position: string;
    email?: string;
    profilePhoto?: string;
  };
  recognitionType: 'achievement' | 'excellence' | 'innovation' |
                   'leadership' | 'service' | 'teamwork' | 'custom';
  achievementTitle: string;
  achievementDescription: string;
  businessImpact?: string;
  skillsDemonstrated?: string[];
  rewards?: {
    monetaryBonus?: number;
    timeOff?: number;
    giftCard?: string;
    other?: string;
  };
  issuedBy: {
    name: string;
    title: string;
    signature?: string;
  };
  organization: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    registrationNumber?: string;
    branding?: {
      colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
      };
      logo?: string;
      companyName?: string;
      certificateSeal?: string;
    };
  };
  certificateNumber?: string;
}
```

---

## 15. File Locations

```
frontend/
├── src/
│   ├── services/
│   │   └── RecognitionPDFService.ts          # ← Main service
│   ├── components/
│   │   └── recognition/
│   │       ├── RecognitionDashboard.tsx      # Use here
│   │       └── RecognitionDetailsModal.tsx   # Use here
│   └── types/
│       └── recognition.ts                    # Add types here
└── RECOGNITION_CERTIFICATE_INTEGRATION.md    # Full documentation
```

---

## 16. Next Steps

1. **Create Recognition System** (if not exists):
   - Firestore collection: `organizations/{orgId}/recognitions`
   - Add recognition form component
   - Add recognition dashboard

2. **Add Certificate Button**:
   - In recognition details modal
   - In recognition dashboard cards

3. **Test Certificate Generation**:
   - Test with minimal data
   - Test with full data
   - Test with logo/signature images

4. **Optional Enhancements**:
   - Email certificate to employee
   - Store certificate URL in Firestore
   - Add certificate preview before download

---

**Quick Links:**
- 📄 [Full Integration Guide](./RECOGNITION_CERTIFICATE_INTEGRATION.md)
- 🎨 [Visual Sample](./RECOGNITION_CERTIFICATE_SAMPLE.md)
- 📁 [Service Code](/home/aiguy/projects/hr-disciplinary-system/frontend/src/services/RecognitionPDFService.ts)

**Version:** 1.0.0
**Last Updated:** 2025-11-12

// frontend/src/components/admin/steps/BrandingStep.tsx
import { useRef, useState } from 'react';
import type { WizardFormData } from '../OrganizationWizard';

interface StepProps {
  formData: WizardFormData;
  setFormData: (data: WizardFormData) => void;
}

export const BrandingStep = ({ formData, setFormData }: StepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (PNG, JPG, JPEG, or SVG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setUploadError('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Convert to base64 for preview (in a real app, you'd upload to a server/cloud storage)
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setFormData({ ...formData, logoUrl: base64 });
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError('Failed to read file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadError('Failed to upload file');
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const removeLogo = () => {
    setFormData({ ...formData, logoUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          Branding & Customization
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Customize the look and feel to match your client's brand identity.
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ 
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '0.5rem'
        }}>
          Company Logo
        </label>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {formData.logoUrl ? (
          // Logo preview
          <div style={{
            border: '2px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <img
              src={formData.logoUrl}
              alt="Company logo"
              style={{
                width: '4rem',
                height: '4rem',
                objectFit: 'contain',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0'
              }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                margin: '0 0 0.25rem 0'
              }}>
                Logo uploaded successfully
              </p>
              <p style={{ 
                fontSize: '0.75rem',
                color: '#64748b',
                margin: 0
              }}>
                Click "Change Logo" to upload a different image
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleClick}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.75rem',
                  border: '1px solid #8b5cf6',
                  backgroundColor: 'white',
                  color: '#8b5cf6',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                Change Logo
              </button>
              <button
                onClick={removeLogo}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.75rem',
                  border: '1px solid #ef4444',
                  backgroundColor: 'white',
                  color: '#ef4444',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          // Upload area
          <div 
            style={{
              border: `2px dashed ${isDragOver ? '#8b5cf6' : '#e2e8f0'}`,
              borderRadius: '0.5rem',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: isDragOver ? '#f3e8ff' : '#f8fafc'
            }}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div>
                <div style={{ 
                  width: '3rem',
                  height: '3rem',
                  margin: '0 auto 1rem',
                  color: '#8b5cf6'
                }}>
                  <svg className="animate-spin" fill="none" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }}></path>
                  </svg>
                </div>
                <p style={{ 
                  fontSize: '0.875rem',
                  color: '#8b5cf6',
                  margin: 0
                }}>
                  Uploading...
                </p>
              </div>
            ) : (
              <div>
                <div style={{ 
                  width: '3rem',
                  height: '3rem',
                  margin: '0 auto 1rem',
                  color: '#9ca3af'
                }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p style={{ 
                  fontSize: '0.875rem',
                  color: '#64748b',
                  marginBottom: '0.25rem'
                }}>
                  Click to upload or drag and drop
                </p>
                <p style={{ 
                  fontSize: '0.75rem',
                  color: '#9ca3af'
                }}>
                  PNG, JPG, JPEG, SVG up to 10MB
                </p>
              </div>
            )}
          </div>
        )}

        {uploadError && (
          <p style={{ 
            fontSize: '0.75rem',
            color: '#ef4444',
            marginTop: '0.5rem',
            margin: '0.5rem 0 0 0'
          }}>
            {uploadError}
          </p>
        )}
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: window.innerWidth > 768 ? 'repeat(3, 1fr)' : '1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div>
          <label style={{ 
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Primary Color
          </label>
          <p style={{ 
            fontSize: '0.75rem',
            color: '#64748b',
            marginBottom: '0.75rem',
            margin: '0 0 0.75rem 0'
          }}>
            Main buttons, headers, key UI elements
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="color"
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              style={{
                width: '5rem',
                height: '2.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            />
            <input
              type="text"
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                color: '#1f2937'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        <div>
          <label style={{ 
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Secondary Color
          </label>
          <p style={{ 
            fontSize: '0.75rem',
            color: '#64748b',
            marginBottom: '0.75rem',
            margin: '0 0 0.75rem 0'
          }}>
            Secondary buttons, backgrounds
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="color"
              value={formData.secondaryColor}
              onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
              style={{
                width: '5rem',
                height: '2.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            />
            <input
              type="text"
              value={formData.secondaryColor}
              onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                color: '#1f2937'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        <div>
          <label style={{ 
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Accent Color
          </label>
          <p style={{ 
            fontSize: '0.75rem',
            color: '#64748b',
            marginBottom: '0.75rem',
            margin: '0 0 0.75rem 0'
          }}>
            Badges, highlights, notifications
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="color"
              value={formData.accentColor || '#10b981'}
              onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
              style={{
                width: '5rem',
                height: '2.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            />
            <input
              type="text"
              value={formData.accentColor || '#10b981'}
              onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                color: '#1f2937'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>
      </div>

      <div>
        <label style={{ 
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '1rem'
        }}>
          Theme Preview
        </label>
        <div className="hr-card" style={{ 
          backgroundColor: '#f8fafc',
          padding: '2rem'
        }}>
          <div style={{ maxWidth: '24rem', margin: '0 auto' }}>
            <div className="hr-card" style={{ padding: '1.5rem' }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Company logo"
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        objectFit: 'contain',
                        borderRadius: '0.375rem'
                      }}
                    />
                  ) : (
                    <div 
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.375rem',
                        backgroundColor: formData.primaryColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {(formData.companyName || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 style={{ 
                      fontWeight: '600',
                      margin: '0 0 0.125rem 0',
                      color: '#1e293b'
                    }}>
                      {formData.companyName || 'Company Name'}
                    </h4>
                    <p style={{ 
                      fontSize: '0.75rem',
                      color: '#64748b',
                      margin: 0
                    }}>
                      File by Fifo
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: formData.primaryColor,
                    color: 'white',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Primary Button
                </button>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: formData.secondaryColor,
                    color: 'white',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Secondary Button
                </button>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: formData.accentColor || '#10b981',
                      color: 'white',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}
                  >
                    Badge
                  </span>
                  <span style={{ color: '#64748b' }}>Accent Color Preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

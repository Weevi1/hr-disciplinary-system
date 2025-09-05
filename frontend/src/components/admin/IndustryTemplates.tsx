// frontend/src/components/admin/IndustryTemplates.tsx
export const IndustryTemplates = () => {
  const templates = [
    { 
      id: 'manufacturing', 
      name: 'Manufacturing', 
      icon: '🏭', 
      categories: 12, 
      description: 'Heavy industry, production lines, safety focus',
      color: '#3b82f6'
    },
    { 
      id: 'retail', 
      name: 'Retail', 
      icon: '🛍️', 
      categories: 10, 
      description: 'Customer service, inventory, shift management',
      color: '#10b981'
    },
    { 
      id: 'healthcare', 
      name: 'Healthcare', 
      icon: '🏥', 
      categories: 15, 
      description: 'Patient care, compliance, medical standards',
      color: '#ef4444'
    },
    { 
      id: 'security', 
      name: 'Security', 
      icon: '🛡️', 
      categories: 18, 
      description: 'Strict protocols, incident management, access control',
      color: '#f59e0b'
    },
    { 
      id: 'hospitality', 
      name: 'Hospitality', 
      icon: '🏨', 
      categories: 11, 
      description: 'Guest services, hospitality standards, shift work',
      color: '#8b5cf6'
    },
    { 
      id: 'education', 
      name: 'Education', 
      icon: '🎓', 
      categories: 8, 
      description: 'Academic institutions, student safety, conduct',
      color: '#6366f1'
    }
  ];

  return (
    <div className="hr-card" style={{ marginBottom: '2rem' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>📦</span>
          Industry Templates
        </h2>
      </div>
      
      <div style={{ 
        padding: '1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem'
      }}>
        {templates.map((template) => (
          <div 
            key={template.id}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = template.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{
                fontSize: '2rem',
                width: '3rem',
                height: '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${template.color}15`,
                borderRadius: '0.5rem'
              }}>
                {template.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0 0 0.25rem 0',
                  color: '#1e293b'
                }}>
                  {template.name}
                </h3>
                <p style={{ 
                  fontSize: '0.75rem',
                  color: '#64748b',
                  margin: '0 0 0.5rem 0'
                }}>
                  {template.categories} warning categories
                </p>
                <p style={{ 
                  fontSize: '0.875rem',
                  color: '#475569',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  {template.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

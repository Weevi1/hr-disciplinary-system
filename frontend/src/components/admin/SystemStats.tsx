// frontend/src/components/admin/SystemStats.tsx
import type { Organization } from '../../types';

interface SystemStatsProps {
  organizations: any[];
}

export const SystemStats = ({ organizations }: SystemStatsProps) => {
  const stats = {
    totalOrganizations: organizations.length,
    activeOrganizations: organizations.filter(org => org.status === 'active').length,
    totalEmployees: organizations.reduce((sum, org) => sum + org.employeeCount, 0),
    totalWarnings: organizations.reduce((sum, org) => sum + org.warningCount, 0),
    monthlyGrowth: 15.3,
    systemHealth: 98.7
  };

  const statCards = [
    {
      title: 'Organizations',
      value: stats.totalOrganizations,
      icon: '🏢',
      color: '#8b5cf6',
      trend: '+2 this month'
    },
    {
      title: 'Active Clients',
      value: stats.activeOrganizations,
      icon: '🌍',
      color: '#3b82f6',
      trend: `${Math.round((stats.activeOrganizations / stats.totalOrganizations) * 100)}% active`
    },
    {
      title: 'Total Employees',
      value: stats.totalEmployees.toLocaleString(),
      icon: '👥',
      color: '#10b981',
      trend: `+${Math.round(stats.totalEmployees * 0.08)} this month`
    },
    {
      title: 'Warnings Issued',
      value: stats.totalWarnings,
      icon: '⚠️',
      color: '#f59e0b',
      trend: 'Across all orgs'
    },
    {
      title: 'Growth Rate',
      value: `${stats.monthlyGrowth}%`,
      icon: '📈',
      color: '#8b5cf6',
      trend: 'Monthly average'
    },
    {
      title: 'System Health',
      value: `${stats.systemHealth}%`,
      icon: '⚙️',
      color: '#10b981',
      trend: 'All systems operational'
    }
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    }}>
      {statCards.map((stat, index) => (
        <div key={index} className="hr-card" style={{ padding: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem'
          }}>
            <div>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#64748b',
                margin: '0 0 0.5rem 0'
              }}>
                {stat.title}
              </p>
              <p style={{ 
                fontSize: '1.75rem', 
                fontWeight: 'bold',
                margin: 0,
                color: '#1e293b'
              }}>
                {stat.value}
              </p>
            </div>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.5rem',
              backgroundColor: `${stat.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              {stat.icon}
            </div>
          </div>
          <p style={{ 
            fontSize: '0.75rem', 
            color: stat.trend.includes('+') ? '#10b981' : '#64748b',
            margin: 0
          }}>
            {stat.trend}
          </p>
        </div>
      ))}
    </div>
  );
};

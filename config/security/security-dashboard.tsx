// config/security/security-dashboard.tsx
// Security audit dashboard for super admins

import React, { useState, useEffect } from 'react'
import { SecurityAuditService } from './security-audit'
import { SecurityHardeningService } from './security-hardening'

interface SecurityAuditResult {
  score: number
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
  categories: {
    authentication: SecurityCategoryResult
    authorization: SecurityCategoryResult
    dataProtection: SecurityCategoryResult
    inputValidation: SecurityCategoryResult
    sessionManagement: SecurityCategoryResult
    errorHandling: SecurityCategoryResult
    logging: SecurityCategoryResult
    infrastructure: SecurityCategoryResult
  }
  vulnerabilities: SecurityVulnerability[]
  recommendations: SecurityRecommendation[]
}

interface SecurityCategoryResult {
  score: number
  maxScore: number
  checks: SecurityCheck[]
  status: 'pass' | 'warn' | 'fail'
}

interface SecurityCheck {
  name: string
  description: string
  status: 'pass' | 'warn' | 'fail'
  score: number
  maxScore: number
  details?: string
}

interface SecurityVulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  impact: string
  remediation: string
}

interface SecurityRecommendation {
  priority: 'immediate' | 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  implementation: string
}

/**
 * Security Audit Dashboard
 * Comprehensive security monitoring and audit interface for super admins
 */
export const SecurityAuditDashboard: React.FC = () => {
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [auditHistory, setAuditHistory] = useState<SecurityAuditResult[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    // Load audit history from localStorage
    const history = localStorage.getItem('security_audit_history')
    if (history) {
      setAuditHistory(JSON.parse(history))
    }

    // Initialize security hardening
    SecurityHardeningService.initialize()
  }, [])

  const runSecurityAudit = async () => {
    setLoading(true)
    try {
      const result = await SecurityAuditService.runSecurityAudit()
      setAuditResult(result)
      
      // Save to history
      const newHistory = [result, ...auditHistory.slice(0, 9)] // Keep last 10 audits
      setAuditHistory(newHistory)
      localStorage.setItem('security_audit_history', JSON.stringify(newHistory))
    } catch (error) {
      console.error('Security audit failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAuditReport = () => {
    if (!auditResult) return

    const report = SecurityAuditService.generateAuditReport(auditResult)
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `security-audit-report-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'text-green-600 bg-green-50 border-green-200'
      case 'B+':
      case 'B': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'C+':
      case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'D': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'F': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getCategoryStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-100'
      case 'warn': return 'text-yellow-600 bg-yellow-100'
      case 'fail': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Running security audit...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Audit Dashboard</h1>
          <p className="text-gray-600">Comprehensive security assessment and monitoring</p>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={runSecurityAudit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Running Audit...' : 'Run Security Audit'}
          </button>
          
          {auditResult && (
            <button
              onClick={generateAuditReport}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download Report
            </button>
          )}
        </div>
      </div>

      {auditResult && (
        <>
          {/* Security Grade Overview */}
          <div className={`p-6 rounded-lg border-2 mb-8 ${getGradeColor(auditResult.grade)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Security Grade: {auditResult.grade}</h2>
                <p className="text-lg">Overall Score: {auditResult.score.toFixed(1)}%</p>
                <p className="text-sm mt-2">
                  {auditResult.grade === 'A+' || auditResult.grade === 'A' 
                    ? '✅ Excellent security posture - Ready for production'
                    : auditResult.grade === 'B+' || auditResult.grade === 'B'
                    ? '⚠️ Good security - Some improvements recommended'
                    : '🚨 Security improvements required before production'
                  }
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600">Audit Date</div>
                <div className="font-medium">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Security Categories */}
          <div className="bg-white rounded-lg border p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Security Categories</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Object.entries(auditResult.categories).map(([category, data]) => (
                <div 
                  key={category}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCategory === category ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryStatusColor(data.status)}`}>
                      {data.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Score: {data.score}/{data.maxScore} ({((data.score / data.maxScore) * 100).toFixed(0)}%)
                  </div>
                </div>
              ))}
            </div>

            {/* Category Details */}
            {selectedCategory && auditResult.categories[selectedCategory as keyof typeof auditResult.categories] && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 capitalize">
                  {selectedCategory.replace(/([A-Z])/g, ' $1').trim()} Details
                </h4>
                
                <div className="space-y-2">
                  {auditResult.categories[selectedCategory as keyof typeof auditResult.categories].checks.map((check, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        check.status === 'pass' ? 'bg-green-500' : 
                        check.status === 'warn' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium">{check.name}</div>
                        <div className="text-sm text-gray-600">{check.description}</div>
                        {check.details && (
                          <div className="text-xs text-gray-500 mt-1">{check.details}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Score: {check.score}/{check.maxScore}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Vulnerabilities */}
          {auditResult.vulnerabilities.length > 0 && (
            <div className="bg-white rounded-lg border p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-red-600">
                Vulnerabilities Found ({auditResult.vulnerabilities.length})
              </h3>
              
              <div className="space-y-4">
                {auditResult.vulnerabilities.map((vulnerability, index) => (
                  <div key={index} className="border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-red-800">{vulnerability.title}</div>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(vulnerability.severity)}`}>
                        {vulnerability.severity.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-2">{vulnerability.description}</div>
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Impact:</strong> {vulnerability.impact}
                    </div>
                    <div className="text-sm text-blue-600">
                      <strong>Remediation:</strong> {vulnerability.remediation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Recommendations */}
          <div className="bg-white rounded-lg border p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Security Recommendations ({auditResult.recommendations.length})</h3>
            
            <div className="space-y-4">
              {auditResult.recommendations.map((recommendation, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold">{recommendation.title}</div>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(recommendation.priority)}`}>
                      {recommendation.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700 mb-2">{recommendation.description}</div>
                  <div className="text-sm text-blue-600">
                    <strong>Implementation:</strong> {recommendation.implementation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit History */}
          {auditHistory.length > 1 && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-4">Audit History</h3>
              
              <div className="space-y-3">
                {auditHistory.slice(1).map((audit, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">Security Audit #{auditHistory.length - index}</div>
                      <div className="text-sm text-gray-600">
                        Grade: {audit.grade} ({audit.score.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {/* Would show actual date in production */}
                      Previous audit
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* No Audit Results */}
      {!auditResult && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Security Audit Dashboard</h3>
          <p className="text-gray-600 mb-6">
            Run a comprehensive security audit to assess your system's security posture
          </p>
          <button
            onClick={runSecurityAudit}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Run First Security Audit
          </button>
        </div>
      )}
    </div>
  )
}

export default SecurityAuditDashboard
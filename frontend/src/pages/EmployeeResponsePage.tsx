// frontend/src/pages/EmployeeResponsePage.tsx
// Public page for employees to respond to or appeal warnings via a unique token link
// No auth required - the token IS the authentication

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getLevelLabel } from '../services/UniversalCategories';
import { PublicEvidenceUploader } from '../components/public/PublicEvidenceUploader';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Scale,
  Send,
  Loader2,
  Info,
  Calendar,
  MessageCircle,
  Download,
  Eye,
  Printer,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface WarningSummary {
  employeeName: string;
  level: string;
  category: string;
  issueDate: any;
  description: string;
  organizationName: string;
}

interface EvidenceFile {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  type: 'photo' | 'document';
  thumbnail?: string;
}

type PageState = 'loading' | 'form' | 'submitted' | 'error';
type ActiveTab = 'respond' | 'appeal';

// ============================================
// CONSTANTS
// ============================================

const FUNCTIONS_BASE_URL = 'https://us-central1-hr-disciplinary-system.cloudfunctions.net';

const APPEAL_GROUNDS = [
  { value: 'procedural_unfair', label: 'Procedural Unfairness', description: 'The disciplinary process was not followed correctly' },
  { value: 'substantive_unfair', label: 'Substantive Unfairness', description: 'The warning was not justified by the facts' },
  { value: 'bias_prejudice', label: 'Bias or Prejudice', description: 'The decision was influenced by bias or unfair treatment' },
  { value: 'insufficient_evidence', label: 'Insufficient Evidence', description: 'Not enough evidence to support the warning' },
  { value: 'inconsistent_treatment', label: 'Inconsistent Treatment', description: 'Others were treated differently for similar conduct' },
  { value: 'other', label: 'Other Grounds', description: 'Different reason (explain in details below)' },
];

function formatDate(date: any): string {
  if (!date) return 'N/A';
  const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
  return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ============================================
// COMPONENT
// ============================================

const EmployeeResponsePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  // State
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [warningSummary, setWarningSummary] = useState<WarningSummary | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [hasResponse, setHasResponse] = useState(false);
  const [hasAppeal, setHasAppeal] = useState(false);
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('respond');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedType, setSubmittedType] = useState<'response' | 'appeal'>('response');

  // Response form
  const [responseText, setResponseText] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');

  // Appeal form
  const [appealGrounds, setAppealGrounds] = useState('');
  const [appealDetails, setAppealDetails] = useState('');
  const [appealOutcome, setAppealOutcome] = useState('');
  const [evidenceItems, setEvidenceItems] = useState<EvidenceFile[]>([]);

  // Load warning data
  useEffect(() => {
    if (!token) {
      setErrorMessage('No response token provided');
      setPageState('error');
      return;
    }

    const fetchWarning = async () => {
      try {
        const response = await fetch(
          `${FUNCTIONS_BASE_URL}/getWarningForResponse?token=${encodeURIComponent(token)}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to load warning' }));
          throw new Error(errorData.error || `Error ${response.status}`);
        }

        const data = await response.json();
        setWarningSummary(data.warningSummary);
        setExpiresAt(data.expiresAt);
        setHasResponse(data.hasResponse || false);
        setHasAppeal(data.hasAppeal || false);
        setPdfAvailable(data.pdfAvailable || false);

        // If both response and appeal already submitted, show submitted state
        if (data.hasResponse && data.hasAppeal) {
          setSubmittedType('appeal');
          setPageState('submitted');
        } else {
          setPageState('form');
          // Default to appeal tab if response already submitted
          if (data.hasResponse) setActiveTab('appeal');
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load warning details');
        setPageState('error');
      }
    };

    fetchWarning();
  }, [token]);

  // Submit response
  const handleSubmitResponse = useCallback(async () => {
    if (!responseText.trim()) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${FUNCTIONS_BASE_URL}/submitEmployeeResponse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          responseText: responseText.trim(),
          employeeEmail: employeeEmail.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Submission failed' }));
        throw new Error(errorData.error || 'Failed to submit response');
      }

      setSubmittedType('response');
      setPageState('submitted');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  }, [token, responseText, employeeEmail]);

  // Submit appeal
  const handleSubmitAppeal = useCallback(async () => {
    if (!appealGrounds || !appealDetails.trim() || !appealOutcome.trim()) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${FUNCTIONS_BASE_URL}/submitEmployeeAppeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          grounds: appealGrounds,
          details: appealDetails.trim(),
          requestedOutcome: appealOutcome.trim(),
          evidenceUrls: evidenceItems.map(item => item.url),
          employeeEmail: employeeEmail.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Submission failed' }));
        throw new Error(errorData.error || 'Failed to submit appeal');
      }

      setSubmittedType('appeal');
      setPageState('submitted');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit appeal');
    } finally {
      setIsSubmitting(false);
    }
  }, [token, appealGrounds, appealDetails, appealOutcome, evidenceItems, employeeEmail]);

  // View/download warning PDF
  const handleViewPDF = useCallback(async () => {
    if (!token) return;
    setPdfLoading(true);

    try {
      const response = await fetch(
        `${FUNCTIONS_BASE_URL}/getWarningPDFForResponse?token=${encodeURIComponent(token)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load PDF' }));
        throw new Error(errorData.error || 'Failed to retrieve document');
      }

      const data = await response.json();
      // Open the signed URL in a new tab
      window.open(data.url, '_blank');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load PDF document');
    } finally {
      setPdfLoading(false);
    }
  }, [token]);

  // Deadline indicator
  const DeadlineIndicator = () => {
    if (!expiresAt) return null;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const urgency = daysLeft <= 3 ? 'text-red-700 bg-red-50 border-red-200' :
                    daysLeft <= 7 ? 'text-orange-700 bg-orange-50 border-orange-200' :
                    'text-blue-700 bg-blue-50 border-blue-200';

    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${urgency}`}>
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>
          {daysLeft === 0 ? 'Expires today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
          {' '}(deadline: {formatDate(expiresAt)})
        </span>
      </div>
    );
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (pageState === 'loading') {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading warning details...</p>
        </div>
      </PageWrapper>
    );
  }

  // ============================================
  // RENDER: ERROR
  // ============================================
  if (pageState === 'error') {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load</h2>
          <p className="text-gray-600 mb-4 max-w-md">{errorMessage}</p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact your HR department.
          </p>
        </div>
      </PageWrapper>
    );
  }

  // ============================================
  // RENDER: SUBMITTED
  // ============================================
  if (pageState === 'submitted') {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-green-100 p-4 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {submittedType === 'appeal' ? 'Appeal' : 'Response'} Submitted
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            {submittedType === 'appeal'
              ? 'Your formal appeal has been submitted. HR will review your appeal within 5 working days.'
              : 'Your written response has been recorded and attached to the warning record.'
            }
          </p>
          {employeeEmail && (
            <p className="text-sm text-gray-500 mb-4">
              A confirmation email has been sent to <strong>{employeeEmail}</strong>.
            </p>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md text-left">
            <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              What happens next?
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              {submittedType === 'appeal' ? (
                <>
                  <li>- HR will review your appeal and supporting evidence</li>
                  <li>- You may be contacted for further information</li>
                  <li>- You have the right to be assisted by a shop steward</li>
                  <li>- The decision will be communicated to you</li>
                </>
              ) : (
                <>
                  <li>- Your response is now part of the official record</li>
                  <li>- HR has been notified of your submission</li>
                  <li>- You may still submit a formal appeal if desired</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // ============================================
  // RENDER: FORM
  // ============================================
  return (
    <PageWrapper>
      {/* Deadline */}
      <DeadlineIndicator />

      {/* Warning Summary */}
      {warningSummary && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4" />
            Warning Summary
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 text-xs">Employee</span>
              <p className="font-medium text-gray-900">{warningSummary.employeeName}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Warning Level</span>
              <p className="font-medium text-gray-900">{getLevelLabel(warningSummary.level)}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Category</span>
              <p className="font-medium text-gray-900">{warningSummary.category}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Issue Date</span>
              <p className="font-medium text-gray-900">{formatDate(warningSummary.issueDate)}</p>
            </div>
          </div>
          {warningSummary.description && (
            <div className="mt-3">
              <span className="text-gray-500 text-xs">Description</span>
              <p className="text-sm text-gray-800 mt-1 p-2 bg-white rounded border border-gray-100">
                {warningSummary.description}
              </p>
            </div>
          )}
          {/* View Warning Document button */}
          {pdfAvailable && (
            <button
              onClick={handleViewPDF}
              disabled={pdfLoading}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Loading document...</>
              ) : (
                <><Eye className="w-4 h-4" /> View Warning Document</>
              )}
            </button>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Issued by {warningSummary.organizationName}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('respond')}
          disabled={hasResponse}
          className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === 'respond'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          } ${hasResponse ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Respond
            {hasResponse && <CheckCircle className="w-3 h-3 text-green-500" />}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('appeal')}
          disabled={hasAppeal}
          className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
            activeTab === 'appeal'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          } ${hasAppeal ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Scale className="w-4 h-4" />
            Formal Appeal
            {hasAppeal && <CheckCircle className="w-3 h-3 text-green-500" />}
          </div>
        </button>
      </div>

      {/* Tab Content: Respond */}
      {activeTab === 'respond' && (
        <div className="space-y-4">
          {hasResponse ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-800 font-medium">Response already submitted</p>
              <p className="text-xs text-green-600 mt-1">You can still submit a formal appeal if needed.</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Your written response will be recorded and attached to the warning. This is your version of events.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Your Response *
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  maxLength={5000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Describe your side of the events. Include specific facts, dates, and any relevant details..."
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{responseText.length}/5000</p>
              </div>

              {/* Email for confirmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email (optional - for confirmation)
                </label>
                <input
                  type="email"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="your@email.com"
                />
              </div>

              <button
                onClick={handleSubmitResponse}
                disabled={isSubmitting || !responseText.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="w-4 h-4" /> Submit Response</>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* Tab Content: Appeal */}
      {activeTab === 'appeal' && (
        <div className="space-y-4">
          {hasAppeal ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-800 font-medium">Appeal already submitted</p>
              <p className="text-xs text-green-600 mt-1">HR will review your appeal within 5 working days.</p>
            </div>
          ) : (
            <>
              {/* Legal info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 flex items-start gap-2">
                  <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  A formal appeal is a legal process under the Labour Relations Act. HR must respond within 5 working days. You may be assisted by a shop steward or colleague.
                </p>
              </div>

              {/* Appeal Grounds */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Grounds for Appeal *
                </label>
                <div className="space-y-2">
                  {APPEAL_GROUNDS.map((ground) => (
                    <label
                      key={ground.value}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        appealGrounds === ground.value
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="appealGrounds"
                        value={ground.value}
                        checked={appealGrounds === ground.value}
                        onChange={(e) => setAppealGrounds(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-sm text-gray-900">{ground.label}</div>
                        <div className="text-xs text-gray-600">{ground.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Appeal Details */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Appeal Details *
                </label>
                <textarea
                  value={appealDetails}
                  onChange={(e) => setAppealDetails(e.target.value)}
                  rows={5}
                  maxLength={5000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="Explain why you believe the warning is unfair. Include specific facts, dates, witnesses..."
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{appealDetails.length}/5000</p>
              </div>

              {/* Requested Outcome */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Requested Outcome *
                </label>
                <textarea
                  value={appealOutcome}
                  onChange={(e) => setAppealOutcome(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="E.g., 'Remove warning from my record', 'Reduce warning level'..."
                />
              </div>

              {/* Evidence Upload */}
              {token && (
                <PublicEvidenceUploader
                  items={evidenceItems}
                  onAdd={(item) => setEvidenceItems(prev => [...prev, item])}
                  onRemove={(itemId) => setEvidenceItems(prev => prev.filter(i => i.id !== itemId))}
                  token={token}
                  disabled={isSubmitting}
                  uploadEndpoint={`${FUNCTIONS_BASE_URL}/uploadResponseEvidence`}
                />
              )}

              {/* Email for confirmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email (optional - for confirmation)
                </label>
                <input
                  type="email"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="your@email.com"
                />
              </div>

              <button
                onClick={handleSubmitAppeal}
                disabled={isSubmitting || !appealGrounds || !appealDetails.trim() || !appealOutcome.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting Appeal...</>
                ) : (
                  <><Scale className="w-4 h-4" /> Submit Formal Appeal</>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* Error banner */}
      {errorMessage && pageState === 'form' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {errorMessage}
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

// ============================================
// PAGE WRAPPER (Branded, no nav)
// ============================================

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    {/* Header */}
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <img
          src="/logo-128.png"
          alt="File"
          className="w-8 h-6 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div>
          <h1 className="text-sm font-bold text-gray-900">File by FIFO</h1>
          <p className="text-xs text-gray-500">Employee Response Portal</p>
        </div>
      </div>
    </header>

    {/* Content */}
    <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {children}
    </main>

    {/* Footer */}
    <footer className="border-t border-gray-200 bg-white mt-8">
      <div className="max-w-lg mx-auto px-4 py-4 text-center">
        <p className="text-xs text-gray-400">
          FIFO Solutions (Pty) Ltd &bull; file.fifo.systems
        </p>
        <p className="text-xs text-gray-400 mt-1">
          This is a secure employee response portal. No login required.
        </p>
      </div>
    </footer>
  </div>
);

export default EmployeeResponsePage;

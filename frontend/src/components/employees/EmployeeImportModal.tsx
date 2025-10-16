// frontend/src/components/employees/EmployeeImportModal.tsx
import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useEmployeeImport } from '../../hooks/employees/useEmployeeImport';
import { generateSampleCSV } from '../../types';
import type { CSVImportRow, CSVImportResult } from '../../types';
import { usePreventBodyScroll } from '../../hooks/usePreventBodyScroll';
import { Z_INDEX } from '../../constants/zIndex';

interface EmployeeImportModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

export const EmployeeImportModal: React.FC<EmployeeImportModalProps> = ({
  onClose,
  onImportComplete
}) => {
  const { organization } = useAuth();
  const {
    csvFile,
    csvData,
    importResult,
    isImporting,
    importProgress,
    currentImportStep,
    handleFileUpload,
    handleImport,
    resetImport
  } = useEmployeeImport();

  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'importing' | 'result'>('upload');

  // Prevent body scroll when modal is open
  usePreventBodyScroll(true);

  const downloadTemplate = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
      setCurrentStep('preview');
    }
  };

  const handleImportClick = async () => {
    if (!organization) return;
    
    setCurrentStep('importing');
    const result = await handleImport(organization.id);
    setCurrentStep('result');
    
    if (result.success && result.failed === 0) {
      setTimeout(() => {
        onImportComplete();
        onClose();
      }, 2000);
    }
  };

  const handleClose = () => {
    resetImport();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: Z_INDEX.modal }}>
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📊</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Import Employees from CSV</h2>
              <p className="text-xs text-gray-600">
                Bulk import multiple employees
              </p>
            </div>
          </div>
          {!isImporting && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {currentStep === 'upload' && (
            <div className="space-y-3">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-blue-900 mb-1.5 flex items-center gap-1">
                  <span>📋</span> Import Instructions
                </h3>
                <ol className="list-decimal list-inside space-y-0.5 text-xs text-blue-800">
                  <li>Download the CSV template below</li>
                  <li>Fill in employee information following the template format</li>
                  <li>Save the file as CSV (comma-separated values)</li>
                  <li>Upload the completed file using the form below</li>
                </ol>
              </div>

              {/* Template Download */}
              <div className="text-center">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download CSV Template
                </button>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Click to upload CSV file
                  </p>
                  <p className="text-xs text-gray-500">
                    or drag and drop your file here
                  </p>
                </label>
              </div>

              {/* Sample Data */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-900 mb-2">Sample CSV Format:</h4>
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  <strong>💡 Tips:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li><strong>Required fields:</strong> Employee Number, First Name, Last Name, Phone Number, Position, Start Date</li>
                    <li>Employee number must be unique - duplicates will be skipped</li>
                    <li>Email and WhatsApp number are optional (can be blank)</li>
                    <li>Phone numbers accepts 0825254011 or +27825254011 (auto-converts to +27)</li>
                    <li>Contract type defaults to "permanent" if not specified</li>
                  </ul>
                </div>
                <pre className="text-[10px] bg-white p-2 rounded border overflow-x-auto leading-relaxed">
{`employeeNumber,firstName,lastName,email,phoneNumber,whatsappNumber,position,startDate
EMP001,John,Doe,john.doe@company.com,0123456789,0123456789,Software Developer,2024-01-15
EMP002,Sarah,Johnson,,+27987654321,+27987654321,HR Manager,2023-06-01
EMP003,Michael,Smith,michael.smith@company.com,0825254011,,Operations Coordinator,2024-11-01`}
                </pre>
                <p className="text-[10px] text-gray-600 mt-1.5">
                  Notice: Local format (0825254011) and international (+27825254011) both accepted - auto-converts to +27
                </p>
              </div>
            </div>
          )}

          {currentStep === 'preview' && csvData.length > 0 && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                <p className="text-xs text-green-800">
                  ✅ Found <strong>{csvData.length}</strong> employees ready to import
                </p>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Employee #</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Department</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Position</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Start Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {csvData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{row.employeeNumber}</td>
                        <td className="px-3 py-2">{row.firstName} {row.lastName}</td>
                        <td className="px-3 py-2">{row.email}</td>
                        <td className="px-3 py-2">{row.department}</td>
                        <td className="px-3 py-2">{row.position}</td>
                        <td className="px-3 py-2">{row.startDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {csvData.length > 10 && (
                <p className="text-center text-gray-500 text-xs">
                  ... and {csvData.length - 10} more employees
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setCurrentStep('upload');
                    resetImport();
                  }}
                  className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Upload Different File
                </button>
                <button
                  onClick={handleImportClick}
                  className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                >
                  Import {csvData.length} Employees
                </button>
              </div>
            </div>
          )}

          {currentStep === 'importing' && (
            <div className="space-y-3 text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-sm font-bold text-blue-900 mb-1">
                  Importing Employees
                </h3>
                <p className="text-xs text-blue-700 mb-3">
                  Please wait while we create your employees...
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-blue-200 rounded-full h-3 mb-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-800">
                    {importProgress}% Complete
                  </p>
                  <p className="text-xs text-blue-600 min-h-[1rem]">
                    {currentImportStep}
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-gray-500 space-y-0.5">
                <p>⏱️ This may take a few moments depending on the number of employees</p>
                <p>🔄 Please don't close this window during the import process</p>
              </div>
            </div>
          )}

          {currentStep === 'result' && importResult && (
            <div className="space-y-3">
              {/* Summary */}
              <div className={`border rounded-lg p-4 ${
                importResult.success && importResult.failed === 0
                  ? 'bg-green-50 border-green-200'
                  : importResult.imported > 0
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="text-center">
                  <div className="text-4xl mb-2">
                    {importResult.success && importResult.failed === 0 ? '✅' :
                     importResult.imported > 0 ? '⚠️' : '❌'}
                  </div>
                  <h3 className="text-sm font-bold mb-2">
                    {importResult.success && importResult.failed === 0
                      ? 'Import Successful!'
                      : importResult.imported > 0
                      ? 'Partial Import Complete'
                      : 'Import Failed'}
                  </h3>
                  <div className="space-y-0.5 text-xs">
                    <p className="text-green-700">
                      ✅ Successfully imported: <strong>{importResult.imported}</strong> employees
                    </p>
                    {importResult.failed > 0 && (
                      <p className="text-red-700">
                        ❌ Failed to import: <strong>{importResult.failed}</strong> employees
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-red-900 mb-1.5">Import Errors:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-700">
                        <strong>Row {error.row}:</strong> {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-center">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import Logger from '../../utils/logger';
// frontend/src/hooks/employees/useEmployeeImport.ts
import { useState } from 'react';
import { API } from '../../api';
import { DataServiceV2 } from '../../services/DataServiceV2';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { createEmployeeFromForm } from '../../types';
import type { CSVImportRow, CSVImportResult, EmployeeFormData } from '../../types';

export const useEmployeeImport = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVImportRow[]>([]);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentImportStep, setCurrentImportStep] = useState('');

  // Helper function to format South African phone numbers to international format
  // Handles multiple formats:
  // - 0825254011 (local format with leading 0) → +27825254011
  // - 825254011 (missing leading 0 - common when Excel/Sheets strips leading zeros) → +27825254011
  // - 27825254011 (country code without +) → +27825254011
  // - +27825254011 (already formatted) → +27825254011
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';

    // Remove all spaces, dashes, and parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // If it starts with 0, replace with +27
    if (cleaned.startsWith('0')) {
      cleaned = '+27' + cleaned.substring(1);
    }
    // If it starts with 27 (but not +27), add the +
    else if (cleaned.startsWith('27') && !cleaned.startsWith('+27')) {
      cleaned = '+' + cleaned;
    }
    // If it doesn't start with + or 27, assume it's local and add +27
    // This handles the Excel/Google Sheets edge case where leading zeros are stripped (825254011 → +27825254011)
    else if (!cleaned.startsWith('+') && !cleaned.startsWith('27')) {
      cleaned = '+27' + cleaned;
    }

    return cleaned;
  };

  // Helper function to parse South African date formats to YYYY-MM-DD
  // Handles multiple formats for maximum user convenience:
  // - dd/mm/yyyy, dd-mm-yyyy (PREFERRED) → 2024-01-15
  // - dd/mm/yy, dd-mm-yy (2-digit year) → 2024-01-15
  // - ddmmyyyy, ddmmyy (no separators) → 2024-01-15
  // - yyyy-mm-dd, yyyy/mm/dd (ISO 8601) → 2024-01-15
  const parseDate = (dateString: string): string | null => {
    if (!dateString) return null;

    // Remove extra whitespace
    const cleaned = dateString.trim();

    // Helper to convert 2-digit year to 4-digit year
    // Years 00-29 → 2000-2029, Years 30-99 → 1930-1999
    const expandYear = (yy: string): string => {
      const yearNum = parseInt(yy);
      return yearNum <= 29 ? `20${yy.padStart(2, '0')}` : `19${yy.padStart(2, '0')}`;
    };

    // Try dd/mm/yyyy or dd-mm-yyyy (4-digit year with separators)
    const ddmmyyyyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = ddmmyyyyMatch[1].padStart(2, '0');
      const month = ddmmyyyyMatch[2].padStart(2, '0');
      const year = ddmmyyyyMatch[3];

      // Validate date ranges
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
        return null; // Invalid date
      }

      return `${year}-${month}-${day}`;
    }

    // Try dd/mm/yy or dd-mm-yy (2-digit year with separators)
    const ddmmyyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
    if (ddmmyyMatch) {
      const day = ddmmyyMatch[1].padStart(2, '0');
      const month = ddmmyyMatch[2].padStart(2, '0');
      const year = expandYear(ddmmyyMatch[3]);

      // Validate date ranges
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
        return null; // Invalid date
      }

      return `${year}-${month}-${day}`;
    }

    // Try ddmmyyyy (8 digits, no separators)
    const ddmmyyyyNoSepMatch = cleaned.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (ddmmyyyyNoSepMatch) {
      const day = ddmmyyyyNoSepMatch[1];
      const month = ddmmyyyyNoSepMatch[2];
      const year = ddmmyyyyNoSepMatch[3];

      // Validate date ranges
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
        return null; // Invalid date
      }

      return `${year}-${month}-${day}`;
    }

    // Try ddmmyy (6 digits, no separators, 2-digit year)
    const ddmmyyNoSepMatch = cleaned.match(/^(\d{2})(\d{2})(\d{2})$/);
    if (ddmmyyNoSepMatch) {
      const day = ddmmyyNoSepMatch[1];
      const month = ddmmyyNoSepMatch[2];
      const year = expandYear(ddmmyyNoSepMatch[3]);

      // Validate date ranges
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
        return null; // Invalid date
      }

      return `${year}-${month}-${day}`;
    }

    // Try yyyy-mm-dd or yyyy/mm/dd (ISO 8601 format, for backwards compatibility)
    const yyyymmddMatch = cleaned.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (yyyymmddMatch) {
      const year = yyyymmddMatch[1];
      const month = yyyymmddMatch[2].padStart(2, '0');
      const day = yyyymmddMatch[3].padStart(2, '0');

      // Validate date ranges
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
        return null; // Invalid date
      }

      return `${year}-${month}-${day}`;
    }

    // If no pattern matches, return null to trigger validation error
    return null;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  const handleFileUpload = (file: File) => {
    setCsvFile(file);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      
      try {
        const lines = csv
          .trim()
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        if (lines.length === 0) {
          setCsvData([]);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data: CSVImportRow[] = [];
        const errors: string[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const lineNumber = i + 1;
          const line = lines[i];
          
          try {
            const values = parseCSVLine(line);
            
            if (values.length !== headers.length) {
              errors.push(`Row ${lineNumber}: Field count mismatch`);
              continue;
            }

            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index]?.trim().replace(/"/g, '') || '';
            });

            // Basic validation - all required fields including employeeNumber
            // Email and WhatsApp are optional, phone number is required
            if (!row.employeeNumber || !row.firstName || !row.lastName || !row.phoneNumber || !row.position || !row.startDate) {
              errors.push(`Row ${lineNumber}: Missing required fields (employeeNumber, firstName, lastName, phoneNumber, position, startDate)`);
              continue;
            }

            // Parse and validate date format
            const parsedDate = parseDate(row.startDate);
            if (!parsedDate) {
              errors.push(`Row ${lineNumber}: Invalid date format for startDate "${row.startDate}". Please use dd/mm/yyyy (e.g., 15/01/2024)`);
              continue;
            }

            const sanitizedRow: CSVImportRow = {
              employeeNumber: row.employeeNumber || '',
              firstName: row.firstName,
              lastName: row.lastName,
              email: row.email ? row.email.toLowerCase() : '', // Optional
              phoneNumber: formatPhoneNumber(row.phoneNumber), // Required - auto-format to international
              whatsappNumber: row.whatsappNumber ? formatPhoneNumber(row.whatsappNumber) : '', // Optional - auto-format if provided
              position: row.position,
              startDate: parsedDate, // Parsed to YYYY-MM-DD format
              // contractType is NOT imported from CSV - always defaults to 'permanent' in createEmployeeFromForm
            };


            data.push(sanitizedRow);
          } catch (parseError) {
            errors.push(`Row ${lineNumber}: Parse error`);
          }
        }

        setCsvData(data);
        
        if (errors.length > 0) {
          Logger.warn('CSV Import Warnings:', errors)
        }
      } catch (error) {
        Logger.error('CSV parsing failed:', error)
        setCsvData([]);
      }
    };
    
    reader.readAsText(file);
  };

  const handleImport = async (organizationId: string): Promise<CSVImportResult> => {
    if (!csvData.length) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: [{ row: 1, field: 'file', message: 'No data to import' }]
      };
    }

    setIsImporting(true);
    setImportProgress(0);
    setCurrentImportStep('Validating employee data...');
    const errors: Array<{ row: number; field: string; message: string }> = [];
    const employeesToCreate: any[] = [];

    try {
      // First pass: validate all data and prepare employee objects
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 2;
        
        // Update validation progress
        const validationProgress = Math.round((i / csvData.length) * 30); // Validation takes 30% of progress
        setImportProgress(validationProgress);
        setCurrentImportStep(`Validating employee ${i + 1} of ${csvData.length}: ${row.firstName} ${row.lastName}...`);
        
        try {
          const employeeNumber = row.employeeNumber;

          // Validate employee number for duplicates
          const validation = await API.employees.validateEmployeeNumber(
            organizationId,
            employeeNumber
          );

          if (!validation.isAvailable) {
            errors.push({
              row: rowNumber,
              field: 'employeeNumber',
              message: `Employee "${employeeNumber}" already exists - not imported (duplicate found)`
            });
            continue;
          }

          const formData: EmployeeFormData = {
            employeeNumber: employeeNumber,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email || undefined, // Optional - can be empty
            phoneNumber: row.phoneNumber, // Required
            whatsappNumber: row.whatsappNumber || undefined, // Optional
            department: '', // Optional - can be assigned later
            position: row.position,
            startDate: row.startDate,
            contractType: 'permanent', // Always defaults to 'permanent' for CSV imports
            isActive: true
          };


          const employeeData = createEmployeeFromForm(formData, organizationId);
          // Remove ID for CSV import - let Firestore generate it for new employees
          const { id, ...employeeDataWithoutId } = employeeData;
          employeesToCreate.push(employeeDataWithoutId);
        } catch (err) {
          errors.push({
            row: rowNumber,
            field: 'validation',
            message: err instanceof Error ? err.message : 'Validation error'
          });
        }
      }

      let imported = 0;
      let failed = errors.length; // Failed validation count

      // Update progress after validation
      setImportProgress(30);
      setCurrentImportStep('Validation complete. Starting employee creation...');
      
      // Second pass: create employees individually with rate limiting and retry
      if (employeesToCreate.length > 0) {
        try {
          Logger.debug(`🚀 Attempting to import ${employeesToCreate.length} employees with rate limiting...`)
          
          for (let i = 0; i < employeesToCreate.length; i++) {
            // Update creation progress (30% to 90%)
            const creationProgress = 30 + Math.round((i / employeesToCreate.length) * 60);
            setImportProgress(creationProgress);
            const employee = employeesToCreate[i];
            setCurrentImportStep(`Creating employee ${i + 1} of ${employeesToCreate.length}: ${employee.profile?.firstName} ${employee.profile?.lastName}...`);
            
            let retryCount = 0;
            const maxRetries = 3;
            let success = false;
            
            while (!success && retryCount < maxRetries) {
              try {
                // Add delay between requests to avoid rate limiting
                if (i > 0) {
                  await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
                }
                
                
                // Use the API layer for sharded employee creation (same as manual creation)
                await API.employees.create(employeesToCreate[i]);
                
                imported++;
                success = true;
                
                // Show success for this employee briefly
                setCurrentImportStep(`✅ Created: ${employee.profile?.firstName} ${employee.profile?.lastName}`);
                await new Promise(resolve => setTimeout(resolve, 200)); // Brief pause to show success
              } catch (individualError) {
                retryCount++;
                const errorMessage = individualError instanceof Error ? individualError.message : 'Unknown error';
                
                if (retryCount < maxRetries && errorMessage.includes('permissions')) {
                  Logger.warn(`⚠️ Retry ${retryCount}/${maxRetries} for employee ${i + 1}: ${errorMessage}`)
                  setCurrentImportStep(`⚠️ Retrying ${employee.profile?.firstName} ${employee.profile?.lastName} (${retryCount}/${maxRetries})...`);
                  // Exponential backoff
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                } else {
                  Logger.error(`❌ Failed to create employee ${i + 1} after ${retryCount} attempts:`, individualError)
                  failed++;
                  errors.push({
                    row: i + 2,
                    field: 'individual_create',
                    message: `${errorMessage} (after ${retryCount} retries)`
                  });
                  success = true; // Break retry loop
                }
              }
            }
          }
          
          // Final progress update
          setImportProgress(90);
          setCurrentImportStep('Finalizing import...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          Logger.success(10447)
        } catch (generalError) {
          Logger.error('❌ Import process failed:', generalError)
          failed += employeesToCreate.length - imported;
        }
      }

      const result: CSVImportResult = {
        success: failed === 0,
        imported,
        failed,
        errors
      };

      setImportResult(result);
      setImportProgress(100);
      setCurrentImportStep('Import completed!');
      return result;
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setCsvFile(null);
    setCsvData([]);
    setImportResult(null);
    setImportProgress(0);
    setCurrentImportStep('');
  };

  return {
    csvFile,
    csvData,
    importResult,
    isImporting,
    importProgress,
    currentImportStep,
    handleFileUpload,
    handleImport,
    resetImport
  };
};

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

            // Basic validation - employeeNumber can be empty (will be auto-generated)
            if (!row.firstName || !row.lastName || !row.email) {
              errors.push(`Row ${lineNumber}: Missing required fields (firstName, lastName, email)`);
              continue;
            }

            const sanitizedRow: CSVImportRow = {
              employeeNumber: row.employeeNumber || '',
              firstName: row.firstName,
              lastName: row.lastName,
              email: row.email.toLowerCase(),
              phoneNumber: row.phoneNumber || '',
              whatsappNumber: row.whatsappNumber || '',
              position: row.position || '',
              startDate: row.startDate || '',
              contractType: (row.contractType?.toLowerCase() || 'permanent') as any,
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
          let employeeNumber = row.employeeNumber;
          
          // Auto-generate employee number if empty
          if (!employeeNumber || employeeNumber.trim() === '') {
            employeeNumber = await API.employees.generateNextEmployeeNumber(organizationId);
          }
          
          // Validate employee number for duplicates
          const validation = await API.employees.validateEmployeeNumber(
            organizationId, 
            employeeNumber
          );
          
          if (!validation.isAvailable) {
            errors.push({
              row: rowNumber,
              field: 'employeeNumber',
              message: `Employee number "${employeeNumber}" is already in use${validation.suggestions ? `. Suggestions: ${validation.suggestions.slice(0, 3).join(', ')}` : ''}`
            });
            continue;
          }

          const formData: EmployeeFormData = {
            employeeNumber: employeeNumber,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phoneNumber: row.phoneNumber || '',
            whatsappNumber: row.whatsappNumber || '',
            department: '', // Department will be assigned later via bulk action
            position: row.position,
            startDate: row.startDate,
            contractType: row.contractType as any || 'permanent',
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

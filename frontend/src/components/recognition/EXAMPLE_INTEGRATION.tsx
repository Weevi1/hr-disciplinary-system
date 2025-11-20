// EXAMPLE: How to integrate RecognitionEntry into a Manager Dashboard
// This file shows the complete integration pattern

import React, { useState } from 'react';
import { Award, Trophy, Users } from 'lucide-react';
import { RecognitionEntry } from './RecognitionEntry';

// Example: Manager Dashboard Component
export const ManagerDashboardExample: React.FC = () => {
  // State for recognition modal
  const [isRecognitionModalOpen, setIsRecognitionModalOpen] = useState(false);
  const [preSelectedEmployeeId, setPreSelectedEmployeeId] = useState<string | undefined>(undefined);

  return (
    <div className="manager-dashboard p-6">
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          Manager Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Manage your team and recognize achievements
        </p>
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Recognize Employee Action */}
        <button
          onClick={() => {
            setPreSelectedEmployeeId(undefined);
            setIsRecognitionModalOpen(true);
          }}
          className="p-6 rounded-lg border transition-all hover:shadow-lg hover:scale-105"
          style={{
            backgroundColor: 'var(--color-card-background)',
            borderColor: 'var(--color-card-border)'
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
                Recognize Employee
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Celebrate achievements
              </p>
            </div>
          </div>
        </button>

        {/* Other quick actions... */}
        <button
          className="p-6 rounded-lg border transition-all hover:shadow-lg"
          style={{
            backgroundColor: 'var(--color-card-background)',
            borderColor: 'var(--color-card-border)'
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
                View Team
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Manage employees
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Recognitions Section */}
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: 'var(--color-card-background)',
          borderColor: 'var(--color-card-border)'
        }}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Trophy className="w-5 h-5 text-yellow-500" />
          Recent Recognitions
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No recognitions recorded yet. Start recognizing your team's achievements!
        </p>
      </div>

      {/* Recognition Entry Modal */}
      <RecognitionEntry
        isOpen={isRecognitionModalOpen}
        onClose={() => {
          setIsRecognitionModalOpen(false);
          setPreSelectedEmployeeId(undefined);
        }}
        employeeId={preSelectedEmployeeId}
      />
    </div>
  );
};

// Example: Employee Profile/Details Component
export const EmployeeProfileExample: React.FC<{ employeeId: string }> = ({ employeeId }) => {
  const [isRecognitionModalOpen, setIsRecognitionModalOpen] = useState(false);

  return (
    <div className="employee-profile">
      {/* Employee Details */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">John Doe</h2>
        <p className="text-sm text-gray-600">Senior Developer • Engineering</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        {/* Recognize Button */}
        <button
          onClick={() => setIsRecognitionModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Trophy className="w-4 h-4" />
          Recognize Achievement
        </button>

        {/* Other action buttons... */}
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Edit Profile
        </button>
      </div>

      {/* Recognition Modal with Pre-selected Employee */}
      <RecognitionEntry
        isOpen={isRecognitionModalOpen}
        onClose={() => setIsRecognitionModalOpen(false)}
        employeeId={employeeId} // Pre-select this employee
      />
    </div>
  );
};

// Example: Employee Table Row Action
export const EmployeeTableRowExample: React.FC<{ employee: any }> = ({ employee }) => {
  const [isRecognitionModalOpen, setIsRecognitionModalOpen] = useState(false);

  return (
    <>
      <tr className="border-b">
        <td className="p-3">{employee.name}</td>
        <td className="p-3">{employee.department}</td>
        <td className="p-3">{employee.position}</td>
        <td className="p-3">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsRecognitionModalOpen(true)}
              className="p-2 rounded hover:bg-green-50 transition-colors"
              title="Recognize achievement"
            >
              <Award className="w-4 h-4 text-green-600" />
            </button>
            {/* Other action buttons... */}
          </div>
        </td>
      </tr>

      {/* Recognition Modal */}
      <RecognitionEntry
        isOpen={isRecognitionModalOpen}
        onClose={() => setIsRecognitionModalOpen(false)}
        employeeId={employee.id}
      />
    </>
  );
};

// Example: HOD Dashboard Integration
// This shows how to add to the actual HOD Dashboard
export const HODDashboardIntegrationExample = () => {
  // Add this to existing HOD Dashboard component

  // 1. Add state at top of component
  const [isRecognitionModalOpen, setIsRecognitionModalOpen] = useState(false);

  // 2. Add button to quick actions section (next to Issue Warning, Book Meeting, etc.)
  const RecognizeEmployeeButton = (
    <button
      onClick={() => setIsRecognitionModalOpen(true)}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
    >
      <Award className="w-4 h-4" />
      Recognize Employee
    </button>
  );

  // 3. Add modal at bottom of component (before closing return statement)
  const RecognitionModal = (
    <RecognitionEntry
      isOpen={isRecognitionModalOpen}
      onClose={() => setIsRecognitionModalOpen(false)}
    />
  );

  // That's it! The component is fully integrated.
};

// Example: Custom Hook for Recognition Management
export const useRecognitionModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | undefined>(undefined);

  const openForEmployee = (id: string) => {
    setEmployeeId(id);
    setIsOpen(true);
  };

  const openBlank = () => {
    setEmployeeId(undefined);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setEmployeeId(undefined);
  };

  return {
    isOpen,
    employeeId,
    openForEmployee,
    openBlank,
    close
  };
};

// Usage of custom hook:
export const ComponentUsingCustomHook: React.FC = () => {
  const recognition = useRecognitionModal();

  return (
    <div>
      <button onClick={recognition.openBlank}>
        Recognize Any Employee
      </button>

      <button onClick={() => recognition.openForEmployee('employee-123')}>
        Recognize John Doe
      </button>

      <RecognitionEntry
        isOpen={recognition.isOpen}
        onClose={recognition.close}
        employeeId={recognition.employeeId}
      />
    </div>
  );
};

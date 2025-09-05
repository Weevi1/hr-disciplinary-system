// ===================================
// SECTOR ASSIGNMENT COMPONENT
// Super-admin interface for assigning sectors to organizations
// ===================================

import React, { useState, useEffect } from 'react';
import type { Sector } from '../../types';
// SectorService removed - now uses UniversalCategories

interface SectorAssignmentProps {
  organizationId: string;
  organizationName: string;
  currentSectorId?: string;
  onAssignmentComplete: (sectorId: string, sectorName: string) => void;
  onClose: () => void;
}

export const SectorAssignment: React.FC<SectorAssignmentProps> = ({
  organizationId,
  organizationName,
  currentSectorId,
  onAssignmentComplete,
  onClose
}) => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string>(currentSectorId || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available sectors
  useEffect(() => {
    const loadSectors = async () => {
      try {
        setIsLoading(true);
        const availableSectors = await SectorService.getAllSectors();
        setSectors(availableSectors);
        setError(null);
      } catch (err) {
        console.error('Error loading sectors:', err);
        setError('Failed to load sectors. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSectors();
  }, []);

  // Handle sector assignment
  const handleAssignSector = async () => {
    if (!selectedSectorId) {
      setError('Please select a sector');
      return;
    }

    try {
      setIsAssigning(true);
      setError(null);

      const success = await SectorService.assignSectorToOrganization(
        organizationId,
        selectedSectorId
      );

      if (success) {
        const selectedSector = sectors.find(s => s.id === selectedSectorId);
        onAssignmentComplete(selectedSectorId, selectedSector?.name || '');
      } else {
        setError('Failed to assign sector. Please try again.');
      }
    } catch (err) {
      console.error('Error assigning sector:', err);
      setError('Failed to assign sector. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Get sector preview info
  const getSelectedSector = () => {
    return sectors.find(s => s.id === selectedSectorId);
  };

  const selectedSector = getSelectedSector();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Assign Sector
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Organization Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900">Organization:</h3>
          <p className="text-blue-800">{organizationName}</p>
          {currentSectorId && (
            <p className="text-sm text-blue-600 mt-1">
              Current sector: {sectors.find(s => s.id === currentSectorId)?.name || currentSectorId}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading sectors...</span>
          </div>
        ) : (
          <>
            {/* Sector Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Select Industry Sector:
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sectors.map((sector) => (
                  <div
                    key={sector.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedSectorId === sector.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedSectorId(sector.id)}
                  >
                    <div className="flex items-center mb-2">
                      <span 
                        className="text-2xl mr-3"
                        style={{ color: sector.color }}
                      >
                        {sector.icon}
                      </span>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {sector.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {sector.categories.length} disciplinary categories
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {sector.description}
                    </p>
                    {sector.complianceNotes && (
                      <p className="text-xs text-blue-600 bg-blue-100 rounded p-2">
                        🔒 {sector.complianceNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Sector Preview */}
            {selectedSector && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">
                  🎯 Preview: {selectedSector.name} Sector
                </h4>
                
                <div className="mb-3">
                  <h5 className="font-medium text-gray-800 mb-2">
                    Disciplinary Categories ({selectedSector.categories.length}):
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedSector.categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center text-sm"
                      >
                        <span className={`w-3 h-3 rounded-full mr-2 ${
                          category.severity === 'critical' ? 'bg-red-500' :
                          category.severity === 'high' ? 'bg-orange-500' :
                          category.severity === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></span>
                        <span className="text-gray-700">{category.name}</span>
                        {category.commonInSector && (
                          <span className="ml-1 text-xs text-blue-600">⭐</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSector.escalationRules.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">
                      Special Escalation Rules:
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {selectedSector.escalationRules.map((rule) => (
                        <li key={rule.id} className="flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                          Auto-escalation for {rule.condition.replace('_', ' ')} conditions
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={onClose}
                disabled={isAssigning}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSector}
                disabled={!selectedSectorId || isAssigning}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssigning ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </span>
                ) : (
                  'Assign Sector'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

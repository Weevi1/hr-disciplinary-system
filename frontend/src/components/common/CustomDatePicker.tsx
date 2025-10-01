// CustomDatePicker - Modern, themed date picker component
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { SlotMachineSpinner } from './SlotMachineSpinner';

interface CustomDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'date' | 'time';
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  type = 'date',
  icon: Icon,
  required = false,
  disabled = false,
  error,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState({
    hours: value ? new Date(`1970-01-01T${value}`).getHours() : 9,
    minutes: value ? new Date(`1970-01-01T${value}`).getMinutes() : 0
  });

  const inputRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside and handle modal centering
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Center screen on modal when it opens
  useEffect(() => {
    if (isOpen) {
      // Scroll to center the modal
      setTimeout(() => {
        const modal = popupRef.current;
        if (modal) {
          modal.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        }
      }, 100); // Small delay to ensure modal is rendered

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Format display value
  const formatDisplayValue = () => {
    if (type === 'time') {
      if (!value) return 'Select time...';
      return value;
    } else {
      if (!selectedDate) return 'Select date...';
      return selectedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dateString = date.toISOString().split('T')[0];
    onChange(dateString);
    setIsOpen(false);
  };

  // Handle time selection
  const handleTimeChange = (hours: number, minutes: number) => {
    setSelectedTime({ hours, minutes });
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    onChange(timeString);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const inputStyle: React.CSSProperties = {
    backgroundColor: error ? 'var(--color-alert-error-bg)' : 'var(--color-input-background)',
    borderColor: error ? 'var(--color-alert-error-border)' : 'var(--color-input-border)',
    color: 'var(--color-text)'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {Icon && <Icon className="w-3 h-3 inline mr-1" />}
        {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
      </label>

      <div className="relative" ref={inputRef}>
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full h-11 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm cursor-pointer flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={inputStyle}
        >
          <span style={{ color: value ? 'var(--color-text)' : 'var(--color-text-tertiary)' }}>
            {formatDisplayValue()}
          </span>
          {type === 'date' ? (
            <Calendar className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          ) : (
            <Clock className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          )}
        </div>

        {/* Custom Popup - Rendered via Portal to Escape Modal Bounds */}
        {isOpen && typeof document !== 'undefined' && createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-[10000]"
              onClick={() => setIsOpen(false)}
            />
            {/* Centered Modal */}
            <div
              ref={popupRef}
              className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
            >
              <div
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-auto"
                style={{
                  backgroundColor: 'var(--color-card-background)',
                  borderColor: 'var(--color-border)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
            {type === 'date' ? (
              // Date Picker
              <div className="p-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-semibold text-center flex-1" style={{ color: 'var(--color-text)' }}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-xs font-medium text-center p-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, index) => {
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                    const isToday = date.toDateString() === today.toDateString();
                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

                    return (
                      <button
                        key={index}
                        onClick={() => isCurrentMonth && handleDateSelect(date)}
                        disabled={!isCurrentMonth}
                        className={`p-2 text-sm rounded-lg transition-all ${
                          !isCurrentMonth ? 'opacity-30 cursor-not-allowed' :
                          'hover:bg-gray-100 cursor-pointer'
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? 'var(--color-primary)'
                            : isToday
                            ? 'var(--color-primary-light)'
                            : 'transparent',
                          color: isSelected
                            ? 'white'
                            : isToday
                            ? 'var(--color-primary)'
                            : 'var(--color-text)',
                          fontWeight: isToday || isSelected ? '600' : '400'
                        }}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Today Button */}
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => handleDateSelect(today)}
                    className="px-4 py-2 text-sm rounded-lg border transition-colors"
                    style={{
                      borderColor: 'var(--color-primary)',
                      color: 'var(--color-primary)',
                      backgroundColor: 'transparent'
                    }}
                  >
                    Today
                  </button>
                </div>
              </div>
            ) : (
              // Award-Winning Time Picker
              <div className="p-6">
                {/* Title with elegant spacing */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-light tracking-wide" style={{ color: 'var(--color-text)', letterSpacing: '0.5px' }}>
                    Select Time
                  </h3>
                </div>

                {/* Slot Machine Time Display */}
                <div className="flex items-center justify-center gap-6 mb-8">
                  {/* Hours Spinner */}
                  <SlotMachineSpinner
                    value={selectedTime.hours}
                    onChange={(hours) => handleTimeChange(hours, selectedTime.minutes)}
                    min={0}
                    max={23}
                    label="Hours"
                  />

                  {/* Elegant Separator */}
                  <div className="flex flex-col items-center self-start mt-12">
                    <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                  </div>

                  {/* Minutes Spinner */}
                  <SlotMachineSpinner
                    value={selectedTime.minutes}
                    onChange={(minutes) => handleTimeChange(selectedTime.hours, minutes)}
                    min={0}
                    max={59}
                    label="Minutes"
                  />
                </div>

                {/* Elegant Time Preview */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }}>
                    <Clock className="w-4 h-4 mr-2" style={{ color: 'var(--color-text-secondary)' }} />
                    <span className="text-lg font-medium tracking-wider" style={{
                      color: 'var(--color-text)',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {selectedTime.hours.toString().padStart(2, '0')}:{selectedTime.minutes.toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Premium Action Button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-8 py-3 rounded-xl font-medium tracking-wide transition-all duration-200 transform hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                      letterSpacing: '0.5px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
              </div>
            </div>
          </>,
          document.body
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-error)' }}>
          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};
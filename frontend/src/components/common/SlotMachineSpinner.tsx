// ScrollableTimeSpinner - Click and scroll to select time
import React, { useState, useRef, useEffect } from 'react';

interface ScrollableTimeSpinnerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  className?: string;
}

export const SlotMachineSpinner: React.FC<ScrollableTimeSpinnerProps> = ({
  value,
  onChange,
  min,
  max,
  label,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate all possible numbers
  const getAllNumbers = () => {
    const numbers = [];
    for (let i = min; i <= max; i++) {
      numbers.push(i);
    }
    return numbers;
  };

  // Handle number selection
  const handleNumberSelect = (selectedValue: number) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  // Scroll to current value when opening
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const selectedIndex = value - min;
      const itemHeight = 48; // Height of each number item
      const scrollPosition = selectedIndex * itemHeight - (container.clientHeight / 2) + (itemHeight / 2);

      setTimeout(() => {
        container.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [isOpen, value, min]);

  const allNumbers = getAllNumbers();

  return (
    <div className={`relative ${className}`}>
      {/* Display Current Value */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-24 h-20 cursor-pointer border-2 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105"
        style={{
          backgroundColor: 'var(--color-card-background)',
          borderColor: isOpen ? 'var(--color-primary)' : 'var(--color-border)',
          boxShadow: isOpen ? '0 0 0 3px var(--color-primary-light)' : '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}
      >
        <span
          className="text-3xl font-light"
          style={{
            color: 'var(--color-text)',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {value.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-24 bg-white border-2 rounded-2xl shadow-lg z-10 overflow-hidden"
          style={{
            backgroundColor: 'var(--color-card-background)',
            borderColor: 'var(--color-primary)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div
            ref={scrollContainerRef}
            className="max-h-48 overflow-y-auto scrollbar-thin"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--color-primary) transparent'
            }}
          >
            {allNumbers.map((num) => (
              <button
                key={num}
                onClick={() => handleNumberSelect(num)}
                className="w-full h-12 flex items-center justify-center transition-all duration-150 hover:scale-105"
                style={{
                  backgroundColor: num === value ? 'var(--color-primary-light)' : 'transparent',
                  color: num === value ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: num === value ? '600' : '400',
                  fontVariantNumeric: 'tabular-nums'
                }}
                onMouseEnter={(e) => {
                  if (num !== value) {
                    e.currentTarget.style.backgroundColor = 'var(--color-muted)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (num !== value) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span className="text-lg">
                  {num.toString().padStart(2, '0')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Label */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
        <span className="text-xs font-medium tracking-wider uppercase" style={{ color: 'var(--color-text-tertiary)' }}>
          {label}
        </span>
      </div>
    </div>
  );
};
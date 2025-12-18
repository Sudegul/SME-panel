'use client';

import { useState, useRef, useEffect } from 'react';

interface CustomDateInputProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  max?: string; // YYYY-MM-DD format
  className?: string;
}

export default function CustomDateInput({ value, onChange, max, className = '' }: CustomDateInputProps) {
  // Parse YYYY-MM-DD to DD/MM/YY
  const parseDate = (dateStr: string) => {
    if (!dateStr) return { day: '', month: '', year: '' };
    const [year, month, day] = dateStr.split('-');
    return {
      day: day || '',
      month: month || '',
      year: year ? year.slice(-2) : '' // Last 2 digits only
    };
  };

  // Format DD/MM/YY to YYYY-MM-DD
  const formatDate = (day: string, month: string, year: string) => {
    if (!day || !month || !year) return '';
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const parsed = parseDate(value);
  const [day, setDay] = useState(parsed.day);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Update internal state when value prop changes
  useEffect(() => {
    const parsed = parseDate(value);
    setDay(parsed.day);
    setMonth(parsed.month);
    setYear(parsed.year);
  }, [value]);

  const handleDayChange = (val: string) => {
    // Only allow numbers
    const numVal = val.replace(/\D/g, '');
    if (numVal.length <= 2) {
      setDay(numVal);

      // Auto-focus next field when complete
      if (numVal.length === 2 && monthRef.current) {
        monthRef.current.focus();
      }

      // Update parent if valid
      if (numVal.length === 2 && month.length === 2 && year.length === 2) {
        const formatted = formatDate(numVal, month, year);
        if (formatted) onChange(formatted);
      }
    }
  };

  const handleMonthChange = (val: string) => {
    const numVal = val.replace(/\D/g, '');
    if (numVal.length <= 2) {
      setMonth(numVal);

      if (numVal.length === 2 && yearRef.current) {
        yearRef.current.focus();
      }

      if (day.length === 2 && numVal.length === 2 && year.length === 2) {
        const formatted = formatDate(day, numVal, year);
        if (formatted) onChange(formatted);
      }
    }
  };

  const handleYearChange = (val: string) => {
    const numVal = val.replace(/\D/g, '');
    if (numVal.length <= 2) {
      setYear(numVal);

      if (day.length === 2 && month.length === 2 && numVal.length === 2) {
        const formatted = formatDate(day, month, numVal);
        if (formatted) onChange(formatted);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'day' | 'month' | 'year') => {
    // Allow backspace, delete, arrow keys, tab
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
      return;
    }

    // Navigate with arrow keys
    if (e.key === 'ArrowRight') {
      if (field === 'day' && monthRef.current) monthRef.current.focus();
      else if (field === 'month' && yearRef.current) yearRef.current.focus();
    } else if (e.key === 'ArrowLeft') {
      if (field === 'year' && monthRef.current) monthRef.current.focus();
      else if (field === 'month' && dayRef.current) dayRef.current.focus();
    }

    // Only allow numbers
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <input
        ref={dayRef}
        type="text"
        value={day}
        onChange={(e) => handleDayChange(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, 'day')}
        placeholder="GG"
        maxLength={2}
        className="w-12 px-2 py-2 text-center border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <span className="text-gray-500 dark:text-gray-400">/</span>
      <input
        ref={monthRef}
        type="text"
        value={month}
        onChange={(e) => handleMonthChange(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, 'month')}
        placeholder="AA"
        maxLength={2}
        className="w-12 px-2 py-2 text-center border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <span className="text-gray-500 dark:text-gray-400">/</span>
      <input
        ref={yearRef}
        type="text"
        value={year}
        onChange={(e) => handleYearChange(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, 'year')}
        placeholder="YY"
        maxLength={2}
        className="w-12 px-2 py-2 text-center border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

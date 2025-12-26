'use client';

import { useState } from 'react';
import CustomDateInput from './CustomDateInput';

interface DateSelectorProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  max?: string; // YYYY-MM-DD format
  className?: string;
}

export default function DateSelector({ value, onChange, max, className = '' }: DateSelectorProps) {
  const today = new Date().toISOString().split('T')[0];
  const maxDate = max || today;

  // Son 6 günü hesapla (bugün hariç, sadece geçmiş 6 gün)
  const getLast6Days = () => {
    const days: { date: string; label: string }[] = [];
    const currentDate = new Date();

    for (let i = 6; i >= 1; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      // Tarih formatı: "6 Aralık"
      const dayNumber = date.getDate();
      const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      const monthName = monthNames[date.getMonth()];

      days.push({
        date: dateString,
        label: `${dayNumber} ${monthName}`
      });
    }

    return days;
  };

  const last6Days = getLast6Days();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Butonlar */}
      <div className="flex gap-2 flex-wrap items-center">
        {/* Son 6 gün */}
        {last6Days.map((day) => (
          <button
            key={day.date}
            onClick={() => onChange(day.date)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              value === day.date
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {day.label}
          </button>
        ))}

        {/* Bugün butonu */}
        <button
          onClick={() => onChange(today)}
          className={`px-6 py-2 rounded-lg transition-colors font-semibold ${
            value === today
              ? 'bg-green-600 text-white'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
          }`}
        >
          Bugün
        </button>
      </div>

      {/* Manuel giriş */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Veya manuel gir:
        </span>
        <CustomDateInput
          value={value}
          onChange={onChange}
          max={maxDate}
        />
      </div>
    </div>
  );
}

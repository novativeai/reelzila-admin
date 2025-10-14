"use client";

import React, { useState, useEffect, InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

export const DateInput: React.FC<DateInputProps> = ({ value, onChange, ...props }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(formatDate(value));
  }, [value]);

  const formatDate = (str: string) => {
    if (!str) return '';
    const digits = str.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDate(e.target.value);
    setDisplayValue(formatted);
    onChange(formatted); // Pass the formatted value up
  };

  return (
    <Input
      {...props}
      value={displayValue}
      onChange={handleChange}
      placeholder="dd/mm/yyyy"
      maxLength={10}
    />
  );
};
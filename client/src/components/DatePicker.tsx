import { forwardRef } from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { pl } from 'date-fns/locale';
import { parseISO, format, isValid } from 'date-fns';
import { clsx } from 'clsx';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePicker.css';

// Register Polish locale once
registerLocale('pl', pl);

interface DatePickerProps {
  label: string;
  value: string; // Expects ISO string YYYY-MM-DD
  onChange: (dateString: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const DatePicker = ({ label, value, onChange, className, disabled, placeholder }: DatePickerProps) => {
  // Convert ISO string to Date object for the picker
  const getSelectedDate = (): Date | null => {
    if (!value) return null;
    const date = parseISO(value);
    return isValid(date) ? date : null;
  };

  // Handle change: convert Date object back to ISO string
  const handleChange = (date: Date | null) => {
    if (date) {
        // Format as YYYY-MM-DD
        onChange(format(date, 'yyyy-MM-dd'));
    } else {
        onChange('');
    }
  };

  // Custom Input to match existing styles perfectly
  const CustomInput = forwardRef<HTMLInputElement, any>(({ value, onClick }, ref) => (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "mt-0.5 w-full inline-flex items-center justify-between rounded-md border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white shadow-inner px-3 py-2",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled}
      ref={ref as any}
    >
      <span className={clsx("text-left truncate", !value && "text-gray-400 dark:text-gray-500")}>
        {value || placeholder || 'Wybierz datę'}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-gray-500 dark:text-gray-400 ml-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-9 4h6M5 7h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
      </svg>
    </button>
  ));

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <div className="relative">
        <ReactDatePicker
          selected={getSelectedDate()}
          onChange={handleChange}
          locale="pl"
          dateFormat="dd.MM.yyyy"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          scrollableYearDropdown
          yearDropdownItemNumber={40}
          customInput={<CustomInput />}
          disabled={disabled}
          popperClassName="z-50" // Ensure it sits above other elements
          calendarClassName="shadow-lg"
        />
      </div>
    </div>
  );
};

export default DatePicker;

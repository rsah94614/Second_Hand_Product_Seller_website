import React, { useState } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { formatDate, getPresetDateRange, validateDateRange, parseDate } from '../../../lib/formatting';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/Dialog';

const PRESETS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last 365 days', value: '365d' },
];

export function DateRangePicker({
  startDate,
  endDate,
  onDateRangeChange,
  maxDays = 365,
  showPresets = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(formatDate(startDate));
  const [tempEndDate, setTempEndDate] = useState(formatDate(endDate));
  const [error, setError] = useState(null);

  const handleApply = () => {
    const newStart = parseDate(tempStartDate);
    const newEnd = parseDate(tempEndDate);

    if (!newStart || !newEnd) {
      setError('Invalid date format. Use DD/MM/YYYY');
      return;
    }

    const validation = validateDateRange(newStart, newEnd, maxDays);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid date range');
      return;
    }

    onDateRangeChange(newStart, newEnd);
    setError(null);
    setIsOpen(false);
  };

  const handlePreset = (preset) => {
    const { startDate: newStart, endDate: newEnd } = getPresetDateRange(preset);
    onDateRangeChange(newStart, newEnd);
    setTempStartDate(formatDate(newStart));
    setTempEndDate(formatDate(newEnd));
    setError(null);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {formatDate(startDate)} - {formatDate(endDate)}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {showPresets && (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-3">
                    Quick Select
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => handlePreset(preset.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-200" />
              </>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-3">
                Custom Range
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date (DD/MM/YYYY)
                  </label>
                  <Input
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    type="text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (DD/MM/YYYY)
                  </label>
                  <Input
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    type="text"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-100 border border-red-200">
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleApply} className="flex-1">
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

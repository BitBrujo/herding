"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface FinalizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedSlot?: {
    date: string;
    time: string;
  };
  isLoading?: boolean;
}

export function FinalizationDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedSlot,
  isLoading = false
}: FinalizationDialogProps) {
  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full border-red-200 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Finalize Meeting?
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to finalize this meeting? This action cannot be undone and will lock in the selected time slot.
            </p>

            {selectedSlot && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Selected Time Slot
                  </span>
                </div>
                <div className="text-green-700 dark:text-green-300">
                  <div className="font-medium">{formatDate(selectedSlot.date)}</div>
                  <div className="text-sm">{selectedSlot.time}</div>
                </div>
              </div>
            )}

            {!selectedSlot && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="text-amber-800 dark:text-amber-200">
                    You haven&apos;t selected a time slot yet. Please select a time slot before finalizing.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading || !selectedSlot}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Finalizing...
                </div>
              ) : (
                'Stop!!! Finalize Meeting'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
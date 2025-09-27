"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RobotCatIcon } from '@/components/icons/RobotCatIcon';
import { AIRobotChat } from './AIRobotChat';

interface AIRobotButtonProps {
  onParameterUpdate: (updates: Record<string, string | number | boolean>) => void;
}

export function AIRobotButton({ onParameterUpdate }: AIRobotButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex justify-center pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2"
        >
          <RobotCatIcon className="h-4 w-4" />
          AI Katz Help
        </Button>
      </div>

      <AIRobotChat
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onParameterUpdate={onParameterUpdate}
      />
    </>
  );
}
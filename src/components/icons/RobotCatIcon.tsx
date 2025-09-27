"use client";

import React from 'react';

interface RobotCatIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export function RobotCatIcon({
  className = "",
  width = 24,
  height = 24
}: RobotCatIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Robot Cat Icon"
    >
      {/* Cat ears */}
      <path
        d="M7 4L9 7H6L7 4Z"
        fill="currentColor"
        className="opacity-90"
      />
      <path
        d="M17 4L18 7H15L17 4Z"
        fill="currentColor"
        className="opacity-90"
      />

      {/* Cat head */}
      <path
        d="M6 7C6 5.89543 6.89543 5 8 5H16C17.1046 5 18 5.89543 18 7V13C18 14.1046 17.1046 15 16 15H8C6.89543 15 6 14.1046 6 13V7Z"
        fill="currentColor"
        className="opacity-80"
      />

      {/* Robot antenna */}
      <circle
        cx="12"
        cy="3"
        r="1"
        fill="currentColor"
        className="opacity-70"
      />
      <line
        x1="12"
        y1="4"
        x2="12"
        y2="5"
        stroke="currentColor"
        strokeWidth="1"
        className="opacity-70"
      />

      {/* Cat eyes - LED style */}
      <circle
        cx="10"
        cy="9"
        r="1.5"
        fill="currentColor"
        className="opacity-90"
      />
      <circle
        cx="14"
        cy="9"
        r="1.5"
        fill="currentColor"
        className="opacity-90"
      />

      {/* Small inner glow for robot eyes */}
      <circle
        cx="10"
        cy="9"
        r="0.5"
        fill="white"
        className="opacity-60"
      />
      <circle
        cx="14"
        cy="9"
        r="0.5"
        fill="white"
        className="opacity-60"
      />

      {/* Cat nose */}
      <path
        d="M12 11L11 12.5H13L12 11Z"
        fill="currentColor"
        className="opacity-75"
      />

      {/* Robot body/chest panel */}
      <rect
        x="8"
        y="15"
        width="8"
        height="5"
        rx="1"
        fill="currentColor"
        className="opacity-70"
      />

      {/* Control panel dots */}
      <circle
        cx="10"
        cy="17"
        r="0.5"
        fill="currentColor"
        className="opacity-90"
      />
      <circle
        cx="12"
        cy="17"
        r="0.5"
        fill="currentColor"
        className="opacity-90"
      />
      <circle
        cx="14"
        cy="17"
        r="0.5"
        fill="currentColor"
        className="opacity-90"
      />

      {/* Cat whiskers */}
      <line
        x1="5"
        y1="10"
        x2="7"
        y2="9.5"
        stroke="currentColor"
        strokeWidth="0.5"
        className="opacity-60"
      />
      <line
        x1="5"
        y1="11"
        x2="7"
        y2="11"
        stroke="currentColor"
        strokeWidth="0.5"
        className="opacity-60"
      />
      <line
        x1="17"
        y1="9.5"
        x2="19"
        y2="10"
        stroke="currentColor"
        strokeWidth="0.5"
        className="opacity-60"
      />
      <line
        x1="17"
        y1="11"
        x2="19"
        y2="11"
        stroke="currentColor"
        strokeWidth="0.5"
        className="opacity-60"
      />

      {/* Animated tail tip */}
      <g className="animate-pulse">
        <path
          d="M18 18C19 19 20 20 21 21"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          className="opacity-60"
        />
        <circle
          cx="21"
          cy="21"
          r="1"
          fill="currentColor"
          className="opacity-70"
        />
      </g>
    </svg>
  );
}
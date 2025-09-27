"use client";

import React from 'react';

interface ParticipantIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export function ParticipantIcon({
  className = "",
  width = 240,
  height = 295
}: ParticipantIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 295"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        animation: 'none'
      }}
    >
      <style>
        {`
          @keyframes tailTipWag {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-12deg); }
            75% { transform: rotate(12deg); }
          }
          .tail-tip {
            animation: tailTipWag 1.5s ease-in-out infinite;
            transform-origin: 211px 46px;
          }
        `}
      </style>

      {/* Cat body without tail */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M119.621 156.28V138.01H101.351V119.739H119.621V10H101.351V28.2702H83.0809V46.5405H64.8107V28.2702H46.5405V10H28.2702V119.7H46.5405V247.67H28.2702V265.941H10V284.25H64.85V247.67H101.43V265.941H83.1595V284.25H192.86V247.67H174.471V156.28H119.621ZM64.7714 83.1202H46.5012V64.85H64.7714V83.1202ZM83.0417 83.1202V64.85H101.312V83.1202H83.0417Z"
        fill="currentColor"
      />

      {/* Static tail body */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M211.012 156.28V211.13H192.742V174.55H174.471V156.28H192.742V137.97H211.012V156.28ZM192.742 46.5798H211.012V64.8501H192.742V46.5798ZM211.012 137.97H192.742V156.24H211.012V137.97ZM174.471 64.8501H192.742V137.97H174.471V64.8501ZM211.13 247.67V229.4H229.4V156.28H211.012V211.13H192.742V247.67H211.13Z"
        fill="currentColor"
      />

      {/* Animated tail tip */}
      <g className="tail-tip">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M229.282 28.3096H211.012V46.5798H229.282V28.3096Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
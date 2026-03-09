"use client";

import React, { ReactNode } from "react";

interface VitalCardProps {
  flipped: boolean;
  onFlip: () => void;
  frontContent: ReactNode;
  backContent: ReactNode;
}

export function VitalCard({ flipped, onFlip, frontContent, backContent }: VitalCardProps) {
  return (
    <div
      className="relative perspective-[1000px] cursor-pointer group h-full"
      onClick={onFlip}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-3d ${
          flipped ? "transform-[rotateY(180deg)]" : ""
        }`}
      >
        {/* FRONT */}
        {frontContent}

        {/* BACK */}
        {backContent}
      </div>
    </div>
  );
}

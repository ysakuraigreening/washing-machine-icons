"use client";

import Image from "next/image";
import type { LaundryMachine } from "@/types/laundry";

interface LaundryCardProps {
  machine: LaundryMachine;
}

const CYCLE_SECONDS = 40 * 60; // 40 minutes

export function LaundryCard({ machine }: LaundryCardProps) {
  const isRunning = machine.power === "on";
  const elapsedMin = machine.elapsedSeconds
    ? Math.floor(machine.elapsedSeconds / 60)
    : 0;

  // Calculate progress percentage
  const progressPercent = machine.elapsedSeconds
    ? Math.min((machine.elapsedSeconds / CYCLE_SECONDS) * 100, 99)
    : 0;

  // Calculate estimated end time
  const getEstimatedEndTime = () => {
    if (!isRunning || !machine.elapsedSeconds) return null;
    const remaining = CYCLE_SECONDS - machine.elapsedSeconds;
    const endTime = new Date(
      Date.now() + (remaining > 0 ? remaining : 180) * 1000
    );
    return `${endTime.getHours().toString().padStart(2, "0")}:${endTime
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  // SVG circle calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progressPercent / 100);

  return (
    <div
      className={`bg-card rounded-2xl p-4 transition-all duration-300 border-2 ${
        isRunning ? "border-success" : "border-border"
      }`}
    >
      {/* Header Row - Unit Label & Status */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-muted-foreground font-medium">
          {machine.name}
        </p>
        <span
          className={`text-sm font-bold ${
            isRunning ? "text-success" : "text-muted-foreground"
          }`}
        >
          {isRunning ? "WORKING" : "STAND-BY"}
        </span>
      </div>

      {/* Main Content Row - Icon & Progress */}
      <div className="flex items-center gap-4 mb-4">
        {/* Laundry Icon */}
        <div className="flex-shrink-0">
          <Image
            src={
              isRunning
                ? "/images/laundry-running.gif"
                : "/images/laundry-stopped.png"
            }
            alt={isRunning ? "稼働中" : "待機中"}
            width={72}
            height={72}
            className="object-contain"
            unoptimized={isRunning}
            priority
          />
        </div>

        {/* Progress Circle */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
            <circle
              cx="30"
              cy="30"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-border"
            />
            {isRunning && (
              <circle
                cx="30"
                cy="30"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-success transition-all duration-500"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: offset,
                }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-card-foreground">
              {isRunning ? `${Math.round(progressPercent)}%` : "0%"}
            </span>
          </div>
        </div>
      </div>

      {/* Time Info Row */}
      <div className="space-y-1 border-t border-border pt-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">稼働時間</span>
          <span className={`font-bold ${isRunning ? "text-success" : "text-muted-foreground"}`}>
            {isRunning ? `${elapsedMin}分` : "-"}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">推定終了</span>
          <span className={`font-bold ${isRunning ? "text-success" : "text-muted-foreground"}`}>
            {isRunning ? getEstimatedEndTime() : "-"}
          </span>
        </div>
      </div>
    </div>
  );
}

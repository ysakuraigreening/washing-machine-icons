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

  const progressPercent = machine.elapsedSeconds
    ? Math.min((machine.elapsedSeconds / CYCLE_SECONDS) * 100, 99)
    : 0;

  const getEstimatedEndTime = () => {
    if (!isRunning || !machine.elapsedSeconds) return "-";
    const remaining = CYCLE_SECONDS - machine.elapsedSeconds;
    const endTime = new Date(
      Date.now() + (remaining > 0 ? remaining : 180) * 1000
    );
    return `${endTime.getHours().toString().padStart(2, "0")}:${endTime
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progressPercent / 100);

  return (
    <div
      className={`rounded-xl p-2 border-2 w-[180px] ${
        isRunning ? "border-success" : "border-border"
      }`}
    >
      {/* Header - Unit Name & Status */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-muted-foreground">{machine.name}</span>
        <span
          className={`text-xs font-bold ${
            isRunning ? "text-success" : "text-muted-foreground"
          }`}
        >
          {isRunning ? "WORKING" : "STAND-BY"}
        </span>
      </div>

      {/* Main - Icon & Progress */}
      <div className="flex items-center gap-3 mb-2">
        {/* Laundry Icon with border */}
        <div className="border border-border rounded-lg p-1.5">
          <Image
            src={
              isRunning
                ? "/images/laundry-running.gif"
                : "/images/laundry-stopped.png"
            }
            alt={isRunning ? "稼働中" : "待機中"}
            width={40}
            height={40}
            className="object-contain"
            unoptimized={isRunning}
            priority
          />
        </div>

        {/* Progress Circle */}
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 50 50">
            <circle
              cx="25"
              cy="25"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-border"
            />
            {isRunning && (
              <circle
                cx="25"
                cy="25"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-success"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: offset,
                }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">
              {isRunning ? `${Math.round(progressPercent)}%` : "0%"}
            </span>
          </div>
        </div>
      </div>

      {/* Time Info */}
      <div className="text-xs">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">稼働時間</span>
          <span className={isRunning ? "text-success font-bold" : "text-muted-foreground"}>
            {isRunning ? `${elapsedMin}分` : "-"}
          </span>
        </div>
      </div>
    </div>
  );
}

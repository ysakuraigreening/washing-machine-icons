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
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progressPercent / 100);

  return (
    <div
      className={`bg-card rounded-xl shadow-md p-5 transition-all duration-300 border-2 ${
        isRunning ? "border-success" : "border-border"
      }`}
    >
      {/* Unit Label */}
      <p className="text-sm text-muted-foreground font-medium mb-3">
        {machine.name}
      </p>

      {/* Laundry Icon - GIF for running, static PNG for stopped */}
      <div className="flex justify-center mb-3">
        <Image
          src={
            isRunning
              ? "/images/laundry-running.gif"
              : "/images/laundry-stopped.png"
          }
          alt={isRunning ? "稼働中" : "待機中"}
          width={100}
          height={100}
          className="object-contain"
          unoptimized={isRunning} // Required for GIF animation
          priority
        />
      </div>

      {/* Status Badge */}
      <div className="text-center mb-4">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
            isRunning
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isRunning ? "WORKING" : "STAND-BY"}
        </span>
      </div>

      {/* Progress Circle - Only show when running */}
      {isRunning && (
        <>
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-border"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-success transition-all duration-500"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: offset,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-card-foreground">
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>

          {/* Time Info */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">稼働時間</span>
              <span className="font-bold text-success">{elapsedMin}分</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">推定終了</span>
              <span className="font-bold text-success">
                {getEstimatedEndTime()}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

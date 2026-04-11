"use client";

import Image from "next/image";
import type { LaundryMachine, LaundryState } from "@/types/laundry";
import { resolveLaundryStatus } from "@/lib/laundry-progress";

interface LaundryCardProps {
  machine: LaundryMachine;
}

// 状態に応じた色を取得
function getStateColors(state: LaundryState) {
  switch (state) {
    case "idle":
      return {
        border: "border-border",
        badge: "bg-gray-100 text-gray-600",
        progress: "text-gray-400",
        text: "text-muted-foreground",
      };
    case "running":
      return {
        border: "border-blue-500",
        badge: "bg-blue-100 text-blue-700",
        progress: "text-blue-500",
        text: "text-blue-600",
      };
    case "finishing":
      return {
        border: "border-amber-500",
        badge: "bg-amber-100 text-amber-700",
        progress: "text-amber-500",
        text: "text-amber-600",
      };
    case "completed":
      return {
        border: "border-success",
        badge: "bg-green-100 text-green-700",
        progress: "text-success",
        text: "text-success",
      };
  }
}

// デバイスタイプに応じた画像パスを取得
function getDeviceImages(machineId: string) {
  // UNIT_001とUNIT_002はスチーマー画像を使用
  if (machineId === "unit-001" || machineId === "unit-002") {
    return {
      running: "/images/steamer-running.gif",
      stopped: "/images/steamer-stopped.png",
    };
  }
  // その他は洗濯機画像を使用
  return {
    running: "/images/laundry-running.gif",
    stopped: "/images/laundry-stopped.png",
  };
}

export function LaundryCard({ machine }: LaundryCardProps) {
  const isPowerOn = machine.power === "on";

  // 進捗計算
  const status = resolveLaundryStatus({
    isPowerOn,
    elapsedSeconds: machine.elapsedSeconds || 0,
    onStableSeconds: machine.onStableSeconds || 0,
    offStableSeconds: machine.offStableSeconds || 0,
  });

  const colors = getStateColors(status.state);
  const images = getDeviceImages(machine.id);

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - status.progress / 100);

  const isActive = status.state !== "idle";

  return (
    <div className={`rounded-3xl p-8 border-4 w-96 ${colors.border}`}>
      {/* Header - Unit Name & Status Badge */}
      <div className="flex items-center gap-6 mb-6">
        <span className="text-2xl text-muted-foreground font-medium">{machine.name}</span>
        <span className={`text-lg font-bold px-4 py-2 rounded-full ${colors.badge}`}>
          {status.statusLabel}
        </span>
      </div>

      {/* Main - Icon & Progress */}
      <div className="flex items-center gap-8 mb-6">
        {/* Laundry Icon with border */}
        <div className="border-3 border-border rounded-2xl p-4">
          <Image
            src={
              isActive && status.state !== "completed"
                ? images.running
                : images.stopped
            }
            alt={status.statusLabel}
            width={96}
            height={96}
            className="object-contain"
            unoptimized={isActive && status.state !== "completed"}
            priority
          />
        </div>

        {/* Progress Circle */}
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-border"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className={colors.progress}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: offset,
                transition: "stroke-dashoffset 0.5s ease-in-out",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold">{Math.round(status.progress)}%</span>
          </div>
        </div>
      </div>

      {/* Time Info */}
      <div className="text-lg">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">Elapsed</span>
          <span className={isActive ? `${colors.text} font-bold` : "text-muted-foreground"}>
            {isActive ? `${status.elapsedMinutes}min` : "-"}
          </span>
        </div>
      </div>

      {/* Helper Text */}
      {status.helperText && (
        <div className={`text-lg mt-3 ${colors.text}`}>
          {status.helperText}
        </div>
      )}
    </div>
  );
}

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

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - status.progress / 100);

  const isActive = status.state !== "idle";

  return (
    <div className={`rounded-xl p-3 border-2 w-[180px] ${colors.border}`}>
      {/* Header - Unit Name & Status Badge */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-xs text-muted-foreground">{machine.name}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
          {status.statusLabel}
        </span>
      </div>

      {/* Main - Icon & Progress */}
      <div className="flex items-center justify-center gap-3 mb-2">
        {/* Laundry Icon with border */}
        <div className="border border-border rounded-lg p-1.5">
          <Image
            src={
              isActive && status.state !== "completed"
                ? images.running
                : images.stopped
            }
            alt={status.statusLabel}
            width={40}
            height={40}
            className="object-contain"
            unoptimized={isActive && status.state !== "completed"}
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
            <circle
              cx="25"
              cy="25"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
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
            <span className="text-xs font-bold">{Math.round(status.progress)}%</span>
          </div>
        </div>
      </div>

      {/* Time Info */}
      <div className="text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Elapsed</span>
          <span className={isActive ? `${colors.text} font-bold` : "text-muted-foreground"}>
            {isActive ? `${status.elapsedMinutes}min` : "-"}
          </span>
        </div>
      </div>

      {/* Helper Text */}
      {status.helperText && (
        <div className={`text-xs mt-1 ${colors.text}`}>
          {status.helperText}
        </div>
      )}
    </div>
  );
}

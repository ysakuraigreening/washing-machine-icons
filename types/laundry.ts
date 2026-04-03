// 既存の型定義（API用）
export interface LaundryMachine {
  id: string;
  name: string;
  power: "on" | "off";
  elapsedSeconds?: number;
  startTime?: string;
  // 新規追加: 安定時間の追跡
  onStableSeconds?: number;
  offStableSeconds?: number;
}

export interface LaundryStatus {
  machines: LaundryMachine[];
  lastUpdated: string;
}

// 新規: 進捗計算用の入力型
export type LaundryRuntimeInput = {
  isPowerOn: boolean;
  elapsedSeconds: number;
  onStableSeconds: number;
  offStableSeconds: number;
  previousProgress?: number;
};

// 新規: 状態の型
export type LaundryState = "idle" | "running" | "finishing" | "completed";

// 新規: 計算結果の型
export type LaundryStatusResult = {
  state: LaundryState;
  progress: number;
  elapsedMinutes: number;
  remainingMin: number | null;
  remainingMax: number | null;
  statusLabel: string;
  helperText: string;
};

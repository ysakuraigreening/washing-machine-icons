// 稼働状態を永続化するためのストレージ
// Vercelのサーバーレス環境では、リクエスト間でメモリが共有されないため
// 本番環境ではVercel KVやRedisなどの外部ストレージを使用することを推奨

interface MachineState {
  startTime: string; // ISO timestamp - 稼働開始時刻
  lastPowerState: boolean; // 前回の電源状態
  onStableStart?: string; // 通電ON安定開始時刻
  offStableStart?: string; // 通電OFF安定開始時刻
  previousProgress?: number; // 前回の進捗率（逆戻り防止用）
}

// Node.js環境でグローバルに保持されるオブジェクト
const globalForState = globalThis as unknown as {
  machineStates: Map<string, MachineState> | undefined;
};

// グローバル変数として保持（開発環境でのホットリロード対策）
export const machineStates = globalForState.machineStates ?? new Map<string, MachineState>();

if (process.env.NODE_ENV !== "production") {
  globalForState.machineStates = machineStates;
}

// 既存のスタートタイム取得
export function getMachineStartTime(machineId: string): Date | undefined {
  const state = machineStates.get(machineId);
  if (state?.startTime) {
    return new Date(state.startTime);
  }
  return undefined;
}

// スタートタイム設定
export function setMachineStartTime(machineId: string, startTime: Date): void {
  const existing = machineStates.get(machineId);
  machineStates.set(machineId, {
    ...existing,
    startTime: startTime.toISOString(),
    lastPowerState: true,
  });
}

// スタートタイムクリア
export function clearMachineStartTime(machineId: string): void {
  machineStates.delete(machineId);
}

// マシンが稼働中か
export function isMachineRunning(machineId: string): boolean {
  return machineStates.has(machineId);
}

// ========================================
// 新規: 安定時間の追跡
// ========================================

/**
 * 電源状態を更新し、安定時間を計算
 */
export function updatePowerState(
  machineId: string,
  isPowerOn: boolean
): { onStableSeconds: number; offStableSeconds: number } {
  const now = new Date();
  const state = machineStates.get(machineId);

  if (!state) {
    // 新規状態
    const newState: MachineState = {
      startTime: isPowerOn ? now.toISOString() : "",
      lastPowerState: isPowerOn,
      onStableStart: isPowerOn ? now.toISOString() : undefined,
      offStableStart: !isPowerOn ? now.toISOString() : undefined,
    };
    machineStates.set(machineId, newState);

    return { onStableSeconds: 0, offStableSeconds: 0 };
  }

  // 電源状態が変わった場合
  if (state.lastPowerState !== isPowerOn) {
    const updatedState: MachineState = {
      ...state,
      lastPowerState: isPowerOn,
      onStableStart: isPowerOn ? now.toISOString() : undefined,
      offStableStart: !isPowerOn ? now.toISOString() : undefined,
    };
    
    // ONからOFFに変わった場合、startTimeはそのまま保持（完了判定用）
    if (!isPowerOn && state.startTime) {
      updatedState.startTime = state.startTime;
    }
    
    machineStates.set(machineId, updatedState);

    return { onStableSeconds: 0, offStableSeconds: 0 };
  }

  // 電源状態が継続している場合、安定時間を計算
  let onStableSeconds = 0;
  let offStableSeconds = 0;

  if (isPowerOn && state.onStableStart) {
    onStableSeconds = Math.floor((now.getTime() - new Date(state.onStableStart).getTime()) / 1000);
  } else if (!isPowerOn && state.offStableStart) {
    offStableSeconds = Math.floor((now.getTime() - new Date(state.offStableStart).getTime()) / 1000);
  }

  return { onStableSeconds, offStableSeconds };
}

/**
 * 前回の進捗率を取得
 */
export function getPreviousProgress(machineId: string): number | undefined {
  return machineStates.get(machineId)?.previousProgress;
}

/**
 * 進捗率を保存
 */
export function savePreviousProgress(machineId: string, progress: number): void {
  const state = machineStates.get(machineId);
  if (state) {
    machineStates.set(machineId, { ...state, previousProgress: progress });
  }
}

/**
 * 完了時に状態をリセット
 */
export function resetMachineState(machineId: string): void {
  machineStates.delete(machineId);
}

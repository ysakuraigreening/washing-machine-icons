import type { LaundryRuntimeInput, LaundryState, LaundryStatusResult } from "@/types/laundry";

// ========================================
// 定数
// ========================================

// 通電ON安定判定の閾値（秒）
const ON_STABLE_THRESHOLD = 15;

// 通電OFF安定判定の閾値（秒）- 完了判定用
const OFF_STABLE_THRESHOLD = 90;

// 候補所要時間（分）
const COURSE_DURATIONS = [30, 35, 60, 80, 90, 120] as const;

// 完了前の最大進捗率
const MAX_PROGRESS_BEFORE_COMPLETE = 95;

// finishing状態の判定閾値
const FINISHING_ELAPSED_THRESHOLD = 90; // 90分以上
const FINISHING_PROGRESS_THRESHOLD = 88; // 88%以上
const MAX_ELAPSED_MINUTES = 120;

// ========================================
// 進捗率の区分線形計算
// ========================================

/**
 * 経過時間から推定進捗率を計算（区分線形）
 * completed前は最大95%
 */
export function calcEstimatedProgress(elapsedMinutes: number): number {
  // 区分線形のブレークポイント
  const breakpoints = [
    { min: 0, max: 30, startProgress: 0, endProgress: 45 },
    { min: 30, max: 35, startProgress: 45, endProgress: 55 },
    { min: 35, max: 60, startProgress: 55, endProgress: 70 },
    { min: 60, max: 80, startProgress: 70, endProgress: 82 },
    { min: 80, max: 90, startProgress: 82, endProgress: 88 },
    { min: 90, max: 120, startProgress: 88, endProgress: 95 },
  ];

  // 120分超は95%固定
  if (elapsedMinutes >= MAX_ELAPSED_MINUTES) {
    return MAX_PROGRESS_BEFORE_COMPLETE;
  }

  // 該当する区間を探す
  for (const bp of breakpoints) {
    if (elapsedMinutes >= bp.min && elapsedMinutes < bp.max) {
      const ratio = (elapsedMinutes - bp.min) / (bp.max - bp.min);
      return bp.startProgress + ratio * (bp.endProgress - bp.startProgress);
    }
  }

  return 0;
}

// ========================================
// 残り時間レンジの計算
// ========================================

/**
 * 経過時間から残り時間のレンジを計算
 */
export function getRemainingRange(elapsedMinutes: number): { min: number | null; max: number | null } {
  // 経過時間より大きい候補だけを残す
  const candidates = COURSE_DURATIONS.filter((d) => d > elapsedMinutes);

  if (candidates.length === 0) {
    // 候補がない場合はnull（終了判定中）
    return { min: null, max: null };
  }

  const minCandidate = Math.min(...candidates);
  const maxCandidate = Math.max(...candidates);

  return {
    min: minCandidate - elapsedMinutes,
    max: maxCandidate - elapsedMinutes,
  };
}

// ========================================
// 状態判定ロジック
// ========================================

/**
 * メインのステータス解決関数
 */
export function resolveLaundryStatus(input: LaundryRuntimeInput): LaundryStatusResult {
  const { isPowerOn, elapsedSeconds, onStableSeconds, offStableSeconds, previousProgress } = input;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  // 1. completed判定（最優先）
  // 通電OFFが90秒以上連続で続いたら完了
  if (offStableSeconds >= OFF_STABLE_THRESHOLD) {
    return {
      state: "completed",
      progress: 100,
      elapsedMinutes,
      remainingMin: 0,
      remainingMax: 0,
      statusLabel: "COMPLETE",
      helperText: "Ready for pickup",
    };
  }

  // 2. idle判定
  // 開始条件（onStableSeconds >= 15）がまだ成立していない場合
  const hasStarted = onStableSeconds >= ON_STABLE_THRESHOLD || elapsedSeconds > 0;
  
  if (!hasStarted && !isPowerOn) {
    return {
      state: "idle",
      progress: 0,
      elapsedMinutes: 0,
      remainingMin: null,
      remainingMax: null,
      statusLabel: "STAND-BY",
      helperText: "Waiting",
    };
  }

  // 3. 進捗率の計算
  let calculatedProgress = calcEstimatedProgress(elapsedMinutes);

  // 進捗は逆戻りさせない
  if (previousProgress !== undefined && previousProgress > calculatedProgress) {
    calculatedProgress = previousProgress;
  }

  // completed前は最大95%
  calculatedProgress = Math.min(calculatedProgress, MAX_PROGRESS_BEFORE_COMPLETE);

  // 4. 残り時間レンジの計算
  const remaining = getRemainingRange(elapsedMinutes);

  // 5. finishing判定
  // - elapsedMinutes >= 90
  // - progress >= 88
  // - elapsedMinutes > 120
  const isFinishing =
    elapsedMinutes >= FINISHING_ELAPSED_THRESHOLD ||
    calculatedProgress >= FINISHING_PROGRESS_THRESHOLD ||
    elapsedMinutes > MAX_ELAPSED_MINUTES;

  if (isFinishing) {
    return {
      state: "finishing",
      progress: calculatedProgress,
      elapsedMinutes,
      remainingMin: remaining.min,
      remainingMax: remaining.max,
      statusLabel: "FINISHING",
      helperText: remaining.min === null ? "Checking..." : "Almost done",
    };
  }

  // 6. running状態
  return {
    state: "running",
    progress: calculatedProgress,
    elapsedMinutes,
    remainingMin: remaining.min,
    remainingMax: remaining.max,
    statusLabel: "WORKING",
    helperText: "",
  };
}

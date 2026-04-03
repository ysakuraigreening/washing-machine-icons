/**
 * 分数をフォーマット
 */
export function formatMinutesLabel(minutes: number): string {
  return `${minutes}分`;
}

/**
 * 残り時間レンジをフォーマット
 */
export function formatRemainingLabel(min: number | null, max: number | null): string {
  if (min === null || max === null) {
    return "終了判定中";
  }

  if (min === max) {
    return `約${min}分`;
  }

  return `${min}〜${max}分`;
}

/**
 * 進捗率をフォーマット
 */
export function formatProgressLabel(progress: number): string {
  return `${Math.round(progress)}%`;
}

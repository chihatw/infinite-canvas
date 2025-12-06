// step 単位に丸める
// roundDownToMultiple(540, 100) = 500
export function roundDownToMultiple(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

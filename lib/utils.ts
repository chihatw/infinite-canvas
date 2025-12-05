import { Vec2 } from './vec2';

// 世界座標 → 画面座標 に変換
export function worldToScreen(
  world: Vec2,
  canvasSize: { width: number; height: number },
  cameraPos: Vec2,
  cameraScale: number
): Vec2 {
  const halfW = canvasSize.width / 2;
  const halfH = canvasSize.height / 2;
  const canvasCenter = new Vec2(halfW, halfH);

  // 世界座標からカメラ中心への相対距離
  const relative = world.sub(cameraPos);

  // 拡大縮小
  const scaled = relative.scale(cameraScale);

  // 画面中心へ移動
  return canvasCenter.add(scaled);
}

// 画面座標 → 世界座標 に変換。
export function screenToWorld(
  screen: Vec2,
  canvasSize: { width: number; height: number },
  cameraPos: Vec2,
  cameraScale: number
): Vec2 {
  const halfW = canvasSize.width / 2;
  const halfH = canvasSize.height / 2;
  const canvasCenter = new Vec2(halfW, halfH);

  const relative = screen.sub(canvasCenter);
  const unscaled = relative.scale(1 / cameraScale);

  return cameraPos.add(unscaled);
}

// step 単位に丸める
// roundDownToMultiple(540, 100) = 500
export function roundDownToMultiple(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

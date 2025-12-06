import { Vec2 } from '../math/vec2';
import { CanvasEngine } from './canvas-engine';

export function setupZoomHandlers(
  canvas: HTMLCanvasElement,
  engine: CanvasEngine
) {
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault(); // 通常の画面スクロールをさせない

    const canvasRect = canvas.getBoundingClientRect();

    const pointerScreenPos = new Vec2(e.clientX, e.clientY);
    const canvasScreenOrigin = new Vec2(canvasRect.left, canvasRect.top);
    const localScreenPos = pointerScreenPos.sub(canvasScreenOrigin);

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9; // 拡大動作をしたら １．１ 倍、縮小動作をしたら ０.9 倍
    engine.zoomAtScreenPoint(localScreenPos, zoomFactor);
  };

  canvas.addEventListener('wheel', handleWheel, { passive: false }); // e.preventDefault(); を有効にする
  return () => {
    canvas.removeEventListener('wheel', handleWheel);
  };
}

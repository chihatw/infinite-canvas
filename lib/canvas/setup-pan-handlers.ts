import { Vec2 } from '../math/vec2';
import { CanvasEngine } from './canvas-engine';

/**
 * 左ドラッグ:
 *   - ノード上で押した場合: ノードをドラッグ移動
 *   - 何もない場所で押した場合: 画面パン
 */
export function setupPanHandlers(
  canvas: HTMLCanvasElement,
  engine: CanvasEngine
) {
  type Mode = 'none' | 'panning' | 'drag-node';

  let mode: Mode = 'none';

  // パン用: 画面全体の client 座標
  let lastPanPointerPos: Vec2 | null = null;

  // ノードドラッグ用: canvas 内座標 (0,0)〜(width,height)
  let lastDragPointerPos: Vec2 | null = null;
  let draggingNodeId: string | null = null;

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return; // 左クリックのみ

    const canvasRect = canvas.getBoundingClientRect();

    const pointerClient = new Vec2(e.clientX, e.clientY);
    const canvasOrigin = new Vec2(canvasRect.left, canvasRect.top);
    const pointerLocal = pointerClient.sub(canvasOrigin);

    // まずノードのヒットテスト
    const hitNode = engine.hitTestNodeAtScreenPoint(pointerLocal);

    if (hitNode) {
      // ノードドラッグ開始
      mode = 'drag-node';
      draggingNodeId = hitNode.id;
      lastDragPointerPos = pointerLocal;

      engine.selectNode(hitNode.id);
    } else {
      // 背景ドラッグ → パン
      mode = 'panning';
      lastPanPointerPos = pointerClient;
    }

    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (mode === 'drag-node' && draggingNodeId && lastDragPointerPos) {
      const canvasRect = canvas.getBoundingClientRect();
      const pointerLocal = new Vec2(
        e.clientX - canvasRect.left,
        e.clientY - canvasRect.top
      );

      const deltaScreen = pointerLocal.sub(lastDragPointerPos);
      lastDragPointerPos = pointerLocal;

      // ノードを画面座標系の差分で動かす
      engine.moveNodeByScreenDelta(draggingNodeId, deltaScreen);
      return;
    }

    if (mode === 'panning' && lastPanPointerPos) {
      const current = new Vec2(e.clientX, e.clientY);
      const deltaScreen = current.sub(lastPanPointerPos);
      lastPanPointerPos = current;

      engine.panByScreenDelta(deltaScreen);
      return;
    }
  };

  const endInteraction = (e?: PointerEvent) => {
    mode = 'none';
    lastPanPointerPos = null;
    lastDragPointerPos = null;
    draggingNodeId = null;

    // ドラッグが終わったら必ず選択解除
    engine.selectNode(null);

    if (e) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    endInteraction(e);
  };

  const handlePointerLeave = (e: PointerEvent) => {
    endInteraction(e);
  };

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointerleave', handlePointerLeave);

  return () => {
    canvas.removeEventListener('pointerdown', handlePointerDown);
    canvas.removeEventListener('pointermove', handlePointerMove);
    canvas.removeEventListener('pointerup', handlePointerUp);
    canvas.removeEventListener('pointerleave', handlePointerLeave);
  };
}

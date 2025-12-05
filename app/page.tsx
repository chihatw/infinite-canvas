// app/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import { CanvasEngine } from '../lib/canvas-engine';
import { Vec2 } from '../lib/vec2';

function setupResize(canvas: HTMLCanvasElement, engine: CanvasEngine) {
  const handleResize = () => {
    engine.resize();
  };

  window.addEventListener('resize', handleResize);
  handleResize(); // 初回

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}

function setupPanHandlers(canvas: HTMLCanvasElement, engine: CanvasEngine) {
  let isPanning = false;
  let lastPointerPos: Vec2 | null = null;

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return; // 左クリックのみ
    isPanning = true;
    lastPointerPos = new Vec2(e.clientX, e.clientY);
    canvas.setPointerCapture(e.pointerId); // ポインターと要素をひもづけ。ポインターが要素を外れても紐付けを解除しない
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isPanning || !lastPointerPos) return;
    const current = new Vec2(e.clientX, e.clientY);
    const deltaScreen = current.sub(lastPointerPos);
    lastPointerPos = current;

    engine.panByScreenDelta(deltaScreen);
  };

  const endPan = (e?: PointerEvent) => {
    isPanning = false;
    lastPointerPos = null;
    if (e) {
      canvas.releasePointerCapture(e.pointerId); // ポインターと要素の紐付けを解除
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (e.button !== 0) return;
    endPan(e);
  };

  const handlePointerLeave = () => {
    endPan();
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

function setupZoomHandlers(canvas: HTMLCanvasElement, engine: CanvasEngine) {
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

function startRenderLoop(engine: CanvasEngine) {
  let frameId: number;

  const loop = () => {
    engine.drawFrame();
    frameId = requestAnimationFrame(loop);
  };
  frameId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(frameId);
  };
}

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new CanvasEngine(canvas);

    // とりあえず中央に楕円を1つ置く
    engine.setNodes([
      {
        id: 'root',
        center: Vec2.zero(), // 世界座標 (0,0)
        radius: new Vec2(120, 60),
        label: 'メインノード',
      },
    ]);

    // 各機能をセットアップ
    const cleanupResize = setupResize(canvas, engine);
    const cleanupPan = setupPanHandlers(canvas, engine);
    const cleanupZoom = setupZoomHandlers(canvas, engine);
    const cleanupLoop = startRenderLoop(engine);

    return () => {
      cleanupResize();
      cleanupPan();
      cleanupZoom();
      cleanupLoop();
    };
  }, []);

  return (
    <main className='w-screen h-screen'>
      <canvas ref={canvasRef} className='w-full h-full block' />
    </main>
  );
}

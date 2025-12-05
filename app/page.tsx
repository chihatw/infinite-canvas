// app/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import { CanvasEngine } from '../lib/canvas-engine';
import { Vec2 } from '../lib/vec2';

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

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // ===== パン操作（ドラッグ） =====
    let isPanning = false;
    let lastPointerPos: Vec2 | null = null;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // 左クリックのみ
      isPanning = true;
      lastPointerPos = new Vec2(e.clientX, e.clientY);
      canvas.setPointerCapture(e.pointerId); // ドラッグ中にポインターが要素外に出ても関係を切断しない
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPanning || !lastPointerPos) return;
      const current = new Vec2(e.clientX, e.clientY);
      const deltaScreen = current.sub(lastPointerPos);
      lastPointerPos = current;

      engine.panByScreenDelta(deltaScreen);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      isPanning = false;
      lastPointerPos = null;
      canvas.releasePointerCapture(e.pointerId); // ポインターと要素の関係を切断
    };

    const handlePointerLeave = () => {
      isPanning = false;
      lastPointerPos = null;
    };

    // ===== ホイールズーム =====
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const localPoint = new Vec2(e.clientX - rect.left, e.clientY - rect.top);

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      engine.zoomAtScreenPoint(localPoint, zoomFactor);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // ===== rAF 描画ループ =====
    let frameId: number;

    const loop = () => {
      engine.drawFrame();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('wheel', handleWheel);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <main className='w-screen h-screen'>
      <canvas ref={canvasRef} className='w-full h-full block' />
    </main>
  );
}

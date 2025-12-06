// app/page.tsx
'use client';

import { setupPanHandlers } from '@/lib/canvas/setup-pan-handlers';
import { setupZoomHandlers } from '@/lib/canvas/setup-zoom-handlers';
import { startRenderLoop } from '@/lib/canvas/start-render-loop';
import { useEffect, useRef } from 'react';
import { CanvasEngine } from '../lib/canvas/canvas-engine';
import { Vec2 } from '../lib/math/vec2';

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

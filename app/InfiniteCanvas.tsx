'use client';

import { useEffect, useRef } from 'react';
import { CanvasEngine } from './CanvasEngine';

export default function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CanvasEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new CanvasEngine(canvas);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <div className='w-screen h-screen bg-gray-100'>
      <canvas ref={canvasRef} className='block' />
    </div>
  );
}

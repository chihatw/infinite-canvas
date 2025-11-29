'use client';

import { useEffect, useRef } from 'react';

type Camera = {
  x: number;
  y: number;
  scale: number;
};

type Node = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  text: string;
};

export default function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: 1 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const nodeRef = useRef<Node>({ x: 0, y: 0, rx: 120, ry: 80, text: 'Hello' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const camera = cameraRef.current;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      render();
    };

    const worldToScreen = (wx: number, wy: number) => {
      return {
        x: (wx - camera.x) * camera.scale + canvas.width / 2,
        y: (wy - camera.y) * camera.scale + canvas.height / 2,
      };
    };

    const render = () => {
      const node = nodeRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const p = worldToScreen(node.x, node.y);

      ctx.beginPath();
      ctx.ellipse(
        p.x,
        p.y,
        node.rx * camera.scale,
        node.ry * camera.scale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.stroke();

      ctx.fillStyle = 'black';
      const fontSize = 20 * camera.scale;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.text, p.x, p.y);
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const last = lastMouseRef.current;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      camera.x -= dx / camera.scale;
      camera.y -= dy / camera.scale;

      render();
    };

    const stopDragging = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const beforeX = (mouseX - canvas.width / 2) / camera.scale + camera.x;
      const beforeY = (mouseY - canvas.height / 2) / camera.scale + camera.y;

      const zoomFactor = 1.1;
      if (e.deltaY < 0) {
        camera.scale *= zoomFactor;
      } else {
        camera.scale /= zoomFactor;
      }

      const afterX = (mouseX - canvas.width / 2) / camera.scale + camera.x;
      const afterY = (mouseY - canvas.height / 2) / camera.scale + camera.y;

      camera.x += beforeX - afterX;
      camera.y += beforeY - afterY;

      render();
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', stopDragging);
    canvas.addEventListener('mouseleave', stopDragging);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    render();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', stopDragging);
      canvas.removeEventListener('mouseleave', stopDragging);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div className='w-screen h-screen bg-gray-100'>
      <canvas ref={canvasRef} className='block' />
    </div>
  );
}

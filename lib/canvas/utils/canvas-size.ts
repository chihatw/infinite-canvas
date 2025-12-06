import { DisplaySize } from '@/lib/types/display-size';

export function getCanvasDisplaySize(canvas: HTMLCanvasElement): DisplaySize {
  const rect = canvas.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
}

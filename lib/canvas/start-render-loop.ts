import { CanvasEngine } from './canvas-engine';

export function startRenderLoop(engine: CanvasEngine) {
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

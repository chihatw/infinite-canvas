import { Camera } from './camera';
import { DisplaySize } from './display-size';

export interface Layer {
  draw(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    canvasSize: DisplaySize
  ): void;
}

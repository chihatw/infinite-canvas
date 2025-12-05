import { Vec2 } from './vec2';

/**
 * ホワイトボード全体の表示を管理するカメラ。
 * position: 画面中央がどの世界座標を向いているか
 * scale: 拡大率（1 = 等倍）
 */
export type Camera = {
  position: Vec2;
  scale: number;
};

export type DisplaySize = { width: number; height: number };

export interface Layer {
  draw(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    canvasSize: DisplaySize
  ): void;
}

export type NodeEllipse = {
  id: string;
  center: Vec2; // 世界座標での中心位置
  radius: Vec2; // 世界座標での半径（x, y）
  label: string;
};

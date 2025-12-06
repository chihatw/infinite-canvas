import { Vec2 } from '../math/vec2';

/**
 * ホワイトボード全体の表示を管理するカメラ。
 * position: 画面中央がどの世界座標を向いているか
 * scale: 拡大率（1 = 等倍）
 */
export type Camera = {
  position: Vec2;
  scale: number;
};

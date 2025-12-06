import { Vec2 } from '../math/vec2';

export type NodeEllipse = {
  id: string;
  center: Vec2; // 世界座標での中心位置
  radius: Vec2; // 世界座標での半径（x, y）
  label: string;
};

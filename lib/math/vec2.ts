// lib/vec2.ts

/**
 * 2次元ベクトル。座標や移動量などの表現に使う。
 */
export class Vec2 {
  constructor(public x: number, public y: number) {}

  static zero(): Vec2 {
    return new Vec2(0, 0);
  }

  set(x: number, y: number): Vec2 {
    this.x = x;
    this.y = y;
    return this;
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  scale(s: number): Vec2 {
    return new Vec2(this.x * s, this.y * s);
  }
}

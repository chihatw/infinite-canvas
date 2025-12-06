import { roundDownToMultiple } from '../math/round';
import { Vec2 } from '../math/vec2';

import { Camera } from '../types/camera';
import { DisplaySize } from '../types/display-size';
import { Layer } from '../types/layer';

import { screenToWorld, worldToScreen } from './utils/coordinate';

type WorldRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

function getGridAreaRect(
  canvasRect: WorldRect,
  gridSpacing: number
): WorldRect {
  // Canvas の左端をグリッド間隔に切り捨てで丸める
  const left = roundDownToMultiple(canvasRect.left, gridSpacing);
  // Canvas の右端をグリッド間隔に切り捨てで丸める
  const right = roundDownToMultiple(canvasRect.right, gridSpacing);
  // Canvas の上端をグリッド間隔に切り捨てで丸める
  const top = roundDownToMultiple(canvasRect.top, gridSpacing);
  // Canvas の下端をグリッド間隔に切り捨てで丸める
  const bottom = roundDownToMultiple(canvasRect.bottom, gridSpacing);
  return { left, right, top, bottom };
}

export class GridLayer implements Layer {
  constructor(
    private gridSpacingWorld = 100,
    private strokeStyle = 'rgba(148, 163, 184, 0.4)',
    private lineWidth = 1
  ) {}

  draw(ctx: CanvasRenderingContext2D, camera: Camera, canvasSize: DisplaySize) {
    // 共通引数をあらかじめ渡したローカルラッパー関数
    const screenToWorldLocal = (vec: Vec2) =>
      screenToWorld(vec, canvasSize, camera.position, camera.scale);
    const worldToScreenLocal = (vec: Vec2) =>
      worldToScreen(vec, canvasSize, camera.position, camera.scale);

    // Canvas の左上座標を世界座標に
    const topLeftWorld = screenToWorldLocal(new Vec2(0, 0));
    // Canvas の右下座標を世界座標に
    const bottomRightWorld = screenToWorldLocal(
      new Vec2(canvasSize.width, canvasSize.height)
    );

    const canvasWorldRect: WorldRect = {
      left: topLeftWorld.x,
      top: topLeftWorld.y,
      right: bottomRightWorld.x,
      bottom: bottomRightWorld.y,
    };

    // グリッド間隔にまるめて、余りは切り捨て
    // {0,100,200,300} = getGridAreaRect({10, 130, 290, 308}, 100)
    const gridAreaWorldRect = getGridAreaRect(
      canvasWorldRect,
      this.gridSpacingWorld
    );

    ctx.save();
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.strokeStyle;

    const {
      left: canvasLeft,
      right: canvasRight,
      top: canvasTop,
      bottom: canvasBottom,
    } = canvasWorldRect;

    const {
      left: gridLeft,
      right: gridRight,
      top: gridTop,
      bottom: gridBottom,
    } = gridAreaWorldRect;

    // for 文の中で new を使わないように 代入用オブジェクトを作成
    const tmp1 = new Vec2(0, 0);
    const tmp2 = new Vec2(0, 0);

    // 垂直線
    // グリッドエリアの左端から、右端まで gridSpacing の間隔で canvasTop から canvasBottom まで線を引く
    for (let x = gridLeft; x <= gridRight; x += this.gridSpacingWorld) {
      tmp1.set(x, canvasTop);
      tmp2.set(x, canvasBottom);

      const p1 = worldToScreenLocal(tmp1);
      const p2 = worldToScreenLocal(tmp2);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // 水平線
    // グリッドエリアの上端から、下端まで gridSpacing の間隔で canvasLeft から canvasRight まで線を引く

    for (let y = gridTop; y <= gridBottom; y += this.gridSpacingWorld) {
      tmp1.set(canvasLeft, y);
      tmp2.set(canvasRight, y);

      const p1 = worldToScreenLocal(tmp1);
      const p2 = worldToScreenLocal(tmp2);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    ctx.restore();
  }
}

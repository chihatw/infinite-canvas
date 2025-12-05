// lib/node-ellipse-layer.ts
import { Camera, DisplaySize, Layer, NodeEllipse } from './types';
import { worldToScreen } from './utils';
import { Vec2 } from './vec2';

export class NodeEllipseLayer implements Layer {
  private nodes: NodeEllipse[] = [];

  constructor(
    private fillStyle = 'white',
    private strokeStyle = '#1f2937', // slate-900
    private lineWidth = 2,
    private textColor = '#111827', // gray-900
    private baseFontSize = 16,
    private fontFamily = 'system-ui'
  ) {}

  // ---- ノード操作 API ----

  setNodes(nodes: NodeEllipse[]) {
    this.nodes = nodes;
  }

  getNodes(): readonly NodeEllipse[] {
    return this.nodes;
  }

  addNode(node: NodeEllipse) {
    this.nodes.push(node);
  }

  updateNode(id: string, partial: Partial<NodeEllipse>) {
    const idx = this.nodes.findIndex((n) => n.id === id);
    if (idx === -1) return;
    this.nodes[idx] = { ...this.nodes[idx], ...partial };
  }

  moveNode(id: string, deltaWorld: Vec2) {
    const idx = this.nodes.findIndex((n) => n.id === id);
    if (idx === -1) return;
    const node = this.nodes[idx];
    this.nodes[idx] = {
      ...node,
      center: node.center.add(deltaWorld),
    };
  }

  resizeNode(id: string, newRadius: Vec2) {
    const idx = this.nodes.findIndex((n) => n.id === id);
    if (idx === -1) return;
    const node = this.nodes[idx];
    this.nodes[idx] = {
      ...node,
      radius: newRadius,
    };
  }

  setLabel(id: string, label: string) {
    const idx = this.nodes.findIndex((n) => n.id === id);
    if (idx === -1) return;
    const node = this.nodes[idx];
    this.nodes[idx] = { ...node, label };
  }

  // 例：クリック判定用（今後の移動・選択に使える）
  hitTest(
    screenPoint: Vec2,
    camera: Camera,
    canvasSize: DisplaySize
  ): NodeEllipse | null {
    // 画面座標 → 世界座標に変換してもよいし、
    // ここでは世界→画面を使ったほうが直感的なら、各ノードを screen に投影して判定してもよい
    for (const node of this.nodes) {
      const centerScreen = worldToScreen(
        node.center,
        canvasSize,
        camera.position,
        camera.scale
      );
      const rx = node.radius.x * camera.scale;
      const ry = node.radius.y * camera.scale;

      const dx = screenPoint.x - centerScreen.x;
      const dy = screenPoint.y - centerScreen.y;

      // 楕円内判定: (x/rx)^2 + (y/ry)^2 <= 1
      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
        return node;
      }
    }
    return null;
  }

  // ---- Layer インターフェース: 描画 ----
  draw(ctx: CanvasRenderingContext2D, camera: Camera, canvasSize: DisplaySize) {
    const { width, height } = canvasSize;
    if (width <= 0 || height <= 0) return;

    for (const node of this.nodes) {
      const centerScreen = worldToScreen(
        node.center,
        canvasSize,
        camera.position,
        camera.scale
      );
      const rx = node.radius.x * camera.scale;
      const ry = node.radius.y * camera.scale;

      ctx.save();

      // 楕円本体
      ctx.beginPath();
      ctx.ellipse(centerScreen.x, centerScreen.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.fillStyle;
      ctx.strokeStyle = this.strokeStyle;
      ctx.lineWidth = this.lineWidth;
      ctx.fill();
      ctx.stroke();

      // テキスト
      ctx.fillStyle = this.textColor;
      const fontSize = this.baseFontSize * camera.scale;
      ctx.font = `${fontSize}px ${this.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, centerScreen.x, centerScreen.y);

      ctx.restore();
    }
  }
}

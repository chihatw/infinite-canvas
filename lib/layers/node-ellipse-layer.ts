// lib/node-ellipse-layer.ts
import { worldToScreen } from '../canvas/utils/coordinate';

import { Vec2 } from '../math/vec2';
import { Camera } from '../types/camera';
import { DisplaySize } from '../types/display-size';
import { Layer } from '../types/layer';
import { NodeEllipse } from '../types/node-ellipse';

function isInsideEllipse(point: Vec2, radius: Vec2): boolean {
  return (
    (point.x * point.x) / (radius.x * radius.x) +
      (point.y * point.y) / (radius.y * radius.y) <=
    1
  );
}

export class NodeEllipseLayer implements Layer {
  private nodes: NodeEllipse[] = [];

  private selectedNodeId: string | null = null;
  private hoveredNodeId: string | null = null;

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

  setSelectedNode(id: string | null) {
    this.selectedNodeId = id;
  }

  getSelectedNode(): NodeEllipse | null {
    if (!this.selectedNodeId) return null;
    return this.nodes.find((n) => n.id === this.selectedNodeId) ?? null;
  }

  setHoveredNode(id: string | null) {
    this.hoveredNodeId = id;
  }

  getHoveredNode(): NodeEllipse | null {
    if (!this.hoveredNodeId) return null;
    return this.nodes.find((n) => n.id === this.hoveredNodeId) ?? null;
  }

  // 例：クリック判定用（今後の移動・選択に使える）
  hitTest(
    screenPoint: Vec2,
    camera: Camera,
    canvasSize: DisplaySize
  ): NodeEllipse | null {
    const worldToScreenLocal = (vec: Vec2) =>
      worldToScreen(vec, canvasSize, camera.position, camera.scale);

    for (const node of this.nodes) {
      // 各ノードの中心のスクリーン座標とスクリーン上での半径を算出
      const centerScreen = worldToScreenLocal(node.center);

      const diff = screenPoint.sub(centerScreen);
      const radiusScreen = node.radius.scale(camera.scale);

      if (isInsideEllipse(diff, radiusScreen)) return node;
    }
    return null;
  }

  // ---- Layer インターフェース: 描画 ----
  draw(ctx: CanvasRenderingContext2D, camera: Camera, canvasSize: DisplaySize) {
    const { width, height } = canvasSize;
    if (width <= 0 || height <= 0) return;

    for (const node of this.nodes) {
      const worldToScreenLocal = (vec: Vec2) =>
        worldToScreen(vec, canvasSize, camera.position, camera.scale);

      const centerScreen = worldToScreenLocal(node.center);
      const radiusScreen = node.radius.scale(camera.scale);

      const isSelected = node.id === this.selectedNodeId;
      const isHovered = node.id === this.hoveredNodeId;

      ctx.save();

      // 楕円本体
      ctx.beginPath();
      ctx.ellipse(
        centerScreen.x,
        centerScreen.y,
        radiusScreen.x,
        radiusScreen.y,
        0,
        0,
        Math.PI * 2
      );

      // 状態に応じたスタイル決定
      let fillStyle = this.fillStyle;
      let strokeStyle = this.strokeStyle;
      let lineWidth = this.lineWidth;

      if (isSelected) {
        // 選択中: しっかり青くハイライト
        strokeStyle = '#2563eb'; // blue-600
        lineWidth = this.lineWidth * 1.8;
      } else if (isHovered) {
        // ホバー中: 塗りに色 & 太めの枠
        fillStyle = '#f3f4f6'; // gray-100
        lineWidth = this.lineWidth * 1.6;
      }

      ctx.fillStyle = fillStyle;
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;

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

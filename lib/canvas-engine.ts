// lib/canvas-engine.ts
import { GridLayer } from './grid-layer';
import { NodeEllipseLayer } from './node-ellipse-layer';
import { Camera, DisplaySize, Layer, NodeEllipse } from './types';
import { screenToWorld } from './utils';
import { Vec2 } from './vec2';

function getCanvasDisplaySize(canvas: HTMLCanvasElement): DisplaySize {
  const rect = canvas.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
}

/**
 * CSS表示サイズをもとに canvas の内部ピクセルサイズを設定する（DPR考慮）
 * 必ず applyDisplayToInternalPixelTransform() とセットで使用すること
 */
function setInternalPixelSize(
  canvas: HTMLCanvasElement,
  canvasDisplaySize: DisplaySize,
  dpr: number
) {
  canvas.width = canvasDisplaySize.width * dpr;
  canvas.height = canvasDisplaySize.height * dpr;
}

/**
 * CSSピクセル座標を内部ピクセル座標へマッピングする変換ルールを設定
 * setInternalPixelSize() で内部解像度設定後に呼び出す前提
 */
function applyDisplayToInternalPixelTransform(
  ctx: CanvasRenderingContext2D,
  dpr: number
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function clearCanvas(ctx: CanvasRenderingContext2D, displaySize: DisplaySize) {
  ctx.clearRect(0, 0, displaySize.width, displaySize.height);
}

/**
 * Canvas 全体に単色の背景を塗る。
 * 座標系が CSS ピクセル基準（DPR 反映済み）である前提。
 */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  canvasDisplaySize: DisplaySize,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvasDisplaySize.width, canvasDisplaySize.height);
  ctx.restore();
}

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private layers: Layer[] = [];

  private camera: Camera = {
    position: Vec2.zero(),
    scale: 1,
  };

  // 楕円ノード用レイヤーを保持
  private nodeLayer: NodeEllipseLayer;

  // ズーム倍率の上限・下限
  private minScale = 0.25;
  private maxScale = 4;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D コンテキストが取得できません');
    }
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();

    const gridLayer = new GridLayer();
    const nodeLayer = new NodeEllipseLayer();
    this.nodeLayer = nodeLayer; // nodeLayer 操作用

    this.layers.push(gridLayer);
    this.layers.push(nodeLayer); // nodeLayer 描画用
  }

  /**
   * ノード（楕円）一覧をセットする。
   * 既存コードとの互換のため、エンジン側にもメソッドを生やして
   * 内部的には nodeLayer に委譲するとよい。
   */
  setNodes(nodes: NodeEllipse[]) {
    this.nodeLayer.setNodes(nodes);
  }

  addNode(node: NodeEllipse) {
    this.nodeLayer.addNode(node);
  }

  // 必要になったら薄い委譲メソッドを増やす
  moveNode(id: string, deltaWorld: Vec2) {
    this.nodeLayer.moveNode(id, deltaWorld);
  }

  resizeNode(id: string, newRadius: Vec2) {
    this.nodeLayer.resizeNode(id, newRadius);
  }

  setNodeLabel(id: string, label: string) {
    this.nodeLayer.setLabel(id, label);
  }

  /**
   * Canvas のピクセルサイズを、CSS サイズ + devicePixelRatio に合わせて更新する。
   */
  resize() {
    const canvasDisplaySize = getCanvasDisplaySize(this.canvas);

    // 高解像度の場合、canvas の内部サイズを拡大する（にじみ防止）
    setInternalPixelSize(this.canvas, canvasDisplaySize, this.dpr);

    // 描画時に、ディスプレイ上の座標を拡大した内部サイズに変換するルールを ctx に設定
    applyDisplayToInternalPixelTransform(this.ctx, this.dpr);

    this.draw();
  }

  /**
   * 画面座標系でのパン（ドラッグ）量から、カメラ位置を更新する。
   * delta は「画面座標でどれだけ動いたか」。
   */
  panByScreenDelta(delta: Vec2) {
    // 画面座標の移動量を世界座標の移動量に変換
    const worldDelta = delta.scale(1 / this.camera.scale);
    // 画面をドラッグした方向と逆向きにカメラを動かす
    this.camera.position = this.camera.position.sub(worldDelta);
  }

  /**
   * ある画面座標を中心にズームイン・アウトする。
   * screenPoint: canvas 内の座標 (0,0)〜(width,height)。
   * zoomFactor: >1 でズームイン、<1 でズームアウト。
   */
  zoomAtScreenPoint(screenPoint: Vec2, zoomFactor: number) {
    const canvasDisplaySize = getCanvasDisplaySize(this.canvas);
    const before = screenToWorld(
      screenPoint,
      canvasDisplaySize,
      this.camera.position,
      this.camera.scale
    );

    const newScale = Math.min(
      this.maxScale,
      Math.max(this.minScale, this.camera.scale * zoomFactor)
    );
    this.camera.scale = newScale;

    const after = screenToWorld(
      screenPoint,
      canvasDisplaySize,
      this.camera.position,
      this.camera.scale
    );

    // ズーム前後で screenPoint に対応する世界座標が同じになるように、
    // カメラ位置を補正する
    const correction = before.sub(after);
    this.camera.position = this.camera.position.add(correction);
  }

  /**
   * 画面全体を描画し直す。
   */
  draw() {
    const canvasDisplaySize = getCanvasDisplaySize(this.canvas);
    clearCanvas(this.ctx, canvasDisplaySize);
    drawBackground(this.ctx, canvasDisplaySize, '#e5e7eb'); // gray-200

    for (const layer of this.layers) {
      layer.draw(this.ctx, this.camera, canvasDisplaySize);
    }
  }
}

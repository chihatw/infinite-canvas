// lib/canvas-engine.ts
import { NodeEllipseLayer } from '../layers/node-ellipse-layer';

import { GridLayer } from './grid-layer';

import { Vec2 } from '../math/vec2';
import { Camera } from '../types/camera';
import { DisplaySize } from '../types/display-size';
import { Layer } from '../types/layer';
import { NodeEllipse } from '../types/node-ellipse';
import { getCanvasDisplaySize } from './utils/canvas-size';
import { clamp } from './utils/clamp';
import { screenToWorld } from './utils/coordinate';

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

  private needsDraw = true; // 描画用のフラッグ。状態変化の時に true。描画後 false
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
    this.requestDraw();
  }

  addNode(node: NodeEllipse) {
    this.nodeLayer.addNode(node);
    this.requestDraw();
  }

  // 必要になったら薄い委譲メソッドを増やす
  moveNode(id: string, deltaWorld: Vec2) {
    this.nodeLayer.moveNode(id, deltaWorld);
    this.requestDraw();
  }

  resizeNode(id: string, newRadius: Vec2) {
    this.nodeLayer.resizeNode(id, newRadius);
    this.requestDraw();
  }

  setNodeLabel(id: string, label: string) {
    this.nodeLayer.setLabel(id, label);
    this.requestDraw();
  }

  /**
   * 画面(canvas 内)座標でのヒットテスト。
   */
  hitTestNodeAtScreenPoint(screenPoint: Vec2): NodeEllipse | null {
    const canvasDisplaySize = getCanvasDisplaySize(this.canvas);
    return this.nodeLayer.hitTest(screenPoint, this.camera, canvasDisplaySize);
  }

  /**
   * ノードの選択状態を設定。
   */
  selectNode(id: string | null) {
    this.nodeLayer.setSelectedNode(id);
    this.requestDraw();
  }

  /**
   * 画面座標系での移動量から、ノードを移動する。
   * （パンと同じく screenDelta / scale で世界座標に変換）
   */
  moveNodeByScreenDelta(id: string, screenDelta: Vec2) {
    const worldDelta = screenDelta.scale(1 / this.camera.scale);
    this.nodeLayer.moveNode(id, worldDelta);
    this.requestDraw();
  }

  /**
   * Canvas の内部ピクセルサイズを、CSS サイズ + devicePixelRatio に合わせて更新する。
   */
  resize() {
    const canvasDisplaySize = getCanvasDisplaySize(this.canvas);

    // 高解像度の場合、canvas の内部サイズを拡大する（にじみ防止）
    setInternalPixelSize(this.canvas, canvasDisplaySize, this.dpr);

    // 描画時に、ディスプレイ上の座標を拡大した内部サイズに変換するルールを ctx に設定
    applyDisplayToInternalPixelTransform(this.ctx, this.dpr);

    this.requestDraw();
  }

  /**
   * 画面座標系でのパン（ドラッグ）量から、カメラ位置を更新する。
   * delta は「画面座標でどれだけ動いたか」。
   */
  panByScreenDelta(screenDelta: Vec2) {
    // 画面座標の移動量を世界座標の移動量に変換
    const worldDelta = screenDelta.scale(1 / this.camera.scale);
    // 画面をドラッグした方向と逆向きにカメラを動かす
    this.camera.position = this.camera.position.sub(worldDelta);
    this.requestDraw();
  }

  /**
   * 指定した画面座標（canvas 内座標）を中心にズームする。
   * zoomFactor: 拡大率。>1 で拡大、<1 で縮小。
   */
  zoomAtScreenPoint(screenPoint: Vec2, zoomFactor: number) {
    const canvasDisplaySize = getCanvasDisplaySize(this.canvas);

    // 共通引数をあらかじめ渡したローカルラッパー関数
    const screenToWorldLocal = (vec: Vec2, scale: number) =>
      screenToWorld(vec, canvasDisplaySize, this.camera.position, scale);

    const before = screenToWorldLocal(screenPoint, this.camera.scale);

    const newScale = clamp(
      this.camera.scale * zoomFactor,
      this.minScale,
      this.maxScale
    );
    this.camera.scale = newScale;

    const after = screenToWorldLocal(screenPoint, this.camera.scale);

    // ズーム前後で screenPoint に対応する世界座標が同じになるように、
    // カメラ位置を補正する
    const correction = before.sub(after);
    this.camera.position = this.camera.position.add(correction);

    this.requestDraw();
  }

  requestDraw() {
    this.needsDraw = true;
  }

  // 画面全体を描画
  drawFrame() {
    if (!this.needsDraw) return;
    this.needsDraw = false;

    const canvasDisplaySize = getCanvasDisplaySize(this.canvas);
    clearCanvas(this.ctx, canvasDisplaySize);
    drawBackground(this.ctx, canvasDisplaySize, '#e5e7eb'); // gray-200

    for (const layer of this.layers) {
      layer.draw(this.ctx, this.camera, canvasDisplaySize);
    }
  }
}

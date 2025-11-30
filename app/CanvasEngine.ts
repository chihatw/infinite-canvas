// app/CanvasEngine.ts
export type Camera = {
  x: number;
  y: number;
  scale: number;
};

export type Node = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  text: string;
};

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera = { x: 0, y: 0, scale: 1 };
  private node: Node = { x: 0, y: 0, rx: 120, ry: 80, text: 'Hello' };
  private isDragging = false;
  private lastMouse = { x: 0, y: 0 };

  // イベントハンドラは destroy 時に外せるようプロパティとして保持
  private resizeHandler = () => this.resize();
  private mouseDownHandler = (e: MouseEvent) => this.handleMouseDown(e);
  private mouseMoveHandler = (e: MouseEvent) => this.handleMouseMove(e);
  private mouseUpHandler = () => this.stopDragging();
  private mouseLeaveHandler = () => this.stopDragging();
  private wheelHandler = (e: WheelEvent) => this.handleWheel(e);

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D context not supported');
    }
    this.ctx = ctx;

    this.resize();
    this.attachEvents();
    this.render();
  }

  // 将来 React 側からノードを差し替えたい場合用
  public setNode(node: Partial<Node>) {
    this.node = { ...this.node, ...node };
    this.render();
  }

  private attachEvents() {
    window.addEventListener('resize', this.resizeHandler);
    this.canvas.addEventListener('mousedown', this.mouseDownHandler);
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.addEventListener('mouseup', this.mouseUpHandler);
    this.canvas.addEventListener('mouseleave', this.mouseLeaveHandler);
    this.canvas.addEventListener('wheel', this.wheelHandler, {
      passive: false,
    });
  }

  public destroy() {
    window.removeEventListener('resize', this.resizeHandler);
    this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
    this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
    this.canvas.removeEventListener('mouseleave', this.mouseLeaveHandler);
    this.canvas.removeEventListener('wheel', this.wheelHandler);
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.render();
  }

  private worldToScreen(wx: number, wy: number) {
    const { x, y, scale } = this.camera;
    const { width, height } = this.canvas;
    return {
      x: (wx - x) * scale + width / 2,
      y: (wy - y) * scale + height / 2,
    };
  }

  private render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const { camera, node } = this;

    ctx.clearRect(0, 0, width, height);

    // ====== グリッド ======
    const gridSize = 200;
    const worldLeft = camera.x - width / 2 / camera.scale;
    const worldRight = camera.x + width / 2 / camera.scale;
    const worldTop = camera.y - height / 2 / camera.scale;
    const worldBottom = camera.y + height / 2 / camera.scale;

    const firstGridX = Math.floor(worldLeft / gridSize) * gridSize;
    const firstGridY = Math.floor(worldTop / gridSize) * gridSize;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;

    // 縦線
    for (let x = firstGridX; x <= worldRight; x += gridSize) {
      const sx = (x - camera.x) * camera.scale + width / 2;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }

    // 横線
    for (let y = firstGridY; y <= worldBottom; y += gridSize) {
      const sy = (y - camera.y) * camera.scale + height / 2;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
    }

    ctx.restore();

    // ====== 楕円＋テキスト ======
    const p = this.worldToScreen(node.x, node.y);

    ctx.beginPath();
    ctx.ellipse(
      p.x,
      p.y,
      node.rx * camera.scale,
      node.ry * camera.scale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    ctx.fillStyle = 'black';
    const fontSize = 20 * camera.scale;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.text, p.x, p.y);
  }

  // ====== イベント処理 ======

  private handleMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.lastMouse = { x: e.clientX, y: e.clientY };
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;

    const dx = e.clientX - this.lastMouse.x;
    const dy = e.clientY - this.lastMouse.y;
    this.lastMouse = { x: e.clientX, y: e.clientY };

    this.camera.x -= dx / this.camera.scale;
    this.camera.y -= dy / this.camera.scale;

    this.render();
  }

  private stopDragging() {
    this.isDragging = false;
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { width, height } = this.canvas;
    const { camera } = this;

    const beforeX = (mouseX - width / 2) / camera.scale + camera.x;
    const beforeY = (mouseY - height / 2) / camera.scale + camera.y;

    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
      camera.scale *= zoomFactor; // ズームイン
    } else {
      camera.scale /= zoomFactor; // ズームアウト
    }

    const afterX = (mouseX - width / 2) / camera.scale + camera.x;
    const afterY = (mouseY - height / 2) / camera.scale + camera.y;

    camera.x += beforeX - afterX;
    camera.y += beforeY - afterY;

    this.render();
  }
}

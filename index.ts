import {evaluate, norm, subtract, add, cross, dotDivide} from 'mathjs';

type Vec2 = [number, number];
type Vec3 = [number, number, number];

function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const points: Vec2[] = [];

  scaleCanvas(canvas, ctx);
  canvas.addEventListener('click', (event: PointerEvent) => {
    points.push([event.offsetX, event.offsetY]);
    const polycurve = new Polycurve(points);
    drawPolycurve(ctx, polycurve);
  });
}

class Polycurve {
  public static readonly kEps = 1e-8;
  public static readonly kOrderSupported = 3;

  // From order to gradient. 0-th order is the point itself.
  private point_gradients: Map<number, Vec2[]> = new Map();

  // Intersection of angle bisectors. This only has n - 1 elements.
  private focals: Vec3[] = [];  // homogeneous coordinates

  constructor(rawPoints: Vec2[]) {
    if (rawPoints.length == 0) return;

    // Construct points and tangents.
    const pg0: Vec2[] = [];
    const pg1: Vec2[] = [];
    pg0.push(rawPoints[0]);
    for (let i = 1; i < rawPoints.length; i++) {
      const delta: Vec2 = subtract(rawPoints[i], pg0.at(-1)!);
      const deltaNorm: number = norm(delta) as number;
      if (deltaNorm > Polycurve.kEps) {
        pg0.push(rawPoints[i]);
        pg1.push(dotDivide(delta, deltaNorm));
      }
    }
    pg1.push(pg1.at(-1)!);
    for (let i = pg1.length - 1; i > 0; i--) {
      pg1[i] = normalize(add(pg1[i], pg1[i - 1]));
    }
    this.point_gradients.set(0, pg0);
    this.point_gradients.set(1, pg1);

    // Construct focals as intersections of angle bisectors.
    for (let i = 0; i < this.n - 1; i++) {
      const [p1, p2] = [this.point(i), this.point(i + 1)];
      const [q1, q2] = [add(p1, this.left(i)), add(p2, this.left(i + 1))];
      const x = cross;
      this.focals.push(
          x(x(toHomo(p1), toHomo(q1)), x(toHomo(p2), toHomo(q2))) as Vec3);
    }
  }

  public get n(): number {
    return this.point_gradients.get(0)!.length;
  }

  public point(i: number): Vec2 {
    return this.pg(0, i);
  }

  public focal(i: number): Vec3 {
    return this.focals[i];
  }

  private pg(i: number, j: number): Vec2 {
    return this.point_gradients.get(i)![j];
  }

  private left(i: number): Vec2 {
    const tangent = this.pg(1, i);
    return [-tangent[1], tangent[0]];
  }


  private static filterDuplicates(points: Vec2[]): Vec2[] {
    if (points.length == 0) return [];
    const filtered: Vec2[] = [];
    filtered.push(points[0]);
    for (let i = 1; i < points.length; i++) {
      const delta: Vec2 = subtract(points[i], filtered.at(-1)!);
      if (norm(delta) as number > Polycurve.kEps) {
        filtered.push(points[i]);
      }
    }
    return filtered;
  }
}

function normalize(v: Vec2): Vec2 {
  const len = norm(v) as number;
  return dotDivide(v, len == 0 ? 1 : len);
}

function toHomo(xy: Vec2): Vec3 {
  return [xy[0], xy[1], 1];
}

function fromHomo(h: Vec3): Vec2 {
  return [h[0] / h[2], h[1] / h[2]];
}

function scaleCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  // Get size in CSS pixels
  const rect = canvas.getBoundingClientRect();

  // Adjust for devicePixelRatio
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // Scale the drawing context so 1 unit = 1 CSS pixel
  ctx.scale(dpr, dpr);
}

function drawPoint(
    ctx: CanvasRenderingContext2D, xy: Vec2, color: string = 'black') {
  const kPointSize = 3 as const;
  ctx.beginPath();
  ctx.arc(xy[0], xy[1], kPointSize, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawLine(
    ctx: CanvasRenderingContext2D, from: Vec2, to: Vec2,
    color: string = 'black') {
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawPolycurve(ctx: CanvasRenderingContext2D, polycurve: Polycurve) {
  for (let i = 0; i < polycurve.n; i++) {
    drawPoint(ctx, polycurve.point(i));
  }
  for (let i = 0; i < polycurve.n - 1; i++) {
    drawLine(ctx, polycurve.point(i), polycurve.point(i + 1));
    drawPoint(ctx, fromHomo(polycurve.focal(i)), 'red');
    drawLine(ctx, polycurve.point(i), fromHomo(polycurve.focal(i)), 'red');
    drawLine(ctx, polycurve.point(i + 1), fromHomo(polycurve.focal(i)), 'red');
  }
}

main();

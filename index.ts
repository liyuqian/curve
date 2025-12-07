import {add, cross, distance, dotDivide, evaluate, norm, subtract} from 'mathjs';

type Vec2 = [number, number];
type Vec3 = [number, number, number];

const kDrawFocals = false as const;
const kDrawSegments = false as const;

class Curve {
  public static readonly kEps = 1e-8;

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
      if (deltaNorm > Curve.kEps) {
        pg0.push(rawPoints[i]);
        pg1.push(dotDivide(delta, deltaNorm));
      }
    }
    pg1.push(pg1.at(-1)!);
    for (let i = pg1.length - 1; i > 0; i--) {
      // Original pg1[i] used i and i+1. Now average with i - 1 for symmetry.
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

  // Original sample points given to the constructor as input.
  public point(i: number): Vec2 {
    return this.pg(0, i);
  }

  // Generate an arbitrary point on the curve with an optional leftOffset.
  //
  // The generalI can be fractional as we support interpolation/extrapolation.
  public generatePoint(generalI: number, leftOffset: number = 0): Vec2 {
    if (this.n == 0) return [0, 0];
    if (this.n == 1) return this.pg(0, 0);

    // Clamp to n-2 because focal points have n - 1 indices from 0 to n-2.
    const i = clamp(Math.floor(generalI), 0, this.n - 2);
    const reminder = generalI - i;
    const focal = this.focal(i);
    const p = this.pg(0, i);
    const q = this.pg(0, i + 1);

    const lerped: Vec2 =
        evaluate('p * (1 - r) + q * r', {p: p, q: q, r: reminder});

    if (Math.abs(focal[2]) <= Curve.kEps) {
      return evaluate(
          'p + l * d', {p: p, l: this.left(i), d: leftOffset});
    }

    const f: Vec2 = fromHomo(focal);
    const left = normalize(subtract(lerped, f));
    const dLerped = evaluate(
        'dp * (1 - r) + dq * r',
        {dp: distance(p, f), dq: distance(q, f), r: reminder});
    const d = dLerped + leftOffset * Math.sign(focal[2]);
    return evaluate('f + l * d', {f: f, l: left, d: d});
  }

  public focal(i: number): Vec3 {
    return this.focals[i];
  }

  private pg(order: number, i: number): Vec2 {
    return this.point_gradients.get(order)![i];
  }
  private left(i: number): Vec2 {
    const tangent = this.pg(1, i);
    return [-tangent[1], tangent[0]];
  }
}

function encodePointsToUrl(points: Vec2[]): void {
  const url = new URL(window.location.href);
  if (points.length === 0) {
    url.searchParams.delete('points');
  } else {
    url.searchParams.set('points', JSON.stringify(points));
  }
  window.history.replaceState({}, '', url);
}

function decodePointsFromUrl(): Vec2[] {
  const url = new URL(window.location.href);
  const encoded = url.searchParams.get('points');
  if (!encoded) return [];
  try {
    return JSON.parse(encoded) as Vec2[];
  } catch {
    return [];
  }
}

function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;

  // Load points from URL on initialization
  const points: Vec2[] = decodePointsFromUrl();

  let curve = new Curve(points);
  let signedDistance: number = 0;
  const inputElement =
      document.getElementById('signed-distance') as HTMLInputElement;
  const outputElement =
      document.getElementById('signed-distance-output') as HTMLOutputElement;

  // Load signed distance from URL if present
  const url = new URL(window.location.href);
  const urlSignedDistance = url.searchParams.get('signedDistance');
  if (urlSignedDistance !== null) {
    signedDistance = Number(urlSignedDistance);
    inputElement.value = signedDistance.toString();
    outputElement.textContent = signedDistance.toString();
  }

  inputElement.addEventListener('input', (event: Event) => {
    signedDistance = Number((event.target as HTMLInputElement).value);
    outputElement.textContent = signedDistance.toString();
    // Update URL with signed distance
    const url = new URL(window.location.href);
    url.searchParams.set('signedDistance', signedDistance.toString());
    window.history.replaceState({}, '', url);
  });
  inputElement.addEventListener('change', (event: Event) => {
    drawCurve(ctx, curve, signedDistance);
  });

  scaleCanvas(canvas, ctx);

  // Draw initial curve if points were loaded from URL
  if (points.length > 0) {
    drawCurve(ctx, curve, signedDistance);
  }

  canvas.addEventListener('click', (event: PointerEvent) => {
    points.push([event.offsetX, event.offsetY]);
    curve = new Curve(points);
    drawCurve(ctx, curve, signedDistance);
    encodePointsToUrl(points);
  });
}

function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(x, max));
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

function drawCurve(
    ctx: CanvasRenderingContext2D, curve: Curve,
    signedDistance: number) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let i = 0; i < curve.n; i++) {
    drawPoint(ctx, curve.point(i));
  }
  for (let i = 0; i < curve.n - 1; i++) {
    if (kDrawSegments) {
      drawLine(ctx, curve.point(i), curve.point(i + 1));
    }
    if (kDrawFocals) {
      drawPoint(ctx, fromHomo(curve.focal(i)), 'red');
      drawLine(ctx, curve.point(i), fromHomo(curve.focal(i)), 'red');
      drawLine(ctx, curve.point(i + 1), fromHomo(curve.focal(i)), 'red');
    }
  }
  const kSampleCount = 1000 as const;
  let prev = curve.generatePoint(0);
  let contourPrev = curve.generatePoint(0, signedDistance);
  for (let i = 1; i < kSampleCount; i++) {
    const generalI = i / kSampleCount * (curve.n - 1);
    const point = curve.generatePoint(generalI);
    const contourPoint = curve.generatePoint(generalI, signedDistance);
    drawLine(ctx, prev, point);
    drawLine(ctx, contourPrev, contourPoint, 'blue');
    prev = point;
    contourPrev = contourPoint;
  }
}

main();

## Properties

Curve constructed here by sample points and signed distance $d$ satisifies the
following properties.

- Distance $d=0$ generates a curve that passes through all sample points.
  (No control points needed.)
- Distance $d>0$ generates a curve on the left (right if $d<0$).
- The curve between 2 sample points is only affected by 2 other local neighbors.
- The curve is exactly a circle if the sample points are from a circle.
- For any other C2-continuous curve $c'$, if we sample more points when its
  curvature is large, and fewer points when its curvature is small, the
  constructed curve can well approximate $c'$.
- A circle can be perfectly constructured by 3 points: repeating the sample
  point sequence on those 3 points, and the curve excluding the start/end piece
  is the circle that goes through those 3 points.
- Any 2D shape with C2-continuous boundary can be represented by a set of such
  curves and distance ranges $d_{min} \leq d \leq d_{max}$.

## Conjectures

The following conjuectures should be true but I haven't proved them yet.

- Computing signed distance from any given point $(x, y)$ to such a curve only
  takes $O(\log n)$ time ($n$ is the number of sample points), and such process
  is easily parallizable (e.g., each focal point has a well-defined triangle
  range where it can affect the signed distance, and any point is only in a
  bounded number of such triangles).
- The curve here can be easily extended to high-dimensions. With distance ranges
  in multiple dimensions, they represent any k-D shapes with smooth boundaries.

Therefore, such curves, and the shapes defined by them, are well-suited for
parallel accelerators (e.g., GPUs)

# Algorithm

The curve described above is generated using the following algorithm. See also
`class Cruve` in [index.ts][1] as an example 100-line implementation.

Given $n$ points $p_i (0 \leq i < n)$ where no 2 consecutive points are
identical, we generate $n-1$ focal points, 1 for each segment $p_i p_{i + 1}$.

Each focal point $f_i$ is the intersection point of 2 angle bisectors: one for
angle $p_{i-1} p_i p_{i+1}$, one for $p_i p_{i+1} p_{i+2}$. Out-of-boundary
points can be extended by straight lines. Parallel lines can intersect at
infinity points represented by homogeneuos coordinates.

Specifically, we first compute the average tangent $t_i$ on each point $p_i$
where $Nm(\cdot)$ normalizes a vector to a unit vector.

$
t_i = Nm \left( Nm(p_i - p_{i-1}) + Nm(p_{i+1} - p_i) \right)
$

Then, let (1) $q_i = p_i + t_i^L$ be the points on the angle bisectors where $L$
operator rotates a vector 90 degrees left, and (2) all points $p_i, q_i$ are
represented by homogeneous coordinates. We have focals

$
f_i = (p_i \times q_i) \times (p_{i+1} \times q_{i+1})
$

To generate any point on the curve with some signed distance offset $d$, we
generalize index $i$ from integers to real numbers $i' = i + r \in \mathbb R$
where $i$ is the integer part and $r \in [0, 1)$ is the reminder.

Let $d_{lerped} = (1-r) ||p_i - f_i|| + r ||p_{i+1} - f_i||$ be the lerped
distance from the curve point at $i'$ (with signed distance 0) to the focal
point. Let $l = Nm( (1-r) p_i + r p_{i+1} - f_i )$ be the lerped left direction.
The final curve point at $i'$ with signed distance $d$ is

$
\text{CurvePoint}(i', d) = f_i + (d_{lerped} + d) l
$

The homogeneous coordinates $(x, y, w)$ need to be treated accordingly, and the
last component $w$ of $f_i$ can be used to determine whether the focal point is
on the left or right of the curve.

[1]: https://github.com/liyuqian/curve/blob/main/index.ts

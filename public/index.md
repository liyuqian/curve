## Properties

Curve constructed here by sample points and signed distance $d$ satisifies the
following properties.

- Distance $d=0$ generates a curve that passes through all sample points.
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

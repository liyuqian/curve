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

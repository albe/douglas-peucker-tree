# douglas-peucker-tree
A tree subdivision algorithm for geo-paths

## Algorithm
This algorithm subdivides a path of (geo)coordinates via Duglas-Peucker into a simplified version, building a tree of the simplifications. It then iteratively finds the closest point on those subsections to finally find the closest point on the original path.

This improves the performance of finding the closest point, especially for paths with a high number of close coordinates. It improves accuracy and performance over a QuadTree approach for cases where the path intersects itself or creates "holes".

Also, the algorithm uses a forward-only search with a cut-off at a specific amount of distance along the path (that could be calculated from avg travel speed), to further optimize for the use-case of following geo-tracking coordinates that should trace a specific path/route.

## Visualization
https://albe.github.io/douglas-peucker-tree/index.html

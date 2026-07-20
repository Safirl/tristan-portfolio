import { abs, add, length, max, min, float, sub } from "three/tsl";
import * as THREE from "three/webgpu"

// export const roundedBoxSDF = (p: THREE.Node<"vec2">, halfSize: THREE.Node<"vec2">, radius: THREE.Node<"float">): THREE.Node<"float">  => {
//   const q = abs(p).add(-halfSize).add(radius);
//   return length(max(q, 0.0)).add(min(max(q.x, q.y), 0.0).add(-radius));
// }

export const roundedBoxSDF = (
  p: THREE.Node<"vec2">,
  halfSize: THREE.Node<"vec2">,
  radius: THREE.Node<"float">
): THREE.Node<"float"> => {
  const q = abs(p).sub(halfSize).add(radius);

  return length(max(q, 0))
    .add(min(max(q.x, q.y), 0))
    .sub(radius);
};

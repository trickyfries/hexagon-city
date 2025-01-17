import { Hex } from "honeycomb-grid";
import p5 from "p5";

export function triangle_circumcenter(
  p1: number[],
  p2: number[],
  p3: number[]
) {
  const ax = p1[0];
  const ay = p1[1];
  const bx = p2[0];
  const by = p2[1];
  const cx = p3[0];
  const cy = p3[1];
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  const x =
    ((ax * ax + ay * ay) * (by - cy) +
      (bx * bx + by * by) * (cy - ay) +
      (cx * cx + cy * cy) * (ay - by)) /
    d;
  const y =
    ((ax * ax + ay * ay) * (cx - bx) +
      (bx * bx + by * by) * (ax - cx) +
      (cx * cx + cy * cy) * (bx - ax)) /
    d;
  return { x, y };
}

export function triangle_centroid(p1: number[], p2: number[], p3: number[]) {
  const ax = p1[0];
  const ay = p1[1];
  const bx = p2[0];
  const by = p2[1];
  const cx = p3[0];
  const cy = p3[1];
  // const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  const x = (ax + bx + cx) / 3;
  const y = (ay + by + cy) / 3;
  return { x, y };
}

export function randomPoint(p: p5, width: number, height: number) {
  return [p.random(0, width), p.random(0, height)];
}

export function findHexId(hex: Hex) {
  return `${hex.q}_${hex.r}`;
}

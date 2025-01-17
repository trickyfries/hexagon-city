import p5 from "p5";

import * as d3 from "d3";

import "./style.css";
import { triangle_circumcenter, triangle_centroid, randomPoint } from "./utils";

import {
  defineHex,
  Direction,
  Grid,
  Hex,
  Orientation,
  rectangle,
  ring,
  spiral,
} from "honeycomb-grid";

const app = new p5((p5Instance) => {
  const p = p5Instance as unknown as p5;

  let delaunay: d3.Delaunay<d3.Delaunay.Point>;
  let delaunay2: d3.Delaunay<d3.Delaunay.Point>;
  let voronoi: d3.Voronoi<d3.Delaunay.Point>;

  let grid: Grid<Hex> | undefined = undefined;

  let heights: { hex: Hex; value: number }[] = [];
  let targetHeights: { hex: Hex; value: number }[] = [];
  let randomHeights: { hex: Hex; value: number }[] = [];

  let initialPoints: number[][];

  const centerCoord = 18;
  const coordRadius = p.ceil(centerCoord / 2);

  const MAX_HEIGHT = 300;
  const transform = { x: 0, y: 0 };

  const canvasSize = { x: 1000, y: 800 };

  p.setup = function setup() {
    p.createCanvas(canvasSize.x, canvasSize.y);

    // 1. Create a hex class:
    const Tile = defineHex({
      dimensions: { width: 60, height: 20 },
      orientation: Orientation.FLAT,
    });

    // 2. Create a grid by passing the class and a "traverser" for a rectangular-shaped grid:
    grid = new Grid(
      Tile,
      spiral({ start: [centerCoord, centerCoord], radius: coordRadius })
    );

    transform.x =
      -(grid.getHex([centerCoord, centerCoord])?.x || 0) + p.width / 2;
    transform.y =
      -(grid.getHex([centerCoord, centerCoord])?.y || 0) + (p.height * 2) / 3;

    initialPoints = [];
    grid.forEach((hex) => initialPoints.push([hex.x, hex.y]));
    // grid.forEach((hex) =>
    //   targetHeights.push({
    //     hex,
    //     value:
    //       grid?.distance({ q: centerCoord, r: centerCoord }, {
    //         q: hex.q,
    //         r: hex.r,
    //       } as number) *
    //       (20 * p.random(0.9, 1.1)),
    //   })
    // );
    grid.forEach((hex) => heights.push({ hex, value: 0 }));

    // let coolPoints = [...Array(30)].map((n, ringIndex) => {
    //   let radius = (ringIndex + 1) * 10
    //   let angle = 360 / (ringIndex * 3)
    //   let segments = 360 / angle

    //   return [...Array(segments)].map((n, pointIndex) => {

    //     let x = radius * p.sin(p.radians(360 / segments * pointIndex));
    //     let y = radius * p.cos(p.radians(360 / segments * pointIndex));

    //     return [p.width / 2 + x, p.height / 2 + y]
    //   })
    // }).flat()

    // initialPoints = [[p.width / 2, p.height / 2]];
    // initialPoints = initialPoints.concat(coolPoints)

    // initialPoints = [...Array(10)].map(() => {
    //   return randomPoint(p, p.width, p.height)
    // })

    // initialPoints = []
    // for (let y = 0, n = 20; y < n; y += 1) {
    //   for (let x = 0, n = 20; x < n; x += 1) {
    //     let offsetFactor = x % 2 == 0 ? 0 : 1
    //     initialPoints.push([x * 20, y * 20 + (offsetFactor * 10)])
    //   }
    // }

    // delaunay = new d3.Delaunay(Float64Array.from(initialPoints.flat()));
    // // voronoi = delaunay.voronoi([0, 0, 600, 600]);
    // console.log(initialPoints);
    // console.log(delaunay);

    delaunay = new d3.Delaunay(Float64Array.from(initialPoints.flat()));

    const secondPoints: number[][] = [];

    const { triangles, points } = delaunay;

    for (let index = 0, n = triangles.length; index < n; index += 1) {
      const t0 = triangles[index * 3 + 0];
      const t1 = triangles[index * 3 + 1];
      const t2 = triangles[index * 3 + 2];
      const p1 = [points[t0 * 2], points[t0 * 2 + 1]];
      const p2 = [points[t1 * 2], points[t1 * 2 + 1]];
      const p3 = [points[t2 * 2], points[t2 * 2 + 1]];
      const c = triangle_centroid(p1, p2, p3);
      secondPoints.push([c.x, c.y]);
    }

    // delaunay2 = new d3.Delaunay(Float64Array.from(secondPoints.flat()));

    if (grid) {
      let selectedHex = grid.pointToHex(
        { x: p.mouseX, y: p.mouseY },
        { allowOutside: false }
      );
      randomHeights = [];

      if (!selectedHex) {
        selectedHex = grid.getHex({ q: centerCoord, r: centerCoord });
      }

      if (selectedHex) {
        grid.forEach((hex) =>
          randomHeights.push({
            hex,
            value: MAX_HEIGHT * p.random(-0.1, 0.1),
          })
        );
      }
    }
  };

  p.draw = function draw() {
    p.resizeCanvas(canvasSize.x, canvasSize.y);

    p.background(0);
    p.stroke(255);
    p.strokeWeight(1.5);

    p.translate(transform.x, transform.y);

    if (grid) {
      // let angle = p.radians(p.frameCount * 2);

      // let coord = {
      //   q: p.floor(centerCoord + (p.sin(angle) * coordRadius) / 2),
      //   r: p.floor(centerCoord + (p.cos(angle) * coordRadius) / 2),
      // };

      // console.log(coord, angle);

      // let selectedHex = grid.getHex(
      //   { q: coord.q, r: coord.r },
      //   { allowOutside: false }
      // );

      let selectedHex = grid.pointToHex(
        { x: p.mouseX - transform.x, y: p.mouseY - transform.y },
        { allowOutside: false }
      );

      targetHeights = [];

      if (!selectedHex) {
        selectedHex = grid.getHex({ q: centerCoord, r: centerCoord });
      }

      if (selectedHex) {
        grid.forEach((hex) =>
          targetHeights.push({
            hex,
            value:
              // grid?.distance({ q: 12, r: 12 }, {
              (() => {
                const dist = grid?.distance(
                  { q: selectedHex.q, r: selectedHex.r },
                  {
                    q: hex.q,
                    r: hex.r,
                  }
                ) as number;

                return p.map(dist, 0, coordRadius * 2, 0, MAX_HEIGHT);
              })(),
            // (-20 * p.random(-1, 1)),
          })
        );
      }

      heights.map(
        (h) =>
          (h.value = this.lerp(
            h.value,
            targetHeights.find((n) => n.hex == h.hex)?.value || 0,
            // 1
            0.2
          ))
      );

      // initialPoints[0] = [p.mouseX, p.mouseY]

      delaunay = new d3.Delaunay(Float64Array.from(initialPoints.flat()));

      if (grid) {
        initialPoints = [];
        grid.forEach((hex) => initialPoints.push([hex.x, hex.y]));

        grid.forEach((hex) => {
          p.noFill();
          p.beginShape();
          hex.corners.forEach((point) => {
            p.vertex(point.x, point.y);
          });
          p.endShape(p.CLOSE);
        });

        let index = 0;

        for (
          let row = centerCoord - coordRadius;
          row <= centerCoord + coordRadius * 2;
          row++
        ) {
          for (let pass = 0; pass <= 1; pass++) {
            for (
              let col = p.floor((centerCoord - coordRadius) / 2) * 2;
              col <= centerCoord + coordRadius;
              col += 2
            ) {
              let hex = grid.getHex({ row: row, col: col + pass });
              if (hex) {
                const isSelectedHex = selectedHex == hex;

                let randomHeight =
                  randomHeights.find((h) => h.hex == hex)?.value || 0;
                let newHeight = heights.find((h) => h.hex == hex)?.value || 0;

                let finalHeight = p.max(randomHeight + newHeight, 0);

                // p.fill(0);
                // p.stroke(255);
                p.strokeWeight(1.5);

                p.fill(p.map(finalHeight, 0, MAX_HEIGHT, 255, 125));

                if (isSelectedHex) {
                  p.fill(255, 255, 255);
                }

                // p.fill(255);

                index++;
                // p.fill(index * 7 - 100);
                p.stroke(0);
                p.beginShape();
                hex.corners.forEach((point) => {
                  p.vertex(point.x, point.y - finalHeight);
                });
                p.endShape(p.CLOSE);
                // LATO DESTRO
                p.fill(100);

                // p.fill(0, 200);

                p.quad(
                  hex.corners[1].x,
                  hex.corners[1].y,
                  hex.corners[1].x,
                  hex.corners[1].y - finalHeight,
                  hex.corners[2].x,
                  hex.corners[2].y - finalHeight,
                  hex.corners[2].x,
                  hex.corners[2].y
                );
                // LATO CENTRO
                p.fill(200);
                p.quad(
                  hex.corners[2].x,
                  hex.corners[2].y,
                  hex.corners[2].x,
                  hex.corners[2].y - finalHeight,
                  hex.corners[3].x,
                  hex.corners[3].y - finalHeight,
                  hex.corners[3].x,
                  hex.corners[3].y
                );

                // LATO SINISTRO
                p.fill(150);
                p.quad(
                  hex.corners[3].x,
                  hex.corners[3].y,
                  hex.corners[3].x,
                  hex.corners[3].y - finalHeight,
                  hex.corners[4].x,
                  hex.corners[4].y - finalHeight,
                  hex.corners[4].x,
                  hex.corners[4].y
                );

                p.noFill();
                p.stroke(255, 50);
                p.strokeWeight(5);
                // p.point(hex.x, hex.y - finalHeight);
              }
            }
          }
        }

        grid.forEach((hex) => {
          // let newHeight = heights.find((h) => h.hex == hex)?.value || 0;
          // p.fill(255, 0, 0);
          // p.beginShape();
          // hex.corners.forEach((point) => {
          //   p.vertex(point.x, point.y - newHeight);
          // });
          // p.endShape(p.CLOSE);
          // p.quad(
          //   hex.corners[1].x,
          //   hex.corners[1].y,
          //   hex.corners[1].x,
          //   hex.corners[1].y - newHeight,
          //   hex.corners[2].x,
          //   hex.corners[2].y - newHeight,
          //   hex.corners[2].x,
          //   hex.corners[2].y
          // );
          // p.quad(
          //   hex.corners[2].x,
          //   hex.corners[2].y,
          //   hex.corners[2].x,
          //   hex.corners[2].y - newHeight,
          //   hex.corners[3].x,
          //   hex.corners[3].y - newHeight,
          //   hex.corners[3].x,
          //   hex.corners[3].y
          // );
          // p.quad(
          //   hex.corners[3].x,
          //   hex.corners[3].y,
          //   hex.corners[3].x,
          //   hex.corners[3].y - newHeight,
          //   hex.corners[4].x,
          //   hex.corners[4].y - newHeight,
          //   hex.corners[4].x,
          //   hex.corners[4].y
          // );
        });

        // const centerHex = grid?.pointToHex(
        //   { x: p.mouseX, y: p.mouseY },
        //   { allowOutside: false }
        // );

        // if (centerHex) {
        //   p.beginShape();
        //   p.fill(255);
        //   centerHex.corners.forEach((point) => {
        //     p.vertex(point.x, point.y);
        //   });

        //   grid.traverse(ring({ center: [1, 2], radius: 2 }));
        //   p.endShape(p.CLOSE);

        //   const nears = [
        //     Direction.N,
        //     Direction.NE,
        //     Direction.SE,
        //     Direction.S,
        //     Direction.SW,
        //     Direction.NW,
        //   ].map((dir) => {
        //     return grid?.neighborOf([centerHex.q, centerHex.r], dir, {
        //       allowOutside: false,
        //     });
        //   });

        //   nears.forEach((hex) => {
        //     p.fill(255, 50);
        //     p.beginShape();
        //     hex?.corners.forEach((point) => {
        //       p.vertex(point.x, point.y);
        //     });
        //     p.endShape(p.CLOSE);
        //   });
        // }
      }

      p.fill(255, 0);

      const { points, triangles, hull, halfedges } = delaunay;

      for (let index = 0, n = points.length; index < n; index += 2) {
        // p.point(points[index], points[index +  1]);
      }

      // p.beginShape()
      // for (let i = 0; i < hull.length; i += 1) {
      //   const h = hull[i];
      //   p.vertex(points[h * 2], points[h * 2 + 1]);
      // }
      // p.endShape(p.CLOSE)

      for (let index = 0, n = triangles.length; index < n; index += 1) {
        // for (let index = 0, n = triangles.length; index < 0; index += 1) {
        p.strokeWeight(1);
        const t0 = triangles[index * 3 + 0];
        const t1 = triangles[index * 3 + 1];
        const t2 = triangles[index * 3 + 2];
        // p.stroke(255, 0);
        p.stroke(255, 50);
        p.beginShape();
        const p1 = [points[t0 * 2], points[t0 * 2 + 1]];
        const p2 = [points[t1 * 2], points[t1 * 2 + 1]];
        const p3 = [points[t2 * 2], points[t2 * 2 + 1]];
        p.vertex(p1[0], p1[1]);
        p.vertex(p2[0], p2[1]);
        p.vertex(p3[0], p3[1]);
        p.endShape(p.CLOSE);
        p.strokeWeight(5);
        const c = triangle_centroid(p1, p2, p3);
        p.point(c.x, c.y);
        // console.log(index)
      }

      // grid?.forEach((hex) => {
      //   p.noFill();
      //   p.strokeWeight(5);
      //   p.point(hex.x, hex.y - heights.find((h) => h.hex == hex)?.value);
      // });

      // for (let index = 0, n = delaunay2.triangles.length; index < n; index += 1) {
      //   p.strokeWeight(1);
      //   const t0 = delaunay2.triangles[index * 3 + 0];
      //   const t1 = delaunay2.triangles[index * 3 + 1];
      //   const t2 = delaunay2.triangles[index * 3 + 2];
      //   p.stroke(255, 0, 0, 100)
      //   p.fill(255, 0, 0, 10)
      //   p.beginShape()
      //   const p1 = [delaunay2.points[t0 * 2], delaunay2.points[t0 * 2 + 1]]
      //   const p2 = [delaunay2.points[t1 * 2], delaunay2.points[t1 * 2 + 1]]
      //   const p3 = [delaunay2.points[t2 * 2], delaunay2.points[t2 * 2 + 1]]
      //   p.vertex(p1[0], p1[1])
      //   p.vertex(p2[0], p2[1])
      //   p.vertex(p3[0], p3[1])
      //   p.endShape(p.CLOSE)
      //   p.strokeWeight(5)
      //   // console.log(index)
      // }

      // for (let i = 0, n = halfedges.length; i < n; ++i) {
      //   const j = halfedges[i];
      //   if (j < i) continue;
      //   const ti = triangles[i];
      //   const tj = triangles[j];
      //   p.stroke(255, 50)
      //   p.line(points[ti * 2], points[ti * 2 + 1], points[tj * 2], points[tj * 2 + 1])
      // }
    }
  };
}, document.getElementById("app")!);

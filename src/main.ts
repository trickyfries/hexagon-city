import p5 from 'p5';


import * as d3 from "d3";


import './style.css';
import { triangle_circumcenter, triangle_centroid, randomPoint } from './utils';

import { defineHex, Direction, Grid, Hex, rectangle, ring, spiral } from 'honeycomb-grid'



const app = new p5(p5Instance => {
  const p = p5Instance as unknown as p5;

  let delaunay: d3.Delaunay<d3.Delaunay.Point>;
  let delaunay2: d3.Delaunay<d3.Delaunay.Point>;
  let voronoi: d3.Voronoi<d3.Delaunay.Point>;

  let grid: Grid<Hex> | undefined = undefined;

  let initialPoints: number[][];


  p.setup = function setup() {
    p.createCanvas(p.windowWidth, p.windowHeight);



    // 1. Create a hex class:
    const Tile = defineHex({ dimensions: 30 })

    // 2. Create a grid by passing the class and a "traverser" for a rectangular-shaped grid:
    grid = new Grid(Tile, spiral({ start: [10, 10], radius: 5 }))

    initialPoints = []
    grid.forEach(hex => initialPoints.push([hex.x, hex.y]))



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


    const secondPoints: number[][] = []

    const { triangles, points } = delaunay

    for (let index = 0, n = triangles.length; index < n; index += 1) {
      const t0 = triangles[index * 3 + 0];
      const t1 = triangles[index * 3 + 1];
      const t2 = triangles[index * 3 + 2];
      const p1 = [points[t0 * 2], points[t0 * 2 + 1]]
      const p2 = [points[t1 * 2], points[t1 * 2 + 1]]
      const p3 = [points[t2 * 2], points[t2 * 2 + 1]]
      const c = triangle_centroid(p1, p2, p3)
      secondPoints.push([c.x, c.y])
    }

    // delaunay2 = new d3.Delaunay(Float64Array.from(secondPoints.flat()));



  };

  p.draw = function draw() {
    p.resizeCanvas(p.windowWidth, p.windowHeight)

    p.background(0);
    p.stroke(255);
    p.strokeWeight(1);

    // initialPoints[0] = [p.mouseX, p.mouseY]

    delaunay = new d3.Delaunay(Float64Array.from(initialPoints.flat()));



    if (grid) {
      initialPoints = []
      grid.forEach(hex => initialPoints.push([hex.x, hex.y]))



      grid.forEach((hex) => {
        p.noFill();
        p.beginShape()
        hex.corners.forEach((point) => { p.vertex(point.x, point.y) })
        p.endShape(p.CLOSE)
      })

      const centerHex = grid?.pointToHex(
        { x: p.mouseX, y: p.mouseY },
        { allowOutside: false }
      )


      if (centerHex) {
        p.beginShape()
        p.fill(255)
        centerHex.corners.forEach((point) => { p.vertex(point.x, point.y) })

        grid.traverse(ring({ center: [1, 2], radius: 2 }))
        p.endShape(p.CLOSE);

        const nears = [Direction.NE, Direction.E, Direction.SE, Direction.SW, Direction.W, Direction.NW].map((dir) => {
          return grid?.neighborOf([centerHex.q, centerHex.r], dir, { allowOutside: false })
        })

        nears.forEach((hex) => {
          p.fill(255, 50)
          p.beginShape()
          hex?.corners.forEach((point) => { p.vertex(point.x, point.y) })
          p.endShape(p.CLOSE);
        })

      }
    }




    p.fill(255, 50);



    const { points, triangles, hull, halfedges } = delaunay

    for (let index = 0, n = points.length; index < n; index += 2) {
      p.point(points[index], points[index + 1])
    };

    // p.beginShape()
    // for (let i = 0; i < hull.length; i += 1) {
    //   const h = hull[i];
    //   p.vertex(points[h * 2], points[h * 2 + 1]);
    // }
    // p.endShape(p.CLOSE)

    for (let index = 0, n = triangles.length; index < n; index += 1) {
      p.strokeWeight(1);
      const t0 = triangles[index * 3 + 0];
      const t1 = triangles[index * 3 + 1];
      const t2 = triangles[index * 3 + 2];
      p.stroke(255, 50)
      p.beginShape()
      const p1 = [points[t0 * 2], points[t0 * 2 + 1]]
      const p2 = [points[t1 * 2], points[t1 * 2 + 1]]
      const p3 = [points[t2 * 2], points[t2 * 2 + 1]]
      p.vertex(p1[0], p1[1])
      p.vertex(p2[0], p2[1])
      p.vertex(p3[0], p3[1])
      p.endShape(p.CLOSE)
      p.strokeWeight(5)
      const c = triangle_centroid(p1, p2, p3)
      p.point(c.x, c.y)
      // console.log(index)
    }


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





  };
}, document.getElementById('app')!);

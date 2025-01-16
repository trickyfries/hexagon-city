import p5 from "p5";

import * as d3 from "d3";

import "./style.css";
import {
  triangle_circumcenter,
  triangle_centroid,
  randomPoint,
  findHexId,
} from "./utils";

import {
  defineHex,
  Direction,
  Grid,
  Hex,
  rectangle,
  ring,
  spiral,
} from "honeycomb-grid";

const app = new p5((p5Instance) => {
  const p = p5Instance as unknown as p5;

  let delaunay: d3.Delaunay<d3.Delaunay.Point>;
  let delaunay2: d3.Delaunay<d3.Delaunay.Point>;
  let voronoi: d3.Voronoi<d3.Delaunay.Point>;

  interface Node {
    id: number;
    x: number;
    y: number;
    vy?: number;
    vx?: number;
    ogHex: Hex;
  }

  interface Link {
    index: number;
    source: Node;
    target: Node;
    strength?: number;
    distance?: number;
  }

  let graph: {
    nodes: Node[];
    links: Link[];
  } = {
    nodes: [],
    links: [],
  };

  let grid: Grid<Hex> | undefined = undefined;

  let initialPoints: number[][];

  let simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>;

  p.setup = function setup() {
    p.createCanvas(p.windowWidth, p.windowHeight);

    // 1. Create a hex class:
    const Tile = defineHex({ dimensions: 30 });

    // 2. Create a grid by passing the class and a "traverser" for a rectangular-shaped grid:
    grid = new Grid(Tile, spiral({ start: [35, 35], radius: 25 }));

    let linkIndex = 0;
    let currentHexIndex = 0;

    grid.forEach((hex) => {
      // let hexIndex = findHexId(hex);
      let hexIndex = currentHexIndex;
      graph.nodes.push({ id: hexIndex, x: hex.x, y: hex.y, ogHex: hex });
      currentHexIndex++;
    });

    graph.nodes.forEach((node) => {
      const nears = [
        Direction.NE,
        Direction.E,
        Direction.SE,
        Direction.SW,
        Direction.W,
        Direction.NW,
      ].map((dir) => {
        return grid?.neighborOf([node.ogHex.q, node.ogHex.r], dir, {
          allowOutside: false,
        });
      });

      nears.forEach((nearHex) => {
        if (nearHex) {
          const source = node;
          const target = graph.nodes.find((n) => n.ogHex == nearHex);

          if (source && target) {
            const link: Link = {
              index: linkIndex,
              source,
              target,
              distance: linkIndex / 50,
            };

            graph.links.push(link);

            linkIndex++;
          }
        }
      });

      // initialPoints.push([hex.x, hex.y]);
    });

    initialPoints = [];
    grid.forEach((hex) => initialPoints.push([hex.x, hex.y]));

    delaunay = new d3.Delaunay(Float64Array.from(initialPoints.flat()));

    simulation = d3
      .forceSimulation()
      .nodes(graph.nodes)
      .force(
        "link",
        d3
          .forceLink(graph.links)
          .id((d) => d.index as number)
          .distance((d) => 1)
          .iterations(10)
          .strength((link) => 1)
      )
      .force("charge", d3.forceManyBody())

      // .force("x", d3.forceX(p.width / 2))
      // .force("y", d3.forceY(p.height / 2))
      // .force("charge", d3.forceManyBody().strength(1))
      .force("center", d3.forceCenter(p.width / 2, p.height / 2))
      .force(
        "collide",
        d3.forceCollide((d) => 10)
      )
      // .stop()
      .tick(1);
  };

  p.draw = function draw() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);

    p.background(255);
    p.stroke(0);
    p.strokeWeight(1);

    simulation.tick();

    simulation.nodes().forEach((node) => {
      if (node.x && node.y) {
        p.point(node.x, node.y);
      }
    });

    graph.links.forEach((l) => {
      const source = simulation.nodes().find((n) => n.index == l.source.id);
      const target = simulation.nodes().find((n) => n.index == l.target.id);
      if (!!source && !!target) {
        // @ts-ignore
        p.line(source.x, source.y, target.x, target.y);
      }
    });

    // initialPoints[0] = [p.mouseX, p.mouseY]

    // delaunay = new d3.Delaunay(Float64Array.from(initialPoints.flat()));

    // if (grid) {
    //   initialPoints = [];
    //   grid.forEach((hex) => initialPoints.push([hex.x, hex.y]));

    //   grid.forEach((hex) => {
    //     p.noFill();
    //     p.beginShape();
    //     hex.corners.forEach((point) => {
    //       p.vertex(point.x, point.y);
    //     });
    //     p.endShape(p.CLOSE);
    //   });

    //   // const centerHex = grid?.pointToHex(
    //   //   { x: p.mouseX, y: p.mouseY },
    //   //   { allowOutside: false }
    //   // );

    //   // if (centerHex) {
    //   //   p.beginShape();
    //   //   p.fill(255);
    //   //   centerHex.corners.forEach((point) => {
    //   //     p.vertex(point.x, point.y);
    //   //   });

    //   //   grid.traverse(ring({ center: [1, 2], radius: 2 }));
    //   //   p.endShape(p.CLOSE);

    //   //   const nears = [
    //   //     Direction.NE,
    //   //     Direction.E,
    //   //     Direction.SE,
    //   //     Direction.SW,
    //   //     Direction.W,
    //   //     Direction.NW,
    //   //   ].map((dir) => {
    //   //     return grid?.neighborOf([centerHex.q, centerHex.r], dir, {
    //   //       allowOutside: false,
    //   //     });
    //   //   });

    //   //   nears.forEach((hex) => {
    //   //     p.fill(255, 50);
    //   //     p.beginShape();
    //   //     hex?.corners.forEach((point) => {
    //   //       p.vertex(point.x, point.y);
    //   //     });
    //   //     p.endShape(p.CLOSE);
    //   //   });
    //   // }
    // }

    // p.fill(255, 50);

    // const { points, triangles, hull, halfedges } = delaunay;

    // for (let index = 0, n = points.length; index < n; index += 2) {
    //   p.point(points[index], points[index + 1]);
    // }

    // for (let index = 0, n = triangles.length; index < n; index += 1) {
    //   p.strokeWeight(1);
    //   const t0 = triangles[index * 3 + 0];
    //   const t1 = triangles[index * 3 + 1];
    //   const t2 = triangles[index * 3 + 2];
    //   p.stroke(255, 50);
    //   p.beginShape();
    //   const p1 = [points[t0 * 2], points[t0 * 2 + 1]];
    //   const p2 = [points[t1 * 2], points[t1 * 2 + 1]];
    //   const p3 = [points[t2 * 2], points[t2 * 2 + 1]];
    //   p.vertex(p1[0], p1[1]);
    //   p.vertex(p2[0], p2[1]);
    //   p.vertex(p3[0], p3[1]);
    //   p.endShape(p.CLOSE);
    //   p.strokeWeight(5);
    //   const c = triangle_centroid(p1, p2, p3);
    //   p.point(c.x, c.y);
    //   // console.log(index)
    // }
  };
}, document.getElementById("app")!);

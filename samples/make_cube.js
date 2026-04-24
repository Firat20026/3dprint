// Generates a 20×20×20mm ASCII STL cube for seed testing.
// Usage: node samples/make_cube.js > samples/cube_20mm.stl
function tri(nx, ny, nz, v1, v2, v3) {
  return `facet normal ${nx} ${ny} ${nz}
    outer loop
      vertex ${v1.join(" ")}
      vertex ${v2.join(" ")}
      vertex ${v3.join(" ")}
    endloop
  endfacet
`;
}
const s = 20;
const v = {
  A: [0, 0, 0], B: [s, 0, 0], C: [s, s, 0], D: [0, s, 0],
  E: [0, 0, s], F: [s, 0, s], G: [s, s, s], H: [0, s, s],
};
let out = "solid cube\n";
// bottom (-z)
out += tri(0, 0, -1, v.A, v.C, v.B);
out += tri(0, 0, -1, v.A, v.D, v.C);
// top (+z)
out += tri(0, 0, 1, v.E, v.F, v.G);
out += tri(0, 0, 1, v.E, v.G, v.H);
// front (-y)
out += tri(0, -1, 0, v.A, v.B, v.F);
out += tri(0, -1, 0, v.A, v.F, v.E);
// back (+y)
out += tri(0, 1, 0, v.D, v.G, v.C);
out += tri(0, 1, 0, v.D, v.H, v.G);
// left (-x)
out += tri(-1, 0, 0, v.A, v.E, v.H);
out += tri(-1, 0, 0, v.A, v.H, v.D);
// right (+x)
out += tri(1, 0, 0, v.B, v.C, v.G);
out += tri(1, 0, 0, v.B, v.G, v.F);
out += "endsolid cube\n";
process.stdout.write(out);

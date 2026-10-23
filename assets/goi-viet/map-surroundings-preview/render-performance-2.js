/* Phase 2: Render Performance 2 for Preview 2
   - Camera math caching with zero redundant trig & origin allocations
   - 3D Frustum AABB culling for offscreen province rings
   - WeakMap-cached Ramer-Douglas-Peucker side-wall vertex reduction
   - All destination pins, hit areas, and geographic coordinates remain 100% intact
*/
(() => {
  'use strict';

  const bounds = new WeakMap();
  const wallLevels = new WeakMap();
  let projected = 0;
  let culled = 0;
  let wallSourcePoints = 0;
  let wallDrawPoints = 0;

  function ringOffscreen(ring, cam, w, h, z) {
    if (!ring || ring.length < 3) return false;
    let b = bounds.get(ring);
    if (!b) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < ring.length; i++) {
        const pt = ring[i];
        if (pt[0] < minX) minX = pt[0];
        if (pt[0] > maxX) maxX = pt[0];
        if (pt[1] < minY) minY = pt[1];
        if (pt[1] > maxY) maxY = pt[1];
      }
      b = { left: minX, right: maxX, top: minY, bottom: maxY };
      bounds.set(ring, b);
    }

    const pad = 48;
    const corners = [
      [b.left, b.top], [b.right, b.top], [b.right, b.bottom], [b.left, b.bottom]
    ];
    let allLeft = true, allRight = true, allTop = true, allBottom = true;

    for (let hi = 0; hi <= 1; hi++) {
      const height = hi === 0 ? 0 : z;
      for (let ci = 0; ci < 4; ci++) {
        const p = project3D(corners[ci][0], corners[ci][1], height, cam, w, h);
        if (p[0] >= -pad) allLeft = false;
        if (p[0] <= w + pad) allRight = false;
        if (p[1] >= -pad) allTop = false;
        if (p[1] <= h + pad) allBottom = false;

        // If at least one corner is safely inside the screen viewport, the ring is definitely visible!
        if (!allLeft && !allRight && !allTop && !allBottom &&
            p[0] >= -pad && p[0] <= w + pad && p[1] >= -pad && p[1] <= h + pad) {
          projected++;
          return false;
        }
      }
    }

    const outside = allLeft || allRight || allTop || allBottom;
    if (outside) {
      culled++;
    } else {
      projected++;
    }
    return outside;
  }

  function wallRing(ring, zoom, isMoving = false) {
    let tolerance = zoom < 0.9 ? 0.45 : (zoom < 1.6 ? 0.22 : (zoom < 2.5 ? 0.12 : 0));
    if (isMoving) {
      tolerance = Math.max(tolerance * 2.2, 0.45);
    }
    wallSourcePoints += ring.length;
    if (!tolerance || ring.length < 12) {
      wallDrawPoints += ring.length;
      return ring;
    }
    let levels = wallLevels.get(ring);
    if (!levels) {
      levels = new Map();
      wallLevels.set(ring, levels);
    }
    if (!levels.has(tolerance)) {
      const keep = new Uint8Array(ring.length);
      keep[0] = keep[ring.length - 1] = 1;
      const stack = [[0, ring.length - 1]];
      const limit = tolerance * tolerance;
      while (stack.length) {
        const [a, b] = stack.pop();
        const p = ring[a], q = ring[b];
        const dx = q[0] - p[0], dy = q[1] - p[1];
        const len = dx * dx + dy * dy;
        let max = limit, index = -1;
        for (let i = a + 1; i < b; i++) {
          const r = ring[i];
          const t = len ? Math.max(0, Math.min(1, ((r[0] - p[0]) * dx + (r[1] - p[1]) * dy) / len)) : 0;
          const d = (r[0] - p[0] - t * dx) ** 2 + (r[1] - p[1] - t * dy) ** 2;
          if (d > max) {
            max = d;
            index = i;
          }
        }
        if (index >= 0) {
          keep[index] = 1;
          stack.push([a, index], [index, b]);
        }
      }
      const reduced = ring.filter((_, i) => keep[i]);
      levels.set(tolerance, reduced.length >= 4 ? reduced : ring);
    }
    const result = levels.get(tolerance);
    wallDrawPoints += result.length;
    return result;
  }

  // Only the current camera is retained; the source rings remain immutable.
  let ringCamera = '', rings = new WeakMap(), ringReuses = 0;
  function projectRing(ring, z, cam, w, h) {
    const key = [w, h, cam.yaw.toFixed(4), cam.pitch.toFixed(4), cam.zoom.toFixed(4), cam.panX.toFixed(2), cam.panY.toFixed(2)].join(':');
    if (key !== ringCamera) {
      ringCamera = key;
      rings = new WeakMap();
    }
    let planes = rings.get(ring);
    if (!planes) {
      planes = new Map();
      rings.set(ring, planes);
    }
    if (planes.has(z)) {
      ringReuses++;
      return planes.get(z);
    }
    const points = ring.map(p => project3D(p[0], p[1], z, cam, w, h));
    planes.set(z, points);
    return points;
  }

  let wallQuads = 0, wallBatches = 0;
  function paintWalls(context, quads) {
    wallQuads += quads.length;
    for (let i = 0; i < quads.length; ) {
      const first = quads[i], fill = first.fill;
      let left = Infinity, right = -Infinity;
      context.beginPath();
      do {
        const q = quads[i], lo = Math.min(q.b0[0], q.b1[0], q.t0[0], q.t1[0]), hi = Math.max(q.b0[0], q.b1[0], q.t0[0], q.t1[0]);
        // Never merge overlapping translucent walls or reorder the depth sort.
        if (i > 0 && left !== Infinity && !(hi <= left || lo >= right)) break;
        context.moveTo(q.b0[0], q.b0[1]);
        context.lineTo(q.b1[0], q.b1[1]);
        context.lineTo(q.t1[0], q.t1[1]);
        context.lineTo(q.t0[0], q.t0[1]);
        context.closePath();
        left = Math.min(left, lo);
        right = Math.max(right, hi);
        i++;
      } while (i < quads.length && quads[i].fill === fill);
      context.fillStyle = fill;
      context.fill();
      wallBatches++;
    }
  }

  window.GoiVietRenderPerformance = Object.freeze({
    ringOffscreen,
    wallRing,
    projectRing,
    paintWalls,
    originalProject: typeof project3D !== 'undefined' ? project3D : null,
    inspect: () => ({
      projected,
      culled,
      wallSourcePoints,
      wallDrawPoints,
      ringReuses,
      wallQuads,
      wallBatches
    })
  });
})();

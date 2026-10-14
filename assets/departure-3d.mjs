import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// All artwork is procedural geometry. The local bundle also works when index.html
// is opened directly: no CDN, remote textures, model download or module request.
export const DURATION = 6800;
const clamp = THREE.MathUtils.clamp;
const smooth = (a, b, t) => { t = clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export function buildScene(width, height, canvasFactory, sourceRect = null) {
  const scene = new THREE.Scene();
  scene.background = null;
  scene.fog = null;
  const camera = new THREE.PerspectiveCamera(39, width / height, .1, 180);
  const materials = {}, geometryCache = new Map(), wheels = [], rods = [];
  const material = (name, color, metalness = .15, roughness = .4, extras = {}) =>
    materials[name] = new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extras });
  material('red', '#a93024', .32, .29);
  material('navy', '#204b56', .3, .3);
  material('green', '#306957', .28, .32);
  material('gold', '#d7a84d', .65, .26);
  material('cream', '#efe2bd', .15, .42);
  material('iron', '#273335', .55, .42);
  material('roof', '#C48224', .4, .36);
  material('rubber', '#172326', .1, .65);
  material('glass', '#ffe4a2', .15, .19, { emissive: '#ffb957', emissiveIntensity: .26 });
  material('lamp', '#fff2cc', .1, .2, { emissive: '#ffc66a', emissiveIntensity: 2 });
  material('wood', '#786047', .02, .9);
  material('ground', '#e4dcca', .02, 1);
  material('ballast', '#b8b1a1', .05, 1);
  material('leaf', '#8c9b7c', .02, .95);
  material('hill', '#c5c7ad', .02, 1);
  material('stone', '#d4c9b1', .02, .95);

  function mesh(parent, geometry, mat, position = [0, 0, 0], rotation = [0, 0, 0]) {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(...position); object.rotation.set(...rotation);
    object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  }
  function box(parent, size, position, mat, bevel = .045) {
    bevel = Math.min(bevel, ...size.map(length => length * .45));
    const key = `box:${size}:${bevel}`;
    if (!geometryCache.has(key)) {
      const [w, h, d] = size;
      const shape = new THREE.Shape();
      shape.moveTo(-w / 2 + bevel, -h / 2 + bevel);
      shape.lineTo(w / 2 - bevel, -h / 2 + bevel);
      shape.lineTo(w / 2 - bevel, h / 2 - bevel);
      shape.lineTo(-w / 2 + bevel, h / 2 - bevel); shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: Math.max(.01, d - 2 * bevel), bevelEnabled: true,
        bevelSegments: 2, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 3
      });
      geometry.translate(0, 0, -d / 2 + bevel); geometryCache.set(key, geometry);
    }
    return mesh(parent, geometryCache.get(key), mat, position);
  }
  function cylinder(parent, radius, length, position, mat, axis = 'y', top = radius, segments = 24) {
    const key = `cylinder:${radius}:${top}:${length}:${segments}`;
    if (!geometryCache.has(key)) geometryCache.set(key, new THREE.CylinderGeometry(top, radius, length, segments));
    return mesh(parent, geometryCache.get(key), mat, position,
      axis === 'x' ? [0, 0, -Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]);
  }
  function ring(parent, radius, tube, position, mat, axis = 'z') {
    const key = `ring:${radius}:${tube}`;
    if (!geometryCache.has(key)) geometryCache.set(key, new THREE.TorusGeometry(radius, tube, 6, 24));
    return mesh(parent, geometryCache.get(key), mat, position, axis === 'x' ? [0, Math.PI / 2, 0] : [0, 0, 0]);
  }
  function bake(group) {
    group.updateMatrixWorld(true);
    const batches = new Map();
    group.traverse(object => {
      if (!object.isMesh) return;
      const key = object.material.uuid;
      if (!batches.has(key)) batches.set(key, { mat: object.material, geometries: [] });
      const geometry = (object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()).applyMatrix4(object.matrixWorld);
      geometry.deleteAttribute('uv');
      batches.get(key).geometries.push(geometry);
    });
    group.clear();
    for (const { mat, geometries } of batches.values()) {
      mesh(group, mergeGeometries(geometries), mat);
      geometries.forEach(geometry => geometry.dispose());
    }
  }
  function wheel(parent, x, z, radius) {
    const assembly = new THREE.Group();
    cylinder(assembly, radius, .18, [0, 0, 0], materials.rubber, 'z');
    cylinder(assembly, radius * .77, .20, [0, 0, 0], materials.red, 'z');
    ring(assembly, radius * .82, .037, [0, 0, Math.sign(z) * .12], materials.gold);
    cylinder(assembly, .105, .28, [0, 0, 0], materials.gold, 'z');
    for (let i = 0; i < 8; i++) {
      const spoke = box(assembly, [radius * 1.37, .045, .035], [0, 0, Math.sign(z) * .12], materials.gold, .012);
      spoke.rotation.z = i * Math.PI / 4;
    }
    bake(assembly); assembly.position.set(x, radius + .14, z);
    parent.add(assembly); wheels.push({ object: assembly, radius });
  }
  function roof(parent, length, width, position) {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0); shape.quadraticCurveTo(0, .75, width / 2, 0);
    shape.lineTo(width / 2, -.1); shape.quadraticCurveTo(0, .61, -width / 2, -.1); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: true,
      bevelSegments: 2, bevelSize: .04, bevelThickness: .04, steps: 1, curveSegments: 12 });
    geometry.translate(0, 0, -length / 2); geometry.rotateY(Math.PI / 2);
    const cap = mesh(parent, geometry, materials.roof, position);
    cap.scale.y = .32;
  }
  function windowPanel(parent, x, y, side, w = .68, h = .73) {
    const z = side * 1.025;
    box(parent, [w + .13, h + .13, .075], [x, y, z], materials.gold, .065);
    box(parent, [w, h, .045], [x, y, z + side * .04], materials.iron, .045);
    box(parent, [w - .08, h - .08, .03], [x, y, z + side * .068], materials.glass, .035);
    box(parent, [.025, h - .06, .035], [x, y, z + side * .09], materials.gold, .009);
  }
  function locomotive() {
    const group = new THREE.Group(), body = new THREE.Group(); group.add(body);
    box(body, [4.8, .27, 2.12], [0, .94, 0], materials.iron);
    box(body, [4.65, .14, 2.2], [0, 1.11, 0], materials.gold);
    cylinder(body, .82, 2.8, [.48, 1.96, 0], materials.red, 'x');
    cylinder(body, .81, .19, [1.94, 1.96, 0], materials.iron, 'x');
    ring(body, .80, .065, [2.05, 1.96, 0], materials.gold, 'x');
    for (const x of [-.62, .12, .95]) ring(body, .828, .026, [x, 1.96, 0], materials.gold, 'x');
    box(body, [1.63, 1.9, 2.05], [-1.40, 2.08, 0], materials.red, .08);
    for (const side of [-1, 1]) {
      windowPanel(body, -1.4, 2.38, side, .96, .78);
      box(body, [1.57, .09, .06], [-1.4, 1.53, side * 1.06], materials.gold, .015);
      cylinder(body, .043, 1.2, [-2.19, 1.85, side * 1.03], materials.gold);
      box(body, [.45, .12, .35], [-2.2, .74, side * .85], materials.iron);
    }
    roof(body, 1.95, 2.35, [-1.4, 3.05, 0]);
    cylinder(body, .25, .78, [1.14, 3.02, 0], materials.iron, 'y', .35);
    cylinder(body, .38, .11, [1.14, 3.45, 0], materials.gold);
    cylinder(body, .29, .28, [-.05, 2.86, 0], materials.gold, 'y', .22);
    cylinder(body, .20, .24, [2.2, 2.58, 0], materials.gold, 'x');
    cylinder(body, .16, .025, [2.335, 2.58, 0], materials.lamp, 'x');
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .12 : .29;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      i ? star.lineTo(x, y) : star.moveTo(x, y);
    }
    star.closePath();
    const emblem = new THREE.ExtrudeGeometry(star, { depth: .045, bevelEnabled: false });
    mesh(body, emblem, materials.gold, [2.06, 1.95, 0], [0, Math.PI / 2, 0]);
    for (let i = 0; i < 7; i++) {
      const bar = box(body, [.73, .065, .06], [2.39, .86, (i - 3) * .27], materials.gold, .015);
      bar.rotation.z = -.32;
    }
    box(body, [.11, .14, 2.08], [2.72, .73, 0], materials.iron);
    for (const side of [-1, 1]) {
      cylinder(body, .34, .04, [.5, 1.94, side * .84], materials.red, 'z');
      ring(body, .34, .028, [.5, 1.94, side * .87], materials.cream);
      mesh(body, emblem, materials.cream, [.5, 1.94, side * .90], [0, side < 0 ? Math.PI : 0, 0]);
    }
    bake(body);
    for (const side of [-1, 1]) {
      for (const x of [-1.46, -.12, 1.23]) wheel(group, x, side * 1.03, .55);
      const rod = box(group, [2.95, .085, .10], [-.10, .68, side * 1.20], materials.gold, .028);
      rods.push(rod);
    }
    return group;
  }
  function carriage(color) {
    const group = new THREE.Group(), body = new THREE.Group(); group.add(body);
    box(body, [5.0, .25, 2.08], [0, .91, 0], materials.iron);
    box(body, [4.8, 1.91, 2.05], [0, 2.0, 0], color, .08);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) windowPanel(body, (i - 1.5) * 1.1, 2.24, side, .86, .65);
      box(body, [4.81, .24, .07], [0, 1.52, side * 1.04], color === materials.navy ? materials.red : color === materials.red ? materials.green : materials.gold, .02);
      box(body, [4.81, .045, .075], [0, 1.68, side * 1.04], materials.cream, .01);
      box(body, [4.81, .09, .07], [0, 2.91, side * 1.04], materials.gold, .02);
    }
    for (const end of [-1, 1]) {
      box(body, [.075, 1.54, .82], [end * 2.43, 1.94, 0], materials.gold, .025);
      box(body, [.085, 1.43, .70], [end * 2.48, 1.94, 0], color, .025);
      box(body, [.045, .57, .51], [end * 2.54, 2.27, 0], materials.glass, .02);
      for (const side of [-1, 1]) cylinder(body, .035, 1.2, [end * 2.57, 1.81, side * .54], materials.gold);
      box(body, [.45, .12, 1.08], [end * 2.54, .98, 0], materials.iron);
    }
    roof(body, 5.18, 2.36, [0, 2.98, 0]);
    bake(body);
    for (const side of [-1, 1]) for (const x of [-1.55, 1.55]) wheel(group, x, side * 1.03, .37);
    return group;
  }

  const train = [locomotive(), carriage(materials.navy), carriage(materials.red), carriage(materials.green)];
  train.forEach(object => scene.add(object));
  // A broad horizontal bend. Each rigid car is oriented by its two bogies;
  // neither vertices nor the original illustration are skewed to fake depth.
  const route = new THREE.CatmullRomCurve3([
    [60, 0, -12], [28, 0, -12], [10, 0, -12], [-3, 0, -10], [-9, 0, -2],
    [-7, 0, 7], [3, 0, 13], [18, 0, 14], [42, 0, 14], [74, 0, 14]
  ].map(p => new THREE.Vector3(...p)), false, 'centripetal');
  route.arcLengthDivisions = 1400;
  const routeLength = route.getLength();
  function pose(distance) {
    const u = clamp(distance / routeLength, 0, 1);
    return { point: route.getPointAt(u), tangent: route.getTangentAt(u) };
  }
  scene.add(new THREE.HemisphereLight('#fff4d9', '#788a8a', 2.6));
  const sun = new THREE.DirectionalLight('#ffdfad', 3.5);
  sun.position.set(-16, 28, 18); sun.castShadow = true;
  sun.shadow.mapSize.set(width < 600 ? 512 : 1024, width < 600 ? 512 : 1024);
  Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 30, bottom: -30, near: 1, far: 100 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -.0003; sun.shadow.normalBias = .035;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#d0e6ed', 1.5); fill.position.set(14, 10, -18); scene.add(fill);

  // Soft volumetric puffs are actual spheres, emitted along the locomotive's path.
  const steamGeometry = new THREE.SphereGeometry(1, 12, 8);
  const steam = Array.from({ length: 16 }, () => {
    const mat = new THREE.MeshStandardMaterial({ color: '#fff6e2', roughness: 1, transparent: true,
      opacity: 0, depthWrite: false });
    const puff = mesh(scene, steamGeometry, mat); puff.castShadow = false; return puff;
  });
  const couplingGeometry = new THREE.CylinderGeometry(.065, .065, 1, 6);
  const couplings = Array.from({ length: 3 }, () => mesh(scene, couplingGeometry, materials.iron));
  const up = new THREE.Vector3(0, 1, 0);
  const headlight = new THREE.PointLight('#ffd891', 10, 8, 2); scene.add(headlight);

  // A small brass nameplate is the only canvas texture; it is generated locally.
  if (canvasFactory) {
    const canvas = canvasFactory(512, 128), context = canvas.getContext('2d');
    context.fillStyle = '#74251c'; context.fillRect(0, 0, 512, 128);
    context.strokeStyle = '#dfbc70'; context.lineWidth = 7; context.strokeRect(8, 8, 496, 112);
    context.fillStyle = '#ffe4a2'; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.font = 'bold 62px Georgia'; context.fillText('DI SẢN', 256, 67);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const plateMat = new THREE.MeshStandardMaterial({ map: texture, roughness: .5, metalness: .15 });
    for (const side of [-1, 1]) {
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(.96, .24), plateMat);
      plate.position.set(-1.4, 1.63, side * 1.071); plate.rotation.y = side < 0 ? Math.PI : 0;
      train[0].add(plate);
    }
  }
  let disposed = false;
  function update(progress) {
    const travel = smooth(.18, .97, progress);
    const distance = 48 + travel * 91;
    train.forEach((object, index) => {
      const d = distance - index * 5.55;
      const a = pose(d + 1.7).point, b = pose(d - 1.7).point;
      object.position.copy(a).add(b).multiplyScalar(.5);
      object.rotation.y = Math.atan2(-(a.z - b.z), a.x - b.x);
    });
    for (const wheel of wheels) wheel.object.rotation.z = -distance / wheel.radius;
    rods.forEach(rod => { rod.position.x = -.10 + Math.cos(distance / .55) * .22;
      rod.position.y = .68 - Math.sin(distance / .55) * .22; });
    couplings.forEach((object, i) => {
      const rear = new THREE.Vector3(-2.55, 1.01, 0).applyEuler(train[i].rotation).add(train[i].position);
      const front = new THREE.Vector3(2.55, 1.01, 0).applyEuler(train[i + 1].rotation).add(train[i + 1].position);
      const delta = front.clone().sub(rear);
      object.position.copy(rear).add(front).multiplyScalar(.5); object.scale.y = delta.length();
      object.quaternion.setFromUnitVectors(up, delta.normalize());
    });
    steam.forEach((puff, i) => {
      const age = ((progress * 6 + i / 16) % 1) * 2.1;
      const emitted = pose(distance - age * (2 + travel * 12));
      puff.position.copy(emitted.point).addScaledVector(emitted.tangent, 1.14);
      puff.position.x += age * .55; puff.position.z -= age * .35;
      puff.position.y = 3.55 + age * 1.1;
      puff.scale.setScalar(.22 + age * .48);
      puff.material.opacity = .38 * (1 - age / 2.1) * smooth(0, .12, progress);
    });
    headlight.position.copy(train[0].position).add(new THREE.Vector3(2.4, 2.6, 0).applyEuler(train[0].rotation));
    const turn = smooth(.16, .56, progress);
    const release = smooth(.56, .74, progress);
    const portrait = Math.max(1, Math.pow(1.25 / camera.aspect, .40));
    const behind = new THREE.Vector3(-1, 0, 0).applyEuler(train[0].rotation);
    const follow = train[0].position.clone().addScaledVector(behind, camera.aspect < .8 ? 1.8 : 5);
    follow.y = 2.0;
    const look = follow.clone().lerp(new THREE.Vector3(17, 2.0, 14), release);
    const offset = new THREE.Vector3().lerpVectors(new THREE.Vector3(-24, 12, 30), new THREE.Vector3(-10, 7, 19), turn);
    const followingEye = follow.clone().add(offset);
    const eye = followingEye.lerp(new THREE.Vector3(14, 5.6, 28), release);
    eye.sub(look).multiplyScalar(portrait).add(look);
    // Start with the same side view and screen rectangle as the welcome train.
    // Perspective and the tracking camera take over gradually, without a scene cut.
    if (sourceRect) {
      const blend = smooth(.05, .32, progress);
      const middle = train[0].position.clone().add(train[3].position).multiplyScalar(.5);
      middle.y = 1.72;
      const span = 21.65;
      const focal = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      const depth = focal * span / Math.max(1, sourceRect.width);
      const unitsPerPixel = span / Math.max(1, sourceRect.width);
      const initialLook = middle.clone();
      initialLook.x += (width / 2 - sourceRect.left - sourceRect.width / 2) * unitsPerPixel;
      initialLook.y += (sourceRect.top + sourceRect.height / 2 - height / 2) * unitsPerPixel;
      const initialEye = initialLook.clone().add(new THREE.Vector3(0, 0, depth));
      eye.lerpVectors(initialEye, eye.clone(), blend);
      look.lerpVectors(initialLook, look.clone(), blend);
    }
    camera.position.copy(eye); camera.lookAt(look); camera.updateMatrixWorld();
    scene.updateMatrixWorld(true);
    return { distance, progress, phase: progress < .23 ? 0 : progress < .64 ? 1 : 2 };
  }
  function resize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function dispose() {
    if (disposed) return; disposed = true;
    const geometries = new Set(geometryCache.values()), mats = new Set(Object.values(materials)), textures = new Set();
    scene.traverse(object => { if (object.geometry) geometries.add(object.geometry);
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(mat => mats.add(mat)); });
    mats.forEach(mat => { if (mat.map) textures.add(mat.map); mat.dispose(); });
    textures.forEach(texture => texture.dispose()); geometries.forEach(geometry => geometry.dispose()); scene.clear();
  }
  update(0);
  return { scene, camera, train, route, routeLength, update, resize, dispose };
}

export function create(canvas, { onComplete, onPhase = () => {}, sourceRect = null }) {
  let renderer, world, frame = 0, stopped = false, started = null, phase = -1;
  const fail = () => { if (!stopped) { stop(); onComplete(); } };
  function stop() {
    if (stopped) return; stopped = true;
    cancelAnimationFrame(frame); window.removeEventListener('resize', resize);
    canvas.removeEventListener('webglcontextlost', lost);
    world?.dispose(); renderer?.dispose(); renderer?.forceContextLoss();
  }
  function lost(event) { event.preventDefault(); fail(); }
  function resize() {
    if (stopped || !renderer || !world) return;
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 600 ? 1.5 : 1.75));
    renderer.setSize(w, h, false); world.resize(w, h);
  }
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    world = buildScene(window.innerWidth, window.innerHeight, (w, h) => {
      const element = document.createElement('canvas'); element.width = w; element.height = h; return element;
    }, sourceRect);
    resize(); renderer.render(world.scene, world.camera);
    canvas.addEventListener('webglcontextlost', lost); window.addEventListener('resize', resize);
    function tick(now) {
      if (stopped) return;
      try {
        if (started === null) started = now;
        const progress = Math.min(1, (now - started) / DURATION);
        const state = world.update(progress);
        if (phase !== state.phase) { phase = state.phase; onPhase(phase); }
        canvas.parentElement.style.setProperty('--departure-reveal', String(smooth(.84, 1, progress)));
        canvas.parentElement.style.setProperty('--departure-lift', String(smooth(.05, .27, progress)));
        renderer.render(world.scene, world.camera);
        if (progress === 1) fail(); else frame = requestAnimationFrame(tick);
      } catch { fail(); }
    }
    frame = requestAnimationFrame(tick);
    return { stop, world };
  } catch (error) { stop(); throw error; }
}

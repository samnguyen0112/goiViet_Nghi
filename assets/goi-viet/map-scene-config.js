/* Editable composition in the approved 1597 × 985 design space.
   Artwork files contain decoration only; all controls, labels and map data stay native. */
window.GoiVietMapConfig = {
  design: { width: 1597, height: 985, referenceZoom: 0.86 },
  artRoot: 'assets/goi-viet/map-reference/',
  layers: {
    logo: { file: 'logo.png', source: [0,0,341,210], size: [341,210], x: 43, y: 17, width: 341 },
    left: { file: 'mountains-left.png', source: [0,0,439,508], size: [439,508], x: 0, y: 477, width: 439 },
    middle: { file:'mountains-middle.png', source:[0,0,190,255],size:[190,255],x:359,y:477,width:190 },
    upperLeft: { file:'mountains-upper-left.png',source:[0,0,405,158],size:[405,158],x:0,y:91,width:405 },
    right: { file: 'mountains-right.png', source: [0,0,516,93], size: [516,93], x: 1081, y: 892, width: 516 },
    clouds: { file: 'clouds-bottom.png', source: [0,0,761,64], size: [761,64], x: 357, y: 921, width: 761 },
    crane: { file: 'crane.png', source: [0,0,219,183], size: [219,183], x: 173, y: 487, width: 219 }
  },
  colors: { sea: ['#83B8B4','#39838D','#226673'], paper: '#F8EBD0', landInk: '#BBA881' },
  /* Background context is a schematic illustration in the same world plane as the map. */
  neighborLand: [[-1.7,-0.6],[1.7,-0.6],[1.45,-0.1],[1.25,0.07],[0.92,0.2],[0.43,0.34],[0.49,0.47],[0.52,0.59],[0.46,0.72],[0.24,0.81],[-1.7,0.81]],
  /* Reuse a decorative mountain detail as a translucent, separately positioned middle ground. */
  backgroundTerrain: { file:'mountains-left.png', source:[0,0,439,508], world:[-60,140,440,640], opacity:.28 },
  textures: { sea:'sea-waves.png', terrain:'terrain-texture.png' },
  compass: { rim:'compass-rim.png', needle:'compass-needle.png', exact:'compass-exact.png' },
  countryLabels: [
    { text: 'TRUNG QUỐC', x: 0.96, y: -0.005 },
    { text: 'LÀO', x: 0.06, y: 0.34 },
    { text: 'THÁI LAN', x: 0.19, y: 0.55 },
    { text: 'CAMPUCHIA', x: 0.30, y: 0.70 }
  ],
  landmarks: {
    hn: { file: 'landmark-hanoi.png', width: 38, height: 60, dx: 12, dy: -15 },
    hue: { file: 'landmark-hue.png', width: 88, height: 52, dx: 43, dy: -21 },
    hcm: { file: 'landmark-saigon.png', width: 60, height: 51, dx: 77, dy: 10 }
  },
  railwayClearance: 24,
  sailboat: { file: 'sailboat.png', world: [650,245], width: 111, height: 120 },
  placeIllustrations: { hn: 'hanoi-lake.png' }
};

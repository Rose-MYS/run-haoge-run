(function () {
  'use strict';

  var CONFIG = window.CONFIG;

  var THEMES = [
    {
      name: 'market',
      sky: new THREE.Color(0x76acd6),
      fog: new THREE.Color(0x94b6d0),
      fogNear: 55,
      fogFar: 130,
      hemiSky: new THREE.Color(0xbcd9ff),
      hemiGround: new THREE.Color(0x6a5c4a),
      hemiIntensity: 0.45,
      sun: new THREE.Color(0xffedc4),
      sunIntensity: 0.9,
      ambientIntensity: 0.45,
      exposure: 0.95,
      ground: { base: '#5e584f', v0: 62, v1: 112, tint: new THREE.Color(0xf0d2a0) },
      line: new THREE.Color(0xfff3d6),
    },
    {
      name: 'village',
      sky: new THREE.Color(0x9a7a66),
      fog: new THREE.Color(0x8d6f5f),
      fogNear: 40,
      fogFar: 105,
      hemiSky: new THREE.Color(0xe2a978),
      hemiGround: new THREE.Color(0x43352d),
      hemiIntensity: 0.5,
      sun: new THREE.Color(0xffb066),
      sunIntensity: 0.85,
      ambientIntensity: 0.42,
      exposure: 1.0,
      ground: { base: '#5f594f', v0: 62, v1: 110, tint: new THREE.Color(0xe8c596) },
      line: new THREE.Color(0xffe9c8),
    },
    {
      name: 'riverside',
      sky: new THREE.Color(0x74a7d8),
      fog: new THREE.Color(0x9fc3e0),
      fogNear: 50,
      fogFar: 130,
      hemiSky: new THREE.Color(0x9fd0ff),
      hemiGround: new THREE.Color(0x6d7a66),
      hemiIntensity: 0.55,
      sun: new THREE.Color(0xfff0cc),
      sunIntensity: 1.15,
      ambientIntensity: 0.48,
      exposure: 1.08,
      ground: { base: '#5f6a5e', v0: 70, v1: 120, tint: new THREE.Color(0xdcecd0) },
      line: new THREE.Color(0xfff6e0),
    },
    {
      name: 'night',
      sky: new THREE.Color(0x1d2437),
      fog: new THREE.Color(0x232c44),
      fogNear: 40,
      fogFar: 105,
      hemiSky: new THREE.Color(0x5c6a9e),
      hemiGround: new THREE.Color(0x171b26),
      hemiIntensity: 0.5,
      sun: new THREE.Color(0x9fb4ff),
      sunIntensity: 0.55,
      ambientIntensity: 0.35,
      exposure: 1.15,
      ground: { base: '#41454c', v0: 55, v1: 100, tint: new THREE.Color(0xa9c4ff) },
      line: new THREE.Color(0xffe9b0),
    },
  ];
  var THEME_AT = [0, 250, 600, 1200];

  /* ---------------- 基础 Three.js 设置 ---------------- */
  var coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('useLegacyLights' in renderer) renderer.useLegacyLights = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.getElementById('game-container').appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var skyColor = new THREE.Color(THEMES[0].sky);
  scene.background = skyColor;
  var fogColor = new THREE.Color(THEMES[0].fog);
  scene.fog = new THREE.Fog(fogColor, THEMES[0].fogNear, THEMES[0].fogFar);

  var camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 7.4, 9.2);

  var ambient = new THREE.AmbientLight(0xffffff, THEMES[0].ambientIntensity);
  scene.add(ambient);
  var hemi = new THREE.HemisphereLight(THEMES[0].hemiSky, THEMES[0].hemiGround, THEMES[0].hemiIntensity);
  scene.add(hemi);
  var sun = new THREE.DirectionalLight(THEMES[0].sun, THEMES[0].sunIntensity);
  sun.position.set(8, 14, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  scene.add(sun);

  /* ---------------- 地面（滚动循环） ---------------- */
  function makeGroundTexture(ti) {
    var style = THEMES[ti].ground;
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = style.base;
    ctx.fillRect(0, 0, 256, 256);
    for (var b = 0; b < 26; b++) {
      var bx = Math.random() * 256;
      var by = Math.random() * 256;
      var br = 14 + Math.random() * 34;
      var g = ctx.createRadialGradient(bx, by, 2, bx, by, br);
      g.addColorStop(0, Math.random() < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.06)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    for (var i = 0; i < 1400; i++) {
      var v = style.v0 + Math.random() * (style.v1 - style.v0);
      var warm = ti === 0 ? 6 : 0;
      ctx.fillStyle = Math.random() < 0.5
        ? 'rgb(' + (v - 8) + ',' + v + ',' + (v - 10) + ')'
        : 'rgb(' + (v + 12 + warm) + ',' + (v + 10 + warm) + ',' + (v + 4) + ')';
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#000000';
    for (var s = 0; s < 6; s++) {
      var sy = Math.random() * 256;
      ctx.fillRect(0, sy, 256, 5 + Math.random() * 10);
    }
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#ffffff';
    for (var s2 = 0; s2 < 5; s2++) {
      ctx.fillRect(0, Math.random() * 256, 256, 4 + Math.random() * 8);
    }
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#3a352e';
    ctx.lineWidth = 1;
    for (var cr = 0; cr < 10; cr++) {
      var cx = Math.random() * 256;
      var cy = Math.random() * 256;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + (Math.random() - 0.5) * 36, cy + (Math.random() - 0.5) * 36);
      ctx.stroke();
    }
    if (ti === 0) {
      ctx.strokeStyle = 'rgba(60,50,40,0.22)';
      ctx.lineWidth = 1.5;
      for (var gx = 0; gx <= 256; gx += 32) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, 256);
        ctx.stroke();
      }
      for (var gy = 0; gy <= 256; gy += 32) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(256, gy);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(45,40,35,0.5)';
      ctx.beginPath();
      ctx.arc(72, 84, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(25,22,20,0.8)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(72, 84, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(52, 84);
      ctx.lineTo(92, 84);
      ctx.moveTo(72, 64);
      ctx.lineTo(72, 104);
      ctx.stroke();
    } else if (ti === 1) {
      ctx.strokeStyle = 'rgba(55,48,42,0.25)';
      ctx.lineWidth = 1.5;
      for (var px2 = 0; px2 < 8; px2++) {
        ctx.beginPath();
        ctx.moveTo(0, 20 + px2 * 30);
        ctx.lineTo(256, 10 + px2 * 31);
        ctx.stroke();
      }
    } else if (ti === 3) {
      var glowColors = ['rgba(255,209,128,0.35)', 'rgba(255,90,90,0.3)', 'rgba(111,227,255,0.3)', 'rgba(255,138,194,0.3)'];
      for (var gp = 0; gp < 12; gp++) {
        var gx2 = Math.random() * 256;
        var gy2 = Math.random() * 256;
        var gr = 10 + Math.random() * 22;
        var gg = ctx.createRadialGradient(gx2, gy2, 1, gx2, gy2, gr);
        gg.addColorStop(0, glowColors[gp % glowColors.length]);
        gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(gx2, gy2, gr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 44);
    return tex;
  }

  var GROUND_TEX = THEMES.map(function (t, ti) { return makeGroundTexture(ti); });
  var track = new THREE.Group();
  var groundMat = new THREE.MeshLambertMaterial({
    map: GROUND_TEX[0],
    color: THEMES[0].ground.tint,
  });
  var groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(32, 220),
    groundMat
  );
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.set(0, 0, -40);
  groundMesh.receiveShadow = true;
  track.add(groundMesh);

  var lineMat = new THREE.MeshBasicMaterial({
    color: THEMES[0].line,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  [-0.85, 0.85].forEach(function (lx) {
    var line = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 220), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(lx, 0.02, -40);
    track.add(line);
  });
  scene.add(track);

  /* ---------------- 街边道具（四段主题） ---------------- */
  var sideProps = [];

  function makeSignTexture(text, bg, fg) {
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 96;
    var ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 240, 80);
    ctx.fillStyle = fg;
    ctx.font = 'bold 54px "Microsoft YaHei", "SimHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 54);
    return new THREE.CanvasTexture(c);
  }

  function makeBrickTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#9c5b3f';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#7a4430';
    ctx.lineWidth = 4;
    for (var r = 0; r < 8; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * 16);
      ctx.lineTo(128, r * 16);
      ctx.stroke();
      for (var col = 0; col < 4; col++) {
        ctx.beginPath();
        ctx.moveTo(col * 32 + (r % 2 ? 16 : 0), r * 16);
        ctx.lineTo(col * 32 + (r % 2 ? 16 : 0), (r + 1) * 16);
        ctx.stroke();
      }
    }
    return new THREE.CanvasTexture(c);
  }

  function makeWoodTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#9a6a3a';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = 'rgba(70,45,22,0.55)';
    ctx.lineWidth = 3;
    for (var i = 0; i < 9; i++) {
      var y = 4 + i * 15 + Math.sin(i * 1.7) * 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(32, y + 3, 96, y - 3, 128, y + 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.ellipse(30, 28, 18, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(60,35,18,0.10)';
    ctx.beginPath();
    ctx.ellipse(92, 86, 22, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(c);
  }

  function makeBambooTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#b0843f';
    ctx.fillRect(0, 0, 128, 128);
    for (var i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#a57836' : '#c1934a';
      ctx.fillRect(i * 16, 0, 16, 128);
      ctx.strokeStyle = 'rgba(90,62,20,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(i * 16, 0, 16, 128);
    }
    ctx.strokeStyle = 'rgba(90,62,20,0.35)';
    ctx.lineWidth = 2;
    for (var h = 0; h < 5; h++) {
      var y = 12 + h * 26;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(128, y);
      ctx.stroke();
    }
    return new THREE.CanvasTexture(c);
  }

  function makeAwningTexture() {
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    var ctx = c.getContext('2d');
    for (var i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 ? '#e8e2d2' : '#c63737';
      ctx.beginPath();
      ctx.moveTo(i * 26, 0);
      ctx.lineTo(i * 26 + 26, 0);
      ctx.lineTo(i * 26 + 18, 128);
      ctx.lineTo(i * 26 + 8, 128);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(0, 0, 256, 18);
    ctx.strokeStyle = 'rgba(70,20,20,0.5)';
    ctx.lineWidth = 3;
    for (var j = 0; j < 10; j++) {
      ctx.beginPath();
      ctx.moveTo(j * 26 + 13, 0);
      ctx.lineTo(j * 26 + 13, 128);
      ctx.stroke();
    }
    return new THREE.CanvasTexture(c);
  }

  function makePosterTexture() {
    var c = document.createElement('canvas');
    c.width = 128;
    c.height = 192;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#d8c9a8';
    ctx.fillRect(0, 0, 128, 192);
    ctx.fillStyle = '#a83a2e';
    ctx.fillRect(10, 10, 108, 46);
    ctx.fillStyle = '#f5efe2';
    ctx.font = 'bold 30px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('新 鲜', 64, 35);
    ctx.fillStyle = '#2d5a34';
    ctx.fillRect(10, 62, 108, 90);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(10, 62, 108, 26);
    ctx.fillStyle = '#5b3a22';
    ctx.fillRect(16, 164, 96, 16);
    ctx.fillStyle = '#7a4f2a';
    ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
    ctx.fillText('水果', 64, 176);
    ctx.strokeStyle = 'rgba(60,40,20,0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, 116, 180);
    return new THREE.CanvasTexture(c);
  }

  function makeBuildingTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#c9b48a';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#b89c6d';
    for (var i = 0; i < 4; i++) ctx.fillRect(0, i * 64, 256, 4);
    ctx.fillStyle = '#6b7f9e';
    for (var r = 0; r < 3; r++) {
      for (var col = 0; col < 3; col++) {
        ctx.fillRect(24 + col * 84, 12 + r * 68, 56, 48);
      }
    }
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(92, 212, 72, 44);
    return new THREE.CanvasTexture(c);
  }

  function lam(color, opts) {
    return new THREE.MeshLambertMaterial(Object.assign({ color: color }, opts || {}));
  }

  function bx(w, h, d, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    return m;
  }

  function cyl(rt, rb, h, seg, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 10), mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    return m;
  }

  function sph(r, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    return m;
  }

  function plane(w, h, mat, x, y, z, ry) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (ry) m.rotation.y = ry;
    return m;
  }

  function signPlane(text, bg, fg, w, h, x, y, z, ry) {
    return plane(w, h, new THREE.MeshBasicMaterial({
      map: makeSignTexture(text, bg, fg),
      side: THREE.DoubleSide,
    }), x, y, z, ry);
  }

  function buildMarketProp(kind) {
    var g = new THREE.Group();
    var woodMat = lam(0xffffff, { map: makeWoodTexture() });
    var bambooMat = lam(0xffffff, { map: makeBambooTexture() });
    var melonMat = lam(0xffffff, { map: window.Obstacles.melonTexture() });
    var metalMat = lam(0x7f878d, { metalness: 0.35, roughness: 0.5 });

    if (kind === 0) {
      // 郝哥主瓜摊：木柜台 + 红白波浪雨棚 + 招牌 + 西瓜堆 + 杆秤
      g.add(bx(1.5, 0.85, 0.95, woodMat, 0, 0.43, 0));
      g.add(bx(1.5, 0.34, 0.06, lam(0x5a3b26), 0, 0.3, 0.48));
      g.add(bx(1.5, 0.06, 0.06, lam(0x3d2718), 0, 0.1, 0.48));
      var awningMat = lam(0xffffff, { map: makeAwningTexture() });
      g.add(bx(1.9, 0.07, 1.15, awningMat, 0, 1.68, 0));
      for (var wv = 0; wv < 7; wv++) {
        g.add(bx(0.12, 0.24, 0.03, lam(wv % 2 ? 0xe8e2d2 : 0xc63737), -0.9 + wv * 0.3, 1.57, 0.58));
      }
      var poleMat = lam(0x4a4a4a);
      [-0.62, 0.62].forEach(function (px) {
        g.add(bx(0.07, 1.45, 0.07, poleMat, px, 0.82, 0));
      });
      g.add(signPlane('郝哥瓜摊', '#f7d154', '#7a1f1f', 1.15, 0.36, 0, 2.02, 0.58));
      [[-0.5, 0.86, 0.1], [-0.18, 0.9, -0.05], [0.18, 0.9, 0.15], [0.48, 0.86, -0.1]].forEach(function (mp) {
        g.add(sph(0.25, melonMat, mp[0], mp[1], mp[2]));
      });
      var cutG = new THREE.Group();
      var dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 12, 10, 0, Math.PI * 2, 0, Math.PI),
        melonMat
      );
      dome.castShadow = true;
      cutG.add(dome);
      var flesh = new THREE.Mesh(new THREE.CircleGeometry(0.24, 12), lam(0xe53935));
      flesh.rotation.x = Math.PI / 2;
      flesh.position.y = 0.01;
      cutG.add(flesh);
      cutG.rotation.x = -0.35;
      cutG.position.set(-0.05, 0.92, -0.25);
      g.add(cutG);
      g.add(cyl(0.02, 0.02, 0.95, 8, metalMat, 0.75, 1.15, 0.1));
      g.add(cyl(0.015, 0.02, 0.85, 8, metalMat, 0.75, 1.55, 0.1));
      g.add(cyl(0.1, 0.1, 0.03, 12, metalMat, 0.75, 0.85, 0.1));
      g.add(sph(0.045, metalMat, 0.75, 1.02, 0.03));
      g.add(bx(0.34, 0.05, 0.34, woodMat, -1.05, 0.3, 0.38));
      g.add(bx(0.05, 0.3, 0.05, woodMat, -1.18, 0.15, 0.26));
      g.add(bx(0.05, 0.3, 0.05, woodMat, -0.92, 0.15, 0.26));
      g.add(bx(0.05, 0.3, 0.05, woodMat, -1.18, 0.15, 0.5));
      g.add(bx(0.05, 0.3, 0.05, woodMat, -0.92, 0.15, 0.5));
      g.add(cyl(0.09, 0.11, 0.5, 10, lam(0xb03a2e), -1.02, 0.25, -0.38));
      g.add(cyl(0.04, 0.04, 0.05, 8, lam(0x8a8a8a), -1.02, 0.52, -0.38));
      g.add(cyl(0.3, 0.24, 0.55, 12, bambooMat, -0.75, 0.28, 0.55));
      g.add(sph(0.2, lam(0x3d7a3f), -0.75, 0.5, 0.55));
    } else if (kind === 1) {
      // 竹筐水果摊
      [[-0.5, 0], [0.35, 0.15]].forEach(function (bp) {
        g.add(cyl(0.3, 0.24, 0.55, 12, bambooMat, bp[0], 0.28, bp[1]));
      });
      g.add(sph(0.2, lam(0xd94f4f), -0.5, 0.5, 0));
      g.add(sph(0.2, lam(0xf1c40f), -0.18, 0.42, 0.1));
      g.add(sph(0.2, lam(0x2e8b3d), 0.62, 0.5, 0.25));
      g.add(sph(0.18, lam(0xe67e22), 0.35, 0.42, 0.15));
      g.add(bx(0.7, 0.75, 0.5, woodMat, 0.95, 0.38, 0.1));
      g.add(signPlane('5元/斤', '#fff8e1', '#b71c1c', 0.6, 0.3, 0.95, 0.98, 0.28));
    } else if (kind === 2) {
      // 瓜堆 + 木箱 + 竹筐 + 草帽
      var sizes = [[0.72, 0.62, 0.72], [0.56, 0.5, 0.56], [0.5, 0.4, 0.5]];
      var positions = [[-0.25, 0.31, 0.1], [0.45, 0.25, -0.15], [-0.5, 0.2, -0.3]];
      for (var j = 0; j < 3; j++) {
        g.add(bx(sizes[j][0], sizes[j][1], sizes[j][2], woodMat, positions[j][0], positions[j][1], positions[j][2]));
      }
      g.add(cyl(0.3, 0.24, 0.55, 12, bambooMat, 0.7, 0.28, 0.35));
      [[0.1, 0.8, 0.25], [0.42, 0.78, -0.1], [-0.6, 0.7, 0.3]].forEach(function (mp) {
        g.add(sph(0.24, melonMat, mp[0], mp[1], mp[2]));
      });
      var hat = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.14, 12), bambooMat);
      hat.position.set(-0.25, 0.86, 0.1);
      hat.castShadow = true;
      g.add(hat);
    } else if (kind === 3) {
      // 老式楼房：窗户 + 门 + 雨搭 + 空调外机 + 招牌
      g.add(bx(2.4, 4.6, 0.8, lam(0xffffff, { map: makeBuildingTexture() }), 0, 2.3, 0));
      g.add(bx(2.6, 0.35, 0.85, lam(0x8a7a66), 0, 4.6, 0));
      g.add(bx(2.6, 0.25, 0.85, lam(0x6f6252), 0, 0.12, 0));
      var frameMat = lam(0x4a3526);
      for (var r = 0; r < 2; r++) {
        for (var col = 0; col < 2; col++) {
          var wx = -0.55 + col * 1.1;
          var wy = 1.6 + r * 1.5;
          g.add(bx(0.85, 1.05, 0.06, frameMat, wx, wy, 0.4));
          g.add(bx(0.7, 0.9, 0.05, lam(0x2e3a4a), wx, wy, 0.43));
          g.add(bx(0.04, 0.9, 0.06, frameMat, wx, wy, 0.41));
          g.add(bx(0.7, 0.04, 0.06, frameMat, wx, wy, 0.41));
        }
      }
      g.add(bx(0.5, 0.95, 0.08, lam(0x6d4c41), 0, 0.5, 0.4));
      g.add(bx(0.62, 0.06, 0.1, lam(0x3a2a1e), 0, 0.95, 0.44));
      g.add(bx(0.65, 0.08, 0.75, lam(0x7a6a55), 0, 1.25, 0.05));
      g.add(bx(0.75, 0.45, 0.3, lam(0xd8d8d0), 0.75, 2.3, 0.1));
      g.add(cyl(0.14, 0.14, 0.12, 10, lam(0x9aa0a6), 0.75, 2.52, 0.1));
      g.add(signPlane('水果批发', '#d94f4f', '#ffffff', 1.5, 0.42, 0, 3.35, 0.41));
      g.add(bx(0.8, 0.04, 0.5, lam(0x4a3526), 0.85, 3.6, -0.2));
      g.add(bx(0.55, 0.7, 0.03, lam(0x4a90d9), 0.85, 3.25, -0.44));
      g.add(bx(0.6, 0.6, 0.6, lam(0x3d7a3f), -1.05, 0.3, 0.25));
    } else {
      // 电线杆 + 横担 + 电线 + 旧海报 + 水泥墩
      g.add(cyl(0.09, 0.13, 4.2, 8, lam(0x6e6a60), 0, 2.1, 0));
      g.add(bx(0.42, 0.45, 0.42, lam(0x8a8580), 0, 0.22, 0));
      g.add(bx(1.3, 0.08, 0.08, lam(0x55524a), 0, 3.3, 0));
      var insulatorMat = lam(0xd8d4c8);
      [-0.55, 0.55].forEach(function (ix) {
        g.add(bx(0.09, 0.14, 0.09, insulatorMat, ix, 3.22, 0));
      });
      var wireMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
      g.add(bx(0.015, 0.015, 0.7, wireMat, 0.55, 3.55, 0.3));
      g.add(bx(0.015, 0.015, 0.85, wireMat, -0.55, 3.5, 0.4));
      var poster = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55, 0.82),
        new THREE.MeshBasicMaterial({ map: makePosterTexture(), side: THREE.DoubleSide })
      );
      poster.position.set(0.28, 1.45, 0.08);
      g.add(poster);
    }
    return g;
  }

  function buildVillageProp(kind) {
    var g = new THREE.Group();
    if (kind === 0) {
      g.add(bx(2.4, 4.4, 0.7, lam(0xffffff, { map: makeBrickTexture() }), 0, 2.2, 0));
      g.add(bx(2.8, 0.18, 1.0, lam(0x5a4036), 0, 4.5, 0));
      var winMat = lam(0x2e3a4a);
      for (var r = 0; r < 2; r++) {
        for (var col = 0; col < 2; col++) {
          g.add(bx(0.7, 0.9, 0.06, winMat, -0.55 + col * 1.1, 1.4 + r * 1.5, 0.36));
          g.add(bx(0.7, 0.03, 0.08, lam(0x4a4a4a), -0.55 + col * 1.1, 1.4 + r * 1.5, 0.37));
          g.add(bx(0.03, 0.9, 0.08, lam(0x4a4a4a), -0.55 + col * 1.1, 1.4 + r * 1.5, 0.37));
        }
      }
      g.add(bx(0.45, 0.85, 0.08, lam(0x6d4c41), 0, 0.42, 0.36));
      g.add(bx(0.7, 0.5, 0.5, lam(0x9aa0a6), 0.9, 2.8, 0.1));
      g.add(cyl(0.14, 0.14, 0.14, 10, lam(0x9aa0a6), 0.9, 3.05, 0.1));
      g.add(bx(0.85, 0.5, 0.3, lam(0xd8d8d0), -0.95, 2.4, 0.1));
      g.add(cyl(0.1, 0.1, 0.12, 8, lam(0x8a8a8a), -0.95, 2.68, 0.1));
      g.add(signPlane('后巷商店', '#8e44ad', '#ffffff', 0.9, 0.5, 0.1, 2.9, 0.38));
    } else if (kind === 1) {
      var poleMat = lam(0x4a4a4a);
      g.add(cyl(0.05, 0.06, 3.2, 8, poleMat, -1.0, 1.6, 0));
      g.add(cyl(0.05, 0.06, 3.2, 8, poleMat, 1.0, 1.6, 0));
      g.add(cyl(0.015, 0.015, 2.2, 6, lam(0x8a8a8a), 0, 2.9, 0.1));
      var cloths = [0xd94f4f, 0x4a90d9, 0x8e44ad];
      for (var i = 0; i < cloths.length; i++) {
        var cl = bx(0.55, 0.7, 0.03, lam(cloths[i]), -0.55 + i * 0.55, 2.55, 0.15);
        cl.rotation.z = (i - 1) * 0.08;
        g.add(cl);
      }
      g.add(bx(1.0, 0.8, 0.03, lam(0xe8e2d2), 0, 2.4, -0.1));
      g.add(bx(0.5, 0.6, 0.5, lam(0x5a4036), 0, 0.3, -0.3));
      g.add(cyl(0.14, 0.1, 0.4, 10, lam(0x6f7f8f), 0.6, 0.2, 0.35));
      g.add(bx(0.6, 0.04, 0.04, lam(0x6d4c41), 0.6, 0.42, 0.35));
    } else if (kind === 2) {
      g.add(bx(2.2, 4.2, 0.7, lam(0x3a3f47), 0, 2.1, 0));
      g.add(bx(0.9, 1.5, 0.06, lam(0x1b1e24), -0.6, 1.7, 0.36));
      g.add(signPlane('靓发', '#ff4081', '#ffffff', 0.75, 1.2, -0.6, 1.7, 0.38));
      g.add(cyl(0.3, 0.32, 0.8, 10, lam(0x4a5a66), 0.7, 0.4, 0.2));
      g.add(bx(0.5, 0.6, 0.5, lam(0x2f2f33), 0.85, 0.55, 0.3));
      g.add(cyl(0.07, 0.07, 0.7, 10, lam(0xd94f4f), 1.15, 0.35, 0.1));
      g.add(cyl(0.075, 0.075, 0.12, 10, lam(0xe8e2d2), 1.15, 0.72, 0.1));
      g.add(cyl(0.05, 0.05, 0.55, 10, new THREE.MeshBasicMaterial({ color: 0xffd54f }), -0.6, 2.55, 0.4));
      g.add(bx(0.06, 0.55, 0.06, new THREE.MeshBasicMaterial({ color: 0xff4081 }), -0.6, 2.55, 0.4));
    } else {
      g.add(cyl(0.09, 0.13, 4.2, 8, lam(0x6e6a60), 0, 2.1, 0));
      g.add(bx(1.3, 0.08, 0.08, lam(0x55524a), 0, 3.3, 0));
      g.add(bx(0.6, 0.7, 0.5, lam(0x4a4a4a), 0.35, 2.2, 0));
      g.add(bx(0.1, 0.5, 0.1, lam(0x8a8a8a), 0.62, 2.2, 0));
      g.add(bx(0.3, 0.55, 0.3, lam(0x6f6252), -0.35, 1.6, 0.2));
      var poster2 = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.75),
        new THREE.MeshBasicMaterial({ map: makePosterTexture(), side: THREE.DoubleSide })
      );
      poster2.position.set(-0.2, 1.75, 0.1);
      g.add(poster2);
      var wireMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
      g.add(bx(0.02, 0.02, 1.0, wireMat, 0.3, 3.62, 0.4));
      g.add(bx(0.02, 0.02, 1.2, wireMat, -0.2, 3.7, 0.5));
    }
    return g;
  }

  function buildRiversideProp(kind) {
    var g = new THREE.Group();
    if (kind === 0) {
      g.add(cyl(0.12, 0.16, 2.2, 8, lam(0x6d4c41), 0, 1.1, 0));
      g.add(sph(0.75, lam(0x3d7a3f), 0, 2.9, 0.1));
      g.add(sph(0.55, lam(0x4c8c4e), 0.7, 2.4, -0.2));
      g.add(sph(0.55, lam(0x4c8c4e), -0.7, 2.5, 0.2));
      g.add(sph(0.45, lam(0x2f6b34), 0.1, 2.2, 0.4));
      g.add(sph(0.4, lam(0x5a9c5c), -0.4, 2.15, -0.35));
    } else if (kind === 1) {
      var postMat = lam(0x7f8c8d);
      for (var i = 0; i < 2; i++) {
        g.add(cyl(0.05, 0.05, 1.1, 8, postMat, -0.9 + i * 1.8, 0.55, 0));
      }
      g.add(cyl(0.03, 0.03, 2.0, 8, postMat, 0, 1.0, 0));
      g.add(cyl(0.03, 0.03, 2.0, 8, postMat, 0, 1.0, -0.25));
      g.add(bx(0.05, 0.9, 0.05, postMat, -0.9, 0.9, -0.1));
      g.add(bx(0.05, 0.9, 0.05, postMat, 0.9, 0.9, -0.1));
      g.add(bx(0.05, 0.05, 1.7, postMat, -0.9, 1.25, 0.75));
      g.add(sph(0.45, lam(0x4c8c4e), 1.3, 0.4, 0.3));
    } else if (kind === 2) {
      var legMat = lam(0x9aa0a6);
      g.add(cyl(0.07, 0.07, 3.0, 8, legMat, -0.8, 1.5, -0.5));
      g.add(cyl(0.07, 0.07, 3.0, 8, legMat, 0.8, 1.5, -0.5));
      g.add(cyl(0.07, 0.07, 3.0, 8, legMat, -0.8, 1.5, 0.5));
      g.add(cyl(0.07, 0.07, 3.0, 8, legMat, 0.8, 1.5, 0.5));
      g.add(cyl(0.9, 0.95, 1.3, 12, lam(0x8fb6c9), 0, 3.2, 0));
      g.add(cyl(1.0, 0.02, 0.3, 12, lam(0x7a8a94), 0, 3.95, 0));
      g.add(bx(0.05, 2.8, 0.05, lam(0x6f6252), -0.95, 1.55, 0.5));
      for (var st = 0; st < 5; st++) {
        g.add(bx(0.45, 0.04, 0.04, lam(0x6f6252), -0.72, 0.7 + st * 0.55, 0.5));
      }
    } else {
      var benchMat = lam(0x8a5a33);
      g.add(bx(0.5, 0.08, 1.2, benchMat, 0, 0.5, 0));
      var legMat2 = lam(0x5a5a5a);
      g.add(bx(0.06, 0.45, 0.06, legMat2, -0.2, 0.23, 0.5));
      g.add(bx(0.06, 0.45, 0.06, legMat2, 0.2, 0.23, 0.5));
      g.add(bx(0.06, 0.45, 0.06, legMat2, -0.2, 0.23, -0.5));
      g.add(bx(0.06, 0.45, 0.06, legMat2, 0.2, 0.23, -0.5));
      g.add(cyl(0.06, 0.08, 1.8, 8, lam(0x7f8c8d), 1.2, 0.9, 0));
      g.add(signPlane('河堤慢行', '#2e7d32', '#ffffff', 0.9, 0.5, 1.2, 1.9, 0.03));
      g.add(sph(0.4, lam(0x4c8c4e), -1.3, 0.45, 0.3));
      g.add(bx(0.5, 0.65, 0.05, benchMat, 0, 0.95, 0.28));
      g.add(cyl(0.07, 0.09, 2.0, 8, lam(0x3a3f47), -1.4, 1.0, -0.2));
      g.add(sph(0.12, new THREE.MeshBasicMaterial({ color: 0xfff3b0 }), -1.4, 2.05, -0.2));
    }
    return g;
  }

  function buildNightProp(kind) {
    var g = new THREE.Group();
    var warm = new THREE.MeshBasicMaterial({ color: 0xffd180 });
    var glowRed = new THREE.MeshBasicMaterial({ color: 0xff5a5a });
    var glowCyan = new THREE.MeshBasicMaterial({ color: 0x6fe3ff });
    var woodMat2 = lam(0xffffff, { map: makeWoodTexture() });
    var glowGold = new THREE.MeshBasicMaterial({ color: 0xffd54f });
    var glowPink = new THREE.MeshBasicMaterial({ color: 0xff8ac2 });
    var metalDark2 = lam(0x2a2d33);

    function lantern(x, y, z, color, s) {
      var sc = s || 1;
      var body = new THREE.Mesh(new THREE.SphereGeometry(0.11 * sc, 12, 10), color);
      body.position.set(x, y, z);
      body.castShadow = true;
      g.add(body);
      var top = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * sc, 0.06 * sc, 0.05 * sc, 8), lam(0xc9a227));
      top.position.set(x, y + 0.13 * sc, z);
      g.add(top);
      var tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.012 * sc, 0.012 * sc, 0.22 * sc, 5), glowGold);
      tassel.position.set(x, y - 0.22 * sc, z);
      g.add(tassel);
    }

    function bulbRow(x0, z0, x1, z1, y, n) {
      var line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 5), metalDark2);
      line.rotation.x = Math.PI / 2;
      line.rotation.z = Math.atan2(z1 - z0, x1 - x0);
      line.scale.set(1, 1, Math.sqrt((x1 - x0) * (x1 - x0) + (z1 - z0) * (z1 - z0)));
      line.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
      g.add(line);
      var colors = [warm, glowRed, glowCyan, glowGold, glowPink];
      for (var i = 0; i < n; i++) {
        var t = i / (n - 1);
        g.add(sph(0.035, colors[i % colors.length], x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t));
      }
    }

    function groundGlow(x, z, r, color) {
      var disc = new THREE.Mesh(
        new THREE.CircleGeometry(r, 18),
        new THREE.MeshBasicMaterial({ color: color.color || 0xffd180, transparent: true, opacity: 0.14 })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(x, 0.03, z);
      g.add(disc);
    }
    if (kind === 0) {
      g.add(bx(1.4, 0.9, 0.9, lam(0x6b4f35), 0, 0.45, 0));
      g.add(bx(1.9, 0.09, 1.2, lam(0x8e44ad), 0, 1.66, 0));
      g.add(bx(1.7, 0.05, 1.0, warm, 0, 1.6, 0));
      g.add(bx(0.75, 0.55, 0.5, lam(0x23262e), 0, 0.55, 0.22));
      g.add(bx(0.7, 0.05, 0.45, lam(0x6b3a2e), 0, 0.84, 0.22));
      for (var sk = 0; sk < 5; sk++) {
        g.add(cyl(0.015, 0.015, 0.34, 6, lam(0x9a5a2a), -0.28 + sk * 0.14, 1.03, 0.22));
        g.add(sph(0.022, warm, -0.28 + sk * 0.14, 1.22, 0.22));
      }
      g.add(bx(0.4, 0.05, 0.4, woodMat2, -0.72, 0.35, 0.42));
      g.add(cyl(0.05, 0.05, 0.6, 8, metalDark2, 0.72, 0.3, -0.3));
      g.add(bx(0.5, 0.05, 0.5, woodMat2, 0.72, 0.62, -0.3));
      g.add(signPlane('夜市烧烤', '#ff4081', '#ffffff', 1.0, 0.3, 0, 2.05, 0.6));
      bulbRow(-0.95, 0.5, 0.95, 0.5, 1.85, 6);
      groundGlow(0, 0, 0.9, warm);
    } else if (kind === 1) {
      var poleMat2 = lam(0x3a3f47);
      g.add(cyl(0.05, 0.06, 3.6, 8, poleMat2, -1.1, 1.8, 0));
      g.add(cyl(0.05, 0.06, 3.6, 8, poleMat2, 1.1, 1.8, 0));
      g.add(cyl(0.012, 0.012, 2.2, 6, lam(0x8a8a8a), 0, 3.15, 0.15));
      for (var i = 0; i < 5; i++) {
        lantern(-0.8 + i * 0.4, 3.0, 0.18, glowRed, 1);
      }
      var flagColors = [glowRed, warm, glowCyan, glowPink, glowGold];
      for (var f = 0; f < 8; f++) {
        var tri = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 3), flagColors[f % flagColors.length]);
        tri.rotation.x = Math.PI / 2;
        tri.position.set(-1.0 + f * 0.28, 3.05, 0.15);
        g.add(tri);
      }
      bulbRow(-1.1, 0, 1.1, 0, 3.3, 9);
      groundGlow(0, 0, 1.2, glowRed);
    } else if (kind === 2) {
      g.add(bx(1.7, 2.1, 0.35, lam(0x23262e), 0, 1.0, 0));
      g.add(bx(1.6, 2.0, 0.3, lam(0x1b1e24), 0, 1.0, 0));
      g.add(signPlane('保熟！', '#ffd54f', '#7a1f1f', 1.3, 1.5, 0, 1.0, 0.16));
      g.add(signPlane('夜市', '#ff4081', '#ffffff', 0.7, 0.5, 0, 2.15, 0.17));
      g.add(bx(0.05, 1.6, 0.05, glowRed, -0.78, 1.0, 0.17));
      g.add(bx(0.05, 1.6, 0.05, glowCyan, 0.78, 1.0, 0.17));
      g.add(bx(1.7, 0.06, 0.06, glowGold, 0, 1.95, 0.18));
      g.add(bx(1.7, 0.06, 0.06, glowPink, 0, 0.18, 0.18));
      g.add(bx(1.75, 0.06, 0.06, glowCyan, 0, 2.3, 0.18));
      bulbRow(-0.85, 0.3, 0.85, 0.3, 2.55, 5);
      groundGlow(0, 0, 1.0, glowCyan);
    } else if (kind === 3) {
      // 糖葫芦 / 串串小车
      g.add(bx(1.2, 0.9, 0.8, lam(0x8e44ad), 0, 0.45, 0));
      g.add(bx(1.0, 0.16, 0.7, lam(0x4a2e63), 0, 0.98, 0));
      var glass = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.42, 0.62),
        new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.3 })
      );
      glass.position.set(0, 1.27, 0);
      g.add(glass);
      for (var gg = 0; gg < 5; gg++) {
        var stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), lam(0x9a5a2a));
        stick.position.set(-0.35 + gg * 0.17, 0.72, 0.12);
        g.add(stick);
        for (var bb = 0; bb < 4; bb++) {
          g.add(sph(0.05, glowRed, -0.35 + gg * 0.17, 0.78 + bb * 0.11, 0.12));
        }
      }
      g.add(cyl(0.03, 0.03, 0.9, 8, metalDark2, 0.5, 1.0, -0.3));
      g.add(bx(0.9, 0.05, 0.9, lam(0x8e44ad), 0, 1.5, 0));
      var wheelMat = lam(0x1c1c1c);
      g.add(cyl(0.22, 0.22, 0.08, 12, wheelMat, -0.45, 0.22, 0.3));
      g.add(cyl(0.22, 0.22, 0.08, 12, wheelMat, 0.45, 0.22, 0.3));
      bulbRow(-0.5, 0.45, 0.5, 0.45, 1.75, 5);
      groundGlow(0, 0, 0.8, glowPink);
    } else {
      // 套圈 / 气球摊
      g.add(cyl(0.04, 0.05, 2.2, 8, metalDark2, -0.8, 1.1, 0));
      g.add(cyl(0.04, 0.05, 2.2, 8, metalDark2, 0.8, 1.1, 0));
      g.add(bx(1.75, 0.06, 0.08, lam(0x6f6252), 0, 2.15, 0));
      var ballColors = [glowRed, glowGold, glowCyan, glowPink, warm];
      for (var b2 = 0; b2 < 9; b2++) {
        g.add(sph(0.16, ballColors[b2 % ballColors.length], -0.72 + b2 * 0.18, 2.5 + (b2 % 3) * 0.22, 0.05));
      }
      var ringMat = new THREE.MeshBasicMaterial({ color: 0x8ee6c8, transparent: true, opacity: 0.85 });
      for (var rr = 0; rr < 5; rr++) {
        var ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 18), ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(-0.6 + rr * 0.3, 0.35, 0.25);
        g.add(ring);
      }
      g.add(bx(1.2, 0.05, 0.6, woodMat2, 0, 0.3, 0.25));
      g.add(signPlane('套圈', '#6fe3ff', '#ffffff', 0.8, 0.4, 0, 2.4, 0.1));
      bulbRow(-0.85, 0.4, 0.85, 0.4, 2.35, 7);
      groundGlow(0, 0, 1.1, glowGold);
    }
    return g;
  }

  function buildThemeSideProp(ti) {
    var kind = Math.floor(Math.random() * 4);
    if (ti === 0) return buildMarketProp(kind);
    if (ti === 1) return buildVillageProp(kind);
    if (ti === 2) return buildRiversideProp(kind);
    return buildNightProp(Math.floor(Math.random() * 5));
  }

  function respawnSideProp(prop) {
    var side = Math.random() < 0.5 ? -1 : 1;
    prop.position.set(side * (3.2 + Math.random() * 3.5), 0, -90 - Math.random() * 30);
    prop.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    prop.visible = true;
    prop.userData.active = true;
  }

  for (var i = 0; i < 14; i++) {
    var sp = new THREE.Group();
    sp.userData.active = true;
    sp.userData.themeChildren = [];
    for (var ti = 0; ti < THEMES.length; ti++) {
      var themed = buildThemeSideProp(ti);
      themed.visible = ti === 0;
      sp.add(themed);
      sp.userData.themeChildren.push(themed);
    }
    scene.add(sp);
    sideProps.push(sp);
    sp.position.set(0, 0, 0);
    respawnSideProp(sp);
  }

  /* ---------------- 路边一家三口 ---------------- */
  var familyGroups = [];

  function buildFamilyGroup() {
    var g = new THREE.Group();
    var father = window.Runners.createFamilyMember('father');
    var mother = window.Runners.createFamilyMember('mother');
    var daughter = window.Runners.createFamilyMember('daughter');
    father.position.set(-0.55, 0, 0);
    daughter.position.set(0, 0, 0);
    mother.position.set(0.55, 0, 0);
    g.add(father);
    g.add(daughter);
    g.add(mother);
    g.userData = {
      father: father,
      mother: mother,
      daughter: daughter,
      triggered: false,
      waveT: 0,
    };
    return g;
  }

  function resetFamilyPose(group) {
    group.userData.waveT = 0;
    var f = group.userData.father;
    if (!f || !f.userData) return;
    if (f.userData.rightArm) f.userData.rightArm.rotation.set(0, 0, 0);
    if (f.userData.leftArm) f.userData.leftArm.rotation.set(0, 0, 0);
    if (f.userData.head) f.userData.head.rotation.y = 0;
    if (f.userData.mouthClosed) f.userData.mouthClosed.visible = true;
    if (f.userData.mouthOpen) f.userData.mouthOpen.visible = false;
  }

  function respawnFamily(group) {
    var side = Math.random() < 0.5 ? -1 : 1;
    var x = side * (CONFIG.familySideX[0] + Math.random() * (CONFIG.familySideX[1] - CONFIG.familySideX[0]));
    group.position.set(x, 0, CONFIG.familySpawnZ);
    group.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    group.userData.triggered = false;
    group.visible = true;
    resetFamilyPose(group);
  }

  function checkFamilyPass() {
    if (P.mode !== 'run' || S.mode !== 'playing') return;
    for (var i = 0; i < familyGroups.length; i++) {
      var grp = familyGroups[i];
      if (!grp.visible || grp.userData.triggered) continue;
      if (Math.abs(grp.position.z - chaser.position.z) > CONFIG.familyTriggerZone) continue;
      grp.userData.triggered = true;
      grp.userData.waveT = CONFIG.familyWaveTime;
      window.AppAudio.playVoice('aihuaqiang');
      showBubble('哎华强！', true);
      S.nextFamilyDist = S.dist + randInt(CONFIG.familySpawnGap[0], CONFIG.familySpawnGap[1], Math.random);
    }
  }

  function updateFamilyWave(dt) {
    for (var i = 0; i < familyGroups.length; i++) {
      var grp = familyGroups[i];
      if (grp.userData.waveT <= 0) continue;
      grp.userData.waveT -= dt;
      var f = grp.userData.father;
      if (f && f.userData) {
        if (f.userData.rightArm) {
          f.userData.rightArm.rotation.z = -1.1 + Math.sin(S.time * 18) * 0.15;
          f.userData.rightArm.rotation.x = -0.35;
        }
        if (f.userData.head) f.userData.head.rotation.y = 0.45;
        if (f.userData.mouthClosed) f.userData.mouthClosed.visible = false;
        if (f.userData.mouthOpen) f.userData.mouthOpen.visible = true;
      }
      if (grp.userData.waveT <= 0) resetFamilyPose(grp);
    }
  }

  for (var fi = 0; fi < 1; fi++) {
    var fg = buildFamilyGroup();
    scene.add(fg);
    familyGroups.push(fg);
    respawnFamily(fg);
  }

  /* ---------------- 角色 ---------------- */
  function makeNameTag(text, bg, fg) {
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 96;
    var ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 248, 88);
    ctx.fillStyle = fg;
    ctx.font = 'bold 60px "Microsoft YaHei", "SimHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 54);
    var mat = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      depthTest: false,
    });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.5, 0.55, 1);
    return sprite;
  }

  function makeSpeechBubble(text) {
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    var ctx = c.getContext('2d');
    function rr(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(104, 116);
    ctx.lineTo(132, 128);
    ctx.lineTo(160, 116);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    rr(20, 8, 216, 110, 22);
    ctx.fill();
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#b71c1c';
    ctx.font = 'bold 40px "Microsoft YaHei", "SimHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 66);
    var mat = new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      depthTest: false,
    });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.6, 0.8, 1);
    return sprite;
  }

  var player = new THREE.Group();
  var playerBody = new THREE.Group();
  var haoGe = window.Runners.createHaoGe();
  haoGe.rotation.y = Math.PI; // 脸朝奔跑方向
  playerBody.add(haoGe);
  player.add(playerBody);
  var haogeTag = makeNameTag('郝哥', '#fff8e1', '#b71c1c');
  haogeTag.position.set(0, 2.75, 0);
  player.add(haogeTag);
  var speechBubble = makeSpeechBubble('萨日朗！');
  speechBubble.visible = false;
  player.add(speechBubble);
  scene.add(player);

  var chaser = new THREE.Group();
  var chaserBody = new THREE.Group();
  var huaQiang = window.Runners.createHuaQiang();
  huaQiang.rotation.y = Math.PI; // 脸朝奔跑方向
  chaserBody.add(huaQiang);
  chaser.add(chaserBody);
  var huaqiangTag = makeNameTag('华强', '#b71c1c', '#ffffff');
  huaqiangTag.position.set(0, 2.75, 0);
  chaser.add(huaqiangTag);
  chaser.position.set(0, 0, 3.5); // 华强在郝哥后面（镜头这边）
  scene.add(chaser);

  // 小弟：结束演出时跑过来从身后抱住郝哥
  var xiaoDi = new THREE.Group();
  var xiaoDiBody = new THREE.Group();
  var xiaoDiModel = window.Runners.createXiaoDi();
  xiaoDiModel.rotation.y = Math.PI;
  xiaoDiBody.add(xiaoDiModel);
  xiaoDi.add(xiaoDiBody);
  var xiaoDiTag = makeNameTag('小弟', '#37474f', '#ffffff');
  xiaoDiTag.position.set(0, 2.75, 0);
  xiaoDi.add(xiaoDiTag);
  xiaoDi.visible = false;
  scene.add(xiaoDi);

  var skillSidekick = window.Runners.createXiaoDi();
  skillSidekick.scale.set(1.15, 1.15, 1.15);
  var skillHammer = window.Runners.createIronHammer();
  skillHammer.position.set(0, -0.34, 0.03);
  if (skillSidekick.userData && skillSidekick.userData.elbows && skillSidekick.userData.elbows[1]) {
    skillSidekick.userData.elbows[1].add(skillHammer);
    skillSidekick.userData.hammer = skillHammer;
  }
  var skillSidekickTag = makeNameTag('小弟', '#ff8f00', '#ffffff');
  skillSidekickTag.position.set(0, 2.9, 0);
  skillSidekick.add(skillSidekickTag);
  skillSidekick.visible = false;
  scene.add(skillSidekick);

  var sidekickRingMat = new THREE.MeshBasicMaterial({
    color: 0xffd54f,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  var sidekickRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.065, 8, 24), sidekickRingMat);
  sidekickRing.rotation.x = -Math.PI / 2;
  sidekickRing.visible = false;
  scene.add(sidekickRing);

  // 电动车：华强逃跑座驾
  var scooter = window.Runners.createElectricScooter();
  scooter.visible = false;
  scene.add(scooter);

  // 精细模型替换：assets/ 下有 haoge.glb / huaqiang.glb 时自动加载
  if (window.RunnerModels && window.RunnerModels.loadRunner) {
    window.RunnerModels.loadRunner(haoGe, 'haoge', { height: 2.2 });
    window.RunnerModels.loadRunner(huaQiang, 'huaqiang', { height: 2.5 });
    window.RunnerModels.loadRunner(xiaoDiModel, 'xiaodi', { height: 2.15 });
    window.RunnerModels.loadRunner(skillSidekick, 'xiaodi', { height: 2.15 });
  }

  var P = {
    lane: 1,
    x: 0,
    y: 0,
    vy: 0,
    jumps: 0,
    grounded: true,
    sliding: false,
    slideTimer: 0,
    airSlideT: 0,
    legTuckT: 0,
    prevY: 0,
    mode: 'run',
    fallTimer: 0,
    invuln: 0,
  };

  /* ---------------- 劈瓜演出状态 ---------------- */
  var PIGUA = {
    active: false,
    t: 0,
    guard: 0,
    flinch: 0,
    target: null,
    melon: null,
    parent: null,
    startX: 0,
    startZ: 0,
    splitDone: false,
    splitT: 0,
    returning: false,
    fromX: 0,
    fromZ: 0,
    wayX: 0,
    wayZ: 0,
    juice: [],
  };

  /* ---------------- 池子 ---------------- */
  var obstacles = [];
  var pickups = [];

  /* ---------------- 保熟卡演出特效 ---------------- */
  var GOLD_BURST = 24;
  var burstGeo = new THREE.BufferGeometry();
  var burstPos = new Float32Array(GOLD_BURST * 3);
  var burstVel = new Float32Array(GOLD_BURST * 3);
  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
  var burstMat = new THREE.PointsMaterial({
    color: 0xffd54f,
    size: 0.14,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  var burstPoints = new THREE.Points(burstGeo, burstMat);
  burstPoints.visible = false;
  scene.add(burstPoints);
  var burstT = 0;

  var DUST_COUNT = 16;
  var dustGeo = new THREE.BufferGeometry();
  var dustPos = new Float32Array(DUST_COUNT * 3);
  var dustVel = new Float32Array(DUST_COUNT * 3);
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  var dustMat = new THREE.PointsMaterial({
    color: 0x8a6d4d,
    size: 0.18,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  var dustPoints = new THREE.Points(dustGeo, dustMat);
  dustPoints.visible = false;
  scene.add(dustPoints);
  var dustT = 0;

  /* ---------------- 结束演出：先喷后滴 + 浸染 + 血泊 ---------------- */
  var BLOOD_SPRAY = 500;
  var bloodGeo = new THREE.BufferGeometry();
  var bloodPos = new Float32Array(BLOOD_SPRAY * 3);
  var bloodVel = new Float32Array(BLOOD_SPRAY * 3);
  bloodGeo.setAttribute('position', new THREE.BufferAttribute(bloodPos, 3));
  var bloodMat = new THREE.PointsMaterial({
    color: 0xff2b2b,
    size: 0.34,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  var bloodPoints = new THREE.Points(bloodGeo, bloodMat);
  bloodPoints.visible = false;
  scene.add(bloodPoints);
  var bloodT = 0;
  var bloodFountainT = 0;

  var DRIP_COUNT = 14;
  var dripGeo = new THREE.BufferGeometry();
  var dripPos = new Float32Array(DRIP_COUNT * 3);
  var dripVel = new Float32Array(DRIP_COUNT * 3);
  var dripLife = new Float32Array(DRIP_COUNT);
  dripGeo.setAttribute('position', new THREE.BufferAttribute(dripPos, 3));
  var dripMat = new THREE.PointsMaterial({
    color: 0xb71c1c,
    size: 0.075,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  var dripPoints = new THREE.Points(dripGeo, dripMat);
  dripPoints.visible = false;
  scene.add(dripPoints);

  function makeBloodStainTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    var spots = [
      [64, 64, 44, '#7c1010', 0.95],
      [58, 58, 34, '#a31313', 0.85],
      [70, 68, 26, '#d02424', 0.7],
      [62, 66, 18, '#5c0c0c', 0.9],
    ];
    for (var si = 0; si < spots.length; si++) {
      var sp2 = spots[si];
      ctx.globalAlpha = sp2[4];
      ctx.fillStyle = sp2[3];
      ctx.beginPath();
      ctx.ellipse(sp2[0], sp2[1], sp2[2], sp2[2] * 0.78, (si - 1.2) * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    return new THREE.CanvasTexture(c);
  }

  var bloodStainMat = new THREE.MeshBasicMaterial({
    map: makeBloodStainTexture(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  var bloodStain = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.34), bloodStainMat);
  bloodStain.position.set(0, 0.95, 0.155);
  bloodStain.visible = false;
  haoGe.add(bloodStain);
  var bloodStainT = -1;

  var bloodJetMat = new THREE.MeshBasicMaterial({
    color: 0xff2222,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  var bloodJet = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, CONFIG.bloodJetHeight, 10), bloodJetMat);
  bloodJet.position.set(0, 1.08 + CONFIG.bloodJetHeight / 2, 0.15);
  bloodJet.visible = false;
  haoGe.add(bloodJet);

  var bloodPoolMat = new THREE.MeshBasicMaterial({
    color: 0x8e1414,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  var bloodPool = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), bloodPoolMat);
  bloodPool.rotation.x = -Math.PI / 2;
  bloodPool.visible = false;
  scene.add(bloodPool);
  var bloodPoolT = -1;

  var bloodRingMat = new THREE.MeshBasicMaterial({
    color: 0xe53935,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  var bloodRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.055, 8, 26), bloodRingMat);
  bloodRing.rotation.x = -Math.PI / 2;
  bloodRing.visible = false;
  scene.add(bloodRing);
  var bloodRingT = 0;

  var fxCard = window.Obstacles.createCert();
  fxCard.visible = false;
  scene.add(fxCard);
  var fxCardT = 0;
  var fxCardY = 0;

  var ringMat = new THREE.MeshBasicMaterial({
    color: 0xffd54f,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  var ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.05, 8, 28), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);

  var shockMat = new THREE.MeshBasicMaterial({
    color: 0xfff59d,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  var shock = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 8, 32), shockMat);
  shock.rotation.x = -Math.PI / 2;
  shock.visible = false;
  scene.add(shock);
  var shockT = 0;
  var sarilangFxT = 0;

  /* ---------------- 劈瓜预警：目标感叹号 + 红圈 ---------------- */
  var piguaWarnRingMat = new THREE.MeshBasicMaterial({
    color: 0xe53935,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  var piguaWarnRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 24), piguaWarnRingMat);
  piguaWarnRing.rotation.x = -Math.PI / 2;
  piguaWarnRing.visible = false;
  scene.add(piguaWarnRing);

  function makePiguaWarnTexture() {
    var c = document.createElement('canvas');
    c.width = 128;
    c.height = 160;
    var x = c.getContext('2d');
    x.clearRect(0, 0, 128, 160);
    x.fillStyle = 'rgba(255, 59, 48, 0.94)';
    x.strokeStyle = '#ffffff';
    x.lineWidth = 8;
    x.beginPath();
    x.arc(64, 64, 56, 0, Math.PI * 2);
    x.fill();
    x.stroke();
    x.fillStyle = '#ffffff';
    x.font = 'bold 120px "Microsoft YaHei", "SimHei", sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('!', 64, 92);
    return new THREE.CanvasTexture(c);
  }

  var piguaWarnMat = new THREE.MeshBasicMaterial({
    map: makePiguaWarnTexture(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  var piguaWarnSprite = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.65), piguaWarnMat);
  piguaWarnSprite.visible = false;
  scene.add(piguaWarnSprite);

  var OBSTACLE_FACTORIES = {
    cart: window.Obstacles.createCart,
    pole: window.Obstacles.createPole,
    stall: window.Obstacles.createStall,
    pile: window.Obstacles.createPile,
    person: window.Obstacles.createPerson,
    tricycle: window.Obstacles.createTricycle,
  };

  function poolGet(pool, kind, factory) {
    for (var i = 0; i < pool.length; i++) {
      if (!pool[i].userData.active && pool[i].userData.kind === kind) return pool[i];
    }
    var obj = factory();
    obj.userData.active = false;
    obj.visible = false;
    scene.add(obj);
    pool.push(obj);
    return obj;
  }

  function resetPersonPose(o) {
    o.position.y = 0;
    var u = o.userData;
    u.scareT = 0;
    if (u.leftArm) u.leftArm.rotation.z = 0.35;
    if (u.rightArm) u.rightArm.rotation.z = -0.35;
    if (u.head) {
      u.head.rotation.x = 0;
      u.head.rotation.z = 0;
    }
    if (window.Obstacles.setPersonFace) window.Obstacles.setPersonFace(o, false);
  }

  function poolPut(pool, obj) {
    if (obj.userData.splitParts && obj.userData.splitParts.length) {
      if (obj.userData.splitTarget) obj.userData.splitTarget.visible = true;
      for (var i = 0; i < obj.userData.splitParts.length; i++) {
        var part = obj.userData.splitParts[i];
        if (part.parent === obj) obj.remove(part);
      }
      obj.userData.splitParts = [];
      obj.userData.splitTarget = null;
    }
    obj.userData.sarilangRolled = false;
    obj.userData.scareT = 0;
    obj.userData.goldLine = false;
    if (obj.userData.kind === 'person') resetPersonPose(obj);
    obj.userData.active = false;
    obj.userData.piguaTarget = false;
    obj.userData.piguaRolled = false;
    obj.visible = false;
  }

  /* ---------------- 状态 ---------------- */
  var S = {
    mode: 'menu',
    speed: 0,
    dist: 0,
    themeFrom: 0,
    themeTo: 0,
    themeBlend: 1,
    score: 0,
    melons: 0,
    golds: 0,
    goldCombo: 0,
    goldComboT: 0,
    certs: 0,
    cards: 0,
    gap: CONFIG.startGap,
    seenKinds: {},
    nextCertDist: 0,
    certSupplyResumeDist: 0,
    nextFamilyDist: CONFIG.familySpawnStart,
    nextGoldLineDist: CONFIG.goldLineGuaranteeMeters,
    dangerWarnCd: 0,
    hitCount: 0,
    sarilangCount: 0,
    skillsUsed: 0,
    cardsMax: 0,
    camIntroT: 0,
    camBlendT: 0,
    camBlendShown: false,
    spawnIn: 0,
    nextGap: 20,
    lastPole: false,
    lastStall: false,
    deathT: 0,
    deathOverShown: false,
    deathScream: false,
    deathSarilang: false,
    deathEnding: false,
    deathBlood: false,
    deathDrip: false,
    deathBlood2: false,
    deathSmirk: false,
    deathSkipped: false,
    canSkipEnding: false,
    deathFromX: 0,
    deathFromZ: 0,
    bubbleTimer: 3,
    sarilangCooldown: 0,
    headTurnT: 0,
    headTurnDir: 1,
    piguaHeadDir: 1,
    slowmo: 0,
    skillT: 0,
    lastChanceT: 0,
    pushPoseT: 0,
    speedBoostT: 0,
    skillFxT: 0,
    chaserZOff: 0,
    chaserHitT: 0,
    chaserHitMax: 0,
    chaserFlyT: 0,
    chaserFlyMax: 0,
    chaserFlyDelay: 0,
    chaserFlyFromX: null,
    chaserFlyFromZ: null,
    chaserFlyLand: false,
    chaserFlyDir: 1,
    chaserReturnT: 0,
    chaserReturnDir: 1,
    sidekickT: 0,
    sidekickStartX: 0,
    sidekickStartZ: 0,
    sidekickHitX: 0,
    sidekickHitZ: 0,
    sidekickDir: 1,
    sidekickHitFx: false,
    tipsShown: {},
    tipTimer: 0,
    tipsEnabled: false,
    shake: 0,
    flash: 0,
    best: 0,
    time: 0,
  };

  /* ---------------- UI ---------------- */
  function $(id) { return document.getElementById(id); }

  var el = {
    hud: $('hud'),
    score: $('score'),
    dist: $('dist'),
    melons: $('melons'),
    speed: $('speed'),
    best: $('best'),
    muteBtn: $('muteBtn'),
    pauseBtn: $('pauseBtn'),
    pauseScreen: $('pauseScreen'),
    resumeBtn: $('resumeBtn'),
    pauseRestartBtn: $('pauseRestartBtn'),
    bubble: $('bubble'),
    vignette: $('vignette'),
    startScreen: $('startScreen'),
    overScreen: $('overScreen'),
    bestStart: $('bestStart'),
    startBtn: $('startBtn'),
    overScore: $('overScore'),
    overDist: $('overDist'),
    overMelons: $('overMelons'),
    overBest: $('overBest'),
    newRecord: $('newRecord'),
    restartBtn: $('restartBtn'),
    introScreen: $('introScreen'),
    introNext: $('introNext'),
    introSkip: $('introSkip'),
    introReplay: $('introReplay'),
    introSteps: document.querySelectorAll('.story-step'),
    tipBox: $('tipBox'),
    tipReplay: $('tipReplay'),
    skipBtn: $('skipBtn'),
    skipHint: $('skipHint'),
    iconMelon: $('iconMelon'),
    iconGold: $('iconGold'),
    iconCert: $('iconCert'),
    skillSlots: $('skillSlots'),
    skillBtn: $('skillBtn'),
    invulnTag: $('invulnTag'),
    goldFlash: $('goldFlash'),
    chaseFill: $('chaseFill'),
    eggBtn: $('eggBtn'),
    eggModal: $('eggModal'),
    eggGrid: $('eggGrid'),
    eggClose: $('eggClose'),
    eggProgress: $('eggProgress'),
    eggToast: $('eggToast'),
    helpBtn: $('helpBtn'),
    helpModal: $('helpModal'),
    helpClose: $('helpClose'),
    pauseEggBtn: $('pauseEggBtn'),
    pauseHelpBtn: $('pauseHelpBtn'),
  };

  /* ---------------- 彩蛋图鉴 ---------------- */
  var EGGS = [
    { id: 'dist100', name: '初出茅庐', desc: '单局跑过 100 米' },
    { id: 'dist500', name: '小有成绩', desc: '单局跑过 500 米' },
    { id: 'noHit300', name: '无伤开局', desc: '前 300 米一次都没撞' },
    { id: 'cards3', name: '卡牌大师', desc: '一局集满 2 张保熟卡' },
    { id: 'skill3', name: '技能达人', desc: '一局释放 3 次保熟技能' },
    { id: 'guard', name: '摔了一跤', desc: '第一次撞到障碍物' },
    { id: 'tricycle', name: '三轮车杀手', desc: '遇到横穿三轮车' },
    { id: 'sarilang', name: '郝哥惊叫', desc: '路过大妈时郝哥喊萨日朗' },
    { id: 'best3000', name: '高分榜', desc: '历史最高分达到 1000' },
    { id: 'dist1000', name: '十里长街', desc: '单局跑过 1000 米' },
    { id: 'dist2000', name: '瓜摊战神', desc: '单局跑过 2000 米' },
    { id: 'hitEarly100', name: '开局不利', desc: '前 100 米撞到 2 个障碍物' },
    { id: 'hitMany5', name: '身经百撞', desc: '一局撞到 5 个障碍物' },
    { id: 'sarilang3', name: '萨日朗大合唱', desc: '一局对 3 位大妈喊萨日朗' },
    { id: 'goldCombo3', name: '金瓜连珠', desc: '一局连续吃到 3 个金西瓜' },
  ];
  var eggState = {};
  try { eggState = JSON.parse(localStorage.getItem('haoge_eggs') || '{}'); } catch (e) {}
  var eggToastTimer = null;

  function saveEggs() {
    try { localStorage.setItem('haoge_eggs', JSON.stringify(eggState)); } catch (e) {}
  }

  function showEggToast(name) {
    el.eggToast.textContent = '彩蛋解锁：' + name;
    if (eggToastTimer) {
      clearTimeout(eggToastTimer);
      eggToastTimer = null;
    }
    el.eggToast.classList.remove('hidden');
    el.eggToast.classList.remove('show');
    requestAnimationFrame(function () {
      el.eggToast.classList.add('show');
    });
    eggToastTimer = setTimeout(function () {
      el.eggToast.classList.remove('show');
      eggToastTimer = setTimeout(function () {
        el.eggToast.classList.add('hidden');
        eggToastTimer = null;
      }, 300);
    }, 2200);
  }

  function unlockEgg(id) {
    if (eggState[id]) return false;
    eggState[id] = true;
    saveEggs();
    for (var i = 0; i < EGGS.length; i++) {
      if (EGGS[i].id === id) {
        showEggToast(EGGS[i].name);
        break;
      }
    }
    return true;
  }

  function openEggModal() {
    el.eggGrid.innerHTML = '';
    var unlockedCount = 0;
    for (var i = 0; i < EGGS.length; i++) {
      var e = EGGS[i];
      var unlocked = !!eggState[e.id];
      if (unlocked) unlockedCount++;
      var div = document.createElement('div');
      div.className = 'egg-item' + (unlocked ? '' : ' locked');
      div.innerHTML = '<div class="egg-name">' + (unlocked ? '🍉 ' : '❓ ') + e.name + '</div>' +
        '<div class="egg-desc">' + e.desc + '</div>' +
        '<div class="egg-status">' + (unlocked ? '已收集' : '未收集') + '</div>';
      el.eggGrid.appendChild(div);
    }
    el.eggProgress.textContent = '已收集 ' + unlockedCount + ' / ' + EGGS.length;
    show('eggModal');
  }

  function openHelpModal() {
    show('helpModal');
  }

  function closeHelpModal() {
    hide('helpModal');
  }

  // 道具介绍图标（程序绘制 PNG）
  function drawIcon(kind) {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var x = c.getContext('2d');
    if (kind === 'melon') {
      x.fillStyle = '#2e8b3d';
      x.beginPath(); x.arc(32, 34, 24, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#1d5c28';
      x.lineWidth = 4;
      for (var i = -2; i <= 2; i++) {
        x.beginPath();
        x.moveTo(32 + i * 8 - 20, 34 - 20);
        x.quadraticCurveTo(32 + i * 8, 16, 32 + i * 8 + 20, 34 - 20);
        x.stroke();
      }
      x.fillStyle = '#4caf50';
      x.beginPath(); x.arc(24, 25, 6, 0, Math.PI * 2); x.fill();
    } else if (kind === 'gold') {
      var grad = x.createRadialGradient(24, 24, 4, 32, 32, 26);
      grad.addColorStop(0, '#fff3b0');
      grad.addColorStop(1, '#e0a800');
      x.fillStyle = grad;
      x.beginPath(); x.arc(32, 32, 24, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#b8860b';
      x.lineWidth = 2;
      x.stroke();
      x.fillStyle = '#fff8dc';
      x.beginPath(); x.arc(24, 22, 4, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(44, 43, 3, 0, Math.PI * 2); x.fill();
    } else {
      // 保熟卡
      x.fillStyle = '#c9a227';
      x.fillRect(8, 14, 48, 40);
      x.strokeStyle = '#8a6a14';
      x.lineWidth = 2;
      x.strokeRect(8, 14, 48, 40);
      x.fillStyle = '#d94f4f';
      x.fillRect(8, 8, 48, 10);
      x.fillStyle = '#fff8e1';
      x.font = 'bold 15px "Microsoft YaHei", "SimHei", sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('保熟', 32, 40);
      x.fillStyle = '#b71c1c';
      x.beginPath(); x.arc(47, 46, 6, 0, Math.PI * 2); x.fill();
    }
    return c.toDataURL('image/png');
  }

  function show(id) { el[id].classList.remove('hidden'); }
  function hide(id) { el[id].classList.add('hidden'); }

  var introStep = 0;
  function showIntro() {
    introStep = 0;
    for (var i = 0; i < el.introSteps.length; i++) {
      el.introSteps[i].classList.toggle('hidden', i !== 0);
    }
    el.introNext.textContent = '下一步';
    show('introScreen');
  }

  function advanceIntro() {
    introStep++;
    if (introStep >= el.introSteps.length) {
      finishIntro(true);
      return;
    }
    for (var i = 0; i < el.introSteps.length; i++) {
      el.introSteps[i].classList.toggle('hidden', i !== introStep);
    }
    if (introStep === el.introSteps.length - 1) el.introNext.textContent = '开跑！';
  }

  function finishIntro(startNow) {
    hide('introScreen');
    try { localStorage.setItem('haoge_intro_seen', '1'); } catch (e) {}
    if (startNow) startGame();
  }

  var tipTimerId = null;
  function hideTip() {
    if (el.tipBox) el.tipBox.classList.add('hidden');
  }

  function maybeTip(id, text) {
    if (S.tipsShown[id] || S.mode !== 'playing') return;
    S.tipsShown[id] = true;
    el.tipBox.textContent = text;
    el.tipBox.classList.remove('hidden');
    if (tipTimerId) clearTimeout(tipTimerId);
    tipTimerId = setTimeout(hideTip, CONFIG.tipShowTime * 1000);
  }

  function calcScore() {
    return Math.floor(S.dist / CONFIG.distScoreDivisor) +
      S.melons * CONFIG.melonScore +
      S.golds * CONFIG.goldMelonScore +
      S.certs * CONFIG.certScore;
  }

  function updateHUD() {
    if (el.invulnTag) {
      el.invulnTag.classList.toggle('hidden', !(P.invuln > 0 || S.skillT > 0));
    }
    el.score.textContent = S.score;
    el.dist.textContent = Math.floor(S.dist);
    el.melons.textContent = S.melons;
    el.speed.textContent = Math.floor(Math.min(CONFIG.maxSpeed, S.speed + (S.speedBoostT > 0 ? CONFIG.skillBoostSpeed : 0)));
    el.best.textContent = S.best;
    if (el.chaseFill) {
      var gapNorm = Math.max(0, Math.min(1, (S.gap - CONFIG.catchGap) / (CONFIG.startGap - CONFIG.catchGap)));
      el.chaseFill.style.width = Math.round(gapNorm * 100) + '%';
      el.chaseFill.style.background = S.gap > CONFIG.dangerGap ? '#4ade80' : (S.gap > CONFIG.catchGap + 0.8 ? '#facc15' : '#ef4444');
    }
  }

  function updateSkillHUD() {
    var slots = el.skillSlots.children;
    for (var i = 0; i < slots.length; i++) {
      slots[i].classList.toggle('filled', i < S.cards);
    }
    el.skillBtn.disabled = S.cards <= 0;
  }

  var goldFlashTimer = null;
  function flashGold() {
    el.goldFlash.style.opacity = '0.85';
    if (goldFlashTimer) clearTimeout(goldFlashTimer);
    goldFlashTimer = setTimeout(function () { el.goldFlash.style.opacity = '0'; }, 130);
  }

  function spawnBurst(x, y, z) {
    for (var i = 0; i < GOLD_BURST; i++) {
      burstPos[i * 3] = x + (Math.random() - 0.5) * 0.3;
      burstPos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.3;
      burstPos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3;
      burstVel[i * 3] = (Math.random() - 0.5) * 3.2;
      burstVel[i * 3 + 1] = 1.2 + Math.random() * 1.6;
      burstVel[i * 3 + 2] = (Math.random() - 0.5) * 3.2;
    }
    burstGeo.attributes.position.needsUpdate = true;
    burstPoints.visible = true;
    burstMat.opacity = 0.95;
    burstT = 0.85;
  }

  function spawnDust(x, y, z) {
    for (var i = 0; i < DUST_COUNT; i++) {
      dustPos[i * 3] = x + (Math.random() - 0.5) * 0.8;
      dustPos[i * 3 + 1] = y + Math.random() * 0.12;
      dustPos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.8;
      dustVel[i * 3] = (Math.random() - 0.5) * 3.2;
      dustVel[i * 3 + 1] = 0.4 + Math.random() * 1.3;
      dustVel[i * 3 + 2] = (Math.random() - 0.5) * 3.2;
    }
    dustGeo.attributes.position.needsUpdate = true;
    dustPoints.visible = true;
    dustMat.opacity = 0.9;
    dustT = 0.7;
  }

  function spawnBloodSpray(x, y, z) {
    for (var i = 0; i < BLOOD_SPRAY; i++) {
      bloodPos[i * 3] = x + (Math.random() - 0.5) * 0.06;
      bloodPos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.05;
      bloodPos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.05;
      bloodVel[i * 3] = (Math.random() - 0.5) * 2.8;
      bloodVel[i * 3 + 1] = 4.0 + Math.random() * 4.5;
      bloodVel[i * 3 + 2] = 1.0 + Math.random() * 1.4;
    }
    bloodGeo.attributes.position.needsUpdate = true;
    bloodPoints.visible = true;
    bloodMat.opacity = 1;
    bloodT = CONFIG.bloodSprayTotal;
  }

  function resetBloodDrips(x, y, z) {
    for (var i = 0; i < DRIP_COUNT; i++) {
      dripPos[i * 3] = x + (Math.random() - 0.5) * 0.2;
      dripPos[i * 3 + 1] = y - Math.random() * 0.16;
      dripPos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.08;
      dripVel[i * 3] = (Math.random() - 0.5) * 0.18;
      dripVel[i * 3 + 1] = -0.25 - Math.random() * 0.3;
      dripVel[i * 3 + 2] = (Math.random() - 0.5) * 0.18;
      dripLife[i] = 0.45 + Math.random() * 0.75;
    }
    dripGeo.attributes.position.needsUpdate = true;
    dripPoints.visible = true;
    dripMat.opacity = 1;
  }

  function startFxCard(x, y, z) {
    fxCard.position.set(x, y, z);
    fxCard.visible = true;
    fxCard.scale.set(0.4, 0.4, 0.4);
    fxCard.rotation.set(0, 0, 0);
    fxCardT = 0.9;
    fxCardY = y;
  }

  function startShock(x, y, z) {
    shock.position.set(x, y, z);
    shock.visible = true;
    shock.scale.set(0.5, 1, 0.5);
    shockMat.opacity = 0.9;
    shockT = 0.7;
  }

  function fxTick(dt) {
    if (burstT > 0) {
      burstT -= dt;
      for (var i = 0; i < GOLD_BURST; i++) {
        burstVel[i * 3 + 1] -= 3.2 * dt;
        burstPos[i * 3] += burstVel[i * 3] * dt;
        burstPos[i * 3 + 1] += burstVel[i * 3 + 1] * dt;
        burstPos[i * 3 + 2] += burstVel[i * 3 + 2] * dt;
      }
      burstGeo.attributes.position.needsUpdate = true;
      burstMat.opacity = Math.max(0, (burstT / 0.85) * 0.95);
      if (burstT <= 0) burstPoints.visible = false;
    }
    if (dustT > 0) {
      dustT -= dt;
      for (var di = 0; di < DUST_COUNT; di++) {
        dustVel[di * 3 + 1] -= 3.0 * dt;
        dustPos[di * 3] += dustVel[di * 3] * dt;
        dustPos[di * 3 + 1] += dustVel[di * 3 + 1] * dt;
        dustPos[di * 3 + 2] += dustVel[di * 3 + 2] * dt;
      }
      dustGeo.attributes.position.needsUpdate = true;
      dustMat.opacity = Math.max(0, (dustT / 0.7) * 0.9);
      if (dustT <= 0) dustPoints.visible = false;
    }
    bloodFountainT = Math.max(0, bloodFountainT - dt);
    if (bloodFountainT > 0) {
      var jetK = bloodFountainT / CONFIG.bloodFountainTime;
      bloodJet.visible = true;
      bloodJetMat.opacity = 0.9 * jetK;
      bloodJet.scale.set(1.2, 1 + jetK * CONFIG.bloodJetGrow, 1.2);
    } else {
      bloodJet.visible = false;
      bloodJetMat.opacity = 0;
    }
    if (bloodT > 0) {
      bloodT -= dt;
      if (S.deathBlood && S.mode === 'gameover' && bloodFountainT > 0) {
        for (var bj = 0; bj < CONFIG.bloodFountainPerFrame; bj++) {
          var bi2 = Math.floor(Math.random() * BLOOD_SPRAY);
          bloodPos[bi2 * 3] = player.position.x + (Math.random() - 0.5) * 0.06;
          bloodPos[bi2 * 3 + 1] = player.position.y + 1.08 + Math.random() * 0.1;
          bloodPos[bi2 * 3 + 2] = player.position.z + 0.15;
          bloodVel[bi2 * 3] = (Math.random() - 0.5) * 2.8;
          bloodVel[bi2 * 3 + 1] = 4.0 + Math.random() * 5.0;
          bloodVel[bi2 * 3 + 2] = 1.0 + Math.random() * 1.2;
        }
      }
      for (var bi = 0; bi < BLOOD_SPRAY; bi++) {
        bloodVel[bi * 3 + 1] -= CONFIG.bloodFountainGravity * dt;
        bloodPos[bi * 3] += bloodVel[bi * 3] * dt;
        bloodPos[bi * 3 + 1] += bloodVel[bi * 3 + 1] * dt;
        bloodPos[bi * 3 + 2] += bloodVel[bi * 3 + 2] * dt;
      }
      bloodGeo.attributes.position.needsUpdate = true;
      bloodMat.opacity = Math.max(0, bloodT / CONFIG.bloodSprayTotal);
      if (bloodT <= 0) bloodPoints.visible = false;
    }
    if (S.deathDrip && S.mode === 'gameover') {
      for (var di = 0; di < DRIP_COUNT; di++) {
        dripLife[di] -= dt;
        dripVel[di * 3 + 1] -= 4.5 * dt;
        dripPos[di * 3] += dripVel[di * 3] * dt;
        dripPos[di * 3 + 1] += dripVel[di * 3 + 1] * dt;
        dripPos[di * 3 + 2] += dripVel[di * 3 + 2] * dt;
        if (dripLife[di] <= 0) {
          dripPos[di * 3] = player.position.x + (Math.random() - 0.5) * 0.18;
          dripPos[di * 3 + 1] = player.position.y + 1.04 + Math.random() * 0.14;
          dripPos[di * 3 + 2] = player.position.z + 0.16;
          dripVel[di * 3] = (Math.random() - 0.5) * 0.15;
          dripVel[di * 3 + 1] = -0.2 - Math.random() * 0.3;
          dripVel[di * 3 + 2] = (Math.random() - 0.5) * 0.15;
          dripLife[di] = 0.45 + Math.random() * 0.75;
        }
      }
      dripGeo.attributes.position.needsUpdate = true;
    }
    if (bloodStainT >= 0 && S.mode === 'gameover') {
      bloodStainT += dt;
      var bsp = Math.min(1, bloodStainT / 1.15);
      bloodStain.visible = true;
      bloodStainMat.opacity = 0.3 + bsp * 0.7;
      var bss = 0.5 + bsp * 2.0;
      bloodStain.scale.set(bss, bss, 1);
    }
    if (bloodPoolT >= 0 && S.mode === 'gameover') {
      bloodPoolT += dt;
      var bpp = Math.min(1, bloodPoolT / 3.4);
      bloodPool.visible = true;
      bloodPool.position.set(player.position.x, 0.02, player.position.z + 0.08);
      bloodPoolMat.opacity = 0.12 + bpp * 0.5;
      bloodPool.scale.set(0.4 + bpp * 2.2, 0.4 + bpp * 2.2, 1);
    }
    if (bloodRingT > 0) {
      bloodRingT -= dt;
      var brt = 1 - Math.max(0, bloodRingT) / 0.6;
      bloodRing.position.set(player.position.x, 0.07, player.position.z + 0.15);
      bloodRing.scale.set(0.5 + brt * 3.2, 1, 0.5 + brt * 3.2);
      bloodRingMat.opacity = Math.max(0, 0.9 * (1 - brt));
      if (bloodRingT <= 0) bloodRing.visible = false;
    }
    if (fxCardT > 0) {
      fxCardT -= dt;
      var cp = 1 - Math.max(0, fxCardT) / 0.9;
      fxCard.position.y = fxCardY + easeOut(cp) * 0.95;
      fxCard.rotation.y += dt * 4.5;
      var cs = 0.4 + easeOut(Math.min(1, cp * 1.6)) * 0.7;
      fxCard.scale.set(cs, cs, cs);
      if (fxCardT <= 0) fxCard.visible = false;
    }
    if (S.skillT > 0) {
      ring.visible = true;
      ring.position.x = player.position.x;
      ring.position.z = player.position.z;
      ring.position.y = 0.07;
      ringMat.opacity = 0.45 + Math.sin(S.time * 11) * 0.18;
      ring.rotation.z += dt * 1.5;
    } else if (ring.visible) {
      ringMat.opacity = Math.max(0, ringMat.opacity - dt * 1.2);
      if (ringMat.opacity <= 0) ring.visible = false;
    }
    if (shockT > 0) {
      shockT -= dt;
      var st = 1 - Math.max(0, shockT) / 0.7;
      var ss = 0.6 + easeOut(st) * 3.0;
      shock.scale.set(ss, 1, ss);
      shockMat.opacity = Math.max(0, 0.9 * (1 - st));
      if (shockT <= 0) shock.visible = false;
    }
    if (sarilangFxT > 0) {
      sarilangFxT -= dt;
      var bp = 1 - Math.max(0, sarilangFxT) / 1.3;
      var pop = 1 + 0.18 * Math.max(0, 1 - bp * 8);
      speechBubble.scale.set(1.8 * pop, 0.9 * pop, 1);
      if (sarilangFxT <= 0) speechBubble.visible = false;
    }
    if (S.sidekickT > 0) updateSidekick(dt);
    if (S.sidekickT > 0) {
      var skPulse = 0.5 + 0.5 * Math.sin(S.time * 14);
      sidekickRing.visible = true;
      sidekickRing.position.set(skillSidekick.position.x, 0.05, skillSidekick.position.z);
      sidekickRing.scale.set(1 + skPulse * 0.18, 1, 1 + skPulse * 0.18);
      sidekickRingMat.opacity = 0.85;
    } else {
      sidekickRing.visible = false;
      sidekickRingMat.opacity = 0;
    }

    /* 劈瓜预警标记：跟随目标瓜 */
    if (PIGUA.active && !PIGUA.splitDone && PIGUA.melon && PIGUA.parent) {
      var pw = piguaTargetPos();
      var pwPulse = 0.5 + 0.5 * Math.sin(S.time * 16);
      piguaWarnSprite.position.set(pw.x, pw.y + 1.2, pw.z);
      piguaWarnSprite.scale.set(1 + pwPulse * 0.18, 1 + pwPulse * 0.18, 1);
      piguaWarnMat.opacity = 0.92;
      piguaWarnSprite.visible = true;
      piguaWarnRing.position.set(pw.x, 0.05, pw.z);
      piguaWarnRing.scale.set(1 + pwPulse * 0.25, 1, 1 + pwPulse * 0.25);
      piguaWarnRingMat.opacity = 0.85;
      piguaWarnRing.visible = true;
    } else {
      piguaWarnSprite.visible = false;
      piguaWarnRing.visible = false;
      piguaWarnMat.opacity = 0;
      piguaWarnRingMat.opacity = 0;
    }
    if (S.mode === 'playing' && S.skillFxT > 0) {
      S.skillFxT -= dt;
      S.chaserZOff += (0 - S.chaserZOff) * Math.min(1, dt * 6);
      if (S.skillFxT <= 0) S.chaserZOff = 0;
    }
  }

  var bubbleTimerId = null;
  function showBubble(text, big) {
    el.bubble.textContent = text;
    el.bubble.classList.toggle('big', !!big);
    el.bubble.classList.remove('hidden');
    requestAnimationFrame(function () { el.bubble.classList.add('show'); });
    if (bubbleTimerId) clearTimeout(bubbleTimerId);
    bubbleTimerId = setTimeout(function () {
      el.bubble.classList.remove('show');
      setTimeout(function () { el.bubble.classList.add('hidden'); }, 260);
    }, big ? 2400 : 1700);
  }

  var LINES = [
    '这瓜保熟吗？', '保熟！', '我看你是故意找茬',
    '华强，你干什么！', '这瓜真甜', '来，尝尝！',
    '生意不错啊', '这瓜保熟，不熟不要钱！', '生瓜蛋子！',
  ];

  var VOICE_LINES = {
    '这瓜保熟吗？': 'baoshu',
    '我看你是故意找茬': 'zhaocha',
    '生瓜蛋子！': 'shengua',
  };

  function bubbleTick(dt) {
    S.bubbleTimer -= dt;
    if (S.bubbleTimer <= 0) {
      var line = LINES[Math.floor(Math.random() * LINES.length)];
      showBubble(line, false);
      if (VOICE_LINES[line]) window.AppAudio.playVoice(VOICE_LINES[line]);
      S.bubbleTimer = 5 + Math.random() * 5;
    }
  }

  /* ---------------- 劈瓜：条件触发 + 华强劈瓜演出 ---------------- */
  function piguaTargetPos() {
    var v = new THREE.Vector3();
    if (PIGUA.melon) PIGUA.melon.getWorldPosition(v);
    else if (PIGUA.target) v.copy(PIGUA.target.position);
    return v;
  }

  function piguaTick(dt) {
    if (PIGUA.active) return;
    if (PIGUA.guard > 0) {
      PIGUA.guard -= dt;
      return;
    }
    if (S.mode !== 'playing' || P.mode !== 'run') return;

    var best = null;
    var bestD = Infinity;
    for (var i = 0; i < pickups.length; i++) {
      var pu = pickups[i];
      if (!pu.userData.active || pu.userData.piguaRolled || pu.userData.piguaTarget) continue;
      if (pu.userData.kind !== 'melon') continue;
      var dx = Math.abs(pu.position.x - player.position.x);
      var dz = Math.abs(pu.position.z);
      if (dx > CONFIG.piguaRadiusX || dz > CONFIG.piguaRadiusZ) continue;
      var d = dx * dx + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = pu;
      }
    }
    for (var j = 0; j < obstacles.length; j++) {
      var o = obstacles[j];
      if (!o.userData.active || o.userData.piguaRolled) continue;
      var kind = o.userData.kind;
      if (kind !== 'cart' && kind !== 'pile' && kind !== 'stall') continue;
      if (!o.userData.melons || !o.userData.melons.length) continue;
      var odx = Math.abs(o.position.x - player.position.x);
      var odz = Math.abs(o.position.z);
      if (odx > CONFIG.piguaRadiusX || odz > CONFIG.piguaRadiusZ) continue;
      var od = odx * odx + odz * odz;
      if (od < bestD) {
        bestD = od;
        best = o;
      }
    }
    if (!best) return;
    best.userData.piguaRolled = true; // 每个瓜实体只掷一次
    if (Math.random() > CONFIG.piguaChance) return;
    startPigua(best);
  }

  function startPigua(target) {
    var melon = null;
    var parent = target;
    if (target.userData.kind === 'melon') {
      melon = target.userData.melonMesh || target.children[0];
      target.userData.piguaTarget = true;
      S.melons++;
      window.AppAudio.collect();
      target.userData.baseY = 0.52; // 空中收集物先落到地面再劈
      target.position.y = 0.32;
    } else {
      var melons = target.userData.melons;
      melon = melons[0];
      var tmp = new THREE.Vector3();
      var bestD = Infinity;
      for (var i = 0; i < melons.length; i++) {
        if (!melons[i].visible) continue;
        melons[i].getWorldPosition(tmp);
        var d = tmp.distanceToSquared(player.position);
        if (d < bestD) {
          bestD = d;
          melon = melons[i];
        }
      }
    }

    PIGUA.active = true;
    PIGUA.t = 0;
    PIGUA.guard = CONFIG.piguaGuard;
    PIGUA.flinch = 0;
    PIGUA.target = target;
    PIGUA.melon = melon;
    PIGUA.parent = parent;
    PIGUA.startX = chaser.position.x;
    PIGUA.startZ = chaser.position.z;
    var piguaTp = piguaTargetPos();
    var piguaSide = piguaTp.x >= player.position.x ? 1 : -1;
    PIGUA.wayX = Math.max(-2.4, Math.min(2.4, piguaTp.x + piguaSide * 1.35));
    PIGUA.wayZ = piguaTp.z + 1.05;
    PIGUA.splitT = 0;
    S.piguaHeadDir = PIGUA.wayX >= player.position.x ? 1 : -1;
    PIGUA.splitDone = false;
    PIGUA.returning = false;
    PIGUA.juice = [];

    showBubble('你劈我瓜是吧？', false);
    window.AppAudio.playVoice('pigua');
    S.shake = 0.1;
    S.flash = 0.12;
  }

  function splitPiguaMelon() {
    if (!PIGUA.melon || !PIGUA.parent) return;
    PIGUA.splitT = PIGUA.t;
    var radius = 0.26;
    if (PIGUA.melon.geometry && PIGUA.melon.geometry.parameters && PIGUA.melon.geometry.parameters.radius) {
      radius = PIGUA.melon.geometry.parameters.radius;
    }
    PIGUA.melon.visible = false;
    var pair = window.Obstacles.createSplitMelonPair(radius, PIGUA.melon.position);
    PIGUA.parent.add(pair);
    var burst = window.Obstacles.createJuiceBurst(PIGUA.melon.position, 10);
    PIGUA.parent.add(burst);
    if (!PIGUA.parent.userData.splitParts) PIGUA.parent.userData.splitParts = [];
    PIGUA.parent.userData.splitParts.push(pair, burst);
    PIGUA.parent.userData.splitTarget = PIGUA.melon;
    PIGUA.juice = [];
    for (var i = 0; i < burst.children.length; i++) {
      var mesh = burst.children[i];
      PIGUA.juice.push({
        mesh: mesh,
        vel: mesh.userData.vel,
        life: mesh.userData.life,
        maxLife: mesh.userData.life,
      });
    }
    window.AppAudio.playVoice('haogeZhaocha');
  }

  function updatePigua(dt) {
    PIGUA.t += dt;
    var T = PIGUA.t;
    var ua = huaQiang.userData;
    var tp = piguaTargetPos();

    if (T < CONFIG.piguaWarnTime) {
      // 预警：华强原地不动，先让玩家看清目标是瓜
      chaser.position.x = PIGUA.startX;
      chaser.position.z = PIGUA.startZ;
      chaser.position.y = 0;
      huaQiang.rotation.y = Math.PI;
      huaQiang.rotation.x = 0;
      huaQiang.position.y = 0;
      PIGUA.flinch = 0;
      if (ua) {
        ua.leftLeg.rotation.x = -0.15;
        ua.rightLeg.rotation.x = 0.15;
        ua.leftArm.rotation.x = 0.25;
        ua.rightArm.rotation.x = -0.25;
      }
      return;
    }

    var rel = T - CONFIG.piguaWarnTime;
    var dash1End = CONFIG.piguaDashTime * 0.62;
    if (rel < CONFIG.piguaDashTime) {
      var inDash2 = rel >= dash1End;
      var p = inDash2
        ? Math.min(1, (rel - dash1End) / (CONFIG.piguaDashTime - dash1End))
        : Math.min(1, rel / dash1End);
      var e = easeOut(p);
      var fromX = inDash2 ? PIGUA.wayX : PIGUA.startX;
      var fromZ = inDash2 ? PIGUA.wayZ : PIGUA.startZ;
      var toX = inDash2 ? tp.x : PIGUA.wayX;
      var toZ = inDash2 ? (tp.z - 0.7) : PIGUA.wayZ;
      chaser.position.x = fromX + (toX - fromX) * e;
      chaser.position.z = fromZ + (toZ - fromZ) * e;
      chaser.position.y = 0;
      huaQiang.rotation.y = Math.PI;
      huaQiang.rotation.x = 0;
      if (ua && ua.rightArm) {
        var ph = S.time * 26;
        ua.leftLeg.rotation.x = -Math.sin(ph) * 0.95;
        ua.rightLeg.rotation.x = Math.sin(ph) * 0.95;
        ua.leftArm.rotation.x = Math.sin(ph) * 0.8;
        ua.rightArm.rotation.x = -Math.sin(ph) * 0.8;
      }
      huaQiang.position.y = (ua && ua.rightArm) ? Math.abs(Math.sin(S.time * 26)) * 0.06 : 0;
      PIGUA.flinch = 0;
      return;
    }

    chaser.position.x = tp.x;
    chaser.position.z = tp.z - 0.7;
    chaser.position.y = 0;
    huaQiang.rotation.y = 0; // 面朝镜头劈瓜
    huaQiang.position.y = 0;

    if (rel < CONFIG.piguaRaiseTime) {
      var rp = Math.min(1, Math.max(0, (rel - CONFIG.piguaDashTime) / (CONFIG.piguaRaiseTime - CONFIG.piguaDashTime)));
      var rpE = easeInOut(rp);
      if (ua && ua.rightArm) {
        ua.rightArm.rotation.x = -2.7 * rpE;
        ua.leftArm.rotation.x = 1.1 * rpE;
        ua.leftLeg.rotation.x = -0.5 * rpE;
        ua.rightLeg.rotation.x = 0.5 * rpE;
      }
      huaQiang.rotation.x = -0.12 * rpE;
      PIGUA.flinch = Math.min(1, rpE * 1.2);
    } else if (rel < CONFIG.piguaSwingTime) {
      var sp = Math.min(1, Math.max(0, (rel - CONFIG.piguaRaiseTime) / (CONFIG.piguaSwingTime - CONFIG.piguaRaiseTime)));
      var spE = easeIn(sp);
      if (ua && ua.rightArm) {
        ua.rightArm.rotation.x = -2.7 + 3.6 * spE;
        ua.leftArm.rotation.x = 1.1 - 0.9 * spE;
        ua.leftLeg.rotation.x = -0.45;
        ua.rightLeg.rotation.x = 0.45;
      }
      huaQiang.rotation.x = -0.12 + 0.16 * spE;
      PIGUA.flinch = 1;
      if (!PIGUA.splitDone && rel >= CONFIG.piguaImpactTime) {
        PIGUA.splitDone = true;
        splitPiguaMelon();
        S.shake = 0.35;
        S.flash = 0.25;
        window.AppAudio.chop();
      }
    } else if (rel < CONFIG.piguaHoldTime) {
      if (ua && ua.rightArm) {
        ua.rightArm.rotation.x = 0.9;
        ua.leftArm.rotation.x = 0.25;
        ua.leftLeg.rotation.x = 0;
        ua.rightLeg.rotation.x = 0;
      }
      huaQiang.rotation.x = -0.04;
      PIGUA.flinch = Math.max(0, 1 - (rel - (CONFIG.piguaHoldTime - 0.45)) / 0.45);
    } else {
      if (!PIGUA.returning) {
        PIGUA.returning = true;
        PIGUA.fromX = chaser.position.x;
        PIGUA.fromZ = chaser.position.z;
      }
      var rp2 = Math.min(1, (rel - CONFIG.piguaHoldTime) / (CONFIG.piguaAnimTime - CONFIG.piguaHoldTime));
      var re = easeOut(rp2);
      chaser.position.x = PIGUA.fromX + (player.position.x - PIGUA.fromX) * re;
      chaser.position.z = PIGUA.fromZ + (S.gap - PIGUA.fromZ) * re;
      huaQiang.rotation.y = Math.PI;
      huaQiang.rotation.x = 0;
      if (ua && ua.rightArm) {
        var ph2 = S.time * 24;
        ua.leftLeg.rotation.x = -Math.sin(ph2) * 0.9;
        ua.rightLeg.rotation.x = Math.sin(ph2) * 0.9;
        ua.leftArm.rotation.x = Math.sin(ph2) * 0.8;
        ua.rightArm.rotation.x = -Math.sin(ph2) * 0.8;
      }
      huaQiang.position.y = (ua && ua.rightArm) ? Math.abs(Math.sin(S.time * 24)) * 0.06 : 0;
      PIGUA.flinch = 0;
      if (rel >= CONFIG.piguaAnimTime) {
        chaser.position.set(player.position.x, 0, S.gap);
        huaQiang.rotation.y = Math.PI;
        finishPigua();
      }
    }

    for (var j = PIGUA.juice.length - 1; j >= 0; j--) {
      var part = PIGUA.juice[j];
      part.mesh.position.addScaledVector(part.vel, dt);
      part.vel.y -= 13 * dt;
      part.life -= dt;
      if (part.life <= 0) {
        if (part.mesh.parent) part.mesh.parent.remove(part.mesh);
        PIGUA.juice.splice(j, 1);
      } else {
        var s = Math.max(0.05, part.life / part.maxLife);
        part.mesh.scale.set(s, s, s);
      }
    }
  }

  function finishPigua() {
    var ua = huaQiang.userData;
    if (ua && ua.rightArm) {
      ua.leftArm.rotation.x = 0;
      ua.rightArm.rotation.x = 0;
      ua.leftLeg.rotation.x = 0;
      ua.rightLeg.rotation.x = 0;
    }
    huaQiang.rotation.x = 0;
    huaQiang.position.y = 0;
    PIGUA.active = false;
    PIGUA.t = 0;
    PIGUA.flinch = 0;
    PIGUA.target = null;
    PIGUA.melon = null;
    PIGUA.parent = null;
    PIGUA.splitDone = false;
    PIGUA.splitT = 0;
    PIGUA.returning = false;
    PIGUA.wayX = 0;
    PIGUA.wayZ = 0;
    PIGUA.juice = [];
    S.piguaHeadDir = 1;
    piguaWarnSprite.visible = false;
    piguaWarnRing.visible = false;
  }

  function cleanupPigua() {
    if (PIGUA.parent && PIGUA.melon) {
      PIGUA.melon.visible = true;
      var parts = PIGUA.parent.userData.splitParts || [];
      for (var i = parts.length - 1; i >= 0; i--) {
        if (parts[i].parent === PIGUA.parent) PIGUA.parent.remove(parts[i]);
      }
      PIGUA.parent.userData.splitParts = [];
      PIGUA.parent.userData.splitTarget = null;
    }
    var ua = huaQiang.userData;
    if (ua && ua.rightArm) {
      ua.leftArm.rotation.x = 0;
      ua.rightArm.rotation.x = 0;
      ua.leftLeg.rotation.x = 0;
      ua.rightLeg.rotation.x = 0;
    }
    huaQiang.rotation.x = 0;
    huaQiang.rotation.y = Math.PI;
    huaQiang.position.y = 0;
    PIGUA.active = false;
    PIGUA.t = 0;
    PIGUA.guard = 0;
    PIGUA.flinch = 0;
    PIGUA.target = null;
    PIGUA.melon = null;
    PIGUA.parent = null;
    PIGUA.splitDone = false;
    PIGUA.splitT = 0;
    PIGUA.returning = false;
    PIGUA.wayX = 0;
    PIGUA.wayZ = 0;
    PIGUA.juice = [];
    S.piguaHeadDir = 1;
    piguaWarnSprite.visible = false;
    piguaWarnRing.visible = false;
  }

  /* ---------------- 生成器 ---------------- */
  var seedText = new URLSearchParams(location.search).get('seed');
  var initialSpawnSeed = /^\d{1,10}$/.test(seedText) && Number(seedText) <= 0xffffffff
    ? Number(seedText)
    : null;
  var spawnSeed = initialSpawnSeed;

  function spawnRandom() {
    if (spawnSeed === null) return Math.random();
    spawnSeed = (Math.imul(spawnSeed, 1664525) + 1013904223) >>> 0;
    return spawnSeed / 0x100000000;
  }

  function randInt(a, b, random) { return a + Math.floor((random || spawnRandom)() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(spawnRandom() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(spawnRandom() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function spawnObstacle(kind, lane, z) {
    var obj = poolGet(obstacles, kind, OBSTACLE_FACTORIES[kind]);
    obj.userData.kind = kind;
    obj.position.set(CONFIG.lanes[lane], 0, z);
    obj.userData.lane = lane;
    obj.userData.active = true;
    obj.visible = true;
    obj.userData.slid = false;
    obj.userData.prevZ = z;
    if (obj.userData.kind === 'person') resetPersonPose(obj);
    return obj;
  }

  function spawnPickup(kind, lane, z, y) {
    var factory = kind === 'gold'
      ? function () { return window.Obstacles.createMelon(true); }
      : kind === 'cert'
        ? window.Obstacles.createCert
        : function () { return window.Obstacles.createMelon(false); };
    var obj = poolGet(pickups, kind, factory);
    obj.userData.kind = kind;
    obj.position.set(CONFIG.lanes[lane], y, z);
    obj.userData.baseY = y;
    obj.userData.seed = Math.random() * Math.PI * 2;
    obj.userData.active = true;
    obj.visible = true;
    return obj;
  }

  function spawnPickupLine(lane, z, count) {
    for (var i = 0; i < count; i++) {
      var isGold = spawnRandom() < CONFIG.goldPickupChance;
      spawnPickup(isGold ? 'gold' : 'melon', lane, z + i * 2.2, 0.52);
    }
  }

  function spawnPickupArc(lane, z, count) {
    // 中间高的西瓜只有跳起来才够得着
    var heights = [0.52, 2.86, 3.9, 2.86, 0.52];
    for (var i = 0; i < Math.min(count, heights.length); i++) {
      spawnPickup(spawnRandom() < CONFIG.goldArcChance ? 'gold' : 'melon', lane, z + i * 2.2, heights[i]);
    }
  }

  // 极小概率事件：一列金西瓜连串出现，可连续吃到并叠加金西瓜语音
  function spawnGoldLine(lane, z) {
    var count = CONFIG.goldLineMinCount;
    while (spawnRandom() < CONFIG.goldLineContinueChance) count++;
    for (var i = 0; i < count; i++) {
      var obj = spawnPickup('gold', lane, z + i * CONFIG.goldLineSpacing, 0.52);
      if (i === 0) obj.userData.goldLine = true;
    }
  }

  function randomObstacle(kinds) {
    return pick(kinds || ['cart', 'pile', 'person']);
  }

  function certChance(tier) {
    var arr = CONFIG.certSpawnChanceByTier;
    return arr[Math.min(tier, arr.length - 1)];
  }

  function certGuarantee(tier) {
    var arr = CONFIG.certGuaranteeMetersByTier;
    return arr[Math.min(tier, arr.length - 1)];
  }

  function maybeSpawnCert(lane, z, force) {
    if (S.dist < S.certSupplyResumeDist) return;
    var tier = currentTier();
    if (!force && spawnRandom() >= certChance(tier)) return;
    var y = tier >= CONFIG.certRiskyFromTier ? CONFIG.certHighY : 1.3;
    spawnPickup('cert', lane, z, y);
  }

  function currentTier() {
    var t = 0;
    for (var i = 0; i < CONFIG.tierAt.length; i++) {
      if (S.dist >= CONFIG.tierAt[i]) t = i + 1;
    }
    return t;
  }

  function currentDrift() {
    var d = CONFIG.tensionDrift + S.dist * CONFIG.tensionDriftGain;
    if (S.gap <= CONFIG.dangerGap) d += CONFIG.tensionDriftCloseBonus;
    return Math.min(CONFIG.tensionDriftMax, d);
  }

  function spawnTricycle(z) {
    var obj = poolGet(obstacles, 'tricycle', OBSTACLE_FACTORIES.tricycle);
    obj.userData.kind = 'tricycle';
    obj.userData.lane = -1;
    obj.userData.active = true;
    obj.visible = true;
    obj.userData.slid = false;
    obj.userData.dir = spawnRandom() < 0.5 ? 1 : -1;
    obj.userData.startX = -obj.userData.dir * CONFIG.tricycleSpan;
    obj.position.set(obj.userData.startX, 0, z);
    if (!S.seenKinds.tricycle) {
      S.seenKinds.tricycle = true;
      unlockEgg('tricycle');
      showBubble('横穿三轮车！看准空隙换道', false);
    }
    return obj;
  }

  // 各难度档的模式池（权重），保证至少一条可通行路线
  var PATTERN_POOLS = [
    [
      { name: 'single', w: 40 },
      { name: 'pairOffset', w: 25 },
      { name: 'arc', w: 20 },
      { name: 'certLine', w: 8 },
      { name: 'personLine', w: 10 },
    ],
    [
      { name: 'single', w: 20 },
      { name: 'pairOffset', w: 25 },
      { name: 'pole', w: 15 },
      { name: 'stall', w: 15 },
      { name: 'arc', w: 15 },
      { name: 'certLine', w: 5 },
      { name: 'personLine', w: 10 },
    ],
    [
      { name: 'pairOffset', w: 25 },
      { name: 'pole', w: 15 },
      { name: 'stall', w: 15 },
      { name: 'arc', w: 15 },
      { name: 'pairSame', w: 10 },
      { name: 'crosser', w: 10 },
      { name: 'single', w: 5 },
      { name: 'certLine', w: 2 },
      { name: 'personLine', w: 8 },
    ],
    [
      { name: 'pairOffset', w: 20 },
      { name: 'pairSame', w: 20 },
      { name: 'crosser', w: 20 },
      { name: 'pole', w: 12 },
      { name: 'stall', w: 12 },
      { name: 'arc', w: 10 },
      { name: 'certLine', w: 1 },
      { name: 'personLine', w: 6 },
    ],
  ];

  function pickPattern(tier) {
    var pool = PATTERN_POOLS[Math.min(tier, PATTERN_POOLS.length - 1)];
    var total = 0;
    for (var i = 0; i < pool.length; i++) total += pool[i].w;
    var r = spawnRandom() * total;
    for (var j = 0; j < pool.length; j++) {
      r -= pool[j].w;
      if (r <= 0) return pool[j].name;
    }
    return pool[pool.length - 1].name;
  }

  function runPattern(name, z) {
    if (name === 'single') {
      var lane = randInt(0, 2);
      spawnObstacle(randomObstacle(), lane, z);
      var freeLane = (lane + 1 + randInt(0, 1)) % 3;
      spawnPickupLine(freeLane, z - 5, 4);
      maybeSpawnCert(freeLane, z - 8);
    } else if (name === 'pairOffset') {
      var lanes = shuffle([0, 1, 2]);
      spawnObstacle(randomObstacle(['cart', 'pile']), lanes[0], z);
      spawnObstacle(randomObstacle(['cart', 'pile', 'person']), lanes[1], z + 4);
      spawnPickupLine(lanes[2], z - 5, 4);
      maybeSpawnCert(lanes[2], z - 8);
    } else if (name === 'pole') {
      spawnObstacle('pole', 1, z);
      var poleLane = randInt(0, 2);
      spawnPickupLine(poleLane, z - 6, 3);
      maybeSpawnCert(poleLane, z - 9);
    } else if (name === 'stall') {
      // 瓜摊：横跨三道，只能跳过去
      spawnObstacle('stall', 1, z);
      var stallLane = randInt(0, 2);
      spawnPickupLine(stallLane, z - 7, 3);
      maybeSpawnCert(stallLane, z - 10);
    } else if (name === 'arc') {
      var l2 = randInt(0, 2);
      spawnObstacle(randomObstacle(['cart', 'pile']), l2, z);
      var freeLane2 = (l2 + 1 + randInt(0, 1)) % 3;
      spawnPickupArc(freeLane2, z - 3, 5);
      maybeSpawnCert(freeLane2, z - 6);
    } else if (name === 'pairSame') {
      // 同 z 双障碍：留一条安全道，靠换道通过
      var sameLanes = shuffle([0, 1, 2]);
      spawnObstacle(randomObstacle(['cart', 'pile', 'person']), sameLanes[0], z);
      spawnObstacle(randomObstacle(['cart', 'pile', 'person']), sameLanes[1], z);
      spawnPickupLine(sameLanes[2], z - 5, 4);
      maybeSpawnCert(sameLanes[2], z - 8);
    } else if (name === 'crosser') {
      spawnTricycle(z);
      var cLane = randInt(0, 2);
      spawnPickupLine(cLane, z - 5, 3);
      maybeSpawnCert(cLane, z - 8);
    } else if (name === 'personLine') {
      var pLane = randInt(0, 2);
      spawnObstacle('person', pLane, z);
      var pFree = (pLane + 1 + randInt(0, 1)) % 3;
      spawnPickupLine(pFree, z - 5, 3);
      maybeSpawnCert(pFree, z - 8);
    } else {
      var l3 = randInt(0, 2);
      spawnPickupLine(l3, z - 5, 4);
      maybeSpawnCert(l3, z - 8, true);
    }
    S.lastPole = name === 'pole';
    S.lastStall = name === 'stall';
  }

  function spawnPattern(z) {
    // 极小概率：金西瓜串（一整列金西瓜）；超过保底距离时强制出现一次
    var forceGoldLine = S.dist >= S.nextGoldLineDist;
    if (forceGoldLine || spawnRandom() < CONFIG.goldLineChance) {
      if (forceGoldLine) S.nextGoldLineDist = S.dist + CONFIG.goldLineGuaranteeMeters;
      spawnGoldLine(randInt(0, 2), z - 5);
      return;
    }
    // 安全开场：前 safeOpenDist 米只出奖励，不出障碍
    if (S.dist < CONFIG.safeOpenDist) {
      var safeLane = randInt(0, 2);
      var safeRoll = spawnRandom();
      if (safeRoll < 0.45) {
        spawnPickupLine(safeLane, z - 5, 4);
        maybeSpawnCert(randInt(0, 2), z - 8);
      } else if (safeRoll < 0.8) {
        spawnPickupArc(safeLane, z - 3, 5);
        maybeSpawnCert(randInt(0, 2), z - 6);
      } else {
        spawnPickupLine(safeLane, z - 5, 4);
        maybeSpawnCert(randInt(0, 2), z - 8, true);
      }
      S.lastPole = false;
      S.lastStall = false;
      return;
    }
    var tier = currentTier();
    var name = pickPattern(tier);
    // 难度硬门槛：新障碍不会在低档位提前出现
    if (tier === 0 && (name === 'pole' || name === 'stall' || name === 'crosser')) name = 'single';
    if (tier < 2 && name === 'crosser') name = 'pairOffset';
    runPattern(name, z);
    // 保熟卡供应保证：防止玩家长时间没有续命资源
    if (S.dist >= S.nextCertDist) {
      S.nextCertDist = S.dist + certGuarantee(currentTier());
      maybeSpawnCert(randInt(0, 2), z - 6, true);
    }
  }

  function spawnTick(dt) {
    S.spawnIn += S.speed * dt;
    if (S.spawnIn >= S.nextGap) {
      spawnPattern(CONFIG.spawnZ);
      S.spawnIn = 0;
      var gapRange = CONFIG.tierGap[currentTier()] || CONFIG.tierGap[CONFIG.tierGap.length - 1];
      S.nextGap = randInt(gapRange[0], gapRange[1]);
      if (S.lastPole) S.nextGap += 8;
      if (S.lastStall) S.nextGap += 10;
    }
  }

  /* ---------------- 操作 ---------------- */
  function moveLane(dir) {
    if (S.mode !== 'playing' || P.mode === 'caught') return;
    var nl = Math.max(0, Math.min(2, P.lane + dir));
    if (nl !== P.lane) {
      P.lane = nl;
      if (!P.grounded) maybeTip('airLane', '空中也能左右换道！');
    }
  }

  function doJump() {
    if (S.mode !== 'playing' || P.mode === 'caught') return;
    if (P.mode === 'fall') {
      P.mode = 'run';
      P.fallTimer = 0;
      haoGe.rotation.x = 0;
    }
    if (P.grounded) {
      P.vy = CONFIG.jumpVel;
      P.grounded = false;
      P.jumps = 1;
      P.sliding = false;
      P.legTuckT = 0;
      window.AppAudio.jump();
    } else if (P.jumps < 2) {
      P.airSlideT = 0;
      P.sliding = false;
      P.legTuckT = 0;
      P.vy = CONFIG.doubleJumpVel;
      P.jumps = 2;
      window.AppAudio.doubleJump();
      maybeTip('doubleJump', '空中再按一次：二段跳！');
    }
  }

  function doSlide() {
    if (P.mode !== 'run' || S.mode !== 'playing') return;
    if (!P.grounded) {
      if (P.jumps <= 0 || P.airSlideT > 0) return;
      P.airSlideT = CONFIG.airSlideTime;
      P.sliding = true;
      P.slideTimer = CONFIG.airSlideTime;
      P.vy = -CONFIG.airSlideSpeed;
      window.AppAudio.slide();
      maybeTip('airSlide', '空中下滑：快速落地！');
      return;
    }
    P.sliding = true;
    P.slideTimer = CONFIG.slideTime;
    window.AppAudio.slide();
  }

  /* ---------------- 碰撞 ---------------- */
  function obstacleClearY(kind) {
    if (kind === 'pole') return CONFIG.poleJumpClear;
    if (kind === 'stall') return CONFIG.stallJumpClear;
    if (kind === 'cart') return 1.53;
    if (kind === 'pile') return 1.01;
    if (kind === 'tricycle') return CONFIG.tricycleClearY;
    return -1;
  }

  function canLegTuckAt(y, clearY) {
    return !P.grounded && P.jumps > 0 &&
      y <= clearY && (y + CONFIG.legTuckClearance) > clearY;
  }

  function checkCollisions() {
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      if (!o.userData.active) continue;
      var kind = o.userData.kind;
      // 瓜摊下落扫掠：跨过玩家 z=0 的瞬间按插值高度判定，防止低帧率/已越区漏判
      if (kind === 'stall' && !P.grounded && P.vy < 0 &&
          o.userData.prevZ < 0 && o.position.z >= 0) {
        var stallLane = Math.abs(o.position.x - player.position.x) < CONFIG.laneWidth * 1.7 + 0.25;
        if (stallLane && P.mode === 'run' && P.invuln <= 0 && S.skillT <= 0) {
          var stallSpan = Math.max(0.0001, o.position.z - o.userData.prevZ);
          var stallK = Math.max(0, Math.min(1, (0 - o.userData.prevZ) / stallSpan));
          var stallCrossY = P.prevY + (P.y - P.prevY) * stallK;
          if (stallCrossY <= CONFIG.stallJumpClear) {
            if (canLegTuckAt(stallCrossY, CONFIG.stallJumpClear)) {
              P.legTuckT = CONFIG.legTuckTime;
            } else {
              playHit();
              return;
            }
          }
        }
      }
      // 晾衣杆滑铲判定区较宽；瓜摊碰撞窗更宽
      var checkZone = kind === 'pole' ? CONFIG.poleSlideZone : (kind === 'stall' ? CONFIG.stallZone : 1.8);
      if (Math.abs(o.position.z) > checkZone) continue;
      var sameLane;
      if (kind === 'pole' || kind === 'stall') {
        sameLane = Math.abs(o.position.x - player.position.x) < CONFIG.laneWidth * 1.7 + 0.25;
      } else {
        sameLane = Math.abs(o.position.x - player.position.x) < 1.0;
      }
      if (!sameLane) continue;
      if (Math.abs(o.position.z) <= 4) {
        if (kind === 'pole') maybeTip('pole', '晾衣杆：滑铲或跳过去！');
        else if (kind === 'stall' || kind === 'cart' || kind === 'pile') maybeTip('obstacle', '瓜摊/推车：跳过去或换道！');
        else if (kind === 'tricycle') maybeTip('tricycle', '横穿三轮车：看准空隙换道！');
      }
      var hit = false;
      if (kind === 'pole') {
        // 滑铲在宽判定区内即安全；跳跃只认横杆所在的一小段
        if (P.sliding) o.userData.slid = true;
        // 扫掠判定：上一帧到当前帧的路径跨过横杆判定带，避免低帧率时穿透
        var crossedPole = o.position.z >= -CONFIG.poleBarZone &&
          o.userData.prevZ <= CONFIG.poleBarZone;
        hit = !(P.sliding || o.userData.slid) && crossedPole && P.y <= CONFIG.poleJumpClear;
      } else if (kind === 'stall') {
        hit = P.y <= CONFIG.stallJumpClear;
      } else if (kind === 'cart') {
        hit = !(P.y > 1.53);
      } else if (kind === 'pile') {
        hit = !(P.y > 1.01);
      } else if (kind === 'tricycle') {
        hit = !(P.y > CONFIG.tricycleClearY);
      } else {
        hit = true;
      }
      if (hit) {
        var hitClearY = obstacleClearY(kind);
        if (hitClearY > 0 && canLegTuckAt(P.y, hitClearY)) {
          P.legTuckT = CONFIG.legTuckTime;
          hit = false;
        }
      }
      if (hit && P.mode === 'run' && P.invuln <= 0 && S.skillT <= 0) {
        playHit();
        return;
      }
    }
  }

  function checkPickups() {
    for (var i = 0; i < pickups.length; i++) {
      var p = pickups[i];
      if (!p.userData.active || p.userData.piguaTarget) continue;
      var dz = 2.0;
      var dy = 1.3;
      var airSweep = !P.grounded &&
        p.position.y >= 1.5 &&
        p.position.z > -12 &&
        p.position.z < 12;
      if (airSweep) {
        if (Math.abs(p.position.x - player.position.x) > 1.1) continue;
        if (Math.abs(p.position.y - (P.y + 1.17)) > 1.4) continue;
      } else {
        var speedExtra = Math.max(0, S.speed - CONFIG.baseSpeed);
        if (!P.grounded) {
          dz += speedExtra * 0.045;
          dy += speedExtra * 0.006;
        }
        if (Math.abs(p.position.z) > dz) continue;
        if (Math.abs(p.position.x - player.position.x) > 1.1) continue;
        if (Math.abs(p.position.y - (P.y + 1.17)) > dy) continue;
      }
      p.userData.active = false;
      p.visible = false;
      var kind = p.userData.kind;
      if (kind === 'gold') {
        S.golds++;
        S.goldCombo++;
        S.goldComboT = CONFIG.goldComboWindow;
        if (S.goldCombo >= 3) unlockEgg('goldCombo3');
        window.AppAudio.gold();
        if (S.goldCombo >= 2) {
          var comboN = S.goldCombo;
          window.AppAudio.playVoiceChain('jinxigua', comboN, 180);
          showBubble('金西瓜连击 ×' + comboN + '！', true);
        } else {
          window.AppAudio.playVoice('jinxigua');
          showBubble(p.userData.goldLine ? '金西瓜串！发财了！' : '金西瓜！', p.userData.goldLine);
        }
      } else if (kind === 'cert') {
        S.certs++;
        maybeTip('cert', '保熟卡已到手！按 E 或点右下角按钮放大招');
        if (S.cards < CONFIG.certMax) {
          S.cards++;
          S.cardsMax = Math.max(S.cardsMax, S.cards);
          if (S.cardsMax >= CONFIG.certMax) unlockEgg('cards3');
          spawnBurst(player.position.x, player.position.y + 1.43, player.position.z);
          startFxCard(player.position.x, player.position.y + 1.76, player.position.z);
          window.AppAudio.cert();
          showBubble('这瓜保熟吗？', true);
          window.AppAudio.playVoice('baoshu');
        } else {
          window.AppAudio.collect();
          showBubble('保熟卡已满！', false);
        }
        updateSkillHUD();
      } else {
        S.melons++;
        window.AppAudio.collect();
      }
      S.score = calcScore();
      updateHUD();
    }
  }

  function releaseSkill() {
    if (S.mode !== 'playing') return;
    if (S.cards <= 0) return;
    if (P.mode !== 'run' && S.lastChanceT <= 0) return;
    if (S.chaserReturnT > 0) {
      S.chaserReturnT = 0;
      chaser.visible = true;
      chaser.position.x = player.position.x;
      chaser.position.z = S.gap + S.chaserZOff;
      chaser.position.y = 0;
      chaser.rotation.set(0, 0, 0);
    }
    var wasLastChance = S.lastChanceT > 0;
    S.cards--;
    S.certSupplyResumeDist = S.dist + CONFIG.certCooldownAfterSkill;
    S.nextCertDist = Math.max(S.nextCertDist, S.certSupplyResumeDist);
    S.skillsUsed++;
    if (S.skillsUsed >= 3) unlockEgg('skill3');
    S.lastChanceT = 0;
    el.skillBtn.classList.remove('danger');
    var push = CONFIG.skillPushGap + (S.gap <= CONFIG.catchGap + 1.5 ? CONFIG.skillCloseExtra : 0);
    S.gap = Math.min(CONFIG.startGap + 2, S.gap + push);
    S.skillT = CONFIG.skillInvulnTime;
    S.speedBoostT = CONFIG.skillBoostTime;
    S.skillFxT = 0.7;
    if (P.mode === 'fall') {
      P.mode = 'run';
      P.fallTimer = 0;
      haoGe.rotation.x = 0;
    }
    S.chaserZOff = -push;
    S.shake = 0.25;
    S.chaserHitMax = 0;
    S.chaserHitT = 0;
    S.chaserFlyT = 0;
    S.chaserFlyMax = CONFIG.chaserFlyTime;
    S.chaserFlyDelay = 0;
    S.chaserFlyFromX = null;
    S.chaserFlyFromZ = null;
    S.chaserFlyLand = false;
    S.chaserFlyDir = chaser.position.x >= player.position.x ? 1 : -1;
    if (wasLastChance) {
      // 濒死反杀：郝哥开大把近身的华强轰飞
      S.chaserZOff = -(push + 2.2);
      S.skillFxT = 1.0;
      S.pushPoseT = 0.45;
      S.shake = 0.55;
      S.flash = 0.6;
      startShock(player.position.x, player.position.y + 1.17, player.position.z);
    }
    spawnBurst(player.position.x, player.position.y + 1.3, player.position.z);
    startShock(player.position.x, 0.08, player.position.z);
    showBubble('保熟！小弟上！', true);
    window.AppAudio.skill();
    window.AppAudio.impact();
    window.AppAudio.playVoice('daxiang');
    spawnSidekick();
    flashGold();
    updateSkillHUD();
  }

  function spawnSidekick() {
    if (S.mode !== 'playing') return;
    var approach = chaser.position.x >= player.position.x ? 1 : -1;
    S.sidekickT = CONFIG.sidekickTime;
    S.sidekickDir = approach;
    S.sidekickHitFx = false;
    S.sidekickStartX = player.position.x - approach * 2.6;
    S.sidekickStartZ = chaser.position.z + 1.0;
    S.sidekickHitX = chaser.position.x - approach * 0.55;
    S.sidekickHitZ = chaser.position.z + 0.35;
    skillSidekick.visible = true;
    skillSidekick.position.set(S.sidekickStartX, 0, S.sidekickStartZ);
    skillSidekick.rotation.set(0, 0, 0);
    if (skillSidekick.userData) {
      var su = skillSidekick.userData;
      su.leftArm.rotation.set(0, 0, 0);
      su.rightArm.rotation.set(0, 0, 0);
      su.leftLeg.rotation.set(0, 0, 0);
      su.rightLeg.rotation.set(0, 0, 0);
      if (su.head) su.head.rotation.set(0, 0, 0);
    }
  }

  function updateSidekick(dt) {
    if (S.sidekickT <= 0) return;
    S.sidekickT -= dt;
    var total = Math.max(0.0001, CONFIG.sidekickTime);
    var p = Math.max(0, 1 - S.sidekickT / total);
    var runP = 0.34;
    var strikeP = 0.52;
    var endP = 0.78;
    var su = skillSidekick.userData;
    var hitX = S.sidekickHitX;
    var hitZ = S.sidekickHitZ;
    var forward = S.sidekickDir > 0 ? -Math.PI / 2 : Math.PI / 2;
    if (p < runP) {
      var a = easeOut(Math.min(1, p / runP));
      skillSidekick.position.x = S.sidekickStartX + (hitX - S.sidekickStartX) * a;
      skillSidekick.position.z = S.sidekickStartZ + (hitZ - S.sidekickStartZ) * a;
      skillSidekick.position.y = 0;
      skillSidekick.rotation.set(0.14 * Math.sin(p * Math.PI), forward, 0);
      if (su) {
        var ph = S.time * 26;
        su.leftLeg.rotation.x = -Math.sin(ph) * 0.9;
        su.rightLeg.rotation.x = Math.sin(ph) * 0.9;
        su.leftArm.rotation.x = Math.sin(ph) * 0.9;
        su.rightArm.rotation.x = -0.95 + Math.sin(ph + 1.2) * 0.25;
        su.leftArm.rotation.y = 0;
      }
    } else if (p < strikeP) {
      var sw = easeOut(Math.min(1, (p - runP) / (strikeP - runP)));
      skillSidekick.position.x = hitX;
      skillSidekick.position.z = hitZ;
      skillSidekick.position.y = 0;
      skillSidekick.rotation.set(-0.12, forward, 0);
      if (su) {
        su.leftLeg.rotation.x = -0.3;
        su.rightLeg.rotation.x = 0.45;
        su.leftArm.rotation.x = -1.0 + sw * 0.3;
        su.rightArm.rotation.x = -1.35 + sw * 2.2;
        su.leftArm.rotation.y = 0;
      }
      if (!S.sidekickHitFx) {
        S.sidekickHitFx = true;
        startShock(chaser.position.x, 1.2, chaser.position.z);
        spawnBurst(chaser.position.x, 0.8, chaser.position.z);
        window.AppAudio.impact();
        S.chaserHitT = CONFIG.chaserHitStun;
        S.chaserHitMax = CONFIG.chaserHitStun;
        S.chaserFlyDelay = CONFIG.chaserHitStun;
        S.chaserFlyT = CONFIG.chaserFlyTime;
        S.chaserFlyMax = CONFIG.chaserFlyTime;
        S.chaserFlyFromX = null;
        S.chaserFlyFromZ = null;
        S.chaserFlyLand = false;
        S.flash = Math.max(S.flash, 0.75);
        S.shake = Math.max(S.shake, 0.65);
        showBubble('走你！', true);
      }
    } else if (p < endP) {
      var fp = Math.min(1, (p - strikeP) / (endP - strikeP));
      skillSidekick.position.x = hitX;
      skillSidekick.position.z = hitZ;
      skillSidekick.position.y = 0;
      skillSidekick.rotation.set(-0.1 + fp * 0.08, forward, 0);
      if (su) {
        su.leftLeg.rotation.x = -0.35;
        su.rightLeg.rotation.x = 0.35;
        su.leftArm.rotation.x = -1.35;
        su.leftArm.rotation.y = 0.5;
        su.rightArm.rotation.x = 0.85 - fp * 0.35;
      }
    } else {
      var b = easeOut(Math.min(1, (p - endP) / (1 - endP)));
      var exitX = hitX - S.sidekickDir * 2.8;
      var exitZ = hitZ + 0.5;
      skillSidekick.position.x = hitX + (exitX - hitX) * b;
      skillSidekick.position.z = hitZ + (exitZ - hitZ) * b;
      skillSidekick.position.y = 0;
      skillSidekick.rotation.set(0, S.sidekickDir > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      if (su) {
        var ph2 = S.time * 26;
        su.leftLeg.rotation.x = -Math.sin(ph2) * 0.9;
        su.rightLeg.rotation.x = Math.sin(ph2) * 0.9;
        su.leftArm.rotation.x = Math.sin(ph2) * 0.8;
        su.rightArm.rotation.x = -Math.sin(ph2) * 0.8;
        su.leftArm.rotation.y = 0;
      }
    }
    if (S.sidekickT <= 0) {
      skillSidekick.visible = false;
      skillSidekick.rotation.set(0, 0, 0);
      if (su) {
        su.leftArm.rotation.set(0, 0, 0);
        su.rightArm.rotation.set(0, 0, 0);
        su.leftLeg.rotation.set(0, 0, 0);
        su.rightLeg.rotation.set(0, 0, 0);
        if (su.head) su.head.rotation.set(0, 0, 0);
      }
    }
  }

  function updateChaserFly(dt, baseZ) {
    if (S.chaserFlyT <= 0 || PIGUA.active) return;
    if (S.chaserFlyDelay > 0) {
      S.chaserFlyDelay = Math.max(0, S.chaserFlyDelay - dt);
      return;
    }
    if (S.chaserFlyFromX === null) {
      S.chaserFlyFromX = chaser.position.x;
      S.chaserFlyFromZ = baseZ;
    }
    S.chaserFlyT = Math.max(0, S.chaserFlyT - dt);
    var total = Math.max(0.0001, S.chaserFlyMax);
    var p = 1 - S.chaserFlyT / total;
    var stiffEnd = 0.12;
    if (p < stiffEnd) {
      chaser.position.x = S.chaserFlyFromX;
      chaser.position.z = baseZ;
      chaser.position.y = 0;
      return;
    }
    var p2 = Math.min(1, (p - stiffEnd) / (1 - stiffEnd));
    // 螺旋画圈：半径随飞行放大，x/y 按圆圈相位摆动，z 持续后移
    var flyAngle = p2 * Math.PI * 2 * CONFIG.chaserFlyLoops;
    var flyAspect = window.innerWidth / window.innerHeight;
    var flySideScale = Math.min(1, Math.max(0.4, flyAspect / 1.5));
    var flyRadius = CONFIG.chaserFlySide * p2 * flySideScale;
    chaser.position.x = S.chaserFlyFromX + S.chaserFlyDir * flyRadius * Math.cos(flyAngle);
    chaser.position.z = S.chaserFlyFromZ - CONFIG.chaserFlyBack * p2 + flyRadius * 0.3 * Math.sin(flyAngle);
    chaser.position.y = CONFIG.chaserFlyHeight * (0.5 + 0.5 * Math.min(1, p2 * 2));
    if (S.chaserFlyT <= 0) {
      spawnDust(chaser.position.x, 0.05, chaser.position.z);
      startShock(chaser.position.x, 0.05, chaser.position.z);
      chaser.position.y = 0;
      chaser.visible = false;
      S.chaserReturnT = CONFIG.chaserReturnTime;
      S.chaserReturnDir = S.chaserFlyDir;
      S.chaserFlyFromX = null;
      S.chaserFlyFromZ = null;
      S.chaserFlyDelay = 0;
    }
  }

  function startSarilang(o) {
    o.userData.sarilangRolled = true;
    o.userData.scareT = CONFIG.sarilangReactionTime;
    o.visible = true;
    window.AppAudio.playVoice('sarilang');
    showBubble('萨日朗！', true);
    S.flash = Math.max(S.flash, 0.35);
    unlockEgg('sarilang');
    S.sarilangCount++;
    if (S.sarilangCount >= 3) unlockEgg('sarilang3');
    S.headTurnT = CONFIG.sarilangHeadTime;
    S.headTurnDir = o.position.x >= player.position.x ? 1 : -1;
    speechBubble.position.set(S.headTurnDir * 0.85, 3.3, 0);
    speechBubble.visible = true;
    sarilangFxT = 1.3;
  }

  function checkSarilangPass() {
    if (P.mode !== 'run' || S.mode !== 'playing') return;
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      if (!o.userData.active) continue;
      if (o.userData.kind !== 'person') continue;
      if (o.userData.sarilangRolled) continue;
      // 只在经过前/擦身瞬间触发，避免跑过之后才喊萨日朗
      if (o.position.z < -CONFIG.sarilangZone || o.position.z > 0.8) continue;
      var dx = Math.abs(o.position.x - player.position.x);
      if (dx < 0.78 || dx > 2.8) continue;
      o.userData.sarilangRolled = true;
      if (Math.random() >= CONFIG.sarilangPassChance) return;
      startSarilang(o);
      return;
    }
  }

  function updatePersonScares(dt) {
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i];
      if (!o.userData.active || o.userData.kind !== 'person') continue;
      if (o.userData.scareT <= 0) continue;
      if (window.Obstacles.setPersonFace) window.Obstacles.setPersonFace(o, true);
      o.userData.scareT -= dt;
      var p = 1 - Math.max(0, o.userData.scareT) / CONFIG.sarilangReactionTime;
      o.position.y = Math.abs(Math.sin(p * Math.PI * 2)) * CONFIG.sarilangPersonJump;
      var u = o.userData;
      if (u.leftArm && u.rightArm) {
        u.leftArm.rotation.z = -1.6 + Math.sin(S.time * 24) * CONFIG.sarilangArmFlail;
        u.rightArm.rotation.z = 1.6 + Math.sin(S.time * 24 + 1.2) * CONFIG.sarilangArmFlail;
      }
      if (u.head) {
        u.head.rotation.z = Math.sin(S.time * 26) * CONFIG.sarilangHeadShake;
        u.head.rotation.x = -0.18 + Math.sin(S.time * 20) * 0.12;
        u.head.rotation.y = Math.sin(S.time * 30) * 0.45;
      }
      if (o.userData.scareT <= 0) resetPersonPose(o);
    }
  }

  // 濒死保护：还有大招卡时进入最后机会（慢动作 + 华强冲近身），返回是否进入
  function tryEnterLastChance() {
    if (S.mode !== 'playing' || S.lastChanceT > 0 || S.cards <= 0) return false;
    S.lastChanceT = CONFIG.lastChanceTime;
    S.slowmo = Math.max(S.slowmo, 1.6);
    el.skillBtn.classList.add('danger');
    showBubble('危险！快按 E 放大招保命！', true);
    return true;
  }

  function playHit() {
    S.hitCount++;
    if (S.hitCount === 1) unlockEgg('guard');
    if (S.hitCount >= 2 && S.dist <= 100) unlockEgg('hitEarly100');
    if (S.hitCount >= 5) unlockEgg('hitMany5');
    P.mode = 'fall';
    P.fallTimer = CONFIG.fallTime;
    P.airSlideT = 0;
    P.sliding = false;
    P.legTuckT = 0;
    P.invuln = CONFIG.fallTime + CONFIG.invulnTime;
    S.gap = Math.max(CONFIG.minGap, S.gap - CONFIG.hitGapPenalty);
    S.shake = 0.45;
    S.flash = 0.5;
    window.AppAudio.hit();
    showBubble('萨日朗！', false);
    window.AppAudio.playVoice('sarilang');
    S.sarilangCooldown = CONFIG.sarilangCooldown;
    if (S.gap <= CONFIG.catchGap) {
      // 必死一击：还有大招卡就进入最后机会；否则直接死亡
      if (!tryEnterLastChance()) gameOver();
    }
  }

  function gameOver() {
    S.mode = 'gameover';
    P.mode = 'caught';
    playerBody.visible = true; // 无敌闪烁可能把郝哥留在隐藏状态，死亡演出必须显示
    try {
      S.canSkipEnding = !!localStorage.getItem('haoge_death_seen');
    } catch (e) {
      S.canSkipEnding = false;
    }
    hide('skipBtn');
    hide('skipHint');
    S.deathT = 0;
    S.deathOverShown = false;
    S.deathScream = false;
    S.deathSarilang = false;
    S.deathEnding = false;
    S.deathBlood = false;
    S.deathDrip = false;
    S.deathBlood2 = false;
    S.deathSmirk = false;
    S.lastChanceT = 0;
    S.pushPoseT = 0;
    S.chaserHitT = 0;
    S.chaserHitMax = 0;
    S.chaserFlyT = 0;
    S.chaserFlyMax = 0;
    S.chaserFlyDelay = 0;
    S.chaserFlyFromX = null;
    S.chaserFlyFromZ = null;
    S.chaserFlyLand = false;
    S.chaserReturnT = 0;
    S.chaserReturnDir = 1;
    chaser.visible = true;
    chaser.position.y = 0;
    S.sidekickT = 0;
    S.sidekickHitFx = false;
    skillSidekick.visible = false;
    sidekickRing.visible = false;
    sidekickRingMat.opacity = 0;
    if (huaQiang.userData) {
      huaQiang.rotation.z = 0;
      huaQiang.position.y = 0;
    }
    el.skillBtn.classList.remove('danger');
    S.deathFromX = chaser.position.x;
    S.deathFromZ = chaser.position.z;
    cleanupPigua();
    hide('overScreen');
    window.AppAudio.caught();
    S.skillT = 0;
    S.speedBoostT = 0;
    S.skillFxT = 0;
    S.chaserZOff = 0;
    P.invuln = 0;
    if (el.invulnTag) el.invulnTag.classList.add('hidden');
    S.score = calcScore();
    var isNew = S.score > S.best;
    if (isNew) {
      S.best = S.score;
      try { localStorage.setItem('haoge_best', String(S.best)); } catch (e) {}
    }
    if (S.best >= 1000) unlockEgg('best3000');
    el.overScore.textContent = S.score;
    el.overDist.textContent = Math.floor(S.dist);
    el.overMelons.textContent = S.melons;
    el.overBest.textContent = S.best;
    el.newRecord.classList.toggle('hidden', !isNew);
    if (S.tipsEnabled) {
      S.tipsEnabled = false;
      try { localStorage.setItem('haoge_tips_seen', '1'); } catch (e) {}
    }
    hideTip();
  }

  /* ---------------- 游戏流程 ---------------- */
  function startGame() {
    window.AppAudio.ensure();
    window.AppAudio.ui();
    window.AppAudio.playVoice('baoshu');
    cleanupPigua();
    resetTheme();
    hide('eggModal');
    hide('helpModal');
    hide('pauseScreen');
    el.pauseBtn.textContent = '⏸';
    spawnSeed = initialSpawnSeed;
    S.mode = 'playing';
    S.speed = CONFIG.baseSpeed;
    S.dist = 0;
    S.score = 0;
    S.melons = 0;
    S.golds = 0;
    S.goldCombo = 0;
    S.goldComboT = 0;
    S.certs = 0;
    S.cards = 0;
    S.seenKinds = {};
    S.nextCertDist = CONFIG.safeOpenDist + Math.round(CONFIG.certGuaranteeMetersByTier[0] / 2);
    S.certSupplyResumeDist = 0;
    S.nextFamilyDist = CONFIG.familySpawnStart;
    S.nextGoldLineDist = CONFIG.goldLineGuaranteeMeters;
    S.dangerWarnCd = 0;
    S.hitCount = 0;
    S.sarilangCount = 0;
    S.skillsUsed = 0;
    S.cardsMax = 0;
    S.gap = CONFIG.startGap;
    S.camIntroT = CONFIG.camIntroTime;
    S.camBlendT = 0;
    S.camBlendShown = false;
    // 开场镜头：从侧后方让郝哥和华强同框
    camera.position.x = 2.8;
    camera.position.y = 5.6;
    camera.position.z = S.gap + 3.0;
    S.spawnIn = 0;
    S.nextGap = 20;
    S.lastPole = false;
    S.lastStall = false;
    S.deathT = 0;
    S.deathOverShown = false;
    S.deathScream = false;
    S.deathSarilang = false;
    S.deathEnding = false;
    S.deathBlood = false;
    S.deathDrip = false;
    S.deathBlood2 = false;
    S.deathSmirk = false;
    S.deathSkipped = false;
    S.canSkipEnding = false;
    hide('skipBtn');
    hide('skipHint');
    S.bubbleTimer = 3;
    S.sarilangCooldown = 0;
    S.headTurnT = 0;
    S.headTurnDir = 1;
    S.piguaHeadDir = 1;
    S.slowmo = 0;
    S.skillT = 0;
    S.lastChanceT = 0;
    S.pushPoseT = 0;
    S.speedBoostT = 0;
    S.skillFxT = 0;
    S.chaserZOff = 0;
    S.chaserHitT = 0;
    S.chaserHitMax = 0;
    S.chaserFlyT = 0;
    S.chaserFlyMax = 0;
    S.chaserFlyDelay = 0;
    S.chaserFlyFromX = null;
    S.chaserFlyFromZ = null;
    S.chaserFlyLand = false;
    S.chaserReturnT = 0;
    S.chaserReturnDir = 1;
    chaser.visible = true;
    S.sidekickT = 0;
    S.sidekickHitFx = false;
    S.tipsShown = {};
    S.tipTimer = CONFIG.tipStartDelay;
    hideTip();
    el.skillBtn.classList.remove('danger');
    S.shake = 0;
    S.flash = 0;

    P.lane = 1;
    P.x = 0;
    P.y = 0;
    P.vy = 0;
    P.jumps = 0;
    P.grounded = true;
    P.sliding = false;
    P.slideTimer = 0;
    P.airSlideT = 0;
    P.legTuckT = 0;
    P.prevY = 0;
    P.mode = 'run';
    P.fallTimer = 0;
    P.invuln = 0;

    player.position.set(0, 0, 0);
    player.rotation.set(0, 0, 0);
    haoGe.rotation.x = 0;
    haoGe.rotation.y = Math.PI;
    haoGe.rotation.z = 0;
    huaQiang.rotation.x = 0;
    huaQiang.rotation.z = 0;
    huaQiang.position.y = 0;
    huaQiang.rotation.y = Math.PI;
    scooter.visible = false;
    scooter.rotation.y = 0;
    if (scooter.userData && scooter.userData.wheels) {
      for (var wq = 0; wq < scooter.userData.wheels.length; wq++) {
        scooter.userData.wheels[wq].rotation.set(0, 0, 0);
      }
    }
    xiaoDi.visible = false;
    xiaoDi.position.set(0, 0, 0);
    xiaoDi.rotation.set(0, 0, 0);
    if (xiaoDiModel.userData) {
      xiaoDiModel.userData.leftArm.rotation.set(0, 0, 0);
      xiaoDiModel.userData.rightArm.rotation.set(0, 0, 0);
      xiaoDiModel.userData.leftLeg.rotation.set(0, 0, 0);
      xiaoDiModel.userData.rightLeg.rotation.set(0, 0, 0);
      if (xiaoDiModel.userData.head) xiaoDiModel.userData.head.rotation.set(0, 0, 0);
    }
    skillSidekick.visible = false;
    skillSidekick.position.set(0, 0, 0);
    skillSidekick.rotation.set(0, 0, 0);
    sidekickRing.visible = false;
    sidekickRingMat.opacity = 0;
    if (skillSidekick.userData) {
      skillSidekick.userData.leftArm.rotation.set(0, 0, 0);
      skillSidekick.userData.rightArm.rotation.set(0, 0, 0);
      skillSidekick.userData.leftLeg.rotation.set(0, 0, 0);
      skillSidekick.userData.rightLeg.rotation.set(0, 0, 0);
      if (skillSidekick.userData.head) skillSidekick.userData.head.rotation.set(0, 0, 0);
    }
    if (haoGe.userData) {
      haoGe.userData.leftArm.rotation.set(0, 0, 0);
      haoGe.userData.rightArm.rotation.set(0, 0, 0);
      haoGe.userData.leftLeg.rotation.set(0, 0, 0);
      haoGe.userData.rightLeg.rotation.set(0, 0, 0);
      if (haoGe.userData.head) haoGe.userData.head.rotation.set(0, 0, 0);
    }
    if (huaQiang.userData) {
      huaQiang.userData.leftArm.rotation.set(0, 0, 0);
      huaQiang.userData.rightArm.rotation.set(0, 0, 0);
      huaQiang.userData.leftLeg.rotation.set(0, 0, 0);
      huaQiang.userData.rightLeg.rotation.set(0, 0, 0);
      if (huaQiang.userData.head) huaQiang.userData.head.rotation.set(0, 0, 0);
    }
    playerBody.visible = true;
    burstPoints.visible = false;
    burstT = 0;
    dustPoints.visible = false;
    dustT = 0;
    bloodPoints.visible = false;
    bloodT = 0;
    bloodFountainT = 0;
    bloodJet.visible = false;
    bloodJetMat.opacity = 0;
    dripPoints.visible = false;
    dripMat.opacity = 0;
    bloodStain.visible = false;
    bloodStainMat.opacity = 0;
    bloodStain.scale.set(1, 1, 1);
    bloodStainT = -1;
    bloodPool.visible = false;
    bloodPoolMat.opacity = 0;
    bloodPoolT = -1;
    bloodRing.visible = false;
    bloodRingT = 0;
    fxCard.visible = false;
    fxCardT = 0;
    ring.visible = false;
    ringMat.opacity = 0;
    shock.visible = false;
    shockT = 0;
    piguaWarnSprite.visible = false;
    piguaWarnRing.visible = false;
    piguaWarnMat.opacity = 0;
    piguaWarnRingMat.opacity = 0;
    el.goldFlash.style.opacity = '0';
    speechBubble.visible = false;
    sarilangFxT = 0;
    haogeTag.visible = true;
    huaqiangTag.visible = true;
    xiaoDiTag.visible = true;
    window.Runners.setFace(huaQiang, 'huaqiang');
    window.Runners.setBloodyHands(haoGe, false);
    window.Runners.setBloodyKnife(huaQiang, false);
    if (window.RunnerAnim) {
      window.RunnerAnim.freeze(haoGe);
      window.RunnerAnim.freeze(huaQiang);
      window.RunnerAnim.freeze(xiaoDiModel);
      window.RunnerAnim.freeze(skillSidekick);
    }
    chaser.position.set(0, 0, S.gap);
    for (var gi = 0; gi < familyGroups.length; gi++) respawnFamily(familyGroups[gi]);
    hide('overScreen');

    for (var i = 0; i < obstacles.length; i++) poolPut(obstacles, obstacles[i]);
    for (var j = 0; j < pickups.length; j++) poolPut(pickups, pickups[j]);

    spawnPattern(CONFIG.spawnZ);
    spawnPattern(CONFIG.spawnZ + 24);

    hide('startScreen');
    hide('overScreen');
    show('hud');
    updateSkillHUD();
    updateHUD();
  }

  /* ---------------- 更新逻辑 ---------------- */
  function update(dt) {
    if (S.slowmo > 0) {
      S.slowmo -= dt;
      dt *= 0.35;
    }
    S.time += dt;
    S.sarilangCooldown = Math.max(0, S.sarilangCooldown - dt);
    S.dangerWarnCd = Math.max(0, S.dangerWarnCd - dt);
    if (S.goldComboT > 0) {
      S.goldComboT -= dt;
      if (S.goldComboT <= 0) S.goldCombo = 0;
    }
    if (S.tipTimer > 0) {
      S.tipTimer -= dt;
      if (S.tipTimer <= 0) maybeTip('lane', '左右滑动或 A/D 换道，躲开障碍');
    }

    if (S.skillT > 0) S.skillT = Math.max(0, S.skillT - dt);
    if (S.speedBoostT > 0) S.speedBoostT = Math.max(0, S.speedBoostT - dt);
    if (S.pushPoseT > 0) S.pushPoseT = Math.max(0, S.pushPoseT - dt);
    if (S.lastChanceT > 0) {
      S.lastChanceT -= dt;
      if (S.lastChanceT <= 0 && S.mode === 'playing') gameOver();
    }

    S.speed = Math.min(CONFIG.maxSpeed, S.speed + CONFIG.accel * dt);
    var moveSpeed = Math.min(CONFIG.maxSpeed, S.speed + (S.speedBoostT > 0 ? CONFIG.skillBoostSpeed : 0));
    S.dist += moveSpeed * dt;
    updateTheme(dt);
    S.score = calcScore();

    /* 世界滚动 */
    track.position.z += moveSpeed * dt;
    if (track.position.z > 10) track.position.z -= 60;

    for (var i = 0; i < sideProps.length; i++) {
      var sp = sideProps[i];
      sp.position.z += moveSpeed * dt;
      if (sp.position.z > 15) respawnSideProp(sp);
    }

    for (var i2 = 0; i2 < familyGroups.length; i2++) {
      var fg2 = familyGroups[i2];
      if (!fg2.visible) {
        if (S.dist >= S.nextFamilyDist) respawnFamily(fg2);
        continue;
      }
      fg2.position.z += moveSpeed * dt;
      if (fg2.position.z > 15) {
        fg2.visible = false;
        fg2.userData.triggered = false;
        resetFamilyPose(fg2);
      }
    }

    for (var k = 0; k < obstacles.length; k++) {
      var o = obstacles[k];
      if (!o.userData.active) continue;
      o.userData.prevZ = o.position.z;
      o.position.z += moveSpeed * dt;
      if (o.userData.kind === 'tricycle') {
        o.userData.moveT = (o.userData.moveT || 0) + dt;
        o.position.x = o.userData.startX + o.userData.dir * ((2 * CONFIG.tricycleSpan) / CONFIG.tricycleCrossTime) * o.userData.moveT;
        if (Math.abs(o.position.x) > CONFIG.tricycleSpan + 0.6) poolPut(obstacles, o);
      }
      if (o.position.z > CONFIG.killZ && o !== PIGUA.target) poolPut(obstacles, o);
    }

    for (var m = 0; m < pickups.length; m++) {
      var pu = pickups[m];
      if (!pu.userData.active) continue;
      pu.position.z += moveSpeed * dt;
      if (pu.userData.piguaTarget) {
        pu.position.y = pu.userData.baseY;
      } else {
        pu.rotation.y += dt * 3;
        pu.position.y = pu.userData.baseY + Math.sin(S.time * 3 + pu.userData.seed) * 0.08;
      }
      if (pu.position.z > CONFIG.killZ && pu !== PIGUA.target) poolPut(pickups, pu);
    }

    /* 华强距离 */
    if (PIGUA.active) {
      updatePigua(dt);
    } else {
      S.gap -= currentDrift() * dt;
      if (S.gap < CONFIG.minGap) S.gap = CONFIG.minGap;
      // 濒死时华强飞速冲上来近身
      var rushZOff = 0;
      if (S.lastChanceT > 0) {
        var rushK = 1 - Math.min(1, S.lastChanceT / CONFIG.lastChanceTime);
        rushZOff = -(CONFIG.catchGap - 1.1) * rushK;
      }
      chaser.position.z = S.gap + S.chaserZOff + rushZOff;
      chaser.position.x += (player.position.x - chaser.position.x) * Math.min(1, dt * 4);
      if (S.chaserFlyT > 0) updateChaserFly(dt, S.gap + S.chaserZOff + rushZOff);
    }
    if (S.chaserReturnT > 0) {
      S.chaserReturnT -= dt;
      if (S.chaserReturnT <= 0) {
        S.chaserReturnT = 0;
        chaser.visible = true;
        chaser.position.x = player.position.x;
        chaser.position.z = S.gap + S.chaserZOff;
        chaser.position.y = 0;
        chaser.rotation.set(0, 0, 0);
        spawnBurst(chaser.position.x, 0.25, chaser.position.z);
        startShock(chaser.position.x, 0.05, chaser.position.z);
        window.AppAudio.impact();
        showBubble('华强又回来了！', false);
      }
    }
    if (S.mode === 'playing' && !PIGUA.active && S.gap <= CONFIG.catchGap + 1.5) {
      maybeTip('danger', '华强追上来了！撞到东西会让他追近');
    }
    if (S.mode === 'playing' && !PIGUA.active && S.gap <= CONFIG.dangerGap && S.dangerWarnCd <= 0) {
      S.dangerWarnCd = CONFIG.dangerWarnCooldown;
      S.flash = Math.max(S.flash, 0.45);
      showBubble('华强追上来了！按 E 放保熟技能', true);
    }

    checkFamilyPass();

    /* 玩家 */
    P.x += (CONFIG.lanes[P.lane] - P.x) * Math.min(1, dt * 10);
    player.position.x = P.x;

    if (P.mode === 'run') {
      P.prevY = P.y;
      if (P.legTuckT > 0) P.legTuckT = Math.max(0, P.legTuckT - dt);
      if (!P.grounded) {
        P.vy += CONFIG.gravity * dt;
        if (P.airSlideT > 0) {
          P.airSlideT -= dt;
          if (P.vy > -CONFIG.airSlideSpeed) P.vy = -CONFIG.airSlideSpeed;
        }
        P.y += P.vy * dt;
        if (P.y <= 0) {
          P.y = 0;
          P.vy = 0;
          P.jumps = 0;
          P.grounded = true;
          P.airSlideT = 0;
          P.sliding = false;
          P.legTuckT = 0;
        }
      }
      if (P.sliding) {
        P.slideTimer -= dt;
        if (P.slideTimer <= 0) P.sliding = false;
      }
      player.position.y = P.y;
      var slideTarget = P.sliding ? CONFIG.slideLean : 0;
      haoGe.rotation.x += (slideTarget - haoGe.rotation.x) * Math.min(1, dt * 14);
      var slideLiftTarget = P.sliding ? CONFIG.slideLift : 0;
      haoGe.position.y += (slideLiftTarget - haoGe.position.y) * Math.min(1, dt * 14);
      P.invuln -= dt;
      if (P.invuln > 0) {
        playerBody.visible = Math.floor(S.time * 20) % 2 === 0;
      } else {
        playerBody.visible = true;
      }
      checkCollisions();
      checkPickups();
      checkSarilangPass();
    } else if (P.mode === 'fall') {
      P.fallTimer -= dt;
      var t = 1 - Math.max(0, P.fallTimer) / CONFIG.fallTime;
      haoGe.rotation.x = -t * 1.45;
      if (P.fallTimer <= 0) {
        P.mode = 'run';
        haoGe.rotation.x = 0;
      }
    }

    spawnTick(dt);
    piguaTick(dt);
    bubbleTick(dt);
    updatePersonScares(dt);
    updateFamilyWave(dt);

    // 华强逼近到被抓线：有卡先给濒死保护，否则死亡（PIGUA 演出期间除外）
    if (S.gap <= CONFIG.catchGap && S.mode === 'playing' && S.lastChanceT <= 0 && !PIGUA.active) {
      if (!tryEnterLastChance()) gameOver();
    }

    if (S.dist >= 100) unlockEgg('dist100');
    if (S.dist >= 500) unlockEgg('dist500');
    if (S.dist >= 1000) unlockEgg('dist1000');
    if (S.dist >= 2000) unlockEgg('dist2000');
    if (S.dist >= 300 && S.hitCount <= 0) unlockEgg('noHit300');

    updateHUD();
  }

  function updateMenu(dt) {
    S.time += dt;
    track.position.z += 5 * dt;
    if (track.position.z > 10) track.position.z -= 60;
    for (var i = 0; i < sideProps.length; i++) {
      sideProps[i].position.z += 5 * dt;
      if (sideProps[i].position.z > 15) respawnSideProp(sideProps[i]);
    }
    for (var i3 = 0; i3 < familyGroups.length; i3++) {
      familyGroups[i3].position.z += 5 * dt;
      if (familyGroups[i3].position.z > 15) respawnFamily(familyGroups[i3]);
    }
    camera.position.x = Math.sin(S.time * 0.3) * 0.5;
  }

  function easeOut(t) { return 1 - (1 - t) * (1 - t); }
  function easeIn(t) { return t * t; }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function currentThemeIndex() {
    var t = 0;
    for (var i = 0; i < THEME_AT.length; i++) {
      if (S.dist >= THEME_AT[i]) t = i;
    }
    return Math.min(t, THEMES.length - 1);
  }

  function applyThemeSideProps(ti) {
    for (var i = 0; i < sideProps.length; i++) {
      var children = sideProps[i].userData.themeChildren;
      if (!children) continue;
      for (var j = 0; j < children.length; j++) children[j].visible = j === ti;
    }
  }

  function resetTheme() {
    S.themeFrom = 0;
    S.themeTo = 0;
    S.themeBlend = 1;
    var t0 = THEMES[0];
    skyColor.copy(t0.sky);
    fogColor.copy(t0.fog);
    scene.fog.near = t0.fogNear;
    scene.fog.far = t0.fogFar;
    hemi.color.copy(t0.hemiSky);
    hemi.groundColor.copy(t0.hemiGround);
    hemi.intensity = t0.hemiIntensity;
    ambient.intensity = t0.ambientIntensity;
    sun.color.copy(t0.sun);
    sun.intensity = t0.sunIntensity;
    groundMat.color.copy(t0.ground.tint);
    groundMat.map = GROUND_TEX[0];
    groundMat.needsUpdate = true;
    lineMat.color.copy(t0.line);
    renderer.toneMappingExposure = t0.exposure;
    applyThemeSideProps(0);
  }

  function updateTheme(dt) {
    var target = currentThemeIndex();
    if (target !== S.themeTo) {
      S.themeFrom = S.themeTo;
      S.themeTo = target;
      S.themeBlend = 0;
      applyThemeSideProps(target);
      groundMat.map = GROUND_TEX[target];
      groundMat.needsUpdate = true;
    }
    if (S.themeBlend >= 1) return;
    S.themeBlend = Math.min(1, S.themeBlend + dt / 3.0);
    var k = easeInOut(S.themeBlend);
    var a = THEMES[S.themeFrom];
    var b = THEMES[S.themeTo];
    skyColor.copy(a.sky).lerp(b.sky, k);
    fogColor.copy(a.fog).lerp(b.fog, k);
    scene.fog.near = a.fogNear + (b.fogNear - a.fogNear) * k;
    scene.fog.far = a.fogFar + (b.fogFar - a.fogFar) * k;
    hemi.color.copy(a.hemiSky).lerp(b.hemiSky, k);
    hemi.groundColor.copy(a.hemiGround).lerp(b.hemiGround, k);
    hemi.intensity = a.hemiIntensity + (b.hemiIntensity - a.hemiIntensity) * k;
    ambient.intensity = a.ambientIntensity + (b.ambientIntensity - a.ambientIntensity) * k;
    sun.color.copy(a.sun).lerp(b.sun, k);
    sun.intensity = a.sunIntensity + (b.sunIntensity - a.sunIntensity) * k;
    groundMat.color.copy(a.ground.tint).lerp(b.ground.tint, k);
    lineMat.color.copy(a.line).lerp(b.line, k);
    renderer.toneMappingExposure = a.exposure + (b.exposure - a.exposure) * k;
  }

  /* 结束演出：华强冲刺捅刀 → 郝哥惨叫倒地 → 小弟跑来抱住 → 华强骑电动车离开 */
  function updateDeath(dt) {
    if (S.deathSkipped) return;
    S.deathT += dt;
    var T = S.deathT;
    var ua = huaQiang.userData;
    var up = haoGe.userData;
    var ud = xiaoDiModel.userData;
    if (window.RunnerAnim) {
      window.RunnerAnim.freeze(haoGe);
      window.RunnerAnim.freeze(huaQiang);
      window.RunnerAnim.freeze(xiaoDiModel);
    }

    if (S.canSkipEnding && T >= CONFIG.endingSkipAt && !S.deathOverShown) {
      show('skipBtn');
      show('skipHint');
    } else {
      hide('skipBtn');
      hide('skipHint');
    }
    /* ---- 华强冲刺 + 捅刀 ---- */
    var rushEnd = 0.35;
    var p = Math.min(1, T / rushEnd);
    chaser.position.x = S.deathFromX + (player.position.x - S.deathFromX) * easeOut(p);
    chaser.position.z = S.deathFromZ + ((player.position.z + 1.05) - S.deathFromZ) * easeOut(p);
    if (T > rushEnd && T < 0.7) {
      var lp = (T - rushEnd) / 0.35;
      chaser.position.z = player.position.z + 1.05 - 0.6 * easeIn(lp);
    }

    if (T < rushEnd) {
      var ph = S.time * 26;
      ua.leftLeg.rotation.x = -Math.sin(ph) * 0.9;
      ua.rightLeg.rotation.x = Math.sin(ph) * 0.9;
      ua.leftArm.rotation.x = Math.sin(ph) * 0.9;
      ua.rightArm.rotation.x = -Math.sin(ph) * 0.9;
      huaQiang.rotation.x = 0;
      huaQiang.position.y = Math.abs(Math.sin(ph)) * 0.06;
    } else if (T < 0.7) {
      var sp = Math.sin(Math.min(1, (T - rushEnd) / 0.35) * Math.PI);
      ua.leftLeg.rotation.x = -0.55;
      ua.rightLeg.rotation.x = 0.65;
      ua.leftArm.rotation.x = 1.25;
      ua.rightArm.rotation.x = -1.75 * sp - 0.05;
      huaQiang.rotation.x = -0.24 * sp;
      huaQiang.position.y = 0;
    } else if (T < 1.55) {
      // 收刀站定，准备离开
      ua.leftArm.rotation.x = 0.5;
      ua.rightArm.rotation.x = -0.45;
      ua.leftLeg.rotation.x = 0;
      ua.rightLeg.rotation.x = 0;
      huaQiang.rotation.x = -0.06;
      huaQiang.position.y = 0;
    } else if (T < 2.3) {
      // 走向电动车（车停在右侧）
      var pm = Math.min(1, (T - 1.55) / 0.75);
      scooter.visible = true;
      scooter.position.set(player.position.x + 1.7, 0, player.position.z + 1.9);
      chaser.position.x = player.position.x + 1.7;
      chaser.position.z = player.position.z + 1.9;
      huaQiang.rotation.y = Math.PI + (0 - Math.PI) * easeOut(pm);
      ua.leftLeg.rotation.x = -0.3;
      ua.rightLeg.rotation.x = 0.3;
      ua.leftArm.rotation.x = -0.4;
      ua.rightArm.rotation.x = -0.4;
      huaQiang.rotation.x = 0;
      huaQiang.position.y = -0.94 * easeIn(pm);
    } else {
      // 骑车离开：向镜头方向驶去并偏右出画
      var pr2 = Math.min(1, (T - 2.3) / (CONFIG.deathTime - 2.3));
      var ez = easeIn(pr2); // 加速驶出：结尾正好冲出画面
      scooter.position.z = player.position.z + 1.9 + ez * 4.1;
      scooter.position.x = player.position.x + 1.7 + ez * 6.8;
      scooter.rotation.y = ez * 0.55;
      var wheels = scooter.userData.wheels;
      for (var wi = 0; wi < wheels.length; wi++) wheels[wi].rotation.x += dt * 18;
      chaser.position.x = scooter.position.x;
      chaser.position.z = scooter.position.z;
      chaser.position.y = 0;
      huaQiang.rotation.y = 0;
      huaQiang.position.y = -0.94;
      ua.leftLeg.rotation.x = -1.15;
      ua.rightLeg.rotation.x = -1.15;
      ua.leftArm.rotation.x = -1.35;
      ua.rightArm.rotation.x = -1.35;
      huaQiang.rotation.x = 0.1;
    }

    /* ---- 郝哥被捅：转身面朝镜头，踉跄但不下倒，随后被小弟抱住 ---- */
    if (T >= 0.12 && T < 1.6) {
      var ft = Math.min(1, (T - 0.12) / 0.5);
      haoGe.rotation.y = Math.PI * (1 - Math.min(1, ft * 1.25));
      haoGe.rotation.x = -0.24 * easeIn(ft); // 微微前倾踉跄
      up.leftArm.rotation.x = -1.15 - ft * 0.1; // 一手捂胸口
      up.rightArm.rotation.x = -0.55 - ft * 0.55;
      up.leftLeg.rotation.x = -0.14 * ft;
      up.rightLeg.rotation.x = 0.14 * ft;
      if (up.head) up.head.rotation.x = 0.16 * ft;
    }

    /* ---- 小弟跑过来从身后抱住郝哥 ---- */
    if (T >= 0.95) {
      xiaoDi.visible = true;
      var runEnd = 1.55;
      var pr = Math.min(1, (T - 0.95) / (runEnd - 0.95));
      // 从镜头相对的方向（画面深处）跑来，绕到面朝镜头的郝哥身后再抱住
      var xdFromX = player.position.x - 1.2;
      var xdFromZ = player.position.z - 4.0;
      xiaoDi.position.x = xdFromX + ((player.position.x + 0.3) - xdFromX) * easeOut(pr);
      xiaoDi.position.z = xdFromZ + ((player.position.z - 0.12) - xdFromZ) * easeOut(pr);
      if (pr < 1) {
        xiaoDi.rotation.x = 0;
        xiaoDiModel.rotation.y = 0; // 朝镜头方向跑
        var rph = S.time * 22;
        ud.leftLeg.rotation.x = -Math.sin(rph) * 0.9;
        ud.rightLeg.rotation.x = Math.sin(rph) * 0.9;
        ud.leftArm.rotation.x = Math.sin(rph) * 0.8;
        ud.rightArm.rotation.x = -Math.sin(rph) * 0.8;
      } else {
        // 抱住：双臂前伸环抱郝哥
        ud.leftLeg.rotation.x = 0.12;
        ud.rightLeg.rotation.x = 0.12;
        ud.leftArm.rotation.x = -1.55;
        ud.rightArm.rotation.x = -1.55;
        ud.leftArm.rotation.z = 0.35;
        ud.rightArm.rotation.z = -0.35;
        if (ud.head) ud.head.rotation.x = 0.16;
        ud.leftArm.rotation.x = -1.55 - Math.max(0, Math.sin(S.time * 8)) * 0.3; // 轻拍安抚
        xiaoDiModel.rotation.y = 0; // 与郝哥同向，面朝镜头
        xiaoDi.position.z = player.position.z - 0.12;
        xiaoDi.position.x = player.position.x + 0.3;
        xiaoDi.rotation.x = 0.22; // 前倾压肩，环抱郝哥
      }
    }

    /* ---- 小弟抱住：郝哥后仰靠进怀里，双手捂腹 ---- */
    if (T >= 1.6) {
      var ht = Math.min(1, (T - 1.6) / 0.5);
      haoGe.rotation.x = 0.26 * easeInOut(ht);
      up.leftArm.rotation.x = -1.25;
      up.rightArm.rotation.x = -1.25;
      up.leftArm.rotation.z = 0.35;
      up.rightArm.rotation.z = -0.35;
      up.leftLeg.rotation.x = -0.2 * ht;
      up.rightLeg.rotation.x = 0.2 * ht;
      if (up.head) up.head.rotation.x = 0.22;
    }

    /* ---- 喷血 + 滴血 + 浸染 + 血泊 ---- */
    if (T >= 0.48 && !S.deathBlood) {
      S.deathBlood = true;
      S.deathDrip = true;
      spawnBloodSpray(player.position.x, player.position.y + 1.24, player.position.z + 0.15);
      bloodFountainT = CONFIG.bloodFountainTime;
      resetBloodDrips(player.position.x, player.position.y + 1.2, player.position.z + 0.15);
      bloodRingT = 0.6;
      bloodRing.visible = true;
      bloodStainT = 0;
      bloodPoolT = 0;
      window.Runners.setBloodyHands(haoGe, true);
      window.Runners.setBloodyKnife(huaQiang, true);
      S.shake = 0.55;
      S.flash = 0.85;
    }
    if (T >= CONFIG.deathBlood2At && !S.deathBlood2) {
      S.deathBlood2 = true;
      spawnBloodSpray(player.position.x, player.position.y + 1.24, player.position.z + 0.15);
      resetBloodDrips(player.position.x, player.position.y + 1.2, player.position.z + 0.15);
      bloodRingT = Math.max(bloodRingT, 0.5);
      S.shake = Math.max(S.shake, 0.45);
    }
    if (T >= 6.2 && S.deathDrip) {
      S.deathDrip = false;
      dripPoints.visible = false;
    }
    if (T >= 8.55 && !S.deathSmirk) {
      S.deathSmirk = true;
      window.Runners.setFace(huaQiang, 'huaqiang-smirk');
      haogeTag.visible = false;
      huaqiangTag.visible = false;
      xiaoDiTag.visible = false;
    }

    /* ---- 音效时机 ---- */
    if (T >= 0.62 && !S.deathScream) {
      S.deathScream = true;
      S.shake = 0.5;
      S.flash = 0.8;
      window.AppAudio.playVoice('scream');
    }
    if (T >= CONFIG.sarilangAt && !S.deathSarilang) {
      S.deathSarilang = true;
      window.AppAudio.playVoice('sarilang');
    }
    if (T >= CONFIG.endingAudioAt && !S.deathEnding) {
      S.deathEnding = true;
      window.AppAudio.playVoice('ending');
    }

    if (T >= CONFIG.deathTime && !S.deathOverShown) {
      S.deathOverShown = true;
      try { localStorage.setItem('haoge_death_seen', '1'); } catch (e) {}
      hide('skipBtn');
      hide('skipHint');
      show('overScreen');
    }
  }

  function skipEnding() {
    if (S.mode !== 'gameover' || S.deathOverShown) return;
    S.deathSkipped = true;
    S.deathOverShown = true;
    hide('skipBtn');
    hide('skipHint');
    show('overScreen');
    window.AppAudio.stop();
  }

  function animateCharacters(dt) {
    if (window.RunnerAnim && (
      S.mode === 'gameover' ||
      PIGUA.active ||
      S.headTurnT > 0 ||
      S.pushPoseT > 0 ||
      S.chaserFlyT > 0 ||
      S.chaserHitT > 0 ||
      S.lastChanceT > 0
    )) {
      window.RunnerAnim.freeze(haoGe);
      window.RunnerAnim.freeze(huaQiang);
    }
    if (PIGUA.active && haoGe.userData && haoGe.userData.head) {
      var piguaTurn = Math.min(1, PIGUA.t / CONFIG.piguaHeadTurnIn);
      var piguaYaw = CONFIG.piguaHeadYaw * easeInOut(piguaTurn);
      if (PIGUA.splitDone && PIGUA.splitT > 0) {
        var piguaReturn = Math.min(1, (PIGUA.t - PIGUA.splitT) / CONFIG.piguaHeadReturn);
        piguaYaw *= (1 - easeInOut(piguaReturn));
      }
      haoGe.userData.head.rotation.y = -S.piguaHeadDir * piguaYaw;
      haoGe.rotation.z = S.piguaHeadDir * CONFIG.piguaHeadLean * (piguaYaw / CONFIG.piguaHeadYaw);
    } else if (S.headTurnT > 0) {
      S.headTurnT = Math.max(0, S.headTurnT - dt);
      if (haoGe.userData && haoGe.userData.head) {
        var elapsed = CONFIG.sarilangHeadTime - S.headTurnT;
        var yaw = 0;
        if (elapsed < 0.45) yaw = easeInOut(Math.min(1, elapsed / 0.45)) * CONFIG.sarilangHeadYaw;
        else if (elapsed < 0.85) yaw = CONFIG.sarilangHeadYaw;
        else yaw = CONFIG.sarilangHeadYaw * (1 - easeOut(Math.min(1, (elapsed - 0.85) / 0.45)));
        haoGe.userData.head.rotation.y = -S.headTurnDir * yaw;
        haoGe.rotation.z = S.headTurnDir * CONFIG.sarilangLean * (yaw / CONFIG.sarilangHeadYaw);
      }
    } else {
      if (haoGe.userData && haoGe.userData.head && haoGe.userData.head.rotation.y !== 0) haoGe.userData.head.rotation.y = 0;
      if (haoGe.rotation.z !== 0) haoGe.rotation.z = 0;
    }
    if (S.mode === 'gameover') return; // 死亡演出由 updateDeath 控制姿势
    var runK = 0;
    if (S.mode === 'playing' && P.mode === 'run') runK = 7 + S.speed * 0.18;
    if (S.mode === 'menu') runK = 5;
    if (!PIGUA.active && S.mode !== 'gameover') {
      if (S.mode === 'playing' && P.sliding && haoGe.userData) {
        if (haoGe.userData.isGLB) {
          window.RunnerAnim.play(haoGe, 'slide', { timeScale: 1.6 });
        } else {
          var su = haoGe.userData;
          if (su.leftArm) {
            su.leftArm.rotation.x = 0.15;
            su.leftArm.rotation.z = 0.55;
          }
          if (su.rightArm) {
            su.rightArm.rotation.x = 0.15;
            su.rightArm.rotation.z = -0.55;
          }
          if (su.leftLeg) su.leftLeg.rotation.x = -0.15;
          if (su.rightLeg) su.rightLeg.rotation.x = 0.15;
          if (su.elbows && su.elbows.length === 2) {
            su.elbows[0].rotation.x = 0.25;
            su.elbows[1].rotation.x = 0.25;
          }
          if (su.knees && su.knees.length === 2) {
            su.knees[0].rotation.x = 0.12;
            su.knees[1].rotation.x = 0.12;
          }
          if (su.head) su.head.rotation.set(0, 0, 0);
        }
      } else if (haoGe.userData && haoGe.userData.isGLB) {
        var hAction = 'run';
        if (S.mode === 'playing') {
          if (P.mode === 'fall') hAction = 'fall';
          else if (!P.grounded) hAction = P.jumps > 1 ? 'doubleJump' : 'jump';
        }
        var hSpeed = hAction === 'jump' || hAction === 'doubleJump' ? 1 : Math.max(0.5, runK / 8);
        if (!window.RunnerAnim.play(haoGe, hAction, { timeScale: hSpeed }) && hAction !== 'run') {
          window.RunnerAnim.play(haoGe, 'run', { timeScale: Math.max(0.5, runK / 8) });
        }
      } else {
        window.Runners.animateRunner(haoGe, S.time, runK);
      }
    }
    if (P.legTuckT > 0 && !P.grounded && !PIGUA.active && haoGe.userData) {
      if (haoGe.userData.isGLB) {
        window.RunnerAnim.play(haoGe, 'doubleJump', { timeScale: 1 });
      } else {
        var lt = haoGe.userData;
        if (lt.leftLeg) lt.leftLeg.rotation.x = -1.5;
        if (lt.rightLeg) lt.rightLeg.rotation.x = -1.5;
        if (lt.knees && lt.knees.length === 2) {
          lt.knees[0].rotation.x = 1.1;
          lt.knees[1].rotation.x = 1.1;
        }
      }
    }
    if (S.headTurnT > 0 && haoGe.userData) {
      var armK = Math.min(1, Math.max(0, S.headTurnT / (CONFIG.sarilangHeadTime * 0.2)));
      if (haoGe.userData.leftArm) {
        haoGe.userData.leftArm.rotation.x = CONFIG.sarilangArmLift;
        haoGe.userData.leftArm.rotation.z = -S.headTurnDir * CONFIG.sarilangArmSide * armK;
      }
      if (haoGe.userData.rightArm) {
        haoGe.userData.rightArm.rotation.x = CONFIG.sarilangArmLift;
        haoGe.userData.rightArm.rotation.z = S.headTurnDir * CONFIG.sarilangArmSide * armK;
      }
    }
    if (PIGUA.active && P.mode === 'run' && P.grounded && !P.sliding && haoGe.userData) {
      // 华强劈瓜演出：郝哥停下跑步，转头看华强，双手护头/护胸，小碎步后撤
      if (haoGe.userData.head) haoGe.userData.head.rotation.y = S.piguaHeadDir * 0.55;
      haoGe.userData.leftArm.rotation.x = -2.1;
      haoGe.userData.rightArm.rotation.x = -2.1;
      haoGe.userData.leftArm.rotation.z = 0.45;
      haoGe.userData.rightArm.rotation.z = -0.45;
      haoGe.userData.leftLeg.rotation.x = Math.sin(S.time * 10) * 0.16;
      haoGe.userData.rightLeg.rotation.x = -Math.sin(S.time * 10) * 0.16;
      haoGe.rotation.x = 0.08;
      haoGe.position.y = Math.abs(Math.sin(S.time * 10)) * 0.04;
    }
    if (S.pushPoseT > 0 && haoGe.userData) {
      // 开大招推掌：双臂前推，微微前倾
      haoGe.userData.leftArm.rotation.x = -1.55;
      haoGe.userData.rightArm.rotation.x = -1.55;
      haoGe.rotation.x = -0.16;
    }
    if (S.chaserFlyT > 0 && S.chaserFlyDelay <= 0 && !PIGUA.active) {
      var fTotal = Math.max(0.0001, S.chaserFlyMax);
      var fp = 1 - S.chaserFlyT / fTotal;
      var fStiff = 0.12;
      var fp2 = Math.min(1, Math.max(0, (fp - fStiff) / (1 - fStiff)));
      var fArc = Math.sin(fp2 * Math.PI);
      var fAngle = fp2 * Math.PI * 2 * CONFIG.chaserFlyLoops;
      if (huaQiang.userData) {
        var flail = Math.sin(fAngle * 5) * 1.2 * fArc;
        huaQiang.userData.leftArm.rotation.x = -2.4 + flail;
        huaQiang.userData.rightArm.rotation.x = -2.4 - flail;
        huaQiang.userData.leftLeg.rotation.x = -1.6 + flail;
        huaQiang.userData.rightLeg.rotation.x = 1.6 + flail;
        if (huaQiang.userData.head) huaQiang.userData.head.rotation.x = flail * 1.1;
      }
      huaQiang.rotation.x = -0.85 * Math.cos(fAngle) - 0.4;
      huaQiang.rotation.y = Math.PI + S.chaserFlyDir * 1.5 * Math.sin(fAngle * 2);
      huaQiang.rotation.z = S.chaserFlyDir * 1.5 * Math.sin(fAngle);
      huaQiang.position.y = 0;
      if (S.chaserFlyT <= 0) {
        huaQiang.rotation.set(0, Math.PI, 0);
        huaQiang.position.y = 0;
        if (huaQiang.userData && huaQiang.userData.head) huaQiang.userData.head.rotation.set(0, 0, 0);
        S.chaserHitT = 0;
        S.chaserHitMax = 0;
      }
    } else if (S.chaserHitT > 0 && !PIGUA.active) {
      S.chaserHitT = Math.max(0, S.chaserHitT - dt);
      var hitK = S.chaserHitMax > 0 ? Math.min(1, S.chaserHitT / S.chaserHitMax) : 0;
      if (huaQiang.userData) {
        huaQiang.userData.leftLeg.rotation.x = -1.1 * hitK;
        huaQiang.userData.rightLeg.rotation.x = 1.2 * hitK;
        huaQiang.userData.leftArm.rotation.x = 1.8 * hitK;
        huaQiang.userData.rightArm.rotation.x = -2.8 * hitK;
      }
      huaQiang.rotation.x = -0.55 * hitK;
      huaQiang.position.y = 0.25 * hitK;
      if (S.chaserHitT <= 0) {
        huaQiang.rotation.x = 0;
        huaQiang.position.y = 0;
        S.chaserHitMax = 0;
      }
    } else if (!PIGUA.active) {
      if (S.mode === 'playing' && S.lastChanceT > 0) {
        // 濒死演出：华强举刀扑近身
        if (huaQiang.userData) {
          huaQiang.userData.leftLeg.rotation.x = -0.55;
          huaQiang.userData.rightLeg.rotation.x = 0.6;
          huaQiang.userData.leftArm.rotation.x = 1.15;
          huaQiang.userData.rightArm.rotation.x = -1.65;
        }
        huaQiang.rotation.x = -0.22;
      } else {
        huaQiang.rotation.x = 0;
        if (huaQiang.userData && huaQiang.userData.isGLB) {
          if (S.mode === 'playing' || S.mode === 'menu') {
            window.RunnerAnim.play(huaQiang, 'run', { timeScale: S.mode === 'menu' ? 5 / 8 : 1 });
          } else {
            window.RunnerAnim.freeze(huaQiang);
          }
        } else {
          var chaserK = (S.mode === 'playing' || S.mode === 'menu') ? 8 : 0;
          window.Runners.animateRunner(huaQiang, S.time, chaserK);
        }
      }
    }
  }

  function cameraUpdate(dt) {
    if (S.mode === 'menu') {
      camera.position.y = 7.4;
      camera.position.z = 9.2;
      camera.lookAt(0, 1.3, -10);
      return;
    }
    if (S.mode === 'gameover') {
      if (S.deathT >= 8.4) {
        // 结尾特写：跟随华强，定格得意侧脸
        var ez2 = easeIn(Math.min(1, (S.deathT - 2.3) / (CONFIG.deathTime - 2.3)));
        var sx = player.position.x + 1.7 + ez2 * 6.8;
        var sz = player.position.z + 1.9 + ez2 * 4.1;
        camera.position.x += ((sx - 2.0) - camera.position.x) * Math.min(1, dt * 5);
        camera.position.y += (1.35 - camera.position.y) * Math.min(1, dt * 5);
        camera.position.z += ((sz + 1.75) - camera.position.z) * Math.min(1, dt * 5);
        camera.lookAt(sx - 0.1, 0.94, sz + 0.5);
        el.vignette.style.opacity = '0.62';
        return;
      }
      // 死亡演出：镜头分两阶段（先贴出血，再拉远给拥抱全景）
      var dc = Math.min(1, S.deathT * 1.8);
      var stageA = S.deathT < 1.6;
      camera.position.x += ((player.position.x * 0.55) - camera.position.x) * Math.min(1, dt * 5);
      camera.position.y += ((stageA ? 4.6 : 5.4) - camera.position.y) * Math.min(1, dt * 4);
      camera.position.z += ((stageA ? 7.4 : 8.6) - camera.position.z) * Math.min(1, dt * 4);
      var lookX = player.position.x * 0.4 + (S.deathT >= 1.6 ? 0.28 : 0);
      camera.lookAt(lookX, stageA ? 0.94 : 1.17, player.position.z + (stageA ? 2.3 : 2.5));
      el.vignette.style.opacity = (0.35 + dc * 0.2).toFixed(3);
      return;
    }
    var tension = Math.max(0, CONFIG.catchGap + 2 - S.gap) / 2;
    var chaseZ = PIGUA.active ? (S.gap + S.chaserZOff) : chaser.position.z;
    var introX = player.position.x * 0.5 + 2.8;
    var introY = 5.6;
    var introZ = chaseZ + 3.0;
    var introLX = player.position.x * 0.5;
    var introLY = 1.3;
    var introLZ = player.position.z + 5.0;
    var chaseX = player.position.x * 0.5 + 0.4;
    var chaseY = 7.2;
    var chaseZ2 = Math.max(player.position.z + 8.0, Math.min(16, chaseZ + 2.2));
    var chaseLX = player.position.x * 0.5;
    var chaseLY = 4.5;
    var chaseLZ = player.position.z + 3.0;
    var k = 1;
    if (S.camIntroT > 0) {
      S.camIntroT = Math.max(0, S.camIntroT - dt);
      if (S.camIntroT <= 0) S.camBlendT = CONFIG.camIntroBlendTime;
      k = 0;
    } else if (S.camBlendT > 0) {
      if (!S.camBlendShown) {
        S.camBlendShown = true;
        showBubble('华强追上来了！快跑！', true);
      }
      S.camBlendT = Math.max(0, S.camBlendT - dt);
      k = easeInOut(1 - S.camBlendT / CONFIG.camIntroBlendTime);
    }
    var targetX = introX + (chaseX - introX) * k;
    var targetY = introY + (chaseY - introY) * k;
    var targetZ = introZ + (chaseZ2 - introZ) * k;
    var lookX = introLX + (chaseLX - introLX) * k;
    var lookY = introLY + (chaseLY - introLY) * k;
    var lookZ = introLZ + (chaseLZ - introLZ) * k;
    var shakeX = 0;
    var shakeY = 0;
    if (S.shake > 0) {
      S.shake -= dt;
      var s = Math.max(0, S.shake) * 0.4;
      shakeX = (Math.random() - 0.5) * s;
      shakeY = (Math.random() - 0.5) * s;
    }
    S.flash = Math.max(0, S.flash - dt * 0.8);
    var urgency = 0;
    if (S.camBlendT > 0 && CONFIG.camIntroBlendTime > 0) {
      var bp = 1 - S.camBlendT / CONFIG.camIntroBlendTime;
      urgency = Math.sin(bp * Math.PI) * 0.28;
    }
    camera.position.x += (targetX + shakeX - camera.position.x) * Math.min(1, dt * 6);
    camera.position.y += (targetY + shakeY - camera.position.y) * Math.min(1, dt * 5);
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, dt * 5);
    camera.lookAt(lookX, lookY, lookZ);
    el.vignette.style.opacity = Math.min(0.62, tension * 0.2 + S.flash + urgency).toFixed(3);
  }

  /* ---------------- 输入 ---------------- */
  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].indexOf(k) >= 0) e.preventDefault();
    if (!el.introScreen.classList.contains('hidden')) {
      if (k === 'Enter' || k === ' ') advanceIntro();
      return;
    }
    if (k === 'm' || k === 'M') { toggleMute(); return; }
    if (k === 'e' || k === 'E') { releaseSkill(); return; }
    if (k === 'Escape' || k === 'p' || k === 'P') {
      if (!el.helpModal.classList.contains('hidden')) {
        closeHelpModal();
        return;
      }
      if (!el.eggModal.classList.contains('hidden')) {
        hide('eggModal');
        return;
      }
      if (S.mode === 'playing' || S.mode === 'paused') togglePause();
      return;
    }
    if (S.mode === 'menu' && (k === 'Enter' || k === ' ')) { startGame(); return; }
    if (S.mode === 'gameover' && S.canSkipEnding && !S.deathOverShown && (k === 'Enter' || k === ' ')) {
      skipEnding();
      return;
    }
    if (S.mode === 'gameover' && (k === 'Enter' || k === ' ')) { startGame(); return; }
    if (k === ' ' && (S.mode === 'playing' || S.mode === 'paused')) { togglePause(); return; }
    if (S.mode !== 'playing') return;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') moveLane(-1);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') moveLane(1);
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') doJump();
    else if (k === 'ArrowDown' || k === 's' || k === 'S') doSlide();
  });

  var touchStart = null;
  var touchDone = false;
  // 滑动过程中实时触发，不再等抬手；阈值高于普通误触
  var TOUCH_LANE_DX = 18;
  var TOUCH_JUMP_DY = 22;
  renderer.domElement.addEventListener('pointerdown', function (e) {
    touchStart = { x: e.clientX, y: e.clientY };
    touchDone = false;
    window.AppAudio.ensure();
  });
  renderer.domElement.addEventListener('pointermove', function (e) {
    if (!touchStart || touchDone) return;
    var dx = e.clientX - touchStart.x;
    var dy = e.clientY - touchStart.y;
    var ax = Math.abs(dx);
    var ay = Math.abs(dy);
    if (ax < TOUCH_LANE_DX && ay < TOUCH_JUMP_DY) return;
    touchDone = true;
    if (ax > ay) moveLane(dx > 0 ? 1 : -1);
    else if (dy < 0) doJump();
    else doSlide();
  });
  renderer.domElement.addEventListener('pointerup', function () {
    touchStart = null;
  });
  renderer.domElement.addEventListener('pointercancel', function () {
    touchStart = null;
  });

  function toggleMute() {
    var muted = window.AppAudio.toggle();
    el.muteBtn.textContent = muted ? '🔇' : '🔊';
  }

  function setPaused(paused) {
    if (paused) {
      if (S.mode !== 'playing') return;
      S.mode = 'paused';
      show('pauseScreen');
      el.pauseBtn.textContent = '▶';
      window.AppAudio.ui();
    } else {
      if (S.mode !== 'paused') return;
      S.mode = 'playing';
      hide('pauseScreen');
      el.pauseBtn.textContent = '⏸';
      window.AppAudio.ui();
    }
  }

  function togglePause() {
    setPaused(S.mode === 'playing');
  }

  el.startBtn.addEventListener('click', startGame);
  el.restartBtn.addEventListener('click', startGame);
  el.eggBtn.addEventListener('click', openEggModal);
  el.eggClose.addEventListener('click', function () { hide('eggModal'); });
  el.helpBtn.addEventListener('click', openHelpModal);
  el.helpClose.addEventListener('click', closeHelpModal);
  el.pauseEggBtn.addEventListener('click', openEggModal);
  el.pauseHelpBtn.addEventListener('click', openHelpModal);
  el.skipBtn.addEventListener('click', skipEnding);
  el.introNext.addEventListener('click', advanceIntro);
  el.introSkip.addEventListener('click', function () { finishIntro(false); });
  el.introReplay.addEventListener('click', showIntro);
  el.tipReplay.addEventListener('click', function () {
    try { localStorage.removeItem('haoge_tips_seen'); } catch (e) {}
    S.tipsEnabled = true;
  });
  el.muteBtn.addEventListener('click', toggleMute);
  el.pauseBtn.addEventListener('click', togglePause);
  el.resumeBtn.addEventListener('click', function () { setPaused(false); });
  el.pauseRestartBtn.addEventListener('click', function () {
    setPaused(false);
    startGame();
  });
  el.skillBtn.addEventListener('click', releaseSkill);

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ---------------- 主循环 ---------------- */
  var last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (S.mode === 'playing') update(dt);
    else if (S.mode === 'menu') updateMenu(dt);
    else if (S.mode === 'gameover') updateDeath(dt);
    else if (S.mode === 'paused') {
      renderer.render(scene, camera);
      return;
    }
    fxTick(dt);
    animateCharacters(dt);
    if (window.RunnerModels && window.RunnerModels.update) window.RunnerModels.update(dt);
    cameraUpdate(dt);
    renderer.render(scene, camera);
  }

  try {
    // 计分版本迁移：旧计分下的历史最高分只清一次，之后正常保存
    if (localStorage.getItem('haoge_score_version') !== '2') {
      localStorage.removeItem('haoge_best');
      localStorage.setItem('haoge_score_version', '2');
    }
    S.best = parseInt(localStorage.getItem('haoge_best'), 10) || 0;
  } catch (e) {}
  try {
    S.tipsEnabled = !localStorage.getItem('haoge_tips_seen');
  } catch (e) {
    S.tipsEnabled = false;
  }
  try {
    if (!localStorage.getItem('haoge_intro_seen')) showIntro();
  } catch (e) {
    showIntro();
  }
  window.__gameDebug = {
    scene: scene,
    S: S,
    camera: camera,
    renderer: renderer,
    player: player,
    chaser: chaser,
    haoGe: haoGe,
    huaQiang: huaQiang,
    playerBody: playerBody,
    chaserBody: chaserBody,
  };
  el.bestStart.textContent = S.best;
  el.iconMelon.src = drawIcon('melon');
  el.iconGold.src = drawIcon('gold');
  el.iconCert.src = drawIcon('cert');
  updateHUD();
  requestAnimationFrame(loop);
})();

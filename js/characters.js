window.Runners = (function () {
  'use strict';

  function std(color, opts) {
    return new THREE.MeshStandardMaterial(
      Object.assign({ color: color, roughness: 0.85, metalness: 0 }, opts || {})
    );
  }

  var M = {
    skin: std(0x5e4231, { roughness: 0.58 }),
    pants: std(0x39404c, { roughness: 0.86 }),
    tank: std(0xf6f3ea, { roughness: 0.9 }),
    shirt: std(0xf2f2f2, { roughness: 0.82 }),
    shirtDark: std(0x4a5a66, { roughness: 0.82 }),
    jacket: std(0x17191f, { roughness: 0.38, metalness: 0.18 }),
    jacketLapel: std(0x22262e, { roughness: 0.32, metalness: 0.2 }),
    shoe: std(0x24272c, { roughness: 0.78 }),
    sole: std(0xe9e6de, { roughness: 0.92 }),
    hair: std(0x141519, { roughness: 0.72 }),
    hairBrown: std(0x2a2420, { roughness: 0.7 }),
    metal: std(0x9aa2ad, { roughness: 0.28, metalness: 0.85 }),
    metalDark: std(0x5d636c, { roughness: 0.35, metalness: 0.7 }),
    wood: std(0x8a5a33, { roughness: 0.72 }),
    eyeWhite: std(0xfdfcf9, { roughness: 0.28 }),
    eyeIris: std(0x3a2a20, { roughness: 0.35 }),
    mouth: std(0x6e2c26, { roughness: 0.6 }),
    mouthDark: std(0x4a1c1a, { roughness: 0.65 }),
    teeth: std(0xf5f2ea, { roughness: 0.5 }),
    blush: new THREE.MeshBasicMaterial({ color: 0xe8927d, transparent: true, opacity: 0.45 }),
    sweat: new THREE.MeshStandardMaterial({ color: 0x9fd8ef, roughness: 0.15, transparent: true, opacity: 0.9 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xfff3b0 }),
    tire: std(0x15171a, { roughness: 0.95 }),
    frame: std(0x262b33, { roughness: 0.5, metalness: 0.4 }),
  };

  function mesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function roundedRectShape(w, h, r) {
    var s = new THREE.Shape();
    var x = -w / 2;
    var y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  function centerGeo(geo) {
    geo.computeBoundingBox();
    var bb = geo.boundingBox;
    geo.translate(
      -(bb.min.x + bb.max.x) / 2,
      -(bb.min.y + bb.max.y) / 2,
      -(bb.min.z + bb.max.z) / 2
    );
    return geo;
  }

  function roundBox(w, h, d, opts) {
    var r = opts.r || Math.min(w, h, d) * 0.15;
    var geo = new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), {
      depth: d,
      bevelEnabled: true,
      bevelThickness: r * 0.85,
      bevelSize: r * 0.9,
      bevelSegments: 2,
      curveSegments: 6,
    });
    geo.rotateX(Math.PI / 2);
    centerGeo(geo);
    return mesh(geo, opts.mat);
  }

  function sphere(r, mat, seg, thetaStart, thetaLength) {
    var geo = new THREE.SphereGeometry(
      r,
      seg || 14,
      seg ? Math.max(8, seg >> 1) : 10,
      0,
      Math.PI * 2,
      thetaStart || 0,
      thetaLength === undefined ? Math.PI : thetaLength
    );
    return mesh(geo, mat);
  }

  function capsule(len, topR, botR, mat, seg) {
    var g = new THREE.Group();
    var cyl = mesh(new THREE.CylinderGeometry(topR, botR, len, seg || 12), mat);
    g.add(cyl);
    if (topR > 0.002) {
      var top = mesh(new THREE.SphereGeometry(topR, seg || 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
      top.position.y = len / 2;
      g.add(top);
    }
    if (botR > 0.002) {
      var bottom = mesh(new THREE.SphereGeometry(botR, seg || 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat);
      bottom.position.y = -len / 2;
      g.add(bottom);
    }
    return g;
  }

  function faceTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 2;
    return new THREE.CanvasTexture(c);
  }

  var EXPR = {
    'haoge': { browL: 0.14, browR: -0.14, eyeScale: 1, mouth: 'closed', sweat: false, blush: true },
    'huaqiang': { browL: 0.26, browR: -0.26, eyeScale: 0.78, mouth: 'closed', sweat: false, blush: false },
    'huaqiang-smirk': { browL: 0.34, browR: 0.12, eyeScale: 0.66, mouth: 'smirk', sweat: false, blush: false },
  };

  function applyExpression(c, kind) {
    var cfg = EXPR[kind] || EXPR['haoge'];
    c.browL.rotation.z = cfg.browL;
    c.browR.rotation.z = cfg.browR;
    c.eyeL.scale.set(cfg.eyeScale, cfg.eyeScale, cfg.eyeScale);
    c.eyeR.scale.set(cfg.eyeScale, cfg.eyeScale, cfg.eyeScale);
    c.mouthClosed.visible = cfg.mouth === 'closed';
    c.mouthOpen.visible = cfg.mouth === 'open';
    c.mouthSmirk.visible = cfg.mouth === 'smirk';
    c.sweat.visible = !!cfg.sweat;
    c.blushL.visible = !!cfg.blush;
    c.blushR.visible = !!cfg.blush;
  }

  function makeEye() {
    var g = new THREE.Group();
    var white = mesh(new THREE.SphereGeometry(0.052, 10, 8), M.eyeWhite);
    white.scale.set(1, 1.3, 0.55);
    g.add(white);
    var iris = mesh(new THREE.SphereGeometry(0.024, 8, 6), M.eyeIris);
    iris.position.set(0, 0.006, 0.036);
    g.add(iris);
    var pupil = mesh(new THREE.SphereGeometry(0.013, 6, 5), new THREE.MeshBasicMaterial({ color: 0x171310 }));
    pupil.position.set(0, 0.006, 0.049);
    g.add(pupil);
    var hl = mesh(new THREE.SphereGeometry(0.006, 5, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hl.position.set(0.009, 0.018, 0.058);
    g.add(hl);
    return g;
  }

  function buildFace(opts) {
    var hairMat = opts.hair === 'flat' ? M.hair : M.hairBrown;
    var c = {};

    c.browL = roundBox(0.17, 0.04, 0.05, { mat: hairMat, r: 0.012 });
    c.browL.position.set(-0.115, 0.27, 0.3);
    c.browR = roundBox(0.17, 0.04, 0.05, { mat: hairMat, r: 0.012 });
    c.browR.position.set(0.115, 0.27, 0.3);

    c.eyeL = makeEye();
    c.eyeL.position.set(-0.12, 0.145, 0.31);
    c.eyeR = makeEye();
    c.eyeR.position.set(0.12, 0.145, 0.31);

    var nose = sphere(0.03, M.skin, 10);
    nose.scale.set(0.9, 1.15, 0.8);
    nose.position.set(0, 0.075, 0.355);
    c.nose = nose;

    c.mouthClosed = roundBox(0.12, 0.03, 0.05, { mat: M.mouth, r: 0.01 });
    c.mouthClosed.position.set(0, -0.055, 0.315);

    c.mouthOpen = new THREE.Group();
    var mouthIn = sphere(0.055, M.mouthDark, 10);
    mouthIn.scale.set(1, 1.25, 0.55);
    mouthIn.position.set(0, -0.06, 0.31);
    c.mouthOpen.add(mouthIn);
    var teeth = roundBox(0.095, 0.028, 0.03, { mat: M.teeth, r: 0.006 });
    teeth.position.set(0, -0.04, 0.32);
    c.mouthOpen.add(teeth);
    c.mouthOpen.visible = false;

    var smirk = mesh(new THREE.TorusGeometry(0.06, 0.01, 6, 14, Math.PI), M.mouth);
    smirk.rotation.z = Math.PI;
    smirk.position.set(0, -0.05, 0.32);
    c.mouthSmirk = smirk;
    c.mouthSmirk.visible = false;

    c.blushL = sphere(0.028, M.blush, 8);
    c.blushL.position.set(-0.16, -0.005, 0.26);
    c.blushR = sphere(0.028, M.blush, 8);
    c.blushR.position.set(0.16, -0.005, 0.26);
    c.blushL.visible = false;
    c.blushR.visible = false;

    c.sweat = new THREE.Group();
    var sw1 = sphere(0.024, M.sweat, 8);
    sw1.position.set(0.235, 0.23, 0.21);
    c.sweat.add(sw1);
    var sw2 = sphere(0.017, M.sweat, 6);
    sw2.position.set(0.185, 0.3, 0.19);
    c.sweat.add(sw2);
    c.sweat.visible = false;

    var face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 0.48),
      new THREE.MeshBasicMaterial({ map: faceTexture(), transparent: true, opacity: 0, depthWrite: false })
    );
    face.position.set(0, 0.08, 0.32);
    c.face = face;
    return c;
  }

  function buildTorso(opts) {
    var t = new THREE.Group();
    t.position.y = 1.06;

    var hips = roundBox(0.62, 0.22, 0.44, { mat: M.pants, r: 0.06 });
    hips.position.y = 0.04;
    t.add(hips);
    var belt = roundBox(0.66, 0.06, 0.46, { mat: M.pants, r: 0.02 });
    belt.position.y = 0.15;
    t.add(belt);

    if (opts.jacket) {
      var chest = roundBox(0.72, 0.5, 0.44, { mat: M.shirt, r: 0.11 });
      chest.position.y = 0.34;
      t.add(chest);
      var coat = roundBox(0.8, 0.55, 0.48, { mat: M.jacket, r: 0.12 });
      coat.position.y = 0.33;
      t.add(coat);
      var lapelL = roundBox(0.4, 0.5, 0.14, { mat: M.jacketLapel, r: 0.06 });
      lapelL.position.set(-0.2, 0.35, 0.21);
      lapelL.rotation.y = 0.1;
      t.add(lapelL);
      var lapelR = roundBox(0.4, 0.5, 0.14, { mat: M.jacketLapel, r: 0.06 });
      lapelR.position.set(0.2, 0.35, 0.21);
      lapelR.rotation.y = -0.1;
      t.add(lapelR);
      var shirtV = roundBox(0.22, 0.4, 0.08, { mat: M.shirt, r: 0.03 });
      shirtV.position.set(0, 0.4, 0.24);
      t.add(shirtV);
      var collar = roundBox(0.26, 0.07, 0.1, { mat: M.shirt, r: 0.02 });
      collar.position.set(0, 0.6, 0.15);
      t.add(collar);
      var padL = roundBox(0.32, 0.18, 0.46, { mat: M.jacket, r: 0.07 });
      padL.position.set(-0.3, 0.56, 0);
      padL.rotation.z = 0.1;
      t.add(padL);
      var padR = padL.clone();
      padR.position.x = 0.3;
      padR.rotation.z = -0.1;
      t.add(padR);
    } else if (opts.shirt) {
      var body = roundBox(0.7, 0.62, 0.44, { mat: M.shirtDark, r: 0.12 });
      body.position.y = 0.34;
      t.add(body);
      var shirtCollar = roundBox(0.24, 0.07, 0.1, { mat: M.shirt, r: 0.02 });
      shirtCollar.position.set(0, 0.64, 0.16);
      t.add(shirtCollar);
      var btnPos = [[0, 0.22], [-0.1, 0.36], [0.1, 0.36], [0, 0.5]];
      for (var bi = 0; bi < btnPos.length; bi++) {
        var btn = sphere(0.022, M.shirt, 6);
        btn.position.set(btnPos[bi][0], btnPos[bi][1], 0.225);
        t.add(btn);
      }
    } else {
      var tank = roundBox(0.68, 0.62, 0.42, { mat: M.tank, r: 0.12 });
      tank.position.y = 0.34;
      t.add(tank);
      var strapL = roundBox(0.1, 0.24, 0.4, { mat: M.tank, r: 0.03 });
      strapL.position.set(-0.29, 0.58, 0);
      strapL.rotation.z = 0.32;
      t.add(strapL);
      var strapR = strapL.clone();
      strapR.position.x = 0.29;
      strapR.rotation.z = -0.32;
      t.add(strapR);
      var neckline = roundBox(0.26, 0.07, 0.05, { mat: M.pants, r: 0.015 });
      neckline.position.set(0, 0.64, 0.21);
      t.add(neckline);
      var tankBtnPos = [[0, 0.22], [-0.1, 0.36], [0.1, 0.36], [0, 0.5]];
      for (var ti = 0; ti < tankBtnPos.length; ti++) {
        var tbtn = sphere(0.022, M.pants, 6);
        tbtn.position.set(tankBtnPos[ti][0], tankBtnPos[ti][1], 0.215);
        t.add(tbtn);
      }
    }
    return t;
  }

  function buildHead(opts) {
    var headG = new THREE.Group();
    headG.position.y = 1.8;

    var skull = sphere(0.32, M.skin, 16);
    skull.scale.set(1, 1.05, 0.92);
    skull.position.y = 0.06;
    headG.add(skull);

    var jaw = roundBox(0.4, 0.18, 0.34, { mat: M.skin, r: 0.07 });
    jaw.position.set(0, -0.04, 0.04);
    headG.add(jaw);

    var earL = sphere(0.09, M.skin, 8);
    earL.position.set(-0.315, 0.14, 0);
    headG.add(earL);
    var earR = sphere(0.09, M.skin, 8);
    earR.position.set(0.315, 0.14, 0);
    headG.add(earR);

    var fc = buildFace(opts);
    headG.add(fc.browL);
    headG.add(fc.browR);
    headG.add(fc.eyeL);
    headG.add(fc.eyeR);
    headG.add(fc.nose);
    headG.add(fc.mouthClosed);
    headG.add(fc.mouthOpen);
    headG.add(fc.mouthSmirk);
    headG.add(fc.blushL);
    headG.add(fc.blushR);
    headG.add(fc.sweat);
    headG.add(fc.face);

    if (opts.hair === 'flat') {
      var flatBall = sphere(0.35, M.hair, 18);
      flatBall.position.set(0, 0.34, -0.18);
      headG.add(flatBall);
    } else {
      var hairBall = sphere(0.35, M.hairBrown, 18);
      hairBall.position.set(0, 0.34, -0.18);
      headG.add(hairBall);
    }

    if (opts.cigarette) {
      var cig = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6), M.shirt);
      cig.rotation.z = -0.55;
      cig.position.set(0.16, 0.0, 0.28);
      headG.add(cig);
      var ember = mesh(new THREE.SphereGeometry(0.022, 6, 5), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
      ember.position.set(0.26, -0.045, 0.17);
      headG.add(ember);
    }

    return { group: headG, face: fc.face, controls: fc };
  }

  function portraitColor(color) {
    var material = std(color);
    material.color.convertSRGBToLinear();
    return material;
  }

  var portraitMaterials = {
    haoge: {
      skin: portraitColor(0xc38461), warm: portraitColor(0xa25343), hair: portraitColor(0x493528),
      outfit: portraitColor(0xf5ece0), binding: portraitColor(0xc9bdb0), pants: portraitColor(0x526d7b),
      shoes: portraitColor(0x514237), sole: portraitColor(0xb79972),
    },
    huaqiang: {
      skin: portraitColor(0xb47860), warm: portraitColor(0x864d44), hair: portraitColor(0x302a2c),
      outfit: portraitColor(0x353942), binding: portraitColor(0x545760), pants: portraitColor(0x454247),
      shoes: portraitColor(0x363438), sole: portraitColor(0x5c514b),
    },
  };

  function sampleProfile(profile, y) {
    for (var i = 1; i < profile.length; i++) {
      var top = profile[i];
      if (y > top[0]) continue;
      var bottom = profile[i - 1];
      var mix = Math.max(0, (y - bottom[0]) / (top[0] - bottom[0]));
      return bottom.slice(1).map(function (value, j) {
        return value + (top[j + 1] - value) * mix;
      });
    }
    return profile[profile.length - 1].slice(1);
  }

  function profileMesh(profile, rows, material, thickness, opening) {
    var columns = 32;
    var open = opening > 0;
    var count = open ? columns + 1 : columns;
    var positions = [];
    var indices = [];
    rows.forEach(function (row, i) {
      for (var j = 0; j < count; j++) {
        var angle = opening + (Math.PI * 2 - opening * 2) * j / columns;
        var y = typeof row === 'function' ? row(angle) : row;
        var radii = sampleProfile(profile, y);
        var padding = radii[0] ? thickness : 0;
        positions.push((radii[0] + padding) * Math.sin(angle), y,
          radii[2] + (radii[1] + padding) * Math.cos(angle));
        if (i === 0 || (open && j === columns)) continue;
        var next = open ? j + 1 : (j + 1) % columns;
        var a = (i - 1) * count + j;
        var b = (i - 1) * count + next;
        indices.push(a, b, a + count, b, b + count, a + count);
      }
    });
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    if (Array.isArray(material)) {
      // 领口和下摆与衣服共用顶点，避免两层表面相互穿插。
      var band = columns * 6;
      var body = (rows.length - 3) * band;
      geometry.addGroup(0, band, 1);
      geometry.addGroup(band, body, 0);
      geometry.addGroup(band + body, band, 1);
    }
    geometry.computeVertexNormals();
    return mesh(geometry, material);
  }

  function profileRows(profile) {
    return profile.map(function (row) { return row[0]; });
  }

  function oval(x, y, z, material) {
    var shape = sphere(1, material, 16);
    shape.scale.set(x, y, z);
    return shape;
  }

  function buildPortraitTorso(opts) {
    var g = new THREE.Group();
    g.position.y = 1.06;
    var palette = opts.palette;
    var chest = opts.jacket ? 0.39 : 0.414;
    var profile = [
      [-0.115, 0, 0, 0], [-0.08, 0.28, 0.19, 0], [0.11, 0.292, 0.207, 0.014],
      [0.28, 0.32, 0.216, 0.012], [0.45, chest, 0.228, 0.014],
      [0.57, chest - 0.005, 0.194, 0], [0.64, 0.305, 0.156, -0.012],
      [0.705, 0.114, 0.092, -0.012], [0.71, 0, 0, -0.012],
    ];
    var hips = profileMesh(profile, [-0.115, -0.08, 0.087], palette.pants, 0.003, 0);
    g.add(hips);
    var torsoRows = profileRows(profile).slice(2);
    torsoRows.unshift(0.058);

    if (opts.jacket) {
      var shirt = portraitColor(0xd4c6b4);
      g.add(profileMesh(profile, torsoRows, shirt, 0, 0));
      function collar(angle) { return 0.639 - 0.105 * Math.pow(Math.max(0, Math.cos(angle)), 3); }
      var jacket = profileMesh(profile, [
        0.057, 0.113, 0.28, 0.45,
        function (angle) { return collar(angle) - 0.048; }, collar,
      ], [palette.outfit, palette.binding], 0.028, 0.32);
      jacket.userData.toonOutline = true;
      g.add(jacket);
    } else {
      g.add(profileMesh(profile, torsoRows, palette.skin, 0, 0));
      function neckline(angle) {
        var front = Math.max(0, Math.cos(angle));
        return 0.574 + 0.078 * Math.pow(Math.abs(Math.sin(angle)), 4) - 0.098 * front * front;
      }
      var vest = profileMesh(profile, [
        0.062, 0.086, 0.11, 0.28, 0.43,
        function (angle) { return neckline(angle) - 0.022; }, neckline,
      ], [palette.outfit, palette.binding], 0.025, 0);
      vest.userData.toonOutline = true;
      g.add(vest);
    }
    return g;
  }

  function buildPortraitHead(opts) {
    var group = new THREE.Group();
    group.position.y = 1.825;
    var palette = opts.palette;
    var width = opts.jacket ? 0.246 : 0.281;
    var profile = [
      [-0.162, 0, 0, 0.061], [-0.128, width * 0.63, 0.139, 0.051],
      [-0.06, width * 0.91, 0.191, 0.03], [0.055, width, 0.222, 0.014],
      [0.167, width * 0.98, 0.229, -0.003], [0.261, width * 0.92, 0.213, -0.017],
      [0.34, width * 0.79, 0.175, -0.023], [0.384, width * 0.52, 0.118, -0.021],
      [0.419, 0, 0, -0.019],
    ];
    var skull = profileMesh(profile, profileRows(profile), palette.skin, 0, 0);
    skull.userData.toonOutline = true;
    group.add(skull);

    function hairline(angle) {
      var front = Math.max(0, Math.cos(angle));
      var side = Math.abs(Math.sin(angle));
      return 0.161 + 0.155 * Math.pow(front, 0.65) + 0.023 * side
        - (opts.jacket ? 0.044 : 0.022) * Math.pow(side, 8);
    }
    var hair = profileMesh(profile, [
      hairline, function (angle) { return (hairline(angle) * 2 + 0.34) / 3; },
      function (angle) { return (hairline(angle) + 0.68) / 3; },
      0.34, 0.384, 0.431,
    ], palette.hair, opts.jacket ? 0.027 : 0.02, 0);
    group.add(hair);

    function frontZ(x, y) {
      var s = sampleProfile(profile, y);
      return s[2] + s[1] * Math.sqrt(Math.max(0, 1 - x * x / (s[0] * s[0])));
    }
    function feature(part, x, y, offset) {
      part.position.set(x, y, frontZ(x, y) + offset);
      group.add(part);
      return part;
    }
    var c = {};
    [-1, 1].forEach(function (side) {
      var name = side < 0 ? 'L' : 'R';
      var ear = oval(0.05, 0.078, 0.051, palette.skin);
      ear.position.set(side * (width - 0.007), 0.075, -0.022);
      ear.rotation.z = -side * 0.16;
      group.add(ear);
      var inner = oval(0.027, 0.049, 0.017, palette.warm);
      inner.position.set(side * (width + 0.013), 0.075, 0.017);
      group.add(inner);

      var x = side * 0.104;
      var eye = new THREE.Group();
      eye.add(oval(0.047, opts.jacket ? 0.025 : 0.032, 0.013, palette.hair));
      var white = oval(0.041, opts.jacket ? 0.018 : 0.025, 0.011, M.eyeWhite);
      white.position.z = 0.008;
      eye.add(white);
      var iris = oval(0.016, 0.019, 0.008, M.eyeIris);
      iris.position.set(-side * 0.004, 0, 0.016);
      eye.add(iris);
      var light = oval(0.005, 0.006, 0.003, M.glow);
      light.position.set(0.002, 0.007, 0.024);
      eye.add(light);
      c['eye' + name] = feature(eye, x, 0.148, 0.004);
      c['brow' + name] = feature(oval(0.055, 0.012, 0.013, palette.hair), x, 0.204, 0.009);

      c['blush' + name] = feature(oval(0.024, 0.009, 0.005, palette.warm), side * 0.168, 0.04, 0.004);
      c['blush' + name].rotation.y = side * 0.55;
    });
    feature(oval(0.039, 0.06, 0.034, palette.skin), 0, 0.096, 0.016);
    feature(oval(0.048, 0.031, 0.031, palette.skin), 0, 0.058, 0.034);
    c.mouthClosed = feature(oval(0.064, 0.009, 0.012, M.mouth), 0, -0.047, 0.005);
    c.mouthOpen = feature(oval(0.056, 0.038, 0.016, M.mouthDark), 0, -0.043, 0.007);
    c.mouthSmirk = feature(oval(0.061, 0.014, 0.012, M.mouth), 0.011, -0.046, 0.008);
    c.mouthSmirk.rotation.z = 0.2;
    c.sweat = feature(oval(0.015, 0.027, 0.008, M.sweat), 0.183, 0.218, 0.009);
    return { group: group, face: null, controls: c };
  }

  function makeKnife() {
    var g = new THREE.Group();
    var woodMat = std(0x5c341d, { roughness: 0.72, metalness: 0.04 });
    var bolsterMat = std(0x7c8590, { roughness: 0.32, metalness: 0.75 });
    var bladeMat = std(0xd8e0e8, { roughness: 0.22, metalness: 0.85 });
    var edgeMat = std(0xf4f8fc, { roughness: 0.14, metalness: 0.92 });

    var handle = mesh(new THREE.BoxGeometry(0.024, 0.034, 0.18), woodMat);
    handle.position.set(0, 0, -0.09);
    g.add(handle);

    var bolster = mesh(new THREE.BoxGeometry(0.026, 0.042, 0.022), bolsterMat);
    bolster.position.set(0, 0, 0.005);
    g.add(bolster);

    var s = new THREE.Shape();
    s.moveTo(0.014, -0.026);
    s.lineTo(0.17, -0.034);
    s.quadraticCurveTo(0.34, -0.040, 0.42, -0.016);
    s.quadraticCurveTo(0.45, 0.006, 0.455, 0.022);
    s.lineTo(0.37, 0.034);
    s.lineTo(0.014, 0.030);
    s.closePath();

    var bladeGeo = new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: false, curveSegments: 8 });
    bladeGeo.rotateY(-Math.PI / 2);
    bladeGeo.translate(0.004, 0, 0);
    var blade = mesh(bladeGeo, bladeMat);
    g.add(blade);

    var es = new THREE.Shape();
    es.moveTo(0.016, -0.026);
    es.lineTo(0.17, -0.034);
    es.quadraticCurveTo(0.34, -0.040, 0.42, -0.016);
    es.quadraticCurveTo(0.446, 0.002, 0.454, 0.020);
    es.lineTo(0.415, -0.009);
    es.quadraticCurveTo(0.33, -0.030, 0.17, -0.025);
    es.lineTo(0.016, -0.018);
    es.closePath();
    var edgeGeo = new THREE.ExtrudeGeometry(es, { depth: 0.009, bevelEnabled: false, curveSegments: 8 });
    edgeGeo.rotateY(-Math.PI / 2);
    edgeGeo.translate(0.0045, 0, 0);
    var edge = mesh(edgeGeo, edgeMat);
    g.add(edge);

    g.userData = { blade: blade, edge: edge };
    return g;
  }

  function makeRunner(opts) {
    var g = new THREE.Group();
    var elbows = [];
    var knees = [];
    var hands = [];
    var bladeMesh;

    function addLeg(x) {
      var legG = new THREE.Group();
      legG.position.set(x, 0.88, 0);
      var pants = opts.palette ? opts.palette.pants : M.pants;
      var thigh = opts.palette
        ? capsule(0.38, opts.jacket ? 0.13 : 0.147, 0.103, pants, 12)
        : capsule(0.38, 0.13, 0.095, pants, 10);
      thigh.position.y = -0.19;
      legG.add(thigh);
      var knee = new THREE.Group();
      knee.position.y = -0.38;
      var shin = opts.palette ? capsule(0.36, 0.096, 0.071, pants, 12) : capsule(0.36, 0.085, 0.062, pants, 10);
      shin.position.y = -0.18;
      knee.add(shin);
      var foot = new THREE.Group();
      foot.position.y = -0.36;
      var shoe = opts.palette
        ? roundBox(0.23, 0.33, 0.13, { mat: opts.palette.shoes, r: 0.046 })
        : roundBox(0.24, 0.14, 0.4, { mat: M.shoe, r: 0.05 });
      shoe.position.set(0, -0.06, 0.04);
      foot.add(shoe);
      var sole = opts.palette
        ? roundBox(0.235, 0.35, 0.031, { mat: opts.palette.sole, r: 0.012 })
        : roundBox(0.22, 0.05, 0.37, { mat: M.sole, r: 0.015 });
      sole.position.set(0, -0.135, 0.04);
      foot.add(sole);
      knee.add(foot);
      legG.add(knee);
      knees.push(knee);
      return legG;
    }

    function addArm(x) {
      var arm = new THREE.Group();
      arm.position.set(x, 1.72, 0);
      var skin = opts.palette ? opts.palette.skin : M.skin;
      var sleeve = opts.jacket ? opts.palette.outfit : opts.shirt ? M.shirtDark : skin;
      var upper = capsule(0.42, opts.palette && opts.jacket ? 0.115 : 0.13, 0.095, sleeve, 10);
      upper.position.y = -0.21;
      arm.add(upper);
      var elbow = new THREE.Group();
      elbow.position.y = -0.42;
      var fore = capsule(0.34, 0.085, 0.06, sleeve, 10);
      fore.position.y = -0.17;
      elbow.add(fore);
      var hand = opts.palette ? mesh(new THREE.SphereGeometry(1, 12, 8).scale(0.069, 0.098, 0.063), skin)
        : roundBox(0.16, 0.15, 0.17, { mat: skin, r: 0.05 });
      hand.position.set(0, -0.34, 0.03);
      elbow.add(hand);
      if (opts.palette) {
        var thumb = oval(0.024, 0.048, 0.034, skin);
        thumb.position.set(x < 0 ? 0.055 : -0.055, -0.016, 0.04);
        hand.add(thumb);
        if (opts.jacket) {
          var cuff = mesh(new THREE.CylinderGeometry(0.068, 0.064, 0.105, 12), opts.palette.binding);
          cuff.position.y = -0.276;
          elbow.add(cuff);
        }
      }
      elbow.rotation.x = 0.18;
      arm.add(elbow);
      elbows.push(elbow);
      hands.push(hand);
      return { arm: arm, elbow: elbow };
    }

    var leftLeg = addLeg(-0.19);
    var rightLeg = addLeg(0.19);
    g.add(leftLeg);
    g.add(rightLeg);

    var torsoG = opts.palette ? buildPortraitTorso(opts) : buildTorso(opts);
    g.add(torsoG);

    var neck = capsule(0.18, 0.09, 0.1, opts.palette ? opts.palette.skin : M.skin, 8);
    neck.position.y = 1.63;
    g.add(neck);

    var headInfo = opts.palette ? buildPortraitHead(opts) : buildHead(opts);
    g.add(headInfo.group);
    applyExpression(headInfo.controls, opts.face || 'haoge');

    var shoulder = opts.palette ? 0.443 : 0.5;
    var leftArmInfo = addArm(-shoulder);
    var rightArmInfo = addArm(shoulder);
    g.add(leftArmInfo.arm);
    g.add(rightArmInfo.arm);

    if (opts.knife) {
      var knifeG = makeKnife();
      bladeMesh = knifeG.userData.blade;
      knifeG.position.set(0, -0.34, 0.04);
      knifeG.rotation.x = 0.22;
      rightArmInfo.elbow.add(knifeG);
    }

    g.userData = {
      leftLeg: leftLeg,
      rightLeg: rightLeg,
      leftArm: leftArmInfo.arm,
      rightArm: rightArmInfo.arm,
      head: headInfo.group,
      face: headInfo.face,
      hands: hands,
      knifeBlade: bladeMesh,
      torso: torsoG,
      elbows: elbows,
      knees: knees,
      faceControls: headInfo.controls,
    };
    if (opts.palette && window.RunnerToon) window.RunnerToon.apply(g);
    return g;
  }

  function animateRunner(runner, time, speedK) {
    var u = runner.userData;
    if (!u || !u.leftArm) return;
    if (u.isGLB) {
      if (window.RunnerAnim) {
        window.RunnerAnim.play(runner, u.currentAction || 'run', { timeScale: Math.max(0.5, speedK / 8) });
      }
      return;
    }
    var phase = time * speedK;
    var swing = Math.sin(phase) * 0.7;
    u.leftArm.rotation.x = Math.sin(phase) * 0.82;
    u.rightArm.rotation.x = -Math.sin(phase) * 0.82;
    u.leftLeg.rotation.x = -swing * 0.82;
    u.rightLeg.rotation.x = swing * 0.82;
    runner.position.y = Math.abs(Math.sin(phase)) * 0.1;
    if (u.elbows && u.elbows.length === 2) {
      u.elbows[0].rotation.x = 0.16 + Math.max(0, Math.sin(phase + Math.PI)) * 0.18;
      u.elbows[1].rotation.x = 0.16 + Math.max(0, Math.sin(phase)) * 0.18;
    }
    if (u.knees && u.knees.length === 2) {
      u.knees[0].rotation.x = 0.08 + Math.max(0, Math.sin(phase + Math.PI)) * 0.22;
      u.knees[1].rotation.x = 0.08 + Math.max(0, Math.sin(phase)) * 0.22;
    }
  }

  function setFace(runner, kind) {
    var u = runner && runner.userData;
    if (!u) return;
    u.faceKind = kind;
    if (u.isGLB) {
      if (window.RunnerModels) window.RunnerModels.setFace(runner, kind);
      return;
    }
    if (u.face) {
      u.face.material.map = faceTexture();
      u.face.material.needsUpdate = true;
    }
    if (u.faceControls) applyExpression(u.faceControls, kind);
  }

  function setBloodyHands(runner, on) {
    var hs = runner && runner.userData && runner.userData.hands;
    if (!hs) return;
    if (runner.userData.isGLB) {
      if (window.RunnerModels) window.RunnerModels.setBloodyHands(runner, on);
      return;
    }
    for (var i = 0; i < hs.length; i++) {
      var h = hs[i];
      if (!h.userData.bloodMat) {
        h.userData.origMat = h.material;
        h.userData.bloodMat = h.material.clone();
        h.userData.bloodMat.color.set(0x8e1b1b);
      }
      h.material = on ? h.userData.bloodMat : h.userData.origMat;
      h.scale.set(on ? 1.3 : 1, on ? 1.3 : 1, on ? 1.3 : 1);
    }
  }

  function setBloodyKnife(runner, on) {
    var blade = runner && runner.userData && runner.userData.knifeBlade;
    if (!blade) return;
    if (runner.userData.isGLB) {
      if (window.RunnerModels) window.RunnerModels.setBloodyKnife(runner, on);
      return;
    }
    if (!blade.userData.bloodMat) {
      blade.userData.origMat = blade.material;
      blade.userData.bloodMat = blade.material.clone();
      blade.userData.bloodMat.color.set(0x9e1b1b);
    }
    blade.material = on ? blade.userData.bloodMat : blade.userData.origMat;
  }

  function createIronHammer() {
    var g = new THREE.Group();
    var handle = mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.62, 10), M.metalDark);
    handle.position.y = 0.05;
    g.add(handle);
    var grip = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 10), M.metal);
    grip.position.y = -0.28;
    g.add(grip);
    var head = mesh(new THREE.BoxGeometry(0.42, 0.18, 0.18), M.metal);
    head.position.y = 0.34;
    g.add(head);
    var face = mesh(new THREE.BoxGeometry(0.44, 0.2, 0.02), M.metalDark);
    face.position.set(0, 0.34, 0.1);
    g.add(face);
    return g;
  }

  function makePlateTexture(lines) {
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = lines.length > 1 ? 144 : 84;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#e8b62c';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#181818';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, c.width - 12, c.height - 12);
    ctx.fillStyle = '#141414';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (lines.length > 1) {
      ctx.font = 'bold 46px "Microsoft YaHei", sans-serif';
      ctx.fillText(lines[0], c.width / 2, 46);
      ctx.font = 'bold 54px "Consolas", "Arial Black", sans-serif';
      ctx.fillText(lines[1], c.width / 2, 102);
    } else {
      ctx.font = 'bold 44px "Microsoft YaHei", "Arial Black", sans-serif';
      ctx.fillText(lines[0], c.width / 2, c.height / 2 + 2);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function makeDashTexture() {
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#12151a';
    ctx.fillRect(0, 0, 256, 128);
    // 速度表 + 油量表
    [82, 178].forEach(function (cx, idx) {
      var r = idx === 0 ? 48 : 34;
      ctx.beginPath();
      ctx.arc(cx, 66, r, 0, Math.PI * 2);
      ctx.fillStyle = '#1d242c';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#73818e';
      ctx.stroke();
      ctx.strokeStyle = '#d9e3ec';
      ctx.lineWidth = 2;
      for (var k = 0; k < 9; k++) {
        var a = Math.PI * 0.78 + (k / 8) * Math.PI * 1.44;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (r - 10), 66 + Math.sin(a) * (r - 10));
        ctx.lineTo(cx + Math.cos(a) * (r - 4), 66 + Math.sin(a) * (r - 4));
        ctx.stroke();
      }
      ctx.strokeStyle = '#e04838';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, 66);
      ctx.lineTo(cx + (idx === 0 ? 18 : 12), 66 - (idx === 0 ? 22 : 16));
      ctx.stroke();
    });
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function makeRealisticFaceTexture(opts) {
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = opts.skin || '#deb392';
    ctx.fillRect(0, 0, 256, 256);
    // 柔和脸颊阴影与暖红晕
    var cheek = ctx.createRadialGradient(84, 152, 4, 84, 152, 34);
    cheek.addColorStop(0, opts.blush || 'rgba(204,116,96,0.22)');
    cheek.addColorStop(1, 'rgba(204,116,96,0)');
    ctx.fillStyle = cheek;
    ctx.fillRect(40, 110, 90, 80);
    var cheek2 = ctx.createRadialGradient(172, 152, 4, 172, 152, 34);
    cheek2.addColorStop(0, opts.blush || 'rgba(204,116,96,0.22)');
    cheek2.addColorStop(1, 'rgba(204,116,96,0)');
    ctx.fillStyle = cheek2;
    ctx.fillRect(126, 110, 90, 80);
    // 眉毛
    ctx.strokeStyle = opts.browColor || '#1e1a18';
    ctx.lineWidth = opts.child ? 4.5 : (opts.female ? 4.5 : 6.5);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(74, 102); ctx.quadraticCurveTo(95, 95, 112, 101);
    ctx.moveTo(144, 101); ctx.quadraticCurveTo(161, 95, 182, 102);
    ctx.stroke();
    // 双眼（写实杏眼 + 瞳仁 + 高光）
    [94, 162].forEach(function (ex) {
      ctx.fillStyle = '#f8f5f0';
      ctx.beginPath();
      ctx.ellipse(ex, 122, opts.child ? 13 : 12, opts.child ? 8.5 : 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#251a14';
      ctx.beginPath();
      ctx.arc(ex, 122, opts.child ? 6.2 : 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 2.2, 119.5, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#261e1a';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(ex, 121.5, opts.child ? 13 : 12, opts.child ? 8.5 : 7, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    });
    // 鼻影
    ctx.strokeStyle = 'rgba(128,84,58,0.42)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(128, 124);
    ctx.lineTo(125, 148);
    ctx.quadraticCurveTo(128, 152, 134, 148);
    ctx.stroke();
    // 嘴部（闭嘴 / 张嘴呼喊）
    if (opts.openMouth) {
      ctx.fillStyle = '#5e1e1e';
      ctx.beginPath();
      ctx.ellipse(128, 178, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4ece4';
      ctx.fillRect(117, 170, 22, 5);
      ctx.strokeStyle = '#9c5244';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(128, 178, 16, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = opts.lipColor || '#a85b4c';
      ctx.lineWidth = opts.female ? 4.2 : 3.6;
      ctx.beginPath();
      ctx.moveTo(112, 176);
      ctx.quadraticCurveTo(128, opts.smile ? 183 : 178, 144, 176);
      ctx.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function makeStripedSweaterTexture() {
    var c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#d6e3ee';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#6c98bf';
    for (var y = 0; y < 128; y += 16) {
      ctx.fillRect(0, y, 128, 7);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // ── 90 年代经典深炭黑踏板摩托「冀A·E7168」（对照原剧 00:26-00:34 & 02:18-02:23 重建）──
  function createElectricScooter() {
    var g = new THREE.Group();
    var bodyPaint = std(0x252930, { roughness: 0.30, metalness: 0.36 });
    var darkTrim = std(0x16181c, { roughness: 0.78, metalness: 0.08 });
    var seatLeather = std(0x1b1d20, { roughness: 0.62, metalness: 0.06 });
    var chromeMat = std(0xc8d0d8, { roughness: 0.22, metalness: 0.86 });
    var tireMat = std(0x181a1d, { roughness: 0.90, metalness: 0.04 });
    var rimMat = std(0xb4bcc4, { roughness: 0.32, metalness: 0.72 });
    var glassMat = new THREE.MeshStandardMaterial({ color: 0xfff8e2, emissive: 0xffe49c, emissiveIntensity: 0.45, roughness: 0.15, metalness: 0.1 });
    var amberMat = new THREE.MeshStandardMaterial({ color: 0xe6841c, emissive: 0xb85808, emissiveIntensity: 0.3, roughness: 0.28 });
    var tailRedMat = new THREE.MeshStandardMaterial({ color: 0xc8221e, emissive: 0x7a0c0a, emissiveIntensity: 0.45, roughness: 0.25 });
    var mirrorGlassMat = std(0xa8bcc8, { roughness: 0.1, metalness: 0.92 });

    // 底盘与防滑脚踏平台
    var floorDeck = roundBox(0.46, 0.09, 0.72, { mat: darkTrim, r: 0.025 });
    floorDeck.position.set(0, 0.27, 0.04);
    g.add(floorDeck);
    for (var ri = -2; ri <= 2; ri++) {
      var rib = mesh(new THREE.BoxGeometry(0.025, 0.014, 0.54), std(0x2a2d32, { roughness: 0.85 }));
      rib.position.set(ri * 0.075, 0.32, 0.04);
      g.add(rib);
    }
    var lowerBelly = roundBox(0.42, 0.14, 1.18, { mat: darkTrim, r: 0.04 });
    lowerBelly.position.set(0, 0.21, -0.10);
    g.add(lowerBelly);

    // 流线弧形前挡风鼻罩（原剧标志性宽弧形黑色车头）
    var frontFairing = roundBox(0.50, 0.62, 0.24, { mat: bodyPaint, r: 0.09 });
    frontFairing.position.set(0, 0.68, 0.56);
    frontFairing.rotation.x = -0.24;
    g.add(frontFairing);

    var noseSlope = mesh(new THREE.CylinderGeometry(0.20, 0.27, 0.54, 16), bodyPaint);
    noseSlope.scale.set(1.05, 1.0, 0.62);
    noseSlope.position.set(0, 0.65, 0.63);
    noseSlope.rotation.x = -0.32;
    g.add(noseSlope);

    // 内侧护膝挡板
    var innerLegShield = roundBox(0.46, 0.56, 0.09, { mat: darkTrim, r: 0.03 });
    innerLegShield.position.set(0, 0.62, 0.42);
    innerLegShield.rotation.x = -0.18;
    g.add(innerLegShield);

    // 前部椭圆大灯 + 左右橙色转向灯 + 前牌照「冀A·E7168」
    var headlamp = mesh(new THREE.SphereGeometry(0.115, 14, 10), glassMat);
    headlamp.scale.set(1.35, 0.72, 0.48);
    headlamp.position.set(0, 0.84, 0.72);
    g.add(headlamp);
    [-0.18, 0.18].forEach(function (sx) {
      var blinker = mesh(new THREE.SphereGeometry(0.048, 10, 8), amberMat);
      blinker.scale.set(1.25, 0.75, 0.55);
      blinker.position.set(sx, 0.82, 0.70);
      g.add(blinker);
    });
    var frontPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.08),
      new THREE.MeshBasicMaterial({ map: makePlateTexture(['冀A·E7168']) })
    );
    frontPlate.position.set(0, 0.64, 0.765);
    frontPlate.rotation.x = -0.28;
    g.add(frontPlate);

    // 车头转向罩 + 仪表台 + 橡胶握把 + 刹把 + 双后视镜
    var headCowl = roundBox(0.38, 0.16, 0.24, { mat: bodyPaint, r: 0.06 });
    headCowl.position.set(0, 1.05, 0.49);
    headCowl.rotation.x = -0.16;
    g.add(headCowl);

    var dashPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.11),
      new THREE.MeshBasicMaterial({ map: makeDashTexture() })
    );
    dashPanel.position.set(0, 1.09, 0.375);
    dashPanel.rotation.x = -Math.PI * 0.28;
    dashPanel.rotation.y = Math.PI;
    g.add(dashPanel);

    var handleBar = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.68, 10), chromeMat);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, 1.04, 0.45);
    g.add(handleBar);

    [-1, 1].forEach(function (side) {
      var grip = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.15, 12), darkTrim);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(side * 0.34, 1.04, 0.44);
      g.add(grip);

      var lever = mesh(new THREE.BoxGeometry(0.13, 0.014, 0.022), chromeMat);
      lever.position.set(side * 0.32, 1.02, 0.51);
      lever.rotation.y = -side * 0.22;
      g.add(lever);
    });

    function buildMirror(side) {
      var mg = new THREE.Group();
      mg.position.set(side * 0.17, 1.11, 0.48);
      var stalk = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 8), darkTrim);
      stalk.position.set(side * 0.06, 0.09, 0.01);
      stalk.rotation.z = -side * 0.52;
      mg.add(stalk);
      var casing = roundBox(0.145, 0.088, 0.036, { mat: darkTrim, r: 0.016 });
      casing.position.set(side * 0.15, 0.18, 0.02);
      casing.rotation.y = side * 0.18;
      mg.add(casing);
      var glass = new THREE.Mesh(new THREE.PlaneGeometry(0.125, 0.070), mirrorGlassMat);
      glass.position.set(side * 0.15, 0.18, 0.001);
      glass.rotation.y = Math.PI + side * 0.18;
      mg.add(glass);
      return mg;
    }
    var mirrorLeft = buildMirror(-1);
    var mirrorRight = buildMirror(1);
    g.add(mirrorLeft, mirrorRight);

    // 饱满流线后车身护板 + 阶梯双人黑皮坐垫 + 镀铬后尾扶手
    var rearBody = roundBox(0.48, 0.38, 0.92, { mat: bodyPaint, r: 0.11 });
    rearBody.position.set(0, 0.56, -0.34);
    g.add(rearBody);

    var seatFront = roundBox(0.38, 0.13, 0.44, { mat: seatLeather, r: 0.055 });
    seatFront.position.set(0, 0.77, -0.14);
    g.add(seatFront);
    var seatRear = roundBox(0.36, 0.14, 0.38, { mat: seatLeather, r: 0.055 });
    seatRear.position.set(0, 0.83, -0.50);
    g.add(seatRear);

    var grabRail = mesh(new THREE.TorusGeometry(0.19, 0.018, 8, 16, Math.PI), chromeMat);
    grabRail.rotation.x = Math.PI / 2;
    grabRail.rotation.z = Math.PI;
    grabRail.position.set(0, 0.86, -0.70);
    g.add(grabRail);

    // 尾灯 + 后转向灯 + 后泥瓦 + 原剧双行黄牌「冀A / E7168」
    var tailLamp = roundBox(0.20, 0.095, 0.05, { mat: tailRedMat, r: 0.02 });
    tailLamp.position.set(0, 0.68, -0.81);
    g.add(tailLamp);
    [-0.14, 0.14].forEach(function (sx) {
      var rb = roundBox(0.065, 0.075, 0.045, { mat: amberMat, r: 0.015 });
      rb.position.set(sx, 0.68, -0.80);
      g.add(rb);
    });
    var rearFenderFlap = roundBox(0.24, 0.26, 0.03, { mat: darkTrim, r: 0.01 });
    rearFenderFlap.position.set(0, 0.46, -0.84);
    rearFenderFlap.rotation.x = 0.22;
    g.add(rearFenderFlap);

    var rearPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.135),
      new THREE.MeshBasicMaterial({ map: makePlateTexture(['冀 A', 'E7168']) })
    );
    rearPlate.position.set(0, 0.49, -0.865);
    rearPlate.rotation.y = Math.PI;
    rearPlate.rotation.x = -0.22;
    g.add(rearPlate);

    // 右侧黑色/镀铬斜置排气管 + 隔热罩 + 尾气挂点
    var muffler = mesh(new THREE.CylinderGeometry(0.052, 0.060, 0.56, 12), darkTrim);
    muffler.rotation.x = Math.PI / 2 + 0.18;
    muffler.position.set(0.25, 0.34, -0.46);
    g.add(muffler);
    var heatShield = mesh(new THREE.CylinderGeometry(0.058, 0.064, 0.34, 10, 1, true, -0.8, 1.6), chromeMat);
    heatShield.rotation.x = Math.PI / 2 + 0.18;
    heatShield.rotation.z = -Math.PI / 2;
    heatShield.position.set(0.26, 0.34, -0.46);
    g.add(heatShield);
    var exhaustTip = new THREE.Object3D();
    exhaustTip.position.set(0.25, 0.39, -0.76);
    g.add(exhaustTip);

    // 前后宽胎面踏板轮胎 + 五辐银色轮毂 + 减震前叉
    function makeScooterWheel(z) {
      var wg = new THREE.Group();
      wg.position.set(0, 0.26, z);
      var tire = mesh(new THREE.TorusGeometry(0.19, 0.075, 12, 22), tireMat);
      tire.rotation.y = Math.PI / 2;
      wg.add(tire);
      var rim = mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.085, 14), rimMat);
      rim.rotation.z = Math.PI / 2;
      wg.add(rim);
      var hub = mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.11, 10), darkTrim);
      hub.rotation.z = Math.PI / 2;
      wg.add(hub);
      for (var i = 0; i < 5; i++) {
        var spoke = mesh(new THREE.BoxGeometry(0.09, 0.24, 0.022), rimMat);
        spoke.rotation.x = (i / 5) * Math.PI;
        wg.add(spoke);
      }
      return wg;
    }
    var wheelFront = makeScooterWheel(0.64);
    var wheelRear = makeScooterWheel(-0.56);
    g.add(wheelFront, wheelRear);

    // 前挡泥板 + 前减震双叉
    var frontFender = mesh(new THREE.TorusGeometry(0.27, 0.055, 8, 16, Math.PI * 0.72), bodyPaint);
    frontFender.rotation.y = Math.PI / 2;
    frontFender.rotation.z = 0.24;
    frontFender.position.set(0, 0.28, 0.64);
    g.add(frontFender);

    [-0.10, 0.10].forEach(function (fx) {
      var fork = mesh(new THREE.CylinderGeometry(0.022, 0.020, 0.44, 8), chromeMat);
      fork.position.set(fx, 0.44, 0.60);
      fork.rotation.x = -0.22;
      g.add(fork);
    });

    g.userData = {
      wheels: [wheelFront, wheelRear],
      seatPos: new THREE.Vector3(0, 0.78, -0.16),
      handleLeft: new THREE.Vector3(-0.34, 1.04, 0.44),
      handleRight: new THREE.Vector3(0.34, 1.04, 0.44),
      exhaustTip: exhaustTip,
      mirrorLeft: mirrorLeft,
    };
    return g;
  }

  // ── 写实人体比例角色构建器（用于路边一家三口 & 瓜摊小弟，彻底告别方块火柴人）──
  function createRealisticPerson(cfg) {
    var g = new THREE.Group();
    var hScale = cfg.height / 1.74;
    var skinMat = std(cfg.skinHex || 0xdcb290, { roughness: 0.62, metalness: 0.02 });
    var jacketMat = std(cfg.jacketHex || 0x2b3340, { roughness: 0.62, metalness: 0.06 });
    var pantsMat = std(cfg.pantsHex || 0x202328, { roughness: 0.78 });
    var shoeMat = std(cfg.shoeHex || 0x18191c, { roughness: 0.48, metalness: 0.12 });
    var hairMat = std(cfg.hairHex || 0x1a1715, { roughness: 0.85 });
    var shirtMat = std(cfg.shirtHex || 0xe4eaf0, { roughness: 0.78 });
    var sleeveMat = cfg.sleeveTex
      ? new THREE.MeshStandardMaterial({ map: cfg.sleeveTex, roughness: 0.82 })
      : jacketMat;

    // 双腿（大腿 + 膝 + 小腿 + 写实鞋）
    function makeLeg(x) {
      var legG = new THREE.Group();
      legG.position.set(x, 0.86, 0);
      var thigh = mesh(new THREE.CylinderGeometry(0.088, 0.070, 0.42, 12), pantsMat);
      thigh.position.y = -0.21;
      legG.add(thigh);
      var knee = new THREE.Group();
      knee.position.y = -0.42;
      var calf = mesh(new THREE.CylinderGeometry(0.068, 0.052, 0.38, 12), pantsMat);
      calf.position.y = -0.19;
      knee.add(calf);
      var shoe = roundBox(0.105, 0.075, 0.24, { mat: shoeMat, r: 0.028 });
      shoe.position.set(0, -0.40, 0.045);
      knee.add(shoe);
      legG.add(knee);
      g.add(legG);
      return legG;
    }
    var leftLeg = makeLeg(-0.105);
    var rightLeg = makeLeg(0.105);

    // 写实上身躯干（自然肩宽 + 收腰 + 翻领 + 服装细节）
    var torsoG = new THREE.Group();
    torsoG.position.y = 0.86;
    var pelvis = mesh(new THREE.CylinderGeometry(0.155, 0.148, 0.14, 14), pantsMat);
    pelvis.scale.set(1.18, 1, 0.72);
    pelvis.position.y = 0.05;
    torsoG.add(pelvis);

    var upperTorso = mesh(new THREE.CylinderGeometry(cfg.shoulderW || 0.21, cfg.waistW || 0.155, 0.48, 16), jacketMat);
    upperTorso.scale.set(1.08, 1, 0.64);
    upperTorso.position.y = 0.34;
    torsoG.add(upperTorso);

    // 自然圆肩
    [-1, 1].forEach(function (s) {
      var sh = mesh(new THREE.SphereGeometry(0.082, 12, 10), jacketMat);
      sh.position.set(s * (cfg.shoulderW || 0.21) * 0.96, 0.53, 0);
      torsoG.add(sh);
    });

    // 衬衫 V 领与西装翻领 / 领带 / 夹棉背心 / 斜挎包
    var shirtV = mesh(new THREE.CylinderGeometry(0.072, 0.032, 0.22, 10), shirtMat);
    shirtV.scale.set(1, 1, 0.45);
    shirtV.position.set(0, 0.48, 0.115);
    torsoG.add(shirtV);

    if (cfg.tieHex) {
      var tieMat = std(cfg.tieHex, { roughness: 0.55 });
      var tieKnot = mesh(new THREE.BoxGeometry(0.042, 0.04, 0.025), tieMat);
      tieKnot.position.set(0, 0.54, 0.135);
      var tieBody = mesh(new THREE.BoxGeometry(0.048, 0.24, 0.02), tieMat);
      tieBody.position.set(0, 0.40, 0.138);
      torsoG.add(tieKnot, tieBody);
      // 西装双排扣翻领
      [-1, 1].forEach(function (s) {
        var lapel = roundBox(0.068, 0.24, 0.024, { mat: jacketMat, r: 0.008 });
        lapel.position.set(s * 0.072, 0.46, 0.132);
        lapel.rotation.z = s * 0.24;
        torsoG.add(lapel);
      });
    }
    if (cfg.pufferRibs) {
      // 小女孩鲜红羽绒背心横纹绗缝
      for (var pr = 0; pr < 4; pr++) {
        var puff = mesh(new THREE.TorusGeometry(0.175, 0.022, 8, 18), jacketMat);
        puff.rotation.x = Math.PI / 2;
        puff.scale.set(1.08, 0.72, 1);
        puff.position.set(0, 0.18 + pr * 0.105, 0);
        torsoG.add(puff);
      }
      var whiteCollar = mesh(new THREE.TorusGeometry(0.088, 0.024, 8, 14), shirtMat);
      whiteCollar.rotation.x = Math.PI / 2;
      whiteCollar.position.set(0, 0.58, 0.01);
      torsoG.add(whiteCollar);
    }
    if (cfg.hasBag) {
      // 妈妈斜挎黑包 + 白色翻领
      var bagMat = std(0x1b1b1d, { roughness: 0.58 });
      var strap = roundBox(0.032, 0.52, 0.022, { mat: bagMat, r: 0.008 });
      strap.position.set(-0.04, 0.34, 0.135);
      strap.rotation.z = 0.44;
      var bag = roundBox(0.18, 0.15, 0.075, { mat: bagMat, r: 0.025 });
      bag.position.set(0.16, 0.08, 0.10);
      torsoG.add(strap, bag);
      [-1, 1].forEach(function (s) {
        var wCollar = roundBox(0.072, 0.12, 0.025, { mat: shirtMat, r: 0.01 });
        wCollar.position.set(s * 0.072, 0.54, 0.125);
        wCollar.rotation.z = s * 0.35;
        torsoG.add(wCollar);
      });
    }
    g.add(torsoG);

    // 双段自然手臂（上臂 + 肘 + 前臂 + 手掌）
    function makeArm(side) {
      var armG = new THREE.Group();
      armG.position.set(side * ((cfg.shoulderW || 0.21) + 0.035), 1.38, 0);
      var upper = mesh(new THREE.CylinderGeometry(0.056, 0.046, 0.28, 10), sleeveMat);
      upper.position.y = -0.14;
      armG.add(upper);
      var foreG = new THREE.Group();
      foreG.position.y = -0.28;
      var elbow = mesh(new THREE.SphereGeometry(0.046, 8, 8), sleeveMat);
      var fore = mesh(new THREE.CylinderGeometry(0.044, 0.036, 0.25, 10), sleeveMat);
      fore.position.y = -0.125;
      var hand = mesh(new THREE.SphereGeometry(0.042, 10, 8), skinMat);
      hand.scale.set(0.85, 1.15, 0.72);
      hand.position.y = -0.27;
      foreG.add(elbow, fore, hand);
      armG.add(foreG);
      g.add(armG);
      return { arm: armG, fore: foreG };
    }
    var armL = makeArm(-1);
    var armR = makeArm(1);

    // 颈部 + 写实头部 + 手绘五官 + 立体发型
    var neck = mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.10, 10), skinMat);
    neck.position.set(0, 1.48, 0);
    g.add(neck);

    var headG = new THREE.Group();
    headG.position.set(0, 1.60, 0);

    var skull = mesh(new THREE.SphereGeometry(0.118, 18, 14), skinMat);
    skull.scale.set(0.92, 1.12, 0.96);
    headG.add(skull);

    // 手绘写实面部曲面贴片（贴合前脸，支持闭嘴/张嘴切换）
    var faceClosedMat = new THREE.MeshStandardMaterial({
      map: makeRealisticFaceTexture({ skin: cfg.skinCss, female: cfg.female, child: cfg.child, smile: cfg.smile, openMouth: false }),
      roughness: 0.65,
      transparent: false
    });
    var faceOpenMat = new THREE.MeshStandardMaterial({
      map: makeRealisticFaceTexture({ skin: cfg.skinCss, female: cfg.female, child: cfg.child, openMouth: true }),
      roughness: 0.65,
      transparent: false
    });
    var faceGeo = new THREE.SphereGeometry(0.1208, 16, 12, Math.PI * 0.14, Math.PI * 0.72, Math.PI * 0.18, Math.PI * 0.66);
    var mouthClosed = new THREE.Mesh(faceGeo, faceClosedMat);
    mouthClosed.scale.set(0.92, 1.12, 0.96);
    var mouthOpen = new THREE.Mesh(faceGeo, faceOpenMat);
    mouthOpen.scale.set(0.92, 1.12, 0.96);
    mouthOpen.visible = false;
    headG.add(mouthClosed, mouthOpen);

    // 立体耳与鼻梁
    [-0.106, 0.106].forEach(function (ex) {
      var ear = mesh(new THREE.SphereGeometry(0.024, 8, 6), skinMat);
      ear.scale.set(0.55, 1.25, 0.75);
      ear.position.set(ex, -0.01, -0.005);
      headG.add(ear);
    });
    var nose = mesh(new THREE.ConeGeometry(0.016, 0.042, 6), skinMat);
    nose.position.set(0, -0.012, 0.114);
    nose.rotation.x = Math.PI * 0.38;
    headG.add(nose);

    // 立体发型
    var hairCrown = mesh(new THREE.SphereGeometry(0.124, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat);
    hairCrown.scale.set(0.95, 1.10, 1.0);
    hairCrown.position.set(0, 0.016, -0.006);
    headG.add(hairCrown);
    var hairBack = mesh(new THREE.SphereGeometry(0.118, 14, 10), hairMat);
    hairBack.scale.set(0.94, 0.92, 0.72);
    hairBack.position.set(0, -0.005, -0.042);
    headG.add(hairBack);

    if (cfg.hairStyle === 'bob') {
      // 妈妈棕色齐耳短发
      [-0.102, 0.102].forEach(function (sx) {
        var sideLock = roundBox(0.046, 0.18, 0.12, { mat: hairMat, r: 0.02 });
        sideLock.position.set(sx, -0.045, -0.01);
        headG.add(sideLock);
      });
      var sideBangs = roundBox(0.17, 0.055, 0.06, { mat: hairMat, r: 0.02 });
      sideBangs.position.set(0.015, 0.088, 0.082);
      sideBangs.rotation.z = -0.14;
      headG.add(sideBangs);
    } else if (cfg.hairStyle === 'ponytail') {
      // 小女孩齐刘海 + 马尾
      var bangs = roundBox(0.16, 0.055, 0.055, { mat: hairMat, r: 0.018 });
      bangs.position.set(0, 0.082, 0.085);
      headG.add(bangs);
      var pony = mesh(new THREE.CylinderGeometry(0.028, 0.042, 0.16, 10), hairMat);
      pony.position.set(0, -0.03, -0.125);
      pony.rotation.x = 0.25;
      var hairTie = mesh(new THREE.TorusGeometry(0.032, 0.010, 6, 10), std(0xd93838, { roughness: 0.6 }));
      hairTie.position.set(0, 0.04, -0.115);
      headG.add(pony, hairTie);
    } else {
      // 爸爸/小弟利落短发前额刘海
      var topWave = roundBox(0.15, 0.048, 0.08, { mat: hairMat, r: 0.02 });
      topWave.position.set(0, 0.105, 0.065);
      headG.add(topWave);
    }

    g.add(headG);
    g.scale.setScalar(hScale);

    g.userData = {
      kind: cfg.kind,
      head: headG,
      leftArm: armL.arm,
      rightArm: armR.arm,
      leftForeArm: armL.fore,
      rightForeArm: armR.fore,
      leftLeg: leftLeg,
      rightLeg: rightLeg,
      mouthClosed: mouthClosed,
      mouthOpen: mouthOpen,
    };
    return g;
  }

  function createXiaoDi() {
    return createRealisticPerson({
      kind: 'xiaodi',
      height: 1.72,
      skinHex: 0xd9ad89,
      skinCss: '#d9ad89',
      jacketHex: 0x222936,
      shirtHex: 0xcbd2da,
      pantsHex: 0x1e2026,
      hairHex: 0x181513,
      shoulderW: 0.21,
      waistW: 0.16,
      hairStyle: 'short',
    });
  }

  function createFamilyMember(kind) {
    if (kind === 'father') {
      return createRealisticPerson({
        kind: 'family-father',
        height: 1.76,
        skinHex: 0xdeb492,
        skinCss: '#deb492',
        jacketHex: 0x364152,
        shirtHex: 0xcad8e8,
        tieHex: 0x1e2a3c,
        pantsHex: 0x262c36,
        hairHex: 0x171412,
        shoulderW: 0.22,
        waistW: 0.165,
        hairStyle: 'short',
        smile: true,
      });
    }
    if (kind === 'mother') {
      return createRealisticPerson({
        kind: 'family-mother',
        height: 1.62,
        skinHex: 0xe6bea0,
        skinCss: '#e6bea0',
        jacketHex: 0x3b453e,
        shirtHex: 0xf0f2f0,
        pantsHex: 0x262928,
        hairHex: 0x452d20,
        shoulderW: 0.185,
        waistW: 0.145,
        hairStyle: 'bob',
        female: true,
        hasBag: true,
      });
    }
    return createRealisticPerson({
      kind: 'family-daughter',
      height: 1.20,
      skinHex: 0xe8c3a5,
      skinCss: '#e8c3a5',
      jacketHex: 0xc92c28,
      shirtHex: 0xeaf1f6,
      sleeveTex: makeStripedSweaterTexture(),
      pantsHex: 0x2b303a,
      shoeHex: 0x3a404a,
      hairHex: 0x1b1715,
      shoulderW: 0.165,
      waistW: 0.14,
      hairStyle: 'ponytail',
      child: true,
      pufferRibs: true,
    });
  }

  return {
    createHaoGe: function () {
      return makeRunner({ face: 'haoge', palette: portraitMaterials.haoge });
    },
    createHuaQiang: function () {
      var r = makeRunner({ face: 'huaqiang', jacket: true, knife: true, palette: portraitMaterials.huaqiang });
      r.scale.set(1.12, 1.12, 1.12);
      return r;
    },
    createXiaoDi: createXiaoDi,
    createIronHammer: createIronHammer,
    createElectricScooter: createElectricScooter,
    createFamilyMember: createFamilyMember,
    animateRunner: animateRunner,
    setFace: setFace,
    setBloodyHands: setBloodyHands,
    setBloodyKnife: setBloodyKnife,
  };
})();

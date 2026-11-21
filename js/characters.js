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

  function makeKnife() {
    var g = new THREE.Group();
    var handle = mesh(new THREE.CylinderGeometry(0.025, 0.022, 0.22, 8), M.wood);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0, -0.14);
    g.add(handle);
    var pommel = sphere(0.028, M.wood, 6);
    pommel.position.set(0, 0, -0.25);
    g.add(pommel);
    var guard = roundBox(0.09, 0.13, 0.03, { mat: M.metalDark, r: 0.01 });
    guard.position.set(0, 0.015, 0.005);
    g.add(guard);

    var bladeShape = new THREE.Shape();
    bladeShape.moveTo(-0.02, 0);
    bladeShape.lineTo(-0.013, 0.26);
    bladeShape.quadraticCurveTo(0, 0.36, 0.013, 0.26);
    bladeShape.lineTo(0.02, 0);
    bladeShape.quadraticCurveTo(0, -0.014, -0.02, 0);
    var bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.022, bevelEnabled: false, curveSegments: 6 });
    bladeGeo.rotateX(-Math.PI / 2);
    bladeGeo.translate(0, 0.011, 0);
    var blade = mesh(bladeGeo, M.metal);
    blade.position.set(0, 0.015, 0.03);
    g.add(blade);
    g.userData = { blade: blade };
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
      var thigh = capsule(0.38, 0.13, 0.095, M.pants, 10);
      thigh.position.y = -0.19;
      legG.add(thigh);
      var knee = new THREE.Group();
      knee.position.y = -0.38;
      var shin = capsule(0.36, 0.085, 0.062, M.pants, 10);
      shin.position.y = -0.18;
      knee.add(shin);
      var foot = new THREE.Group();
      foot.position.y = -0.36;
      var shoe = roundBox(0.24, 0.14, 0.4, { mat: M.shoe, r: 0.05 });
      shoe.position.set(0, -0.06, 0.04);
      foot.add(shoe);
      var sole = roundBox(0.22, 0.05, 0.37, { mat: M.sole, r: 0.015 });
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
      var sleeve = opts.jacket ? M.jacket : opts.shirt ? M.shirtDark : M.skin;
      var upper = capsule(0.42, 0.13, 0.095, sleeve, 10);
      upper.position.y = -0.21;
      arm.add(upper);
      var elbow = new THREE.Group();
      elbow.position.y = -0.42;
      var fore = capsule(0.34, 0.085, 0.06, sleeve, 10);
      fore.position.y = -0.17;
      elbow.add(fore);
      var hand = roundBox(0.16, 0.15, 0.17, { mat: M.skin, r: 0.05 });
      hand.position.set(0, -0.34, 0.03);
      elbow.add(hand);
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

    var torsoG = buildTorso(opts);
    g.add(torsoG);

    var neck = capsule(0.18, 0.09, 0.1, M.skin, 8);
    neck.position.y = 1.63;
    g.add(neck);

    var headInfo = buildHead(opts);
    g.add(headInfo.group);
    applyExpression(headInfo.controls, opts.face || 'haoge');

    var leftArmInfo = addArm(-0.5);
    var rightArmInfo = addArm(0.5);
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

  function createXiaoDi() {
    var r = makeRunner({ face: 'haoge', hair: 'flat', shirt: true });
    r.scale.set(0.98, 0.98, 0.98);
    return r;
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

  function makeMirror(side) {
    var m = new THREE.Group();
    var stalk = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.26, 8), M.metalDark);
    stalk.position.set(side * 0.13, 0.13, 0);
    stalk.rotation.z = side * 0.9;
    m.add(stalk);
    var glass = sphere(0.045, M.metalDark, 8);
    glass.scale.set(1, 0.35, 0.5);
    glass.position.set(side * 0.21, 0.26, 0.03);
    m.add(glass);
    return m;
  }

  function createElectricScooter() {
    var g = new THREE.Group();

    var deck = roundBox(0.65, 0.12, 1.95, { mat: M.frame, r: 0.05 });
    deck.position.y = 0.35;
    g.add(deck);

    var batt = roundBox(0.39, 0.22, 0.81, { mat: M.metalDark, r: 0.065 });
    batt.position.set(0, 0.47, -0.18);
    g.add(batt);

    var stem = mesh(new THREE.CylinderGeometry(0.042, 0.055, 1.3, 10), M.frame);
    stem.position.set(0, 0.99, 0.72);
    stem.rotation.x = 0.16;
    g.add(stem);

    var head = roundBox(0.2, 0.17, 0.2, { mat: M.frame, r: 0.04 });
    head.position.set(0, 1.51, 0.72);
    g.add(head);

    var bar = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.81, 10), M.metal);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 1.61, 0.72);
    g.add(bar);

    var gripL = mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.17, 10), M.shoe);
    gripL.rotation.z = Math.PI / 2;
    gripL.position.set(-0.38, 1.61, 0.72);
    g.add(gripL);
    var gripR = gripL.clone();
    gripR.position.x = 0.38;
    g.add(gripR);

    var leverL = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 6), M.metalDark);
    leverL.rotation.z = -0.4;
    leverL.position.set(-0.4, 1.51, 0.73);
    g.add(leverL);
    var leverR = leverL.clone();
    leverR.rotation.z = 0.4;
    leverR.position.x = 0.4;
    g.add(leverR);

    var disp = roundBox(0.21, 0.12, 0.05, { mat: M.metalDark, r: 0.012 });
    disp.position.set(0, 1.52, 0.61);
    g.add(disp);
    var dispScreen = roundBox(0.16, 0.08, 0.016, { mat: new THREE.MeshBasicMaterial({ color: 0x9fd8ef }), r: 0.006 });
    dispScreen.position.set(0, 1.52, 0.584);
    g.add(dispScreen);

    var lamp = mesh(new THREE.CylinderGeometry(0.052, 0.065, 0.08, 10), M.metalDark);
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(0, 1.09, 0.88);
    g.add(lamp);
    var light = sphere(0.06, M.glow, 8);
    light.position.set(0, 1.09, 0.92);
    g.add(light);

    var mirrorL = makeMirror(-1);
    mirrorL.position.set(-0.13, 1.72, 0.73);
    g.add(mirrorL);
    var mirrorR = makeMirror(1);
    mirrorR.position.set(0.13, 1.72, 0.73);
    g.add(mirrorR);

    var seatPost = mesh(new THREE.CylinderGeometry(0.039, 0.039, 0.59, 10), M.frame);
    seatPost.position.set(0, 0.73, -0.23);
    g.add(seatPost);
    var seat = roundBox(0.39, 0.12, 0.62, { mat: M.shoe, r: 0.05 });
    seat.position.set(0, 1.01, -0.23);
    g.add(seat);

    function makeWheel(z) {
      var wg = new THREE.Group();
      wg.position.set(0, 0.35, z);
      var tire = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.09, 18), M.tire);
      tire.rotation.z = Math.PI / 2;
      wg.add(tire);
      var rim = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12), M.metal);
      rim.rotation.z = Math.PI / 2;
      wg.add(rim);
      var hub = mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.1, 10), M.metal);
      hub.rotation.z = Math.PI / 2;
      wg.add(hub);
      for (var i = 0; i < 5; i++) {
        var spoke = mesh(new THREE.BoxGeometry(0.024, 0.25, 0.024), M.metalDark);
        spoke.rotation.x = (i / 5) * Math.PI;
        wg.add(spoke);
      }
      return wg;
    }

    var wheelFront = makeWheel(0.72);
    var wheelRear = makeWheel(-0.72);
    g.add(wheelFront);
    g.add(wheelRear);

    function makeFender(z) {
      var f = mesh(new THREE.TorusGeometry(0.35, 0.045, 8, 14, Math.PI), M.frame);
      f.rotation.y = Math.PI / 2;
      f.position.set(0, 0.35, z);
      return f;
    }
    g.add(makeFender(0.72));
    g.add(makeFender(-0.72));

    g.userData = { wheels: [wheelFront, wheelRear] };
    return g;
  }

  function createFamilyMember(kind) {
    var g = new THREE.Group();
    var child = kind === 'daughter';

    var suitFather = std(0x2a2d33, { roughness: 0.45, metalness: 0.12 });
    var suitMother = std(0x26342f, { roughness: 0.5, metalness: 0.08 });
    var shirtWhite = std(0xe8edf2, { roughness: 0.8 });
    var tieDark = std(0x1d2430, { roughness: 0.65 });
    var vestRed = std(0xa93333, { roughness: 0.85 });
    var sleeveBlue = std(0x8fb6d9, { roughness: 0.8 });
    var bagMat = std(0x1a1a1a, { roughness: 0.7 });

    var torsoMat = kind === 'father' ? suitFather : kind === 'mother' ? suitMother : vestRed;
    var sleeveMat = child ? sleeveBlue : torsoMat;
    var hairMat = kind === 'father' ? M.hair : M.hairBrown;

    function addLegs() {
      [-0.16, 0.16].forEach(function (x) {
        var leg = mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.72, 8), M.pants);
        leg.position.set(x, 0.36, 0);
        g.add(leg);
        var shoe = roundBox(0.2, 0.12, 0.34, { mat: M.shoe, r: 0.04 });
        shoe.position.set(x, 0.06, 0.04);
        g.add(shoe);
      });
    }

    function addTorso() {
      var t = new THREE.Group();
      t.position.y = 0.82;
      var body = roundBox(0.66, 0.62, 0.4, { mat: torsoMat, r: 0.1 });
      body.position.y = 0.32;
      t.add(body);
      var collar = roundBox(0.24, 0.09, 0.06, { mat: shirtWhite, r: 0.02 });
      collar.position.set(0, 0.62, 0.2);
      t.add(collar);
      if (kind === 'father') {
        var tie = roundBox(0.09, 0.3, 0.04, { mat: tieDark, r: 0.015 });
        tie.position.set(0, 0.42, 0.22);
        t.add(tie);
      } else if (kind === 'mother') {
        var strap = roundBox(0.06, 0.72, 0.07, { mat: bagMat, r: 0.02 });
        strap.position.set(-0.13, 0.34, 0.2);
        strap.rotation.z = 0.35;
        t.add(strap);
        var bag = roundBox(0.24, 0.2, 0.1, { mat: bagMat, r: 0.04 });
        bag.position.set(0.26, 0.12, 0.2);
        t.add(bag);
      } else {
        var chest = roundBox(0.42, 0.44, 0.32, { mat: vestRed, r: 0.08 });
        chest.position.set(0, 0.3, 0);
        t.add(chest);
        var whiteCuff = roundBox(0.12, 0.06, 0.12, { mat: shirtWhite, r: 0.015 });
        whiteCuff.position.set(0, 0.58, 0.16);
        t.add(whiteCuff);
      }
      g.add(t);
    }

    function addArm(x) {
      var arm = new THREE.Group();
      arm.position.set(x, 1.32, 0);
      var upper = mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.42, 8), sleeveMat);
      upper.position.y = -0.21;
      arm.add(upper);
      var fore = mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.3, 8), sleeveMat);
      fore.position.y = -0.52;
      arm.add(fore);
      var hand = sphere(0.06, M.skin, 8);
      hand.position.y = -0.7;
      arm.add(hand);
      g.add(arm);
      return arm;
    }

    function addHead() {
      var headG = new THREE.Group();
      headG.position.y = 1.58;
      var skull = sphere(0.21, M.skin, 14);
      skull.scale.set(1, 1.08, 0.92);
      skull.position.y = 0.05;
      headG.add(skull);

      var cap = sphere(0.225, hairMat, 12, 0, Math.PI / 2);
      cap.position.y = 0.22;
      headG.add(cap);
      if (kind === 'father') {
        var back = roundBox(0.3, 0.16, 0.2, { mat: M.hair, r: 0.04 });
        back.position.set(0, 0.1, -0.13);
        headG.add(back);
        var fringe = roundBox(0.18, 0.08, 0.16, { mat: M.hair, r: 0.025 });
        fringe.position.set(0, 0.28, 0.2);
        headG.add(fringe);
      } else if (kind === 'mother') {
        [-0.21, 0.21].forEach(function (sx) {
          var side = roundBox(0.12, 0.3, 0.15, { mat: M.hairBrown, r: 0.04 });
          side.position.set(sx, -0.06, 0.02);
          headG.add(side);
        });
      } else {
        var pony = roundBox(0.08, 0.28, 0.08, { mat: M.hair, r: 0.03 });
        pony.position.set(0, -0.04, -0.2);
        headG.add(pony);
        var bow = roundBox(0.16, 0.07, 0.04, { mat: shirtWhite, r: 0.015 });
        bow.position.set(0, 0.12, -0.18);
        headG.add(bow);
      }

      [-0.075, 0.075].forEach(function (ex) {
        var eye = new THREE.Group();
        eye.position.set(ex, 0.13, 0.19);
        var white = sphere(0.035, std(0xfdfcf9), 8);
        white.scale.set(1, 1.25, 0.55);
        eye.add(white);
        var iris = sphere(0.018, std(0x3a2a20), 6);
        iris.position.set(0, 0.004, 0.028);
        eye.add(iris);
        headG.add(eye);
      });

      var mouthClosed = roundBox(0.08, 0.022, 0.03, { mat: M.mouth, r: 0.008 });
      mouthClosed.position.set(0, -0.08, 0.2);
      headG.add(mouthClosed);
      var mouthOpen = sphere(0.035, M.mouthDark, 8);
      mouthOpen.scale.set(1, 1.3, 0.5);
      mouthOpen.position.set(0, -0.09, 0.19);
      mouthOpen.visible = false;
      headG.add(mouthOpen);

      g.add(headG);
      return { head: headG, mouthClosed: mouthClosed, mouthOpen: mouthOpen };
    }

    addLegs();
    addTorso();
    var armL = addArm(-0.38);
    var armR = addArm(0.38);
    var headInfo = addHead();

    if (child) g.scale.set(0.62, 0.62, 0.62);

    g.userData = {
      kind: 'family-' + kind,
      head: headInfo.head,
      leftArm: armL,
      rightArm: armR,
      mouthClosed: headInfo.mouthClosed,
      mouthOpen: headInfo.mouthOpen,
    };
    return g;
  }

  return {
    createHaoGe: function () {
      return makeRunner({ face: 'haoge', hair: 'short' });
    },
    createHuaQiang: function () {
      var r = makeRunner({ face: 'huaqiang', hair: 'flat', jacket: true, cigarette: true, knife: true });
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

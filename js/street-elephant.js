// ═══════════════════════════════════════════════════════════════
//  STREET-ELEPHANT.JS — 精细化仿真 3D 大象模块（转弯象群 + 保熟皇家大象）
//  采用褶皱象皮纹理、曲面圆润躯干、扇形耳廓、渐变弯象牙、多段关节象鼻与四肢蹄甲
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var texCache = {};
  var matCache = {};

  function makeSkinTex(royal) {
    var key = royal ? 'royalSkinTex' : 'streetSkinTex';
    if (texCache[key]) return texCache[key];
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    var ctx = c.getContext('2d');
    var base = royal ? '#848085' : '#8f8a83';
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);

    // 细腻皮革颗粒与自然灰褐明暗斑驳
    for (var i = 0; i < 650; i++) {
      var x = (i * 73) % 256;
      var y = (i * 137) % 256;
      var r = 1 + (i % 3);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(32, 30, 28, 0.14)' : 'rgba(135, 130, 122, 0.11)';
      ctx.fillRect(x, y, r, r);
    }
    // 仿真象皮横向与斜向褶皱纹路
    ctx.strokeStyle = 'rgba(28, 26, 24, 0.24)';
    ctx.lineWidth = 1.6;
    for (var w = 0; w < 26; w++) {
      var wy = (w * 10 + 4) % 256;
      ctx.beginPath();
      ctx.moveTo(0, wy);
      for (var wx = 0; wx <= 256; wx += 32) {
        ctx.lineTo(wx, wy + Math.sin(wx * 0.06 + w) * 3.2);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(155, 148, 138, 0.12)';
    ctx.lineWidth = 1.0;
    for (var h = 0; h < 20; h++) {
      var hy = (h * 13 + 7) % 256;
      ctx.beginPath();
      ctx.moveTo(0, hy);
      ctx.lineTo(256, hy + ((h % 3) - 1) * 4);
      ctx.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    texCache[key] = tex;
    return tex;
  }

  function makeBlanketTex() {
    if (texCache.blanketTex) return texCache.blanketTex;
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#8b1620';
    ctx.fillRect(0, 0, 256, 256);
    // 金色织锦菱纹与边饰
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 236, 236);
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, 208, 208);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.28)';
    for (var y = 44; y < 220; y += 36) {
      for (var x = 44; x < 220; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x + 10, y);
        ctx.lineTo(x, y + 10);
        ctx.lineTo(x - 10, y);
        ctx.closePath();
        ctx.fill();
      }
    }
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    texCache.blanketTex = tex;
    return tex;
  }

  function mat(key, opts) {
    if (!matCache[key]) matCache[key] = new THREE.MeshStandardMaterial(opts);
    return matCache[key];
  }

  // 构建平滑渐变粗细的弯曲管状网格（用于仿真弯象牙与象尾）
  function makeTaperedCurve(points, rStart, rEnd, tubularSegs, radialSegs, material) {
    var curve = new THREE.CatmullRomCurve3(points);
    var frames = curve.computeFrenetFrames(tubularSegs, false);
    var positions = [];
    var normals = [];
    var indices = [];
    var P = new THREE.Vector3();
    var N = new THREE.Vector3();
    var B = new THREE.Vector3();
    var v = new THREE.Vector3();

    for (var i = 0; i <= tubularSegs; i++) {
      var u = i / tubularSegs;
      curve.getPointAt(u, P);
      N.copy(frames.normals[i]);
      B.copy(frames.binormals[i]);
      var rad = rStart * (1 - u) + rEnd * u;
      for (var j = 0; j <= radialSegs; j++) {
        var theta = (j / radialSegs) * Math.PI * 2;
        var cos = Math.cos(theta);
        var sin = Math.sin(theta);
        v.set(
          cos * N.x + sin * B.x,
          cos * N.y + sin * B.y,
          cos * N.z + sin * B.z
        ).normalize();
        normals.push(v.x, v.y, v.z);
        positions.push(P.x + rad * v.x, P.y + rad * v.y, P.z + rad * v.z);
      }
    }
    var stride = radialSegs + 1;
    for (var ti = 0; ti < tubularSegs; ti++) {
      for (var ri = 0; ri < radialSegs; ri++) {
        var a = ti * stride + ri;
        var b = (ti + 1) * stride + ri;
        var c = (ti + 1) * stride + (ri + 1);
        var d = ti * stride + (ri + 1);
        indices.push(a, b, d, b, c, d);
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    var mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true;
    return mesh;
  }

  // 扇形仿生象耳几何体
  var earGeoCache = null;
  function getEarGeo() {
    if (earGeoCache) return earGeoCache;
    var s = new THREE.Shape();
    s.moveTo(0, 0.42);
    s.bezierCurveTo(0.28, 0.56, 0.72, 0.44, 0.78, 0.08);
    s.bezierCurveTo(0.84, -0.26, 0.56, -0.58, 0.24, -0.64);
    s.bezierCurveTo(0.06, -0.66, -0.02, -0.44, 0, -0.18);
    s.closePath();
    earGeoCache = new THREE.ExtrudeGeometry(s, {
      depth: 0.065,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 2,
      curveSegments: 14
    });
    earGeoCache.center();
    return earGeoCache;
  }

  function createElephant(options) {
    options = options || {};
    var royal = !!options.royal;
    var root = new THREE.Group();

    var skinMat = mat(royal ? 'royalSkinV2' : 'streetSkinV2', {
      map: makeSkinTex(royal),
      color: 0xffffff,
      emissive: 0x1d1b19,
      emissiveIntensity: 0.24,
      roughness: 0.86,
      metalness: 0.03
    });
    var darkSkinMat = mat('darkSkinV2', {
      map: makeSkinTex(false),
      color: 0xb8b2aa,
      emissive: 0x141210,
      emissiveIntensity: 0.20,
      roughness: 0.90,
      metalness: 0.02
    });
    var earInnerMat = mat('earInnerV2', {
      color: 0x8f7470,
      roughness: 0.92,
      metalness: 0.02
    });
    var tuskMat = mat('tuskV2', {
      color: 0xf4ebd0,
      roughness: 0.36,
      metalness: 0.06
    });
    var nailMat = mat('nailV2', {
      color: 0xd8cdb4,
      roughness: 0.65,
      metalness: 0.04
    });
    var eyeMat = mat('eyeV2', {
      color: 0x161210,
      roughness: 0.18,
      metalness: 0.1
    });
    var goldMat = mat('royalGoldV2', {
      color: 0xf5c842,
      emissive: 0x614406,
      emissiveIntensity: 0.35,
      roughness: 0.32,
      metalness: 0.65
    });
    var blanketMat = mat('royalBlanketV2', {
      map: makeBlanketTex(),
      roughness: 0.72,
      metalness: 0.10,
      side: THREE.DoubleSide
    });

    var bodyPivot = new THREE.Group();
    bodyPivot.position.y = 1.66;
    root.add(bodyPivot);

    // ── 圆润雕塑感躯干（胸腔 + 肩峰 + 弧形背脊 + 缓坡臀部 + 腹部）──
    var chest = new THREE.Mesh(new THREE.SphereGeometry(0.84, 20, 16), skinMat);
    chest.scale.set(0.92, 0.96, 1.18);
    chest.position.set(0, 0.12, 0.32);
    chest.castShadow = true;
    chest.receiveShadow = true;
    bodyPivot.add(chest);

    var midBelly = new THREE.Mesh(new THREE.SphereGeometry(0.86, 20, 16), skinMat);
    midBelly.scale.set(0.94, 0.90, 1.12);
    midBelly.position.set(0, -0.02, -0.18);
    midBelly.castShadow = true;
    bodyPivot.add(midBelly);

    var shoulderHump = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), skinMat);
    shoulderHump.scale.set(1.06, 0.72, 1.10);
    shoulderHump.position.set(0, 0.62, 0.52);
    bodyPivot.add(shoulderHump);

    var rump = new THREE.Mesh(new THREE.SphereGeometry(0.76, 18, 14), skinMat);
    rump.scale.set(0.92, 0.94, 1.05);
    rump.position.set(0, -0.04, -0.82);
    rump.castShadow = true;
    bodyPivot.add(rump);

    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.60, 0.66, 14), skinMat);
    neck.rotation.x = Math.PI / 2 - 0.22;
    neck.position.set(0, 0.28, 1.04);
    bodyPivot.add(neck);

    // 皇家织锦马鞍披风（贴合圆润背部曲率）
    if (royal) {
      var saddle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.86, 0.86, 1.48, 20, 1, true, -Math.PI * 0.58, Math.PI * 1.16),
        blanketMat
      );
      saddle.rotation.x = Math.PI / 2;
      saddle.position.set(0, 0.08, -0.08);
      saddle.scale.set(0.97, 1.0, 1.02);
      bodyPivot.add(saddle);

      var goldCrest = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.22, 14), goldMat);
      goldCrest.position.set(0, 0.95, 0.02);
      bodyPivot.add(goldCrest);
    }

    // ── 仿生头部（双穹顶颅骨 + 眉骨 + 颊部 + 下颌 + 眼神高光）──
    var headGroup = new THREE.Group();
    headGroup.position.set(0, 0.34, 1.44);
    bodyPivot.add(headGroup);

    var skull = new THREE.Mesh(new THREE.SphereGeometry(0.58, 18, 14), skinMat);
    skull.scale.set(0.94, 1.06, 0.98);
    skull.castShadow = true;
    headGroup.add(skull);

    // 亚洲象标志性双额丘
    [-0.18, 0.18].forEach(function (dx) {
      var dome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), skinMat);
      dome.position.set(dx, 0.36, 0.04);
      headGroup.add(dome);
    });

    // 颊部与下唇
    var jaw = new THREE.Mesh(new THREE.SphereGeometry(0.30, 12, 10), darkSkinMat);
    jaw.scale.set(0.82, 0.62, 0.95);
    jaw.position.set(0, -0.36, 0.18);
    headGroup.add(jaw);

    if (royal) {
      var diadem = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.38, 8), goldMat);
      diadem.position.set(0, 0.72, 0.12);
      diadem.rotation.x = 0.2;
      headGroup.add(diadem);
    }

    // 眼睛（眼窝 + 亮黑眼球 + 眉弓）
    [-1, 1].forEach(function (side) {
      var brow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), skinMat);
      brow.scale.set(0.8, 0.55, 1.3);
      brow.position.set(side * 0.44, 0.22, 0.28);
      var eye = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), eyeMat);
      eye.position.set(side * 0.46, 0.12, 0.32);
      headGroup.add(brow, eye);
    });

    // 扇形仿生大耳朵
    var earGeo = getEarGeo();
    function makeEar(side) {
      var pivot = new THREE.Group();
      pivot.position.set(side * 0.48, 0.16, -0.08);
      var earMesh = new THREE.Mesh(earGeo, skinMat);
      earMesh.scale.set(side * 1.05, 1.05, 1.0);
      earMesh.position.set(side * 0.36, -0.06, -0.14);
      earMesh.rotation.y = side * -0.42;
      earMesh.castShadow = true;

      var inner = new THREE.Mesh(earGeo, earInnerMat);
      inner.scale.set(side * 0.76, 0.76, 0.45);
      inner.position.set(side * 0.35, -0.06, -0.11);
      inner.rotation.y = side * -0.42;

      pivot.add(earMesh, inner);
      headGroup.add(pivot);
      return pivot;
    }
    var earL = makeEar(-1);
    var earR = makeEar(1);

    // 渐变弧形真象牙（自然向前微外撇并优雅上翘）
    function makeTusk(side) {
      var pts = [
        new THREE.Vector3(side * 0.24, -0.22, 0.34),
        new THREE.Vector3(side * 0.32, -0.34, 0.66),
        new THREE.Vector3(side * 0.38, -0.26, 0.98),
        new THREE.Vector3(side * 0.36, -0.02, 1.22)
      ];
      var tusk = makeTaperedCurve(pts, 0.085, 0.018, 12, 10, tuskMat);
      headGroup.add(tusk);
      if (royal) {
        var ring = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.018, 8, 14), goldMat);
        ring.position.set(side * 0.35, -0.30, 0.80);
        ring.rotation.y = side * 0.25;
        headGroup.add(ring);
      }
    }
    makeTusk(-1);
    makeTusk(1);

    // ── 三段关节仿生长鼻（圆柱渐变 + 褶皱环 + 双叶鼻尖）──
    var trunkBase = new THREE.Group();
    trunkBase.position.set(0, -0.08, 0.46);
    headGroup.add(trunkBase);

    var tUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.68, 14), skinMat);
    tUpper.position.set(0, -0.30, 0.10);
    tUpper.rotation.x = -0.26;
    tUpper.castShadow = true;
    trunkBase.add(tUpper);

    // 象鼻皱褶环
    [0.14, 0.34, 0.52].forEach(function (dy, idx) {
      var fold = new THREE.Mesh(new THREE.TorusGeometry(0.21 - idx * 0.022, 0.022, 6, 14), darkSkinMat);
      fold.rotation.x = Math.PI / 2 - 0.26;
      fold.position.set(0, -dy, 0.05 + idx * 0.045);
      trunkBase.add(fold);
    });

    var trunkMid = new THREE.Group();
    trunkMid.position.set(0, -0.60, 0.18);
    trunkBase.add(trunkMid);

    var tMidJoint = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 10), skinMat);
    var tLower = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.105, 0.64, 14), skinMat);
    tLower.position.set(0, -0.30, 0.06);
    tLower.rotation.x = -0.18;
    tLower.castShadow = true;
    trunkMid.add(tMidJoint, tLower);

    var trunkTip = new THREE.Group();
    trunkTip.position.set(0, -0.60, 0.12);
    trunkMid.add(trunkTip);
    var tipBulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), darkSkinMat);
    tipBulb.scale.set(1.05, 0.85, 1.25);
    var tipFinger = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 8), darkSkinMat);
    tipFinger.position.set(0, -0.05, 0.10);
    tipFinger.rotation.x = 1.25;
    trunkTip.add(tipBulb, tipFinger);

    // ── 弯曲细长象尾 + 深色尾毛簇 ──
    var tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.08, -1.48);
    bodyPivot.add(tailPivot);
    var tailPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.35, -0.12),
      new THREE.Vector3(0, -0.78, -0.06)
    ];
    var tailMesh = makeTaperedCurve(tailPts, 0.055, 0.025, 8, 8, darkSkinMat);
    var tuft = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.24, 8), mat('tailTuftV2', { color: 0x221f1d, roughness: 0.95 }));
    tuft.position.set(0, -0.88, -0.05);
    tuft.rotation.x = Math.PI;
    tailPivot.add(tailMesh, tuft);

    // ── 四条带膝关节与圆润蹄甲的粗壮柱形象腿 ──
    function makeLeg(x, z, isFront) {
      var hip = new THREE.Group();
      hip.position.set(x, -0.44, z);

      var thigh = new THREE.Mesh(new THREE.CylinderGeometry(isFront ? 0.28 : 0.30, 0.22, 0.64, 14), skinMat);
      thigh.position.y = -0.30;
      thigh.castShadow = true;
      hip.add(thigh);

      var kneePivot = new THREE.Group();
      kneePivot.position.y = -0.60;
      hip.add(kneePivot);

      var kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), skinMat);
      var shin = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.23, 0.56, 14), skinMat);
      shin.position.y = -0.28;
      shin.castShadow = true;

      var footPad = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.16, 14), darkSkinMat);
      footPad.position.set(0, -0.56, 0.02);
      kneePivot.add(kneeCap, shin, footPad);

      // 4 枚浅象牙色圆润脚趾甲
      [-0.55, -0.18, 0.18, 0.55].forEach(function (ang) {
        var nail = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 6), nailMat);
        nail.scale.set(1.0, 0.85, 0.7);
        nail.position.set(Math.sin(ang) * 0.22, -0.60, 0.02 + Math.cos(ang) * 0.22);
        kneePivot.add(nail);
      });

      bodyPivot.add(hip);
      return { hip: hip, knee: kneePivot };
    }

    var legFL = makeLeg(-0.44, 0.72, true);
    var legFR = makeLeg(0.44, 0.72, true);
    var legBL = makeLeg(-0.44, -0.74, false);
    var legBR = makeLeg(0.44, -0.74, false);

    root.userData = {
      royal: royal,
      bodyPivot: bodyPivot,
      headGroup: headGroup,
      earL: earL,
      earR: earR,
      trunkBase: trunkBase,
      trunkMid: trunkMid,
      trunkTip: trunkTip,
      tailPivot: tailPivot,
      legFL: legFL,
      legFR: legFR,
      legBL: legBL,
      legBR: legBR
    };
    return root;
  }

  function animateElephant(el, t, mode, intensity) {
    if (!el || !el.userData) return;
    var u = el.userData;
    var speed = mode === 'charge' ? 10.5 : (mode === 'startle' ? 13.5 : 3.8);
    var ph = t * speed;
    var swing = mode === 'charge' ? 0.52 : (mode === 'startle' ? 0.34 : 0.28);

    function stepLeg(leg, phaseOffset, isFront) {
      var s = Math.sin(ph + phaseOffset);
      var lift = Math.max(0, Math.cos(ph + phaseOffset));
      leg.hip.rotation.x = s * swing;
      // 前腿向后自然微屈，后腿向前微屈，步态更逼真
      leg.knee.rotation.x = (isFront ? 0.32 : 0.26) * lift * (mode === 'charge' ? 1.4 : 1.0);
    }

    if (mode === 'trumpet') {
      var env = intensity === undefined ? 1 : Math.max(0, Math.min(1, intensity));
      var vib = Math.sin(t * 22);
      var stomp = Math.sin(t * 14);
      // 象鸣时前躯明显昂起、前腿抬蹄踏地、双耳大幅张开扇动、长鼻高举震颤
      u.bodyPivot.position.y = 1.66 + 0.34 * env + Math.abs(vib) * 0.05 * env;
      u.bodyPivot.rotation.x = -0.26 * env;
      u.bodyPivot.rotation.z = Math.sin(t * 10) * 0.045 * env;
      u.headGroup.rotation.x = -0.44 * env + vib * 0.07 * env;
      u.trunkBase.rotation.x = -1.68 * env + Math.sin(t * 19) * 0.14 * env;
      u.trunkMid.rotation.x = -0.82 * env + Math.cos(t * 19) * 0.12 * env;
      u.trunkTip.rotation.x = -0.58 * env + vib * 0.10 * env;
      u.earL.rotation.y = 0.22 + 0.78 * env + Math.sin(t * 24) * 0.18 * env;
      u.earR.rotation.y = -0.22 - 0.78 * env - Math.sin(t * 24) * 0.18 * env;
      u.tailPivot.rotation.z = Math.sin(t * 20) * 0.48 * env;
      u.legFL.hip.rotation.x = -0.68 * env + stomp * 0.16 * env;
      u.legFR.hip.rotation.x = -0.56 * env - stomp * 0.16 * env;
      u.legFL.knee.rotation.x = 0.74 * env;
      u.legFR.knee.rotation.x = 0.64 * env;
      u.legBL.hip.rotation.x = 0.22 * env;
      u.legBR.hip.rotation.x = 0.22 * env;
      u.legBL.knee.rotation.x = 0.12 * env;
      u.legBR.knee.rotation.x = 0.12 * env;
      return;
    }

    stepLeg(u.legFL, 0, true);
    stepLeg(u.legBR, 0.35, false);
    stepLeg(u.legFR, Math.PI, true);
    stepLeg(u.legBL, Math.PI + 0.35, false);

    if (mode === 'startle') {
      u.bodyPivot.position.y = 1.66 + Math.abs(Math.sin(ph * 0.8)) * 0.20;
      u.bodyPivot.rotation.x = -0.16;
      u.headGroup.rotation.x = -0.32;
      u.trunkBase.rotation.x = -1.20 + Math.sin(ph * 1.4) * 0.16;
      u.trunkMid.rotation.x = -0.62;
      u.trunkTip.rotation.x = -0.45;
      u.earL.rotation.y = 0.62 + Math.sin(ph * 1.5) * 0.18;
      u.earR.rotation.y = -0.62 - Math.sin(ph * 1.5) * 0.18;
      u.tailPivot.rotation.z = Math.sin(ph * 2.0) * 0.42;
      return;
    }

    if (mode === 'charge') {
      u.bodyPivot.position.y = 1.66 + Math.abs(Math.sin(ph)) * 0.14;
      u.bodyPivot.rotation.x = 0.08;
      u.bodyPivot.rotation.z = Math.cos(ph) * 0.035;
      u.headGroup.rotation.x = -0.14 + Math.sin(ph * 0.5) * 0.06;
      u.trunkBase.rotation.x = -0.92 + Math.sin(ph * 0.8) * 0.14;
      u.trunkMid.rotation.x = -0.52 + Math.cos(ph * 0.8) * 0.14;
      u.trunkTip.rotation.x = -0.35;
      u.earL.rotation.y = 0.50 + Math.sin(ph * 1.1) * 0.18;
      u.earR.rotation.y = -0.50 - Math.sin(ph * 1.1) * 0.18;
      u.tailPivot.rotation.z = Math.sin(ph * 1.5) * 0.35;
      return;
    }

    // walk
    u.bodyPivot.position.y = 1.66 + Math.abs(Math.sin(ph)) * 0.06;
    u.bodyPivot.rotation.x = 0;
    u.bodyPivot.rotation.z = Math.sin(ph) * 0.028;
    u.headGroup.rotation.x = Math.sin(ph * 0.5) * 0.05;
    u.trunkBase.rotation.x = -0.10 + Math.sin(ph * 0.65) * 0.14;
    u.trunkMid.rotation.x = 0.18 + Math.cos(ph * 0.65) * 0.16;
    u.trunkTip.rotation.x = 0.12 + Math.sin(ph * 0.9) * 0.14;
    u.earL.rotation.y = 0.22 + Math.sin(ph * 0.75) * 0.15;
    u.earR.rotation.y = -0.22 - Math.sin(ph * 0.75) * 0.15;
    u.tailPivot.rotation.z = Math.sin(ph * 1.2) * 0.22;
  }

  window.StreetElephant = {
    createElephant: createElephant,
    animateElephant: animateElephant
  };
})();

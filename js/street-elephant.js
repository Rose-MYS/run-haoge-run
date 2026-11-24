// ═══════════════════════════════════════════════════════════════
//  STREET-ELEPHANT.JS — 程序化 3D 大象模块（转弯路障大象 + 保熟大象技能）
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var matCache = {};
  function mat(key, opts) {
    if (!matCache[key]) matCache[key] = new THREE.MeshLambertMaterial(opts);
    return matCache[key];
  }

  function createElephant(options) {
    options = options || {};
    var royal = !!options.royal;
    var root = new THREE.Group();

    var skinMat = mat(royal ? 'royalSkin' : 'streetSkin', {
      color: royal ? 0x5c6473 : 0x464d59,
      emissive: royal ? 0x161922 : 0x101318,
      emissiveIntensity: 0.30
    });
    var darkMat = mat('darkSkin', { color: 0x2d323b });
    var earInnerMat = mat('earInner', { color: 0xb98b88 });
    var tuskMat = mat('tusk', { color: 0xf7f1dc, emissive: 0x332b18, emissiveIntensity: 0.2 });
    var eyeMat = mat('eye', { color: 0x111111 });
    var goldMat = mat('royalGold', { color: 0xf5c842, emissive: 0x705108, emissiveIntensity: 0.45 });
    var crimsonMat = mat('royalCrimson', { color: 0x9b1b26, emissive: 0x2c0609, emissiveIntensity: 0.3 });

    var bodyPivot = new THREE.Group();
    bodyPivot.position.y = 1.68;
    root.add(bodyPivot);

    // 躯干与臀部
    var torso = new THREE.Mesh(new THREE.BoxGeometry(1.56, 1.38, 2.38), skinMat);
    torso.castShadow = true;
    torso.receiveShadow = true;
    bodyPivot.add(torso);

    var rump = new THREE.Mesh(new THREE.BoxGeometry(1.38, 1.24, 0.72), skinMat);
    rump.position.set(0, -0.04, -1.16);
    rump.castShadow = true;
    bodyPivot.add(rump);

    var shoulderHump = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.42, 0.95), skinMat);
    shoulderHump.position.set(0, 0.68, 0.56);
    bodyPivot.add(shoulderHump);

    // 皇家披风与金边
    if (royal) {
      var blanket = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.68, 1.56), crimsonMat);
      blanket.position.set(0, 0.42, -0.04);
      blanket.castShadow = true;
      bodyPivot.add(blanket);

      var trim = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.14, 1.60), goldMat);
      trim.position.set(0, 0.12, -0.04);
      bodyPivot.add(trim);

      var backCrest = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.18, 0.92), goldMat);
      backCrest.position.set(0, 0.78, -0.04);
      bodyPivot.add(backCrest);
    }

    // 头部组
    var headGroup = new THREE.Group();
    headGroup.position.set(0, 0.28, 1.48);
    bodyPivot.add(headGroup);

    var skull = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.14, 1.06), skinMat);
    skull.castShadow = true;
    headGroup.add(skull);

    var forehead = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.44, 0.86), skinMat);
    forehead.position.set(0, 0.54, 0.04);
    headGroup.add(forehead);

    if (royal) {
      var crownBase = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.22, 0.74), goldMat);
      crownBase.position.set(0, 0.82, 0.04);
      headGroup.add(crownBase);

      var crownGem = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.22), crimsonMat);
      crownGem.position.set(0, 0.92, 0.34);
      headGroup.add(crownGem);
    }

    // 眼睛
    var eyeGeo = new THREE.BoxGeometry(0.11, 0.14, 0.12);
    var eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.46, 0.16, 0.50);
    var eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.46, 0.16, 0.50);
    headGroup.add(eyeL, eyeR);

    // 大耳朵（左右各一个枢轴）
    function makeEar(side) {
      var pivot = new THREE.Group();
      pivot.position.set(side * 0.62, 0.12, 0.04);
      var outer = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.96, 0.78), skinMat);
      outer.position.set(side * 0.18, -0.08, -0.18);
      outer.rotation.y = side * -0.28;
      outer.castShadow = true;
      var inner = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.56), earInnerMat);
      inner.position.set(side * 0.14, -0.08, -0.14);
      inner.rotation.y = side * -0.28;
      pivot.add(outer, inner);
      headGroup.add(pivot);
      return pivot;
    }
    var earL = makeEar(-1);
    var earR = makeEar(1);

    // 象牙
    function makeTusk(side) {
      var pivot = new THREE.Group();
      pivot.position.set(side * 0.32, -0.26, 0.50);
      var seg1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.56), tuskMat);
      seg1.position.set(0, -0.04, 0.24);
      seg1.rotation.x = 0.24;
      var seg2 = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 0.42), tuskMat);
      seg2.position.set(0, 0.04, 0.62);
      seg2.rotation.x = -0.38;
      pivot.add(seg1, seg2);
      headGroup.add(pivot);
      return pivot;
    }
    makeTusk(-1);
    makeTusk(1);

    // 多段可动长鼻
    var trunkBase = new THREE.Group();
    trunkBase.position.set(0, -0.10, 0.54);
    headGroup.add(trunkBase);

    var trunkUpper = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.32), skinMat);
    trunkUpper.position.set(0, -0.34, 0.12);
    trunkUpper.rotation.x = -0.22;
    trunkUpper.castShadow = true;
    trunkBase.add(trunkUpper);

    var trunkMid = new THREE.Group();
    trunkMid.position.set(0, -0.68, 0.20);
    trunkBase.add(trunkMid);

    var trunkLower = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), skinMat);
    trunkLower.position.set(0, -0.32, 0.08);
    trunkLower.rotation.x = -0.18;
    trunkLower.castShadow = true;
    trunkMid.add(trunkLower);

    var trunkTip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.26), darkMat);
    trunkTip.position.set(0, -0.66, 0.16);
    trunkMid.add(trunkTip);

    // 尾巴
    var tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.18, -1.50);
    bodyPivot.add(tailPivot);
    var tailShaft = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.78, 0.10), darkMat);
    tailShaft.position.set(0, -0.38, -0.06);
    tailShaft.rotation.x = 0.22;
    tailPivot.add(tailShaft);

    // 四条粗壮象腿
    function makeLeg(x, z) {
      var pivot = new THREE.Group();
      pivot.position.set(x, -0.56, z);
      var col = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.14, 0.44), skinMat);
      col.position.y = -0.56;
      col.castShadow = true;
      var foot = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.50), darkMat);
      foot.position.set(0, -1.08, 0.03);
      pivot.add(col, foot);
      bodyPivot.add(pivot);
      return pivot;
    }

    var legFL = makeLeg(-0.48, 0.76);
    var legFR = makeLeg(0.48, 0.76);
    var legBL = makeLeg(-0.48, -0.78);
    var legBR = makeLeg(0.48, -0.78);

    root.userData = {
      royal: royal,
      bodyPivot: bodyPivot,
      headGroup: headGroup,
      earL: earL,
      earR: earR,
      trunkBase: trunkBase,
      trunkMid: trunkMid,
      tailPivot: tailPivot,
      legFL: legFL,
      legFR: legFR,
      legBL: legBL,
      legBR: legBR
    };
    return root;
  }

  function animateElephant(el, t, mode) {
    if (!el || !el.userData) return;
    var u = el.userData;
    var speed = mode === 'charge' ? 11.5 : (mode === 'startle' ? 14 : 4.2);
    var ph = t * speed;
    var swing = mode === 'charge' ? 0.58 : (mode === 'startle' ? 0.36 : 0.32);

    u.legFL.rotation.x = Math.sin(ph) * swing;
    u.legBR.rotation.x = Math.sin(ph) * swing * 0.92;
    u.legFR.rotation.x = -Math.sin(ph) * swing;
    u.legBL.rotation.x = -Math.sin(ph) * swing * 0.92;

    if (mode === 'startle') {
      u.bodyPivot.position.y = 1.68 + Math.abs(Math.sin(ph * 0.8)) * 0.22;
      u.bodyPivot.rotation.x = -0.18;
      u.headGroup.rotation.x = -0.35;
      u.trunkBase.rotation.x = -1.15 + Math.sin(ph * 1.4) * 0.18;
      u.trunkMid.rotation.x = -0.55;
      u.earL.rotation.y = 0.58 + Math.sin(ph * 1.5) * 0.18;
      u.earR.rotation.y = -0.58 - Math.sin(ph * 1.5) * 0.18;
      u.tailPivot.rotation.z = Math.sin(ph * 2.0) * 0.45;
      return;
    }

    if (mode === 'charge') {
      u.bodyPivot.position.y = 1.68 + Math.abs(Math.sin(ph)) * 0.16;
      u.bodyPivot.rotation.x = 0.08;
      u.bodyPivot.rotation.z = Math.cos(ph) * 0.04;
      u.headGroup.rotation.x = -0.12 + Math.sin(ph * 0.5) * 0.06;
      u.trunkBase.rotation.x = -0.88 + Math.sin(ph * 0.8) * 0.14;
      u.trunkMid.rotation.x = -0.45 + Math.cos(ph * 0.8) * 0.14;
      u.earL.rotation.y = 0.44 + Math.sin(ph * 1.1) * 0.18;
      u.earR.rotation.y = -0.44 - Math.sin(ph * 1.1) * 0.18;
      u.tailPivot.rotation.z = Math.sin(ph * 1.5) * 0.35;
      return;
    }

    // walk
    u.bodyPivot.position.y = 1.68 + Math.abs(Math.sin(ph)) * 0.07;
    u.bodyPivot.rotation.x = 0;
    u.bodyPivot.rotation.z = Math.sin(ph) * 0.03;
    u.headGroup.rotation.x = Math.sin(ph * 0.5) * 0.06;
    u.trunkBase.rotation.x = -0.12 + Math.sin(ph * 0.7) * 0.14;
    u.trunkMid.rotation.x = 0.16 + Math.cos(ph * 0.7) * 0.16;
    u.earL.rotation.y = 0.20 + Math.sin(ph * 0.8) * 0.14;
    u.earR.rotation.y = -0.20 - Math.sin(ph * 0.8) * 0.14;
    u.tailPivot.rotation.z = Math.sin(ph * 1.3) * 0.22;
  }

  window.StreetElephant = {
    createElephant: createElephant,
    animateElephant: animateElephant
  };
})();

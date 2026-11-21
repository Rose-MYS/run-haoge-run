window.RunnerModels = (function () {
  'use strict';

  var DEFAULT_MODEL_URL = 'assets/models/subway_player1.glb';
  var REFINED_CHASER_URL = 'assets/models/huaqiang-refined.glb';
  var MODEL_URLS = {
    haoge: 'assets/models/haoge.glb',
    huaqiang: DEFAULT_MODEL_URL,
    xiaodi: DEFAULT_MODEL_URL,
    dama: DEFAULT_MODEL_URL,
  };
  var fromFile = location.protocol === 'file:';
  var modelsEmbedded = MODEL_URLS.haoge.indexOf('data:') === 0;
  var params = new URLSearchParams(location.search);
  var toonPreview = params.get('style') === 'toon';
  var refinedChaser = params.get('chaser') === 'refined' || REFINED_CHASER_URL.indexOf('data:') === 0;
  var proceduralPreview = window.HAOGE_SOURCE_ONLY || window.HAOGE_PROCEDURAL_CHARACTERS ||
    params.get('models') === 'procedural';

  // —— 开发期郝哥模型切换（临时调试用，定稿后可删除本段 + setHaogePack 相关导出）——
  var HAOGE_PACKS = [
    { id: 'v1', label: '现役 v1（haoge.glb）', url: MODEL_URLS.haoge, desc: '主建模agent2.0 早期交付，17.7MB，含 run/jump/roll/fall/die 动画' },
    { id: 'meshy-fixed', label: 'Meshy7-fixed', url: 'assets/models/haoge-meshy7-fixed.glb', desc: 'Meshy 出模修整版，26.8MB，含全套动画' },
    { id: 'meshy-merged', label: 'Meshy7-merged', url: 'assets/models/haoge-meshy7-merged.glb', desc: 'Meshy 出模合辑版，26.8MB，含全套动画' },
  ];
  function haogePackUrl() {
    var active = activeHaogePackId();
    for (var p = 0; p < HAOGE_PACKS.length; p++) {
      if (HAOGE_PACKS[p].id === active) return HAOGE_PACKS[p].url;
    }
    return HAOGE_PACKS[0].url;
  }
  function activeHaogePackId() {
    if (fromFile || modelsEmbedded) return HAOGE_PACKS[0].id;
    var want = '';
    try { want = (localStorage && localStorage.getItem('haogeModelPack')) || ''; } catch (e) {}
    for (var p = 0; p < HAOGE_PACKS.length; p++) {
      if (HAOGE_PACKS[p].id === want) return HAOGE_PACKS[p].id;
    }
    return HAOGE_PACKS[0].id;
  }
  function primaryUrlFor(kind) {
    if (kind === 'haoge') return haogePackUrl();
    if (kind === 'huaqiang' && refinedChaser) return REFINED_CHASER_URL;
    return MODEL_URLS[kind] || DEFAULT_MODEL_URL;
  }

  var loader = new THREE.GLTFLoader();
  var runners = [];
  var haogeFaceTex = null;
  if (!proceduralPreview && THREE.TextureLoader && (!fromFile || modelsEmbedded)) {
    new THREE.TextureLoader().load('assets/textures/haoge-face.png?v=3', function (t) {
      haogeFaceTex = t;
      t.anisotropy = 4;
      for (var i = 0; i < runners.length; i++) {
        var u = runners[i].userData;
        if (u && u.faceMesh && u.faceKind === 'haoge') {
          u.faceMesh.material.map = t;
          u.faceMesh.material.transparent = true;
          u.faceMesh.material.alphaTest = 0.05;
          u.faceMesh.material.needsUpdate = true;
        }
      }
    });
  }
  if (THREE.Cache) THREE.Cache.enabled = true;

  // Calibrated for this GLB with root rotation 0.
  var BASE = {
    height: 1.7107,
    minX: -0.2376,
    maxX: 0.3273,
    minY: -0.0466,
    maxY: 1.6641,
    minZ: -0.2805,
    maxZ: 0.5502,
  };

  var KINDS = {
    haoge: {
      height: 2.2,
      skin: 0x6a3d2e,
      hair: 0x171310,
      jacket: 0x2a2d33,
      shirt: 0x5c6b4a,
      pants: 0x22252a,
      shoe: 0x2b2e33,
      face: 'haoge',
    },
    huaqiang: {
      height: 2.5,
      skin: 0x5e4231,
      hair: 0x141519,
      jacket: 0x17191f,
      shirt: 0xe8e4dc,
      pants: 0x17191f,
      shoe: 0x24272c,
      face: 'huaqiang',
    },
    xiaodi: {
      height: 2.15,
      skin: 0x5e4231,
      hair: 0x141519,
      jacket: 0x20262c,
      shirt: 0x9aa0a8,
      pants: 0x22252a,
      shoe: 0x24272c,
      face: 'xiaodi',
    },
    dama: {
      height: 2.1,
      skin: 0x5e4231,
      hair: 0x6a6a6a,
      jacket: 0xd94f4f,
      shirt: 0xd94f4f,
      pants: 0x8e44ad,
      shoe: 0x4a3b33,
      face: 'dama',
    },
  };

  function std(color, opts) {
    return new THREE.MeshStandardMaterial(
      Object.assign({ color: color, roughness: 0.78, metalness: 0 }, opts || {})
    );
  }

  function mesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;
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

  function roundBox(w, h, d, mat, r) {
    var rr = r || Math.min(w, h, d) * 0.16;
    var geo = new THREE.ExtrudeGeometry(roundedRectShape(w, h, rr), {
      depth: d,
      bevelEnabled: true,
      bevelThickness: rr * 0.8,
      bevelSize: rr * 0.9,
      bevelSegments: 2,
      curveSegments: 6,
    });
    geo.rotateX(Math.PI / 2);
    centerGeo(geo);
    return mesh(geo, mat);
  }

  function capsule(len, topR, botR, mat) {
    var g = new THREE.Group();
    var cyl = mesh(new THREE.CylinderGeometry(topR, botR, len, 12), mat);
    g.add(cyl);
    var top = mesh(new THREE.SphereGeometry(topR, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    top.position.y = len / 2;
    g.add(top);
    var bottom = mesh(new THREE.SphereGeometry(botR, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat);
    bottom.position.y = -len / 2;
    g.add(bottom);
    return g;
  }

  function findNode(root, names) {
    for (var i = 0; i < names.length; i++) {
      var n = root.getObjectByName(names[i]);
      if (n) return n;
    }
    return null;
  }

  function boneNames(base) {
    return ['mixamorig' + base, 'mixamorig:' + base];
  }

  function boneNamesAny(base) {
    return [base, 'mixamorig' + base, 'mixamorig:' + base];
  }

  function findBone(root, names) {
    for (var i = 0; i < names.length; i++) {
      var n = root.getObjectByName(names[i]);
      if (n && n.isBone) return n;
    }
    return null;
  }

  function normKey(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function hexColor(v) {
    return '#' + ('00000' + (v | 0).toString(16)).slice(-6);
  }

  function faceTexture(kind) {
    var c = document.createElement('canvas');
    c.width = c.height = 512;
    var ctx = c.getContext('2d');
    var cfg = KINDS[kind] || KINDS.haoge;
    ctx.fillStyle = hexColor(cfg.skin);
    ctx.fillRect(0, 0, 512, 512);

    if (kind === 'haoge') {
      ctx.fillStyle = '#5b3326';
      for (var i = 0; i < 34; i++) {
        var px = 60 + Math.random() * 392;
        var py = 60 + Math.random() * 392;
        ctx.beginPath();
        ctx.arc(px, py, 4 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    var eyeY = kind === 'huaqiang' ? 214 : 206;
    ctx.fillStyle = '#fdfcf9';
    ctx.beginPath();
    ctx.ellipse(190, eyeY, kind === 'huaqiang' ? 30 : 46, kind === 'huaqiang' ? 34 : 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(322, eyeY, kind === 'huaqiang' ? 30 : 46, kind === 'huaqiang' ? 34 : 58, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3a2a20';
    ctx.beginPath();
    ctx.arc(198, eyeY + 8, kind === 'huaqiang' ? 13 : 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(314, eyeY + 8, kind === 'huaqiang' ? 13 : 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(205, eyeY - 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(321, eyeY - 2, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#171310';
    ctx.lineCap = 'round';
    if (kind === 'huaqiang') {
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(150, 140);
      ctx.lineTo(216, 172);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(362, 140);
      ctx.lineTo(296, 172);
      ctx.stroke();
    } else if (kind === 'haoge') {
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(144, 128);
      ctx.lineTo(214, 142);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(368, 128);
      ctx.lineTo(298, 142);
      ctx.stroke();
    } else if (kind === 'dama') {
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(164, 146);
      ctx.lineTo(204, 154);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(348, 146);
      ctx.lineTo(308, 154);
      ctx.stroke();
    } else {
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.moveTo(158, 138);
      ctx.lineTo(208, 150);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(354, 138);
      ctx.lineTo(304, 150);
      ctx.stroke();
    }

    ctx.fillStyle = '#4a3329';
    if (kind === 'huaqiang') {
      ctx.beginPath();
      ctx.ellipse(256, 292, 15, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(256, 276, 15, 21, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (kind === 'dama') {
      ctx.strokeStyle = '#6e2c26';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(256, 352, 32, 0.18, Math.PI - 0.18);
      ctx.stroke();
      ctx.fillStyle = 'rgba(232,146,125,0.6)';
      ctx.beginPath();
      ctx.ellipse(158, 292, 24, 14, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(354, 292, 24, 14, -0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'haoge') {
      ctx.fillStyle = '#4a1c1a';
      ctx.beginPath();
      ctx.ellipse(256, 342, 34, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5f2ea';
      ctx.fillRect(232, 322, 48, 10);
      ctx.fillStyle = 'rgba(232,146,125,0.5)';
      ctx.beginPath();
      ctx.ellipse(158, 296, 26, 15, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(354, 296, 26, 15, -0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'huaqiang') {
      ctx.strokeStyle = '#6e2c26';
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(222, 352);
      ctx.lineTo(290, 352);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(256, 344);
      ctx.lineTo(256, 352);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#6e2c26';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(256, 344, 30, 0.25, Math.PI - 0.25);
      ctx.stroke();
    }

    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  function makeHead(kind, scale, inv, skinMat, hairMat) {
    var cfg = KINDS[kind] || KINDS.haoge;
    var g = new THREE.Group();
    var headR = 0.18 * inv;
    var shape = { x: 1, y: 1, z: 1 };
    if (kind === 'haoge') shape = { x: 0.92, y: 1.12, z: 0.9 };
    if (kind === 'huaqiang') shape = { x: 0.88, y: 1.12, z: 0.95 };
    if (kind === 'dama') shape = { x: 1.05, y: 0.95, z: 1.0 };

    var shell = mesh(new THREE.SphereGeometry(headR, 22, 18), skinMat);
    shell.scale.set(shape.x, shape.y, shape.z);
    g.add(shell);

    var hairR = headR * 1.12;
    var hairGeo = (kind === 'haoge')
      ? new THREE.SphereGeometry(hairR, 20, 16)
      : new THREE.SphereGeometry(hairR, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    var hair = mesh(hairGeo, hairMat);
    hair.position.set(0, 0.03 * inv, 0.05 * inv);
    if (kind === 'huaqiang') hair.scale.set(1, 0.5, 0.88);
    if (kind === 'haoge') hair.scale.set(1.05, 0.55, 1.0);
    if (kind === 'xiaodi') hair.scale.set(1, 0.52, 0.95);
    if (kind === 'dama') {
      hair.scale.set(1.06, 0.5, 1.05);
      var bun = mesh(new THREE.SphereGeometry(0.075 * inv, 12, 10), hairMat);
      bun.position.set(0, 0.1 * inv, 0.22 * inv);
      g.add(bun);
    }
    g.add(hair);

    var faceW = 0.24 * inv;
    var faceH = 0.21 * inv;
    var face = mesh(
      new THREE.ShapeGeometry(roundedRectShape(faceW, faceH, 0.04 * inv), 8),
      (kind === 'haoge' && haogeFaceTex)
        ? new THREE.MeshBasicMaterial({ map: haogeFaceTex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, depthWrite: false })
        : new THREE.MeshBasicMaterial({ map: faceTexture(kind), side: THREE.DoubleSide })
    );
    var frontZ = headR * Math.max(shape.x, shape.y) + 0.012 * inv;
    face.position.set(0, 0, -frontZ);
    g.add(face);

    var sweat = new THREE.Group();
    if (kind === 'haoge') {
      var sw = new THREE.MeshStandardMaterial({ color: 0x9fd8ef, roughness: 0.15, transparent: true, opacity: 0.9 });
      var sw1 = mesh(new THREE.SphereGeometry(0.04 * inv, 8, 6), sw);
      sw1.position.set(0.2 * inv, 0.12 * inv, -0.12 * inv);
      sweat.add(sw1);
      var sw2 = mesh(new THREE.SphereGeometry(0.027 * inv, 7, 5), sw);
      sw2.position.set(0.15 * inv, 0.19 * inv, -0.1 * inv);
      sweat.add(sw2);
      g.add(sweat);
    }

    if (kind === 'huaqiang') {
      var cig = mesh(new THREE.CylinderGeometry(0.013 * inv, 0.013 * inv, 0.22 * inv, 6), std(0xf2f2f2));
      cig.rotation.z = -0.5;
      cig.position.set(0.13 * inv, -0.05 * inv, -frontZ - 0.01 * inv);
      g.add(cig);
      var ember = mesh(new THREE.SphereGeometry(0.024 * inv, 6, 5), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
      ember.position.set(0.23 * inv, -0.1 * inv, -frontZ - 0.01 * inv);
      g.add(ember);
    }

    return { group: g, face: face, sweat: sweat };
  }

  function makeHairAddon(kind, scale, inv, hairMat) {
    var g = new THREE.Group();
    var headR = 0.3 * inv;
    var hairR = headR * 1.08;
    var hair = mesh(new THREE.SphereGeometry(hairR, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
    hair.position.set(0, 0.02 * inv, 0.04 * inv);
    if (kind === 'huaqiang') hair.scale.set(1, 0.5, 0.9);
    if (kind === 'haoge') hair.scale.set(1.06, 0.55, 1.0);
    if (kind === 'xiaodi') hair.scale.set(1, 0.52, 0.95);
    g.add(hair);

    var sweat = new THREE.Group();
    if (kind === 'haoge') {
      var sw = new THREE.MeshStandardMaterial({ color: 0x9fd8ef, roughness: 0.15, transparent: true, opacity: 0.9 });
      var sw1 = mesh(new THREE.SphereGeometry(0.04 * inv, 8, 6), sw);
      sw1.position.set(0.2 * inv, 0.1 * inv, -0.12 * inv);
      sweat.add(sw1);
      var sw2 = mesh(new THREE.SphereGeometry(0.027 * inv, 7, 5), sw);
      sw2.position.set(0.15 * inv, 0.17 * inv, -0.1 * inv);
      sweat.add(sw2);
      g.add(sweat);
    }

    if (kind === 'huaqiang') {
      var cig = mesh(new THREE.CylinderGeometry(0.013 * inv, 0.013 * inv, 0.22 * inv, 6), std(0xf2f2f2));
      cig.rotation.z = -0.5;
      cig.position.set(0.13 * inv, -0.05 * inv, -0.12 * inv);
      g.add(cig);
      var ember = mesh(new THREE.SphereGeometry(0.024 * inv, 6, 5), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
      ember.position.set(0.23 * inv, -0.1 * inv, -0.13 * inv);
      g.add(ember);
    }

    return { group: g, face: null, sweat: sweat };
  }

  function makeKnife(scale, inv) {
    var g = new THREE.Group();
    var handle = mesh(new THREE.CylinderGeometry(0.028 * inv, 0.024 * inv, 0.24 * inv, 8), std(0x8a5a33));
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0, -0.13 * inv);
    g.add(handle);
    var pommel = mesh(new THREE.SphereGeometry(0.032 * inv, 6, 5), std(0x8a5a33));
    pommel.position.set(0, 0, -0.26 * inv);
    g.add(pommel);
    var guard = mesh(new THREE.BoxGeometry(0.11 * inv, 0.032 * inv, 0.14 * inv), std(0x5d636c, { roughness: 0.35, metalness: 0.7 }));
    guard.position.set(0, 0, -0.01 * inv);
    g.add(guard);
    var blade = mesh(new THREE.BoxGeometry(0.06 * inv, 0.36 * inv, 0.02 * inv), std(0x9aa2ad, { roughness: 0.25, metalness: 0.9 }));
    blade.position.set(0, 0.04 * inv, 0.13 * inv);
    g.add(blade);
    g.userData = { blade: blade };
    return g;
  }

  function buildBody(runner, model, kind, scale, inv, pure) {
    var cfg = KINDS[kind] || KINDS.haoge;
    var hidden = [];
    var sculptBones = [];

    if (pure) {
      var headBone = findBone(model, boneNamesAny('Head')) ||
        findBone(model, boneNamesAny('Neck'));
      var headPivot = new THREE.Group();
      if (headBone) headBone.add(headPivot);
      var handMeshes = [];
      model.traverse(function (o) {
        if (o.isMesh && /hand|palm|finger/i.test(o.name)) handMeshes.push(o);
      });
      return {
        head: headPivot,
        faceMesh: null,
        faceControls: { sweat: null },
        leftArm: findBone(model, boneNamesAny('LeftArm')) || new THREE.Group(),
        rightArm: findBone(model, boneNamesAny('RightArm')) || new THREE.Group(),
        leftLeg: findBone(model, boneNamesAny('LeftUpLeg')) ||
          findBone(model, boneNamesAny('LeftLeg')) || new THREE.Group(),
        rightLeg: findBone(model, boneNamesAny('RightUpLeg')) ||
          findBone(model, boneNamesAny('RightLeg')) || new THREE.Group(),
        hands: handMeshes,
        knifeBlade: null,
        elbows: [new THREE.Group(), new THREE.Group()],
        knees: [new THREE.Group(), new THREE.Group()],
        torso: new THREE.Group(),
        faceKind: cfg.face,
        hiddenBones: [],
        sculptBones: [],
      };
    }

    var hideBody = kind !== 'haoge';
    var faceNames = ['Boy01_Body_Geo', 'Boy01_Brows_Geo', 'Boy01_Eyes_Geo', 'h_Geo'];
    if (!hideBody) faceNames = ['Boy01_Brows_Geo', 'Boy01_Eyes_Geo', 'h_Geo'];
    faceNames.forEach(function (name) {
      var m = model.getObjectByName(name);
      if (m) m.visible = false;
    });
    var bodyMesh = model.getObjectByName('Boy01_Body_Geo');
    if (bodyMesh && bodyMesh.material) {
      bodyMesh.material = bodyMesh.material.clone();
      bodyMesh.material.color.setHex(kind === 'huaqiang' ? 0x17191f : kind === 'haoge' ? 0x3a3d44 : cfg.jacket);
      bodyMesh.material.roughness = kind === 'huaqiang' ? 0.35 : 0.6;
      bodyMesh.material.metalness = kind === 'huaqiang' ? 0.12 : 0;
    }
    var hideBoneNames = ['Hat', 'Hood', 'Hood1', 'HairA', 'HairB'];
    if (kind === 'haoge') hideBoneNames = hideBoneNames.concat(['Backpack', 'RBackpack_Strap', 'LBackpack_Strap']);
    hideBoneNames.forEach(function (name) {
      var b = findNode(model, boneNames(name));
      if (b) {
        b.scale.setScalar(0.0001);
        hidden.push(b);
      }
    });
    if (kind === 'haoge') {
      var sculptDefs = [
        ['Hips', 1.35, 1.02, 1.35],
        ['Spine', 1.25, 1.02, 1.25],
        ['Spine1', 1.3, 1.0, 1.3],
        ['Spine2', 1.22, 1.0, 1.22],
        ['LeftShoulder', 1.2, 1.2, 1.2],
        ['RightShoulder', 1.2, 1.2, 1.2],
        ['Head', 1.0, 1.0, 1.0],
      ];
      for (var si = 0; si < sculptDefs.length; si++) {
        var b = findNode(model, boneNames(sculptDefs[si][0]));
        if (b) {
          b.scale.set(sculptDefs[si][1], sculptDefs[si][2], sculptDefs[si][3]);
          sculptBones.push({
            bone: b,
            scale: new THREE.Vector3(sculptDefs[si][1], sculptDefs[si][2], sculptDefs[si][3]),
          });
        }
      }
    }

    var jacket = std(cfg.jacket);
    var shirt = std(cfg.shirt);
    var pants = std(cfg.pants);
    var shoe = std(cfg.shoe);
    var skinMat = std(cfg.skin, { roughness: 0.55 });

    function attach(parentName, child) {
      var p = findNode(model, boneNames(parentName));
      if (p) p.add(child);
      return p;
    }

    var torsoAnchor = new THREE.Group();
    var hipsAnchor = new THREE.Group();
    if (kind !== 'haoge') {
      var spine = findNode(model, boneNames('Spine2')) || findNode(model, boneNames('Spine1'));
      if (spine) spine.add(torsoAnchor);
      var torsoShape = { x: 1, y: 1, z: 1 };
      var torsoR = 0.36 * inv;
      if (kind === 'huaqiang') {
        torsoShape = { x: 0.94, y: 1.14, z: 0.78 };
        torsoR = 0.33 * inv;
      } else if (kind === 'dama') {
        torsoShape = { x: 1.08, y: 0.98, z: 0.82 };
        torsoR = 0.34 * inv;
      }
      var torso = mesh(new THREE.SphereGeometry(torsoR, 20, 16), jacket);
      torso.scale.set(torsoShape.x, torsoShape.y, torsoShape.z);
      torso.position.y = 0.02 * inv;
      torsoAnchor.add(torso);
      var chest = mesh(new THREE.SphereGeometry(torsoR * 0.92, 18, 14), shirt);
      chest.scale.set(torsoShape.x * 0.72, torsoShape.y * 0.8, torsoShape.z * 0.42);
      chest.position.set(0, 0.02 * inv, -torsoR * torsoShape.z * 0.98);
      torsoAnchor.add(chest);
      if (kind === 'huaqiang') {
        var lapelL = roundBox(0.1 * inv, 0.32 * inv, 0.05 * inv, jacket, 0.015 * inv);
        lapelL.position.set(-0.13 * inv, 0.08 * inv, -torsoR * torsoShape.z * 0.92);
        lapelL.rotation.z = 0.16;
        torsoAnchor.add(lapelL);
        var lapelR = lapelL.clone();
        lapelR.position.x = 0.13 * inv;
        lapelR.rotation.z = -0.16;
        torsoAnchor.add(lapelR);
      }
      var hips = findNode(model, boneNames('Hips'));
      if (hips) hips.add(hipsAnchor);
      var hipBox = roundBox(0.56 * inv, 0.24 * inv, 0.42 * inv, pants, 0.06 * inv);
      hipBox.position.y = -0.04 * inv;
      hipsAnchor.add(hipBox);
      if (kind === 'dama') {
        var skirt = mesh(new THREE.CylinderGeometry(0.34 * inv, 0.52 * inv, 0.56 * inv, 18, 1, true), std(0x8e44ad));
        skirt.position.set(0, -0.32 * inv, 0);
        skirt.castShadow = true;
        hipsAnchor.add(skirt);
      }
    }

    function addArm(side) {
      var upAnchor = null;
      var foreAnchor = null;
      if (kind !== 'haoge') {
        upAnchor = attach(side + 'Arm', new THREE.Group());
        var upper = capsule(0.46 * inv, 0.13 * inv, 0.1 * inv, jacket);
        upper.position.y = -0.23 * inv;
        if (upAnchor) upAnchor.add(upper);

        foreAnchor = attach(side + 'ForeArm', new THREE.Group());
        var fore = capsule(0.36 * inv, 0.095 * inv, 0.075 * inv, jacket);
        fore.position.y = -0.18 * inv;
        if (foreAnchor) foreAnchor.add(fore);
      }

      var handAnchor = attach(side + 'Hand', new THREE.Group());
      var hand;
      if (kind === 'haoge') {
        hand = new THREE.Group();
      } else {
        hand = mesh(new THREE.SphereGeometry(0.11 * inv, 12, 10), skinMat);
        hand.position.set(0, -0.06 * inv, 0.02 * inv);
      }
      if (handAnchor) handAnchor.add(hand);
      return { hand: hand, handAnchor: handAnchor, foreAnchor: foreAnchor };
    }

    var armL = addArm('Left');
    var armR = addArm('Right');

    function addLeg(side) {
      var upAnchor = attach(side + 'UpLeg', new THREE.Group());
      var thigh = capsule(0.5 * inv, 0.14 * inv, 0.1 * inv, pants);
      thigh.position.y = -0.25 * inv;
      if (upAnchor) upAnchor.add(thigh);

      var legAnchor = attach(side + 'Leg', new THREE.Group());
      var shin = capsule(0.44 * inv, 0.1 * inv, 0.075 * inv, pants);
      shin.position.y = -0.22 * inv;
      if (legAnchor) legAnchor.add(shin);

      var footAnchor = attach(side + 'Foot', new THREE.Group());
      var foot = roundBox(0.26 * inv, 0.15 * inv, 0.42 * inv, shoe, 0.04 * inv);
      foot.position.set(0, -0.07 * inv, 0.04 * inv);
      if (footAnchor) footAnchor.add(foot);
    }

    if (kind !== 'haoge') {
      addLeg('Left');
      addLeg('Right');
    }

    if (kind === 'huaqiang' && armR.handAnchor) {
      var knifeG = makeKnife(scale, inv);
      knifeG.position.set(0, -0.06 * inv, 0.05 * inv);
      knifeG.rotation.z = -0.35;
      knifeG.rotation.x = 0.25;
      armR.handAnchor.add(knifeG);
    }

    if (kind === 'dama' && armR.handAnchor) {
      var basket = new THREE.Group();
      var box = mesh(new THREE.BoxGeometry(0.3 * inv, 0.24 * inv, 0.3 * inv), std(0x795548));
      box.position.y = -0.08 * inv;
      basket.add(box);
      var handle = mesh(new THREE.TorusGeometry(0.11 * inv, 0.02 * inv, 6, 12, Math.PI), std(0x6d4a32));
      handle.rotation.y = Math.PI / 2;
      handle.position.y = 0.06 * inv;
      basket.add(handle);
      basket.position.set(0, -0.14 * inv, -0.22 * inv);
      basket.rotation.z = 0.5;
      armR.handAnchor.add(basket);
    }

    var headInfo = makeHead(kind, scale, inv, std(cfg.skin, { roughness: 0.55 }), std(cfg.hair, { roughness: 0.7 }));
    var headBone = findNode(model, boneNames('Head'));
    var neckBone = findNode(model, boneNames('Neck')) || (headBone ? headBone.parent : null);
    var headAnchor = new THREE.Group();
    var headPivot = new THREE.Group();
    headAnchor.add(headPivot);
    headPivot.add(headInfo.group);
    if (kind === 'haoge') {
      if (headBone) {
        headBone.scale.setScalar(0.0001);
        hidden.push(headBone);
        headAnchor.position.copy(headBone.position);
      }
      if (neckBone) neckBone.add(headAnchor);
      else if (headBone) headBone.add(headAnchor);
    } else {
      if (headBone) headBone.add(headAnchor);
      else if (neckBone) neckBone.add(headAnchor);
    }

    var elbowL = new THREE.Group();
    var elbowR = new THREE.Group();
    if (armL.foreAnchor) armL.foreAnchor.add(elbowL);
    if (armR.foreAnchor) armR.foreAnchor.add(elbowR);

    return {
      head: headPivot,
      faceMesh: headInfo.face,
      faceControls: { sweat: headInfo.sweat },
      leftArm: findNode(model, boneNames('LeftArm')) || armL.handAnchor || new THREE.Group(),
      rightArm: findNode(model, boneNames('RightArm')) || armR.handAnchor || new THREE.Group(),
      leftLeg: findNode(model, boneNames('LeftUpLeg')) || new THREE.Group(),
      rightLeg: findNode(model, boneNames('RightUpLeg')) || new THREE.Group(),
      hands: [armL.hand, armR.hand],
      knifeBlade: knifeG ? knifeG.userData.blade : null,
      elbows: [elbowL, elbowR],
      torso: torsoAnchor,
      faceKind: cfg.face,
      hiddenBones: hidden,
      sculptBones: sculptBones,
    };
  }

  function buildRefinedChaser(model, scale, inv) {
    var skin = model.getObjectByName('Huaqiang');
    var restPose = [];
    var body = { refinedChaser: true, hands: [] };
    var delta = new THREE.Quaternion();
    var local = new THREE.Quaternion();
    var motion = new THREE.Euler();
    model.updateMatrixWorld(true);

    function control(key, name, drop) {
      var bone = model.getObjectByName(name);
      var pivot = new THREE.Group();
      var parentAxes = bone.parent.getWorldQuaternion(new THREE.Quaternion());
      restPose.push({
        bone: bone,
        rotation: bone.quaternion.clone(),
        parentAxes: parentAxes,
        inverseAxes: parentAxes.clone().invert(),
        pivot: pivot,
        drop: drop || 0,
      });
      body[key] = pivot;
      return bone;
    }

    control('head', 'Head');
    control('leftArm', 'LeftArm', -0.59);
    control('rightArm', 'RightArm', 0.59);
    control('leftLeg', 'LeftUpLeg');
    control('rightLeg', 'RightUpLeg');
    var hand = model.getObjectByName('RightHand');
    var knife = makeKnife(scale, inv);
    knife.position.set(0, 0.08, 0);
    knife.rotation.x = 0.25;
    knife.translateZ(0.13 * inv);
    hand.add(knife);
    body.knifeBlade = knife.userData.blade;
    body.faceKind = 'huaqiang';
    body.faceMorphs = skin.morphTargetInfluences;
    body.applyManualPose = function () {
      for (var i = 0; i < restPose.length; i++) {
        var pose = restPose[i];
        var angle = pose.pivot.rotation;
        // Existing poses use runner-space angles. Apply them around the
        // bind axes so the imported bones keep their original orientation.
        motion.set(angle.x, angle.y, angle.z + pose.drop, 'XYZ');
        delta.setFromEuler(motion);
        local.copy(pose.inverseAxes).multiply(delta).multiply(pose.parentAxes);
        pose.bone.quaternion.copy(local).multiply(pose.rotation);
      }
    };
    body.applyManualPose();
    return body;
  }

  function calibrate(model, height) {
    var scale = height / BASE.height;
    model.scale.set(scale, scale, scale);
    model.position.set(
      -((BASE.minX + BASE.maxX) / 2) * scale,
      -BASE.minY * scale,
      -((BASE.minZ + BASE.maxZ) / 2) * scale
    );
    return scale;
  }

  function calibrateDynamic(model, height) {
    // Blender 导出的骨架和网格可能使用不同单位，按蒙皮后的顶点校准。
    model.updateMatrixWorld(true);
    var box = new THREE.Box3();
    var meshBox = new THREE.Box3();
    var vertex = new THREE.Vector3();
    model.traverse(function (mesh) {
      if (!mesh.isMesh) return;
      if (!mesh.isSkinnedMesh) {
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        box.union(meshBox.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld));
        return;
      }
      var positions = mesh.geometry.getAttribute('position');
      for (var i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        mesh.boneTransform(i, vertex);
        box.expandByPoint(vertex.applyMatrix4(mesh.matrixWorld));
      }
      mesh.frustumCulled = false;
    });
    if (box.isEmpty()) return calibrate(model, height);
    var h = Math.max(0.0001, box.max.y - box.min.y);
    var scale = height / h;
    model.scale.set(scale, scale, scale);
    model.position.set(
      -((box.min.x + box.max.x) / 2) * scale,
      -box.min.y * scale,
      -((box.min.z + box.max.z) / 2) * scale
    );
    return scale;
  }

  function applyHaogeMaterials(model) {
    var hints = [
      { re: /hair|brow/i, color: 0x171310, roughness: 0.8, metalness: 0 },
      { re: /skin|face|head|neck|ear/i, color: 0x8a4a2f, roughness: 0.55, metalness: 0 },
      { re: /jacket|coat|suit|outer|shoulder|upper/i, color: 0x2a2d33, roughness: 0.65, metalness: 0.05 },
      { re: /shirt|tee|inner|torso|vest/i, color: 0x5c6b4a, roughness: 0.8, metalness: 0 },
      { re: /pants|leg|trous|jean/i, color: 0x22252a, roughness: 0.8, metalness: 0 },
      { re: /shoe|boot|foot|sneaker/i, color: 0x2b2e33, roughness: 0.7, metalness: 0 },
    ];
    model.traverse(function (o) {
      if (!o.isMesh || !o.name) return;
      var target = null;
      for (var h = 0; h < hints.length; h++) {
        if (hints[h].re.test(o.name)) {
          target = hints[h];
          break;
        }
      }
      if (!target) return;
      var mats = Array.isArray(o.material) ? o.material : [o.material];
      for (var m = 0; m < mats.length; m++) {
        var src = mats[m];
        if (!src || !src.color || src.userData.haogeTinted) continue;
        var tinted = src.clone();
        tinted.color.setHex(target.color);
        tinted.roughness = target.roughness;
        tinted.metalness = target.metalness;
        tinted.needsUpdate = true;
        tinted.userData.haogeTinted = true;
        if (Array.isArray(o.material)) o.material[m] = tinted;
        else o.material = tinted;
      }
    });
  }

  function loadGltf(kind, cb, fail) {
    var urls = [];
    var primary = primaryUrlFor(kind);
    if (primary !== DEFAULT_MODEL_URL) urls.push(primary);
    if (urls.indexOf(DEFAULT_MODEL_URL) < 0) urls.push(DEFAULT_MODEL_URL);
    var i = 0;
    function next() {
      if (i >= urls.length) {
        if (fail) fail();
        return;
      }
      var url = urls[i++];
      if (fromFile && url.indexOf('data:') !== 0) {
        next();
        return;
      }
      loader.load(url, function (gltf) {
        var refinedMesh = url === REFINED_CHASER_URL && gltf.scene.getObjectByName('Huaqiang');
        if (url === REFINED_CHASER_URL && (
          !refinedMesh || !refinedMesh.isSkinnedMesh || !refinedMesh.morphTargetInfluences ||
          !gltf.animations.some(function (clip) { return clip.name === 'run'; }) ||
          !['Head', 'LeftArm', 'RightArm', 'LeftUpLeg', 'RightUpLeg', 'RightHand'].every(function (name) {
            return !!findBone(gltf.scene, [name]);
          })
        )) {
          next();
          return;
        }
        cb(gltf, url);
      }, undefined, function () {
        next();
      });
    }
    next();
  }

  function loadRunner(runner, kind, opts) {
    if (proceduralPreview || !runner || (runner.userData && runner.userData.isGLB)) return;
    opts = opts || {};
    var height = opts.height || (KINDS[kind] && KINDS[kind].height) || 2.2;
    var runnerScale = runner.scale.x || 1;
    var oldHammer = runner.userData && runner.userData.hammer;
    if (oldHammer && oldHammer.parent) oldHammer.parent.remove(oldHammer);

    loadGltf(kind, function (gltf, usedUrl) {
      var model = gltf.scene;
      var pure = !!usedUrl && kind === 'haoge' && usedUrl === primaryUrlFor('haoge');
      var approved = kind === 'huaqiang' && usedUrl === REFINED_CHASER_URL;
      var previous = runner.userData;
      var sprites = [];
      for (var i = runner.children.length - 1; i >= 0; i--) {
        var child = runner.children[i];
        if (child.isSprite) {
          runner.remove(child);
          sprites.push(child);
        } else {
          runner.remove(child);
        }
      }
      var scale = pure || approved
        ? calibrateDynamic(model, height / runnerScale)
        : calibrate(model, height / runnerScale);
      runner.add(model);
      var inv = 100 / (scale * runnerScale);
      var body = approved
        ? buildRefinedChaser(model, scale, inv / 100)
        : buildBody(runner, model, kind, scale, inv, pure);
      if (pure) {
        applyHaogeMaterials(model);
        if (toonPreview && window.RunnerToon) window.RunnerToon.apply(model);
      }
      body.mixer = new THREE.AnimationMixer(model);
      body.actions = {};
      var gltfAnims = gltf.animations || [];
      var gltfSkins = gltf.skins || [];
      for (var j = 0; j < gltfAnims.length; j++) {
        var clip = gltfAnims[j];
        var action = body.mixer.clipAction(clip);
        body.actions[clip.name] = action;
        body.actions[normKey(clip.name)] = action;
      }
      body.currentAction = null;
      body.isGLB = true;
      body.isPureGLB = pure;
      body.hasAnimations = gltfAnims.length > 0;
      body.hasSkin = gltfSkins.length > 0;
      body.model = model;
      body.hiddenBones = body.hiddenBones || [];
      runner.userData = body;
      if (approved && previous) {
        if (previous.faceKind) setFace(runner, previous.faceKind);
        var previousBlade = previous.knifeBlade;
        if (previousBlade && previousBlade.material === previousBlade.userData.bloodMat) {
          setBloodyKnife(runner, true);
        }
      }
      if (oldHammer && body.elbows && body.elbows[1]) {
        body.elbows[1].add(oldHammer);
        body.hammer = oldHammer;
      }
      for (var s = 0; s < sprites.length; s++) runner.add(sprites[s]);
      if (runners.indexOf(runner) < 0) runners.push(runner);
      if (opts.onLoad) opts.onLoad(runner);
      if (pure) console.info('[RunnerModels] 郝哥模型已加载：' + (modelsEmbedded ? '内嵌模型' : usedUrl));
      if (pure && gltf.animations.length === 0) {
        console.warn('[RunnerModels] 当前郝哥 GLB 没有骨骼动画，请从 Meshy 的 Rigging/Animation 页面导出带动画的 GLB/FBX');
      }
    }, function () {
      console.warn('[RunnerModels] GLB 加载失败，保留程序化角色：' + kind);
    });
  }

  function setFace(runner, kind) {
    var u = runner && runner.userData;
    if (!u || !u.isGLB) return;
    u.faceKind = kind;
    if (u.faceMorphs) u.faceMorphs[0] = kind === 'huaqiang-smirk' ? 1 : 0;
    if (!u.faceMesh) return;
    u.faceMesh.material.map = (kind === 'haoge' && haogeFaceTex) ? haogeFaceTex : faceTexture(kind);
    u.faceMesh.material.transparent = kind === 'haoge' && !!haogeFaceTex;
    u.faceMesh.material.alphaTest = kind === 'haoge' && haogeFaceTex ? 0.05 : 0;
    u.faceMesh.material.needsUpdate = true;
    if (u.faceControls && u.faceControls.sweat) u.faceControls.sweat.visible = kind === 'haoge';
  }

  function setBloodyHands(runner, on) {
    var hs = runner && runner.userData && runner.userData.hands;
    if (!hs) return;
    for (var i = 0; i < hs.length; i++) {
      var h = hs[i];
      if (!h || !h.material || Array.isArray(h.material)) continue;
      if (!h.userData.bloodMat) {
        h.userData.origMat = h.material;
        h.userData.bloodMat = h.material.clone();
        h.userData.bloodMat.color.set(0x8e1b1b);
      }
      h.material = on ? h.userData.bloodMat : h.userData.origMat;
      h.scale.setScalar(on ? 1.35 : 1);
    }
  }

  function setBloodyKnife(runner, on) {
    var blade = runner && runner.userData && runner.userData.knifeBlade;
    if (!blade) return;
    if (!blade.userData.bloodMat) {
      blade.userData.origMat = blade.material;
      blade.userData.bloodMat = blade.material.clone();
      blade.userData.bloodMat.color.set(0x9e1b1b);
    }
    blade.material = on ? blade.userData.bloodMat : blade.userData.origMat;
  }

  function update(dt) {
    for (var i = 0; i < runners.length; i++) {
      var u = runners[i].userData;
      if (u && u.mixer) u.mixer.update(dt);
      if (u && u.applyManualPose && !u.currentAction) u.applyManualPose();
      if (u && u.hiddenBones) {
        for (var h = 0; h < u.hiddenBones.length; h++) u.hiddenBones[h].scale.setScalar(0.0001);
      }
      if (u && u.sculptBones) {
        for (var sb = 0; sb < u.sculptBones.length; sb++) u.sculptBones[sb].bone.scale.copy(u.sculptBones[sb].scale);
      }
    }
  }

  return {
    loadRunner: loadRunner,
    setFace: setFace,
    setBloodyHands: setBloodyHands,
    setBloodyKnife: setBloodyKnife,
    update: update,
    isGLB: function (o) { return !!(o && o.userData && o.userData.isGLB); },
    getHaogePacks: function () { return HAOGE_PACKS.slice(); },
    getActiveHaogePack: function () { return activeHaogePackId(); },
    setHaogePack: function (id) {
      for (var p = 0; p < HAOGE_PACKS.length; p++) {
        if (HAOGE_PACKS[p].id === id) {
          try { localStorage.setItem('haogeModelPack', id); } catch (e) {}
          return HAOGE_PACKS[p].url;
        }
      }
      try { localStorage.removeItem('haogeModelPack'); } catch (e) {}
      return HAOGE_PACKS[0].url;
    },
  };
})();

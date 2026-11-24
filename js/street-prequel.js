// ═══════════════════════════════════════════════════════════════
//  STREET-PREQUEL.JS — 3D 实时前情提要过场《华强买瓜》
//  异步下载高精度角色模型期间播放，同步原剧原声台词与实时进度条
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var overlay = null;
  var canvas = null;
  var titleEl = null;
  var actBadges = [];
  var subSpeaker = null;
  var subText = null;
  var audioBtn = null;
  var audioHint = null;
  var progWrap = null;
  var progBar = null;
  var progText = null;
  var skipBtn = null;

  var renderer = null;
  var scene = null;
  var camera = null;
  var rafId = 0;
  var lastFrameMs = 0;
  var elapsed = 0;
  var isOpen = false;
  var mode = 'loading'; // 'loading' | 'firstVisit' | 'replay'
  var ready = false;
  var audioUnlocked = false;
  var mutedByUser = false;
  var lastCueIdx = -1;
  var onCloseCb = null;

  // 场景演员与道具
  var actors = {};

  var CUES = [
    { at: 0.0,  act: 0, speaker: '华强', text: '哥们儿，这瓜多少钱一斤？  郝哥：两块钱一斤。', voice: 'jinxigua' },
    { at: 2.1,  act: 0, speaker: '华强', text: '你这瓜皮子是金子做的，还是瓜粒子是金子做的？', voice: null },
    { at: 4.0,  act: 1, speaker: '华强', text: '我问你，这瓜保熟吗？', voice: 'baoshu' },
    { at: 5.8,  act: 1, speaker: '郝哥', text: '我开水果摊的，能卖给你生瓜蛋子？', voice: 'shengua' },
    { at: 7.5,  act: 2, speaker: '华强', text: '你这哪够十五斤！秤盘底下吸块大吸铁石？！', voice: 'impact' },
    { at: 9.4,  act: 2, speaker: '郝哥', text: '你是故意找茬是不是？你要不要吧！', voice: 'haogeZhaocha' },
    { at: 11.5, act: 3, speaker: '华强', text: '生瓜蛋子！（拔刀劈瓜）', voice: 'chop' },
    { at: 13.0, act: 3, speaker: '郝哥', text: '你他妈劈我瓜是吧？！', voice: 'pigua' },
    { at: 15.8, act: 4, speaker: '郝哥', text: '萨日朗！！！快跑啊！', voice: 'sarilang' }
  ];
  var TOTAL_DUR = 19.5;

  function makeMat(color, opts) {
    opts = opts || {};
    return new THREE.MeshLambertMaterial(Object.assign({ color: color }, opts));
  }

  // 独立轻量 3D 演员（不调用 Runners.createHaoGe/createHuaQiang，保证分段模式校验不变式）
  function makeActor(cfg) {
    var root = new THREE.Group();
    var skinMat = makeMat(cfg.skin || 0xf0c29a);
    var shirtMat = makeMat(cfg.shirt);
    var pantsMat = makeMat(cfg.pants || 0x354d6e);
    var shoeMat = makeMat(0x232328);
    var hairMat = makeMat(0x1f1b18);

    var torso = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.78, 0.34), shirtMat);
    torso.position.y = 1.18;
    torso.castShadow = true;
    root.add(torso);

    if (cfg.apron) {
      var apron = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 0.06), makeMat(0x3a6e4c));
      apron.position.set(0, 1.02, 0.19);
      root.add(apron);
    }

    var headPivot = new THREE.Group();
    headPivot.position.set(0, 1.60, 0);
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.40), skinMat);
    head.position.y = 0.22;
    head.castShadow = true;
    var hair = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.42), hairMat);
    hair.position.set(0, 0.41, -0.02);
    var eyeMat = makeMat(0x111111);
    var eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), eyeMat);
    eyeL.position.set(-0.10, 0.24, 0.20);
    var eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), eyeMat);
    eyeR.position.set(0.10, 0.24, 0.20);
    headPivot.add(head, hair, eyeL, eyeR);
    root.add(headPivot);

    function makeArm(side) {
      var p = new THREE.Group();
      p.position.set(side * 0.44, 1.50, 0);
      var sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.32, 0.20), cfg.longSleeve ? shirtMat : skinMat);
      sleeve.position.y = -0.16;
      sleeve.castShadow = true;
      var elbow = new THREE.Group();
      elbow.position.y = -0.32;
      var fore = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.18), cfg.longSleeve ? shirtMat : skinMat);
      fore.position.y = -0.16;
      var hand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), skinMat);
      hand.position.y = -0.34;
      elbow.add(fore, hand);
      p.add(sleeve, elbow);
      root.add(p);
      return { arm: p, elbow: elbow, hand: hand };
    }
    var armL = makeArm(-1);
    var armR = makeArm(1);

    function makeLeg(side) {
      var p = new THREE.Group();
      p.position.set(side * 0.17, 0.78, 0);
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.72, 0.24), pantsMat);
      leg.position.y = -0.36;
      leg.castShadow = true;
      var shoe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.34), shoeMat);
      shoe.position.set(0, -0.73, 0.05);
      p.add(leg, shoe);
      root.add(p);
      return p;
    }
    var legL = makeLeg(-1);
    var legR = makeLeg(1);

    root.userData = {
      torso: torso,
      head: headPivot,
      armL: armL.arm,
      elbowL: armL.elbow,
      armR: armR.arm,
      elbowR: armR.elbow,
      handR: armR.hand,
      legL: legL,
      legR: legR
    };
    return root;
  }

  function makeCleaver() {
    var g = new THREE.Group();
    var handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.20, 0.07), makeMat(0x5a3219));
    handle.position.y = -0.08;
    var blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.18), makeMat(0xdce6f0, { emissive: 0x334155, emissiveIntensity: 0.35 }));
    blade.position.set(0, 0.16, 0.06);
    var edge = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.34, 0.03), makeMat(0xffffff));
    edge.position.set(0, 0.16, 0.14);
    g.add(handle, blade, edge);
    return g;
  }

  function makeScooter() {
    var g = new THREE.Group();
    var bodyMat = makeMat(0x2b6cb0);
    var darkMat = makeMat(0x1e293b);
    var base = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.16, 1.35), bodyMat);
    base.position.y = 0.28;
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.54), darkMat);
    seat.position.set(0, 0.68, -0.22);
    var stem = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.88, 0.12), darkMat);
    stem.position.set(0, 0.68, 0.52);
    stem.rotation.x = -0.18;
    var bar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.08), darkMat);
    bar.position.set(0, 1.08, 0.44);
    var wF = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12), darkMat);
    wF.rotation.z = Math.PI / 2;
    wF.position.set(0, 0.22, 0.56);
    var wB = wF.clone();
    wB.position.z = -0.52;
    g.add(base, seat, stem, bar, wF, wB);
    return g;
  }

  function buildScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9dc2c9);
    scene.fog = new THREE.Fog(0xb9d1d1, 16, 52);

    camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
    camera.position.set(0.4, 2.3, 6.2);

    var hemi = new THREE.HemisphereLight(0xfff5e0, 0x4b5563, 0.92);
    scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff0cc, 1.05);
    sun.position.set(7, 12, 8);
    sun.castShadow = true;
    scene.add(sun);

    // 路面与人行道
    var road = new THREE.Mesh(new THREE.PlaneGeometry(24, 64), makeMat(0x3b4046));
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    scene.add(road);

    var sidewalk = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.14, 64), makeMat(0xb6ae9c));
    sidewalk.position.set(-4.8, 0.07, 0);
    sidewalk.receiveShadow = true;
    scene.add(sidewalk);

    // 东街店面背景
    var shop = new THREE.Mesh(new THREE.BoxGeometry(4.0, 5.2, 14), makeMat(0xd6c3a5));
    shop.position.set(-6.6, 2.6, -2.5);
    scene.add(shop);
    var brick = new THREE.Mesh(new THREE.BoxGeometry(4.08, 1.6, 14.08), makeMat(0x8c3b2b));
    brick.position.set(-6.6, 0.8, -2.5);
    scene.add(brick);
    var awning = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 6.5), makeMat(0x2f6f4e));
    awning.position.set(-3.6, 2.85, -1.2);
    awning.rotation.z = -0.22;
    scene.add(awning);

    // 瓜摊木桌
    var stall = new THREE.Group();
    stall.position.set(-2.3, 0.14, -1.2);
    var table = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.86, 3.6), makeMat(0x7c4d2b));
    table.position.y = 0.43;
    table.castShadow = true;
    stall.add(table);

    // 招牌「保熟鲜瓜 · 2元/斤」
    var signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    var sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#8b1e1a';
    sctx.fillRect(0, 0, 512, 128);
    sctx.strokeStyle = '#facc15';
    sctx.lineWidth = 8;
    sctx.strokeRect(6, 6, 500, 116);
    sctx.fillStyle = '#fff3cf';
    sctx.font = 'bold 46px system-ui, -apple-system, "PingFang SC", sans-serif';
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.fillText('保熟鲜瓜 · 两元一斤', 256, 64);
    var signTex = new THREE.CanvasTexture(signCanvas);
    signTex.encoding = THREE.sRGBEncoding;
    var signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.68, 2.8), new THREE.MeshBasicMaterial({ map: signTex }));
    signBoard.position.set(-0.62, 2.02, 0);
    stall.add(signBoard);

    // 堆叠西瓜
    var melonMat = makeMat(0x2f8f3a);
    var stripeMat = makeMat(0x164a1d);
    function makeMelon(r) {
      var mg = new THREE.Group();
      var ball = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), melonMat);
      ball.scale.set(1, 0.92, 1.15);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.96, r * 0.08, 6, 12), stripeMat);
      mg.add(ball, ring);
      return mg;
    }
    [[-0.2, 1.06, -1.1], [0.2, 1.06, -1.0], [0.0, 1.38, -1.05], [-0.15, 1.06, 1.15], [0.22, 1.06, 1.1]].forEach(function (pos) {
      var m = makeMelon(0.24);
      m.position.set(pos[0], pos[1], pos[2]);
      stall.add(m);
    });
    scene.add(stall);

    // 可劈开的“主角西瓜”（放在砧板上）
    var heroMelon = new THREE.Group();
    heroMelon.position.set(-1.95, 1.24, -0.35);
    var halfGeo = new THREE.SphereGeometry(0.28, 12, 10, 0, Math.PI);
    var fleshMat = makeMat(0xf5e8d0); // 生瓜蛋子发白果肉
    var halfL = new THREE.Group();
    var skinL = new THREE.Mesh(halfGeo, melonMat);
    skinL.rotation.y = -Math.PI / 2;
    var faceL = new THREE.Mesh(new THREE.CircleGeometry(0.27, 12), fleshMat);
    faceL.rotation.y = Math.PI / 2;
    halfL.add(skinL, faceL);
    var halfR = new THREE.Group();
    var skinR = new THREE.Mesh(halfGeo, melonMat);
    skinR.rotation.y = Math.PI / 2;
    var faceR = new THREE.Mesh(new THREE.CircleGeometry(0.27, 12), fleshMat);
    faceR.rotation.y = -Math.PI / 2;
    halfR.add(skinR, faceR);
    heroMelon.add(halfL, halfR);
    scene.add(heroMelon);

    // 台秤 + 吸铁石特写道具
    var scaleGroup = new THREE.Group();
    scaleGroup.position.set(-1.85, 1.00, 0.55);
    var scaleBody = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.24, 0.54), makeMat(0x475569));
    scaleGroup.add(scaleBody);
    var dial = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12), makeMat(0xf8fafc));
    dial.rotation.z = Math.PI / 2;
    dial.position.set(0.28, 0.02, 0);
    scaleGroup.add(dial);

    // 吸铁石（红蓝 U 型磁铁，藏在秤盘底下）
    var magnetGroup = new THREE.Group();
    magnetGroup.position.set(0, 0.14, 0);
    var magRed = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.11, 0.14), makeMat(0xdc2626, { emissive: 0x7f1d1d, emissiveIntensity: 0.5 }));
    magRed.position.set(-0.04, 0, -0.07);
    var magBlue = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.11, 0.14), makeMat(0x2563eb, { emissive: 0x1e3a8a, emissiveIntensity: 0.5 }));
    magBlue.position.set(-0.04, 0, 0.07);
    var magRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 20), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    magRing.rotation.x = Math.PI / 2;
    magRing.visible = false;
    magnetGroup.add(magRed, magBlue, magRing);
    scaleGroup.add(magnetGroup);

    // 可掀开的秤盘
    var trayPivot = new THREE.Group();
    trayPivot.position.set(-0.26, 0.18, 0);
    var trayMesh = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 0.56), makeMat(0xcbd5e1));
    trayMesh.position.set(0.26, 0, 0);
    trayPivot.add(trayMesh);
    scaleGroup.add(trayPivot);
    scene.add(scaleGroup);

    // 摊位上的菜刀（第 4 幕被华强拿起）
    var stallCleaver = makeCleaver();
    stallCleaver.position.set(-1.95, 1.04, -1.0);
    stallCleaver.rotation.set(Math.PI / 2, 0, 0.4);
    scene.add(stallCleaver);

    // 演员：郝哥 & 刘华强 + 电动车
    var haoge = makeActor({ shirt: 0xf8fafc, pants: 0x3b6ea5, apron: true });
    haoge.position.set(-3.15, 0.14, -1.1);
    haoge.rotation.y = Math.PI / 2;
    scene.add(haoge);

    var huaqiang = makeActor({ shirt: 0x1f242c, pants: 0x282c34, longSleeve: true });
    huaqiang.position.set(0.6, 0, 3.8);
    huaqiang.rotation.y = -Math.PI / 2;
    scene.add(huaqiang);

    var handCleaver = makeCleaver();
    handCleaver.position.set(0, -0.34, 0.06);
    handCleaver.rotation.set(Math.PI / 2, 0, 0);
    handCleaver.visible = false;
    huaqiang.userData.handR.add(handCleaver);

    var scooter = makeScooter();
    scooter.position.set(0.3, 0, 3.8);
    scooter.rotation.y = Math.PI;
    scene.add(scooter);

    // 刀光闪烁
    var slashFlash = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.68, 16, 1, -0.8, 1.8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    );
    slashFlash.position.set(-1.95, 1.35, -0.35);
    slashFlash.visible = false;
    scene.add(slashFlash);

    actors = {
      haoge: haoge,
      huaqiang: huaqiang,
      scooter: scooter,
      trayPivot: trayPivot,
      magRing: magRing,
      heroMelon: heroMelon,
      halfL: halfL,
      halfR: halfR,
      stallCleaver: stallCleaver,
      handCleaver: handCleaver,
      slashFlash: slashFlash
    };
  }

  function ease(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  function resetActorPose(a) {
    var u = a.userData;
    u.armL.rotation.set(0, 0, 0);
    u.elbowL.rotation.set(0, 0, 0);
    u.armR.rotation.set(0, 0, 0);
    u.elbowR.rotation.set(0, 0, 0);
    u.legL.rotation.set(0, 0, 0);
    u.legR.rotation.set(0, 0, 0);
    u.head.rotation.set(0, 0, 0);
  }

  function updateDrama(t) {
    var h = actors.haoge, q = actors.huaqiang, sc = actors.scooter;
    var hu = h.userData, qu = q.userData;
    resetActorPose(h);
    resetActorPose(q);

    // 默认状态重置
    actors.trayPivot.rotation.z = 0;
    actors.magRing.visible = false;
    actors.halfL.position.set(0, 0, 0);
    actors.halfL.rotation.set(0, 0, 0);
    actors.halfR.position.set(0, 0, 0);
    actors.halfR.rotation.set(0, 0, 0);
    actors.stallCleaver.visible = true;
    actors.handCleaver.visible = false;
    actors.slashFlash.visible = false;
    h.position.set(-3.15, 0.14, -1.1);
    h.rotation.set(0, Math.PI / 2, 0);

    if (t < 4.0) {
      // 第 1 幕：骑车来到瓜摊问价
      var p1 = ease(t / 2.2);
      sc.position.set(-0.35, 0, 3.8 - p1 * 3.8);
      sc.rotation.y = Math.PI * (1 - 0.15 * p1);
      q.position.set(-0.35, -0.34, 3.8 - p1 * 3.8);
      q.rotation.y = -Math.PI / 2;
      qu.legL.rotation.x = -0.8;
      qu.legR.rotation.x = -0.8;
      qu.armL.rotation.x = -0.9;
      qu.armR.rotation.x = -0.9;
      hu.armR.rotation.x = -0.4 * Math.sin(t * 5);
      camera.position.set(2.2 - p1 * 0.9, 2.35, 4.4 - p1 * 1.4);
      camera.lookAt(-1.6, 1.35, -0.5);
    } else if (t < 7.5) {
      // 第 2 幕：下车对峙“这瓜保熟吗？”
      var p2 = ease((t - 4.0) / 1.2);
      sc.position.set(-0.35, 0, 0.0);
      sc.rotation.y = Math.PI * 0.85;
      q.position.set(-0.35 - p2 * 0.72, 0, -0.35);
      q.rotation.y = -Math.PI / 2;
      qu.armR.rotation.x = -0.6 - 0.25 * Math.sin((t - 4.0) * 4);
      qu.elbowR.rotation.x = -0.5;
      hu.armL.rotation.x = -0.8 * Math.abs(Math.sin((t - 4.0) * 3));
      hu.armR.rotation.x = -0.8 * Math.abs(Math.sin((t - 4.0) * 3));
      camera.position.set(0.95, 1.92, 2.15 - p2 * 0.55);
      camera.lookAt(-2.0, 1.45, -0.65);
    } else if (t < 11.5) {
      // 第 3 幕：特写掀开秤盘，露出底下红色/蓝色吸铁石！
      var p3 = ease((t - 7.5) / 1.0);
      sc.position.set(-0.35, 0, 0.0);
      q.position.set(-1.12, 0, 0.25);
      q.rotation.y = -Math.PI / 2 - 0.3;
      qu.armR.rotation.x = -1.25 * p3;
      qu.elbowR.rotation.x = -0.4;
      actors.trayPivot.rotation.z = 1.35 * p3;
      actors.magRing.visible = p3 > 0.45;
      actors.magRing.scale.setScalar(1 + 0.14 * Math.sin(t * 14));
      var shake = (t > 8.1 && t < 9.2) ? Math.sin(t * 55) * 0.05 : 0;
      camera.position.set(-0.65 + shake, 1.85 + shake, 2.25 - p3 * 0.75);
      camera.lookAt(-1.85, 1.12, 0.55);
    } else if (t < 15.8) {
      // 第 4 幕：华强抄刀劈瓜，生瓜蛋子一分为二
      sc.position.set(-0.35, 0, 0.0);
      q.position.set(-1.08, 0, -0.35);
      q.rotation.y = -Math.PI / 2;
      actors.stallCleaver.visible = false;
      actors.handCleaver.visible = true;
      var chopT = t - 11.5;
      if (chopT < 0.95) {
        var rp = ease(chopT / 0.95);
        qu.armR.rotation.x = -2.45 * rp;
        qu.elbowR.rotation.x = -0.75 * rp;
      } else if (chopT < 1.30) {
        var sp = ease((chopT - 0.95) / 0.35);
        qu.armR.rotation.x = -2.45 + 1.85 * sp;
        qu.elbowR.rotation.x = -0.75 + 0.50 * sp;
        actors.slashFlash.visible = true;
        actors.slashFlash.material.opacity = Math.sin(sp * Math.PI) * 0.9;
      } else {
        var fp = ease((chopT - 1.30) / 0.6);
        qu.armR.rotation.x = -0.60;
        qu.elbowR.rotation.x = -0.25;
        actors.halfL.position.set(-0.18 * fp, 0, -0.22 * fp);
        actors.halfL.rotation.z = 0.55 * fp;
        actors.halfR.position.set(0.18 * fp, 0, 0.22 * fp);
        actors.halfR.rotation.z = -0.55 * fp;
        // 郝哥震惊后仰挥臂
        hu.armL.rotation.x = -1.6;
        hu.armR.rotation.x = -1.6;
        hu.head.rotation.x = -0.22;
      }
      camera.position.set(0.45, 2.05, 1.55);
      camera.lookAt(-2.05, 1.35, -0.45);
    } else {
      // 第 5 幕：华强提刀追砍，郝哥喊“萨日朗”拔腿狂奔
      var p5 = Math.min(1, (t - 15.8) / 3.7);
      sc.position.set(-0.35, 0, 0.0);
      actors.stallCleaver.visible = false;
      actors.handCleaver.visible = true;
      actors.halfL.position.set(-0.18, 0, -0.22);
      actors.halfR.position.set(0.18, 0, 0.22);
      var runZ = -1.1 - p5 * 14.5;
      h.position.set(-0.8 + Math.min(1, p5 * 3) * 0.8, 0, runZ);
      h.rotation.y = Math.PI;
      var ph = t * 18;
      hu.legL.rotation.x = Math.sin(ph) * 0.85;
      hu.legR.rotation.x = -Math.sin(ph) * 0.85;
      hu.armL.rotation.x = -2.0 + Math.sin(ph) * 0.25;
      hu.armR.rotation.x = -2.0 - Math.sin(ph) * 0.25;

      q.position.set(-0.4, 0, 1.2 - p5 * 12.5);
      q.rotation.y = Math.PI;
      qu.legL.rotation.x = -Math.sin(ph) * 0.85;
      qu.legR.rotation.x = Math.sin(ph) * 0.85;
      qu.armL.rotation.x = Math.sin(ph) * 0.7;
      qu.armR.rotation.x = -1.45;
      qu.elbowR.rotation.x = -0.65;

      camera.position.set(0.4 * (1 - p5), 2.25 + p5 * 0.9, runZ + 4.8 + p5 * 2.2);
      camera.lookAt(0, 1.35, runZ - 1.5);
    }
  }

  function triggerAudio(cue) {
    if (!cue || !cue.voice || mutedByUser || !window.AppAudio) return;
    if (cue.voice === 'impact') {
      if (audioUnlocked) window.AppAudio.impact();
      return;
    }
    if (cue.voice === 'chop') {
      if (audioUnlocked) window.AppAudio.chop();
      return;
    }
    try {
      window.AppAudio.ensure();
      window.AppAudio.playVoice(cue.voice);
      audioUnlocked = true;
      if (audioHint) audioHint.hidden = true;
    } catch (e) {}
  }

  function updateCueUI(t) {
    var idx = 0;
    for (var i = 0; i < CUES.length; i++) {
      if (t >= CUES[i].at) idx = i;
    }
    var cue = CUES[idx];
    for (var b = 0; b < actBadges.length; b++) {
      actBadges[b].classList.toggle('is-active', b === cue.act);
      actBadges[b].classList.toggle('is-done', b < cue.act);
    }
    if (idx !== lastCueIdx) {
      lastCueIdx = idx;
      if (subSpeaker) subSpeaker.textContent = cue.speaker;
      if (subText) subText.textContent = cue.text;
      triggerAudio(cue);
    }
  }

  function loop(nowMs) {
    if (!isOpen) return;
    rafId = requestAnimationFrame(loop);
    var dt = lastFrameMs ? Math.min(0.05, (nowMs - lastFrameMs) / 1000) : 0.016;
    lastFrameMs = nowMs;
    elapsed += dt;
    if (elapsed >= TOTAL_DUR) {
      if (ready || mode !== 'loading') {
        close(true);
        return;
      }
      elapsed = 0;
      lastCueIdx = -1;
    }
    updateCueUI(elapsed);
    updateDrama(elapsed);
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function ensureDOM() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'prequelOverlay';
    overlay.className = 'prequel-overlay hidden';
    overlay.innerHTML =
      '<canvas id="prequelCanvas"></canvas>' +
      '<div class="prequel-top">' +
        '<div class="prequel-title-row">' +
          '<span class="prequel-title">前情提要 · 华强买瓜（《征服》原剧还原）</span>' +
          '<div class="prequel-actions-top">' +
            '<button id="prequelAudioHint" type="button" class="prequel-audio-hint">🔊 点击开启原剧配音</button>' +
            '<button id="prequelAudioBtn" type="button" class="prequel-audio-btn">🔊 原声</button>' +
          '</div>' +
        '</div>' +
        '<div class="prequel-acts">' +
          '<span class="prequel-act">1. 骑车问价</span>' +
          '<span class="prequel-act">2. 这瓜保熟吗</span>' +
          '<span class="prequel-act">3. 揭穿吸铁石</span>' +
          '<span class="prequel-act">4. 挥刀劈瓜</span>' +
          '<span class="prequel-act">5. 萨日朗逃跑</span>' +
        '</div>' +
      '</div>' +
      '<div class="prequel-bottom">' +
        '<div class="prequel-sub-box">' +
          '<span id="prequelSpeaker" class="prequel-speaker">华强</span>' +
          '<span id="prequelSubText" class="prequel-sub-text"></span>' +
        '</div>' +
        '<div class="prequel-foot">' +
          '<div class="prequel-progress-wrap">' +
            '<div class="prequel-progress-track"><div id="prequelProgBar" class="prequel-progress-fill"></div></div>' +
            '<div id="prequelProgText" class="prequel-progress-text">正在准备高精度角色模型…</div>' +
          '</div>' +
          '<button id="prequelSkipBtn" type="button" class="prequel-skip-btn">跳过前情</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    canvas = document.getElementById('prequelCanvas');
    titleEl = overlay.querySelector('.prequel-title');
    actBadges = Array.prototype.slice.call(overlay.querySelectorAll('.prequel-act'));
    subSpeaker = document.getElementById('prequelSpeaker');
    subText = document.getElementById('prequelSubText');
    audioBtn = document.getElementById('prequelAudioBtn');
    audioHint = document.getElementById('prequelAudioHint');
    progWrap = overlay.querySelector('.prequel-progress-wrap');
    progBar = document.getElementById('prequelProgBar');
    progText = document.getElementById('prequelProgText');
    skipBtn = document.getElementById('prequelSkipBtn');

    function unlockAudioFromUser() {
      if (window.AppAudio) {
        try { window.AppAudio.ensure(); } catch (e) {}
      }
      audioUnlocked = true;
      mutedByUser = false;
      if (audioHint) audioHint.hidden = true;
      if (audioBtn) audioBtn.textContent = '🔊 原声';
      if (lastCueIdx >= 0 && CUES[lastCueIdx]) triggerAudio(CUES[lastCueIdx]);
    }

    overlay.addEventListener('pointerdown', function (ev) {
      if (ev.target === skipBtn || ev.target === audioBtn) return;
      if (!audioUnlocked) unlockAudioFromUser();
    });
    audioHint.addEventListener('click', unlockAudioFromUser);
    audioBtn.addEventListener('click', function () {
      mutedByUser = !mutedByUser;
      audioBtn.textContent = mutedByUser ? '🔇 静音' : '🔊 原声';
      if (!mutedByUser) {
        unlockAudioFromUser();
      } else if (window.AppAudio && window.AppAudio.stop) {
        window.AppAudio.stop();
      }
    });
    skipBtn.addEventListener('click', function () {
      if (mode === 'loading' && !ready) return;
      close(true);
    });

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    buildScene();
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!renderer || !camera || !overlay) return;
    var w = window.innerWidth || 1280;
    var h = window.innerHeight || 720;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function syncSkipButton() {
    if (!skipBtn) return;
    if (mode === 'loading' && !ready) {
      skipBtn.disabled = true;
      skipBtn.classList.remove('is-ready');
      skipBtn.textContent = '模型加载中…';
    } else if (mode === 'replay') {
      skipBtn.disabled = false;
      skipBtn.classList.add('is-ready');
      skipBtn.textContent = '返回菜单 →';
    } else {
      skipBtn.disabled = false;
      skipBtn.classList.add('is-ready');
      skipBtn.textContent = '模型已就绪 · 跳过开跑 →';
    }
  }

  function open(opts) {
    opts = opts || {};
    ensureDOM();
    mode = opts.mode || 'replay';
    onCloseCb = opts.onClose || null;
    if (typeof opts.ready === 'boolean') ready = opts.ready;
    if (mode === 'replay' || mode === 'firstVisit') {
      if (progWrap) progWrap.style.visibility = mode === 'loading' ? 'visible' : (ready ? 'hidden' : 'visible');
    } else if (progWrap) {
      progWrap.style.visibility = 'visible';
    }
    elapsed = 0;
    lastCueIdx = -1;
    lastFrameMs = 0;
    isOpen = true;
    if (audioHint) audioHint.hidden = audioUnlocked;
    resize();
    syncSkipButton();
    overlay.classList.remove('hidden');
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function setProgress(pct, loadedBytes, totalBytes) {
    if (!overlay) return;
    var clamped = Math.max(0, Math.min(1, pct || 0));
    if (progBar) progBar.style.width = Math.round(clamped * 100) + '%';
    if (progText) {
      if (totalBytes > 0) {
        var mbLoaded = (loadedBytes / (1024 * 1024)).toFixed(1);
        var mbTotal = (totalBytes / (1024 * 1024)).toFixed(1);
        progText.textContent = '高精度角色模型下载中 ' + Math.round(clamped * 100) + '%（' + mbLoaded + ' / ' + mbTotal + ' MB）';
      } else {
        progText.textContent = '高精度角色模型加载中 ' + Math.round(clamped * 100) + '%…';
      }
    }
  }

  function setReady(val) {
    ready = !!val;
    if (!overlay) return;
    if (ready) {
      if (progBar) progBar.style.width = '100%';
      if (progText) progText.textContent = '高精度角色模型已就绪，可随时开跑！';
    }
    syncSkipButton();
  }

  function close(markSeen) {
    if (!isOpen) return;
    isOpen = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    if (window.AppAudio && window.AppAudio.stop) window.AppAudio.stop();
    if (overlay) overlay.classList.add('hidden');
    if (markSeen) {
      try { localStorage.setItem('haoge_prequel_seen', '1'); } catch (e) {}
    }
    if (onCloseCb) {
      var cb = onCloseCb;
      onCloseCb = null;
      cb();
    }
  }

  window.StreetPrequel = {
    open: open,
    close: close,
    setProgress: setProgress,
    setReady: setReady,
    isOpen: function () { return isOpen; }
  };
})();

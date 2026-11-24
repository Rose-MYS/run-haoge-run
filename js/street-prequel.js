// ═══════════════════════════════════════════════════════════════
//  STREET-PREQUEL.JS — 双模高精度《华强买瓜》5 幕前情提要过场
//  · 下载 16MB 高精度 GLB 期间：零粗糙方块人，秒播 AI 复古电影分镜 + 原剧原声
//  · GLB 模型就绪后 / 重看模式：直接复用跑酷同款高精度 GLB 郝哥 & 刘华强实时 3D 演绎
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var overlay = null;
  var canvas = null;
  var storyWrap = null;
  var storyImgs = [];
  var flashEl = null;
  var actBadges = [];
  var subSpeaker = null;
  var subText = null;
  var modeBtn = null;
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
  var openMode = 'loading'; // 'loading' | 'firstVisit' | 'replay'
  var visualMode = 'storyboard'; // 'storyboard' | 'glb3d'
  var ready = false;
  var glbLoaded = false;
  var glbLoading = false;
  var audioUnlocked = false;
  var mutedByUser = false;
  var lastCueIdx = -1;
  var onCloseCb = null;

  var actors = {};

  var STORY_URLS = [
    'assets/prequel/act1.jpg',
    'assets/prequel/act2.jpg',
    'assets/prequel/act3.jpg',
    'assets/prequel/act4.jpg',
    'assets/prequel/act5.jpg'
  ];

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

  function makeScooter() {
    var g = new THREE.Group();
    var bodyMat = makeMat(0x234c7a);
    var darkMat = makeMat(0x1c222b);
    var chromeMat = makeMat(0xcbd5e1);
    var base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 1.48), bodyMat);
    base.position.y = 0.30;
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.62), darkMat);
    seat.position.set(0, 0.72, -0.24);
    var stem = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.96, 0.14), chromeMat);
    stem.position.set(0, 0.72, 0.56);
    stem.rotation.x = -0.18;
    var bar = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 0.08), darkMat);
    bar.position.set(0, 1.15, 0.48);
    var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), makeMat(0xfef08a, { emissive: 0xfacc15, emissiveIntensity: 0.4 }));
    lamp.position.set(0, 0.96, 0.62);
    var wF = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 14), darkMat);
    wF.rotation.z = Math.PI / 2;
    wF.position.set(0, 0.24, 0.60);
    var wB = wF.clone();
    wB.position.z = -0.56;
    g.add(base, seat, stem, bar, lamp, wF, wB);
    return g;
  }

  function buildScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9dc2c9);
    scene.fog = new THREE.Fog(0xb9d1d1, 16, 54);

    camera = new THREE.PerspectiveCamera(44, 16 / 9, 0.1, 100);
    camera.position.set(0.6, 2.35, 6.2);

    var hemi = new THREE.HemisphereLight(0xfff5e0, 0x4b5563, 1.05);
    scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff0cc, 1.15);
    sun.position.set(7, 12, 8);
    sun.castShadow = true;
    scene.add(sun);

    var road = new THREE.Mesh(new THREE.PlaneGeometry(24, 68), makeMat(0x3b4046));
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    scene.add(road);

    var sidewalk = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 68), makeMat(0xb6ae9c));
    sidewalk.position.set(-4.8, 0.07, 0);
    sidewalk.receiveShadow = true;
    scene.add(sidewalk);

    // 东街砖墙商铺与雨棚
    var shop = new THREE.Mesh(new THREE.BoxGeometry(4.0, 5.4, 15), makeMat(0xd6c3a5));
    shop.position.set(-6.6, 2.7, -2.5);
    scene.add(shop);
    var brick = new THREE.Mesh(new THREE.BoxGeometry(4.08, 1.65, 15.08), makeMat(0x8c3b2b));
    brick.position.set(-6.6, 0.82, -2.5);
    scene.add(brick);
    var awning = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 6.8), makeMat(0x2f6f4e));
    awning.position.set(-3.55, 3.15, -1.2);
    awning.rotation.z = -0.18;
    scene.add(awning);

    // 瓜摊木桌
    var stall = new THREE.Group();
    stall.position.set(-2.25, 0.14, -1.2);
    var table = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.92, 3.8), makeMat(0x7c4d2b));
    table.position.y = 0.46;
    table.castShadow = true;
    stall.add(table);

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
    signBoard.position.set(-0.62, 2.22, 0);
    stall.add(signBoard);

    var melonMat = makeMat(0x2f8f3a);
    var stripeMat = makeMat(0x164a1d);
    function makeMelon(r) {
      var mg = new THREE.Group();
      var ball = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), melonMat);
      ball.scale.set(1, 0.92, 1.15);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.96, r * 0.08, 6, 14), stripeMat);
      mg.add(ball, ring);
      return mg;
    }
    [[-0.2, 1.12, -1.15], [0.22, 1.12, -1.02], [0.0, 1.44, -1.08], [-0.15, 1.12, 1.2], [0.22, 1.12, 1.12]].forEach(function (pos) {
      var m = makeMelon(0.25);
      m.position.set(pos[0], pos[1], pos[2]);
      stall.add(m);
    });
    scene.add(stall);

    // 可劈开的“主角生瓜”
    var heroMelon = new THREE.Group();
    heroMelon.position.set(-1.90, 1.30, -0.35);
    var halfGeo = new THREE.SphereGeometry(0.29, 14, 12, 0, Math.PI);
    var fleshMat = makeMat(0xf5e8d0);
    var halfL = new THREE.Group();
    var skinL = new THREE.Mesh(halfGeo, melonMat);
    skinL.rotation.y = -Math.PI / 2;
    var faceL = new THREE.Mesh(new THREE.CircleGeometry(0.28, 14), fleshMat);
    faceL.rotation.y = Math.PI / 2;
    halfL.add(skinL, faceL);
    var halfR = new THREE.Group();
    var skinR = new THREE.Mesh(halfGeo, melonMat);
    skinR.rotation.y = Math.PI / 2;
    var faceR = new THREE.Mesh(new THREE.CircleGeometry(0.28, 14), fleshMat);
    faceR.rotation.y = -Math.PI / 2;
    halfR.add(skinR, faceR);
    heroMelon.add(halfL, halfR);
    scene.add(heroMelon);

    // 台秤 + 红蓝大吸铁石
    var scaleGroup = new THREE.Group();
    scaleGroup.position.set(-1.82, 1.06, 0.58);
    var scaleBody = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.25, 0.56), makeMat(0x475569));
    scaleGroup.add(scaleBody);
    var dial = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 14), makeMat(0xf8fafc));
    dial.rotation.z = Math.PI / 2;
    dial.position.set(0.29, 0.02, 0);
    scaleGroup.add(dial);

    var magnetGroup = new THREE.Group();
    magnetGroup.position.set(0, 0.15, 0);
    var magRed = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.15), makeMat(0xdc2626, { emissive: 0x7f1d1d, emissiveIntensity: 0.55 }));
    magRed.position.set(-0.04, 0, -0.075);
    var magBlue = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.15), makeMat(0x2563eb, { emissive: 0x1e3a8a, emissiveIntensity: 0.55 }));
    magBlue.position.set(-0.04, 0, 0.075);
    var magRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.032, 8, 22), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    magRing.rotation.x = Math.PI / 2;
    magRing.visible = false;
    magnetGroup.add(magRed, magBlue, magRing);
    scaleGroup.add(magnetGroup);

    var trayPivot = new THREE.Group();
    trayPivot.position.set(-0.28, 0.20, 0);
    var trayMesh = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.06, 0.58), makeMat(0xcbd5e1));
    trayMesh.position.set(0.28, 0, 0);
    trayPivot.add(trayMesh);
    scaleGroup.add(trayPivot);
    scene.add(scaleGroup);

    // 高精度 GLB 角色挂载槽（绝不使用粗糙方块人）
    var haogeSlot = new THREE.Group();
    haogeSlot.position.set(-3.2, 0.14, -1.1);
    haogeSlot.rotation.y = Math.PI / 2;
    scene.add(haogeSlot);

    var huaqiangSlot = new THREE.Group();
    huaqiangSlot.scale.setScalar(1.06);
    huaqiangSlot.position.set(-0.2, 0, 3.8);
    huaqiangSlot.rotation.y = -Math.PI / 2;
    scene.add(huaqiangSlot);

    var scooter = makeScooter();
    scooter.position.set(-0.2, 0, 3.8);
    scooter.rotation.y = Math.PI;
    scene.add(scooter);

    var slashFlash = new THREE.Mesh(
      new THREE.RingGeometry(0.38, 0.72, 18, 1, -0.8, 1.8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    );
    slashFlash.position.set(-1.90, 1.40, -0.35);
    slashFlash.visible = false;
    scene.add(slashFlash);

    actors = {
      haoge: haogeSlot,
      huaqiang: huaqiangSlot,
      scooter: scooter,
      trayPivot: trayPivot,
      magRing: magRing,
      heroMelon: heroMelon,
      halfL: halfL,
      halfR: halfR,
      slashFlash: slashFlash
    };
  }

  function ensureGLBActors(cb) {
    if (glbLoaded) {
      if (cb) cb(true);
      return;
    }
    if (glbLoading) return;
    if (!window.RunnerModels || !window.RunnerModels.usesGltf || !window.RunnerModels.usesGltf()) {
      if (cb) cb(false);
      return;
    }
    glbLoading = true;
    var left = 2;
    var okAll = true;
    function done(primary) {
      okAll = okAll && primary === true;
      if (--left > 0) return;
      glbLoading = false;
      glbLoaded = okAll;
      if (cb) cb(okAll);
    }
    window.RunnerModels.loadRunner(actors.haoge, 'haoge', { height: 2.2, onSettled: done });
    window.RunnerModels.loadRunner(actors.huaqiang, 'huaqiang', { height: 2.5, onSettled: done });
  }

  function ease(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  function updateDrama3D(t, dt) {
    var h = actors.haoge, q = actors.huaqiang, sc = actors.scooter;
    var hu = h.userData || {}, qu = q.userData || {};

    actors.trayPivot.rotation.z = 0;
    actors.magRing.visible = false;
    actors.halfL.position.set(0, 0, 0);
    actors.halfL.rotation.set(0, 0, 0);
    actors.halfR.position.set(0, 0, 0);
    actors.halfR.rotation.set(0, 0, 0);
    actors.slashFlash.visible = false;
    h.position.set(-3.2, 0.14, -1.1);
    h.rotation.set(0, Math.PI / 2, 0);

    if (window.RunnerAnim) {
      if (t < 15.8) {
        window.RunnerAnim.freeze(h);
        window.RunnerAnim.freeze(q);
      } else {
        window.RunnerAnim.play(h, 'run', { timeScale: 1.3 });
        window.RunnerAnim.play(q, 'run', { timeScale: 1.35 });
      }
    }
    if (hu.clearRigPose) hu.clearRigPose();
    if (qu.clearRigPose) qu.clearRigPose();

    if (t < 4.0) {
      // 第 1 幕：骑车滑停瓜摊前
      var p1 = ease(t / 2.2);
      sc.position.set(-0.30, 0, 3.8 - p1 * 3.8);
      sc.rotation.y = Math.PI * (1 - 0.15 * p1);
      q.position.set(-0.30, -0.45, 3.8 - p1 * 3.8);
      q.rotation.set(0, -Math.PI / 2, 0);
      if (qu.leftLeg) qu.leftLeg.rotation.x = -0.95;
      if (qu.rightLeg) qu.rightLeg.rotation.x = -0.95;
      if (qu.leftKnee) qu.leftKnee.rotation.x = 0.95;
      if (qu.rightKnee) qu.rightKnee.rotation.x = 0.95;
      if (qu.leftArm) { qu.leftArm.rotation.x = -0.95; qu.leftArm.rotation.z = 0.35; }
      if (qu.rightArm) { qu.rightArm.rotation.x = -0.95; qu.rightArm.rotation.z = -0.35; }
      if (qu.leftForeArm) qu.leftForeArm.rotation.x = -0.45;
      if (qu.rightForeArm) qu.rightForeArm.rotation.x = -0.45;
      if (hu.rightArm) hu.rightArm.rotation.x = -0.45 * Math.abs(Math.sin(t * 4));
      camera.position.set(2.4 - p1 * 0.85, 2.35, 4.4 - p1 * 1.3);
      camera.lookAt(-1.6, 1.45, -0.5);
    } else if (t < 7.5) {
      // 第 2 幕：下车对峙“这瓜保熟吗？”
      var p2 = ease((t - 4.0) / 1.1);
      sc.position.set(-0.30, 0, 0.0);
      sc.rotation.y = Math.PI * 0.85;
      q.position.set(-0.30 - p2 * 0.65, 0, -0.35);
      q.rotation.set(0, -Math.PI / 2, 0);
      if (qu.spine) qu.spine.rotation.x = 0.14;
      if (qu.rightArm) qu.rightArm.rotation.x = -0.55 - 0.18 * Math.sin((t - 4.0) * 4);
      if (qu.rightForeArm) qu.rightForeArm.rotation.x = -0.65;
      if (hu.leftArm) hu.leftArm.rotation.x = -0.65 * Math.abs(Math.sin((t - 4.0) * 3));
      if (hu.rightArm) hu.rightArm.rotation.x = -0.65 * Math.abs(Math.sin((t - 4.0) * 3));
      camera.position.set(1.15, 2.02, 2.25 - p2 * 0.45);
      camera.lookAt(-1.95, 1.55, -0.65);
    } else if (t < 11.5) {
      // 第 3 幕：特写掀开秤盘，红蓝吸铁石曝光
      var p3 = ease((t - 7.5) / 1.0);
      sc.position.set(-0.30, 0, 0.0);
      q.position.set(-1.05, 0, 0.32);
      q.rotation.set(0, -Math.PI / 2 - 0.28, 0);
      if (qu.spine) qu.spine.rotation.x = 0.16;
      if (qu.rightArm) qu.rightArm.rotation.x = -1.15 * p3;
      if (qu.rightForeArm) qu.rightForeArm.rotation.x = -0.55;
      actors.trayPivot.rotation.z = 1.38 * p3;
      actors.magRing.visible = p3 > 0.42;
      actors.magRing.scale.setScalar(1 + 0.14 * Math.sin(t * 14));
      var shake = (t > 8.1 && t < 9.2) ? Math.sin(t * 55) * 0.05 : 0;
      camera.position.set(-0.55 + shake, 1.92 + shake, 2.35 - p3 * 0.72);
      camera.lookAt(-1.82, 1.18, 0.58);
    } else if (t < 15.8) {
      // 第 4 幕：华强举刀劈生瓜（真实 GLB 弯肘弓步下劈）
      sc.position.set(-0.30, 0, 0.0);
      q.position.set(-0.98, 0, -0.35);
      q.rotation.set(0, -Math.PI / 2, 0);
      var chopT = t - 11.5;
      if (chopT < 0.95) {
        var rp = ease(chopT / 0.95);
        if (qu.spine) { qu.spine.rotation.y = -0.22 * rp; qu.spine.rotation.x = -0.04 * rp; }
        if (qu.rightArm) qu.rightArm.rotation.x = -2.25 * rp;
        if (qu.rightForeArm) qu.rightForeArm.rotation.x = -0.95 * rp;
        if (qu.leftLeg) qu.leftLeg.rotation.x = -0.32 * rp;
        if (qu.leftKnee) qu.leftKnee.rotation.x = 0.36 * rp;
      } else if (chopT < 1.30) {
        var sp = ease((chopT - 0.95) / 0.35);
        if (qu.spine) { qu.spine.rotation.y = -0.22 + 0.44 * sp; qu.spine.rotation.x = -0.04 + 0.30 * sp; }
        if (qu.rightArm) qu.rightArm.rotation.x = -2.25 + 1.65 * sp;
        if (qu.rightForeArm) qu.rightForeArm.rotation.x = -0.95 + 0.65 * sp;
        if (qu.leftLeg) qu.leftLeg.rotation.x = -0.45;
        if (qu.leftKnee) qu.leftKnee.rotation.x = 0.55;
        actors.slashFlash.visible = true;
        actors.slashFlash.material.opacity = Math.sin(sp * Math.PI) * 0.92;
      } else {
        var fp = ease((chopT - 1.30) / 0.6);
        if (qu.spine) { qu.spine.rotation.y = 0.22; qu.spine.rotation.x = 0.26; }
        if (qu.rightArm) qu.rightArm.rotation.x = -0.60;
        if (qu.rightForeArm) qu.rightForeArm.rotation.x = -0.30;
        if (qu.leftLeg) qu.leftLeg.rotation.x = -0.45;
        if (qu.leftKnee) qu.leftKnee.rotation.x = 0.55;
        actors.halfL.position.set(-0.20 * fp, 0, -0.24 * fp);
        actors.halfL.rotation.z = 0.55 * fp;
        actors.halfR.position.set(0.20 * fp, 0, 0.24 * fp);
        actors.halfR.rotation.z = -0.55 * fp;
        if (hu.leftArm) hu.leftArm.rotation.x = -1.55;
        if (hu.rightArm) hu.rightArm.rotation.x = -1.55;
      }
      camera.position.set(0.75, 2.15, 1.85);
      camera.lookAt(-2.0, 1.45, -0.45);
    } else {
      // 第 5 幕：真 GLB 郝哥与华强街道追逃
      var p5 = Math.min(1, (t - 15.8) / 3.7);
      sc.position.set(-0.30, 0, 0.0);
      actors.halfL.position.set(-0.20, 0, -0.24);
      actors.halfR.position.set(0.20, 0, 0.24);
      var runZ = -1.1 - p5 * 14.5;
      h.position.set(-0.8 + Math.min(1, p5 * 3) * 0.8, 0, runZ);
      h.rotation.set(0, Math.PI, 0);
      if (hu.leftArm) hu.leftArm.rotation.x = -1.7;
      if (hu.rightArm) hu.rightArm.rotation.x = -1.7;

      q.position.set(-0.35, 0, 1.4 - p5 * 12.8);
      q.rotation.set(0, Math.PI, 0);
      if (qu.spine) qu.spine.rotation.x = 0.08;
      if (qu.rightForeArm) qu.rightForeArm.rotation.x = -0.58;

      camera.position.set(0.4 * (1 - p5), 2.35 + p5 * 0.8, runZ + 5.2 + p5 * 2.0);
      camera.lookAt(0, 1.4, runZ - 1.5);
    }

    if (window.RunnerModels && window.RunnerModels.update) {
      window.RunnerModels.update(dt);
    }
  }

  function updateStoryboard(t, actIdx) {
    for (var i = 0; i < storyImgs.length; i++) {
      storyImgs[i].classList.toggle('is-active', i === actIdx);
    }
    if (flashEl) {
      var isMagnetHit = t >= 8.0 && t < 8.45;
      var isChopHit = t >= 12.45 && t < 12.85;
      flashEl.classList.toggle('is-red', isMagnetHit);
      flashEl.classList.toggle('is-white', isChopHit);
    }
    if (storyWrap) {
      var shakeOn = (t >= 8.0 && t < 8.65) || (t >= 12.45 && t < 12.95);
      storyWrap.classList.toggle('is-shaking', shakeOn);
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
    return cue.act;
  }

  function applyVisualMode(nextMode) {
    visualMode = nextMode;
    if (canvas) canvas.style.display = (visualMode === 'glb3d') ? 'block' : 'none';
    if (storyWrap) storyWrap.style.display = (visualMode === 'storyboard') ? 'block' : 'none';
    if (modeBtn) {
      var can3D = !!(window.RunnerModels && window.RunnerModels.usesGltf && window.RunnerModels.usesGltf());
      modeBtn.hidden = !can3D;
      modeBtn.textContent = visualMode === 'glb3d' ? '🎨 切漫画分镜' : '🎬 切3D真模型';
    }
  }

  function loop(nowMs) {
    if (!isOpen) return;
    rafId = requestAnimationFrame(loop);
    var dt = lastFrameMs ? Math.min(0.05, (nowMs - lastFrameMs) / 1000) : 0.016;
    lastFrameMs = nowMs;
    elapsed += dt;
    if (elapsed >= TOTAL_DUR) {
      if (ready || openMode !== 'loading') {
        close(true);
        return;
      }
      elapsed = 0;
      lastCueIdx = -1;
    }
    var actIdx = updateCueUI(elapsed);
    if (visualMode === 'glb3d' && glbLoaded && renderer && scene && camera) {
      updateDrama3D(elapsed, dt);
      renderer.render(scene, camera);
    } else {
      updateStoryboard(elapsed, actIdx);
    }
  }

  function ensureDOM() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'prequelOverlay';
    overlay.className = 'prequel-overlay hidden';
    var imgsHtml = STORY_URLS.map(function (u, i) {
      return '<img class="prequel-story-img act-' + i + '" src="' + u + '" alt="华强买瓜第' + (i + 1) + '幕">';
    }).join('');
    overlay.innerHTML =
      '<div id="prequelStoryboard" class="prequel-storyboard">' + imgsHtml + '<div id="prequelFlash" class="prequel-flash"></div></div>' +
      '<canvas id="prequelCanvas"></canvas>' +
      '<div class="prequel-top">' +
        '<div class="prequel-title-row">' +
          '<span class="prequel-title">前情提要 · 华强买瓜（《征服》原剧还原）</span>' +
          '<div class="prequel-actions-top">' +
            '<button id="prequelAudioHint" type="button" class="prequel-audio-hint">🔊 点击开启原剧配音</button>' +
            '<button id="prequelModeBtn" type="button" class="prequel-audio-btn" hidden>🎨 切漫画分镜</button>' +
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
    storyWrap = document.getElementById('prequelStoryboard');
    storyImgs = Array.prototype.slice.call(overlay.querySelectorAll('.prequel-story-img'));
    flashEl = document.getElementById('prequelFlash');
    actBadges = Array.prototype.slice.call(overlay.querySelectorAll('.prequel-act'));
    subSpeaker = document.getElementById('prequelSpeaker');
    subText = document.getElementById('prequelSubText');
    modeBtn = document.getElementById('prequelModeBtn');
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
      if (ev.target === skipBtn || ev.target === audioBtn || ev.target === modeBtn) return;
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
    modeBtn.addEventListener('click', function () {
      if (visualMode === 'storyboard') {
        ensureGLBActors(function (ok) {
          if (ok) applyVisualMode('glb3d');
        });
      } else {
        applyVisualMode('storyboard');
      }
    });
    skipBtn.addEventListener('click', function () {
      if (openMode === 'loading' && !ready) return;
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
    if (openMode === 'loading' && !ready) {
      skipBtn.disabled = true;
      skipBtn.classList.remove('is-ready');
      skipBtn.textContent = '模型加载中…';
    } else if (openMode === 'replay') {
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
    openMode = opts.mode || 'replay';
    onCloseCb = opts.onClose || null;
    if (typeof opts.ready === 'boolean') ready = opts.ready;
    if (progWrap) {
      progWrap.style.visibility = (openMode === 'loading' || !ready) ? 'visible' : 'hidden';
    }
    elapsed = 0;
    lastCueIdx = -1;
    lastFrameMs = 0;
    isOpen = true;
    if (audioHint) audioHint.hidden = audioUnlocked;
    resize();
    syncSkipButton();

    // 默认展示高质感 AI 复古电影分镜（零粗糙模型），GLB 就绪后可随时在右上角一键切换为跑酷同款真 GLB 3D 实机版
    applyVisualMode('storyboard');
    if (window.RunnerModels && window.RunnerModels.usesGltf && window.RunnerModels.usesGltf() && openMode !== 'loading') {
      ensureGLBActors();
    }

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
      if (progText) progText.textContent = '高精度角色模型已就绪，可随时开跑或切换 3D 真模型观看！';
      if (modeBtn) modeBtn.hidden = false;
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
    setVisualMode: applyVisualMode,
    isOpen: function () { return isOpen; }
  };
})();

// ═══════════════════════════════════════════════════════════════
//  STREET-PREQUEL.JS — 双模高精度《华强买瓜》5 幕前情提要过场
//  · 下载 16MB 高精度 GLB 期间：秒播 AI 复古电影分镜 + 原剧原声
//  · GLB 就绪后 / 3D 真模型模式：跑酷同款高精度 GLB 角色 + 精细化纹理东街瓜摊舞台
//  · 结束与跳过采用电影级淡出缩放平滑过渡到游戏主界面（无生硬硬切）
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
  var isClosing = false;
  var closeTimer = 0;
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
  var TOTAL_DUR = 19.8;
  var FADE_OUT_AT = 18.8;

  function makeMat(color, opts) {
    opts = opts || {};
    return new THREE.MeshLambertMaterial(Object.assign({ color: color }, opts));
  }

  // ── 程序化高清 Canvas 贴图生成器（西瓜条纹/生瓜瓤/木板/砖墙/刻度盘/路面）──
  function makeCanvasTex(w, h, drawFn, repeatX, repeatY) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    drawFn(c.getContext('2d'), w, h);
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    if (repeatX || repeatY) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX || 1, repeatY || 1);
    }
    return tex;
  }

  function makeMelonTex() {
    return makeCanvasTex(256, 128, function (ctx, w, h) {
      var grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1f5e27');
      grad.addColorStop(0.5, '#3b9a43');
      grad.addColorStop(1, '#1d5524');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // 锯齿深绿西瓜虎纹
      ctx.fillStyle = '#123d18';
      for (var s = 0; s < 10; s++) {
        var bx = (s + 0.5) * (w / 10);
        ctx.beginPath();
        ctx.moveTo(bx - 5, 0);
        for (var y = 0; y <= h; y += 12) {
          var jag = (y % 24 === 0 ? 4 : -4);
          ctx.lineTo(bx + 6 + jag, y);
        }
        for (var y2 = h; y2 >= 0; y2 -= 12) {
          var jag2 = (y2 % 24 === 0 ? -3 : 3);
          ctx.lineTo(bx - 6 + jag2, y2);
        }
        ctx.closePath();
        ctx.fill();
      }
      // 细微浅绿斑点增加真实感
      ctx.fillStyle = 'rgba(180, 235, 160, 0.14)';
      for (var d = 0; d < 120; d++) {
        ctx.fillRect((d * 37) % w, (d * 53) % h, 2, 2);
      }
    });
  }

  function makeFleshTex(ripe) {
    return makeCanvasTex(128, 128, function (ctx, w, h) {
      var cx = w / 2, cy = h / 2;
      ctx.fillStyle = '#24662c';
      ctx.fillRect(0, 0, w, h);
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fillStyle = '#d9edc2';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 52, 0, Math.PI * 2);
      ctx.fillStyle = ripe ? '#df3b3b' : '#f2d8c9'; // 生瓜蛋子发白微粉
      ctx.fill();
      ctx.fillStyle = ripe ? '#1b1714' : '#e6e0d4';
      for (var i = 0; i < 16; i++) {
        var a = (i / 16) * Math.PI * 2;
        var r = 24 + (i % 3) * 8;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, 1.8, a, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function makeWoodTex() {
    return makeCanvasTex(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#8b572e';
      ctx.fillRect(0, 0, w, h);
      for (var p = 0; p < 6; p++) {
        var y = p * (h / 6);
        ctx.fillStyle = p % 2 === 0 ? '#935d32' : '#7f4e27';
        ctx.fillRect(0, y, w, h / 6 - 2);
        ctx.fillStyle = '#4a2b14';
        ctx.fillRect(0, y + h / 6 - 2, w, 2);
        // 木纹细丝
        ctx.fillStyle = 'rgba(55, 30, 12, 0.16)';
        for (var g = 0; g < 8; g++) {
          ctx.fillRect(0, y + 4 + g * 5, w, 1.5);
        }
        // 钉子点
        ctx.fillStyle = '#332013';
        ctx.fillRect(14, y + 18, 4, 4);
        ctx.fillRect(w - 18, y + 18, 4, 4);
      }
    }, 1, 1);
  }

  function makeAwningTex() {
    return makeCanvasTex(256, 128, function (ctx, w, h) {
      for (var i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#276749' : '#f1ebd8';
        ctx.fillRect(i * (w / 8), 0, w / 8, h);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, h - 14, w, 14);
    });
  }

  function makeBrickTex() {
    return makeCanvasTex(256, 128, function (ctx, w, h) {
      ctx.fillStyle = '#b7a999';
      ctx.fillRect(0, 0, w, h);
      var rows = 6, cols = 6;
      var bh = h / rows, bw = w / cols;
      for (var r = 0; r < rows; r++) {
        var off = (r % 2) * (bw / 2);
        for (var c = -1; c <= cols; c++) {
          ctx.fillStyle = (r + c) % 3 === 0 ? '#8c3b2b' : ((r + c) % 2 === 0 ? '#9a4432' : '#7c3325');
          ctx.fillRect(c * bw + off + 2, r * bh + 2, bw - 3, bh - 3);
        }
      }
    }, 3, 1);
  }

  function makeTileTex() {
    return makeCanvasTex(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#b9b19f';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#8b8373';
      ctx.lineWidth = 3;
      for (var i = 0; i <= 4; i++) {
        ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(w, i * 64); ctx.stroke();
      }
    }, 2, 16);
  }

  function makeRoadTex() {
    return makeCanvasTex(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#3f454c';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (var i = 0; i < 260; i++) {
        ctx.fillRect((i * 47) % w, (i * 83) % h, 3, 3);
      }
      ctx.fillStyle = '#e2d7b4';
      ctx.fillRect(w / 2 - 4, 24, 8, 96);
    }, 1, 10);
  }

  function makeDialTex() {
    return makeCanvasTex(128, 128, function (ctx, w, h) {
      var cx = 64, cy = 64;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 6; ctx.stroke();
      for (var i = 0; i < 16; i++) {
        var a = (i / 16) * Math.PI * 2 - Math.PI / 2;
        ctx.strokeStyle = i === 12 ? '#dc2626' : '#475569';
        ctx.lineWidth = i % 4 === 0 ? 4 : 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40);
        ctx.lineTo(cx + Math.cos(a) * 53, cy + Math.sin(a) * 53);
        ctx.stroke();
      }
      // 红色指针直指 15 斤
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 34, cy - 22); ctx.stroke();
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    });
  }

  function makeScooter() {
    var g = new THREE.Group();
    var bodyMat = makeMat(0x22466e);
    var darkMat = makeMat(0x1b2028);
    var chromeMat = makeMat(0xd6dee8);
    var seatMat = makeMat(0x2a2421);

    var deck = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.14, 1.46), bodyMat);
    deck.position.y = 0.28;
    deck.castShadow = true;
    var rearBody = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.36, 0.72), bodyMat);
    rearBody.position.set(0, 0.50, -0.34);
    var frontShield = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.72, 0.20), bodyMat);
    frontShield.position.set(0, 0.66, 0.56);
    frontShield.rotation.x = -0.18;
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.62), seatMat);
    seat.position.set(0, 0.74, -0.26);
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.88, 10), chromeMat);
    stem.position.set(0, 0.78, 0.54);
    stem.rotation.x = -0.16;
    var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.78, 8), darkMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 1.18, 0.48);
    var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), makeMat(0xfef08a, { emissive: 0xfacc15, emissiveIntensity: 0.45 }));
    lamp.position.set(0, 0.94, 0.66);
    // 左右后视镜
    [-0.32, 0.32].forEach(function (mx) {
      var stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 6), chromeMat);
      stalk.position.set(mx, 1.26, 0.48);
      var mir = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.03), darkMat);
      mir.position.set(mx, 1.35, 0.48);
      g.add(stalk, mir);
    });
    function makeWheel(z) {
      var wg = new THREE.Group();
      var tire = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 16), darkMat);
      tire.rotation.z = Math.PI / 2;
      var rim = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 12), chromeMat);
      rim.rotation.z = Math.PI / 2;
      wg.add(tire, rim);
      wg.position.set(0, 0.24, z);
      return wg;
    }
    g.add(deck, rearBody, frontShield, seat, stem, bar, lamp, makeWheel(0.60), makeWheel(-0.56));
    return g;
  }

  function buildScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9ec4cb);
    scene.fog = new THREE.Fog(0xc4d4cb, 18, 56);

    camera = new THREE.PerspectiveCamera(44, 16 / 9, 0.1, 100);
    camera.position.set(0.6, 2.35, 6.2);

    var hemi = new THREE.HemisphereLight(0xfff4d9, 0x565c66, 1.05);
    scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xffebc2, 1.22);
    sun.position.set(8, 13, 9);
    sun.castShadow = true;
    scene.add(sun);

    var roadTex = makeRoadTex();
    var tileTex = makeTileTex();
    var brickTex = makeBrickTex();
    var woodTex = makeWoodTex();
    var awningTex = makeAwningTex();
    var melonTex = makeMelonTex();
    var unripeTex = makeFleshTex(false);
    var ripeTex = makeFleshTex(true);
    var dialTex = makeDialTex();

    // 柏油路面 + 地砖人行道 + 路缘石
    var road = new THREE.Mesh(new THREE.PlaneGeometry(22, 72), new THREE.MeshLambertMaterial({ map: roadTex }));
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    scene.add(road);

    var sidewalk = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 72), new THREE.MeshLambertMaterial({ map: tileTex }));
    sidewalk.position.set(-4.8, 0.07, 0);
    sidewalk.receiveShadow = true;
    scene.add(sidewalk);

    var curb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 72), makeMat(0x9b9485));
    curb.position.set(-2.0, 0.08, 0);
    scene.add(curb);

    // 东街红砖二层老建筑背景（带窗户、空调外机、电线杆与行道树）
    var shop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.8, 18), makeMat(0xd9c8ac));
    shop.position.set(-6.8, 2.9, -2.5);
    scene.add(shop);
    var brick = new THREE.Mesh(new THREE.BoxGeometry(4.28, 1.75, 18.08), new THREE.MeshLambertMaterial({ map: brickTex }));
    brick.position.set(-6.8, 0.88, -2.5);
    scene.add(brick);
    var cornice = new THREE.Mesh(new THREE.BoxGeometry(4.55, 0.24, 18.3), makeMat(0x7c4534));
    cornice.position.set(-6.8, 5.75, -2.5);
    scene.add(cornice);
    // 二楼玻璃窗 + 窗框
    var frameMat = makeMat(0x3a5347);
    var glassMat = makeMat(0x6e8f96, { emissive: 0x1e3035, emissiveIntensity: 0.25 });
    [-6.5, -3.5, -0.5, 2.5].forEach(function (wz) {
      var winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.35, 1.15), frameMat);
      winFrame.position.set(-4.68, 3.85, wz);
      var winGlass = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.12, 0.94), glassMat);
      winGlass.position.set(-4.67, 3.85, wz);
      scene.add(winFrame, winGlass);
    });
    // 空调外机
    var ac = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.56, 0.78), makeMat(0xe5e1d8));
    ac.position.set(-4.52, 2.65, 2.2);
    scene.add(ac);
    // 电线杆 + 行道树
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.13, 6.4, 8), makeMat(0x88857c));
    pole.position.set(-2.25, 3.2, -5.8);
    scene.add(pole);
    var treeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 2.6, 8), makeMat(0x654321));
    treeTrunk.position.set(-3.4, 1.3, 4.4);
    var canopy1 = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10), makeMat(0x4b7f52));
    canopy1.position.set(-3.4, 3.1, 4.4);
    var canopy2 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 8), makeMat(0x5b9460));
    canopy2.position.set(-2.9, 3.55, 3.9);
    scene.add(treeTrunk, canopy1, canopy2);

    // ── 精细化西瓜摊（木板摊桌 + 4 根棚柱 + 绿白条纹遮阳棚 + 案板 + 竹筐 + 招牌）──
    var stall = new THREE.Group();
    stall.position.set(-2.30, 0.14, -1.1);
    var woodMat = new THREE.MeshLambertMaterial({ map: woodTex });
    var darkWoodMat = makeMat(0x5b371b);

    // 摊位主木柜 + 台面延伸沿 + 底部横撑
    var counterBody = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.86, 3.8), woodMat);
    counterBody.position.y = 0.43;
    counterBody.castShadow = true;
    counterBody.receiveShadow = true;
    var counterTop = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.10, 4.04), woodMat);
    counterTop.position.y = 0.91;
    counterTop.castShadow = true;
    counterTop.receiveShadow = true;
    stall.add(counterBody, counterTop);

    // 4 根木质棚柱
    [[-0.72, -1.88], [0.72, -1.88], [-0.72, 1.88], [0.72, 1.88]].forEach(function (p) {
      var post = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.95, 0.11), darkWoodMat);
      post.position.set(p[0], 1.475, p[1]);
      post.castShadow = true;
      stall.add(post);
    });

    // 绿白条纹遮阳棚 + 前垂边
    var awningMat = new THREE.MeshLambertMaterial({ map: awningTex });
    var awningRoof = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.10, 4.45), awningMat);
    awningRoof.position.set(0.15, 2.96, 0);
    awningRoof.rotation.z = -0.18;
    awningRoof.castShadow = true;
    var valance = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.30, 4.45), awningMat);
    valance.position.set(1.38, 2.62, 0);
    stall.add(awningRoof, valance);

    // 招牌「保熟鲜瓜 · 两元一斤」
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
    var signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.62, 2.75), new THREE.MeshBasicMaterial({ map: signTex }));
    signBoard.position.set(-0.62, 2.25, 0);
    stall.add(signBoard);

    // 摊旁竹编瓜筐
    var basketMat = makeMat(0xb88b4a);
    var basket = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.36, 0.56, 14), basketMat);
    basket.position.set(0.35, 0.28, -2.35);
    basket.castShadow = true;
    stall.add(basket);

    // 圆形老木墩砧板
    var choppingBlock = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.12, 18), makeMat(0xc4955d));
    choppingBlock.position.set(0.36, 1.02, 0.65);
    choppingBlock.receiveShadow = true;
    stall.add(choppingBlock);

    // 精细纹理西瓜工厂（虎纹瓜皮 + 弯卷绿瓜蒂）
    var melonMat = new THREE.MeshLambertMaterial({ map: melonTex });
    var stemMat = makeMat(0x285422);
    function makeMelon(r) {
      var mg = new THREE.Group();
      var ball = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), melonMat);
      ball.scale.set(1.0, 0.92, 1.14);
      ball.castShadow = true;
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.08, 6), stemMat);
      stem.position.set(0, r * 0.92, 0);
      stem.rotation.z = 0.35;
      mg.add(ball, stem);
      return mg;
    }

    // 瓜摊金字塔堆叠（12 颗条纹大西瓜 + 筐里 2 颗）
    [
      [-0.30, 1.18, -1.25, 0.25], [0.22, 1.18, -1.22, 0.25], [-0.04, 1.18, -0.78, 0.25],
      [0.36, 1.18, -0.82, 0.24], [-0.36, 1.18, -0.75, 0.24], [-0.06, 1.54, -1.04, 0.24],
      [-0.25, 1.18, 1.38, 0.25], [0.26, 1.18, 1.36, 0.25], [0.02, 1.54, 1.37, 0.24],
      [0.24, 0.66, -2.30, 0.23], [0.48, 0.68, -2.42, 0.22]
    ].forEach(function (spec) {
      var m = makeMelon(spec[3]);
      m.position.set(spec[0], spec[1], spec[2]);
      m.rotation.y = spec[2] * 1.3;
      stall.add(m);
    });

    // 切开展示的半颗红瓤瓜（摆在旁边做对比）
    var demoHalf = new THREE.Group();
    var demoSkin = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI), melonMat);
    demoSkin.rotation.x = Math.PI / 2;
    var demoFlesh = new THREE.Mesh(new THREE.CircleGeometry(0.215, 16), new THREE.MeshLambertMaterial({ map: ripeTex }));
    demoFlesh.rotation.x = -Math.PI / 2;
    demoHalf.add(demoSkin, demoFlesh);
    demoHalf.position.set(-0.34, 1.06, 0.15);
    stall.add(demoHalf);
    scene.add(stall);

    // 可劈开的“主角生瓜”（放在砧板上，劈开露出白粉生瓜瓤纹理）
    var heroMelon = new THREE.Group();
    heroMelon.position.set(-1.94, 1.44, -0.45);
    var halfGeo = new THREE.SphereGeometry(0.29, 18, 14, 0, Math.PI);
    var unripeFaceMat = new THREE.MeshLambertMaterial({ map: unripeTex });
    var halfL = new THREE.Group();
    var skinL = new THREE.Mesh(halfGeo, melonMat);
    skinL.rotation.y = -Math.PI / 2;
    var faceL = new THREE.Mesh(new THREE.CircleGeometry(0.285, 16), unripeFaceMat);
    faceL.rotation.y = Math.PI / 2;
    halfL.add(skinL, faceL);
    var halfR = new THREE.Group();
    var skinR = new THREE.Mesh(halfGeo, melonMat);
    skinR.rotation.y = Math.PI / 2;
    var faceR = new THREE.Mesh(new THREE.CircleGeometry(0.285, 16), unripeFaceMat);
    faceR.rotation.y = -Math.PI / 2;
    halfR.add(skinR, faceR);
    heroMelon.add(halfL, halfR);
    scene.add(heroMelon);

    // ── 精细化金属台秤 + 红蓝 U 型大吸铁石 ──
    var scaleGroup = new THREE.Group();
    scaleGroup.position.set(-1.82, 1.10, 0.56);
    var metalDark = makeMat(0x475569);
    var metalLight = makeMat(0xcbd5e1);
    var scaleBody = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.28, 0.54), metalDark);
    scaleBody.castShadow = true;
    var scaleRim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 18), metalDark);
    scaleRim.rotation.z = Math.PI / 2;
    scaleRim.position.set(0.27, 0.0, 0);
    var dialFace = new THREE.Mesh(new THREE.CircleGeometry(0.15, 18), new THREE.MeshBasicMaterial({ map: dialTex }));
    dialFace.rotation.y = Math.PI / 2;
    dialFace.position.set(0.305, 0.0, 0);
    scaleGroup.add(scaleBody, scaleRim, dialFace);

    // 真正的弯曲 U 型红蓝马蹄磁铁（带银色磁极头）
    var magnetGroup = new THREE.Group();
    magnetGroup.position.set(0, 0.17, 0);
    var magArch = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.045, 10, 16, Math.PI), makeMat(0xb91c1c, { emissive: 0x5c0a0a, emissiveIntensity: 0.45 }));
    magArch.rotation.x = Math.PI / 2;
    magArch.rotation.z = Math.PI / 2;
    magArch.position.x = -0.08;
    var poleRed = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.09), makeMat(0xdc2626, { emissive: 0x7f1d1d, emissiveIntensity: 0.5 }));
    poleRed.position.set(0.02, 0, -0.11);
    var poleBlue = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.09), makeMat(0x2563eb, { emissive: 0x1e3a8a, emissiveIntensity: 0.5 }));
    poleBlue.position.set(0.02, 0, 0.11);
    var tip1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.092, 0.092), metalLight);
    tip1.position.set(0.12, 0, -0.11);
    var tip2 = tip1.clone();
    tip2.position.z = 0.11;
    var magRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 8, 22), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    magRing.rotation.x = Math.PI / 2;
    magRing.visible = false;
    magnetGroup.add(magArch, poleRed, poleBlue, tip1, tip2, magRing);
    scaleGroup.add(magnetGroup);

    var trayPivot = new THREE.Group();
    trayPivot.position.set(-0.28, 0.22, 0);
    var trayMesh = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.05, 0.60), metalLight);
    trayMesh.position.set(0.28, 0, 0);
    var trayLip = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.64), makeMat(0x94a3b8));
    trayLip.position.set(0.28, 0.03, 0);
    trayPivot.add(trayMesh, trayLip);
    scaleGroup.add(trayPivot);
    scene.add(scaleGroup);

    // 跑酷同款高精度 GLB 角色挂载槽
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
    slashFlash.position.set(-1.94, 1.52, -0.45);
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
      var p1 = ease(t / 2.2);
      sc.position.set(-0.28, 0, 3.8 - p1 * 3.8);
      sc.rotation.y = Math.PI * (1 - 0.15 * p1);
      q.position.set(-0.28, -0.45, 3.8 - p1 * 3.8);
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
      var p2 = ease((t - 4.0) / 1.1);
      sc.position.set(-0.28, 0, 0.0);
      sc.rotation.y = Math.PI * 0.85;
      q.position.set(-0.28 - p2 * 0.65, 0, -0.35);
      q.rotation.set(0, -Math.PI / 2, 0);
      if (qu.spine) qu.spine.rotation.x = 0.14;
      if (qu.rightArm) qu.rightArm.rotation.x = -0.55 - 0.18 * Math.sin((t - 4.0) * 4);
      if (qu.rightForeArm) qu.rightForeArm.rotation.x = -0.65;
      if (hu.leftArm) hu.leftArm.rotation.x = -0.65 * Math.abs(Math.sin((t - 4.0) * 3));
      if (hu.rightArm) hu.rightArm.rotation.x = -0.65 * Math.abs(Math.sin((t - 4.0) * 3));
      camera.position.set(1.15, 2.02, 2.25 - p2 * 0.45);
      camera.lookAt(-1.95, 1.55, -0.65);
    } else if (t < 11.5) {
      var p3 = ease((t - 7.5) / 1.0);
      sc.position.set(-0.28, 0, 0.0);
      q.position.set(-1.02, 0, 0.32);
      q.rotation.set(0, -Math.PI / 2 - 0.28, 0);
      if (qu.spine) qu.spine.rotation.x = 0.16;
      if (qu.rightArm) qu.rightArm.rotation.x = -1.15 * p3;
      if (qu.rightForeArm) qu.rightForeArm.rotation.x = -0.55;
      actors.trayPivot.rotation.z = 1.42 * p3;
      actors.magRing.visible = p3 > 0.42;
      actors.magRing.scale.setScalar(1 + 0.14 * Math.sin(t * 14));
      var shake = (t > 8.1 && t < 9.2) ? Math.sin(t * 55) * 0.05 : 0;
      camera.position.set(-0.55 + shake, 1.92 + shake, 2.35 - p3 * 0.72);
      camera.lookAt(-1.82, 1.24, 0.56);
    } else if (t < 15.8) {
      sc.position.set(-0.28, 0, 0.0);
      q.position.set(-0.96, 0, -0.45);
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
      camera.lookAt(-2.0, 1.50, -0.45);
    } else {
      // 第 5 幕：追逃并平滑抬升镜头贴近主界面跟拍视角，随后淡出无缝衔接主界面
      var p5 = Math.min(1, (t - 15.8) / 4.0);
      sc.position.set(-0.28, 0, 0.0);
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

      camera.position.set(0.4 * (1 - p5), 2.35 + p5 * 1.4, runZ + 5.2 + p5 * 2.6);
      camera.lookAt(0, 1.45, runZ - 1.5);
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

    // 接近结尾时自动启动平滑电影淡出，无缝过渡到游戏主界面
    if (!isClosing && elapsed >= FADE_OUT_AT && (ready || openMode !== 'loading')) {
      close(true);
    } else if (!isClosing && elapsed >= TOTAL_DUR) {
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
            '<button id="prequelModeBtn" type="button" class="prequel-audio-btn" hidden>🎬 切3D真模型</button>' +
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = false;
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
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = 0; }
    isClosing = false;
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

    applyVisualMode('storyboard');
    if (window.RunnerModels && window.RunnerModels.usesGltf && window.RunnerModels.usesGltf() && openMode !== 'loading') {
      ensureGLBActors();
    }

    overlay.classList.remove('hidden', 'is-closing');
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

  function finishClose(markSeen) {
    isOpen = false;
    isClosing = false;
    closeTimer = 0;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    if (window.AppAudio && window.AppAudio.stop) window.AppAudio.stop();
    if (overlay) overlay.classList.add('hidden');
    if (overlay) overlay.classList.remove('is-closing');
    if (markSeen) {
      try { localStorage.setItem('haoge_prequel_seen', '1'); } catch (e) {}
    }
    if (onCloseCb) {
      var cb = onCloseCb;
      onCloseCb = null;
      cb();
    }
  }

  function close(markSeen) {
    if (!isOpen || isClosing) return;
    isClosing = true;
    if (overlay) overlay.classList.add('is-closing');
    closeTimer = setTimeout(function () {
      finishClose(markSeen);
    }, 820);
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

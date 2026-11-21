window.Obstacles = (function () {
  var LANE_W = window.CONFIG.laneWidth;

  function box(w, h, d, color) {
    var m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color: color })
    );
    m.castShadow = true;
    return m;
  }

  function sphere(r, color, x, y, z) {
    var m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 10, 8),
      new THREE.MeshLambertMaterial({ color: color })
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    return m;
  }

  // 红白条纹雨棚贴图（市井瓜摊标配）
  function makeStripesTexture() {
    var c = document.createElement('canvas');
    c.width = 128;
    c.height = 64;
    var ctx = c.getContext('2d');
    for (var i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#d94f4f' : '#f2f2f2';
      ctx.fillRect(i * 16, 0, 16, 64);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // 带纹西瓜贴图（缓存一份复用）
  var cachedMelonTex = null;
  function getMelonTexture() {
    if (!cachedMelonTex) cachedMelonTex = melonTexture();
    return cachedMelonTex;
  }

  var cachedObstacleMelonTex = null;
  function getObstacleMelonTexture() {
    if (!cachedObstacleMelonTex) cachedObstacleMelonTex = melonTextureObstacle();
    return cachedObstacleMelonTex;
  }

  function makeSignTexture(text, bg, fg) {
    var c = document.createElement('canvas');
    c.width = 256;
    c.height = 96;
    var ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 244, 84);
    ctx.fillStyle = fg;
    ctx.font = 'bold 56px "Microsoft YaHei", "SimHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 54);
    var tex = new THREE.CanvasTexture(c);
    return tex;
  }

  function createCart() {
    var g = new THREE.Group();
    var body = box(1.15, 0.75, 0.65, 0x8a5a2b);
    body.position.y = 0.5;
    g.add(body);

    var melonMat = new THREE.MeshLambertMaterial({ map: getObstacleMelonTexture() });
    var cartMelons = [];
    for (var i = -1; i <= 1; i++) {
      var mel = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), melonMat);
      mel.position.set(i * 0.3, 1.02, 0);
      mel.castShadow = true;
      g.add(mel);
      cartMelons.push(mel);
    }

    var poleH = 1.45;
    [-0.52, 0.52].forEach(function (px) {
      var pole = box(0.07, poleH, 0.07, 0x4a4a4a);
      pole.position.set(px, poleH / 2, 0);
      g.add(pole);
    });
    var canopy = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.08, 0.95),
      new THREE.MeshLambertMaterial({ map: makeStripesTexture() })
    );
    canopy.position.y = poleH + 0.04;
    g.add(canopy);

    // 招牌：郝哥瓜摊
    var sign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.3),
      new THREE.MeshBasicMaterial({
        map: makeSignTexture('郝哥瓜摊', '#f7d154', '#7a1f1f'),
        side: THREE.DoubleSide,
      })
    );
    sign.position.set(0, poleH + 0.18, 0.49);
    g.add(sign);

    // 杆秤（保熟名场面道具）
    var scaleMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var scaleBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.2), scaleMat);
    scaleBase.position.y = 0.9;
    g.add(scaleBase);
    var scaleRod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.52, 6), scaleMat);
    scaleRod.position.set(0.12, 1.17, 0);
    g.add(scaleRod);
    var scalePan = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 8), scaleMat);
    scalePan.position.set(0.12, 1.44, 0);
    g.add(scalePan);

    // 摊上放一把西瓜刀
    var knifeBlade = box(0.05, 0.06, 0.36, 0xc8ccd0);
    knifeBlade.position.set(-0.3, 0.93, 0.12);
    g.add(knifeBlade);
    var knifeHandle = box(0.05, 0.08, 0.16, 0x5d4037);
    knifeHandle.position.set(-0.3, 0.93, 0.34);
    g.add(knifeHandle);

    var wheelGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.09, 10);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    [-0.45, 0.45].forEach(function (px) {
      var w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(px, 0.16, 0.35);
      g.add(w);
      var w2 = w.clone();
      w2.position.z = -0.35;
      g.add(w2);
    });

    g.scale.set(1.3, 1.3, 1.3);
    g.userData = { kind: 'cart', clearY: 1.53, melons: cartMelons };
    return g;
  }

  function createPole() {
    var g = new THREE.Group();
    var span = LANE_W * 3.2;
    [-span / 2 + 0.4, span / 2 - 0.4].forEach(function (px) {
      var post = box(0.12, 2.1, 0.12, 0x6b4f2a);
      post.position.set(px, 1.05, 0);
      g.add(post);
    });
    // 碰撞只认这根横杆：中心 y=1.62、厚 0.09，与 config 的 poleBarZone/poleJumpClear 对应
    var bar = box(span, 0.09, 0.09, 0x8a5a2b);
    bar.position.y = 1.62;
    g.add(bar);

    var colors = [0xe74c3c, 0x3498db, 0xf1c40f, 0x9b59b6, 0x2ecc71];
    for (var i = 0; i < 5; i++) {
      var cloth = box(0.42, 0.52, 0.04, colors[i % colors.length]);
      cloth.position.set(-span / 2 + 0.8 + i * ((span - 1.6) / 4), 1.42, 0);
      g.add(cloth);
    }

    g.scale.set(1.3, 1.3, 1.3);
    g.userData = { kind: 'pole', clearY: 1.95 };
    return g;
  }

  // 瓜摊：横跨三道的长条摊位，前后封板封死，只能跳跃越过
  function createStall() {
    var g = new THREE.Group();
    var span = LANE_W * 3.2; // 5.44，盖住全部三条车道
    // 台面
    var table = box(span, 0.14, 1.35, 0x8a5a2b);
    table.position.y = 1.02;
    g.add(table);
    // 前后封板（从地面到台面：直跑、滑铲都过不去）
    var front = box(span, 1.0, 0.08, 0x6e4f2c);
    front.position.set(0, 0.5, -0.55);
    g.add(front);
    var back = box(span, 1.0, 0.08, 0x6e4f2c);
    back.position.set(0, 0.5, 0.55);
    g.add(back);
    // 两侧立柱
    [-span / 2 + 0.2, span / 2 - 0.2].forEach(function (px) {
      var post = box(0.14, 2.15, 0.14, 0x5d4037);
      post.position.set(px, 1.08, 0);
      g.add(post);
    });
    // 台上堆西瓜
    var melonMat = new THREE.MeshLambertMaterial({ map: getObstacleMelonTexture() });
    var melonGeo = new THREE.SphereGeometry(0.25, 14, 12);
    var stallMelons = [];
    [-2.0, -0.7, 0.5, 1.7].forEach(function (px) {
      var m = new THREE.Mesh(melonGeo, melonMat);
      m.position.set(px, 1.32, 0);
      m.castShadow = true;
      g.add(m);
      stallMelons.push(m);
    });
    // 侧边招牌
    var sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.4),
      new THREE.MeshBasicMaterial({
        map: makeSignTexture('瓜摊', '#f7d154', '#7a1f1f'),
        side: THREE.DoubleSide,
      })
    );
    sign.position.set(-span / 2 - 0.5, 1.9, 0);
    g.add(sign);
    var signPole = box(0.08, 1.5, 0.08, 0x5d4037);
    signPole.position.set(-span / 2 - 0.5, 0.9, 0);
    g.add(signPole);

    g.scale.set(1.3, 1.3, 1.3);
    g.userData = { kind: 'stall', clearY: 1.95, melons: stallMelons };
    return g;
  }

  function createPile() {
    var g = new THREE.Group();
    var melonMat = new THREE.MeshLambertMaterial({ map: getObstacleMelonTexture() });
    var melonGeo = new THREE.SphereGeometry(0.26, 14, 12);
    var pileMelons = [];
    [-0.6, 0, 0.6].forEach(function (x) {
      var m = new THREE.Mesh(melonGeo, melonMat);
      m.position.set(x, 0.26, 0);
      m.castShadow = true;
      g.add(m);
      pileMelons.push(m);
    });
    var top = new THREE.Mesh(melonGeo, melonMat);
    top.position.set(-0.2, 0.66, 0);
    top.castShadow = true;
    g.add(top);
    pileMelons.push(top);
    var top2 = new THREE.Mesh(melonGeo, melonMat);
    top2.position.set(0.25, 0.74, 0.1);
    top2.castShadow = true;
    g.add(top2);
    pileMelons.push(top2);

    g.scale.set(1.3, 1.3, 1.3);
    g.userData = { kind: 'pile', clearY: 1.01, melons: pileMelons };
    return g;
  }

  function createPerson() {
    var g = new THREE.Group();
    function pStd(color, opts) {
      return new THREE.MeshStandardMaterial(
        Object.assign({ color: color, roughness: 0.8, metalness: 0 }, opts || {})
      );
    }
    var skin = pStd(0x5e4231, { roughness: 0.58 });
    var red = pStd(0xd94f4f, { roughness: 0.85 });
    var purple = pStd(0x8e44ad, { roughness: 0.88 });
    var dark = pStd(0x4a3b33, { roughness: 0.9 });
    var basketMat = pStd(0x795548, { roughness: 0.9 });
    var hairMat = pStd(0x555555, { roughness: 0.8 });
    var eyeWhite = pStd(0xfdfcf9, { roughness: 0.28 });
    var eyeIris = pStd(0x3a2a20, { roughness: 0.35 });
    var mouthMat = pStd(0x6e2c26, { roughness: 0.6 });

    var shoeL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), dark);
    shoeL.scale.set(1, 0.55, 1.35);
    shoeL.position.set(-0.13, 0.06, 0.03);
    g.add(shoeL);
    var shoeR = shoeL.clone();
    shoeR.position.x = 0.13;
    g.add(shoeR);

    var legL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.3, 10), dark);
    legL.position.set(-0.13, 0.22, 0);
    g.add(legL);
    var legR = legL.clone();
    legR.position.x = 0.13;
    g.add(legR);

    var skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 0.44, 16), purple);
    skirt.position.y = 0.52;
    skirt.castShadow = true;
    g.add(skirt);

    var body = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), red);
    body.scale.set(1, 1.05, 0.82);
    body.position.y = 0.98;
    body.castShadow = true;
    g.add(body);

    function makeArm(x) {
      var a = new THREE.Group();
      a.position.set(x, 1.08, 0);
      var upper = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.32, 10), red);
      upper.position.y = -0.16;
      upper.castShadow = true;
      a.add(upper);
      var fore = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.22, 10), red);
      fore.position.y = -0.42;
      fore.castShadow = true;
      a.add(fore);
      var hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), skin);
      hand.position.set(0, -0.54, 0.02);
      hand.castShadow = true;
      a.add(hand);
      a.rotation.z = x < 0 ? 0.35 : -0.35;
      return a;
    }
    var armL = makeArm(-0.36);
    var armR = makeArm(0.36);
    g.add(armL);
    g.add(armR);

    var head = new THREE.Group();
    head.position.set(0, 1.42, 0);
    var skull = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), skin);
    skull.scale.set(1, 1.05, 0.95);
    skull.position.y = 0.08;
    skull.castShadow = true;
    head.add(skull);
    var hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.165, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      hairMat
    );
    hair.position.y = 0.22;
    hair.castShadow = true;
    head.add(hair);
    var bun = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), hairMat);
    bun.position.set(0, 0.33, 0.02);
    bun.castShadow = true;
    head.add(bun);

    function makePersonEye(x) {
      var e = new THREE.Group();
      e.position.set(x, 0.12, 0.14);
      var white = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), eyeWhite);
      white.scale.set(1, 1.3, 0.5);
      e.add(white);
      var iris = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), eyeIris);
      iris.position.set(0, 0.003, 0.02);
      e.add(iris);
      return e;
    }
    var eyeL = makePersonEye(-0.055);
    var eyeR = makePersonEye(0.055);
    head.add(eyeL);
    head.add(eyeR);

    var browL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), hairMat);
    browL.position.set(-0.055, 0.185, 0.135);
    browL.rotation.z = 0.08;
    head.add(browL);
    var browR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), hairMat);
    browR.position.set(0.055, 0.185, 0.135);
    browR.rotation.z = -0.08;
    head.add(browR);

    var mouthClosed = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.014, 0.02), mouthMat);
    mouthClosed.position.set(0, -0.03, 0.145);
    head.add(mouthClosed);
    var mouthOpen = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), mouthMat);
    mouthOpen.scale.set(1, 1.35, 0.5);
    mouthOpen.position.set(0, -0.035, 0.14);
    mouthOpen.visible = false;
    head.add(mouthOpen);

    var basket = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.28), basketMat);
    basket.position.set(0.42, 0.72, 0.18);
    basket.castShadow = true;
    g.add(basket);
    var basketHandle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 6, 10), basketMat);
    basketHandle.rotation.y = Math.PI / 2;
    basketHandle.position.set(0.42, 0.88, 0.18);
    basketHandle.castShadow = true;
    g.add(basketHandle);

    g.scale.set(1.3, 1.3, 1.3);
    g.userData = {
      kind: 'person',
      clearY: 99,
      head: head,
      leftArm: armL,
      rightArm: armR,
      faceControls: {
        browL: browL,
        browR: browR,
        eyeL: eyeL,
        eyeR: eyeR,
        mouthClosed: mouthClosed,
        mouthOpen: mouthOpen,
      },
    };
    return g;
  }

  function setPersonFace(person, scared) {
    var c = person && person.userData && person.userData.faceControls;
    if (!c) return;
    c.mouthClosed.visible = !scared;
    c.mouthOpen.visible = !!scared;
    c.browL.rotation.z = scared ? -0.35 : 0.08;
    c.browR.rotation.z = scared ? 0.35 : -0.08;
    var s = scared ? 1.3 : 1;
    c.eyeL.scale.set(1, s, 1);
    c.eyeR.scale.set(1, s, 1);
  }

  // 横穿三轮车：沿 x 轴横穿三条车道，矮车可跳过，也可看准空隙换道
  function createTricycle() {
    var g = new THREE.Group();
    var body = box(1.6, 0.42, 0.9, 0x2f6f8f);
    body.position.y = 0.5;
    g.add(body);
    var bed = box(1.2, 0.26, 0.72, 0x8a5a2b);
    bed.position.set(-0.15, 0.68, 0);
    g.add(bed);
    var melonMat = new THREE.MeshLambertMaterial({ map: getObstacleMelonTexture() });
    [-0.45, -0.1].forEach(function (px) {
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), melonMat);
      m.position.set(px, 0.95, 0);
      m.castShadow = true;
      g.add(m);
    });
    var post = box(0.06, 0.5, 0.06, 0x333333);
    post.position.set(0.55, 1.1, 0);
    g.add(post);
    var bar = box(0.06, 0.06, 0.7, 0x333333);
    bar.position.set(0.55, 1.32, 0);
    g.add(bar);
    var wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.08, 14);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x1c1c1c });
    var front = new THREE.Mesh(wheelGeo, wheelMat);
    front.rotation.x = Math.PI / 2;
    front.position.set(0.72, 0.26, 0);
    g.add(front);
    [-0.35, 0.35].forEach(function (pz) {
      var w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(-0.62, 0.26, pz);
      g.add(w);
    });

    g.scale.set(1.3, 1.3, 1.3);
    g.userData = { kind: 'tricycle', clearY: window.CONFIG.tricycleClearY };
    return g;
  }

  function melonTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#2e8b3d';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#1d5c28';
    ctx.lineWidth = 10;
    for (var i = 0; i < 5; i++) {
      var y = 16 + i * 24;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(32, y - 16, 96, y + 16, 128, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.ellipse(34, 30, 22, 12, -0.5, 0, Math.PI * 2);
    ctx.fill();
    var tex = new THREE.CanvasTexture(c);
    return tex;
  }

  // 障碍西瓜：暗绿 + 斑驳，与发光的奖励西瓜明显区分
  function melonTextureObstacle() {
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#3f6b31';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#263f1c';
    ctx.lineWidth = 10;
    for (var i = 0; i < 5; i++) {
      var y = 16 + i * 24;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(32, y - 16, 96, y + 16, 128, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(58, 46, 28, 0.28)';
    ctx.beginPath(); ctx.arc(28, 42, 12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(96, 88, 15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(66, 26, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(30, 40, 20, 0.35)';
    ctx.beginPath(); ctx.arc(104, 34, 9, 0, Math.PI * 2); ctx.fill();
    return new THREE.CanvasTexture(c);
  }

  function createMelon(gold) {
    var g = new THREE.Group();
    var mat;
    if (gold) {
      mat = new THREE.MeshLambertMaterial({
        color: 0xffd700,
        emissive: 0x664400,
      });
    } else {
      mat = new THREE.MeshLambertMaterial({
        map: getMelonTexture(),
        emissive: 0x1d5c28,
        emissiveIntensity: 0.15,
      });
    }
    var m = new THREE.Mesh(new THREE.SphereGeometry(0.39, 16, 12), mat);
    m.castShadow = true;
    g.add(m);
    g.userData = { kind: gold ? 'gold' : 'melon', melonMesh: m };
    return g;
  }

  function createCert() {
    var g = new THREE.Group();
    var plaque = box(0.36, 0.46, 0.06, 0xc9a227);
    plaque.position.y = 0.25;
    g.add(plaque);
    var ribbon = box(0.42, 0.08, 0.06, 0xd94f4f);
    ribbon.position.y = 0.48;
    g.add(ribbon);
    g.scale.set(1.3, 1.3, 1.3);
    g.userData = { kind: 'cert' };
    return g;
  }

  // 劈瓜演出：西瓜裂成两个开口朝向镜头的半瓜
  function createSplitMelonPair(radius, position) {
    var g = new THREE.Group();
    g.position.copy(position || new THREE.Vector3(0, 0, 0));
    g.userData.splitPart = true;
    var melonMat = new THREE.MeshLambertMaterial({ map: getMelonTexture() });
    var fleshMat = new THREE.MeshLambertMaterial({ color: 0xe53935 });
    function halfMesh(tilt, offsetX, offsetZ) {
      var hg = new THREE.Group();
      var dome = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 12, 10, 0, Math.PI * 2, 0, Math.PI),
        melonMat
      );
      dome.castShadow = true;
      hg.add(dome);
      var flesh = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.92, 12), fleshMat);
      flesh.rotation.x = Math.PI / 2;
      hg.add(flesh);
      hg.rotation.x = tilt;
      hg.position.set(offsetX, 0, offsetZ);
      hg.userData.splitPart = true;
      return hg;
    }
    g.add(halfMesh(0.55, -radius * 0.5, 0.06));
    g.add(halfMesh(0.95, radius * 0.5, -0.06));
    return g;
  }

  // 劈瓜时的果汁粒子
  function createJuiceBurst(position, count) {
    var g = new THREE.Group();
    g.position.copy(position || new THREE.Vector3(0, 0, 0));
    g.userData.splitPart = true;
    var colors = [0xe53935, 0xc62828, 0x2e8b3d, 0xfff8e1];
    for (var i = 0; i < (count || 8); i++) {
      var s = new THREE.Mesh(
        new THREE.SphereGeometry(0.045 + Math.random() * 0.06, 6, 6),
        new THREE.MeshLambertMaterial({ color: colors[i % colors.length] })
      );
      s.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2.34,
        1.43 + Math.random() * 2.21,
        (Math.random() - 0.5) * 2.34
      );
      s.userData.life = 0.5 + Math.random() * 0.4;
      g.add(s);
    }
    return g;
  }

  return {
    createCart: createCart,
    createPole: createPole,
    createStall: createStall,
    createPile: createPile,
    createPerson: createPerson,
    setPersonFace: setPersonFace,
    createTricycle: createTricycle,
    createMelon: createMelon,
    createCert: createCert,
    createSplitMelonPair: createSplitMelonPair,
    createJuiceBurst: createJuiceBurst,
    makeStripesTexture: makeStripesTexture,
    melonTexture: getMelonTexture,
  };
})();

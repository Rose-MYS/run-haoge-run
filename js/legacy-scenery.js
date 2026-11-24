window.LegacyScenery = (function () {
  'use strict';

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


  function createSideProps(scene) {
    var list = [];
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
      list.push(sp);
      sp.position.set(0, 0, 0);
      respawnSideProp(sp);
    }
    return list;
  }

  return {
    THEMES: THEMES,
    THEME_AT: THEME_AT,
    makeGroundTexture: makeGroundTexture,
    respawnSideProp: respawnSideProp,
    createSideProps: createSideProps,
  };
})();

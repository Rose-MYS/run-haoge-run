window.StreetItems = (function () {
  'use strict';

  var surfaces;
  var unitBox;
  var wheelMesh;
  var rimMesh;

  function material(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: .78 }, extra));
  }

  function bitmap(width, height, paint) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    paint(canvas.getContext('2d'));
    var map = new THREE.CanvasTexture(canvas);
    map.encoding = THREE.sRGBEncoding;
    return map;
  }

  function rind(spoiled) {
    return bitmap(256, 128, function (ctx) {
      var im = ctx.createImageData(256, 128);
      var seed = 419;
      var base = spoiled === 'gold' ? [159, 94, 39] : spoiled ? [44, 66, 27] : [58, 113, 57];
      for (var y = 0; y < 128; y++) {
        for (var x = 0; x < 256; x++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          var u = x / 256 * 2 * Math.PI;
          var vein = Math.sin(u * 8 + .54 * Math.sin(y * .081 + u * 3) + .25 * Math.cos(y * .29 + u * 14));
          var stripe = Math.max(0, Math.min(1, vein * 2.6 + .3));
          var grain = ((seed >>> 28) - 7) * .9;
          var patch = spoiled === true ? 18 * Math.max(0, Math.cos(u * 3 + y * .08)) : 0;
          var i = (y * 256 + x) * 4;
          im.data[i] = base[0] + stripe * 42 + grain + patch;
          im.data[i + 1] = base[1] + stripe * 53 + grain - patch;
          im.data[i + 2] = base[2] + stripe * 12 + grain;
          im.data[i + 3] = 255;
        }
      }
      ctx.putImageData(im, 0, 0);
    });
  }

  function wood() {
    return bitmap(128, 128, function (ctx) {
      ctx.fillStyle = '#937252';
      ctx.fillRect(0, 0, 128, 128);
      for (var y = 0; y < 128; y++) {
        ctx.strokeStyle = y % 6 === 0 ? '#5d44328c' : '#e4c39b47';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(42, y - 8, 70, y + 6, 128, y);
        ctx.stroke();
      }
    });
  }

  function ticket() {
    return bitmap(256, 192, function (ctx) {
      ctx.fillStyle = '#eddaa6';
      ctx.fillRect(0, 0, 256, 192);
      ctx.fillStyle = '#244337';
      ctx.fillRect(0, 0, 256, 36);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#244337';
      ctx.strokeRect(8, 8, 240, 176);
      ctx.fillStyle = '#f8e7ba';
      ctx.textAlign = 'center';
      ctx.font = 'bold 21px SimSun, serif';
      ctx.fillText('瓜摊验货凭证', 128, 27);
      ctx.fillStyle = '#254a3c';
      ctx.font = 'bold 69px KaiTi, SimSun, serif';
      ctx.fillText('保熟', 128, 122);
      ctx.save();
      ctx.translate(196, 143);
      ctx.rotate(-.18);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#9b3a2b';
      ctx.strokeRect(-26, -14, 52, 31);
      ctx.fillStyle = '#9b3a2b';
      ctx.font = 'bold 16px SimSun, serif';
      ctx.fillText('已验', 0, 8);
      ctx.restore();
    });
  }

  function getSurfaces() {
    if (surfaces) return surfaces;
    unitBox = new THREE.BoxGeometry(1, 1, 1);
    wheelMesh = new THREE.TorusGeometry(.24, .045, 7, 18);
    rimMesh = new THREE.TorusGeometry(.207, .014, 5, 18);
    surfaces = {
      boards: material(0xffffff, { map: wood() }),
      darkWood: material(0x593f31),
      tire: material(0x212728),
      metal: material(0x68736d, { metalness: .38, roughness: .50 }),
      enamel: material(0x466d62, { metalness: .16 }),
      warning: material(0xbd633e, { emissive: 0x4b2013, emissiveIntensity: .24 }),
      cream: material(0xc3ae84),
      rust: material(0x81513e),
      cloth: material(0x9aaba0, { side: THREE.DoubleSide }),
      canvas: material(0xb39067, { side: THREE.DoubleSide }),
      fresh: material(0xffffff, { map: rind(false), roughness: .38, emissive: 0x3d6036, emissiveIntensity: .22 }),
      cargo: material(0xffffff, { map: rind(true), roughness: .86 }),
      gold: material(0xffffff, {
        metalness: .38, roughness: .36, emissive: 0x945912, emissiveIntensity: .6, map: rind('gold'),
      }),
      goldTrim: new THREE.MeshBasicMaterial({ color: 0xffcd72 }),
      greenTrim: new THREE.MeshBasicMaterial({ color: 0xc4eb9a }),
      ticket: material(0xffffff, { map: ticket(), roughness: .55, side: THREE.DoubleSide }),
      flesh: material(0xc44e40),
      innerRind: material(0xc4c886),
      seed: material(0x302e26),
    };
    return surfaces;
  }

  function mesh(parent, geometry, surface, x, y, z) {
    var node = new THREE.Mesh(geometry, surface);
    node.castShadow = node.receiveShadow = true;
    node.position.set(x, y, z);
    parent.add(node);
    return node;
  }

  function box(parent, surface, x, y, z, w, h, d, pitch) {
    var node = mesh(parent, unitBox, surface, x, y, z);
    node.scale.set(w, h, d);
    if (pitch) node.rotation.x = pitch;
    return node;
  }

  function beam(parent, surface, a, b, width) {
    var direction = new THREE.Vector3().subVectors(b, a);
    var mid = a.clone().lerp(b, .5);
    var node = box(parent, surface, mid.x, mid.y, mid.z, width, direction.length(), width);
    node.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return node;
  }

  function melon(parent, surface, radius, x, y, z) {
    var fruit = mesh(parent, new THREE.SphereGeometry(radius, 20, 14), surface, x, y, z);
    // Keep the same radius used by the split effect.
    fruit.rotation.y = x * .7;
    return fruit;
  }

  function wheel(g, x, y, z, side, spokes) {
    var m = getSurfaces();
    var node = new THREE.Group();
    node.position.set(x, y, z);
    if (side) node.rotation.y = Math.PI / 2;
    g.add(node);
    mesh(node, wheelMesh, m.tire, 0, 0, 0);
    var rim = mesh(node, rimMesh, m.metal, 0, 0, 0);
    rim.castShadow = false;
    for (var j = 0; j < spokes; j++) {
      var spoke = box(node, m.metal, 0, 0, 0, .014, .405, .016);
      spoke.rotation.z = j * Math.PI / spokes;
    }
    box(node, m.metal, 0, 0, 0, .09, .09, .11);
    return node;
  }

  function reflector(group, x, y, z, width) {
    var m = getSurfaces();
    box(group, m.darkWood, x, y, z, width + .04, .115, .027);
    box(group, m.warning, x, y, z + Math.sign(z) * .018, width, .077, .012);
  }

  function cart() {
    var m = getSurfaces(), g = new THREE.Group(), cargo = [];
    box(g, m.darkWood, 0, .45, 0, 1.46, .12, .91);
    for (var j = 0; j < 3; j++) {
      var y = .54 + j * .115;
      for (var side = -1; side <= 1; side += 2) {
        box(g, m.boards, 0, y, side * .44, 1.48, .105, .045);
        box(g, m.boards, side * .71, y, 0, .05, .105, .91);
      }
    }
    for (var x = -1; x <= 1; x += 2) {
      for (var z = -1; z <= 1; z += 2) box(g, m.enamel, x * .68, .63, z * .40, .075, .61, .075);
      wheel(g, x * .65, .29, .04, true, 5);
      box(g, m.enamel, x * .56, .77, .64, .045, .045, .62);
    }
    box(g, m.enamel, 0, .78, .96, 1.15, .048, .055);
    box(g, m.canvas, .52, 1.07, .02, .31, .15, .69, .10);
    [-.47, .0, .46].forEach(function (x, i) {
      cargo.push(melon(g, m.cargo, .235, x, 1.00 + (i === 1 ? .05 : 0), -.10));
    });
    [-1, 1].forEach(function (side) {
      reflector(g, -.50, .54, side * .469, .20);
      reflector(g, .50, .54, side * .469, .20);
    });
    g.userData = { kind: 'cart', melons: cargo };
    return g;
  }

  function pole() {
    var m = getSurfaces(), g = new THREE.Group();
    var span = CONFIG.laneWidth * 4.16;
    for (var side = -1; side <= 1; side += 2) {
      box(g, m.rust, side * (span / 2 - .50), 1.34, 0, .12, 2.68, .14);
      box(g, m.cream, side * (span / 2 - .50), .16, 0, .34, .32, .34);
    }
    box(g, m.darkWood, 0, 2.10, 0, span, .115, .12);
    for (var i = 0; i < 6; i++) {
      var x = (i - 2.5) * 1.01;
      var h = i % 2 ? .35 : .57;
      var laundry = box(g, i % 2 ? m.cloth : m.canvas, x, 2.08 - h / 2, .045, .78, h, .031);
      laundry.rotation.z = (i % 3 - 1) * .068;
      box(g, m.metal, x - .26, 2.09, .10, .041, .085, .052);
      box(g, m.metal, x + .25, 2.09, .10, .041, .085, .052);
    }
    reflector(g, -span * .38, 2.11, -.079, .49);
    reflector(g, span * .38, 2.11, .079, .49);
    g.userData.kind = 'pole';
    return g;
  }

  function stall() {
    var m = getSurfaces(), g = new THREE.Group(), cargo = [];
    var width = CONFIG.laneWidth * 4.16;
    box(g, m.boards, 0, 1.33, 0, width, .16, 1.66);
    box(g, m.darkWood, 0, 1.23, 0, width, .16, 1.68);
    for (var side = -1; side <= 1; side += 2) {
      for (var plank = 0; plank < 5; plank++) {
        box(g, plank % 2 ? m.rust : m.boards, 0, .15 + plank * .215, side * .745, width - .02, .20, .083);
      }
      for (var i = -1; i <= 1; i++) {
        box(g, m.enamel, i * (width / 2 - .14), .64, side * .754, .10, 1.29, .12);
        reflector(g, i * (width / 2 - .38), 1.18, side * .85, .42);
      }
    }
    [-2.55, -1.25, .0, 1.26, 2.52].forEach(function (x, i) {
      cargo.push(melon(g, m.cargo, .233, x, 1.65, (i % 2 - .5) * .30));
    });
    g.userData = { kind: 'stall', melons: cargo };
    return g;
  }

  function pile() {
    var m = getSurfaces(), g = new THREE.Group(), cargo = [];
    box(g, m.darkWood, 0, .12, .03, 1.65, .24, 1.04);
    for (var side = -1; side <= 1; side += 2) {
      box(g, m.boards, 0, .28, side * .49, 1.68, .18, .055);
      box(g, m.boards, side * .815, .25, 0, .055, .15, .98);
    }
    [[-.53,.39,-.13],[0,.40,-.20],[.53,.40,-.14],[-.32,.43,.29],[.26,.43,.28],[.02,.75,-.02]].forEach(function (p) {
      cargo.push(melon(g, m.cargo, .263, p[0], p[1], p[2]));
    });
    reflector(g, 0, .28, -.534, .24);
    g.userData = { kind: 'pile', melons: cargo };
    return g;
  }

  function tricycle() {
    var m = getSurfaces(), g = new THREE.Group();
    var forward = new THREE.Group();
    g.add(forward);
    var spinning = [wheel(forward, .96, .29, 0, false, 5)];
    for (var z = -1; z <= 1; z += 2) {
      spinning.push(wheel(forward, -.76, .29, z * .44, false, 5));
      box(forward, m.enamel, -.50, .62, z * .43, 1.37, .33, .07);
      box(forward, m.boards, -.51, .76, z * .46, 1.41, .085, .10);
    }
    box(forward, m.enamel, -.59, .45, 0, 1.57, .125, .90);
    box(forward, m.enamel, -1.24, .61, 0, .085, .35, .87);
    beam(forward, m.enamel, new THREE.Vector3(-.03,.46,0), new THREE.Vector3(.69,.78,0), .11);
    beam(forward, m.metal, new THREE.Vector3(.96,.30,0), new THREE.Vector3(.67,1.03,0), .07);
    box(forward, m.tire, .17, .83, 0, .34, .10, .30);
    box(forward, m.metal, .67, 1.05, 0, .055, .071, .62);
    box(forward, m.cream, .77, .81, 0, .109, .13, .14);
    reflector(forward, -1.18, .57, -.463, .18);
    reflector(forward, -1.18, .57, .463, .18);
    melon(forward, m.cargo, .196, -.75, .74, -.20);
    melon(forward, m.cargo, .196, -.30, .74, .13);
    g.userData = { kind: 'tricycle', forward: forward, wheels: spinning };
    return g;
  }

  function person() {
    return window.StreetPedestrian.create();
  }

  function pickup(gold) {
    var m = getSurfaces(), g = new THREE.Group();
    var fruit = melon(g, gold ? m.gold : m.fresh, .385, 0, 0, 0);
    var ring = mesh(fruit, new THREE.TorusGeometry(.48, .023, 6, 32), gold ? m.goldTrim : m.greenTrim, 0, -.25, 0);
    ring.rotation.x = -Math.PI / 2;
    ring.castShadow = false;
    if (gold) {
      var fin = box(fruit, m.goldTrim, 0, .43, 0, .13, .13, .13);
      fin.rotation.z = Math.PI / 4;
      fin.castShadow = false;
    } else {
      box(fruit, m.darkWood, .015, .39, 0, .054, .095, .049).rotation.z = -.4;
    }
    g.userData = { kind: gold ? 'gold' : 'melon', melonMesh: fruit };
    return g;
  }

  function cert() {
    var m = getSurfaces(), g = new THREE.Group();
    box(g, m.darkWood, 0, .17, 0, .76, .58, .045);
    var front = new THREE.PlaneGeometry(.71, .53);
    mesh(g, front, m.ticket, 0, .17, .025);
    var back = mesh(g, front, m.ticket, 0, .17, -.025);
    back.rotation.y = Math.PI;
    g.userData.kind = 'cert';
    return g;
  }

  function split(radius, position) {
    var m = getSurfaces(), g = new THREE.Group();
    g.position.copy(position);
    g.userData.splitPart = true;
    for (var side = -1; side <= 1; side += 2) {
      var half = new THREE.Group();
      half.position.x = side * radius * .59;
      half.rotation.set(.35, 0, -side * .63);
      g.add(half);
      mesh(half, new THREE.SphereGeometry(radius, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        m.cargo, 0, 0, 0);
      mesh(half, new THREE.CircleGeometry(radius * .97, 24), m.innerRind, 0, 0, 0).rotation.x = -Math.PI / 2;
      mesh(half, new THREE.CircleGeometry(radius * .85, 24), m.flesh, 0, .002, 0).rotation.x = -Math.PI / 2;
      for (var i = 0; i < 8; i++) {
        var theta = (i / 8) * Math.PI * 2;
        var seed = box(half, m.seed, Math.cos(theta) * radius * .60, .006,
          Math.sin(theta) * radius * .60, radius * .055, .008, radius * .082);
        seed.rotation.y = theta;
      }
    }
    return g;
  }

  function icon(kind) {
    if (kind === 'cert') return getSurfaces().ticket.map.image.toDataURL();
    var gold = kind === 'gold';
    var shade = gold ? '#8e4e25' : '#385636';
    var light = gold ? '#ffce86' : '#b0c77e';
    var trim = gold ? '#efb554' : '#9db86f';
    return bitmap(64, 64, function (ctx) {
      var body = ctx.createRadialGradient(23, 20, 4, 33, 33, 27);
      body.addColorStop(0, light);
      body.addColorStop(1, shade);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(32, 32, 21, 21, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = shade;
      ctx.lineWidth = 3.2;
      for (var i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(31 + i * 5, 10);
        ctx.bezierCurveTo(34 + i * 15, 25, 27 + i * 13, 38, 32 + i * 4, 53);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = trim;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(32, 47, 24, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }).image.toDataURL();
  }

  return { cart: cart, pole: pole, stall: stall, pile: pile, person: person, tricycle: tricycle,
    pickup: pickup, cert: cert, split: split, icon: icon };
})();

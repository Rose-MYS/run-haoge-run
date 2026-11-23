window.StreetArt = (function () {
  'use strict';

  function surface(color, pattern, meters) {
    var canvas = document.createElement('canvas');
    var size = 256;
    canvas.width = canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    var image = ctx.getImageData(0, 0, size, size);
    var seed = 937;
    var tau = Math.PI / 128;
    for (var y = 0; y < size; y++) {
      var row = y >> 4;
      for (var x = 0; x < size; x++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        var dust = (seed >>> 28) - 7;
        var stain = 5 * Math.sin(x * tau * 2 + Math.cos(y * tau * 2)) +
          4 * Math.sin(x * tau * 3 + 1.5 * Math.sin(y * tau * 3 + Math.cos(x * tau * 4)));
        var offset = 0;
        if (pattern === 'brick') {
          var brickX = (x + (row % 2) * 16) % size;
          var mortar = y % 16 < 2 || brickX % 32 < 2;
          offset = mortar ? 7 : (((brickX >> 5) * 47 + row * 81) % 26) - 15;
          if (!mortar && (y % 16 === 2 || brickX % 32 === 2)) offset -= 19;
        } else if (pattern === 'wood') {
          offset = Math.sin(y * tau * 39 + Math.sin(x * tau * 4)) * 8;
        } else if (pattern === 'metal') {
          var rib = y % 16;
          offset = rib < 2 ? -24 : rib < 5 ? 8 : 3 * Math.cos(rib * .3);
        } else if (pattern === 'glass') {
          offset = 14 * Math.sin((y + x * .5) * tau * .7) - 18 * Math.pow(y / size, 1.8);
        }
        var i = (y * size + x) * 4;
        for (var c = 0; c < 3; c++) image.data[i + c] += dust + stain + offset;
      }
    }
    ctx.putImageData(image, 0, 0);
    var texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 4;
    if (meters) texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    var material = new THREE.MeshLambertMaterial({ map: texture });
    material.userData.meters = meters;
    material.userData.distantColor = new THREE.Color(color);
    return material;
  }

  function sign(label, color, ink) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(7, 6, 242, 52);
    ctx.globalAlpha = .26;
    ctx.strokeRect(11, 10, 234, 44);
    for (var i = 0; i < 240; i++) {
      ctx.fillStyle = i % 3 ? color : ink;
      ctx.fillRect((i * 83) % 256, (i * 61) % 64, 1 + i % 3, 1);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = ink;
    ctx.font = 'bold 34px "Microsoft YaHei", SimHei, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 33, 228);
    var texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    var material = new THREE.MeshLambertMaterial({ map: texture });
    material.userData.distantColor = new THREE.Color(color);
    return material;
  }

  function create(parent, project, streetWidth, exits) {
    var campaign = exits.length > 0;
    var oldTownStart = campaign ? exits[1].from : 95;
    var alleyStart = campaign ? exits[2].from : 240;
    var lastBuilding = campaign ? exits[2].to + 86 : 510;
    function lam(color) { return new THREE.MeshLambertMaterial({ color: color }); }
    var m = {
      tile: surface('#595752', 'brick', 1.5), brick: surface('#784b3d', 'brick', 2.0),
      plaster: surface('#a59580', 'stone', 3.1), ivory: surface('#bcab8f', 'stone', 3.9),
      green: surface('#47574b', 'metal', 1.65),
      timber: surface('#604735', 'wood', 1.5), concrete: surface('#797d72', 'stone', 1.55),
      shade: lam(0x252d29), glass: surface('#455f60', 'glass'), rust: lam(0x714a38), cloth: lam(0xa69c7c),
      ochre: lam(0x9f7345), canvas: lam(0xb8ae91), awning: lam(0x576e5b), melon: lam(0x47634b),
      leaf: lam(0x526449), darkLeaf: lam(0x304534), china: lam(0xb8aa89),
      shutter: surface('#6b7263', 'metal', 1.65), power: lam(0x343b35),
    };
    var block = new THREE.BoxGeometry(1, 1, 1);
    var plane = new THREE.PlaneGeometry(1, 1);
    var round = new THREE.IcosahedronGeometry(1, 1);
    var tube = new THREE.CylinderGeometry(1, 1, 1, 8);
    var transform = new THREE.Object3D();
    var p = new THREE.Vector3(), n = new THREE.Vector3(), normal = new THREE.Matrix3();
    var distantWall = new THREE.MeshLambertMaterial({ vertexColors: true });

    function model(form, simplify) {
      var meshes = new Map();
      var distant = { position: [], normal: [], color: [] };
      function add(geo, mat, x, y, z, sx, sy, sz, tilt, yaw) {
        if (!meshes.has(mat)) meshes.set(mat, { position: [], normal: [], uv: [] });
        var dst = meshes.get(mat);
        transform.position.set(x, y, z);
        transform.rotation.set(tilt || 0, yaw || 0, 0);
        transform.scale.set(sx, sy, sz);
        transform.updateMatrix();
        normal.getNormalMatrix(transform.matrix);
        var attrs = geo.attributes;
        var count = geo.index ? geo.index.count : attrs.position.count;
        var keepAtDistance = simplify && (geo === plane || sx * sy * sz > .049);
        var tint = mat.userData.distantColor || mat.color;
        for (var i = 0; i < count; i++) {
          var index = geo.index ? geo.index.getX(i) : i;
          p.fromBufferAttribute(attrs.position, index).applyMatrix4(transform.matrix);
          n.fromBufferAttribute(attrs.normal, index).applyNormalMatrix(normal);
          dst.position.push(p.x, p.y, p.z);
          dst.normal.push(n.x, n.y, n.z);
          var u = attrs.uv.getX(index), v = attrs.uv.getY(index);
          var meters = mat.userData.meters;
          if (geo === block && meters) {
            var nx = Math.abs(attrs.normal.getX(index));
            var ny = Math.abs(attrs.normal.getY(index));
            u *= (nx ? sz : sx) / meters;
            v *= (ny ? sz : sy) / meters;
          }
          dst.uv.push(u, v);
          if (keepAtDistance) {
            distant.position.push(p.x, p.y, p.z);
            distant.normal.push(n.x, n.y, n.z);
            distant.color.push(tint.r, tint.g, tint.b);
          }
        }
      }
      form(
        function (mat, x, y, z, sx, sy, sz, tilt) {
          add(block, mat, x, y, z, sx, sy, sz, tilt);
        },
        function (mat, x, y, z, sx, sy, sz) { add(round, mat, x, y, z, sx, sy, sz); },
        function (mat, x, y, z, sx, sy, sz, tilt) { add(tube, mat, x, y, z, sx, sy, sz, tilt); },
        function (mat, x, y, z, sx, sy, yaw) { add(plane, mat, x, y, z, sx, sy, 1, 0, yaw); }
      );
      var geometry = null;
      if (distant.position.length) {
        geometry = new THREE.BufferGeometry();
        ['position', 'normal', 'color'].forEach(function (attr) {
          geometry.setAttribute(attr, new THREE.Float32BufferAttribute(distant[attr], 3));
        });
      }
      return { placements: [], distant: geometry, meshes: Array.from(meshes, function (entry) {
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(entry[1].position, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(entry[1].normal, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(entry[1].uv, 2));
        return { geo: geo, material: entry[0] };
      }) };
    }

    function windowAt(box, x, y, z, width, iron) {
      box(m.shade, x, y, z, width + .16, 1.04, .14);
      box(m.glass, x, y, z + .074, width - .035, .84, .026);
      box(m.concrete, x, y - .50, z + .095, width + .23, .10, .25);
      for (var side = -1; side <= 1; side += 2) {
        box(iron, x + side * width * .46, y, z + .092, .046, .91, .047);
        box(iron, x, y + side * .42, z + .092, width, .044, .048);
      }
      box(iron, x, y, z + .092, .042, .89, .047);
      box(iron, x, y + .15, z + .093, width, .033, .047);
    }

    function frontage(box, face, wall, width, floor, label, shutter, open) {
      var h = floor * 1.68 + .9;
      var street = 1.45;
      box(wall, 0, (h + 2.26) / 2, -.60, width, h - 2.26, 4);
      box(m.tile, 0, h + .09, -.55, width + .20, .17, 4.2);
      box(m.concrete, 0, h - .18, 1.432, width, .11, .14);
      box(m.shade, 0, 1.12, -1.0, width, 2.24, 3.12);
      for (var side = -1; side <= 1; side += 2) {
        box(wall, side * width * .423, 1.13, -.59, width * .154, 2.26, 4);
        box(m.brick, side * width * .421, .28, 1.425, width * .159, .56, .15);
        box(m.timber, side * width * .347, .95, street, .087, 1.86, .16);
      }
      box(m.concrete, 0, .09, 1.425, width, .18, .51);
      box(m.concrete, 0, 1.88, street, width, .14, .25);
      var doorHeight = open ? .46 : 1.67;
      box(shutter, 0, 1.81 - doorHeight / 2, street - .086, width * .69, doorHeight, .05);
      box(m.power, 0, 1.80 - doorHeight, street - .053, width * .69, .037, .034);
      if (open) {
        box(m.timber, -.43, .68, .92, width * .49, .15, .39);
        box(m.timber, .70, .38, 1.23, width * .31, .74, .33);
        box(m.concrete, .70, .77, 1.23, width * .33, .076, .42);
        for (var i = 0; i < 4; i++) {
          box(i % 3 ? m.ochre : m.green, -.62 - i * .32, .85, .89, .22, .18, .25);
        }
      }
      box(m.timber, 0, 2.14, street + .05, width * .76, .44, .13);
      face(label, 0, 2.14, street + .119, width * .73, .394);
      for (var level = 1; level < floor; level++) {
        for (var col = -1; col <= 1; col++) windowAt(box, col * width * .27, 1.23 + 1.63 * level, street, width * .145, m.power);
      }
      box(m.china, width * .36, 2.57, street + .24, .52, .36, .36);
      box(m.shade, width * .36, 2.57, street + .432, .30, .21, .028);
      box(m.rust, -width * .46, h * .50, street, .071, h * .90, .078);
      box(m.power, -width * .36, 2.45, street + .013, width * .19, .026, .037);
    }

    function canopy(box, width, fabric, hem, z) {
      box(fabric, 0, 2.10, z, width, .076, 1.26, .17);
      box(hem, 0, 1.94, z + .61, width, .17, .052);
      for (var side = -1; side <= 1; side += 2) {
        box(m.rust, side * width * .44, 1.88, z - .31, .044, .045, .71, -.36);
        box(m.timber, side * width * .46, 2.08, z, .044, .050, 1.29, .17);
      }
    }

    var fruit = sign('瓜 果 批 发', '#354b39', '#eddb9b');
    var produce = sign('街 口 小 卖 部', '#763d30', '#efdbab');
    var repairs = sign('自 行 车 修 理', '#d0ba83', '#4b4932');
    var noodles = sign('老 街 面 馆', '#4e513e', '#e6d1a8');
    var alleyName = sign('南 巷 里', '#43534f', '#ded5b8');
    var stallLabel = sign('瓜 果 时 蔬', '#813b2c', '#f3dfad');
    var haogeLabel = sign('郝 哥 瓜 摊', '#813b2c', '#f3dfad');
    var marketGate = sign('东 街 瓜 果 市 场', '#2b493b', '#e7d097');
    var marketHouse = model(function (box, ball, cylinder, face) {
      frontage(box, face, m.ivory, 6.0, 2, fruit, m.green, true);
      canopy(box, 5.45, m.awning, m.cloth, 2.07);
    }, true);
    var shop = model(function (box, ball, cylinder, face) {
      frontage(box, face, m.plaster, 6.2, 3, produce, m.shutter, true);
      box(m.brick, 0, 3.72, 1.456, 6.18, .37, .115);
      box(m.rust, 0, 1.95, 1.91, 5.42, .065, .92, .1);
      box(m.tile, -.6, 6.12, -.44, 4.2, .40, 3.8);
    }, true);
    var repair = model(function (box, ball, cylinder, face) {
      frontage(box, face, m.brick, 5.7, 2, repairs, m.shutter);
      box(m.green, 0, 1.87, 1.86, 4.6, .056, .84, .19);
      box(m.concrete, 0, 4.43, -.3, 5.12, .16, 3.84);
      box(m.rust, 1.8, 4.74, -.4, .72, .52, .56);
      box(m.shade, 1.8, 5.02, -.4, .82, .07, .65);
    }, true);
    var diner = model(function (box, ball, cylinder, face) {
      frontage(box, face, m.ivory, 6.55, 2, noodles, m.green, true);
      canopy(box, 6.20, m.canvas, m.ochre, 2.1);
      for (var i = -1; i <= 1; i++) {
        var x = i * .72 + .72;
        cylinder(m.timber, x, .16, 2.05, .10, .31, .10);
        cylinder(m.ochre, x, .345, 2.05, .19, .067, .19);
      }
      box(m.brick, -.75, .32, 2.17, 1.13, .64, .40);
      box(m.concrete, -.75, .64, 2.17, 1.24, .08, .47);
      cylinder(m.china, -.77, .705, 2.30, .13, .055, .13);
    }, true);
    var apartment = model(function (box, ball, cylinder) {
      var width = 5.7;
      box(m.plaster, 0, 3.05, -.6, width, 6.1, 4);
      box(m.brick, 0, .32, 1.413, width, .64, .094);
      box(m.concrete, 0, 1.17, 1.415, width, .10, .15);
      for (var f = 1; f <= 3; f++) {
        var y = f * 1.73;
        box(m.concrete, .29, y - .16, 1.67, 4.51, .19, .82);
        for (var bay = -1; bay <= 1; bay++) {
          windowAt(box, bay * 1.51, y + .48, 1.45, .88, m.rust);
        }
        for (var bar = -6; bar <= 6; bar++) box(m.power, .31 + bar * .33, y + .16, 2.07, .029, .61, .034);
        box(m.power, .3, y + .46, 2.07, 4.28, .048, .047);
        box(f === 2 ? m.green : m.cloth, .68 + f * .34, y + .27, 2.085, .66, .28, .024);
        cylinder(m.rust, -1.36, y + .07, 1.87, .13, .22, .12);
        ball(m.darkLeaf, -1.36, y + .21, 1.86, .21, .16, .16);
      }
      box(m.shade, -1.23, .83, 1.418, 1.14, 1.65, .10);
      box(m.green, -1.23, .87, 1.486, .95, 1.51, .06);
      box(m.timber, -1.03, .85, 1.54, .10, .031, .05);
      box(m.concrete, -1.23, .10, 1.57, 1.31, .20, .41);
      box(m.rust, 2.4, 3.10, 1.47, .092, 6.16, .11);
      box(m.power, 2.02, 2.88, 1.486, .77, .027, .037);
      box(m.tile, 0, 6.14, -.57, 5.91, .18, 4.29);
      box(m.concrete, -.66, 6.91, -.48, 2.36, 1.37, 1.94);
      box(m.tile, -.66, 7.63, -.48, 2.55, .12, 2.09);
    }, true);
    var alleyHouse = model(function (box, ball, cylinder, face) {
      box(m.ivory, 0, 1.57, -.55, 5.84, 3.14, 4.12);
      box(m.brick, 0, .38, 1.525, 5.84, .76, .10);
      box(m.tile, 0, 3.38, .48, 6.08, .16, 2.27, .29);
      box(m.tile, 0, 3.38, -1.64, 6.08, .16, 2.27, -.29);
      box(m.concrete, 0, 3.73, -.58, 6.14, .10, .20);
      box(m.shade, -.92, 1.03, 1.55, 1.29, 2.03, .13);
      box(m.green, -.92, 1.01, 1.622, 1.11, 1.86, .042);
      for (var rail = -2; rail <= 2; rail++) {
        box(m.power, -.92 + rail * .177, 1.24, 1.654, .031, 1.15, .036);
      }
      box(m.concrete, -.92, .076, 1.65, 1.58, .15, .49);
      box(m.concrete, -.92, .16, 1.53, 1.46, .16, .48);
      face(alleyName, -.92, 2.24, 1.587, 1.04, .23);
      windowAt(box, 1.27, 1.63, 1.55, .88, m.rust);
      box(m.power, 1.35, .74, 1.56, 1.74, .025, .039);
      box(m.concrete, 2.07, .98, 1.611, .27, .38, .17);
      cylinder(m.rust, .40, .15, 1.71, .18, .31, .17);
      ball(m.leaf, .40, .40, 1.68, .24, .22, .24);
    }, true);
    var courtyard = model(function (box, ball, cylinder) {
      box(m.brick, 0, .72, 1.28, 5.91, 1.44, .25);
      box(m.tile, 0, 1.46, 1.28, 5.99, .14, .35);
      for (var x = -1; x <= 1; x += 2) {
        box(m.brick, x * 2.82, .81, 1.32, .28, 1.62, .43);
        box(m.concrete, x * 2.82, 1.66, 1.32, .37, .11, .49);
      }
      cylinder(m.timber, .62, 1.75, -.30, .14, 3.5, .14, .12);
      cylinder(m.timber, .61, 2.68, .064, .077, 1.21, .072, .70);
      for (var layer = 0; layer < 3; layer++) {
        for (var n = 0; n < 8; n++) {
          var angle = n * 2.39 + layer;
          var radius = (1.38 - .37 * layer) * (.82 + .19 * Math.cos(n * 5));
          ball(n % 3 ? m.leaf : m.darkLeaf, .62 + Math.cos(angle) * radius,
            3.05 + .47 * layer + .26 * Math.sin(n * 3), -.35 + Math.sin(angle) * radius * .89,
            .40 + .11 * (n % 3), .43 + .09 * (n % 2), .61);
        }
      }
      box(m.plaster, -.56, 2.5, -2.0, 4.7, 5.0, 2.8);
      box(m.tile, -.56, 5.15, -1.99, 4.95, .32, 3.04);
      for (var bay = -1; bay <= 1; bay++) {
        windowAt(box, -.56 + bay * 1.36, 3.7, -.56, .73, m.rust);
      }
    }, true);

    var stall = model(function (box, ball, cylinder, face) {
      box(m.timber, 0, .64, 0, 2.75, .13, 1.18);
      box(m.timber, 0, .38, -.52, 2.69, .47, .11);
      for (var x = -1; x <= 1; x += 2) {
        for (var z = -1; z <= 1; z += 2) box(m.rust, x * 1.27, .98, z * .58, .06, 1.96, .06);
      }
      box(m.canvas, 0, 2.02, 0, 2.93, .065, 1.50, .16);
      for (var i = -3; i <= 3; i++) {
        box(m.awning, i * .41, 2.06, 0, .20, .018, 1.49, .16);
        box(i % 2 ? m.canvas : m.awning, i * .413, 1.87, .75, .416, .113, .032);
      }
      for (var line = 0; line < 3; line++) {
        for (var j = 0; j < 7; j++) {
          ball(m.melon, -1.08 + .35 * j + .04 * (line % 2), .83 + (line === 2 ? .17 : 0),
            -.29 + line * .29, .167, .155, .165);
        }
      }
      box(m.timber, 1.4, .21, .36, .64, .42, .56);
      for (var gap = 1; gap <= 3; gap++) {
        box(m.shade, 1.40, .10 * gap, .646, .55, .018, .017);
      }
      box(m.timber, -1.13, .11, .06, .53, .22, .51);
      box(m.timber, -1.16, .30, .045, .48, .16, .45);
      cylinder(m.china, -.8, .793, .48, .20, .045, .20);
      box(m.rust, -1.02, .73, .43, .42, .10, .31);
    });
    function stallBoard(label) {
      return model(function (box, ball, cylinder, face) {
        face(label, 0, 1.89, .78, 2.10, .33);
      });
    }
    var vendorBoard = stallBoard(stallLabel);
    var haogeBoard = stallBoard(haogeLabel);
    var poles = model(function (box, ball, cylinder) {
      cylinder(m.concrete, 0, 2.70, 0, .09, 5.4, .09);
      box(m.power, 0, 5.0, 0, 1.12, .07, .08);
      for (var x = -1; x <= 1; x++) {
        cylinder(m.china, x * .39, 5.14, 0, .048, .22, .048);
        box(m.power, x * .39, 5.19, 3.1, .018, .017, 6.2);
        box(m.power, x * .39, 5.19, -3.1, .018, .017, 6.2);
      }
    });
    var alleyBits = model(function (box, ball, cylinder) {
      cylinder(m.rust, .38, .25, 0, .25, .49, .24);
      cylinder(m.cloth, .38, .47, 0, .267, .060, .249);
      cylinder(m.shade, .38, .504, 0, .17, .018, .15);
      ball(m.darkLeaf, .29, .59, .005, .17, .22, .17);
      ball(m.leaf, .45, .58, -.081, .17, .21, .18);
      box(m.concrete, -.51, .23, .05, .56, .46, .43);
      box(m.green, -.51, .47, .05, .62, .11, .49, .08);
    });
    var drain = model(function (box) {
      box(m.shade, 0, -.104, 0, .23, .018, .59);
      for (var bar = -3; bar <= 3; bar++) box(m.rust, 0, -.092, bar * .073, .18, .012, .020);
    });

    var entrance = model(function (box, ball, cylinder, face) {
      for (var side = -1; side <= 1; side += 2) {
        box(m.brick, side * 4.84, 3.58, 0, .66, 7.16, 1.07);
        box(m.concrete, side * 4.84, .29, 0, .80, .58, 1.19);
        box(m.concrete, side * 4.84, 6.58, 0, .81, .19, 1.22);
        box(m.timber, side * 4.62, 7.05, 0, 1.12, .43, 1.36);
        box(m.timber, side * 4.34, 7.39, 0, 1.17, .35, 1.62);
        cylinder(m.rust, side * 4.02, 6.58, .09, .17, .35, .17);
        cylinder(m.ochre, side * 4.02, 6.81, .09, .054, .11, .057);
      }
      box(m.timber, 0, 7.19, 0, 10.18, .35, 1.18);
      box(m.timber, 0, 7.60, 0, 8.3, .67, .63);
      box(m.tile, 0, 8.13, .47, 10.80, .21, 1.25, .36);
      box(m.tile, 0, 8.13, -.61, 10.80, .21, 1.2, -.36);
      box(m.concrete, 0, 8.39, -.067, 10.66, .126, .19);
      face(marketGate, 0, 7.59, .323, 6.26, .65);
      face(marketGate, 0, 7.59, -.323, 6.26, .65, Math.PI);
    });
    var busStop = model(function (box, ball, cylinder) {
      for (var side = -1; side <= 1; side += 2) {
        box(m.green, side * 1.25, 1.27, -.23, .07, 2.55, .07);
        box(m.timber, side * .91, .27, .12, .10, .56, .49);
      }
      box(m.timber, 0, .54, .14, 2.13, .10, .46);
      box(m.glass, 0, 1.64, -.24, 2.53, 1.6, .038);
      box(m.china, .67, 1.72, -.207, .39, .67, .025);
      box(m.green, 0, 2.56, .09, 2.91, .085, 1.0, .095);
    });
    var utilityCovers = model(function (box, ball, cylinder) {
      cylinder(m.shade, 0, -.110, 0, .31, .015, .31);
      cylinder(m.rust, 0, -.111, 0, .26, .017, .26);
      for (var rail = -2; rail <= 2; rail++) box(m.shade, rail * .072, -.097, 0, .014, .008, .27);
    });
    var clothRack = model(function (box) {
      box(m.power, 0, 7.75, 0, 9.4, .018, .018);
      [-2.9, -1.86, -.74, 1.03, 2.4].forEach(function (x, i) {
        var h = .39 + .18 * (i % 3);
        box(i % 2 ? m.ochre : m.cloth, x, 7.75 - h / 2, .011, .71, h, .019, .07 * (i - 1));
        box(m.timber, x - .22, 7.74, .015, .045, .065, .032);
        box(m.timber, x + .22, 7.74, .015, .045, .065, .032);
      });
    });

    var buildings = [marketHouse, shop, repair, apartment, courtyard, diner, alleyHouse];
    var templates = buildings.concat([stall, vendorBoard, haogeBoard, poles, alleyBits,
      entrance, busStop, utilityCovers, clothRack, drain]);
    function place(template, side, d, offset, scale, along) {
      template.placements.push({ side: side, d: d, offset: offset, scale: scale, along: along, fixed: false });
    }
    var guide = new THREE.MeshBasicMaterial({ color: 0x9bb985 });
    exits.forEach(function (stage) {
      var board = sign(stage.exit, '#244435', '#ffedac');
      var gate = model(function (box, ball, cylinder, face) {
        for (var side = -1; side <= 1; side += 2) {
          box(m.green, side * 4.58, 3.76, 0, .28, 7.52, .31);
          box(m.concrete, side * 4.58, .34, 0, .51, .68, .51);
          box(guide, side * 4.58, 2.25, .17, .21, .58, .05);
        }
        box(m.green, 0, 7.41, 0, 9.5, .44, .32);
        box(m.concrete, 0, 7.68, 0, 9.8, .13, .56);
        face(board, 0, 7.41, .181, 2.9, .59);
        box(guide, 0, -.096, 0, 5.35, .02, .12);
      });
      place(gate, 0, stage.to, 0, 1, true);
      gate.placements[0].fixed = true;
      templates.push(gate);
    });
    place(entrance, 0, 28, 0, 1, true);
    var firstShelter = campaign ? oldTownStart + 9 : 127;
    place(busStop, 1, firstShelter, 1.68, 1);
    place(busStop, -1, firstShelter + 23, 1.86, 1);
    for (var laundry = alleyStart + 8; laundry < lastBuilding; laundry += 29) {
      place(clothRack, 0, laundry, 0, 1, true);
    }
    var market = [courtyard, marketHouse, shop, courtyard, marketHouse, repair, courtyard];
    var oldTown = [shop, diner, repair, apartment, courtyard, diner, shop];
    var alley = [apartment, alleyHouse, courtyard, apartment, alleyHouse, apartment, courtyard];
    for (var d = -20; d <= lastBuilding; d += 6.7) {
      var i = Math.round((d + 20) / 6.7);
      for (var side = -1; side <= 1; side += 2) {
        var at = d + (side < 0 ? 0 : 2.1);
        var v = (i + (side > 0 ? 2 : 0)) % 7;
        var row = at < oldTownStart ? market : at < alleyStart ? oldTown : alley;
        var setBack = (row === market ? 4.08 : row === oldTown ? 3.80 : 2.85) + (v % 3) * .17;
        place(row[v], side, at, setBack, .89 + (v % 3) * .065);
        if ((at < 66 || (campaign && at < oldTownStart - 15 && i % 2 === 0)) &&
            (v === 1 || v === 2 || v === 4)) {
          place(stall, side, at - 1.2, 1.32, .93);
          place(side === 1 && i === 6 ? haogeBoard : vendorBoard, side, at - 1.2, 1.32, .93);
        }
        if (i % 3 === 0) place(poles, side, at, .83, 1, true);
        if (i % 6 === 0) place(utilityCovers, side, at + 1.8, -.80, 1, true);
        if (i % 4 === 2) place(drain, side, at - 1.2, -.12, 1, true);
        if (at > alleyStart && (v === 0 || v === 4)) place(alleyBits, side, at + 2.1, 1.41, 1);
      }
    }

    function batch(geo, material, count, shadow) {
      var mesh = new THREE.InstancedMesh(geo, material, count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      parent.add(mesh);
      return mesh;
    }

    function maxVisible(placements) {
      var start = 0, count = 0;
      placements.forEach(function (placed, end) {
        while (placed.d - placements[start].d > 104) start++;
        count = Math.max(count, end - start + 1);
      });
      return count;
    }

    function firstVisible(placements, distance) {
      var lo = 0, hi = placements.length;
      while (lo < hi) {
        var mid = (lo + hi) >> 1;
        if (placements[mid].d < distance - 22) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    }

    templates.forEach(function (kit) {
      kit.placements.sort(function (a, b) { return a.d - b.d; });
      var capacity = campaign ? maxVisible(kit.placements) : kit.placements.length;
      var shadow = kit !== drain && kit !== utilityCovers;
      kit.batch = kit.meshes.map(function (mesh) {
        return batch(mesh.geo, mesh.material, capacity, shadow);
      });
      kit.farBatch = kit.distant && batch(kit.distant, distantWall, capacity, false);
    });

    function show(mesh, count) {
      mesh.count = count;
      mesh.visible = count > 0;
      if (count) mesh.instanceMatrix.needsUpdate = true;
    }

    return function draw(distance) {
      templates.forEach(function (kit) {
        var count = 0, farCount = 0;
        var first = campaign ? firstVisible(kit.placements, distance) : 0;
        for (var i = first; i < kit.placements.length; i++) {
          var placed = kit.placements[i];
          var location = placed.d;
          if (campaign && location > distance + 82) break;
          if (!campaign && !placed.fixed && location >= 250) {
            // Keep the rear residential blocks available on long runs.
            // Choose the copy nearest the runner's visible stretch.
            var blockLength = 268;
            location += Math.max(0, Math.round((distance - location) / blockLength)) * blockLength;
          }
          if (location < distance - 22 || location > distance + 82) continue;
          var at = project(location, placed.side * (streetWidth(location) + placed.offset));
          transform.position.set(at.x, .115, at.z);
          transform.rotation.set(0, at.yaw - (placed.along ? 0 : placed.side * Math.PI / 2), 0);
          transform.scale.setScalar(placed.scale);
          transform.updateMatrix();
          if (kit.farBatch && location > distance + 46) {
            kit.farBatch.setMatrixAt(farCount++, transform.matrix);
          } else {
            kit.batch.forEach(function (mesh) { mesh.setMatrixAt(count, transform.matrix); });
            count++;
          }
        }
        kit.batch.forEach(function (mesh) { show(mesh, count); });
        if (kit.farBatch) show(kit.farBatch, farCount);
      });
    };
  }

  return { create: create };
})();

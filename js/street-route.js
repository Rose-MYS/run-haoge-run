window.StreetRoute = (function () {
  'use strict';

  var RADIUS = 11;
  var ARC = Math.PI * RADIUS / 2;
  var NOTICE = 34;
  var TURN_WINDOW = 22;
  var TURN_GRACE = 4;
  var TURNS = [
    { distance: 77, direction: 1, blocker: 'barrier' },
    { distance: 177, direction: -1, blocker: 'elephant' },
    { distance: 306, direction: 1, blocker: 'barrier' },
    { distance: 445, direction: -1, blocker: 'elephant' },
  ];

  function course(turns) {
    var x = 0, z = 0, heading = 0, end = 0;
    var segments = turns.map(function (turn) {
      var straight = turn.distance - end;
      x += Math.sin(heading) * straight;
      z -= Math.cos(heading) * straight;
      var corner = { x: x, z: z, heading: heading, distance: turn.distance, dir: turn.direction };
      var before = heading;
      heading += turn.direction * Math.PI / 2;
      x += (Math.cos(before) - Math.cos(heading)) * turn.direction * RADIUS;
      z += (Math.sin(before) - Math.sin(heading)) * turn.direction * RADIUS;
      end = turn.distance + ARC;
      return corner;
    });
    segments.push({ x: x, z: z, heading: heading, distance: end, dir: 0 });
    return segments;
  }

  function streetTexture(sidewalk) {
    var canvas = document.createElement('canvas');
    var size = 512;
    canvas.width = canvas.height = size;
    var ctx = canvas.getContext('2d');
    var image = ctx.createImageData(size, size);
    var seed = 92831;
    function random() {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    for (var y = 0; y < size; y++) {
      var row = y >> 6;
      for (var x = 0; x < size; x++) {
        var noise = random() * (sidewalk ? 17 : 33);
        var wear = (sidewalk ? 8 : 10) * Math.sin(x * Math.PI / 128) * Math.cos(y * Math.PI / 128) +
          3 * Math.cos((x - y * 2) * Math.PI / 256);
        var stagger = (x + (row % 2 ? 48 : 0)) % size;
        var tile = stagger >> 7;
        var grout = sidewalk && (y % 64 < 2 || stagger % 128 < 3);
        var joint = sidewalk && (y % 64 === 2 || stagger % 128 === 3);
        var tileTint = sidewalk ? ((tile * 47 + row * 29) % 17) - 8 : 0;
        var value = (sidewalk ? 108 : 51) + noise + wear + tileTint - (grout ? 39 : 0) + (joint ? 13 : 0);
        var p = (y * size + x) * 4;
        image.data[p] = value + (sidewalk ? 9 : 2);
        image.data[p + 1] = value + (sidewalk ? 5 : 2);
        image.data[p + 2] = value - (sidewalk ? 5 : 1);
        image.data[p + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    if (!sidewalk) {
      ctx.lineWidth = 1.15;
      ctx.strokeStyle = 'rgba(28,26,23,.57)';
      ctx.fillStyle = 'rgba(46,46,42,.20)';
      for (var j = 0; j < 5; j++) {
        var sx = random() * 440 + 36;
        var sy = random() * 400 + 55;
        ctx.beginPath();
        ctx.moveTo(sx - 14, sy + 10);
        ctx.lineTo(sx + 14, sy + 7);
        ctx.lineTo(sx + 25, sy - 26);
        ctx.lineTo(sx + 7, sy - 45);
        ctx.lineTo(sx - 3, sy - 39);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 4, sy - 8);
        ctx.lineTo(sx + 1, sy - 12);
        ctx.lineTo(sx + 8, sy - 22);
        ctx.lineTo(sx + 7, sy - 31);
        ctx.moveTo(sx + 1, sy - 12);
        ctx.lineTo(sx - 8, sy - 15);
        ctx.stroke();
      }
    }
    var texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    return texture;
  }

  function makeTurnMarkers(parent) {
    var group = new THREE.Group();
    group.name = 'StreetTurnMarkers';
    parent.add(group);
    var paint = new THREE.MeshBasicMaterial({
      color: 0xe7b764, side: THREE.DoubleSide, transparent: true, opacity: .90, depthWrite: false,
    });
    var signal = new THREE.MeshBasicMaterial({ color: 0xe7b764, side: THREE.DoubleSide });
    var panel = new THREE.MeshBasicMaterial({ color: 0x283b30 });
    var bentArrow = new THREE.Shape();
    bentArrow.moveTo(-.20, -1.18);
    bentArrow.lineTo(.20, -1.18);
    bentArrow.lineTo(.20, .04);
    bentArrow.lineTo(.72, .04);
    bentArrow.lineTo(.72, -.25);
    bentArrow.lineTo(1.27, .27);
    bentArrow.lineTo(.72, .79);
    bentArrow.lineTo(.72, .48);
    bentArrow.lineTo(-.20, .48);
    bentArrow.closePath();
    var geometry = new THREE.ShapeGeometry(bentArrow);
    var arrows = [-12, -4].map(function (offset) {
      var carrier = new THREE.Group();
      var arrow = new THREE.Mesh(geometry, paint);
      arrow.rotation.x = -Math.PI / 2;
      carrier.add(arrow);
      group.add(carrier);
      return { offset: offset, carrier: carrier, arrow: arrow };
    });
    var board = new THREE.Group();
    var back = new THREE.Mesh(new THREE.BoxGeometry(1.26, .74, .07), panel);
    back.position.y = 1.60;
    var pole = new THREE.Mesh(new THREE.BoxGeometry(.07, 1.54, .07), panel);
    pole.position.y = .77;
    var icon = new THREE.Mesh(geometry, signal);
    icon.position.set(-.22, 1.64, .044);
    icon.scale.set(.55, .36, 1);
    board.add(back, pole, icon);
    group.add(board);

    // 直行封路护栏（红白反光栏 + 路锥）
    var barrierGroup = new THREE.Group();
    var railRedMat = new THREE.MeshLambertMaterial({ color: 0xc92c25, emissive: 0x3a0806, emissiveIntensity: 0.35 });
    var railWhiteMat = new THREE.MeshLambertMaterial({ color: 0xf4efe4 });
    var poleDarkMat = new THREE.MeshLambertMaterial({ color: 0x26292e });
    var coneMat = new THREE.MeshLambertMaterial({ color: 0xff6b1a, emissive: 0x451500, emissiveIntensity: 0.25 });
    for (var bi = -2; bi <= 2; bi++) {
      var seg = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.32, 0.14), (bi + 2) % 2 === 0 ? railRedMat : railWhiteMat);
      seg.position.set(bi * 1.18, 0.92, 0);
      seg.castShadow = true;
      barrierGroup.add(seg);
      var segLow = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.24, 0.12), (bi + 2) % 2 === 1 ? railRedMat : railWhiteMat);
      segLow.position.set(bi * 1.18, 0.44, 0);
      barrierGroup.add(segLow);
    }
    [-2.4, 0, 2.4].forEach(function (px) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.18, 0.16), poleDarkMat);
      leg.position.set(px, 0.59, 0);
      barrierGroup.add(leg);
    });
    [-2.1, 2.1].forEach(function (cx) {
      var cone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.68, 8), coneMat);
      cone.position.set(cx, 0.34, 0.65);
      cone.castShadow = true;
      barrierGroup.add(cone);
    });
    group.add(barrierGroup);

    // 直行过路大象路障
    var elephantGroup = window.StreetElephant ? window.StreetElephant.createElephant({ royal: false }) : new THREE.Group();
    elephantGroup.scale.setScalar(1.05);
    group.add(elephantGroup);

    return function draw(turn, distance, project, streetWidth, chosen, playing, elapsed, pastResult) {
      var showPast = !!(pastResult && !pastResult.confirmed && distance < pastResult.turn.distance + TURN_GRACE + 5.5);
      var activeTurn = (turn && distance >= turn.distance - NOTICE) ? turn : (showPast ? pastResult.turn : null);
      group.visible = !!(playing && activeTurn);
      if (!group.visible) return;
      var showTurnPrompt = !!(turn && activeTurn === turn);
      arrows.forEach(function (mark) { mark.carrier.visible = showTurnPrompt; });
      board.visible = showTurnPrompt;
      if (showTurnPrompt) {
        signal.color.setHex(chosen || distance >= turn.distance - TURN_WINDOW ? 0xb9ee8d : 0xf3c16f);
        paint.color.copy(signal.color);
        arrows.forEach(function (mark) {
          var p = project(turn.distance + mark.offset, 0);
          mark.carrier.position.set(p.x, .019, p.z);
          mark.carrier.rotation.y = p.yaw;
          mark.arrow.scale.x = turn.direction;
        });
        var at = turn.distance - 1;
        var edge = project(at, -turn.direction * (streetWidth(at) + .48));
        board.position.set(edge.x, .115, edge.z);
        board.rotation.y = edge.yaw;
        icon.position.x = -.22 * turn.direction;
        icon.scale.x = .55 * turn.direction;
      }

      // 弯口直行尽头的物理阻挡物（沿直行切线方向放在弯口前方）
      var blockerType = activeTurn.blocker || 'barrier';
      var base = project(activeTurn.distance, 0);
      var fwdX = -Math.sin(base.yaw);
      var fwdZ = -Math.cos(base.yaw);
      var sideX = Math.cos(base.yaw);
      var sideZ = -Math.sin(base.yaw);
      var ahead = 10.2;
      if (blockerType === 'elephant' && window.StreetElephant) {
        barrierGroup.visible = false;
        elephantGroup.visible = true;
        var walkT = elapsed || 0;
        var crossOffset = Math.sin(walkT * 1.15) * 2.4;
        var crossDir = Math.cos(walkT * 1.15) >= 0 ? 1 : -1;
        elephantGroup.position.set(
          base.x + fwdX * ahead + sideX * crossOffset,
          0,
          base.z + fwdZ * ahead + sideZ * crossOffset
        );
        elephantGroup.rotation.y = base.yaw + (crossDir > 0 ? Math.PI / 2 : -Math.PI / 2);
        window.StreetElephant.animateElephant(elephantGroup, walkT, showPast ? 'startle' : 'walk');
      } else {
        elephantGroup.visible = false;
        barrierGroup.visible = true;
        barrierGroup.position.set(base.x + fwdX * ahead, 0, base.z + fwdZ * ahead);
        barrierGroup.rotation.y = base.yaw;
      }
    };
  }

  function create(scene, track, sideProps, stages, onTurn) {
    var routeTurns = stages ? stages.reduce(function (all, stage) {
      return all.concat(stage.turns.map(function (turn) {
        return Object.assign({}, turn, { distance: stage.from + turn.distance });
      }));
    }, []) : TURNS;
    var turns = course(routeTurns);
    var nextTurn = 0;
    var chosen = false;
    var resultTurn = null;
    var hint = document.createElement('div');
    hint.className = 'street-turn';
    hint.hidden = true;
    hint.innerHTML = '<div class="street-turn-row">' +
      '<span class="street-turn-status" role="status"></span>' +
      '<span class="street-turn-distance" aria-hidden="true" hidden></span></div>' +
      '<div class="street-turn-controls street-turn-wait" hidden>提示变绿时操作</div>' +
      '<div class="street-turn-controls" hidden><span class="street-turn-key"></span>' +
      '<span class="street-turn-swipe"></span></div><button type="button" hidden></button>';
    var guide = stages ? document.getElementById('chapterTurnGuide') : document.body;
    guide.appendChild(hint);
    var turnStatus = hint.querySelector('.street-turn-status');
    var turnDistance = hint.querySelector('.street-turn-distance');
    var turnWait = hint.querySelector('.street-turn-wait');
    var turnControls = hint.querySelector('.street-turn-controls:not(.street-turn-wait)');
    var turnKey = hint.querySelector('.street-turn-key');
    var turnSwipe = hint.querySelector('.street-turn-swipe');
    var turnButton = hint.querySelector('button');
    turnButton.addEventListener('click', function () {
      if (routeTurns[nextTurn] && !turnButton.hidden && onTurn) onTurn(routeTurns[nextTurn].direction);
    });

    var banner = document.createElement('button');
    banner.type = 'button';
    banner.id = 'streetTurnBanner';
    banner.className = 'street-turn-banner';
    banner.hidden = true;
    banner.addEventListener('click', function () {
      if (routeTurns[nextTurn] && !chosen && onTurn) onTurn(routeTurns[nextTurn].direction);
    });
    document.body.appendChild(banner);

    var sky = document.createElement('canvas');
    sky.width = sky.height = 256;
    var skyCtx = sky.getContext('2d');
    var gradient = skyCtx.createLinearGradient(0, 0, 0, 205);
    gradient.addColorStop(0, '#648892');
    gradient.addColorStop(.39, '#92a9a8');
    gradient.addColorStop(.72, '#bec4b4');
    gradient.addColorStop(1, '#dbceb5');
    skyCtx.fillStyle = gradient;
    skyCtx.fillRect(0, 0, 256, 256);
    [[51,52,108,12],[216,36,111,12],[157,98,103,7],[39,111,128,8]].forEach(function (cloud) {
      skyCtx.save();
      skyCtx.translate(cloud[0], cloud[1]);
      skyCtx.scale(cloud[2], cloud[3]);
      var wisps = skyCtx.createRadialGradient(0, 0, 0, 0, 0, 1);
      wisps.addColorStop(0, 'rgba(244,235,211,.32)');
      wisps.addColorStop(.45, 'rgba(239,235,218,.16)');
      wisps.addColorStop(1, 'rgba(239,235,218,0)');
      skyCtx.fillStyle = wisps;
      skyCtx.fillRect(-1, -1, 2, 2);
      skyCtx.restore();
    });
    var skyMap = new THREE.CanvasTexture(sky);
    skyMap.encoding = THREE.sRGBEncoding;
    scene.background = skyMap;

    var left = -27, right = 82, stripSteps = right - left;
    var roadMaterial = new THREE.MeshStandardMaterial({ map: streetTexture(false), roughness: 0.97 });
    var sidewalkMaterial = new THREE.MeshStandardMaterial({ map: streetTexture(true), roughness: 0.94 });
    var curbMaterial = new THREE.MeshStandardMaterial({ map: sidewalkMaterial.map, color: 0xaaa394, roughness: 0.93 });
    var gutterMaterial = new THREE.MeshStandardMaterial({ map: roadMaterial.map, color: 0x94928a, roughness: 0.92 });
    var scenery = new THREE.Group();
    scene.add(scenery);
    var drawMarkers = makeTurnMarkers(scenery);
    var soil = new THREE.Mesh(new THREE.PlaneGeometry(255, 255),
      new THREE.MeshLambertMaterial({ color: 0x716e60 }));
    soil.rotation.x = -Math.PI / 2;
    soil.position.y = -.20;
    soil.receiveShadow = true;
    scenery.add(soil);
    var staticScenery = new THREE.Group();
    staticScenery.name = 'StreetStaticScenery';
    scenery.add(staticScenery);
    track.visible = false;
    var excluded = new Set(sideProps);
    excluded.add(track);
    excluded.add(scenery);

    function strip(material, offsets, tileSize, heights) {
      var geo = new THREE.BufferGeometry();
      var xyz = new THREE.BufferAttribute(new Float32Array((stripSteps + 1) * 6), 3);
      var uv = new THREE.BufferAttribute(new Float32Array((stripSteps + 1) * 4), 2);
      var normals = new Float32Array(xyz.array.length);
      var faces = [];
      for (var i = 0; i <= stripSteps; i++) {
        normals[i * 6 + 1] = normals[i * 6 + 4] = 1;
        if (i < stripSteps) {
          var v = i * 2;
          faces.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
        }
      }
      geo.setIndex(faces);
      geo.setAttribute('position', xyz.setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      geo.setAttribute('uv', uv.setUsage(THREE.DynamicDrawUsage));
      var mesh = new THREE.Mesh(geo, material);
      mesh.frustumCulled = false;
      mesh.receiveShadow = true;
      staticScenery.add(mesh);
      return { xyz: xyz, uv: uv, offsets: offsets, tileSize: tileSize, heights: heights };
    }

    var strips = [
      strip(roadMaterial, [-1, .24, 1, -.24], 7.2, [0, 0]),
      strip(gutterMaterial, [-1, 0, -1, .24], 7.2, [0, 0]),
      strip(gutterMaterial, [1, -.24, 1, 0], 7.2, [0, 0]),
      strip(curbMaterial, [-1, -.20, -1, 0], 2.8, [.115, 0]),
      strip(curbMaterial, [1, 0, 1, .20], 2.8, [0, .115]),
      strip(sidewalkMaterial, [-1, -3.4, -1, -.20], 2.8, [.115, .115]),
      strip(sidewalkMaterial, [1, .20, 1, 3.4], 2.8, [.115, .115]),
    ];
    function sample(distance, out) {
      var lo = 0, hi = turns.length - 1;
      while (lo < hi) {
        var mid = (lo + hi) >> 1;
        if (distance > turns[mid].distance + ARC) lo = mid + 1;
        else hi = mid;
      }
      var t = turns[lo];
      var offset = distance - t.distance;
      var sin = Math.sin(t.heading);
      var cos = Math.cos(t.heading);
      if (offset <= 0 || !t.dir) {
        out.x = t.x + sin * offset;
        out.z = t.z - cos * offset;
        out.angle = t.heading;
      } else {
        var angle = t.heading + offset / RADIUS * t.dir;
        out.x = t.x + (cos - Math.cos(angle)) * RADIUS * t.dir;
        out.z = t.z + (sin - Math.sin(angle)) * RADIUS * t.dir;
        out.angle = angle;
      }
      return out;
    }

    var origin = {}, point = {}, result = {};
    var cs = 1, sn = 0;
    function setOrigin(distance) {
      sample(distance, origin);
      cs = Math.cos(origin.angle);
      sn = Math.sin(origin.angle);
    }

    function project(distance, x) {
      sample(distance, point);
      var dx = point.x - origin.x + Math.cos(point.angle) * x;
      var dz = point.z - origin.z + Math.sin(point.angle) * x;
      result.x = dx * cs + dz * sn;
      result.z = -dx * sn + dz * cs;
      result.yaw = origin.angle - point.angle;
      return result;
    }

    var alleyStart = stages ? stages[2].from : 192;
    function streetWidth(d) {
      return 4.35 - 1.24 * THREE.MathUtils.smoothstep(d, alleyStart - 23, alleyStart + 9);
    }

    function rebuildStreet(anchor) {
      setOrigin(anchor);
      for (var i = 0; i <= stripSteps; i++) {
        var d = anchor + i + left;
        var halfWidth = streetWidth(d);
        var center = project(d, 0);
        var rowX = center.x, rowZ = center.z;
        var acrossX = Math.cos(center.yaw), acrossZ = -Math.sin(center.yaw);
        for (var j = 0; j < strips.length; j++) {
          var row = strips[j];
          var inner = row.offsets[0] * halfWidth + row.offsets[1];
          var outer = row.offsets[2] * halfWidth + row.offsets[3];
          for (var side = 0; side < 2; side++) {
            var lateral = side ? outer : inner;
            row.xyz.setXYZ(i * 2 + side, rowX + acrossX * lateral, row.heights[side], rowZ + acrossZ * lateral);
            row.uv.setXY(i * 2 + side, lateral / row.tileSize, d / row.tileSize);
          }
        }
      }
      strips.forEach(function (s) { s.xyz.needsUpdate = s.uv.needsUpdate = true; });
      drawArt(anchor);
    }

    var lastAnchor;
    function drawStreet(distance, elapsed) {
      var anchor = Math.floor(distance);
      // Update road buffers and facade instances once per meter. The group moves smoothly between anchors.
      if (anchor !== lastAnchor) {
        rebuildStreet(anchor);
        lastAnchor = anchor;
      }
      setOrigin(distance);
      var relative = project(anchor, 0);
      staticScenery.position.set(relative.x, 0, relative.z);
      staticScenery.rotation.y = relative.yaw;
      if (drawCrowd) drawCrowd(distance, elapsed);
    }

    function reset(distance) {
      nextTurn = 0;
      while (nextTurn < routeTurns.length && routeTurns[nextTurn].distance + TURN_GRACE <= (distance || 0)) nextTurn++;
      chosen = false;
      resultTurn = null;
      banner.hidden = true;
      updateHint(distance);
    }

    function input(direction, distance) {
      var turn = routeTurns[nextTurn];
      if (!turn || chosen || direction !== turn.direction ||
          distance < turn.distance - TURN_WINDOW || distance >= turn.distance + TURN_GRACE) return false;
      chosen = true;
      updateHint(distance);
      return true;
    }

    function update(distance, missed, turned) {
      var turn = routeTurns[nextTurn];
      if (turn && distance >= turn.distance + TURN_GRACE) {
        var confirmed = chosen;
        resultTurn = { turn: turn, confirmed: confirmed };
        nextTurn++;
        chosen = false;
        if (confirmed && turned) turned(turn);
        if (!confirmed) missed(turn);
      }
      updateHint(distance);
    }

    function updateHint(distance) {
      var turn = routeTurns[nextTurn];
      var upcoming = turn && distance >= turn.distance - NOTICE;
      var past = resultTurn && distance < resultTurn.turn.distance + TURN_GRACE + 9;
      hint.hidden = !stages && !upcoming && !past;
      if (hint.hidden) return;
      var active = upcoming ? turn : past ? resultTurn.turn : null;
      var direction = active && active.direction;
      var name = direction > 0 ? '右转' : '左转';
      var arrow = direction > 0 ? '→' : '←';
      var ready = upcoming && !chosen && distance >= turn.distance - TURN_WINDOW;
      var confirmed = upcoming ? chosen : past && resultTurn.confirmed;
      var message = '直行';
      if (upcoming) {
        message = chosen ? '已确认' + name : (ready ? '现在确认' : '前方') + name + ' ' + arrow;
      } else if (past) {
        message = confirmed ? '转弯成功' : turnMissMessage(active);
      }
      if (turnStatus.textContent !== message) turnStatus.textContent = message;
      hint.classList.toggle('street-turn-ready', !!ready);
      hint.classList.toggle('street-turn-confirmed', !!confirmed);
      turnDistance.hidden = !upcoming;
      if (upcoming) {
        var meters = Math.ceil(turn.distance - distance);
        var remaining = meters > 0 ? meters + ' 米' : '已到弯口';
        if (turnDistance.textContent !== remaining) turnDistance.textContent = remaining;
      }
      turnWait.hidden = !!stages || !upcoming || ready || confirmed;
      turnControls.hidden = !!stages || !ready;
      turnButton.hidden = !ready;
      if (ready && turnButton.textContent !== '点此' + name) {
        turnKey.textContent = '按 ' + arrow;
        turnSwipe.textContent = direction > 0 ? '向右滑动' : '向左滑动';
        turnButton.textContent = '点此' + name;
      }
      var showBanner = !!(ready && active);
      banner.hidden = !showBanner;
      if (showBanner) {
        var blockerLabel = active.blocker === 'elephant' ? '前方大象挡路！' : '前方封路护栏！';
        var bannerText = (direction < 0 ? '← 立刻左转！' : '立刻右转！ →') + '  ' + blockerLabel;
        if (banner.textContent !== bannerText) banner.textContent = bannerText;
        banner.classList.toggle('is-elephant', active.blocker === 'elephant');
      }
    }

    function turnMissMessage(turn) {
      if (turn.practice) return '下次提示变绿时确认转弯';
      return turn.blocker === 'elephant' ? '撞上过路大象！' : '撞上封路护栏！';
    }

    var drawArt = window.StreetArt.create(staticScenery, project, streetWidth, stages || []);
    var drawCrowd = window.StreetCrowd && window.StreetCrowd.create(scenery, project, streetWidth, stages);
    var transformed = [];
    var particles = new WeakMap();
    function render(renderer, camera, distance, playing, elapsed) {
      if (!playing) {
        if (!stages) hint.hidden = true;
        banner.hidden = true;
      }
      drawStreet(distance, elapsed);
      drawMarkers(routeTurns[nextTurn], distance, project, streetWidth, chosen, playing, elapsed, resultTurn);
      try {
        scene.children.forEach(function (obj) {
          if (!obj.visible || obj.isLight || excluded.has(obj)) {
            if (obj.visible && excluded.has(obj) && obj !== track && obj !== scenery) {
              obj.visible = false;
              transformed.push({ obj: obj, hidden: true });
            }
            return;
          }
          if (obj.isPoints) {
            var attr = obj.geometry.getAttribute('position');
            var saved = particles.get(obj);
            if (!saved) {
              saved = new Float32Array(attr.array.length);
              particles.set(obj, saved);
            }
            saved.set(attr.array);
            transformed.push({ obj: obj, attr: attr, saved: saved });
            for (var i = 0; i < attr.count; i++) {
              var mapped = project(distance - saved[i * 3 + 2], saved[i * 3]);
              attr.setX(i, mapped.x);
              attr.setZ(i, mapped.z);
            }
            attr.needsUpdate = true;
            return;
          }
          var x = obj.position.x, z = obj.position.z, yaw = obj.rotation.y;
          var p = project(distance - z, x);
          transformed.push({ obj: obj, x: x, z: z, yaw: yaw });
          obj.position.x = p.x;
          obj.position.z = p.z;
          obj.rotation.y = yaw + p.yaw;
        });
        renderer.render(scene, camera);
      } finally {
        transformed.forEach(function (state) {
          var obj = state.obj;
          if (state.hidden) obj.visible = true;
          else if (state.attr) {
            state.attr.array.set(state.saved);
            state.attr.needsUpdate = true;
          } else {
            obj.position.x = state.x;
            obj.position.z = state.z;
            obj.rotation.y = state.yaw;
          }
        });
        transformed.length = 0;
      }
    }

    function lookAhead(distance, meters) {
      setOrigin(distance);
      return project(distance + meters, 0);
    }

    return { reset: reset, input: input, update: update, render: render, lookAhead: lookAhead };
  }

  return { create: create };
})();

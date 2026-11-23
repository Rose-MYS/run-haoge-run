window.StreetPedestrian = (function () {
  'use strict';

  var materials;
  var globe;
  var passerbyMaterials = {};
  var TAU = Math.PI * 2;
  // Neck, jaw, cheekbones and scalp share one continuous surface.
  var FACE = [
    [-.105,.052,-.019,.046,.050], [-.087,.049,-.015,.043,.050],
    [-.069,.049,-.019,.043,.052], [-.054,.051,-.017,.047,.048],
    [-.041,.056,-.013,.056,.051], [-.031,.062,-.010,.069,.054],
    [-.012,.066,.003,.085,.058], [.013,.085,-.004,.100,.074],
    [.050,.097,-.008,.111,.090], [.085,.104,-.012,.112,.099],
    [.122,.102,-.010,.104,.107], [.154,.103,-.013,.107,.108],
    [.181,.099,-.017,.103,.112], [.211,.082,-.024,.087,.099],
    [.236,.051,-.025,.053,.063], [.249,.001,-.028,.002,.002],
  ];

  function shading(color, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: .91 }, extra));
  }

  var contactShadowMat = null;
  var contactShadowGeo = null;
  function addContactShadow(root) {
    if (!contactShadowMat) {
      contactShadowGeo = new THREE.CircleGeometry(.34, 18);
      contactShadowGeo.rotateX(-Math.PI / 2);
      contactShadowMat = new THREE.MeshBasicMaterial({
        color: 0x161a18, transparent: true, opacity: .24, depthWrite: false,
      });
    }
    var disc = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    disc.position.y = .015;
    disc.scale.set(1.05, 1, .86);
    root.add(disc);
  }

  function pattern(w, h, paint) {
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    paint(canvas.getContext('2d'), w, h);
    var texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 4;
    return texture;
  }

  function getMaterials() {
    if (materials) return materials;
    var weave = pattern(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#704742';
      ctx.fillRect(0, 0, w, h);
      for (var y = 0; y < h; y += 3) {
        ctx.fillStyle = y % 2 ? '#523f3b26' : '#b6927523';
        ctx.fillRect(0, y, w, 1);
      }
      for (var row = 0; row < 12; row++) {
        for (var col = 0; col < 14; col++) {
          var x = col * 19 + 6 * (row % 2), cy = row * 22 + 2;
          ctx.strokeStyle = '#b39076';
          ctx.beginPath();
          ctx.moveTo(x - 3, cy + 4);
          ctx.quadraticCurveTo(x + 2, cy + 1, x + 1, cy - 4);
          ctx.moveTo(x, cy + 1);
          ctx.quadraticCurveTo(x + 4, cy + 1, x + 5, cy - 1);
          ctx.stroke();
          ctx.fillStyle = '#c19a80';
          ctx.fillRect(x + 1, cy - 3, 1.4, 1.5);
        }
      }
    });
    var hair = pattern(256, 128, function (ctx, w, h) {
      ctx.fillStyle = '#39342d';
      ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 330; i++) {
        var x = (i * 47) % w;
        ctx.strokeStyle = i % 9 === 0 ? '#8e837286' : i % 2 ? '#171a18a2' : '#695e4d69';
        ctx.lineWidth = i % 9 === 0 ? .95 : .56;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + 19, h * .28, x - 12, h * .69, x + 5, h);
        ctx.stroke();
      }
    });
    var wicker = pattern(256, 128, function (ctx, w, h) {
      ctx.fillStyle = '#735036';
      ctx.fillRect(0, 0, w, h);
      for (var y = 0; y < h; y += 8) {
        for (var x = -8; x < w; x += 12) {
          var tx = x + ((y / 8) % 2) * 6;
          ctx.fillStyle = (x + y) % 5 ? '#bb8d58' : '#d09f6b';
          ctx.fillRect(tx + 1, y + 1, 11, 5.8);
          ctx.fillStyle = '#f0bb7052';
          ctx.fillRect(tx + 2, y + 1, 9, 1);
        }
      }
    });
    globe = new THREE.SphereGeometry(1, 22, 16);
    materials = {
      skin: shading(0xad795e), face: shading(0xffffff, { vertexColors: true }),
      lid: shading(0xa16a54), white: shading(0xd5c4aa),
      iris: shading(0x655446), pupil: shading(0x251f1b), brow: shading(0x4c3830),
      lips: shading(0x945949), mouth: shading(0x51352d), hair: shading(0xffffff, { map: hair, roughness: .78 }),
      shirt: shading(0xffffff, { map: weave }), plain: shading(0x694644),
      stitching: shading(0xa5866a), button: shading(0x473d35),
      trousers: shading(0x464943), seam: shading(0x5d5d54), shoes: shading(0x322d26),
      sole: shading(0x513e31), basket: shading(0xffffff, { map: wicker, side: THREE.DoubleSide }),
      reed: shading(0xa9794a), basketInside: shading(0x574430),
      leaf: shading(0x4a6141), bag: shading(0xbeb18a),
    };
    return materials;
  }

  function add(parent, geometry, material) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function oval(parent, material, x, y, z, sx, sy, sz) {
    var mesh = add(parent, globe, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    return mesh;
  }

  function curve(parent, material, points, radius) {
    var spline = new THREE.CatmullRomCurve3(points.map(function (p) {
      return new THREE.Vector3(p[0], p[1], p[2]);
    }));
    return add(parent, new THREE.TubeGeometry(spline, Math.max(8, points.length * 2), radius, 5, false), material);
  }

  function sample(rows, y) {
    var i = 0;
    while (i < rows.length - 2 && rows[i + 1][0] < y) i++;
    var a = rows[Math.max(0, i - 1)], b = rows[i], c = rows[i + 1];
    var d = rows[Math.min(rows.length - 1, i + 2)];
    var t = THREE.MathUtils.clamp((y - b[0]) / (c[0] - b[0]), 0, 1);
    var t2 = t * t;
    return b.slice(1).map(function (p, k) {
      var j = k + 1;
      return .5 * ((2 * p) + (c[j] - a[j]) * t +
        (2 * a[j] - 5 * p + 4 * c[j] - d[j]) * t2 +
        (-a[j] + 3 * p - 3 * c[j] + d[j]) * t2 * t);
    });
  }

  function surface(radial, vertical, point) {
    var positions = [], colors = [], uv = [], indices = [];
    for (var j = 0; j <= vertical; j++) {
      for (var i = 0; i <= radial; i++) {
        var p = point(i / radial, j / vertical);
        positions.push(p[0], p[1], p[2]);
        if (p[3]) colors.push(p[3].r, p[3].g, p[3].b);
        uv.push(i / radial, j / vertical);
        if (i < radial && j < vertical) {
          var a = j * (radial + 1) + i;
          var b = a + radial + 1;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    if (colors.length) geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    var normals = geo.attributes.normal;
    var seam = new THREE.Vector3(), other = new THREE.Vector3();
    for (var y = 0; y <= vertical; y++) {
      var start = y * (radial + 1), end = start + radial;
      seam.fromBufferAttribute(normals, start).add(other.fromBufferAttribute(normals, end)).normalize();
      normals.setXYZ(start, seam.x, seam.y, seam.z);
      normals.setXYZ(end, seam.x, seam.y, seam.z);
    }
    return geo;
  }

  function volume(rows, fold) {
    return surface(36, 45, function (u, v) {
      var y = THREE.MathUtils.lerp(rows[0][0], rows[rows.length - 1][0], v);
      var r = sample(rows, y);
      var a = TAU * u;
      var f = fold ? fold(a, y) : 0;
      return [r[2] + Math.sin(a) * Math.max(.001, r[0] + f), y,
        r[3] + Math.cos(a) * Math.max(.001, r[1] + f)];
    });
  }

  function g(x, y, cx, cy, w, h) {
    return Math.exp(-(((x - cx) / w) ** 2 + ((y - cy) / h) ** 2));
  }

  function sculpt(x, y) {
    var ax = Math.abs(x);
    return .020 * g(x,y,.003,.111,.018,.044) +
      .030 * g(x,y,.002,.079,.018,.018) +
      .011 * g(ax,y,.018,.067,.014,.011) -
      .015 * g(ax,y,.043,.129,.026,.018) +
      .012 * g(ax,y,.047,.148,.037,.016) +
      .011 * g(ax,y,.058,.090,.030,.023) +
      .008 * g(x,y,0,.040,.044,.018) +
      .010 * g(x,y,0,.003,.042,.021);
  }

  function faceZ(x, y) {
    var r = sample(FACE, y);
    var edge = Math.max(0, Math.min(.9999, Math.abs(x) / Math.max(.001,r[0])));
    var front = Math.sqrt(1 - edge * edge);
    return r[1] + r[2] * front + sculpt(x, y) * Math.pow(front, 1.12);
  }

  function buildFace(head, m, style) {
    var skin = new THREE.Color(style ? style.complexion : 0xb98063);
    var rosy = new THREE.Color(style ? style.cheek : 0xaf765e);
    var dusk = new THREE.Color(0x795544);
    var shade = new THREE.Color();
    var mesh = add(head, surface(style ? 64 : 88, style ? 104 : 154, function (u, v) {
      var y = THREE.MathUtils.lerp(FACE[0][0], FACE[FACE.length - 1][0], v);
      var r = sample(FACE, y);
      var a = TAU * u;
      var x = Math.max(.001, r[0]) * Math.sin(a);
      var c = Math.cos(a);
      var z = r[1] + c * (c >= 0 ? r[2] : r[3]);
      if (c > 0) z += sculpt(x,y) * Math.pow(c,1.12);
      var ax = Math.abs(x);
      var warm = g(ax,y,.061,.086,.022,.021) * .46 + g(x,y,0,.077,.022,.015) * .18;
      var deep = g(ax,y,.046,.125,.026,.012) * .32 + (1 - Math.max(0,c)) * .10 +
        g(ax,y,.012,.064,.006,.0035) * .53 + g(x,y,0,-.052,.050,.023) * .12;
      var grain = Math.sin(u*1817 + v*617) * Math.sin(v*2191) * .009;
      shade.copy(skin).lerp(rosy, warm).lerp(dusk, deep + grain);
      return [x,y,z,shade];
    }), m.face);
    mesh.name = 'PedestrianFaceSculpt';

    var cap = add(head, surface(74, 36, function (u,v) {
      var a = TAU * u, c = Math.cos(a), s = Math.sin(a);
      var hairline = c > 0 ? .096 + .089 * Math.pow(c,.58) : .096 + c * .037;
      if (style) {
        hairline += style.hairline * (1 - Math.max(0, c) * .4);
        hairline -= (style.nape || 0) * (1 - Math.max(0, c));
      }
      hairline += .004 * Math.sin(a * 4) + .003 * Math.sin(a * 11);
      var y = THREE.MathUtils.lerp(hairline, .249, v);
      var r = sample(FACE, y);
      var thickness = Math.sin(Math.PI * (.11 + v * .83)) * .010;
      return [s * (Math.max(.001,r[0]) + thickness), y + v * .009,
        r[1] + c * ((c >= 0 ? r[2] : r[3]) + thickness)];
    }), m.hair);
    cap.name = 'SweptHair';
    if (!style) oval(head, m.hair, .018, .144, -.121, .049, .059, .054).rotation.z = -.29;
    [-1, 1].forEach(function (s) {
      oval(head, m.skin, s * .096, .085, -.027, .018, .032, .022).rotation.z = s * -.18;
      oval(head, m.lid, s * .106, .086, -.013, .009, .019, .010);
    });

    function path(points, lift, origin) {
      if (style) lift += .0013;
      return points.map(function (p) {
        return [p[0] - origin[0], p[1] - origin[1], faceZ(p[0],p[1]) + lift - origin[2]];
      });
    }

    function eye(x) {
      var ly = .126, lx = x;
      var root = new THREE.Group();
      root.position.set(lx, ly, faceZ(lx,ly));
      head.add(root);
      var upper = [], lower = [];
      for (var i = 0; i <= 12; i++) {
        var t = i / 12;
        var dx = (t - .5) * .038;
        var h = Math.sin(Math.PI * t);
        upper.push([lx+dx, ly+.0061*h-.07*dx]);
        lower.push([lx+dx, ly-.0040*h-.07*dx]);
      }
      var center = root.position.toArray();
      var top = path(upper,.0021,center), bottom = path(lower,.0018,center);
      var coords = [], faces = [];
      for (var n = 0; n < top.length; n++) {
        coords.push.apply(coords, top[n]);
        coords.push.apply(coords, bottom[n]);
        if (n < top.length-1) {
          var vi = n * 2;
          faces.push(vi,vi+1,vi+2,vi+1,vi+3,vi+2);
        }
      }
      var sclera = new THREE.BufferGeometry();
      sclera.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
      sclera.setIndex(faces);
      sclera.computeVertexNormals();
      add(root, sclera, m.white);
      oval(root,m.iris,.001,.0004,.0047,.0070,.0062,.0027);
      oval(root,m.pupil,.001,.0004,.0071,.00375,.0043,.0013);
      oval(root,m.white,-.0014,.0023,.0081,.00142,.00112,.00042);
      curve(root,m.brow,top,.00115);
      curve(root,m.lid,bottom,.00165);
      return root;
    }

    function brow(x) {
      var group = new THREE.Group(), y = .151, z = faceZ(x,y);
      group.position.set(x,y,z);
      head.add(group);
      curve(group,m.brow,path([[x-.019,y],[x-.009,y+.003],[x+.005,y+.004],[x+.019,y+.001]],.001,
        group.position.toArray()),.0018);
      return group;
    }
    var faceControls = { eyeL: eye(-.042), eyeR: eye(.042), browL: brow(-.044), browR: brow(.044) };
    var closed = new THREE.Group();
    head.add(closed);
    var mouthLine = [[-.026,.035],[-.012,.039],[0,.037],[.013,.040],[.027,.036]];
    curve(closed,m.lips,path(mouthLine,.0017,[0,0,0]),.0024);
    curve(closed,m.lid,path([[-.018,.034],[-.007,.032],[.008,.033],[.019,.035]],.0012,[0,0,0]),.0014);
    faceControls.mouthClosed = closed;
    faceControls.mouthOpen = oval(head,m.mouth,0,.035,faceZ(0,.035)+.002,.020,.009,.0043);
    faceControls.mouthOpen.visible = false;
    if (!style || style === STYLES.elder) {
      [-1,1].forEach(function (s) {
        curve(head,m.lid,path([[s*.034,.067],[s*.039,.055],[s*.040,.043],[s*.033,.033]],.0005,[0,0,0]),.0009);
        curve(head,m.lid,path([[s*.030,.114],[s*.048,.111],[s*.064,.113]],.0004,[0,0,0]),.0007);
      });
    }
    return faceControls;
  }

  function makeLegs(root, m, moving) {
    return [-1,1].map(function (side) {
      var leg = new THREE.Group();
      leg.position.x = side * .105;
      root.add(leg);
      add(leg, volume([
        [.076,.047,.065,0,.007], [.103,.055,.066,0,.010], [.151,.065,.073,.004,.007],
        [.289,.061,.069,.009,0], [.429,.067,.078,.007,.006], [.558,.084,.097,.003,-.007],
        [.705,.108,.114,-side*.013,-.024], [.798,.095,.094,-side*.020,-.025],
        [.816,.008,.008,-side*.023,-.021],
      ], function (a,y) {
        return .0025 * Math.sin(a*5 + y*13) * Math.sin(y*21) +
          .0035 * Math.cos(y*77+a*3) * (g(0,y,0,.46,1,.07)+g(0,y,0,.14,1,.045));
      }), m.trousers);
      curve(leg,m.seam,[[side*.052,.10,-.01],[side*.062,.28,-.009],[side*.071,.45,-.008],
        [side*.092,.62,-.024],[side*.096,.74,-.038]],.0017);
      var shoe = new THREE.Group();
      shoe.rotation.y = side * .12;
      leg.add(shoe);
      oval(shoe,m.sole,0,.022,.075,.065,.018,.149);
      oval(shoe,m.shoes,0,.056,.079,.062,.043,.143);
      oval(shoe,m.shoes,0,.080,.018,.047,.033,.073);
      curve(shoe,m.seam,[[-.047,.065,.095],[-.034,.082,.113],[0,.090,.122],[.035,.083,.114],[.050,.065,.096]],.0018);
      if (moving) {
        leg.position.y = .78;
        leg.children.forEach(function (part) { part.position.y -= .78; });
      }
      return leg;
    });
  }

  function makeBlouse(root, m) {
    var fabric = add(root, volume([
      [.746,.165,.100,0,-.021],[.771,.214,.132,0,-.012],[.859,.202,.125,0,-.012],
      [.969,.187,.125,0,-.018],[1.069,.199,.141,0,-.020],[1.174,.211,.119,0,-.025],
      [1.231,.193,.100,0,-.016],[1.278,.134,.083,0,-.013],[1.303,.057,.052,0,-.005],
      [1.313,.049,.044,0,-.005],
    ], function (a,y) {
      var folds = .004 * Math.sin(a*8 + y*11) * g(0,y,0,.827,1,.102);
      return folds + .0037 * Math.sin(y*57+a*2) * Math.cos(a*4) * g(0,y,0,1.008,1,.24);
    }), m.shirt);
    fabric.name = 'FittedWovenBlouse';
    curve(root,m.plain,[[0,.769,.121],[0,.874,.119],[0,.982,.118],[0,1.076,.125],
      [0,1.176,.096],[-.009,1.253,.076],[-.012,1.289,.050]],.008);
    [-1,1].forEach(function (side) {
      curve(root,m.stitching,[[side*.054,1.287,.018],[side*.043,1.270,.064],
        [side*.076,1.216,.078],[side*.087,1.245,.059]],.0045);
    });
    for (var i = 0; i < 6; i++) {
      var y = .82 + i * .064;
      var z = y < 1.088 ? .131 : .112;
      oval(root,m.button,.001,y,z,.010,.010,.0038);
    }
    curve(root,m.stitching,[[.065,1.081,.112],[.097,1.080,.105],[.132,1.079,.083]],.002);
    curve(root,m.plain,[[.065,1.072,.111],[.066,.996,.095],[.117,.999,.083],[.132,1.063,.084]],.0028);
  }

  function makeArm(root, m, side) {
    var arm = new THREE.Group();
    arm.position.set(side*.187, 1.205, -.019);
    arm.rotation.z = -side*.095;
    root.add(arm);
    add(arm,volume([
      [-.370,.041,.043,side*.024,.038],[-.339,.049,.049,side*.028,.024],[-.274,.054,.057,side*.030,.014],
      [-.183,.059,.062,side*.025,0],[-.082,.063,.076,side*.015,-.009],[-.002,.071,.087,0,-.008],
      [.034,.053,.068,-side*.018,-.009],[.044,.004,.004,-side*.019,-.011],
    ],function (a,y) {
      return .0030*Math.sin(y*69 + a*4)*g(0,y,0,-.265,1,.112);
    }),m.shirt);
    add(arm,volume([
      [-.465,.029,.025,side*.021,.068],[-.431,.033,.029,side*.023,.061],
      [-.393,.039,.036,side*.024,.049],[-.356,.041,.037,side*.024,.038],
    ]),m.skin);
    var hand = new THREE.Group();
    hand.position.set(side*.020,-.464,.068);
    hand.rotation.x = side > 0 ? -.37 : -.19;
    arm.add(hand);
    oval(hand,m.skin,0,-.027,.001,.035,.044,.022);
    for (var i = 0; i < 4; i++) {
      var finger = oval(hand,m.skin,(i-1.5)*.014,-.062-i*.001,.008,.008,.025-(i===3?.007:0),.008);
      finger.rotation.x = side > 0 ? -.68 : -.22;
    }
    oval(hand,m.skin,-side*.029,-.031,.016,.010,.025,.011).rotation.z = side*.37;
    return arm;
  }

  function carryBasket(arm,m) {
    var basket = new THREE.Group();
    basket.position.set(.022,-.644,.093);
    basket.rotation.z = .09;
    arm.add(basket);
    var shell = add(basket,new THREE.CylinderGeometry(.133,.088,.176,28,1,true),m.basket);
    shell.scale.z = .85;
    var bottom = add(basket,new THREE.CircleGeometry(.088,28),m.basketInside);
    bottom.position.y = -.087;
    bottom.rotation.x = -Math.PI/2;
    bottom.scale.y = .85;
    for (var n=0;n<3;n++) {
      var rim = add(basket,new THREE.TorusGeometry(n===0?.088:.134,n===0?.006:.007,6,28),m.reed);
      rim.rotation.x = Math.PI/2;
      rim.position.y = [-.085,.076,.089][n];
      rim.scale.y = .85;
    }
    curve(basket,m.reed,[[-.125,.076,0],[-.097,.144,.006],[-.049,.181,.009],[0,.197,.009],
      [.055,.180,.008],[.101,.144,.005],[.125,.076,0]],.012);
    oval(basket,m.bag,-.047,.028,-.026,.071,.037,.062);
    oval(basket,m.leaf,.054,.04,.016,.047,.051,.048);
  }

  function create() {
    var m = getMaterials(), root = new THREE.Group();
    root.name = 'StreetAuntDetailed';
    makeLegs(root,m);
    makeBlouse(root,m);
    var leftArm = makeArm(root,m,-1), rightArm = makeArm(root,m,1);
    carryBasket(rightArm,m);
    var head = new THREE.Group();
    head.position.set(0,1.373,.015);
    head.rotation.y = -.08;
    root.add(head);
    root.scale.setScalar(1.19);
    addContactShadow(root);
    root.userData = {
      kind: 'person', head: head, leftArm: leftArm, rightArm: rightArm, restingArm: .095,
      faceControls: buildFace(head,m),
    };
    return root;
  }

  var STYLES = {
    mechanic: {
      name: 'StreetMechanic', complexion: 0x9d6e53, cheek: 0xa47355,
      coat: 0x425d52, seam: 0x8c9b82, trousers: 0x34413a, accessory: 0x283429,
      width: 1.10, height: 1.05, jaw: 1.09, hairline: .025,
    },
    elder: {
      name: 'StreetMarketElder', complexion: 0xac7b5b, cheek: 0xa97655,
      coat: 0x766341, seam: 0xaa9673, trousers: 0x423e33, accessory: 0x594831,
      width: .94, height: .97, jaw: .89, hairline: .036,
    },
    commuter: {
      name: 'StreetCommuter', complexion: 0xb78467, cheek: 0xae7962,
      coat: 0x304d70, seam: 0x768e9b, trousers: 0x565346, accessory: 0x9a7956,
      width: .87, height: 1.01, jaw: .94, hairline: .004, nape: .051,
    },
  };

  function passerbyPalette(kind, style) {
    if (!passerbyMaterials[kind]) {
      passerbyMaterials[kind] = Object.assign({}, getMaterials(), {
        shirt: shading(style.coat), plain: shading(style.coat),
        stitching: shading(style.seam), trousers: shading(style.trousers),
        skin: shading(style.complexion), accessory: shading(style.accessory),
      });
      passerbyMaterials[kind].plain.color.multiplyScalar(.73);
      if (kind === 'elder') {
        var knit = pattern(128,128,function (ctx,w,h) {
          ctx.fillStyle = '#c5bcaa';
          ctx.fillRect(0,0,w,h);
          for (var y = 0; y < h; y += 4) {
            for (var x = 0; x < w; x += 4) {
              ctx.fillStyle = (x + y) % 12 ? '#f0e3c957' : '#776d585c';
              ctx.fillRect(x + 1,y + 1,2,1);
            }
          }
        });
        passerbyMaterials[kind].shirt.map = knit;
      }
    }
    return passerbyMaterials[kind];
  }

  function cap(head, m, brim) {
    var crown = oval(head, m.accessory, 0,.194,-.023,.115,.064,.113);
    crown.rotation.x = .14;
    var bill = oval(head,m.plain,0,.177,.086,.096,.010,brim);
    bill.rotation.x = -.14;
    curve(head,m.stitching,[[-.081,.179,.069],[-.042,.170,.110],[0,.168,.124],
      [.042,.170,.110],[.081,.179,.069]],.0018);
  }

  function outfits(kind, body, head, arms, m) {
    if (kind === 'mechanic') {
      cap(head,m,.070);
      var bib = add(body,surface(16,20,function (u,v) {
        var a = THREE.MathUtils.lerp(-.95,.95,u);
        var t = Math.sin(a);
        var hem = .641 + .023 * Math.pow(t,4);
        return [t*THREE.MathUtils.lerp(.224,.154,v), THREE.MathUtils.lerp(hem,1.145,v),
          .053+Math.cos(a)*.110 + Math.sin(u*19)*.003*(1-v)];
      }), m.accessory);
      bib.name = 'RepairApron';
      [-1,1].forEach(function (side) {
        curve(body,m.accessory,[[side*.113,1.26,.051],[side*.095,1.197,.101],[side*.071,1.129,.154]],.014);
      });
      curve(body,m.stitching,[[-.076,.895,.151],[-.038,.893,.163],[.054,.895,.161]],.002);
      curve(body,m.plain,[[-.076,.893,.151],[-.070,.788,.151],[-.011,.778,.166],
        [.047,.792,.159],[.054,.893,.161]],.003);
      var wrench = new THREE.Group();
      wrench.position.set(.025,-.505,.104);
      wrench.rotation.z = -.3;
      arms[1].add(wrench);
      var iron = m.seam;
      curve(wrench,iron,[[0,.01,0],[0,-.082,0],[.003,-.137,0]],.009);
      curve(wrench,iron,[[-.018,-.113,0],[-.024,-.147,0],[.003,-.161,0],[.029,-.146,0],[.026,-.113,0]],.007);
    } else if (kind === 'elder') {
      cap(head,m,.043);
      curve(body,m.accessory,[[-.102,1.273,.017],[-.065,1.310,.059],[0,1.303,.068],
        [.058,1.295,.060],[.104,1.273,.017]],.014);
      curve(body,m.stitching,[[-.148,.921,.084],[-.122,.912,.095],[-.087,.899,.105]],.004);
      var frame = new THREE.TorusGeometry(.024,.00175,5,22);
      [-1,1].forEach(function (side) {
        var rim = add(head,frame,m.brow);
        rim.position.set(side*.041,.128,.101);
        rim.scale.y = .72;
        curve(head,m.brow,[[side*.062,.128,.097],[side*.089,.139,.053],[side*.105,.13,-.019]],.0014);
      });
      curve(head,m.brow,[[-.019,.127,.106],[0,.137,.111],[.019,.127,.106]],.0016);
      curve(head,m.brow,[[-.024,.047,.097],[-.010,.050,.109],[0,.047,.110],[.010,.050,.108],[.025,.047,.097]],.0024);
      var cane = new THREE.Group();
      cane.position.set(.030,-.520,.108);
      arms[1].add(cane);
      curve(cane,m.sole,[[.046,-.63,.012],[.040,-.18,.013],[.04,-.010,.017],[.031,.011,.025],[-.032,.011,.025]],.009);
    } else {
      oval(head,m.hair,0,.117,-.101,.087,.082,.037).rotation.x = -.16;
      var strap = [[-.148,1.264,.049],[-.098,1.155,.109],[-.023,1.035,.148],[.066,.913,.123],[.176,.808,.059]];
      curve(body,m.accessory,strap,.009);
      var bag = new THREE.Group();
      bag.position.set(.174,.758,.054);
      bag.rotation.z = .18;
      body.add(bag);
      add(bag,volume([
        [-.102,.062,.025,0,0],[-.084,.116,.036,0,0],[-.026,.124,.059,0,0],
        [.069,.114,.048,0,0],[.087,.087,.027,0,0],
      ]),m.accessory);
      curve(bag,m.stitching,[[-.095,.048,.031],[-.046,.022,.063],[.037,.021,.063],[.094,.045,.032]],.0026);
    }
  }

  function createPasserby(kind) {
    var style = STYLES[kind];
    if (!style) throw new Error('Unknown street pedestrian: ' + kind);
    var m = passerbyPalette(kind,style), root = new THREE.Group();
    root.name = style.name;
    root.scale.setScalar(kind === 'elder' ? 1.15 : 1.18);
    var body = new THREE.Group();
    root.add(body);
    var legs = makeLegs(body,m,kind === 'commuter');
    makeBlouse(body,m);
    var arms = [makeArm(body,m,-1),makeArm(body,m,1)];
    body.scale.set(style.width,style.height,1);
    var head = new THREE.Group();
    head.position.set(0,1.354,.014);
    head.scale.set(style.jaw,kind === 'mechanic' ? .96 : 1,kind === 'elder' ? 1.05 : 1);
    body.add(head);
    buildFace(head,m,style);
    outfits(kind,body,head,arms,m);
    addContactShadow(root);
    root.userData = { passerby: kind, head: head, arms: arms, legs: legs };
    return root;
  }

  return { create: create, createPasserby: createPasserby };
})();

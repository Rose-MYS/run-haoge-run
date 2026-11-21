window.RunnerToon = (function () {
  'use strict';

  var bands = ['#0a0a0a', '#5c5c5c', '#bdbdbd', '#ffffff'];
  var outlineColor = 0x171310;
  var outlineWidth = 0.014;
  var gradient;

  function gradientMap() {
    if (gradient) return gradient;
    var canvas = document.createElement('canvas');
    canvas.width = bands.length;
    canvas.height = 1;
    var ctx = canvas.getContext('2d');
    bands.forEach(function (color, i) {
      ctx.fillStyle = color;
      ctx.fillRect(i, 0, 1, 1);
    });
    gradient = new THREE.CanvasTexture(canvas);
    gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
    gradient.generateMipmaps = false;
    return gradient;
  }

  function toonMaterial(source) {
    return new THREE.MeshToonMaterial({
      color: source.color,
      map: source.map,
      vertexColors: source.vertexColors,
      alphaMap: source.alphaMap,
      alphaTest: source.alphaTest,
      opacity: source.opacity,
      transparent: source.transparent,
      side: source.side,
      gradientMap: gradientMap(),
    });
  }

  function addOutline(mesh) {
    var material = new THREE.MeshBasicMaterial({
      color: outlineColor,
      side: THREE.BackSide,
      depthWrite: false,
    });
    material.onBeforeCompile = function (shader) {
      shader.uniforms.runnerOutlineWidth = { value: outlineWidth };
      shader.vertexShader = 'uniform float runnerOutlineWidth;\n' + shader.vertexShader.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\n' +
        '#ifdef USE_SKINNING\n' +
        'vec3 outlineNormal = -transformedNormal;\n' +
        '#else\n' +
        'vec3 outlineNormal = normalMatrix * normal;\n' +
        '#endif\n' +
        'mvPosition.xyz += outlineNormal * (runnerOutlineWidth / max(length(outlineNormal), 0.00001));\n' +
        'gl_Position = projectionMatrix * mvPosition;'
      );
    };
    var outline = new (mesh.isSkinnedMesh ? THREE.SkinnedMesh : THREE.Mesh)(mesh.geometry, material);
    if (mesh.isSkinnedMesh) {
      outline.bindMode = mesh.bindMode;
      outline.bind(mesh.skeleton, mesh.bindMatrix);
    }
    // 描边进入同一景深测试，随原网格运动。
    outline.renderOrder = 1;
    outline.frustumCulled = false;
    mesh.add(outline);
  }

  function apply(model) {
    var meshes = [];
    var converted = new Map();
    function convert(material) {
      if (material.isMeshBasicMaterial || material.isMeshToonMaterial) return material;
      if (!converted.has(material)) converted.set(material, toonMaterial(material));
      return converted.get(material);
    }
    model.traverse(function (mesh) {
      if (mesh.isMesh && mesh.material) meshes.push(mesh);
    });
    meshes.forEach(function (mesh) {
      var materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      var canOutline = (mesh.isSkinnedMesh || mesh.userData.toonOutline) && mesh.geometry.getAttribute('normal') &&
        materials.every(function (m) { return m && !m.transparent && !m.alphaTest; });
      mesh.material = Array.isArray(mesh.material)
        ? materials.map(convert)
        : convert(mesh.material);
      if (canOutline) addOutline(mesh);
    });
  }

  return { apply: apply };
})();

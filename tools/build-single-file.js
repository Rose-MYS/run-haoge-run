const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
const sourceOnly = html.includes('window.HAOGE_SOURCE_ONLY = true');
const args = process.argv.slice(2);
const campaign = args.includes('--campaign');
const refinedChaser = (!sourceOnly && campaign) || args.includes('--huaqiang-refined');
const streetPreview = campaign || args.includes('--street-preview');
const [outputArg, modelArg] = args.filter(arg => !['--huaqiang-refined', '--street-preview', '--campaign'].includes(arg));
const outPath = outputArg ? path.resolve(outputArg) : path.join(root, 'dist', '郝哥快跑.html');
const procedural = modelArg === '--procedural';
const haogeModel = modelArg && !procedural ? path.resolve(modelArg) : null;
if (sourceOnly && refinedChaser) {
  throw new Error('--huaqiang-refined requires the full local game assets and GLB-enabled entry');
}
if (procedural && refinedChaser) {
  throw new Error('--huaqiang-refined requires the GLB build');
}

function dataUrl(assetPath, mimeType) {
  const file = assetPath === 'assets/models/haoge.glb' && haogeModel
    ? haogeModel
    : path.join(root, assetPath);
  const base64 = fs.readFileSync(file).toString('base64');
  return 'data:' + mimeType + ';base64,' + base64;
}

if (procedural) {
  html = html.replace('<script src="js/vendor/three.min.js', '<script>window.HAOGE_PROCEDURAL_CHARACTERS = true;</script>\n$&');
}
if (streetPreview) {
  const mode = campaign ? 'window.HAOGE_CAMPAIGN = true;' : 'window.HAOGE_STREET_PREVIEW = true;';
  html = html.replace('<body>', campaign ? '<body class="street-ui street-campaign">' : '<body class="street-ui">');
  html = html.replace('<script src="js/vendor/three.min.js', () => '<script>' + mode + '</script>\n<script src="js/vendor/three.min.js');
}

html = html.replace(/<link rel="stylesheet" href="(css\/(?:style|street-ui)\.css)(?:\?v=\d+)?">/g, (_tag, file) => {
  const css = fs.readFileSync(path.join(root, file), 'utf8');
  return '<style>\n' + css + '\n</style>';
});

html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  const file = src.split('?')[0];
  if (file === 'js/model-switch.js') return '';

  let js = fs.readFileSync(path.join(root, file), 'utf8');
  if (!sourceOnly && file === 'js/audio.js') {
    js = js.replace(/registerVoice\(('[\w]+'), 'assets\/audio\/([^']+)'(, \d+)?\)/g, (mm, name, file, stack) => {
      return "registerVoice(" + name + ", '" + dataUrl('assets/audio/' + file, 'audio/mpeg') + "'" + (stack || '') + ")";
    });
  }
  if (!sourceOnly && !procedural && file === 'js/models.js') {
    if (campaign) {
      js = js.replace(/'(assets\/models\/haoge-reviewed\.glb)'/, (match, asset) =>
        "'" + dataUrl(asset, 'model/gltf-binary') + "'");
    } else {
      js = js.replace(/'(assets\/models\/(?:haoge|subway_player1)\.glb)'/g, (match, asset) =>
        "'" + dataUrl(asset, 'model/gltf-binary') + "'");
      js = js.replace(/'(assets\/textures\/haoge-face\.png)\?v=\d+'/g, (match, asset) =>
        "'" + dataUrl(asset, 'image/png') + "'");
    }
    if (refinedChaser) {
      js = js.replace(/'(assets\/models\/huaqiang-refined\.glb)'/, (match, asset) =>
        "'" + dataUrl(asset, 'model/gltf-binary') + "'");
    }
  }
  return '<script>\n' + js + '\n</script>';
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, { encoding: 'utf8', flag: 'wx' });
console.log('written: ' + outPath + ' (' + fs.statSync(outPath).size + ' bytes)');

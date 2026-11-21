const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
const outputArg = process.argv[2];
const outPath = outputArg ? path.resolve(outputArg) : path.join(root, 'dist', '郝哥快跑.html');
const haogeModel = process.argv[3] ? path.resolve(process.argv[3]) : null;

function dataUrl(assetPath, mimeType) {
  const file = assetPath === 'assets/models/haoge.glb' && haogeModel
    ? haogeModel
    : path.join(root, assetPath);
  const base64 = fs.readFileSync(file).toString('base64');
  return 'data:' + mimeType + ';base64,' + base64;
}

let html = fs.readFileSync(htmlPath, 'utf8');
const sourceOnly = html.includes('window.HAOGE_SOURCE_ONLY = true');

html = html.replace(/<link rel="stylesheet" href="css\/style\.css">/, () => {
  const css = fs.readFileSync(path.join(root, 'css', 'style.css'), 'utf8');
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
  if (!sourceOnly && file === 'js/models.js') {
    js = js.replace(/'(assets\/models\/(?:haoge|subway_player1)\.glb)'/g, (match, asset) =>
      "'" + dataUrl(asset, 'model/gltf-binary') + "'");
    js = js.replace(/'(assets\/textures\/haoge-face\.png)\?v=\d+'/g, (match, asset) =>
      "'" + dataUrl(asset, 'image/png') + "'");
  }
  return '<script>\n' + js + '\n</script>';
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, { encoding: 'utf8', flag: 'wx' });
console.log('written: ' + outPath + ' (' + fs.statSync(outPath).size + ' bytes)');

const fs = require('node:fs');
const path = require('node:path');

const [haogeFile, huaqiangFile, outputFile] = process.argv.slice(2);
if (!haogeFile || !huaqiangFile || !outputFile) {
  throw new Error('Usage: node tools/package-published-cast.js <haoge.glb> <huaqiang-refined.glb> <cast.js>');
}

function embedGLB(file) {
  const model = fs.readFileSync(file);
  const valid = model.length >= 20 && model.toString('ascii', 0, 4) === 'glTF' &&
    model.readUInt32LE(4) === 2 && model.readUInt32LE(8) === model.length;
  if (!valid) throw new Error('Expected a complete GLB 2 model: ' + path.basename(file));
  return 'data:model/gltf-binary;base64,' + model.toString('base64');
}

const cast = { haoge: embedGLB(haogeFile), huaqiang: embedGLB(huaqiangFile) };
const asset = '// Generated from the two reviewed game character models.\n' +
  'window.HAOGE_APPROVED_CAST = ' + JSON.stringify(cast) + ';\n';
fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
fs.writeFileSync(outputFile, asset, { encoding: 'utf8', flag: 'wx' });

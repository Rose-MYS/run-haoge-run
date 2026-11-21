/* 郝哥快跑 · 本地开发静态服务器（临时工具）
 * 用法: node tools/serve-dev.js [port]   默认 8787
 * 说明: 浏览器 file:// 协议禁止读取外部 .glb（CORS/fetch 限制），
 *       开发期请用本服务器打开 http://127.0.0.1:8787/index.html 以加载 GLB 模型。
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = fs.realpathSync(path.resolve(__dirname, '..'));
const PORT = parseInt(process.argv[2] || '8787', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.glb': 'model/gltf-binary',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.bat': 'text/plain; charset=utf-8',
};

function isPublicPath(file) {
  const relative = path.relative(ROOT, file);
  return relative && !path.isAbsolute(relative) &&
    !relative.split(path.sep).some(part => part.startsWith('.'));
}

http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    res.writeHead(400); res.end('bad request'); return;
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.join(ROOT, urlPath);
  if (!isPublicPath(file)) {
    res.writeHead(403); res.end('forbidden'); return;
  }

  fs.realpath(file, (resolveError, resolved) => {
    if (resolveError) {
      res.writeHead(404); res.end('not found'); return;
    }
    if (!isPublicPath(resolved)) {
      res.writeHead(403); res.end('forbidden'); return;
    }
    fs.stat(resolved, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(resolved).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(resolved).on('error', () => res.destroy()).pipe(res);
    });
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log('郝哥快跑 dev server: http://127.0.0.1:' + PORT + '/');
});

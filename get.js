import { readFile } from 'fs/promises';
import zlib from 'zlib';

function ct(path) {
 const extension = path.split('.').pop().toLowerCase();
 let contentType = '';
 switch (extension) {
  case 'js':
   contentType = 'text/javascript';
   break;
  case 'css':
   contentType = 'text/css';
   break;
  case 'jpg':
   contentType = 'image/jpg';
   break;
  case 'pdf':
   contentType = 'application/pdf';
   break;
  case 'woff2':
   contentType = 'font/woff2';
   break;
  case 'png':
   contentType = 'image/png';
   break;
  case 'gif':
   contentType = 'image/gif';
   break;
  case 'zip':
   contentType = 'application/zip';
   break;
  case 'json':
   contentType = 'application/json';
   break;
  case 'svg':
   contentType = 'image/svg+xml';
   break;
  case 'ico':
   contentType = 'image/x-icon';
   break;
  default:
   contentType = 'text/html';
   break;
 }
 return contentType;
}
function toArrayBuffer(buffer) {
 return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}
function saferesolve(base, target) {
 const filePath = path.resolve(base, target);
 const isFileOutsideDir = filePath.indexOf(path.resolve(base)) !== 0;
 if (isFileOutsideDir) return false;
 return filePath;
}
const securityHeaders = [
 { name: 'server', value: 'https://' + global.HOST },
 { name: 'Strict-Transport-Security', value: 'max-age=5184000' },
 { name: 'X-Content-Type-Options', value: 'nosniff' },
 { name: 'X-Frame-Options', value: 'DENY' },
 { name: 'X-Powered-By', value: 'G' },
 { name: 'Referrer-Policy', value: 'no-referrer' },
 { name: 'X-Download-Options', value: 'noopen' },
 { name: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
 { name: 'X-DNS-Prefetch-Control', value: 'off' },
 { name: 'X-XSS-Protection', value: '1; mode=block' },
 {
  name: 'Content-Security-Policy',
  value: `
 default-src 'self';
 script-src 'self' ${global.HOST.contains('analitic') && 'unsafe-eval'} https://*.googleapis.com;
 connect-src 'self' wss: https://*.googleapis.com https://*.ytimg.com;
 img-src * 'self' data: blob:;
 style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
 font-src 'self' https://fonts.gstatic.com data:;
 frame-src 'self' https://www.youtube.com/;
 manifest-src 'self'`,
 },
];
const noCache = [
 { name: 'Cache-Control', value: 'no-store, max-age=0' },
 { name: 'Pragma-directive', value: 'no-cache' },
 { name: 'Cache-directive', value: 'no-cache' },
 { name: 'Pragma', value: 'no-cache' },
 { name: 'Expires', value: 'no-cache' },
];
const cache = [{ name: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];

export default async function (res, req) {
 res.onAborted(() => {
  res.aborted = true;
 });
 let readStream;
 let acceptEncoding = req.getHeader('accept-encoding');
 console.log(req.getUrl());
 const path = req.getUrl().slice(1) || 'index.html';
 const contentType = ct(path);
 const fileName = saferesolve('./', path);
 try {
  const file = await readFile(fileName);
  readStream = toArrayBuffer(file);
  res.cork(() => {
   res.writeHeader('Content-Type', contentType);
   for (let i = 0; i < securityHeaders.length; i += 1) res.writeHeader(securityHeaders[i].name, securityHeaders[i].value);
   if (!acceptEncoding || contentType === 'image/jpg' || contentType === 'font/woff2' || contentType === 'image/png' || contentType === 'image/gif' || contentType === 'application/zip') {
    acceptEncoding = '';
    for (let i = 0; i < cache.length; i += 1) res.writeHeader(cache[i].name, cache[i].value);
   } else for (let i = 0; i < noCache.length; i += 1) res.writeHeader(noCache[i].name, noCache[i].value);
   if (/\bgzip\b/.test(acceptEncoding)) {
    res.writeHeader('Content-Encoding', 'gzip');
    readStream = zlib.gzipSync(readStream);
   } else if (/\bdeflate\b/.test(acceptEncoding)) {
    res.writeHeader('Content-Encoding', 'deflate');
    readStream = zlib.deflateSync(readStream);
   }
   if (!res.aborted) res.end(readStream);
  });
 } catch {
  if (!res.aborted) res.cork(() => res.writeStatus('404').end());
 }
}

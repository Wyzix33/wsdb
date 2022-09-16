import { readFile } from 'fs/promises';
import path from 'path';
global.HOST = 'analitic.go.ro:9999';
function ct(pathu) {
 const extension = pathu.split('.').pop().toLowerCase();
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
 { name: 'Referrer-Policy', value: 'no-referrer' },
 { name: 'X-Download-Options', value: 'noopen' },
 { name: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
 { name: 'X-DNS-Prefetch-Control', value: 'off' },
 { name: 'X-XSS-Protection', value: '1; mode=block' },
 {
  name: 'Content-Security-Policy',
  value: `
 default-src 'self';
 script-src 'self' ${global.HOST.includes('analitic') ? '\'unsafe-eval\'' : ''};
 connect-src 'self' wss:;
 img-src * 'self' data: blob:;
 style-src 'self' 'unsafe-inline';
 font-src 'self';
 frame-src 'self';
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
 const pathu = req.getUrl().slice(1) || 'index.html';
 const contentType = ct(pathu);
 const fileName = saferesolve('./frontEnd', pathu);
 try {
  const file = await readFile(fileName);
  readStream = toArrayBuffer(file);
  res.cork(() => {
   res.writeHeader('Content-Type', contentType);
   if (['text/javascript', 'text/css', 'text/html', 'image/svg+xml'].includes(contentType)) res.writeHeader('Content-Encoding', 'br');
   for (let i = 0; i < securityHeaders.length; i += 1) res.writeHeader(securityHeaders[i].name, securityHeaders[i].value);
   if (['image/jpg', 'font/woff2', 'image/png', 'image/gif', 'application/zip'].includes(contentType)) for (let i = 0; i < cache.length; i += 1) res.writeHeader(cache[i].name, cache[i].value);
   else for (let i = 0; i < noCache.length; i += 1) res.writeHeader(noCache[i].name, noCache[i].value);
   if (!res.aborted) res.end(readStream);
  });
 } catch {
  if (!res.aborted) res.cork(() => res.writeStatus('404').end());
 }
}

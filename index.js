import { MongoClient } from 'mongodb';
import uWS from 'uWebSockets.js';
// import post from './src/post.js';
// import upload from './src/upload.js';
import get from './get.js';
// import { Auth } from './src/auth.js';
/**
 *
 * @param {string} uri connection to DB 'mongodb://user:pass@ip:port/db'
 * @param {function} initDb daca nu exista db il creem cu functia asta
 * @param {function} emitDb(ws) dupa logare se executa functia asta sa trimita db clientului
 * @param {function} onMessage(ws, msg) functia care rezolva cererile
 * @param {function} onPost(res, post, auth) functia care rezolva cererile
 * @param {function} getUtils(res, req) utilitati pe GET
 * @param {function} postUtils(res, req) utilitati pe GET
 * @param {function} getManifest(res, req) manifest pe GET
 */
export default async function (options) {
 const db = await new MongoClient(options.uri, { useNewUrlParser: true, useUnifiedTopology: true }).connect();
 global.DB = db.db();
 const colections = await global.DB.listCollections().toArray();
 if (!colections.length && typeof options.initDb === 'function') await options.initDb();
 global.APP = uWS
  .SSLApp({ key_file_name: './privkey.pem', cert_file_name: './fullchain.pem' })
  .ws('/*', {
   compression: uWS.DISABLED,
   maxBackpressure: 16 * 1024 * 1024,
   maxPayloadLength: 10 * 1024 * 1024,
   sendPingsAutomatically: true,
   idleTimeout: 16, // 320  = 5 min
   upgrade: (res, req, context) => {
    try {
     // daca e logat
    } catch {
     return res.writeStatus('401').end();
    }
    res.upgrade({ uid: res.user._id }, req.getHeader('sec-websocket-key'), req.getHeader('sec-websocket-protocol'), req.getHeader('sec-websocket-extensions'), context);
   },
   open: (ws) => {
    console.log('A WebSocket connected with URL: ' + ws.url);
   },
   // message: Auth.message.bind(Auth, options.onMessage),
   // close: Auth.close.bind(Auth),
  })
  // .post('/upload', upload)
  // .post('/util/*', (res, req) => post(res, req, options.postUtils))
  // .get('/manifest.json', options.getManifest)
  // .get('/util/*', options.getUtils)
  // .post('/*', (res, req) => post(res, req, options.onPost))
   .any('/*', get)
  .listen(options.port || 443, (token) => {
   if (token) console.log('Listening to port ' + (options.port || 443));
   else console.log('Failed to listen to port ' + (options.port || 443));
  });
}
const getCookie = (res, req, name) => {
 res.cookies ??= req.getHeader('cookie');
 return res.cookies && res.cookies.match((getCookie[name] ??= new RegExp(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`)))?.[2];
};

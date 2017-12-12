/**
 * 服务器入口文件，负责启动和各种初始化
 */
import Koa from 'koa';
import https from 'https';
import fs from 'fs';
import staticMiddleware from 'koa-static';
import config from './config';
import router from './app/router';
import socketInit from './websocket';

const app = new Koa();

app.use(staticMiddleware(config.staticPath)); // 设置静态资源目录
app.use(router.routes());// 路由


app.use((ctx) => {
	ctx.body = '没有匹配到任何内容';
});

const server = https.createServer({
	key: fs.readFileSync('./bin/csr/privatekey.key'),
	cert: fs.readFileSync('./bin/csr/certificate.crt')
}, app.callback()).listen(config.port);

socketInit(server);// 启动websocket服务器

console.log('服务器已启动');

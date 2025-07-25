/**
 * 服务器入口文件，负责启动和各种初始化
 */
import Koa from 'koa';
import https from 'https';
import fs from 'fs';
import staticMiddleware from 'koa-static';
import bodyParser from 'koa-bodyparser';
import cors from 'koa2-cors';
import config from './config';
import DBInit from './app/db';
import router from './app/router';
import authorization from './middleware/auth';
import socketInit from './websocket';

const app = new Koa();
DBInit(); // 数据库初始化
app.use(cors({
    ...config.cors,
    origin(ctx) {
      if (config.cors.origin.includes(ctx.header.origin)) {
        return ctx.header.origin;
      }
      return false;
    },
  })); // 跨域配置
app.use(staticMiddleware(config.staticPath)); // 设置静态资源目录
app.use(bodyParser());
app.use(authorization);
app.use(router.routes()); // 路由

app.use((ctx) => {
  ctx.body = '没有匹配到任何内容';
});

const server = https
  .createServer(
    {
      key: fs.readFileSync('./bin/csr/privatekey.key'),
      cert: fs.readFileSync('./bin/csr/certificate.crt'),
    },
    app.callback()
  )
  .listen(config.port);

socketInit(server); // 启动websocket服务器1

console.log('服务器已启动');

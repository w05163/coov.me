/**
 * 服务器入口文件，负责启动和各种初始化
 */
import Koa from 'koa';
import CONFIG from './config';
import router from './app/router';
import staticMiddleware from 'koa-static';


const app = new Koa();

app.use(staticMiddleware(CONFIG.staticPath)); // 设置静态资源目录
app.use(router.routes());// 路由

app.use(ctx => {
	ctx.body = '没有匹配到任何内容';
});
app.listen(CONFIG.port);
console.log('服务器已启动');

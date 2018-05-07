/**
 * 路由配置
 */
import Router from 'koa-router';
import { supplementPath } from '../../util/router';
import main from './main';
import api from './api';

const routerObj = {
	api
};

const router = new Router();

/**
 * 自动化添加路由
 * @param {Array} routers 路由数组
 */
function forRouters(routers) {
	routers.forEach(r => router[r.method](r.path, r.controller));
}

forRouters(main);

for (const key in routerObj) {
	const tem = supplementPath(routerObj[key], 'path', '', key);
	forRouters(tem);
}

export default router;

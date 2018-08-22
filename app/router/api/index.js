/**
 * 汇集所有api的路由配置
 */
import errorCode from '../../../config/error';
import CodeError from '../../../util/error';
import { supplementPath, controllerMapToRouter } from '../../../util/router';
import openController from '../../controller/open';
import userController from '../../controller/user';


function apiBodyExtend(routers) {
	return routers.map((r) => {
		const router = { ...r };
		router.controller = async function (ctx, ...args) {
			const data = null;
			const body = {
				success: true,
				code: 0,
				message: '请求成功',
				data
			};
			try {
				body.data = await r.controller(ctx, ...args);
			} catch (e) {
				console.log(e);
				body.success = false;
				if (e instanceof CodeError) {
					body.code = e.code;
					body.message = e.message || errorCode[e.code];
				} else {
					body.code = 101;
					body.message = errorCode[body.code];
				}
			}
			ctx.body = body;
		};
		return router;
	});
}

export default apiBodyExtend([
	...supplementPath(controllerMapToRouter(openController), 'name', 'open'),
	...supplementPath(controllerMapToRouter(userController), 'name', 'user')
]);

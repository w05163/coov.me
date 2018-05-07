/**
 * 汇集所有api的路由配置
 */
import errorCode from '../../../config/error';
import CodeError from '../../../util/error';
import { supplementPath } from '../../../util/router';
import openRouter from './open';
import userRouter from './user';

const open = supplementPath(openRouter, 'name', 'open');
const user = supplementPath(userRouter, 'name', 'user');


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
	...open,
	...user
]);

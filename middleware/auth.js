/** 请求校验中间件 */
import errors from '../config/error';
import { getUserByToken } from '../app/service/auth';

const reg = /^((\/api\/open\/.+)|(?!\/api\/))/;

// 校验用户角色，是否有对应路径的权限
function verifyUserPermission(user, path, method) {
	return true;
}

export default async function authorization(ctx, next) {
	const { path, method, header } = ctx.request;
	if (!reg.test(path)) { // 需要校验权限
		const { authorization: token } = header;
		const body = { success: false };
		if (!token) body.code = 901;
		const user = await getUserByToken(token);
		if (!user) body.code = 902;
		ctx.request.user = user;
		if (!verifyUserPermission(user, path, method)) body.code = 903;

		if (body.code) {
			ctx.body = body;
			body.message = errors[body.code];
			return;
		}
	}
	await next();
}

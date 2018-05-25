/** 不需要鉴权的接口controller */
import CodeError from '../../util/error';
import { miniServices } from '../service/weixin';
import { setCache, getCache } from '../service/cache';
import { getUserByOpenId, getUserByName, createUserByOpenId, login, verifyAccountAndPassword } from '../service/user';

export default {
	get: {

	},
	post: {
		async login(ctx) {
			const { password, account } = ctx.request.body;
			const user = await verifyAccountAndPassword(account, password);
			if (user) {
				const token = await login(user);
				return { token };
			}
			throw new CodeError(601);
		},
		async getOpenId(ctx) {
			const { code } = ctx.request.body;
			const res = await miniServices.codeSession(code);
			if (res && res.session_key) {
				const { openid, session_key: sessionKey } = res;// 保存起来
				let user = await getUserByOpenId(openid);
				if (!user) {
					user = await createUserByOpenId(openid);
				}
				user.activeOpenID = openid;
				user.sessionKey = sessionKey;
				const token = await login(user);
				return { openid, token };
			} else {
				throw new CodeError(601, '微信登录失败');
			}
		},
		async checkUserName(ctx) { // 校验用户名是否存在
			const { username } = ctx.request.body;
			const user = await getUserByName(username);
			return { existed: !!user };
		}
	},
	delete: {

	},
	put: {

	}
};

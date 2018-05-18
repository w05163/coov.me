/** 不需要鉴权的接口controller */
import CodeError from '../../util/error';
import { miniServices } from '../service/weixin';
import { setCache, getCache } from '../service/cache';
import { getUserByOpenId, createUserByOpenId, login } from '../service/user';

export default {
	get: {

	},
	post: {
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
		}
	},
	delete: {

	},
	put: {

	}
};

/** 不需要鉴权的接口controller */
import CodeError from '../../util/error';
import { miniServices } from '../service/weixin';
import { setCache, getCache } from '../service/cache';

export default {
	get: {

	},
	post: {
		async getOpenId(ctx) {
			const { code } = ctx.request.body;
			const res = await miniServices.codeSession(code);
			if (res && res.session_key) {
				const sessionKey = res.session_key;// 保存起来
				await setCache(res.openid, 60, sessionKey);// 保存一个小时
				return { openid: res.openid };
			} else {
				throw new CodeError(801, '微信登录失败');
			}
		}
	},
	delete: {

	},
	put: {

	}
};

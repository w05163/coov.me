/**
 * 与微信交互的服务
 */
import request from 'request-promise-native';
import config from '../../config';
import CodeError from '../../util/error';


const mini = {
	codeSession: `https://api.weixin.qq.com/sns/jscode2session?appid=${config.miniAppId}&secret=${config.miniAppSecret}&js_code=JSCODE&grant_type=authorization_code`
};

export const miniServices = {
	async codeSession(code) {
		const path = mini.codeSession.replace('JSCODE', code);
		try {
			const res = await request(path);
			return JSON.parse(res);
		} catch (error) {
			throw new CodeError(601, error.message);
		}
	}
};


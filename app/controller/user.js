/* eslint-disable no-underscore-dangle */
/** 用户模块 */
import mongoose from 'mongoose';
import config from '../../config';
import { WXBizDataDecryptData } from '../service/weixin';
import { updateUser } from '../service/user';
import CodeError from '../../util/error';
import { md5 } from '../../util/string';

const User = mongoose.model('user');

const userOpenKeys = [
	'name', 'email', 'mobile', 'age', 'gender', 'avatar', 'city', 'nickname',
	'province', 'verifyEmail', 'verifyMobile', 'role', 'openId'
];

function filterUserData(user) {
	return userOpenKeys.reduce((o, k) => {
		if (typeof user[k] !== 'undefined') {
			o[k] = user[k];
		}
		return o;
	}, {});
}

export default {
	get: {
		async info(ctx) {
			const { user } = ctx.request;
			return filterUserData(user);
		}
	},
	post: {
		async register(ctx) {
			return '注册接口未完成';
		},
		async update(ctx) {
			const { body, user, header } = ctx.request;
			const { authorization: token } = header;
			const { avatar, city, gender, nickname, province, signature, iv, encryptedData } = body;
			const data = WXBizDataDecryptData(user.sessionKey, config.miniAppId, encryptedData, iv);
			const updateData = { avatar, city, gender, nickname, province, wechatUnionId: data.unionId };
			const info = await updateUser(user._id, updateData, token);
			return filterUserData(info);
		},
		async bindMobileByWX(ctx) { // 个人类的小程序没有获取手机的权限
			const { body, user, header } = ctx.request;
			const { authorization: token } = header;
			const { signature, iv, encryptedData } = body;
			const data = WXBizDataDecryptData(user.sessionKey, config.miniAppId, encryptedData, iv);
			const updateData = { mobile: data.mobile, verifyMobile: true };
			const info = await updateUser(user._id, updateData, token);
			return filterUserData(info);
		},
		async updateUsername(ctx) {
			const { body, user, header } = ctx.request;
			const { authorization: token } = header;
			const { name, password } = body;
			const data = { name };
			if (password && user.password) throw new CodeError(602);
			if (password) data.password = md5(password);
			const info = await updateUser(user._id, data, token);
			return filterUserData(info);
		}
	},
	delete: {

	},
	put: {

	}
};


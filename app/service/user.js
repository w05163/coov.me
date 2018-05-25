/** 提供用户相关 */
import mongoose from 'mongoose';
import { getTimestampId, md5 } from '../../util/string';
import { updateCache } from './cache';
import { createTokenByUser } from './auth';
import { catchError } from '../../util/function';

const User = mongoose.model('user');

export function login(user) {
	return createTokenByUser(user);
}

export async function getUserByOpenId(openid) {
	const user = await User.findOne({ openId: openid });
	return !user ? user : user.toObject();
}

export async function getUserByName(name) {
	const user = await User.findOne({ name });
	return !user ? user : user.toObject();
}

export async function createUserByOpenId(openid) {
	const user = new User({ openId: [openid], name: getTimestampId() });
	const u = await user.save();
	return u.toObject();
}

export const updateUser = catchError(401)(async (id, data, token) => {
	if (data.password)data.password = md5(data.password);
	const user = await User.findOneAndUpdate({ _id: id }, data);
	await updateCache(token, data);
	return { ...user.toObject(), ...data };
});

export async function verifyAccountAndPassword(account, pwd) {
	const password = md5(pwd);
	const user = await User.findOne({ $or: [
		{ name: account, password },
		{ mobile: account, password },
		{ email: account, password }
	] });
	return !user ? user : user.toObject();
}

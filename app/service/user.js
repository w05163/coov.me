/** 提供用户相关 */
import mongoose from 'mongoose';
import { updateCache } from './cache';
import { createTokenByUser } from './auth';

const User = mongoose.model('user');

export function login(user) {
	return createTokenByUser(user);
}

export async function getUserByOpenId(openid) {
	const user = await User.findOne({ openId: openid });
	return !user ? user : user.toObject();
}

export async function createUserByOpenId(openid) {
	const user = new User({ openId: [openid] });
	const u = await user.save();
	return u.toObject();
}

export async function updateUser(id, data, token) {
	const user = await User.updateOne({ _id: id }, data);
	await updateCache(token, data);
	return user;
}

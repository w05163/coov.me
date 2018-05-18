/** 鉴权服务 */
import { randomString } from '../../util/string';
import { setCache, getCache, updateCache } from './cache';

function getToken(user) {
	return randomString(32);
}

export async function createTokenByUser(user) {
	const token = getToken(user);
	await setCache(token, 12 * 60, user);
	return token;
}

export async function getUserByToken(token) {
	const user = await getCache(token);
	return user;
}

export async function updateUser(token, data) {
	const res = await updateCache(token, data);
	return res;
}

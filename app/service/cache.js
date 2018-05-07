/**
 * 提供缓存服务
 */
import mongoose from 'mongoose';

const Cache = mongoose.model('cache');

/**
 * 设置缓存
 * @param {String} key
 * @param {Number} expireIn 过期时间，以分钟为单位
 * @param {*} data
 */
export async function setCache(key, expireIn = 5, data) {
	if (expireIn <= 0) {
		return Cache.remove({ key });
	}
	const expireAt = new Date(Date.now() + (expireIn * 60000));
	const cache = new Cache({ _id: key, expireAt, data });
	const res = await Cache.updateOne({ _id: key }, cache, { upsert: true });
	return res;
}

/**
 * 获取缓存
 * @param {String} key
 */
export async function getCache(key) {
	const res = await Cache.findById(key);
	return res.data;
}

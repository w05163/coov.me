/**
 * 提供缓存服务
 */
import mongoose from 'mongoose';
import { keysForEach } from '../../util/object';
import CodeError from '../../util/error';
import { catchError } from '../../util/function';

const Cache = mongoose.model('cache');

/**
 * 设置缓存
 * @param {String} key
 * @param {Number} expireIn 过期时间，以分钟为单位
 * @param {*} data
 */
export const setCache = catchError(402)(async (key, expireIn = 5, data) => {
	if (expireIn <= 0) {
		return Cache.remove({ key });
	}
	const expireAt = new Date(Date.now() + (expireIn * 60000));
	const cache = new Cache({ _id: key, expireAt, data });
	const res = await Cache.updateOne({ _id: key }, cache, { upsert: true });
	return res;
});

/**
 * 获取缓存
 * @param {String} key
 */
export const getCache = catchError(403)(async (key) => {
	const res = await Cache.findById(key);
	return res ? res.data : undefined;
});

/**
 * 更新缓存
 * 所传的data如果是object，则合并到现有缓存，如果是其他类型(包括Array)，则覆盖现有
 * @param {String} key
 * @param {any} data
 */
export const updateCache = catchError(404)(async (key, data) => {
	const newData = {};
	if (typeof data === 'object' && !Array.isArray(data)) {
		keysForEach(data, (k, v) => newData[`data.${k}`] = v);
	} else {
		newData.data = data;
	}
	const res = await Cache.updateOne({ _id: key }, newData, { upsert: false });
	return res;
});

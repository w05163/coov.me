/**
 * 字符串相关的工具
 */
import crypto from 'crypto';

export const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-';

/**
 * 生成随机字符串
 * @param {Number} [length] 生成的字符串长度，不指定或者0则长度也随机
 * @return {String}
 */
export function randomString(length) {
	const len = chars.length - 2;// 不要符号
	if (!length) {
		length = Math.floor(Math.random() * len);
	}

	let str = '';
	for (let i = 0; i < length; i++) {
		str += chars[Math.floor(Math.random() * len)];
	}
	return str;
}

export function getTimestampId() {
	const now = Date.now();
	const b = now.toString(8);
	return b.match(/\d{2}|\d{1}/g).reduce((p, index) => `${p}${chars[parseInt(index, 8)]}`, '') + randomString(3);
}

export function md5(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

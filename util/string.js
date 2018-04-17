/**
 * 字符串相关的工具
 */

/**
 * 生成随机字符串
 * @param {Number} [length] 生成的字符串长度，不指定或者0则长度也随机
 * @return {String}
 */
export function randomString(length) {
	const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

	if (!length) {
		length = Math.floor(Math.random() * chars.length);
	}

	let str = '';
	for (let i = 0; i < length; i++) {
		str += chars[Math.floor(Math.random() * chars.length)];
	}
	return str;
}

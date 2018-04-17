/**
 * router目录内使用的共有工具方法
 */


/**
 * 补全路由的path
 * @param {Array} routers 路由数组
 * @param {String} key 取当前路由路径的key名
 * @return {Array}
 */
export function supplementPath(routers, key, ...dirs) {
	return routers.map((r) => {
		const tem = {
			path: `${dirs.join('/')}/${r[key]}`
		};
		return Object.assign({}, r, tem);
	});
}

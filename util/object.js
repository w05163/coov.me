/** object的工具 */

export function keysForEach(obj, fun) {
	for (const k in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, k))fun(k, obj[k]);
	}
}

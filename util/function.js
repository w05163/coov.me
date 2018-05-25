/** 方法装饰器 */
import CodeError from './error';

/**
 * try catch包裹整个方法，如果出错，code为CodeError的code
 * @param {code} code
 */
export function catchError(code, message) {
	return function (fun) {
		return async function (...args) {
			try {
				return await fun.apply(this, args);
			} catch (error) {
				console.log(error);
				if (!(error instanceof CodeError)) {
					throw new CodeError(code, message);
				} else throw error;
			}
		};
	};
}

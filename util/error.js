/**
 * 自定义错误类，比基本错误多一个code属性用于指定错误码
 */
export default class CodeError extends Error {
	constructor(code, message) {
		super(message);
		this.code = code;
	}
}

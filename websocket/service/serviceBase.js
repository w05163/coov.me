import Operator from '../operator';

/**
 * 所有service的基类
 */
class serviceBase {
	/**
	 * @param {String} name
	 */
	constructor(name) {
		this.opt = new Operator(name);
	}

	/**
	 * 用户连接到服务时调用
	 * @return {Boolean}
	 */
	register() {
		return true;
	}

	/**
	 * 用户注销服务
	 */
	cancel() {

	}

	/**
	 * 接收到信息
	 */
	receive() {

	}

	/**
	 * 接收到用户的请求，需要在短时间内返回数据
	 * @return {Boolean}
	 */
	request() {
		return true;
	}
}

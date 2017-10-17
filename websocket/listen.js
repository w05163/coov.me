import services from './service';
import { randomString } from '../lib/string';
import config from '../config';

const { ws: { types } } = config;

const key = randomString(32);

// 一个合法消息的示例
const message = {
	type: '', // 消息类型,决定了将调用服务的何种方法
	service: '', // 服务名称，决定了数据将传给那个服务
	data: {}, // 传递的数据
	id: ''// 当type=request时需要传递，客户端的唯一识别id
};

/**
 * 添加基本监听
 * @param {socket} socket
 * @param {server} server
 */
export default function listen(socket, server) {
	socket.on('message', handleMessage);
	socket.on('close', function(reason) {
		// 完全断开连接
		this.services.forEach(t=>t.cancel(this));
		delete server.clientObj[this.id];
	});

	socket.on('register', register);
	socket.on('cancel', cancel);
	socket.on('msg', handleMsg);
	socket.on('request', handleRequest);
	socket.on('pong', receivePong);
}

/**
 * 接收到心跳包
 * @param {*} data
 */
function receivePong(data) {
	this.isAlive = true;
}

/**
 * 预处理message
 * @param {String|Buffer|ArrayBuffer|Buffer[]} data
 */
function handleMessage(data) {
	if (typeof data === 'string') {
		let message = null;
		try {
			message = JSON.parse(data);
		} catch (error) {
			this.sendError('非法数据');
		}

		if (!types.includes(message.type)) {
			this.sendError('非法的消息类型');
			return;
		}
		this.emit(message.type, message);
	} else {
		// 二进制数据
	}
}

/**
 * 注册一个服务，除了一个必须的服务名称，其余参数将直接交给服务的register方法
 * @param {String} service 服务名称
 * @param {*} [params] 其余参数
 */
async function register({ service, data, id }) {
	if (this.services.includes(service)) return;
	const target = services[service];
	if (!target) return;
	const res = await target.register(this.id, data);
	if (res || typeof res === 'undefinde') { // 不返回则默认成功；
		this.services.push(service);
	} else {
		this.sendError(res, service, id);
	}
}

/**
 * 客户端主动注销某个服务，或者连接断开，系统注销服务
 * @param {String} service 服务名称
 */
function cancel({ service }) {
	if (!this.services.includes(service)) return;
	this.services = this.services.filter(s=>s !== service);
	const target = services[service];
	if (!target) return;
	target.cancel(this.id);
}

/**
 * 转发信息给对应的服务
 * @param {Object} message
 */
function handleMsg({ service, data }) {
	const target = services[service];
	if (!target) return;
	target.receive(this.id, data);
}

/**
 * 转发信息给对应的服务,并要求服务在短时间内返回一个结果，如同普通请求一样
 * @param {Object} message
 */
async function handleRequest({ service, data, id }) {
	const target = services[service];
	if (!target) return;
	const res = await target.request(this.id, data);
	this.sendObj({
		type: 'response',
		service,
		data: res,
		id
	});
}

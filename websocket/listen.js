import services from './service';
import { randomString } from '../lib/string';

const key = randomString(32);

/**
 * 添加基本监听
 * @param {socket} socket
 */
export default function listen(socket) {
	socket.on('message', handleMessage);
	socket.on('close', function(reason) {
		// 完全断开连接
		const targets = findRegisteredService(this);
		targets.forEach(t=>t.cancel(this));
	});

	socket.on('register', register);
	socket.on('cancel', cancel);
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
			this.send(JSON.stringify({
				event: 'error',
				message: '非法数据'
			}));
		}
		if (!message.event) return;
		const { event } = message;
		delete message.event;
		this.emit(event, ...message);
	} else {
		// 二进制数据
	}
}

/**
 * 注册一个服务，除了一个必须的服务名称，其余参数将直接交给服务的register方法
 * @param {String} serviceName 服务名称
 * @param {*} [params] 其余参数
 */
async function register(serviceName, ...params) {
	const target = services[serviceName];
	if (!target) return;
	const res = await target.register(this.id, ...params);
	if (!res) { // 不返回则默认成功；
		this.emit(null, 'registered', serviceName);
	} else {
		this.emit(null, 'registerFailed', serviceName, res);
	}
}

/**
 * 客户端主动注销某个服务，或者连接断开，系统注销服务
 * @param {String} serviceName 服务名称
 */
function cancel(serviceName) {
	const target = services[serviceName];
	if (!target) return;
	target.cancel(this.id);
}

/**
 * 返回一个服务的房间名
 * @param {String} serviceName
 * @return {String}
 */
function makeServiceRoomName(serviceName) {
	return `${key}_${serviceName}`;
}

/**
 * 返回socket已注册过的所有服务
 * @param {Object} socket
 * @param {Array} socket.rooms
 * @return {Array}
 */
function findRegisteredService(socket) {
	return [];
}

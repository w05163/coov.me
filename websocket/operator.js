

let server = null;
/**
 * 提供给service操作socket，需要提供id或者roomName
 */
export default class Operator {
	/**
	 * 创建服务操作者
	 * @param {String} serviceName 服务名
	 */
	constructor(serviceName) {
		this.serviceName = serviceName;
		this.roomObj = {};// 房间名为key，socketId数组为value
	}

	/**
	 * 加入一个房间
	 * @param {String} id
	 * @param {String} room
	 */
	join(id, room) {
		this.roomObj[room] = this.roomObj[room] || [];
		if (!this.roomObj[room].includes(id)) this.roomObj[room].push(id);
	}

	/**
	 * 向指定socket发送消息
	 * @param {String} id
	 * @param {*} args
	 */
	send(id, ...args) {

	}

	/**
	 * 向房间广播
	 * @param {String} room 房间名
	 * @param {*} args
	 */
	broadcast(room, ...args) {
		const rooms = this.roomObj[room];
		rooms.forEach(id=>this.send(id, ...args));
	}
}

/**
 * 初始化server
 * @param {server} socketServer
 */
export function init(socketServer) {
	server = socketServer;
}

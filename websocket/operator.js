import ws from 'ws';

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
		this.sToR = {};// 每个id加入的房间
	}

	/**
	 * 加入一个房间
	 * @param {String} id
	 * @param {String} room
	 */
	join(id, room) {
		this.roomObj[room] = this.roomObj[room] || [];
		if (!this.roomObj[room].includes(id)) this.roomObj[room].push(id);
		this.sToR[id] = this.sToR[id] || [];
		this.sToR[id].push(room);
	}

	/**
	 * 退出房间
	 * @param {*} id
	 * @param {*} room
	 */
	leave(id, room) {
		if (!this.roomObj[room] || !this.roomObj[room].includes(id)) return;
		this.roomObj[room] = this.roomObj[room].filter(i => i !== id);
	}

	/**
	 * 向指定socket发送消息
	 * @param {String} id
	 * @param {Object} data
	 */
	send(id, data) {
		const socket = server.clientObj[id];
		if (!socket) return;
		socket.sendObj({
			service: this.serviceName,
			data,
			type: 'msg'
		});
	}

	/**
	 * 向房间广播
	 * @param {String} room 房间名
	 * @param {Object} data
	 * @param {Array} excludeIds
	 */
	broadcast(room, data, excludeIds) {
		if (typeof excludeIds === 'string') {
			excludeIds = [excludeIds];
		}
		const rooms = this.roomObj[room];
		rooms.forEach((id) => {
			if (!excludeIds.includes(id)) this.send(id, data);
		});
	}

	/**
	 * 获取指定socket加入的所有房间
	 * @param {String} id
	 * @return {Array}
	 */
	getSocketRooms(id) {
		return this.sToR[id] ? this.sToR[id].concat() : [];
	}

	/**
	 * 获取房间内所有socket的id
	 * @param {String} room
	 * @return {Array}
	 */
	getRoom(room) {
		return this.roomObj[room] ? this.roomObj[room].concat() : [];
	}
}

/**
 * 初始化server
 * @param {server} socketServer
 */
export function init(socketServer) {
	server = socketServer;
}

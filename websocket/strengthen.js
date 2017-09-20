/**
 * 改造一下socket，添加一些工具方法
 * @param {socket} socket
 */
export default function strengthen(socket) {
	socket.sendObj = sendObj;
	socket.emitEvent = emit;
}

/**
 * 发送object对象
 * @param {Object} data
 */
function sendObj(data) {
	this.send(JSON.stringify(data));
}

/**
 * 往对端发送一个事件
 * @param {String} event 事件名称
 * @param {*} args
 */
function emit(event, ...args) {
	this.sendObj({
		type: 'event',
		event,
		args
	});
}


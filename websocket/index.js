/**
 * websocket服务器，初始化方法
 */
import ws from 'ws';
import config from '../config';
import { randomString } from '../lib/string';
import strengthen from './strengthen';
import listen from './listen';
import { init as operatorInit } from './operator';


/**
 * 初始化方法
 * @param {app} app
 * @return {server}
 */
export default function init(app) {
	const server = new ws.Server({
		server: app,
		backlog: config.ws.backlog,
		maxPayload: config.ws.maxPayload
	});

	server.clientObj = {};

	// 定时发送ping包检测
	const intervalId = global.setInterval(() => {
		server.clients.forEach(ws => {
			if (ws.isAlive === false) return ws.terminate();
			ws.isAlive = false;
			ws.ping('', false, true);
		});
	}, config.ws.interval);

	server.on('close', () => {
		global.clearInterval(intervalId);
	});

	server.on('connection', function(socket, b, c) {
		debugger;
		socket.id = randomString(6);
		server.clientObj[socket.id] = socket;
		strengthen(socket);
		listen(socket, server);
	});

	operatorInit(server);
	return server;
}


const WebSocketServer = require('ws').Server;
const UUID = require('node-uuid');
const events = require('events');
const util = require('util');
let errorCb = function(rtc) {
	return function(error) {
		if (error) {
			rtc.emit('error', error);
		}
	};
};

function SkyRTC() {
	this.sockets = [];
	this.rooms = {};
	this._turn = [
		{
			'url': 'stun:stun.l.google.com:19302'// "stun:stun.services.mozilla.com"//stun:stun.l.google.com:19302
		},
		{
			'urls': ['turn:turn.realtimecat.com'],
			'username': '1473525872:DBdLNiiQoB',
			'credential': 'EMHjDGSMYffp8ofp9n0cb/QBXCk='
		}
	];
	this._token = '80cb26fa-0cd8-46b8-9e5d-31b144ef7695';
	this.on('__join', function(data, socket) {// 收到__join事件
		let ids = [], // 房间里所有socket id
			i, m,
			room = data.room || '__default',
			curSocket,
			curRoom;
		if (data.token) {
			this._token = data.token;
			// this._turn[1].username=data.username;
			// this._turn[1].credential=data.credential;
		}

		curRoom = this.rooms[room] = this.rooms[room] || [];// 房间内每个人的socket

		// for (i = 0, m = curRoom.length; i < m; i++) {// 给房间里的每一个人都发送_new_peer事件
		// 	curSocket = curRoom[i];
		// 	if (curSocket.id === socket.id) {
		// 		continue;
		// 	}
		// 	ids.push(curSocket.id);
		// 	curSocket.send(JSON.stringify({
		// 		'eventName': '_new_peer',
		// 		'data': {
		// 			'socketId': socket.id
		// 		}
		// 	}), errorCb);
		// }

		const res = {
			'eventName': '_peers',
			'data': {
				'connections': ids,
				'you': socket.id
			}
		};
		if (!curRoom.length) {
			res.data.token = this._token;
		} else if (curRoom._iceServer) {
			res.data.iceServer = curRoom._iceServer;
		}
		curRoom.push(socket);
		socket.room = room;

		socket.send(JSON.stringify(res), errorCb);

		this.emit('new_peer', socket, room);
	});

	// 收到trun服务器的新用户名密码，更新房间的用户名密码
	// this.on('__ice_service', function(data, socket) {
	// 	let room = socket.room, curRoom, curSocket;
	// 	curRoom = this.rooms[room];
	// 	curRoom._iceServer = data;
	// 	for (let i = 0; i < curRoom.length; i++) {// 给房间里其他的用户发送新的ice服务器信息
	// 		curSocket = curRoom[i];
	// 		if (curSocket.id === socket.id) {
	// 			continue;
	// 		}
	// 		curSocket.send(JSON.stringify({
	// 			'eventName': '_ice_service_update',
	// 			'data': data
	// 		}), errorCb);
	// 	}
	// });

	// this.on('__ice_candidate', function(data, socket) {// 给对应的socket发送对端网络描述信息
	// 	let soc = this.getSocket(data.socketId);

	// 	if (soc) {
	// 		soc.send(JSON.stringify({
	// 			'eventName': '_ice_candidate',
	// 			'data': {
	// 				'label': data.label,
	// 				'candidate': data.candidate,
	// 				'socketId': socket.id
	// 			}
	// 		}), errorCb);

	// 		this.emit('ice_candidate', socket, data);
	// 	}
	// });

	// this.on('__offer', function(data, socket) {
	// 	let soc = this.getSocket(data.socketId);

	// 	if (soc) {
	// 		soc.send(JSON.stringify({
	// 			'eventName': '_offer',
	// 			'data': {
	// 				'sdp': data.sdp,
	// 				'socketId': socket.id
	// 			}
	// 		}), errorCb);
	// 	}
	// 	this.emit('offer', socket, data);
	// });

	// this.on('__answer', function(data, socket) {
	// 	const soc = this.getSocket(data.socketId);
	// 	if (soc) {
	// 		soc.send(JSON.stringify({
	// 			'eventName': '_answer',
	// 			'data': {
	// 				'sdp': data.sdp,
	// 				'socketId': socket.id
	// 			}
	// 		}), errorCb);
	// 		this.emit('answer', socket, data);
	// 	}
	// });
}

util.inherits(SkyRTC, events.EventEmitter);

SkyRTC.prototype.addSocket = function(socket) {
	this.sockets.push(socket);
};

SkyRTC.prototype.removeSocket = function(socket) {
	let i = this.sockets.indexOf(socket),
		room = socket.room;
	this.sockets.splice(i, 1);
	if (room) {
		i = this.rooms[room].indexOf(socket);
		this.rooms[room].splice(i, 1);
		if (this.rooms[room].length === 0) {
			delete this.rooms[room];
		}
	}
};

SkyRTC.prototype.broadcast = function(data, errorCb) {
	let i;
	for (i = this.sockets.length; i--;) {
		this.sockets[i].send(data, errorCb);
	}
};

SkyRTC.prototype.broadcastInRoom = function(room, data, errorCb) {
	let curRoom = this.rooms[room],
		i;
	if (curRoom) {
		for (i = curRoom.length; i--;) {
			curRoom[i].send(data, errorCb);
		}
	}
};

SkyRTC.prototype.getRooms = function() {
	let rooms = [],
		room;
	for (room in this.rooms) {
		rooms.push(room);
	}
	return rooms;
};

SkyRTC.prototype.getSocket = function(id) {
	let i,
		curSocket;
	if (!this.sockets) {
		return;
	}
	for (i = this.sockets.length; i--;) {
		curSocket = this.sockets[i];
		if (id === curSocket.id) {
			return curSocket;
		}
	}
	return;
};

SkyRTC.prototype.init = function(socket) {
	const that = this;
	socket.id = UUID.v4();
	that.addSocket(socket);
	// 为新连接绑定事件处理器
	socket.on('message', function(data) {
		const json = JSON.parse(data);
		if (json.eventName) {
			that.emit(json.eventName, json.data, socket);
		} else {
			that.emit('socket_message', socket, data);
		}
	});
	// 连接关闭后从SkyRTC实例中移除连接
	socket.on('close', function() {
		that.removeSocket(socket);

		that.emit('remove_peer', socket.id, that);
	});
	that.emit('new_connect', socket);
};

module.exports.listen = function(server) {
	let SkyRTCServer;
	if (typeof server === 'number') {
		SkyRTCServer = new WebSocketServer({
			port: server
		});
	} else {
		SkyRTCServer = new WebSocketServer({
			server: server
		});
	}

	SkyRTCServer.rtc = new SkyRTC();
	errorCb = errorCb(SkyRTCServer.rtc);
	SkyRTCServer.on('connection', function(socket) {
		this.rtc.init(socket);
	});

	return SkyRTCServer;
};

let webrtc = function() {
	let PeerConnection = (window.PeerConnection || window.webkitPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
	window.URL = (window.URL || window.webkitURL || window.msURL || window.oURL);
	navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
	let nativeRTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);
	let nativeRTCSessionDescription = (window.mozRTCSessionDescription || window.RTCSessionDescription); // order is very important: "RTCSessionDescription" defined in Nighly but useless
	let moz = !!navigator.mozGetUserMedia;

	let packetSize = 1024;

	function errHandler(event) {
		console.log(event);
	}
	function _null() {};

	/** ********************************************************/
	/*                                                        */
	/*                       事件处理器                       */
	/*                                                        */
	/** ********************************************************/
	function EventEmitter() {
		this.events = {};
	}
	// 绑定事件函数
	EventEmitter.prototype.on = function(eventName, callback) {
		this.events[eventName] = this.events[eventName] || [];
		this.events[eventName].push(callback);
		return (this.events[eventName].length - 1);
	};
	// 触发事件函数
	EventEmitter.prototype.emit = function(eventName, _) {
		let events = this.events[eventName],
			args = Array.prototype.slice.call(arguments, 1),
			i, m;

		if (!events) {
			return;
		}
		for (i = 0, m = events.length; i < m; i++) {
			events[i].apply(this, args);
		}
	};
	// 移除事件监听,第二参数可以是function对象，也可以是on方法所返回的整数
	EventEmitter.prototype.off = function(eventName, callback) {
		let events = this.events[eventName];
		if (!events) {
			return;
		}
		if (typeof callback == 'function')
			{for(var i=0;i<events.length;i++){
                if(events[i]==callback){
                    events.splice(i,1);
                    return;
                }
            }}
		else
			{events.splice(callback,1);}
	};


	/** ********************************************************/
	/*                                                        */
	/*                   流及信道建立部分                     */
	/*                                                        */
	/** ********************************************************/


	/** *****************基础部分*********************/
	function webrtc() {
		EventEmitter.call(this);
		// 本地media stream
		this.localMediaStream = null;
		// 所在房间
		this.room = '';
		// 接收文件时用于暂存接收文件
		this.fileData = {};
		// 本地WebSocket连接
		this.socket = null;
		// 本地socket的id，由后台服务器创建
		this.me = null;
		// 保存所有与本地相连的peer connection， 键为socket id，值为PeerConnection类型
		this.peerConnections = {};
		// 保存所有与本地连接的socket的id
		this.connections = [];
		// 初始时需要构建链接的数目
		this.numStreams = 0;
		// 初始时已经连接的数目
		this.initializedStreams = 0;
		// 保存所有的data channel，键为socket id，值通过PeerConnection实例的createChannel创建
		this.dataChannels = {};
		// 保存所有发文件的data channel及其发文件状态
		this.fileChannels = {};
		// 所有待发送的文件
		this.filesToSend = {};
		// 保存所有接受到的文件
		this.receiveFiles = {};
		// 管理消息事件的事件处理器,私有属性
		this._msgEventEmitter = new EventEmitter();
	}
	// 继承自事件处理器，提供绑定事件和触发事件的功能
	webrtc.prototype = new EventEmitter();


	/** ***********************服务器连接部分***************************/


	// 本地连接信道，信道为websocket
	/*
    server为wss服务器url；
    room为房间号字符串
    */
	webrtc.prototype.connect = function(server, room) {// webrtc类最先被调用的方法
		let socket, that = this, token;
		room = room || '';
		if (room[room.length - 1] == '#') {
			token = prompt('token');
			// p=prompt('密码');
			room = room.slice(0, -1);
		}

		socket = this.socket = new WebSocket(server);
		socket.onopen = function() {// socket连接一旦被打开就发送一个__join事件，服务器会给房间里的其他人都发送一个_new_peer事件
			socket.send(JSON.stringify({
				'eventName': '__join',
				'data': {
					'room': room,
					'token': token
				}
			}));

			that.emit('socket_opened', socket);
		};

		socket.onmessage = function(message) {
			let json = JSON.parse(message.data);
			if (json.eventName) {
				that.emit(json.eventName, json.data);
			} else {
				that.emit('socket_receive_message', socket, json);
			}
		};

		socket.onerror = function(error) {
			that.emit('socket_error', error, socket);
		};

		socket.onclose = function() {
			return;
		};

		this.on('_peers', function(data) {// 给服务器发送__join事件的返回
			that.connections = data.connections;// 房间里所有的socket id(数组)
			that.me = data.you;// 自己的socket id（由uuid生成）
			if (data.token)
				{that.getIceServers(data.token, function (iceServer) {
                    socket.send(JSON.stringify({
                        "eventName": "__ice_service",
                        "data": iceServer
                    }));
                    that.setIceServers(iceServer,socket);
                });}
			else if (data.iceServer) {
				that.setIceServers(data.iceServer, socket);
			}
		});
		this.on('_ice_service_update', function(iceServer) {
			that.setIceServers(iceServer, socket);
		});

		this.on('_ice_candidate', function(data) {// 收到服务器发来的对端网络地址描述
			let candidate = new nativeRTCIceCandidate(data);
			let pc = that.peerConnections[data.socketId];
			pc.addIceCandidate(candidate);
			that.emit('get_ice_candidate', candidate);
		});

		this.on('_new_peer', function(data) {
			that.connections.push(data.socketId);
			let pc = that.createPeerConnection(data.socketId),
				i, m;
			pc.addStream(that.localMediaStream);
			that.emit('new_peer', data.socketId);
		});

		this.on('_remove_peer', function(data) {
			let sendId;
			that.closePeerConnection(that.peerConnections[data.socketId]);
			delete that.peerConnections[data.socketId];
			delete that.dataChannels[data.socketId];
			for (sendId in that.fileChannels[data.socketId]) {
				that.emit('send_file_error', new Error('Connection has been closed'), data.socketId, sendId, that.fileChannels[data.socketId][sendId].file);
			}
			delete that.fileChannels[data.socketId];
			that.emit('remove_peer', data.socketId);
		});

		this.on('_offer', function(data) {// 收到一个offer
			that.receiveOffer(data.socketId, data.sdp);
			that.emit('get_offer', data);
		});

		this.on('_answer', function(data) {// 发送完offer接受到返回的answer
			that.receiveAnswer(data.socketId, data.sdp);
			that.emit('get_answer', data);
		});

		this.on('send_file_error', function(error, socketId, sendId, file) {
			that.cleanSendFile(sendId, socketId);
		});

		this.on('receive_file_error', function(error, sendId) {
			that.cleanReceiveFile(sendId);
		});

		this.on('ready', function() {// 成功创建本地流触发
			that.createPeerConnections();// 与房间内每一个人都创建一个点对点连接（如果是房间里的第一个人此时应该是没有其他人的）
			that.addStreams();// 向所有已创建的pc连接添加本地视频流
			that.addDataChannels();// 数据通道，传文件和通讯用，不过不应该默认开启才对的
			that.sendOffers();// 向所有PeerConnection发送Offer类型信令
		});
	};
	webrtc.prototype.closeConnect = function() {
		this.socket.close();
	};
	webrtc.prototype.getIceServers = function(token, callback) {// 去获取实时猫的trun服务器临时用户名和密码
		let _url = 'wss://signal.realtimecat.com:3000/?tokenId=' + token + '&encrypt=false&type=p2p';
		let _protocols = 'rtcat-protocol';
		let _wss = new WebSocket(_url, _protocols);
		_wss.onopen = function() {
			console.log('打开了');
			_wss.send(JSON.stringify({
				'eventName': '__join'
			}));
		};
		_wss.onmessage = function(message) {
			console.log('收到信息', message);
			let msg = JSON.parse(message.data);
			callback(msg.data.iceServers);
			this.close();
		};
		_wss.onerror = function(error) {
			alert('获取iceServer出错，应该是凭证过期了，请联系管理员');
			console.log('socket_error', error, _wss);
		};
		_wss.onclose = function() {
			console.log('关闭了');
		};
	};

	// 服务器发来可以用的trun服务器地址
	webrtc.prototype.setIceServers = function(iceServer, socket) {
		webrtc.iceServer.iceServers = iceServer;
		// this.emit("get_peers", this.connections);
		this.emit('connected', socket);
	};


	/** ***********************流处理部分*******************************/


	// 创建本地流
	webrtc.prototype.createStream = function(options) {// 与服务器建立socket连接之后
		let that = this;

		options.video = !!options.video;
		options.audio = !!options.audio;

		if (navigator.getUserMedia) {
			this.numStreams++;
			navigator.getUserMedia(options, function(stream) {
				that.localMediaStream = stream;
				that.initializedStreams++;
				that.emit('stream_created', stream);
				if (that.initializedStreams === that.numStreams) {// 二者相等，说明尝试创建的流与创建成功的流数量相等
					that.emit('ready');
				}
			},
			function(error) {
				that.emit('stream_create_error', error);
			});
		} else {
			that.emit('stream_create_error', new Error('WebRTC is not yet supported in this browser.'));
		}
	};

	// 将本地流添加到所有的PeerConnection实例中
	webrtc.prototype.addStreams = function() {
		let i, m,
			stream,
			connection;
		for (connection in this.peerConnections) {
			this.peerConnections[connection].addStream(this.localMediaStream);
		}
	};
	webrtc.prototype.close = function() {
		that.localMediaStream.close();
		let pcs = that.peerConnections;
		for (i = pcs.length; i--;) {
			that.closePeerConnection(pcs[i]);
		}
		that.peerConnections = [];
		that.dataChannels = {};
		that.fileChannels = {};
		that.connections = [];
		that.fileData = {};
		that.emit('socket_closed', socket);
	};


	/** *********************信令交换部分*******************************/


	// 向所有PeerConnection发送Offer类型信令
	webrtc.prototype.sendOffers = function() {
		let i, m,
			pc,
			that = this,
			pcCreateOfferCbGen = function(pc, socketId) {
				return function(session_desc) {// 获得sdp，发送出去
					pc.setLocalDescription(new nativeRTCSessionDescription(session_desc), function() {
						that.socket.send(JSON.stringify({// 发送到服务器，服务器转发至对端，对端收到_offer事件
							'eventName': '__offer',
							'data': {
								'sdp': session_desc,
								'socketId': socketId
							}
						}));
					});
				};
			};
		for (i = 0, m = this.connections.length; i < m; i++) {
			pc = this.peerConnections[this.connections[i]];
			pc.createOffer(pcCreateOfferCbGen(pc, this.connections[i]), errHandler);
		}
	};

	// 接收到Offer类型信令后作为回应返回answer类型信令
	webrtc.prototype.receiveOffer = function(socketId, sdp) {
		let pc = this.peerConnections[socketId];
		this.sendAnswer(socketId, sdp);
	};

	// 发送answer类型信令
	webrtc.prototype.sendAnswer = function(socketId, sdp) {
		let pc = this.peerConnections[socketId];
		let that = this;
		pc.setRemoteDescription(new nativeRTCSessionDescription(sdp), function() {
			pc.createAnswer(function(session_desc) {// 生成answer并发送给服务器转发，对端接受到一个_answer事件
				pc.setLocalDescription(session_desc, function() {
					that.socket.send(JSON.stringify({
						'eventName': '__answer',
						'data': {
							'socketId': socketId,
							'sdp': session_desc
						}
					}));
				}, errHandler);
			}, errHandler);
		}, errHandler);// 设置好offer
	};

	// 接收到answer类型信令后将对方的session描述写入PeerConnection中
	webrtc.prototype.receiveAnswer = function(socketId, sdp) {
		let pc = this.peerConnections[socketId];
		pc.setRemoteDescription(new nativeRTCSessionDescription(sdp), _null, errHandler);// 把answer写入
	};


	/** *********************点对点连接部分*****************************/


	// 创建与其他用户连接的PeerConnections
	webrtc.prototype.createPeerConnections = function() {
		let i, m;
		for (i = 0, m = this.connections.length; i < m; i++) {
			this.createPeerConnection(this.connections[i]);
		}
	};

	// 创建单个PeerConnection
	webrtc.prototype.createPeerConnection = function(socketId) {
		let that = this;
		let pc = new PeerConnection(webrtc.iceServer);
		this.peerConnections[socketId] = pc;// 保存到pc数组里
		pc.onicecandidate = function(evt) {// 会产生几个网络候选地址，所以这个事件会触发多次
			if (evt.candidate) {// 得到地址的描述信息
				that.socket.send(JSON.stringify({// 发送到对端，对端收到事件_ice_candidate
					'eventName': '__ice_candidate',
					'data': {
						'label': evt.candidate.sdpMLineIndex,
						'candidate': evt.candidate.candidate,
						'socketId': socketId
					}
				}));
			}
			that.emit('pc_get_ice_candidate', evt.candidate, socketId, pc);
		};

		// pc.onopen = function() {//没有这个接口，实际测试也不会触发
		//     that.emit("pc_opened", socketId, pc);
		// };

		// Such an event is sent when a MediaStream is added to this connection by the remote peer.
		// The event is sent immediately after the call RTCPeerConnection.setRemoteDescription()
		// and doesn't wait for the result of the SDP negotiation.
		// 一个媒体流添加到pc时触发；该事件会在调用了RTCPeerConnection.setRemoteDescription()后立即触发，
		// 而不等待SDP协商结果
		pc.onaddstream = function(evt) {
			that.emit('pc_add_stream', evt.stream, socketId, pc);
		};

		pc.ondatachannel = function(evt) {
			that.addDataChannel(socketId, evt.channel);
			that.emit('pc_add_data_channel', evt.channel, socketId, pc);
		};

		// 监听
		pc.oniceconnectionstatechange = function(evt) {
			if (this.iceConnectionState == 'failed') {
				that.emit('_remove_peer', { 'socketId': socketId });
			}
			console.log(this.iceConnectionState);
		};
		pc.onsignalingstatechange = function(evt) {
			if (this.signalingState == 'closed') {
				// that.emit('_remove_peer', {'socketId':socketId});
			}
			console.log('signalingState:' + this.signalingState);
		};
		return pc;
	};

	// 关闭PeerConnection连接
	webrtc.prototype.closePeerConnection = function(pc) {
		if (!pc) return;
		pc.close();
	};


	/** *********************数据通道连接部分*****************************/

	// 绑定数据通道的信息类型事件
	webrtc.prototype.messageOn = function(eventName, callback) {
		return this._msgEventEmitter.on(eventName, callback);
	};
	// 解除绑定数据通道的信息类型事件
	webrtc.prototype.messageOff = function(eventName, callback) {
		return this._msgEventEmitter.off(eventName, callback);
	};

	// 消息广播
	webrtc.prototype.broadcast = function(message) {
		this.broadcastEvent(null, message);
	};

	// 发送消息方法
	webrtc.prototype.sendMessage = function(message, socketId) {
		this.sendEvent(null, message, socketId);
	};

	// 发送其他类型消息
	webrtc.prototype.sendEvent = function(type, data, socketId) {
		this.send({
			type: type,
			data: data
		}, socketId);
	};
	// 广播类型消息
	webrtc.prototype.broadcastEvent = function(type, data) {
		this.broadcastBase({
			type: type,
			data: data
		});
	};


	// 广播信息
	webrtc.prototype.broadcastBase = function(data) {
		let socketId;
		for (socketId in this.dataChannels) {
			this.send(data, socketId);
		}
	};
	// 发送的基本方法
	webrtc.prototype.send = function(data, socketId) {
		if (this.dataChannels[socketId].readyState.toLowerCase() === 'open') {
			this.dataChannels[socketId].send(JSON.stringify(data));
		}
	};

	// 对所有的PeerConnections创建Data channel
	webrtc.prototype.addDataChannels = function() {
		let connection;
		for (connection in this.peerConnections) {
			this.createDataChannel(connection);
		}
	};

	// 对某一个PeerConnection创建Data channel
	webrtc.prototype.createDataChannel = function(socketId, label) {
		let pc, key, channel;
		pc = this.peerConnections[socketId];

		if (!socketId) {
			this.emit('data_channel_create_error', socketId, new Error('attempt to create data channel without socket id'));
		}

		if (!(pc instanceof PeerConnection)) {
			this.emit('data_channel_create_error', socketId, new Error('attempt to create data channel without peerConnection'));
		}
		try {
			channel = pc.createDataChannel(label, { ordered: true, protocol: 'TCP' });
		} catch (error) {
			this.emit('data_channel_create_error', socketId, error);
		}

		return this.addDataChannel(socketId, channel);
	};

	// 为Data channel绑定相应的事件回调函数
	webrtc.prototype.addDataChannel = function(socketId, channel) {
		let that = this;
		channel.onopen = function() {
			that.emit('data_channel_opened', channel, socketId);
		};

		channel.onclose = function(event) {
			delete that.dataChannels[socketId];
		};

		channel.onmessage = function(message) {
			let json;
			try {
				json = JSON.parse(message.data);
			} catch (error) {
				that._msgEventEmitter.emit('__string', message.data, socketId);
				return;
			}
			if (!json.type) {
				that._msgEventEmitter.emit('msg', json.data, socketId);
			}else {
				that._msgEventEmitter.emit(json.type, json.data, socketId);
			}
		};

		channel.onerror = function(err) {
			that.emit('data_channel_error', channel, socketId, err);
		};
		this.messageOn('__file', function(data, socketId) {
			that.parseFilePacket(data, socketId);
		});
		this.dataChannels[socketId] = channel;
		return channel;
	};

	// 添加监听器，监听来自其他
	webrtc.prototype.onMsg = function() {

	};


	/** ********************************************************/
	/*                                                        */
	/*                       文件传输                         */
	/*                                                        */
	/** ********************************************************/

	/** **********************公有部分************************/

	// 解析Data channel上的文件类型包,来确定信令类型
	webrtc.prototype.parseFilePacket = function(json, socketId) {
		switch (json.signal) {
		case 'ask':// 文件请求
			this.receiveFileAsk(json.sendId, json.name, json.size, socketId);
			break;
		case 'accept':// 同意请求
			this.receiveFileAccept(json.sendId, socketId);
			break;
		case 'refuse':// 拒绝请求
			this.receiveFileRefuse(json.sendId, socketId);
			break;
		case 'chunk':// 文件碎片
			this.receiveFileChunk(json, json.sendId, socketId, json.last, json.percent);
			break;
		case 'cancel_send':// 对方取消发送,清理已经收到的信息
			this.cleanReceiveFile(json.sendId);
			this.emit('cancel_send', json.sendId, socketId);// 触发事件，可以捕捉这个事件提示用户
			break;
		case 'cancel_receive':// 对方取消接收,不再发送给对方，如果文件没有用了，则清理
			this.cleanSendFile(json.sendId, socketId);
			this.emit('cancel_receive', json.sendId, socketId);// 触发事件，可以捕捉这个事件提示用户
			break;
		}
	};

	/** *********************发送者部分***********************/


	// 通过Dtata channel向房间内所有其他用户广播文件
	webrtc.prototype.shareFile = function(dom) {
		let socketId,
			that = this;
		for (socketId in that.dataChannels) {
			that.sendFile(dom, socketId);
		}
	};

	// 向某一单个用户发送文件
	webrtc.prototype.sendFile = function(dom, socketId) {
		let that = this,
			file,
			reader,
			fileToSend,
			sendId;
		if (typeof dom === 'string') {
			dom = document.getElementById(dom);
		}
		if (!dom) {
			that.emit('send_file_error', new Error('Can not find dom while sending file'), socketId);
			return;
		}
		if (!dom.files || !dom.files[0]) {
			that.emit('send_file_error', new Error('No file need to be sended'), socketId);
			return;
		}
		file = dom.files[0];
		that.fileChannels[socketId] = that.fileChannels[socketId] || {};
		sendId = that.getRandomString();// 随机字符串作为文件标识
		fileToSend = {
			file: file,
			state: 'ask'
		};
		that.fileChannels[socketId][sendId] = fileToSend;
		that.filesToSend[sendId] = file;
		that.sendAsk(socketId, sendId, fileToSend);
		// that.emit("send_file", sendId, socketId, file);
	};

	// 发送多个文件的碎片
	webrtc.prototype.sendFileChunks = function() {
		let socketId,
			sendId,
			that = this,
			nextTick = false;
		for (socketId in that.fileChannels) {
			for (sendId in that.fileChannels[socketId]) {
				if (that.fileChannels[socketId][sendId].state === 'send') {
					nextTick = true;
					that.sendFileChunk(socketId, sendId);
				}
			}
		}
		if (nextTick) {
			this.sendFileChunks._timeId = setTimeout(function() {
				that.sendFileChunks();
			}, 10);
		} else{
			delete this.sendFileChunks._timeId;
		}
	};

	// 发送某个文件的碎片
	webrtc.prototype.sendFileChunk = function(socketId, sendId) {
		let that = this,
			fileToSend = that.fileChannels[socketId][sendId],
			packet = {
				signal: 'chunk',
				sendId: sendId,
				id: fileToSend.sendedPackets
			},
			channel;
		let file = this.filesToSend[sendId],
			start = packet.id * packetSize,
			end;
		fileToSend.sendedPackets++;
		fileToSend.packetsToSend--;
		end = fileToSend.sendedPackets * packetSize;

		if (file.fileData.length > end) {
			packet.last = false;
			packet.data = file.fileData.slice(start, end);
			packet.percent = parseInt(fileToSend.sendedPackets / fileToSend.allPackets * 100);
			if (fileToSend.percent < packet.percent) {
				fileToSend.percent = packet.percent;
				that.emit('send_file_chunk', sendId, socketId, packet.percent, fileToSend.file);
			}
		} else {
			packet.data = file.fileData.slice(start);
			packet.last = true;
			fileToSend.state = 'end';
			that.emit('sended_file', sendId, socketId, fileToSend.file);
			that.cleanSendFile(sendId, socketId);
		}

		this.sendEvent('__file', packet, socketId);
	};

	// 发送文件请求后若对方同意接受,开始传输
	webrtc.prototype.receiveFileAccept = function(sendId, socketId) {
		let that = this,
			fileToSend = that.fileChannels[socketId][sendId],
			file = that.filesToSend[sendId];
		let startSendFile = function() {
			if (fileToSend.state != 'ask')
				{return;}
			fileToSend.state = 'send';
			fileToSend.sendedPackets = 0;
			fileToSend.percent = -1;
			fileToSend.packetsToSend = fileToSend.allPackets = file.packetsToSend;
			if (!that.sendFileChunks._timeId) {
				that.sendFileChunks();
			}
		};
		if (file && file.fileData) {// 如果文件已经读取过了
			startSendFile();
		}else {
			let initSending = function(event, text) {
				file.packetsToSend = parseInt(event.target.result.length / packetSize, 10);
				file.fileData = event.target.result;
				startSendFile();
			};
			let reader = new window.FileReader(fileToSend.file);
			reader.readAsDataURL(fileToSend.file);
			reader.onload = initSending;
		}
		that.emit('send_file_accepted', sendId, socketId, that.fileChannels[socketId][sendId].file);
	};

	// 发送文件请求后若对方拒绝接受,清除掉本地的文件信息
	webrtc.prototype.receiveFileRefuse = function(sendId, socketId) {
		let that = this;
		that.fileChannels[socketId][sendId].state = 'refused';
		that.emit('send_file_refused', sendId, socketId, that.fileChannels[socketId][sendId].file);
		that.cleanSendFile(sendId, socketId);
	};

	// 清除发送文件缓存
	webrtc.prototype.cleanSendFile = function(sendId, socketId) {
		let that = this, fileCanDelete = true;
		delete that.fileChannels[socketId][sendId];
		// 检查文件是否还有用，没有就清掉
		for (socketId in that.fileChannels) {
			if (that.fileChannels[socketId][sendId] && (that.fileChannels[socketId][sendId].state === 'refused' || that.fileChannels[socketId][sendId].state === 'end')) {
				// 如果状态为拒绝接收，或者发送完成
				delete that.fileChannels[socketId][sendId];
			} else{
				fileCanDelete = false;// 不能删除文件
			}
		}
		if (fileCanDelete) {// 如果文件所有都发送都已经处理完，则删除文件
			delete that.filesToSend[sendId];
		}
	};

	// 发送文件请求
	webrtc.prototype.sendAsk = function(socketId, sendId, fileToSend) {
		let packet = {
			name: fileToSend.file.name,
			size: fileToSend.file.size,
			sendId: sendId,
			signal: 'ask'
		};
		this.sendEvent('__file', packet, socketId);
	};

	// 发送途中取消文件发送
	webrtc.prototype.cancelFileSend = function(socketId, sendId) {
		let packet = {
			sendId: sendId,
			signal: 'cancel_send'
		};
		this.sendEvent('__file', packet, socketId);
		this.cleanSendFile(sendId, socketId);
	};

	// 获得随机字符串来生成文件发送ID
	webrtc.prototype.getRandomString = function() {
		return (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace(/\./g, '-');
	};

	/** *********************接收者部分***********************/


	// 接收到文件碎片
	webrtc.prototype.receiveFileChunk = function(packet, sendId, socketId, last, percent) {
		let that = this,
			fileInfo = that.receiveFiles[sendId];
		if (!fileInfo) return;
		if (packet.id != fileInfo.packetId + 1) {
			// 传输丢包了
			console.log('文件迷路了 T_T...packet.id:' + packet.id + '\nfileInfo.packetId:' + fileInfo.packetId);
			fileInfo.packetId = packet.id;
		} else{
			fileInfo.packetId = packet.id;
		}
		if (!fileInfo.data) {
			fileInfo.state = 'receive';
			fileInfo.data = '';
		}
		// fileInfo.data = fileInfo.data || "";
		fileInfo.data += packet.data;
		if (last) {
			fileInfo.state = 'end';
			that.emit('file_end', sendId, socketId, fileInfo.name);
		} else {
			if (fileInfo.percent < percent) {
				fileInfo.percent = percent;
				that.emit('receive_file_chunk', sendId, socketId, fileInfo.name, percent);
			}
		}
	};

	// 接收到所有文件碎片后将其组合成一个完整的文件并自动下载
	webrtc.prototype.getTransferedFile = function(sendId) {
		let fileInfo = this.receiveFiles[sendId],
			hyperlink = document.createElement('a'),
			mouseEvent = new MouseEvent('click', {
				view: window,
				bubbles: true,
				cancelable: true
			});
		if (!fileInfo) return;
		let blob = this.getFile(sendId);
		hyperlink.href = window.URL.createObjectURL(blob);
		hyperlink.target = '_blank';
		hyperlink.download = fileInfo.name;

		hyperlink.dispatchEvent(mouseEvent);
		window.URL.revokeObjectURL(hyperlink.href);
		this.emit('receive_file', sendId, fileInfo.socketId, fileInfo.name);
		this.cleanReceiveFile(sendId);
	};
	// 根据sendId返回一个blob对象
	webrtc.prototype.getFile = function(sendId) {
		let fileInfo = this.receiveFiles[sendId];
		if (!fileInfo) return;
		let dataurl = fileInfo.data;
		let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
			bstr = window.atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
		while (n--) {
			u8arr[n] = bstr.charCodeAt(n);
		}
		this.cleanReceiveFile(sendId);
		return new Blob([u8arr], { type: mime });
	};

	// 接收到发送文件请求后记录文件信息
	webrtc.prototype.receiveFileAsk = function(sendId, fileName, fileSize, socketId) {
		let that = this;
		that.receiveFiles[sendId] = {
			socketId: socketId,
			state: 'ask',
			name: fileName,
			size: fileSize,
			percent: -1,
			packetId: -1
		};
		that.emit('receive_file_ask', sendId, socketId, fileName, fileSize);
	};

	// 发送同意接收文件信令
	webrtc.prototype.sendFileAccept = function(sendId, socketId) {
		let packet = {
			signal: 'accept',
			sendId: sendId
		};
		this.sendEvent('__file', packet, socketId);
	};

	// 发送拒绝接受文件信令
	webrtc.prototype.sendFileRefuse = function(sendId) {
		let that = this,
			packet;
		packet = {
			signal: 'refuse',
			sendId: sendId
		};
		this.sendEvent('__file', packet, socketId);
		that.cleanReceiveFile(sendId);
	};

	// 发送途中取消接收文件
	webrtc.prototype.cancelFileReceive = function(socketId, sendId) {
		let packet = {
			sendId: sendId,
			signal: 'cancel_receive'
		};
		this.sendEvent('__file', packet, socketId);
		this.cleanReceiveFile(sendId);
	};

	// 清除接受文件缓存
	webrtc.prototype.cleanReceiveFile = function(sendId) {
		let that = this;
		delete that.receiveFiles[sendId];
	};
	webrtc.iceServer = {
		'iceServers': [
			{
				'url': 'stun:stun.l.google.com:19302'// "stun:stun.services.mozilla.com"//stun:stun.l.google.com:19302
			}]
	};


	return new webrtc();
};

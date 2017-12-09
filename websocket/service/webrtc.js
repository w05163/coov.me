import serviceBase from './serviceBase';

const typeObj = {
	ice: '__ice_candidate',
	offer: '__offer',
	answer: '__answer'
};

/**
 * 帮助webrtc交换信息，管理房间
 */
class Webrtc extends serviceBase {
	/**
	 * 接入新连接，加入房间
	 * @param {String} id socket的id
	 * @param {String} key 房间key
	 */
	register(id, key) {
		const ids = this.opt.getRoom(key);
		this.opt.join(id, key);
		this.opt.broadcast(key, {
			eventName: '_new_peer',
			data: {
				socketId: id
			}
		}, id);
		this.opt.send(id, {
			eventName: '_peers',
			data: {
				connections: ids,
				you: id,
				iceServer: [{
					url: 'stun:stun.l.google.com:19302'// "stun:stun.services.mozilla.com"//stun:stun.l.google.com:19302
				}]
			}
		});
	}

	/**
	 * 移除socket，广播退出事件
	 * @param {String} id socket的id
	 */
	cancel(id) {
		const rooms = this.opt.getSocketRooms(id);
		rooms.forEach((room) => {
			this.opt.broadcast(room, {
				eventName: '_new_peer',
				data: {
					socketId: id
				}
			}, id);
			this.opt.leave(id, room);
		});
	}

	/**
	 * 收到某socket的消息
	 * @param {String} id
	 * @param {Object} data
	 */
	receive(id, data) {
		switch (data.type) {
		case typeObj.ice:
			this.iceCandidate(id, data);
			break;
		case typeObj.offer:
			this.offer(id, data);
			break;
		case typeObj.answer:
			this.answer(id, data);
			break;
		default:
			break;
		}
	}

	/**
	 * 收到ice描述信息
	 * @param {*} id
	 * @param {*} data
	 */
	iceCandidate(id, data) {
		this.opt.send(data.socketId, {
			eventName: '_ice_candidate',
			data: {
				label: data.label,
				candidate: data.candidate,
				socketId: id
			}
		});
	}

	/**
	 *
	 * @param {*} id
	 * @param {*} data
	 */
	offer(id, data) {
		this.opt.send(data.socketId, {
			eventName: '_offer',
			data: {
				sdp: data.sdp,
				socketId: id
			}
		});
	}

	/**
	 *
	 * @param {*} id
	 * @param {*} data
	 */
	answer(id, data) {
		this.opt.send(data.socketId, {
			eventName: '_answer',
			data: {
				sdp: data.sdp,
				socketId: id
			}
		});
	}
}


export default new Webrtc('webrtc');

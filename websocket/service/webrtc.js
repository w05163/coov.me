import serviceBase from './serviceBase';

/**
 * 帮助webrtc交换信息，管理房间
 */
class Webrtc extends serviceBase {
	/** 构造函数 */
	constructor() {
		super('webrtc');
	}

	/**
	 * 接入新连接，加入房间
	 * @param {String} id socket的id
	 * @param {String} key 房间key
	 */
	register(id, key) {
		this.opt.join(id, key);
		this.opt.broadcast(key, { id });
	}

	/**
	 * 移除socket，广播退出事件
	 * @param {String} id socket的id
	 */
	cancel(id) {
		// removeSocket(id);
		// emit('remove_peer', socket.id, that);
	}
}


export default new Webrtc();

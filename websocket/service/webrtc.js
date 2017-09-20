/**
 * 帮助webrtc交换信息，管理房间
 */
import Operator from '../operator';

const opt = new Operator('webrtc');

/**
 * 接入新连接，加入房间
 * @param {String} id socket的id
 * @param {String} key 房间key
 */
function register(id, key) {
	opt.join(id, key);
	opt.broadcast(key, { id });
}

/**
 * 移除socket，广播退出事件
 * @param {String} id socket的id
 */
function cancel(id) {
	// removeSocket(id);
	// emit('remove_peer', socket.id, that);
}
export default {
	register,
	cancel
};

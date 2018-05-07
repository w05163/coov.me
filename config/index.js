/**
 * 各种服务端和客户端的配置
 */
import privacy from './privacy';

export default {
	port: 443, // 服务器端口
	staticPath: 'public', // 静态资源目录
	page: { // 前端页面需要用到的配置
		themeColor: '#f44336', // 主题颜色，默认使用这个设置chrome浏览器颜色
		staticRoot: 'https://static-1252458005.cosgz.myqcloud.com/' // 尽量将静态资源放到另一个服务器（目前拟定使用腾讯云文件服务）
	},
	ws: { // websocket用到的配置
		backlog: 1000, // 等待连接的最大数量
		maxPayload: 1024 * 1024 * 2, // 单个massage的最大长度
		interval: 30 * 1000, // 心跳包间隔
		types: ['register', 'cancel', 'msg', 'request'], // 客户端允许发送的事件
	},
	dbPath: 'mongodb://localhost:27017',
	dbName: 'coov',
	debug: process.env.NODE_ENV !== 'production',
	miniAppId: 'wx9957c05e533ba562',
	...privacy
};

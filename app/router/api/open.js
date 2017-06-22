/**
 * 所有不需要鉴权的接口配置
 */

const routers = [
	{
		des: '示例配置',
		name: 'name1',
		method: 'get',
		fun: ctx => ctx.body = '这是一个路由示例'
	}
];

export default routers;

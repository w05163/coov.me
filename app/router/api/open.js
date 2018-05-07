/**
 * 所有不需要鉴权的接口配置
 */
import { controllerMapToRouter } from '../../../util/router';
import openController from '../../controller/open';

const routers = [
	{
		des: '示例配置',
		name: 'name1',
		method: 'get',
		controller: ctx => ctx.body = '这是一个路由示例'
	}
];

export default controllerMapToRouter(openController);

/**
 * 域名根目录下的路由，例如首页，或者其他单页应用的首页如http://coov.me/food/
 */
import pug from 'pug';
import config from '../../../config';

const viewPath = 'app/view/';

/**
 * 转换为标准格式
 * @param {Object} router
 * @return {Object}
 */
function transformToStandard({ path, template, params, fun }) {
	const compiledFunction = pug.compileFile(viewPath + template);
	return {
		method: 'get',
		path,
		fun: ctx => {
			const newParams = typeof fun === 'function' ? fun(ctx) : null;
			ctx.body = compiledFunction(
				Object.assign({}, params, newParams, { _pageConfig: config.page })
			);
		}
	};
}

const main = [
	{
		path: '',
		template: 'index.pug',
		params: {// 需要传入模板内的参数
			head: { // head.pug 需要用到的参数
				title: 'coov - 未定义', // 页面title，如果页面没指定
				themeColor: config.page.themeColor, // 可选，主题颜色
				meta: { // 可选
					keywords: 'coov.me', // 关键字，seo优化
					description: 'coov.me首页', // 描述，seo优化
				}
			}
		},
		fun: ctx => null // 可选，返回模板需要的参数对象，返回的对象将会和params混合后传入渲染模板
	}
];

export default main.map(transformToStandard);

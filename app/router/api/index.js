/**
 * 汇集所有api的路由配置
 */
import {supplementPath} from '../tool';
import openRouter from './open';

const open = supplementPath(openRouter, 'name', 'open');

export default [
	...open,
];

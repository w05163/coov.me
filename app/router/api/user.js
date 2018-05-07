/**
 * 用户相关接口配置
 */
import { controllerMapToRouter } from '../../../util/router';
import userController from '../../controller/user';

export default controllerMapToRouter(userController);

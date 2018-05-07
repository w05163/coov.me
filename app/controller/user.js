/** 用户模块 */
import mongoose from 'mongoose';

const Info = mongoose.model('user');
export default {
	get: {
		async get(ctx, next) {
			const opts = ctx.request.body;

			const info = new Info(opts);
			const saveInfo = await info.save();
			console.log(saveInfo);

			if (saveInfo) {
				ctx.body = {
					success: true,
					data: saveInfo
				};
			} else {
				ctx.body = {
					success: false
				};
			}
		}
	},
	post: {
		async login(ctx) {
			const { mobile, email, password } = ctx.request.body;
			return {
				success: true,
				code: 0,
				message: '请求成功',
				data: {}
			};
		},
		async register(ctx) {
		}
	},
	delete: {

	},
	put: {

	}
};


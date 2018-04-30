/**
 * 基本的schema
 * 用于被各表继承
 * 拥有基本的updated_at,created_at,和基本的增删改查
 */
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const baseSchema = {
	created_at: {
		type: Date,
		default: Date.now()
	},
	updated_at: {
		type: Date,
		default: Date.now()
	},
	auth_w: [{ type: Schema.Types.ObjectId, ref: 'user' }],
	auth_r: [{ type: Schema.Types.ObjectId, ref: 'user' }],
	auth_wr: [{ type: Schema.Types.ObjectId, ref: 'role' }], // 写权限角色
	auth_rr: [{ type: Schema.Types.ObjectId, ref: 'role' }], // 读权限角色
};

export const pre = {
	save(next) {
		const now = Date.now();
		if (this.isNew) {
			this.created_at = now;
			this.updated_at = now;
		} else {
			this.updated_at = now;
		}
		next();
	},
	update() {
		this.update({}, { $set: { updatedAt: new Date() } });
	},
	findOneAndUpdate() {
		// 中间件
	}
};

export default function makeBaseSchema(con, opt = { pre: true }) {
	const res = { ...con, ...baseSchema };
	if (opt.onlyConfig) return res;
	const schema = new Schema(res, opt.schemaOption);
	if (opt.pre) {
		Object.keys(pre).forEach((key) => {
			schema.pre(key, pre[key]);
		});
	}
	return schema;
}


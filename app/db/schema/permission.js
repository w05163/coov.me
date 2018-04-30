/**
 * 权限表
 */
import mongoose from 'mongoose';
import makeBaseSchema from './base';

const permissionSchema = makeBaseSchema({
	name: { type: String, required: true }, // 权限名称
	pathRegExp: { type: String, required: true }, // 匹配路径的正则表达式
	method: String,
});

export default mongoose.model('permission', permissionSchema);

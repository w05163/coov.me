/**
 * 用户表
 */

import mongoose from 'mongoose';
import makeBaseSchema from './base';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;


const userSchema = makeBaseSchema({
	name: { type: String, maxLength: 48, unique: true },
	email: { type: String, maxLength: 48, unique: true },
	mobile: { type: String, maxLength: 48, unique: true },
	password: { type: String, maxLength: 32, minLength: 32 },
	age: { type: Number, default: 0, max: 200, min: 0 },
	gender: { type: Number, default: 0, max: 3, min: 0 },
	avatar: String,
	city: String,
	nickname: { type: String, maxLength: 48 },
	province: { type: String, maxLength: 48 },
	verifyEmail: { type: Boolean, default: false },
	verifyMobile: { type: Boolean, default: false },
	role: [{ type: ObjectId, ref: 'role' }],
	tag: [String],
	openId: [String],
	wechatUnionId: { type: String, unique: true }
});


export default mongoose.model('user', userSchema);


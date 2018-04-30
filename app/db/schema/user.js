/**
 * 用户表
 */

import mongoose from 'mongoose';
import makeBaseSchema from './base';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;


const userSchema = makeBaseSchema({
	name: String,
	email: String,
	mobile: String,
	age: Number,
	gender: Number,
	avatar: String,
	verifyEmail: { type: Boolean, default: false },
	verifyMobile: { type: Boolean, default: false },
	role: [{ type: ObjectId, ref: 'role' }],
	tag: [String]
});


export default mongoose.model('user', userSchema);


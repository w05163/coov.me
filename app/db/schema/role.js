/**
 * 角色表
 */

import mongoose from 'mongoose';
import makeBaseSchema from './base';

const ObjectId = mongoose.Schema.Types.ObjectId;


const roleSchema = makeBaseSchema({
	name: { type: String, required: true }, // 角色名称
	permissions: [{ type: ObjectId, ref: 'permission' }], // 对应权限id
	noPermissions: [{ type: ObjectId, ref: 'permission' }], // 角色禁止的权限，优先级比auth高
});


export default mongoose.model('role', roleSchema);


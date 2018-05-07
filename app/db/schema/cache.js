/**
 * 暂时用于作为缓存的集合
 */
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const cache = new Schema({
	_id: String,
	expireAt: { type: Date, index: { expires: '0' } },
	data: Schema.Types.Mixed
});

export default mongoose.model('cache', cache);

import mongoose from 'mongoose';
import config from '../../config';
import './schema/info';

mongoose.Promise = Promise;

const DBFullPath = `${config.dbPath}/${config.dbName}`;
function DBInit() {
  mongoose.set('debug', config.debug);

  mongoose.connect(DBFullPath);

  mongoose.connection.on('disconnected', () => {
    mongoose.connect(DBFullPath);
  });
  mongoose.connection.on('error', (err) => {
    console.error(err);
  });

  mongoose.connection.on('open', async () => {
    console.log(`Connected to MongoDB ${DBFullPath}`);
  });
}

export default DBInit;

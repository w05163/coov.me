import mongoose from 'mongoose';
import config from '../../config';
import './schema/cache';
import './schema/user';
import './schema/role';
import './schema/permission';

mongoose.Promise = Promise;
const { dbPort, dbHost, dbName, dbPassword, dbUsername } = config;
const DBFullPath = `mongodb://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
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

const mongoose = require('mongoose');
const { log, success, error } = require('../helpers/Logger');

mongoose.set('strictQuery', true);

module.exports = {
  async initializeMongoose() {
    log(`Connecting to MongoDb...`);

    try {
      await mongoose.connect(process.env.MONGO_CONNECTION);

      success('Mongoose: Database connection established');

      return mongoose.connection;
    } catch (err) {
      error('Mongoose: Failed to connect to database', err);
      process.exit(1);
    }
  },

  schemas: {
    Guild: require('./schemas/Guild'),
    User: require('./schemas/User'),
  },
};

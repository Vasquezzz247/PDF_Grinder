const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
    }
);

const connectToDatabase = async (retries = 10, delay = 3000) => {
    while (retries) {
        try {
            await sequelize.authenticate();
            console.log('Connected to the db.');
            break;
        } catch (error) {
            console.error('Error connecting to the db:', error.message);
            retries -= 1;
            console.log(`Retrying in ${delay / 1000}s... (${retries} attempts remaining)`);
            await new Promise(res => setTimeout(res, delay));
        }
    }

    if (!retries) {
        console.error('Could not connect to the database after several attempts.');
        process.exit(1);
    }
};

module.exports = { sequelize, connectToDatabase };

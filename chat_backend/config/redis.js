const redis = require('redis');

const connectRedis = async () => {
    const client = redis.createClient(
        {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
        }
    );
    client.on('error', (error) => console.error(`Redis error: ${error}`));
    await client.connect();
    console.log('Connected to Redis');
    return client;
};

module.exports = connectRedis;
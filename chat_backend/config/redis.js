const redis = require('redis');

const connectRedis = async () => {
    const client = redis.createClient(
        { url: process.env.REDIS_URL }
    );
    client.on('error', (error) => console.error(`Redis error: ${error}`));
    await client.connect();
    console.log('Connected to Redis');
    return client;
};

module.exports = connectRedis;
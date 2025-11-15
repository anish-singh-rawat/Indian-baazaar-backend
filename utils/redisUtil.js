import { redis as redisClient } from '../config/redisClient.js';

export const DEFAULT_EXPIRY = 60 * 5; // 5 minutes

export const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
};

export const setCache = async (key, value, expiry = DEFAULT_EXPIRY) => {
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', expiry);
  } catch (err) {}
};

export const delCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (err) {}
};
import { prisma, User } from '../lib/prisma';
import redisClient from '../redisClient';
import logger from '../utils/logger';

export async function getAllUsers(): Promise<User[]> {
  return await prisma.user.findMany();
}

export async function countUsers(): Promise<number> {
  return await prisma.user.count();
}

export async function getUsers(offset: number, limit: number): Promise<User[]> {
  const cacheKey = `users:offset:${offset}:limit:${limit}`;

  const cached = await redisClient.get(cacheKey);
  logger.info(`Cache hit ${cacheKey}`);

  if (cached) {
    return JSON.parse(cached);
  }

  const users = await prisma.user.findMany({
    skip: offset,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });

  await redisClient.setEx(cacheKey, 300, JSON.stringify(users)); // cache 5 mins

  return users;
}

export async function getUserById(id: number): Promise<User | null> {
  return await prisma.user.findUnique({ where: { id } });
}

export async function createUser(
  data: Omit<User, 'id' | 'createdAt'>
): Promise<User | null> {
  const user = await prisma.user.create({ data });

  // invalidate all cached user lists
  const keys = await redisClient.keys('users:offset:*:limit:*');
  if (keys.length > 0) {
    await redisClient.del(keys);
  }

  return user;
}

export async function updateUser(
  id: number,
  data: Partial<User>
): Promise<User | null> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return null;

  const updatedUser = await prisma.user.update({ where: { id }, data });

  // clear all paginated cache
  const keys = await redisClient.keys('users:offset:*:limit:*');
  if (keys.length > 0) {
    await redisClient.del(keys);
  }

  return updatedUser;
}

export async function deleteUser(id: number): Promise<User | null> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return null;

  const user = await prisma.user.delete({ where: { id } }).catch(() => null);

  const keys = await redisClient.keys('users:offset:*:limit:*');
  if (keys.length > 0) {
    await redisClient.del(keys);
  }

  return user;
}

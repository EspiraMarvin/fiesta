import * as userService from '../services/user.service';
import { prisma } from '../lib/prisma';
import redisClient from '../redisClient';

// mock prisma client
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  prisma: {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // other mocks if needed...
  },
}));

/* 
   prisma mock constant to reduce manual calling of 
   (prisma.user.findMany as jest.Mock).mockResolvedValue(dbUsers);
   in place of
   mockedPrisma.user.findMany.mockResolvedValue(dbUsers)
*/
const mockedPrisma = prisma as unknown as {
  user: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  //...
};

// mock redis client
jest.mock('../redisClient', () => ({
  __esModule: true,
  default: {
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(0),
    get: jest.fn(),
    setEx: jest.fn(),
  },
}));

/* 
   redis client mock constant to reduce manual calling of 
   (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedUsers));
   in place of
   mockedRedisClient.get.mockResolvedValue(JSON.stringify(cachedUsers));
*/
const mockedRedisClient = redisClient as unknown as {
  keys: jest.Mock;
  del: jest.Mock;
  get: jest.Mock;
  setEx: jest.Mock;
};

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new user', async () => {
    const mockUser = {
      id: 1,
      name: 'marvin espira',
      username: 'marvo',
      email: 'marvin@gmail.com',
      phone: null,
      website: null,
    };

    mockedPrisma.user.create.mockResolvedValue(mockUser);

    const result = await userService.createUser({
      name: 'marvin espira',
      username: 'marvo',
      email: 'marvin@gmail.com',
      phone: null,
      website: null,
    });

    expect(result).toEqual(mockUser);
  });

  it('should return users from cache if available', async () => {
    const offset = 0;
    const limit = 10;
    const cacheKey = `users:offset:${offset}:limit:${limit}`;

    const cachedUsers = [
      {
        id: 1,
        name: 'Cached User',
        username: 'cached',
        email: 'cached@example.com',
        phone: null,
        website: null,
      },
    ];

    mockedRedisClient.get.mockResolvedValue(JSON.stringify(cachedUsers));

    const result = await userService.getUsers(offset, limit);

    expect(mockedRedisClient.get).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(cachedUsers);
    expect(mockedPrisma.user.findMany).not.toHaveBeenCalled(); // no DB call on cache hit
  });

  it('should fetch users from DB and cache them if not in Redis', async () => {
    const offset = 0;
    const limit = 5;
    const cacheKey = `users:offset:${offset}:limit:${limit}`;

    const dbUsers = [
      {
        id: 2,
        name: 'DB User',
        username: 'dbuser',
        email: 'db@example.com',
        phone: null,
        website: null,
      },
    ];

    mockedRedisClient.get.mockResolvedValue(null);
    mockedPrisma.user.findMany.mockResolvedValue(dbUsers);

    const result = await userService.getUsers(offset, limit);

    expect(mockedRedisClient.get).toHaveBeenCalledWith(cacheKey);
    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    expect(mockedRedisClient.setEx).toHaveBeenCalledWith(
      cacheKey,
      300,
      JSON.stringify(dbUsers)
    );
    expect(result).toEqual(dbUsers);
  });
});

describe('User Service - getUserById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 1,
    name: 'marvin espira',
    username: 'marvo',
    email: 'marvin@gmail.com',
    phone: null,
    website: null,
  };

  it('should get a user by ID', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

    const user = await userService.getUserById(mockUser.id);

    expect(user).not.toBeNull();
    expect(user?.id).toBe(mockUser.id);
    expect(user?.email).toBe('marvin@gmail.com');
  });

  it('should return null for non-existent ID', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const user = await userService.getUserById(999999);

    expect(user).toBeNull();
  });
});

describe('User Service - updateUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const existingUser = {
    id: 1,
    name: 'marvin espira',
    username: 'marvo',
    email: 'marvin@gmail.com',
    phone: null,
    website: null,
  };

  const updatedUser = {
    ...existingUser,
    username: 'marvin_updated',
  };

  it("should update a user's username", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(existingUser);
    mockedPrisma.user.update.mockResolvedValue(updatedUser);

    const result = await userService.updateUser(existingUser.id, {
      username: 'marvin_updated',
    });

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: existingUser.id },
    });

    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: existingUser.id },
      data: { username: 'marvin_updated' },
    });
    expect(result).toEqual(updatedUser);
  });

  it('should return null if user does not exist', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const result = await userService.updateUser(999, {
      username: 'should_not_work',
    });

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 999 },
    });

    expect(result).toBeNull();
  });
});

describe('User Service - deleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const user = {
    id: 1,
    name: 'marvin espira',
    username: 'marvo',
    email: 'marvin@gmail.com',
    phone: null,
    website: null,
  };

  it('should delete a user', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(user);
    mockedPrisma.user.delete.mockResolvedValue(user);
    const userDeleted = await userService.deleteUser(user.id);

    expect(mockedPrisma.user.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });

    expect(userDeleted).toEqual(userDeleted);
  });

  it('should return null if user does not exist', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const result = await userService.deleteUser(user.id);

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: user.id },
    });

    expect(result).toBeNull();
  });
});

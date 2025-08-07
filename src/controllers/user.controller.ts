import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import logger from '../utils/logger';

export async function getAllUsers(req: Request, res: Response) {
  const pageParam = req.query.page;
  const limitParam = req.query.limit;

  // prevent using 0 or any number less than 0
  const page = pageParam !== undefined ? Number(pageParam) : 1;
  const limit = limitParam !== undefined ? Number(limitParam) : 10;

  // validate page
  if (!Number.isInteger(page) || page <= 0) {
    const message = `Invalid page number "${req.query.page}". Page must be greater than 0.`;
    logger.error(`${req.method} ${req.originalUrl} - ${message}`);
    return res.status(400).json({ error: message });
  }

  // validate limit
  if (!Number.isInteger(limit) || limit <= 0) {
    const message = `Invalid limit "${limitParam}". Limit must be a positive integer.`;
    logger.error(`${req.method} ${req.originalUrl} - ${message}`);
    return res.status(400).json({ error: message });
  }

  const offset = (page - 1) * limit;

  try {
    const [users, total] = await Promise.all([
      userService.getUsers(offset, limit),
      userService.countUsers(),
    ]);

    res.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error(`Error fetching users: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUser(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const user = await userService.getUserById(+id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}

export async function createUser(req: Request, res: Response) {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
}

export async function updateUser(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const user = await userService.updateUser(+id, req.body);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}

export async function deleteUser(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  const user = await userService.deleteUser(+id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'Deleted successfully' });
}

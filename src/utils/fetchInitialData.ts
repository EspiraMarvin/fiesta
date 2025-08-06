import { prisma } from '../lib/prisma';
import axios from 'axios';

// const prisma = new PrismaClient();

export async function fetchAndStoreUsers() {
  const count = await prisma.user.count();
  if (count > 0) return;

  const response = await axios.get(
    'https://jsonplaceholder.typicode.com/users'
  );
  const users = response.data;
  await prisma.user.createMany({
    data: users.map((u: any) => ({
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      website: u.website,
    })),
    skipDuplicates: true,
  });

  console.log('Initial users imported.');
}

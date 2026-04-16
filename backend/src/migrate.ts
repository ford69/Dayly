import { getCollection } from './db';
import type { UserDoc, TaskDoc } from './models';
import { getEnv } from './env';

async function migrate() {
  getEnv('MONGODB_URI');
  getEnv('JWT_SECRET');

  const users = await getCollection<UserDoc>('users');
  await users.createIndex({ email: 1 }, { unique: true });

  const tasks = await getCollection<TaskDoc>('tasks');
  await tasks.createIndex({ user_id: 1, date: 1, start_time: 1 });
  await tasks.createIndex({ user_id: 1, status: 1 });

  // eslint-disable-next-line no-console
  console.log('Migrations applied: users(email unique), tasks(user_id/date/start_time), tasks(user_id/status)');
}

migrate().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


// index.ts
import { createApp } from './app';
import { env } from './env';

async function main() {
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`[api] listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
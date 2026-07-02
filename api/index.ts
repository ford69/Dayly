// @ts-nocheck
import { createApp } from '../backend/src/app';

const app = createApp();

export default function handler(req, res) {
  app(req, res);
}

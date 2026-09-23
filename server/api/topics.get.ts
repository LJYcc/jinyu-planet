import { defineEventHandler } from 'h3';
import { listTopics } from '../repositories/postRepository';

export default defineEventHandler(async () => ({ topics: await listTopics() }));

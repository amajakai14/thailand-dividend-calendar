import request from 'supertest';
import app from '../../../server/src/app';

export const api = request(app);

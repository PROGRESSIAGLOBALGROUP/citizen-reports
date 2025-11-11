import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import { getDb } from './server/db.js';

console.log('✅ Todos los imports están OK');
console.log('✅ Express:', typeof express);
console.log('✅ helmet:', typeof helmet);
console.log('✅ cors:', typeof cors);
console.log('✅ morgan:', typeof morgan);
console.log('✅ compression:', typeof compression);
console.log('✅ getDb:', typeof getDb);

process.exit(0);

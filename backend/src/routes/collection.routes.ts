import { Router } from 'express';
import { getAllCollections, getCollectionById } from '../controllers/collection.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, getAllCollections);
router.get('/:id', optionalAuth, getCollectionById);

export default router;

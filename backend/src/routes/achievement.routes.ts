import { Router } from 'express';
import { getAllAchievements } from '../controllers/achievement.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getAllAchievements);

export default router;

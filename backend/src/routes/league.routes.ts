import { Router } from 'express';
import {
  getMyLeague,
  getLeaderboard,
  getLeagueHistory,
  getLeagueInfo,
  addXP,
} from '../controllers/league.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Get current user's league info
router.get('/my', authenticateToken, getMyLeague);

// Get leaderboard for current week
router.get('/leaderboard', authenticateToken, getLeaderboard);

// Get league history
router.get('/history', authenticateToken, getLeagueHistory);

// Get league tier info
router.get('/info/:tier', getLeagueInfo);

// Add XP (internal use - called by other controllers)
router.post('/xp', authenticateToken, addXP);

export default router;

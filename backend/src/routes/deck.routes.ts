import { Router } from 'express';
import {
  getDecks,
  getPublicDecks,
  getDeckById,
  createDeck,
  updateDeck,
  deleteDeck,
  cloneDeck,
  addWordToDeck,
  removeWordFromDeck,
} from '../controllers/deck.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Get user's decks (requires auth)
router.get('/', authenticateToken, getDecks);

// Get public/community decks (optional auth)
router.get('/public', optionalAuth, getPublicDecks);

// Get single deck by ID (optional auth for public decks)
router.get('/:id', optionalAuth, getDeckById);

// Create a new deck (requires auth)
router.post('/', authenticateToken, createDeck);

// Update a deck (requires auth)
router.put('/:id', authenticateToken, updateDeck);

// Delete a deck (requires auth)
router.delete('/:id', authenticateToken, deleteDeck);

// Clone a public deck (requires auth)
router.post('/:id/clone', authenticateToken, cloneDeck);

// Add word to deck (requires auth)
router.post('/:id/words', authenticateToken, addWordToDeck);

// Remove word from deck (requires auth)
router.delete('/:id/words/:wordId', authenticateToken, removeWordFromDeck);

export default router;

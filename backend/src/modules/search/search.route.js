const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const searchController = require('./search.controller');

const router = express.Router();

// ─── Search History (Phase 3 - Task 3.5.1) ───────────────────────────────────
router.get('/history', auth, searchController.getHistory);
router.delete('/history', auth, searchController.clearHistory);

// ─── Search Suggestions (Phase 3 - Task 3.5.2) ───────────────────────────────
router.get('/suggestions', auth, searchController.getSuggestions);

// ─── Main Search (Tasks 2.6.1, 2.6.2 + Phase 4 text index) ──────────────────
router.get('/', searchController.search);

module.exports = router;

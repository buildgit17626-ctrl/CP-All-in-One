import express from 'express';
import { timingSafeEqual } from 'node:crypto';
import { getSourceHealth } from '../jobs/sourceHealth.js';
import mongoose from 'mongoose';
import { Contest } from '../models/Contest.js';
import { inMemoryContests, syncAllContests, lastSyncAt } from '../jobs/cron.js';

const router = express.Router();

/**
 * GET /api/v1/contests
 * Serves upcoming and active competitive programming contests.
 */
router.get('/contests', async (req, res) => {
  try {
    const { platform, status } = req.query;
    if ((platform && typeof platform !== 'string') || (status && !['BEFORE', 'CODING', 'FINISHED'].includes(status))) {
      return res.status(400).json({ success: false, error: 'Invalid filter' });
    }
    // Wake a sleeping host's schedule without blocking the cached response.
    if (lastSyncAt && Date.now() - Date.parse(lastSyncAt) > 30 * 60000) syncAllContests().catch(error => console.warn('[Contests] Refresh failed:', error.message));
    const isDbConnected = mongoose.connection.readyState === 1;

    let contests = [];

    if (isDbConnected) {
      const query = {};
      if (platform) {
        query.platform = String(platform);
      }

      // Default filter: hide finished contests unless specified
      if (status) {
        const now = new Date();
        if (status === 'BEFORE') query.startTime = { $gt: now };
        else if (status === 'CODING') { query.startTime = { $lte: now }; query.endTime = { $gt: now }; }
        else if (status === 'FINISHED') query.endTime = { $lte: now };
      } else {
        query.endTime = { $gt: new Date() };
      }

      try { contests = await Contest.find(query).sort({ startTime: 1 }).lean(); }
      catch { contests = Array.from(inMemoryContests.values()); }
      const current = new Map(contests.map(c => [c.platform + '_' + c.contestId, c]));
      for (const [key, c] of inMemoryContests) current.set(key, c);
      contests = [...current.values()].filter(c => !platform || c.platform.toLowerCase() === platform.toLowerCase());
      contests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    } else {
      // Memory fallback
      contests = Array.from(inMemoryContests.values());

      if (platform) {
        contests = contests.filter(
          (c) => c.platform.toLowerCase() === platform.toLowerCase()
        );
      }

      contests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }

    const now = Date.now();
    contests = contests.map(c => ({ ...c, status: new Date(c.endTime).getTime() <= now ? 'FINISHED' : new Date(c.startTime).getTime() <= now ? 'CODING' : 'BEFORE' }))
      .filter(c => status ? c.status === status : c.status !== 'FINISHED');
    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      lastSyncAt,
      sourceHealth: getSourceHealth(),
      success: true,
      count: contests.length,
      data: contests,
    });
  } catch (error) {
    console.error('[Route GET /contests] Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve contests' });
  }
});

/**
 * POST /api/v1/contests/sync
 * Manually trigger background sync.
 */
router.post('/contests/sync', async (req, res) => {
  const expected = process.env.CONTEST_SYNC_KEY;
  if (!expected) return res.status(503).json({ success: false, error: 'Manual refresh is disabled; scheduled refresh remains active.' });
  const provided = req.get('Authorization') || '';
  const left = Buffer.from(provided), right = Buffer.from('Bearer ' + expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return res.status(401).json({ success: false, error: 'Unauthorized' });
  try {
    const result = await syncAllContests();
    res.json({ success: true, message: 'Sync triggered successfully', ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

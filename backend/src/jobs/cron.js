import cron from 'node-cron';
import { recordSourceResults, getSourceHealth } from './sourceHealth.js';
import mongoose from 'mongoose';
import { Contest } from '../models/Contest.js';
import { fetchCodeforcesContests } from '../services/codeforcesService.js';
import { fetchLeetCodeContests } from '../services/leetcodeService.js';
import { fetchAtCoderContests } from '../services/atcoderService.js';
import { fetchCodeChefContests } from '../services/codechefService.js';
import { fetchUniversalCpContests } from '../services/universalCpService.js';
import { fetchUnstopContests } from '../services/unstopService.js';

// In-memory fallback cache when MongoDB is disconnected/offline
export const inMemoryContests = new Map();

let activeSync;
let lastAttempt = 0;
let lastResult;
export let lastSyncAt = null;
export function syncAllContests() {
  if (activeSync) return activeSync;
  if (lastResult && Date.now() - lastAttempt < 60000) return Promise.resolve(lastResult);
  lastAttempt = Date.now();
  activeSync = runSync().then(result => { lastResult = result; return result; }).finally(() => { activeSync = null; });
  return activeSync;
}
async function runSync() {
  console.log('[Cron Job] Starting contest fetch across all platforms (Codeforces, LeetCode, AtCoder, CodeChef, Unstop, HackerCup, Google)...');

  try {
    const results = await Promise.allSettled([
      fetchCodeforcesContests(),
      fetchLeetCodeContests(),
      fetchAtCoderContests(),
      fetchCodeChefContests(),
      fetchUniversalCpContests(),
      fetchUnstopContests(),
    ]);

    recordSourceResults(results);
    const [cfContests, lcContests, acContests, ccContests, universalContests, unstopContests] = results.map((result, index) => {
      if (result.status === 'fulfilled') return result.value;
      console.warn(`[Cron Job] Contest source ${index + 1} failed:`, result.reason?.message || result.reason);
      return [];
    });

    const rawList = [
      ...cfContests,
      ...lcContests,
      ...acContests,
      ...ccContests,
      ...universalContests,
      ...unstopContests,
    ];

    // Different rounds can share a title. Prefer the canonical event URL.
    const uniqueMap = new Map();
    for (const c of rawList) {
      if (!c || typeof c.platform !== 'string' || typeof c.title !== 'string') continue;
      const key = `${c.platform.toLowerCase()}_${String(c.url || c.contestId).replace(/\/+$/, '')}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, c);
      }
    }

    const allContests = Array.from(uniqueMap.values());
    console.log(`[Cron Job] Fetched ${allContests.length} total active/upcoming contests across all platforms.`);

    if (allContests.length === 0) {
      console.warn('[Cron Job] All contest sources returned no data; preserving the existing schedule.');
      return {
        count: 0,
        sourceHealth: getSourceHealth(),
        sources: {
          codeforces: cfContests.length,
          leetcode: lcContests.length,
          atcoder: acContests.length,
          codechef: ccContests.length,
          universal: universalContests.length,
          unstop: unstopContests.length,
        },
      };
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    const validContests = allContests.filter(c => c.contestId && c.title && c.url &&
      Number.isFinite(new Date(c.startTime).getTime()) && new Date(c.endTime) > new Date(c.startTime));
    // Keep the live schedule available even if a connected database rejects writes.
    for (const contest of validContests) inMemoryContests.set(contest.platform + '_' + contest.contestId, contest);
    if (isDbConnected && validContests.length) {
      try {
      await Contest.bulkWrite(validContests.map(contest => ({ updateOne: {
        filter: { platform: contest.platform, contestId: contest.contestId },
        update: { $set: contest }, upsert: true,
      } })), { ordered: false });
      } catch (error) { console.warn('[Cron] Database write failed; serving memory schedule:', error.message); }
    }
    for (const contest of validContests) inMemoryContests.set(contest.platform + '_' + contest.contestId, contest);
    for (const [key, contest] of inMemoryContests) {
      if (new Date(contest.endTime).getTime() <= Date.now()) inMemoryContests.delete(key);
    }
    if (validContests.length) lastSyncAt = new Date().toISOString();

    console.log('[Cron Job] Sync complete successfully.');
    return {
      count: validContests.length,
      sourceHealth: getSourceHealth(),
      sources: {
        codeforces: cfContests.length,
        leetcode: lcContests.length,
        atcoder: acContests.length,
        codechef: ccContests.length,
        universal: universalContests.length,
        unstop: unstopContests.length,
      },
    };
  } catch (error) {
    console.error('[Cron Job] Error during contest sync:', error.message);
    throw error;
  }
}

export function initCronJobs() {
  // Run background fetch every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    return syncAllContests().catch(error => console.error('[Cron] Sync failed:', error.message));
  }, { timezone: 'UTC', noOverlap: true });

  // Initial run on server startup
  syncAllContests().catch(error => console.error('[Cron] Initial sync failed:', error.message));
}

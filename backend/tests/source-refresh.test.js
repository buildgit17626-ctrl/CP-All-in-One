import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import {fetchCodeforcesContests} from '../src/services/codeforcesService.js';
import {fetchLeetCodeContests} from '../src/services/leetcodeService.js';
import {fetchCodeChefContests} from '../src/services/codechefService.js';
import {fetchAtCoderContests} from '../src/services/atcoderService.js';

test('platform schedules reflect changing upstream events and exclude ended events', async () => {
 const get=axios.get, post=axios.post; const now=Date.now();
 try {
  let id=1;
  axios.get=async()=>({data:{status:'OK',result:[{id,name:'Round',startTimeSeconds:Math.floor(now/1000)+3600,durationSeconds:7200,phase:'BEFORE'}]}});
  assert.equal((await fetchCodeforcesContests())[0].contestId,'cf-1');id=2;
  assert.equal((await fetchCodeforcesContests())[0].contestId,'cf-2');
  axios.post=async()=>({data:{data:{upcomingContests:[{title:'Weekly',titleSlug:'weekly-1',startTime:Math.floor(now/1000)+3600,duration:5400}],topTwoContests:[]}}});
  assert.equal((await fetchLeetCodeContests())[0].contestId,'lc-weekly-1');
  axios.get=async()=>({data:{future_contests:[{contest_code:'NEXT',contest_name:'Next',contest_start_date_iso:new Date(now+3600000).toISOString(),contest_end_date_iso:new Date(now+7200000).toISOString()}],present_contests:[{contest_code:'OLD',contest_name:'Old',contest_start_date_iso:new Date(now-7200000).toISOString(),contest_end_date_iso:new Date(now-3600000).toISOString()}]}});
  assert.deepEqual((await fetchCodeChefContests()).map(c=>c.contestId),['codechef-next']);
  axios.get=async()=>({data:'<table><tbody><tr><td>2099-01-01 21:00:00+0900</td><td><a href="/contests/sponsor-final">Sponsored Final</a></td><td>02:00</td></tr></tbody></table>'});
  assert.equal((await fetchAtCoderContests())[0].contestId,'ac-sponsor-final');
 } finally {axios.get=get;axios.post=post;}
});

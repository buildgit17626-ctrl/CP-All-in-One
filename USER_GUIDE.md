# How to use All In One CP

## What Backups does

Backups saves captured accepted-solution source code as files in your selected GitHub repository. It is a solution archive, not a backup of your Google account, entire computer, browser, or all past submissions. It does not automatically recover every previously solved question.

Automatic capture currently supports LeetCode, Codeforces, AtCoder, CodeChef, and CSES. Other platforms may provide contests or notes without automatic solution capture. Keep the extension enabled and visit the supported submission/result page while signed in to that platform so it can read your own accepted source. For CSES, a green tick in the sheet alone is insufficient: open your accepted result page with visible source code. Earlier Codeforces solutions can also be imported from Backups → Fix → History and recovery.

Sources enter a local queue before upload. Chrome must be running for scheduled uploads. Network failures retry with increasing delays; expired or revoked authorization needs sign-in again. Duplicate identical solutions are not repeatedly uploaded. Code is organized by platform, language, and problem. Notes upload is off.

Contest solutions are held until the contest end time. If that time is unknown, use Fix → History and recovery to supply it. Do not publish solutions during an active contest. Changing repositories does not silently redirect existing queued solutions: reconnect the original repository or remove its old queue records.

## First-time setup: GitHub

You need a GitHub account and an existing private repository. This release only supports private repositories. If needed, create one at https://github.com/new and choose Private; a name such as cp-solutions is suitable.

1. Open the extension and click Sign in to GitHub.
2. Open the GitHub sign-in link shown by the extension: https://github.com/login/device. Sign in, enter the temporary code shown in the extension, and authorize All In One CP. Keep the code private; get a new code if it expires.
3. In Choose your repository, click Grant repository access on GitHub. The direct link is https://github.com/apps/all-in-one-cp/installations/new.
4. Choose the GitHub account that owns your repository. Select Only select repositories, choose your private solutions repository, and install the app. If already installed, update its repository access instead. Organization repositories may require owner approval.
5. Return to the extension, click Refresh repositories, choose the repository, and click Use this repository.
6. Connect Google Calendar in the final step if desired, or choose Set up later.

Users do not need to create a GitHub App, visit Developer settings, generate tokens, or provide a client secret. Device authorization signs you in; app installation grants repository access. Both are needed. Your GitHub and Google email addresses can differ.

If your repository is missing, check https://github.com/settings/installations, choose Configure beside All In One CP, and confirm the correct account and repository access. Then refresh the extension's repository list. Public or archived repositories are excluded.

## Everyday use

### Contests

Browse upcoming contests, search, and use filters in Settings. Open a contest from its card. Feeds are cached and refreshed periodically; upstream outages can leave older saved data visible. Feed coverage depends on each platform's available data.

### Calendar

Connect Google through Chrome sign-in, enable automatic matching-contest sync if wanted, and select reminders. Sync now refreshes managed events. Remove added events deletes extension-owned events and pauses automatic calendar sync so they are not immediately recreated. Check any reported partial failures and retry.

Each contest also offers Add to Google Calendar, which opens Google's event form. Confirm Save there. These manually created events are not tracked by the extension's removal button and must be deleted in Google Calendar yourself.

### Backups

Check the status line. Click Fix for GitHub connection, repository access, history/recovery, and diagnostics. Open a synced entry's GitHub link to confirm its file. Failed items retain captured source until removed; retry after fixing the reported problem. Disconnecting GitHub stops uploads and preserves local queue records.

### Notes and Review

Use the on-page Notes control on supported problem pages, including contest problems. Supported question routes cover LeetCode, Codeforces, AtCoder, CodeChef, CSES, HackerRank, GeeksforGeeks, SPOJ, Kattis, and HackerEarth. Save before closing or reloading the tab. Find, edit, export, or delete notes in the Notes tab. Expand Review for bookmarks, tags, review dates, solved status, and Codeforces upsolve discovery.

Notes are local to this Chrome extension installation and do not synchronize between devices. Export them before removing the extension or clearing its storage. Automatic GitHub backups do not include your notes.

## Quick checks after connecting

- Submit or open one of your own accepted solutions on a supported platform, check Backups, and confirm the resulting source file in GitHub. Contest entries can remain Held until their end time.
- Add a contest using managed calendar sync, check Google Calendar, then verify removal removes that managed event.
- Save a problem note, revisit the question, and confirm it appears in Notes.

Live website layouts and permissions can change. Report the platform, page type, and error text when something fails; never share access tokens, passwords, device codes, or private source code in public issues.

Privacy policy: https://buildgit17626-ctrl.github.io/CP-Schedule-Extension/privacy.html
Support: https://github.com/buildgit17626-ctrl/CP-Schedule-Extension/issues

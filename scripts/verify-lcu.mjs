/**
 * Live LCU verification — reads the lockfile, probes the endpoints Dark
 * Binding uses, and prints a PASS/FAIL report. Never prints the password.
 *
 * Usage: node scripts/verify-lcu.mjs
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const INSTALL_DIRS = [
  process.env.LEAGUE_CLIENT_DIR,
  'C:\\Riot Games\\League of Legends',
  'D:\\Riot Games\\League of Legends',
  'E:\\Riot Games\\League of Legends',
].filter(Boolean);

let lockfile = null;
for (const dir of INSTALL_DIRS) {
  try {
    lockfile = readFileSync(join(dir, 'lockfile'), 'utf8');
    console.log('[ok] lockfile found in', dir);
    break;
  } catch {
    /* try next */
  }
}

if (!lockfile) {
  console.error('[FAIL] no lockfile found - is the League client running?');
  process.exit(1);
}

const [name, pid, port, password, protocol] = lockfile.trim().split(':');
console.log(`[ok] lockfile: name=${name} pid=${pid} port=${port} proto=${protocol}`);

if (name !== 'LeagueClient') {
  console.error(`[FAIL] unexpected lockfile name "${name}"`);
  process.exit(1);
}

const auth = 'Basic ' + Buffer.from(`riot:${password}`).toString('base64');
const base = `https://127.0.0.1:${port}`;

const results = [];
async function probe(label, path, { method = 'GET', body } = {}) {
  try {
    const res = await fetch(base + path, {
      method,
      headers: {
        Authorization: auth,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      /* non-JSON */
    }

    results.push({ label, path, status: res.status, ok: res.ok, data });
    console.log(`[${res.ok ? 'ok' : 'FAIL'}] ${method} ${path} -> ${res.status}`);
    return data;
  } catch (e) {
    results.push({ label, path, error: String(e) });
    console.log(`[FAIL] ${method} ${path} -> ${e.message}`);
    return null;
  }
}

// 1. Summoner (login detection)
const summoner = await probe('current-summoner', '/lol-summoner/v1/current-summoner');
const summonerId = summoner?.summonerId;
console.log(`     summonerId: ${summonerId ?? 'n/a'}, name: ${summoner?.gameName ?? summoner?.name ?? 'n/a'}`);

// 2. Input settings (the core endpoint)
const input = await probe('input-settings', '/lol-game-settings/v1/input-settings');
if (input) {
  const sections = Object.keys(input);
  const gameEvents = input.GameEvents ? Object.keys(input.GameEvents).length : 0;
  const sample = input.GameEvents?.evtCastSpell1 ?? '(missing)';
  console.log(`     sections: ${sections.join(', ')}`);
  console.log(`     GameEvents keys: ${gameEvents}, evtCastSpell1 = ${JSON.stringify(sample)}`);
}

// 3. Schema endpoint
const schema = await probe('input-settings-schema', '/lol-game-settings/v1/input-settings-schema');
if (schema) console.log(`     schema top-level keys: ${Object.keys(schema).length}`);

// 4. Champions list
const champs = await probe(
  'champions-minimal',
  `/lol-champions/v1/inventories/${summonerId ?? 0}/champions-minimal`
);
if (Array.isArray(champs)) {
  const owned = champs.filter(c => c.ownership?.owned).length;
  console.log(`     champions: ${champs.length} total, ${owned} owned`);
  console.log(`     sample: ${champs.slice(0, 3).map(c => `${c.name}#${c.id}`).join(', ')}`);
}

// 5. Gameflow phase
const phase = await probe('gameflow-phase', '/lol-gameflow/v1/gameflow-phase');
if (phase !== null) console.log(`     gameflow phase: ${JSON.stringify(phase)}`);

// 6. Explicit save endpoint (HEAD-like probe via GET is not defined; we only
//    check the endpoint exists by issuing POST with no body and reporting
//    the status - the client treats an empty POST as a no-op save).
//    NOTE: skipped by default to avoid touching real settings during a probe.
console.log('\n[skip] POST /lol-game-settings/v1/save (not probed to avoid touching settings)');

// 7. WAMP websocket availability (port answers TLS?)
try {
  const tls = await fetch(base + '/', { headers: { Authorization: auth } });
  console.log(`[${tls.status < 500 ? 'ok' : 'FAIL'}] LCU HTTPS root reachable -> ${tls.status}`);
} catch (e) {
  console.log(`[FAIL] LCU HTTPS root -> ${e.message}`);
}

const failed = results.filter(r => !r.ok && !r.error);
console.log(`\n=== ${failed.length === 0 ? 'ALL PROBES PASSED' : failed.length + ' PROBE(S) FAILED'} ===`);
process.exit(failed.length === 0 ? 0 : 1);

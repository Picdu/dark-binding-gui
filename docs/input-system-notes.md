# LCU Input System — Stand 2026-09-19

## Recherche-Ergebnis

Quelle: offizielles LCU-Swagger von [hasagi-types](https://github.com/dysolix/hasagi-types)
(`swagger.json`, generiert aus Client **16.17.812.4632** — Season 16 / Patch-2618-Ära,
abgerufen 2026-09-19). Zusätzlich Reddit r/leagueoflegends Patch 26.5 Bug Megathread
(Riot-Statement, 2026-03-06).

### v1-Endpoints: alle noch da

| Endpoint | Methoden | Status |
|---|---|---|
| `/lol-game-settings/v1/input-settings` | GET, PATCH | ✅ unverändert |
| `/lol-game-settings/v1/input-settings-schema` | GET | ✅ unverändert |
| `/lol-game-settings/v1/game-settings` | GET, PATCH | ✅ unverändert |
| `/lol-game-settings/v1/save` | POST | ✅ neu genutzt von uns (explizites Persistieren) |
| `/lol-game-settings/v1/didreset`, `/ready`, `/reload-post-game` | — | ✅ vorhanden |

Das GET/PATCH-Schema ist laut Swagger weiterhin ein freies
`object` mit `additionalProperties: true` — d. h. das alte
`{ GameEvents: {...}, Quickbinds: {...} }`-Format ist nach wie vor das Format.

### Der "Input Update" von 2026

- Riot rollte ~März 2026 (Patch 26.5) ein "Keybinds/Input Update" testweise auf EUW aus.
- Wegen Bugs wurde es **zurückgerollt** ("temporarily off", Riot-Statement im
  26.5 Bug Megathread).
- Im aktuellen Swagger (16.17.x) gibt es **keinen** neuen Keybind-Endpoint.

### Das neue /lol-settings/v1|v2-System enthält KEINE Keybinds

Geprüft: alle Endpoints unter `/lol-settings/` im Swagger. Inhalt:
- Feature-Flags (`HotkeysEnabled`, `SoundEnabled`, `isInterfaceEnabled`, …)
- Account-/Local-Setting-Kategorien (keine `evt*`-Keys, keine Binding-Strings)
- vv2-Reload/Upload-Mechanik

Fazit: Es gibt derzeit **kein zweites Format** — v1 ist das einzige. "Beide
Formate unterstützen" ist daher vorzeitig implementiert als:
1. v1 als Primary (bewiesen vorhanden bis 16.17.x),
2. explizites `POST /save` nach jedem PATCH (robuster bei Client-Crash),
3. **Degraded Mode**: antwortet der v1-Endpoint mit 404/405/501 (Riot hat ihn
   entfernt/umgestellt), loggt die App trotzdem ein, meldet
   `inputMode: 'unsupported'`, zeigt ein Banner + Notification und deaktiviert
   das Auto-Switching, statt in einer Retry-Schleife zu hängen.

## Was bei einer künftigen Umstellung zu tun ist

Falls Riot das Input Update reaktiviert:
1. Swagger vom eigenen Client ziehen: `GET https://127.0.0.1:<port>/swagger/v3/openapi.json`
   (Basic auth `riot:<lockfile-passwort>`), nach `input`-Endpoints greppen.
2. Neuen Endpoint in `src/common/utils/lcu/api.ts` ergänzen und im
   Connector (`pollSettings`) als Fallback hinter `inputMode: 'v2'` einhängen.
3. UI-Banner in `App/index.tsx` auf `inputMode`-Fall anpassen.

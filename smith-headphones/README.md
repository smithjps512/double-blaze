# Smith: Smart Headphones Demo

A voice assistant designed by 6th graders. Regular Bluetooth headphones plus this
web app on the teacher's phone make it feel like the headphones themselves are smart.

```
Headphones (mic + speaker) <-> Phone web app (listens, speaks, plays music)
                                   |
                                   v
                     /api/smith on Vercel (holds the API key) <-> Claude
```

## What is in here

| File | What it does |
|---|---|
| `smith-personality.txt` | Smith's personality. Students can read and edit it. |
| `api/smith.js` | The only server code. Holds the API key, asks Claude, returns words and actions. |
| `public/index.html`, `styles.css` | The big projector friendly screen. |
| `public/app.js` | The main loop: listen, think, speak, sleep. |
| `public/listen.js` | Speech recognition and the "Hey Smith" wake word. |
| `public/speak.js` | Smith's voice and the voice picker. |
| `public/player.js` | Built in music player, volume, and the headphone button. |
| `public/actions.js` | Timer, calls, and texts. |
| `public/contacts.js` | Pretend phone book (555 numbers). |
| `public/music/` | Songs plus `playlist.js`. The three starter songs were generated for this project. |

## Smith's tools (Claude picks one, the phone does it)

`play_music`, `pause_music`, `next_song`, `set_volume`, `set_timer`, `start_call`, `send_text`

## Deploy to Vercel (one time)

1. In Vercel: **Add New Project**, then import this GitHub repo.
2. Set **Root Directory** to `smith-headphones`. Framework preset: **Other**. Leave the build command empty.
3. Under **Environment Variables** add:
   - `ANTHROPIC_API_KEY`: your key from console.anthropic.com (required)
   - `SMITH_PASSCODE`: a class passcode (optional, but it keeps strangers from using your credits)
   - `SMITH_MODEL`: optional, defaults to `claude-haiku-4-5-20251001`
   - `SMITH_SMART_MODEL`: optional, defaults to `claude-sonnet-5-5`
4. Deploy. Open the `https://...vercel.app` link on your phone.

## Change Smith's personality

Edit `smith-personality.txt` on GitHub (the pencil icon) and commit. Vercel redeploys
in about a minute. Reload the page on the phone, and Smith behaves differently.
Fun things to try: make Smith a pirate, a sports announcer, or only talk in rhymes.

## The product lessons (also written as comments in the code)

- **Always listening** (`listen.js`): a web page can only hear you while it is open on screen.
  Only Siri and Google Assistant can listen when the phone is locked, because Apple and Google built them into the phone.
- **Music and volume** (`player.js`): apps are kept in separate "sandboxes", so Smith cannot control Spotify or the phone's main volume. It brings its own player.
- **Calls and texts** (`actions.js`): websites cannot secretly call or text. A person always makes the final tap.
- **Privacy** (`listen.js`): the browser sends speech to Apple or Google to turn it into text. Smith saves nothing.

## Run on a laptop (optional)

```
npm install
ANTHROPIC_API_KEY=sk-ant-... npm run dev
```
Open http://localhost:3000 in Chrome.

## Demo day checklist

**The night before**
- [ ] Charge the phone and headphones.
- [ ] Open the Vercel link, tap **Wake up Smith**, allow the microphone.
- [ ] Settings: pick and test a voice, confirm **Demo mode** is on.
- [ ] Try all four: "Hey Smith, tell me a joke", "play music", "turn it up", "text Mom I'll be late".

**Before class**
- [ ] Pair the headphones. Close Spotify, YouTube, and other audio apps (they can steal the headphone button).
- [ ] Phone volume about 70%, turn off Low Power Mode, turn on Do Not Disturb.
- [ ] iPhone: Settings, Display and Brightness, Auto-Lock: Never (Smith also tries to keep the screen on).
- [ ] Open Smith in Safari or Chrome (not inside another app), tap **Wake up Smith**.
- [ ] Mirror the phone to the projector. Say "Hey Smith, tell me a joke" once to warm it up.

**During the demo**
- [ ] Keep the phone unlocked with Smith on screen the whole time.
- [ ] Noisy room? Press the headphone play/pause button instead of saying "Hey Smith", or turn off the wake word in settings.
- [ ] Speak right after the chime.

**Backup plan, in order**
1. Wake word not working: press the headphone button.
2. Headphone button not working: tap the big **Tap to talk** button on screen.
3. Mic not working at all: Settings, **Type to Smith**.
4. Smith stuck: reload the page and tap **Wake up Smith** again.
5. No internet: switch Wi-Fi off and use cellular data, or the other way around.

# AIstis: Robotikos Akademijos AI asistentas (prototipas v1.3)

Static test page for two ElevenLabs Agents (Lithuanian) that answer common RA parent questions, find RA groups in the public ExoClass catalogue, and show where to click or whom to contact.

- Page: https://krisvas333.github.io/aiste/ (noindex, not linked anywhere). Chat-first: text chat via `@elevenlabs/client` 1.25.0 text-only mode, optional voice (mic button) in the same thread.
- Testing ground: Balsas (Vyras = AIstis, Kris's voice AI copy / Moteris = AIstė, designed voice) × Tonas (Žemesnis · Įprastas · Aukštesnis = different designed voices, never clones of real people). URL: `?g=vyras|moteris&t=zemesnis|iprastas|aukstesnis`.
- Integration mockup: https://krisvas333.github.io/aiste/integracija.html (MAKETAS: RA site launcher → the real chat in an iframe `?embed=1`, handoff → mock RA inbox ticket, registration page helper, flow).
- Only public agent IDs and voice IDs are in this repo. No keys, no personal data.
- Client tools rendered inside the chat: `ieskoti_grupiu` (group cards from `grupes.json`) · `rodyti_nuoroda` (whitelisted robotikosakademija.lt link chips) · `perduoti_zmogui` (RA contact card).

⚗️ Experimental prototype built with AI. It can be wrong. Adults only. Feedback: kristijonas.vasiliauskas@gmail.com

import assert from "node:assert/strict";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

globalThis.localStorage = {};
globalThis.window = { speechSynthesis: { getVoices: () => [] } };
globalThis.SpeechSynthesisUtterance = class {};

const server = await createServer({
  configFile: false,
  resolve: {
    alias: { "~": fileURLToPath(new URL("../src", import.meta.url)) },
  },
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
  appType: "custom",
});
after(() => server.close());
const { tts } = await server.ssrLoadModule("/src/lib/tts.ts");

test("speaks through the Android WebXDC bridge without cancel", () => {
  const spoken = [];
  localStorage.learningLanguage = "de-en";
  window.speechSynthesis = {
    getVoices: () => [],
    speak: (utterance) => spoken.push(utterance),
  };

  tts("Hallo");

  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].text, "Hallo");
  assert.equal(spoken[0].lang, "de");
});

test("cancels previous speech and selects the current language's voice", () => {
  const events = [];
  const german = { lang: "de_DE" };
  const english = { lang: "en-US" };
  window.speechSynthesis = {
    getVoices: () => [german, english],
    cancel: () => events.push("cancel"),
    speak: (utterance) => events.push(utterance),
  };

  localStorage.learningLanguage = "de-en";
  tts("Hallo");
  localStorage.learningLanguage = "en-de";
  tts("Hello");

  assert.equal(events[0], "cancel");
  assert.equal(events[1].voice, german);
  assert.equal(events[1].lang, "de");
  assert.equal(events[2], "cancel");
  assert.equal(events[3].voice, english);
  assert.equal(events[3].lang, "en");
});

test("uses the language fallback until voices become available", () => {
  const spoken = [];
  let voices = [];
  window.speechSynthesis = {
    getVoices: () => voices,
    cancel: () => {},
    speak: (utterance) => spoken.push(utterance),
  };
  localStorage.learningLanguage = "fr-en";

  tts("Bonjour");
  const french = { lang: "fr-FR" };
  voices = [french];
  tts("Salut");

  assert.equal(spoken[0].lang, "fr");
  assert.equal(spoken[0].voice, undefined);
  assert.equal(spoken[1].voice, french);
});

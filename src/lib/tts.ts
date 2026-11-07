import { getLearningLanguage } from "~/lib/storage";

function getVoice(lang: string) {
  try {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((voice) => voice.lang.split("-")[0].split("_")[0] === lang) ||
      null
    );
  } catch (e) {
    console.log(e);
    return null;
  }
}

export function tts(text: string) {
  try {
    const lang = getLearningLanguage().split("-")[0];
    const voice = getVoice(lang);
    const msg = new SpeechSynthesisUtterance();
    msg.text = text;
    msg.lang = lang;
    if (voice) {
      msg.voice = voice;
    }
    window.speechSynthesis.cancel?.();
    window.speechSynthesis.speak(msg);
  } catch (e) {
    console.log(e);
  }
}

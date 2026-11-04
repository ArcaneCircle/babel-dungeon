import { getLearningLanguage } from "~/lib/storage";

let voice = getVoice();

function getVoice() {
  const llang = getLearningLanguage();
  if (!llang) return null;
  const lang = llang.split("-")[0];

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
    if (!voice) voice = getVoice();
    const msg = new SpeechSynthesisUtterance();
    msg.text = text;
    if (voice) {
      msg.voice = voice;
    } else {
      msg.lang = getLearningLanguage().split("-")[0];
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  } catch (e) {
    console.log(e);
  }
}

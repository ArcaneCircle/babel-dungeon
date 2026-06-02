import { LANG1_CODE, LANG2_CODE } from "~/lib/constants";
import { getLearningLanguage } from "~/lib/storage";

let voice = getVoice();

function getVoice() {
  const llang = getLearningLanguage();
  if (!llang) return null;
  const lang = llang === "LANG2" ? LANG2_CODE : LANG1_CODE;

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
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance();
    msg.text = text;
    if (voice) {
      msg.voice = voice;
    } else {
      msg.lang = getLearningLanguage() === "LANG2" ? LANG2_CODE : LANG1_CODE;
    }
    window.speechSynthesis.speak(msg);
  } catch (e) {
    console.log(e);
  }
}

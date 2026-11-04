import es from "./langs/es.json";
import de from "./langs/de.json";
import eu from "./langs/eu.json";
const langs = { es, de, eu };

type LangCode = keyof typeof langs;
type TranslationKey = keyof (typeof langs)[LangCode];
const lang = ((window.navigator && window.navigator.language) || "en")
  .split("-")[0]
  .toLowerCase() as LangCode;

export function _(key: TranslationKey): string {
  return (langs[lang] || {})[key] || key;
}

const ENGLISH_NAMES: Record<string, string> = {
  eo: "Esperanto",
  en: "English",
  es: "Spanish",
  de: "German",
  fr: "French",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  eu: "Basque",
};

export function langName(code: string): string {
  const key = `lang_${code}`;
  const translations = (langs[lang] || {}) as Record<string, string>;
  return translations[key] || ENGLISH_NAMES[code] || code;
}

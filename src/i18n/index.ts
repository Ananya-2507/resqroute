import { LanguageCode, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './languages';
import { en, TranslationKey } from './locales/en';
import { hi } from './locales/hi';
import { as } from './locales/as';
import { bn } from './locales/bn';
import { mni } from './locales/mni';
import { kha } from './locales/kha';
import { lus } from './locales/lus';
import { ne } from './locales/ne';
import { brx } from './locales/brx';
import { trp } from './locales/trp';

export * from './languages';
export type { TranslationKey };

export const TRANSLATIONS: Record<LanguageCode, Partial<Record<TranslationKey, string>>> = {
  en,
  hi,
  as,
  bn,
  mni,
  kha,
  lus,
  ne,
  brx,
  trp
};

/**
 * Translate a key into the given language with fallback to English
 */
export function getTranslation(
  lang: LanguageCode,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const langDict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANGUAGE];
  let text = langDict[key] || en[key] || String(key);

  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    });
  }

  return text;
}

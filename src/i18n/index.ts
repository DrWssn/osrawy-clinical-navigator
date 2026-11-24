import { ar } from './ar';
import { en } from './en';

export type I18nKey = keyof typeof en;
export type Language = 'ar' | 'en';

export const dictionaries = { ar, en };

export function t(key: I18nKey, lang: Language = 'ar'): string {
  const dict = dictionaries[lang] || dictionaries.ar;
  return (dict as Record<string, string>)[key] || (en as Record<string, string>)[key] || key;
}

export { ar, en };

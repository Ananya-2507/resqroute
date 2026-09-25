export type LanguageCode =
  | 'en'
  | 'hi'
  | 'as'
  | 'bn'
  | 'mni'
  | 'kha'
  | 'lus'
  | 'ne'
  | 'brx'
  | 'trp';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  region: string;
  flagEmoji: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    region: 'Official / National',
    flagEmoji: '🌐'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    region: 'National / Official',
    flagEmoji: '🇮🇳'
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    region: 'Assam / Brahmaputra Valley',
    flagEmoji: '🌾'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    region: 'Barak Valley / Tripura',
    flagEmoji: '🌿'
  },
  {
    code: 'mni',
    name: 'Manipuri (Meitei)',
    nativeName: 'মৈতৈলোন্',
    region: 'Manipur / Imphal Valley',
    flagEmoji: '🏔️'
  },
  {
    code: 'kha',
    name: 'Khasi',
    nativeName: 'Ka Ktien Khasi',
    region: 'Meghalaya / Khasi Hills',
    flagEmoji: '🌧️'
  },
  {
    code: 'lus',
    name: 'Mizo',
    nativeName: 'Mizo ṭawng',
    region: 'Mizoram / Lushai Hills',
    flagEmoji: '🌄'
  },
  {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    region: 'Sikkim / NER Hills',
    flagEmoji: '⛰️'
  },
  {
    code: 'brx',
    name: 'Bodo',
    nativeName: 'बर’ / Bodo',
    region: 'Bodoland (BTR) / Assam',
    flagEmoji: '🌳'
  },
  {
    code: 'trp',
    name: 'Kokborok',
    nativeName: 'Kokborok',
    region: 'Tripura State',
    flagEmoji: '🌺'
  }
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

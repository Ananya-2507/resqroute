import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageCode } from '../i18n/languages';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, currentLanguageInfo, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="language-selector-btn"
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-all cursor-pointer shadow-2xs hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        title={t('selectLanguage')}
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="text-sm shrink-0">{currentLanguageInfo.flagEmoji}</span>
        <span className="font-semibold text-slate-900 hidden sm:inline max-w-[90px] truncate">
          {currentLanguageInfo.nativeName}
        </span>
        <span className="font-semibold text-slate-900 sm:hidden">
          {currentLanguageInfo.code.toUpperCase()}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id="language-dropdown-menu"
          className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in"
          role="menu"
        >
          <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span>{t('selectLanguage')}</span>
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">10 NER Languages</span>
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {languages.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  onClick={() => handleSelect(item.code)}
                  className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-emerald-50/70 text-emerald-950 font-bold' : 'text-slate-700'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base shrink-0">{item.flagEmoji}</span>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{item.nativeName}</span>
                        {item.code !== 'en' && (
                          <span className="text-[11px] font-normal text-slate-500">({item.name})</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        {item.region}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

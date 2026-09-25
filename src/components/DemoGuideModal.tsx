import React from 'react';
import { 
  X 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                {t('demoGuideBadge')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
              {t('demoGuideTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Step Demo Flow Cards */}
        <div className="space-y-3.5 mb-8">
          
          {/* Step 1: Requester */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider">
                  {t('step1Title')}
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  {t('requester')}
                </span>
              </div>
              <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                {t('step1Desc')}
              </p>
            </div>
          </div>

          {/* Step 2: Government Official */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-xs text-purple-950 uppercase tracking-wider">
                  {t('step2Title')}
                </div>
                <span className="text-[11px] font-semibold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded-md">
                  {t('official')}
                </span>
              </div>
              <p className="text-xs text-purple-900 mt-1 leading-relaxed">
                {t('step2Desc')}
              </p>
            </div>
          </div>

          {/* Step 3: Resource Provider */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-xs text-blue-950 uppercase tracking-wider">
                  {t('step3Title')}
                </div>
                <span className="text-[11px] font-semibold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  {t('provider')}
                </span>
              </div>
              <p className="text-xs text-blue-900 mt-1 leading-relaxed">
                {t('step3Desc')}
              </p>
            </div>
          </div>

          {/* Step 4: Requester Delivery Confirmation & Public Ledger */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider">
                  {t('step4Title')}
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  {t('confirmReceipt')}
                </span>
              </div>
              <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                {t('step4Desc')}
              </p>
            </div>
          </div>

          {/* Step 5: Operations Navigation & Public Ledger */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              5
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                  {t('step5Title')}
                </div>
                <span className="text-[11px] font-semibold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-md">
                  {t('publicLedger')}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t('step5Desc')}
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            ResQRoute • {t('hackathonFooter')}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800 cursor-pointer"
          >
            {t('gotIt')}
          </button>
        </div>

      </div>
    </div>
  );
};

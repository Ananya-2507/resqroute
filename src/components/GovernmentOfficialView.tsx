import React, { useState, useMemo } from 'react';
import { 
  AlertCircle, 
  ArrowRight, 
  BarChart3, 
  Check, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  Layers, 
  MapPin, 
  Package, 
  PlusCircle, 
  Radio, 
  Send, 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  X, 
  XCircle 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ReliefRequest, ResourceType, UrgencyLevel, Village } from '../types';
import { MapComponent } from './MapComponent';

const RESOURCE_OPTIONS: ResourceType[] = [
  'Drinking Water & Purification Kits',
  'Emergency Medical Supplies & First Aid',
  'Dry Rations & Baby Food',
  'Tarpaulins & Flood Shelter Kits',
  'Search & Rescue Gear / Inflatable Boats',
  'High-Capacity Power Generators & Comms'
];

export const GovernmentOfficialView: React.FC = () => {
  const {
    villages,
    requests,
    depots,
    roadSegments,
    verifyRequest,
    rejectRequest,
    submitReliefRequest,
    role
  } = useApp();

  const { t, translateResourceType, translateUrgency, translateRoadStatus, translateEscalationLevel, translateRequestStatus } = useLanguage();

  // Active view subtab: 'verification_queue' | 'direct_submit' | 'oversight_summary'
  const [activeSubTab, setActiveSubTab] = useState<'verification_queue' | 'direct_submit' | 'oversight_summary'>('verification_queue');

  // Direct Submission Form State
  const [selectedVillageId, setSelectedVillageId] = useState(villages[0]?.id || '');
  const [resourceType, setResourceType] = useState<ResourceType>(RESOURCE_OPTIONS[0]);
  const [quantity, setQuantity] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [officialName, setOfficialName] = useState('P. K. Sharma (Block Development Officer)');
  const [officialDesignation, setOfficialDesignation] = useState('DDMA Sonitpur Emergency Cell');
  const [detailsNote, setDetailsNote] = useState('');
  const [officialSubmittedCode, setOfficialSubmittedCode] = useState<string | null>(null);

  // Filter requests waiting for verification
  const pendingRequests = useMemo(() => {
    return requests.filter(r => r.status === 'SUBMITTED');
  }, [requests]);

  const verifiedAndActiveRequests = useMemo(() => {
    return requests.filter(r => r.status === 'VERIFIED' || r.status === 'IN_TRANSIT');
  }, [requests]);

  const deliveredRequests = useMemo(() => {
    return requests.filter(r => r.status === 'DELIVERED');
  }, [requests]);

  // District Health Summary Metrics
  const districtMetrics = useMemo(() => {
    const totalVillages = villages.length;
    const openVillages = villages.filter(v => v.riskZone === 'OPEN').length;
    const riskyVillages = villages.filter(v => v.riskZone === 'RISKY').length;
    const blockedVillages = villages.filter(v => v.riskZone === 'BLOCKED' || v.riskZone === 'IMPASSABLE').length;
    const isolatedCount = villages.filter(v => v.isAutoDetectedIsolated).length;

    return {
      totalVillages,
      openVillages,
      riskyVillages,
      blockedVillages,
      isolatedCount,
      pendingCount: pendingRequests.length,
      activeDispatchesCount: verifiedAndActiveRequests.length,
      deliveredCount: deliveredRequests.length
    };
  }, [villages, pendingRequests, verifiedAndActiveRequests, deliveredRequests]);

  const handleOfficialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVillageId || !quantity || !officialName) {
      alert('Please fill in required fields.');
      return;
    }

    const newReq = submitReliefRequest({
      villageId: selectedVillageId,
      resourceType,
      quantity,
      urgency,
      contactName: `${officialName} (${officialDesignation})`,
      contactPhone: '+91 94350-OFFICIAL',
      detailsNote: detailsNote || 'Officially endorsed and verified by Block Development / DDMA authority.',
      isOfficialSubmission: true // Auto-verified!
    });

    setOfficialSubmittedCode(newReq.trackingCode);
    setActiveSubTab('verification_queue');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                {t('officialTitle')}
              </span>
              <span className="text-xs text-slate-500 font-medium">{t('officialSub')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
              {t('oversightSummary')}
            </h1>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('verification_queue')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'verification_queue'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              <FileCheck className={`w-3.5 h-3.5 ${activeSubTab === 'verification_queue' ? 'text-white' : 'text-purple-700'}`} />
              <span>{t('verificationQueue')} ({pendingRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('direct_submit')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'direct_submit'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              <PlusCircle className={`w-3.5 h-3.5 ${activeSubTab === 'direct_submit' ? 'text-white' : 'text-purple-700'}`} />
              <span>{t('directRequisition')}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('oversight_summary')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'oversight_summary'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${activeSubTab === 'oversight_summary' ? 'text-white' : 'text-purple-700'}`} />
              <span>{t('oversightSummary')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification for Direct Requisition */}
      {officialSubmittedCode && (
        <div className="mb-6 bg-purple-50 border-2 border-purple-500/40 rounded-2xl p-4 text-purple-900 flex items-start gap-3.5 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-extrabold text-sm text-purple-950">
              {t('officialPreverifiedTitle')}
            </div>
            <p className="text-xs text-purple-800 mt-0.5">
              {t('officialPreverifiedDesc', { code: officialSubmittedCode })}
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 1: VERIFICATION QUEUE */}
      {activeSubTab === 'verification_queue' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-700" />
                  <span>{t('awaitingOfficialVerification')}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('awaitingOfficialDesc')}
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-50 text-purple-800 font-bold text-xs rounded-full border border-purple-200">
                {t('pendingActionsCount', { count: pendingRequests.length })}
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-purple-500 mx-auto mb-2 opacity-90" />
                <h3 className="text-sm font-bold text-slate-700">{t('verificationQueueClear')}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {t('verificationQueueClearDesc')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/90 hover:bg-white hover:border-slate-300 transition-all shadow-xs"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left Requisition Info */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                            {req.trackingCode}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            req.urgency === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {translateUrgency(req.urgency)}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {t('submittedAtLabel')} {req.submissionTime}
                          </span>
                        </div>

                        <div className="text-base font-extrabold text-slate-900">
                          {req.villageName} ({req.district}, {req.state})
                        </div>

                        <div className="text-xs text-slate-700 font-semibold flex items-center gap-2">
                          <Package className="w-4 h-4 text-purple-700 inline shrink-0" />
                          <span><strong>{t('requestedLabel')}:</strong> {translateResourceType(req.resourceType)} — <span className="text-slate-900">{req.quantity}</span></span>
                        </div>

                        <div className="text-xs text-slate-500">
                          <strong>{t('contactPersonLabel')}:</strong> {req.submittedBy} ({req.contactPhone})
                        </div>

                        {req.detailsNote && (
                          <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200/60 text-slate-600 mt-2">
                            "{req.detailsNote}"
                          </div>
                        )}
                      </div>

                      {/* Right Action Buttons: Verify / Reject */}
                      <div className="flex sm:flex-col items-center gap-2 shrink-0 justify-end">
                        <button
                          onClick={() => verifyRequest(req.id, 'DDMA Regional Verification Cell')}
                          className="w-full sm:w-40 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs hover:shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>{t('verifyAndForward')}</span>
                        </button>

                        <button
                          onClick={() => {
                            const reason = prompt(t('rejectReasonPrompt'), 'Duplicate requisition / already served');
                            if (reason) rejectRequest(req.id, reason);
                          }}
                          className="w-full sm:w-40 py-2 px-4 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{t('rejectRequest')}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: DIRECT OFFICIAL REQUISITION (Pre-marked as Verified) */}
      {activeSubTab === 'direct_submit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                {t('officialAuthorityEndorsement')}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-purple-600" />
              <span>{t('directOfficialReliefRequisition')}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('officialBypassVerificationDesc')}
            </p>
          </div>

          <form onSubmit={handleOfficialSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Village */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('targetVillageZoneLabel')} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedVillageId}
                  onChange={(e) => setSelectedVillageId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {villages.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.district}) - {v.riskZone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resource */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('emergencySupplyAllocation')} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as ResourceType)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {RESOURCE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{translateResourceType(opt)}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('quantityTonnageLabel')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={t('quantityTonnagePlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('priorityDirectiveLabel')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MEDIUM', 'HIGH', 'CRITICAL'] as UrgencyLevel[]).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setUrgency(lvl)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        urgency === lvl
                          ? lvl === 'CRITICAL'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : lvl === 'HIGH'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {translateUrgency(lvl)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Official Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('authorizingOfficialName')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={officialName}
                  onChange={(e) => setOfficialName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('designationDeptLabel')}
                </label>
                <input
                  type="text"
                  value={officialDesignation}
                  onChange={(e) => setOfficialDesignation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('executiveDirectiveLabel')}
              </label>
              <textarea
                rows={3}
                value={detailsNote}
                onChange={(e) => setDetailsNote(e.target.value)}
                placeholder={t('executiveDirectivePlaceholder')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{t('issuePreverifiedRequisitionBtn')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: OVERSIGHT SUMMARY & SIMPLIFIED MAP */}
      {activeSubTab === 'oversight_summary' && (
        <div className="space-y-6">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Total Monitored Villages */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('monitoredVillagesMetric')}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {districtMetrics.totalVillages}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {t('sectorAssamMeghalaya')}
              </div>
            </div>

            {/* In High-Risk / Blocked Zones */}
            <div className="bg-rose-50/70 p-4.5 rounded-2xl border border-rose-200 shadow-xs">
              <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">{t('cutoffBlockedMetric')}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-950 mt-1">
                {districtMetrics.blockedVillages}
              </div>
              <div className="text-[11px] text-rose-700 mt-1 font-semibold">
                {t('autoIsolatedSettlementsCount', { count: districtMetrics.isolatedCount })}
              </div>
            </div>

            {/* Active Operations */}
            <div className="bg-indigo-50/70 p-4.5 rounded-2xl border border-indigo-200 shadow-xs">
              <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{t('activeConvoysMetric')}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-950 mt-1">
                {districtMetrics.activeDispatchesCount}
              </div>
              <div className="text-[11px] text-indigo-700 mt-1">
                {t('inTransitAndVerified')}
              </div>
            </div>

            {/* Delivered Missions */}
            <div className="bg-purple-50/70 p-4.5 rounded-2xl border border-purple-200 shadow-xs">
              <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">{t('deliveredMissionsMetric')}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-950 mt-1">
                {districtMetrics.deliveredCount}
              </div>
              <div className="text-[11px] text-purple-700 mt-1">
                {t('publishedToPublicLedger')}
              </div>
            </div>

          </div>

          {/* Simplified District Status Map */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  <span>{t('districtRiskOverviewTitle')}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('districtRiskOverviewDesc')}
                </p>
              </div>
            </div>

            <MapComponent
              depots={depots}
              villages={villages}
              roadSegments={roadSegments}
              activeRoute={null}
              simplifiedView={true}
              role={role}
              requests={requests}
              heightClass="h-[440px]"
            />
          </div>

          {/* Active Relief Missions & Resource Fulfillment Oversight Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span>{t('crossAgencyLedgerTitle')}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('crossAgencyLedgerDesc')}
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-purple-50 text-purple-800 rounded-lg border border-purple-200">
                {t('totalMissionsLoggedCount', { count: requests.length })}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3">{t('colTrackingDestination')}</th>
                    <th className="px-5 py-3">{t('colResourceRequested')}</th>
                    <th className="px-5 py-3">{t('colAllocatedFromDepot')}</th>
                    <th className="px-5 py-3">{t('shortage')}</th>
                    <th className="px-5 py-3">{t('colFulfillmentStatus')}</th>
                    <th className="px-5 py-3">{t('sourceDepot')}</th>
                    <th className="px-5 py-3">{t('colMissionState')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {requests.map(req => {
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-bold text-slate-900">{req.villageName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{req.trackingCode}</div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-900">{translateResourceType(req.resourceType)}</div>
                          <div className="text-[11px] text-slate-500">
                            {t('requestedLabel')}: <strong>{req.requestedUnits || req.quantity} {req.unitLabel || t('units')}</strong>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {req.allocatedUnits !== undefined && req.allocatedUnits > 0 ? (
                            <span className="font-mono font-bold text-purple-700">
                              {req.allocatedUnits} {req.unitLabel || t('units')}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {req.shortageUnits !== undefined && req.shortageUnits > 0 ? (
                            <span className="font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              -{req.shortageUnits} {req.unitLabel || t('units')}
                            </span>
                          ) : (
                            <span className="text-purple-700 font-bold text-[11px]">{t('noneLabel')}</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {req.fulfillmentStatus === 'PARTIAL' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                              ⚠️ {t('partialFulfillment')} ({req.allocatedUnits}/{req.requestedUnits})
                            </span>
                          ) : req.fulfillmentStatus === 'FULL' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                              ✅ {t('fullFulfillment')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {t('awaitingDispatch')}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-600 text-[11px]">
                          {req.assignedDepotName ? req.assignedDepotName.split('(')[0] : t('unassignedLabel')}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'DELIVERED'
                              ? 'bg-purple-100 text-purple-800'
                              : req.status === 'IN_TRANSIT'
                              ? 'bg-indigo-100 text-indigo-800'
                              : req.status === 'VERIFIED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {translateRequestStatus(req.status)}
                          </span>
                          {req.status === 'DELIVERED' && req.confirmedBy && (
                            <div className="text-[10px] text-slate-500 mt-1">
                              {t('confirmedBy')}: {req.confirmedBy}
                            </div>
                          )}
                          {req.status === 'IN_TRANSIT' && (
                            <div className="text-[10px] text-indigo-600 mt-0.5">
                              {t('enRouteLabel')}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Send, 
  ShieldCheck, 
  Truck, 
  AlertCircle, 
  AlertTriangle,
  Phone, 
  MapPin, 
  Package, 
  PlusCircle, 
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  History,
  Check,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ReliefRequest, RequestStatus, ResourceType, UrgencyLevel } from '../types';

const RESOURCE_OPTIONS: ResourceType[] = [
  'Drinking Water & Purification Kits',
  'Emergency Medical Supplies & First Aid',
  'Dry Rations & Baby Food',
  'Tarpaulins & Flood Shelter Kits',
  'Search & Rescue Gear / Inflatable Boats',
  'High-Capacity Power Generators & Comms'
];

export const RequesterView: React.FC = () => {
  const {
    villages,
    userRequests,
    userLedger,
    submitReliefRequest,
    markDelivered,
    selectedRequestId,
    setSelectedRequestId,
    currentUser
  } = useApp();

  const { 
    t, 
    translateResourceType, 
    translateRoadStatus, 
    translateUrgency, 
    translateRequestStatus, 
    translateEscalationLevel,
    translateVillageName,
    translateDistrict,
    translateState,
    translateDepotName,
    translateUnit,
    formatNumber,
    translateTime
  } = useLanguage();

  // Form State
  const [selectedVillageId, setSelectedVillageId] = useState(() => {
    if (currentUser?.role === 'requester' && currentUser.villageId) {
      return currentUser.villageId;
    }
    return villages[0]?.id || '';
  });
  const [resourceType, setResourceType] = useState<ResourceType>(RESOURCE_OPTIONS[0]);
  const [quantity, setQuantity] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('HIGH');
  const [contactName, setContactName] = useState(() => {
    if (currentUser?.role === 'requester' && currentUser.name) {
      return currentUser.name;
    }
    return '';
  });
  const [contactPhone, setContactPhone] = useState(() => {
    if (currentUser?.role === 'requester' && currentUser.phone) {
      return currentUser.phone;
    }
    return '';
  });
  const [detailsNote, setDetailsNote] = useState('');
  const [viewMode, setViewMode] = useState<'form' | 'tracking'>('tracking');
  const [submittedSuccessCode, setSubmittedSuccessCode] = useState<string | null>(null);
  const [isPastDeliveriesOpen, setIsPastDeliveriesOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'requester' && currentUser.villageId) {
      setSelectedVillageId(currentUser.villageId);
      if (currentUser.name) setContactName(currentUser.name);
      if (currentUser.phone) setContactPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Delivery Confirmation Modal & Feedback State
  const [confirmingRequest, setConfirmingRequest] = useState<ReliefRequest | null>(null);
  const [confirmationNotesInput, setConfirmationNotesInput] = useState('');
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [confirmationSuccessToast, setConfirmationSuccessToast] = useState<{
    trackingCode: string;
    villageName: string;
    resourceType: string;
    confirmedBy: string;
    deliveredTime: string;
  } | null>(null);

  // Active requests (any stage before Delivered) vs completed Past Deliveries - strictly for this village
  const activeRequests = useMemo(() => {
    return userRequests.filter(r => r.status !== 'REJECTED' && r.status !== 'DELIVERED');
  }, [userRequests]);

  const pastDeliveries = useMemo(() => {
    return userRequests.filter(r => r.status === 'DELIVERED');
  }, [userRequests]);

  // All in-transit consignments addressed to this registered village
  const inTransitRequests = useMemo(() => {
    return userRequests.filter(r => r.status === 'IN_TRANSIT');
  }, [userRequests]);

  // Authorization check: does this request belong to the logged-in requester's registered village?
  const isRequestOwnedByCurrentUser = (req: ReliefRequest): boolean => {
    if (!currentUser) return false;
    // Check village ID match
    if (currentUser.villageId && req.villageId === currentUser.villageId) return true;
    return false;
  };

  const handleOpenConfirmDialog = (req: ReliefRequest) => {
    setConfirmingRequest(req);
    setConfirmationNotesInput('');
    setConfirmationError(null);
  };

  const handleConfirmReceipt = () => {
    if (!confirmingRequest) return;
    setConfirmationError(null);

    const recipientName = currentUser?.name || confirmingRequest.submittedBy || t('villageGaonburha');
    const result = markDelivered(
      confirmingRequest.id,
      recipientName,
      confirmationNotesInput.trim() || undefined,
      currentUser?.villageId
    );

    if (result.success) {
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setConfirmationSuccessToast({
        trackingCode: confirmingRequest.trackingCode,
        villageName: confirmingRequest.villageName,
        resourceType: confirmingRequest.resourceType,
        confirmedBy: recipientName,
        deliveredTime: nowStr
      });
      setSelectedRequestId(confirmingRequest.id);
      setIsPastDeliveriesOpen(true);
      setConfirmingRequest(null);
    } else {
      setConfirmationError(result.error || 'Failed to confirm delivery.');
    }
  };

  // Currently focused request in tracker
  const activeTrackedRequest = 
    userRequests.find(r => r.id === selectedRequestId && r.status !== 'REJECTED') ||
    activeRequests[0] ||
    pastDeliveries[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVillageId || !quantity || !contactName) {
      alert('Please fill in village, resource quantity, and contact person.');
      return;
    }

    const newReq = submitReliefRequest({
      villageId: selectedVillageId,
      resourceType,
      quantity,
      urgency,
      contactName,
      contactPhone: contactPhone || '+91 98540-00000',
      detailsNote,
      isOfficialSubmission: false
    });

    setSubmittedSuccessCode(newReq.trackingCode);
    setSelectedRequestId(newReq.id);
    setViewMode('tracking');
  };

  // Helper for progress status steps
  const STATUS_STEPS = useMemo(() => [
    { key: 'SUBMITTED' as RequestStatus, label: t('stepReceived'), sub: t('statusSubmitted') },
    { key: 'VERIFIED' as RequestStatus, label: t('stepVerified'), sub: t('statusVerified') },
    { key: 'MATCHED' as RequestStatus, label: t('stepMatched'), sub: t('statusMatched') },
    { key: 'IN_TRANSIT' as RequestStatus, label: t('stepInTransit'), sub: t('statusInTransit') },
    { key: 'DELIVERED' as RequestStatus, label: t('stepDelivered'), sub: t('statusDelivered') }
  ], [t]);

  const getStepProgressIndex = (status: RequestStatus): number => {
    switch (status) {
      case 'SUBMITTED': return 0;
      case 'VERIFIED': return 1;
      case 'MATCHED': return 2;
      case 'IN_TRANSIT': return 3;
      case 'DELIVERED': return 4;
      case 'REJECTED': return -1;
      default: return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                {t('requesterTitle')}
              </span>
              <span className="text-xs text-slate-500 font-medium">{t('villager')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              {t('submitRequisition')}
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">
              {t('requesterDesc')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setViewMode('tracking'); setSubmittedSuccessCode(null); }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewMode === 'tracking'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              {t('trackingConsignment')} ({formatNumber(activeRequests.length)})
            </button>
            <button
              onClick={() => { setViewMode('form'); setSubmittedSuccessCode(null); }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'form'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('submit')}</span>
            </button>
          </div>
        </div>

        {/* Prominent Village Representative Identity Card */}
        {currentUser?.villageName && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
                <MapPin className="w-4 h-4" />
              </span>
              <div>
                <span className="text-slate-500 font-medium">{t('authorizedCommunitySettlement')}</span>{' '}
                <strong className="text-slate-900 text-sm">{translateVillageName(currentUser.villageName)}</strong>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-600 flex-wrap">
              <span>{t('representativeLabel')}: <strong>{currentUser.name}</strong></span>
              <span>•</span>
              <span>{t('userIdLabel')}: <strong className="font-mono text-slate-800">{currentUser.userId || 'usr-vil'}</strong></span>
              <span>•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                🔒 {t('registeredLocationScoped')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Success Notification Alert */}
      {submittedSuccessCode && (
        <div className="mb-6 bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-5 text-emerald-900 flex items-start gap-3.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-extrabold text-base text-emerald-950">
              {t('requestSubmittedSuccess')}
            </div>
            <p className="text-sm text-emerald-800 mt-0.5">
              {t('trackingRefPlacedInQueue', { code: submittedSuccessCode })}
            </p>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: FORM TO SUBMIT REQUEST */}
      {viewMode === 'form' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>{t('submitRequisition')}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('requesterDesc')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Village Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('villageLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    readOnly
                    value={`${translateVillageName(currentUser?.villageName || villages.find(v => v.id === selectedVillageId)?.name || '') || t('registeredSettlement')}`}
                    className="w-full pl-9 pr-3 py-2.5 bg-emerald-50/70 border border-emerald-300 rounded-xl text-sm font-bold text-emerald-950 focus:outline-none cursor-default"
                  />
                </div>
                <p className="mt-1 text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                  <span>🔒 {translateVillageName(currentUser?.villageName) || t('registeredSettlement')}</span>
                </p>
              </div>

              {/* Resource Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('resourceNeeded')} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as ResourceType)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  {RESOURCE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{translateResourceType(opt)}</option>
                  ))}
                </select>
              </div>

              {/* Quantity / Scale */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('quantityRequested')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={t('quantityPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Urgency Level */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('urgencyLevel')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MEDIUM', 'HIGH', 'CRITICAL'] as UrgencyLevel[]).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setUrgency(lvl)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        urgency === lvl
                          ? lvl === 'CRITICAL'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : lvl === 'HIGH'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {translateUrgency(lvl)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Person Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('fullNameLabel')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {t('phoneLabel')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder={t('phonePlaceholder')}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Situation Details */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('situationNotes')}
              </label>
              <textarea
                rows={3}
                value={detailsNote}
                onChange={(e) => setDetailsNote(e.target.value)}
                placeholder={t('notesPlaceholder')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode('tracking')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{t('submitRequestBtn')}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VIEW MODE 2: SIMPLE CLEAN TRACKER ONLY */
        <div className="space-y-6">
          
          {/* Real-time Receipt Confirmation Success Feedback */}
          {confirmationSuccessToast && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-sm tracking-tight">
                    {t('handoverConfirmedSignedOff')}
                  </div>
                  <div className="text-xs text-emerald-900 mt-0.5">
                    {t('consignmentOfficiallyDeliveredDesc', {
                      code: confirmationSuccessToast.trackingCode,
                      resource: translateResourceType(confirmationSuccessToast.resourceType as ResourceType),
                      village: translateVillageName(confirmationSuccessToast.villageName),
                      name: confirmationSuccessToast.confirmedBy,
                      time: translateTime(confirmationSuccessToast.deliveredTime) || ''
                    })}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setConfirmationSuccessToast(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-0.5 rounded-lg hover:bg-emerald-100"
              >
                ✕
              </button>
            </div>
          )}

          {/* SECTION 2: RECEIVER-SIDE DELIVERY CONFIRMATION FOR IN-TRANSIT CONVOYS */}
          <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/90 rounded-2xl border-2 border-emerald-200 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-200/80 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-emerald-600 text-white">
                    <Truck className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-extrabold text-emerald-950 tracking-tight">
                    {t('incomingReliefConsignments')}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${inTransitRequests.length > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {t('countInTransitLabel', { count: formatNumber(inTransitRequests.length) })}
                  </span>
                </div>
                <p className="text-xs text-emerald-900/80 mt-1">
                  {t('incomingConsignmentsDesc', { village: translateVillageName(currentUser?.villageName) || t('registeredVillageLabel') })}
                </p>
              </div>
              {currentUser?.villageName && (
                <div className="text-xs font-semibold text-emerald-900 bg-white/90 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto flex items-center gap-1.5 shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('yourVillageLabel')}: <strong>{translateVillageName(currentUser.villageName)}</strong></span>
                </div>
              )}
            </div>

            {inTransitRequests.length > 0 ? (
              <div className="space-y-3">
                {inTransitRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-300/50 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                            {req.trackingCode}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                            <Truck className="w-3 h-3 text-emerald-600" />
                            <span>{t('inTransitBadge')}</span>
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {t('dispatchedAtLabel')} <strong>{translateTime(req.dispatchedTime) || t('today')}</strong>
                          </span>
                        </div>

                        <div className="text-sm font-extrabold text-slate-900">
                          {t('destinationLabel')}: <span className="text-emerald-950">{translateVillageName(req.villageName)}</span>
                          <span className="text-xs font-normal text-slate-500 ml-1.5">({translateDistrict(req.district)}, {translateState(req.state)})</span>
                        </div>

                        <div className="text-xs text-slate-700 flex items-center gap-2 flex-wrap">
                          <span><strong>{t('resourceLabel')}:</strong> {translateResourceType(req.resourceType)}</span>
                          <span>•</span>
                          <span><strong>{t('dispatchedQuantityLabel')}:</strong> <span className="font-bold text-emerald-800">{formatNumber(req.allocatedUnits ?? req.requestedUnits)} {translateUnit(req.unitLabel || 'units')}</span></span>
                          {req.fulfillmentStatus === 'PARTIAL' && (
                            <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[10px] font-bold">
                              ⚠️ {t('partialShortageLabel', { shortage: formatNumber(req.shortageUnits || 0) })}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
                          <span><strong>{t('stagingBaseLabel')}:</strong> {translateDepotName(req.assignedDepotName) || t('centralHub')}</span>
                          {req.assignedVehicle && (
                            <span>• <strong>{t('convoyLabel')}:</strong> {req.assignedVehicle}</span>
                          )}
                          <span>• <strong>{t('submittedByLabel')}:</strong> {req.submittedBy}</span>
                        </div>
                      </div>

                      {/* Confirmation Action Button */}
                      <div className="shrink-0 flex items-center lg:self-center">
                        <button
                          id={`confirm-receipt-btn-${req.id}`}
                          onClick={() => handleOpenConfirmDialog(req)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs sm:text-sm font-extrabold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                          title={t('confirmReceipt')}
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>{t('confirmReceipt')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/80 rounded-xl border border-emerald-200/70 p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-2">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {t('noActiveRequests')}
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  {t('noConvoysInTransitDesc', { village: translateVillageName(currentUser?.villageName) || t('registeredVillageLabel') })}
                </p>
              </div>
            )}
          </div>

          {/* Request Selector Tabs ONLY if genuine multiple active requests exist (> 1) */}
          {activeRequests.length > 1 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {t('activeRequestsCountLabel', { count: formatNumber(activeRequests.length) })}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {activeRequests.map(req => {
                  const isSelected = activeTrackedRequest?.id === req.id;
                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedRequestId(req.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono">{req.trackingCode}</span>
                      <span className="opacity-80">• {translateVillageName(req.villageName)}</span>
                      {req.autoDetected && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {t('autoDetectedBadge')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTrackedRequest ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              
              {/* Top Details Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {activeTrackedRequest.trackingCode}
                    </span>
                    {activeTrackedRequest.autoDetected && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        {t('autoDetectedIsolationLabel')}
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-500">
                      {t('submittedOnTime', { time: activeTrackedRequest.submissionTime })}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                    {activeTrackedRequest.villageName}
                  </h2>
                  <div className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600 inline" />
                    <strong>{t('resourceLabel')}:</strong> {translateResourceType(activeTrackedRequest.resourceType)}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400">{t('currentStatusLabel')}</div>
                  <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
                    {activeTrackedRequest.status === 'DELIVERED' 
                      ? t('statusDeliveredToVillage') 
                      : activeTrackedRequest.status === 'IN_TRANSIT' 
                      ? t('statusConvoyInTransit') 
                      : activeTrackedRequest.status === 'MATCHED'
                      ? t('statusDepotMatched')
                      : activeTrackedRequest.status === 'VERIFIED'
                      ? t('statusGovernmentVerified')
                      : t('statusPendingVerification')}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {t('requestedUnitsLabel')}: <strong>{activeTrackedRequest.requestedUnits || activeTrackedRequest.quantity} {activeTrackedRequest.unitLabel || 'Units'}</strong>
                  </div>
                  {activeTrackedRequest.allocatedUnits !== undefined && activeTrackedRequest.allocatedUnits > 0 && (
                    <div className="text-xs font-bold text-emerald-800 mt-0.5">
                      {t('allocatedStockLabel')}: {activeTrackedRequest.allocatedUnits} {activeTrackedRequest.unitLabel || 'Units'}
                    </div>
                  )}
                  {activeTrackedRequest.shortageUnits !== undefined && activeTrackedRequest.shortageUnits > 0 && (
                    <div className="text-xs font-bold text-amber-700 mt-0.5">
                      ⚠️ {t('shortageUnitsLabel')}: {activeTrackedRequest.shortageUnits} {activeTrackedRequest.unitLabel || 'Units'}
                    </div>
                  )}
                </div>
              </div>

              {/* Reference-Styled Status Stepper (5 Steps) */}
              <div className="py-8 sm:py-10">
                <div className="overflow-x-auto pb-2 sm:pb-0">
                  <div className="min-w-[540px] sm:min-w-0">
                    <div className="grid grid-cols-5 relative">
                      {STATUS_STEPS.map((step, idx) => {
                        const currentProgress = getStepProgressIndex(activeTrackedRequest.status);
                        const isDelivered = activeTrackedRequest.status === 'DELIVERED';

                        // Underlying status determinations
                        const isCompleted = isDelivered ? true : idx < currentProgress;
                        const isCurrent = !isDelivered && idx === currentProgress;

                        // Line segment to the next step (for idx < 4)
                        // Solid green line between two completed steps
                        // Dashed lighter green/gray line leading to current or upcoming steps
                        const isNextCompleted = isDelivered ? true : idx + 1 < currentProgress;
                        const isLineSolid = isCompleted && isNextCompleted;

                        // Concise step note (timestamp or status note) without repeating title verbatim
                        const stepNote = (() => {
                          if (idx > currentProgress && !isDelivered) return null;
                          if (idx === 0) {
                            return activeTrackedRequest.submissionTime
                              ? activeTrackedRequest.submissionTime.split(',')[1]?.trim() || activeTrackedRequest.submissionTime
                              : t('stepNoteLogged');
                          }
                          if (idx === 1) {
                            if (activeTrackedRequest.verifiedTime) {
                              return activeTrackedRequest.verifiedTime.split(',')[1]?.trim() || activeTrackedRequest.verifiedTime;
                            }
                            return isCurrent ? t('stepNoteUnderReview') : t('stepNoteVerified');
                          }
                          if (idx === 2) {
                            if (activeTrackedRequest.assignedDepotName) {
                              return t('stepNoteReserved');
                            }
                            return isCurrent ? t('stepNoteAllocating') : t('stepNoteReserved');
                          }
                          if (idx === 3) {
                            if (activeTrackedRequest.dispatchedTime) {
                              return activeTrackedRequest.dispatchedTime.split(',')[1]?.trim() || activeTrackedRequest.dispatchedTime;
                            }
                            return isCurrent ? t('stepNoteInTransit') : t('stepNoteDispatched');
                          }
                          if (idx === 4) {
                            if (activeTrackedRequest.deliveredTime) {
                              return activeTrackedRequest.deliveredTime.split(',')[1]?.trim() || activeTrackedRequest.deliveredTime;
                            }
                            return isCurrent ? t('stepNotePendingHandover') : t('stepNoteConfirmed');
                          }
                          return null;
                        })();

                        return (
                          <div key={step.key} className="relative flex flex-col items-center">
                            
                            {/* Connecting Line Segment between this step and the next */}
                            {idx < STATUS_STEPS.length - 1 && (
                              <div className="absolute top-5 left-1/2 w-full -translate-y-1/2 z-0 pointer-events-none">
                                {isLineSolid ? (
                                  // The line segment BETWEEN two completed steps: solid green line, same green as the circles
                                  <div className="h-[2.5px] bg-emerald-600 w-full" />
                                ) : (
                                  // The line segment AFTER the last completed step, leading to the next step: dashed line in lighter green/gray
                                  <div className="h-0 border-t-2 border-dashed border-emerald-300 w-full" />
                                )}
                              </div>
                            )}

                            {/* Circular Step Marker */}
                            <div className="relative z-10 flex items-center justify-center">
                              {isCompleted ? (
                                // COMPLETED step: a solid filled green circle with a white checkmark icon inside, no border
                                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                                  <Check className="w-5 h-5 text-white stroke-[2.5]" />
                                </div>
                              ) : isCurrent ? (
                                // CURRENT active step: outlined circle filled with a lighter green and a subtle pulse/glow
                                <div className="w-10 h-10 rounded-full border-2 border-emerald-600 bg-emerald-100/80 flex items-center justify-center shadow-md shadow-emerald-600/20 ring-4 ring-emerald-400/30">
                                  <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                                  </span>
                                </div>
                              ) : (
                                // UPCOMING step: circle with a light gray/green outline only, no fill, no icon inside (empty)
                                <div className="w-10 h-10 rounded-full border-2 border-slate-300 bg-white" />
                              )}
                            </div>

                            {/* Step label: below each circle, in a clean bold sans-serif, same style for every step regardless of state */}
                            <div className="mt-3 text-center px-1 max-w-[125px]">
                              <div className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                                {step.label}
                              </div>
                              {stepNote && (
                                <div className="text-[11px] text-slate-500 font-medium mt-1">
                                  {stepNote}
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update Details Box */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 text-sm">
                <div className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>{t('latestDispatchUpdateTitle')}</span>
                </div>
                
                {activeTrackedRequest.status === 'DELIVERED' ? (
                  <div className="text-slate-700 space-y-1">
                    <p>
                      ✅ {t('deliveredSuccessDesc', {
                        village: activeTrackedRequest.villageName,
                        time: activeTrackedRequest.deliveredTime || 'Today'
                      })}
                    </p>
                    {activeTrackedRequest.fulfillmentStatus === 'PARTIAL' ? (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-xs mt-2">
                        ⚠️ <strong>{t('partialFulfillmentDeliveryNote', {
                          allocated: activeTrackedRequest.allocatedUnits ?? 0,
                          unit: activeTrackedRequest.unitLabel || 'units',
                          shortage: activeTrackedRequest.shortageUnits ?? 0
                        })}</strong>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold text-xs mt-2">
                        ✅ <strong>{t('fullFulfillmentDeliveryNote', {
                          allocated: activeTrackedRequest.allocatedUnits ?? 0,
                          unit: activeTrackedRequest.unitLabel || 'units'
                        })}</strong>
                      </div>
                    )}
                    {activeTrackedRequest.confirmedBy && (
                      <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs mt-2 space-y-0.5">
                        <div className="font-bold flex items-center gap-1.5 text-slate-900">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t('receiverSignoffVerified', { name: activeTrackedRequest.confirmedBy })}</span>
                        </div>
                        {activeTrackedRequest.confirmationNotes && (
                          <div className="text-[11px] text-slate-600 italic">
                            "{activeTrackedRequest.confirmationNotes}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : activeTrackedRequest.status === 'IN_TRANSIT' ? (
                  <div className="text-slate-700 space-y-2">
                    <p>
                      🚚 {t('convoyDepartedDesc', {
                        depot: activeTrackedRequest.assignedDepotName || t('centralHub'),
                        vehicle: activeTrackedRequest.assignedVehicle || t('convoyUnit'),
                        time: activeTrackedRequest.dispatchedTime || t('today')
                      })}
                    </p>
                    {activeTrackedRequest.fulfillmentStatus === 'PARTIAL' ? (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-xs">
                        ⚠️ <strong>{t('partialStockAllocationDesc', {
                          allocated: activeTrackedRequest.allocatedUnits ?? 0,
                          unit: activeTrackedRequest.unitLabel || t('units'),
                          shortage: activeTrackedRequest.shortageUnits ?? 0
                        })}</strong>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold text-xs">
                        ✅ <strong>{t('fullAllocationDesc', {
                          allocated: activeTrackedRequest.allocatedUnits ?? 0,
                          unit: activeTrackedRequest.unitLabel || t('units')
                        })}</strong>
                      </div>
                    )}

                    {/* Direct In-Transit Handover Confirmation Prompt */}
                    <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t('haveSuppliesArrivedQuestion', { village: activeTrackedRequest.villageName })}</span>
                        </div>
                        <p className="text-[11px] text-emerald-800/80">
                          {t('confirmHandoverPrompt')}
                        </p>
                      </div>

                      {isRequestOwnedByCurrentUser(activeTrackedRequest) ? (
                        <button
                          onClick={() => handleOpenConfirmDialog(activeTrackedRequest)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('confirmReceipt')}</span>
                        </button>
                      ) : (
                        <div className="text-[11px] text-slate-500 font-semibold bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
                          🔒 {t('belongsToVillageLabel', { village: activeTrackedRequest.villageName.split('(')[0].trim() })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : activeTrackedRequest.status === 'VERIFIED' ? (
                  <p className="text-slate-700">
                    🛡️ {t('verifiedByDesc', {
                      verifier: activeTrackedRequest.verifiedBy || t('disasterManagementAuthority'),
                      time: activeTrackedRequest.verifiedTime || t('today')
                    })}
                  </p>
                ) : (
                  <p className="text-slate-700">
                    📋 {t('requestReceivedDesc', { time: activeTrackedRequest.submissionTime })}
                  </p>
                )}

                {activeTrackedRequest.detailsNote && (
                  <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
                    <strong>{t('yourNotesLabel')}</strong> {activeTrackedRequest.detailsNote}
                  </div>
                )}
              </div>

              {/* Delivery Audit Timeline */}
              {activeTrackedRequest.deliveryTimeline && activeTrackedRequest.deliveryTimeline.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('deliveryAuditTimelineTitle')}</span>
                  </div>
                  <div className="space-y-2.5">
                    {activeTrackedRequest.deliveryTimeline.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs">
                        <div className={`w-6 h-6 rounded-full font-bold flex items-center justify-center shrink-0 mt-0.5 text-[11px] ${
                          item.stage === 'Delivered'
                            ? 'bg-emerald-600 text-white'
                            : item.stage === 'Dispatched'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900">{item.stage}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{item.timestamp}</span>
                          </div>
                          {item.actor && (
                            <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                              {t('actorSignoffLabel')} <strong>{item.actor}</strong>
                            </div>
                          )}
                          {item.note && (
                            <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {item.note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">{t('noActiveRequests')}</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                {pastDeliveries.length > 0
                  ? t('allPreviousFulfilledDesc')
                  : t('submitNewEmergencyRequestDesc')}
              </p>
              <button
                onClick={() => setViewMode('form')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                {t('submitNewRequestBtn')}
              </button>
            </div>
          )}

          {/* Separate Collapsible Past Deliveries Section (Collapsed by Default) */}
          {pastDeliveries.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setIsPastDeliveriesOpen(prev => !prev)}
                className="w-full px-5 py-4 flex items-center justify-between bg-slate-50/80 hover:bg-slate-100/90 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-md bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{t('pastDeliveriesCountLabel', { count: pastDeliveries.length })}</span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {isPastDeliveriesOpen ? t('tapToCollapse') : t('tapToViewHistory')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <span>{isPastDeliveriesOpen ? t('hideHistory') : t('showHistory')}</span>
                  {isPastDeliveriesOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </button>

              {isPastDeliveriesOpen && (
                <div className="p-4 sm:p-5 border-t border-slate-200 space-y-2.5 bg-slate-50/40">
                  {pastDeliveries.map(req => {
                    const isSelected = activeTrackedRequest?.id === req.id;
                    return (
                      <div
                        key={req.id}
                        onClick={() => setSelectedRequestId(req.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
                          isSelected
                            ? 'border-emerald-500 ring-2 ring-emerald-200 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {req.trackingCode}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> {t('stepDelivered')}
                              </span>
                              {req.deliveredTime && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {t('deliveredOnTime', { time: req.deliveredTime })}
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-sm text-slate-900 mt-1">
                              {req.villageName} • <span className="font-normal text-slate-600">{translateResourceType(req.resourceType)}</span>
                            </div>
                            
                            {/* Quantity Breakdown: Requested, Allocated, Delivered, and Shortages */}
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              <span>{t('requestedUnitsLabel')}: <strong className="text-slate-800">{req.requestedUnits || req.quantity} {req.unitLabel || 'Units'}</strong></span>
                              <span>•</span>
                              <span>{t('allocated')}: <strong className="text-slate-800">{req.allocatedUnits ?? req.requestedUnits} {req.unitLabel || 'Units'}</strong></span>
                              <span>•</span>
                              <span>{t('stepDelivered')}: <strong className="text-emerald-700">{req.allocatedUnits ?? req.requestedUnits} {req.unitLabel || 'Units'}</strong></span>
                              <span>•</span>
                              <span>
                                {t('shortage')}: {req.shortageUnits && req.shortageUnits > 0 ? (
                                  <strong className="text-amber-700 font-bold">{req.shortageUnits} {req.unitLabel || 'Units'} {t('shortage')}</strong>
                                ) : (
                                  <strong className="text-emerald-700 font-semibold">{t('nilShortage')}</strong>
                                )}
                              </span>
                            </div>

                            {req.confirmedBy && (
                              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{t('receiverSignoff')}: <strong>{req.confirmedBy}</strong></span>
                              </div>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1">
                              <span>{isSelected ? t('viewingInTracker') : t('inspectDetails')}</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* RECEIVER DELIVERY CONFIRMATION DIALOG MODAL */}
      {confirmingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {t('confirmReceipt')}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                  {t('confirmDeliveryTitle')}
                </h3>
              </div>
              <button
                onClick={() => setConfirmingRequest(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Consignment Details */}
            <div className="py-4 space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-slate-900">{confirmingRequest.trackingCode}</span>
                  <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {confirmingRequest.allocatedUnits ?? confirmingRequest.requestedUnits} {confirmingRequest.unitLabel || 'units'}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900">{confirmingRequest.villageName}</div>
                <div className="text-slate-600"><strong>{t('resourceLabel')}:</strong> {translateResourceType(confirmingRequest.resourceType)}</div>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <span>{t('dispatchedFromLabel')}: <strong>{confirmingRequest.assignedDepotName?.split('(')[0] || 'Depot'}</strong></span>
                  <span>{t('timeLabel')}: {confirmingRequest.dispatchedTime || 'Today'}</span>
                </div>
              </div>

              {/* Physical Verification Question */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1">
                <div className="font-extrabold text-xs flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t('confirmDeliveryTitle')}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {t('confirmDeliveryDesc')}
                </p>
              </div>

              {/* Confirming Recipient Identity */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t('receiverSignoff')}:
                </label>
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>{currentUser?.name || confirmingRequest.submittedBy}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    {currentUser?.designation || 'Gaonburha / Village Rep'}
                  </span>
                </div>
              </div>

              {/* Delivery / Distribution Notes */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t('handoverNotes')}
                </label>
                <textarea
                  rows={2}
                  value={confirmationNotesInput}
                  onChange={(e) => setConfirmationNotesInput(e.target.value)}
                  placeholder={t('handoverNotesPlaceholder')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {confirmationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{confirmationError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmingRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                id="modal-confirm-receipt-action-btn"
                onClick={handleConfirmReceipt}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('confirmHandoverBtn')}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

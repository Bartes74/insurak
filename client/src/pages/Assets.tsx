import React, { useMemo, useState } from 'react';
import { Search, Car, Cog, AlertTriangle, CheckCircle, Clock, History, UploadCloud, Edit2, Save, XCircle, User, FileDown, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useLocation, useNavigate } from 'react-router-dom';
import SlideOver from '../components/SlideOver';
import DatePicker from '../components/DatePicker';
import Dialog from '../components/Dialog';
import { useAssets } from '../context/AssetsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Asset } from '../types';

const TAB_NAMES: Record<string, string> = {
  overview: 'Przegląd',
  files: 'Pliki',
  history: 'Historia'
};

export default function Assets() {
  const { assets, updateAsset, fetchHistory, fetchFiles, uploadFiles, addAsset, refetchAssets, deleteAsset } = useAssets(); // Use Context
  const { user } = useAuth();
  const { showToast } = useToast(); // Added useToast hook

  const fieldCls = "mt-1 w-full rounded-md border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white shadow-inner px-3 py-2 focus:border-slate-400 focus:ring-slate-400 dark:focus:border-gray-500 dark:focus:ring-gray-500";
  const areaCls = "mt-1 w-full rounded-md border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white shadow-inner px-3 py-2 focus:border-slate-400 focus:ring-slate-400 dark:focus:border-gray-500 dark:focus:ring-gray-500";

  type FormAsset = Omit<Asset, 'id' | 'status' | 'progress' | 'premium' | 'sumInsured'> & { premium: string; sumInsured: string };
  type EditForm = Omit<Asset, 'progress' | 'status' | 'premium' | 'sumInsured'> & { premium: string; sumInsured: string; progress: number; status: Asset['status'] };

  const parseMoney = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return 0;
    const num = parseFloat(String(val).replace(/\s+/g, '').replace(',', '.'));
    return Number.isFinite(num) ? num : 0;
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'history'>('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editNAIdentifier, setEditNAIdentifier] = useState(false);
  const [editNAResponsible, setEditNAResponsible] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<FormAsset>({
    name: '',
    type: 'VEHICLE',
    identifier: '',
    policyNumber: '',
    insurer: '',
    validFrom: '',
    validUntil: '',
    conclusionDate: '',
    premium: '',
    sumInsured: '',
    paymentFrequency: 'YEARLY',
    leasingRef: '',
    insured: '',
    responsiblePerson: '',
    comments: '',
    notes: '',
  });
  const [nAIdentifier, setNAIdentifier] = useState(false);
  const [nAResponsible, setNAResponsible] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  const filteredAssets = useMemo(() => {
    const filtered = assets.filter((asset) => {
      // Filter out expired if toggle is off
      if (!showExpired && (asset.status === 'EXPIRED' || new Date(asset.validUntil) < new Date())) {
        return false;
      }

      return (
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.insurer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.responsiblePerson.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    // Sort by validUntil ascending (soonest first)
    return filtered.sort((a, b) => {
      if (!a.validUntil) return 1;
      if (!b.validUntil) return -1;
      return new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
    });
  }, [assets, searchQuery, showExpired]);
  const location = useLocation();
  const navigate = useNavigate();

  // auto-open asset from query param assetId
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('assetId');
    if (id && assets.length > 0) {
      const match = assets.find((a) => a.id === Number(id));
      if (match) handleOpenAsset(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, assets]);

  const handleCreate = async () => {
    const identifier = nAIdentifier ? 'N/A' : createForm.identifier;
    if (!createForm.name || (!createForm.identifier && createForm.identifier !== 'N/A') || !createForm.policyNumber || !createForm.validFrom || !createForm.validUntil) {
      showToast('Uzupełnij: nazwa, nr rej/seryjny (lub zaznacz Nie dotyczy), nr polisy, daty od/do.', 'error');
      return;
    }
    const payload = {
      ...createForm,
      identifier,
      responsiblePerson: nAResponsible ? 'N/A' : createForm.responsiblePerson,
      premium: parseMoney(createForm.premium),
      sumInsured: parseMoney(createForm.sumInsured),
    };
    await addAsset(payload as any);
    await refetchAssets();
    setShowCreate(false);
    setCreateForm({
      name: '',
      type: 'VEHICLE',
      identifier: '',
      policyNumber: '',
      insurer: '',
      validFrom: '',
      validUntil: '',
      conclusionDate: '',
      premium: '',
      sumInsured: '',
      paymentFrequency: 'YEARLY',
      leasingRef: '',
      insured: '',
      responsiblePerson: '',
      comments: '',
      notes: '',
    });
    setNAIdentifier(false);
    setNAResponsible(false);
  };

  const loadTabData = async (tab: 'overview' | 'files' | 'history', assetId: number) => {
    setLoadingTab(true);
    try {
      if (tab === 'history') {
        const data = await fetchHistory(assetId);
        setHistory(data);
      }
      if (tab === 'files') {
        const data = await fetchFiles(assetId);
        setFiles(data);
      }
    } finally {
      setLoadingTab(false);
    }
  };

  // Open Handler
  const handleOpenAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setEditForm({ ...asset, premium: asset.premium?.toString() ?? '', sumInsured: asset.sumInsured?.toString() ?? '' });
    setIsEditing(false); // Always start in view mode
    setActiveTab('overview');
    setEditNAIdentifier(asset.identifier === 'N/A');
    setEditNAResponsible(asset.responsiblePerson === 'N/A');
    loadTabData('overview', asset.id);
  };

  // Save Handler
  const handleSave = async () => {
    if (!editForm) return;

    // Basic Validation
    if (!editForm.name || !editForm.identifier || !editForm.policyNumber) {
      showToast("Proszę wypełnić wymagane pola (Nazwa, ID, Nr polisy).", 'error');
      return;
    }

    // Update via Context
    const payload = {
      ...editForm,
      identifier: editNAIdentifier ? 'N/A' : editForm.identifier,
      responsiblePerson: editNAResponsible ? 'N/A' : editForm.responsiblePerson,
      premium: parseMoney(editForm.premium),
      sumInsured: parseMoney(editForm.sumInsured),
    };

    try {
      await updateAsset(editForm.id, payload);
      showToast('Zapisano zmiany pomyślnie.', 'success');
      // Close the slide-over and reset state
      setSelectedAsset(null);
      setIsEditing(false);
      navigate(location.pathname, { replace: true }); // Clear URL params to prevent re-opening
    } catch (e) {
      showToast('Wystąpił błąd podczas zapisu.', 'error');
    }
  };

  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  const handleDeleteClick = (asset: Asset) => {
    setAssetToDelete(asset);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    try {
      await deleteAsset(assetToDelete.id);
      showToast('Ubezpieczenie zostało usunięte.', 'success');

      // If we deleted the currently viewed asset, close the panel
      if (selectedAsset?.id === assetToDelete.id) {
        setSelectedAsset(null);
        setIsEditing(false);
        navigate(location.pathname, { replace: true });
      }

      setAssetToDelete(null);
      setShowDeleteDialog(false);
    } catch (e) {
      showToast('Wystąpił błąd podczas usuwania.', 'error');
    }
  };

  const handleTabChange = (tab: 'overview' | 'files' | 'history') => {
    if (!selectedAsset) return;
    setActiveTab(tab);
    if (tab !== 'overview') {
      loadTabData(tab, selectedAsset.id);
    }
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!selectedAsset || !fileList || fileList.length === 0) return;
    setLoadingTab(true);
    try {
      await uploadFiles(selectedAsset.id, Array.from(fileList));
      const data = await fetchFiles(selectedAsset.id);
      setFiles(data);
    } finally {
      setLoadingTab(false);
    }
  };


  // Generic Input Handler
  const handleInputChange = (field: keyof EditForm, value: any) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Ubezpieczenia</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Zarządzaj polisami i przypisanymi aktywami.</p>
        </div>
        <div className="w-full sm:w-auto">
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Dodaj nowe ubezpieczenie
            </button>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="bg-slate-50 dark:bg-gray-900/70 border border-slate-200 dark:border-gray-700 rounded-lg p-5 space-y-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Nowe ubezpieczenie</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Nazwa</label>
              <input
                className={fieldCls}
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Nr rej / seryjny</label>
              <input
                className={fieldCls}
                value={createForm.identifier}
                onChange={(e) => setCreateForm({ ...createForm, identifier: e.target.value })}
                disabled={nAIdentifier}
              />
              <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={nAIdentifier}
                  onChange={(e) => setNAIdentifier(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                />
                Nie dotyczy
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Nr polisy</label>
              <input
                className={fieldCls}
                value={createForm.policyNumber}
                onChange={(e) => setCreateForm({ ...createForm, policyNumber: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:col-span-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Typ</label>
                <select
                  className={fieldCls}
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as Asset['type'] })}
                >
                  <option value="VEHICLE">Pojazd</option>
                  <option value="MACHINE">Maszyna</option>
                  <option value="PERSON">Osoba</option>
                  <option value="OTHER">Inne</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Ubezpieczyciel</label>
                <input
                  className={fieldCls}
                  value={createForm.insurer}
                  onChange={(e) => setCreateForm({ ...createForm, insurer: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Częstotliwość płatności</label>
                <select
                  className={fieldCls}
                  value={createForm.paymentFrequency || 'YEARLY'}
                  onChange={(e) => setCreateForm({ ...createForm, paymentFrequency: e.target.value as Asset['paymentFrequency'] })}
                >
                  <option value="YEARLY">Rocznie</option>
                  <option value="QUARTERLY">Kwartalnie</option>
                  <option value="MONTHLY">Miesięcznie</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:col-span-3">
              <DatePicker
                label="Ważna od"
                value={createForm.validFrom}
                onChange={(val) => setCreateForm({ ...createForm, validFrom: val })}
              />
              <DatePicker
                label="Ważna do"
                value={createForm.validUntil}
                onChange={(val) => setCreateForm({ ...createForm, validUntil: val })}
              />
            </div>
            <div>
              <DatePicker
                label="Data zawarcia"
                value={createForm.conclusionDate}
                onChange={(val) => setCreateForm({ ...createForm, conclusionDate: val })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Składka (PLN)</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9,.]*"
                className={fieldCls}
                value={createForm.premium}
                onChange={(e) => setCreateForm({ ...createForm, premium: e.target.value })}
                placeholder="np. 1250,50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Suma ubezp. (PLN)</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9,.]*"
                className={fieldCls}
                value={createForm.sumInsured}
                onChange={(e) => setCreateForm({ ...createForm, sumInsured: e.target.value })}
                placeholder="np. 50000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Leasing (ref)</label>
              <input
                className={fieldCls}
                value={createForm.leasingRef}
                onChange={(e) => setCreateForm({ ...createForm, leasingRef: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Ubezpieczony</label>
              <input
                className={fieldCls}
                value={createForm.insured}
                onChange={(e) => setCreateForm({ ...createForm, insured: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Osoba odpowiedzialna</label>
              <input
                className={fieldCls}
                value={createForm.responsiblePerson}
                onChange={(e) => setCreateForm({ ...createForm, responsiblePerson: e.target.value })}
                disabled={nAResponsible}
              />
              <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={nAResponsible}
                  onChange={(e) => setNAResponsible(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                />
                Nie dotyczy
              </label>
            </div>
            <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Uwagi</label>
                <textarea
                  rows={2}
                  className={areaCls}
                  value={createForm.comments}
                  onChange={(e) => setCreateForm({ ...createForm, comments: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Notatki (wewn.)</label>
                <textarea
                  rows={2}
                  className={areaCls}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowCreate(false)}
              className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
              type="button"
            >
              Anuluj
            </button>
            <button
              onClick={handleCreate}
              className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
            >
              Zapisz
            </button>
          </div>
        </div>
      )}

      {/* Search Bar & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="relative max-w-md flex-1">
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
            placeholder="Szukaj ubezpieczeń, nr rej..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={showExpired}
            onChange={(e) => setShowExpired(e.target.checked)}
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Pokaż wygasłe</span>
        </label>
      </div>

      {/* Asset List (Card Rows) */}
      <div className="space-y-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            onClick={() => handleOpenAsset(asset)}
            className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className={clsx(
                "p-3 rounded-lg",
                asset.type === 'VEHICLE' ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
                  asset.type === 'MACHINE' ? "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" :
                    "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
              )}>
                {asset.type === 'VEHICLE' ? <Car className="h-6 w-6" /> :
                  asset.type === 'MACHINE' ? <Cog className="h-6 w-6" /> :
                    <User className="h-6 w-6" />}
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {asset.name}
                </h3>
                <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-500/10 dark:ring-gray-500/30">
                  {asset.identifier}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Polisa #{asset.policyNumber}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Ubezp: {asset.insurer}</span>
              </div>
            </div>

            {/* Status & Progress */}
            <div className="w-full sm:w-64 flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  {asset.status === 'ACTIVE' && <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />}
                  {asset.status === 'EXPIRING' && <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />}
                  {asset.status === 'EXPIRED' && <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
                  <span className={clsx(
                    "font-medium",
                    asset.status === 'ACTIVE' && "text-green-700 dark:text-green-400",
                    asset.status === 'EXPIRING' && "text-red-700 dark:text-red-400",
                    asset.status === 'EXPIRED' && "text-gray-600 dark:text-gray-400",
                  )}>
                    {asset.status === 'EXPIRING' ? 'Wygasa wkrótce' : asset.status === 'ACTIVE' ? 'Aktywna' : 'Wygasła'}
                  </span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">{format(parseISO(asset.validUntil), 'd MMM yyyy', { locale: pl })}</span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full",
                    asset.status === 'EXPIRING' ? "bg-red-500 dark:bg-red-600" : asset.status === 'EXPIRED' ? "bg-gray-400 dark:bg-gray-600" : "bg-green-500 dark:bg-green-600"
                  )}
                  style={{ width: `${asset.progress}%` }}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAsset(asset);
                  setIsEditing(true);
                }}
                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Edytuj"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              {user?.role === 'ADMIN' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(asset);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Usuń"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredAssets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-full mb-4">
              <Car className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nie znaleziono ubezpieczeń</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              {searchQuery
                ? `Brak wyników dla wyszukiwania "${searchQuery}". Spróbuj zmienić kryteria.`
                : "Twoja lista ubezpieczeń jest pusta. Dodaj pierwsze ubezpieczenie, aby zacząć zarządzać flotą."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all hover:scale-105"
              >
                <UploadCloud className="h-4 w-4" />
                Dodaj pierwsze ubezpieczenie
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail Slide-over */}
      <SlideOver
        open={!!selectedAsset}
        onClose={() => {
          setSelectedAsset(null);
          navigate(location.pathname, { replace: true });
        }}
        title={isEditing ? 'Edycja ubezpieczenia' : (selectedAsset?.name || 'Szczegóły ubezpieczenia')}
      >
        {selectedAsset && editForm && (
          <div className="flex flex-col h-full">
            {/* Action Buttons Header (Sticky) */}
            <div className="flex items-center justify-between px-4 sm:px-0 pb-4">
              {isEditing ? (
                <div className="flex w-full gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 inline-flex justify-center items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                  >
                    <Save className="h-4 w-4" /> Zapisz
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedAsset(null); // Close panel on cancel
                      navigate(location.pathname, { replace: true });
                    }}
                    className="flex-1 inline-flex justify-center items-center gap-2 rounded-md bg-gray-200 dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm hover:bg-gray-300 dark:hover-bg-gray-600"
                  >
                    <XCircle className="h-4 w-4" /> Anuluj
                  </button>
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={() => selectedAsset && handleDeleteClick(selectedAsset)}
                      className="inline-flex justify-center items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                      title="Usuń ubezpieczenie"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  <Edit2 className="h-4 w-4" /> Edytuj szczegóły
                </button>
              )}
            </div>

            {/* Tabs - Only show in View Mode */}
            {!isEditing && (
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  {['overview', 'files', 'history'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab as any)}
                      className={clsx(
                        activeTab === tab
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300',
                        'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                      )}
                    >
                      {TAB_NAMES[tab]}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* Tab Content OR Edit Form */}
            <div className="mt-6 flex-1 pb-12">
              {/* EDIT MODE */}
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                  {/* Row 1: Identification */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Nazwa ubezpieczenia</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={fieldCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Nr Rej / Seryjny</label>
                    <input
                      type="text"
                      value={editForm.identifier}
                      onChange={(e) => handleInputChange('identifier', e.target.value)}
                      className={fieldCls}
                      disabled={editNAIdentifier}
                    />
                    <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                        checked={editNAIdentifier}
                        onChange={(e) => setEditNAIdentifier(e.target.checked)}
                      />
                      Nie dotyczy
                    </label>
                  </div>

                  {/* Row 2: Type & Policy Basics */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Typ</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className={fieldCls}
                    >
                      <option value="VEHICLE">Pojazd</option>
                      <option value="MACHINE">Maszyna</option>
                      <option value="PERSON">Osoba</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Ubezpieczyciel</label>
                    <input
                      type="text"
                      value={editForm.insurer}
                      onChange={(e) => handleInputChange('insurer', e.target.value)}
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Nr Polisy</label>
                    <input
                      type="text"
                      value={editForm.policyNumber}
                      onChange={(e) => handleInputChange('policyNumber', e.target.value)}
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Częstotliwość płatności</label>
                    <select
                      value={editForm.paymentFrequency || 'YEARLY'}
                      onChange={(e) => handleInputChange('paymentFrequency', e.target.value as any)}
                      className={fieldCls}
                    >
                      <option value="YEARLY">Rocznie</option>
                      <option value="QUARTERLY">Kwartalnie</option>
                      <option value="MONTHLY">Miesięcznie</option>
                    </select>
                  </div>

                  {/* Row 3: Dates */}
                  <div className="sm:col-span-3 border-t border-gray-100 dark:border-gray-700 my-1"></div>

                  <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <DatePicker
                        label="Ważna od"
                        value={editForm.validFrom}
                        onChange={(val) => handleInputChange('validFrom', val)}
                      />
                    </div>
                    <div>
                      <DatePicker
                        label="Ważna do"
                        value={editForm.validUntil}
                        onChange={(val) => handleInputChange('validUntil', val)}
                      />
                    </div>
                  </div>
                  <div>
                    <DatePicker
                      label="Data zawarcia"
                      value={editForm.conclusionDate}
                      onChange={(val) => handleInputChange('conclusionDate', val)}
                    />
                  </div>

                  {/* Row 4: Financials & Contracts */}
                  <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Składka (PLN)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9,.]*"
                        value={editForm.premium}
                        onChange={(e) => handleInputChange('premium', e.target.value)}
                        className={fieldCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Suma Ubezp. (PLN)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9,.]*"
                        value={editForm.sumInsured}
                        onChange={(e) => handleInputChange('sumInsured', e.target.value)}
                        className={fieldCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Leasing (Ref)</label>
                    <input
                      type="text"
                      value={editForm.leasingRef}
                      onChange={(e) => handleInputChange('leasingRef', e.target.value)}
                      className={fieldCls}
                      placeholder="np. L-12345"
                    />
                  </div>

                  {/* Row 5: People & Notes */}
                  <div className="sm:col-span-3 border-t border-gray-100 dark:border-gray-700 my-1"></div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Ubezpieczony</label>
                    <input
                      type="text"
                      value={editForm.insured}
                      onChange={(e) => handleInputChange('insured', e.target.value)}
                      className={fieldCls}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Osoba odpowiedzialna</label>
                    <input
                      type="text"
                      value={editForm.responsiblePerson}
                      onChange={(e) => handleInputChange('responsiblePerson', e.target.value)}
                      className={fieldCls}
                      disabled={editNAResponsible}
                    />
                    <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                        checked={editNAResponsible}
                        onChange={(e) => setEditNAResponsible(e.target.checked)}
                      />
                      Nie dotyczy
                    </label>
                  </div>

                  <div className="sm:col-span-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Uwagi</label>
                      <textarea
                        rows={2}
                        value={editForm.comments}
                        onChange={(e) => handleInputChange('comments', e.target.value)}
                        className={areaCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Notatki (Wewnętrzne)</label>
                      <textarea
                        rows={2}
                        value={editForm.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className={areaCls}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // VIEW MODE
                <>
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-4">
                      {/* Row 1: Identification */}
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Nazwa ubezpieczenia</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{selectedAsset.name}</dd>
                      </div>

                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Nr Rej / Seryjny</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{selectedAsset.identifier}</dd>
                      </div>

                      {/* Row 2: Type & Policy Basics */}
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Typ</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedAsset.type === 'VEHICLE' ? 'Pojazd' :
                            selectedAsset.type === 'MACHINE' ? 'Maszyna' : 'Osoba'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Ubezpieczyciel</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{selectedAsset.insurer}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Nr Polisy</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{selectedAsset.policyNumber}</dd>
                      </div>

                      {/* Row 3: Dates */}
                      <div className="sm:col-span-3 border-t border-gray-100 dark:border-gray-700 my-1"></div>

                      <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Ważna od</dt>
                          <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{format(parseISO(selectedAsset.validFrom), 'dd.MM.yyyy', { locale: pl })}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Ważna do</dt>
                          <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{format(parseISO(selectedAsset.validUntil), 'dd.MM.yyyy', { locale: pl })}</dd>
                        </div>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Data zawarcia</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{format(parseISO(selectedAsset.conclusionDate), 'dd.MM.yyyy', { locale: pl })}</dd>
                      </div>

                      {/* Row 4: Financials & Contracts */}
                      <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Składka (PLN)</dt>
                          <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{selectedAsset.premium.toLocaleString('pl-PL')} PLN</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Suma Ubezp. (PLN)</dt>
                          <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{selectedAsset.sumInsured.toLocaleString('pl-PL')} PLN</dd>
                        </div>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Leasing (Ref)</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{selectedAsset.leasingRef || '-'}</dd>
                      </div>

                      {/* Row 5: People & Notes */}
                      <div className="sm:col-span-3 border-t border-gray-100 dark:border-gray-700 my-1"></div>

                      <div className="sm:col-span-1">
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Ubezpieczony</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{selectedAsset.insured}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Osoba odpowiedzialna</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{selectedAsset.responsiblePerson}</dd>
                      </div>

                      <div className="sm:col-span-3 grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Uwagi</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white italic">{selectedAsset.comments || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Notatki (Wewnętrzne)</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white text-gray-500">{selectedAsset.notes || '-'}</dd>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'files' && (
                    <div className="py-6 space-y-4">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        <UploadCloud className="h-4 w-4" />
                        Dodaj pliki (PDF)
                        <input
                          type="file"
                          accept="application/pdf"
                          multiple
                          className="hidden"
                          onChange={(e) => handleUpload(e.target.files)}
                        />
                      </label>
                      {loadingTab ? (
                        <p className="text-sm text-gray-500">Ładowanie...</p>
                      ) : files.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Brak załączonych plików</h3>
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                          {files.map((file) => (
                            <li key={file.filename} className="py-3 flex items-center justify-between text-sm">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{file.originalName}</p>
                                <p className="text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <a
                                href={`http://localhost:3000/${file.path}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-500"
                              >
                                <FileDown className="h-4 w-4" /> Pobierz
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="flow-root">
                      {loadingTab ? (
                        <p className="text-sm text-gray-500">Ładowanie...</p>
                      ) : history.length === 0 ? (
                        <p className="text-sm text-gray-500">Brak historii polis.</p>
                      ) : (
                        <ul role="list" className="-mb-8">
                          {history.map((item: any, idx: number) => (
                            <li key={item.id || idx}>
                              <div className="relative pb-8">
                                {idx !== history.length - 1 ? (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                                      <History className="h-5 w-5 text-white" aria-hidden="true" />
                                    </span>
                                  </div>
                                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                    <div>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">Polisa {item.policyNumber}</p>
                                      <p className="text-xs text-gray-400">Status: {item.computedStatus}</p>
                                    </div>
                                    <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                                      <time>{format(parseISO(item.endDate), 'dd.MM.yyyy', { locale: pl })}</time>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </SlideOver>
      {/* Create Modal */}


      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Usuń ubezpieczenie"
        message={`Czy na pewno chcesz usunąć ubezpieczenie "${selectedAsset?.name}"? Tej operacji nie można cofnąć.`}
        confirmLabel="Usuń"
        variant="danger"
      />
    </div>
  );
}

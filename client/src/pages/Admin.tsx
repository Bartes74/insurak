import { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
import { Users, Bell, Upload, Trash2, Plus, AlertCircle, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { read, utils } from 'xlsx';
import api from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import Dialog from '../components/Dialog';
import type { Asset } from '../types';

interface UserRow {
  id: number;
  email: string;
  role: 'ADMIN' | 'USER';
  canEdit: boolean;
  createdAt?: string;
}

interface NotificationSettings {
  firstAlertDays: number;
  followUpDays: number;
  globalRecipients: string;
}

// Import Logic Types
interface ImportedAsset {
  name: string;
  type: 'VEHICLE' | 'MACHINE' | 'PERSON';
  identifier: string; // Unique Key
  policyNumber: string;
  validFrom: string;
  validUntil: string;
  premium: number;
  insurer: string;
  leasingRef?: string;
  comments?: string;
  notes?: string;
  sumInsured?: number;
  conclusionDate?: string;
  insured?: string;
  responsiblePerson?: string;
}

const normalizeNumber = (val: any) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const parseExcelDate = (val: any): string => {
  if (!val) return '';
  // Handle Excel serial number (days since 1900-01-01)
  if (typeof val === 'number') {
    // Excel base date is 1899-12-30 due to leap year bug
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }
  // Handle string dates (try to parse)
  const date = new Date(val);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return '';
};

interface DuplicateConflict {
  identifier: string;
  existing: Asset; // The current record in DB
  incoming: ImportedAsset; // The new record from CSV
  resolution: 'PENDING' | 'SKIP' | 'UPDATE';
}

export default function Admin() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'import'>('users');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({ firstAlertDays: 30, followUpDays: 10, globalRecipients: '' });
  const [recipients, setRecipients] = useState<{ id: number; email: string }[]>([]);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    variant: 'primary' as 'primary' | 'danger' | 'info'
  });
  const [inviteDialog, setInviteDialog] = useState({
    isOpen: false,
    email: '',
    password: '',
    loading: false
  });

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState<'idle' | 'processing' | 'mapping' | 'conflict_resolution' | 'summary'>('idle');
  const [conflicts, setConflicts] = useState<DuplicateConflict[]>([]);
  const [newRecords, setNewRecords] = useState<ImportedAsset[]>([]);
  const [stats, setStats] = useState({ added: 0, updated: 0, skipped: 0 });

  // Mapping State
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [parsedRawData, setParsedRawData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    identifier: '',
    name: '',
    policyNumber: '',
    insurer: '',
    validFrom: '',
    validUntil: '',
    premium: '',
    leasingRef: '',
    comments: '',
    notes: '',
    sumInsured: '',
    conclusionDate: '',
    insured: '',
    responsiblePerson: ''
  });

  const REQUIRED_FIELDS = [
    { key: 'identifier', label: 'Nr Rejestracyjny / Seryjny', required: true },
    { key: 'name', label: 'Nazwa Ubezpieczenia / Aktywa', required: true },
    { key: 'policyNumber', label: 'Nr Polisy', required: true },
    { key: 'insurer', label: 'Ubezpieczyciel', required: false },
    { key: 'validFrom', label: 'Ważna od', required: false },
    { key: 'validUntil', label: 'Ważna do', required: false },
    { key: 'premium', label: 'Składka', required: false },
    { key: 'sumInsured', label: 'Suma ubezpieczenia', required: false },
    { key: 'conclusionDate', label: 'Data zawarcia', required: false },
    { key: 'leasingRef', label: 'Leasing (Ref)', required: false },
    { key: 'insured', label: 'Ubezpieczony', required: false },
    { key: 'responsiblePerson', label: 'Osoba odpowiedzialna', required: false },
    { key: 'comments', label: 'Uwagi', required: false },
    { key: 'notes', label: 'Notatki (wewnętrzne)', required: false },
  ];

  // --- DATA LOAD ---
  const loadUsers = async () => {
    const { data } = await api.get('/admin/users');
    setUsers(data);
  };

  const loadSettings = async () => {
    const { data } = await api.get('/admin/settings');
    const recips = await api.get('/admin/recipients');
    setSettings({
      firstAlertDays: data.defaultLeadDays ?? 30,
      followUpDays: data.followUpLeadDays ?? 10,
      globalRecipients: (recips.data || []).map((r: any) => r.email).join(', '),
    });
    setRecipients(recips.data || []);
  };

  useEffect(() => {
    loadUsers();
    loadSettings();
  }, []);

  // --- USER HANDLERS ---
  const handleDeleteUser = async (id: number) => {
    // if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Usuń użytkownika',
      message: 'Czy na pewno chcesz usunąć tego użytkownika?',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${id}`);
          setUsers(users.filter(u => u.id !== id));
          showToast('Użytkownik został usunięty.', 'success');
        } catch (e) {
          showToast('Nie udało się usunąć użytkownika.', 'error');
        }
      },
      variant: 'danger'
    });
  };

  const handleTogglePermission = async (id: number, current: boolean) => {
    try {
      const { data } = await api.put(`/admin/users/${id}`, { canEdit: !current });
      setUsers(users.map(u => u.id === id ? { ...u, canEdit: data.canEdit } : u));
      showToast('Uprawnienia użytkownika zostały zmienione.', 'success');
    } catch (e) {
      showToast('Nie udało się zmienić uprawnień użytkownika.', 'error');
    }
  };

  const handleInviteUser = () => {
    setInviteDialog({ isOpen: true, email: '', password: '', loading: false });
  };

  const submitInvite = async () => {
    const { email, password } = inviteDialog;
    if (!email || !password) {
      showToast('Podaj email i hasło.', 'error');
      return;
    }

    setInviteDialog(prev => ({ ...prev, loading: true }));
    try {
      const { data } = await api.post('/admin/users', { email, password, role: 'USER', canEdit: true });
      setUsers([...users, data]);
      showToast('Użytkownik został zaproszony.', 'success');
      setInviteDialog({ isOpen: false, email: '', password: '', loading: false });
    } catch (e) {
      showToast('Nie udało się zaprosić użytkownika.', 'error');
      setInviteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRoleChange = async (id: number, newRole: 'ADMIN' | 'USER') => {
    const confirmAction = async () => {
      try {
        const { data } = await api.put(`/admin/users/${id}`, { role: newRole });
        setUsers(users.map(u => u.id === id ? { ...u, role: data.role } : u));
        showToast('Rola użytkownika została zmieniona.', 'success');
      } catch (e) {
        showToast('Nie udało się zmienić roli użytkownika.', 'error');
      }
    };

    if (newRole === 'ADMIN') {
      setConfirmDialog({
        isOpen: true,
        title: 'Zmiana uprawnień',
        message: 'Czy na pewno chcesz nadać temu użytkownikowi uprawnienia Administratora? Będzie miał pełny dostęp do systemu.',
        onConfirm: confirmAction,
        variant: 'danger'
      });
    } else {
      confirmAction();
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.put('/admin/settings', {
        defaultLeadDays: settings.firstAlertDays,
        followUpLeadDays: settings.followUpDays,
        deadlineLeadDays: 0,
      });

      const emails = settings.globalRecipients.split(',').map(e => e.trim()).filter(Boolean);

      // add new
      for (const email of emails) {
        if (!recipients.find(r => r.email === email)) {
          const { data } = await api.post('/admin/recipients', { email });
          setRecipients(prev => [...prev, data]);
        }
      }

      // remove deleted
      const toRemove = recipients.filter(r => !emails.includes(r.email));
      for (const r of toRemove) {
        await api.delete(`/admin/recipients/${r.id}`);
        setRecipients(prev => prev.filter(item => item.id !== r.id));
      }

      await loadSettings();
      showToast('Ustawienia zostały zapisane.', 'success');
    } catch (e) {
      showToast('Nie udało się zapisać ustawień.', 'error');
    }
  };

  // --- IMPORT LOGIC ---
  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setImportStep('idle');
      setConflicts([]);
      setNewRecords([]);
      setColumnMapping({
        identifier: '', name: '', policyNumber: '', insurer: '', validFrom: '', validUntil: '', premium: '',
        leasingRef: '', comments: '', notes: '', sumInsured: '', conclusionDate: '', insured: '', responsiblePerson: ''
      });
    }
  };

  const readHeaders = async () => {
    if (!importFile) return;
    try {
      const data = await importFile.arrayBuffer();
      const workbook = read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(sheet, { header: 1 });
      if (jsonData.length === 0) {
        showToast("Plik jest pusty.", 'error');
        return;
      }
      const headers = jsonData[0] as string[];
      setImportHeaders(headers);

      // Parse again as objects for easier mapping
      const jsonDataObjects = utils.sheet_to_json(sheet);
      setParsedRawData(jsonDataObjects as any[]);
      setImportStep('mapping');

      // Auto-map
      const newMapping = { ...columnMapping };
      headers.forEach(h => {
        const lower = h.toLowerCase();
        if (lower.includes('rej') || lower.includes('seryjny') || lower.includes('ident')) newMapping.identifier = h;
        if (lower.includes('nazwa') || lower.includes('pojazd') || lower.includes('maszyna')) newMapping.name = h;
        if (lower.includes('polis')) newMapping.policyNumber = h;
        if (lower.includes('ubezp')) newMapping.insurer = h;
        if (lower.includes('ważna od') || lower.includes('start')) newMapping.validFrom = h;
        if (lower.includes('ważna do') || lower.includes('koniec') || lower.includes('end')) newMapping.validUntil = h;
        if (lower.includes('skład')) newMapping.premium = h;
        if (lower.includes('suma') || lower.includes('wartość')) newMapping.sumInsured = h;
        if (lower.includes('zawarcia')) newMapping.conclusionDate = h;
        if (lower.includes('leasing') || lower.includes('finans')) newMapping.leasingRef = h;
        if (lower.includes('ubezpieczony') || lower.includes('korzystający')) newMapping.insured = h;
        if (lower.includes('odpowiedzialn') || lower.includes('użytkownik')) newMapping.responsiblePerson = h;
        if (lower.includes('uwagi')) newMapping.comments = h;
        if (lower.includes('notatki')) newMapping.notes = h;
      });
      setColumnMapping(newMapping);

      setImportStep('mapping');

    } catch (error) {
      console.error("Import error:", error);
      showToast("Błąd podczas czytania pliku.", 'error');
      setImportStep('idle');
    }
  };

  const applyMappingAndProcess = async () => {
    // Validate required fields
    if (!columnMapping.identifier || !columnMapping.name || !columnMapping.policyNumber) {
      showToast("Proszę zmapować wymagane pola (Nr Rej, Nazwa, Polisa).", 'error');
      return;
    }

    const mapped: ImportedAsset[] = [];

    parsedRawData.forEach((row: any, idx: number) => {
      const identifier = row[columnMapping.identifier];
      mapped.push({
        name: String(row[columnMapping.name] || 'Nieznany'),
        type: 'VEHICLE',
        identifier: String(identifier || `ROW-${idx + 1}`),
        policyNumber: String(row[columnMapping.policyNumber] || ''),
        insurer: String(row[columnMapping.insurer] || ''),
        premium: normalizeNumber(row[columnMapping.premium]),
        validFrom: parseExcelDate(row[columnMapping.validFrom]),
        validUntil: parseExcelDate(row[columnMapping.validUntil]),
        sumInsured: normalizeNumber(row[columnMapping.sumInsured]),
        conclusionDate: parseExcelDate(row[columnMapping.conclusionDate]),
        leasingRef: String(row[columnMapping.leasingRef] || ''),
        insured: String(row[columnMapping.insured] || ''),
        responsiblePerson: String(row[columnMapping.responsiblePerson] || ''),
        comments: String(row[columnMapping.comments] || ''),
        notes: String(row[columnMapping.notes] || '')
      });
    });

    setImportStep('processing');

    try {
      const { data } = await api.post('/import/dry-run', { records: mapped });
      setNewRecords(data.newRecords || []);
      const conflictsFromApi: DuplicateConflict[] = (data.conflicts || []).map((c: any) => ({
        identifier: c.identifier,
        existing: c.existing,
        incoming: c.incoming,
        resolution: 'PENDING'
      }));
      setConflicts(conflictsFromApi);

      if ((conflictsFromApi?.length || 0) > 0) {
        setImportStep('conflict_resolution');
      } else {
        // brak konfliktów – od razu commitujemy na backend
        const commit = await api.post('/import/commit', { records: mapped, resolution: {} });
        setStats({
          added: commit.data.added || mapped.length,
          updated: commit.data.updated || 0,
          skipped: commit.data.skipped || 0,
        });
        setImportStep('summary');
      }
    } catch (e) {
      console.error(e);
      showToast('Nie udało się wykonać dry-run importu.', 'error');
      setImportStep('mapping');
    }
  };

  const resolveConflict = (identifier: string, resolution: 'SKIP' | 'UPDATE') => {
    setConflicts(conflicts.map(c => c.identifier === identifier ? { ...c, resolution } : c));
  };

  const finalizeImport = async () => {
    const toUpdate = conflicts.filter(c => c.resolution === 'UPDATE');
    const toSkip = conflicts.filter(c => c.resolution === 'SKIP');
    const pending = conflicts.filter(c => c.resolution === 'PENDING');

    if (pending.length > 0) {
      showToast(`Masz ${pending.length} nierozwiązanych konfliktów.`, 'error');
      return;
    }

    setImportStep('processing'); // Reuse processing UI

    try {
      const resolution: Record<string, 'UPDATE' | 'SKIP'> = {};
      toUpdate.forEach(c => { resolution[c.identifier] = 'UPDATE'; });
      toSkip.forEach(c => { resolution[c.identifier] = 'SKIP'; });

      const payloadRecords = [...newRecords, ...conflicts.map(c => c.incoming)];

      const { data } = await api.post('/import/commit', { records: payloadRecords, resolution });

      setStats({
        added: data.added ?? newRecords.length,
        updated: data.updated ?? toUpdate.length,
        skipped: data.skipped ?? toSkip.length
      });
      setImportStep('summary');
    } catch (e) {
      console.error(e);
      showToast("Wystąpił błąd podczas zapisywania importu.", 'error');
      // Return to conflict resolution so user can retry or fix
      setImportStep('conflict_resolution');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Panel Administratora</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Zarządzaj użytkownikami, powiadomieniami i danymi systemu.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('users')}
            className={clsx(
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300',
              'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium'
            )}
          >
            <Users className={clsx("mr-2 h-5 w-5", activeTab === 'users' ? "text-indigo-500" : "text-gray-400")} />
            <span>Użytkownicy</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={clsx(
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300',
              'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium'
            )}
          >
            <Bell className={clsx("mr-2 h-5 w-5", activeTab === 'settings' ? "text-indigo-500" : "text-gray-400")} />
            <span>Powiadomienia</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={clsx(
              activeTab === 'import'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300',
              'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium'
            )}
          >
            <Upload className={clsx("mr-2 h-5 w-5", activeTab === 'import' ? "text-indigo-500" : "text-gray-400")} />
            <span>Import Danych</span>
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="mt-6">

        {/* --- USERS TAB --- */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={handleInviteUser}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <Plus className="h-4 w-4 mr-2" /> Zaproś użytkownika
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Użytkownik</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Rola</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Edycja danych</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Akcje</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold">
                            {user.email[0].toUpperCase()}
                          </div>
                          {user.email}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as 'ADMIN' | 'USER')}
                          className={clsx(
                            "block w-full rounded-md border-0 py-1.5 text-xs font-medium ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-xs sm:leading-6",
                            user.role === 'ADMIN'
                              ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 ring-purple-600/20 focus:ring-purple-600"
                              : "bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 ring-gray-500/10 focus:ring-indigo-600"
                          )}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>          </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <button
                          onClick={() => handleTogglePermission(user.id, user.canEdit)}
                          disabled={user.role === 'ADMIN'} // Admin always has edit
                          className={clsx(
                            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                            (user.canEdit || user.role === 'ADMIN') ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700',
                            user.role === 'ADMIN' && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <span className={clsx(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            (user.canEdit || user.role === 'ADMIN') ? 'translate-x-5' : 'translate-x-0'
                          )} />
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" /> Aktywny
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold leading-7 text-gray-900 dark:text-white">Ustawienia Powiadomień</h3>
                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">Skonfiguruj globalne zasady wysyłania przypomnień o wygasających polisach.</p>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="first-alert" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
                    Pierwszy alert (dni przed)
                  </label>
                  <div className="mt-2">
                    <input
                      type="number"
                      name="first-alert"
                      id="first-alert"
                      value={settings.firstAlertDays}
                      onChange={(e) => setSettings({ ...settings, firstAlertDays: parseInt(e.target.value) })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="follow-up" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
                    Przypomnienie (dni przed)
                  </label>
                  <div className="mt-2">
                    <input
                      type="number"
                      name="follow-up"
                      id="follow-up"
                      value={settings.followUpDays}
                      onChange={(e) => setSettings({ ...settings, followUpDays: parseInt(e.target.value) })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>

                <div className="sm:col-span-full">
                  <label htmlFor="global-emails" className="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
                    Globalna lista odbiorców
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Adresy email oddzielone przecinkami, które zawsze otrzymają kopię powiadomienia.</p>
                  <div className="mt-2">
                    <textarea
                      id="global-emails"
                      name="global-emails"
                      rows={3}
                      value={settings.globalRecipients}
                      onChange={(e) => setSettings({ ...settings, globalRecipients: e.target.value })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-700"
                    />         </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 dark:border-gray-700 pt-4">
                <button type="button" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">Anuluj</button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Zapisz zmiany
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- IMPORT TAB --- */}
        {activeTab === 'import' && (
          <div className="max-w-3xl">
            <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Importuj dane z Excel/CSV</h3>

              {/* STEP 1: IDLE / UPLOAD */}
              {(importStep === 'idle' || importStep === 'processing') && (
                <>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">System automatycznie wykryje duplikaty na podstawie numeru rejestracyjnego.</p>

                  {importStep === 'idle' && (
                    <div className="mt-6">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white dark:bg-gray-700 font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                        <span>Wybierz plik</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv, .xlsx, .xls" onChange={handleFileDrop} />
                      </label>
                    </div>
                  )}

                  {importFile && importStep === 'idle' && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4" /> {importFile.name}
                      </p>
                      <button
                        onClick={readHeaders}
                        className="mt-3 w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                      >
                        Wczytaj plik i mapuj
                      </button>
                    </div>
                  )}

                  {importStep === 'processing' && (
                    <div className="mt-6">
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 animate-pulse w-2/3"></div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Analiza struktury pliku...</p>
                    </div>
                  )}
                </>
              )}

              {/* STEP 1.5: COLUMN MAPPING */}
              {importStep === 'mapping' && (
                <div className="mt-6 text-left max-w-4xl mx-auto">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-500" /> Mapowanie Kolumn
                  </h4>
                  <p className="text-sm text-gray-500 mb-6">Przypisz kolumny z pliku Excel do pól w systemie.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {REQUIRED_FIELDS.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <select
                          value={columnMapping[field.key] || ''}
                          onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">-- Wybierz kolumnę --</option>
                          {importHeaders.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end gap-4">
                    <button
                      onClick={() => setImportStep('idle')}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={applyMappingAndProcess}
                      className="inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Dalej <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CONFLICT RESOLUTION */}
              {importStep === 'conflict_resolution' && (
                <div className="mt-6 text-left">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" /> Wykryto duplikaty ({conflicts.length})
                  </h4>
                  <p className="text-sm text-gray-500 mb-4">Poniższe rekordy już istnieją w bazie. Zdecyduj, czy chcesz je zaktualizować, czy pominąć.</p>

                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase">Zasób</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase">Obecna Wartość</th>
                          <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase">W pliku</th>
                          <th className="px-3 py-3.5 text-center text-xs font-semibold text-gray-900 dark:text-white uppercase">Decyzja</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {conflicts.map((conflict) => (
                          <tr key={conflict.identifier}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white">
                              {conflict.identifier}
                              <div className="text-xs font-normal text-gray-500">{conflict.existing.name}</div>
                            </td>
                            <td className="px-3 py-4 text-xs text-gray-500 dark:text-gray-400">
                              Polisa: {conflict.existing.policyNumber} <br />
                              Ważna do: {conflict.existing.validUntil}
                            </td>
                            <td className="px-3 py-4 text-xs text-gray-900 dark:text-white font-medium">
                              Polisa: {conflict.incoming.policyNumber} <br />
                              Ważna do: {conflict.incoming.validUntil}
                            </td>
                            <td className="px-3 py-4 text-sm text-center space-x-2">
                              <button
                                onClick={() => resolveConflict(conflict.identifier, 'SKIP')}
                                className={clsx(
                                  "px-2 py-1 rounded text-xs font-medium border",
                                  conflict.resolution === 'SKIP'
                                    ? "bg-gray-200 text-gray-800 border-gray-400"
                                    : "text-gray-600 hover:bg-gray-50 border-gray-300"
                                )}
                              >
                                Pomiń
                              </button>
                              <button
                                onClick={() => resolveConflict(conflict.identifier, 'UPDATE')}
                                className={clsx(
                                  "px-2 py-1 rounded text-xs font-medium border",
                                  conflict.resolution === 'UPDATE'
                                    ? "bg-indigo-100 text-indigo-800 border-indigo-400"
                                    : "text-indigo-600 hover:bg-indigo-50 border-indigo-300"
                                )}
                              >
                                Aktualizuj
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      onClick={() => setImportStep('idle')}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={finalizeImport}
                      className="inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Zatwierdź wybór <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SUMMARY */}
              {importStep === 'summary' && (
                <div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800 flex flex-col items-center">
                  <CheckCircle className="h-12 w-12 mb-4" />
                  <h4 className="text-lg font-bold mb-1">Import zakończony sukcesem!</h4>
                  <div className="grid grid-cols-3 gap-8 mt-4 text-center w-full max-w-md">
                    <div>
                      <div className="text-2xl font-bold text-green-800 dark:text-green-300">{stats.added}</div>
                      <div className="text-xs uppercase tracking-wide opacity-75">Dodano</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">{stats.updated}</div>
                      <div className="text-xs uppercase tracking-wide opacity-75">Zaktualizowano</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.skipped}</div>
                      <div className="text-xs uppercase tracking-wide opacity-75">Pominięto</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setImportStep('idle'); setImportFile(null); }}
                    className="mt-8 text-sm font-medium underline hover:text-green-900 dark:hover:text-green-200"
                  >
                    Wgraj kolejny plik
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        <Dialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
        />
      </div>
      {/* Invite Dialog */}
      <Dialog
        isOpen={inviteDialog.isOpen}
        onClose={() => setInviteDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={submitInvite}
        title="Zaproś użytkownika"
        message=""
        confirmLabel={inviteDialog.loading ? "Wysyłanie..." : "Zaproś"}
        manualClose={true}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={inviteDialog.email}
              onChange={e => setInviteDialog(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hasło</label>
            <input
              type="password"
              value={inviteDialog.password}
              onChange={e => setInviteDialog(prev => ({ ...prev, password: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="••••••••"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../hooks/useApi';
import type { Asset } from '../types';
import { useAuth } from './AuthContext';

// --- Context Definition ---
interface AssetsContextType {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  addAsset: (assetData: Omit<Asset, 'id' | 'status' | 'progress'>) => Promise<void>;
  updateAsset: (id: number, updates: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: number) => Promise<void>;
  refetchAssets: () => Promise<void>;
  renewPolicy: (id: number, payload: Partial<Asset>) => Promise<void>;
  fetchHistory: (id: number) => Promise<any[]>;
  fetchFiles: (id: number) => Promise<any[]>;
  uploadFiles: (id: number, files: File[]) => Promise<any[]>;
}

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

export function AssetsProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchAssets = async () => {
    if (!token) {
      setAssets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Asset[]>('/assets');
      setAssets(response.data);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
      setError('Nie udało się pobrać zasobów.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const addAsset = async (assetData: Omit<Asset, 'id' | 'status' | 'progress'>) => {
    try {
      await api.post('/assets', assetData);
      await fetchAssets(); // Re-fetch all assets to update state
    } catch (err) {
      console.error('Failed to add asset:', err);
      throw new Error('Nie udało się dodać zasobu.');
    }
  };

  const updateAsset = async (id: number, updates: Partial<Asset>) => {
    try {
      await api.put(`/assets/${id}`, updates);
      await fetchAssets(); // Re-fetch all assets to update state
    } catch (err) {
      console.error('Failed to update asset:', err);
      throw new Error('Nie udało się zaktualizować zasobu.');
    }
  };

  const deleteAsset = async (id: number) => {
    try {
      await api.delete(`/assets/${id}`);
      await fetchAssets(); // Re-fetch all assets to update state
    } catch (err) {
      console.error('Failed to delete asset:', err);
      throw new Error('Nie udało się usunąć zasobu.');
    }
  };

  const renewPolicy = async (id: number, payload: Partial<Asset>) => {
    await api.post(`/assets/${id}/renew`, payload);
    await fetchAssets();
  };

  const fetchHistory = async (id: number) => {
    const { data } = await api.get(`/assets/${id}/history`);
    return data;
  };

  const fetchFiles = async (id: number) => {
    const { data } = await api.get(`/assets/${id}/files`);
    return data;
  };

  const uploadFiles = async (id: number, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const { data } = await api.post(`/assets/${id}/files`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await fetchAssets();
    return data;
  };

  return (
    <AssetsContext.Provider value={{ assets, loading, error, addAsset, updateAsset, deleteAsset, refetchAssets: fetchAssets, renewPolicy, fetchHistory, fetchFiles, uploadFiles }}>
      {children}
    </AssetsContext.Provider>
  );
}

export function useAssets() {
  const context = useContext(AssetsContext);
  if (context === undefined) {
    throw new Error('useAssets must be used within an AssetsProvider');
  }
  return context;
}

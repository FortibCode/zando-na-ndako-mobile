import { useCallback, useMemo, useState } from 'react';
import api, { DELIVERY_ENDPOINTS } from '@/services/api';
import type { DeliveryMission, DeliveryRevenue } from '@/types/delivery';

// ─── Hook: Missions ───
export function useMissions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missions, setMissions] = useState<DeliveryMission[]>([]);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(DELIVERY_ENDPOINTS.MISSIONS_DISPONIBLES);
      setMissions(
        (res.data.data || []).map((m: any) => ({
          id: m.commande_id,
          numero_commande: m.numero_commande,
          statut: 'disponible' as const,
          ...m,
        }))
      );
    } catch (err: any) {
      setError(err.message || 'Erreur chargement missions');
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({ missions, loading, error, fetchMissions: fetch }), [missions, loading, error, fetch]);
}

// ─── Hook: Revenue ───
export function useRevenue() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revenue, setRevenue] = useState<DeliveryRevenue | null>(null);

  const fetch = useCallback(async (mois?: number, annee?: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, number> = {};
      if (mois) params.mois = mois;
      if (annee) params.annee = annee;
const [res, histRes] = await Promise.all([
        api.get(DELIVERY_ENDPOINTS.REVENUS, { params }),
        api.get(DELIVERY_ENDPOINTS.HISTORIQUE),
      ]);
      const rawHist = Array.isArray(histRes.data.data) ? histRes.data.data : (histRes.data.data?.data ?? []);
      const historique = (rawHist || []).map((h: any) => ({
        id: h.id,
        numero_commande: h.commande?.numero_commande || h.numero_commande || '#ZN000000',
        montant: h.montant ?? 2000,
        statut: (h.statut_livraison === 'livree' ? 'terminee' : 'en_cours') as 'terminee' | 'en_cours',
        created_at: h.created_at,
        date_livraison: h.date_livraison,
        client_nom: h.client_nom,
        vendeur_nom: h.vendeur_nom,
        distance_parcourue: h.distance_parcourue,
      }));
      setRevenue({ ...res.data.data, historique });
    } catch (err: any) {
      setError(err.message || 'Erreur chargement revenus');
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({ revenue, loading, error, fetchRevenue: fetch }), [revenue, loading, error, fetch]);
}

// ─── Hook: Toggle Availability ───
export function useToggleAvailability() {
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const toggle = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post(DELIVERY_ENDPOINTS.DISPONIBILITE);
      setIsAvailable(res.data.statut === 'disponible');
    } catch {
      // keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({ isAvailable, loading, toggle }), [isAvailable, loading, toggle]);
}

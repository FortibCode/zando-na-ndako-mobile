import React, { createContext, useContext, useCallback, useMemo, useReducer, useRef, type ReactNode } from 'react';
import api, {
  DELIVERY_ENDPOINTS,
  clearAuthToken,
  setDeliveryUser,
  getDeliveryUser,
  onSessionChange,
  fetchDeliveryNavigation,
  fetchLivreurAvis,
  fetchSupportTickets,
  fetchSupportTicketDetail,
  ouvrirTicketSupport,
  repondreTicketSupport,
  appendFilePart,
  type ApiSupportTicket,
} from '@/services/api';
import { AppState } from 'react-native';
import type {
  DeliveryContextType,
  DeliveryState,
  DeliveryDriver,
  DeliveryMission,
  SupportMessage,
} from '@/types/delivery';

// Convertit un ticket support (description + fil de réponses) en messages de conversation :
// la description initiale du ticket EST le premier message ("driver"), les réponses suivent,
// et le sender est déduit de l'auteur réel (le livreur lui-même vs. un agent support/admin).
function ticketToSupportMessages(ticket: ApiSupportTicket, driverId?: string): SupportMessage[] {
  const messages: SupportMessage[] = [
    {
      id: `ticket_${ticket.id}`,
      text: ticket.description,
      sender: 'driver',
      timestamp: ticket.created_at,
      status: 'sent',
    },
  ];
  for (const reponse of ticket.reponses || []) {
    messages.push({
      id: reponse.id,
      text: reponse.message,
      sender: reponse.auteur_id === driverId ? 'driver' : 'support',
      timestamp: reponse.created_at,
      status: 'sent',
    });
  }
  return messages;
}

// ─── Initial State ───
const initialState: DeliveryState = {
  driver: null,
  isAuthenticated: false,
  dashboard: null,
  dashboardLoading: false,
  dashboardError: null,
  missions: [],
  missionsLoading: false,
  missionsError: null,
  currentMission: null,
  revenue: null,
  revenueLoading: false,
  revenueError: null,
  supportMessages: [],
  supportLoading: false,
  supportError: null,
  isAvailable: true,
  availabilityLoading: false,
  avis: null,
  avisLoading: false,
  avisError: null,
};

// ─── Reducer ───
function deliveryReducer(state: DeliveryState, action: any): DeliveryState {
  switch (action.type) {
    case 'SET_DRIVER':
      return { ...state, driver: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_DASHBOARD':
      return { ...state, dashboard: action.payload, dashboardLoading: false, dashboardError: null };
    case 'SET_DASHBOARD_LOADING':
      return { ...state, dashboardLoading: action.payload };
    case 'SET_DASHBOARD_ERROR':
      return { ...state, dashboardError: action.payload, dashboardLoading: false };
    case 'SET_MISSIONS':
      return { ...state, missions: action.payload, missionsLoading: false, missionsError: null };
    case 'SET_MISSIONS_LOADING':
      return { ...state, missionsLoading: action.payload };
    case 'SET_MISSIONS_ERROR':
      return { ...state, missionsError: action.payload, missionsLoading: false };
    case 'SET_CURRENT_MISSION':
      return { ...state, currentMission: action.payload };
    case 'MERGE_CURRENT_MISSION':
      return state.currentMission ? { ...state, currentMission: { ...state.currentMission, ...action.payload } } : state;
    case 'CLEAR_CURRENT_MISSION':
      return { ...state, currentMission: null };
    case 'SET_REVENUE':
      return { ...state, revenue: action.payload, revenueLoading: false, revenueError: null };
    case 'SET_REVENUE_LOADING':
      return { ...state, revenueLoading: action.payload };
    case 'SET_REVENUE_ERROR':
      return { ...state, revenueError: action.payload, revenueLoading: false };
    case 'SET_SUPPORT_MESSAGES':
      return { ...state, supportMessages: action.payload, supportLoading: false, supportError: null };
    case 'ADD_SUPPORT_MESSAGE': {
      const exists = state.supportMessages.find((m) => m.id === action.payload.id);
      return {
        ...state,
        supportMessages: exists ? state.supportMessages : [...state.supportMessages, action.payload],
        supportLoading: false,
      };
    }
    case 'UPDATE_SUPPORT_MESSAGE':
      return {
        ...state,
        supportMessages: state.supportMessages.map((m) =>
          m.id === action.payload.id ? { ...m, ...action.payload.changes } : m
        ),
      };
    case 'SET_SUPPORT_LOADING':
      return { ...state, supportLoading: action.payload };
    case 'SET_SUPPORT_ERROR':
      return { ...state, supportError: action.payload, supportLoading: false };
    case 'SET_AVAILABILITY':
      return { ...state, isAvailable: action.payload, availabilityLoading: false };
    case 'SET_AVAILABILITY_LOADING':
      return { ...state, availabilityLoading: action.payload };
    case 'SET_AVIS':
      return { ...state, avis: action.payload, avisLoading: false, avisError: null };
    case 'SET_AVIS_LOADING':
      return { ...state, avisLoading: action.payload };
    case 'SET_AVIS_ERROR':
      return { ...state, avisError: action.payload, avisLoading: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ─── Context ───
const DeliveryContext = createContext<DeliveryContextType | null>(null);

// ─── Provider ───
export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(deliveryReducer, initialState);
  // Le fil de support est porté par un seul ticket "actif" (POST /support/tickets pour l'ouvrir,
  // POST /support/tickets/{id}/repondre ensuite) — son id n'a pas besoin de déclencher de re-render.
  const activeTicketIdRef = useRef<string | null>(null);

  // ─── Dashboard ───
  const fetchDashboard = useCallback(async () => {
    dispatch({ type: 'SET_DASHBOARD_LOADING', payload: true });
    try {
      const [dashboardRes, userRes] = await Promise.all([
        api.get(DELIVERY_ENDPOINTS.DASHBOARD),
        api.get(DELIVERY_ENDPOINTS.USER_ME),
      ]);
      dispatch({ type: 'SET_DASHBOARD', payload: dashboardRes.data.data });

      const driverData = userRes.data.data as DeliveryDriver;
      dispatch({ type: 'SET_DRIVER', payload: driverData });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      dispatch({ type: 'SET_AVAILABILITY', payload: driverData.statut_disponibilite === 'disponible' });
      await setDeliveryUser(driverData);
    } catch (err: any) {
      dispatch({ type: 'SET_DASHBOARD_ERROR', payload: err.message || 'Erreur chargement tableau de bord' });
    }
  }, []);

  // ─── Missions ───
  const fetchMissions = useCallback(async () => {
    dispatch({ type: 'SET_MISSIONS_LOADING', payload: true });
    try {
      const res = await api.get(DELIVERY_ENDPOINTS.MISSIONS_DISPONIBLES);
      // Le backend renvoie `zone_vendeur` et `remuneration` (noms réels des champs) ; on les expose
      // aussi sous `vendeur_zone` / `montant_livraison` pour matcher le type mobile DeliveryMission —
      // un décalage de nom faisait lire une valeur toujours vide côté écrans de collecte/mission.
      const missions: DeliveryMission[] = res.data.data?.map((m: any) => ({
        id: m.commande_id,
        numero_commande: m.numero_commande,
        statut: 'disponible' as const,
        ...m,
        vendeur_zone: m.zone_vendeur ?? m.vendeur_zone,
        montant_livraison: m.remuneration ?? m.montant_livraison,
        gain: m.remuneration ?? m.montant_livraison,
      })) || [];
      dispatch({ type: 'SET_MISSIONS', payload: missions });
    } catch (err: any) {
      dispatch({ type: 'SET_MISSIONS_ERROR', payload: err.message || 'Erreur chargement missions' });
    }
  }, []);

  // ─── Polling temps réel des missions ───
  const { isAuthenticated } = state;
  React.useEffect(() => {
    if (!isAuthenticated) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    let active = true;

    const tick = async () => {
      if (!active) return;
      try {
        await fetchMissions();
      } catch {
        // polling silencieux
      }
    };

    tick();
    interval = setInterval(tick, 15000);

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') tick();
    });

    return () => {
      active = false;
      if (interval) clearInterval(interval);
      sub.remove();
    };
  }, [isAuthenticated, fetchMissions]);

  // ─── Accept Mission ───
  // Lève une erreur explicite en cas d'échec (ex: mission déjà prise par un autre livreur) plutôt
  // que de renvoyer silencieusement `false` — l'écran d'offre peut alors informer le livreur au lieu
  // de laisser le bouton "Accepter" ne rien faire.
  const acceptMission = useCallback(async (id: string): Promise<void> => {
    const res = await api.post(DELIVERY_ENDPOINTS.MISSION_ACCEPTER(id));
    const livraisonId = res.data?.data?.livraison_id;
    const mission = state.missions.find((m) => m.id === id) || null;
    if (mission) {
      const accepted: DeliveryMission = {
        ...mission,
        statut: 'acceptee',
        livraison_id: livraisonId ?? mission.livraison_id,
        commande_id: mission.commande_id ?? id,
      };
      dispatch({ type: 'SET_CURRENT_MISSION', payload: accepted });

      // Détails réels de l'itinéraire (adresse vendeur, distance/durée, montant réellement gagné) :
      // un échec ici ne doit pas annuler l'acceptation, la mission de base reste utilisable.
      try {
        const nav = await fetchDeliveryNavigation(id);
        dispatch({
          type: 'MERGE_CURRENT_MISSION',
          payload: {
            adresse_vendeur: nav.adresse_vendeur,
            distance_km: nav.distance_km ?? accepted.distance_km,
            duree_estimee_min: nav.duree_estimee_min ?? accepted.duree_estimee_min,
            montant_livraison: nav.montant_livraison ?? accepted.montant_livraison,
            beneficiaire_nom: nav.beneficiaire?.nom ?? accepted.beneficiaire_nom,
            beneficiaire_telephone: nav.beneficiaire?.telephone ?? accepted.beneficiaire_telephone,
            client_telephone: nav.beneficiaire?.telephone ?? accepted.client_telephone,
            methode_paiement: nav.methode_paiement ?? accepted.methode_paiement,
            montant_encaisser: nav.montant_a_encaisser ?? accepted.montant_encaisser,
            coordonneesVendeur: nav.coordonnees_gps_vendeur
              ? { latitude: nav.coordonnees_gps_vendeur.lat, longitude: nav.coordonnees_gps_vendeur.lng }
              : accepted.coordonneesVendeur,
            coordonneesLivraison: nav.coordonnees_gps
              ? { latitude: nav.coordonnees_gps.lat, longitude: nav.coordonnees_gps.lng }
              : accepted.coordonneesLivraison,
          },
        });
      } catch {
        // détails enrichis indisponibles : la mission de base reste affichée
      }
    }
    await fetchMissions();
  }, [state.missions, fetchMissions]);

  // ─── Refuse Mission ───
  // Décliner une offre est une opération sans conséquence côté backend (la mission n'a jamais été
  // assignée) : on l'appelle en best-effort et on ne bloque jamais la navigation dessus.
  const refuseMission = useCallback(async (id: string) => {
    try {
      await api.post(DELIVERY_ENDPOINTS.MISSION_REFUSER(id));
    } catch (err: any) {
      console.error('[DeliveryContext] Refuse mission error:', err.message);
    }
    await fetchMissions();
  }, [fetchMissions]);

  // ─── Confirm Collecte ───
  // Lit livraison_id depuis la mission en cours plutôt que de faire confiance à un id fourni par
  // l'écran appelant : chaque endpoint /livreur/livraisons/{id}/... attend l'id de la LIVRAISON,
  // pas celui de la commande — les écrans n'exposent que la commande, ce qui provoquait un 404.
  const confirmCollecte = useCallback(async () => {
    const livraisonId = state.currentMission?.livraison_id;
    if (!livraisonId) throw new Error('Aucune mission active.');
    try {
      await api.post(DELIVERY_ENDPOINTS.LIVRAISON_COLLECTE(livraisonId));
      dispatch({ type: 'MERGE_CURRENT_MISSION', payload: { statut: 'en_route' } });
      await fetchDashboard();
    } catch (err: any) {
      throw new Error(err.message || 'Erreur confirmation collecte');
    }
  }, [state.currentMission, fetchDashboard]);

  // ─── Confirm Depart vers client ───
  const confirmDepart = useCallback(async () => {
    const livraisonId = state.currentMission?.livraison_id;
    if (!livraisonId) throw new Error('Aucune mission active.');
    try {
      await api.post(DELIVERY_ENDPOINTS.LIVRAISON_DEPART(livraisonId));
      dispatch({ type: 'MERGE_CURRENT_MISSION', payload: { statut: 'en_route_client' } });
      await fetchDashboard();
    } catch (err: any) {
      throw new Error(err.message || 'Erreur confirmation départ');
    }
  }, [state.currentMission, fetchDashboard]);

  // ─── Confirm Livraison ───
  const confirmLivraison = useCallback(async (photo?: string) => {
    const livraisonId = state.currentMission?.livraison_id;
    if (!livraisonId) throw new Error('Aucune mission active.');
    try {
      const formData = new FormData();
      if (photo) {
        await appendFilePart(formData, 'photo_preuve', { uri: photo, type: 'image/jpeg' }, `preuve_${Date.now()}.jpg`);
      }
      await api.post(DELIVERY_ENDPOINTS.LIVRAISON_LIVRER(livraisonId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // La mission reste disponible (écran de récapitulatif) jusqu'à ce que le livreur quitte
      // l'écran de fin ; clearCurrentMission() est appelé explicitement à ce moment-là.
      dispatch({ type: 'MERGE_CURRENT_MISSION', payload: { statut: 'livree' } });
      await fetchDashboard();
    } catch (err: any) {
      throw new Error(err.message || 'Erreur confirmation livraison');
    }
  }, [state.currentMission, fetchDashboard]);

  // ─── Clear Current Mission (fin réelle du flux, appelé depuis l'écran de récapitulatif) ───
  const clearCurrentMission = useCallback(() => {
    dispatch({ type: 'CLEAR_CURRENT_MISSION' });
  }, []);

  // ─── Signaler Problème ───
  const signalerProbleme = useCallback(async (motif: string, categorie: string, photo?: string) => {
    const livraisonId = state.currentMission?.livraison_id;
    if (!livraisonId) throw new Error('Aucune mission active.');
    try {
      const formData = new FormData();
      formData.append('motif', `${categorie}: ${motif}`);
      if (photo) {
        await appendFilePart(formData, 'photo_incident', { uri: photo, type: 'image/jpeg' }, `incident_${Date.now()}.jpg`);
      }
      await api.post(DELIVERY_ENDPOINTS.LIVRAISON_PROBLEME(livraisonId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err: any) {
      throw new Error(err.message || 'Erreur envoi signalement');
    }
  }, [state.currentMission]);

  // ─── Revenue ───
  const fetchRevenue = useCallback(async (mois?: number, annee?: number) => {
    dispatch({ type: 'SET_REVENUE_LOADING', payload: true });
    try {
      const params: Record<string, number> = {};
      if (mois) params.mois = mois;
      if (annee) params.annee = annee;
      const res = await api.get(DELIVERY_ENDPOINTS.REVENUS, { params });

      // Fetch historique too
      const histRes = await api.get(DELIVERY_ENDPOINTS.HISTORIQUE);
      const rawHist = Array.isArray(histRes.data.data) ? histRes.data.data : (histRes.data.data?.data ?? []);
      const historique = (rawHist).map((h: any) => ({
        id: h.id,
        numero_commande: h.numero_commande || '#ZN000000',
        montant: h.montant ?? 0,
        // 'echouee' est un statut à part entière (livraison ratée) : le confondre avec 'en_cours'
        // affichait un incident comme une mission encore active.
        statut: h.statut_livraison === 'livree' ? 'terminee' as const
          : h.statut_livraison === 'echouee' ? 'echouee' as const
          : 'en_cours' as const,
        created_at: h.created_at,
        date_livraison: h.date_livraison,
        client_nom: h.client_nom,
        vendeur_nom: h.vendeur_nom,
        distance_parcourue: h.distance_parcourue,
      })) || [];

      dispatch({
        type: 'SET_REVENUE',
        payload: { ...res.data.data, historique },
      });
    } catch (err: any) {
      dispatch({ type: 'SET_REVENUE_ERROR', payload: err.message || 'Erreur chargement revenus' });
    }
  }, []);

  // ─── Avis reçus (notations clients laissées via /commandes/{id}/notation, exposées ici via /livreur/avis) ───
  const fetchAvis = useCallback(async () => {
    dispatch({ type: 'SET_AVIS_LOADING', payload: true });
    try {
      const resume = await fetchLivreurAvis();
      dispatch({ type: 'SET_AVIS', payload: resume });
    } catch (err: any) {
      dispatch({ type: 'SET_AVIS_ERROR', payload: err.message || 'Erreur chargement avis' });
    }
  }, []);

  // ─── Toggle Availability ───
  const toggleAvailability = useCallback(async () => {
    dispatch({ type: 'SET_AVAILABILITY_LOADING', payload: true });
    try {
      const res = await api.post(DELIVERY_ENDPOINTS.DISPONIBILITE);
      dispatch({ type: 'SET_AVAILABILITY', payload: res.data.statut === 'disponible' });
    } catch (err: any) {
      // L'échec restait auparavant totalement silencieux (le bouton "Passer en ligne" du tableau de
      // bord semblait "ne rien faire") : on relance l'erreur pour que l'écran appelant puisse
      // l'afficher, même convention que confirmCollecte/confirmDepart ci-dessus.
      dispatch({ type: 'SET_AVAILABILITY_LOADING', payload: false });
      throw new Error(err?.response?.data?.message || err.message || 'Impossible de mettre à jour votre disponibilité.');
    }
  }, []);

  // ─── Fetch Support Conversation ───
  // /api/support/tickets accepte déjà les rôles client/vendeur/livreur (même endpoint, scope par
  // request()->user()->id côté contrôleur) : on récupère le ticket le plus récent du livreur (index
  // renvoie déjà triés par created_at desc) et son détail (description + réponses) pour reconstituer
  // le fil — la conversation survit ainsi à un redémarrage de l'app au lieu de vivre en state local.
  const fetchSupportMessages = useCallback(async () => {
    dispatch({ type: 'SET_SUPPORT_LOADING', payload: true });
    try {
      const tickets = await fetchSupportTickets();
      if (tickets.length === 0) {
        activeTicketIdRef.current = null;
        dispatch({ type: 'SET_SUPPORT_MESSAGES', payload: [] });
        return;
      }
      const latest = tickets[0];
      activeTicketIdRef.current = latest.id;
      const detail = await fetchSupportTicketDetail(latest.id);
      dispatch({ type: 'SET_SUPPORT_MESSAGES', payload: ticketToSupportMessages(detail, state.driver?.id) });
    } catch (err: any) {
      dispatch({ type: 'SET_SUPPORT_ERROR', payload: err.message || 'Erreur chargement de la conversation' });
    }
  }, [state.driver]);

  // ─── Send Support Message ───
  // Premier message : ouvre un nouveau ticket (categorie 'livreur') via POST /support/tickets.
  // Messages suivants : POST /support/tickets/{id}/repondre sur le ticket actif. `repondre` ne
  // renvoie pas la réponse créée, donc on recharge le détail du ticket ensuite pour resynchroniser
  // le fil complet avec les id/horodatages réels du serveur (et faire disparaître le message
  // optimiste temporaire au profit de la version canonique).
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const tempId = `msg_${Date.now()}`;
    const optimistic: SupportMessage = {
      id: tempId,
      text: trimmed,
      sender: 'driver',
      timestamp: new Date().toISOString(),
      status: 'sending',
    };
    dispatch({ type: 'ADD_SUPPORT_MESSAGE', payload: optimistic });

    try {
      let ticketId = activeTicketIdRef.current;
      if (!ticketId) {
        const ticket = await ouvrirTicketSupport({
          categorie: 'livreur',
          sujet: trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed,
          description: trimmed,
        });
        ticketId = ticket.id;
        activeTicketIdRef.current = ticketId;
      } else {
        await repondreTicketSupport(ticketId, trimmed);
      }
      const detail = await fetchSupportTicketDetail(ticketId);
      dispatch({ type: 'SET_SUPPORT_MESSAGES', payload: ticketToSupportMessages(detail, state.driver?.id) });
    } catch (err: any) {
      dispatch({ type: 'UPDATE_SUPPORT_MESSAGE', payload: { id: tempId, changes: { status: 'failed' } } });
      dispatch({ type: 'SET_SUPPORT_ERROR', payload: err.message || "Erreur lors de l'envoi du message" });
    }
  }, [state.driver]);

  // ─── Logout ───
  const logout = useCallback(async () => {
    try {
      await api.post('/logout');
    } catch {
      // Ignore logout API errors
    }
    await clearAuthToken();
    dispatch({ type: 'RESET' });
  }, []);

  // ─── Initial load: try to restore session ───
  // Relancé à chaque connexion (voir onSessionChange dans services/api.ts), pas seulement au
  // montage : DeliveryProvider est monté une seule fois pour toute la durée de vie de l'app (voir
  // _layout.tsx), donc sans ça un changement de compte pendant que l'app tourne déjà laissait le
  // profil du livreur précédent affiché.
  const restoreSession = useCallback(async () => {
    const savedUser = await getDeliveryUser<DeliveryDriver>();
    if (savedUser) {
      dispatch({ type: 'SET_DRIVER', payload: savedUser });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      dispatch({ type: 'SET_AVAILABILITY', payload: savedUser.statut_disponibilite === 'disponible' });
    }
  }, []);

  React.useEffect(() => {
    restoreSession();
    return onSessionChange(restoreSession);
  }, [restoreSession]);

  // ─── Memoized value ───
  const value = useMemo<DeliveryContextType>(
    () => ({
      ...state,
      dispatch,
      fetchDashboard,
      fetchMissions,
      acceptMission,
      refuseMission,
      confirmCollecte,
      confirmDepart,
      confirmLivraison,
      clearCurrentMission,
      signalerProbleme,
      fetchRevenue,
      toggleAvailability,
      sendMessage,
      fetchSupportMessages,
      fetchAvis,
      logout,
    }),
    [
      state,
      fetchDashboard,
      fetchMissions,
      acceptMission,
      refuseMission,
      confirmCollecte,
      confirmDepart,
      confirmLivraison,
      clearCurrentMission,
      signalerProbleme,
      fetchRevenue,
      toggleAvailability,
      sendMessage,
      fetchSupportMessages,
      fetchAvis,
      logout,
    ]
  );

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

// ─── Hook ───
export function useDelivery(): DeliveryContextType {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
}

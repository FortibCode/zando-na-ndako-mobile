import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// En dev, Expo expose l'hôte réellement utilisé par le bundler Metro (LAN IP de la machine de dev)
// via `hostUri` — c'est la même machine qui fait tourner l'API Laravel en local. Sur un appareil
// physique (Expo Go / dev build via QR code), ni "localhost" ni "10.0.2.2" ne pointent vers cette
// machine : seule cette IP LAN fonctionne. Sans ça, TOUT appel réseau échouait silencieusement dès
// que l'app tournait sur un vrai téléphone (au lieu d'un simulateur/émulateur sur la même machine).
function resolveDevApiHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0]?.split('/')[0];
  if (!host) return null;
  // En mode `expo start --localhost`, hostUri vaut littéralement "localhost" : sur émulateur
  // Android, cet hôte ne pointe pas vers la machine hôte (contrairement à iOS/appareil physique) —
  // on garde alors le fallback historique 10.0.2.2 plutôt que d'utiliser cette valeur telle quelle.
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) return null;
  return host;
}

// Base URL - configurable via env, sinon déduite de l'hôte Metro (LAN), sinon fallback historique.
const LOCAL_API_HOST = resolveDevApiHost() || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${LOCAL_API_HOST}:8001/api`;
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// Construit l'URL publique d'un fichier stocké côté backend (ex: photo_produit).
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${STORAGE_BASE_URL}/storage/${path.replace(/^\/?storage\//, '')}`;
}

// Estimation affichée tant que la vraie zone de livraison (avec son frais_livraison_base réel)
// n'est pas encore chargée — jamais le montant réellement facturé, qui vient toujours du serveur
// à la validation de la commande. Centralisé ici : ce même nombre était recopié indépendamment
// dans 4 écrans (accueil, panier, créneau, paiement), au risque de diverger.
export const FALLBACK_DELIVERY_FEE = 800;

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: '@zando_auth_token',
  DELIVERY_USER: '@zando_delivery_user',
  USER: '@zando_user',
} as const;

// Create Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ─── Request Interceptor: Attach Auth Token ───
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[API] Failed to read auth token:', error);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 / Errors ───
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; success?: boolean }>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.DELIVERY_USER);
    }

    // Extract meaningful error message
    const message =
      error.response?.data?.message ||
      error.message ||
      'Une erreur réseau est survenue. Vérifiez votre connexion.';

    return Promise.reject(new ApiError(message, error.response?.status));
  }
);

// ─── Custom Error Class ───
export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ─── Token Management ───
export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

// ─── Signal de changement de session ───
// Les contextes de rôle (client/diaspora/vendeur/livreur, voir _layout.tsx) sont montés une seule
// fois pour toute la durée de vie de l'app et chargent leurs données au montage. Sans ce signal,
// une connexion à un AUTRE compte pendant que l'app tourne déjà ne rafraîchissait rien : l'écran
// continuait d'afficher l'identité et les données du compte précédent jusqu'au prochain
// redémarrage complet de l'app. Déclenché uniquement depuis login()/verifyOtp()/clearAuthToken()
// (changement réel d'identité), pas depuis setUser() elle-même (aussi appelée par de simples
// resynchronisations de cache comme fetchMe(), ce qui bouclerait avec les contextes qui y répondent).
type SessionListener = () => void;
const sessionListeners = new Set<SessionListener>();

export function onSessionChange(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

function notifySessionChange(): void {
  sessionListeners.forEach((listener) => listener());
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  await AsyncStorage.removeItem(STORAGE_KEYS.DELIVERY_USER);
  await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  notifySessionChange();
}

export async function setUser(user: LoginUser): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export async function getUser(): Promise<LoginUser | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return raw ? (JSON.parse(raw) as LoginUser) : null;
  } catch {
    return null;
  }
}

export async function setDeliveryUser(user: object): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.DELIVERY_USER, JSON.stringify(user));
}

export async function getDeliveryUser<T = object>(): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DELIVERY_USER);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// ─── Response Wrapper ───
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface LoginUser {
  id: string;
  nom?: string | null;
  prenom?: string | null;
  nom_complet: string;
  email: string;
  telephone: string;
  type_utilisateur: 'client' | 'vendeur' | 'livreur' | string;
  statut_compte: string;
  photo_profil?: string | null;
  devise_preferee?: string | null;
  pays_residence?: string | null;
  ville?: string | null;
  adresse?: string | null;
  date_naissance?: string | null;
  est_diaspora?: boolean | null;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data: {
    token: string;
    token_type: string;
    user: LoginUser;
  };
}

export type LocalClientSignupInput = {
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: 'homme' | 'femme';
  email?: string;
  telephone: string;
  mot_de_passe: string;
  ville: string;
  adresse: string;
};

export type SignupResponse = {
  success: boolean;
  message?: string;
  data: {
    user_id: string;
    telephone: string;
    otp_dev?: string;
  };
};

export async function registerLocalClient(input: LocalClientSignupInput): Promise<SignupResponse['data']> {
  const response = await api.post<SignupResponse>('/client/local/register', {
    ...input,
    type_utilisateur: 'client',
    est_diaspora: false,
    pays_residence: 'Congo-Brazzaville',
    consentement_cgu: true,
    mot_de_passe_confirmation: input.mot_de_passe,
  });

  return response.data.data;
}

export type DeliverySignupInput = {
  nom: string;
  prenom: string;
  date_naissance: string;
  email: string;
  telephone: string;
  mot_de_passe: string;
  pays_residence: string;
  adresse: string;
  type_vehicule: string;
  immatriculation: string;
};

export async function registerDeliveryDriver(input: DeliverySignupInput): Promise<SignupResponse['data']> {
  const response = await api.post<SignupResponse>('/register', {
    ...input,
    type_utilisateur: 'livreur',
    consentement_cgu: true,
    mot_de_passe_confirmation: input.mot_de_passe,
  });

  return response.data.data;
}

export type DiasporaClientSignupInput = {
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: 'homme' | 'femme';
  email: string;
  telephone: string;
  mot_de_passe: string;
  pays_residence: string;
  adresse: string;
  devise_preferee?: string;
};

export async function registerDiasporaClient(input: DiasporaClientSignupInput): Promise<SignupResponse['data']> {
  const response = await api.post<SignupResponse>('/client/diaspora/register', {
    ...input,
    type_utilisateur: 'client',
    est_diaspora: true,
    consentement_cgu: true,
    mot_de_passe_confirmation: input.mot_de_passe,
  });

  return response.data.data;
}

export type VendorSignupInput = {
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe?: 'homme' | 'femme';
  email: string;
  telephone: string;
  mot_de_passe: string;
  ville: string;
  adresse: string;
  nom_commerce?: string;
  categorie_principale?: string;
  zone_id?: string;
};

export async function registerVendor(input: VendorSignupInput): Promise<SignupResponse['data']> {
  const response = await api.post<SignupResponse>('/register', {
    ...input,
    type_utilisateur: 'vendeur',
    consentement_cgu: true,
    mot_de_passe_confirmation: input.mot_de_passe,
  });

  return response.data.data;
}


// ─── Adresses de livraison (Client) ───
export type DeliveryAddress = {
  id: string;
  client_id: string;
  label: string;
  nom_complet?: string | null;
  telephone?: string | null;
  ville: string;
  quartier?: string | null;
  adresse: string;
  coordonnees_gps?: { lat?: number; lng?: number } | null;
  instructions?: string | null;
  est_defaut: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DeliveryAddressInput = {
  label: string;
  nom_complet?: string;
  telephone?: string;
  ville?: string;
  quartier?: string;
  adresse: string;
  coordonnees_gps?: { lat?: number; lng?: number };
  instructions?: string;
  est_defaut?: boolean;
};

export const ADDRESS_ENDPOINTS = {
  LIST: '/client/adresses',
  CREATE: '/client/adresses',
  SHOW: (id: string) => `/client/adresses/${id}`,
  UPDATE: (id: string) => `/client/adresses/${id}`,
  DELETE: (id: string) => `/client/adresses/${id}`,
  SET_DEFAULT: (id: string) => `/client/adresses/${id}/default`,
} as const;

export async function fetchAddresses(): Promise<DeliveryAddress[]> {
  const response = await api.get<ApiResponse<DeliveryAddress[]>>(ADDRESS_ENDPOINTS.LIST);
  return response.data.data || [];
}

export async function createAddress(input: DeliveryAddressInput): Promise<DeliveryAddress> {
  const response = await api.post<ApiResponse<DeliveryAddress>>(ADDRESS_ENDPOINTS.CREATE, input);
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors de la création.');
  return response.data.data;
}

export async function updateAddress(id: string, input: Partial<DeliveryAddressInput>): Promise<DeliveryAddress> {
  const response = await api.put<ApiResponse<DeliveryAddress>>(ADDRESS_ENDPOINTS.UPDATE(id), input);
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors de la modification.');
  return response.data.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete<ApiResponse>(ADDRESS_ENDPOINTS.DELETE(id));
}

export async function setDefaultAddress(id: string): Promise<DeliveryAddress> {
  const response = await api.post<ApiResponse<DeliveryAddress>>(ADDRESS_ENDPOINTS.SET_DEFAULT(id));
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors de la mise à jour.');
  return response.data.data;
}

export async function login(credential: string, motDePasse: string): Promise<LoginUser> {
  const response = await api.post<LoginResponse>('/login', {
    credential: credential.trim(),
    mot_de_passe: motDePasse,
  });

const { token, user } = response.data.data;
  await setAuthToken(token);
  await setUser(user);

  if (user.type_utilisateur === 'livreur') {
    await setDeliveryUser(user);
  }

  notifySessionChange();
  return user;
}

// ─── Récupération du profil utilisateur connecté (backend) ───
export async function fetchMe(): Promise<LoginUser> {
  const response = await api.get<ApiResponse<LoginUser>>(DELIVERY_ENDPOINTS.USER_ME);
  if (!response.data.data) throw new ApiError('Profil introuvable.');
  const user = response.data.data;
  await setUser(user);
  return user;
}

// ─── Delivery API Endpoints ───
export const DELIVERY_ENDPOINTS = {
  DASHBOARD: '/livreur/dashboard',
  MISSIONS_DISPONIBLES: '/livreur/missions/disponibles',
  MISSION_ACCEPTER: (id: string) => `/livreur/missions/${id}/accepter`,
  MISSION_REFUSER: (id: string) => `/livreur/missions/${id}/refuser`,
  NAVIGATION: (id: string) => `/livreur/navigation/${id}`,
  POSITION: '/livreur/position',
LIVRAISON_COLLECTE: (id: string) => `/livreur/livraisons/${id}/collecte`,
  LIVRAISON_DEPART: (id: string) => `/livreur/livraisons/${id}/depart`,
  LIVRAISON_LIVRER: (id: string) => `/livreur/livraisons/${id}/livrer`,
  LIVRAISON_PROBLEME: (id: string) => `/livreur/livraisons/${id}/probleme`,
  DISPONIBILITE: '/livreur/disponibilite',
  REVENUS: '/livreur/revenus',
  RETRAITS: '/livreur/retraits',
  HISTORIQUE: '/livreur/historique',
  AVIS: '/livreur/avis',
  USER_ME: '/user/me',
} as const;

export interface DeliveryNavigationData {
  commande_id: string;
  numero_commande: string;
  adresse_vendeur: string;
  coordonnees_gps_vendeur?: { lat: number; lng: number } | null;
  adresse_livraison: string;
  coordonnees_gps?: { lat: number; lng: number } | null;
  distance_km?: number | null;
  duree_estimee_min?: number | null;
  montant_livraison: number;
  beneficiaire?: { nom: string; telephone: string } | null;
  methode_paiement?: string | null;
  montant_a_encaisser: number;
}

// Détails réels de la mission acceptée (adresse vendeur, distance/durée d'itinéraire, montant
// réellement gagné pour cette course) — remplace les valeurs approximatives côté mobile.
export async function fetchDeliveryNavigation(commandeId: string): Promise<DeliveryNavigationData> {
  const response = await api.get<ApiResponse<DeliveryNavigationData>>(DELIVERY_ENDPOINTS.NAVIGATION(commandeId));
  if (!response.data.data) throw new ApiError('Détails de navigation indisponibles.');
  return response.data.data;
}

export async function reportDeliveryPosition(livraisonId: string, latitude: number, longitude: number): Promise<void> {
  await api.post<ApiResponse>(DELIVERY_ENDPOINTS.POSITION, { livraison_id: livraisonId, latitude, longitude });
}

export interface DeliveryRetrait {
  id: string;
  montant: string | number;
  methode_retrait: string;
  numero_reception: string;
  statut: 'en_attente' | 'valide' | 'refuse';
  date_demande: string;
}

export async function demanderRetraitLivreur(input: { montant: number; methodeRetrait: 'mtn_momo' | 'airtel_money'; numeroReception: string }): Promise<DeliveryRetrait> {
  const response = await api.post<ApiResponse<DeliveryRetrait>>(DELIVERY_ENDPOINTS.RETRAITS, {
    montant: input.montant,
    methode_retrait: input.methodeRetrait,
    numero_reception: input.numeroReception,
  });
  if (!response.data.data) throw new ApiError(response.data.message || 'Impossible de soumettre la demande de retrait.');
  return response.data.data;
}

export async function fetchHistoriqueRetraitsLivreur(): Promise<DeliveryRetrait[]> {
  const response = await api.get<ApiResponse<{ data: DeliveryRetrait[] }> & { data: any }>(DELIVERY_ENDPOINTS.RETRAITS);
  const payload = response.data.data;
  return Array.isArray(payload) ? payload : payload?.data || [];
}

export async function fetchLivreurAvis(): Promise<ApiAvisResume> {
  const response = await api.get<ApiResponse<ApiAvisResume>>(DELIVERY_ENDPOINTS.AVIS);
  if (!response.data.data) throw new ApiError('Avis indisponibles.');
  return response.data.data;
}

// ─── OTP Endpoints ───
export async function sendOtp(credential: string, canal: 'sms' | 'email'): Promise<string> {
  const cleanId = canal === 'sms' ? credential.replace(/[^0-9]/g, '') : credential.trim();
  const response = await api.post<ApiResponse & { otp_dev?: string }>('/otp/send', {
    credential: cleanId,
    canal,
  });
  return response.data.otp_dev || '';
}

export interface OtpVerifyResult {
  token?: string;
  user?: LoginUser;
}

export async function verifyOtp(credential: string, code: string): Promise<OtpVerifyResult> {
  const cleanId = credential.includes('@') ? credential.trim() : credential.replace(/[^0-9]/g, '');
  try {
    const response = await api.post<ApiResponse & {
      data?: { token?: string; user?: LoginUser; compte_verifie?: boolean };
    }>('/otp/verify', { credential: cleanId, code });

    const data = response.data.data;
    if (data?.token) {
      await setAuthToken(data.token);
      if (data.user) {
        await setUser(data.user);
        if (data.user.type_utilisateur === 'livreur') {
          await setDeliveryUser(data.user);
        }
        notifySessionChange();
      }
    }
    return { token: data?.token, user: data?.user };
  } catch (error) {
    // Mode développement : si l'API est inaccessible (réseau/backend non démarré),
    // on utilise l'utilisateur stocké localement pour conserver le bon rôle.
    const httpStatus = (error as any)?.status;
    const isNetworkOrServerError = !httpStatus || httpStatus >= 500;
    if (isNetworkOrServerError) {
      const localUser = await getUser();
      if (localUser) {
        return { user: localUser };
      }
      // Aucun user local : retourner un objet spécial pour signaler le mode dev sans user
      return { __devMode: true } as any;
    }
    // Erreur réelle (401, 422, mauvais code OTP...) : on propage
    throw error;
  }
}

export async function resendOtp(credential: string, canal: 'sms' | 'email'): Promise<string> {
  const cleanId = canal === 'sms' ? credential.replace(/[^0-9]/g, '') : credential.trim();
  const response = await api.post<ApiResponse & { otp_dev?: string }>('/otp/resend', {
    credential: cleanId,
    canal,
  });
  return response.data.otp_dev || '';
}

// ─── Catalogue (produits & catégories) ───
export interface ApiProduit {
  id: string;
  categorie_id: string;
  vendeur_id: string;
  nom_produit: string;
  description: string | null;
  prix_unitaire: string | number;
  unite_mesure: string;
  quantite_stock: number;
  statut_disponibilite: 'disponible' | 'rupture';
  photo_produit: string | null;
  type_fraicheur: 'frais' | 'fume' | 'congele' | null;
  categorie?: { id: string; nom_categorie: string } | null;
  vendeur?: { id: string; nom_commerce: string; note_moyenne?: number | null } | null;
  promotions?: { id: string; titre: string; type_reduction: string; valeur_reduction: string | number }[];
}

export interface ApiCategorie {
  id: string;
  nom_categorie: string;
  icone: string | null;
  categorie_parente_id: string | null;
}

export async function fetchProduits(params?: { categorie?: string; search?: string }): Promise<ApiProduit[]> {
  const response = await api.get<ApiResponse<{ data: ApiProduit[] }> & { data: any }>('/produits', { params });
  // Réponse paginée Laravel : { success, data: { data: [...], current_page, ... } }
  const payload = response.data.data;
  return Array.isArray(payload) ? payload : payload?.data || [];
}

export async function fetchProduitsPopulaires(): Promise<ApiProduit[]> {
  const response = await api.get<ApiResponse<ApiProduit[]>>('/produits/populaires');
  return response.data.data || [];
}

export async function fetchProduitsRecents(): Promise<ApiProduit[]> {
  const response = await api.get<ApiResponse<ApiProduit[]>>('/produits/recents');
  return response.data.data || [];
}

export async function fetchProduitsPromotions(): Promise<ApiProduit[]> {
  const response = await api.get<ApiResponse<ApiProduit[]>>('/produits/promotions');
  return response.data.data || [];
}

export async function searchProduits(query: string): Promise<ApiProduit[]> {
  const response = await api.get<ApiResponse<ApiProduit[]>>('/produits/search', { params: { q: query } });
  return response.data.data || [];
}

export async function fetchProduitDetail(id: string): Promise<ApiProduit> {
  const response = await api.get<ApiResponse<ApiProduit>>(`/produits/${id}`);
  if (!response.data.data) throw new ApiError('Produit introuvable.');
  return response.data.data;
}

export async function fetchCategories(): Promise<ApiCategorie[]> {
  const response = await api.get<ApiResponse<ApiCategorie[]>>('/categories');
  return response.data.data || [];
}

// ─── Boutiques (parcours "boutique d'abord") ───
export interface ApiVendeur {
  id: string;
  nom_commerce: string;
  categorie_principale: string;
  note_moyenne: number;
  ville: string | null;
  photo_boutique: string | null;
  horaires_ouverture?: string | null;
  message_boutique?: string | null;
  statut_boutique?: 'ouverte' | 'pause' | 'fermee';
}

export async function fetchVendeurTypes(): Promise<string[]> {
  const response = await api.get<ApiResponse<string[]>>('/vendeurs/types');
  return response.data.data || [];
}

// Liste COMPLÈTE des types de boutique autorisés (pas seulement ceux déjà utilisés) — source
// unique pour tout formulaire qui choisit un type (inscription vendeur, édition profil), remplace
// les listes codées en dur précédemment dupliquées à plusieurs endroits.
export async function fetchVendeurTypesDisponibles(): Promise<string[]> {
  const response = await api.get<ApiResponse<string[]>>('/vendeurs/types-disponibles');
  return response.data.data || [];
}

export async function fetchVendeurs(params?: { type?: string; search?: string }): Promise<ApiVendeur[]> {
  const response = await api.get<ApiResponse<{ data: ApiVendeur[] }> & { data: any }>('/vendeurs', { params });
  const payload = response.data.data;
  return Array.isArray(payload) ? payload : payload?.data || [];
}

export async function fetchVendeurDetail(id: string): Promise<ApiVendeur> {
  const response = await api.get<ApiResponse<ApiVendeur>>(`/vendeurs/${id}`);
  if (!response.data.data) throw new ApiError('Boutique introuvable.');
  return response.data.data;
}

export async function fetchProduitsBoutique(vendeurId: string): Promise<ApiProduit[]> {
  const response = await api.get<ApiResponse<ApiProduit[]>>(`/vendeur/${vendeurId}/produits`);
  return response.data.data || [];
}

// ─── Zones de livraison ───
export interface ApiZone {
  id: string;
  nom_zone: string;
  ville: string;
  quartiers_couverts: string[];
  frais_livraison_base: string | number;
  delai_estime_min: number;
  delai_estime_max: number;
  statut_actif: boolean;
}

export async function fetchZones(): Promise<ApiZone[]> {
  const response = await api.get<ApiResponse<ApiZone[]>>('/zones');
  return response.data.data || [];
}

// ─── Panier (synchronisation avant commande) ───
export async function ajouterAuPanier(produitId: string, quantite: number): Promise<void> {
  await api.post<ApiResponse>('/panier/ajouter', { produit_id: produitId, quantite });
}

export async function viderPanier(): Promise<void> {
  await api.delete<ApiResponse>('/panier/vider');
}

export async function assignerBeneficiairePanier(beneficiaireId: string): Promise<void> {
  await api.post<ApiResponse>(`/panier/beneficiaire/${beneficiaireId}`);
}

// ─── Commandes ───
export interface CommandeInput {
  adresse_livraison: string;
  adresse_livraison_id?: string;
  zone_id: string;
  creneau_livraison_debut: string;
  creneau_livraison_fin: string;
  beneficiaire_id?: string;
  coordonnees_gps?: { lat: number; lng: number };
}

export interface CommandeResult {
  commande_id: string;
  numero_commande: string;
  montant_total: number;
  devise: string;
  statut: string;
}

export async function validerCommande(input: CommandeInput): Promise<CommandeResult> {
  const response = await api.post<ApiResponse<CommandeResult>>('/commandes/valider', input);
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors de la création de la commande.');
  return response.data.data;
}

export async function commanderPourProche(input: CommandeInput): Promise<CommandeResult> {
  const response = await api.post<ApiResponse<CommandeResult>>('/diaspora/commander', input);
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors de la création de la commande.');
  return response.data.data;
}

export interface ApiCommandeSuivi {
  numero_commande: string;
  statut_actuel: string;
  statut_label?: string;
  etapes: { code: string; label: string; fait: boolean }[];
  livreur?: { nom: string; telephone?: string | null } | null;
  derniere_position?: { lat: number; lng: number; date_heure?: string } | null;
  destination?: { lat: number; lng: number } | null;
}

export async function fetchClientCommandes(statut?: string): Promise<ApiCommande[]> {
  const response = await api.get<ApiResponse<{ data: ApiCommande[] }> & { data: any }>('/commandes', {
    params: statut ? { statut } : undefined,
  });
  const payload = response.data.data;
  return Array.isArray(payload) ? payload : payload?.data || [];
}

export async function fetchClientCommandeDetail(id: string): Promise<ApiCommande> {
  const response = await api.get<ApiResponse<ApiCommande>>(`/commandes/${id}`);
  if (!response.data.data) throw new ApiError('Commande introuvable.');
  return response.data.data;
}

export async function fetchClientCommandeSuivi(id: string): Promise<ApiCommandeSuivi> {
  const response = await api.get<ApiResponse<ApiCommandeSuivi>>(`/commandes/${id}/suivi`);
  if (!response.data.data) throw new ApiError('Suivi indisponible.');
  return response.data.data;
}

export async function annulerClientCommande(id: string, motif: string): Promise<void> {
  await api.post<ApiResponse>(`/commandes/${id}/annuler`, { motif });
}

// ─── Notations / Avis (commande livrée) ───
// Le client note le vendeur et/ou le livreur (cible obligatoire) ; le vendeur ou le livreur ne
// peuvent noter que le client de la commande (cible ignorée par le backend dans ce cas).
export interface ApiNotation {
  id: string;
  commande_id: string;
  notateur_id: string;
  type_notateur: 'client' | 'vendeur' | 'livreur';
  cible_id: string;
  type_cible: 'client' | 'vendeur' | 'livreur';
  note: number;
  commentaire: string | null;
  date_notation: string;
}

export async function fetchNotationsCommande(commandeId: string): Promise<ApiNotation[]> {
  const response = await api.get<ApiResponse<ApiNotation[]>>(`/commandes/${commandeId}/notations`);
  return response.data.data || [];
}

export async function noterCommande(
  commandeId: string,
  input: { note: number; commentaire?: string; cible?: 'vendeur' | 'livreur' }
): Promise<ApiNotation> {
  const response = await api.post<ApiResponse<ApiNotation>>(`/commandes/${commandeId}/notation`, input);
  if (!response.data.data) throw new ApiError(response.data.message || "Impossible d'envoyer votre avis.");
  return response.data.data;
}

export interface ApiAvisEntry {
  id: string;
  note: number;
  commentaire: string | null;
  date_notation: string;
  numero_commande?: string | null;
  client: { nom: string; photo: string | null } | null;
}

export interface ApiAvisResume {
  note_moyenne: number;
  nombre_avis: number;
  avis: ApiAvisEntry[];
}

export async function fetchVendeurAvis(): Promise<ApiAvisResume> {
  const response = await api.get<ApiResponse<ApiAvisResume>>('/vendeur/avis');
  if (!response.data.data) throw new ApiError('Avis indisponibles.');
  return response.data.data;
}

// ─── Paiements ───
export interface ApiPaiement {
  id: string;
  commande_id: string;
  methode: string;
  montant: number;
  devise: string;
  statut: string;
  reference_id?: string;
  external_id?: string;
  mode?: string;
}

export async function confirmerPaiementLivraison(commandeId: string): Promise<ApiPaiement> {
  const response = await api.post<ApiResponse<ApiPaiement>>('/payment/livraison/confirm', { commande_id: commandeId });
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur de paiement.');
  return response.data.data;
}

export async function initierCarteLocale(commandeId: string): Promise<ApiPaiement> {
  const response = await api.post<ApiResponse<ApiPaiement>>('/payment/carte-locale/init', { commande_id: commandeId });
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur de paiement.');
  return response.data.data;
}

export async function confirmerCarteLocale(paiementId: string, reference: string): Promise<void> {
  await api.post<ApiResponse>('/payment/carte-locale/confirm', { paiement_id: paiementId, reference });
}

export async function initierMtnMoMo(commandeId: string, telephone?: string): Promise<ApiPaiement> {
  const response = await api.post<ApiResponse<ApiPaiement>>('/payment/mtn-momo/init', {
    commande_id: commandeId,
    telephone,
  });
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur de paiement.');
  return response.data.data;
}

export interface MtnMomoConfirmResult {
  status: 'valide' | 'en_attente' | 'echoue';
  message: string;
  reason?: string;
}

// Interrogeable en polling — tant que le paiement n'a pas de statut définitif côté MTN, l'API
// renvoie status:'en_attente' (HTTP 200, ce n'est pas une erreur) plutôt que de valider par défaut.
export async function confirmerMtnMoMo(paiementId: string): Promise<MtnMomoConfirmResult> {
  const response = await api.post<ApiResponse & { status: MtnMomoConfirmResult['status']; reason?: string }>(
    '/payment/mtn-momo/confirm',
    { paiement_id: paiementId }
  );
  return {
    status: response.data.status,
    message: response.data.message || '',
    reason: response.data.reason,
  };
}

export async function initierAirtelMoney(commandeId: string): Promise<ApiPaiement> {
  const response = await api.post<ApiResponse<ApiPaiement>>('/payment/airtel-money/init', { commande_id: commandeId });
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur de paiement.');
  return response.data.data;
}

export async function confirmerAirtelMoney(paiementId: string, reference: string): Promise<void> {
  await api.post<ApiResponse>('/payment/airtel-money/confirm', { paiement_id: paiementId, reference });
}

export async function initierStripe(commandeId: string, successUrl: string, cancelUrl: string): Promise<{ url: string; session_id: string | null }> {
  const response = await api.post<ApiResponse & { data?: { url: string; session_id: string | null } }>('/payment/stripe/init', {
    commande_id: commandeId,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur de paiement.');
  return response.data.data;
}

export async function confirmerStripe(commandeId: string, sessionId: string): Promise<void> {
  await api.post<ApiResponse>('/payment/stripe/confirm', { commande_id: commandeId, session_id: sessionId });
}

export async function initierPayPal(commandeId: string, returnUrl: string, cancelUrl: string): Promise<{ url: string; order_id: string | null }> {
  const response = await api.post<ApiResponse & { data?: { url: string; order_id: string | null } }>('/payment/paypal/init', {
    commande_id: commandeId,
    return_url: returnUrl,
    cancel_url: cancelUrl,
  });
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur de paiement.');
  return response.data.data;
}

export async function confirmerPayPal(commandeId: string, paypalOrderId: string): Promise<void> {
  await api.post<ApiResponse>('/payment/paypal/confirm', { commande_id: commandeId, paypal_order_id: paypalOrderId });
}

// ─── Bénéficiaires diaspora ───
export interface ApiBeneficiaire {
  id: string;
  nom: string;
  telephone: string;
  ville: string | null;
  adresse: string;
  quartier: string;
  coordonnees_gps: { lat: number; lng: number } | null;
  instructions: string | null;
  relation: string | null;
  est_defaut: boolean;
}

export async function fetchBeneficiaires(): Promise<ApiBeneficiaire[]> {
  const response = await api.get<ApiResponse<ApiBeneficiaire[]>>('/diaspora/beneficiaires');
  return response.data.data || [];
}

export type BeneficiaireInputPayload = {
  nom: string;
  telephone: string;
  ville?: string;
  adresse: string;
  quartier: string;
  relation?: string;
  coordonnees_gps?: { lat: number; lng: number };
  instructions?: string;
  est_defaut?: boolean;
};

export async function createBeneficiaire(input: BeneficiaireInputPayload): Promise<ApiBeneficiaire> {
  const response = await api.post<ApiResponse<ApiBeneficiaire>>('/diaspora/beneficiaires', input);
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors de la création du bénéficiaire.');
  return response.data.data;
}

export async function updateBeneficiaire(id: string, input: Partial<BeneficiaireInputPayload>): Promise<ApiBeneficiaire> {
  const response = await api.put<ApiResponse<ApiBeneficiaire>>(`/diaspora/beneficiaires/${id}`, input);
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors de la mise à jour du bénéficiaire.');
  return response.data.data;
}

export async function deleteBeneficiaire(id: string): Promise<void> {
  await api.delete<ApiResponse>(`/diaspora/beneficiaires/${id}`);
}

export async function fetchDiasporaHistorique(): Promise<ApiCommande[]> {
  const response = await api.get<ApiResponse<{ data: ApiCommande[] }> & { data: any }>('/diaspora/historique');
  const payload = response.data.data;
  return Array.isArray(payload) ? payload : payload?.data || [];
}

export interface ApiDiasporaSuivi {
  numero_commande: string;
  statut: string;
  statut_label?: string;
  etapes: { code: string; label: string; fait: boolean }[];
  beneficiaire: { nom: string; adresse: string } | null;
  articles: number;
  derniere_position?: { lat: number; lng: number; date_heure?: string } | null;
}

// Suivi public d'une commande diaspora par son numéro (pas d'auth requise, endpoint fait pour être partagé).
export async function fetchDiasporaSuivi(numeroCommande: string): Promise<ApiDiasporaSuivi> {
  const response = await api.get<ApiResponse<ApiDiasporaSuivi>>(`/diaspora/suivi/${numeroCommande}`);
  if (!response.data.data) throw new ApiError(response.data.message || 'Suivi indisponible.');
  return response.data.data;
}

export interface ApiConversionDevise {
  montant_source: number;
  devise_source: string;
  montant_converti: number;
  devise_cible: string;
  taux_applique: number;
  date_taux?: string;
}

// Convertit un montant dans une devise étrangère (USD/EUR/GBP/CAD) vers le FCFA, au taux réel du jour.
export async function convertirDevise(montant: number, deviseSource: 'USD' | 'EUR' | 'GBP' | 'CAD'): Promise<ApiConversionDevise> {
  const response = await api.post<ApiResponse<ApiConversionDevise>>('/diaspora/convertir', {
    montant, devise_source: deviseSource,
  });
  if (!response.data.data) throw new ApiError(response.data.message || 'Conversion indisponible.');
  return response.data.data;
}

// ─── Partage du panier (diaspora) ───
export async function sharePanier(): Promise<{ lien: string; token: string }> {
  const response = await api.post<ApiResponse & { lien?: string; token?: string }>('/panier/partager');
  return { lien: response.data.lien || '', token: response.data.token || '' };
}

// ─── Récupération de mot de passe ───
export async function forgotPassword(credential: string): Promise<string> {
  const cleanId = credential.includes('@') ? credential.trim() : credential.replace(/[^0-9]/g, '');
  const response = await api.post<ApiResponse & { otp_dev?: string }>('/forgot-password', {
    credential: cleanId,
  });
  return response.data.otp_dev || '';
}

export async function resetPassword(
  credential: string,
  code: string,
  nouveauMotDePasse: string
): Promise<void> {
  const cleanId = credential.includes('@') ? credential.trim() : credential.replace(/[^0-9]/g, '');
  await api.post<ApiResponse>('/reset-password', {
    credential: cleanId,
    code,
    nouveau_mot_de_passe: nouveauMotDePasse,
    nouveau_mot_de_passe_confirmation: nouveauMotDePasse,
  });
}

// FormData multipart : sur natif, l'objet {uri,name,type} est la convention React Native pour
// joindre un fichier. Un vrai navigateur (cible Web) ne la comprend pas — FormData.append() y
// attend un Blob/File, sinon la valeur est simplement convertie en chaîne "[object Object]", que
// Laravel rejette avec "Le champ photo doit être une image." On récupère donc le vrai blob via
// fetch(uri) sur le web (uri y est un blob:/data: local, pas une requête réseau externe).
export async function appendFilePart(
  form: FormData,
  field: string,
  file: { uri: string; fileName?: string | null; type?: string | null },
  fallbackName: string
): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(file.uri)).blob();
    form.append(field, blob, file.fileName || fallbackName);
  } else {
    form.append(field, {
      uri: file.uri,
      name: file.fileName || fallbackName,
      type: file.type || 'image/jpeg',
    } as any);
  }
}

// ─── Photo de profil & Mise à jour utilisateur ───
// L'endpoint renvoie `photo_url` à la racine de la réponse (pas sous `data`) : lire
// `response.data.data?.photo_url` renvoyait toujours vide même quand l'upload avait réussi côté
// serveur. `resolveMediaUrl` normalise ensuite le chemin relatif renvoyé en URL absolue affichable.
export async function uploadUserPhoto(photo: { uri: string; fileName?: string | null; type?: string | null }): Promise<string> {
  const form = new FormData();
  await appendFilePart(form, 'photo', photo, `photo_${Date.now()}.jpg`);
  const response = await api.post<ApiResponse & { photo_url?: string }>('/user/upload-photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return resolveMediaUrl(response.data.photo_url) || '';
}

export async function updateUserProfile(input: Partial<{
  nom: string;
  prenom: string;
  ville: string;
  adresse: string;
  email: string;
  date_naissance: string;
  langue_preferee: 'francais' | 'lingala' | 'anglais';
  devise_preferee: 'FCFA' | 'USD' | 'EUR' | 'GBP';
  pays_residence: string;
}>): Promise<LoginUser> {
  const response = await api.put<ApiResponse<LoginUser>>('/user/profile', input);
  return response.data.data!;
}

export async function changePassword(input: { ancienMotDePasse: string; nouveauMotDePasse: string }): Promise<void> {
  const response = await api.post<ApiResponse>('/user/change-password', {
    ancien_mot_de_passe: input.ancienMotDePasse,
    nouveau_mot_de_passe: input.nouveauMotDePasse,
    nouveau_mot_de_passe_confirmation: input.nouveauMotDePasse,
  });
  if (!response.data.success) throw new ApiError(response.data.message || 'Impossible de changer le mot de passe.');
}

export async function deleteAccount(motDePasse: string): Promise<void> {
  const response = await api.delete<ApiResponse>('/user/delete', { data: { mot_de_passe: motDePasse } });
  if (!response.data.success) throw new ApiError(response.data.message || 'Impossible de supprimer le compte.');
}

// ─── Notifications utilisateur ───
export type UserNotification = {
  id: string;
  titre: string;
  message: string;
  type: string;
  statut_lecture: boolean;
  created_at: string;
};

export async function fetchNotifications(): Promise<UserNotification[]> {
  const response = await api.get<ApiResponse<{ data: UserNotification[]; non_lues?: number }>>('/user/notifications');
  const payload = response.data.data;
  if (Array.isArray(payload)) return payload;
  return (payload as any)?.data || [];
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post<ApiResponse>(`/user/notifications/${id}/lire`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post<ApiResponse>('/user/notifications/lire-tout');
}

// ─── Vendeur (tableau de bord, produits, commandes) ───
export interface ApiVendeurDashboard {
  nom_commerce?: string | null;
  solde_disponible: string | number;
  note_moyenne: string | number;
  statut_validation: string;
  // Champs exposés par dashboard() en plus des statistiques : c'est l'appel de chargement initial
  // du contexte vendeur mobile, donc le seul endroit d'où hydrater l'état réel de la boutique
  // (statut ouverte/pause/fermée, horaires, coordonnées de paiement, documents KYC) au démarrage.
  statut_boutique?: 'ouverte' | 'pause' | 'fermee';
  horaires_ouverture?: string | null;
  numero_mobile_money_reception?: string | null;
  photo_boutique?: string | null;
  document_identite?: string | null;
  registre_commerce?: string | null;
  commandes_aujourd_hui: number;
  commandes_en_cours: number;
  commandes_livrees: number;
  total_produits: number;
  produits_disponibles: number;
  produits_rupture: number;
  revenus_mois: string | number;
}

export async function fetchVendeurDashboard(): Promise<ApiVendeurDashboard> {
  const response = await api.get<ApiResponse<ApiVendeurDashboard>>('/vendeur/dashboard');
  if (!response.data.data) throw new ApiError('Tableau de bord indisponible.');
  return response.data.data;
}

// Nom de la boutique, position GPS du point de collecte (sert au calcul du prix de livraison à la
// distance réelle parcourue par le livreur), coordonnées de paiement mobile money et horaires
// d'ouverture (chaîne libre, ex: "Lun-Ven 08:00-18:00, Sam 09:00-13:00, Dim Fermé").
export async function updateVendeurProfil(input: Partial<{
  nom_commerce: string;
  coordonnees_gps: { lat: number; lng: number };
  numero_mobile_money_reception: string;
  horaires_ouverture: string;
}>): Promise<void> {
  const response = await api.put<ApiResponse>('/vendeur/profil', input);
  if (!response.data.success) throw new ApiError(response.data.message || 'Impossible de mettre à jour le profil boutique.');
}

// PUT /vendeur/statut-boutique — contrairement au reste du profil, ce champ conditionne réellement
// la réception de nouvelles commandes côté serveur (voir CommandeController::valider) : "pause" et
// "fermee" bloquent désormais la validation d'une commande pour ce vendeur.
export async function updateStatutBoutiqueVendeur(statut: 'ouverte' | 'pause' | 'fermee'): Promise<void> {
  const response = await api.put<ApiResponse>('/vendeur/statut-boutique', { statut_boutique: statut });
  if (!response.data.success) throw new ApiError(response.data.message || 'Impossible de mettre à jour le statut de la boutique.');
}

// ─── Documents KYC du vendeur (photo boutique, pièce d'identité, registre de commerce) ───
export type VendeurDocumentKey = 'photo_boutique' | 'document_identite' | 'registre_commerce';

export async function uploaderDocumentsVendeur(
  docs: Partial<Record<VendeurDocumentKey, { uri: string; fileName?: string | null; type?: string | null }>>
): Promise<Partial<Record<VendeurDocumentKey, string | null>>> {
  const form = new FormData();
  for (const key of Object.keys(docs) as VendeurDocumentKey[]) {
    const file = docs[key];
    if (!file?.uri) continue;
    await appendFilePart(form, key, file, `${key}_${Date.now()}.jpg`);
  }
  const response = await api.post<ApiResponse<Partial<Record<VendeurDocumentKey, string | null>>>>('/vendeur/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!response.data.success) throw new ApiError(response.data.message || "Erreur lors de l'envoi des documents.");
  return response.data.data || {};
}

export interface ApiCommandeLigne {
  id: string;
  quantite: number;
  prix_unitaire: string | number;
  sous_total: string | number;
  produit?: { id: string; nom_produit: string; photo_produit: string | null } | null;
}

export interface ApiCommande {
  id: string;
  numero_commande: string;
  statut_commande: 'confirmee' | 'achat_marche' | 'preparation' | 'en_route' | 'en_route_client' | 'livree' | 'annulee';
  montant_sous_total: string | number;
  frais_livraison: string | number;
  montant_total: string | number;
  adresse_livraison: string;
  motif_annulation?: string | null;
  date_commande?: string;
  created_at?: string;
  client?: { id: string; user?: { nom_complet: string; telephone: string } | null } | null;
  lignes?: ApiCommandeLigne[];
  paiement?: { methode?: string | null; statut?: string | null; reference?: string | null } | null;
  vendeur?: { id?: string; nom_commerce?: string | null; user?: { nom_complet: string; telephone: string } | null } | null;
  livreur?: { id?: string; user?: { nom_complet: string; telephone: string } | null; vehicule?: string | null; note_moyenne?: number | null } | null;
  litige?: { id: string; numero: string | null; statut: string } | null;
  // Notations déjà laissées par CE client pour cette commande (voir CommandeController::index /
  // DiasporaController::historique) — permet de savoir si une commande livrée reste "à noter"
  // sans requête supplémentaire par commande.
  notations?: { type_cible: 'vendeur' | 'livreur'; note: number }[];
}

export type ApiVendeurCommandesPage = { commandes: ApiCommande[]; currentPage: number; lastPage: number };

export async function fetchVendeurCommandes(params?: { statut?: string; page?: number }): Promise<ApiVendeurCommandesPage> {
  const response = await api.get<ApiResponse<{ data: ApiCommande[]; current_page?: number; last_page?: number }> & { data: any }>('/vendeur/commandes', {
    params: { statut: params?.statut, page: params?.page },
  });
  const payload = response.data.data;
  if (Array.isArray(payload)) return { commandes: payload, currentPage: 1, lastPage: 1 };
  return {
    commandes: payload?.data || [],
    currentPage: payload?.current_page || 1,
    lastPage: payload?.last_page || 1,
  };
}

export async function fetchVendeurCommandeDetail(id: string): Promise<ApiCommande> {
  const response = await api.get<ApiResponse<ApiCommande>>(`/vendeur/commandes/${id}`);
  if (!response.data.data) throw new ApiError('Commande introuvable.');
  return response.data.data;
}

export async function accepterCommandeVendeur(id: string): Promise<void> {
  await api.post<ApiResponse>(`/vendeur/commandes/${id}/accepter`);
}

export async function refuserCommandeVendeur(id: string, motif: string): Promise<void> {
  await api.post<ApiResponse>(`/vendeur/commandes/${id}/refuser`, { motif });
}

export async function fetchVendeurProduits(): Promise<ApiProduit[]> {
  const response = await api.get<ApiResponse<{ data: ApiProduit[] }> & { data: any }>('/vendeur/produits');
  const payload = response.data.data;
  return Array.isArray(payload) ? payload : payload?.data || [];
}

export type VendeurProduitInput = {
  nom_produit: string;
  description?: string;
  categorie_id: string;
  prix_unitaire: number;
  unite_mesure: string;
  quantite_stock: number;
  type_fraicheur?: 'frais' | 'fume' | 'congele';
  photo?: { uri: string; fileName?: string | null; type?: string | null } | null;
};

export async function ajouterProduitVendeur(input: VendeurProduitInput): Promise<ApiProduit> {
  const form = new FormData();
  form.append('nom_produit', input.nom_produit);
  if (input.description) form.append('description', input.description);
  form.append('categorie_id', input.categorie_id);
  form.append('prix_unitaire', String(input.prix_unitaire));
  form.append('unite_mesure', input.unite_mesure);
  form.append('quantite_stock', String(input.quantite_stock));
  if (input.type_fraicheur) form.append('type_fraicheur', input.type_fraicheur);
  if (input.photo?.uri) {
    await appendFilePart(form, 'photo', input.photo, `produit_${Date.now()}.jpg`);
  }
  const response = await api.post<ApiResponse<ApiProduit>>('/vendeur/produits', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors de la création du produit.');
  return response.data.data;
}

export async function modifierProduitVendeur(id: string, input: Partial<{
  nom_produit: string; description: string; prix_unitaire: number; unite_mesure: string; type_fraicheur: string;
}>): Promise<ApiProduit> {
  const response = await api.put<ApiResponse<ApiProduit>>(`/vendeur/produits/${id}`, input);
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors de la mise à jour.');
  return response.data.data;
}

export async function supprimerProduitVendeur(id: string): Promise<void> {
  await api.delete<ApiResponse>(`/vendeur/produits/${id}`);
}

export async function gererStockVendeur(id: string, quantite: number, operation: 'ajouter' | 'definir'): Promise<number> {
  const response = await api.post<ApiResponse & { nouveau_stock?: number }>(`/vendeur/produits/${id}/stock`, { quantite, operation });
  return response.data.nouveau_stock ?? quantite;
}

export async function signalerRuptureVendeur(id: string): Promise<void> {
  await api.post<ApiResponse>(`/vendeur/produits/${id}/rupture`);
}

export interface ApiVendeurRevenus {
  solde_disponible: string | number;
  revenus_bruts: string | number;
  commissions: string | number;
  revenus_nets: string | number;
  mois: number;
  annee: number;
  panier_moyen?: string | number;
  ventes_semaine?: { jour: string; montant: string | number }[];
  commandes_semaine?: number;
  produits_plus_vendus?: { nom: string; ventes: number }[];
  // Valeur actuelle du réglage admin (retrait_montant_minimum) — remplace le seuil "1000" codé en
  // dur côté mobile, qui restait figé si l'admin changeait ce réglage.
  retrait_montant_minimum?: number;
}

export async function fetchVendeurRevenus(mois?: number, annee?: number): Promise<ApiVendeurRevenus> {
  const response = await api.get<ApiResponse<ApiVendeurRevenus>>('/vendeur/revenus', { params: { mois, annee } });
  if (!response.data.data) throw new ApiError('Revenus indisponibles.');
  return response.data.data;
}

export interface ApiVendeurRetrait {
  id: string;
  vendeur_id: string;
  montant: string | number;
  methode_retrait: string;
  numero_reception: string;
  statut: 'en_attente' | 'valide' | 'rejete';
  date_demande: string;
  created_at?: string;
}

export async function demanderRetraitVendeur(input: {
  montant: number;
  methode_retrait: 'mtn_momo' | 'airtel_money' | 'virement';
  numero_reception: string;
}): Promise<ApiVendeurRetrait> {
  const response = await api.post<ApiResponse<ApiVendeurRetrait>>('/vendeur/retraits', input);
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors de la demande de retrait.');
  return response.data.data;
}

export async function fetchHistoriqueRetraitsVendeur(): Promise<ApiVendeurRetrait[]> {
  const response = await api.get<ApiResponse<{ data: ApiVendeurRetrait[] }> & { data: any }>('/vendeur/retraits');
  const payload = response.data.data;
  return Array.isArray(payload) ? payload : payload?.data || [];
}

// ─── Promotions vendeur (self-service, distinct de la bannière marketing /produits/promotions) ───
export interface ApiPromotionVendeur {
  id: string;
  vendeur_id: string;
  produit_id: string | null;
  titre: string;
  description: string | null;
  type_reduction: 'pourcentage' | 'montant_fixe';
  valeur_reduction: string | number;
  date_debut: string;
  date_fin: string | null;
  actif: boolean;
  created_at?: string;
  produit?: { id: string; nom_produit: string } | null;
}

export async function fetchPromotionsVendeur(): Promise<ApiPromotionVendeur[]> {
  const response = await api.get<ApiResponse<{ data: ApiPromotionVendeur[] }> & { data: any }>('/vendeur/promotions');
  const payload = response.data.data;
  return Array.isArray(payload) ? payload : payload?.data || [];
}

export async function creerPromotionVendeur(input: {
  titre: string;
  produit_id?: string | null;
  valeur_reduction: number;
  type_reduction?: 'pourcentage' | 'montant_fixe';
  date_debut?: string;
  date_fin?: string | null;
}): Promise<ApiPromotionVendeur> {
  const response = await api.post<ApiResponse<ApiPromotionVendeur>>('/vendeur/promotions', input);
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors de la création de la promotion.');
  return response.data.data;
}

export async function modifierPromotionVendeur(id: string, input: Partial<{
  titre: string; valeur_reduction: number; type_reduction: 'pourcentage' | 'montant_fixe';
  date_debut: string; date_fin: string | null; actif: boolean;
}>): Promise<ApiPromotionVendeur> {
  const response = await api.patch<ApiResponse<ApiPromotionVendeur>>(`/vendeur/promotions/${id}`, input);
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors de la mise à jour de la promotion.');
  return response.data.data;
}

export async function supprimerPromotionVendeur(id: string): Promise<void> {
  await api.delete<ApiResponse>(`/vendeur/promotions/${id}`);
}

// ─── Messagerie Vendeur / Admin ───
export interface ApiVendeurMessage {
  id: string;
  vendeur_id: string;
  expediteur: 'vendeur' | 'admin';
  objet: string;
  contenu: string;
  statut_lecture: boolean;
  created_at: string;
}

export async function fetchVendeurMessages(): Promise<ApiVendeurMessage[]> {
  const response = await api.get<ApiResponse<{ data: ApiVendeurMessage[] }> & { data: any }>('/vendeur/messages');
  const payload = response.data.data;
  return Array.isArray(payload) ? payload : payload?.data || [];
}

export async function envoyerMessageVendeur(objet: string, contenu: string): Promise<ApiVendeurMessage> {
  const response = await api.post<ApiResponse<ApiVendeurMessage>>('/vendeur/messages', { objet, contenu });
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors de l\'envoi du message.');
  return response.data.data;
}

export async function marquerMessageVendeurLu(id: string): Promise<void> {
  await api.post<ApiResponse>(`/vendeur/messages/${id}/lu`);
}

export interface ApiVendeurMessageThread extends ApiVendeurMessage {
  reponses?: ApiVendeurMessage[];
}

export async function fetchVendeurMessageDetail(id: string): Promise<ApiVendeurMessageThread> {
  const response = await api.get<ApiResponse<ApiVendeurMessageThread>>(`/vendeur/messages/${id}`);
  if (!response.data.data) throw new ApiError(response.data.message || 'Erreur lors du chargement du fil.');
  return response.data.data;
}

export async function repondreMessageVendeur(id: string, contenu: string): Promise<ApiVendeurMessage> {
  const response = await api.post<ApiResponse<ApiVendeurMessage>>(`/vendeur/messages/${id}/repondre`, { contenu });
  if (!response.data.data) throw new ApiError(response.data.message || "Erreur lors de l'envoi de la réponse.");
  return response.data.data;
}

// ─── Messagerie liée à une commande (client / vendeur / livreur) ───
export interface ApiMessageCommande {
  id: string;
  commande_id: string;
  expediteur_user_id: string;
  contenu: string;
  lu: boolean;
  created_at: string;
  expediteur?: { id: string; nom: string; prenom: string; photo_profil?: string | null; type_utilisateur?: string } | null;
}

export async function fetchMessagesCommande(commandeId: string): Promise<ApiMessageCommande[]> {
  const response = await api.get<ApiResponse<ApiMessageCommande[]>>(`/commandes/${commandeId}/messages`);
  return Array.isArray(response.data.data) ? response.data.data : [];
}

export async function envoyerMessageCommande(commandeId: string, contenu: string): Promise<ApiMessageCommande> {
  const response = await api.post<ApiResponse<ApiMessageCommande>>(`/commandes/${commandeId}/messages`, { contenu });
  if (!response.data.data) throw new ApiError(response.data.message || "Erreur lors de l'envoi du message.");
  return response.data.data;
}

// ─── Litiges (réclamations client/vendeur, arbitrées par l'administrateur) ───

export type LitigeSenderType = 'client' | 'vendeur' | 'admin' | 'system';
export type LitigeStatut =
  | 'ouvert' | 'attente_vendeur' | 'attente_client' | 'en_cours' | 'escalade'
  | 'resolu' | 'rejete' | 'annule';
// Liste des codes valides chargée depuis le backend (App\Models\LitigeMotif, gérée par un admin
// via /admin/litige-motifs) — remplace l'ancienne union de 9 valeurs codées en dur ici
// indépendamment du backend (LitigeController::MOTIFS) et du web (LITIGE_MOTIFS), qui pouvaient
// diverger silencieusement.
export type LitigeMotif = string;

export interface ApiLitigeMotif {
  code: string;
  libelle: string;
}

// GET /api/litiges/motifs
export async function fetchLitigeMotifs(): Promise<ApiLitigeMotif[]> {
  const response = await api.get<ApiResponse<ApiLitigeMotif[]>>('/litiges/motifs');
  return response.data.data || [];
}

export interface ApiLitigePieceJointe {
  id: string;
  litige_id: string;
  message_id: string | null;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'video' | 'document' | null;
  created_at: string;
}

export interface ApiLitigeMessage {
  id: string;
  litige_id: string;
  sender_type: LitigeSenderType;
  message: string;
  est_note_interne: boolean;
  created_at: string;
  user?: { id: string; nom: string; prenom: string; photo_profil?: string | null } | null;
  pieces_jointes?: ApiLitigePieceJointe[];
}

export interface ApiLitigeDecision {
  id: string;
  decision_type: string;
  reason: string;
  amount: string | number | null;
  currency: string | null;
  created_at: string;
}

export interface ApiLitigeRemboursement {
  id: string;
  montant: string | number;
  devise: string;
  statut: 'en_attente' | 'en_traitement' | 'termine' | 'echoue' | 'annule';
  created_at: string;
}

export interface ApiLitige {
  id: string;
  numero: string | null;
  commande_id: string;
  motif: LitigeMotif | string;
  description: string;
  decision: string | null;
  statut: LitigeStatut;
  date_ouverture: string;
  date_resolution: string | null;
  commande?: { id: string; numero_commande: string; montant_total: string | number } | null;
  messages?: ApiLitigeMessage[];
  pieces_jointes?: ApiLitigePieceJointe[];
  decisions?: ApiLitigeDecision[];
  remboursements?: ApiLitigeRemboursement[];
}

function unwrapPaginated<T>(payload: any): T[] {
  return Array.isArray(payload) ? payload : payload?.data || [];
}

// POST /api/commandes/{id}/litige — ouverture d'un litige côté client.
export async function ouvrirLitige(commandeId: string, motif: LitigeMotif, description: string): Promise<ApiLitige> {
  const response = await api.post<ApiResponse<ApiLitige>>(`/commandes/${commandeId}/litige`, { motif, description });
  if (!response.data.data) throw new ApiError(response.data.message || "Erreur lors de l'ouverture du litige.");
  return response.data.data;
}

export async function fetchClientLitiges(): Promise<ApiLitige[]> {
  const response = await api.get<ApiResponse<any>>('/client/litiges');
  return unwrapPaginated<ApiLitige>(response.data.data);
}

export async function fetchClientLitigeDetail(id: string): Promise<ApiLitige> {
  const response = await api.get<ApiResponse<ApiLitige>>(`/client/litiges/${id}`);
  if (!response.data.data) throw new ApiError('Litige introuvable.');
  return response.data.data;
}

export async function fetchVendeurLitiges(): Promise<ApiLitige[]> {
  const response = await api.get<ApiResponse<any>>('/vendeur/litiges');
  return unwrapPaginated<ApiLitige>(response.data.data);
}

export async function fetchVendeurLitigeDetail(id: string): Promise<ApiLitige> {
  const response = await api.get<ApiResponse<ApiLitige>>(`/vendeur/litiges/${id}`);
  if (!response.data.data) throw new ApiError('Litige introuvable.');
  return response.data.data;
}

// GET/POST /api/litiges/{id}/messages — fil partagé client/vendeur/admin (rôle résolu côté API).
export async function fetchLitigeMessages(litigeId: string): Promise<ApiLitigeMessage[]> {
  const response = await api.get<ApiResponse<ApiLitigeMessage[]>>(`/litiges/${litigeId}/messages`);
  return Array.isArray(response.data.data) ? response.data.data : [];
}

export async function envoyerMessageLitige(litigeId: string, message: string): Promise<ApiLitigeMessage> {
  const response = await api.post<ApiResponse<ApiLitigeMessage>>(`/litiges/${litigeId}/messages`, { message });
  if (!response.data.data) throw new ApiError(response.data.message || "Erreur lors de l'envoi du message.");
  return response.data.data;
}

// POST /api/litiges/{id}/pieces-jointes — preuve (photo/document/vidéo), éventuellement liée à un message.
export async function uploaderPreuveLitige(
  litigeId: string,
  fichier: { uri: string; fileName?: string | null; type?: string | null },
  messageId?: string
): Promise<ApiLitigePieceJointe> {
  const form = new FormData();
  await appendFilePart(form, 'fichier', fichier, `preuve_${Date.now()}.jpg`);
  if (messageId) form.append('message_id', messageId);
  const response = await api.post<ApiResponse<ApiLitigePieceJointe>>(`/litiges/${litigeId}/pieces-jointes`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!response.data.data) throw new ApiError(response.data.message || "Erreur lors de l'envoi de la preuve.");
  return response.data.data;
}

// ============================================
// SUPPORT — TICKETS (client, vendeur, livreur — même endpoint pour les 3 rôles, différencié
// uniquement par le token d'authentification ; le contrôleur scope tout sur request()->user()->id)
// ============================================
export type TicketCategorie =
  | 'commande' | 'paiement' | 'livraison' | 'vendeur' | 'livreur' | 'produit' | 'remboursement' | 'compte' | 'autre';
export type TicketStatut = 'ouvert' | 'en_cours' | 'en_attente' | 'resolu' | 'ferme';

export interface ApiTicketReponse {
  id: string;
  ticket_id: string;
  auteur_id: string;
  auteur?: { id: string; nom: string; prenom: string; photo_profil?: string | null } | null;
  message: string;
  est_note_interne: boolean;
  created_at: string;
}

export interface ApiSupportTicket {
  id: string;
  numero: string;
  categorie: TicketCategorie | string;
  commande_id: string | null;
  sujet: string;
  description: string;
  priorite: 'basse' | 'normale' | 'haute' | 'urgente' | string;
  statut: TicketStatut | string;
  date_derniere_reponse: string | null;
  created_at: string;
  commande?: { id: string; numero_commande: string } | null;
  reponses?: ApiTicketReponse[];
}

// GET /api/support/tickets — tickets de l'utilisateur connecté (paginé).
export async function fetchSupportTickets(): Promise<ApiSupportTicket[]> {
  const response = await api.get<ApiResponse<any>>('/support/tickets');
  return unwrapPaginated<ApiSupportTicket>(response.data.data);
}

// GET /api/support/tickets/{id} — détail avec fil de réponses (auteur inclus).
export async function fetchSupportTicketDetail(id: string): Promise<ApiSupportTicket> {
  const response = await api.get<ApiResponse<ApiSupportTicket>>(`/support/tickets/${id}`);
  if (!response.data.data) throw new ApiError('Ticket introuvable.');
  return response.data.data;
}

// POST /api/support/tickets — ouverture d'un nouveau ticket.
export async function ouvrirTicketSupport(payload: {
  categorie: TicketCategorie | string;
  sujet: string;
  description: string;
  commandeId?: string;
}): Promise<ApiSupportTicket> {
  const response = await api.post<ApiResponse<ApiSupportTicket>>('/support/tickets', {
    categorie: payload.categorie,
    sujet: payload.sujet,
    description: payload.description,
    commande_id: payload.commandeId,
  });
  if (!response.data.data) throw new ApiError(response.data.message || "Erreur lors de l'ouverture du ticket.");
  return response.data.data;
}

// POST /api/support/tickets/{id}/repondre — répond sur un ticket existant (ne renvoie pas la
// réponse créée : recharger le détail via fetchSupportTicketDetail pour resynchroniser le fil).
export async function repondreTicketSupport(ticketId: string, message: string): Promise<void> {
  const response = await api.post<ApiResponse>(`/support/tickets/${ticketId}/repondre`, { message });
  if (response.data.success === false) throw new ApiError(response.data.message || "Erreur lors de l'envoi du message.");
}

export { STORAGE_KEYS };
export default api;

import type { ApiAvisResume } from '@/services/api';

// ─── Mission / Commande ───
export interface DeliveryMission {
  id: string;
  livraison_id?: string;
  commande_id?: string;
  numero_commande: string;
  statut: 'disponible' | 'acceptee' | 'en_route' | 'en_cours' | 'en_route_client' | 'livree' | 'echouee';
  adresse_livraison: string;
  adresse_vendeur?: string;
  creneau_debut?: string;
  creneau_fin?: string;
  montant_total: number;
  montant_livraison: number;
  gain: number;
  nombre_articles: number;
  distance_km: number;
  duree_estimee_min: number;
client_nom?: string;
  client_telephone?: string;
  vendeur_nom?: string;
  vendeur_zone?: string;
  vendeur_telephone?: string;
  instructions_particulieres?: string;
  beneficiaire_nom?: string;
  beneficiaire_telephone?: string;
  methode_paiement?: string;
  montant_encaisser?: number;
  // Point de collecte (vendeur) et point de livraison (client), utilisés pour la carte de
  // navigation embarquée — distincts, à ne pas confondre : le backend renvoie les deux séparément
  // (coordonnees_gps_vendeur / coordonnees_gps) depuis LivreurController::demarrerNavigation.
  coordonneesVendeur?: {
    latitude: number;
    longitude: number;
  };
  coordonneesLivraison?: {
    latitude: number;
    longitude: number;
  };
  // Détails enrichis (fiche mission)
  vendeur?: {
    nom: string;
    telephone?: string;
    zone?: string;
    adresse?: string;
  };
  client?: {
    nom: string;
    telephone?: string;
    adresse?: string;
  };
  produits?: DeliveryProduct[];
  instructions_livraison?: string;
  created_at: string;
  date_livraison?: string;
}

export interface DeliveryProduct {
  name: string;
  quantity: string;
  price: string;
}

// ─── Dashboard Stats ───
export interface DeliveryDashboard {
  solde_disponible: number;
  note_moyenne: number;
  statut_disponibilite: 'disponible' | 'indisponible';
  statut_validation: 'en_attente' | 'valide' | 'suspendu';
  missions_en_cours: number;
  missions_livrees: number;
  missions_aujourd_hui: number;
  revenus_mois: number;
  revenu_jour?: number;
  taux_acceptation?: number;
  objectif_jour?: { termine: number; total: number };
  bonus_jour?: { montant: number; livraisons_requises: number };
  niveau?: { actuel: string; points: number; prochain: string; points_requis: number };
}

// ─── Revenus ───
export interface DeliveryRevenue {
  solde_disponible: number;
  nb_livraisons: number;
  remuneration: number;
  mois: number;
  annee: number;
  distance_totale_km?: number;
  gain_moyen?: number;
  historique?: RevenueTransaction[];
  // Périodes (jour / semaine / mois_stat)
  jour?: { remuneration: number; nb_livraisons: number; distance_totale_km: number };
  semaine?: { remuneration: number; nb_livraisons: number; distance_totale_km: number };
  mois_stat?: { remuneration: number; nb_livraisons: number; distance_totale_km: number };
  revenus_7_jours?: { jour: string; montant: number }[];
}

export interface RevenueTransaction {
  id: string;
  numero_commande: string;
  montant: number;
  statut: 'terminee' | 'en_cours' | 'echouee';
  created_at: string;
  date_livraison?: string;
  client_nom?: string;
  vendeur_nom?: string;
  distance_parcourue?: number;
}

// ─── Support / Chat ───
export interface SupportMessage {
  id: string;
  text: string;
  sender: 'driver' | 'support';
  timestamp: string;
  status?: 'sending' | 'sent' | 'read';
}

// ─── Navigation ───
export interface DeliveryNavigation {
  commande_id: string;
  numero_commande: string;
  adresse_vendeur: string;
  adresse_livraison: string;
  coordonnees_gps?: {
    latitude: number;
    longitude: number;
  };
  beneficiaire?: {
    nom: string;
    telephone: string;
  };
  methode_paiement: string;
  montant_a_encaisser: number;
}

// ─── Problem Report ───
export interface ProblemReport {
  livraison_id: string;
  motif: string;
  categorie: string;
  photo?: string;
}

// ─── Livreur Profile ───
export interface DeliveryDriver {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  photo_profil?: string | null;
  type_vehicule: string;
  immatriculation_vehicule: string;
  statut_disponibilite: 'disponible' | 'indisponible';
  statut_validation: 'en_attente' | 'valide' | 'suspendu';
  note_moyenne: number;
  solde_disponible: number;
  zone_intervention?: string[];
  numero_mobile_money?: string;
}

// ─── Context State ───
export interface DeliveryState {
  // Driver info
  driver: DeliveryDriver | null;
  isAuthenticated: boolean;
  
  // Dashboard
  dashboard: DeliveryDashboard | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
  
  // Missions
  missions: DeliveryMission[];
  missionsLoading: boolean;
  missionsError: string | null;
  currentMission: DeliveryMission | null;
  
  // Revenue
  revenue: DeliveryRevenue | null;
  revenueLoading: boolean;
  revenueError: string | null;
  
  // Support
  supportMessages: SupportMessage[];
  supportLoading: boolean;
  supportError: string | null;
  
  // Availability
  isAvailable: boolean;
  availabilityLoading: boolean;

  // Avis reçus (notations clients)
  avis: ApiAvisResume | null;
  avisLoading: boolean;
  avisError: string | null;
}

// ─── Action Types ───
export type DeliveryAction =
  | { type: 'SET_DRIVER'; payload: DeliveryDriver }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_DASHBOARD'; payload: DeliveryDashboard }
  | { type: 'SET_DASHBOARD_LOADING'; payload: boolean }
  | { type: 'SET_DASHBOARD_ERROR'; payload: string | null }
  | { type: 'SET_MISSIONS'; payload: DeliveryMission[] }
  | { type: 'SET_MISSIONS_LOADING'; payload: boolean }
  | { type: 'SET_MISSIONS_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_MISSION'; payload: DeliveryMission | null }
  | { type: 'MERGE_CURRENT_MISSION'; payload: Partial<DeliveryMission> }
  | { type: 'CLEAR_CURRENT_MISSION' }
  | { type: 'SET_REVENUE'; payload: DeliveryRevenue }
  | { type: 'SET_REVENUE_LOADING'; payload: boolean }
  | { type: 'SET_REVENUE_ERROR'; payload: string | null }
  | { type: 'SET_SUPPORT_MESSAGES'; payload: SupportMessage[] }
  | { type: 'ADD_SUPPORT_MESSAGE'; payload: SupportMessage }
  | { type: 'SET_SUPPORT_LOADING'; payload: boolean }
  | { type: 'SET_SUPPORT_ERROR'; payload: string | null }
  | { type: 'SET_AVAILABILITY'; payload: boolean }
  | { type: 'SET_AVAILABILITY_LOADING'; payload: boolean }
  | { type: 'SET_AVIS'; payload: ApiAvisResume }
  | { type: 'SET_AVIS_LOADING'; payload: boolean }
  | { type: 'SET_AVIS_ERROR'; payload: string | null }
  | { type: 'RESET' };

// ─── Context Type ───
export interface DeliveryContextType extends DeliveryState {
  dispatch: React.Dispatch<DeliveryAction>;
  // Actions
  fetchDashboard: () => Promise<void>;
  fetchMissions: () => Promise<void>;
  acceptMission: (id: string) => Promise<void>;
  refuseMission: (id: string) => Promise<void>;
  confirmCollecte: () => Promise<void>;
  confirmDepart: () => Promise<void>;
  confirmLivraison: (photo?: string) => Promise<void>;
  clearCurrentMission: () => void;
  signalerProbleme: (motif: string, categorie: string, photo?: string) => Promise<void>;
  fetchRevenue: (mois?: number, annee?: number) => Promise<void>;
  toggleAvailability: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  fetchAvis: () => Promise<void>;
  logout: () => Promise<void>;
}

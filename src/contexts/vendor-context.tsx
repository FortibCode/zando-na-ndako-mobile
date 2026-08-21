import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiAvisEntry, ApiCommande, ApiProduit, ApiVendeurDashboard, UserNotification, VendeurDocumentKey } from '@/services/api';
import {
  fetchCategories,
  fetchVendeurDashboard,
  fetchVendeurProduits,
  fetchVendeurCommandes,
  ajouterProduitVendeur,
  modifierProduitVendeur,
  gererStockVendeur,
  signalerRuptureVendeur,
  accepterCommandeVendeur,
  refuserCommandeVendeur,
  fetchVendeurRevenus,
  fetchVendeurAvis,
  resolveMediaUrl,
  getUser,
  updateStatutBoutiqueVendeur,
  updateVendeurProfil,
  uploaderDocumentsVendeur,
  fetchNotifications as apiFetchNotifications,
  markNotificationRead as apiMarkNotificationRead,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
} from '@/services/api';

export type VendorValidationStatus = 'en_attente' | 'valide' | 'suspendu';

export type VendorProductVariant = {
  id: string;
  label: string;
  prix: number;
  stock: number;
  disponible: boolean;
};

export type StockMovement = {
  id: string;
  type: 'ajout' | 'retrait' | 'vente';
  quantite: number;
  date: string;
};

export type VendorProduct = {
  id: string;
  nom: string;
  categorie: string;
  prix: number;
  unite: string;
  stock: number;
  disponible: boolean;
  image?: string;
  description?: string;
  variantes: VendorProductVariant[];
  mouvements: StockMovement[];
  derniereMaj?: string;
};

export type VendorOrderStatus =
  | 'en_attente' | 'preparation' | 'prete' | 'en_livraison'
  | 'livree' | 'annulee' | 'refusee';

export type VendorOrderItem = { nom: string; image?: string; quantite: number; prix: number };

export type VendorOrder = {
  id: string;
  client: { nom: string; telephone: string };
  adresse: string;
  date: string;
  heure: string;
  produits: VendorOrderItem[];
  instruction?: string;
  statut: VendorOrderStatus;
  motifAnnulation?: string;
  motifRefus?: string;
  annuleePar?: 'client' | 'systeme' | 'rupture_stock';
  livreur?: { nom: string; telephone: string; vehicule: string; plaque: string; note: number };
  paiement?: { reference: string; date: string; methode: string; statut: string };
  prepStep?: number;
};

export type Review = {
  id: string;
  client: string;
  clientPhoto?: string;
  note: number;
  commentaire: string;
  date: string;
  numeroCommande?: string;
};

function mapApiAvisToReview(a: ApiAvisEntry): Review {
  return {
    id: a.id,
    client: a.client?.nom || 'Client',
    clientPhoto: resolveMediaUrl(a.client?.photo) || undefined,
    note: a.note,
    commentaire: a.commentaire || '',
    date: a.date_notation ? new Date(a.date_notation).toLocaleDateString('fr-FR') : '',
    numeroCommande: a.numero_commande || undefined,
  };
}

export type Promotion = {
  id: string;
  titre: string;
  produit: string;
  pourcentage: number;
  dateDebut: string;
  dateFin: string;
  actif: boolean;
  terminee?: boolean;
};

// Les 3 seuls documents réellement stockés côté serveur (colonnes vendeurs.photo_boutique /
// document_identite / registre_commerce, envoyés via POST /vendeur/documents) — pas de statut de
// validation par document en base, seulement un statut global de compte (`statut_validation`) qui
// s'affiche séparément. `uploaded` reflète donc simplement "un fichier a été envoyé" ou non.
export type VendorDocument = {
  id: VendeurDocumentKey;
  nom: string;
  uploaded: boolean;
  statut: 'valide' | 'en_attente' | 'refuse';
  url?: string;
};

const DOCUMENT_LABELS: { key: VendeurDocumentKey; nom: string }[] = [
  { key: 'photo_boutique', nom: 'Photo de la boutique' },
  { key: 'document_identite', nom: "Pièce d'identité" },
  { key: 'registre_commerce', nom: 'Registre de commerce (RCCM)' },
];

export type Horaire = { jour: string; ouverture: string; fermeture: string; actif: boolean };

export type BoutiqueStatut = 'ouverte' | 'pause' | 'fermee';

const INITIAL_PRODUCTS: VendorProduct[] = [
  {
    id: 'p1', nom: 'Daurade royale', categorie: 'Poisson', prix: 2500, unite: 'kg', stock: 12,
    disponible: true, description: 'Poisson frais, idéal pour vos repas.',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=85',
    variantes: [
      { id: 'v1', label: '500 g', prix: 2000, stock: 20, disponible: true },
      { id: 'v2', label: '1 kg', prix: 4000, stock: 12, disponible: true },
      { id: 'v3', label: '2 kg', prix: 7500, stock: 6, disponible: true },
    ],
    mouvements: [
      { id: 'm1', type: 'ajout', quantite: 5, date: '12/05/2024' },
      { id: 'm2', type: 'vente', quantite: -2, date: '12/05/2024' },
      { id: 'm3', type: 'ajout', quantite: 10, date: '15/05/2024' },
    ],
    derniereMaj: '12/05/2024 à 08:20',
  },
  {
    id: 'p2', nom: 'Capitaine', categorie: 'Poisson', prix: 2150, unite: 'kg', stock: 8,
    disponible: true, description: 'Capitaine frais pêché du jour.',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=85',
    variantes: [], mouvements: [],
  },
  {
    id: 'p3', nom: 'Tomate fraîche', categorie: 'Légumes', prix: 1100, unite: 'kg', stock: 30,
    disponible: true, description: 'Tomates fraîches et fermes.',
    image: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=600&q=85',
    variantes: [], mouvements: [],
  },
  {
    id: 'p4', nom: 'Riz parfumé', categorie: 'Épicerie', prix: 3500, unite: 'sac', stock: 15,
    disponible: true, description: 'Riz parfumé grain long de haute qualité.',
    image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=85',
    variantes: [], mouvements: [],
  },
  {
    id: 'p5', nom: 'Huile végétale 1L', categorie: 'Épicerie', prix: 2500, unite: 'bouteille', stock: 10,
    disponible: true, description: 'Huile végétale raffinée pour toutes vos cuissons.',
    image: 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?auto=format&fit=crop&w=600&q=85',
    variantes: [], mouvements: [],
  },
];

const INITIAL_ORDERS: VendorOrder[] = [
  {
    id: 'ZN02405178',
    client: { nom: 'Ruth Okambi', telephone: '+242 06 123 45 67' },
    adresse: 'Avenue des 3 Martyrs, Talangai, Brazzaville',
    date: '11/05/2024', heure: '10:15',
    produits: [
      { nom: 'Dorade royale', image: INITIAL_PRODUCTS[0].image, quantite: 2, prix: 4000 },
      { nom: 'Riz parfumé', image: INITIAL_PRODUCTS[3].image, quantite: 1, prix: 2000 },
      { nom: 'Tomates', image: INITIAL_PRODUCTS[2].image, quantite: 3, prix: 1000 },
      { nom: 'Huile végétale', image: INITIAL_PRODUCTS[4].image, quantite: 1, prix: 2500 },
    ],
    instruction: 'Merci de bien sélectionner des produits frais 🙏',
    statut: 'en_attente',
    livreur: { nom: 'Jean-Paul', telephone: '+242 06 987 65 43', vehicule: 'TVS Apache RTR', note: 4.9 } as any,
  },
  {
    id: 'ZN02405177',
    client: { nom: 'Michel Tay', telephone: '+242 05 555 22 11' },
    adresse: 'Rue de la Paix, Bacongo, Brazzaville',
    date: '10/05/2024', heure: '14:30',
    produits: [
      { nom: 'Capitaine', image: INITIAL_PRODUCTS[1].image, quantite: 1, prix: 2150 },
    ],
    statut: 'livree',
  },
  {
    id: 'ZN02405176',
    client: { nom: 'Sarah Golo', telephone: '+242 06 444 33 22' },
    adresse: 'Poto-Poto, Brazzaville',
    date: '10/05/2024', heure: '16:30',
    produits: [
      { nom: 'Riz parfumé', image: INITIAL_PRODUCTS[3].image, quantite: 2, prix: 3500 },
    ],
    statut: 'en_livraison',
  },
  {
    id: 'ZN02405175',
    client: { nom: 'David Banza', telephone: '+242 06 111 22 33' },
    adresse: 'Ouenzé, Brazzaville',
    date: '10/05/2024', heure: '09:10',
    produits: [{ nom: 'Dorade royale', image: INITIAL_PRODUCTS[0].image, quantite: 1, prix: 4000 }],
    statut: 'annulee', annuleePar: 'client', motifAnnulation: 'Client a annulé',
  },
  {
    id: 'ZN02405173',
    client: { nom: 'Alice Ngoma', telephone: '+242 05 222 33 44' },
    adresse: 'Moungali, Brazzaville',
    date: '10/05/2024', heure: '14:30',
    produits: [{ nom: 'Huile végétale', image: INITIAL_PRODUCTS[4].image, quantite: 1, prix: 2500 }],
    statut: 'annulee', annuleePar: 'systeme', motifAnnulation: 'Paiement échoué',
  },
  {
    id: 'ZN02405171',
    client: { nom: 'Paul Ossé', telephone: '+242 06 777 88 99' },
    adresse: 'Bacongo, Brazzaville',
    date: '10/05/2024', heure: '11:20',
    produits: [{ nom: 'Capitaine', image: INITIAL_PRODUCTS[1].image, quantite: 2, prix: 2150 }],
    statut: 'annulee', annuleePar: 'rupture_stock', motifAnnulation: 'Produit indisponible',
  },
];

// Valeurs par défaut affichées tant qu'aucun horaire réel n'a été enregistré (ou tant que le
// vendeur ne les a pas encore configurés) — jamais envoyées au serveur telles quelles, seulement
// un point de départ pour l'écran "Horaires d'ouverture".
const INITIAL_HORAIRES: Horaire[] = [
  { jour: 'Lundi', ouverture: '06:00', fermeture: '18:00', actif: true },
  { jour: 'Mardi', ouverture: '06:00', fermeture: '18:00', actif: true },
  { jour: 'Mercredi', ouverture: '06:00', fermeture: '18:00', actif: true },
  { jour: 'Jeudi', ouverture: '06:00', fermeture: '18:00', actif: true },
  { jour: 'Vendredi', ouverture: '06:00', fermeture: '18:00', actif: true },
  { jour: 'Samedi', ouverture: '06:00', fermeture: '18:00', actif: true },
  { jour: 'Dimanche', ouverture: '', fermeture: '', actif: false },
];

const JOURS_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const JOUR_ABBREV: Record<string, string> = {
  Lundi: 'Lun', Mardi: 'Mar', Mercredi: 'Mer', Jeudi: 'Jeu', Vendredi: 'Ven', Samedi: 'Sam', Dimanche: 'Dim',
};
const ABBREV_TO_JOUR: Record<string, string> = Object.fromEntries(Object.entries(JOUR_ABBREV).map(([j, a]) => [a, j]));

// Le backend ne stocke `horaires_ouverture` que comme une simple chaîne libre (déjà utilisée par
// le champ texte libre de l'écran web) — on ne change pas le schéma. Ici, on sérialise le réglage
// par-jour de l'écran mobile en un résumé lisible ("Lun-Ven 08:00-18:00, Sam 09:00-13:00, Dim
// Fermé") en regroupant les jours consécutifs qui partagent les mêmes horaires.
function serializeHoraires(horaires: Horaire[]): string {
  const byJour = new Map(horaires.map((h) => [h.jour, h]));
  const segments: string[] = [];
  let i = 0;
  while (i < JOURS_ORDER.length) {
    const h = byJour.get(JOURS_ORDER[i]);
    if (!h) { i += 1; continue; }
    const key = h.actif ? `${h.ouverture}-${h.fermeture}` : 'FERME';
    let j = i;
    while (j + 1 < JOURS_ORDER.length) {
      const next = byJour.get(JOURS_ORDER[j + 1]);
      const nextKey = next && next.actif ? `${next.ouverture}-${next.fermeture}` : 'FERME';
      if (!next || nextKey !== key) break;
      j += 1;
    }
    const startAbbrev = JOUR_ABBREV[JOURS_ORDER[i]];
    const endAbbrev = JOUR_ABBREV[JOURS_ORDER[j]];
    const dayLabel = i === j ? startAbbrev : `${startAbbrev}-${endAbbrev}`;
    const valueLabel = h.actif ? `${h.ouverture}-${h.fermeture}` : 'Fermé';
    segments.push(`${dayLabel} ${valueLabel}`);
    i = j + 1;
  }
  return segments.join(', ');
}

// Inverse de serializeHoraires() : ne comprend que le format généré ci-dessus. Toute autre chaîne
// (texte libre saisi depuis le web, ou vide) renvoie null — l'écran garde alors ses valeurs par
// défaut plutôt que de tenter une lecture approximative d'un texte arbitraire.
function parseHoraires(text?: string | null): Horaire[] | null {
  if (!text || !text.trim()) return null;
  const parsed = new Map<string, Horaire>();
  const segments = text.split(',').map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) return null;

  for (const segment of segments) {
    const match = segment.match(/^([A-Za-zÀ-ÿ]{3})(?:-([A-Za-zÀ-ÿ]{3}))?\s+(Fermé|\d{2}:\d{2}-\d{2}:\d{2})$/);
    if (!match) return null;
    const [, startAbbrev, endAbbrev, valueLabel] = match;
    const startJour = ABBREV_TO_JOUR[startAbbrev];
    const endJour = endAbbrev ? ABBREV_TO_JOUR[endAbbrev] : startAbbrev ? startJour : undefined;
    if (!startJour || (endAbbrev && !ABBREV_TO_JOUR[endAbbrev])) return null;

    const startIdx = JOURS_ORDER.indexOf(startJour);
    const endIdx = JOURS_ORDER.indexOf(endAbbrev ? ABBREV_TO_JOUR[endAbbrev] : startJour);
    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return null;

    const actif = valueLabel !== 'Fermé';
    const [ouverture, fermeture] = actif ? valueLabel.split('-') : ['', ''];
    for (let idx = startIdx; idx <= endIdx; idx += 1) {
      const jour = JOURS_ORDER[idx];
      parsed.set(jour, { jour, ouverture, fermeture, actif });
    }
  }

  if (parsed.size !== JOURS_ORDER.length) return null;
  return JOURS_ORDER.map((jour) => parsed.get(jour)!);
}

export type SalesStats = {
  chiffreAffaires: number;
  commandesTotal: number;
  commandesLivrees: number;
  commandesEnAttente: number;
  panierMoyen: number;
  revenuJour: number;
  commandesJour: number;
  ventesSemaine: { jour: string; montant: number }[];
  produitsPlusVendus: { nom: string; ventes: number }[];
};

const DEFAULT_STATS: SalesStats = {
  chiffreAffaires: 245000,
  commandesTotal: 128,
  commandesLivrees: 96,
  commandesEnAttente: 32,
  panierMoyen: 3242,
  revenuJour: 0,
  commandesJour: 0,
  ventesSemaine: [
    { jour: 'LUN', montant: 60000 },
    { jour: 'MAR', montant: 270000 },
    { jour: 'MER', montant: 185000 },
    { jour: 'JEU', montant: 320000 },
    { jour: 'VEN', montant: 225000 },
    { jour: 'SAM', montant: 400000 },
    { jour: 'DIM', montant: 470000 },
  ],
  produitsPlusVendus: [
    { nom: 'Dorade royale', ventes: 45 },
    { nom: 'Poulet fermier', ventes: 32 },
    { nom: 'Riz parfumé', ventes: 28 },
  ],
};

export type Boutique = {
  nom: string;
  emoji: string;
  note: number;
  avisCount: number;
  statut: BoutiqueStatut;
  messageClients: string;
};

// ─── Mapping API → modèles locaux ───
function toNumber(v: string | number | undefined | null): number {
  if (v === undefined || v === null) return 0;
  return typeof v === 'string' ? parseFloat(v) || 0 : v;
}

function mapApiProduitToVendorProduct(p: ApiProduit, previous?: VendorProduct): VendorProduct {
  return {
    id: p.id,
    nom: p.nom_produit,
    categorie: p.categorie?.nom_categorie || previous?.categorie || '',
    prix: toNumber(p.prix_unitaire),
    unite: p.unite_mesure,
    stock: p.quantite_stock,
    disponible: p.statut_disponibilite === 'disponible',
    image: resolveMediaUrl(p.photo_produit) || previous?.image,
    description: p.description || undefined,
    variantes: previous?.variantes || [],
    mouvements: previous?.mouvements || [],
    derniereMaj: previous?.derniereMaj,
  };
}

const STATUS_MAP: Record<ApiCommande['statut_commande'], VendorOrderStatus> = {
  confirmee: 'en_attente',
  achat_marche: 'preparation',
  preparation: 'preparation',
  en_route: 'en_livraison',
  en_route_client: 'en_livraison',
  livree: 'livree',
  annulee: 'annulee',
};

function mapApiCommandeToVendorOrder(c: ApiCommande): VendorOrder {
  const dateSource = c.date_commande || c.created_at;
  const dateObj = dateSource ? new Date(dateSource) : new Date();
  return {
    id: c.id,
    client: {
      nom: c.client?.user?.nom_complet || 'Client',
      telephone: c.client?.user?.telephone || '',
    },
    adresse: c.adresse_livraison,
    date: dateObj.toLocaleDateString('fr-FR'),
    heure: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    produits: (c.lignes || []).map((l) => ({
      nom: l.produit?.nom_produit || 'Produit',
      image: resolveMediaUrl(l.produit?.photo_produit) || undefined,
      quantite: l.quantite,
      prix: toNumber(l.sous_total) || toNumber(l.prix_unitaire) * l.quantite,
    })),
    statut: STATUS_MAP[c.statut_commande] || 'en_attente',
    motifAnnulation: c.motif_annulation || undefined,
    annuleePar: c.statut_commande === 'annulee' ? 'systeme' : undefined,
    livreur: c.livreur?.user
      ? { nom: c.livreur.user.nom_complet, telephone: c.livreur.user.telephone, vehicule: c.livreur.vehicule || '', plaque: '', note: c.livreur.note_moyenne || 0 }
      : undefined,
    paiement: c.paiement
      ? { reference: c.paiement.reference || '', date: dateObj.toLocaleDateString('fr-FR'), methode: c.paiement.methode || '', statut: c.paiement.statut || '' }
      : undefined,
  };
}

type VendorContextValue = {
  vendorFirstName: string;
  boutique: Boutique;
  // Persiste réellement côté serveur (PUT /vendeur/statut-boutique) : "pause"/"fermee" bloquent
  // désormais la création de nouvelles commandes pour ce vendeur — voir le rejet à valider() côté
  // API. Peut lever une erreur réseau ; l'écran appelant doit l'attraper.
  updateBoutiqueStatus: (statut: BoutiqueStatut, message?: string) => Promise<void>;
  vendorValidationStatus: VendorValidationStatus | null;

  horaires: Horaire[];
  updateHoraire: (jour: string, patch: Partial<Horaire>) => void;
  // Sérialise `horaires` (voir serializeHoraires) et l'enregistre dans vendeurs.horaires_ouverture
  // via PUT /vendeur/profil.
  saveHoraires: () => Promise<void>;

  numeroMobileMoneyReception: string;
  updateNumeroMobileMoneyReception: (numero: string) => Promise<void>;

  products: VendorProduct[];
  productsLoading: boolean;
  categoriesReady: boolean;
  refreshCategories: () => Promise<Record<string, string>>;
  addProduct: (input: { nom: string; categorie: string; prix: number; stock: number; unite?: string; fraicheur?: 'frais' | 'fume' | 'congele'; description?: string; image?: string }) => Promise<VendorProduct>;
  updateProduct: (id: string, patch: Partial<{ nom: string; categorie: string; prix: number; stock: number; description: string; disponible: boolean; image?: string; derniereMaj: string }>) => Promise<void>;
  toggleProductAvailability: (id: string) => void;
  adjustStock: (id: string, amount: number, type: 'ajout' | 'retrait') => Promise<void>;
  addVariant: (id: string, variant: Omit<VendorProductVariant, 'id'>) => void;
  getProduct: (id: string) => VendorProduct | undefined;

  orders: VendorOrder[];
  ordersLoading: boolean;
  hasMoreOrders: boolean;
  refreshOrders: () => Promise<void>;
  loadMoreOrders: () => Promise<void>;
  getOrder: (id: string) => VendorOrder | undefined;
  acceptOrder: (id: string) => Promise<void>;
  refuseOrder: (id: string, motif: string, commentaire?: string) => Promise<void>;
  setOrderStatus: (id: string, statut: VendorOrderStatus) => void;
  setPrepStep: (id: string, step: number) => void;
  createManualOrder: (input: { nom: string; telephone: string; email?: string; adresse: string; message?: string }) => VendorOrder;

  promotions: Promotion[];
  togglePromotion: (id: string) => void;
  addPromotion: (input: { titre: string; produit: string; pourcentage: number; dateDebut: string; dateFin: string }) => void;

  // Notifications réelles (GET/POST /user/notifications — identique à client/livreur), plus de
  // liste factice locale.
  notifications: UserNotification[];
  notificationsLoading: boolean;
  unreadNotificationsCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  reviews: Review[];
  reviewsLoading: boolean;
  refreshReviews: () => Promise<void>;

  documents: VendorDocument[];
  uploadDocument: (key: VendeurDocumentKey, file: { uri: string; fileName?: string | null; type?: string | null }) => Promise<void>;

  stats: SalesStats;
};

const VendorContext = createContext<VendorContextValue | null>(null);

export function VendorProvider({ children }: { children: ReactNode }) {
  const [vendorFirstName, setVendorFirstName] = useState('Vendeur');
  const [boutique, setBoutique] = useState<Boutique>({
    nom: 'Maman Clémentine', emoji: '🐟', note: 4.7, avisCount: 128,
    statut: 'ouverte', messageClients: '',
  });
  const [vendorValidationStatus, setVendorValidationStatus] = useState<VendorValidationStatus | null>(null);
  const [horaires, setHoraires] = useState<Horaire[]>(INITIAL_HORAIRES);
  const [numeroMobileMoneyReception, setNumeroMobileMoneyReception] = useState('');
  const [products, setProducts] = useState<VendorProduct[]>(INITIAL_PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(false);
  const [orders, setOrders] = useState<VendorOrder[]>(INITIAL_ORDERS);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLastPage, setOrdersLastPage] = useState(1);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [documentPaths, setDocumentPaths] = useState<Partial<Record<VendeurDocumentKey, string | null>>>({});
  const [stats, setStats] = useState<SalesStats>(DEFAULT_STATS);
  const [categoryIdByName, setCategoryIdByName] = useState<Record<string, string>>({});
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([
    { id: 'p1', titre: '-10% sur Daurade royale', produit: 'Daurade royale', pourcentage: 10, dateDebut: '01/05/2024', dateFin: '31/05/2024', actif: true, terminee: false },
  ]);

  const documents: VendorDocument[] = useMemo(() => DOCUMENT_LABELS.map(({ key, nom }) => ({
    id: key,
    nom,
    uploaded: !!documentPaths[key],
    statut: documentPaths[key] ? 'valide' : 'en_attente',
    url: resolveMediaUrl(documentPaths[key] || undefined),
  })), [documentPaths]);

  // Les catégories sont indispensables pour publier un produit (mapping nom → id) :
  // un simple échec réseau au démarrage ne doit pas bloquer la publication pour le reste de la session.
  // Retourne le mapping fraîchement chargé (l'état React ne serait pas encore à jour dans l'appelant).
  const refreshCategories = useCallback(async (): Promise<Record<string, string>> => {
    try {
      const cats = await fetchCategories();
      const map = Object.fromEntries(cats.map((c) => [c.nom_categorie, c.id]));
      setCategoryIdByName(map);
      setCategoriesReady(true);
      return map;
    } catch {
      setCategoriesReady(false);
      return {};
    }
  }, []);

  // ─── Rafraîchissement des commandes (première page) : appelé au démarrage, en tirer-pour-actualiser,
  // et en polling périodique — sans ça, une nouvelle commande client n'apparaissait jamais tant que le
  // vendeur ne redémarrait pas l'app (l'ancien code ne chargeait la liste qu'une seule fois au montage).
  const fetchOrders = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setOrdersLoading(true);
    try {
      const { commandes, currentPage, lastPage } = await fetchVendeurCommandes();
      setOrders(commandes.map(mapApiCommandeToVendorOrder));
      setOrdersPage(currentPage);
      setOrdersLastPage(lastPage);
    } catch { /* garde la liste précédente (ou INITIAL_ORDERS en mode démo hors-ligne) */ }
    finally { setOrdersLoading(false); }
  }, []);

  // ─── Avis reçus (notations clients) : remplace l'ancienne liste factice INITIAL_REVIEWS par
  // les vraies notations soumises via /commandes/{id}/notation, exposées ici via /vendeur/avis.
  const refreshReviews = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setReviewsLoading(true);
    try {
      const resume = await fetchVendeurAvis();
      setReviews(resume.avis.map(mapApiAvisToReview));
      setBoutique((prev) => ({ ...prev, avisCount: resume.nombre_avis }));
    } catch { /* garde la liste précédente (vide au premier chargement) */ }
    finally { setReviewsLoading(false); }
  }, []);

  // ─── Notifications réelles (GET /user/notifications — même endpoint que client/livreur) : plus
  // de liste factice locale, remplace INITIAL_NOTIFICATIONS.
  const refreshNotifications = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setNotificationsLoading(true);
    try {
      const data = await apiFetchNotifications();
      setNotifications(data);
    } catch { /* garde la liste précédente (vide au premier chargement) */ }
    finally { setNotificationsLoading(false); }
  }, []);

  // ─── Chargement initial depuis l'API réelle (repli sur les données de démo en cas d'échec) ───
  useEffect(() => {
    refreshCategories();

    (async () => {
      const user = await getUser();
      if (user) {
        setVendorFirstName(user.prenom || user.nom_complet?.split(' ')[0] || 'Vendeur');
      }
    })();

    (async () => {
      setProductsLoading(true);
      try {
        const list = await fetchVendeurProduits();
        setProducts(list.map((p) => mapApiProduitToVendorProduct(p)));
      } catch { /* garde INITIAL_PRODUCTS en mode démo hors-ligne */ }
      finally { setProductsLoading(false); }
    })();

    fetchOrders();
    refreshReviews();
    refreshNotifications();

    (async () => {
      try {
        const dashboard: ApiVendeurDashboard = await fetchVendeurDashboard();
        setVendorValidationStatus((dashboard.statut_validation as VendorValidationStatus) || null);
        setBoutique((prev) => ({
          ...prev,
          nom: dashboard.nom_commerce || prev.nom,
          note: toNumber(dashboard.note_moyenne) || prev.note,
          // Statut réel de la boutique (ouverte/pause/fermée) : jusqu'ici toujours resté à la
          // valeur locale par défaut "ouverte", quoi qu'ait choisi le vendeur lors d'une session
          // précédente, puisque rien n'était jamais chargé depuis le serveur.
          statut: (dashboard.statut_boutique as BoutiqueStatut) || prev.statut,
        }));
        setNumeroMobileMoneyReception(dashboard.numero_mobile_money_reception || '');
        // N'écrase l'état local que si le texte enregistré correspond bien au format généré par
        // serializeHoraires() (voir sa définition) — sinon on garde les valeurs par défaut plutôt
        // que d'essayer d'interpréter un texte libre arbitraire (ex: saisi depuis le web).
        const parsedHoraires = parseHoraires(dashboard.horaires_ouverture);
        if (parsedHoraires) setHoraires(parsedHoraires);
        setDocumentPaths({
          photo_boutique: dashboard.photo_boutique,
          document_identite: dashboard.document_identite,
          registre_commerce: dashboard.registre_commerce,
        });
        setStats((prev) => ({
          ...prev,
          commandesTotal: dashboard.commandes_aujourd_hui + dashboard.commandes_en_cours + dashboard.commandes_livrees,
          commandesLivrees: dashboard.commandes_livrees,
          commandesEnAttente: dashboard.commandes_en_cours,
        }));
      } catch { /* garde les stats de démo */ }
      try {
        const revenus = await fetchVendeurRevenus();
        setStats((prev) => ({
          ...prev,
          chiffreAffaires: toNumber(revenus.revenus_nets) || prev.chiffreAffaires,
          // Panier moyen réel (moyenne des commandes livrées du mois) au lieu d'une valeur figée à
          // 3242 FCFA quelle que soit l'activité réelle de la boutique.
          panierMoyen: revenus.panier_moyen !== undefined ? toNumber(revenus.panier_moyen) : prev.panierMoyen,
          ventesSemaine: revenus.ventes_semaine
            ? revenus.ventes_semaine.map((v) => ({ jour: v.jour, montant: toNumber(v.montant) }))
            : prev.ventesSemaine,
          produitsPlusVendus: revenus.produits_plus_vendus?.length ? revenus.produits_plus_vendus : prev.produitsPlusVendus,
        }));
      } catch { /* garde les stats de démo */ }
    })();
  }, [refreshCategories, refreshReviews, refreshNotifications]);

  // ─── Polling périodique des commandes : un vendeur qui laisse l'écran ouvert doit voir une
  // nouvelle commande client sans avoir à redémarrer l'app. Rafraîchit aussi au retour au premier
  // plan (même logique que le polling missions côté livreur).
  useEffect(() => {
    let active = true;
    const tick = async () => {
      if (!active) return;
      await fetchOrders({ silent: true });
    };
    const interval = setInterval(tick, 20000);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') tick();
    });
    return () => {
      active = false;
      clearInterval(interval);
      sub.remove();
    };
  }, [fetchOrders]);

  // ─── Revenu et commandes du jour, calculés à partir des vraies commandes chargées ───
  useEffect(() => {
    const todayLabel = new Date().toLocaleDateString('fr-FR');
    const ordersToday = orders.filter((o) => o.date === todayLabel);
    const revenuJour = ordersToday
      .filter((o) => o.statut === 'livree')
      .reduce((sum, o) => sum + o.produits.reduce((s, p) => s + p.prix, 0), 0);
    setStats((prev) => ({ ...prev, revenuJour, commandesJour: ordersToday.length }));
  }, [orders]);

  const loadMoreOrders = useCallback(async () => {
    if (ordersPage >= ordersLastPage) return;
    try {
      const { commandes, currentPage, lastPage } = await fetchVendeurCommandes({ page: ordersPage + 1 });
      setOrders((prev) => [...prev, ...commandes.map(mapApiCommandeToVendorOrder)]);
      setOrdersPage(currentPage);
      setOrdersLastPage(lastPage);
    } catch { /* la page suivante restera indisponible tant que la connexion échoue */ }
  }, [ordersPage, ordersLastPage]);

  const updateBoutiqueStatus = useCallback(async (statut: BoutiqueStatut, message?: string) => {
    await updateStatutBoutiqueVendeur(statut);
    setBoutique((prev) => ({ ...prev, statut, messageClients: message ?? prev.messageClients }));
  }, []);

  const updateHoraire = useCallback((jour: string, patch: Partial<Horaire>) => {
    setHoraires((prev) => prev.map((h) => (h.jour === jour ? { ...h, ...patch } : h)));
  }, []);

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), [products]);

  const syncToClientCatalog = (vendorProduct: VendorProduct) => {
    try {
      const clientItem = {
        id: vendorProduct.id,
        name: vendorProduct.nom,
        price: vendorProduct.prix,
        unit: `FCFA/${vendorProduct.unite || 'kg'}`,
        emoji: '🛒',
        category: vendorProduct.categorie,
        rating: 5.0,
        reviews: 1,
        image: vendorProduct.image,
        description: vendorProduct.description,
        stock: vendorProduct.stock > 0,
      };
      AsyncStorage.getItem('@zando_client_products_cache').then((raw) => {
        const list = raw ? JSON.parse(raw) : [];
        const updated = [clientItem, ...list.filter((p: any) => p.id !== clientItem.id)];
        AsyncStorage.setItem('@zando_client_products_cache', JSON.stringify(updated)).catch(() => {});
      }).catch(() => {});
    } catch (_e) {}
  };

  const addProduct = useCallback(async (input: { nom: string; categorie: string; prix: number; stock: number; unite?: string; fraicheur?: 'frais' | 'fume' | 'congele'; description?: string; image?: string }) => {
    let categorieId = categoryIdByName[input.categorie];
    if (!categorieId) {
      const freshMap = await refreshCategories();
      categorieId = freshMap[input.categorie];
    }
    if (!categorieId) throw new Error('Catégorie non résolue');
    // Ne plus masquer un échec réel derrière un produit factice local : le vendeur croyait avoir
    // publié alors que rien n'était enregistré côté serveur. Une vraie erreur doit remonter à
    // l'écran, qui affiche déjà une alerte claire dans ce cas.
    const apiProduit = await ajouterProduitVendeur({
      nom_produit: input.nom,
      description: input.description,
      categorie_id: categorieId,
      prix_unitaire: input.prix,
      unite_mesure: input.unite || 'kg',
      quantite_stock: input.stock,
      type_fraicheur: input.fraicheur,
      photo: input.image ? { uri: input.image } : null,
    });
    const created = mapApiProduitToVendorProduct(apiProduit);
    setProducts((prev) => [created, ...prev]);
    syncToClientCatalog(created);
    return created;
  }, [categoryIdByName, refreshCategories]);

  const updateProduct = useCallback(async (id: string, patch: Partial<{ nom: string; categorie: string; prix: number; stock: number; description: string; disponible: boolean; image?: string; derniereMaj: string }>) => {
    const current = products.find((p) => p.id === id);
    if (!current) return;

    if (patch.nom !== undefined || patch.description !== undefined || patch.prix !== undefined) {
      await modifierProduitVendeur(id, {
        nom_produit: patch.nom,
        description: patch.description,
        prix_unitaire: patch.prix,
      });
    }

    let nextStock = current.stock;
    let nextDisponible = current.disponible;
    if (patch.stock !== undefined && patch.stock !== current.stock) {
      nextStock = await gererStockVendeur(id, patch.stock, 'definir');
      nextDisponible = nextStock > 0;
    }
    if (patch.disponible === false && current.disponible) {
      await signalerRuptureVendeur(id);
      nextStock = 0;
      nextDisponible = false;
    }

    setProducts((prev) => prev.map((p) => (p.id === id ? {
      ...p,
      ...patch,
      stock: nextStock,
      disponible: nextDisponible,
      image: patch.image ?? p.image,
    } : p)));
  }, [products]);

  const toggleProductAvailability = useCallback((id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, disponible: !p.disponible } : p)));
  }, []);

  const adjustStock = useCallback(async (id: string, amount: number, type: 'ajout' | 'retrait') => {
    const current = products.find((p) => p.id === id);
    if (!current) return;
    const today = new Date();
    const dateLabel = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    const nouveauStock = type === 'ajout'
      ? await gererStockVendeur(id, amount, 'ajouter')
      : await gererStockVendeur(id, Math.max(0, current.stock - amount), 'definir');

    const movement: StockMovement = { id: 'mv_' + Date.now(), type, quantite: type === 'ajout' ? amount : -amount, date: dateLabel };
    setProducts((prev) => prev.map((p) => (p.id === id ? {
      ...p,
      stock: nouveauStock,
      disponible: nouveauStock > 0,
      mouvements: [movement, ...p.mouvements],
    } : p)));
  }, [products]);

  const addVariant = useCallback((id: string, variant: Omit<VendorProductVariant, 'id'>) => {
    setProducts((prev) => prev.map((p) => (
      p.id === id ? { ...p, variantes: [...p.variantes, { id: 'var_' + Date.now(), ...variant }] } : p
    )));
  }, []);

  const getOrder = useCallback((id: string) => orders.find((o) => o.id === id), [orders]);

  const acceptOrder = useCallback(async (id: string) => {
    await accepterCommandeVendeur(id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, statut: 'preparation', prepStep: 1 } : o)));
  }, []);

  const refuseOrder = useCallback(async (id: string, motif: string, commentaire?: string) => {
    await refuserCommandeVendeur(id, motif + (commentaire ? ` — ${commentaire}` : ''));
    setOrders((prev) => prev.map((o) => (
      o.id === id ? { ...o, statut: 'refusee', motifRefus: motif + (commentaire ? ` — ${commentaire}` : '') } : o
    )));
  }, []);

  const setOrderStatus = useCallback((id: string, statut: VendorOrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, statut } : o)));
  }, []);

  const setPrepStep = useCallback((id: string, step: number) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, prepStep: step } : o)));
  }, []);

  const createManualOrder = useCallback((input: { nom: string; telephone: string; email?: string; adresse: string; message?: string }) => {
    const created: VendorOrder = {
      id: 'ZN' + Math.floor(1000000 + Math.random() * 8999999),
      client: { nom: input.nom, telephone: input.telephone },
      adresse: input.adresse,
      date: new Date().toLocaleDateString('fr-FR'),
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      produits: [],
      instruction: input.message,
      statut: 'en_attente',
    };
    setOrders((prev) => [created, ...prev]);
    return created;
  }, []);

  const saveHoraires = useCallback(async () => {
    const text = serializeHoraires(horaires);
    await updateVendeurProfil({ horaires_ouverture: text });
  }, [horaires]);

  const updateNumeroMobileMoneyReception = useCallback(async (numero: string) => {
    await updateVendeurProfil({ numero_mobile_money_reception: numero });
    setNumeroMobileMoneyReception(numero);
  }, []);

  const uploadDocument = useCallback(async (key: VendeurDocumentKey, file: { uri: string; fileName?: string | null; type?: string | null }) => {
    const res = await uploaderDocumentsVendeur({ [key]: file });
    setDocumentPaths((prev) => ({ ...prev, ...res }));
  }, []);

  const togglePromotion = useCallback((id: string) => {
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, actif: !p.actif } : p)));
  }, []);

  const addPromotion = useCallback((input: { titre: string; produit: string; pourcentage: number; dateDebut: string; dateFin: string }) => {
    setPromotions((prev) => [{ id: 'promo_' + Date.now(), actif: true, ...input }, ...prev]);
  }, []);

  const unreadNotificationsCount = notifications.filter((n) => !n.statut_lecture).length;

  const markNotificationRead = useCallback(async (id: string) => {
    try { await apiMarkNotificationRead(id); } catch {}
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, statut_lecture: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try { await apiMarkAllNotificationsRead(); } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, statut_lecture: true })));
  }, []);

  const hasMoreOrders = ordersPage < ordersLastPage;

  const value = useMemo(() => ({
    vendorFirstName,
    boutique, updateBoutiqueStatus, vendorValidationStatus,
    horaires, updateHoraire, saveHoraires,
    numeroMobileMoneyReception, updateNumeroMobileMoneyReception,
    products, productsLoading, categoriesReady, refreshCategories,
    addProduct, updateProduct, toggleProductAvailability, adjustStock, addVariant, getProduct,
    orders, ordersLoading, hasMoreOrders, refreshOrders: fetchOrders, loadMoreOrders, getOrder, acceptOrder, refuseOrder, setOrderStatus, setPrepStep, createManualOrder,
    promotions, togglePromotion, addPromotion,
    notifications, notificationsLoading, unreadNotificationsCount, refreshNotifications, markNotificationRead, markAllNotificationsRead,
    reviews, reviewsLoading, refreshReviews,
    documents, uploadDocument,
    stats,
  }), [
    vendorFirstName, boutique, updateBoutiqueStatus, vendorValidationStatus, horaires, updateHoraire, saveHoraires,
    numeroMobileMoneyReception, updateNumeroMobileMoneyReception,
    products, productsLoading, categoriesReady, refreshCategories,
    addProduct, updateProduct, toggleProductAvailability, adjustStock, addVariant, getProduct,
    orders, ordersLoading, hasMoreOrders, fetchOrders, loadMoreOrders, getOrder, acceptOrder, refuseOrder, setOrderStatus, setPrepStep, createManualOrder,
    promotions, togglePromotion, addPromotion,
    notifications, notificationsLoading, unreadNotificationsCount, refreshNotifications, markNotificationRead, markAllNotificationsRead,
    reviews, reviewsLoading, refreshReviews, documents, uploadDocument, stats,
  ]);

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}

export function useVendor() {
  const value = useContext(VendorContext);
  if (!value) throw new Error('useVendor must be used within VendorProvider');
  return value;
}

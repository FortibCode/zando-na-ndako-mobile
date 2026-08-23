import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { ApiAvisEntry, ApiCommande, ApiProduit, ApiPromotionVendeur, ApiResponse, ApiVendeurDashboard, UserNotification, VendeurDocumentKey } from '@/services/api';
import api, {
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
  fetchPromotionsVendeur,
  creerPromotionVendeur,
  modifierPromotionVendeur,
  supprimerPromotionVendeur,
  resolveMediaUrl,
  getUser,
  onSessionChange,
  updateVendeurProfil,
  uploaderDocumentsVendeur,
  fetchNotifications as apiFetchNotifications,
  markNotificationRead as apiMarkNotificationRead,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
} from '@/services/api';

// `categorie_principale` (vrai type de commerce) et `message_boutique` sont bien renvoyés par
// GET /vendeur/dashboard (voir VendeurController::dashboard()) mais pas encore déclarés sur
// l'interface partagée ApiVendeurDashboard de services/api.ts — ce petit complément local évite de
// modifier ce fichier partagé pour 2 champs.
type ApiVendeurDashboardWithExtras = ApiVendeurDashboard & {
  categorie_principale?: string | null;
  message_boutique?: string | null;
};

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

// Remplace l'ancienne liste factice locale (même -10% pour tous les vendeurs, jamais persistée)
// par les vraies promotions créées via POST /vendeur/promotions, exposées ici via GET
// /vendeur/promotions. `terminee` reflète maintenant un vrai état (désactivée ou date de fin
// dépassée) plutôt qu'un champ jamais renseigné.
function mapApiPromotionToPromotion(p: ApiPromotionVendeur): Promotion {
  const valeur = typeof p.valeur_reduction === 'string' ? parseFloat(p.valeur_reduction) : p.valeur_reduction;
  const dateFin = p.date_fin ? new Date(p.date_fin) : null;
  return {
    id: p.id,
    titre: p.titre,
    produit: p.produit?.nom_produit || 'Toute la boutique',
    pourcentage: p.type_reduction === 'pourcentage' ? valeur : 0,
    dateDebut: new Date(p.date_debut).toLocaleDateString('fr-FR'),
    dateFin: dateFin ? dateFin.toLocaleDateString('fr-FR') : '—',
    actif: p.actif,
    terminee: !p.actif || (dateFin ? dateFin.getTime() < Date.now() : false),
  };
}

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

const INITIAL_PRODUCTS: VendorProduct[] = [];

const INITIAL_ORDERS: VendorOrder[] = [];

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
  // Nombre réel de commandes livrées sur les 7 derniers jours (GET /vendeur/revenus →
  // commandes_semaine) — remplace l'ancien "42" figé de l'écran "Mes revenus" (onglet semaine).
  commandesSemaine: number;
  ventesSemaine: { jour: string; montant: number }[];
  produitsPlusVendus: { nom: string; ventes: number }[];
  // Valeur actuelle du réglage admin (retrait_montant_minimum, voir /admin/parametres) — remplace
  // le seuil "1000" codé en dur dans l'écran "Coordonnées de paiement", qui restait figé si l'admin
  // changeait ce réglage.
  retraitMontantMinimum: number;
};

const DEFAULT_STATS: SalesStats = {
  chiffreAffaires: 0,
  commandesTotal: 0,
  commandesLivrees: 0,
  commandesEnAttente: 0,
  panierMoyen: 0,
  revenuJour: 0,
  commandesJour: 0,
  commandesSemaine: 0,
  ventesSemaine: [
    { jour: 'LUN', montant: 0 },
    { jour: 'MAR', montant: 0 },
    { jour: 'MER', montant: 0 },
    { jour: 'JEU', montant: 0 },
    { jour: 'VEN', montant: 0 },
    { jour: 'SAM', montant: 0 },
    { jour: 'DIM', montant: 0 },
  ],
  produitsPlusVendus: [],
  retraitMontantMinimum: 1000,
};

export type Boutique = {
  nom: string;
  // Vrai type de commerce choisi à l'inscription (vendeurs.categorie_principale, ex: "Poissonnier
  // & Produits de mer", "Mode & Habillement"...) — remplace l'ancien texte fixe "Poissonnerie"
  // affiché sur l'écran Profil quel que soit le commerce réel du vendeur.
  categoriePrincipale: string;
  // `emoji` n'est plus un choix libre du vendeur (aucune colonne ne le stockait : le sélecteur
  // "Emoji de la boutique" de profile-info.tsx laissait croire à un réglage jamais enregistré) —
  // toujours dérivé de `categoriePrincipale` via deriveStoreEmoji() ci-dessous.
  emoji: string;
  note: number;
  avisCount: number;
  statut: BoutiqueStatut;
  messageClients: string;
};

// Dérive un emoji d'illustration à partir du vrai type de commerce (voir commentaire sur
// `categoriePrincipale` ci-dessus). Simple correspondance par mot-clé sur le libellé français
// saisi à l'inscription — volontairement tolérant (le champ reste un texte libre côté serveur).
export function deriveStoreEmoji(categoriePrincipale?: string | null): string {
  const c = (categoriePrincipale || '').toLowerCase();
  if (c.includes('poisson')) return '🐟';
  if (c.includes('bouch') || c.includes('charcut')) return '🥩';
  if (c.includes('maraîch') || c.includes('maraich') || c.includes('fruit') || c.includes('légume') || c.includes('legume')) return '🥬';
  if (c.includes('mode') || c.includes('habill')) return '👗';
  if (c.includes('artisan')) return '🎁';
  if (c.includes('épic') || c.includes('epic') || c.includes('aliment')) return '🛒';
  return '🏪';
}

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
  refreshVendorProfile: () => Promise<void>;

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
  // Mapping nom catégorie → id UUID, chargé depuis GET /categories.
  categoryIdByName: Record<string, string>;
  // Liste ordonnée des vrais noms de catégories (clés de categoryIdByName).
  vendorCategoryNames: string[];
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
  createManualOrder: (input: { nom: string; telephone: string; email?: string; adresse: string; message?: string }) => Promise<VendorOrder>;

  promotions: Promotion[];
  promotionsLoading: boolean;
  refreshPromotions: () => Promise<void>;
  togglePromotion: (id: string) => Promise<void>;
  addPromotion: (input: { titre: string; produit: string; pourcentage: number }) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;

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
    // avisCount démarre à 0 (jamais un nombre inventé) : refreshReviews() ci-dessous l'écrase avec
    // la vraie valeur dès que /vendeur/avis répond ; en cas d'échec, 0 reste un état honnête plutôt
    // qu'un chiffre plausible mais fictif qui persisterait indéfiniment.
    // `note` démarre à 0 pour la même raison : l'ancien 4.7 fixe ne pouvait jamais être remplacé
    // par une vraie note de 0.00 (nouveau vendeur sans avis) à cause du `|| prev.note` utilisé plus
    // bas, qui traite un vrai zéro comme une valeur absente.
    nom: 'Ma boutique', categoriePrincipale: '', emoji: deriveStoreEmoji(null), note: 0, avisCount: 0,
    statut: 'ouverte', messageClients: '',
  });
  const [vendorValidationStatus, setVendorValidationStatus] = useState<VendorValidationStatus | null>(null);
  const [horaires, setHoraires] = useState<Horaire[]>(INITIAL_HORAIRES);
  const [numeroMobileMoneyReception, setNumeroMobileMoneyReception] = useState('');
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
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
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionsLoading, setPromotionsLoading] = useState(false);

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

  // ─── Promotions vendeur réelles (GET /vendeur/promotions) : remplace l'ancienne liste factice
  // locale (le même -10% pour tous les vendeurs, jamais persisté côté serveur).
  const refreshPromotions = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setPromotionsLoading(true);
    try {
      const list = await fetchPromotionsVendeur();
      setPromotions(list.map(mapApiPromotionToPromotion));
    } catch { /* garde la liste précédente (vide au premier chargement) */ }
    finally { setPromotionsLoading(false); }
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

  const refreshVendorProfile = useCallback(async () => {
    try {
      const dashboard = await fetchVendeurDashboard() as ApiVendeurDashboardWithExtras;
      setVendorValidationStatus((dashboard.statut_validation as VendorValidationStatus) || null);
      setBoutique((prev) => ({
        ...prev,
        nom: dashboard.nom_commerce || prev.nom,
        categoriePrincipale: dashboard.categorie_principale || prev.categoriePrincipale,
        emoji: deriveStoreEmoji(dashboard.categorie_principale || prev.categoriePrincipale),
        note: toNumber(dashboard.note_moyenne),
        statut: (dashboard.statut_boutique as BoutiqueStatut) || prev.statut,
        messageClients: dashboard.message_boutique ?? prev.messageClients,
      }));
      setNumeroMobileMoneyReception(dashboard.numero_mobile_money_reception || '');
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
  }, []);

  // ─── Chargement initial depuis l'API réelle (repli sur les données de démo en cas d'échec) ───
  // Extrait en fonction nommée (plutôt qu'inline dans le useEffect) pour pouvoir la relancer à
  // chaque connexion : VendorProvider est monté une seule fois pour toute la durée de vie de l'app
  // (voir _layout.tsx), donc un simple useEffect à `[]` ne se relance jamais si un vendeur se
  // déconnecte puis se reconnecte (ou si un autre compte s'était connecté avant lui) sans redémarrage
  // complet de l'app — l'écran continuait alors d'afficher le prénom/les données du compte précédent.
  const bootstrap = useCallback(async () => {
    refreshCategories();

    const user = await getUser();
    if (user) {
      setVendorFirstName(user.prenom || user.nom_complet?.split(' ')[0] || 'Vendeur');
    }

    setProductsLoading(true);
    try {
      const list = await fetchVendeurProduits();
      setProducts(list.map((p) => mapApiProduitToVendorProduct(p)));
    } catch { /* garde INITIAL_PRODUCTS en mode démo hors-ligne */ }
    finally { setProductsLoading(false); }

    fetchOrders();
    refreshReviews();
    refreshNotifications();
    refreshPromotions();
    refreshVendorProfile();

    try {
      const revenus = await fetchVendeurRevenus();
      setStats((prev) => ({
        ...prev,
        chiffreAffaires: toNumber(revenus.revenus_nets) || prev.chiffreAffaires,
        panierMoyen: revenus.panier_moyen !== undefined ? toNumber(revenus.panier_moyen) : prev.panierMoyen,
        ventesSemaine: revenus.ventes_semaine
          ? revenus.ventes_semaine.map((v) => ({ jour: v.jour, montant: toNumber(v.montant) }))
          : prev.ventesSemaine,
        commandesSemaine: revenus.commandes_semaine !== undefined ? revenus.commandes_semaine : prev.commandesSemaine,
        produitsPlusVendus: revenus.produits_plus_vendus?.length ? revenus.produits_plus_vendus : prev.produitsPlusVendus,
        retraitMontantMinimum: revenus.retrait_montant_minimum ?? prev.retraitMontantMinimum,
      }));
    } catch { /* garde les stats de démo */ }
  }, [refreshCategories, refreshReviews, refreshNotifications, refreshPromotions, refreshVendorProfile, fetchOrders]);

  useEffect(() => {
    bootstrap();
    return onSessionChange(bootstrap);
  }, [bootstrap]);

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

  // N'utilise plus updateStatutBoutiqueVendeur() (services/api.ts) directement : ce helper ne
  // transmet que `statut_boutique`, alors que l'écran "Statut de la boutique" envoie aussi un
  // message aux clients désormais réellement persisté (voir VendeurController::dashboard() /
  // mettreAJourStatutBoutique()) — l'appel HTTP est donc fait ici pour inclure ce second champ
  // sans modifier la signature de la fonction partagée.
  const updateBoutiqueStatus = useCallback(async (statut: BoutiqueStatut, message?: string) => {
    const finalMessage = message ?? boutique.messageClients;
    const response = await api.put<ApiResponse>('/vendeur/statut-boutique', {
      statut_boutique: statut,
      message_boutique: finalMessage || null,
    });
    if (!response.data.success) throw new Error(response.data.message || 'Impossible de mettre à jour le statut de la boutique.');
    setBoutique((prev) => ({ ...prev, statut, messageClients: finalMessage }));
  }, [boutique.messageClients]);

  const updateHoraire = useCallback((jour: string, patch: Partial<Horaire>) => {
    setHoraires((prev) => prev.map((h) => (h.jour === jour ? { ...h, ...patch } : h)));
  }, []);

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), [products]);

  const addProduct = useCallback(async (input: { nom: string; categorie: string; prix: number; stock: number; unite?: string; fraicheur?: 'frais' | 'fume' | 'congele'; description?: string; image?: string }) => {
    let map = categoryIdByName;
    if (Object.keys(map).length === 0) {
      map = await refreshCategories();
    }
    let categorieId = map[input.categorie];
    if (!categorieId) {
      const inputLower = input.categorie.toLowerCase().trim();
      const entry = Object.entries(map).find(([name]) => {
        const nameLower = name.toLowerCase();
        return nameLower.includes(inputLower) || inputLower.includes(nameLower);
      });
      if (entry) {
        categorieId = entry[1];
      } else if (Object.keys(map).length > 0) {
        categorieId = Object.values(map)[0];
      }
    }
    if (!categorieId) throw new Error('Catégorie non résolue');

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

  // POST /vendeur/commandes/manuelle (voir VendeurController::creerCommandeManuelle) — remplace
  // l'ancienne fabrication locale d'une commande avec un id aléatoire jamais envoyée au serveur :
  // le vendeur croyait avoir enregistré une commande (message de succès, navigation vers son
  // détail) alors qu'elle disparaissait au prochain rafraîchissement de la liste ou redémarrage de
  // l'app. Appelle directement `api` (plutôt qu'un nouveau helper dans services/api.ts) pour ce
  // tout nouvel endpoint.
  const createManualOrder = useCallback(async (input: { nom: string; telephone: string; email?: string; adresse: string; message?: string }) => {
    const response = await api.post<ApiResponse<ApiCommande>>('/vendeur/commandes/manuelle', {
      nom: input.nom,
      telephone: input.telephone,
      email: input.email,
      adresse: input.adresse,
      message: input.message,
    });
    if (!response.data.data) throw new Error(response.data.message || 'Erreur lors de la création de la commande.');
    const created = mapApiCommandeToVendorOrder(response.data.data);
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

  // N'affiche plus un simple mélange local — l'échec remonte à l'écran (voir promotions.tsx) au
  // lieu de laisser croire que le bascule a réussi côté serveur alors que rien n'a changé.
  const togglePromotion = useCallback(async (id: string) => {
    const current = promotions.find((p) => p.id === id);
    if (!current) return;
    const updated = await modifierPromotionVendeur(id, { actif: !current.actif });
    setPromotions((prev) => prev.map((p) => (p.id === id ? mapApiPromotionToPromotion(updated) : p)));
  }, [promotions]);

  // `input.produit` est le nom d'un produit du catalogue du vendeur (voir promotions.tsx, qui ne
  // laisse choisir que parmi `products`) — résolu ici en produit_id réel pour l'API. Si aucun
  // produit ne correspond (catalogue vide), la promotion s'applique à toute la boutique.
  const addPromotion = useCallback(async (input: { titre: string; produit: string; pourcentage: number }) => {
    const matched = products.find((p) => p.nom === input.produit);
    const created = await creerPromotionVendeur({
      titre: input.titre,
      produit_id: matched?.id ?? null,
      valeur_reduction: input.pourcentage,
      type_reduction: 'pourcentage',
    });
    setPromotions((prev) => [mapApiPromotionToPromotion(created), ...prev]);
  }, [products]);

  const deletePromotion = useCallback(async (id: string) => {
    await supprimerPromotionVendeur(id);
    setPromotions((prev) => prev.filter((p) => p.id !== id));
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

  const vendorCategoryNames = useMemo(() => Object.keys(categoryIdByName), [categoryIdByName]);

  const value = useMemo(() => ({
    vendorFirstName,
    boutique, updateBoutiqueStatus, vendorValidationStatus, refreshVendorProfile,
    horaires, updateHoraire, saveHoraires,
    numeroMobileMoneyReception, updateNumeroMobileMoneyReception,
    products, productsLoading, categoriesReady, categoryIdByName, vendorCategoryNames, refreshCategories,
    addProduct, updateProduct, toggleProductAvailability, adjustStock, addVariant, getProduct,
    orders, ordersLoading, hasMoreOrders, refreshOrders: fetchOrders, loadMoreOrders, getOrder, acceptOrder, refuseOrder, setOrderStatus, setPrepStep, createManualOrder,
    promotions, promotionsLoading, refreshPromotions, togglePromotion, addPromotion, deletePromotion,
    notifications, notificationsLoading, unreadNotificationsCount, refreshNotifications, markNotificationRead, markAllNotificationsRead,
    reviews, reviewsLoading, refreshReviews,
    documents, uploadDocument,
    stats,
  }), [
    vendorFirstName, boutique, updateBoutiqueStatus, vendorValidationStatus, refreshVendorProfile, horaires, updateHoraire, saveHoraires,
    numeroMobileMoneyReception, updateNumeroMobileMoneyReception,
    products, productsLoading, categoriesReady, categoryIdByName, vendorCategoryNames, refreshCategories,
    addProduct, updateProduct, toggleProductAvailability, adjustStock, addVariant, getProduct,
    orders, ordersLoading, hasMoreOrders, fetchOrders, loadMoreOrders, getOrder, acceptOrder, refuseOrder, setOrderStatus, setPrepStep, createManualOrder,
    promotions, promotionsLoading, refreshPromotions, togglePromotion, addPromotion, deletePromotion,
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

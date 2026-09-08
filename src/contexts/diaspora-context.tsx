import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useClient } from '@/contexts/client-context';
import {
  fetchBeneficiaires, createBeneficiaire, updateBeneficiaire, deleteBeneficiaire, fetchDiasporaHistorique,
  convertirDevise, getUser, onSessionChange, updateUserProfile,
  type ApiBeneficiaire, type BeneficiaireInputPayload, type ApiCommande,
} from '@/services/api';

const BENEFICIARIES_KEY = '@zando_diaspora_beneficiaries';
const SELECTED_BENEFICIARY_KEY = '@zando_diaspora_selected_beneficiary';
const SETTINGS_KEY = '@zando_diaspora_settings';
const SHIPMENTS_KEY = '@zando_diaspora_shipments';
const LAST_ORDER_KEY = '@zando_diaspora_last_order';

// Taux FCFA/EUR de repli (parité officielle XAF/EUR) si le taux du jour (`/diaspora/convertir`)
// est indisponible — en pratique le backend renvoie la même valeur, la parité étant fixe.
export const FCFA_PER_EUR = 655.957;
// Taux FCFA/USD de repli si le taux du jour (`/diaspora/convertir`) est indisponible
export const FCFA_PER_USD_FALLBACK = 600;

let liveFcfaPerEur = FCFA_PER_EUR;
let liveFcfaPerUsd = FCFA_PER_USD_FALLBACK;
export function fcfaToEur(fcfa: number): number {
  return fcfa / liveFcfaPerEur;
}
export function fcfaToUsd(fcfa: number): number {
  return fcfa / liveFcfaPerUsd;
}
export function formatEur(fcfa: number): string {
  return `${fcfaToEur(fcfa).toFixed(2).replace('.', ',')} €`;
}
export function formatUsd(fcfa: number): string {
  return `$${fcfaToUsd(fcfa).toFixed(2)}`;
}
export function formatFcfa(fcfa: number): string {
  return `${Math.round(fcfa).toLocaleString('fr-FR')} FCFA`;
}
// Affiche les trois devises de façon compacte
export function formatTriple(fcfa: number): string {
  return `${formatFcfa(fcfa)} · ${formatEur(fcfa)} · ${formatUsd(fcfa)}`;
}
// Respecte la devise choisie dans les paramètres (EUR/USD) — jusqu'ici le réglage n'avait aucun
// effet visible : tous les écrans affichaient toujours l'euro quel que soit le choix de l'utilisateur.
export function formatPreferred(fcfa: number, devise: 'EUR' | 'USD'): string {
  return devise === 'USD' ? formatUsd(fcfa) : formatEur(fcfa);
}

export type Beneficiary = {
  id: string;
  nom: string;
  telephone: string;
  ville: string;
  adresse?: string;
  quartier?: string;
  coordonneesGps?: string;
  instructions?: string;
  relation?: string;
  favori?: boolean;
};

// Construction de l'adresse de livraison affichée à l'écran d'adresse ET envoyée à la commande :
// une seule fonction partagée pour éviter que les deux écrans divergent.
export function buildDeliveryAddress(beneficiary: Beneficiary | null, instructions?: string): string {
  if (!beneficiary) return '';
  const ville = beneficiary.ville || 'Brazzaville';
  const base = beneficiary.adresse
    ? `${beneficiary.adresse}${beneficiary.quartier ? ', ' + beneficiary.quartier : ''}, ${ville}`
    : `Quartier ${beneficiary.quartier || ville}, ${ville}`;
  return instructions?.trim() ? `${base} — Instructions : ${instructions.trim()}` : base;
}

export type BeneficiaryInput = {
  nom: string;
  telephone: string;
  ville: string;
  adresse?: string;
  quartier?: string;
  coordonneesGps?: string;
  instructions?: string;
  relation?: string;
};

function mapApiToBeneficiary(b: ApiBeneficiaire): Beneficiary {
  return {
    id: b.id,
    nom: b.nom,
    telephone: b.telephone,
    ville: b.ville || '',
    adresse: b.adresse || undefined,
    quartier: b.quartier || undefined,
    coordonneesGps: b.coordonnees_gps ? `${b.coordonnees_gps.lat}, ${b.coordonnees_gps.lng}` : undefined,
    instructions: b.instructions || undefined,
    relation: b.relation || undefined,
    favori: b.est_defaut,
  };
}

function mapInputToApiPayload(input: BeneficiaryInput): BeneficiaireInputPayload {
  let coordonnees_gps: { lat: number; lng: number } | undefined;
  if (input.coordonneesGps) {
    const parts = input.coordonneesGps.split(',').map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
      coordonnees_gps = { lat: parts[0], lng: parts[1] };
    }
  }
  return {
    nom: input.nom,
    telephone: input.telephone,
    ville: input.ville || undefined,
    adresse: input.adresse || '',
    quartier: input.quartier || '',
    relation: input.relation || undefined,
    coordonnees_gps,
    instructions: input.instructions || undefined,
  };
}

// `id` = UUID réel de la commande (nécessaire pour /commandes/{id}/notation, /commandes/{id}) ;
// `numeroCommande` = code humain (nécessaire pour /diaspora/suivi/{numeroCommande} et l'affichage).
// Les deux ont longtemps été confondus sous un seul champ `id`, cassant selon l'usage l'un ou l'autre.
export type LastOrder = { id: string; numeroCommande: string; montantFcfa: number };

export type ShipmentStatus = 'livree' | 'en_cours' | 'annulee';

export type ShipmentItem = {
  nom: string;
  quantite: string;
  prix: number; // FCFA
};

export type Shipment = {
  id: string;
  // UUID réel de la commande (clé primaire backend) — distinct de `id` (numero_commande, utilisé
  // pour l'affichage et la navigation) : /commandes/{id}/notation attend cet UUID, jamais le numéro.
  rawId: string;
  beneficiaireNom: string;
  quartier: string;
  montantFcfa: number;
  statut: ShipmentStatus;
  date: string;
  heure?: string;
  produits: ShipmentItem[];
  fraisLivraison: number;
  creneau: string;
  paiementMethode: string;
  paiementDetail?: string;
  vendeur?: string;
  livreur?: string;
  needsRating: boolean;
};

function mapApiCommandeToShipment(c: ApiCommande): Shipment {
  let statut: ShipmentStatus = 'en_cours';
  if (c.statut_commande === 'livree') statut = 'livree';
  else if (c.statut_commande === 'annulee') statut = 'annulee';

  const dateObj = c.date_commande || c.created_at ? new Date(c.date_commande || c.created_at!) : new Date();
  const dateFormatted = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const heureFormatted = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const montantTotal = typeof c.montant_sous_total === 'string' ? parseFloat(c.montant_sous_total) : (c.montant_sous_total || 0);
  const fraisLivraison = typeof c.frais_livraison === 'string' ? parseFloat(c.frais_livraison) : (c.frais_livraison || 0);

  // Une commande livrée reste "à noter" tant que le vendeur ET/OU le livreur présents n'ont pas
  // encore reçu de note de ce client (mêmes règles que orders.tsx côté local).
  const notations = c.notations || [];
  const vendeurNote = notations.some((n) => n.type_cible === 'vendeur');
  const livreurNote = notations.some((n) => n.type_cible === 'livreur');
  const needsRating = statut === 'livree' && ((!!c.vendeur && !vendeurNote) || (!!c.livreur && !livreurNote));

  return {
    id: c.numero_commande || `ZNND-DIAS-${c.id.slice(0, 6)}`,
    rawId: c.id,
    beneficiaireNom: c.client?.user?.nom_complet || 'Bénéficiaire',
    quartier: c.adresse_livraison || 'Brazzaville',
    montantFcfa: montantTotal,
    statut,
    date: dateFormatted,
    heure: heureFormatted,
    produits: (c.lignes || []).map((l) => ({
      nom: l.produit?.nom_produit || 'Article',
      quantite: `${l.quantite} x`,
      prix: typeof l.sous_total === 'string' ? parseFloat(l.sous_total) : (l.sous_total || 0),
    })),
    fraisLivraison,
    creneau: '08h - 18h',
    paiementMethode: c.paiement?.methode || 'Carte bancaire / MoMo',
    paiementDetail: c.paiement?.reference || undefined,
    vendeur: c.vendeur?.nom_commerce || c.vendeur?.user?.nom_complet || undefined,
    livreur: c.livreur?.user?.nom_complet || undefined,
    needsRating,
  };
}

export type DiasporaSettings = {
  paysResidence: string;
  devise: 'EUR' | 'USD';
  notifSms: boolean;
  notifEmail: boolean;
};

// Ancien contenu de démo (bénéficiaires/envois fictifs) supprimé : servait de valeur initiale à
// `useState`, donc restait affiché comme si c'était réel quand l'API échouait au tout premier
// lancement (avant qu'aucun cache local n'existe). Un tableau vide + un état de chargement honnête
// valent mieux qu'une donnée fabriquée.
const DEFAULT_BENEFICIARIES: Beneficiary[] = [];
const DEFAULT_SHIPMENTS: Shipment[] = [];

const DEFAULT_SETTINGS: DiasporaSettings = {
  paysResidence: 'France',
  devise: 'EUR',
  notifSms: true,
  notifEmail: true,
};

type DiasporaContextValue = {
  diasporaModeActive: boolean;
  activateDiasporaMode: () => void;

  beneficiaries: Beneficiary[];
  addBeneficiary: (input: BeneficiaryInput) => Promise<Beneficiary>;
  editBeneficiary: (id: string, input: Partial<BeneficiaryInput>) => Promise<void>;
  removeBeneficiary: (id: string) => Promise<void>;
  toggleFavoriteBeneficiary: (id: string) => Promise<void>;

  selectedBeneficiary: Beneficiary | null;
  setSelectedBeneficiary: (b: Beneficiary | null) => void;

  shipments: Shipment[];
  getShipment: (id: string) => Shipment | undefined;
  addShipment: (shipment: Shipment) => Promise<void>;

  lastOrder: LastOrder | null;
  setLastOrder: (order: LastOrder | null) => void;

  settings: DiasporaSettings;
  updateSettings: (input: Partial<DiasporaSettings>) => Promise<void>;

  usdRate: number;
  eurRate: number;
  deliveryInstructions: string;
  setDeliveryInstructions: (value: string) => void;
};

const DiasporaContext = createContext<DiasporaContextValue | null>(null);

export function DiasporaProvider({ children }: { children: ReactNode }) {
  const { isDiaspora } = useClient();
  const [diasporaModeActive, setDiasporaModeActive] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(DEFAULT_BENEFICIARIES);
  const [selectedBeneficiary, setSelectedBeneficiaryState] = useState<Beneficiary | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>(DEFAULT_SHIPMENTS);
  const [lastOrder, setLastOrderState] = useState<LastOrder | null>(null);
  const [settings, setSettings] = useState<DiasporaSettings>(DEFAULT_SETTINGS);
  const [usdRate, setUsdRate] = useState(FCFA_PER_USD_FALLBACK);
  const [eurRate, setEurRate] = useState(FCFA_PER_EUR);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Si l'utilisateur n'est PAS un client diaspora, on réinitialise le bénéficiaire sélectionné
  // pour éviter toute confusion entre le flux local et le flux diaspora.
  useEffect(() => {
    if (!isDiaspora && selectedBeneficiary) {
      setSelectedBeneficiaryState(null);
      AsyncStorage.removeItem(SELECTED_BENEFICIARY_KEY).catch(() => {});
    }
  }, [isDiaspora, selectedBeneficiary]);

  // Extrait en fonction nommée (plutôt qu'inline dans le useEffect) pour pouvoir la relancer à
  // chaque connexion (voir onSessionChange dans services/api.ts) : DiasporaProvider est monté une
  // seule fois pour toute la durée de vie de l'app (voir _layout.tsx), donc sans ça un changement
  // de compte pendant que l'app tourne déjà laissait bénéficiaires/réglages/historique de l'ancien
  // compte affichés.
  const bootstrap = useCallback(async () => {
    // Comme le provider vendeur, celui-ci est monté pour tout le monde alors que ses appels visent
    // /diaspora/*, réservés aux clients. Pour un vendeur ou un livreur ils repartaient en 403 tout
    // en occupant la file d'attente du serveur. On ne charge donc que pour un compte client.
    // Y compris quand personne n'est connecté : un visiteur n'a ni bénéficiaires ni historique, et
    // les taux de change ne servent qu'au mode diaspora. Une connexion ultérieure relance de toute
    // façon ce bootstrap via onSessionChange().
    const utilisateur = await getUser();
    if (utilisateur?.type_utilisateur !== 'client') return;

    (async () => {
      // Bénéficiaires : source de vérité = API. Le cache local ne sert que de repli
      // (hors-ligne ou backend indisponible en dev), jamais affiché s'il y a une réponse serveur.
      let loadedFromApi = false;
      try {
        const apiList = await fetchBeneficiaires();
        setBeneficiaries(apiList.map(mapApiToBeneficiary));
        await AsyncStorage.setItem(BENEFICIARIES_KEY, JSON.stringify(apiList.map(mapApiToBeneficiary))).catch(() => {});
        loadedFromApi = true;
      } catch { /* backend indisponible : on retombe sur le cache local ci-dessous */ }

      if (!loadedFromApi) {
        try {
          const rawB = await AsyncStorage.getItem(BENEFICIARIES_KEY);
          if (rawB) setBeneficiaries(JSON.parse(rawB));
        } catch { /* ignore */ }
      }
      try {
        const rawS = await AsyncStorage.getItem(SETTINGS_KEY);
        if (rawS) {
          setSettings((prev) => ({ ...prev, ...JSON.parse(rawS) }));
        } else {
          // Pas de préférences locales enregistrées : on amorce avec les vraies infos du compte
          // (saisies à l'inscription) plutôt qu'avec "France / EUR" par défaut pour tout le monde.
          const user = await getUser();
          setSettings((prev) => ({
            ...prev,
            paysResidence: user?.pays_residence || prev.paysResidence,
            devise: user?.devise_preferee === 'USD' ? 'USD' : prev.devise,
          }));
        }
      } catch { /* ignore */ }
      try {
        const conversion = await convertirDevise(1, 'USD');
        if (conversion.taux_applique > 0) {
          liveFcfaPerUsd = conversion.taux_applique;
          setUsdRate(conversion.taux_applique);
        }
      } catch { /* taux du jour indisponible : on garde le taux de repli */ }
      try {
        const conversion = await convertirDevise(1, 'EUR');
        if (conversion.taux_applique > 0) {
          liveFcfaPerEur = conversion.taux_applique;
          setEurRate(conversion.taux_applique);
        }
      } catch { /* taux du jour indisponible : on garde la parité fixe de repli */ }
      try {
        const apiShipments = await fetchDiasporaHistorique();
        if (apiShipments && apiShipments.length > 0) {
          const mapped = apiShipments.map(mapApiCommandeToShipment);
          setShipments(mapped);
          await AsyncStorage.setItem(SHIPMENTS_KEY, JSON.stringify(mapped)).catch(() => {});
        } else {
          const rawSh = await AsyncStorage.getItem(SHIPMENTS_KEY);
          if (rawSh) setShipments(JSON.parse(rawSh));
        }
      } catch {
        try {
          const rawSh = await AsyncStorage.getItem(SHIPMENTS_KEY);
          if (rawSh) setShipments(JSON.parse(rawSh));
        } catch { /* ignore */ }
      }
      try {
        const rawSel = await AsyncStorage.getItem(SELECTED_BENEFICIARY_KEY);
        if (rawSel) setSelectedBeneficiaryState(JSON.parse(rawSel));
      } catch { /* ignore */ }
      try {
        // Restaure la dernière commande diaspora après relance de l'app — sans ça, l'écran de
        // suivi et le lien "Noter cette commande" perdaient tout accès dès que l'app était fermée.
        const rawLastOrder = await AsyncStorage.getItem(LAST_ORDER_KEY);
        if (rawLastOrder) setLastOrderState(JSON.parse(rawLastOrder));
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    bootstrap();
    return onSessionChange(bootstrap);
  }, [bootstrap]);

  const persistBeneficiaries = useCallback(async (next: Beneficiary[]) => {
    setBeneficiaries(next);
    await AsyncStorage.setItem(BENEFICIARIES_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const activateDiasporaMode = useCallback(() => setDiasporaModeActive(true), []);

  // Erreur réseau/serveur (backend indisponible en dev) : on continue en local plutôt que de bloquer l'utilisateur.
  // Une erreur de validation (422, etc.) est en revanche propagée pour être affichée dans le formulaire.
  const isNetworkOrServerError = (error: any) => !error?.status || error.status >= 500;

  const addBeneficiary = useCallback(async (input: BeneficiaryInput) => {
    try {
      const apiCreated = await createBeneficiaire(mapInputToApiPayload(input));
      const created = mapApiToBeneficiary(apiCreated);
      await persistBeneficiaries([...beneficiaries, created]);
      return created;
    } catch (error) {
      if (!isNetworkOrServerError(error)) throw error;
      const created: Beneficiary = { id: 'ben_' + Date.now(), ...input };
      await persistBeneficiaries([...beneficiaries, created]);
      return created;
    }
  }, [beneficiaries, persistBeneficiaries]);

  const editBeneficiary = useCallback(async (id: string, input: Partial<BeneficiaryInput>) => {
    let next: Beneficiary[];
    try {
      const apiUpdated = await updateBeneficiaire(id, mapInputToApiPayload({ ...beneficiaries.find((b) => b.id === id), ...input } as BeneficiaryInput));
      const updated = mapApiToBeneficiary(apiUpdated);
      next = beneficiaries.map((b) => (b.id === id ? updated : b));
    } catch (error) {
      if (!isNetworkOrServerError(error)) throw error;
      next = beneficiaries.map((b) => (b.id === id ? { ...b, ...input } : b));
    }
    await persistBeneficiaries(next);
    if (selectedBeneficiary?.id === id) {
      setSelectedBeneficiary(next.find((b) => b.id === id) || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beneficiaries, persistBeneficiaries, selectedBeneficiary]);

  const removeBeneficiary = useCallback(async (id: string) => {
    // On applique la suppression locale EN PREMIER — immédiatement visible dans l'UI.
    setBeneficiaries((prev) => {
      const next = prev.filter((b) => b.id !== id);
      AsyncStorage.setItem(BENEFICIARIES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    if (selectedBeneficiary?.id === id) setSelectedBeneficiary(null);
    // Ensuite on tente la synchronisation avec l'API en arrière-plan (sans bloquer l'UI).
    // Une erreur 404 signifie que l'item n'existe plus côté serveur → on ignore.
    // Une erreur réseau/serveur est également ignorée (la suppression locale est suffisante).
    try {
      await deleteBeneficiaire(id);
    } catch { /* Suppression locale déjà appliquée ci-dessus — l'erreur API n'annule rien */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBeneficiary]);

  const toggleFavoriteBeneficiary = useCallback(async (id: string) => {
    try {
      await updateBeneficiaire(id, { est_defaut: true });
    } catch (error) {
      if (!isNetworkOrServerError(error)) throw error;
    }
    const next = beneficiaries.map((b) => ({ ...b, favori: b.id === id ? !b.favori : false }));
    await persistBeneficiaries(next);
  }, [beneficiaries, persistBeneficiaries]);

  const setSelectedBeneficiary = useCallback((b: Beneficiary | null) => {
    setSelectedBeneficiaryState(b);
    if (b) AsyncStorage.setItem(SELECTED_BENEFICIARY_KEY, JSON.stringify(b)).catch(() => {});
    else AsyncStorage.removeItem(SELECTED_BENEFICIARY_KEY).catch(() => {});
  }, []);

  const setLastOrder = useCallback((order: LastOrder | null) => {
    setLastOrderState(order);
    if (order) AsyncStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order)).catch(() => {});
    else AsyncStorage.removeItem(LAST_ORDER_KEY).catch(() => {});
  }, []);

  const getShipment = useCallback((id: string) => shipments.find((s) => s.id === id), [shipments]);

  const addShipment = useCallback(async (shipment: Shipment) => {
    const next = [shipment, ...shipments];
    setShipments(next);
    await AsyncStorage.setItem(SHIPMENTS_KEY, JSON.stringify(next)).catch(() => {});
  }, [shipments]);

  const updateSettings = useCallback(async (input: Partial<DiasporaSettings>) => {
    const next = { ...settings, ...input };
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
    // Le pays de résidence et la devise sont de vrais champs du compte côté serveur (contrairement
    // aux préférences de notification, purement locales) : on les synchronise pour qu'ils survivent
    // à un changement d'appareil, sans jamais bloquer l'UI si le réseau est indisponible.
    if (input.paysResidence !== undefined || input.devise !== undefined) {
      try {
        await updateUserProfile({
          ...(input.paysResidence !== undefined ? { pays_residence: input.paysResidence } : {}),
          ...(input.devise !== undefined ? { devise_preferee: input.devise } : {}),
        });
      } catch { /* préférence conservée localement, resynchronisée à la prochaine occasion */ }
    }
  }, [settings]);

  const value = useMemo(() => ({
    diasporaModeActive,
    activateDiasporaMode,
    beneficiaries,
    addBeneficiary,
    editBeneficiary,
    removeBeneficiary,
    toggleFavoriteBeneficiary,
    selectedBeneficiary,
    setSelectedBeneficiary,
    shipments,
    getShipment,
    addShipment,
    lastOrder,
    setLastOrder,
    settings,
    updateSettings,
    usdRate,
    eurRate,
    deliveryInstructions,
    setDeliveryInstructions,
  }), [
    diasporaModeActive, activateDiasporaMode, beneficiaries, addBeneficiary,
    editBeneficiary, removeBeneficiary, toggleFavoriteBeneficiary,
    selectedBeneficiary, setSelectedBeneficiary, shipments, getShipment, addShipment,
    lastOrder, settings, updateSettings, usdRate, eurRate, deliveryInstructions,
  ]);

  return <DiasporaContext.Provider value={value}>{children}</DiasporaContext.Provider>;
}

export function useDiaspora() {
  const value = useContext(DiasporaContext);
  if (!value) throw new Error('useDiaspora must be used within DiasporaProvider');
  return value;
}

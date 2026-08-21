import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeliveryAddress, DeliveryAddressInput, LoginUser, ApiProduit, ApiCategorie, ApiZone, CommandeResult } from '@/services/api';
import {
  fetchAddresses,
  createAddress as apiCreateAddress,
  updateAddress as apiUpdateAddress,
  deleteAddress as apiDeleteAddress,
  setDefaultAddress as apiSetDefaultAddress,
  getUser as apiGetUser,
  fetchMe as apiFetchMe,
  setUser as apiSetUser,
  updateUserProfile as apiUpdateUserProfile,
  uploadUserPhoto as apiUploadUserPhoto,
  fetchProduits,
  fetchProduitsPopulaires,
  fetchProduitsRecents,
  fetchProduitsPromotions,
  fetchCategories,
  fetchZones,
  resolveMediaUrl,
  viderPanier,
  ajouterAuPanier,
  assignerBeneficiairePanier,
  validerCommande,
  commanderPourProche,
} from '@/services/api';

const ADDRESSES_STORAGE_KEY = '@zando_client_addresses';
const SELECTED_ADDRESS_KEY = '@zando_client_selected_address';
const FAVORITES_KEY = '@zando_client_favorites';
const PRODUCTS_CACHE_KEY = '@zando_client_products_cache';
const CATEGORIES_CACHE_KEY = '@zando_client_categories_cache';
const CATEGORY_ICONS_CACHE_KEY = '@zando_client_category_icons_cache';

// Utilisées uniquement si l'API et le cache local sont tous deux indisponibles (premier lancement hors-ligne).
const FALLBACK_CATEGORIES = [
  'Poisson', 'Viande', 'Volaille', 'Légumes', 'Fruits',
  'Condiments', 'Épicerie', 'Riz & Céréales', 'Œufs',
  'Produits laitiers', 'Boissons', 'Boulangerie', 'Snacks',
];

export type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
  emoji: string;
  category: string;
  rating: number;
  reviews: number;
  image?: string;
  description?: string;
  origin?: string;
  stock?: boolean;
  fraicheur?: 'frais' | 'fume' | 'congele' | null;
};

function mapApiProduitToProduct(p: ApiProduit): Product {
  return {
    id: p.id,
    name: p.nom_produit,
    price: typeof p.prix_unitaire === 'string' ? parseFloat(p.prix_unitaire) : p.prix_unitaire,
    unit: `FCFA/${p.unite_mesure}`,
    emoji: '🛒',
    category: p.categorie?.nom_categorie || '',
    rating: 0,
    reviews: 0,
    image: resolveMediaUrl(p.photo_produit),
    description: p.description || undefined,
    stock: p.statut_disponibilite === 'disponible' && p.quantite_stock > 0,
    fraicheur: p.type_fraicheur,
  };
}

function mapApiCategorieToName(c: ApiCategorie): string {
  return c.nom_categorie;
}

export type SlotSelection = {
  day: 'today' | 'tomorrow';
  label: string; // ex: "10h - 12h"
  debut: string; // ISO
  fin: string; // ISO
};

// Calcule les horodatages ISO d'un créneau à partir du jour et du libellé (ex: "10h - 12h").
export function computeSlotDates(day: 'today' | 'tomorrow', label: string): { debut: string; fin: string } {
  const [startStr, endStr] = label.split(' - ');
  const base = new Date();
  if (day === 'tomorrow') base.setDate(base.getDate() + 1);
  const [startH] = startStr.replace('h', ':').split(':').map(Number);
  const [endH] = endStr.replace('h', ':').split(':').map(Number);
  const debut = new Date(base);
  debut.setHours(startH, 0, 0, 0);
  const fin = new Date(base);
  fin.setHours(endH, 0, 0, 0);
  // Si le créneau du jour est déjà passé, on le décale au lendemain pour rester valide (le backend exige after:now).
  if (debut.getTime() <= Date.now()) {
    debut.setDate(debut.getDate() + 1);
    fin.setDate(fin.getDate() + 1);
  }
  return { debut: debut.toISOString(), fin: fin.toISOString() };
}

export type PlaceOrderInput = {
  zoneId: string;
  beneficiaireId?: string;
  isDiaspora?: boolean;
  adresseLivraison?: string;
  coordonneesGps?: { lat: number; lng: number };
};

export type PromotedProduct = Product & { promoTitre: string };

type ClientContextValue = {
  // Catalogue
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
  refreshProducts: () => Promise<void>;
  popularProducts: Product[];
  recentProducts: Product[];
  promotedProduct: PromotedProduct | null;
  categories: string[];
  categoryIcons: Record<string, string>;
  categoriesLoading: boolean;
  zones: ApiZone[];
  resolveZoneForAddress: (address: DeliveryAddress | null) => ApiZone | null;
  resolveZoneForQuartier: (quartier?: string | null) => ApiZone | null;

  selectedSlot: SlotSelection | null;
  setSelectedSlot: (slot: SlotSelection | null) => void;

  placeOrder: (input: PlaceOrderInput) => Promise<CommandeResult>;

  cart: Record<string, number>;
  addToCart: (id: string) => void;
  changeQuantity: (id: string, amount: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;

  // Favoris
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;

  // Recherche & Filtre
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Checkout
  addresses: DeliveryAddress[];
  addressesLoading: boolean;
  refreshAddresses: () => Promise<void>;
  addAddress: (input: DeliveryAddressInput) => Promise<DeliveryAddress>;
  editAddress: (id: string, input: Partial<DeliveryAddressInput>) => Promise<DeliveryAddress>;
  removeAddress: (id: string) => Promise<void>;
  makeDefaultAddress: (id: string) => Promise<DeliveryAddress>;
  selectedAddress: DeliveryAddress | null;
  setSelectedAddress: (address: DeliveryAddress | null) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;

// Utilisateur connecté
  currentUser: LoginUser | null;
  userFirstName: string;
  isDiaspora: boolean;
  refreshUser: () => Promise<void>;
  updateProfile: (input: Partial<{ nom: string; prenom: string; ville: string; adresse: string; email: string; date_naissance: string; pays_residence: string; devise_preferee: 'FCFA' | 'USD' | 'EUR' | 'GBP' }>) => Promise<LoginUser>;
  uploadPhoto: (photo: { uri: string; fileName?: string | null; type?: string | null }) => Promise<string>;
};

const ClientContext = createContext<ClientContextValue | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [promotedProduct, setPromotedProduct] = useState<PromotedProduct | null>(null);
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [zones, setZones] = useState<ApiZone[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection | null>(null);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<LoginUser | null>(null);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddress, setSelectedAddressState] = useState<DeliveryAddress | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('airtel');

  const addToCart = (id: string) =>
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

  const changeQuantity = (id: string, amount: number) =>
    setCart((prev) => {
      const next = (prev[id] || 0) + amount;
      const copy = { ...prev };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  const clearCart = () => setCart({});

  // Pas de favoris côté backend : persistés localement pour survivre à un redémarrage de l'app,
  // plutôt que de disparaître silencieusement (ce qu'ils faisaient avant, useState seul).
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        if (raw) setFavorites(JSON.parse(raw));
      } catch { /* ignore */ }
    })();
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = Object.entries(cart).reduce(
    (sum, [id, quantity]) =>
      sum + (products.find((p) => p.id === id)?.price || 0) * quantity,
    0,
  );

  // ─── Catalogue : produits & catégories (API avec repli cache local) ───
  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const apiList = await fetchProduits();
      const mapped = apiList.map(mapApiProduitToProduct);
      let localProducts: Product[] = [];
      try {
        const raw = await AsyncStorage.getItem(PRODUCTS_CACHE_KEY);
        if (raw) {
          const cached: Product[] = JSON.parse(raw);
          localProducts = cached.filter((p) => p.id.startsWith('p_') && !mapped.some((m) => m.id === p.id));
        }
      } catch {}
      const combined = [...localProducts, ...mapped];
      setProducts(combined);
      await AsyncStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(combined)).catch(() => {});
    } catch (_e) {
      try {
        const raw = await AsyncStorage.getItem(PRODUCTS_CACHE_KEY);
        if (raw) {
          setProducts(JSON.parse(raw));
        } else {
          setProductsError('Impossible de charger le catalogue. Vérifiez votre connexion.');
        }
      } catch {
        setProductsError('Impossible de charger le catalogue. Vérifiez votre connexion.');
      }
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const apiList = await fetchCategories();
      const names = apiList.map(mapApiCategorieToName);
      const icons = Object.fromEntries(
        apiList.filter((c) => c.icone).map((c) => [c.nom_categorie, resolveMediaUrl(c.icone!)!])
      );
      if (names.length > 0) {
        setCategories(names);
        setCategoryIcons(icons);
        await AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(names)).catch(() => {});
        await AsyncStorage.setItem(CATEGORY_ICONS_CACHE_KEY, JSON.stringify(icons)).catch(() => {});
      }
    } catch (_e) {
      try {
        const raw = await AsyncStorage.getItem(CATEGORIES_CACHE_KEY);
        if (raw) setCategories(JSON.parse(raw));
        // sinon : conserve FALLBACK_CATEGORIES déjà en état initial
        const rawIcons = await AsyncStorage.getItem(CATEGORY_ICONS_CACHE_KEY);
        if (rawIcons) setCategoryIcons(JSON.parse(rawIcons));
      } catch { /* ignore */ }
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const refreshZones = useCallback(async () => {
    try {
      const apiList = await fetchZones();
      setZones(apiList);
    } catch { /* zones indisponibles : resolveZoneForAddress renverra null, géré côté écrans */ }
  }, []);

  // Produits populaires / récents / promotion active : sections d'accueil basées sur de vraies données
  // plutôt que de trancher arbitrairement le catalogue général ou d'afficher un bandeau inventé.
  const refreshHighlights = useCallback(async () => {
    try {
      const apiList = await fetchProduitsPopulaires();
      setPopularProducts(apiList.map((p) => mapApiProduitToProduct(p)));
    } catch { /* garde la liste vide : l'écran retombe sur le catalogue général */ }
    try {
      const apiList = await fetchProduitsRecents();
      setRecentProducts(apiList.map((p) => mapApiProduitToProduct(p)));
    } catch { /* idem */ }
    try {
      const apiList = await fetchProduitsPromotions();
      const first = apiList.find((p) => p.promotions && p.promotions.length > 0);
      if (first && first.promotions?.[0]) {
        setPromotedProduct({ ...mapApiProduitToProduct(first), promoTitre: first.promotions[0].titre });
      }
    } catch { /* pas de promotion active : le bandeau reste masqué */ }
  }, []);

  useEffect(() => {
    refreshProducts();
    refreshCategories();
    refreshZones();
    refreshHighlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trouve la zone de livraison couvrant un quartier donné (adresse client ou quartier du bénéficiaire diaspora).
  const resolveZoneForQuartier = useCallback((quartier?: string | null): ApiZone | null => {
    if (!quartier) return zones[0] || null;
    const match = zones.find((z) =>
      (z.quartiers_couverts || []).some((q) => q.toLowerCase().trim() === quartier.toLowerCase().trim())
    );
    // Un quartier précisé mais non couvert par aucune zone doit rester `null` (livraison indisponible) :
    // retomber sur zones[0] masquait silencieusement cette absence de couverture.
    return match || null;
  }, [zones]);

  const resolveZoneForAddress = useCallback((address: DeliveryAddress | null): ApiZone | null => {
    return resolveZoneForQuartier(address?.quartier);
  }, [resolveZoneForQuartier]);

  // ─── Création de commande réelle : synchronise le panier local vers le backend, puis valide la commande ───
  const placeOrder = useCallback(async ({ zoneId, beneficiaireId, isDiaspora: diasporaOrder, adresseLivraison, coordonneesGps }: PlaceOrderInput): Promise<CommandeResult> => {
    if (!diasporaOrder && !selectedAddress) throw new Error('Veuillez sélectionner une adresse de livraison.');
    if (diasporaOrder && !adresseLivraison) throw new Error('Adresse du bénéficiaire manquante.');
    if (!selectedSlot) throw new Error('Veuillez choisir un créneau de livraison.');
    const items = Object.entries(cart).filter(([, qty]) => qty > 0);
    if (items.length === 0) throw new Error('Votre panier est vide.');

    // 1. Repartir d'un panier serveur propre puis le reconstituer à l'identique du panier local.
    await viderPanier().catch(() => {});
    for (const [produitId, quantite] of items) {
      await ajouterAuPanier(produitId, quantite);
    }

    // 2. Assigner le bénéficiaire (mode diaspora) si fourni.
    if (beneficiaireId) {
      await assignerBeneficiairePanier(beneficiaireId);
    }

    // 3. Valider la commande (locale ou diaspora selon le contexte d'appel).
    const payload = {
      adresse_livraison: adresseLivraison || `${selectedAddress!.adresse}${selectedAddress!.ville ? ', ' + selectedAddress!.ville : ''}`,
      adresse_livraison_id: (!diasporaOrder && !selectedAddress!.id.startsWith('local_')) ? selectedAddress!.id : undefined,
      zone_id: zoneId,
      creneau_livraison_debut: selectedSlot.debut,
      creneau_livraison_fin: selectedSlot.fin,
      beneficiaire_id: beneficiaireId,
      coordonnees_gps: (coordonneesGps || (selectedAddress?.coordonnees_gps as any)),
    };
    const result = diasporaOrder ? await commanderPourProche(payload) : await validerCommande(payload);
    clearCart();
    return result;
  }, [cart, selectedAddress, selectedSlot, clearCart]);

  // ─── Adresses : persistance locale + API ───
  const refreshAddresses = useCallback(async () => {
    setAddressesLoading(true);
    try {
      // Essaie d'abord l'API. En cas d'échec (pas de backend), lit le cache local.
      const data = await fetchAddresses();
      setAddresses(data);
      await AsyncStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(data));

      // Restaure l'adresse sélectionnée
      const savedId = await AsyncStorage.getItem(SELECTED_ADDRESS_KEY);
      if (savedId) {
        const found = data.find((a) => a.id === savedId);
        if (found) setSelectedAddressState(found);
      }
      if (data.length > 0) {
        setSelectedAddressState((prev) => {
          if (prev) {
            const stillExists = data.find((a) => a.id === prev.id);
            if (stillExists) return prev;
          }
          const def = data.find((a) => a.est_defaut) || data[0];
          return def;
        });
      }
    } catch (_e) {
      // Mode hors-ligne / backend indisponible : utilise le cache local
      try {
        const raw = await AsyncStorage.getItem(ADDRESSES_STORAGE_KEY);
        if (raw) {
          const cached = JSON.parse(raw) as DeliveryAddress[];
          setAddresses(cached);
          const savedId = await AsyncStorage.getItem(SELECTED_ADDRESS_KEY);
          const found = savedId ? cached.find((a) => a.id === savedId) : undefined;
          if (found) setSelectedAddressState(found);
          else {
            const def = cached.find((a) => a.est_defaut) || cached[0];
            if (def) setSelectedAddressState(def);
          }
        }
      } catch (_err) {
        // ignore
      }
    } finally {
      setAddressesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

// Charger l'utilisateur connecté et le cache au montage
  useEffect(() => {
    (async () => {
      // Rafraîchit le profil depuis le backend (inclut est_diaspora) avec repli local
      await refreshUser();
      try {
        const raw = await AsyncStorage.getItem(ADDRESSES_STORAGE_KEY);
        if (raw) {
          const cached = JSON.parse(raw) as DeliveryAddress[];
          setAddresses(cached);
          const savedId = await AsyncStorage.getItem(SELECTED_ADDRESS_KEY);
          if (savedId) {
            const found = cached.find((a) => a.id === savedId);
            if (found) setSelectedAddressState(found);
          }
        }
      } catch (_e) {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const userFirstName = useMemo(() => {
    if (!currentUser) return 'Invité';
    const parts = currentUser.nom_complet.split(' ');
    return parts[0] || 'Invité';
  }, [currentUser]);

  const isDiaspora = useMemo(
    () => currentUser?.type_utilisateur === 'client' && currentUser?.est_diaspora === true,
    [currentUser],
  );

  const setSelectedAddress = useCallback((address: DeliveryAddress | null) => {
    setSelectedAddressState(address);
    if (address) {
      AsyncStorage.setItem(SELECTED_ADDRESS_KEY, address.id).catch(() => {});
    } else {
      AsyncStorage.removeItem(SELECTED_ADDRESS_KEY).catch(() => {});
    }
  }, []);

  const persistAddresses = useCallback(async (next: DeliveryAddress[]) => {
    setAddresses(next);
    await AsyncStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const addAddress = useCallback(
    async (input: DeliveryAddressInput) => {
      try {
        const created = await apiCreateAddress(input);
        const next = [...addresses, created];
        await persistAddresses(next);
        setSelectedAddressState(created);
        return created;
      } catch (e) {
        // Mode hors-ligne : adresse locale générée
        const local: DeliveryAddress = {
          id: 'local_' + Date.now(),
          client_id: '',
          label: input.label || 'Maison',
          nom_complet: input.nom_complet,
          telephone: input.telephone,
          ville: input.ville || 'Brazzaville',
          quartier: input.quartier,
          adresse: input.adresse,
          coordonnees_gps: input.coordonnees_gps,
          instructions: input.instructions,
          est_defaut: input.est_defaut || false,
        };
        const next = [...addresses, local];
        await persistAddresses(next);
        setSelectedAddressState(local);
        return local;
      }
    },
    [addresses, persistAddresses]
  );

  const editAddress = useCallback(
    async (id: string, input: Partial<DeliveryAddressInput>) => {
      try {
        const updated = await apiUpdateAddress(id, input);
        const next = addresses.map((a) => (a.id === id ? { ...a, ...updated } : a));
        await persistAddresses(next);
        if (selectedAddress?.id === id) setSelectedAddressState(updated);
        return updated;
      } catch (e) {
        const next = addresses.map((a) => (a.id === id ? { ...a, ...input, id } : a));
        await persistAddresses(next);
        const updated = next.find((a) => a.id === id);
        if (updated && selectedAddress?.id === id) setSelectedAddressState(updated);
        return updated || { id, client_id: '', label: 'Maison', ville: 'Brazzaville', adresse: '', est_defaut: false };
      }
    },
    [addresses, persistAddresses, selectedAddress]
  );

  const removeAddress = useCallback(
    async (id: string) => {
      try {
        await apiDeleteAddress(id);
      } catch (_e) {
        // mode hors-ligne : on supprime localement
      }
      const next = addresses.filter((a) => a.id !== id);
      await persistAddresses(next);
      if (selectedAddress?.id === id) {
        const def = next.find((a) => a.est_defaut) || next[0] || null;
        setSelectedAddressState(def);
      }
    },
    [addresses, persistAddresses, selectedAddress]
  );

  const makeDefaultAddress = useCallback(
    async (id: string) => {
      try {
        const updated = await apiSetDefaultAddress(id);
        const next = addresses.map((a) => ({ ...a, est_defaut: a.id === id }));
        await persistAddresses(next);
        setSelectedAddressState(updated);
        return updated;
      } catch (_e) {
        const next = addresses.map((a) => ({ ...a, est_defaut: a.id === id }));
        await persistAddresses(next);
        const updated = next.find((a) => a.id === id) || null;
        if (updated) setSelectedAddressState(updated);
        return updated || { id, client_id: '', label: 'Maison', ville: 'Brazzaville', adresse: '', est_defaut: true };
      }
    },
    [addresses, persistAddresses]
  );

// ─── Utilisateur : rafraîchir / mettre à jour / photo ───
  const refreshUser = useCallback(async () => {
    try {
      // 1) Priorité au backend : récupère le profil à jour (inclut est_diaspora)
      const user = await apiFetchMe();
      setCurrentUser(user);
    } catch (_e) {
      // 2) Repli sur le cache local si le backend est indisponible
      try {
        const user = await apiGetUser();
        if (user) setCurrentUser(user);
      } catch (_err) {
        // ignore
      }
    }
  }, []);

  const updateProfile = useCallback(async (input: Partial<{ nom: string; prenom: string; ville: string; adresse: string; email: string; date_naissance: string; pays_residence: string; devise_preferee: 'FCFA' | 'USD' | 'EUR' | 'GBP' }>) => {
    const updated = await apiUpdateUserProfile(input);
    setCurrentUser(updated);
    await apiSetUser(updated).catch(() => {});
    return updated;
  }, []);

  const uploadPhoto = useCallback(async (photo: { uri: string; fileName?: string | null; type?: string | null }) => {
    const url = await apiUploadUserPhoto(photo);
    if (url && currentUser) {
      const updated = { ...currentUser, photo_profil: url };
      setCurrentUser(updated);
      await apiSetUser(updated).catch(() => {});
    }
    return url;
  }, [currentUser]);

  const value = useMemo(
    () => ({
      products,
      productsLoading,
      productsError,
      refreshProducts,
      popularProducts,
      recentProducts,
      promotedProduct,
      categories,
      categoryIcons,
      categoriesLoading,
      zones,
      resolveZoneForAddress,
      resolveZoneForQuartier,
      selectedSlot,
      setSelectedSlot,
      placeOrder,
      cart,
      addToCart,
      changeQuantity,
      clearCart,
      cartCount,
      subtotal,
      favorites,
      toggleFavorite,
      isFavorite,
      searchQuery,
      setSearchQuery,
      addresses,
      addressesLoading,
      refreshAddresses,
      addAddress,
      editAddress,
      removeAddress,
      makeDefaultAddress,
      selectedAddress,
      setSelectedAddress,
      selectedPaymentMethod,
      setSelectedPaymentMethod,
currentUser,
      userFirstName,
      isDiaspora,
      refreshUser,
      updateProfile,
      uploadPhoto,
    }),
    [
      products, productsLoading, productsError, refreshProducts, popularProducts, recentProducts, promotedProduct,
      categories, categoryIcons, categoriesLoading,
      zones, resolveZoneForAddress, resolveZoneForQuartier, selectedSlot, setSelectedSlot, placeOrder,
      cart, cartCount, subtotal, favorites, searchQuery,
      addresses, addressesLoading, refreshAddresses, addAddress,
      editAddress, removeAddress, makeDefaultAddress,
      selectedAddress, setSelectedAddress, selectedPaymentMethod,
      currentUser, userFirstName, isDiaspora, refreshUser, updateProfile, uploadPhoto,
    ],
  );

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useClient() {
  const value = useContext(ClientContext);
  if (!value) throw new Error('useClient must be used within ClientProvider');
  return value;
}


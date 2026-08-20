 import { router } from 'expo-router';
import { useEffect } from 'react';

type UserRole = 'client' | 'vendeur' | 'livreur' | 'administrateur';

/**
 * Redirige l'utilisateur vers la page correspondant à son rôle après connexion.
 */
export function useRoleRedirect(type_utilisateur?: UserRole | string | null) {
  useEffect(() => {
    if (!type_utilisateur) return;

    const route = getHomeRoute(type_utilisateur);
    router.replace(route as any);
  }, [type_utilisateur]);
}

/**
 * Retourne la route racine pour un rôle donné.
 */
export function getHomeRoute(type_utilisateur?: UserRole | string | null): string {
  switch (type_utilisateur) {
    case 'client':
      return '/client';
    case 'vendeur':
      return '/vendor';
    case 'livreur':
      return '/delivery';
    case 'administrateur':
      return '/admin';
    default:
      return '/';
  }
}


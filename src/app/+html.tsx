import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        <meta
          name="description"
          content="Zando na Ndako - Livraison et marketplace locale"
        />
        <meta name="theme-color" content="#C00000" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Permet l'ajout à l'écran d'accueil avec nom + icône sur iOS Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Zando na Ndako" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Zando na Ndako" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

# Side Friends

L'app delle side quest per gruppi di amici. Ogni settimana escono 5 quest (3 dalla lista del gruppo e 2 idee nuove), si carica una foto o un video come prova, il gruppo vota, e chi vince il mese sceglie una cosa della prossima uscita.

## Com'è fatta

- **App** (`App.tsx`, `src/`): React Native con Expo. Gira su iPhone, Android e browser con lo stesso codice.
  - `src/screens/`: le quattro schede (Quest, Vota, Classifica, Profilo) e il benvenuto.
  - `src/components/`: bottoni "da schiacciare", fogli a molla, coriandoli, icone e logo.
  - `src/lib/`: colori del brand, chiamate al server, accesso salvato sul telefono.
- **Server** (`netlify/functions/api.mts`): una funzione Netlify che risponde su `/api/*`. Salva tutto in Netlify Blobs.
  - Ogni dato è scritto da una persona sola (un membro, una prova, un voto), quindi non esistono contatori da tenere allineati: punti, classifica e vincitore del mese si calcolano dai voti a ogni lettura.
  - Foto e video arrivano a pezzi da 3 MB e vengono serviti a pezzi, così i video fino a 60 MB passano nei limiti delle funzioni.
- **Quest** (`server/quests.ts`): la lista del gruppo e le idee di riserva. L'estrazione della settimana è la stessa per tutto il gruppo e non ripete le quest finché la lista non finisce.

## Regole

- Si entra con il proprio nome e il codice del gruppo (6 caratteri). Niente password: la chiave resta sul telefono.
- Una prova vale quando almeno metà degli altri membri vota «vale» e i sì superano i no. Se sei da solo nel gruppo vale subito, così puoi provare l'app.
- La classifica riparte il primo del mese (ora italiana). Chi ha vinto il mese prima sceglie una cosa sola tra dove si mangia, cosa si fa o cosa si vede.
- Le quest della settimana cambiano il lunedì.

## Provarla

```sh
npm install
npx expo start          # poi apri con Expo Go sul telefono, oppure premi "w" per il browser
```

L'app sul telefono parla con `https://side-friends.netlify.app`. Per usare un altro server: `EXPO_PUBLIC_API_URL=https://... npx expo start`.

Server in locale:

```sh
npx netlify functions:serve --port 9999
```

## Pubblicare

Netlify costruisce la versione web (`npx expo export --platform web`, cartella `dist`) e pubblica la funzione. Le app per gli store si costruiscono con EAS (`npx eas-cli@latest build`).

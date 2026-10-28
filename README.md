# Side Friends

L'app delle side quest per gruppi di amici. Ogni settimana escono 5 quest (3 dalla lista del gruppo e 2 idee nuove), si carica una foto o un video come prova, il gruppo vota, e chi vince il mese sceglie una cosa della prossima uscita.

## Com'è fatta

- **App** (`App.tsx`, `src/`): React Native con Expo. Gira su iPhone, Android e browser con lo stesso codice.
  - `src/screens/`: le quattro schede (Quest, Vota, Classifica, Profilo) e il benvenuto.
  - `src/components/`: bottoni "da schiacciare", fogli a molla, coriandoli, icone e logo.
  - `src/lib/`: colori del brand, chiamate al server, account e gruppo salvati sul dispositivo.
- **Server** (`netlify/functions/`): funzioni Netlify che salvano tutto in Netlify Blobs.
  - `auth.mts` risponde su `/api/auth/*`: crea l'account, entra, esce, elenca i gruppi dell'account.
  - `api.mts` risponde sul resto di `/api/*`: gruppi, quest, prove, voti e poteri del re.
  - `push.mts` risponde su `/api/push/*`: accende e spegne le notifiche di un dispositivo.
  - `reminders.mts` gira ogni mattina alle 7:00 UTC: il lunedì avvisa che sono uscite le quest, il primo del mese annuncia il vincitore.
  - `server/core.ts` ha quello che usano tutte: password, sessioni, chi sta chiamando e in che gruppo. `server/game.ts` ha le regole (date, verdetti, classifica, re del mese), `server/notify.ts` manda le notifiche.
  - Ogni dato è scritto da una persona sola (un membro, una prova, un voto), quindi non esistono contatori da tenere allineati: punti, classifica e vincitore del mese si calcolano dai voti a ogni lettura.
  - Foto e video arrivano a pezzi da 3 MB e vengono serviti a pezzi, così i video fino a 60 MB passano nei limiti delle funzioni.
- **Quest** (`server/quests.ts`): la lista del gruppo e le idee di riserva, in tutte le lingue. L'estrazione della settimana è la stessa per tutto il gruppo e non ripete le quest finché la lista non finisce.
- **Lingue**: italiano, inglese, spagnolo, francese e tedesco. La prima schermata chiede la lingua, che si cambia poi dal Profilo. I testi dell'app sono in `src/lib/i18n.tsx`; quelli che manda il server (quest e messaggi di errore, `server/messages.ts`) arrivano nella lingua indicata dall'header `x-lang`.

## Regole

- Ognuno ha un account: nome utente (3-20 tra lettere minuscole, numeri, punto e trattino basso) e password (almeno 8 caratteri). Con lo stesso account si entra da qualsiasi telefono o computer e si ritrovano gli stessi gruppi.
- Un account può stare in più gruppi: si crea un gruppo o si entra con il codice (6 caratteri), e si passa da uno all'altro dalla finestra del gruppo.
- Le password non vengono salvate: il server tiene solo un hash PBKDF2 con sale. Dopo 10 tentativi sbagliati l'account resta bloccato 15 minuti, e ogni indirizzo può fare al massimo 30 richieste al minuto su `/api/auth/*`.
- Chi aveva già un gruppo da prima degli account crea l'account sullo stesso telefono e si tiene gruppo, punti e prove.
- Non c'è ancora il recupero della password (servirebbe un servizio di email).
- Una prova vale quando almeno metà degli altri membri vota «vale» e i sì superano i no. Se sei da solo nel gruppo vale subito, così puoi provare l'app.
- Si esce dal gruppo dal Profilo (Impostazioni) o dalla finestra del gruppo. Chi esce sparisce da classifica, voti e prove da votare; per rientrare serve di nuovo il codice e si riparte da zero.
- La classifica riparte il primo del mese (ora italiana). Chi ha vinto il mese prima è il re del mese e ha quattro poteri, ognuno da usare una volta sola entro fine mese (dalla Classifica):
  - **Uscita**: sceglie una cosa sola tra dove si mangia, cosa si fa o cosa si vede.
  - **Tema del mese**: una frase che il gruppo vede in cima alle quest (es. «Mese dello sport»).
  - **Quest speciale**: una quest scritta da lui per un amico a scelta, da 20, 30 o 50 punti. La vede solo quell'amico e vale fino a fine mese.
  - **Veto**: ribalta il voto del gruppo su una prova di un amico di questo mese già decisa: se valeva non vale più, e viceversa.
- Le quest della settimana cambiano il lunedì.

## Notifiche

Si accendono dal Profilo (o dal riquadro che compare nella scheda Quest) e valgono per il singolo dispositivo. Arrivano quando un amico carica una prova da votare, quando il gruppo decide su una tua prova, quando qualcuno entra nel gruppo, quando il re usa un potere, il lunedì per le quest nuove e il primo del mese per il vincitore. Il titolo è il nome del gruppo; toccandole si apre il gruppo nella scheda giusta.

- **Browser** (Web Push): funziona su Chrome, Edge, Firefox e Safari per Mac. Su iPhone serve iOS 16.4 o più recente e bisogna aggiungere Side Friends alla schermata Home da Safari (Condividi → Aggiungi alla schermata Home), poi aprirla da lì. Le chiavi VAPID le crea il server la prima volta e le tiene in Blobs: non c'è niente da configurare. Il service worker è `public/sw.js`.
- **App installata** (iPhone e Android): usa il servizio push di Expo. Serve un progetto EAS: lancia `npx eas-cli@latest init` una volta (aggiunge `extra.eas.projectId` in `app.json`) e costruisci l'app con `npx eas-cli@latest build`. Da Expo Go le notifiche non arrivano su Android; senza progetto EAS l'app dice che sul dispositivo non sono disponibili.
- Quando un dispositivo non esiste più (l'utente ha tolto il permesso o disinstallato), il servizio push lo dice e il server lo dimentica. Uscendo dall'account le notifiche si spengono su quel dispositivo.

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

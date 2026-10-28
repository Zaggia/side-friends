import type { Lang } from './quests.ts';

// Error messages the server sends back, in every language the app speaks.
const M = {
  auth_missing: ['Accesso mancante. Riapri l’app.', 'You’re not signed in. Open the app again.', 'Falta el acceso. Vuelve a abrir la app.', 'Accès manquant. Rouvre l’appli.', 'Zugang fehlt. Öffne die App erneut.'],
  auth_invalid: ['Accesso non valido. Entra di nuovo nel gruppo.', 'This access is no longer valid. Join the group again.', 'Acceso no válido. Vuelve a entrar en el grupo.', 'Accès non valide. Rejoins le groupe.', 'Ungültiger Zugang. Tritt der Gruppe erneut bei.'],
  name_required: ['Scrivi il tuo nome.', 'Enter your name.', 'Escribe tu nombre.', 'Écris ton prénom.', 'Gib deinen Namen ein.'],
  group_name_required: ['Dai un nome al gruppo.', 'Give the group a name.', 'Ponle un nombre al grupo.', 'Donne un nom au groupe.', 'Gib der Gruppe einen Namen.'],
  code_failed: ['Non sono riuscito a creare il codice del gruppo. Riprova.', 'Couldn’t create the group code. Try again.', 'No se pudo crear el código del grupo. Inténtalo de nuevo.', 'Impossible de créer le code du groupe. Réessaie.', 'Der Gruppencode konnte nicht erstellt werden. Versuch es noch mal.'],
  code_length: ['Il codice del gruppo ha 6 caratteri.', 'The group code has 6 characters.', 'El código del grupo tiene 6 caracteres.', 'Le code du groupe a 6 caractères.', 'Der Gruppencode hat 6 Zeichen.'],
  code_unknown: ['Nessun gruppo con questo codice. Controlla e riprova.', 'No group has this code. Check it and try again.', 'Ningún grupo tiene este código. Revísalo e inténtalo de nuevo.', 'Aucun groupe avec ce code. Vérifie et réessaie.', 'Keine Gruppe mit diesem Code. Prüf ihn und versuch es noch mal.'],
  group_full: ['Il gruppo è pieno: massimo 20 persone.', 'The group is full: 20 people at most.', 'El grupo está lleno: máximo 20 personas.', 'Le groupe est complet : 20 personnes maximum.', 'Die Gruppe ist voll: höchstens 20 Leute.'],
  quest_gone: ['Questa quest non è più disponibile.', 'This quest is no longer available.', 'Esta quest ya no está disponible.', 'Cette quête n’est plus disponible.', 'Diese Quest gibt es nicht mehr.'],
  video_required: ['Per questa quest serve un video.', 'This quest needs a video.', 'Esta quest necesita un vídeo.', 'Cette quête demande une vidéo.', 'Für diese Quest brauchst du ein Video.'],
  bad_format: ['Formato del file non valido.', 'This file type isn’t supported.', 'Formato de archivo no válido.', 'Format de fichier non valide.', 'Ungültiges Dateiformat.'],
  empty_file: ['Il file è vuoto.', 'The file is empty.', 'El archivo está vacío.', 'Le fichier est vide.', 'Die Datei ist leer.'],
  too_big: ['Il file è troppo pesante: massimo 60 MB. Accorcia il video o abbassa la qualità.', 'The file is too large: 60 MB at most. Shorten the video or lower its quality.', 'El archivo pesa demasiado: máximo 60 MB. Acorta el vídeo o baja la calidad.', 'Le fichier est trop lourd : 60 Mo maximum. Raccourcis la vidéo ou baisse la qualité.', 'Die Datei ist zu groß: höchstens 60 MB. Kürz das Video oder senk die Qualität.'],
  already_sent: ['Hai già caricato una prova per questa quest.', 'You’ve already sent proof for this quest.', 'Ya has subido una prueba para esta quest.', 'Tu as déjà envoyé une preuve pour cette quête.', 'Du hast für diese Quest schon einen Beweis hochgeladen.'],
  proof_missing: ['Prova non trovata.', 'Proof not found.', 'Prueba no encontrada.', 'Preuve introuvable.', 'Beweis nicht gefunden.'],
  proof_closed: ['Questa prova è già stata inviata.', 'This proof has already been sent.', 'Esta prueba ya se ha enviado.', 'Cette preuve a déjà été envoyée.', 'Dieser Beweis wurde schon gesendet.'],
  bad_piece: ['Pezzo del file non valido. Riprova.', 'Part of the file is invalid. Try again.', 'Una parte del archivo no es válida. Inténtalo de nuevo.', 'Une partie du fichier n’est pas valide. Réessaie.', 'Ein Teil der Datei ist ungültig. Versuch es noch mal.'],
  short_piece: ['Un pezzo del file è arrivato incompleto. Riprova.', 'Part of the file arrived incomplete. Try again.', 'Una parte del archivo llegó incompleta. Inténtalo de nuevo.', 'Une partie du fichier est arrivée incomplète. Réessaie.', 'Ein Teil der Datei kam unvollständig an. Versuch es noch mal.'],
  incomplete: ['Il file non è arrivato tutto. Riprova a caricarlo.', 'The whole file didn’t arrive. Upload it again.', 'El archivo no llegó completo. Vuelve a subirlo.', 'Le fichier n’est pas arrivé en entier. Renvoie-le.', 'Die Datei kam nicht vollständig an. Lade sie erneut hoch.'],
  bad_vote: ['Voto non valido.', 'Invalid vote.', 'Voto no válido.', 'Vote non valide.', 'Ungültige Stimme.'],
  own_vote: ['Non puoi votare la tua prova.', 'You can’t vote on your own proof.', 'No puedes votar tu propia prueba.', 'Tu ne peux pas voter pour ta propre preuve.', 'Du kannst nicht über deinen eigenen Beweis abstimmen.'],
  voted: ['Hai già votato questa prova.', 'You’ve already voted on this proof.', 'Ya has votado esta prueba.', 'Tu as déjà voté pour cette preuve.', 'Du hast über diesen Beweis schon abgestimmt.'],
  outing_kind: ['Scegli cosa decidere: dove si mangia, cosa si fa o cosa si vede.', 'Choose what to decide: where to eat, what to do or what to watch.', 'Elige qué decidir: dónde se come, qué se hace o qué se ve.', 'Choisis quoi décider : où on mange, ce qu’on fait ou ce qu’on regarde.', 'Wähl, was du entscheidest: wo gegessen wird, was gemacht wird oder was geschaut wird.'],
  outing_value: ['Scrivi o scegli la tua scelta.', 'Type or pick your choice.', 'Escribe o elige tu opción.', 'Écris ou choisis ton choix.', 'Schreib oder wähl deine Entscheidung.'],
  not_king: ['Solo chi ha vinto il mese scorso può scegliere.', 'Only last month’s winner can choose.', 'Solo quien ganó el mes pasado puede elegir.', 'Seul le gagnant du mois dernier peut choisir.', 'Nur wer letzten Monat gewonnen hat, darf wählen.'],
  outing_done: ['Hai già fatto la tua scelta per questo mese.', 'You’ve already made your choice for this month.', 'Ya has hecho tu elección de este mes.', 'Tu as déjà fait ton choix pour ce mois-ci.', 'Du hast für diesen Monat schon gewählt.'],
  proposal_short: ['Scrivi cosa bisogna fare.', 'Write what needs to be done.', 'Escribe lo que hay que hacer.', 'Écris ce qu’il faut faire.', 'Schreib, was zu tun ist.'],
  proposal_limit: ['Puoi proporre al massimo 3 quest al mese.', 'You can suggest at most 3 quests a month.', 'Puedes proponer como máximo 3 quests al mes.', 'Tu peux proposer 3 quêtes par mois au maximum.', 'Du kannst höchstens 3 Quests pro Monat vorschlagen.'],
  not_found: ['Pagina non trovata.', 'Page not found.', 'Página no encontrada.', 'Page introuvable.', 'Seite nicht gefunden.'],
  server: ['Qualcosa è andato storto sul server. Riprova tra poco.', 'Something went wrong on the server. Try again shortly.', 'Algo ha fallado en el servidor. Inténtalo de nuevo en un rato.', 'Un problème est survenu sur le serveur. Réessaie dans un instant.', 'Auf dem Server ist etwas schiefgelaufen. Versuch es gleich noch mal.']
} as const;

export type MessageKey = keyof typeof M;
const INDEX: Record<Lang, number> = { it: 0, en: 1, es: 2, fr: 3, de: 4 };
export const message = (lang: Lang, key: MessageKey) => M[key][INDEX[lang]];

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type Lang = 'it' | 'en' | 'es' | 'fr' | 'de';
export const LANGS: { code: Lang; name: string; english: string }[] = [
  { code: 'it', name: 'Italiano', english: 'Italian' },
  { code: 'en', name: 'English', english: 'English' },
  { code: 'es', name: 'Español', english: 'Spanish' },
  { code: 'fr', name: 'Français', english: 'French' },
  { code: 'de', name: 'Deutsch', english: 'German' }
];

const it = {
  months: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
  langTitle: 'Scegli la lingua',
  langSub: 'Puoi cambiarla quando vuoi dal profilo.',
  continue: 'Continua',
  slides: [
    ['Benvenuto in Side Friends', 'Le side quest del tuo gruppo di amici. Ogni amico ha il suo colore.'],
    ['Completa le quest', 'Ogni settimana escono 5 quest. Falle davvero e carica una foto o un video come prova.'],
    ['Vinci il mese', 'Il gruppo vota le prove e tu sali in classifica. Chi vince il mese sceglie una cosa della prossima uscita.']
  ],
  next: 'Avanti', start: 'Iniziamo',
  nameTitle: 'Come ti chiami?', nameSub: 'È il nome che vedranno i tuoi amici.', namePh: 'Il tuo nome',
  createGroup: 'Crea un gruppo', joinWithCode: 'Entra con un codice',
  newGroup: 'Nuovo gruppo', newGroupSub: 'Dopo ti do un codice da mandare agli amici.', groupPh: 'Es. I Soliti',
  creating: 'Creo il gruppo…', createIt: 'Crea il gruppo', back: 'Indietro',
  joinTitle: 'Entra nel gruppo', joinSub: 'Chiedi il codice di 6 caratteri a chi ha creato il gruppo.', joining: 'Entro…', join: 'Entra',
  genericError: 'Qualcosa è andato storto. Riprova.',
  netError: 'Non riesco a raggiungere il server. Controlla la connessione e riprova.',
  loadFail: 'Non riesco a caricare il gruppo', retry: 'Riprova',
  tabs: { quest: 'Quest', vota: 'Vota', classifica: 'Classifica', profilo: 'Profilo' },
  chipDone: 'Fatta', chipPending: 'In votazione', chipActive: 'In corso', chipNew: 'Nuova',
  ptsLine: (pts: number, video: boolean) => `+${pts} pt${video ? ' · serve un video' : ''}`,
  rankLabel: (n: number) => `${n}° posto`,
  alone: 'Sei da solo: invita gli amici dal pulsante del gruppo qui sopra.',
  behind: (n: number, name: string) => `${n === 1 ? 'Ti manca 1 pt' : `Ti mancano ${n} pt`} per superare ${name}.`,
  leading: 'Sei in testa. Tieni duro fino a fine mese.',
  noPoints: 'Completa una quest per prendere i primi punti.',
  dayOf: (d: number, n: number) => `Giorno ${d} di ${n}`,
  daysLeft: (n: number) => (n === 0 ? 'Ultimo giorno' : n === 1 ? 'Manca 1 giorno' : `Mancano ${n} giorni`),
  thisWeek: 'Questa settimana', doneOf: (a: number, b: number) => `${a} di ${b} fatte`,
  weekNote: (d: number) => `3 dalla vostra lista e 2 idee nuove. Le prossime escono ${d === 1 ? 'domani' : `tra ${d} giorni`}.`,
  newIdeas: 'Idee nuove della settimana', groupProposals: 'Proposte dal gruppo', proposeQuest: 'Proponi una quest', inGroup: 'Nel gruppo',
  you: 'Tu', someone: 'Qualcuno',
  feed: {
    proof: (me: boolean, video: boolean, q: string) => `${me ? 'hai caricato' : 'ha caricato'} ${video ? 'un video' : 'una foto'} per «${q}»`,
    done: (me: boolean, q: string, pts: number) => `${me ? 'hai completato' : 'ha completato'} «${q}» (+${pts} pt)`,
    proposal: (me: boolean, q: string) => `${me ? 'hai proposto' : 'ha proposto'} «${q}»`,
    join: (me: boolean): string => (me ? 'sei entrato nel gruppo' : 'è entrato nel gruppo')
  },
  ago: { now: 'ora', min: (n: number) => `${n} min`, h: (n: number) => `${n} h`, d: (n: number) => `${n} g` },
  wonMonth: (me: boolean, name: string, month: string) => (me ? `Hai vinto ${month}` : `${name} ha vinto ${month}`),
  chooseFromRank: 'Scegli una cosa della prossima uscita dalla Classifica.',
  isChoosing: (name: string) => `${name} sta scegliendo una cosa della prossima uscita.`,
  inviteCode: 'Codice d’invito', copy: 'Copia', codeCopied: 'Codice copiato.', send: 'Invia',
  inviteMsg: (g: string, code: string) => `Entra nel nostro gruppo «${g}» su Side Friends. Codice: ${code}`,
  peopleCount: (n: number) => `${n} ${n === 1 ? 'persona' : 'persone'} · ognuno ha il suo colore`,
  youSuffix: '(tu)',
  leaveGroup: 'Esci dal gruppo',
  leaveWarn: 'Se esci, sparisci dalla classifica e dai voti del gruppo e su questo telefono perdi l’accesso. Per rientrare ti serve di nuovo il codice, e ripartiresti da zero.',
  stay: 'Resta', leftToast: 'Sei uscito dal gruppo.',
  proposeTitle: 'Proponi una quest', proposeSub: 'Vale per tutto il mese e la vedono tutti nel gruppo. Massimo 3 a testa al mese.',
  whatToDo: 'Cosa bisogna fare?', proposePh: 'Es. Fai un picnic in centro', howMuch: 'Quanto vale?', wait: 'Un attimo…',
  proposeSend: 'Proponi al gruppo', proposedToast: 'Quest proposta. Ora il gruppo la vede.',
  acceptedToast: 'Quest accettata. Hai tempo fino a domenica.',
  permCamera: 'Serve il permesso per la fotocamera. Attivalo nelle impostazioni del telefono.',
  permLibrary: 'Serve il permesso per le foto. Attivalo nelle impostazioni del telefono.',
  videoRequired: 'Per questa quest serve un video.',
  videoTooLong: (s: number, max: number) => `Il video dura ${s} secondi. Taglialo sotto i ${max} e riprova.`,
  fileTooBig: 'Il file è troppo pesante (oltre 60 MB). Prova con un video più corto.',
  uploadFailed: 'Caricamento non riuscito. Riprova.',
  checkProof: 'Controlla la prova', video: 'Video', photo: 'Foto', addComment: 'Aggiungi un commento', optional: 'Facoltativo',
  sending: (p: number) => `Invio… ${p}%`, sendToGroup: 'Invia al gruppo', pickAnother: 'Scegli un altro file',
  ideaLabel: 'Idea nuova della settimana', proposedBy: (n: string) => `Proposta da ${n}`, someoneInGroup: 'qualcuno del gruppo',
  groupQuestDesc: 'Quest proposta dal gruppo. Vale per tutto il mese.',
  points: 'punti', endOfMonth: 'Fine mese', sunday: 'Domenica', deadline: 'scadenza', proofLabel: 'prova', photoOrVideo: 'Foto/video',
  alreadyDoneBy: (names: string) => `Già fatta da ${names}`, nobodyYet: 'Nessuno del gruppo l’ha ancora fatta. Sii il primo.',
  rejectedNote: 'Il gruppo ha detto che la tua prova non vale. Puoi riprovare con una nuova.',
  accept: 'Accetta la quest', recordVideo: 'Registra il video', shootOrRecord: 'Scatta o registra', fromGallery: 'Scegli dalla galleria',
  videoUpTo: (n: number) => `Video fino a ${n} secondi.`, groupVoting: 'Il gruppo sta votando', questDone: 'Quest completata',
  proofSent: 'Prova inviata', proofSentSub: (pts: number) => `Ora il gruppo vota. Se vale, prendi +${pts} pt.`,
  watchWithSound: 'Guarda con audio', stampYes: 'VALE', stampNo: 'NON VALE',
  ifValid: (pts: number) => `+${pts} pt se vale`,
  toVoteTitle: 'Da votare', toVoteSub: 'Guarda le prove degli amici e decidi se valgono.',
  votedYes: (n: string, pts: number) => `Hai votato: vale. ${n} prende +${pts} pt se il gruppo è d’accordo.`,
  votedNo: 'Hai votato: non vale.', voteFailed: 'Voto non registrato.',
  notValid: 'Non vale', valid: 'Vale', dragHint: 'Trascina la prova a destra se vale, a sinistra se no.',
  allVoted: 'Hai votato tutto', allVotedSub: 'Quando qualcuno carica una nuova prova te la trovi qui.', close: 'Chiudi',
  rankTitle: 'Classifica', monthStatus: (m: string, days: string) => `${m} · ${days}`,
  questsDone: (n: number) => `${n} ${n === 1 ? 'quest fatta' : 'quest fatte'}`,
  winnerOf: (m: string) => `Vincitore di ${m}`, choiceLabel: 'La scelta', restByGroup: 'Il resto della prossima uscita lo decide il gruppo come al solito.',
  chooseOuting: 'Scegli una cosa dell’uscita', stillToChoose: (n: string) => `${n} deve ancora scegliere una cosa della prossima uscita.`,
  whoWins: (m: string) => `Chi vince ${m}`, prizeTitle: 'Si prende il trofeo e sceglie una cosa della prossima uscita',
  prizeSub: 'Una sola tra dove si mangia, cosa si fa nel weekend o che film si vede al cinema. La classifica riparte da zero il primo del mese.',
  outingSub: 'Puoi decidere una sola cosa tra le tre. Tocca un suggerimento o scrivi la tua.',
  canWrite: (label: string) => `${label}: puoi anche scriverlo tu`, outingPh: 'Es. Pizzeria da Gino',
  confirmChoice: 'Conferma la scelta', choiceToast: 'Scelta fatta. Il gruppo la vede subito.',
  outing: {
    eat: { label: 'Dove si mangia', opts: ['Pizzeria', 'Sushi', 'Panini al parco', 'Kebab', 'Cena a casa di qualcuno'] },
    do: { label: 'Cosa si fa nel weekend', opts: ['Bowling', 'Escape room', 'Gita al lago', 'Sala giochi', 'Partita a calcetto'] },
    film: { label: 'Cosa si vede al cinema', opts: ['Un horror', 'Una commedia', 'Un film d’azione', 'Un film d’animazione'] }
  } as Record<string, { label: string; opts: string[] }>,
  groupOf: (g: string) => `Nel gruppo ${g}`, monthPoints: 'Punti del mese', validProofs: 'Prove valide', trophies: (n: number): string => (n === 1 ? 'Trofeo' : 'Trofei'),
  kingOf: (m: string) => `Re di ${m}`, yourProofs: 'Le tue prove', proofsEmpty: 'Le foto e i video che carichi per le quest finiscono qui.',
  statusValid: 'Vale', statusVoting: 'Al voto', statusRejected: 'Non vale', trophyCase: 'Bacheca trofei',
  settings: 'Impostazioni', language: 'Lingua', group: 'Gruppo'
};
type Dict = typeof it;

const en: Dict = {
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  langTitle: 'Choose your language', langSub: 'You can change it anytime from your profile.', continue: 'Continue',
  slides: [
    ['Welcome to Side Friends', 'Side quests for your group of friends. Every friend has their own colour.'],
    ['Complete quests', 'Every week there are 5 new quests. Do them for real and upload a photo or video as proof.'],
    ['Win the month', 'Your group votes on the proofs and you climb the leaderboard. The month’s winner picks one thing for the next hangout.']
  ],
  next: 'Next', start: 'Let’s go',
  nameTitle: 'What’s your name?', nameSub: 'This is the name your friends will see.', namePh: 'Your name',
  createGroup: 'Create a group', joinWithCode: 'Join with a code',
  newGroup: 'New group', newGroupSub: 'Next you’ll get a code to send your friends.', groupPh: 'E.g. The Usual Crew',
  creating: 'Creating the group…', createIt: 'Create the group', back: 'Back',
  joinTitle: 'Join the group', joinSub: 'Ask whoever created the group for the 6-character code.', joining: 'Joining…', join: 'Join',
  genericError: 'Something went wrong. Try again.',
  netError: 'Can’t reach the server. Check your connection and try again.',
  loadFail: 'Can’t load the group', retry: 'Try again',
  tabs: { quest: 'Quests', vota: 'Vote', classifica: 'Leaderboard', profilo: 'Profile' },
  chipDone: 'Done', chipPending: 'Being voted', chipActive: 'In progress', chipNew: 'New',
  ptsLine: (pts, video) => `+${pts} pts${video ? ' · video needed' : ''}`,
  rankLabel: n => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'} place`,
  alone: 'You’re on your own: invite friends from the group button above.',
  behind: (n, name) => `${n} ${n === 1 ? 'pt' : 'pts'} to overtake ${name}.`,
  leading: 'You’re in the lead. Hold on until the end of the month.',
  noPoints: 'Complete a quest to get your first points.',
  dayOf: (d, n) => `Day ${d} of ${n}`,
  daysLeft: n => (n === 0 ? 'Last day' : n === 1 ? '1 day left' : `${n} days left`),
  thisWeek: 'This week', doneOf: (a, b) => `${a} of ${b} done`,
  weekNote: d => `3 from your list and 2 new ideas. The next ones come out ${d === 1 ? 'tomorrow' : `in ${d} days`}.`,
  newIdeas: 'New ideas this week', groupProposals: 'Suggested by the group', proposeQuest: 'Suggest a quest', inGroup: 'In the group',
  you: 'You', someone: 'Someone',
  feed: {
    proof: (_me, video, q) => `uploaded a ${video ? 'video' : 'photo'} for “${q}”`,
    done: (_me, q, pts) => `completed “${q}” (+${pts} pts)`,
    proposal: (_me, q) => `suggested “${q}”`,
    join: () => 'joined the group'
  },
  ago: { now: 'now', min: n => `${n} min`, h: n => `${n} h`, d: n => `${n} d` },
  wonMonth: (me, name, month) => (me ? `You won ${month}` : `${name} won ${month}`),
  chooseFromRank: 'Pick one thing for the next hangout from the Leaderboard.',
  isChoosing: name => `${name} is picking one thing for the next hangout.`,
  inviteCode: 'Invite code', copy: 'Copy', codeCopied: 'Code copied.', send: 'Send',
  inviteMsg: (g, code) => `Join our group “${g}” on Side Friends. Code: ${code}`,
  peopleCount: n => `${n} ${n === 1 ? 'person' : 'people'} · everyone has their own colour`,
  youSuffix: '(you)',
  leaveGroup: 'Leave the group',
  leaveWarn: 'If you leave, you disappear from the group’s leaderboard and votes, and this phone loses access. To come back you need the code again, and you’d start from zero.',
  stay: 'Stay', leftToast: 'You left the group.',
  proposeTitle: 'Suggest a quest', proposeSub: 'It lasts all month and everyone in the group sees it. 3 per person per month at most.',
  whatToDo: 'What needs to be done?', proposePh: 'E.g. Have a picnic downtown', howMuch: 'How much is it worth?', wait: 'One moment…',
  proposeSend: 'Suggest to the group', proposedToast: 'Quest suggested. The group can see it now.',
  acceptedToast: 'Quest accepted. You have until Sunday.',
  permCamera: 'Camera access is needed. Turn it on in your phone’s settings.',
  permLibrary: 'Photo access is needed. Turn it on in your phone’s settings.',
  videoRequired: 'This quest needs a video.',
  videoTooLong: (s, max) => `The video is ${s} seconds long. Trim it under ${max} and try again.`,
  fileTooBig: 'The file is too large (over 60 MB). Try a shorter video.',
  uploadFailed: 'Upload failed. Try again.',
  checkProof: 'Check your proof', video: 'Video', photo: 'Photo', addComment: 'Add a comment', optional: 'Optional',
  sending: p => `Sending… ${p}%`, sendToGroup: 'Send to the group', pickAnother: 'Choose another file',
  ideaLabel: 'New idea this week', proposedBy: n => `Suggested by ${n}`, someoneInGroup: 'someone in the group',
  groupQuestDesc: 'Quest suggested by the group. It lasts all month.',
  points: 'points', endOfMonth: 'End of month', sunday: 'Sunday', deadline: 'deadline', proofLabel: 'proof', photoOrVideo: 'Photo/video',
  alreadyDoneBy: names => `Already done by ${names}`, nobodyYet: 'Nobody in the group has done it yet. Be the first.',
  rejectedNote: 'The group said your proof doesn’t count. You can try again with a new one.',
  accept: 'Accept the quest', recordVideo: 'Record the video', shootOrRecord: 'Take a photo or video', fromGallery: 'Choose from gallery',
  videoUpTo: n => `Videos up to ${n} seconds.`, groupVoting: 'The group is voting', questDone: 'Quest completed',
  proofSent: 'Proof sent', proofSentSub: pts => `Now the group votes. If it counts, you get +${pts} pts.`,
  watchWithSound: 'Watch with sound', stampYes: 'COUNTS', stampNo: 'NOPE',
  ifValid: pts => `+${pts} pts if it counts`,
  toVoteTitle: 'To vote', toVoteSub: 'Look at your friends’ proofs and decide if they count.',
  votedYes: (n, pts) => `You voted: it counts. ${n} gets +${pts} pts if the group agrees.`,
  votedNo: 'You voted: it doesn’t count.', voteFailed: 'Vote not saved.',
  notValid: 'Doesn’t count', valid: 'Counts', dragHint: 'Swipe the proof right if it counts, left if it doesn’t.',
  allVoted: 'You’ve voted on everything', allVotedSub: 'When someone uploads a new proof, you’ll find it here.', close: 'Close',
  rankTitle: 'Leaderboard', monthStatus: (m, days) => `${m} · ${days}`,
  questsDone: n => `${n} ${n === 1 ? 'quest done' : 'quests done'}`,
  winnerOf: m => `Winner of ${m}`, choiceLabel: 'The choice', restByGroup: 'The rest of the next hangout is decided by the group as usual.',
  chooseOuting: 'Pick one thing for the hangout', stillToChoose: n => `${n} still has to pick one thing for the next hangout.`,
  whoWins: m => `Whoever wins ${m}`, prizeTitle: 'Takes the trophy and picks one thing for the next hangout',
  prizeSub: 'Just one of: where to eat, what to do at the weekend or which film to see. The leaderboard resets on the 1st of the month.',
  outingSub: 'You can decide just one of the three. Tap a suggestion or write your own.',
  canWrite: label => `${label}: you can also type it`, outingPh: 'E.g. Gino’s pizzeria',
  confirmChoice: 'Confirm your choice', choiceToast: 'Choice made. The group can see it now.',
  outing: {
    eat: { label: 'Where to eat', opts: ['Pizza place', 'Sushi', 'Sandwiches in the park', 'Kebab', 'Dinner at someone’s house'] },
    do: { label: 'What to do at the weekend', opts: ['Bowling', 'Escape room', 'Trip to the lake', 'Arcade', 'Five-a-side football'] },
    film: { label: 'What to watch at the cinema', opts: ['A horror film', 'A comedy', 'An action film', 'An animated film'] }
  },
  groupOf: g => `In the group ${g}`, monthPoints: 'Points this month', validProofs: 'Valid proofs', trophies: n => (n === 1 ? 'Trophy' : 'Trophies'),
  kingOf: m => `King of ${m}`, yourProofs: 'Your proofs', proofsEmpty: 'The photos and videos you upload for quests end up here.',
  statusValid: 'Counts', statusVoting: 'Voting', statusRejected: 'Nope', trophyCase: 'Trophy case',
  settings: 'Settings', language: 'Language', group: 'Group'
};

const es: Dict = {
  months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  langTitle: 'Elige el idioma', langSub: 'Puedes cambiarlo cuando quieras desde tu perfil.', continue: 'Continuar',
  slides: [
    ['Bienvenido a Side Friends', 'Las side quests de tu grupo de amigos. Cada amigo tiene su color.'],
    ['Completa quests', 'Cada semana salen 5 quests. Hazlas de verdad y sube una foto o un vídeo como prueba.'],
    ['Gana el mes', 'El grupo vota las pruebas y tú subes en la clasificación. Quien gana el mes elige una cosa del próximo plan.']
  ],
  next: 'Siguiente', start: 'Empezamos',
  nameTitle: '¿Cómo te llamas?', nameSub: 'Es el nombre que verán tus amigos.', namePh: 'Tu nombre',
  createGroup: 'Crear un grupo', joinWithCode: 'Entrar con un código',
  newGroup: 'Nuevo grupo', newGroupSub: 'Después te doy un código para mandar a tus amigos.', groupPh: 'Ej. Los de siempre',
  creating: 'Creando el grupo…', createIt: 'Crear el grupo', back: 'Atrás',
  joinTitle: 'Entra en el grupo', joinSub: 'Pide el código de 6 caracteres a quien creó el grupo.', joining: 'Entrando…', join: 'Entrar',
  genericError: 'Algo ha fallado. Inténtalo de nuevo.',
  netError: 'No consigo conectar con el servidor. Revisa la conexión e inténtalo de nuevo.',
  loadFail: 'No consigo cargar el grupo', retry: 'Reintentar',
  tabs: { quest: 'Quests', vota: 'Votar', classifica: 'Clasificación', profilo: 'Perfil' },
  chipDone: 'Hecha', chipPending: 'En votación', chipActive: 'En curso', chipNew: 'Nueva',
  ptsLine: (pts, video) => `+${pts} pt${video ? ' · necesita vídeo' : ''}`,
  rankLabel: n => `${n}.º puesto`,
  alone: 'Estás solo: invita a tus amigos con el botón del grupo de arriba.',
  behind: (n, name) => `${n === 1 ? 'Te falta 1 pt' : `Te faltan ${n} pt`} para superar a ${name}.`,
  leading: 'Vas primero. Aguanta hasta final de mes.',
  noPoints: 'Completa una quest para conseguir tus primeros puntos.',
  dayOf: (d, n) => `Día ${d} de ${n}`,
  daysLeft: n => (n === 0 ? 'Último día' : n === 1 ? 'Queda 1 día' : `Quedan ${n} días`),
  thisWeek: 'Esta semana', doneOf: (a, b) => `${a} de ${b} hechas`,
  weekNote: d => `3 de vuestra lista y 2 ideas nuevas. Las próximas salen ${d === 1 ? 'mañana' : `dentro de ${d} días`}.`,
  newIdeas: 'Ideas nuevas de la semana', groupProposals: 'Propuestas del grupo', proposeQuest: 'Proponer una quest', inGroup: 'En el grupo',
  you: 'Tú', someone: 'Alguien',
  feed: {
    proof: (me, video, q) => `${me ? 'has subido' : 'ha subido'} ${video ? 'un vídeo' : 'una foto'} para «${q}»`,
    done: (me, q, pts) => `${me ? 'has completado' : 'ha completado'} «${q}» (+${pts} pt)`,
    proposal: (me, q) => `${me ? 'has propuesto' : 'ha propuesto'} «${q}»`,
    join: me => (me ? 'has entrado en el grupo' : 'ha entrado en el grupo')
  },
  ago: { now: 'ahora', min: n => `${n} min`, h: n => `${n} h`, d: n => `${n} d` },
  wonMonth: (me, name, month) => (me ? `Has ganado ${month}` : `${name} ha ganado ${month}`),
  chooseFromRank: 'Elige una cosa del próximo plan desde la Clasificación.',
  isChoosing: name => `${name} está eligiendo una cosa del próximo plan.`,
  inviteCode: 'Código de invitación', copy: 'Copiar', codeCopied: 'Código copiado.', send: 'Enviar',
  inviteMsg: (g, code) => `Únete a nuestro grupo «${g}» en Side Friends. Código: ${code}`,
  peopleCount: n => `${n} ${n === 1 ? 'persona' : 'personas'} · cada uno tiene su color`,
  youSuffix: '(tú)',
  leaveGroup: 'Salir del grupo',
  leaveWarn: 'Si sales, desapareces de la clasificación y de los votos del grupo, y este móvil pierde el acceso. Para volver necesitas otra vez el código y empezarías de cero.',
  stay: 'Quedarme', leftToast: 'Has salido del grupo.',
  proposeTitle: 'Proponer una quest', proposeSub: 'Vale para todo el mes y la ve todo el grupo. Máximo 3 por persona al mes.',
  whatToDo: '¿Qué hay que hacer?', proposePh: 'Ej. Haz un picnic en el centro', howMuch: '¿Cuánto vale?', wait: 'Un momento…',
  proposeSend: 'Proponer al grupo', proposedToast: 'Quest propuesta. El grupo ya la ve.',
  acceptedToast: 'Quest aceptada. Tienes hasta el domingo.',
  permCamera: 'Hace falta permiso para la cámara. Actívalo en los ajustes del móvil.',
  permLibrary: 'Hace falta permiso para las fotos. Actívalo en los ajustes del móvil.',
  videoRequired: 'Esta quest necesita un vídeo.',
  videoTooLong: (s, max) => `El vídeo dura ${s} segundos. Recórtalo por debajo de ${max} e inténtalo de nuevo.`,
  fileTooBig: 'El archivo pesa demasiado (más de 60 MB). Prueba con un vídeo más corto.',
  uploadFailed: 'No se ha podido subir. Inténtalo de nuevo.',
  checkProof: 'Revisa la prueba', video: 'Vídeo', photo: 'Foto', addComment: 'Añade un comentario', optional: 'Opcional',
  sending: p => `Enviando… ${p}%`, sendToGroup: 'Enviar al grupo', pickAnother: 'Elegir otro archivo',
  ideaLabel: 'Idea nueva de la semana', proposedBy: n => `Propuesta por ${n}`, someoneInGroup: 'alguien del grupo',
  groupQuestDesc: 'Quest propuesta por el grupo. Vale para todo el mes.',
  points: 'puntos', endOfMonth: 'Fin de mes', sunday: 'Domingo', deadline: 'plazo', proofLabel: 'prueba', photoOrVideo: 'Foto/vídeo',
  alreadyDoneBy: names => `Ya la han hecho ${names}`, nobodyYet: 'Nadie del grupo la ha hecho todavía. Sé el primero.',
  rejectedNote: 'El grupo ha dicho que tu prueba no vale. Puedes intentarlo con una nueva.',
  accept: 'Aceptar la quest', recordVideo: 'Grabar el vídeo', shootOrRecord: 'Hacer foto o vídeo', fromGallery: 'Elegir de la galería',
  videoUpTo: n => `Vídeos de hasta ${n} segundos.`, groupVoting: 'El grupo está votando', questDone: 'Quest completada',
  proofSent: 'Prueba enviada', proofSentSub: pts => `Ahora vota el grupo. Si vale, consigues +${pts} pt.`,
  watchWithSound: 'Ver con sonido', stampYes: 'VALE', stampNo: 'NO VALE',
  ifValid: pts => `+${pts} pt si vale`,
  toVoteTitle: 'Por votar', toVoteSub: 'Mira las pruebas de tus amigos y decide si valen.',
  votedYes: (n, pts) => `Has votado: vale. ${n} consigue +${pts} pt si el grupo está de acuerdo.`,
  votedNo: 'Has votado: no vale.', voteFailed: 'Voto no registrado.',
  notValid: 'No vale', valid: 'Vale', dragHint: 'Desliza la prueba a la derecha si vale y a la izquierda si no.',
  allVoted: 'Lo has votado todo', allVotedSub: 'Cuando alguien suba una prueba nueva, la encontrarás aquí.', close: 'Cerrar',
  rankTitle: 'Clasificación', monthStatus: (m, days) => `${m} · ${days}`,
  questsDone: n => `${n} ${n === 1 ? 'quest hecha' : 'quests hechas'}`,
  winnerOf: m => `Ganador de ${m}`, choiceLabel: 'La elección', restByGroup: 'El resto del próximo plan lo decide el grupo como siempre.',
  chooseOuting: 'Elige una cosa del plan', stillToChoose: n => `${n} todavía tiene que elegir una cosa del próximo plan.`,
  whoWins: m => `Quien gane ${m}`, prizeTitle: 'Se lleva el trofeo y elige una cosa del próximo plan',
  prizeSub: 'Solo una entre dónde se come, qué se hace el fin de semana o qué película se ve en el cine. La clasificación vuelve a cero el día 1.',
  outingSub: 'Puedes decidir solo una de las tres. Toca una sugerencia o escribe la tuya.',
  canWrite: label => `${label}: también puedes escribirlo tú`, outingPh: 'Ej. Pizzería de Gino',
  confirmChoice: 'Confirmar la elección', choiceToast: 'Elección hecha. El grupo ya la ve.',
  outing: {
    eat: { label: 'Dónde se come', opts: ['Pizzería', 'Sushi', 'Bocatas en el parque', 'Kebab', 'Cena en casa de alguien'] },
    do: { label: 'Qué se hace el fin de semana', opts: ['Bolos', 'Escape room', 'Excursión al lago', 'Salón recreativo', 'Partido de fútbol sala'] },
    film: { label: 'Qué se ve en el cine', opts: ['Una de terror', 'Una comedia', 'Una de acción', 'Una de animación'] }
  },
  groupOf: g => `En el grupo ${g}`, monthPoints: 'Puntos del mes', validProofs: 'Pruebas válidas', trophies: n => (n === 1 ? 'Trofeo' : 'Trofeos'),
  kingOf: m => `Rey de ${m}`, yourProofs: 'Tus pruebas', proofsEmpty: 'Las fotos y vídeos que subas para las quests aparecerán aquí.',
  statusValid: 'Vale', statusVoting: 'En voto', statusRejected: 'No vale', trophyCase: 'Vitrina de trofeos',
  settings: 'Ajustes', language: 'Idioma', group: 'Grupo'
};

const fr: Dict = {
  months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  langTitle: 'Choisis ta langue', langSub: 'Tu peux la changer quand tu veux depuis ton profil.', continue: 'Continuer',
  slides: [
    ['Bienvenue sur Side Friends', 'Les quêtes annexes de ta bande d’amis. Chaque ami a sa couleur.'],
    ['Termine des quêtes', 'Chaque semaine, 5 quêtes sortent. Fais-les pour de vrai et envoie une photo ou une vidéo comme preuve.'],
    ['Gagne le mois', 'Le groupe vote les preuves et tu montes au classement. Le gagnant du mois choisit une chose de la prochaine sortie.']
  ],
  next: 'Suivant', start: 'C’est parti',
  nameTitle: 'Comment tu t’appelles ?', nameSub: 'C’est le nom que verront tes amis.', namePh: 'Ton prénom',
  createGroup: 'Créer un groupe', joinWithCode: 'Rejoindre avec un code',
  newGroup: 'Nouveau groupe', newGroupSub: 'Ensuite je te donne un code à envoyer à tes amis.', groupPh: 'Ex. La bande',
  creating: 'Création du groupe…', createIt: 'Créer le groupe', back: 'Retour',
  joinTitle: 'Rejoins le groupe', joinSub: 'Demande le code à 6 caractères à la personne qui a créé le groupe.', joining: 'Connexion…', join: 'Rejoindre',
  genericError: 'Un problème est survenu. Réessaie.',
  netError: 'Impossible de joindre le serveur. Vérifie ta connexion et réessaie.',
  loadFail: 'Impossible de charger le groupe', retry: 'Réessayer',
  tabs: { quest: 'Quêtes', vota: 'Voter', classifica: 'Classement', profilo: 'Profil' },
  chipDone: 'Faite', chipPending: 'Au vote', chipActive: 'En cours', chipNew: 'Nouvelle',
  ptsLine: (pts, video) => `+${pts} pts${video ? ' · vidéo requise' : ''}`,
  rankLabel: n => `${n}${n === 1 ? 're' : 'e'} place`,
  alone: 'Tu es seul : invite tes amis avec le bouton du groupe en haut.',
  behind: (n, name) => `Encore ${n} ${n === 1 ? 'pt' : 'pts'} pour dépasser ${name}.`,
  leading: 'Tu es en tête. Tiens bon jusqu’à la fin du mois.',
  noPoints: 'Termine une quête pour gagner tes premiers points.',
  dayOf: (d, n) => `Jour ${d} sur ${n}`,
  daysLeft: n => (n === 0 ? 'Dernier jour' : n === 1 ? 'Plus qu’1 jour' : `Plus que ${n} jours`),
  thisWeek: 'Cette semaine', doneOf: (a, b) => `${a} sur ${b} faites`,
  weekNote: d => `3 de votre liste et 2 nouvelles idées. Les prochaines sortent ${d === 1 ? 'demain' : `dans ${d} jours`}.`,
  newIdeas: 'Nouvelles idées de la semaine', groupProposals: 'Proposées par le groupe', proposeQuest: 'Proposer une quête', inGroup: 'Dans le groupe',
  you: 'Toi', someone: 'Quelqu’un',
  feed: {
    proof: (me, video, q) => `${me ? 'as envoyé' : 'a envoyé'} ${video ? 'une vidéo' : 'une photo'} pour « ${q} »`,
    done: (me, q, pts) => `${me ? 'as terminé' : 'a terminé'} « ${q} » (+${pts} pts)`,
    proposal: (me, q) => `${me ? 'as proposé' : 'a proposé'} « ${q} »`,
    join: me => (me ? 'as rejoint le groupe' : 'a rejoint le groupe')
  },
  ago: { now: 'maintenant', min: n => `${n} min`, h: n => `${n} h`, d: n => `${n} j` },
  wonMonth: (me, name, month) => (me ? `Tu as gagné ${month}` : `${name} a gagné ${month}`),
  chooseFromRank: 'Choisis une chose de la prochaine sortie depuis le Classement.',
  isChoosing: name => `${name} choisit une chose de la prochaine sortie.`,
  inviteCode: 'Code d’invitation', copy: 'Copier', codeCopied: 'Code copié.', send: 'Envoyer',
  inviteMsg: (g, code) => `Rejoins notre groupe « ${g} » sur Side Friends. Code : ${code}`,
  peopleCount: n => `${n} ${n === 1 ? 'personne' : 'personnes'} · chacun a sa couleur`,
  youSuffix: '(toi)',
  leaveGroup: 'Quitter le groupe',
  leaveWarn: 'Si tu pars, tu disparais du classement et des votes du groupe, et ce téléphone perd l’accès. Pour revenir, il te faudra de nouveau le code, et tu repartirais de zéro.',
  stay: 'Rester', leftToast: 'Tu as quitté le groupe.',
  proposeTitle: 'Proposer une quête', proposeSub: 'Elle dure tout le mois et tout le groupe la voit. 3 par personne et par mois au maximum.',
  whatToDo: 'Qu’est-ce qu’il faut faire ?', proposePh: 'Ex. Fais un pique-nique en ville', howMuch: 'Combien ça vaut ?', wait: 'Un instant…',
  proposeSend: 'Proposer au groupe', proposedToast: 'Quête proposée. Le groupe la voit maintenant.',
  acceptedToast: 'Quête acceptée. Tu as jusqu’à dimanche.',
  permCamera: 'L’accès à l’appareil photo est nécessaire. Active-le dans les réglages du téléphone.',
  permLibrary: 'L’accès aux photos est nécessaire. Active-le dans les réglages du téléphone.',
  videoRequired: 'Cette quête demande une vidéo.',
  videoTooLong: (s, max) => `La vidéo dure ${s} secondes. Coupe-la sous les ${max} et réessaie.`,
  fileTooBig: 'Le fichier est trop lourd (plus de 60 Mo). Essaie avec une vidéo plus courte.',
  uploadFailed: 'L’envoi a échoué. Réessaie.',
  checkProof: 'Vérifie ta preuve', video: 'Vidéo', photo: 'Photo', addComment: 'Ajoute un commentaire', optional: 'Facultatif',
  sending: p => `Envoi… ${p} %`, sendToGroup: 'Envoyer au groupe', pickAnother: 'Choisir un autre fichier',
  ideaLabel: 'Nouvelle idée de la semaine', proposedBy: n => `Proposée par ${n}`, someoneInGroup: 'quelqu’un du groupe',
  groupQuestDesc: 'Quête proposée par le groupe. Elle dure tout le mois.',
  points: 'points', endOfMonth: 'Fin du mois', sunday: 'Dimanche', deadline: 'échéance', proofLabel: 'preuve', photoOrVideo: 'Photo/vidéo',
  alreadyDoneBy: names => `Déjà faite par ${names}`, nobodyYet: 'Personne du groupe ne l’a encore faite. Sois le premier.',
  rejectedNote: 'Le groupe a dit que ta preuve ne compte pas. Tu peux réessayer avec une nouvelle.',
  accept: 'Accepter la quête', recordVideo: 'Filmer la vidéo', shootOrRecord: 'Prendre une photo ou une vidéo', fromGallery: 'Choisir dans la galerie',
  videoUpTo: n => `Vidéos jusqu’à ${n} secondes.`, groupVoting: 'Le groupe est en train de voter', questDone: 'Quête terminée',
  proofSent: 'Preuve envoyée', proofSentSub: pts => `Maintenant le groupe vote. Si elle compte, tu gagnes +${pts} pts.`,
  watchWithSound: 'Regarder avec le son', stampYes: 'VALIDÉ', stampNo: 'REFUSÉ',
  ifValid: pts => `+${pts} pts si validée`,
  toVoteTitle: 'À voter', toVoteSub: 'Regarde les preuves de tes amis et décide si elles comptent.',
  votedYes: (n, pts) => `Tu as voté : validé. ${n} gagne +${pts} pts si le groupe est d’accord.`,
  votedNo: 'Tu as voté : refusé.', voteFailed: 'Vote non enregistré.',
  notValid: 'Refusé', valid: 'Validé', dragHint: 'Glisse la preuve à droite si elle compte, à gauche sinon.',
  allVoted: 'Tu as tout voté', allVotedSub: 'Quand quelqu’un envoie une nouvelle preuve, tu la trouves ici.', close: 'Fermer',
  rankTitle: 'Classement', monthStatus: (m, days) => `${m} · ${days}`,
  questsDone: n => `${n} ${n === 1 ? 'quête faite' : 'quêtes faites'}`,
  winnerOf: m => `Gagnant de ${m}`, choiceLabel: 'Le choix', restByGroup: 'Le reste de la prochaine sortie, c’est le groupe qui décide comme d’habitude.',
  chooseOuting: 'Choisis une chose de la sortie', stillToChoose: n => `${n} doit encore choisir une chose de la prochaine sortie.`,
  whoWins: m => `Qui gagne ${m}`, prizeTitle: 'Remporte le trophée et choisit une chose de la prochaine sortie',
  prizeSub: 'Une seule parmi : où on mange, ce qu’on fait le week-end ou quel film on voit au cinéma. Le classement repart de zéro le 1er du mois.',
  outingSub: 'Tu ne peux décider qu’une seule des trois. Touche une suggestion ou écris la tienne.',
  canWrite: label => `${label} : tu peux aussi l’écrire`, outingPh: 'Ex. La pizzeria de Gino',
  confirmChoice: 'Confirmer le choix', choiceToast: 'Choix fait. Le groupe le voit tout de suite.',
  outing: {
    eat: { label: 'Où on mange', opts: ['Pizzeria', 'Sushi', 'Sandwichs au parc', 'Kebab', 'Dîner chez quelqu’un'] },
    do: { label: 'Ce qu’on fait le week-end', opts: ['Bowling', 'Escape game', 'Sortie au lac', 'Salle d’arcade', 'Foot à cinq'] },
    film: { label: 'Ce qu’on regarde au cinéma', opts: ['Un film d’horreur', 'Une comédie', 'Un film d’action', 'Un film d’animation'] }
  },
  groupOf: g => `Dans le groupe ${g}`, monthPoints: 'Points du mois', validProofs: 'Preuves validées', trophies: n => (n === 1 ? 'Trophée' : 'Trophées'),
  kingOf: m => `Roi de ${m}`, yourProofs: 'Tes preuves', proofsEmpty: 'Les photos et vidéos que tu envoies pour les quêtes arrivent ici.',
  statusValid: 'Validé', statusVoting: 'Au vote', statusRejected: 'Refusé', trophyCase: 'Vitrine des trophées',
  settings: 'Réglages', language: 'Langue', group: 'Groupe'
};

const de: Dict = {
  months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  langTitle: 'Wähl deine Sprache', langSub: 'Du kannst sie jederzeit in deinem Profil ändern.', continue: 'Weiter',
  slides: [
    ['Willkommen bei Side Friends', 'Die Side Quests für deine Freundesgruppe. Jeder Freund hat seine eigene Farbe.'],
    ['Erledige Quests', 'Jede Woche gibt es 5 Quests. Mach sie wirklich und lade ein Foto oder Video als Beweis hoch.'],
    ['Gewinn den Monat', 'Die Gruppe stimmt über die Beweise ab und du steigst in der Rangliste. Wer den Monat gewinnt, bestimmt eine Sache beim nächsten Treffen.']
  ],
  next: 'Weiter', start: 'Los geht’s',
  nameTitle: 'Wie heißt du?', nameSub: 'Diesen Namen sehen deine Freunde.', namePh: 'Dein Name',
  createGroup: 'Gruppe erstellen', joinWithCode: 'Mit Code beitreten',
  newGroup: 'Neue Gruppe', newGroupSub: 'Danach bekommst du einen Code für deine Freunde.', groupPh: 'Z. B. Die Üblichen',
  creating: 'Gruppe wird erstellt…', createIt: 'Gruppe erstellen', back: 'Zurück',
  joinTitle: 'Tritt der Gruppe bei', joinSub: 'Frag die Person, die die Gruppe erstellt hat, nach dem 6-stelligen Code.', joining: 'Trete bei…', join: 'Beitreten',
  genericError: 'Etwas ist schiefgelaufen. Versuch es noch mal.',
  netError: 'Der Server ist nicht erreichbar. Prüf deine Verbindung und versuch es noch mal.',
  loadFail: 'Die Gruppe lässt sich nicht laden', retry: 'Erneut versuchen',
  tabs: { quest: 'Quests', vota: 'Abstimmen', classifica: 'Rangliste', profilo: 'Profil' },
  chipDone: 'Erledigt', chipPending: 'Abstimmung', chipActive: 'Läuft', chipNew: 'Neu',
  ptsLine: (pts, video) => `+${pts} P.${video ? ' · Video nötig' : ''}`,
  rankLabel: n => `${n}. Platz`,
  alone: 'Du bist allein: Lad deine Freunde über den Gruppen-Button oben ein.',
  behind: (n, name) => `Noch ${n} ${n === 1 ? 'Punkt' : 'Punkte'}, um ${name} zu überholen.`,
  leading: 'Du liegst vorn. Halt bis Monatsende durch.',
  noPoints: 'Erledige eine Quest, um deine ersten Punkte zu holen.',
  dayOf: (d, n) => `Tag ${d} von ${n}`,
  daysLeft: n => (n === 0 ? 'Letzter Tag' : n === 1 ? 'Noch 1 Tag' : `Noch ${n} Tage`),
  thisWeek: 'Diese Woche', doneOf: (a, b) => `${a} von ${b} erledigt`,
  weekNote: d => `3 aus eurer Liste und 2 neue Ideen. Die nächsten kommen ${d === 1 ? 'morgen' : `in ${d} Tagen`}.`,
  newIdeas: 'Neue Ideen der Woche', groupProposals: 'Vorschläge der Gruppe', proposeQuest: 'Quest vorschlagen', inGroup: 'In der Gruppe',
  you: 'Du', someone: 'Jemand',
  feed: {
    proof: (me, video, q) => `${me ? 'hast' : 'hat'} ${video ? 'ein Video' : 'ein Foto'} für „${q}“ hochgeladen`,
    done: (me, q, pts) => `${me ? 'hast' : 'hat'} „${q}“ geschafft (+${pts} P.)`,
    proposal: (me, q) => `${me ? 'hast' : 'hat'} „${q}“ vorgeschlagen`,
    join: me => (me ? 'bist der Gruppe beigetreten' : 'ist der Gruppe beigetreten')
  },
  ago: { now: 'jetzt', min: n => `${n} Min.`, h: n => `${n} Std.`, d: n => `${n} T.` },
  wonMonth: (me, name, month) => (me ? `Du hast den ${month} gewonnen` : `${name} hat den ${month} gewonnen`),
  chooseFromRank: 'Bestimm in der Rangliste eine Sache fürs nächste Treffen.',
  isChoosing: name => `${name} bestimmt gerade eine Sache fürs nächste Treffen.`,
  inviteCode: 'Einladungscode', copy: 'Kopieren', codeCopied: 'Code kopiert.', send: 'Senden',
  inviteMsg: (g, code) => `Tritt unserer Gruppe „${g}“ bei Side Friends bei. Code: ${code}`,
  peopleCount: n => `${n} ${n === 1 ? 'Person' : 'Leute'} · jeder hat seine eigene Farbe`,
  youSuffix: '(du)',
  leaveGroup: 'Gruppe verlassen',
  leaveWarn: 'Wenn du gehst, verschwindest du aus der Rangliste und den Abstimmungen der Gruppe, und dieses Handy verliert den Zugang. Zum Zurückkommen brauchst du wieder den Code und fängst bei null an.',
  stay: 'Bleiben', leftToast: 'Du hast die Gruppe verlassen.',
  proposeTitle: 'Quest vorschlagen', proposeSub: 'Sie gilt den ganzen Monat und alle in der Gruppe sehen sie. Höchstens 3 pro Person und Monat.',
  whatToDo: 'Was ist zu tun?', proposePh: 'Z. B. Picknick in der Innenstadt', howMuch: 'Wie viel ist sie wert?', wait: 'Einen Moment…',
  proposeSend: 'Der Gruppe vorschlagen', proposedToast: 'Quest vorgeschlagen. Die Gruppe sieht sie jetzt.',
  acceptedToast: 'Quest angenommen. Du hast bis Sonntag Zeit.',
  permCamera: 'Die App braucht Zugriff auf die Kamera. Schalte ihn in den Einstellungen deines Handys ein.',
  permLibrary: 'Die App braucht Zugriff auf deine Fotos. Schalte ihn in den Einstellungen deines Handys ein.',
  videoRequired: 'Für diese Quest brauchst du ein Video.',
  videoTooLong: (s, max) => `Das Video ist ${s} Sekunden lang. Kürz es auf unter ${max} und versuch es noch mal.`,
  fileTooBig: 'Die Datei ist zu groß (über 60 MB). Versuch es mit einem kürzeren Video.',
  uploadFailed: 'Hochladen fehlgeschlagen. Versuch es noch mal.',
  checkProof: 'Beweis prüfen', video: 'Video', photo: 'Foto', addComment: 'Kommentar hinzufügen', optional: 'Optional',
  sending: p => `Wird gesendet… ${p} %`, sendToGroup: 'An die Gruppe senden', pickAnother: 'Andere Datei wählen',
  ideaLabel: 'Neue Idee der Woche', proposedBy: n => `Vorgeschlagen von ${n}`, someoneInGroup: 'jemandem aus der Gruppe',
  groupQuestDesc: 'Von der Gruppe vorgeschlagene Quest. Gilt den ganzen Monat.',
  points: 'Punkte', endOfMonth: 'Monatsende', sunday: 'Sonntag', deadline: 'Frist', proofLabel: 'Beweis', photoOrVideo: 'Foto/Video',
  alreadyDoneBy: names => `Schon geschafft von ${names}`, nobodyYet: 'Aus der Gruppe hat sie noch niemand geschafft. Sei der Erste.',
  rejectedNote: 'Die Gruppe hat deinen Beweis nicht gelten lassen. Du kannst es mit einem neuen versuchen.',
  accept: 'Quest annehmen', recordVideo: 'Video aufnehmen', shootOrRecord: 'Foto oder Video aufnehmen', fromGallery: 'Aus der Galerie wählen',
  videoUpTo: n => `Videos bis ${n} Sekunden.`, groupVoting: 'Die Gruppe stimmt ab', questDone: 'Quest geschafft',
  proofSent: 'Beweis gesendet', proofSentSub: pts => `Jetzt stimmt die Gruppe ab. Wenn er zählt, bekommst du +${pts} P.`,
  watchWithSound: 'Mit Ton ansehen', stampYes: 'ZÄHLT', stampNo: 'ZÄHLT NICHT',
  ifValid: pts => `+${pts} P., wenn er zählt`,
  toVoteTitle: 'Abstimmen', toVoteSub: 'Schau dir die Beweise deiner Freunde an und entscheide, ob sie zählen.',
  votedYes: (n, pts) => `Du hast abgestimmt: zählt. ${n} bekommt +${pts} P., wenn die Gruppe zustimmt.`,
  votedNo: 'Du hast abgestimmt: zählt nicht.', voteFailed: 'Stimme nicht gespeichert.',
  notValid: 'Zählt nicht', valid: 'Zählt', dragHint: 'Wisch den Beweis nach rechts, wenn er zählt, nach links, wenn nicht.',
  allVoted: 'Du hast über alles abgestimmt', allVotedSub: 'Wenn jemand einen neuen Beweis hochlädt, findest du ihn hier.', close: 'Schließen',
  rankTitle: 'Rangliste', monthStatus: (m, days) => `${m} · ${days}`,
  questsDone: n => `${n} ${n === 1 ? 'Quest geschafft' : 'Quests geschafft'}`,
  winnerOf: m => `Gewinner im ${m}`, choiceLabel: 'Die Wahl', restByGroup: 'Den Rest des nächsten Treffens entscheidet die Gruppe wie immer.',
  chooseOuting: 'Eine Sache fürs Treffen bestimmen', stillToChoose: n => `${n} muss noch eine Sache fürs nächste Treffen bestimmen.`,
  whoWins: m => `Wer den ${m} gewinnt`, prizeTitle: 'Holt sich die Trophäe und bestimmt eine Sache beim nächsten Treffen',
  prizeSub: 'Nur eins davon: wo gegessen wird, was am Wochenende gemacht wird oder welcher Film im Kino läuft. Die Rangliste startet am 1. des Monats bei null.',
  outingSub: 'Du kannst nur eine der drei Sachen bestimmen. Tipp auf einen Vorschlag oder schreib deinen eigenen.',
  canWrite: label => `${label}: Du kannst es auch selbst schreiben`, outingPh: 'Z. B. Pizzeria bei Gino',
  confirmChoice: 'Wahl bestätigen', choiceToast: 'Gewählt. Die Gruppe sieht es sofort.',
  outing: {
    eat: { label: 'Wo gegessen wird', opts: ['Pizzeria', 'Sushi', 'Sandwiches im Park', 'Döner', 'Essen bei jemandem zu Hause'] },
    do: { label: 'Was am Wochenende gemacht wird', opts: ['Bowling', 'Escape Room', 'Ausflug an den See', 'Spielhalle', 'Kleinfeldfußball'] },
    film: { label: 'Was im Kino geschaut wird', opts: ['Ein Horrorfilm', 'Eine Komödie', 'Ein Actionfilm', 'Ein Animationsfilm'] }
  },
  groupOf: g => `In der Gruppe ${g}`, monthPoints: 'Punkte im Monat', validProofs: 'Gültige Beweise', trophies: n => (n === 1 ? 'Trophäe' : 'Trophäen'),
  kingOf: m => `König im ${m}`, yourProofs: 'Deine Beweise', proofsEmpty: 'Die Fotos und Videos, die du für Quests hochlädst, landen hier.',
  statusValid: 'Zählt', statusVoting: 'Abstimmung', statusRejected: 'Zählt nicht', trophyCase: 'Trophäenschrank',
  settings: 'Einstellungen', language: 'Sprache', group: 'Gruppe'
};

const DICTS: Record<Lang, Dict> = { it, en, es, fr, de };

/* ---------- the chosen language, kept on the phone ---------- */
const KEY = 'side-friends-lang';
let current: Lang = 'it';
export const currentLang = () => current;
async function readLang(): Promise<Lang | null> {
  try {
    const v = Platform.OS === 'web' ? globalThis.localStorage?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    return v && v in DICTS ? (v as Lang) : null;
  } catch { return null; }
}
async function writeLang(l: Lang) {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, l);
    else await SecureStore.setItemAsync(KEY, l);
  } catch {}
}
// Best guess for the first screen, before anyone has chosen.
export function deviceLang(): Lang {
  try {
    const l = Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2);
    return (l in DICTS ? l : 'en') as Lang;
  } catch { return 'it'; }
}

type Ctx = { lang: Lang; chosen: boolean; ready: boolean; t: Dict; setLang: (l: Lang) => Promise<void> };
const LangCtx = createContext<Ctx>({ lang: 'it', chosen: false, ready: false, t: it, setLang: async () => {} });
export const useI18n = () => useContext(LangCtx);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(deviceLang());
  const [chosen, setChosen] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    readLang().then(l => {
      if (l) { setLangState(l); setChosen(true); current = l; } else current = deviceLang();
      setReady(true);
    });
  }, []);
  const setLang = useCallback(async (l: Lang) => {
    current = l;
    setLangState(l);
    setChosen(true);
    await writeLang(l);
  }, []);
  return <LangCtx.Provider value={{ lang, chosen, ready, t: DICTS[lang], setLang }}>{children}</LangCtx.Provider>;
}

export const fmtNum = (n: number, lang: Lang) => n.toLocaleString({ it: 'it-IT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' }[lang]);

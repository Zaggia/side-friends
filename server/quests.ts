// The group's own quest list, and the backup ideas used for the two "new ideas" each week.
// Each week the server draws 3 from LIST and 2 from IDEAS, the same for everyone in a group,
// without repeats until a list runs out.

export type QuestDef = {
  id: string;
  title: string;
  desc: string;
  pts: number;
  icon: string;
  video?: boolean;
};

export const LIST: QuestDef[] = [
  { id: 'l1', title: 'Corri 10 km alle 5:30 di mattina', desc: 'Sveglia prima dell’alba e 10 km di corsa. Prova: screenshot dell’app di corsa con orario e distanza.', pts: 80, icon: 'sunrise' },
  { id: 'l2', title: 'Fai una rap battle in pubblico', desc: 'In piazza, al parco o davanti a un locale, contro un amico o uno sconosciuto.', pts: 70, icon: 'mic', video: true },
  { id: 'l3', title: 'Cucina qualcosa dopo mezzanotte', desc: 'Un piatto vero, non un toast. Nella prova si deve vedere l’ora: dopo le 00:00.', pts: 30, icon: 'fork' },
  { id: 'l5', title: 'Cold approach con 10 persone in un giorno', desc: 'Attacca bottone con 10 sconosciuti nella stessa giornata. Se qualcuno non ha voglia di parlare, saluti e passi oltre.', pts: 90, icon: 'chat' },
  { id: 'l6', title: 'Prendi il primo autobus che passa e vai al capolinea', desc: 'Niente mappe: sali sul primo che arriva e scendi solo all’ultima fermata. Prova: foto del cartello del capolinea.', pts: 50, icon: 'bus' },
  { id: 'l7', title: 'Regala un oggetto a caso a una ragazza', desc: 'Prendi la prima cosa che trovi in tasca o nello zaino e regalala a una ragazza a caso.', pts: 40, icon: 'gift' },
  { id: 'l8', title: 'Metti del pane nei carrelli di 10 sconosciuti', desc: 'Al supermercato, una confezione di pane in 10 carrelli diversi, senza farti vedere. Se ti beccano, la quest è fallita.', pts: 60, icon: 'cart', video: true },
  { id: 'l9', title: 'Disegna malissimo qualcuno in metro e regalagli il disegno', desc: 'Più è brutto, meglio è. La prova è il video della consegna.', pts: 50, icon: 'pencil', video: true },
  { id: 'l10', title: 'Usa un oggetto assurdo come astuccio', desc: 'Una scarpa, una pentola, un ananas: portalo a scuola per un giorno intero. Prova: foto sul banco.', pts: 30, icon: 'box' },
  { id: 'l11', title: 'Siediti al tavolo di uno sconosciuto al Mc', desc: 'Comportati come se foste amici da una vita e dividi il suo cibo.', pts: 70, icon: 'fork', video: true },
  { id: 'l12', title: 'Focaccia e benzina al Mc, in coppia', desc: 'Andate in cassa in due: il primo ordina una focaccia con la mortadella, il secondo chiede 50 € di benzina alla pompa 3.', pts: 80, icon: 'users', video: true },
  { id: 'l13', title: 'Canta al karaoke in pubblico', desc: 'Una canzone intera, al microfono, davanti a sconosciuti.', pts: 60, icon: 'mic', video: true },
  { id: 'l14', title: 'Fai 3 ore di matematica senza telefono', desc: 'Tre ore di fila sui libri di matematica, con il telefono spento e lontano. Prova: foto del quaderno e del timer.', pts: 60, icon: 'phoneoff' }
];

export const IDEAS: QuestDef[] = [
  { id: 'i1', title: 'Entra in un negozio e chiedi un prodotto che non esiste', desc: 'Chiedilo serissimo e insisti un po’ prima di arrenderti.', pts: 50, icon: 'chat', video: true },
  { id: 'i2', title: 'Saluta 10 sconosciuti come se fossero vecchi amici', desc: 'Abbracci vietati, entusiasmo obbligatorio. La prova è un video riassunto.', pts: 50, icon: 'users', video: true },
  { id: 'i3', title: 'Balla 30 secondi in piazza senza musica', desc: 'In mezzo alla gente, senza cuffie e senza ridere.', pts: 60, icon: 'mic', video: true },
  { id: 'i4', title: 'Vai a scuola vestito come a un matrimonio', desc: 'Giacca, cravatta o vestito buono per tutta la mattina. Prova: foto in classe.', pts: 40, icon: 'box' },
  { id: 'i5', title: 'Chiedi l’autografo al controllore dell’autobus', desc: 'Digli che è il tuo idolo da sempre. Prova: foto dell’autografo.', pts: 50, icon: 'pencil' },
  { id: 'i6', title: 'Fai una presentazione di 2 minuti su un oggetto a caso', desc: 'Davanti ad almeno 5 sconosciuti, come se fosse un TED talk.', pts: 70, icon: 'mic', video: true },
  { id: 'i7', title: 'Esci con una scarpa e un calzino diversi per tutto il giorno', desc: 'Da quando esci di casa a quando torni. Prova: foto dei piedi a fine giornata.', pts: 30, icon: 'box' },
  { id: 'i8', title: 'Fai la spesa per la cena del gruppo con 10 €', desc: 'Primo, secondo e dolce per tutti con 10 € in totale. Prova: foto dello scontrino e della tavola.', pts: 50, icon: 'cart' },
  { id: 'i9', title: 'Ordina al bar parlando solo in rima', desc: 'Dall’ingresso al conto, ogni frase in rima.', pts: 50, icon: 'coffee', video: true },
  { id: 'i10', title: 'Fatti insegnare una cosa nuova da uno sconosciuto', desc: 'Un passo di ballo, una parola in un’altra lingua, un trucco con le carte. Prova: video di te che lo rifai.', pts: 60, icon: 'users', video: true },
  { id: 'i11', title: 'Chiedi indicazioni per un posto inventato a 5 passanti', desc: 'Insisti che esiste e che ci sei già stato.', pts: 50, icon: 'map', video: true },
  { id: 'i12', title: 'Pranza seduto per terra in mezzo al corridoio della scuola', desc: 'Tovaglietta obbligatoria. Prova: foto.', pts: 40, icon: 'fork' },
  { id: 'i13', title: 'Fai il cameriere per uno sconosciuto al parco', desc: 'Offri un caffè o una merenda servendolo come in un ristorante stellato.', pts: 60, icon: 'coffee', video: true },
  { id: 'i14', title: 'Telefona a un parente e parlagli solo in inglese per 3 minuti', desc: 'Qualunque cosa ti risponda. Serve il video.', pts: 40, icon: 'phoneoff', video: true }
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function permutation(n: number, seed: string): number[] {
  const r = rng(hash(seed));
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Items drawn for one week from a list: the list is walked as a sequence of shuffled decks
// (a new shuffle each time it runs out), `per` items a week, skipping repeats inside a week.
function drawFrom(list: QuestDef[], per: number, weekIndex: number, seed: string): QuestDef[] {
  const n = list.length;
  const at = (i: number) => list[permutation(n, `${seed}:${Math.floor(i / n)}`)[i % n]];
  const out: QuestDef[] = [];
  let i = weekIndex * per;
  while (out.length < per) {
    const q = at(i++);
    if (!out.includes(q)) out.push(q);
  }
  return out;
}

export function weekQuests(groupId: string, weekIndex: number) {
  return {
    list: drawFrom(LIST, 3, weekIndex, `${groupId}:list`),
    ideas: drawFrom(IDEAS, 2, weekIndex, `${groupId}:ideas`)
  };
}

export const OUTING: Record<string, { label: string; opts: string[] }> = {
  eat: { label: 'Dove si mangia', opts: ['Pizzeria', 'Sushi', 'Panini al parco', 'Kebab', 'Cena a casa di qualcuno'] },
  do: { label: 'Cosa si fa nel weekend', opts: ['Bowling', 'Escape room', 'Gita al lago', 'Sala giochi', 'Partita a calcetto'] },
  film: { label: 'Cosa si vede al cinema', opts: ['Un horror', 'Una commedia', 'Un film d’azione', 'Un film d’animazione'] }
};

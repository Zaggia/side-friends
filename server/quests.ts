// The group's own quest list, and the backup ideas used for the two "new ideas" each week.
// Each week the server draws 3 from LIST and 2 from IDEAS, the same for everyone in a group,
// without repeats until a list runs out. Texts come in every language the app speaks.

export const LANGS = ['it', 'en', 'es', 'fr', 'de'] as const;
export type Lang = (typeof LANGS)[number];
type Text = Record<Lang, [title: string, desc: string]>;

export type QuestDef = { id: string; pts: number; icon: string; video?: boolean; text: Text };

export const LIST: QuestDef[] = [
  { id: 'l1', pts: 80, icon: 'sunrise', text: {
    it: ['Corri 10 km alle 5:30 di mattina', 'Sveglia prima dell’alba e 10 km di corsa. Prova: screenshot dell’app di corsa con orario e distanza.'],
    en: ['Run 10 km at 5:30 in the morning', 'Up before dawn and 10 km of running. Proof: a screenshot of your running app with time and distance.'],
    es: ['Corre 10 km a las 5:30 de la mañana', 'Despierta antes del amanecer y corre 10 km. Prueba: captura de tu app de running con la hora y la distancia.'],
    fr: ['Cours 10 km à 5h30 du matin', 'Réveil avant l’aube et 10 km de course. Preuve : capture de ton appli de course avec l’heure et la distance.'],
    de: ['Lauf um 5:30 Uhr morgens 10 km', 'Vor Sonnenaufgang aufstehen und 10 km laufen. Beweis: Screenshot deiner Lauf-App mit Uhrzeit und Strecke.'] } },
  { id: 'l2', pts: 70, icon: 'mic', video: true, text: {
    it: ['Fai una rap battle in pubblico', 'In piazza, al parco o davanti a un locale, contro un amico o uno sconosciuto.'],
    en: ['Do a rap battle in public', 'In a square, at the park or outside a bar, against a friend or a stranger.'],
    es: ['Haz una batalla de rap en público', 'En una plaza, en el parque o delante de un bar, contra un amigo o un desconocido.'],
    fr: ['Fais une battle de rap en public', 'Sur une place, au parc ou devant un bar, contre un ami ou un inconnu.'],
    de: ['Mach einen Rap-Battle in der Öffentlichkeit', 'Auf einem Platz, im Park oder vor einer Bar, gegen einen Freund oder einen Fremden.'] } },
  { id: 'l3', pts: 30, icon: 'fork', text: {
    it: ['Cucina qualcosa dopo mezzanotte', 'Un piatto vero, non un toast. Nella prova si deve vedere l’ora: dopo le 00:00.'],
    en: ['Cook something after midnight', 'A real dish, not a toastie. The proof must show the time: after 00:00.'],
    es: ['Cocina algo después de medianoche', 'Un plato de verdad, no un sándwich. En la prueba se tiene que ver la hora: después de las 00:00.'],
    fr: ['Cuisine quelque chose après minuit', 'Un vrai plat, pas un croque. La preuve doit montrer l’heure : après 00h00.'],
    de: ['Koch etwas nach Mitternacht', 'Ein richtiges Gericht, kein Toast. Auf dem Beweis muss die Uhrzeit zu sehen sein: nach 00:00.'] } },
  { id: 'l5', pts: 90, icon: 'chat', text: {
    it: ['Cold approach con 10 persone in un giorno', 'Attacca bottone con 10 sconosciuti nella stessa giornata. Se qualcuno non ha voglia di parlare, saluti e passi oltre.'],
    en: ['Cold approach 10 people in one day', 'Strike up a conversation with 10 strangers on the same day. If someone doesn’t want to talk, say bye and move on.'],
    es: ['Cold approach con 10 personas en un día', 'Habla con 10 desconocidos el mismo día. Si alguien no quiere hablar, te despides y sigues.'],
    fr: ['Cold approach avec 10 personnes en un jour', 'Engage la conversation avec 10 inconnus dans la même journée. Si quelqu’un n’a pas envie de parler, tu salues et tu passes.'],
    de: ['Cold Approach bei 10 Leuten an einem Tag', 'Sprich am selben Tag 10 Fremde an. Wenn jemand nicht reden will, verabschiedest du dich und gehst weiter.'] } },
  { id: 'l6', pts: 50, icon: 'bus', text: {
    it: ['Prendi il primo autobus che passa e vai al capolinea', 'Niente mappe: sali sul primo che arriva e scendi solo all’ultima fermata. Prova: foto del cartello del capolinea.'],
    en: ['Take the first bus that comes and ride to the last stop', 'No maps: get on the first one and only get off at the end of the line. Proof: a photo of the last stop’s sign.'],
    es: ['Coge el primer autobús que pase y ve hasta el final', 'Sin mapas: súbete al primero que llegue y bájate solo en la última parada. Prueba: foto del cartel de la última parada.'],
    fr: ['Prends le premier bus qui passe jusqu’au terminus', 'Pas de carte : monte dans le premier qui arrive et descends seulement au terminus. Preuve : photo du panneau du terminus.'],
    de: ['Nimm den ersten Bus, der kommt, bis zur Endstation', 'Keine Karten: Steig in den ersten ein und erst an der Endstation aus. Beweis: Foto vom Schild der Endstation.'] } },
  { id: 'l7', pts: 40, icon: 'gift', text: {
    it: ['Regala un oggetto a caso a una ragazza', 'Prendi la prima cosa che trovi in tasca o nello zaino e regalala a una ragazza a caso.'],
    en: ['Give a random object to a girl', 'Take the first thing you find in your pocket or backpack and give it to a random girl.'],
    es: ['Regala un objeto al azar a una chica', 'Coge lo primero que encuentres en el bolsillo o la mochila y regálaselo a una chica al azar.'],
    fr: ['Offre un objet au hasard à une fille', 'Prends la première chose que tu trouves dans ta poche ou ton sac et offre-la à une fille au hasard.'],
    de: ['Schenk einem Mädchen einen zufälligen Gegenstand', 'Nimm das Erste, was du in der Tasche oder im Rucksack findest, und schenk es einem zufälligen Mädchen.'] } },
  { id: 'l8', pts: 60, icon: 'cart', video: true, text: {
    it: ['Metti del pane nei carrelli di 10 sconosciuti', 'Al supermercato, una confezione di pane in 10 carrelli diversi, senza farti vedere. Se ti beccano, la quest è fallita.'],
    en: ['Sneak bread into 10 strangers’ trolleys', 'At the supermarket, one pack of bread in 10 different trolleys without being seen. If you get caught, the quest fails.'],
    es: ['Mete pan en los carritos de 10 desconocidos', 'En el súper, un paquete de pan en 10 carritos distintos sin que te vean. Si te pillan, la quest falla.'],
    fr: ['Glisse du pain dans les caddies de 10 inconnus', 'Au supermarché, un paquet de pain dans 10 caddies différents sans te faire voir. Si on te grille, la quête est ratée.'],
    de: ['Leg Brot in die Einkaufswagen von 10 Fremden', 'Im Supermarkt eine Packung Brot in 10 verschiedene Wagen, ohne gesehen zu werden. Wirst du erwischt, ist die Quest gescheitert.'] } },
  { id: 'l9', pts: 50, icon: 'pencil', video: true, text: {
    it: ['Disegna malissimo qualcuno in metro e regalagli il disegno', 'Più è brutto, meglio è. La prova è il video della consegna.'],
    en: ['Draw someone terribly on the metro and give them the drawing', 'The uglier the better. The proof is the video of you handing it over.'],
    es: ['Dibuja fatal a alguien en el metro y regálale el dibujo', 'Cuanto más feo, mejor. La prueba es el vídeo de la entrega.'],
    fr: ['Dessine très mal quelqu’un dans le métro et offre-lui le dessin', 'Plus c’est moche, mieux c’est. La preuve, c’est la vidéo de la remise.'],
    de: ['Zeichne jemanden in der U-Bahn grottenschlecht und schenk ihm das Bild', 'Je hässlicher, desto besser. Der Beweis ist das Video der Übergabe.'] } },
  { id: 'l10', pts: 30, icon: 'box', text: {
    it: ['Usa un oggetto assurdo come astuccio', 'Una scarpa, una pentola, un ananas: portalo a scuola per un giorno intero. Prova: foto sul banco.'],
    en: ['Use a ridiculous object as your pencil case', 'A shoe, a pan, a pineapple: take it to school for a whole day. Proof: a photo on your desk.'],
    es: ['Usa un objeto absurdo como estuche', 'Un zapato, una olla, una piña: llévalo a clase un día entero. Prueba: foto en tu pupitre.'],
    fr: ['Utilise un objet absurde comme trousse', 'Une chaussure, une casserole, un ananas : emporte-le en cours toute une journée. Preuve : photo sur ton bureau.'],
    de: ['Benutz einen absurden Gegenstand als Federmäppchen', 'Ein Schuh, ein Topf, eine Ananas: Nimm ihn einen ganzen Tag mit in die Schule. Beweis: Foto auf deinem Tisch.'] } },
  { id: 'l11', pts: 70, icon: 'fork', video: true, text: {
    it: ['Siediti al tavolo di uno sconosciuto al Mc', 'Comportati come se foste amici da una vita e dividi il suo cibo.'],
    en: ['Sit at a stranger’s table at McDonald’s', 'Act like you’ve been friends forever and share their food.'],
    es: ['Siéntate en la mesa de un desconocido en el McDonald’s', 'Compórtate como si fuerais amigos de toda la vida y comparte su comida.'],
    fr: ['Assieds-toi à la table d’un inconnu au McDo', 'Fais comme si vous étiez amis depuis toujours et partage sa nourriture.'],
    de: ['Setz dich bei McDonald’s an den Tisch eines Fremden', 'Tu so, als wärt ihr seit Ewigkeiten befreundet, und teil sein Essen.'] } },
  { id: 'l12', pts: 80, icon: 'users', video: true, text: {
    it: ['Focaccia e benzina al Mc, in coppia', 'Andate in cassa in due: il primo ordina una focaccia con la mortadella, il secondo chiede 50 € di benzina alla pompa 3.'],
    en: ['Focaccia and fuel at McDonald’s, as a pair', 'Go to the counter together: the first orders a mortadella focaccia, the second asks for €50 of fuel on pump 3.'],
    es: ['Focaccia y gasolina en el McDonald’s, en pareja', 'Id a la caja los dos: el primero pide una focaccia con mortadela, el segundo pide 50 € de gasolina en el surtidor 3.'],
    fr: ['Focaccia et essence au McDo, en duo', 'Allez à la caisse à deux : le premier commande une focaccia à la mortadelle, le second demande 50 € d’essence à la pompe 3.'],
    de: ['Focaccia und Benzin bei McDonald’s, zu zweit', 'Geht zu zweit zur Kasse: Der Erste bestellt eine Focaccia mit Mortadella, der Zweite verlangt 50 € Benzin an Säule 3.'] } },
  { id: 'l13', pts: 60, icon: 'mic', video: true, text: {
    it: ['Canta al karaoke in pubblico', 'Una canzone intera, al microfono, davanti a sconosciuti.'],
    en: ['Sing karaoke in public', 'A whole song, on the mic, in front of strangers.'],
    es: ['Canta en un karaoke en público', 'Una canción entera, al micrófono, delante de desconocidos.'],
    fr: ['Chante au karaoké en public', 'Une chanson entière, au micro, devant des inconnus.'],
    de: ['Sing öffentlich Karaoke', 'Ein ganzes Lied, am Mikro, vor Fremden.'] } },
  { id: 'l14', pts: 60, icon: 'phoneoff', text: {
    it: ['Fai 3 ore di matematica senza telefono', 'Tre ore di fila sui libri di matematica, con il telefono spento e lontano. Prova: foto del quaderno e del timer.'],
    en: ['Do 3 hours of maths without your phone', 'Three hours straight on your maths books, phone off and out of reach. Proof: a photo of your notebook and the timer.'],
    es: ['Haz 3 horas de matemáticas sin móvil', 'Tres horas seguidas con los libros de mates, con el móvil apagado y lejos. Prueba: foto del cuaderno y del temporizador.'],
    fr: ['Fais 3 heures de maths sans téléphone', 'Trois heures d’affilée sur tes livres de maths, téléphone éteint et loin. Preuve : photo du cahier et du minuteur.'],
    de: ['Mach 3 Stunden Mathe ohne Handy', 'Drei Stunden am Stück Mathe, das Handy aus und außer Reichweite. Beweis: Foto vom Heft und vom Timer.'] } }
];

export const IDEAS: QuestDef[] = [
  { id: 'i1', pts: 50, icon: 'chat', video: true, text: {
    it: ['Entra in un negozio e chiedi un prodotto che non esiste', 'Chiedilo serissimo e insisti un po’ prima di arrenderti.'],
    en: ['Walk into a shop and ask for a product that doesn’t exist', 'Ask with a straight face and insist a bit before giving up.'],
    es: ['Entra en una tienda y pide un producto que no existe', 'Pídelo muy serio e insiste un poco antes de rendirte.'],
    fr: ['Entre dans un magasin et demande un produit qui n’existe pas', 'Demande-le très sérieusement et insiste un peu avant d’abandonner.'],
    de: ['Geh in einen Laden und frag nach einem Produkt, das es nicht gibt', 'Frag todernst und bleib ein bisschen hartnäckig, bevor du aufgibst.'] } },
  { id: 'i2', pts: 50, icon: 'users', video: true, text: {
    it: ['Saluta 10 sconosciuti come se fossero vecchi amici', 'Abbracci vietati, entusiasmo obbligatorio. La prova è un video riassunto.'],
    en: ['Greet 10 strangers like old friends', 'No hugs, plenty of enthusiasm. The proof is a recap video.'],
    es: ['Saluda a 10 desconocidos como si fueran viejos amigos', 'Abrazos prohibidos, entusiasmo obligatorio. La prueba es un vídeo resumen.'],
    fr: ['Salue 10 inconnus comme de vieux amis', 'Câlins interdits, enthousiasme obligatoire. La preuve est une vidéo récap.'],
    de: ['Begrüß 10 Fremde wie alte Freunde', 'Umarmungen verboten, Begeisterung Pflicht. Der Beweis ist ein Zusammenschnitt.'] } },
  { id: 'i3', pts: 60, icon: 'mic', video: true, text: {
    it: ['Balla 30 secondi in piazza senza musica', 'In mezzo alla gente, senza cuffie e senza ridere.'],
    en: ['Dance for 30 seconds in a square with no music', 'In the middle of the crowd, no headphones and no laughing.'],
    es: ['Baila 30 segundos en una plaza sin música', 'En medio de la gente, sin cascos y sin reírte.'],
    fr: ['Danse 30 secondes sur une place sans musique', 'Au milieu des gens, sans écouteurs et sans rire.'],
    de: ['Tanz 30 Sekunden auf einem Platz ohne Musik', 'Mitten zwischen den Leuten, ohne Kopfhörer und ohne zu lachen.'] } },
  { id: 'i4', pts: 40, icon: 'box', text: {
    it: ['Vai a scuola vestito come a un matrimonio', 'Giacca, cravatta o vestito buono per tutta la mattina. Prova: foto in classe.'],
    en: ['Go to school dressed for a wedding', 'Suit, tie or your best outfit all morning. Proof: a photo in class.'],
    es: ['Ve a clase vestido como para una boda', 'Traje, corbata o tu mejor ropa toda la mañana. Prueba: foto en clase.'],
    fr: ['Va en cours habillé comme pour un mariage', 'Costume, cravate ou ta plus belle tenue toute la matinée. Preuve : photo en classe.'],
    de: ['Geh angezogen wie zu einer Hochzeit in die Schule', 'Anzug, Krawatte oder dein bestes Outfit den ganzen Vormittag. Beweis: Foto im Klassenzimmer.'] } },
  { id: 'i5', pts: 50, icon: 'pencil', text: {
    it: ['Chiedi l’autografo al controllore dell’autobus', 'Digli che è il tuo idolo da sempre. Prova: foto dell’autografo.'],
    en: ['Ask the bus ticket inspector for an autograph', 'Tell them they’ve always been your idol. Proof: a photo of the autograph.'],
    es: ['Pide un autógrafo al revisor del autobús', 'Dile que es tu ídolo de toda la vida. Prueba: foto del autógrafo.'],
    fr: ['Demande un autographe au contrôleur du bus', 'Dis-lui que c’est ton idole depuis toujours. Preuve : photo de l’autographe.'],
    de: ['Bitte den Busfahrkartenkontrolleur um ein Autogramm', 'Sag ihm, dass er schon immer dein Idol war. Beweis: Foto vom Autogramm.'] } },
  { id: 'i6', pts: 70, icon: 'mic', video: true, text: {
    it: ['Fai una presentazione di 2 minuti su un oggetto a caso', 'Davanti ad almeno 5 sconosciuti, come se fosse un TED talk.'],
    en: ['Give a 2-minute talk about a random object', 'In front of at least 5 strangers, like it’s a TED talk.'],
    es: ['Haz una presentación de 2 minutos sobre un objeto al azar', 'Delante de al menos 5 desconocidos, como si fuera una charla TED.'],
    fr: ['Fais une présentation de 2 minutes sur un objet au hasard', 'Devant au moins 5 inconnus, comme un TED talk.'],
    de: ['Halt einen 2-Minuten-Vortrag über einen zufälligen Gegenstand', 'Vor mindestens 5 Fremden, wie bei einem TED-Talk.'] } },
  { id: 'i7', pts: 30, icon: 'box', text: {
    it: ['Esci con una scarpa e un calzino diversi per tutto il giorno', 'Da quando esci di casa a quando torni. Prova: foto dei piedi a fine giornata.'],
    en: ['Go out all day with odd shoes and odd socks', 'From the moment you leave home until you get back. Proof: a photo of your feet at the end of the day.'],
    es: ['Sal todo el día con un zapato y un calcetín distintos', 'Desde que sales de casa hasta que vuelves. Prueba: foto de los pies al final del día.'],
    fr: ['Sors toute la journée avec des chaussures et des chaussettes dépareillées', 'De ta sortie jusqu’à ton retour. Preuve : photo de tes pieds en fin de journée.'],
    de: ['Geh den ganzen Tag mit verschiedenen Schuhen und Socken raus', 'Vom Verlassen des Hauses bis zur Rückkehr. Beweis: Foto deiner Füße am Abend.'] } },
  { id: 'i8', pts: 50, icon: 'cart', text: {
    it: ['Fai la spesa per la cena del gruppo con 10 €', 'Primo, secondo e dolce per tutti con 10 € in totale. Prova: foto dello scontrino e della tavola.'],
    en: ['Shop for the group’s dinner with €10', 'Starter, main and dessert for everyone with €10 in total. Proof: a photo of the receipt and the table.'],
    es: ['Haz la compra para la cena del grupo con 10 €', 'Primero, segundo y postre para todos con 10 € en total. Prueba: foto del ticket y de la mesa.'],
    fr: ['Fais les courses pour le dîner du groupe avec 10 €', 'Entrée, plat et dessert pour tous avec 10 € au total. Preuve : photo du ticket et de la table.'],
    de: ['Kauf mit 10 € das Abendessen für die Gruppe ein', 'Vorspeise, Hauptgang und Nachtisch für alle mit insgesamt 10 €. Beweis: Foto vom Kassenbon und vom Tisch.'] } },
  { id: 'i9', pts: 50, icon: 'coffee', video: true, text: {
    it: ['Ordina al bar parlando solo in rima', 'Dall’ingresso al conto, ogni frase in rima.'],
    en: ['Order at a café speaking only in rhyme', 'From the door to the bill, every sentence rhymes.'],
    es: ['Pide en un bar hablando solo en rima', 'De la entrada a la cuenta, cada frase en rima.'],
    fr: ['Commande au café en parlant uniquement en rimes', 'De l’entrée à l’addition, chaque phrase rime.'],
    de: ['Bestell im Café und sprich nur in Reimen', 'Vom Eingang bis zur Rechnung, jeder Satz gereimt.'] } },
  { id: 'i10', pts: 60, icon: 'users', video: true, text: {
    it: ['Fatti insegnare una cosa nuova da uno sconosciuto', 'Un passo di ballo, una parola in un’altra lingua, un trucco con le carte. Prova: video di te che lo rifai.'],
    en: ['Get a stranger to teach you something new', 'A dance move, a word in another language, a card trick. Proof: a video of you doing it.'],
    es: ['Haz que un desconocido te enseñe algo nuevo', 'Un paso de baile, una palabra en otro idioma, un truco de cartas. Prueba: vídeo de ti haciéndolo.'],
    fr: ['Fais-toi apprendre un truc nouveau par un inconnu', 'Un pas de danse, un mot dans une autre langue, un tour de cartes. Preuve : vidéo de toi qui le refais.'],
    de: ['Lass dir von einem Fremden etwas Neues beibringen', 'Einen Tanzschritt, ein Wort in einer anderen Sprache, einen Kartentrick. Beweis: Video, wie du es nachmachst.'] } },
  { id: 'i11', pts: 50, icon: 'map', video: true, text: {
    it: ['Chiedi indicazioni per un posto inventato a 5 passanti', 'Insisti che esiste e che ci sei già stato.'],
    en: ['Ask 5 passers-by for directions to a made-up place', 'Insist it exists and that you’ve been there before.'],
    es: ['Pregunta a 5 personas cómo llegar a un sitio inventado', 'Insiste en que existe y que ya has estado allí.'],
    fr: ['Demande à 5 passants le chemin d’un lieu inventé', 'Insiste sur le fait qu’il existe et que tu y es déjà allé.'],
    de: ['Frag 5 Passanten nach dem Weg zu einem erfundenen Ort', 'Bestehe darauf, dass es ihn gibt und du schon dort warst.'] } },
  { id: 'i12', pts: 40, icon: 'fork', text: {
    it: ['Pranza seduto per terra in mezzo al corridoio della scuola', 'Tovaglietta obbligatoria. Prova: foto.'],
    en: ['Have lunch sitting on the floor in the middle of the school corridor', 'Placemat required. Proof: a photo.'],
    es: ['Come sentado en el suelo en medio del pasillo del instituto', 'Mantel obligatorio. Prueba: foto.'],
    fr: ['Déjeune assis par terre au milieu du couloir de l’école', 'Set de table obligatoire. Preuve : photo.'],
    de: ['Iss mitten im Schulflur auf dem Boden zu Mittag', 'Tischset Pflicht. Beweis: Foto.'] } },
  { id: 'i13', pts: 60, icon: 'coffee', video: true, text: {
    it: ['Fai il cameriere per uno sconosciuto al parco', 'Offri un caffè o una merenda servendolo come in un ristorante stellato.'],
    en: ['Be a waiter for a stranger at the park', 'Offer a coffee or a snack and serve it like in a Michelin-star restaurant.'],
    es: ['Haz de camarero para un desconocido en el parque', 'Ofrece un café o una merienda y sírvelo como en un restaurante con estrella.'],
    fr: ['Fais le serveur pour un inconnu au parc', 'Offre un café ou un goûter et sers-le comme dans un restaurant étoilé.'],
    de: ['Spiel im Park Kellner für einen Fremden', 'Biete einen Kaffee oder einen Snack an und servier ihn wie im Sternerestaurant.'] } },
  { id: 'i14', pts: 40, icon: 'phoneoff', video: true, text: {
    it: ['Telefona a un parente e parlagli solo in inglese per 3 minuti', 'Qualunque cosa ti risponda.'],
    en: ['Call a relative and speak only in a foreign language for 3 minutes', 'Whatever they say back.'],
    es: ['Llama a un familiar y háblale solo en otro idioma durante 3 minutos', 'Te responda lo que te responda.'],
    fr: ['Appelle un proche et parle-lui seulement dans une autre langue pendant 3 minutes', 'Peu importe ce qu’il répond.'],
    de: ['Ruf einen Verwandten an und sprich 3 Minuten nur in einer Fremdsprache', 'Egal, was er antwortet.'] } }
];

export const pickLang = (h: string | null): Lang => {
  const l = (h || '').slice(0, 2).toLowerCase();
  return (LANGS as readonly string[]).includes(l) ? (l as Lang) : 'it';
};
export const questText = (q: QuestDef, lang: Lang) => ({ title: q.text[lang][0], desc: q.text[lang][1] });

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

export const OUTING_KEYS = ['eat', 'do', 'film'] as const;

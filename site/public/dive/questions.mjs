// Original, manually ordered word lists. Rarity scores are editorial estimates,
// not player response percentages. Aliases are equivalent names, not extra picks.
import { EXTRA_QUESTION_ROWS } from './question-expansion.mjs';
import { CULTURE_QUESTION_ROWS } from './questions-culture-extra.mjs';
import { WORLD_QUESTION_ROWS } from './questions-world-extra.mjs';
import { EVERYDAY_QUESTION_ROWS } from './questions-everyday-extra.mjs';
import { ANSWER_AUDIT } from './answer-audit-v2.mjs';

export const CATEGORIES = [
  { id: 'nature', label: 'Natural world' },
  { id: 'culture', label: 'Arts & play' },
  { id: 'world', label: 'Around the world' },
  { id: 'everyday', label: 'Everyday things' },
];

function question(id, category, prompt, entries, preciseMatching = false) {
  const rows = entries
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return {
    id,
    category,
    prompt,
    ...(preciseMatching ? { preciseMatching: true } : {}),
    answers: rows.map((row, index) => {
      const [name, ...aliases] = row.split('~').map((part) => part.trim());
      return {
        name,
        score: Math.round(12 + (88 * index) / Math.max(1, rows.length - 1)),
        ...(aliases.length ? { aliases } : {}),
      };
    }),
  };
}

export const LEGACY_QUESTIONS = [
  question(
    'nature-mammals',
    'nature',
    'Name a kind of mammal.',
    'dog|cat|elephant|lion|tiger|horse|cow~cattle|pig|sheep|goat|bear|monkey|giraffe|zebra|rabbit|mouse|rat|deer|wolf|fox|dolphin|whale|gorilla|chimpanzee~chimp|kangaroo|koala|panda|hippopotamus~hippo|rhinoceros~rhino|squirrel|bat|otter|beaver|hedgehog|seal|walrus|moose|camel|llama|alpaca|bison|buffalo|raccoon|skunk|badger|opossum~possum|sloth|anteater|armadillo|porcupine|platypus|echidna|wombat|capybara|tapir|okapi|pangolin|quokka|numbat|binturong',
  ),
  question(
    'nature-birds',
    'nature',
    'Name a kind of bird.',
    'eagle|parrot|penguin|owl|duck|chicken~hen~rooster|pigeon|sparrow|crow|robin|swan|goose|flamingo|ostrich|peacock~peafowl|seagull~gull|hawk|falcon|woodpecker|hummingbird|turkey|pelican|toucan|kingfisher|raven|magpie|finch|canary|dove|vulture|heron|stork|crane|emu|kiwi|albatross|puffin|swallow|swift|wren|blackbird|blue jay~jay|cardinal|cockatoo|macaw|quail|pheasant|grouse|cormorant|tern|loon|ibis|spoonbill|kestrel|osprey|hoopoe|cassowary|kakapo|shoebill|lyrebird',
  ),
  question(
    'nature-fish',
    'nature',
    'Name a kind of fish.',
    'salmon|tuna|goldfish|shark|cod|trout|clownfish|swordfish|sardine|herring|mackerel|bass|catfish|eel|pike|halibut|flounder|seahorse|pufferfish~puffer fish|stingray|manta ray|anchovy|haddock|tilapia|carp|perch|snapper|grouper|marlin|barracuda|sailfish|mahi mahi~dorado|pollock|sole|hake|sturgeon|guppy|betta~siamese fighting fish|angelfish|lionfish|flying fish|sunfish|parrotfish|wrasse|goby|blenny|mudskipper|coelacanth|oarfish|hagfish|lamprey',
  ),
  question(
    'nature-reptiles',
    'nature',
    'Name a reptile, or a kind of reptile.',
    'snake|lizard|crocodile|alligator|turtle|tortoise|chameleon|iguana|gecko|cobra|python|boa~boa constrictor|rattlesnake|komodo dragon|anaconda|viper|skink|monitor lizard~monitor|gila monster|bearded dragon|sea turtle|box turtle|snapping turtle|leopard gecko|green iguana|king cobra|corn snake|garter snake|ball python|milk snake|coral snake|mamba|black mamba|taipan|caiman|gavial~gharial|tuatara|slow worm|frilled lizard|thorny devil|basilisk|alligator snapping turtle|leatherback turtle|green sea turtle|hawksbill turtle',
  ),
  question(
    'nature-insects',
    'nature',
    'Name a kind of insect.',
    'butterfly|bee|ant|fly|mosquito|beetle|ladybug~ladybird|grasshopper|dragonfly|moth|wasp|cockroach|cricket|termite|flea|praying mantis~mantis|stick insect~walking stick|firefly~lightning bug|cicada|locust|hornet|bumblebee|honeybee~honey bee|dung beetle|stag beetle|rhinoceros beetle|weevil|aphid|earwig|silverfish|bedbug~bed bug|louse|horsefly|fruit fly|lacewing|mayfly|stonefly|caddisfly|damselfly|katydid|leaf insect|water strider|backswimmer|assassin bug|shield bug~stink bug|leafhopper|planthopper|sawfly|antlion',
  ),
  question(
    'nature-flowers',
    'nature',
    'Name a flowering plant grown for its flowers.',
    'rose|tulip|daisy|sunflower|lily|orchid|daffodil|lavender|poppy|violet|carnation|dandelion|hibiscus|jasmine|marigold|chrysanthemum~mum|peony|iris|hydrangea|lotus|water lily|bluebell|foxglove|snapdragon|petunia|geranium|begonia|dahlia|zinnia|cosmos|anemone|ranunculus|freesia|hyacinth|lilac|wisteria|magnolia|camellia|azalea|rhododendron|hollyhock|delphinium|lupin~lupine|sweet pea|morning glory|clematis|amaryllis|snowdrop|crocus|fuchsia|helleborus~hellebore',
  ),
  question(
    'nature-trees',
    'nature',
    'Name a kind of tree.',
    'oak|pine|maple|palm|willow|birch|apple|cherry|elm|cedar|spruce|fir|redwood|sequoia|cypress|ash|beech|poplar|aspen|walnut|chestnut|eucalyptus|acacia|baobab|olive|orange|lemon|mango|coconut|pear|peach|plum|fig|sycamore|hemlock|larch|yew|juniper|alder|holly|hawthorn|rowan|hornbeam|hickory|pecan|sweetgum|dogwood|ginkgo~gingko|tamarind|jacaranda|catalpa|monkey puzzle~monkey puzzle tree',
  ),
  question(
    'nature-weather',
    'nature',
    'Name a weather phenomenon or form of precipitation.',
    'rain|snow|wind|thunderstorm|lightning|thunder|hail|fog|tornado|hurricane|rainbow|sleet|drizzle|blizzard|frost|mist|heat wave~heatwave|drought|monsoon|typhoon|cyclone|dust storm|sandstorm|waterspout|snow flurry~flurry|freezing rain|ice storm|snow shower|sun shower~sunshower|graupel|virga|squall|microburst|downburst|derecho|dust devil|diamond dust|hoarfrost|rime ice~rime|freezing fog|thundersnow|haboob',
  ),
  question(
    'nature-minerals',
    'nature',
    'Name a mineral or a type of rock.',
    'granite|marble|diamond|quartz|slate|limestone|sandstone|ruby|emerald|sapphire|obsidian|basalt|coal|chalk|pumice|amethyst|opal|topaz|garnet|jade|turquoise|flint|gypsum|talc|mica|feldspar|calcite|pyrite~fools gold|hematite|magnetite|malachite|lapis lazuli|agate|jasper|onyx|citrine|peridot|tourmaline|aquamarine|fluorite|halite|dolomite|shale|gneiss|schist|quartzite|rhyolite|andesite|gabbro|diorite|pegmatite|serpentine',
  ),
  question(
    'nature-elements',
    'nature',
    'Name a chemical element.',
    'oxygen~o|gold~au|hydrogen~h|iron~fe|carbon~c|silver~ag|helium~he|copper~cu|nitrogen~n|sodium~na|calcium~ca|aluminium~aluminum~al|uranium~u|lead~pb|zinc~zn|mercury~hg|neon~ne|sulfur~sulphur~s|chlorine~cl|potassium~k|magnesium~mg|lithium~li|silicon~si|phosphorus~p|fluorine~f|tin~sn|nickel~ni|cobalt~co|platinum~pt|titanium~ti|tungsten~w|argon~ar|radon~rn|iodine~i|bromine~br|boron~b|beryllium~be|manganese~mn|chromium~cr|selenium~se|arsenic~as|strontium~sr|barium~ba|radium~ra|plutonium~pu|krypton~kr|xenon~xe|palladium~pd|cadmium~cd|antimony~sb|bismuth~bi|polonium~po|rubidium~rb|caesium~cesium~cs|vanadium~v|scandium~sc|yttrium~y|zirconium~zr|niobium~nb|molybdenum~mo|technetium~tc|ruthenium~ru|rhodium~rh|indium~in|gallium~ga|germanium~ge|tellurium~te|lanthanum~la|cerium~ce|praseodymium~pr|neodymium~nd|promethium~pm|samarium~sm|europium~eu|gadolinium~gd|terbium~tb|dysprosium~dy|holmium~ho|erbium~er|thulium~tm|ytterbium~yb|lutetium~lu|hafnium~hf|tantalum~ta|rhenium~re|osmium~os|iridium~ir|thallium~tl|astatine~at|francium~fr|actinium~ac|thorium~th|protactinium~pa|neptunium~np|americium~am|curium~cm|berkelium~bk|californium~cf|einsteinium~es|fermium~fm|mendelevium~md|nobelium~no|lawrencium~lr|rutherfordium~rf|dubnium~db|seaborgium~sg|bohrium~bh|hassium~hs|meitnerium~mt|darmstadtium~ds|roentgenium~rg|copernicium~cn|nihonium~nh|flerovium~fl|moscovium~mc|livermorium~lv|tennessine~ts|oganesson~og',
  ),
  question(
    'nature-planets',
    'nature',
    'Name one of the eight planets or five IAU-recognized dwarf planets in our Solar System.',
    'earth|mars|jupiter|saturn|venus|neptune|mercury|uranus|pluto|ceres|eris|makemake|haumea',
  ),
  question(
    'nature-constellations',
    'nature',
    'Name one of the 88 modern constellations.',
    'orion|ursa major~great bear|ursa minor~little bear|leo|scorpius~scorpio|taurus|gemini|aries|cancer|virgo|libra|sagittarius|capricornus~capricorn|aquarius|pisces|cassiopeia|andromeda|pegasus|draco|cygnus|lyra|aquila|canis major|canis minor|crux~southern cross|centaurus|perseus|hercules|bootes~boötes|corona borealis|corona australis|corvus|crater|hydra|hydrus|eridanus|cetus|delphinus|sagitta|serpens|ophiuchus|auriga|cepheus|carina|vela|puppis|columba|lepus|lupus|lynx|lacerta|vulpecula|scutum|sextans|triangulum|triangulum australe|ara|apus|pavo|phoenix|grus|tucana|volans|dorado|pictor|fornax|sculptor|caelum|horologium|reticulum|mensa|octans|chamaeleon|musca|norma|circinus|telescopium|microscopium|indus|monoceros|camelopardalis|canes venatici|coma berenices|leo minor|equuleus|antlia|pyxis|piscis austrinus',
  ),
  question(
    'nature-sea-creatures',
    'nature',
    'Name an animal that lives in the sea.',
    'shark|whale|dolphin|octopus|crab|jellyfish|starfish~sea star|seahorse|sea turtle|seal|squid|lobster|shrimp|clam|mussel|oyster|coral|sea anemone|sea urchin|stingray|manta ray|tuna|salmon|cod|clownfish|pufferfish~puffer fish|swordfish|marlin|walrus|sea lion|sea otter|orca~killer whale|narwhal|beluga|humpback whale|blue whale|sperm whale|krill|copepod|scallop|whelk|conch|abalone|nautilus|cuttlefish|sea cucumber|sea slug|nudibranch|barnacle|limpet|chiton|brittle star|sand dollar|sea pen|sea squirt|hagfish|oarfish|coelacanth|siphonophore|salp',
  ),
  question(
    'nature-shells',
    'nature',
    'Name an animal with a shell or hard outer carapace.',
    'turtle|tortoise|snail|crab|lobster|clam|oyster|mussel|shrimp|hermit crab|sea turtle|scallop|prawn|crayfish~crawfish|nautilus|conch|whelk|abalone|barnacle|limpet|cockle|chiton|horseshoe crab|box turtle|snapping turtle|terrapin|periwinkle|winkle|razor clam|geoduck|quahog|spider crab|king crab|fiddler crab|blue crab|stone crab|pistol shrimp|mantis shrimp',
  ),
  question(
    'nature-fruits',
    'nature',
    'Name a fruit commonly eaten sweet or tart, rather than as a vegetable.',
    'apple|banana|orange|strawberry|grape|watermelon|pineapple|mango|peach|pear|cherry|lemon|lime|blueberry|raspberry|blackberry|plum|kiwi~kiwifruit|coconut|grapefruit|pomegranate|melon|cantaloupe~rockmelon|honeydew|apricot|nectarine|tangerine|clementine|mandarin|papaya|passion fruit~passionfruit|guava|lychee~litchi|fig|date|persimmon|cranberry|gooseberry|blackcurrant|redcurrant|boysenberry|mulberry|elderberry|dragon fruit~dragonfruit~pitaya|star fruit~starfruit~carambola|durian|jackfruit|rambutan|mangosteen|quince|kumquat|soursop|cherimoya|longan|loquat|feijoa|salak',
  ),
  question(
    'nature-herbs',
    'nature',
    'Name a culinary herb or spice.',
    'pepper~black pepper|basil|cinnamon|mint|oregano|parsley|rosemary|thyme|ginger|garlic|chili~chilli~chile|paprika|cumin|turmeric|nutmeg|clove~cloves|coriander~cilantro|dill|sage|bay leaf~bay|chive~chives|vanilla|saffron|cardamom|fennel|anise|star anise|cayenne|allspice|tarragon|marjoram|lemongrass|caraway|fenugreek|sumac|sorrel|chervil|savory~savoury|lovage|galangal|asafoetida~asafetida|mace|juniper|nigella|annatto|grains of paradise',
  ),
  question(
    'nature-dog-breeds',
    'nature',
    'Name a breed of dog.',
    'golden retriever|labrador retriever~labrador~lab|german shepherd|poodle|bulldog|chihuahua|beagle|husky~siberian husky|dachshund~sausage dog|pug|dalmatian|rottweiler|boxer|border collie|collie|great dane|doberman~dobermann|shih tzu|corgi~welsh corgi|pomeranian|yorkshire terrier~yorkie|maltese|boston terrier|french bulldog~frenchie|cocker spaniel|springer spaniel|basset hound|bloodhound|greyhound|whippet|saint bernard~st bernard|newfoundland|bernese mountain dog|australian shepherd|australian cattle dog~blue heeler|jack russell terrier~jack russell|bull terrier|staffordshire bull terrier~staffie|akita|shiba inu|chow chow|samoyed|alaskan malamute~malamute|bichon frise|papillon|havanese|basenji|borzoi|saluki|afghan hound|irish wolfhound|scottish deerhound|weimaraner|vizsla|rhodesian ridgeback|belgian malinois~malinois|portuguese water dog|lagotto romagnolo|xoloitzcuintli~mexican hairless dog',
  ),
  question(
    'nature-cat-breeds',
    'nature',
    'Name a recognized breed of domestic cat.',
    'siamese|persian|maine coon|ragdoll|bengal|sphynx|british shorthair|scottish fold|russian blue|abyssinian|birman~birman|burmese|american shorthair|exotic shorthair|norwegian forest cat|siberian|oriental shorthair|devon rex|cornish rex|manx|balinese|himalayan|turkish angora|turkish van|egyptian mau|somali|tonkinese|ocicat|savannah|british longhair|american curl|selkirk rex|laperm~la perm|chartreux|korat|singapura|bombay|japanese bobtail|american bobtail|ragamuffin|toyger|burmilla|snowshoe|peterbald|chausie|nebelung|sokoke|havana brown',
  ),

  question(
    'culture-shakespeare-plays',
    'culture',
    'Name a play written by William Shakespeare.',
    'romeo and juliet|hamlet|macbeth|othello|king lear|a midsummer nights dream~a midsummer night s dream~midsummer nights dream|the tempest|julius caesar|much ado about nothing|the merchant of venice|twelfth night|as you like it|the taming of the shrew|richard iii~richard 3|richard ii~richard 2|henry v~henry 5|henry iv part 1~henry iv~henry 4|henry iv part 2|henry vi part 1~henry vi~henry 6|henry vi part 2|henry vi part 3|henry viii~henry 8|king john|antony and cleopatra|coriolanus|titus andronicus|the winters tale~the winter s tale|the comedy of errors|the two gentlemen of verona|the merry wives of windsor|measure for measure|alls well that ends well~all s well that ends well|loves labours lost~love s labour s lost~loves labors lost|troilus and cressida|timon of athens|pericles~pericles prince of tyre|cymbeline|the two noble kinsmen',
  ),
  question(
    'culture-greek-gods',
    'culture',
    'Name a deity or Titan from Greek mythology.',
    'zeus|poseidon|hades|athena|aphrodite|apollo|artemis|ares|hermes|hera|dionysus|demeter|hephaestus|hestia|persephone|eros|nike|pan|gaia~gaea|cronus~kronos|rhea|uranus~ouranos|prometheus|atlas|helios|selene|eos|hecate|iris|hypnos|thanatos|nemesis|tyche|hebe|triton|amphitrite|oceanus~okeanos|tethys|themis|mnemosyne|hyperion|iapetus|coeus|crius~crius|phoebe|theia|leto|metis|dione|nyx|erebus|aether|hemera|morpheus|asclepius~asklepios|hygieia|enyo|eris|harmonia',
  ),
  question(
    'culture-instruments',
    'culture',
    'Name a musical instrument.',
    'piano|guitar|violin|drums~drum|flute|trumpet|saxophone~sax|cello|clarinet|harp|trombone|ukulele|bass guitar~bass|accordion|harmonica|banjo|recorder|tuba|french horn~horn|oboe|bassoon|viola|double bass~contrabass~upright bass|xylophone|organ|keyboard|synthesizer~synth|mandolin|bagpipes|tambourine|triangle|cymbals~cymbal|maracas|bongos~bongo|conga|djembe|timpani~kettledrum|marimba|vibraphone|glockenspiel|celesta|harpsichord|clavichord|lute|sitar|tabla|sarod|oud|koto|shamisen|erhu|pipa|guqin|guzheng|balalaika|bouzouki|dulcimer|zither|hurdy gurdy|didgeridoo|ocarina|pan flute~panpipes|theremin|glass harmonica',
  ),
  question(
    'culture-strings',
    'culture',
    'Name a stringed musical instrument.',
    'guitar|violin|cello|harp|bass guitar~bass|ukulele|banjo|viola|double bass~contrabass~upright bass|mandolin|piano|lute|sitar|harpsichord|oud|koto|shamisen|erhu|pipa|guqin|guzheng|balalaika|bouzouki|dulcimer|zither|hurdy gurdy|clavichord|sarod|santoor|santour|cimbalom|autoharp|psaltery|kora|nyckelharpa|charango|vihuela|theorbo|archlute|sarangi|morin khuur|rubab~rabab|tanpura~tambura',
  ),
  question(
    'culture-percussion',
    'culture',
    'Name a percussion instrument.',
    'drum|tambourine|triangle|cymbals~cymbal|xylophone|maracas|bongos~bongo|snare drum~snare|bass drum|timpani~kettledrum|gong|cowbell|castanets|marimba|vibraphone|glockenspiel|djembe|conga|tabla|tubular bells~chimes|wood block~woodblock|claves|guiro~güiro|cabasa|agogo|timbales|cajon~cajón|bodhran~bodhrán|tamborim|pandeiro|berimbau|talking drum|frame drum|darbuka~doumbek|taiko|steelpan~steel drum|hang|handpan|washboard|rainstick|slapstick|vibraslap|flexatone|crotales|bell tree|temple blocks|sleigh bells',
  ),
  question(
    'culture-board-games',
    'culture',
    'Name a tabletop board or tile game.',
    'chess|monopoly|scrabble|checkers~draughts|clue~cluedo|risk|battleship|catan~settlers of catan|trivial pursuit|snakes and ladders~chutes and ladders|backgammon|go|mahjong~mah jong|dominoes~dominos|othello~reversi|connect four~connect 4|operation|sorry|the game of life~game of life~life|pictionary|cranium|ticket to ride|carcassonne|pandemic|codenames|stratego|mancala|rummikub|azul|wingspan|agricola|terraforming mars|splendor|7 wonders~seven wonders|patchwork|kingdomino|blokus|qwirkle|shogi|xiangqi|santorini|scythe|viticulture|root|everdell|gloomhaven|ark nova|brass birmingham|concordia',
  ),
  question(
    'culture-consoles',
    'culture',
    'Name a home or handheld video game console.',
    'playstation~ps1~playstation 1|xbox|nintendo switch~switch|playstation 2~ps2|playstation 3~ps3|playstation 4~ps4|playstation 5~ps5|xbox 360|xbox one|xbox series x~series x|xbox series s~series s|wii~nintendo wii|nintendo 64~n64|game boy~gameboy|gamecube~nintendo gamecube|nintendo ds~ds|nintendo 3ds~3ds|nes~nintendo entertainment system|snes~super nintendo|sega genesis~genesis~mega drive~sega mega drive|dreamcast~sega dreamcast|psp~playstation portable|playstation vita~ps vita~vita|game boy advance~gba|game boy color|wii u|sega saturn~saturn|sega master system~master system|game gear~sega game gear|atari 2600|atari 5200|atari 7800|atari lynx|atari jaguar|neo geo~neogeo|turbografx 16~pc engine|3do|colecovision|intellivision|magnavox odyssey~odyssey|virtual boy|neo geo pocket|wonderswan|nintendo switch 2~switch 2',
  ),
  question(
    'culture-literary-genres',
    'culture',
    'Name a literary genre or recognized fiction subgenre.',
    'fantasy|science fiction~sci fi~scifi|romance|mystery|horror|thriller|poetry|biography|autobiography|historical fiction|adventure|crime|comedy|drama|nonfiction~non fiction|memoir|western|dystopian~dystopia|utopian~utopia|satire|tragedy|fairy tale~fairytale|fable|myth|folklore|magical realism|gothic|epic|detective fiction|spy fiction~espionage|supernatural fiction|urban fantasy|high fantasy|dark fantasy|steampunk|cyberpunk|space opera|hard science fiction|military science fiction|alternate history|bildungsroman|picaresque|epistolary|pastoral',
  ),
  question(
    'culture-film-genres',
    'culture',
    'Name a film genre or established film subgenre.',
    'comedy|action|horror|romance|drama|thriller|science fiction~sci fi~scifi|fantasy|animation|documentary|musical|western|adventure|crime|mystery|war|historical|biographical~biopic|family|sports|superhero|spy~espionage|film noir~noir|romantic comedy~romcom|black comedy~dark comedy|slapstick|screwball comedy|psychological thriller|legal thriller|political thriller|martial arts|heist|disaster|monster|slasher|zombie|vampire|found footage|mockumentary|coming of age|road movie|buddy comedy|space opera|spaghetti western|giallo|wuxia|jidaigeki',
  ),
  question(
    'culture-art-movements',
    'culture',
    'Name an art movement or art-historical style.',
    'impressionism|surrealism|cubism|realism|expressionism|abstract expressionism|pop art|renaissance|baroque|romanticism|modernism|postmodernism|art nouveau|art deco|minimalism|dada~dadaism|fauvism|futurism|pointillism|post impressionism|neoclassicism|rococo|gothic|byzantine|mannerism|symbolism|naturalism|suprematism|constructivism|de stijl|bauhaus|op art|color field~colour field|precisionism|regionalism|ashcan school|pre raphaelite~pre raphaelitism|neo expressionism|arte povera|fluxus|vorticism|orphism|divisionism|tenebrism|tachisme|purism',
  ),
  question(
    'culture-dance',
    'culture',
    'Name a dance style or named dance.',
    'ballet|hip hop|salsa|tango|waltz|tap~tap dance|jazz|breakdance~breakdancing~breaking|ballroom|contemporary|swing|cha cha~cha cha cha|rumba|samba|foxtrot|quickstep|flamenco|belly dance~belly dancing|irish dance~irish dancing|line dance~line dancing|square dance~square dancing|polka|jive|lindy hop|charleston|twist|disco|mambo|merengue|bachata|kizomba|zouk|capoeira|hula|haka|bharatanatyam|kathak|odissi|kathakali|bhangra|garba|kuchipudi|samba de gafieira|paso doble~pasodoble|viennese waltz|west coast swing|east coast swing|balboa|shag|voguing|waacking|popping|locking|krumping',
  ),
  question(
    'culture-shakespeare-characters',
    'culture',
    'Name a character from a Shakespeare play.',
    'romeo|juliet|hamlet|macbeth|othello|lady macbeth|king lear~lear|ophelia|puck|iago|desdemona|mercutio|tybalt|benvolio|prospero|ariel|caliban|miranda|oberon|titania|bottom~nick bottom|shylock|portia|antonio|bassanio|beatrice|benedick|rosalind|orlando|touchstone|malvolio|viola|olivia|orsino|sebastian|falstaff~sir john falstaff|henry v~henry|richard iii~richard|julius caesar~caesar|brutus|cassius|mark antony~antony|cleopatra|cordelia|goneril~goneril|regan|edmund|edgar|gloucester|banquo|macduff|duncan|laertes|polonius|gertrude|claudius|horatio|katherina~katherine|petruchio|bianca|timon|coriolanus|leontes|hermione|perdita|autolycus',
  ),
  question(
    'culture-greek-alphabet',
    'culture',
    'Name a letter of the Greek alphabet.',
    'alpha|beta|gamma|delta|pi|omega|sigma|theta|epsilon|lambda|mu|phi|tau|rho|psi|zeta|eta|iota|kappa|nu|xi|omicron|upsilon|chi',
  ),
  question(
    'culture-fairy-tales',
    'culture',
    'Name a traditional fairy tale or an Aesop fable.',
    'cinderella|snow white~snow white and the seven dwarfs|sleeping beauty|little red riding hood~red riding hood|hansel and gretel|rapunzel|beauty and the beast|the little mermaid|the three little pigs~three little pigs|goldilocks and the three bears~goldilocks~the three bears|jack and the beanstalk|rumpelstiltskin|the ugly duckling|the frog prince|the princess and the pea|the little match girl|the snow queen|the emperors new clothes~the emperor s new clothes|the gingerbread man~gingerbread man|puss in boots|the elves and the shoemaker|the twelve dancing princesses|the golden goose|the brave little tailor|the fisherman and his wife|the red shoes|the steadfast tin soldier|the wild swans|the nightingale|the tinderbox|the tortoise and the hare~the hare and the tortoise|the boy who cried wolf|the lion and the mouse|the fox and the grapes|the ant and the grasshopper|the town mouse and the country mouse|the goose that laid the golden eggs|the north wind and the sun|the crow and the pitcher|the fox and the crow|the wolf and the lamb|the dog and his reflection|the bundle of sticks',
  ),
  question(
    'culture-music-genres',
    'culture',
    'Name a music genre or established subgenre.',
    'pop|rock|jazz|classical|hip hop~hiphop|rap|country|blues|metal~heavy metal|electronic|reggae|folk|punk|disco|soul|funk|r and b~rnb~rhythm and blues|opera|gospel|techno|house|dance|indie|alternative|grunge|swing|bluegrass|ska|dubstep|trance|drum and bass~dnb|ambient|new age|bossa nova|samba|salsa|reggaeton|flamenco|afrobeat|afrobeats|highlife|k pop~kpop|j pop~jpop|synthpop|new wave|shoegaze|dream pop|post rock|math rock|progressive rock~prog rock|psychedelic rock|garage rock|punk rock|hard rock|death metal|black metal|power metal|doom metal|thrash metal|industrial|trip hop|downtempo|breakbeat|jungle|grime|drill|trap|zydeco|cajun|fado|tango|cumbia|merengue|bachata',
  ),
  question(
    'culture-writing-systems',
    'culture',
    'Name a writing system, script, or named alphabet.',
    'latin~roman alphabet|greek|cyrillic|arabic|hebrew|chinese~hanzi|hiragana|katakana|hangul~korean|devanagari|egyptian hieroglyphs~hieroglyphs~hieroglyphics|braille|morse code~morse|cuneiform|runes~runic|armenian|georgian|thai|tibetan|bengali|tamil|telugu|kannada|malayalam|gurmukhi|gujarati|odia~oriya|sinhala|burmese~myanmar|khmer|lao|ethiopic~geez|cherokee|canadian aboriginal syllabics~cree syllabics|inuktitut syllabics|ogham|glagolitic|gothic|syriac|thaana|tifinagh|nko|vai|bamum|bopomofo~zhuyin|linear b|linear a|phoenician|ugaritic|old persian cuneiform',
  ),
  question(
    'culture-pixar',
    'culture',
    'Name a Pixar feature film first released before 2025.',
    'toy story|finding nemo|the incredibles~incredibles|cars|monsters inc~monsters incorporated|inside out|up|wall e~walle|ratatouille|coco|toy story 2|toy story 3|toy story 4|finding dory|brave|a bugs life~a bug s life|monsters university|cars 2|cars 3|incredibles 2~the incredibles 2|soul|luca|turning red|onward|elemental|inside out 2|lightyear|the good dinosaur~good dinosaur',
  ),
  question(
    'culture-mario',
    'culture',
    'Name a named character or enemy from the Mario games.',
    'mario|luigi|peach~princess peach|bowser|toad|yoshi|wario|waluigi|daisy~princess daisy|rosalina|donkey kong|diddy kong|bowser jr~bowser junior|goomba|koopa troopa~koopa|boo|shy guy|piranha plant|lakitu|bob omb~bobomb|kamek|dry bones|birdo|toadette|king boo|petey piranha|wiggler|chain chomp|thwomp|blooper|cheep cheep|bullet bill|hammer bro~hammer brother|monty mole|pokey|fuzzy|spike|nabbit~nabbit|pauline|cappy|tiara|professor e gadd~e gadd~egadd|luma|lubba|boom boom|pom pom|iggy koopa~iggy|larry koopa~larry|lemmy koopa~lemmy|ludwig von koopa~ludwig|morton koopa jr~morton|roy koopa~roy|wendy o koopa~wendy|foreman spike|tatanga~tatanga',
  ),

  question(
    'world-europe',
    'world',
    'Name a country commonly grouped with Europe, including transcontinental countries.',
    'france|germany|italy|spain|united kingdom~uk~britain~great britain|greece|portugal|netherlands~holland|switzerland|sweden|norway|denmark|finland|ireland|poland|austria|belgium|russia|ukraine|turkey~turkiye|czechia~czech republic|hungary|romania|iceland|croatia|serbia|bulgaria|slovakia|slovenia|estonia|latvia|lithuania|belarus|moldova|albania|north macedonia~macedonia|bosnia and herzegovina~bosnia|montenegro|luxembourg|malta|cyprus|andorra|monaco|liechtenstein|san marino|vatican city~vatican|georgia|armenia|azerbaijan|kazakhstan|kosovo',
  ),
  question(
    'world-africa',
    'world',
    'Name an African country.',
    'egypt|south africa|kenya|nigeria|morocco|ghana|ethiopia|tanzania|algeria|uganda|tunisia|zimbabwe|zambia|cameroon|senegal|madagascar|libya|sudan|south sudan|somalia|rwanda|mozambique|angola|botswana|namibia|democratic republic of the congo~dr congo~drc~congo kinshasa|republic of the congo~congo~congo brazzaville|ivory coast~cote divoire~cote d ivoire|mali|niger|chad|mauritania|burkina faso|benin|togo|guinea|guinea bissau|sierra leone|liberia|the gambia~gambia|gabon|equatorial guinea|central african republic~car|eritrea|djibouti|burundi|malawi|lesotho|eswatini~swaziland|mauritius|seychelles|comoros|cape verde~cabo verde|sao tome and principe~sao tome',
  ),
  question(
    'world-asia',
    'world',
    'Name a sovereign country wholly or partly in Asia.',
    'china|japan|india|south korea~korea~republic of korea|thailand|vietnam|indonesia|philippines|malaysia|singapore|pakistan|bangladesh|nepal|sri lanka|mongolia|north korea|saudi arabia|iran|iraq|israel|jordan|lebanon|syria|turkey~turkiye|russia|afghanistan|myanmar~burma|cambodia|laos|bhutan|maldives|brunei|timor leste~east timor|united arab emirates~uae|qatar|kuwait|bahrain|oman|yemen|kazakhstan|uzbekistan|turkmenistan|tajikistan|kyrgyzstan|georgia|armenia|azerbaijan|cyprus|palestine|taiwan',
  ),
  question(
    'world-americas',
    'world',
    'Name a sovereign country in North, Central, or South America, including the Caribbean.',
    'canada|united states~usa~us~united states of america~america|mexico|brazil|argentina|chile|peru|colombia|cuba|jamaica|costa rica|panama|venezuela|ecuador|bolivia|uruguay|paraguay|guatemala|honduras|el salvador|nicaragua|belize|haiti|dominican republic|the bahamas~bahamas|barbados|trinidad and tobago~trinidad|grenada|dominica|saint lucia~st lucia|saint vincent and the grenadines~st vincent and the grenadines|antigua and barbuda|saint kitts and nevis~st kitts and nevis|guyana|suriname',
  ),
  question(
    'world-island-countries',
    'world',
    'Name a country made up entirely of one or more islands.',
    'japan|iceland|new zealand|indonesia|philippines|united kingdom~uk~britain|ireland|cuba|jamaica|madagascar|sri lanka|maldives|singapore|malta|cyprus|fiji|mauritius|seychelles|the bahamas~bahamas|barbados|haiti|dominican republic|trinidad and tobago~trinidad|bahrain|brunei|timor leste~east timor|papua new guinea~png|solomon islands|vanuatu|samoa|tonga|tuvalu|kiribati|nauru|palau|marshall islands|federated states of micronesia~micronesia|cape verde~cabo verde|comoros|sao tome and principe~sao tome|grenada|dominica|saint lucia~st lucia|saint vincent and the grenadines~st vincent and the grenadines|antigua and barbuda|saint kitts and nevis~st kitts and nevis',
  ),
  question(
    'world-landlocked',
    'world',
    'Name a landlocked country.',
    'switzerland|austria|mongolia|nepal|bolivia|paraguay|hungary|czechia~czech republic|slovakia|serbia|north macedonia~macedonia|belarus|moldova|luxembourg|liechtenstein|andorra|san marino|vatican city~vatican|kazakhstan|uzbekistan|turkmenistan|kyrgyzstan|tajikistan|afghanistan|bhutan|laos|armenia|azerbaijan|ethiopia|uganda|rwanda|burundi|south sudan|chad|niger|mali|burkina faso|central african republic~car|zambia|zimbabwe|malawi|botswana|lesotho|eswatini~swaziland|kosovo',
  ),
  question(
    'world-capitals',
    'world',
    'Name a city that has served as a national capital.',
    'paris|london|rome|tokyo|beijing|washington dc~washington d c~washington|ottawa|berlin|madrid|athens|moscow|cairo|canberra|new delhi|seoul|bangkok|mexico city|brasilia|buenos aires|lima|santiago|bogota|lisbon|dublin|amsterdam|brussels|vienna|bern|stockholm|oslo|copenhagen|helsinki|warsaw|prague|budapest|bucharest|sofia|belgrade|zagreb|sarajevo|skopje|tirana|podgorica|ljubljana|bratislava|vilnius|riga|tallinn|kyiv~kiev|minsk|chisinau|reykjavik|valletta|nicosia|ankara|tbilisi|yerevan|baku|astana|tashkent|bishkek|dushanbe|ashgabat|kabul|islamabad|dhaka|kathmandu|thimphu|hanoi|vientiane|phnom penh|naypyidaw|kuala lumpur|manila|singapore|wellington|suva|apia|nukualofa~nuku alofa|port vila|honiara|port moresby|kingston|havana|nassau|bridgetown|port of spain|georgetown|paramaribo|montevideo|asuncion|quito|sucre|la paz|san jose|panama city|san salvador|tegucigalpa|guatemala city|managua|belmopan|riyadh|abu dhabi|doha|muscat|kuwait city|manama|baghdad|tehran|amman|beirut|damascus|sanaa~sana a|jerusalem|nairobi|accra|abuja|addis ababa|dakar|rabat|algiers|tunis|tripoli|kampala|kigali|lusaka|harare|gaborone|windhoek|maputo|luanda|bamako|niamey|ouagadougou|ndjamena~n djamena|bangui|libreville|malabo|freetown|monrovia|conakry|bissau|banjul|lome|porto novo|yamoussoukro|dodoma|juba|asmara|djibouti|mogadishu|gitega|lilongwe|mbabane|lobamba|maseru|antananarivo|port louis|victoria|moroni|praia|sao tome|kinshasa|brazzaville|pretoria|cape town|bloemfontein',
  ),
  question(
    'world-us-states',
    'world',
    'Name one of the 50 U.S. states.',
    'california|new york|texas|florida|hawaii|alaska|washington|nevada|arizona|colorado|oregon|ohio|illinois|pennsylvania|michigan|georgia|massachusetts|new jersey|north carolina|south carolina|virginia|west virginia|tennessee|kentucky|louisiana|alabama|mississippi|missouri|wisconsin|minnesota|indiana|iowa|kansas|utah|oklahoma|arkansas|new mexico|maryland|connecticut|maine|vermont|new hampshire|rhode island|delaware|montana|wyoming|idaho|nebraska|north dakota|south dakota',
  ),
  question(
    'world-canada',
    'world',
    'Name a Canadian province or territory.',
    'british columbia~bc|ontario~on|quebec~qc|alberta~ab|manitoba~mb|saskatchewan~sk|nova scotia~ns|new brunswick~nb|newfoundland and labrador~newfoundland~nl|prince edward island~pei~pe|yukon~yt|northwest territories~nwt~nt|nunavut~nu',
  ),
  question(
    'world-australia',
    'world',
    'Name one of Australia’s six states or its two major mainland territories.',
    'new south wales~nsw|victoria~vic|queensland~qld|western australia~wa|south australia~sa|tasmania~tas|northern territory~nt|australian capital territory~act',
  ),
  question(
    'world-abc-countries',
    'world',
    'Name a sovereign country whose English name starts with A, B, or C.',
    'canada|china|brazil|australia|argentina|austria|belgium|chile|colombia|cuba|afghanistan|albania|algeria|andorra|angola|antigua and barbuda|armenia|azerbaijan|the bahamas~bahamas|bahrain|bangladesh|barbados|belarus|belize|benin|bhutan|bolivia|bosnia and herzegovina~bosnia|botswana|brunei|bulgaria|burkina faso|burundi|cabo verde~cape verde|cambodia|cameroon|central african republic~car|chad|comoros|republic of the congo~congo|costa rica|ivory coast~cote divoire~cote d ivoire|croatia|cyprus|czechia~czech republic',
  ),
  question(
    'world-mnp-countries',
    'world',
    'Name a sovereign country whose English name starts with M, N, or P.',
    'mexico|new zealand|norway|netherlands|portugal|peru|poland|pakistan|philippines|nepal|nigeria|morocco|malaysia|mongolia|madagascar|maldives|mali|malta|mauritius|mozambique|myanmar~burma|north korea|north macedonia|namibia|nicaragua|niger|nauru|palau|panama|papua new guinea|paraguay|palestine|malawi|mauritania|marshall islands|federated states of micronesia~micronesia|moldova|monaco|montenegro',
  ),
  question(
    'world-rivers',
    'world',
    'Name a river.',
    'nile|amazon|mississippi|thames|seine|danube|rhine|yangtze|ganges|mekong|yellow river~huang he|congo|volga|tigris|euphrates|indus|murray|darling|yukon|fraser|columbia|colorado|rio grande|orinoco|parana|zambezi|niger|senegal|orange|limpopo|po|tiber|rhone|loire|elbe|oder|vistula|dnieper|don|ural|ob|yenisei|lena|amur|irrawaddy|salween|brahmaputra|godavari|krishna|narmada|jordan|shannon|severn|trent|tyne|mersey|clyde|tay|spey|mackenzie|saskatchewan|athabasca|peace|ottawa|st lawrence~saint lawrence|red river|missouri|ohio|tennessee|arkansas|sacramento|susquehanna|hudson|potomac|chao phraya|fly|sepik|waikato|clutha',
  ),
  question(
    'world-mountain-ranges',
    'world',
    'Name a mountain range.',
    'himalayas~himalaya|alps|andes|rocky mountains~rockies|appalachian mountains~appalachians|pyrenees|ural mountains~urals|atlas mountains~atlas|caucasus|karakoram|hindu kush|tian shan~tienshan|kunlun mountains~kunlun|altai mountains~altai|pamirs~pamir|sierra nevada|cascade range~cascades|coast mountains|brooks range|alaska range|saint elias mountains~st elias mountains|mackenzie mountains|laurentian mountains~laurentians|adirondack mountains~adirondacks|white mountains|green mountains|blue ridge mountains|great smoky mountains~smoky mountains|sierra madre|sierra madre occidental|sierra madre oriental|carpathian mountains~carpathians|apennines|dinaric alps|balkan mountains|scandinavian mountains|pennines|grampian mountains~grampians|cairngorms|taurus mountains~taurus|zagros mountains~zagros|alborz|western ghats|eastern ghats|aravalli range~aravalli|vindhya range~vindhyas|great dividing range|southern alps|drakensberg|rwenzori mountains~rwenzori|virunga mountains~virunga|ethiopian highlands|sudetes|vosges|black forest|jura mountains~jura|cantabrian mountains|sierra morena',
  ),
  question(
    'world-seas',
    'world',
    'Name an ocean or a named sea.',
    'pacific ocean~pacific|atlantic ocean~atlantic|indian ocean|arctic ocean~arctic|southern ocean~antarctic ocean|mediterranean sea~mediterranean|caribbean sea~caribbean|red sea|black sea|north sea|baltic sea~baltic|arabian sea|south china sea|east china sea|sea of japan~east sea|bering sea|coral sea|tasman sea|adriatic sea~adriatic|aegean sea~aegean|ionian sea|tyrrhenian sea|ligurian sea|alboran sea|sargasso sea|labrador sea|greenland sea|norwegian sea|barents sea|white sea|kara sea|laptev sea|east siberian sea|chukchi sea|beaufort sea|lincoln sea|weddell sea|ross sea|amundsen sea|bellingshausen sea|scotia sea|irish sea|celtic sea|sea of azov|sea of marmara|andaman sea|java sea|banda sea|arafura sea|timor sea|flores sea|sulu sea|celebes sea|philippine sea|yellow sea|sea of okhotsk|bismarck sea|solomon sea|fiji sea|bali sea',
  ),
  question(
    'world-currencies',
    'world',
    'Name a currency unit used by a country.',
    'dollar|euro|pound|yen|yuan~renminbi|rupee|peso|franc|won|ruble~rouble|real|rand|lira|baht|dong|krona|krone|zloty|forint|koruna|leu|lev|hryvnia|dinar|dirham|riyal|rial|shekel|shilling|kwacha|naira|cedi|birr|taka|rupiah|ringgit|rufiyaa~rufiyaa|ngultrum|kyat|kip|riel|tugrik~togrog|tenge|som|somoni|manat|lari|dram|lek|denar|mark|pataca|lilangeni|loti|pula|dalasi|leone|ouguiya|ariary|escudo|dobra|quetzal|lempira|cordoba|colon|balboa|boliviano|guarani|sol|gourde|vatu|tala|paanga~pa anga|kina',
  ),
  question(
    'world-europe-capitals',
    'world',
    'Name a city that has served as a European country’s capital.',
    'paris|london|rome|berlin|madrid|athens|lisbon|dublin|amsterdam|brussels|vienna|bern|stockholm|oslo|copenhagen|helsinki|warsaw|prague|budapest|bucharest|sofia|belgrade|zagreb|sarajevo|skopje|tirana|podgorica|ljubljana|bratislava|vilnius|riga|tallinn|kyiv~kiev|minsk|chisinau|reykjavik|valletta|nicosia|ankara|moscow|luxembourg~luxembourg city|monaco|andorra la vella|vaduz|san marino|vatican city|pristina|tbilisi|yerevan|baku|astana',
  ),
  question(
    'world-asia-capitals',
    'world',
    'Name a city that has served as an Asian country’s capital.',
    'tokyo|beijing|new delhi~delhi|seoul|bangkok|hanoi|singapore|manila|kuala lumpur|islamabad|dhaka|kathmandu|thimphu|ulaanbaatar~ulan bator|pyongyang|phnom penh|vientiane|naypyidaw|bandar seri begawan|dili|male~malé|sri jayawardenepura kotte~kotte|riyadh|tehran|baghdad|jerusalem|amman|beirut|damascus|ankara|moscow|kabul|abu dhabi|doha|kuwait city|manama|muscat|sanaa~sana a|astana|tashkent|ashgabat|dushanbe|bishkek|tbilisi|yerevan|baku|nicosia|ramallah|jakarta|nusantara',
  ),

  question(
    'everyday-kitchen',
    'everyday',
    'Name a kitchen utensil, hand tool, or piece of cookware.',
    'spoon|fork|knife|pan~frying pan|pot|spatula|whisk|ladle|tongs|peeler|grater|colander|sieve|rolling pin|cutting board~chopping board|can opener~tin opener|bottle opener|corkscrew|measuring cup|measuring spoon|mixing bowl|kettle|teapot|saucepan|wok|skillet|baking tray~baking sheet|roasting pan|casserole dish|dutch oven|pressure cooker|rice cooker|slow cooker|mortar and pestle~mortar~pestle|garlic press|potato masher|pizza cutter|pastry brush|slotted spoon|slotted turner|fish slice|zester|microplane|mandoline|salad spinner|apple corer|melon baller|lemon squeezer|juicer|funnel|kitchen shears|bench scraper|dough scraper|pastry cutter|baster|ramekin|tagine|tajine|bain marie',
  ),
  question(
    'everyday-tools',
    'everyday',
    'Name a hand tool used for building or repairs.',
    'hammer|screwdriver|wrench~spanner|saw|pliers|drill|tape measure|level~spirit level|chisel|file|sandpaper|axe~ax|mallet|crowbar|allen key~hex key|socket wrench~ratchet|adjustable wrench|pipe wrench|torque wrench|needle nose pliers|locking pliers~vise grips|wire cutter~wire cutters|wire stripper|bolt cutter|hacksaw|coping saw|backsaw|hand plane~plane|wood rasp~rasp|awl|punch|center punch|nail set|pry bar|putty knife|utility knife~box cutter|scraper|clamp|vise~vice|c clamp~g clamp|bar clamp|caliper~calipers|try square|combination square|framing square|bevel gauge|marking gauge|plumb bob|trowel|float|caulking gun|rivet gun|staple gun|tap|die|reamer|brace|spokeshave|adze|froe|drawknife',
  ),
  question(
    'everyday-clothes',
    'everyday',
    'Name an item of clothing.',
    'shirt|pants~trousers|dress|skirt|jacket|coat|sweater~jumper|t shirt~tshirt|shorts|jeans|socks|underwear|hat|scarf|gloves|hoodie|suit|tie~necktie|blouse|cardigan|vest~waistcoat|tank top|polo shirt|blazer|tuxedo~dinner jacket|raincoat|poncho|parka|anorak|windbreaker|overcoat|trench coat|cape|kimono|sari~saree|kilt|sarong|kaftan~caftan|tunic|robe|bathrobe|pajamas~pyjamas|nightgown|leggings|tights|stockings|jumpsuit|overalls~dungarees|romper|leotard|swimsuit~bathing suit|bikini|wetsuit|apron|corset|petticoat|camisole|balaclava|beret|beanie|turban|fez|sombrero|fedora|bowler hat|boater|top hat',
  ),
  question(
    'everyday-shoes',
    'everyday',
    'Name a type of footwear.',
    'sneakers~trainers|boots|sandals|slippers|flip flops~thongs|heels~high heels|loafers|oxfords|brogues|pumps|ballet flats|clogs|moccasins|espadrilles|wellingtons~wellies~rain boots|hiking boots|running shoes|tennis shoes|basketball shoes|football boots~soccer cleats|cleats|track spikes|golf shoes|cycling shoes|ski boots|snowboard boots|ice skates|roller skates|inline skates~rollerblades|boat shoes~deck shoes|chelsea boots|desert boots|chukka boots|cowboy boots|combat boots|work boots|brogue boots|derby shoes~derbies|monk straps|mary janes|slingbacks|mules|wedges|platforms|kitten heels|stilettos|jelly shoes|geta|zori|tabi boots|huaraches|alpargatas|ghillies|pointe shoes',
  ),
  question(
    'everyday-furniture',
    'everyday',
    'Name a piece of furniture.',
    'chair|table|sofa~couch|bed|desk|dresser|wardrobe|bookcase~bookshelf|cabinet|stool|bench|armchair|coffee table|dining table|nightstand~bedside table|ottoman|recliner|futon|loveseat|chaise longue~chaise lounge|rocking chair|beanbag~bean bag|bunk bed|crib~cot|cradle|headboard|vanity~dressing table|sideboard|buffet|hutch|credenza|chest|trunk|chest of drawers|filing cabinet|display cabinet|china cabinet|writing desk|roll top desk|secretary desk|console table|end table~side table|nesting tables|trestle table|gateleg table|pedestal table|hatstand~hat stand|coat rack|shoe rack|room divider~folding screen|prie dieu|settle|settee|divan|daybed|trundle bed',
  ),
  question(
    'everyday-vehicles',
    'everyday',
    'Name a kind of vehicle or means of transport.',
    'car|bus|train|bicycle~bike|motorcycle~motorbike|airplane~aeroplane~plane|boat|truck|van|helicopter|scooter|skateboard|subway~metro|tram~streetcar|taxi~cab|ferry|sailboat~yacht|canoe|kayak|rowboat|speedboat|ship|submarine|jet|glider|hot air balloon|blimp~airship|rocket|space shuttle|gondola|cable car|funicular|monorail|trolleybus|rickshaw|tuk tuk|moped|snowmobile|snowcat|sled~sledge|sleigh|dogsled|hovercraft|hydrofoil|catamaran|trimaran|dinghy|punt|barge|tugboat|trawler|liner|freighter~cargo ship|unicycle|tricycle|tandem bicycle|quad bike~atv|segway|go kart|tractor|combine harvester|forklift|bulldozer|excavator|steamroller|wheelbarrow|carriage|wagon|chariot|palanquin',
  ),
  question(
    'everyday-ball-sports',
    'everyday',
    'Name a sport played with a ball.',
    'soccer~football~association football|basketball|baseball|tennis|golf|volleyball|rugby|american football~gridiron|cricket|table tennis~ping pong|softball|handball|water polo|field hockey~hockey|lacrosse|squash|racquetball|bowling|bocce~bocce ball|petanque~pétanque|netball|dodgeball|kickball|pickleball|polo|croquet|snooker|billiards|pool|beach volleyball|beach soccer|futsal|sepak takraw|hurling|camogie|gaelic football|australian rules football~aussie rules|rugby union|rugby league|rounders|bandy|shinty|pelota|jai alai|fives|real tennis|padel|paddle tennis|boules|lawn bowls|goalball|boccia|korfball|tchoukball|fistball',
  ),
  question(
    'everyday-pasta',
    'everyday',
    'Name a pasta shape or named pasta variety.',
    'spaghetti|penne|macaroni|fusilli|lasagna~lasagne|fettuccine~fettucine|ravioli|linguine|tagliatelle|farfalle~bow ties|rigatoni|tortellini|cannelloni|orzo|vermicelli|bucatini|pappardelle|conchiglie~shells|rotini|capellini~angel hair|cavatappi|orecchiette|gnocchi|ditalini|ziti|manicotti|stelline|pastina|acini di pepe|fregola|trofie|strozzapreti|gemelli|campanelle|radiatori|ruote~wagon wheels|mafaldine|casarecce|cavatelli|garganelli|malloreddus|paccheri|calamarata|mezzi rigatoni|mezze penne|tortiglioni|lumache|anellini|anelletti|spaghettini|spaghettoni|trenette|tagliolini|agnolotti|cappelletti|tortelloni|mezzelune|pici|bigoli|bavette|fazzoletti|corzetti',
  ),
  question(
    'everyday-cheese',
    'everyday',
    'Name a type of cheese.',
    'cheddar|mozzarella|parmesan~parmigiano reggiano|brie|feta|gouda|swiss~swiss cheese|blue cheese|cream cheese|cottage cheese|camembert|provolone|monterey jack|colby|edam|emmental~emmentaler|gruyere~gruyère|ricotta|mascarpone|halloumi|paneer|stilton|roquefort|gorgonzola|goat cheese~chevre|pecorino|manchego|havarti|muenster~munster|port salut|boursin~boursin|neufchatel~neufchâtel|quark|queso fresco|queso blanco|cotija|oaxaca|burrata|scamorza|fontina|asiago|taleggio|grana padano|caciocavallo|piave|robiola|reblochon~reblochon|comte~comté|morbier|raclette|tete de moine~tête de moine|appenzeller|limburger|tilsit|lancashire|wensleydale|cheshire|caerphilly|red leicester|double gloucester|stinking bishop|epoisses~époisses|valencay~valençay',
  ),
  question(
    'everyday-bread',
    'everyday',
    'Name a type of bread or bread roll.',
    'white bread|whole wheat bread~wholemeal bread|sourdough|baguette|bagel|pita~pitta|naan|rye bread|brioche|ciabatta|focaccia|flatbread|tortilla|cornbread|english muffin|crumpet|challah|pumpernickel|pretzel|croissant|biscuit|scone|soda bread|damper|bannock|roti|chapati|paratha|parotta|puri~poori|bhatura|kulcha|lavash|injera|arepa|pao de queijo~pão de queijo|pandebono|pandesal~pan de sal|shokupan~milk bread|bao~baozi|mantou|bing|scallion pancake|rugbrod~rugbrød|limpa|knackebrod~knäckebröd|lefse|matzo~matzah|khobz|khachapuri|lahoh|luchi|batbout|simit|lagana~lagana|tsoureki|panettone|stollen|zopf|kaiser roll|brioche bun|potato bread',
  ),
  question(
    'everyday-tea',
    'everyday',
    'Name a tea variety or herbal tea.',
    'green tea~green|black tea~black|earl grey~earl gray|chamomile~camomile|peppermint|matcha|oolong|white tea~white|english breakfast|jasmine tea~jasmine|chai~masala chai|rooibos|darjeeling|assam|sencha|gyokuro|hojicha~houjicha|genmaicha|bancha|kukicha|longjing~dragon well|gunpowder tea~gunpowder|bi luo chun~biluochun|tieguanyin~tie guan yin|da hong pao|lapsang souchong|keemun|yunnan tea~dian hong|pu erh~puer~pu er|silver needle|bai mudan~white peony|yellow tea|nilgiri|ceylon tea~ceylon|irish breakfast|scottish breakfast|lady grey|lemon balm|hibiscus|rosehip~rose hip|ginger tea~ginger|lemongrass|nettle tea~nettle|dandelion tea~dandelion|fennel tea~fennel|licorice tea~liquorice tea~licorice~liquorice|mate~yerba mate|honeybush|tulsi~holy basil|spearmint|butterfly pea tea~butterfly pea|chrysanthemum tea~chrysanthemum|barley tea|buckwheat tea|sobacha|mugicha',
  ),
  question(
    'everyday-coffee',
    'everyday',
    'Name a coffee drink or brewing style.',
    'latte~caffe latte|cappuccino|espresso|americano|mocha~caffe mocha|flat white|iced coffee|cold brew|black coffee|macchiato~espresso macchiato|latte macchiato|cortado|ristretto|lungo|doppio|affogato|frappe~frappé|irish coffee|turkish coffee|greek coffee|vietnamese coffee|cafe au lait~café au lait|cafe con leche~café con leche|cafe con hielo|cafe bombon|cafe cubano~cuban coffee|cortadito|long black|short black|red eye|black eye|dead eye|breve~caffe breve|espresso con panna|vienna coffee|melange~wiener melange|einspanner~einspänner|marocchino|bicerin|mazagran|carajillo|cafe de olla|cafe touba|qahwa~arabic coffee|kopi|kopi o|kopi c|kopi tarik|yuanyang|dalgona coffee|nitro cold brew|pour over~pourover|french press|aeropress|moka pot|siphon coffee~syphon coffee|drip coffee|bulletproof coffee|egg coffee',
  ),
  question(
    'everyday-stationery',
    'everyday',
    'Name an item of stationery or office supplies.',
    'pen|pencil|paper|notebook|eraser~rubber|ruler|scissors|stapler|staples|paper clip~paperclip|highlighter|marker|crayon|colored pencil~coloured pencil|glue|glue stick|tape~adhesive tape|sticky note~post it|binder|folder|envelope|stamp|pencil sharpener~sharpener|pencil case|correction fluid~whiteout~tippex|correction tape|ballpoint pen|fountain pen|rollerball|gel pen|mechanical pencil|dip pen|quill|ink|ink cartridge|clipboard|index card|business card|label|label maker|hole punch|binder clip|thumbtack~drawing pin|pushpin|rubber band~elastic band|letter opener|desk pad|blotter|blotting paper|carbon paper|tracing paper|graph paper|construction paper|cardstock|watercolor paper~watercolour paper|sketchbook|diary|planner|calendar|address book|ledger|receipt book',
  ),
  question(
    'everyday-fabrics',
    'everyday',
    'Name a textile fiber or a type of fabric.',
    'cotton|silk|wool|linen|denim|polyester|nylon|velvet|satin|leather|fleece|cashmere|lace|chiffon|suede|corduroy|tweed|flannel|canvas|burlap~hessian|hemp|jute|ramie|bamboo|viscose|rayon|modal|lyocell~tencel|acrylic|spandex~elastane~lycra|neoprene|organza|organdy|tulle|taffeta|crepe~crêpe|georgette|muslin|calico|poplin|broadcloth|chambray|gingham|seersucker|sateen|damask|brocade|jacquard|twill|gabardine|serge|herringbone|jersey|interlock|rib knit|terrycloth~terry cloth|velour|chenille|felt|batik|voile|batiste|lawn|ottoman|boucle~bouclé|mohair|angora|alpaca|vicuna~vicuña|qiviut',
  ),
  question(
    'everyday-shapes',
    'everyday',
    'Name a geometric shape, polygon, or solid.',
    'circle|square|triangle|rectangle|oval|sphere|cube|cone|cylinder|pyramid|pentagon|hexagon|octagon|diamond~rhombus|trapezoid~trapezium|parallelogram|ellipse|semicircle|crescent|star|heart|heptagon|nonagon|decagon|dodecagon|quadrilateral|kite|equilateral triangle|isosceles triangle|scalene triangle|right triangle|rectangular prism~cuboid|triangular prism|prism|tetrahedron|octahedron|dodecahedron|icosahedron|hemisphere|torus|ellipsoid|paraboloid|hyperboloid|frustum|antiprism|lozenge|annulus|sector|segment|deltoid|rhombic dodecahedron|truncated icosahedron|enneagon|hendecagon~undecagon|icosagon',
  ),
  question(
    'everyday-lengths',
    'everyday',
    'Name a unit of length or distance.',
    'meter~metre|centimeter~centimetre|millimeter~millimetre|kilometer~kilometre|mile|foot~feet|inch|yard|micrometer~micrometre~micron|nanometer~nanometre|decimeter~decimetre|decameter~decametre|hectometer~hectometre|picometer~picometre|femtometer~femtometre~fermi|angstrom~ångström|light year~lightyear|parsec|astronomical unit~au|nautical mile|fathom|league|furlong|chain|rod|pole|perch|hand|cubit|span|palm|finger|thou~mil|point|pica|cable|link|smoot|rack unit|planck length|kiloparsec|megaparsec|gigaparsec|attometer~attometre',
  ),
  question(
    'everyday-breakfast',
    'everyday',
    'Name a food commonly eaten for breakfast.',
    'eggs|toast|cereal|pancakes|waffles|bacon|sausage|oatmeal~porridge|yogurt~yoghurt|fruit|bagel|croissant|muffin|granola|muesli|french toast|omelet~omelette|scrambled eggs|fried eggs|poached eggs|boiled eggs|eggs benedict|hash browns~hashbrowns|breakfast burrito|breakfast sandwich|biscuits and gravy|grits|scone|crumpet|english muffin|frittata|quiche|congee|dim sum|bao|idli|dosa|upma|poha|paratha|nasi lemak|kaya toast|chilaquiles|huevos rancheros|arepa|tamal~tamale|shakshuka|ful medames|labneh|halloumi|kedgeree|kippers|black pudding|baked beans|soda bread|bannock|loco moco|rice|onigiri|natto|miso soup|pain au chocolat|brioche|rosti~rosti|bircher muesli',
  ),
  question(
    'everyday-cooking',
    'everyday',
    'Name a cooking method or food preparation technique.',
    'baking|frying|boiling|grilling|roasting|steaming|sauteing~sautéing~saute|poaching|simmering|stewing|braising|broiling|barbecuing~barbecuing~bbq|smoking|deep frying|shallow frying|stir frying|pan frying|air frying|pressure cooking|slow cooking|sous vide|blanching|parboiling|scalding|searing|caramelizing~caramelising|flambeing~flambéing~flambe|deglazing|reducing|marinating|brining|curing|pickling|fermenting|dehydrating|drying|freeze drying|candying|confit|coddling|en papillote|water bath~bain marie|double boiling|tempering|emulsifying|whipping|kneading|proofing~proving|folding|creaming|julienning|dicing|mincing|chopping|slicing|grating|zesting|peeling|pureeing~puréeing|mashing|trussing|spatchcocking|butterflying|filleting|boning|barding|larding|rendering|toasting',
  ),
];

export const BASE_QUESTIONS = [
  ...LEGACY_QUESTIONS,
  ...[
    ...EXTRA_QUESTION_ROWS,
    ...CULTURE_QUESTION_ROWS,
    ...WORLD_QUESTION_ROWS,
    ...EVERYDAY_QUESTION_ROWS,
  ].map((row) => question(...row, true)),
];

export const ANSWER_BANK_VERSION = 2;

export function applyAnswerAudit(question, patch = {}) {
  const removed = new Set([...(patch.remove ?? []), ...Object.keys(patch.merge ?? {})]);
  const answers = [...question.answers, ...(patch.additions ?? [])]
    .filter((answer) => !removed.has(answer.name))
    .map((answer) => {
      const merged = question.answers.filter((entry) => patch.merge?.[entry.name] === answer.name);
      const aliases = [
        ...new Set([
          ...(answer.aliases ?? []),
          ...(patch.aliases?.[answer.name] ?? []),
          ...merged.flatMap((entry) => [entry.name, ...(entry.aliases ?? [])]),
        ]),
      ].filter(
        (alias) => alias !== answer.name && !patch.removeAliases?.[answer.name]?.includes(alias),
      );
      return { name: answer.name, score: answer.score, ...(aliases.length ? { aliases } : {}) };
    });
  return {
    ...question,
    prompt: patch.prompt ?? question.prompt,
    preciseMatching: true,
    matchingVersion: ANSWER_BANK_VERSION,
    rejectedInputs: patch.rejectedInputs ?? [],
    answers,
  };
}

export const QUESTIONS = BASE_QUESTIONS.map((question) =>
  applyAnswerAudit(question, ANSWER_AUDIT[question.id]),
);

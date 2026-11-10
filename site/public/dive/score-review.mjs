import { PLAYABLE_ANCHORS } from './playability.mjs';

// Editorial anchors, reviewed by concept rather than inherited list position.
// Columns: prompt | familiar (30) | uncommon (45) | rare (65) | deep cut (85) | exceptional (100).
// The three approachable PLAYABLE_ANCHORS per prompt earn 15. Unreviewed
// long-tail entries receive 45, never an inferred rarity or player percentile.
const rows = `
nature-mammals | lion;tiger;horse;cow;pig;sheep;goat;bear;monkey;giraffe;zebra;rabbit;mouse;rat;deer;wolf;fox;dolphin;whale;human | otter;beaver | capybara;platypus;aardvark | okapi;pangolin | binturong
nature-birds | owl;duck;chicken;pigeon;sparrow;crow;robin;swan;goose;seagull | pelican;kingfisher | hoopoe;cassowary | kakapo;shoebill | Inaccessible Island rail
nature-fish | shark;cod;trout;clownfish;sardine;herring;mackerel;bass;catfish | halibut;sturgeon | mudskipper;oarfish | coelacanth;hagfish |
nature-reptiles | alligator;turtle;tortoise;chameleon;iguana;gecko;cobra;python | skink;monitor lizard | tuatara;slow worm | matamata | Schneider's dwarf caiman
nature-insects | fly;mosquito;beetle;ladybug;grasshopper;dragonfly;moth;wasp;cockroach;cricket | cicada;earwig | antlion;katydid | caddisfly;backswimmer |
nature-flowers | sunflower;lily;orchid;daffodil;lavender;poppy;violet;dandelion | peony;iris | helleborus;delphinium | ranunculus |
nature-trees | palm;willow;birch;apple;cherry;cedar;spruce;fir | eucalyptus;beech | ginkgo;monkey puzzle | dawn redwood |
nature-weather | thunderstorm;lightning;thunder;hail;fog;tornado;hurricane;rainbow;dew;sunshine | sleet;monsoon | thundersnow;waterspout | virga;graupel | haboob
nature-minerals | quartz;slate;limestone;sandstone;ruby;emerald;sapphire;coal;chalk | basalt;gypsum | gneiss;schist | pegmatite;serpentine |
nature-elements | iron;carbon;silver;helium;copper;nitrogen;sodium;calcium;aluminium | tungsten;krypton | bismuth;antimony | praseodymium | darmstadtium
nature-planets | saturn;venus;neptune;mercury;uranus;pluto | ceres;eris | makemake;haumea | |
nature-sea-creatures | octopus;crab;jellyfish;starfish;seahorse;sea turtle;seal;squid;lobster;shrimp | nautilus;sea urchin | nudibranch;sea pen | siphonophore;salp |
nature-shells | crab;lobster;clam;oyster;mussel;shrimp;hermit crab | scallop;conch | geoduck;chiton | tadpole shrimp |
nature-fruits | strawberry;grape;watermelon;pineapple;mango;peach;pear;cherry;lemon;lime;blueberry;raspberry | fig;persimmon | rambutan;mangosteen | salak;jabuticaba |
nature-herbs | mint;oregano;parsley;rosemary;thyme;ginger;garlic;chili;paprika;cumin | tarragon;cardamom | galangal;asafoetida | grains of paradise |
nature-dog-breeds | poodle;bulldog;chihuahua;beagle;husky;dachshund;pug;dalmatian;rottweiler | vizsla;weimaraner | basenji;borzoi | lagotto romagnolo | xoloitzcuintli
culture-instruments | drums;flute;trumpet;saxophone;cello;clarinet;harp;trombone;ukulele;electric guitar;acoustic guitar;classical guitar;kazoo | oboe;bassoon | theremin;hurdy gurdy | guqin;glass harmonica |
culture-strings | harp;bass guitar;ukulele;banjo;viola;double bass;piano;electric guitar;acoustic guitar;classical guitar | mandolin;lute | kora;theorbo | nyckelharpa;morin khuur |
culture-percussion | cymbals;xylophone;maracas;bongos;snare drum;bass drum;cowbell | timpani;djembe | bodhran;vibraslap | flexatone;crotales |
culture-board-games | checkers;clue;risk;battleship;catan;trivial pursuit;snakes and ladders;connect four | carcassonne;azul | shogi;xiangqi | brass birmingham;concordia |
culture-consoles | playstation 2;playstation 3;playstation 4;playstation 5;xbox 360;xbox one;wii;game boy;nintendo ds;nintendo 64;nintendo switch 2 | dreamcast;psp | colecovision;virtual boy | wonderswan;neo geo pocket |
culture-literary-genres | mystery;horror;thriller;poetry;biography;autobiography;adventure;crime | magical realism;gothic | epistolary;picaresque | bildungsroman |
culture-film-genres | romance;drama;thriller;science fiction;fantasy;animation;documentary;musical;western | film noir;mockumentary | giallo;wuxia | jidaigeki |
culture-dance | tango;waltz;tap;jazz;breakdance;ballroom;contemporary;swing | foxtrot;quickstep | waacking;krumping | shag |
culture-fairy-tales | little red riding hood;hansel and gretel;rapunzel;beauty and the beast;the little mermaid;the three little pigs | the ugly duckling;the little match girl | the crow and the pitcher;the wolf and the lamb | the bundle of sticks |
culture-music-genres | classical;hip hop;rap;country;blues;metal;electronic;reggae;folk | bluegrass;ska | fado;bossa nova | zydeco |
world-europe | spain;united kingdom;greece;portugal;netherlands;switzerland;sweden;norway;denmark;russia | slovenia;estonia | san marino;liechtenstein | moldova |
world-africa | nigeria;morocco;ghana;ethiopia;tanzania;algeria;uganda | namibia;botswana | comoros;eswatini | sao tome and principe |
world-asia | south korea;thailand;vietnam;indonesia;philippines;malaysia;singapore;pakistan | mongolia;nepal | timor leste;bhutan | brunei |
world-americas | brazil;argentina;chile;peru;colombia;cuba;jamaica | belize;uruguay | suriname;guyana | saint kitts and nevis |
world-island-countries | united kingdom;indonesia;philippines;cuba;jamaica | madagascar;fiji | kiribati;palau | nauru;tuvalu |
world-capitals | berlin;madrid;tokyo;ottawa;washington dc;beijing | helsinki;prague | thimphu;asmara | ngerulmud |
world-us-states | florida;washington;hawaii;alaska;nevada;ohio | montana;vermont | delaware;rhode island | |
world-canada | alberta;manitoba;nova scotia;saskatchewan | new brunswick;newfoundland and labrador | nunavut;northwest territories | |
world-abc-countries | australia;argentina;austria;belgium;colombia | albania;bangladesh | comoros;bhutan | cabo verde |
world-mnp-countries | pakistan;poland;portugal;peru;netherlands | nepal;panama | nauru;palau | micronesia |
world-rivers | thames;danube;ganges;yangtze;rhine | mekong;seine | Orinoco;limpopo | amu darya |
world-mountain-ranges | rockies;pyrenees;appalachians | atlas;ural mountains | karakoram;hindu kush | rwenzori mountains |
world-seas | mediterranean sea;red sea;black sea;caribbean sea | baltic sea;arabian sea | weddell sea;tasman sea | arafura sea |
world-currencies | yen;rupee;franc;peso | won;baht | quetzal;lempira | ngultrum |
world-europe-capitals | berlin;madrid;athens;amsterdam;dublin | oslo;lisbon | vaduz;podgorica | chisinau |
everyday-kitchen | pan;pot;spatula;whisk | colander;ladle | zester;mandoline | chinois |
everyday-tools | saw;drill;pliers;tape measure;axe | chisel;file | awl;spokeshave | adze |
everyday-clothes | jeans;t shirt;skirt;jacket;coat;socks;sweater;shorts | waistcoat;cardigan | sari;kimono | dirndl |
everyday-shoes | slippers;heels;flip flops;running shoes | loafers;brogues | espadrilles;moccasins | babouche |
everyday-furniture | bed;desk;wardrobe;bookcase;stool | ottoman;sideboard | credenza;chaise longue | secretaire |
everyday-vehicles | bicycle;motorcycle;truck;boat;airplane;taxi | tram;tractor | rickshaw;funicular | hovercraft |
everyday-ball-sports | tennis;golf;volleyball;football;rugby | squash;cricket | sepak takraw;hurling | bossaball |
everyday-pasta | fusilli;linguine;fettuccine;lasagna;ravioli | rigatoni;farfalle | strozzapreti;orecchiette | culurgiones |
everyday-cheese | brie;gouda;feta;swiss;cream cheese | manchego;gruyere | mimolette;scamorza | pule |
everyday-bread | rye;baguette;ciabatta;naan;pita | brioche;focaccia | injera;lavash | damper |
everyday-tea | peppermint;chamomile;oolong;english breakfast | rooibos;matcha | lapsang souchong;pu erh | kukicha |
everyday-coffee | americano;mocha;flat white;black coffee | cortado;macchiato | cafe bombon;ristretto | mazagran |
everyday-stationery | ruler;eraser;notebook;stapler;highlighter;scissors | protractor;compass | blotting paper;bone folder | |
everyday-fabrics | denim;linen;polyester;leather;velvet | corduroy;chiffon | organza;damask | vicuna |
everyday-shapes | rectangle;oval;pentagon;hexagon;star;cube;sphere | rhombus;trapezoid | dodecahedron;heptagon | icosahedron |
everyday-lengths | kilometer;inch;foot;yard;mile | nautical mile;micrometer | angstrom;furlong | parsec |
everyday-breakfast | pancakes;waffles;porridge;bacon;sausage;bagel;yogurt | granola;croissant | congee;shakshuka | ful medames |
everyday-cooking | roasting;grilling;steaming;toasting;chopping;slicing;stir fry;stir frying;microwaving | poaching;braising | sous vide;confit | spherification |
nature-marine-mammals | orca;seal;sea lion;whale | narwhal;manatee | dugong;Risso’s dolphin | Weddell seal |
nature-crustaceans | prawn;crayfish;barnacle | mantis shrimp;woodlouse | fairy shrimp;copepod | horseshoe shrimp |
nature-marine-invertebrates | shrimp;squid;starfish;lobster;clam | sea urchin;nautilus | Christmas tree worm;basket star | ribbon worm |
nature-amphibians | newt;axolotl;tree frog | bullfrog;poison dart frog | caecilian;hellbender | olm |
nature-snakes | boa constrictor;anaconda;garter snake;king cobra | corn snake;ball python | boomslang;gaboon viper | Brahminy blind snake |
nature-lizards | Komodo dragon;bearded dragon;monitor lizard | skink;anole | uromastyx;glass lizard | thorny devil |
nature-marsupials | wallaby;opossum;Tasmanian devil | sugar glider;bandicoot | potoroo;bettong | dunnart |
nature-rodents | hamster;guinea pig;beaver;chipmunk | chinchilla;capybara | jerboa;paca | springhare |
nature-primates | orangutan;baboon;lemur;monkey;ape | gibbon;macaque | sifaka;uakari | aye aye |
nature-wild-cats | cheetah;jaguar;cougar;snow leopard | bobcat;Eurasian lynx | margay;jaguarundi | rusty spotted cat |
nature-wild-canids | wolf;fox;African wild dog;Arctic fox | fennec fox;jackal | dhole;maned wolf | crab eating fox |
nature-bears | giant panda | sun bear;sloth bear | spectacled bear;Asiatic black bear | |
nature-hoofed-mammals | goat;sheep;pig;zebra;giraffe;donkey | moose;elk | pronghorn;ibex | takin |
nature-raptors | owl;vulture;bald eagle | osprey;golden eagle | secretary bird;caracara | harpy eagle |
nature-seabirds | pelican;albatross;tern | gannet;cormorant | kittiwake;razorbill | little auk |
nature-flightless-birds | penguin;cassowary;rhea;dodo | takahe;weka | flightless cormorant;Darwin’s rhea | Inaccessible Island rail |
nature-arachnids | mite;tarantula;black widow | jumping spider;orb weaver | pseudoscorpion;whip scorpion | tailless whip scorpion |
nature-freshwater-animals | beaver;otter;turtle;hippopotamus;crocodile;alligator | axolotl;platypus | freshwater mussel;diving beetle | water strider |
nature-nocturnal-animals | fox;hedgehog;opossum;badger | aardvark;fennec fox | kinkajou;bushbaby | kakapo |
nature-venomous-animals | black widow;wasp;bee;jellyfish | platypus;Gila monster | cone snail;slow loris | shrew |
nature-egg-layers | ostrich;turtle;crocodile;goose;swan | platypus;echidna | tuatara;newt | |
nature-extinct-animals | Tasmanian tiger;passenger pigeon;great auk;megalodon | moa;aurochs | bluebuck;gastric brooding frog | Falkland Islands wolf |
nature-animal-homes | hive;web;kennel;stable | lodge;lair | drey;holt | formicary |
nature-animal-calls | quack;roar;howl;hoot;honk;squeak | bray;bellow | chitter;bugle | trill |
nature-animal-groups | school;swarm;pride | parliament;murder | clowder;sleuth | ostentation |
nature-deciduous-trees | elm;beech;ash;apple;cherry | walnut;alder | hornbeam;tulip tree | dawn redwood |
nature-climbing-plants | honeysuckle;clematis;morning glory | hops;pothos | Dutchman’s pipe;black eyed Susan vine | |
nature-desert-plants | agave;yucca;Joshua tree | aloe;mesquite | Welwitschia;boojum tree | |
nature-root-vegetables | garlic;sweet potato;beet;radish;turnip | parsnip;daikon | salsify;galangal | burdock root |
nature-leafy-vegetables | kale;arugula;bok choy | chard;collard greens | mizuna;tatsoi | mache |
nature-legumes | lentil;peanut;soybean;black bean | edamame;fava bean | lupin bean;pigeon pea | |
nature-citrus | grapefruit;mandarin;tangerine | clementine;pomelo | calamansi;finger lime | Buddha’s hand |
nature-tropical-fruit | coconut;papaya;guava | lychee;passion fruit | cherimoya;salak | cupuacu |
nature-culinary-berries | blackberry;cranberry;gooseberry | mulberry;blackcurrant | cloudberry;salmonberry | tayberry |
nature-culinary-nuts | cashew;pistachio;hazelnut | pecan;macadamia | pili nut;candlenut | |
nature-grains | oats;barley;rye | quinoa;buckwheat | fonio;emmer | einkorn |
nature-drink-plants | grape;apple;orange;mint | hibiscus;chamomile | chicory;guarana | birch |
nature-leaf-herbs | rosemary;thyme;oregano;dill | sage;tarragon | lovage;shiso | Vietnamese coriander |
nature-habitats | rainforest;grassland;wetland;lake;river | tundra;coral reef | seagrass meadow;peat bog | |
nature-gemstones | sapphire;amethyst;opal;topaz | garnet;turquoise | alexandrite;kunzite | iolite |
nature-plant-parts | flower;petal;seed;fruit;bark | stamen;pistil | cotyledon;petiole | internode |
nature-human-organs | liver;kidney;stomach;skin;intestine | pancreas;spleen | thymus;pineal gland | |
nature-celestial-objects | asteroid;comet;galaxy;black hole | nebula;exoplanet | brown dwarf;globular cluster | supernova remnant |
nature-landforms | canyon;plateau;plain;island;beach | peninsula;delta | drumlin;tombolo | karst |
nature-tree-parts | root;bark;twig;seed;fruit | sapwood;heartwood | lenticel;root collar | cambium |
nature-animal-body-parts | claw;paw;hoof;horn;fur;fin | tentacle;antenna | barbel;pedipalp | ovipositor |
culture-v5-marvel-heroes | Thor;Hulk;Black Widow;Hawkeye;Black Panther;Doctor Strange;Wolverine;Deadpool | Moon Knight;Nightcrawler | Squirrel Girl;Iron Fist | |
culture-v5-dc-heroes | Flash;Aquaman;Green Lantern;Robin;Batgirl;Supergirl | Zatanna;Nightwing | Booster Gold;Doctor Fate | Red Tornado |
culture-v5-disney-characters | Anna;Ariel;Aladdin;Jasmine;Belle;Cinderella;Snow White;Mulan;Moana;Donald Duck;Goofy;Minnie Mouse;Olaf | Megara;Esmeralda | Hiro Hamada;Jane Porter | Naveen |
culture-v5-disney-films | The Little Mermaid;Beauty and the Beast;Mulan;Moana;Tangled;Encanto;Zootopia;Cinderella;Pinocchio;Dumbo;Bambi | Treasure Planet;The Sword in the Stone | The Three Caballeros;The Black Cauldron | Saludos Amigos;Make Mine Music |
culture-v5-animated-tv | Adventure Time;Rick and Morty;Family Guy;Futurama;South Park;Bluey;Pokemon;Dragon Ball;Scooby Doo;Tom and Jerry;Peppa Pig | Hilda;Samurai Jack | Over the Garden Wall;Amphibia | |
culture-v5-sitcoms | The Big Bang Theory;How I Met Your Mother;Brooklyn Nine Nine;Parks and Recreation;Modern Family | Father Ted;Peep Show | Spaced;Blackadder | |
culture-v5-fictional-robots | Baymax;Optimus Prime;Bumblebee;Terminator;Bender;BB 8;JARVIS | GLaDOS;Marvin | HK 47;Robby the Robot | AM |
culture-v5-folklore-creatures | vampire;werewolf;fairy;elf;dwarf;goblin;troll;ogre;giant | griffin;centaur | selkie;kelpie | tengu;kappa |
culture-v5-card-games | Uno;Go Fish;Snap;Crazy Eights;Old Maid;War;bridge;hearts;spades;rummy | cribbage;euchre | Tichu;Scopa | Cheating Moth |
culture-v5-chess-terms | bishop;knight;pawn;check;checkmate;stalemate;castling;draw | en passant;fork | zugzwang;fianchetto | zwischenzug |
culture-v5-tabletop-components | token;pawn;tile;spinner;timer;playing piece;deck;rulebook;money | meeple;standee | initiative tracker;dice tower | |
culture-v5-video-game-genres | racing;sports;puzzle;strategy;simulation;adventure;fighting;first person shooter;third person shooter;horror | Metroidvania;roguelike | bullet hell;immersive sim | 4X |
culture-v5-art-media | charcoal;pastel;watercolor;acrylic paint;oil paint;clay;chalk;crayon;digital art;photography | gouache;resin | tempera;found objects | |
culture-v5-painting-tools | canvas;paint roller;paint tray;sponge;water jar;masking tape;rag | palette knife;airbrush | maulstick;rigger brush | filbert brush |
culture-v5-sculpture-materials | wood;stone;plaster;metal;glass;ice;sand;wax;concrete;steel;plastic | terracotta;jade | alabaster;soapstone | |
culture-v5-architectural-features | balcony;staircase;window;doorway;roof;tower;wall;floor;ceiling;chimney;door;stairs | buttress;atrium | spandrel;clerestory | entablature;groin vault |
culture-v5-musical-roles | bassist;pianist;violinist;conductor;soloist;rapper;DJ;lead singer | concertmaster;accompanist | countertenor;cantor | repetiteur |
culture-v5-theatre-jobs | stage manager;producer;costume designer;set designer;lighting designer;sound designer;choreographer;usher;stagehand | prop master;rigger | dramaturg;fly operator | followspot operator |
culture-v5-stage-areas | orchestra pit;auditorium;balcony;lobby;green room;dressing room;box office;curtain | proscenium;apron | vomitorium;prompt corner | scene dock |
culture-v5-storytelling-terms | theme;conflict;climax;resolution;narrator;protagonist;antagonist;flashback;dialogue;plot twist | red herring;MacGuffin | in medias res;epistolary | mise en abyme |
culture-v5-punctuation | exclamation mark;colon;semicolon;apostrophe;quotation mark;hyphen;dash;brackets | ellipsis;asterisk | interrobang;pilcrow | guillemet |
culture-v5-film-jobs | screenwriter;cinematographer;editor;composer;camera operator;costume designer;makeup artist | gaffer;Foley artist | best boy;key grip | continuity editor |
culture-v5-circus-skills | acrobatics;clowning;unicycling;contortion;fire breathing;knife throwing | aerial silks;diabolo | Cyr wheel;rola bola | Russian bar |
world-v5-canadian-cities | Calgary;Ottawa;Edmonton;Winnipeg;Quebec City;Halifax;Victoria;Surrey;Burnaby;Richmond;Coquitlam | Kelowna;Regina | Iqaluit;Rimouski | Rouyn Noranda |
world-v5-uk-cities | Liverpool;Edinburgh;Glasgow;Belfast;Cardiff;Bristol;Leeds;Oxford;Cambridge | Inverness;Exeter | St Davids;Ripon | St Asaph |
world-v5-bridges | Sydney Harbour Bridge;Lions Gate Bridge;Capilano Suspension Bridge;London Bridge | Forth Bridge;Rialto Bridge | Stari Most;Akashi Kaikyo Bridge | Danyang Kunshan Grand Bridge |
world-v5-towers | Tokyo Tower;Tokyo Skytree;Space Needle;Burj Khalifa;Taipei 101 | Blackpool Tower;Galata Tower | Tower of Hercules;Euromast | Milad Tower |
world-v5-london-landmarks | Tower of London;Buckingham Palace;Westminster Abbey;St Paul’s Cathedral;British Museum;Hyde Park | Cutty Sark;Kew Gardens | Borough Market;Hampton Court Palace | |
world-v5-new-york-landmarks | Times Square;Brooklyn Bridge;Rockefeller Center;One World Trade Center;Grand Central Terminal | High Line;Flatiron Building | Intrepid Museum;Vessel | |
world-v5-european-languages | Spanish;Italian;Portuguese;Dutch;Swedish;Polish;Russian | Welsh;Basque | Friulian;Ladin | Manx;Romansh |
world-v5-ancient-civilizations | Maya;Aztec;Inca;Sumer;Babylon;Ancient China | Minoan;Phoenician | Urartian;Tiwanaku | Norte Chico |
world-v5-map-terms | compass rose;scale;legend;contour line;map;atlas;compass | projection;bearing | rhumb line;graticule | isobath |
everyday-v5-appliances | toaster;kettle;blender;dishwasher;stove;oven;mixer | slow cooker;rice cooker | dehydrator;induction cooktop | |
everyday-v5-baking-ingredients | egg;milk;salt;baking powder;chocolate;yeast;vanilla;baking soda | cocoa powder;cornstarch | cream of tartar;xanthan gum | |
everyday-v5-condiments | soy sauce;hot sauce;barbecue sauce;salsa;butter;vinegar | pesto;chutney | harissa;gochujang | sambal oelek |
everyday-v5-soups | vegetable soup;minestrone;French onion soup;clam chowder | miso soup;borscht | Tom kha;pozole | |
everyday-v5-stews | goulash;beef bourguignon;coq au vin;ratatouille;chicken stew;curry | cassoulet;tagine | etouffee;feijoada | |
everyday-v5-salads | fruit salad;coleslaw;pasta salad;green salad;chicken salad;egg salad | Waldorf salad;Cobb salad | gado gado;fattoush | |
everyday-v5-sandwiches | peanut butter and jelly;ham and cheese;tuna melt;chicken sandwich;hamburger;turkey sandwich | banh mi;croque monsieur | katsu sando;muffuletta | |
everyday-v5-pizza-toppings | pineapple;ham;sausage;onion;olive;pepper;bacon;chicken;tomato | anchovy;jalapeno | artichoke;ricotta | |
everyday-v5-sushi | rice;nori;avocado;cucumber;California roll;wasabi;crab;pickled ginger | eel;Philadelphia roll | futomaki;hosomaki | masago |
everyday-v5-noodle-dishes | pho;pad thai;chow mein;lo mein;chicken noodle soup;fettuccine alfredo | soba;laksa | bun cha;pad kee mao | |
everyday-v5-pasta-sauces | pesto;carbonara;marinara;cheese sauce;cream sauce | arrabbiata;puttanesca | gricia;salsa di noci | |
everyday-v5-dumplings | ravioli;pierogi;momo;bao | har gow;siu mai | kreplach;kolduny | quenelle |
everyday-v5-rice-dishes | paella;biryani;rice pudding;jambalaya;sticky rice | bibimbap;arancini | tahchin;oyakodon | |
everyday-v5-mexican-food | enchilada;nachos;tamale;guacamole;salsa;chimichanga | pozole;barbacoa | huitlacoche;tlayuda | |
everyday-v5-flatbreads | chapati;roti;flatbread;focaccia;pizza | lavash;injera | carasau;uttapam | |
everyday-v5-cakes | sponge cake;pound cake;red velvet cake;Black Forest cake;wedding cake;lemon cake | angel food cake;Bundt cake | Genoise;opera cake | |
everyday-v5-cookies | gingerbread;sugar cookie;peanut butter cookie;Oreo | snickerdoodle;biscotti | stroopwafel;Viennese whirl | |
everyday-v5-pastries | cream puff;strudel;turnover;apple turnover;egg tart;sausage roll;quiche | baklava;beignet | Canelé;kouign amann | |
everyday-v5-desserts | brownie;tiramisu;mousse;sorbet;apple pie;crumble;donut | panna cotta;creme brulee | baked Alaska;Canelé | |
everyday-v5-ice-cream | mint chocolate chip;cookies and cream;coffee;caramel;Neapolitan;strawberry cheesecake | pistachio;rum raisin | spumoni;hokey pokey | |
everyday-v5-sweets | jelly bean;toffee;fudge;marshmallow;Bubble gum;Mint candy | nougat;marzipan | Turkish delight;praline | |
everyday-v5-hot-drinks | latte;cappuccino;espresso;Americano;green tea;black tea;herbal tea | chai;mulled wine | honeybush;tulsi | buckwheat tea |
everyday-v5-juices | cranberry;pineapple;grapefruit;lemon;tomato | pomegranate;carrot | wheatgrass;yuzu | fennel |
everyday-v5-egg-dishes | boiled egg;poached egg;eggs Benedict;deviled eggs | frittata;shakshuka | omurice;century egg | |
everyday-v5-potato-dishes | hash browns;roast potatoes;potato salad;potato chips;samosa | gnocchi;dauphinoise potatoes | pommes dauphine;patatas alioli | |
everyday-v5-fermented-food | beer;wine;kimchi;sauerkraut;sourdough;vinegar | kefir;tempeh | pulque;poi | |
everyday-v5-snacks | crackers;tortilla chips;nachos;roasted peanuts;chocolate;cookie | edamame;trail mix | takoyaki;scotch eggs | |
everyday-v5-preserving-food | drying;pickling;salting;smoking | fermentation;brining | irradiation;oil preservation | |
everyday-v5-knife-cuts | mince;cube;shred;carve;peeling | julienne;chiffonade | brunoise;Concassé | Suprême |
everyday-v5-measuring-kitchen | measuring jug;thermometer;timer;clock;stopwatch | probe thermometer;jigger | dough ruler;portion scoop | |
everyday-v5-bakeware | loaf pan;pie dish;rolling pin;mixing bowl;oven;roasting pan | springform pan;ramekin | banneton;dough scraper | |
everyday-v5-tableware | glass;fork;knife;spoon;mug;napkin;teapot | gravy boat;saucer | salt cellar;charger plate | |
everyday-v5-cleaning-tools | sponge;bucket;dustpan;duster;dishcloth;dishwashing sponge;garbage bag;cleaning wipe | squeegee;steel wool | drain snake;carpet sweeper | |
everyday-v5-laundry | detergent;clothesline;clothespin;iron;laundry pod;bleach | stain remover;lint brush | washboard;dry cleaning solvent | |
everyday-v5-bathroom | bathtub;towel;toothbrush;toothpaste;soap;toilet paper;mirror;shampoo;cotton swab | bath mat;loofah | bidet;pumice stone | |
everyday-v5-bedroom | mattress;sheet;dresser;wardrobe;clock;slippers;bookshelf | duvet;nightstand | bolster;valance | |
everyday-v5-garden-tools | watering can;hose;trowel;wheelbarrow;gardening gloves;sprinkler | secateurs;loppers | dibber;propagator | |
everyday-v5-garden-tasks | pruning;mowing;digging;raking;pest control | mulching;grafting | espalier;pollarding | disbudding |
everyday-v5-sewing-tools | sewing machine;pin;fabric;button;iron;ironing board | seam ripper;thimble | tracing wheel;serger | |
everyday-v5-fasteners | nut;washer;rivet;staple;glue;tape | cotter pin;dowel | molly bolt;wedge anchor | |
everyday-v5-mechanisms | wheel;axle;screw;wedge;spring | cam;crank | scotch yoke;rack and pinion | |
everyday-v5-computer-peripherals | printer;scanner;speaker;microphone;headphones;webcam | graphics tablet;external hard drive | KVM switch;MIDI keyboard | |
everyday-v5-file-extensions | png;docx;xlsx;pptx;mp3;mp4;zip;gif;csv | json;html | toml;tex | |
everyday-v5-keyboard-keys | Delete;Shift;Control;Alt;Escape;Tab;Caps Lock;Command;Option | Print Screen;Home | Scroll Lock;Pause | |
everyday-v5-accessories | gloves;tie;sunglasses;watch;handbag;wallet;jewelry;headband | cufflinks;brooch | fascinator;tie pin | |
everyday-v5-hats | top hat;beret;fedora;bucket hat;sun hat;sombrero;turban;visor | bowler;fez | cloche;tubeteika | |
everyday-v5-bags | tote bag;duffel bag;messenger bag;briefcase;purse;clutch;gym bag;lunch bag | satchel;garment bag | reticule;bivvy bag | |
everyday-v5-fabric-patterns | check;floral;paisley;tartan;gingham | houndstooth;herringbone | ogee;toile | |
everyday-v5-color-names | brown;gray;turquoise;teal;navy;maroon;beige;lavender;coral | chartreuse;ochre | puce;viridian | |
everyday-v5-jewelry | earring;pendant;brooch;anklet;cufflink;charm;bangle | locket;tiara | torque;chatelaine | |
everyday-v5-hairstyles | bob;pixie cut;mohawk;buzz cut;crew cut;afro;dreadlocks;shaved head | fishtail braid;cornrows | victory rolls;chignon | |
everyday-v5-school-subjects | history;geography;art;music;physical education;biology;chemistry;physics;French | sociology;psychology | epistemology;linguistics | |
everyday-v5-volume-units | quart;pint;cup;tablespoon;teaspoon;fluid ounce | cubic meter;cubic centimeter | gill;minim | |
everyday-v5-mass-units | ounce;milligram;tonne;stone | carat;grain | Planck mass;troy pound | |
everyday-v5-time-units | day;week;month;year;decade;century;millennium | microsecond;fortnight | sennight;Olympiad | |
everyday-v5-track-field | 800 meters;1500 meters;5000 meters;10000 meters;marathon;long jump;high jump;triple jump;shot put;discus | pole vault;steeplechase | distance medley relay;50km race walk | |
everyday-v5-fitness-exercises | plank;pull up;lunge;burpee;jumping jack;deadlift;bench press;running;walking;swimming | kettlebell swing;snatch | turkish get up;Jefferson curl | |
everyday-v5-swimming | butterfly;sidestroke;dog paddle | sculling;eggbeater kick | trudgen;combat sidestroke | corkscrew stroke |
everyday-v5-outdoor-activities | swimming;fishing;skiing;snowboarding;kayaking;canoeing;surfing;rock climbing | geocaching;orienteering | coasteering;canyoning | |
everyday-v5-camping-gear | flashlight;camp stove;water bottle;sleeping mat;lantern;compass;first aid kit;tarp;headlamp;water filter;hiking boots;toilet paper;towel | bivvy bag;camp chair | bear canister;guyline | |
everyday-v5-bicycle-parts | handlebar;saddle;brake;tire;frame;fork;light;reflector | derailleur;crankset | jockey wheel;bottom bracket | |
everyday-v5-car-parts | door;steering wheel;windshield;brake;seat;headlight;bumper;hood;trunk;license plate | alternator;transmission | solenoid;differential | |
everyday-v5-boat-types | yacht;ferry;rowboat;speedboat;fishing boat;tugboat;barge;raft | catamaran;dinghy | dhow;coracle | |
everyday-v5-sports-gear | helmet;goal;net;glove;skate;ski;skis;snowboard;golf club;hockey stick | shuttlecock;pommel horse | bobsled;vaulting pole | |
everyday-v5-plumbing | drain;sink;toilet;elbow;tee;washer;gasket | trap;coupling | escutcheon;air admittance valve | |
everyday-v5-building-materials | steel;glass;stone;cement;sand;gravel;plaster;drywall;plywood | aggregate;rebar | cob;rammed earth | |
everyday-v5-emotions | fear;surprise;disgust;joy;love;anxiety;excitement;pride;shame | nostalgia;envy | schadenfreude;ennui | |
everyday-v5-professions | engineer;lawyer;chef;farmer;police officer;firefighter;artist;accountant;architect | actuary;surveyor | farrier;fletcher | |
everyday-v5-paper-crafts | scrapbooking;paper cutting;card making;paper folding;paper weaving | quilling;bookbinding | scherenschnitte;wycinanki | |
everyday-v5-home-lighting | chandelier;pendant light;wall sconce;ceiling light;spotlight;floodlight;fairy lights;ring light | track lighting;recessed light | mercury vapor lamp;metal halide lamp | |
play-nature-farm-animals | horse;sheep;goat;duck;goose;turkey;donkey;rabbit;dog | alpaca;llama | silkworm;emu | |
play-nature-pets | rabbit;hamster;guinea pig;parrot;budgie;turtle;snake;lizard;mouse | ferret;chinchilla | axolotl;sugar glider | |
play-nature-flying-animals | bee;fly;mosquito;wasp;moth;eagle;owl;pigeon;parrot | dragonfly;hummingbird | lacewing;damselfly | |
play-nature-plant-eaters | sheep;goat;deer;elephant;giraffe;zebra;panda;koala | manatee;tapir | dugong;wombat | |
play-nature-food-animals | fish;turkey;duck;goose;sheep;goat;rabbit;salmon;tuna | bison;deer | guinea fowl;ostrich | |
play-nature-vegetables | onion;tomato;lettuce;cucumber;pea;corn;pepper;cabbage;spinach | bok choy;artichoke | salsify;kohlrabi | |
play-nature-body-parts | arm;eye;ear;nose;mouth;foot;finger;toe;knee;heart;brain | pelvis;knuckle | uvula;diaphragm | |
play-nature-animals-b | butterfly;bat;beaver;buffalo;bison;badger;baboon;beetle;boa | barracuda;beluga | bushbaby;bandicoot | bluebuck |
play-nature-animals-c | crocodile;cobra;crow;camel;crab;canary;cheetah;chimpanzee;coyote | capybara;caracal | coelacanth;caecilian | Coelophysis |
play-nature-food-crops | potato;tomato;carrot;apple;banana;orange;lettuce;onion;garlic | sesame;flax | taro;breadfruit | |
play-nature-four-legged-animals | cow;goat;sheep;pig;lion;tiger;elephant;giraffe;zebra | salamander;platypus | echidna;tapir | |
play-nature-african-animals | zebra;hippopotamus;rhinoceros;cheetah;leopard;gorilla;chimpanzee;crocodile;ostrich | meerkat;hyena | duiker;eland | pangolin |
play-culture-superheroes | Wonder Woman;Iron Man;Thor;Hulk;Captain America;Black Panther;Aquaman;Flash | Zatanna;Moon Knight | Squirrel Girl;Booster Gold | Firestorm |
play-culture-cartoon-animals | Garfield;Snoopy;Donald Duck;Daffy Duck;Tom;Jerry;Winnie the Pooh;Bluey;Peppa Pig | Perry the Platypus;Foghorn Leghorn | Gromit;Stuart Little | |
play-culture-hobbies | gaming;gardening;cooking;baking;photography;knitting;sewing;fishing;hiking | geocaching;juggling | lockpicking;bookbinding | |
play-culture-screen-free-games | hide and seek;tag;charades;Pictionary;Scrabble;checkers;marbles;hopscotch | cribbage;canasta | crokinole;carrom | |
play-culture-sports-without-balls | boxing;wrestling;judo;karate;gymnastics;skateboarding;skiing;snowboarding | curling;fencing | skeleton;biathlon | |
play-culture-childrens-songs | Baa Baa Black Sheep;Row Row Row Your Boat;Old MacDonald Had a Farm;The Wheels on the Bus;London Bridge Is Falling Down;Itsy Bitsy Spider | Hey Diddle Diddle;Hickory Dickory Dock | Oranges and Lemons;A Tisket a Tasket | |
play-culture-crafts | crochet;sewing;pottery;origami;woodworking;embroidery;quilting | printmaking;bookbinding | tatting;needlepoint | |
play-culture-holidays | Thanksgiving;New Year’s Day;Valentine’s Day;Lunar New Year;Diwali;Hanukkah;Ramadan | Mid Autumn Festival;Dragon Boat Festival | Chuseok;Obon | |
play-culture-music-groups | duet;trio;quartet;rock band;jazz band;pop group;boy band;girl group;marching band | string quartet;brass quintet | gamelan ensemble;nonet | |
play-culture-playground-games | four square;dodgeball;kickball;tetherball;capture the flag;freeze tag;duck duck goose | cat’s cradle;red rover | blind man’s buff;steal the bacon | |
play-culture-toys | action figure;toy car;train set;building blocks;Lego;yo-yo;spinning top;kite;jump rope | kaleidoscope;Slinky | diabolo;Jacob’s ladder | |
play-culture-puzzles | sudoku;Rubik’s Cube;maze;riddle;logic puzzle | cryptic crossword;nonogram | kakuro;disentanglement puzzle | |
play-world-countries | France;Germany;Italy;Spain;China;Japan;India;Australia;Brazil;Mexico | Nepal;Uruguay | Comoros;Kiribati | Nauru |
play-world-cities | Tokyo;Toronto;Vancouver;Montreal;Ottawa;Calgary;Edmonton;Quebec City;Victoria;Rome;Berlin;Sydney | Reykjavik;Kyoto | Thimphu;Timbuktu | |
play-world-languages | Mandarin;Arabic;Hindi;Portuguese;Russian;Japanese;German;Italian;Korean | Swahili;Welsh | Amharic;Basque | Manx;Gitxsan |
play-world-landmarks | Taj Mahal;Big Ben;Sydney Opera House;CN Tower;Golden Gate Bridge;Colosseum;Pyramids of Giza | Petra;Uluru | Salar de Uyuni;Geysir | |
play-world-town-places | shop;restaurant;park;museum;library;bank;church;mosque;temple;cinema;supermarket | observatory;marina | planetarium;concert hall | |
play-world-travel-packing | passport;suitcase;charger;ticket;wallet;money;camera;sunscreen;shoes;socks;shampoo | travel adapter;earplugs | luggage tag;contact lenses | |
play-world-travel-stays | campsite;tent;cabin;caravan;RV;bed and breakfast;guesthouse;inn;resort | yurt;houseboat | ryokan;riad | pension |
play-world-commuting | train;bicycle;subway;tram;scooter;motorcycle;taxi;rideshare;carpool;school bus | cable car;monorail | funicular;trolleybus | |
play-world-airport-objects | gate;passport;suitcase;baggage carousel;boarding pass;pilot;flight attendant;restaurant;cafe;restroom | windsock;hangar | beacon;taxiway | |
play-world-day-out | zoo;aquarium;theme park;cinema;theatre;shopping mall;swimming pool;lake;river | observatory;vineyard | arboretum;sculpture park | |
play-world-countries-s | South Africa;South Korea;Singapore;Saudi Arabia;Sri Lanka;Syria;Sudan | Slovakia;Slovenia | Suriname;Solomon Islands | Sao Tome and Principe |
play-world-coastal-countries | France;Australia;Italy;Spain;Brazil;Mexico;Japan;China;India | Croatia;Uruguay | Eritrea;Comoros | Nauru |
play-everyday-cold-drinks | apple juice;lemonade;soda;iced tea;iced coffee;beer;wine;cocktail;smoothie;milkshake;iced latte;iced mocha;chocolate milk;sparkling water | kombucha;lassi | ayran;falooda | |
play-everyday-living-room | coffee table;lamp;rug;bookcase;shelf;cushion;remote control;clock;picture;mirror;plant | ottoman;recliner | mantelpiece;record player | |
play-everyday-pocket-objects | coin;banknote;card;ticket;receipt;tissue;lip balm;pen;earbuds;hair tie;keyring | pocket watch;flash drive | locket;measuring tape | |
play-everyday-wheeled-things | truck;train;motorcycle;shopping cart;stroller;wheelchair;skateboard;roller skates;suitcase | wheelbarrow;forklift | rolling ladder;hand truck | |
play-everyday-chores | sweeping;mopping;laundry;ironing;cooking;grocery shopping;taking out the trash;making the bed;recycling | composting;cleaning gutters | sweeping the chimney;defrosting the freezer | |
play-everyday-first-aid-items | medical tape;scissors;tweezers;antiseptic wipe;gloves;thermometer;ice pack;painkiller | triangular bandage;burn gel | rescue breathing mask;wound closure strip | |
play-everyday-keeping-warm | jacket;sweater;scarf;gloves;hat;fireplace;radiator;hot water bottle;quilt;socks;boots | thermal underwear;hand warmer | neck warmer;heated seat | |
play-everyday-battery-handhelds | camera;electric toothbrush;electric shaver;calculator;game controller;smartwatch;earbuds | walkie talkie;voice recorder | pulse oximeter;electric milk frother | |
play-everyday-sports-venues | field;pitch;court;running track;ice rink;boxing ring;golf course | velodrome;dojo | fencing piste;luge track | |
play-everyday-sandwich-fillings | turkey;tuna;egg;peanut butter;jam;lettuce;tomato;bacon;salami;cucumber;mayonnaise;mustard;butter;cream cheese;avocado | hummus;pastrami | mortadella;watercress | |
play-everyday-finger-foods | taco;chips;French fries;chicken wing;chicken drumstick;ribs;wrap;burrito;cookie;doughnut;popcorn;hot dog | samosa;falafel | arepa;scotch egg | |
play-everyday-home-safety | carbon monoxide alarm;first aid kit;deadbolt;burglar alarm;security camera;fire blanket;child gate;window lock | socket cover;door viewer | escape ladder;gas detector | |
`.trim().split('\n').map((row) => row.split('|').map((part) => part.trim()));

const names = (text = '') => text.split(';').map((name) => name.trim()).filter(Boolean);
export const SCORE_REVIEW = Object.fromEntries(rows.map(([id, familiar, uncommon, rare, deep, exceptional]) => [id, {
  common: PLAYABLE_ANCHORS[id],
  familiar: names(familiar),
  uncommon: names(uncommon),
  rare: names(rare),
  deep: names(deep),
  exceptional: names(exceptional),
}]));

// Accessible broad prompts with reviewed low-score entry points and editorial rarity scores.
export const GENERAL_QUESTIONS = [
  {
    "id": "play-nature-farm-animals",
    "category": "nature",
    "prompt": "Name an animal commonly kept on farms.",
    "answers": [
      {
        "name": "cow",
        "score": 12,
        "aliases": [
          "cattle"
        ]
      },
      {
        "name": "pig",
        "score": 15
      },
      {
        "name": "chicken",
        "score": 18,
        "aliases": [
          "hen",
          "rooster"
        ]
      },
      {
        "name": "horse",
        "score": 21
      },
      {
        "name": "sheep",
        "score": 25
      },
      {
        "name": "goat",
        "score": 28
      },
      {
        "name": "duck",
        "score": 31
      },
      {
        "name": "goose",
        "score": 34
      },
      {
        "name": "turkey",
        "score": 37
      },
      {
        "name": "donkey",
        "score": 40
      },
      {
        "name": "rabbit",
        "score": 43
      },
      {
        "name": "dog",
        "score": 47
      },
      {
        "name": "cat",
        "score": 50
      },
      {
        "name": "pony",
        "score": 53
      },
      {
        "name": "ox",
        "score": 56
      },
      {
        "name": "mule",
        "score": 59
      },
      {
        "name": "buffalo",
        "score": 62
      },
      {
        "name": "alpaca",
        "score": 65
      },
      {
        "name": "llama",
        "score": 69
      },
      {
        "name": "bee",
        "score": 72,
        "aliases": [
          "honeybee",
          "honey bee"
        ]
      },
      {
        "name": "quail",
        "score": 75
      },
      {
        "name": "guinea fowl",
        "score": 78
      },
      {
        "name": "yak",
        "score": 81
      },
      {
        "name": "bison",
        "score": 84
      },
      {
        "name": "ostrich",
        "score": 87
      },
      {
        "name": "emu",
        "score": 91
      },
      {
        "name": "deer",
        "score": 94
      },
      {
        "name": "silkworm",
        "score": 97
      },
      {
        "name": "peafowl",
        "score": 100,
        "aliases": [
          "peacock"
        ]
      }
    ],
    "rejectedInputs": [
      "lion",
      "dolphin"
    ]
  },
  {
    "id": "play-nature-pets",
    "category": "nature",
    "prompt": "Name an animal people keep as a pet.",
    "answers": [
      {
        "name": "dog",
        "score": 12
      },
      {
        "name": "cat",
        "score": 13
      },
      {
        "name": "goldfish",
        "score": 13
      },
      {
        "name": "rabbit",
        "score": 14
      },
      {
        "name": "hamster",
        "score": 14
      },
      {
        "name": "guinea pig",
        "score": 15
      },
      {
        "name": "parrot",
        "score": 16
      },
      {
        "name": "budgie",
        "score": 16,
        "aliases": [
          "budgerigar"
        ]
      },
      {
        "name": "turtle",
        "score": 17
      },
      {
        "name": "snake",
        "score": 17
      },
      {
        "name": "lizard",
        "score": 18
      },
      {
        "name": "mouse",
        "score": 19
      },
      {
        "name": "rat",
        "score": 19
      },
      {
        "name": "gerbil",
        "score": 20
      },
      {
        "name": "ferret",
        "score": 20
      },
      {
        "name": "canary",
        "score": 21
      },
      {
        "name": "cockatiel",
        "score": 22
      },
      {
        "name": "betta",
        "score": 22,
        "aliases": [
          "Siamese fighting fish"
        ]
      },
      {
        "name": "gecko",
        "score": 23
      },
      {
        "name": "chinchilla",
        "score": 23
      },
      {
        "name": "hedgehog",
        "score": 24
      },
      {
        "name": "cockatoo",
        "score": 24
      },
      {
        "name": "lovebird",
        "score": 25
      },
      {
        "name": "axolotl",
        "score": 26
      },
      {
        "name": "tarantula",
        "score": 26
      },
      {
        "name": "stick insect",
        "score": 27
      },
      {
        "name": "hermit crab",
        "score": 27
      },
      {
        "name": "degu",
        "score": 28
      },
      {
        "name": "finch",
        "score": 29
      },
      {
        "name": "bearded dragon",
        "score": 29
      },
      {
        "name": "golden retriever",
        "score": 30
      },
      {
        "name": "labrador retriever",
        "score": 30,
        "aliases": [
          "labrador",
          "lab"
        ]
      },
      {
        "name": "german shepherd",
        "score": 31
      },
      {
        "name": "poodle",
        "score": 32
      },
      {
        "name": "bulldog",
        "score": 32,
        "aliases": [
          "English bulldog"
        ]
      },
      {
        "name": "chihuahua",
        "score": 33
      },
      {
        "name": "beagle",
        "score": 33
      },
      {
        "name": "husky",
        "score": 34,
        "aliases": [
          "siberian husky"
        ]
      },
      {
        "name": "dachshund",
        "score": 35,
        "aliases": [
          "sausage dog"
        ]
      },
      {
        "name": "pug",
        "score": 35
      },
      {
        "name": "dalmatian",
        "score": 36
      },
      {
        "name": "rottweiler",
        "score": 36
      },
      {
        "name": "boxer",
        "score": 37
      },
      {
        "name": "border collie",
        "score": 38
      },
      {
        "name": "collie",
        "score": 38
      },
      {
        "name": "great dane",
        "score": 39
      },
      {
        "name": "doberman",
        "score": 39,
        "aliases": [
          "dobermann"
        ]
      },
      {
        "name": "shih tzu",
        "score": 40
      },
      {
        "name": "corgi",
        "score": 41,
        "aliases": [
          "welsh corgi"
        ]
      },
      {
        "name": "pomeranian",
        "score": 41
      },
      {
        "name": "yorkshire terrier",
        "score": 42,
        "aliases": [
          "yorkie"
        ]
      },
      {
        "name": "maltese",
        "score": 42
      },
      {
        "name": "boston terrier",
        "score": 43
      },
      {
        "name": "french bulldog",
        "score": 44,
        "aliases": [
          "frenchie"
        ]
      },
      {
        "name": "cocker spaniel",
        "score": 44
      },
      {
        "name": "springer spaniel",
        "score": 45
      },
      {
        "name": "basset hound",
        "score": 45
      },
      {
        "name": "bloodhound",
        "score": 46
      },
      {
        "name": "greyhound",
        "score": 46
      },
      {
        "name": "whippet",
        "score": 47
      },
      {
        "name": "saint bernard",
        "score": 48,
        "aliases": [
          "st bernard"
        ]
      },
      {
        "name": "newfoundland",
        "score": 48
      },
      {
        "name": "bernese mountain dog",
        "score": 49
      },
      {
        "name": "australian shepherd",
        "score": 49
      },
      {
        "name": "australian cattle dog",
        "score": 50,
        "aliases": [
          "blue heeler"
        ]
      },
      {
        "name": "jack russell terrier",
        "score": 51,
        "aliases": [
          "jack russell"
        ]
      },
      {
        "name": "bull terrier",
        "score": 51
      },
      {
        "name": "staffordshire bull terrier",
        "score": 52,
        "aliases": [
          "staffie"
        ]
      },
      {
        "name": "akita",
        "score": 52
      },
      {
        "name": "shiba inu",
        "score": 53
      },
      {
        "name": "chow chow",
        "score": 54
      },
      {
        "name": "samoyed",
        "score": 54
      },
      {
        "name": "alaskan malamute",
        "score": 55,
        "aliases": [
          "malamute"
        ]
      },
      {
        "name": "bichon frise",
        "score": 55
      },
      {
        "name": "papillon",
        "score": 56
      },
      {
        "name": "havanese",
        "score": 57
      },
      {
        "name": "basenji",
        "score": 57
      },
      {
        "name": "borzoi",
        "score": 58
      },
      {
        "name": "saluki",
        "score": 58
      },
      {
        "name": "afghan hound",
        "score": 59
      },
      {
        "name": "irish wolfhound",
        "score": 60
      },
      {
        "name": "scottish deerhound",
        "score": 60
      },
      {
        "name": "weimaraner",
        "score": 61
      },
      {
        "name": "vizsla",
        "score": 61
      },
      {
        "name": "rhodesian ridgeback",
        "score": 62
      },
      {
        "name": "belgian malinois",
        "score": 63,
        "aliases": [
          "malinois"
        ]
      },
      {
        "name": "portuguese water dog",
        "score": 63
      },
      {
        "name": "lagotto romagnolo",
        "score": 64
      },
      {
        "name": "xoloitzcuintli",
        "score": 64,
        "aliases": [
          "mexican hairless dog"
        ]
      },
      {
        "name": "Leonberger",
        "score": 65
      },
      {
        "name": "Shar Pei",
        "score": 66
      },
      {
        "name": "Cane Corso",
        "score": 66
      },
      {
        "name": "Cavalier King Charles Spaniel",
        "score": 67
      },
      {
        "name": "West Highland White Terrier",
        "score": 67,
        "aliases": [
          "Westie"
        ]
      },
      {
        "name": "German shorthaired pointer",
        "score": 68
      },
      {
        "name": "Irish setter",
        "score": 68
      },
      {
        "name": "English setter",
        "score": 69
      },
      {
        "name": "Lhasa Apso",
        "score": 70
      },
      {
        "name": "King Charles Spaniel",
        "score": 70
      },
      {
        "name": "siamese",
        "score": 71
      },
      {
        "name": "persian",
        "score": 71
      },
      {
        "name": "maine coon",
        "score": 72
      },
      {
        "name": "ragdoll",
        "score": 73
      },
      {
        "name": "bengal",
        "score": 73
      },
      {
        "name": "sphynx",
        "score": 74
      },
      {
        "name": "british shorthair",
        "score": 74
      },
      {
        "name": "scottish fold",
        "score": 75
      },
      {
        "name": "russian blue",
        "score": 76
      },
      {
        "name": "abyssinian",
        "score": 76
      },
      {
        "name": "birman",
        "score": 77
      },
      {
        "name": "burmese",
        "score": 77
      },
      {
        "name": "american shorthair",
        "score": 78
      },
      {
        "name": "exotic shorthair",
        "score": 79
      },
      {
        "name": "norwegian forest cat",
        "score": 79
      },
      {
        "name": "siberian",
        "score": 80
      },
      {
        "name": "oriental shorthair",
        "score": 80
      },
      {
        "name": "devon rex",
        "score": 81
      },
      {
        "name": "cornish rex",
        "score": 82
      },
      {
        "name": "manx",
        "score": 82
      },
      {
        "name": "balinese",
        "score": 83
      },
      {
        "name": "himalayan",
        "score": 83
      },
      {
        "name": "turkish angora",
        "score": 84
      },
      {
        "name": "turkish van",
        "score": 85
      },
      {
        "name": "egyptian mau",
        "score": 85
      },
      {
        "name": "somali",
        "score": 86
      },
      {
        "name": "tonkinese",
        "score": 86
      },
      {
        "name": "ocicat",
        "score": 87
      },
      {
        "name": "savannah",
        "score": 88
      },
      {
        "name": "british longhair",
        "score": 88
      },
      {
        "name": "american curl",
        "score": 89
      },
      {
        "name": "selkirk rex",
        "score": 89
      },
      {
        "name": "laperm",
        "score": 90,
        "aliases": [
          "la perm"
        ]
      },
      {
        "name": "chartreux",
        "score": 90
      },
      {
        "name": "korat",
        "score": 91
      },
      {
        "name": "singapura",
        "score": 92
      },
      {
        "name": "bombay",
        "score": 92
      },
      {
        "name": "japanese bobtail",
        "score": 93
      },
      {
        "name": "american bobtail",
        "score": 93
      },
      {
        "name": "ragamuffin",
        "score": 94
      },
      {
        "name": "toyger",
        "score": 95
      },
      {
        "name": "burmilla",
        "score": 95
      },
      {
        "name": "snowshoe",
        "score": 96
      },
      {
        "name": "peterbald",
        "score": 96
      },
      {
        "name": "chausie",
        "score": 97
      },
      {
        "name": "nebelung",
        "score": 98
      },
      {
        "name": "sokoke",
        "score": 98
      },
      {
        "name": "havana brown",
        "score": 99
      },
      {
        "name": "Lykoi",
        "score": 99
      },
      {
        "name": "Munchkin",
        "score": 100
      },
      {
        "name": "American pit bull terrier",
        "score": 26,
        "aliases": [
          "pit bull",
          "pitbull",
          "pit bull terrier",
          "american pitbull terrier"
        ]
      }
    ],
    "rejectedInputs": [
      "houseplant",
      "teddy bear"
    ]
  },
  {
    "id": "play-nature-flying-animals",
    "category": "nature",
    "prompt": "Name an animal that can fly under its own power.",
    "answers": [
      {
        "name": "bird",
        "score": 12
      },
      {
        "name": "bat",
        "score": 15
      },
      {
        "name": "butterfly",
        "score": 18
      },
      {
        "name": "bee",
        "score": 21
      },
      {
        "name": "fly",
        "score": 24
      },
      {
        "name": "mosquito",
        "score": 27
      },
      {
        "name": "wasp",
        "score": 30
      },
      {
        "name": "moth",
        "score": 33
      },
      {
        "name": "eagle",
        "score": 35
      },
      {
        "name": "owl",
        "score": 38
      },
      {
        "name": "pigeon",
        "score": 41
      },
      {
        "name": "parrot",
        "score": 44
      },
      {
        "name": "duck",
        "score": 47
      },
      {
        "name": "goose",
        "score": 50
      },
      {
        "name": "dragonfly",
        "score": 53
      },
      {
        "name": "ladybug",
        "score": 56,
        "aliases": [
          "ladybird"
        ]
      },
      {
        "name": "hummingbird",
        "score": 59
      },
      {
        "name": "hawk",
        "score": 62
      },
      {
        "name": "falcon",
        "score": 65
      },
      {
        "name": "seagull",
        "score": 68,
        "aliases": [
          "gull"
        ]
      },
      {
        "name": "beetle",
        "score": 71
      },
      {
        "name": "firefly",
        "score": 74,
        "aliases": [
          "lightning bug"
        ]
      },
      {
        "name": "termite",
        "score": 77
      },
      {
        "name": "flying ant",
        "score": 79
      },
      {
        "name": "locust",
        "score": 82
      },
      {
        "name": "cicada",
        "score": 85
      },
      {
        "name": "lacewing",
        "score": 88
      },
      {
        "name": "damselfly",
        "score": 91
      },
      {
        "name": "gnat",
        "score": 94
      },
      {
        "name": "hornet",
        "score": 97
      },
      {
        "name": "bumblebee",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "penguin",
      "flying squirrel"
    ]
  },
  {
    "id": "play-nature-plant-eaters",
    "category": "nature",
    "prompt": "Name an animal known for eating mainly plants.",
    "answers": [
      {
        "name": "cow",
        "score": 12
      },
      {
        "name": "horse",
        "score": 15
      },
      {
        "name": "rabbit",
        "score": 18
      },
      {
        "name": "sheep",
        "score": 20
      },
      {
        "name": "goat",
        "score": 23
      },
      {
        "name": "deer",
        "score": 26
      },
      {
        "name": "elephant",
        "score": 29
      },
      {
        "name": "giraffe",
        "score": 31
      },
      {
        "name": "zebra",
        "score": 34
      },
      {
        "name": "panda",
        "score": 37,
        "aliases": [
          "giant panda"
        ]
      },
      {
        "name": "koala",
        "score": 40
      },
      {
        "name": "buffalo",
        "score": 42
      },
      {
        "name": "bison",
        "score": 45
      },
      {
        "name": "llama",
        "score": 48
      },
      {
        "name": "alpaca",
        "score": 51
      },
      {
        "name": "camel",
        "score": 53
      },
      {
        "name": "rhinoceros",
        "score": 56,
        "aliases": [
          "rhino"
        ]
      },
      {
        "name": "hippopotamus",
        "score": 59,
        "aliases": [
          "hippo"
        ]
      },
      {
        "name": "manatee",
        "score": 62
      },
      {
        "name": "tortoise",
        "score": 64
      },
      {
        "name": "iguana",
        "score": 67
      },
      {
        "name": "caterpillar",
        "score": 70
      },
      {
        "name": "grasshopper",
        "score": 73
      },
      {
        "name": "beaver",
        "score": 75
      },
      {
        "name": "capybara",
        "score": 78
      },
      {
        "name": "sloth",
        "score": 81
      },
      {
        "name": "elk",
        "score": 84
      },
      {
        "name": "moose",
        "score": 86
      },
      {
        "name": "wombat",
        "score": 89
      },
      {
        "name": "dugong",
        "score": 92
      },
      {
        "name": "tapir",
        "score": 95
      },
      {
        "name": "gazelle",
        "score": 97
      },
      {
        "name": "antelope",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "lion",
      "shark"
    ]
  },
  {
    "id": "play-nature-food-animals",
    "category": "nature",
    "prompt": "Name an animal eaten as food by people.",
    "answers": [
      {
        "name": "chicken",
        "score": 12
      },
      {
        "name": "cow",
        "score": 15,
        "aliases": [
          "cattle"
        ]
      },
      {
        "name": "pig",
        "score": 17
      },
      {
        "name": "fish",
        "score": 20
      },
      {
        "name": "turkey",
        "score": 22
      },
      {
        "name": "duck",
        "score": 25
      },
      {
        "name": "goose",
        "score": 28
      },
      {
        "name": "sheep",
        "score": 30
      },
      {
        "name": "goat",
        "score": 33
      },
      {
        "name": "rabbit",
        "score": 35
      },
      {
        "name": "salmon",
        "score": 38
      },
      {
        "name": "tuna",
        "score": 40
      },
      {
        "name": "trout",
        "score": 43
      },
      {
        "name": "cod",
        "score": 46
      },
      {
        "name": "sardine",
        "score": 48
      },
      {
        "name": "shrimp",
        "score": 51,
        "aliases": [
          "prawn"
        ]
      },
      {
        "name": "crab",
        "score": 53
      },
      {
        "name": "lobster",
        "score": 56
      },
      {
        "name": "clam",
        "score": 59
      },
      {
        "name": "mussel",
        "score": 61
      },
      {
        "name": "oyster",
        "score": 64
      },
      {
        "name": "scallop",
        "score": 66
      },
      {
        "name": "squid",
        "score": 69
      },
      {
        "name": "octopus",
        "score": 72
      },
      {
        "name": "anchovy",
        "score": 74
      },
      {
        "name": "eel",
        "score": 77
      },
      {
        "name": "snail",
        "score": 79
      },
      {
        "name": "quail",
        "score": 82
      },
      {
        "name": "pheasant",
        "score": 84
      },
      {
        "name": "guinea fowl",
        "score": 87
      },
      {
        "name": "deer",
        "score": 90
      },
      {
        "name": "bison",
        "score": 92
      },
      {
        "name": "ostrich",
        "score": 95
      },
      {
        "name": "kangaroo",
        "score": 97
      },
      {
        "name": "crayfish",
        "score": 100,
        "aliases": [
          "crawfish"
        ]
      }
    ],
    "rejectedInputs": [
      "carrot",
      "bread"
    ]
  },
  {
    "id": "play-nature-vegetables",
    "category": "nature",
    "prompt": "Name a food commonly used as a vegetable in cooking.",
    "answers": [
      {
        "name": "carrot",
        "score": 12
      },
      {
        "name": "potato",
        "score": 14
      },
      {
        "name": "broccoli",
        "score": 17
      },
      {
        "name": "onion",
        "score": 19
      },
      {
        "name": "tomato",
        "score": 22
      },
      {
        "name": "lettuce",
        "score": 24
      },
      {
        "name": "cucumber",
        "score": 26
      },
      {
        "name": "pea",
        "score": 29
      },
      {
        "name": "corn",
        "score": 31,
        "aliases": [
          "maize"
        ]
      },
      {
        "name": "pepper",
        "score": 33,
        "aliases": [
          "bell pepper"
        ]
      },
      {
        "name": "cabbage",
        "score": 36
      },
      {
        "name": "spinach",
        "score": 38
      },
      {
        "name": "cauliflower",
        "score": 41
      },
      {
        "name": "celery",
        "score": 43
      },
      {
        "name": "garlic",
        "score": 45
      },
      {
        "name": "zucchini",
        "score": 48,
        "aliases": [
          "courgette"
        ]
      },
      {
        "name": "pumpkin",
        "score": 50
      },
      {
        "name": "radish",
        "score": 52
      },
      {
        "name": "beetroot",
        "score": 55,
        "aliases": [
          "beet"
        ]
      },
      {
        "name": "asparagus",
        "score": 57
      },
      {
        "name": "eggplant",
        "score": 60,
        "aliases": [
          "aubergine"
        ]
      },
      {
        "name": "turnip",
        "score": 62
      },
      {
        "name": "parsnip",
        "score": 64
      },
      {
        "name": "kale",
        "score": 67
      },
      {
        "name": "artichoke",
        "score": 69
      },
      {
        "name": "okra",
        "score": 71
      },
      {
        "name": "leek",
        "score": 74
      },
      {
        "name": "sweet potato",
        "score": 76
      },
      {
        "name": "brussels sprout",
        "score": 79
      },
      {
        "name": "chard",
        "score": 81,
        "aliases": [
          "Swiss chard"
        ]
      },
      {
        "name": "green bean",
        "score": 83
      },
      {
        "name": "fennel",
        "score": 86
      },
      {
        "name": "bok choy",
        "score": 88,
        "aliases": [
          "pak choi"
        ]
      },
      {
        "name": "rutabaga",
        "score": 90,
        "aliases": [
          "swede"
        ]
      },
      {
        "name": "kohlrabi",
        "score": 93
      },
      {
        "name": "watercress",
        "score": 95
      },
      {
        "name": "endive",
        "score": 98
      },
      {
        "name": "salsify",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "chocolate",
      "beef"
    ]
  },
  {
    "id": "play-nature-body-parts",
    "category": "nature",
    "prompt": "Name a part of the human body.",
    "answers": [
      {
        "name": "head",
        "score": 12
      },
      {
        "name": "hand",
        "score": 13
      },
      {
        "name": "leg",
        "score": 14
      },
      {
        "name": "arm",
        "score": 15
      },
      {
        "name": "eye",
        "score": 16
      },
      {
        "name": "ear",
        "score": 17
      },
      {
        "name": "nose",
        "score": 18
      },
      {
        "name": "mouth",
        "score": 19
      },
      {
        "name": "foot",
        "score": 20
      },
      {
        "name": "finger",
        "score": 21
      },
      {
        "name": "toe",
        "score": 22
      },
      {
        "name": "knee",
        "score": 23
      },
      {
        "name": "elbow",
        "score": 24
      },
      {
        "name": "shoulder",
        "score": 25
      },
      {
        "name": "neck",
        "score": 26
      },
      {
        "name": "back",
        "score": 28
      },
      {
        "name": "chest",
        "score": 29
      },
      {
        "name": "stomach",
        "score": 30,
        "aliases": []
      },
      {
        "name": "heart",
        "score": 31,
        "aliases": []
      },
      {
        "name": "brain",
        "score": 32,
        "aliases": []
      },
      {
        "name": "tongue",
        "score": 33
      },
      {
        "name": "tooth",
        "score": 34,
        "aliases": [
          "teeth"
        ]
      },
      {
        "name": "hip",
        "score": 35
      },
      {
        "name": "wrist",
        "score": 36
      },
      {
        "name": "ankle",
        "score": 37
      },
      {
        "name": "chin",
        "score": 38
      },
      {
        "name": "cheek",
        "score": 39
      },
      {
        "name": "forehead",
        "score": 40
      },
      {
        "name": "thumb",
        "score": 41
      },
      {
        "name": "heel",
        "score": 42
      },
      {
        "name": "navel",
        "score": 43,
        "aliases": [
          "belly button"
        ]
      },
      {
        "name": "eyelash",
        "score": 44
      },
      {
        "name": "eyebrow",
        "score": 45
      },
      {
        "name": "palm",
        "score": 46
      },
      {
        "name": "shin",
        "score": 47
      },
      {
        "name": "calf",
        "score": 48
      },
      {
        "name": "thigh",
        "score": 49
      },
      {
        "name": "lung",
        "score": 50,
        "aliases": []
      },
      {
        "name": "kidney",
        "score": 51,
        "aliases": []
      },
      {
        "name": "liver",
        "score": 52,
        "aliases": []
      },
      {
        "name": "rib",
        "score": 53,
        "aliases": []
      },
      {
        "name": "spine",
        "score": 54,
        "aliases": [
          "backbone"
        ]
      },
      {
        "name": "tendon",
        "score": 55
      },
      {
        "name": "ligament",
        "score": 57
      },
      {
        "name": "spleen",
        "score": 58,
        "aliases": []
      },
      {
        "name": "pancreas",
        "score": 59,
        "aliases": []
      },
      {
        "name": "scapula",
        "score": 60,
        "aliases": [
          "shoulder blade"
        ]
      },
      {
        "name": "patella",
        "score": 61,
        "aliases": [
          "kneecap"
        ]
      },
      {
        "name": "femur",
        "score": 62
      },
      {
        "name": "frontal bone",
        "score": 63
      },
      {
        "name": "tibia",
        "score": 64
      },
      {
        "name": "fibula",
        "score": 65
      },
      {
        "name": "humerus",
        "score": 66
      },
      {
        "name": "radius",
        "score": 67
      },
      {
        "name": "ulna",
        "score": 68
      },
      {
        "name": "clavicle",
        "score": 69,
        "aliases": [
          "collarbone"
        ]
      },
      {
        "name": "sternum",
        "score": 70,
        "aliases": [
          "breastbone"
        ]
      },
      {
        "name": "mandible",
        "score": 71
      },
      {
        "name": "maxilla",
        "score": 72
      },
      {
        "name": "sacrum",
        "score": 73
      },
      {
        "name": "coccyx",
        "score": 74,
        "aliases": [
          "tailbone"
        ]
      },
      {
        "name": "calcaneus",
        "score": 75
      },
      {
        "name": "talus",
        "score": 76
      },
      {
        "name": "scaphoid",
        "score": 77
      },
      {
        "name": "trapezium",
        "score": 78
      },
      {
        "name": "pisiform",
        "score": 79
      },
      {
        "name": "vomer",
        "score": 80
      },
      {
        "name": "hyoid",
        "score": 81
      },
      {
        "name": "malleus",
        "score": 82
      },
      {
        "name": "incus",
        "score": 83
      },
      {
        "name": "stapes",
        "score": 84
      },
      {
        "name": "skin",
        "score": 86
      },
      {
        "name": "bladder",
        "score": 87
      },
      {
        "name": "small intestine",
        "score": 88
      },
      {
        "name": "large intestine",
        "score": 89,
        "aliases": [
          "colon"
        ]
      },
      {
        "name": "gallbladder",
        "score": 90
      },
      {
        "name": "thyroid",
        "score": 91
      },
      {
        "name": "thymus",
        "score": 92
      },
      {
        "name": "pituitary gland",
        "score": 93
      },
      {
        "name": "adrenal gland",
        "score": 94
      },
      {
        "name": "pineal gland",
        "score": 95
      },
      {
        "name": "uterus",
        "score": 96
      },
      {
        "name": "ovary",
        "score": 97
      },
      {
        "name": "testis",
        "score": 98
      },
      {
        "name": "esophagus",
        "score": 99,
        "aliases": [
          "oesophagus"
        ]
      },
      {
        "name": "Intestine",
        "score": 100
      },
      {
        "name": "hair",
        "score": 12
      },
      {
        "name": "fingernail",
        "score": 18
      },
      {
        "name": "toenail",
        "score": 20
      },
      {
        "name": "skull",
        "score": 20
      },
      {
        "name": "muscle",
        "score": 16
      },
      {
        "name": "nostril",
        "score": 24
      },
      {
        "name": "earlobe",
        "score": 26
      },
      {
        "name": "knuckle",
        "score": 25
      },
      {
        "name": "gum",
        "score": 24
      },
      {
        "name": "rib cage",
        "score": 20,
        "aliases": [
          "ribcage"
        ]
      },
      {
        "name": "pelvis",
        "score": 25
      }
    ],
    "rejectedInputs": [
      "shirt",
      "tail"
    ]
  },
  {
    "id": "play-nature-animals-b",
    "category": "nature",
    "prompt": "Name an animal whose common English name starts with B.",
    "answers": [
      {
        "name": "bear",
        "score": 12,
        "aliases": []
      },
      {
        "name": "bird",
        "score": 13
      },
      {
        "name": "bee",
        "score": 14,
        "aliases": []
      },
      {
        "name": "butterfly",
        "score": 14,
        "aliases": []
      },
      {
        "name": "bat",
        "score": 15,
        "aliases": []
      },
      {
        "name": "beaver",
        "score": 16,
        "aliases": []
      },
      {
        "name": "buffalo",
        "score": 17,
        "aliases": []
      },
      {
        "name": "bison",
        "score": 17,
        "aliases": []
      },
      {
        "name": "badger",
        "score": 18,
        "aliases": []
      },
      {
        "name": "baboon",
        "score": 19,
        "aliases": []
      },
      {
        "name": "beetle",
        "score": 20,
        "aliases": []
      },
      {
        "name": "boa",
        "score": 20,
        "aliases": [
          "boa constrictor"
        ]
      },
      {
        "name": "boar",
        "score": 21
      },
      {
        "name": "bobcat",
        "score": 22,
        "aliases": []
      },
      {
        "name": "bonobo",
        "score": 23,
        "aliases": []
      },
      {
        "name": "barracuda",
        "score": 23,
        "aliases": []
      },
      {
        "name": "bass",
        "score": 24,
        "aliases": []
      },
      {
        "name": "blackbird",
        "score": 25,
        "aliases": []
      },
      {
        "name": "bluebird",
        "score": 26
      },
      {
        "name": "blue jay",
        "score": 26,
        "aliases": []
      },
      {
        "name": "blue whale",
        "score": 27,
        "aliases": []
      },
      {
        "name": "blowfish",
        "score": 28
      },
      {
        "name": "boxer",
        "score": 29,
        "aliases": []
      },
      {
        "name": "bulldog",
        "score": 29,
        "aliases": []
      },
      {
        "name": "bumblebee",
        "score": 30,
        "aliases": []
      },
      {
        "name": "buzzard",
        "score": 31,
        "aliases": []
      },
      {
        "name": "bedbug",
        "score": 32,
        "aliases": [
          "bed bug"
        ]
      },
      {
        "name": "binturong",
        "score": 32,
        "aliases": []
      },
      {
        "name": "bandicoot",
        "score": 33,
        "aliases": []
      },
      {
        "name": "basilisk",
        "score": 34,
        "aliases": []
      },
      {
        "name": "bongo",
        "score": 35
      },
      {
        "name": "bustard",
        "score": 36
      },
      {
        "name": "Beluga",
        "score": 36,
        "aliases": [
          "beluga"
        ]
      },
      {
        "name": "Bald eagle",
        "score": 37,
        "aliases": [
          "bald eagle"
        ]
      },
      {
        "name": "Barn owl",
        "score": 38,
        "aliases": [
          "barn owl"
        ]
      },
      {
        "name": "Budgerigar",
        "score": 39,
        "aliases": [
          "Budgie"
        ]
      },
      {
        "name": "betta",
        "score": 39,
        "aliases": []
      },
      {
        "name": "blenny",
        "score": 40,
        "aliases": []
      },
      {
        "name": "Bluefin tuna",
        "score": 41
      },
      {
        "name": "Brook trout",
        "score": 42
      },
      {
        "name": "bearded dragon",
        "score": 42,
        "aliases": []
      },
      {
        "name": "box turtle",
        "score": 43,
        "aliases": []
      },
      {
        "name": "ball python",
        "score": 44,
        "aliases": []
      },
      {
        "name": "black mamba",
        "score": 45,
        "aliases": []
      },
      {
        "name": "backswimmer",
        "score": 45
      },
      {
        "name": "beagle",
        "score": 46
      },
      {
        "name": "border collie",
        "score": 47
      },
      {
        "name": "boston terrier",
        "score": 48
      },
      {
        "name": "basset hound",
        "score": 48
      },
      {
        "name": "bloodhound",
        "score": 49
      },
      {
        "name": "bernese mountain dog",
        "score": 50
      },
      {
        "name": "blue heeler",
        "score": 51
      },
      {
        "name": "bull terrier",
        "score": 51
      },
      {
        "name": "bichon frise",
        "score": 52
      },
      {
        "name": "basenji",
        "score": 53
      },
      {
        "name": "borzoi",
        "score": 54
      },
      {
        "name": "belgian malinois",
        "score": 54
      },
      {
        "name": "bengal",
        "score": 55
      },
      {
        "name": "british shorthair",
        "score": 56
      },
      {
        "name": "birman",
        "score": 57
      },
      {
        "name": "burmese",
        "score": 58
      },
      {
        "name": "balinese",
        "score": 58
      },
      {
        "name": "british longhair",
        "score": 59
      },
      {
        "name": "bombay",
        "score": 60
      },
      {
        "name": "burmilla",
        "score": 61
      },
      {
        "name": "bowhead whale",
        "score": 61
      },
      {
        "name": "Bottlenose dolphin",
        "score": 62
      },
      {
        "name": "bull shark",
        "score": 63,
        "aliases": [
          "bull"
        ]
      },
      {
        "name": "basking shark",
        "score": 64,
        "aliases": [
          "basking"
        ]
      },
      {
        "name": "blue shark",
        "score": 64,
        "aliases": [
          "blue"
        ]
      },
      {
        "name": "Blacktip reef shark",
        "score": 65
      },
      {
        "name": "Bullhead shark",
        "score": 66
      },
      {
        "name": "bluegill",
        "score": 67
      },
      {
        "name": "burbot",
        "score": 67
      },
      {
        "name": "butterflyfish",
        "score": 68
      },
      {
        "name": "blue tang",
        "score": 69
      },
      {
        "name": "barnacle",
        "score": 70
      },
      {
        "name": "blue crab",
        "score": 70
      },
      {
        "name": "box jellyfish",
        "score": 71,
        "aliases": []
      },
      {
        "name": "brain coral",
        "score": 72
      },
      {
        "name": "brittle star",
        "score": 73
      },
      {
        "name": "basket star",
        "score": 73
      },
      {
        "name": "bullfrog",
        "score": 74
      },
      {
        "name": "boomslang",
        "score": 75
      },
      {
        "name": "Brahminy blind snake",
        "score": 76
      },
      {
        "name": "Banded sea krait",
        "score": 76
      },
      {
        "name": "blue tongued skink",
        "score": 77
      },
      {
        "name": "black caiman",
        "score": 78
      },
      {
        "name": "broad snouted caiman",
        "score": 79
      },
      {
        "name": "bilby",
        "score": 80
      },
      {
        "name": "bettong",
        "score": 80
      },
      {
        "name": "brushtail possum",
        "score": 81
      },
      {
        "name": "black footed cat",
        "score": 82
      },
      {
        "name": "black backed jackal",
        "score": 83
      },
      {
        "name": "bush dog",
        "score": 83
      },
      {
        "name": "bat eared fox",
        "score": 84
      },
      {
        "name": "brown bear",
        "score": 85
      },
      {
        "name": "black bear",
        "score": 86
      },
      {
        "name": "booby",
        "score": 86
      },
      {
        "name": "black swan",
        "score": 87
      },
      {
        "name": "bufflehead",
        "score": 88
      },
      {
        "name": "bunting",
        "score": 89
      },
      {
        "name": "blue morpho",
        "score": 89,
        "aliases": [
          "blue morpho butterfly"
        ]
      },
      {
        "name": "birdwing",
        "score": 90,
        "aliases": [
          "birdwing butterfly"
        ]
      },
      {
        "name": "blister beetle",
        "score": 91
      },
      {
        "name": "bombardier beetle",
        "score": 92
      },
      {
        "name": "burying beetle",
        "score": 92
      },
      {
        "name": "black widow",
        "score": 93,
        "aliases": []
      },
      {
        "name": "brown recluse",
        "score": 94
      },
      {
        "name": "bullet ant",
        "score": 95
      },
      {
        "name": "black garden ant",
        "score": 95
      },
      {
        "name": "bushbaby",
        "score": 96
      },
      {
        "name": "blue ringed octopus",
        "score": 97
      },
      {
        "name": "bluebuck",
        "score": 98
      },
      {
        "name": "Bali tiger",
        "score": 98
      },
      {
        "name": "Brachiosaurus",
        "score": 99
      },
      {
        "name": "Brontosaurus",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "cat",
      "elephant"
    ]
  },
  {
    "id": "play-nature-animals-c",
    "category": "nature",
    "prompt": "Name an animal whose common English name starts with C.",
    "answers": [
      {
        "name": "cat",
        "score": 12,
        "aliases": []
      },
      {
        "name": "cow",
        "score": 13,
        "aliases": [
          "cattle",
          "Cattle"
        ]
      },
      {
        "name": "chicken",
        "score": 14,
        "aliases": []
      },
      {
        "name": "crocodile",
        "score": 15,
        "aliases": [
          "Crocodile"
        ]
      },
      {
        "name": "cobra",
        "score": 16,
        "aliases": []
      },
      {
        "name": "crow",
        "score": 16,
        "aliases": []
      },
      {
        "name": "camel",
        "score": 17,
        "aliases": []
      },
      {
        "name": "crab",
        "score": 18,
        "aliases": []
      },
      {
        "name": "canary",
        "score": 19,
        "aliases": []
      },
      {
        "name": "cheetah",
        "score": 20,
        "aliases": []
      },
      {
        "name": "chimpanzee",
        "score": 21,
        "aliases": [
          "chimp"
        ]
      },
      {
        "name": "coyote",
        "score": 22,
        "aliases": []
      },
      {
        "name": "caterpillar",
        "score": 23
      },
      {
        "name": "chameleon",
        "score": 24,
        "aliases": []
      },
      {
        "name": "cockroach",
        "score": 25,
        "aliases": []
      },
      {
        "name": "cricket",
        "score": 25,
        "aliases": []
      },
      {
        "name": "clownfish",
        "score": 26,
        "aliases": []
      },
      {
        "name": "cod",
        "score": 27,
        "aliases": []
      },
      {
        "name": "carp",
        "score": 28,
        "aliases": []
      },
      {
        "name": "catfish",
        "score": 29,
        "aliases": []
      },
      {
        "name": "capybara",
        "score": 30,
        "aliases": []
      },
      {
        "name": "cougar",
        "score": 31,
        "aliases": []
      },
      {
        "name": "chinchilla",
        "score": 32,
        "aliases": [
          "Chinchilla"
        ]
      },
      {
        "name": "cockatoo",
        "score": 33,
        "aliases": []
      },
      {
        "name": "cormorant",
        "score": 34,
        "aliases": []
      },
      {
        "name": "crane",
        "score": 34,
        "aliases": []
      },
      {
        "name": "cuttlefish",
        "score": 35,
        "aliases": []
      },
      {
        "name": "clam",
        "score": 36,
        "aliases": []
      },
      {
        "name": "coral",
        "score": 37,
        "aliases": []
      },
      {
        "name": "centipede",
        "score": 38,
        "aliases": []
      },
      {
        "name": "cicada",
        "score": 39,
        "aliases": []
      },
      {
        "name": "caiman",
        "score": 40,
        "aliases": []
      },
      {
        "name": "cassowary",
        "score": 41,
        "aliases": []
      },
      {
        "name": "caracal",
        "score": 42,
        "aliases": []
      },
      {
        "name": "coelacanth",
        "score": 43,
        "aliases": []
      },
      {
        "name": "civet",
        "score": 43
      },
      {
        "name": "cardinal",
        "score": 44,
        "aliases": []
      },
      {
        "name": "Cockatiel",
        "score": 45
      },
      {
        "name": "Canada goose",
        "score": 46,
        "aliases": []
      },
      {
        "name": "Chickadee",
        "score": 47,
        "aliases": [
          "chickadee"
        ]
      },
      {
        "name": "Chinook salmon",
        "score": 48,
        "aliases": []
      },
      {
        "name": "Coho salmon",
        "score": 49,
        "aliases": []
      },
      {
        "name": "corn snake",
        "score": 50,
        "aliases": []
      },
      {
        "name": "coral snake",
        "score": 51,
        "aliases": []
      },
      {
        "name": "caddisfly",
        "score": 52
      },
      {
        "name": "chihuahua",
        "score": 52
      },
      {
        "name": "collie",
        "score": 53
      },
      {
        "name": "corgi",
        "score": 54
      },
      {
        "name": "cocker spaniel",
        "score": 55
      },
      {
        "name": "chow chow",
        "score": 56
      },
      {
        "name": "Cane Corso",
        "score": 57
      },
      {
        "name": "Cavalier King Charles Spaniel",
        "score": 58
      },
      {
        "name": "cornish rex",
        "score": 59
      },
      {
        "name": "chartreux",
        "score": 60
      },
      {
        "name": "chausie",
        "score": 60
      },
      {
        "name": "Common seal",
        "score": 61
      },
      {
        "name": "Common dolphin",
        "score": 62
      },
      {
        "name": "cookiecutter shark",
        "score": 63,
        "aliases": [
          "cookiecutter"
        ]
      },
      {
        "name": "crappie",
        "score": 64
      },
      {
        "name": "Cutthroat trout",
        "score": 65
      },
      {
        "name": "Chum salmon",
        "score": 66
      },
      {
        "name": "crayfish",
        "score": 67,
        "aliases": [
          "crawfish"
        ]
      },
      {
        "name": "copepod",
        "score": 68
      },
      {
        "name": "conch",
        "score": 69
      },
      {
        "name": "cockle",
        "score": 69
      },
      {
        "name": "chiton",
        "score": 70
      },
      {
        "name": "cowrie",
        "score": 71
      },
      {
        "name": "Christmas tree worm",
        "score": 72
      },
      {
        "name": "caecilian",
        "score": 73
      },
      {
        "name": "copperhead",
        "score": 74
      },
      {
        "name": "cottonmouth",
        "score": 75
      },
      {
        "name": "crested gecko",
        "score": 76
      },
      {
        "name": "collared lizard",
        "score": 77
      },
      {
        "name": "Chinese alligator",
        "score": 78
      },
      {
        "name": "Cuban crocodile",
        "score": 78
      },
      {
        "name": "Cuvier’s dwarf caiman",
        "score": 79
      },
      {
        "name": "cuscus",
        "score": 80
      },
      {
        "name": "chipmunk",
        "score": 81
      },
      {
        "name": "coypu",
        "score": 82
      },
      {
        "name": "capuchin",
        "score": 83
      },
      {
        "name": "Canada lynx",
        "score": 84
      },
      {
        "name": "clouded leopard",
        "score": 85
      },
      {
        "name": "crab eating fox",
        "score": 86
      },
      {
        "name": "caracara",
        "score": 87
      },
      {
        "name": "condor",
        "score": 87
      },
      {
        "name": "canvasback",
        "score": 88
      },
      {
        "name": "chinstrap penguin",
        "score": 89,
        "aliases": [
          "chinstrap"
        ]
      },
      {
        "name": "cabbage white",
        "score": 90,
        "aliases": [
          "cabbage white butterfly"
        ]
      },
      {
        "name": "common blue",
        "score": 91,
        "aliases": [
          "common blue butterfly"
        ]
      },
      {
        "name": "clouded yellow",
        "score": 92,
        "aliases": [
          "clouded yellow butterfly"
        ]
      },
      {
        "name": "comma butterfly",
        "score": 93
      },
      {
        "name": "click beetle",
        "score": 94
      },
      {
        "name": "camel spider",
        "score": 95
      },
      {
        "name": "carpenter ant",
        "score": 96
      },
      {
        "name": "Crazy ant",
        "score": 96
      },
      {
        "name": "cone snail",
        "score": 97
      },
      {
        "name": "Carolina parakeet",
        "score": 98
      },
      {
        "name": "Carnotaurus",
        "score": 99
      },
      {
        "name": "Coelophysis",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "dog",
      "owl"
    ]
  },
  {
    "id": "play-nature-food-crops",
    "category": "nature",
    "prompt": "Name a plant that people grow for food.",
    "answers": [
      {
        "name": "wheat",
        "score": 12
      },
      {
        "name": "rice",
        "score": 14
      },
      {
        "name": "corn",
        "score": 16,
        "aliases": [
          "maize"
        ]
      },
      {
        "name": "potato",
        "score": 18
      },
      {
        "name": "tomato",
        "score": 20
      },
      {
        "name": "carrot",
        "score": 22
      },
      {
        "name": "apple",
        "score": 24
      },
      {
        "name": "banana",
        "score": 26
      },
      {
        "name": "orange",
        "score": 28
      },
      {
        "name": "lettuce",
        "score": 30
      },
      {
        "name": "onion",
        "score": 32
      },
      {
        "name": "garlic",
        "score": 35
      },
      {
        "name": "pea",
        "score": 37
      },
      {
        "name": "bean",
        "score": 39
      },
      {
        "name": "cabbage",
        "score": 41
      },
      {
        "name": "oat",
        "score": 43,
        "aliases": [
          "oats"
        ]
      },
      {
        "name": "barley",
        "score": 45
      },
      {
        "name": "rye",
        "score": 47
      },
      {
        "name": "grape",
        "score": 49
      },
      {
        "name": "strawberry",
        "score": 51
      },
      {
        "name": "soybean",
        "score": 53,
        "aliases": [
          "soya bean"
        ]
      },
      {
        "name": "sugarcane",
        "score": 55,
        "aliases": [
          "sugar cane"
        ]
      },
      {
        "name": "sugar beet",
        "score": 57
      },
      {
        "name": "peanut",
        "score": 59
      },
      {
        "name": "sunflower",
        "score": 61
      },
      {
        "name": "olive",
        "score": 63
      },
      {
        "name": "almond",
        "score": 65
      },
      {
        "name": "coconut",
        "score": 67
      },
      {
        "name": "coffee",
        "score": 69
      },
      {
        "name": "tea",
        "score": 71
      },
      {
        "name": "cacao",
        "score": 73,
        "aliases": [
          "cocoa"
        ]
      },
      {
        "name": "cassava",
        "score": 75,
        "aliases": [
          "manioc"
        ]
      },
      {
        "name": "sorghum",
        "score": 77
      },
      {
        "name": "millet",
        "score": 80
      },
      {
        "name": "quinoa",
        "score": 82
      },
      {
        "name": "buckwheat",
        "score": 84
      },
      {
        "name": "chickpea",
        "score": 86
      },
      {
        "name": "lentil",
        "score": 88
      },
      {
        "name": "sesame",
        "score": 90
      },
      {
        "name": "rapeseed",
        "score": 92,
        "aliases": [
          "canola"
        ]
      },
      {
        "name": "flax",
        "score": 94
      },
      {
        "name": "taro",
        "score": 96
      },
      {
        "name": "yam",
        "score": 98
      },
      {
        "name": "breadfruit",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "granite",
      "whale"
    ]
  },
  {
    "id": "play-nature-four-legged-animals",
    "category": "nature",
    "prompt": "Name an animal that normally has four legs as an adult.",
    "answers": [
      {
        "name": "dog",
        "score": 12
      },
      {
        "name": "cat",
        "score": 14
      },
      {
        "name": "horse",
        "score": 16
      },
      {
        "name": "cow",
        "score": 18
      },
      {
        "name": "goat",
        "score": 21
      },
      {
        "name": "sheep",
        "score": 23
      },
      {
        "name": "pig",
        "score": 25
      },
      {
        "name": "lion",
        "score": 27
      },
      {
        "name": "tiger",
        "score": 29
      },
      {
        "name": "elephant",
        "score": 31
      },
      {
        "name": "giraffe",
        "score": 33
      },
      {
        "name": "zebra",
        "score": 36
      },
      {
        "name": "rhinoceros",
        "score": 38,
        "aliases": [
          "rhino"
        ]
      },
      {
        "name": "hippopotamus",
        "score": 40,
        "aliases": [
          "hippo"
        ]
      },
      {
        "name": "bear",
        "score": 42
      },
      {
        "name": "wolf",
        "score": 44
      },
      {
        "name": "fox",
        "score": 46
      },
      {
        "name": "rabbit",
        "score": 48
      },
      {
        "name": "mouse",
        "score": 51
      },
      {
        "name": "rat",
        "score": 53
      },
      {
        "name": "deer",
        "score": 55
      },
      {
        "name": "moose",
        "score": 57
      },
      {
        "name": "camel",
        "score": 59
      },
      {
        "name": "llama",
        "score": 61
      },
      {
        "name": "alpaca",
        "score": 64
      },
      {
        "name": "badger",
        "score": 66
      },
      {
        "name": "beaver",
        "score": 68
      },
      {
        "name": "skunk",
        "score": 70
      },
      {
        "name": "raccoon",
        "score": 72
      },
      {
        "name": "turtle",
        "score": 74
      },
      {
        "name": "tortoise",
        "score": 76
      },
      {
        "name": "crocodile",
        "score": 79
      },
      {
        "name": "alligator",
        "score": 81
      },
      {
        "name": "lizard",
        "score": 83
      },
      {
        "name": "frog",
        "score": 85
      },
      {
        "name": "toad",
        "score": 87
      },
      {
        "name": "salamander",
        "score": 89
      },
      {
        "name": "newt",
        "score": 91
      },
      {
        "name": "platypus",
        "score": 94
      },
      {
        "name": "echidna",
        "score": 96
      },
      {
        "name": "wombat",
        "score": 98
      },
      {
        "name": "tapir",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "spider",
      "chicken"
    ]
  },
  {
    "id": "play-nature-african-animals",
    "category": "nature",
    "prompt": "Name an animal that lives in the wild in Africa.",
    "answers": [
      {
        "name": "lion",
        "score": 12
      },
      {
        "name": "elephant",
        "score": 15
      },
      {
        "name": "giraffe",
        "score": 17
      },
      {
        "name": "zebra",
        "score": 20
      },
      {
        "name": "hippopotamus",
        "score": 22,
        "aliases": [
          "hippo"
        ]
      },
      {
        "name": "rhinoceros",
        "score": 25,
        "aliases": [
          "rhino"
        ]
      },
      {
        "name": "cheetah",
        "score": 27
      },
      {
        "name": "leopard",
        "score": 30
      },
      {
        "name": "gorilla",
        "score": 32
      },
      {
        "name": "chimpanzee",
        "score": 35,
        "aliases": [
          "chimp"
        ]
      },
      {
        "name": "crocodile",
        "score": 37
      },
      {
        "name": "ostrich",
        "score": 40
      },
      {
        "name": "hyena",
        "score": 42,
        "aliases": [
          "hyaena"
        ]
      },
      {
        "name": "meerkat",
        "score": 45
      },
      {
        "name": "gazelle",
        "score": 47
      },
      {
        "name": "wildebeest",
        "score": 50,
        "aliases": [
          "gnu"
        ]
      },
      {
        "name": "African buffalo",
        "score": 52,
        "aliases": [
          "Cape buffalo"
        ]
      },
      {
        "name": "warthog",
        "score": 55
      },
      {
        "name": "baboon",
        "score": 57
      },
      {
        "name": "mandrill",
        "score": 60
      },
      {
        "name": "okapi",
        "score": 62
      },
      {
        "name": "bongo",
        "score": 65
      },
      {
        "name": "aardvark",
        "score": 67
      },
      {
        "name": "fennec fox",
        "score": 70
      },
      {
        "name": "serval",
        "score": 72
      },
      {
        "name": "caracal",
        "score": 75
      },
      {
        "name": "shoebill",
        "score": 77
      },
      {
        "name": "Secretary bird",
        "score": 80
      },
      {
        "name": "African wild dog",
        "score": 82
      },
      {
        "name": "impala",
        "score": 85
      },
      {
        "name": "kudu",
        "score": 87
      },
      {
        "name": "springbok",
        "score": 90
      },
      {
        "name": "oryx",
        "score": 92
      },
      {
        "name": "eland",
        "score": 95
      },
      {
        "name": "duiker",
        "score": 97
      },
      {
        "name": "pangolin",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "polar bear",
      "kangaroo"
    ]
  },
  {
    "id": "play-culture-superheroes",
    "category": "culture",
    "prompt": "Name a superhero from comics, television, or films.",
    "answers": [
      {
        "name": "Superman",
        "score": 12,
        "aliases": [
          "Clark Kent",
          "Kal El"
        ]
      },
      {
        "name": "Batman",
        "score": 13,
        "aliases": [
          "Bruce Wayne"
        ]
      },
      {
        "name": "Spider-Man",
        "score": 15,
        "aliases": [
          "Spiderman",
          "Spider Man",
          "Peter Parker",
          "Miles Morales"
        ]
      },
      {
        "name": "Wonder Woman",
        "score": 16,
        "aliases": [
          "Diana Prince",
          "Diana"
        ]
      },
      {
        "name": "Iron Man",
        "score": 18,
        "aliases": [
          "Tony Stark"
        ]
      },
      {
        "name": "Thor",
        "score": 19,
        "aliases": [
          "Thor Odinson"
        ]
      },
      {
        "name": "Hulk",
        "score": 20,
        "aliases": [
          "Bruce Banner"
        ]
      },
      {
        "name": "Captain America",
        "score": 22,
        "aliases": [
          "Steve Rogers"
        ]
      },
      {
        "name": "Black Panther",
        "score": 23,
        "aliases": [
          "T’Challa"
        ]
      },
      {
        "name": "Aquaman",
        "score": 25,
        "aliases": [
          "Arthur Curry"
        ]
      },
      {
        "name": "Flash",
        "score": 26,
        "aliases": [
          "The Flash",
          "Barry Allen",
          "Wally West",
          "Jay Garrick"
        ]
      },
      {
        "name": "Green Lantern",
        "score": 27,
        "aliases": [
          "Hal Jordan",
          "John Stewart",
          "Kyle Rayner",
          "Guy Gardner"
        ]
      },
      {
        "name": "Wolverine",
        "score": 29,
        "aliases": [
          "Logan",
          "James Howlett"
        ]
      },
      {
        "name": "Deadpool",
        "score": 30,
        "aliases": [
          "Wade Wilson"
        ]
      },
      {
        "name": "Captain Marvel",
        "score": 32,
        "aliases": [
          "Carol Danvers"
        ]
      },
      {
        "name": "Black Widow",
        "score": 33,
        "aliases": [
          "Natasha Romanoff"
        ]
      },
      {
        "name": "Hawkeye",
        "score": 34,
        "aliases": [
          "Clint Barton",
          "Kate Bishop"
        ]
      },
      {
        "name": "Ant-Man",
        "score": 36,
        "aliases": [
          "Ant Man",
          "Scott Lang",
          "Hank Pym"
        ]
      },
      {
        "name": "Wasp",
        "score": 37,
        "aliases": [
          "The Wasp",
          "Hope van Dyne",
          "Janet van Dyne"
        ]
      },
      {
        "name": "Daredevil",
        "score": 39,
        "aliases": [
          "Matt Murdock"
        ]
      },
      {
        "name": "Doctor Strange",
        "score": 40,
        "aliases": [
          "Dr Strange",
          "Stephen Strange"
        ]
      },
      {
        "name": "Scarlet Witch",
        "score": 41,
        "aliases": [
          "Wanda Maximoff"
        ]
      },
      {
        "name": "Vision",
        "score": 43,
        "aliases": []
      },
      {
        "name": "Black Canary",
        "score": 44,
        "aliases": [
          "Dinah Lance"
        ]
      },
      {
        "name": "Hawkgirl",
        "score": 46,
        "aliases": [
          "Shayera Hol"
        ]
      },
      {
        "name": "Cyborg",
        "score": 47,
        "aliases": [
          "Victor Stone"
        ]
      },
      {
        "name": "Supergirl",
        "score": 48,
        "aliases": [
          "Kara Zor El",
          "Kara Danvers"
        ]
      },
      {
        "name": "Shazam",
        "score": 50,
        "aliases": [
          "Billy Batson"
        ]
      },
      {
        "name": "Spawn",
        "score": 51
      },
      {
        "name": "Invincible",
        "score": 53
      },
      {
        "name": "Ms Marvel",
        "score": 54,
        "aliases": [
          "Kamala Khan",
          "Miss Marvel"
        ]
      },
      {
        "name": "Moon Knight",
        "score": 55,
        "aliases": [
          "Marc Spector",
          "Steven Grant"
        ]
      },
      {
        "name": "Blue Beetle",
        "score": 57,
        "aliases": [
          "Jaime Reyes",
          "Ted Kord"
        ]
      },
      {
        "name": "Green Arrow",
        "score": 58,
        "aliases": [
          "Oliver Queen"
        ]
      },
      {
        "name": "Batgirl",
        "score": 59,
        "aliases": [
          "Barbara Gordon"
        ]
      },
      {
        "name": "Nightwing",
        "score": 61,
        "aliases": [
          "Dick Grayson"
        ]
      },
      {
        "name": "Silver Surfer",
        "score": 62
      },
      {
        "name": "Squirrel Girl",
        "score": 64,
        "aliases": [
          "Doreen Green"
        ]
      },
      {
        "name": "Falcon",
        "score": 65,
        "aliases": [
          "Sam Wilson"
        ]
      },
      {
        "name": "Luke Cage",
        "score": 66
      },
      {
        "name": "Jessica Jones",
        "score": 68
      },
      {
        "name": "Iron Fist",
        "score": 69,
        "aliases": [
          "Danny Rand"
        ]
      },
      {
        "name": "She Hulk",
        "score": 71,
        "aliases": [
          "Jennifer Walters"
        ]
      },
      {
        "name": "Storm",
        "score": 72,
        "aliases": [
          "Ororo Munroe"
        ]
      },
      {
        "name": "Cyclops",
        "score": 73,
        "aliases": [
          "Scott Summers"
        ]
      },
      {
        "name": "Jean Grey",
        "score": 75,
        "aliases": [
          "Phoenix"
        ]
      },
      {
        "name": "Nightcrawler",
        "score": 76,
        "aliases": [
          "Kurt Wagner"
        ]
      },
      {
        "name": "Gambit",
        "score": 78,
        "aliases": [
          "Remy LeBeau"
        ]
      },
      {
        "name": "Shang Chi",
        "score": 79
      },
      {
        "name": "Robin",
        "score": 80,
        "aliases": [
          "Damian Wayne",
          "Tim Drake"
        ]
      },
      {
        "name": "Martian Manhunter",
        "score": 82,
        "aliases": [
          "J’onn J’onzz"
        ]
      },
      {
        "name": "Zatanna",
        "score": 83,
        "aliases": [
          "Zatanna Zatara"
        ]
      },
      {
        "name": "Hawkman",
        "score": 85,
        "aliases": [
          "Carter Hall"
        ]
      },
      {
        "name": "Booster Gold",
        "score": 86,
        "aliases": [
          "Michael Jon Carter"
        ]
      },
      {
        "name": "Doctor Fate",
        "score": 87,
        "aliases": [
          "Kent Nelson",
          "Dr Fate"
        ]
      },
      {
        "name": "Red Tornado",
        "score": 89
      },
      {
        "name": "Plastic Man",
        "score": 90
      },
      {
        "name": "Atom",
        "score": 92,
        "aliases": [
          "Ray Palmer",
          "Ryan Choi"
        ]
      },
      {
        "name": "Vixen",
        "score": 93,
        "aliases": [
          "Mari McCabe"
        ]
      },
      {
        "name": "Static",
        "score": 94,
        "aliases": [
          "Virgil Hawkins",
          "Static Shock"
        ]
      },
      {
        "name": "Raven",
        "score": 96,
        "aliases": [
          "Rachel Roth"
        ]
      },
      {
        "name": "Starfire",
        "score": 97,
        "aliases": [
          "Koriand’r"
        ]
      },
      {
        "name": "Beast Boy",
        "score": 99,
        "aliases": [
          "Garfield Logan"
        ]
      },
      {
        "name": "Firestorm",
        "score": 100,
        "aliases": [
          "Ronnie Raymond",
          "Martin Stein"
        ]
      }
    ],
    "rejectedInputs": [
      "Joker",
      "Darth Vader"
    ]
  },
  {
    "id": "play-culture-cartoon-animals",
    "category": "culture",
    "prompt": "Name an animal character from a cartoon or animated film.",
    "answers": [
      {
        "name": "Mickey Mouse",
        "score": 12,
        "aliases": [
          "Mickey"
        ]
      },
      {
        "name": "Bugs Bunny",
        "score": 14,
        "aliases": [
          "Bugs"
        ]
      },
      {
        "name": "Scooby-Doo",
        "score": 17,
        "aliases": [
          "Scooby Doo",
          "Scooby"
        ]
      },
      {
        "name": "Garfield",
        "score": 19
      },
      {
        "name": "Snoopy",
        "score": 22
      },
      {
        "name": "Donald Duck",
        "score": 24,
        "aliases": [
          "Donald"
        ]
      },
      {
        "name": "Daffy Duck",
        "score": 27,
        "aliases": [
          "Daffy"
        ]
      },
      {
        "name": "Tom",
        "score": 29,
        "aliases": [
          "Tom Cat"
        ]
      },
      {
        "name": "Jerry",
        "score": 32,
        "aliases": [
          "Jerry Mouse"
        ]
      },
      {
        "name": "Winnie the Pooh",
        "score": 34,
        "aliases": [
          "Pooh"
        ]
      },
      {
        "name": "Piglet",
        "score": 36
      },
      {
        "name": "Tigger",
        "score": 39
      },
      {
        "name": "Eeyore",
        "score": 41
      },
      {
        "name": "Simba",
        "score": 44
      },
      {
        "name": "Nala",
        "score": 46
      },
      {
        "name": "Baloo",
        "score": 49
      },
      {
        "name": "Dumbo",
        "score": 51
      },
      {
        "name": "Bambi",
        "score": 54
      },
      {
        "name": "Thumper",
        "score": 56
      },
      {
        "name": "Droopy",
        "score": 58
      },
      {
        "name": "Yogi Bear",
        "score": 61,
        "aliases": [
          "Yogi"
        ]
      },
      {
        "name": "Boo Boo Bear",
        "score": 63,
        "aliases": [
          "Boo Boo"
        ]
      },
      {
        "name": "Woody Woodpecker",
        "score": 66
      },
      {
        "name": "Road Runner",
        "score": 68,
        "aliases": [
          "Roadrunner"
        ]
      },
      {
        "name": "Wile E Coyote",
        "score": 71
      },
      {
        "name": "Sylvester",
        "score": 73,
        "aliases": [
          "Sylvester the Cat"
        ]
      },
      {
        "name": "Tweety",
        "score": 76
      },
      {
        "name": "Speedy Gonzales",
        "score": 78
      },
      {
        "name": "Pink Panther",
        "score": 80,
        "aliases": [
          "The Pink Panther"
        ]
      },
      {
        "name": "Po",
        "score": 83
      },
      {
        "name": "Puss in Boots",
        "score": 85
      },
      {
        "name": "Bluey",
        "score": 88
      },
      {
        "name": "Bingo",
        "score": 90
      },
      {
        "name": "Peppa Pig",
        "score": 93,
        "aliases": [
          "Peppa"
        ]
      },
      {
        "name": "Porky Pig",
        "score": 95
      },
      {
        "name": "Foghorn Leghorn",
        "score": 98
      },
      {
        "name": "Perry the Platypus",
        "score": 100,
        "aliases": [
          "Perry"
        ]
      }
    ],
    "rejectedInputs": [
      "Harry Potter",
      "Elsa"
    ]
  },
  {
    "id": "play-culture-hobbies",
    "category": "culture",
    "prompt": "Name a hobby or leisure activity.",
    "answers": [
      {
        "name": "reading",
        "score": 12
      },
      {
        "name": "drawing",
        "score": 15
      },
      {
        "name": "painting",
        "score": 17
      },
      {
        "name": "gaming",
        "score": 20,
        "aliases": [
          "video gaming",
          "playing video games"
        ]
      },
      {
        "name": "gardening",
        "score": 22
      },
      {
        "name": "cooking",
        "score": 25
      },
      {
        "name": "baking",
        "score": 28
      },
      {
        "name": "photography",
        "score": 30
      },
      {
        "name": "knitting",
        "score": 33
      },
      {
        "name": "sewing",
        "score": 35
      },
      {
        "name": "fishing",
        "score": 38
      },
      {
        "name": "hiking",
        "score": 40
      },
      {
        "name": "camping",
        "score": 43
      },
      {
        "name": "cycling",
        "score": 46
      },
      {
        "name": "swimming",
        "score": 48
      },
      {
        "name": "dancing",
        "score": 51
      },
      {
        "name": "singing",
        "score": 53
      },
      {
        "name": "writing",
        "score": 56
      },
      {
        "name": "chess",
        "score": 59
      },
      {
        "name": "pottery",
        "score": 61
      },
      {
        "name": "woodworking",
        "score": 64
      },
      {
        "name": "birdwatching",
        "score": 66,
        "aliases": [
          "bird watching"
        ]
      },
      {
        "name": "stargazing",
        "score": 69
      },
      {
        "name": "collecting stamps",
        "score": 72,
        "aliases": [
          "stamp collecting"
        ]
      },
      {
        "name": "collecting coins",
        "score": 74,
        "aliases": [
          "coin collecting"
        ]
      },
      {
        "name": "scrapbooking",
        "score": 77
      },
      {
        "name": "calligraphy",
        "score": 79
      },
      {
        "name": "origami",
        "score": 82
      },
      {
        "name": "model building",
        "score": 84
      },
      {
        "name": "juggling",
        "score": 87
      },
      {
        "name": "geocaching",
        "score": 90
      },
      {
        "name": "metal detecting",
        "score": 92
      },
      {
        "name": "beekeeping",
        "score": 95
      },
      {
        "name": "lockpicking",
        "score": 97,
        "aliases": [
          "lock picking"
        ]
      },
      {
        "name": "bookbinding",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "tax return",
      "commuting"
    ]
  },
  {
    "id": "play-culture-screen-free-games",
    "category": "culture",
    "prompt": "Name a game that can be played without an electronic screen.",
    "answers": [
      {
        "name": "chess",
        "score": 12
      },
      {
        "name": "Monopoly",
        "score": 15
      },
      {
        "name": "poker",
        "score": 17
      },
      {
        "name": "hide and seek",
        "score": 20,
        "aliases": [
          "hide-and-seek"
        ]
      },
      {
        "name": "tag",
        "score": 22
      },
      {
        "name": "charades",
        "score": 25
      },
      {
        "name": "Pictionary",
        "score": 27
      },
      {
        "name": "Scrabble",
        "score": 30
      },
      {
        "name": "checkers",
        "score": 32,
        "aliases": [
          "draughts"
        ]
      },
      {
        "name": "Go",
        "score": 35
      },
      {
        "name": "marbles",
        "score": 37
      },
      {
        "name": "hopscotch",
        "score": 40
      },
      {
        "name": "jacks",
        "score": 42
      },
      {
        "name": "dominoes",
        "score": 45,
        "aliases": [
          "dominos"
        ]
      },
      {
        "name": "Uno",
        "score": 47
      },
      {
        "name": "blackjack",
        "score": 50,
        "aliases": [
          "twenty one"
        ]
      },
      {
        "name": "solitaire",
        "score": 52,
        "aliases": [
          "patience"
        ]
      },
      {
        "name": "rummy",
        "score": 55
      },
      {
        "name": "bridge",
        "score": 57
      },
      {
        "name": "backgammon",
        "score": 60
      },
      {
        "name": "mancala",
        "score": 62
      },
      {
        "name": "mahjong",
        "score": 65,
        "aliases": [
          "mah jong"
        ]
      },
      {
        "name": "Jenga",
        "score": 67
      },
      {
        "name": "Twister",
        "score": 70
      },
      {
        "name": "Connect Four",
        "score": 72,
        "aliases": [
          "Connect 4"
        ]
      },
      {
        "name": "Battleship",
        "score": 75
      },
      {
        "name": "Catan",
        "score": 77,
        "aliases": [
          "Settlers of Catan"
        ]
      },
      {
        "name": "Risk",
        "score": 80
      },
      {
        "name": "Clue",
        "score": 82,
        "aliases": [
          "Cluedo"
        ]
      },
      {
        "name": "Operation",
        "score": 85
      },
      {
        "name": "cribbage",
        "score": 87
      },
      {
        "name": "canasta",
        "score": 90
      },
      {
        "name": "bocce",
        "score": 92
      },
      {
        "name": "boules",
        "score": 95
      },
      {
        "name": "carrom",
        "score": 97
      },
      {
        "name": "crokinole",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "Minecraft",
      "Fortnite"
    ]
  },
  {
    "id": "play-culture-sports-without-balls",
    "category": "culture",
    "prompt": "Name a sport that does not use a ball.",
    "answers": [
      {
        "name": "swimming",
        "score": 12
      },
      {
        "name": "running",
        "score": 14
      },
      {
        "name": "cycling",
        "score": 17
      },
      {
        "name": "boxing",
        "score": 19
      },
      {
        "name": "wrestling",
        "score": 22
      },
      {
        "name": "judo",
        "score": 24
      },
      {
        "name": "karate",
        "score": 26
      },
      {
        "name": "taekwondo",
        "score": 29
      },
      {
        "name": "gymnastics",
        "score": 31
      },
      {
        "name": "skateboarding",
        "score": 33
      },
      {
        "name": "skiing",
        "score": 36
      },
      {
        "name": "snowboarding",
        "score": 38
      },
      {
        "name": "surfing",
        "score": 41
      },
      {
        "name": "rowing",
        "score": 43
      },
      {
        "name": "canoeing",
        "score": 45
      },
      {
        "name": "kayaking",
        "score": 48
      },
      {
        "name": "archery",
        "score": 50
      },
      {
        "name": "fencing",
        "score": 52
      },
      {
        "name": "weightlifting",
        "score": 55,
        "aliases": [
          "weight lifting"
        ]
      },
      {
        "name": "figure skating",
        "score": 57
      },
      {
        "name": "speed skating",
        "score": 60
      },
      {
        "name": "diving",
        "score": 62
      },
      {
        "name": "climbing",
        "score": 64,
        "aliases": [
          "sport climbing"
        ]
      },
      {
        "name": "bobsleigh",
        "score": 67,
        "aliases": [
          "bobsled"
        ]
      },
      {
        "name": "luge",
        "score": 69
      },
      {
        "name": "skeleton",
        "score": 71
      },
      {
        "name": "triathlon",
        "score": 74
      },
      {
        "name": "biathlon",
        "score": 76
      },
      {
        "name": "shooting",
        "score": 79
      },
      {
        "name": "equestrian",
        "score": 81,
        "aliases": [
          "horse riding"
        ]
      },
      {
        "name": "race walking",
        "score": 83,
        "aliases": [
          "racewalking"
        ]
      },
      {
        "name": "sailing",
        "score": 86
      },
      {
        "name": "badminton",
        "score": 88
      },
      {
        "name": "ice hockey",
        "score": 90
      },
      {
        "name": "curling",
        "score": 93
      },
      {
        "name": "discus",
        "score": 95
      },
      {
        "name": "javelin",
        "score": 98
      },
      {
        "name": "hammer throw",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "soccer",
      "basketball"
    ]
  },
  {
    "id": "play-culture-childrens-songs",
    "category": "culture",
    "prompt": "Name a nursery rhyme or traditional children’s song.",
    "answers": [
      {
        "name": "Twinkle Twinkle Little Star",
        "score": 12
      },
      {
        "name": "Mary Had a Little Lamb",
        "score": 15
      },
      {
        "name": "Humpty Dumpty",
        "score": 17
      },
      {
        "name": "Baa Baa Black Sheep",
        "score": 20
      },
      {
        "name": "Row Row Row Your Boat",
        "score": 22
      },
      {
        "name": "Old MacDonald Had a Farm",
        "score": 25,
        "aliases": [
          "Old MacDonald"
        ]
      },
      {
        "name": "The Wheels on the Bus",
        "score": 28,
        "aliases": [
          "Wheels on the Bus"
        ]
      },
      {
        "name": "London Bridge Is Falling Down",
        "score": 30,
        "aliases": [
          "London Bridge"
        ]
      },
      {
        "name": "Hickory Dickory Dock",
        "score": 33
      },
      {
        "name": "Jack and Jill",
        "score": 35
      },
      {
        "name": "Itsy Bitsy Spider",
        "score": 38,
        "aliases": [
          "Incy Wincy Spider"
        ]
      },
      {
        "name": "Hey Diddle Diddle",
        "score": 40
      },
      {
        "name": "Three Blind Mice",
        "score": 43
      },
      {
        "name": "Little Bo Peep",
        "score": 46
      },
      {
        "name": "Little Miss Muffet",
        "score": 48
      },
      {
        "name": "Ring a Ring o Roses",
        "score": 51,
        "aliases": [
          "Ring Around the Rosie"
        ]
      },
      {
        "name": "This Little Piggy",
        "score": 53
      },
      {
        "name": "Rock a Bye Baby",
        "score": 56,
        "aliases": [
          "Rock-a-bye Baby"
        ]
      },
      {
        "name": "Pat a Cake",
        "score": 59,
        "aliases": [
          "Pat-a-cake"
        ]
      },
      {
        "name": "Pop Goes the Weasel",
        "score": 61
      },
      {
        "name": "Five Little Ducks",
        "score": 64
      },
      {
        "name": "Five Little Monkeys",
        "score": 66
      },
      {
        "name": "Head Shoulders Knees and Toes",
        "score": 69
      },
      {
        "name": "If You’re Happy and You Know It",
        "score": 72
      },
      {
        "name": "Rain Rain Go Away",
        "score": 74
      },
      {
        "name": "Bingo",
        "score": 77
      },
      {
        "name": "The Muffin Man",
        "score": 79,
        "aliases": [
          "Do You Know the Muffin Man"
        ]
      },
      {
        "name": "Frere Jacques",
        "score": 82,
        "aliases": [
          "Frère Jacques"
        ]
      },
      {
        "name": "Hot Cross Buns",
        "score": 84
      },
      {
        "name": "Sing a Song of Sixpence",
        "score": 87
      },
      {
        "name": "Here We Go Round the Mulberry Bush",
        "score": 90
      },
      {
        "name": "Oranges and Lemons",
        "score": 92
      },
      {
        "name": "Polly Put the Kettle On",
        "score": 95
      },
      {
        "name": "Yankee Doodle",
        "score": 97
      },
      {
        "name": "A Tisket a Tasket",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "Bohemian Rhapsody",
      "Thriller"
    ]
  },
  {
    "id": "play-culture-crafts",
    "category": "culture",
    "prompt": "Name an art, craft, or making hobby.",
    "answers": [
      {
        "name": "drawing",
        "score": 12
      },
      {
        "name": "painting",
        "score": 15
      },
      {
        "name": "knitting",
        "score": 18
      },
      {
        "name": "crochet",
        "score": 20,
        "aliases": [
          "crocheting"
        ]
      },
      {
        "name": "sewing",
        "score": 23
      },
      {
        "name": "pottery",
        "score": 26
      },
      {
        "name": "origami",
        "score": 29
      },
      {
        "name": "woodworking",
        "score": 31
      },
      {
        "name": "embroidery",
        "score": 34
      },
      {
        "name": "quilting",
        "score": 37
      },
      {
        "name": "scrapbooking",
        "score": 40
      },
      {
        "name": "jewelry making",
        "score": 42,
        "aliases": [
          "jewellery making"
        ]
      },
      {
        "name": "weaving",
        "score": 45
      },
      {
        "name": "candle making",
        "score": 48
      },
      {
        "name": "soap making",
        "score": 51
      },
      {
        "name": "basket weaving",
        "score": 53,
        "aliases": [
          "basketry"
        ]
      },
      {
        "name": "leatherworking",
        "score": 56,
        "aliases": [
          "leatherwork"
        ]
      },
      {
        "name": "macrame",
        "score": 59,
        "aliases": [
          "macramé"
        ]
      },
      {
        "name": "calligraphy",
        "score": 62
      },
      {
        "name": "model building",
        "score": 64
      },
      {
        "name": "paper cutting",
        "score": 67,
        "aliases": [
          "papercutting"
        ]
      },
      {
        "name": "felting",
        "score": 70
      },
      {
        "name": "glassblowing",
        "score": 73,
        "aliases": [
          "glass blowing"
        ]
      },
      {
        "name": "mosaic",
        "score": 75
      },
      {
        "name": "tie dye",
        "score": 78,
        "aliases": [
          "tie-dye"
        ]
      },
      {
        "name": "whittling",
        "score": 81
      },
      {
        "name": "flower arranging",
        "score": 84
      },
      {
        "name": "bookbinding",
        "score": 86
      },
      {
        "name": "printmaking",
        "score": 89
      },
      {
        "name": "decoupage",
        "score": 92,
        "aliases": [
          "découpage"
        ]
      },
      {
        "name": "lino cutting",
        "score": 95,
        "aliases": [
          "linocut"
        ]
      },
      {
        "name": "needlepoint",
        "score": 97
      },
      {
        "name": "tatting",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "swimming",
      "spectating"
    ]
  },
  {
    "id": "play-culture-holidays",
    "category": "culture",
    "prompt": "Name an annual holiday, festival, or religious observance.",
    "answers": [
      {
        "name": "Christmas",
        "score": 12
      },
      {
        "name": "Easter",
        "score": 14
      },
      {
        "name": "Halloween",
        "score": 17
      },
      {
        "name": "Thanksgiving",
        "score": 19
      },
      {
        "name": "New Year’s Day",
        "score": 21,
        "aliases": [
          "New Year"
        ]
      },
      {
        "name": "Valentine’s Day",
        "score": 23
      },
      {
        "name": "Lunar New Year",
        "score": 26,
        "aliases": [
          "Chinese New Year"
        ]
      },
      {
        "name": "Diwali",
        "score": 28,
        "aliases": [
          "Deepavali"
        ]
      },
      {
        "name": "Hanukkah",
        "score": 30,
        "aliases": [
          "Chanukah"
        ]
      },
      {
        "name": "Ramadan",
        "score": 32
      },
      {
        "name": "Eid al Fitr",
        "score": 35,
        "aliases": [
          "Eid ul Fitr"
        ]
      },
      {
        "name": "Eid al Adha",
        "score": 37,
        "aliases": [
          "Eid ul Adha"
        ]
      },
      {
        "name": "Passover",
        "score": 39,
        "aliases": [
          "Pesach"
        ]
      },
      {
        "name": "Holi",
        "score": 41
      },
      {
        "name": "Vesak",
        "score": 44
      },
      {
        "name": "Nowruz",
        "score": 46,
        "aliases": [
          "Norooz"
        ]
      },
      {
        "name": "Rosh Hashanah",
        "score": 48
      },
      {
        "name": "Yom Kippur",
        "score": 50
      },
      {
        "name": "St Patrick’s Day",
        "score": 53,
        "aliases": [
          "Saint Patrick’s Day"
        ]
      },
      {
        "name": "Canada Day",
        "score": 55
      },
      {
        "name": "Independence Day",
        "score": 57,
        "aliases": [
          "Fourth of July",
          "4th of July"
        ]
      },
      {
        "name": "Bastille Day",
        "score": 59
      },
      {
        "name": "Labour Day",
        "score": 62,
        "aliases": [
          "Labor Day"
        ]
      },
      {
        "name": "Remembrance Day",
        "score": 64
      },
      {
        "name": "Veterans Day",
        "score": 66
      },
      {
        "name": "Memorial Day",
        "score": 68
      },
      {
        "name": "Lent",
        "score": 71
      },
      {
        "name": "Advent",
        "score": 73
      },
      {
        "name": "Epiphany",
        "score": 75
      },
      {
        "name": "Good Friday",
        "score": 77
      },
      {
        "name": "Pentecost",
        "score": 80
      },
      {
        "name": "Mardi Gras",
        "score": 82,
        "aliases": [
          "Shrove Tuesday"
        ]
      },
      {
        "name": "Carnival",
        "score": 84
      },
      {
        "name": "Dussehra",
        "score": 86,
        "aliases": [
          "Dasara"
        ]
      },
      {
        "name": "Raksha Bandhan",
        "score": 89
      },
      {
        "name": "Mid Autumn Festival",
        "score": 91,
        "aliases": [
          "Moon Festival"
        ]
      },
      {
        "name": "Dragon Boat Festival",
        "score": 93
      },
      {
        "name": "Chuseok",
        "score": 95
      },
      {
        "name": "Obon",
        "score": 98
      },
      {
        "name": "Songkran",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "birthday",
      "weekend"
    ]
  },
  {
    "id": "play-culture-music-groups",
    "category": "culture",
    "prompt": "Name a type of musical group or ensemble.",
    "answers": [
      {
        "name": "band",
        "score": 12
      },
      {
        "name": "choir",
        "score": 15
      },
      {
        "name": "orchestra",
        "score": 18
      },
      {
        "name": "duet",
        "score": 21,
        "aliases": [
          "duo"
        ]
      },
      {
        "name": "trio",
        "score": 24
      },
      {
        "name": "quartet",
        "score": 27
      },
      {
        "name": "rock band",
        "score": 30
      },
      {
        "name": "jazz band",
        "score": 33
      },
      {
        "name": "pop group",
        "score": 36
      },
      {
        "name": "boy band",
        "score": 39
      },
      {
        "name": "girl group",
        "score": 42
      },
      {
        "name": "marching band",
        "score": 45
      },
      {
        "name": "brass band",
        "score": 48
      },
      {
        "name": "big band",
        "score": 51
      },
      {
        "name": "string quartet",
        "score": 54
      },
      {
        "name": "symphony orchestra",
        "score": 58
      },
      {
        "name": "chamber orchestra",
        "score": 61
      },
      {
        "name": "concert band",
        "score": 64
      },
      {
        "name": "wind ensemble",
        "score": 67
      },
      {
        "name": "a cappella group",
        "score": 70,
        "aliases": [
          "acapella group"
        ]
      },
      {
        "name": "gospel choir",
        "score": 73
      },
      {
        "name": "barbershop quartet",
        "score": 76
      },
      {
        "name": "drumline",
        "score": 79,
        "aliases": [
          "drum line"
        ]
      },
      {
        "name": "pit orchestra",
        "score": 82
      },
      {
        "name": "quintet",
        "score": 85
      },
      {
        "name": "sextet",
        "score": 88
      },
      {
        "name": "septet",
        "score": 91
      },
      {
        "name": "octet",
        "score": 94
      },
      {
        "name": "nonet",
        "score": 97
      },
      {
        "name": "gamelan ensemble",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "guitar",
      "solo"
    ]
  },
  {
    "id": "play-culture-playground-games",
    "category": "culture",
    "prompt": "Name a playground or traditional children’s game.",
    "answers": [
      {
        "name": "hide and seek",
        "score": 12,
        "aliases": [
          "hide-and-seek"
        ]
      },
      {
        "name": "tag",
        "score": 15
      },
      {
        "name": "hopscotch",
        "score": 18
      },
      {
        "name": "four square",
        "score": 21,
        "aliases": [
          "foursquare"
        ]
      },
      {
        "name": "dodgeball",
        "score": 23
      },
      {
        "name": "kickball",
        "score": 26
      },
      {
        "name": "tetherball",
        "score": 29
      },
      {
        "name": "capture the flag",
        "score": 32
      },
      {
        "name": "red rover",
        "score": 35
      },
      {
        "name": "freeze tag",
        "score": 38
      },
      {
        "name": "flashlight tag",
        "score": 40
      },
      {
        "name": "duck duck goose",
        "score": 43
      },
      {
        "name": "Simon says",
        "score": 46
      },
      {
        "name": "red light green light",
        "score": 49
      },
      {
        "name": "leapfrog",
        "score": 52
      },
      {
        "name": "marbles",
        "score": 55
      },
      {
        "name": "jacks",
        "score": 57
      },
      {
        "name": "jump rope",
        "score": 60,
        "aliases": [
          "skipping rope",
          "skipping"
        ]
      },
      {
        "name": "double Dutch",
        "score": 63
      },
      {
        "name": "British bulldog",
        "score": 66
      },
      {
        "name": "cops and robbers",
        "score": 69
      },
      {
        "name": "kick the can",
        "score": 72
      },
      {
        "name": "statues",
        "score": 74
      },
      {
        "name": "stuck in the mud",
        "score": 77
      },
      {
        "name": "Mother May I",
        "score": 80
      },
      {
        "name": "What’s the Time Mr Wolf",
        "score": 83,
        "aliases": [
          "What Time Is It Mr Wolf"
        ]
      },
      {
        "name": "steal the bacon",
        "score": 86
      },
      {
        "name": "hot potato",
        "score": 89
      },
      {
        "name": "pat a cake",
        "score": 91,
        "aliases": [
          "pat-a-cake"
        ]
      },
      {
        "name": "thumb wrestling",
        "score": 94,
        "aliases": [
          "thumb war"
        ]
      },
      {
        "name": "cat’s cradle",
        "score": 97
      },
      {
        "name": "blind man’s buff",
        "score": 100,
        "aliases": [
          "blind man’s bluff"
        ]
      }
    ],
    "rejectedInputs": [
      "poker",
      "solitaire"
    ]
  },
  {
    "id": "play-culture-toys",
    "category": "culture",
    "prompt": "Name a type of toy or an object sold as a toy.",
    "answers": [
      {
        "name": "doll",
        "score": 12
      },
      {
        "name": "ball",
        "score": 15
      },
      {
        "name": "teddy bear",
        "score": 17
      },
      {
        "name": "action figure",
        "score": 20
      },
      {
        "name": "toy car",
        "score": 22
      },
      {
        "name": "train set",
        "score": 25,
        "aliases": [
          "toy train"
        ]
      },
      {
        "name": "building blocks",
        "score": 27,
        "aliases": [
          "blocks"
        ]
      },
      {
        "name": "Lego",
        "score": 30
      },
      {
        "name": "yo-yo",
        "score": 32,
        "aliases": [
          "yoyo"
        ]
      },
      {
        "name": "spinning top",
        "score": 35,
        "aliases": [
          "top"
        ]
      },
      {
        "name": "kite",
        "score": 37
      },
      {
        "name": "jump rope",
        "score": 40,
        "aliases": [
          "skipping rope"
        ]
      },
      {
        "name": "marbles",
        "score": 42
      },
      {
        "name": "jacks",
        "score": 45
      },
      {
        "name": "Slinky",
        "score": 47
      },
      {
        "name": "Rubik’s Cube",
        "score": 50,
        "aliases": [
          "rubiks cube"
        ]
      },
      {
        "name": "bubble wand",
        "score": 52
      },
      {
        "name": "play dough",
        "score": 55,
        "aliases": [
          "Play Doh",
          "playdough"
        ]
      },
      {
        "name": "dollhouse",
        "score": 57,
        "aliases": [
          "doll house"
        ]
      },
      {
        "name": "toy robot",
        "score": 60
      },
      {
        "name": "rocking horse",
        "score": 62
      },
      {
        "name": "jack in the box",
        "score": 65
      },
      {
        "name": "puppet",
        "score": 67
      },
      {
        "name": "finger puppet",
        "score": 70
      },
      {
        "name": "hand puppet",
        "score": 72
      },
      {
        "name": "water gun",
        "score": 75,
        "aliases": [
          "squirt gun"
        ]
      },
      {
        "name": "Nerf gun",
        "score": 77,
        "aliases": [
          "foam dart gun"
        ]
      },
      {
        "name": "frisbee",
        "score": 80,
        "aliases": [
          "flying disc"
        ]
      },
      {
        "name": "boomerang",
        "score": 82
      },
      {
        "name": "kaleidoscope",
        "score": 85
      },
      {
        "name": "rattle",
        "score": 87
      },
      {
        "name": "shape sorter",
        "score": 90
      },
      {
        "name": "pull toy",
        "score": 92
      },
      {
        "name": "wind up toy",
        "score": 95
      },
      {
        "name": "toy soldier",
        "score": 97
      },
      {
        "name": "toy kitchen",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "tax bill",
      "oven"
    ]
  },
  {
    "id": "play-culture-puzzles",
    "category": "culture",
    "prompt": "Name a type of puzzle.",
    "answers": [
      {
        "name": "crossword",
        "score": 12
      },
      {
        "name": "word search",
        "score": 15,
        "aliases": [
          "wordsearch"
        ]
      },
      {
        "name": "jigsaw",
        "score": 18,
        "aliases": [
          "jigsaw puzzle"
        ]
      },
      {
        "name": "sudoku",
        "score": 21
      },
      {
        "name": "Rubik’s Cube",
        "score": 24,
        "aliases": [
          "rubiks cube"
        ]
      },
      {
        "name": "maze",
        "score": 27
      },
      {
        "name": "riddle",
        "score": 30
      },
      {
        "name": "logic puzzle",
        "score": 33
      },
      {
        "name": "cryptic crossword",
        "score": 35
      },
      {
        "name": "kakuro",
        "score": 38
      },
      {
        "name": "nonogram",
        "score": 41,
        "aliases": [
          "picross"
        ]
      },
      {
        "name": "cryptogram",
        "score": 44
      },
      {
        "name": "rebus",
        "score": 47
      },
      {
        "name": "sliding puzzle",
        "score": 50
      },
      {
        "name": "tangram",
        "score": 53
      },
      {
        "name": "matchstick puzzle",
        "score": 56
      },
      {
        "name": "acrostic",
        "score": 59
      },
      {
        "name": "anagram",
        "score": 62
      },
      {
        "name": "number puzzle",
        "score": 65
      },
      {
        "name": "word ladder",
        "score": 68
      },
      {
        "name": "KenKen",
        "score": 71
      },
      {
        "name": "Hidato",
        "score": 74
      },
      {
        "name": "Nurikabe",
        "score": 77
      },
      {
        "name": "Slitherlink",
        "score": 79
      },
      {
        "name": "spot the difference",
        "score": 82
      },
      {
        "name": "disentanglement puzzle",
        "score": 85
      },
      {
        "name": "mechanical puzzle",
        "score": 88
      },
      {
        "name": "fill in crossword",
        "score": 91
      },
      {
        "name": "lateral thinking puzzle",
        "score": 94
      },
      {
        "name": "situation puzzle",
        "score": 97
      },
      {
        "name": "chess puzzle",
        "score": 100,
        "aliases": [
          "chess problem"
        ]
      }
    ],
    "rejectedInputs": [
      "tennis",
      "solitaire"
    ]
  },
  {
    "id": "play-world-countries",
    "category": "world",
    "prompt": "Name a country anywhere in the world.",
    "answers": [
      {
        "name": "Canada",
        "score": 12,
        "aliases": [
          "canada"
        ]
      },
      {
        "name": "United States",
        "score": 12,
        "aliases": [
          "USA",
          "US",
          "America",
          "united states",
          "usa",
          "us",
          "united states of america",
          "america"
        ]
      },
      {
        "name": "United Kingdom",
        "score": 13,
        "aliases": [
          "UK",
          "Britain",
          "united kingdom",
          "uk",
          "britain",
          "great britain"
        ]
      },
      {
        "name": "France",
        "score": 13,
        "aliases": [
          "france"
        ]
      },
      {
        "name": "Germany",
        "score": 14,
        "aliases": [
          "germany"
        ]
      },
      {
        "name": "Italy",
        "score": 14,
        "aliases": [
          "italy"
        ]
      },
      {
        "name": "Spain",
        "score": 15,
        "aliases": [
          "spain"
        ]
      },
      {
        "name": "China",
        "score": 15,
        "aliases": [
          "china"
        ]
      },
      {
        "name": "Japan",
        "score": 16,
        "aliases": [
          "japan"
        ]
      },
      {
        "name": "India",
        "score": 16,
        "aliases": [
          "india"
        ]
      },
      {
        "name": "Australia",
        "score": 16
      },
      {
        "name": "Brazil",
        "score": 17,
        "aliases": [
          "brazil"
        ]
      },
      {
        "name": "Mexico",
        "score": 17,
        "aliases": [
          "mexico"
        ]
      },
      {
        "name": "Russia",
        "score": 18,
        "aliases": [
          "russia"
        ]
      },
      {
        "name": "South Korea",
        "score": 18,
        "aliases": [
          "south korea",
          "korea",
          "republic of korea"
        ]
      },
      {
        "name": "North Korea",
        "score": 19,
        "aliases": [
          "north korea"
        ]
      },
      {
        "name": "New Zealand",
        "score": 19
      },
      {
        "name": "South Africa",
        "score": 20,
        "aliases": [
          "south africa"
        ]
      },
      {
        "name": "Egypt",
        "score": 20,
        "aliases": [
          "egypt"
        ]
      },
      {
        "name": "Kenya",
        "score": 21,
        "aliases": [
          "kenya"
        ]
      },
      {
        "name": "Nigeria",
        "score": 21,
        "aliases": [
          "nigeria"
        ]
      },
      {
        "name": "Morocco",
        "score": 21,
        "aliases": [
          "morocco"
        ]
      },
      {
        "name": "Algeria",
        "score": 22,
        "aliases": [
          "algeria"
        ]
      },
      {
        "name": "Tunisia",
        "score": 22,
        "aliases": [
          "tunisia"
        ]
      },
      {
        "name": "Ghana",
        "score": 23,
        "aliases": [
          "ghana"
        ]
      },
      {
        "name": "Ethiopia",
        "score": 23,
        "aliases": [
          "ethiopia"
        ]
      },
      {
        "name": "Tanzania",
        "score": 24,
        "aliases": [
          "tanzania"
        ]
      },
      {
        "name": "Uganda",
        "score": 24,
        "aliases": [
          "uganda"
        ]
      },
      {
        "name": "Senegal",
        "score": 25,
        "aliases": [
          "senegal"
        ]
      },
      {
        "name": "Argentina",
        "score": 25,
        "aliases": [
          "argentina"
        ]
      },
      {
        "name": "Chile",
        "score": 25,
        "aliases": [
          "chile"
        ]
      },
      {
        "name": "Peru",
        "score": 26,
        "aliases": [
          "peru"
        ]
      },
      {
        "name": "Colombia",
        "score": 26,
        "aliases": [
          "colombia"
        ]
      },
      {
        "name": "Venezuela",
        "score": 27,
        "aliases": [
          "venezuela"
        ]
      },
      {
        "name": "Ecuador",
        "score": 27,
        "aliases": [
          "ecuador"
        ]
      },
      {
        "name": "Uruguay",
        "score": 28,
        "aliases": [
          "uruguay"
        ]
      },
      {
        "name": "Paraguay",
        "score": 28,
        "aliases": [
          "paraguay"
        ]
      },
      {
        "name": "Bolivia",
        "score": 29,
        "aliases": [
          "bolivia"
        ]
      },
      {
        "name": "Costa Rica",
        "score": 29,
        "aliases": [
          "costa rica"
        ]
      },
      {
        "name": "Panama",
        "score": 30,
        "aliases": [
          "panama"
        ]
      },
      {
        "name": "Cuba",
        "score": 30,
        "aliases": [
          "cuba"
        ]
      },
      {
        "name": "Jamaica",
        "score": 30,
        "aliases": [
          "jamaica"
        ]
      },
      {
        "name": "Haiti",
        "score": 31,
        "aliases": [
          "haiti"
        ]
      },
      {
        "name": "Dominican Republic",
        "score": 31,
        "aliases": [
          "dominican republic"
        ]
      },
      {
        "name": "Bahamas",
        "score": 32,
        "aliases": [
          "The Bahamas",
          "the bahamas",
          "bahamas"
        ]
      },
      {
        "name": "Barbados",
        "score": 32,
        "aliases": [
          "barbados"
        ]
      },
      {
        "name": "Trinidad and Tobago",
        "score": 33,
        "aliases": [
          "trinidad and tobago",
          "trinidad"
        ]
      },
      {
        "name": "Guatemala",
        "score": 33,
        "aliases": [
          "guatemala"
        ]
      },
      {
        "name": "Honduras",
        "score": 34,
        "aliases": [
          "honduras"
        ]
      },
      {
        "name": "El Salvador",
        "score": 34,
        "aliases": [
          "el salvador"
        ]
      },
      {
        "name": "Nicaragua",
        "score": 34,
        "aliases": [
          "nicaragua"
        ]
      },
      {
        "name": "Belize",
        "score": 35,
        "aliases": [
          "belize"
        ]
      },
      {
        "name": "Norway",
        "score": 35,
        "aliases": [
          "norway"
        ]
      },
      {
        "name": "Sweden",
        "score": 36,
        "aliases": [
          "sweden"
        ]
      },
      {
        "name": "Finland",
        "score": 36,
        "aliases": [
          "finland"
        ]
      },
      {
        "name": "Denmark",
        "score": 37,
        "aliases": [
          "denmark"
        ]
      },
      {
        "name": "Iceland",
        "score": 37,
        "aliases": [
          "iceland"
        ]
      },
      {
        "name": "Ireland",
        "score": 38,
        "aliases": [
          "ireland"
        ]
      },
      {
        "name": "Netherlands",
        "score": 38,
        "aliases": [
          "Holland",
          "netherlands",
          "holland"
        ]
      },
      {
        "name": "Belgium",
        "score": 38,
        "aliases": [
          "belgium"
        ]
      },
      {
        "name": "Switzerland",
        "score": 39,
        "aliases": [
          "switzerland"
        ]
      },
      {
        "name": "Austria",
        "score": 39,
        "aliases": [
          "austria"
        ]
      },
      {
        "name": "Portugal",
        "score": 40,
        "aliases": [
          "portugal"
        ]
      },
      {
        "name": "Greece",
        "score": 40,
        "aliases": [
          "greece"
        ]
      },
      {
        "name": "Poland",
        "score": 41,
        "aliases": [
          "poland"
        ]
      },
      {
        "name": "Czechia",
        "score": 41,
        "aliases": [
          "Czech Republic",
          "czechia",
          "czech republic"
        ]
      },
      {
        "name": "Slovakia",
        "score": 42,
        "aliases": [
          "slovakia"
        ]
      },
      {
        "name": "Hungary",
        "score": 42,
        "aliases": [
          "hungary"
        ]
      },
      {
        "name": "Romania",
        "score": 43,
        "aliases": [
          "romania"
        ]
      },
      {
        "name": "Bulgaria",
        "score": 43,
        "aliases": [
          "bulgaria"
        ]
      },
      {
        "name": "Serbia",
        "score": 43,
        "aliases": [
          "serbia"
        ]
      },
      {
        "name": "Croatia",
        "score": 44,
        "aliases": [
          "croatia"
        ]
      },
      {
        "name": "Slovenia",
        "score": 44,
        "aliases": [
          "slovenia"
        ]
      },
      {
        "name": "Bosnia and Herzegovina",
        "score": 45,
        "aliases": [
          "bosnia and herzegovina",
          "bosnia"
        ]
      },
      {
        "name": "Montenegro",
        "score": 45,
        "aliases": [
          "montenegro"
        ]
      },
      {
        "name": "Albania",
        "score": 46,
        "aliases": [
          "albania"
        ]
      },
      {
        "name": "North Macedonia",
        "score": 46,
        "aliases": [
          "north macedonia",
          "macedonia"
        ]
      },
      {
        "name": "Ukraine",
        "score": 47,
        "aliases": [
          "ukraine"
        ]
      },
      {
        "name": "Belarus",
        "score": 47,
        "aliases": [
          "belarus"
        ]
      },
      {
        "name": "Lithuania",
        "score": 47,
        "aliases": [
          "lithuania"
        ]
      },
      {
        "name": "Latvia",
        "score": 48,
        "aliases": [
          "latvia"
        ]
      },
      {
        "name": "Estonia",
        "score": 48,
        "aliases": [
          "estonia"
        ]
      },
      {
        "name": "Moldova",
        "score": 49,
        "aliases": [
          "moldova"
        ]
      },
      {
        "name": "Turkey",
        "score": 49,
        "aliases": [
          "Türkiye",
          "turkey",
          "turkiye"
        ]
      },
      {
        "name": "Israel",
        "score": 50,
        "aliases": [
          "israel"
        ]
      },
      {
        "name": "Jordan",
        "score": 50,
        "aliases": [
          "jordan"
        ]
      },
      {
        "name": "Lebanon",
        "score": 51,
        "aliases": [
          "lebanon"
        ]
      },
      {
        "name": "Syria",
        "score": 51,
        "aliases": [
          "syria"
        ]
      },
      {
        "name": "Iraq",
        "score": 52,
        "aliases": [
          "iraq"
        ]
      },
      {
        "name": "Iran",
        "score": 52,
        "aliases": [
          "iran"
        ]
      },
      {
        "name": "Saudi Arabia",
        "score": 52,
        "aliases": [
          "saudi arabia"
        ]
      },
      {
        "name": "United Arab Emirates",
        "score": 53,
        "aliases": [
          "UAE",
          "united arab emirates",
          "uae"
        ]
      },
      {
        "name": "Qatar",
        "score": 53,
        "aliases": [
          "qatar"
        ]
      },
      {
        "name": "Oman",
        "score": 54,
        "aliases": [
          "oman"
        ]
      },
      {
        "name": "Yemen",
        "score": 54,
        "aliases": [
          "yemen"
        ]
      },
      {
        "name": "Kuwait",
        "score": 55,
        "aliases": [
          "kuwait"
        ]
      },
      {
        "name": "Bahrain",
        "score": 55,
        "aliases": [
          "bahrain"
        ]
      },
      {
        "name": "Pakistan",
        "score": 56,
        "aliases": [
          "pakistan"
        ]
      },
      {
        "name": "Bangladesh",
        "score": 56,
        "aliases": [
          "bangladesh"
        ]
      },
      {
        "name": "Sri Lanka",
        "score": 56,
        "aliases": [
          "sri lanka"
        ]
      },
      {
        "name": "Nepal",
        "score": 57,
        "aliases": [
          "nepal"
        ]
      },
      {
        "name": "Bhutan",
        "score": 57,
        "aliases": [
          "bhutan"
        ]
      },
      {
        "name": "Maldives",
        "score": 58,
        "aliases": [
          "maldives"
        ]
      },
      {
        "name": "Afghanistan",
        "score": 58,
        "aliases": [
          "afghanistan"
        ]
      },
      {
        "name": "Kazakhstan",
        "score": 59,
        "aliases": [
          "kazakhstan"
        ]
      },
      {
        "name": "Uzbekistan",
        "score": 59,
        "aliases": [
          "uzbekistan"
        ]
      },
      {
        "name": "Turkmenistan",
        "score": 60,
        "aliases": [
          "turkmenistan"
        ]
      },
      {
        "name": "Tajikistan",
        "score": 60,
        "aliases": [
          "tajikistan"
        ]
      },
      {
        "name": "Kyrgyzstan",
        "score": 60,
        "aliases": [
          "kyrgyzstan"
        ]
      },
      {
        "name": "Mongolia",
        "score": 61,
        "aliases": [
          "mongolia"
        ]
      },
      {
        "name": "Thailand",
        "score": 61,
        "aliases": [
          "thailand"
        ]
      },
      {
        "name": "Vietnam",
        "score": 62,
        "aliases": [
          "vietnam"
        ]
      },
      {
        "name": "Cambodia",
        "score": 62,
        "aliases": [
          "cambodia"
        ]
      },
      {
        "name": "Laos",
        "score": 63,
        "aliases": [
          "laos"
        ]
      },
      {
        "name": "Myanmar",
        "score": 63,
        "aliases": [
          "Burma",
          "myanmar",
          "burma"
        ]
      },
      {
        "name": "Malaysia",
        "score": 64,
        "aliases": [
          "malaysia"
        ]
      },
      {
        "name": "Singapore",
        "score": 64,
        "aliases": [
          "singapore"
        ]
      },
      {
        "name": "Indonesia",
        "score": 65,
        "aliases": [
          "indonesia"
        ]
      },
      {
        "name": "Philippines",
        "score": 65,
        "aliases": [
          "philippines"
        ]
      },
      {
        "name": "Brunei",
        "score": 65,
        "aliases": [
          "brunei"
        ]
      },
      {
        "name": "Timor Leste",
        "score": 66,
        "aliases": [
          "East Timor",
          "timor leste",
          "east timor"
        ]
      },
      {
        "name": "Papua New Guinea",
        "score": 66
      },
      {
        "name": "Fiji",
        "score": 67
      },
      {
        "name": "Samoa",
        "score": 67
      },
      {
        "name": "Tonga",
        "score": 68
      },
      {
        "name": "Vanuatu",
        "score": 68
      },
      {
        "name": "Solomon Islands",
        "score": 69
      },
      {
        "name": "Kiribati",
        "score": 69
      },
      {
        "name": "Tuvalu",
        "score": 69
      },
      {
        "name": "Nauru",
        "score": 70
      },
      {
        "name": "Palau",
        "score": 70
      },
      {
        "name": "Marshall Islands",
        "score": 71
      },
      {
        "name": "Micronesia",
        "score": 71,
        "aliases": [
          "Federated States of Micronesia"
        ]
      },
      {
        "name": "Mauritius",
        "score": 72,
        "aliases": [
          "mauritius"
        ]
      },
      {
        "name": "Seychelles",
        "score": 72,
        "aliases": [
          "seychelles"
        ]
      },
      {
        "name": "Madagascar",
        "score": 73,
        "aliases": [
          "madagascar"
        ]
      },
      {
        "name": "Comoros",
        "score": 73,
        "aliases": [
          "comoros"
        ]
      },
      {
        "name": "Mauritania",
        "score": 74,
        "aliases": [
          "mauritania"
        ]
      },
      {
        "name": "Mali",
        "score": 74,
        "aliases": [
          "mali"
        ]
      },
      {
        "name": "Niger",
        "score": 74,
        "aliases": [
          "niger"
        ]
      },
      {
        "name": "Chad",
        "score": 75,
        "aliases": [
          "chad"
        ]
      },
      {
        "name": "Cameroon",
        "score": 75,
        "aliases": [
          "cameroon"
        ]
      },
      {
        "name": "Gabon",
        "score": 76,
        "aliases": [
          "gabon"
        ]
      },
      {
        "name": "Equatorial Guinea",
        "score": 76,
        "aliases": [
          "equatorial guinea"
        ]
      },
      {
        "name": "Republic of the Congo",
        "score": 77,
        "aliases": [
          "Congo Republic",
          "republic of the congo",
          "congo",
          "congo brazzaville"
        ]
      },
      {
        "name": "Democratic Republic of the Congo",
        "score": 77,
        "aliases": [
          "DR Congo",
          "DRC",
          "democratic republic of the congo",
          "dr congo",
          "drc",
          "congo kinshasa"
        ]
      },
      {
        "name": "Angola",
        "score": 78,
        "aliases": [
          "angola"
        ]
      },
      {
        "name": "Zambia",
        "score": 78,
        "aliases": [
          "zambia"
        ]
      },
      {
        "name": "Zimbabwe",
        "score": 78,
        "aliases": [
          "zimbabwe"
        ]
      },
      {
        "name": "Botswana",
        "score": 79,
        "aliases": [
          "botswana"
        ]
      },
      {
        "name": "Namibia",
        "score": 79,
        "aliases": [
          "namibia"
        ]
      },
      {
        "name": "Lesotho",
        "score": 80,
        "aliases": [
          "lesotho"
        ]
      },
      {
        "name": "Eswatini",
        "score": 80,
        "aliases": [
          "Swaziland",
          "eswatini",
          "swaziland"
        ]
      },
      {
        "name": "Mozambique",
        "score": 81,
        "aliases": [
          "mozambique"
        ]
      },
      {
        "name": "Malawi",
        "score": 81,
        "aliases": [
          "malawi"
        ]
      },
      {
        "name": "Rwanda",
        "score": 82,
        "aliases": [
          "rwanda"
        ]
      },
      {
        "name": "Burundi",
        "score": 82,
        "aliases": [
          "burundi"
        ]
      },
      {
        "name": "South Sudan",
        "score": 82,
        "aliases": [
          "south sudan"
        ]
      },
      {
        "name": "Sudan",
        "score": 83,
        "aliases": [
          "sudan"
        ]
      },
      {
        "name": "Eritrea",
        "score": 83,
        "aliases": [
          "eritrea"
        ]
      },
      {
        "name": "Djibouti",
        "score": 84,
        "aliases": [
          "djibouti"
        ]
      },
      {
        "name": "Somalia",
        "score": 84,
        "aliases": [
          "somalia"
        ]
      },
      {
        "name": "Benin",
        "score": 85,
        "aliases": [
          "benin"
        ]
      },
      {
        "name": "Togo",
        "score": 85,
        "aliases": [
          "togo"
        ]
      },
      {
        "name": "Burkina Faso",
        "score": 86,
        "aliases": [
          "burkina faso"
        ]
      },
      {
        "name": "Guinea",
        "score": 86,
        "aliases": [
          "guinea"
        ]
      },
      {
        "name": "Guinea Bissau",
        "score": 87,
        "aliases": [
          "guinea bissau"
        ]
      },
      {
        "name": "Sierra Leone",
        "score": 87,
        "aliases": [
          "sierra leone"
        ]
      },
      {
        "name": "Liberia",
        "score": 87,
        "aliases": [
          "liberia"
        ]
      },
      {
        "name": "Cote d’Ivoire",
        "score": 88,
        "aliases": [
          "Ivory Coast",
          "ivory coast",
          "cote divoire",
          "cote d ivoire"
        ]
      },
      {
        "name": "Gambia",
        "score": 88,
        "aliases": [
          "The Gambia",
          "the gambia",
          "gambia"
        ]
      },
      {
        "name": "Cabo Verde",
        "score": 89,
        "aliases": [
          "Cape Verde",
          "cape verde",
          "cabo verde"
        ]
      },
      {
        "name": "Sao Tome and Principe",
        "score": 89,
        "aliases": [
          "sao tome"
        ]
      },
      {
        "name": "San Marino",
        "score": 90,
        "aliases": [
          "san marino"
        ]
      },
      {
        "name": "Monaco",
        "score": 90,
        "aliases": [
          "monaco"
        ]
      },
      {
        "name": "Liechtenstein",
        "score": 91,
        "aliases": [
          "liechtenstein"
        ]
      },
      {
        "name": "Andorra",
        "score": 91,
        "aliases": [
          "andorra"
        ]
      },
      {
        "name": "Luxembourg",
        "score": 91,
        "aliases": [
          "luxembourg"
        ]
      },
      {
        "name": "Malta",
        "score": 92,
        "aliases": [
          "malta"
        ]
      },
      {
        "name": "Cyprus",
        "score": 92,
        "aliases": [
          "cyprus"
        ]
      },
      {
        "name": "Armenia",
        "score": 93,
        "aliases": [
          "armenia"
        ]
      },
      {
        "name": "Azerbaijan",
        "score": 93,
        "aliases": [
          "azerbaijan"
        ]
      },
      {
        "name": "Georgia",
        "score": 94,
        "aliases": [
          "georgia"
        ]
      },
      {
        "name": "Vatican City",
        "score": 94,
        "aliases": [
          "Holy See",
          "vatican city",
          "vatican"
        ]
      },
      {
        "name": "Saint Lucia",
        "score": 95,
        "aliases": [
          "saint lucia",
          "st lucia"
        ]
      },
      {
        "name": "Saint Kitts and Nevis",
        "score": 95,
        "aliases": [
          "saint kitts and nevis",
          "st kitts and nevis"
        ]
      },
      {
        "name": "Saint Vincent and the Grenadines",
        "score": 96,
        "aliases": [
          "saint vincent and the grenadines",
          "st vincent and the grenadines"
        ]
      },
      {
        "name": "Grenada",
        "score": 96,
        "aliases": [
          "grenada"
        ]
      },
      {
        "name": "Dominica",
        "score": 96,
        "aliases": [
          "dominica"
        ]
      },
      {
        "name": "Antigua and Barbuda",
        "score": 97,
        "aliases": [
          "antigua and barbuda"
        ]
      },
      {
        "name": "Guyana",
        "score": 97,
        "aliases": [
          "guyana"
        ]
      },
      {
        "name": "Suriname",
        "score": 98,
        "aliases": [
          "suriname"
        ]
      },
      {
        "name": "Libya",
        "score": 98,
        "aliases": [
          "libya"
        ]
      },
      {
        "name": "Palestine",
        "score": 99,
        "aliases": [
          "palestine"
        ]
      },
      {
        "name": "kosovo",
        "score": 99
      },
      {
        "name": "central african republic",
        "score": 100,
        "aliases": [
          "car"
        ]
      },
      {
        "name": "taiwan",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "California",
      "Paris"
    ]
  },
  {
    "id": "play-world-cities",
    "category": "world",
    "prompt": "Name a city anywhere in the world.",
    "answers": [
      {
        "name": "London",
        "score": 12,
        "aliases": []
      },
      {
        "name": "Paris",
        "score": 12,
        "aliases": []
      },
      {
        "name": "New York",
        "score": 12,
        "aliases": [
          "New York City",
          "NYC"
        ]
      },
      {
        "name": "Tokyo",
        "score": 12,
        "aliases": []
      },
      {
        "name": "Toronto",
        "score": 12,
        "aliases": []
      },
      {
        "name": "Vancouver",
        "score": 13,
        "aliases": []
      },
      {
        "name": "Montreal",
        "score": 13,
        "aliases": [
          "Montréal"
        ]
      },
      {
        "name": "Ottawa",
        "score": 13,
        "aliases": []
      },
      {
        "name": "Calgary",
        "score": 13,
        "aliases": []
      },
      {
        "name": "Edmonton",
        "score": 13,
        "aliases": []
      },
      {
        "name": "Quebec City",
        "score": 13,
        "aliases": [
          "Québec City"
        ]
      },
      {
        "name": "Victoria",
        "score": 13,
        "aliases": []
      },
      {
        "name": "Winnipeg",
        "score": 13,
        "aliases": []
      },
      {
        "name": "Halifax",
        "score": 13,
        "aliases": []
      },
      {
        "name": "Los Angeles",
        "score": 13,
        "aliases": [
          "LA",
          "Los Ángeles"
        ]
      },
      {
        "name": "San Francisco",
        "score": 14,
        "aliases": []
      },
      {
        "name": "Chicago",
        "score": 14
      },
      {
        "name": "Miami",
        "score": 14,
        "aliases": []
      },
      {
        "name": "Boston",
        "score": 14
      },
      {
        "name": "Seattle",
        "score": 14
      },
      {
        "name": "Washington DC",
        "score": 14,
        "aliases": [
          "Washington D C"
        ]
      },
      {
        "name": "Las Vegas",
        "score": 14
      },
      {
        "name": "Sydney",
        "score": 14,
        "aliases": []
      },
      {
        "name": "Melbourne",
        "score": 14,
        "aliases": []
      },
      {
        "name": "Auckland",
        "score": 15
      },
      {
        "name": "Wellington",
        "score": 15
      },
      {
        "name": "Rome",
        "score": 15,
        "aliases": [
          "Roma"
        ]
      },
      {
        "name": "Venice",
        "score": 15,
        "aliases": [
          "Venezia"
        ]
      },
      {
        "name": "Milan",
        "score": 15,
        "aliases": [
          "Milano"
        ]
      },
      {
        "name": "Florence",
        "score": 15,
        "aliases": [
          "Firenze"
        ]
      },
      {
        "name": "Berlin",
        "score": 15,
        "aliases": []
      },
      {
        "name": "Munich",
        "score": 15,
        "aliases": [
          "München"
        ]
      },
      {
        "name": "Hamburg",
        "score": 15,
        "aliases": []
      },
      {
        "name": "Madrid",
        "score": 16,
        "aliases": []
      },
      {
        "name": "Barcelona",
        "score": 16,
        "aliases": []
      },
      {
        "name": "Lisbon",
        "score": 16
      },
      {
        "name": "Amsterdam",
        "score": 16
      },
      {
        "name": "Brussels",
        "score": 16
      },
      {
        "name": "Vienna",
        "score": 16
      },
      {
        "name": "Prague",
        "score": 16
      },
      {
        "name": "Warsaw",
        "score": 16
      },
      {
        "name": "Athens",
        "score": 16
      },
      {
        "name": "Dublin",
        "score": 16
      },
      {
        "name": "Edinburgh",
        "score": 17,
        "aliases": []
      },
      {
        "name": "Manchester",
        "score": 17,
        "aliases": []
      },
      {
        "name": "Liverpool",
        "score": 17,
        "aliases": []
      },
      {
        "name": "Glasgow",
        "score": 17,
        "aliases": []
      },
      {
        "name": "Oslo",
        "score": 17
      },
      {
        "name": "Stockholm",
        "score": 17
      },
      {
        "name": "Helsinki",
        "score": 17
      },
      {
        "name": "Copenhagen",
        "score": 17
      },
      {
        "name": "Reykjavik",
        "score": 17
      },
      {
        "name": "Beijing",
        "score": 18,
        "aliases": [
          "Peking"
        ]
      },
      {
        "name": "Shanghai",
        "score": 18,
        "aliases": []
      },
      {
        "name": "Hong Kong",
        "score": 18
      },
      {
        "name": "Seoul",
        "score": 18
      },
      {
        "name": "Busan",
        "score": 18
      },
      {
        "name": "Osaka",
        "score": 18,
        "aliases": []
      },
      {
        "name": "Kyoto",
        "score": 18,
        "aliases": []
      },
      {
        "name": "Mumbai",
        "score": 18,
        "aliases": [
          "Bombay"
        ]
      },
      {
        "name": "Delhi",
        "score": 18,
        "aliases": []
      },
      {
        "name": "New Delhi",
        "score": 18
      },
      {
        "name": "Kolkata",
        "score": 19,
        "aliases": [
          "Calcutta"
        ]
      },
      {
        "name": "Chennai",
        "score": 19,
        "aliases": [
          "Madras"
        ]
      },
      {
        "name": "Bangkok",
        "score": 19
      },
      {
        "name": "Singapore",
        "score": 19
      },
      {
        "name": "Jakarta",
        "score": 19,
        "aliases": []
      },
      {
        "name": "Manila",
        "score": 19,
        "aliases": []
      },
      {
        "name": "Hanoi",
        "score": 19
      },
      {
        "name": "Ho Chi Minh City",
        "score": 19,
        "aliases": [
          "Saigon"
        ]
      },
      {
        "name": "Kuala Lumpur",
        "score": 19
      },
      {
        "name": "Dubai",
        "score": 20
      },
      {
        "name": "Abu Dhabi",
        "score": 20
      },
      {
        "name": "Doha",
        "score": 20
      },
      {
        "name": "Istanbul",
        "score": 20
      },
      {
        "name": "Ankara",
        "score": 20
      },
      {
        "name": "Jerusalem",
        "score": 20
      },
      {
        "name": "Tel Aviv",
        "score": 20
      },
      {
        "name": "Cairo",
        "score": 20,
        "aliases": []
      },
      {
        "name": "Alexandria",
        "score": 20,
        "aliases": []
      },
      {
        "name": "Nairobi",
        "score": 20
      },
      {
        "name": "Cape Town",
        "score": 21
      },
      {
        "name": "Johannesburg",
        "score": 21
      },
      {
        "name": "Lagos",
        "score": 21
      },
      {
        "name": "Accra",
        "score": 21
      },
      {
        "name": "Casablanca",
        "score": 21
      },
      {
        "name": "Marrakesh",
        "score": 21,
        "aliases": [
          "Marrakech"
        ]
      },
      {
        "name": "Rabat",
        "score": 21
      },
      {
        "name": "Algiers",
        "score": 21
      },
      {
        "name": "Tunis",
        "score": 21
      },
      {
        "name": "Buenos Aires",
        "score": 22,
        "aliases": []
      },
      {
        "name": "Rio de Janeiro",
        "score": 22,
        "aliases": []
      },
      {
        "name": "Sao Paulo",
        "score": 22,
        "aliases": [
          "São Paulo"
        ]
      },
      {
        "name": "Brasilia",
        "score": 22,
        "aliases": [
          "Brasília"
        ]
      },
      {
        "name": "Santiago",
        "score": 22,
        "aliases": []
      },
      {
        "name": "Lima",
        "score": 22
      },
      {
        "name": "Bogota",
        "score": 22,
        "aliases": [
          "Bogotá"
        ]
      },
      {
        "name": "Quito",
        "score": 22
      },
      {
        "name": "Caracas",
        "score": 22
      },
      {
        "name": "Mexico City",
        "score": 23,
        "aliases": [
          "Ciudad de Mexico",
          "CDMX"
        ]
      },
      {
        "name": "Havana",
        "score": 23
      },
      {
        "name": "Kingston",
        "score": 23,
        "aliases": []
      },
      {
        "name": "Panama City",
        "score": 23,
        "aliases": []
      },
      {
        "name": "San Jose",
        "score": 23,
        "aliases": [
          "San José"
        ]
      },
      {
        "name": "Kathmandu",
        "score": 23
      },
      {
        "name": "Thimphu",
        "score": 23
      },
      {
        "name": "Ulaanbaatar",
        "score": 23
      },
      {
        "name": "Samarkand",
        "score": 23
      },
      {
        "name": "Tashkent",
        "score": 23
      },
      {
        "name": "Bishkek",
        "score": 24
      },
      {
        "name": "Yerevan",
        "score": 24
      },
      {
        "name": "Tbilisi",
        "score": 24
      },
      {
        "name": "Baku",
        "score": 24
      },
      {
        "name": "Dakar",
        "score": 24
      },
      {
        "name": "Kigali",
        "score": 24
      },
      {
        "name": "Maputo",
        "score": 24
      },
      {
        "name": "Antananarivo",
        "score": 24
      },
      {
        "name": "Gaborone",
        "score": 24
      },
      {
        "name": "Windhoek",
        "score": 25
      },
      {
        "name": "Regina",
        "score": 25
      },
      {
        "name": "Saskatoon",
        "score": 25
      },
      {
        "name": "Hamilton",
        "score": 25,
        "aliases": []
      },
      {
        "name": "Windsor",
        "score": 25,
        "aliases": []
      },
      {
        "name": "Kelowna",
        "score": 25
      },
      {
        "name": "Nanaimo",
        "score": 25
      },
      {
        "name": "Kamloops",
        "score": 25
      },
      {
        "name": "Whitehorse",
        "score": 25
      },
      {
        "name": "Yellowknife",
        "score": 25
      },
      {
        "name": "Iqaluit",
        "score": 26
      },
      {
        "name": "Fredericton",
        "score": 26
      },
      {
        "name": "Moncton",
        "score": 26
      },
      {
        "name": "Charlottetown",
        "score": 26
      },
      {
        "name": "St John’s",
        "score": 26,
        "aliases": [
          "Saint John’s"
        ]
      },
      {
        "name": "Saint John",
        "score": 26
      },
      {
        "name": "Thunder Bay",
        "score": 26,
        "aliases": []
      },
      {
        "name": "Surrey",
        "score": 26
      },
      {
        "name": "Burnaby",
        "score": 26
      },
      {
        "name": "Richmond",
        "score": 27
      },
      {
        "name": "Coquitlam",
        "score": 27
      },
      {
        "name": "Prince George",
        "score": 27
      },
      {
        "name": "Abbotsford",
        "score": 27
      },
      {
        "name": "Mississauga",
        "score": 27,
        "aliases": []
      },
      {
        "name": "Brampton",
        "score": 27,
        "aliases": []
      },
      {
        "name": "Sherbrooke",
        "score": 27,
        "aliases": []
      },
      {
        "name": "Gatineau",
        "score": 27,
        "aliases": []
      },
      {
        "name": "Trois-Rivières",
        "score": 27,
        "aliases": [
          "Trois Rivieres"
        ]
      },
      {
        "name": "Laval",
        "score": 27,
        "aliases": []
      },
      {
        "name": "St. Catharines",
        "score": 28,
        "aliases": [
          "St Catharines"
        ]
      },
      {
        "name": "Waterloo",
        "score": 28
      },
      {
        "name": "Kitchener",
        "score": 28
      },
      {
        "name": "Guelph",
        "score": 28
      },
      {
        "name": "Cambridge",
        "score": 28,
        "aliases": []
      },
      {
        "name": "Barrie",
        "score": 28
      },
      {
        "name": "Peterborough",
        "score": 28,
        "aliases": []
      },
      {
        "name": "Sudbury",
        "score": 28,
        "aliases": [
          "Greater Sudbury"
        ]
      },
      {
        "name": "Sault Ste Marie",
        "score": 28
      },
      {
        "name": "Niagara Falls",
        "score": 29
      },
      {
        "name": "Oshawa",
        "score": 29
      },
      {
        "name": "Burlington",
        "score": 29
      },
      {
        "name": "Markham",
        "score": 29
      },
      {
        "name": "Vaughan",
        "score": 29
      },
      {
        "name": "Belleville",
        "score": 29
      },
      {
        "name": "Brockville",
        "score": 29
      },
      {
        "name": "Stratford",
        "score": 29
      },
      {
        "name": "Richmond Hill",
        "score": 29
      },
      {
        "name": "Brantford",
        "score": 30
      },
      {
        "name": "Sarnia",
        "score": 30
      },
      {
        "name": "Timmins",
        "score": 30
      },
      {
        "name": "North Bay",
        "score": 30
      },
      {
        "name": "Orillia",
        "score": 30
      },
      {
        "name": "Pickering",
        "score": 30
      },
      {
        "name": "Woodstock",
        "score": 30
      },
      {
        "name": "Cornwall",
        "score": 30
      },
      {
        "name": "Kenora",
        "score": 30
      },
      {
        "name": "Saguenay",
        "score": 30
      },
      {
        "name": "Longueuil",
        "score": 31
      },
      {
        "name": "Levis",
        "score": 31,
        "aliases": [
          "Lévis"
        ]
      },
      {
        "name": "Drummondville",
        "score": 31
      },
      {
        "name": "Granby",
        "score": 31
      },
      {
        "name": "Saint Jerome",
        "score": 31,
        "aliases": [
          "Saint-Jérôme"
        ]
      },
      {
        "name": "Saint Hyacinthe",
        "score": 31,
        "aliases": [
          "Saint-Hyacinthe"
        ]
      },
      {
        "name": "Rimouski",
        "score": 31
      },
      {
        "name": "Shawinigan",
        "score": 31
      },
      {
        "name": "Victoriaville",
        "score": 31
      },
      {
        "name": "Rouyn Noranda",
        "score": 32,
        "aliases": [
          "Rouyn-Noranda"
        ]
      },
      {
        "name": "Val d’Or",
        "score": 32
      },
      {
        "name": "Sept Iles",
        "score": 32,
        "aliases": [
          "Sept-Îles"
        ]
      },
      {
        "name": "Baie Comeau",
        "score": 32
      },
      {
        "name": "Magog",
        "score": 32
      },
      {
        "name": "Joliette",
        "score": 32
      },
      {
        "name": "Terrebonne",
        "score": 32
      },
      {
        "name": "Repentigny",
        "score": 32
      },
      {
        "name": "Saint-Jean-sur-Richelieu",
        "score": 32
      },
      {
        "name": "Blainville",
        "score": 32
      },
      {
        "name": "Sorel-Tracy",
        "score": 33
      },
      {
        "name": "Mirabel",
        "score": 33
      },
      {
        "name": "San Diego",
        "score": 33
      },
      {
        "name": "Sacramento",
        "score": 33
      },
      {
        "name": "Oakland",
        "score": 33
      },
      {
        "name": "Fresno",
        "score": 33
      },
      {
        "name": "Long Beach",
        "score": 33
      },
      {
        "name": "Anaheim",
        "score": 33
      },
      {
        "name": "Santa Monica",
        "score": 33
      },
      {
        "name": "Berkeley",
        "score": 34
      },
      {
        "name": "Pasadena",
        "score": 34
      },
      {
        "name": "Santa Barbara",
        "score": 34
      },
      {
        "name": "Santa Cruz",
        "score": 34
      },
      {
        "name": "Monterey",
        "score": 34
      },
      {
        "name": "Palo Alto",
        "score": 34
      },
      {
        "name": "Irvine",
        "score": 34
      },
      {
        "name": "Bakersfield",
        "score": 34
      },
      {
        "name": "Stockton",
        "score": 34
      },
      {
        "name": "Modesto",
        "score": 35
      },
      {
        "name": "Riverside",
        "score": 35
      },
      {
        "name": "San Bernardino",
        "score": 35
      },
      {
        "name": "Palm Springs",
        "score": 35
      },
      {
        "name": "Santa Rosa",
        "score": 35
      },
      {
        "name": "Eureka",
        "score": 35
      },
      {
        "name": "San Luis Obispo",
        "score": 35
      },
      {
        "name": "Santa Ana",
        "score": 35
      },
      {
        "name": "Cupertino",
        "score": 35
      },
      {
        "name": "Mountain View",
        "score": 35
      },
      {
        "name": "Sunnyvale",
        "score": 36
      },
      {
        "name": "Santa Clara",
        "score": 36
      },
      {
        "name": "Chula Vista",
        "score": 36
      },
      {
        "name": "Oceanside",
        "score": 36
      },
      {
        "name": "Carlsbad",
        "score": 36
      },
      {
        "name": "Salinas",
        "score": 36
      },
      {
        "name": "Davis",
        "score": 36
      },
      {
        "name": "Daly City",
        "score": 36
      },
      {
        "name": "South San Francisco",
        "score": 36
      },
      {
        "name": "Houston",
        "score": 37
      },
      {
        "name": "Dallas",
        "score": 37
      },
      {
        "name": "Austin",
        "score": 37
      },
      {
        "name": "San Antonio",
        "score": 37,
        "aliases": []
      },
      {
        "name": "Fort Worth",
        "score": 37
      },
      {
        "name": "El Paso",
        "score": 37
      },
      {
        "name": "Arlington",
        "score": 37
      },
      {
        "name": "Corpus Christi",
        "score": 37
      },
      {
        "name": "Plano",
        "score": 37
      },
      {
        "name": "Lubbock",
        "score": 37
      },
      {
        "name": "Amarillo",
        "score": 38
      },
      {
        "name": "Waco",
        "score": 38
      },
      {
        "name": "Galveston",
        "score": 38
      },
      {
        "name": "Laredo",
        "score": 38
      },
      {
        "name": "Irving",
        "score": 38
      },
      {
        "name": "Garland",
        "score": 38
      },
      {
        "name": "Frisco",
        "score": 38
      },
      {
        "name": "McKinney",
        "score": 38
      },
      {
        "name": "Denton",
        "score": 38
      },
      {
        "name": "Beaumont",
        "score": 39
      },
      {
        "name": "Midland",
        "score": 39
      },
      {
        "name": "Odessa",
        "score": 39
      },
      {
        "name": "Abilene",
        "score": 39
      },
      {
        "name": "Tyler",
        "score": 39
      },
      {
        "name": "College Station",
        "score": 39
      },
      {
        "name": "Round Rock",
        "score": 39
      },
      {
        "name": "Brownsville",
        "score": 39
      },
      {
        "name": "McAllen",
        "score": 39
      },
      {
        "name": "Sugar Land",
        "score": 39
      },
      {
        "name": "Pearland",
        "score": 40
      },
      {
        "name": "Orlando",
        "score": 40
      },
      {
        "name": "Tampa",
        "score": 40
      },
      {
        "name": "Jacksonville",
        "score": 40
      },
      {
        "name": "Tallahassee",
        "score": 40
      },
      {
        "name": "Fort Lauderdale",
        "score": 40
      },
      {
        "name": "St Petersburg",
        "score": 40
      },
      {
        "name": "Key West",
        "score": 40
      },
      {
        "name": "Daytona Beach",
        "score": 40
      },
      {
        "name": "Sarasota",
        "score": 41
      },
      {
        "name": "Naples",
        "score": 41,
        "aliases": [
          "Napoli"
        ]
      },
      {
        "name": "Gainesville",
        "score": 41
      },
      {
        "name": "Pensacola",
        "score": 41
      },
      {
        "name": "Fort Myers",
        "score": 41
      },
      {
        "name": "Boca Raton",
        "score": 41
      },
      {
        "name": "West Palm Beach",
        "score": 41
      },
      {
        "name": "Clearwater",
        "score": 41
      },
      {
        "name": "Lakeland",
        "score": 41
      },
      {
        "name": "Hollywood",
        "score": 42
      },
      {
        "name": "Cape Coral",
        "score": 42
      },
      {
        "name": "Ocala",
        "score": 42
      },
      {
        "name": "Port St Lucie",
        "score": 42
      },
      {
        "name": "St Augustine",
        "score": 42
      },
      {
        "name": "Hialeah",
        "score": 42
      },
      {
        "name": "Kissimmee",
        "score": 42
      },
      {
        "name": "Palm Bay",
        "score": 42
      },
      {
        "name": "Coral Gables",
        "score": 42
      },
      {
        "name": "Delray Beach",
        "score": 42
      },
      {
        "name": "Birmingham",
        "score": 43
      },
      {
        "name": "Belfast",
        "score": 43
      },
      {
        "name": "Cardiff",
        "score": 43
      },
      {
        "name": "Bristol",
        "score": 43
      },
      {
        "name": "Leeds",
        "score": 43
      },
      {
        "name": "Sheffield",
        "score": 43
      },
      {
        "name": "Newcastle upon Tyne",
        "score": 43,
        "aliases": [
          "Newcastle"
        ]
      },
      {
        "name": "Nottingham",
        "score": 43
      },
      {
        "name": "Leicester",
        "score": 43
      },
      {
        "name": "York",
        "score": 44
      },
      {
        "name": "Oxford",
        "score": 44
      },
      {
        "name": "Bath",
        "score": 44
      },
      {
        "name": "Canterbury",
        "score": 44
      },
      {
        "name": "Durham",
        "score": 44
      },
      {
        "name": "Exeter",
        "score": 44
      },
      {
        "name": "Aberdeen",
        "score": 44
      },
      {
        "name": "Dundee",
        "score": 44
      },
      {
        "name": "Inverness",
        "score": 44
      },
      {
        "name": "Swansea",
        "score": 44
      },
      {
        "name": "Newport",
        "score": 45
      },
      {
        "name": "Derry",
        "score": 45,
        "aliases": [
          "Londonderry"
        ]
      },
      {
        "name": "St Davids",
        "score": 45
      },
      {
        "name": "Coventry",
        "score": 45
      },
      {
        "name": "Brighton",
        "score": 45
      },
      {
        "name": "Southampton",
        "score": 45
      },
      {
        "name": "Portsmouth",
        "score": 45
      },
      {
        "name": "Plymouth",
        "score": 45
      },
      {
        "name": "Chester",
        "score": 45
      },
      {
        "name": "Lancaster",
        "score": 46
      },
      {
        "name": "Lincoln",
        "score": 46
      },
      {
        "name": "Norwich",
        "score": 46
      },
      {
        "name": "Winchester",
        "score": 46
      },
      {
        "name": "Worcester",
        "score": 46
      },
      {
        "name": "Perth",
        "score": 46,
        "aliases": []
      },
      {
        "name": "Stirling",
        "score": 46
      },
      {
        "name": "Bangor",
        "score": 46
      },
      {
        "name": "St Asaph",
        "score": 46
      },
      {
        "name": "Wrexham",
        "score": 46
      },
      {
        "name": "Lisburn",
        "score": 47
      },
      {
        "name": "Armagh",
        "score": 47
      },
      {
        "name": "Newry",
        "score": 47
      },
      {
        "name": "Milton Keynes",
        "score": 47
      },
      {
        "name": "Colchester",
        "score": 47
      },
      {
        "name": "Doncaster",
        "score": 47
      },
      {
        "name": "Dunfermline",
        "score": 47
      },
      {
        "name": "Bradford",
        "score": 47
      },
      {
        "name": "Brighton and Hove",
        "score": 47
      },
      {
        "name": "Carlisle",
        "score": 48
      },
      {
        "name": "Chelmsford",
        "score": 48
      },
      {
        "name": "Chichester",
        "score": 48
      },
      {
        "name": "Ely",
        "score": 48
      },
      {
        "name": "Gloucester",
        "score": 48
      },
      {
        "name": "Hereford",
        "score": 48
      },
      {
        "name": "Kingston upon Hull",
        "score": 48
      },
      {
        "name": "Hull",
        "score": 48
      },
      {
        "name": "Lichfield",
        "score": 48
      },
      {
        "name": "Preston",
        "score": 49
      },
      {
        "name": "Ripon",
        "score": 49
      },
      {
        "name": "Salford",
        "score": 49
      },
      {
        "name": "Salisbury",
        "score": 49
      },
      {
        "name": "Southend on Sea",
        "score": 49
      },
      {
        "name": "St Albans",
        "score": 49
      },
      {
        "name": "Stoke on Trent",
        "score": 49
      },
      {
        "name": "Sunderland",
        "score": 49
      },
      {
        "name": "Truro",
        "score": 49
      },
      {
        "name": "Wakefield",
        "score": 49
      },
      {
        "name": "Wells",
        "score": 50
      },
      {
        "name": "Westminster",
        "score": 50
      },
      {
        "name": "Wolverhampton",
        "score": 50
      },
      {
        "name": "Marseille",
        "score": 50
      },
      {
        "name": "Lyon",
        "score": 50
      },
      {
        "name": "Nice",
        "score": 50
      },
      {
        "name": "Bordeaux",
        "score": 50
      },
      {
        "name": "Toulouse",
        "score": 50
      },
      {
        "name": "Lille",
        "score": 50
      },
      {
        "name": "Nantes",
        "score": 51
      },
      {
        "name": "Strasbourg",
        "score": 51
      },
      {
        "name": "Montpellier",
        "score": 51
      },
      {
        "name": "Rennes",
        "score": 51
      },
      {
        "name": "Reims",
        "score": 51
      },
      {
        "name": "Dijon",
        "score": 51
      },
      {
        "name": "Grenoble",
        "score": 51
      },
      {
        "name": "Rouen",
        "score": 51
      },
      {
        "name": "Tours",
        "score": 51
      },
      {
        "name": "Avignon",
        "score": 51
      },
      {
        "name": "Cannes",
        "score": 52
      },
      {
        "name": "Brest",
        "score": 52
      },
      {
        "name": "Le Havre",
        "score": 52
      },
      {
        "name": "Amiens",
        "score": 52
      },
      {
        "name": "Angers",
        "score": 52
      },
      {
        "name": "Nimes",
        "score": 52,
        "aliases": [
          "Nîmes"
        ]
      },
      {
        "name": "Limoges",
        "score": 52
      },
      {
        "name": "Perpignan",
        "score": 52
      },
      {
        "name": "Besancon",
        "score": 52,
        "aliases": [
          "Besançon"
        ]
      },
      {
        "name": "Saint-Étienne",
        "score": 53
      },
      {
        "name": "Toulon",
        "score": 53
      },
      {
        "name": "Clermont-Ferrand",
        "score": 53
      },
      {
        "name": "Aix-en-Provence",
        "score": 53
      },
      {
        "name": "Metz",
        "score": 53
      },
      {
        "name": "Orléans",
        "score": 53
      },
      {
        "name": "Caen",
        "score": 53
      },
      {
        "name": "Annecy",
        "score": 53
      },
      {
        "name": "La Rochelle",
        "score": 53
      },
      {
        "name": "Versailles",
        "score": 54
      },
      {
        "name": "Calais",
        "score": 54
      },
      {
        "name": "Saint-Malo",
        "score": 54
      },
      {
        "name": "Frankfurt",
        "score": 54,
        "aliases": [
          "Frankfurt am Main"
        ]
      },
      {
        "name": "Cologne",
        "score": 54,
        "aliases": [
          "Köln"
        ]
      },
      {
        "name": "Stuttgart",
        "score": 54
      },
      {
        "name": "Dusseldorf",
        "score": 54,
        "aliases": [
          "Düsseldorf"
        ]
      },
      {
        "name": "Dortmund",
        "score": 54
      },
      {
        "name": "Essen",
        "score": 54
      },
      {
        "name": "Leipzig",
        "score": 54
      },
      {
        "name": "Dresden",
        "score": 55
      },
      {
        "name": "Hanover",
        "score": 55,
        "aliases": [
          "Hannover"
        ]
      },
      {
        "name": "Bremen",
        "score": 55
      },
      {
        "name": "Nuremberg",
        "score": 55,
        "aliases": [
          "Nürnberg"
        ]
      },
      {
        "name": "Bonn",
        "score": 55
      },
      {
        "name": "Heidelberg",
        "score": 55
      },
      {
        "name": "Freiburg",
        "score": 55
      },
      {
        "name": "Augsburg",
        "score": 55
      },
      {
        "name": "Potsdam",
        "score": 55
      },
      {
        "name": "Mainz",
        "score": 56
      },
      {
        "name": "Trier",
        "score": 56
      },
      {
        "name": "Regensburg",
        "score": 56
      },
      {
        "name": "Lubeck",
        "score": 56,
        "aliases": [
          "Lübeck"
        ]
      },
      {
        "name": "Wurzburg",
        "score": 56,
        "aliases": [
          "Würzburg"
        ]
      },
      {
        "name": "Erfurt",
        "score": 56
      },
      {
        "name": "Kiel",
        "score": 56
      },
      {
        "name": "Duisburg",
        "score": 56
      },
      {
        "name": "Bochum",
        "score": 56
      },
      {
        "name": "Wuppertal",
        "score": 56
      },
      {
        "name": "Bielefeld",
        "score": 57
      },
      {
        "name": "Münster",
        "score": 57
      },
      {
        "name": "Karlsruhe",
        "score": 57
      },
      {
        "name": "Mannheim",
        "score": 57
      },
      {
        "name": "Wiesbaden",
        "score": 57
      },
      {
        "name": "Aachen",
        "score": 57
      },
      {
        "name": "Turin",
        "score": 57,
        "aliases": [
          "Torino"
        ]
      },
      {
        "name": "Bologna",
        "score": 57
      },
      {
        "name": "Pisa",
        "score": 57
      },
      {
        "name": "Verona",
        "score": 58
      },
      {
        "name": "Genoa",
        "score": 58,
        "aliases": [
          "Genova"
        ]
      },
      {
        "name": "Palermo",
        "score": 58
      },
      {
        "name": "Bari",
        "score": 58
      },
      {
        "name": "Catania",
        "score": 58
      },
      {
        "name": "Siena",
        "score": 58
      },
      {
        "name": "Lucca",
        "score": 58
      },
      {
        "name": "Ravenna",
        "score": 58
      },
      {
        "name": "Padua",
        "score": 58,
        "aliases": [
          "Padova"
        ]
      },
      {
        "name": "Parma",
        "score": 58
      },
      {
        "name": "Modena",
        "score": 59
      },
      {
        "name": "Perugia",
        "score": 59
      },
      {
        "name": "Assisi",
        "score": 59
      },
      {
        "name": "Trieste",
        "score": 59
      },
      {
        "name": "Bergamo",
        "score": 59
      },
      {
        "name": "Ferrara",
        "score": 59
      },
      {
        "name": "Lecce",
        "score": 59
      },
      {
        "name": "Mantua",
        "score": 59,
        "aliases": [
          "Mantova"
        ]
      },
      {
        "name": "Messina",
        "score": 59
      },
      {
        "name": "Brescia",
        "score": 60
      },
      {
        "name": "Prato",
        "score": 60
      },
      {
        "name": "Reggio Calabria",
        "score": 60
      },
      {
        "name": "Reggio Emilia",
        "score": 60
      },
      {
        "name": "Livorno",
        "score": 60
      },
      {
        "name": "Cagliari",
        "score": 60
      },
      {
        "name": "Foggia",
        "score": 60
      },
      {
        "name": "Rimini",
        "score": 60
      },
      {
        "name": "Salerno",
        "score": 60
      },
      {
        "name": "Sassari",
        "score": 61
      },
      {
        "name": "Monza",
        "score": 61
      },
      {
        "name": "Valencia",
        "score": 61
      },
      {
        "name": "Seville",
        "score": 61,
        "aliases": [
          "Sevilla"
        ]
      },
      {
        "name": "Bilbao",
        "score": 61
      },
      {
        "name": "Malaga",
        "score": 61,
        "aliases": [
          "Málaga"
        ]
      },
      {
        "name": "Granada",
        "score": 61
      },
      {
        "name": "Cordoba",
        "score": 61,
        "aliases": [
          "Córdoba"
        ]
      },
      {
        "name": "Toledo",
        "score": 61
      },
      {
        "name": "Salamanca",
        "score": 61
      },
      {
        "name": "Zaragoza",
        "score": 62
      },
      {
        "name": "Alicante",
        "score": 62
      },
      {
        "name": "Murcia",
        "score": 62
      },
      {
        "name": "Valladolid",
        "score": 62
      },
      {
        "name": "Santander",
        "score": 62
      },
      {
        "name": "Pamplona",
        "score": 62
      },
      {
        "name": "San Sebastian",
        "score": 62,
        "aliases": [
          "Donostia"
        ]
      },
      {
        "name": "Santiago de Compostela",
        "score": 62
      },
      {
        "name": "Burgos",
        "score": 62
      },
      {
        "name": "Segovia",
        "score": 63
      },
      {
        "name": "Cadiz",
        "score": 63,
        "aliases": [
          "Cádiz"
        ]
      },
      {
        "name": "Girona",
        "score": 63,
        "aliases": [
          "Gerona"
        ]
      },
      {
        "name": "Tarragona",
        "score": 63
      },
      {
        "name": "Oviedo",
        "score": 63
      },
      {
        "name": "Gijon",
        "score": 63,
        "aliases": [
          "Gijón"
        ]
      },
      {
        "name": "Almeria",
        "score": 63,
        "aliases": [
          "Almería"
        ]
      },
      {
        "name": "Palma",
        "score": 63
      },
      {
        "name": "Las Palmas",
        "score": 63
      },
      {
        "name": "Vigo",
        "score": 63
      },
      {
        "name": "A Coruña",
        "score": 64
      },
      {
        "name": "Vitoria-Gasteiz",
        "score": 64
      },
      {
        "name": "Elche",
        "score": 64
      },
      {
        "name": "Badalona",
        "score": 64
      },
      {
        "name": "Cartagena",
        "score": 64
      },
      {
        "name": "Terrassa",
        "score": 64
      },
      {
        "name": "Jerez de la Frontera",
        "score": 64
      },
      {
        "name": "Sabadell",
        "score": 64
      },
      {
        "name": "Móstoles",
        "score": 64
      },
      {
        "name": "Santa Cruz de Tenerife",
        "score": 65
      },
      {
        "name": "Yokohama",
        "score": 65
      },
      {
        "name": "Hiroshima",
        "score": 65
      },
      {
        "name": "Nagasaki",
        "score": 65
      },
      {
        "name": "Sapporo",
        "score": 65
      },
      {
        "name": "Kobe",
        "score": 65
      },
      {
        "name": "Nara",
        "score": 65
      },
      {
        "name": "Nagoya",
        "score": 65
      },
      {
        "name": "Fukuoka",
        "score": 65
      },
      {
        "name": "Sendai",
        "score": 66
      },
      {
        "name": "Kanazawa",
        "score": 66
      },
      {
        "name": "Hakodate",
        "score": 66
      },
      {
        "name": "Kamakura",
        "score": 66
      },
      {
        "name": "Nikko",
        "score": 66
      },
      {
        "name": "Himeji",
        "score": 66
      },
      {
        "name": "Matsumoto",
        "score": 66
      },
      {
        "name": "Takayama",
        "score": 66
      },
      {
        "name": "Okayama",
        "score": 66
      },
      {
        "name": "Kumamoto",
        "score": 66
      },
      {
        "name": "Kagoshima",
        "score": 67
      },
      {
        "name": "Naha",
        "score": 67
      },
      {
        "name": "Beppu",
        "score": 67
      },
      {
        "name": "Matsuyama",
        "score": 67
      },
      {
        "name": "Aomori",
        "score": 67
      },
      {
        "name": "Kawasaki",
        "score": 67
      },
      {
        "name": "Saitama",
        "score": 67
      },
      {
        "name": "Chiba",
        "score": 67
      },
      {
        "name": "Kitakyushu",
        "score": 67
      },
      {
        "name": "Sakai",
        "score": 68
      },
      {
        "name": "Niigata",
        "score": 68
      },
      {
        "name": "Hamamatsu",
        "score": 68
      },
      {
        "name": "Sagamihara",
        "score": 68
      },
      {
        "name": "Shizuoka",
        "score": 68
      },
      {
        "name": "Hachioji",
        "score": 68
      },
      {
        "name": "Okinawa",
        "score": 68
      },
      {
        "name": "Fukushima",
        "score": 68
      },
      {
        "name": "Guangzhou",
        "score": 68,
        "aliases": [
          "Canton"
        ]
      },
      {
        "name": "Shenzhen",
        "score": 68
      },
      {
        "name": "Chengdu",
        "score": 69
      },
      {
        "name": "Chongqing",
        "score": 69
      },
      {
        "name": "Wuhan",
        "score": 69
      },
      {
        "name": "Nanjing",
        "score": 69,
        "aliases": [
          "Nanking"
        ]
      },
      {
        "name": "Hangzhou",
        "score": 69
      },
      {
        "name": "Xi’an",
        "score": 69,
        "aliases": [
          "Xian"
        ]
      },
      {
        "name": "Suzhou",
        "score": 69
      },
      {
        "name": "Tianjin",
        "score": 69
      },
      {
        "name": "Qingdao",
        "score": 69
      },
      {
        "name": "Dalian",
        "score": 70
      },
      {
        "name": "Xiamen",
        "score": 70,
        "aliases": [
          "Amoy"
        ]
      },
      {
        "name": "Harbin",
        "score": 70
      },
      {
        "name": "Kunming",
        "score": 70
      },
      {
        "name": "Guilin",
        "score": 70
      },
      {
        "name": "Lhasa",
        "score": 70
      },
      {
        "name": "Urumqi",
        "score": 70
      },
      {
        "name": "Lanzhou",
        "score": 70
      },
      {
        "name": "Luoyang",
        "score": 70
      },
      {
        "name": "Datong",
        "score": 70
      },
      {
        "name": "Changsha",
        "score": 71
      },
      {
        "name": "Shenyang",
        "score": 71
      },
      {
        "name": "Fuzhou",
        "score": 71
      },
      {
        "name": "Jinan",
        "score": 71
      },
      {
        "name": "Ningbo",
        "score": 71
      },
      {
        "name": "Zhengzhou",
        "score": 71
      },
      {
        "name": "Guiyang",
        "score": 71
      },
      {
        "name": "Hohhot",
        "score": 71
      },
      {
        "name": "Haikou",
        "score": 71
      },
      {
        "name": "Sanya",
        "score": 72
      },
      {
        "name": "Dunhuang",
        "score": 72
      },
      {
        "name": "Wuxi",
        "score": 72
      },
      {
        "name": "Wenzhou",
        "score": 72
      },
      {
        "name": "Dongguan",
        "score": 72
      },
      {
        "name": "Foshan",
        "score": 72
      },
      {
        "name": "Zhuhai",
        "score": 72
      },
      {
        "name": "Bengaluru",
        "score": 72,
        "aliases": [
          "Bangalore"
        ]
      },
      {
        "name": "Hyderabad",
        "score": 72
      },
      {
        "name": "Jaipur",
        "score": 73
      },
      {
        "name": "Agra",
        "score": 73
      },
      {
        "name": "Varanasi",
        "score": 73,
        "aliases": [
          "Benares",
          "Banaras"
        ]
      },
      {
        "name": "Ahmedabad",
        "score": 73
      },
      {
        "name": "Pune",
        "score": 73
      },
      {
        "name": "Lucknow",
        "score": 73
      },
      {
        "name": "Amritsar",
        "score": 73
      },
      {
        "name": "Kochi",
        "score": 73,
        "aliases": [
          "Cochin"
        ]
      },
      {
        "name": "Udaipur",
        "score": 73
      },
      {
        "name": "Jodhpur",
        "score": 73
      },
      {
        "name": "Mysuru",
        "score": 74,
        "aliases": [
          "Mysore"
        ]
      },
      {
        "name": "Madurai",
        "score": 74
      },
      {
        "name": "Bhopal",
        "score": 74
      },
      {
        "name": "Indore",
        "score": 74
      },
      {
        "name": "Surat",
        "score": 74
      },
      {
        "name": "Nagpur",
        "score": 74
      },
      {
        "name": "Patna",
        "score": 74
      },
      {
        "name": "Bhubaneswar",
        "score": 74
      },
      {
        "name": "Guwahati",
        "score": 74
      },
      {
        "name": "Shimla",
        "score": 75
      },
      {
        "name": "Srinagar",
        "score": 75
      },
      {
        "name": "Puducherry",
        "score": 75,
        "aliases": [
          "Pondicherry"
        ]
      },
      {
        "name": "Kanpur",
        "score": 75
      },
      {
        "name": "Vadodara",
        "score": 75
      },
      {
        "name": "Ludhiana",
        "score": 75
      },
      {
        "name": "Nashik",
        "score": 75
      },
      {
        "name": "Visakhapatnam",
        "score": 75,
        "aliases": [
          "Vishakhapatnam"
        ]
      },
      {
        "name": "Prayagraj",
        "score": 75,
        "aliases": [
          "Allahabad"
        ]
      },
      {
        "name": "Chandigarh",
        "score": 75
      },
      {
        "name": "Thiruvananthapuram",
        "score": 76,
        "aliases": [
          "Trivandrum"
        ]
      },
      {
        "name": "Coimbatore",
        "score": 76
      },
      {
        "name": "Panaji",
        "score": 76
      },
      {
        "name": "Brisbane",
        "score": 76
      },
      {
        "name": "Adelaide",
        "score": 76
      },
      {
        "name": "Canberra",
        "score": 76
      },
      {
        "name": "Darwin",
        "score": 76
      },
      {
        "name": "Hobart",
        "score": 76
      },
      {
        "name": "Gold Coast",
        "score": 76
      },
      {
        "name": "Cairns",
        "score": 77
      },
      {
        "name": "Wollongong",
        "score": 77
      },
      {
        "name": "Geelong",
        "score": 77
      },
      {
        "name": "Townsville",
        "score": 77
      },
      {
        "name": "Toowoomba",
        "score": 77
      },
      {
        "name": "Ballarat",
        "score": 77
      },
      {
        "name": "Bendigo",
        "score": 77
      },
      {
        "name": "Launceston",
        "score": 77
      },
      {
        "name": "Albury",
        "score": 77
      },
      {
        "name": "Wagga Wagga",
        "score": 77
      },
      {
        "name": "Mackay",
        "score": 78
      },
      {
        "name": "Rockhampton",
        "score": 78
      },
      {
        "name": "Bunbury",
        "score": 78
      },
      {
        "name": "Geraldton",
        "score": 78
      },
      {
        "name": "Bundaberg",
        "score": 78
      },
      {
        "name": "Wodonga",
        "score": 78
      },
      {
        "name": "Dubbo",
        "score": 78
      },
      {
        "name": "Orange",
        "score": 78
      },
      {
        "name": "Bathurst",
        "score": 78
      },
      {
        "name": "Tamworth",
        "score": 79
      },
      {
        "name": "Coffs Harbour",
        "score": 79
      },
      {
        "name": "Port Macquarie",
        "score": 79
      },
      {
        "name": "Albany",
        "score": 79
      },
      {
        "name": "Kalgoorlie",
        "score": 79
      },
      {
        "name": "Mount Gambier",
        "score": 79
      },
      {
        "name": "Salvador",
        "score": 79
      },
      {
        "name": "Recife",
        "score": 79
      },
      {
        "name": "Fortaleza",
        "score": 79
      },
      {
        "name": "Manaus",
        "score": 80
      },
      {
        "name": "Belo Horizonte",
        "score": 80
      },
      {
        "name": "Curitiba",
        "score": 80
      },
      {
        "name": "Porto Alegre",
        "score": 80
      },
      {
        "name": "Belem",
        "score": 80,
        "aliases": [
          "Belém"
        ]
      },
      {
        "name": "Florianopolis",
        "score": 80,
        "aliases": [
          "Florianópolis"
        ]
      },
      {
        "name": "Natal",
        "score": 80
      },
      {
        "name": "Goiania",
        "score": 80,
        "aliases": [
          "Goiânia"
        ]
      },
      {
        "name": "Campinas",
        "score": 80
      },
      {
        "name": "Santos",
        "score": 80
      },
      {
        "name": "Vitoria",
        "score": 81,
        "aliases": [
          "Vitória"
        ]
      },
      {
        "name": "Joao Pessoa",
        "score": 81,
        "aliases": [
          "João Pessoa"
        ]
      },
      {
        "name": "Maceio",
        "score": 81,
        "aliases": [
          "Maceió"
        ]
      },
      {
        "name": "Sao Luis",
        "score": 81,
        "aliases": [
          "São Luís"
        ]
      },
      {
        "name": "Cuiaba",
        "score": 81,
        "aliases": [
          "Cuiabá"
        ]
      },
      {
        "name": "Campo Grande",
        "score": 81
      },
      {
        "name": "Foz do Iguacu",
        "score": 81,
        "aliases": [
          "Foz do Iguaçu"
        ]
      },
      {
        "name": "Petropolis",
        "score": 81,
        "aliases": [
          "Petrópolis"
        ]
      },
      {
        "name": "Guarulhos",
        "score": 81
      },
      {
        "name": "Teresina",
        "score": 82
      },
      {
        "name": "Aracaju",
        "score": 82
      },
      {
        "name": "Niterói",
        "score": 82
      },
      {
        "name": "Ouro Preto",
        "score": 82
      },
      {
        "name": "Porto Seguro",
        "score": 82
      },
      {
        "name": "Cancun",
        "score": 82,
        "aliases": [
          "Cancún"
        ]
      },
      {
        "name": "Guadalajara",
        "score": 82
      },
      {
        "name": "Monterrey",
        "score": 82
      },
      {
        "name": "Tijuana",
        "score": 82
      },
      {
        "name": "Puebla",
        "score": 82
      },
      {
        "name": "Merida",
        "score": 83,
        "aliases": [
          "Mérida"
        ]
      },
      {
        "name": "Oaxaca",
        "score": 83,
        "aliases": [
          "Oaxaca de Juarez"
        ]
      },
      {
        "name": "Acapulco",
        "score": 83
      },
      {
        "name": "Veracruz",
        "score": 83
      },
      {
        "name": "Puerto Vallarta",
        "score": 83
      },
      {
        "name": "Mazatlan",
        "score": 83,
        "aliases": [
          "Mazatlán"
        ]
      },
      {
        "name": "Guanajuato",
        "score": 83
      },
      {
        "name": "Queretaro",
        "score": 83,
        "aliases": [
          "Querétaro",
          "Santiago de Querétaro"
        ]
      },
      {
        "name": "San Miguel de Allende",
        "score": 83
      },
      {
        "name": "Morelia",
        "score": 84
      },
      {
        "name": "Zacatecas",
        "score": 84
      },
      {
        "name": "Chihuahua",
        "score": 84
      },
      {
        "name": "Ciudad Juarez",
        "score": 84,
        "aliases": [
          "Ciudad Juárez"
        ]
      },
      {
        "name": "Hermosillo",
        "score": 84
      },
      {
        "name": "Durango",
        "score": 84
      },
      {
        "name": "Toluca",
        "score": 84
      },
      {
        "name": "Campeche",
        "score": 84
      },
      {
        "name": "San Luis Potosi",
        "score": 84,
        "aliases": [
          "San Luis Potosí"
        ]
      },
      {
        "name": "León",
        "score": 85
      },
      {
        "name": "Zapopan",
        "score": 85
      },
      {
        "name": "Aguascalientes",
        "score": 85
      },
      {
        "name": "Culiacán",
        "score": 85
      },
      {
        "name": "Xalapa",
        "score": 85
      },
      {
        "name": "San Cristóbal de las Casas",
        "score": 85
      },
      {
        "name": "Playa del Carmen",
        "score": 85
      },
      {
        "name": "Cabo San Lucas",
        "score": 85
      },
      {
        "name": "Giza",
        "score": 85
      },
      {
        "name": "Luxor",
        "score": 85
      },
      {
        "name": "Aswan",
        "score": 86
      },
      {
        "name": "Port Said",
        "score": 86
      },
      {
        "name": "Suez",
        "score": 86
      },
      {
        "name": "Ismailia",
        "score": 86
      },
      {
        "name": "Hurghada",
        "score": 86
      },
      {
        "name": "Sharm el Sheikh",
        "score": 86
      },
      {
        "name": "Mansoura",
        "score": 86
      },
      {
        "name": "Tanta",
        "score": 86
      },
      {
        "name": "Zagazig",
        "score": 86
      },
      {
        "name": "Damietta",
        "score": 87
      },
      {
        "name": "Damanhur",
        "score": 87
      },
      {
        "name": "Faiyum",
        "score": 87,
        "aliases": [
          "Fayoum"
        ]
      },
      {
        "name": "Minya",
        "score": 87
      },
      {
        "name": "Asyut",
        "score": 87,
        "aliases": [
          "Assiut"
        ]
      },
      {
        "name": "Beni Suef",
        "score": 87
      },
      {
        "name": "Qena",
        "score": 87
      },
      {
        "name": "Sohag",
        "score": 87
      },
      {
        "name": "Arish",
        "score": 87
      },
      {
        "name": "Marsa Matruh",
        "score": 87
      },
      {
        "name": "Rosetta",
        "score": 88,
        "aliases": [
          "Rashid"
        ]
      },
      {
        "name": "Dahab",
        "score": 88
      },
      {
        "name": "El Alamein",
        "score": 88
      },
      {
        "name": "Surabaya",
        "score": 88
      },
      {
        "name": "Bandung",
        "score": 88
      },
      {
        "name": "Yogyakarta",
        "score": 88,
        "aliases": [
          "Jogjakarta"
        ]
      },
      {
        "name": "Medan",
        "score": 88
      },
      {
        "name": "Semarang",
        "score": 88
      },
      {
        "name": "Makassar",
        "score": 88
      },
      {
        "name": "Denpasar",
        "score": 89
      },
      {
        "name": "Palembang",
        "score": 89
      },
      {
        "name": "Malang",
        "score": 89
      },
      {
        "name": "Bogor",
        "score": 89
      },
      {
        "name": "Surakarta",
        "score": 89,
        "aliases": [
          "Solo"
        ]
      },
      {
        "name": "Padang",
        "score": 89
      },
      {
        "name": "Manado",
        "score": 89
      },
      {
        "name": "Pontianak",
        "score": 89
      },
      {
        "name": "Banjarmasin",
        "score": 89
      },
      {
        "name": "Balikpapan",
        "score": 89
      },
      {
        "name": "Samarinda",
        "score": 90
      },
      {
        "name": "Pekanbaru",
        "score": 90
      },
      {
        "name": "Banda Aceh",
        "score": 90
      },
      {
        "name": "Ambon",
        "score": 90
      },
      {
        "name": "Jayapura",
        "score": 90
      },
      {
        "name": "Kupang",
        "score": 90
      },
      {
        "name": "Depok",
        "score": 90
      },
      {
        "name": "Tangerang",
        "score": 90
      },
      {
        "name": "Bekasi",
        "score": 90
      },
      {
        "name": "Batam",
        "score": 91
      },
      {
        "name": "Bandar Lampung",
        "score": 91
      },
      {
        "name": "Mataram",
        "score": 91
      },
      {
        "name": "Cirebon",
        "score": 91
      },
      {
        "name": "Bengkulu",
        "score": 91
      },
      {
        "name": "Jambi",
        "score": 91
      },
      {
        "name": "Palu",
        "score": 91
      },
      {
        "name": "Quezon City",
        "score": 91
      },
      {
        "name": "Cebu City",
        "score": 91,
        "aliases": [
          "Cebu"
        ]
      },
      {
        "name": "Davao City",
        "score": 92,
        "aliases": [
          "Davao"
        ]
      },
      {
        "name": "Baguio",
        "score": 92
      },
      {
        "name": "Makati",
        "score": 92
      },
      {
        "name": "Pasig",
        "score": 92
      },
      {
        "name": "Taguig",
        "score": 92
      },
      {
        "name": "Pasay",
        "score": 92
      },
      {
        "name": "Bacolod",
        "score": 92
      },
      {
        "name": "Iloilo City",
        "score": 92,
        "aliases": [
          "Iloilo"
        ]
      },
      {
        "name": "Cagayan de Oro",
        "score": 92
      },
      {
        "name": "Zamboanga City",
        "score": 92,
        "aliases": [
          "Zamboanga"
        ]
      },
      {
        "name": "Dumaguete",
        "score": 93
      },
      {
        "name": "Tacloban",
        "score": 93
      },
      {
        "name": "Vigan",
        "score": 93
      },
      {
        "name": "Laoag",
        "score": 93
      },
      {
        "name": "Legazpi",
        "score": 93
      },
      {
        "name": "Puerto Princesa",
        "score": 93
      },
      {
        "name": "General Santos",
        "score": 93
      },
      {
        "name": "Butuan",
        "score": 93
      },
      {
        "name": "Iligan",
        "score": 93
      },
      {
        "name": "Tagaytay",
        "score": 94
      },
      {
        "name": "Angeles",
        "score": 94
      },
      {
        "name": "Antipolo",
        "score": 94
      },
      {
        "name": "Caloocan",
        "score": 94
      },
      {
        "name": "Parañaque",
        "score": 94
      },
      {
        "name": "Muntinlupa",
        "score": 94
      },
      {
        "name": "Las Piñas",
        "score": 94
      },
      {
        "name": "Naga",
        "score": 94
      },
      {
        "name": "Batangas",
        "score": 94
      },
      {
        "name": "San Fernando",
        "score": 94
      },
      {
        "name": "Rosario",
        "score": 95
      },
      {
        "name": "Mendoza",
        "score": 95
      },
      {
        "name": "Ushuaia",
        "score": 95
      },
      {
        "name": "La Plata",
        "score": 95
      },
      {
        "name": "Mar del Plata",
        "score": 95
      },
      {
        "name": "Salta",
        "score": 95
      },
      {
        "name": "San Miguel de Tucuman",
        "score": 95,
        "aliases": [
          "Tucuman"
        ]
      },
      {
        "name": "Santa Fe",
        "score": 95
      },
      {
        "name": "San Juan",
        "score": 95
      },
      {
        "name": "Neuquen",
        "score": 96,
        "aliases": [
          "Neuquén"
        ]
      },
      {
        "name": "Bahia Blanca",
        "score": 96,
        "aliases": [
          "Bahía Blanca"
        ]
      },
      {
        "name": "San Carlos de Bariloche",
        "score": 96,
        "aliases": [
          "Bariloche"
        ]
      },
      {
        "name": "Posadas",
        "score": 96
      },
      {
        "name": "Resistencia",
        "score": 96
      },
      {
        "name": "Corrientes",
        "score": 96
      },
      {
        "name": "Parana",
        "score": 96,
        "aliases": [
          "Paraná"
        ]
      },
      {
        "name": "San Salvador de Jujuy",
        "score": 96
      },
      {
        "name": "Comodoro Rivadavia",
        "score": 96
      },
      {
        "name": "Rio Gallegos",
        "score": 96,
        "aliases": [
          "Río Gallegos"
        ]
      },
      {
        "name": "Puerto Madryn",
        "score": 97
      },
      {
        "name": "Santiago del Estero",
        "score": 97
      },
      {
        "name": "Formosa",
        "score": 97
      },
      {
        "name": "San Luis",
        "score": 97
      },
      {
        "name": "La Rioja",
        "score": 97
      },
      {
        "name": "San Fernando del Valle de Catamarca",
        "score": 97
      },
      {
        "name": "Trelew",
        "score": 97
      },
      {
        "name": "Tandil",
        "score": 97
      },
      {
        "name": "Valparaiso",
        "score": 97,
        "aliases": [
          "Valparaíso"
        ]
      },
      {
        "name": "Vina del Mar",
        "score": 98,
        "aliases": [
          "Viña del Mar"
        ]
      },
      {
        "name": "Concepcion",
        "score": 98,
        "aliases": [
          "Concepción"
        ]
      },
      {
        "name": "Punta Arenas",
        "score": 98
      },
      {
        "name": "Antofagasta",
        "score": 98
      },
      {
        "name": "Valdivia",
        "score": 98
      },
      {
        "name": "La Serena",
        "score": 98
      },
      {
        "name": "Iquique",
        "score": 98
      },
      {
        "name": "Arica",
        "score": 98
      },
      {
        "name": "Puerto Montt",
        "score": 98
      },
      {
        "name": "Temuco",
        "score": 99
      },
      {
        "name": "Talca",
        "score": 99
      },
      {
        "name": "Chillan",
        "score": 99,
        "aliases": [
          "Chillán"
        ]
      },
      {
        "name": "Rancagua",
        "score": 99
      },
      {
        "name": "Copiapo",
        "score": 99,
        "aliases": [
          "Copiapó"
        ]
      },
      {
        "name": "Osorno",
        "score": 99
      },
      {
        "name": "Coyhaique",
        "score": 99
      },
      {
        "name": "Puerto Natales",
        "score": 99
      },
      {
        "name": "Castro",
        "score": 99
      },
      {
        "name": "Curico",
        "score": 99,
        "aliases": [
          "Curicó"
        ]
      },
      {
        "name": "Ovalle",
        "score": 100
      },
      {
        "name": "Coquimbo",
        "score": 100
      },
      {
        "name": "Calama",
        "score": 100
      },
      {
        "name": "Quillota",
        "score": 100
      },
      {
        "name": "Puerto Varas",
        "score": 100
      },
      {
        "name": "Prince Rupert",
        "score": 49
      },
      {
        "name": "Revelstoke",
        "score": 52
      },
      {
        "name": "Nelson",
        "score": 55
      },
      {
        "name": "Penticton",
        "score": 57
      },
      {
        "name": "Vernon",
        "score": 60
      },
      {
        "name": "Chilliwack",
        "score": 63
      },
      {
        "name": "Langley",
        "score": 69
      },
      {
        "name": "New Westminster",
        "score": 72
      },
      {
        "name": "Port Moody",
        "score": 77
      },
      {
        "name": "Courtenay",
        "score": 80
      },
      {
        "name": "Fernie",
        "score": 86
      },
      {
        "name": "Terrace",
        "score": 94
      },
      {
        "name": "Port Coquitlam",
        "score": 40
      },
      {
        "name": "North Vancouver",
        "score": 40
      },
      {
        "name": "White Rock",
        "score": 40
      },
      {
        "name": "Delta",
        "score": 40
      },
      {
        "name": "Maple Ridge",
        "score": 40
      },
      {
        "name": "Pitt Meadows",
        "score": 56
      },
      {
        "name": "Castlegar",
        "score": 57
      },
      {
        "name": "Trail",
        "score": 57
      },
      {
        "name": "Cranbrook",
        "score": 40
      },
      {
        "name": "Parksville",
        "score": 40
      },
      {
        "name": "Campbell River",
        "score": 40
      },
      {
        "name": "Port Alberni",
        "score": 40
      },
      {
        "name": "Duncan",
        "score": 40
      },
      {
        "name": "Fort St John",
        "score": 40
      },
      {
        "name": "Dawson Creek",
        "score": 40
      },
      {
        "name": "Quesnel",
        "score": 60
      },
      {
        "name": "Williams Lake",
        "score": 60
      },
      {
        "name": "Powell River",
        "score": 61
      },
      {
        "name": "Rossland",
        "score": 61
      }
    ],
    "rejectedInputs": [
      "Canada",
      "Sahara"
    ]
  },
  {
    "id": "play-world-languages",
    "category": "world",
    "prompt": "Name a language spoken by people.",
    "answers": [
      {
        "name": "English",
        "score": 12,
        "aliases": []
      },
      {
        "name": "French",
        "score": 12,
        "aliases": []
      },
      {
        "name": "Spanish",
        "score": 13,
        "aliases": []
      },
      {
        "name": "Mandarin",
        "score": 13,
        "aliases": [
          "Mandarin Chinese"
        ]
      },
      {
        "name": "Arabic",
        "score": 14,
        "aliases": []
      },
      {
        "name": "Hindi",
        "score": 14,
        "aliases": []
      },
      {
        "name": "Portuguese",
        "score": 14,
        "aliases": []
      },
      {
        "name": "Russian",
        "score": 15,
        "aliases": []
      },
      {
        "name": "Japanese",
        "score": 15,
        "aliases": []
      },
      {
        "name": "German",
        "score": 16,
        "aliases": []
      },
      {
        "name": "Italian",
        "score": 16,
        "aliases": []
      },
      {
        "name": "Korean",
        "score": 16,
        "aliases": []
      },
      {
        "name": "Bengali",
        "score": 17,
        "aliases": [
          "Bangla"
        ]
      },
      {
        "name": "Turkish",
        "score": 17,
        "aliases": []
      },
      {
        "name": "Vietnamese",
        "score": 18,
        "aliases": []
      },
      {
        "name": "Urdu",
        "score": 18,
        "aliases": []
      },
      {
        "name": "Swahili",
        "score": 18,
        "aliases": [
          "Kiswahili"
        ]
      },
      {
        "name": "Greek",
        "score": 19,
        "aliases": []
      },
      {
        "name": "Dutch",
        "score": 19,
        "aliases": []
      },
      {
        "name": "Polish",
        "score": 19,
        "aliases": []
      },
      {
        "name": "Swedish",
        "score": 20,
        "aliases": []
      },
      {
        "name": "Thai",
        "score": 20,
        "aliases": []
      },
      {
        "name": "Hebrew",
        "score": 21,
        "aliases": []
      },
      {
        "name": "Persian",
        "score": 21,
        "aliases": [
          "Farsi"
        ]
      },
      {
        "name": "Tamil",
        "score": 21,
        "aliases": []
      },
      {
        "name": "Punjabi",
        "score": 22,
        "aliases": [
          "Panjabi"
        ]
      },
      {
        "name": "Gujarati",
        "score": 22,
        "aliases": []
      },
      {
        "name": "Marathi",
        "score": 23,
        "aliases": []
      },
      {
        "name": "Telugu",
        "score": 23,
        "aliases": []
      },
      {
        "name": "Kannada",
        "score": 23,
        "aliases": []
      },
      {
        "name": "Malayalam",
        "score": 24,
        "aliases": []
      },
      {
        "name": "Sinhala",
        "score": 24,
        "aliases": [
          "Sinhalese"
        ]
      },
      {
        "name": "Nepali",
        "score": 25,
        "aliases": []
      },
      {
        "name": "Burmese",
        "score": 25,
        "aliases": []
      },
      {
        "name": "Khmer",
        "score": 25,
        "aliases": []
      },
      {
        "name": "Lao",
        "score": 26,
        "aliases": []
      },
      {
        "name": "Indonesian",
        "score": 26,
        "aliases": [
          "Bahasa Indonesia"
        ]
      },
      {
        "name": "Malay",
        "score": 27,
        "aliases": [
          "Bahasa Melayu"
        ]
      },
      {
        "name": "Tagalog",
        "score": 27,
        "aliases": []
      },
      {
        "name": "Cebuano",
        "score": 27,
        "aliases": []
      },
      {
        "name": "Javanese",
        "score": 28,
        "aliases": []
      },
      {
        "name": "Sundanese",
        "score": 28,
        "aliases": []
      },
      {
        "name": "Finnish",
        "score": 29,
        "aliases": []
      },
      {
        "name": "Norwegian",
        "score": 29,
        "aliases": []
      },
      {
        "name": "Danish",
        "score": 29,
        "aliases": []
      },
      {
        "name": "Icelandic",
        "score": 30,
        "aliases": []
      },
      {
        "name": "Irish",
        "score": 30,
        "aliases": [
          "Irish Gaelic"
        ]
      },
      {
        "name": "Welsh",
        "score": 30,
        "aliases": []
      },
      {
        "name": "Scottish Gaelic",
        "score": 31,
        "aliases": []
      },
      {
        "name": "Breton",
        "score": 31,
        "aliases": []
      },
      {
        "name": "Basque",
        "score": 32,
        "aliases": []
      },
      {
        "name": "Catalan",
        "score": 32,
        "aliases": []
      },
      {
        "name": "Galician",
        "score": 32,
        "aliases": []
      },
      {
        "name": "Romanian",
        "score": 33,
        "aliases": []
      },
      {
        "name": "Hungarian",
        "score": 33,
        "aliases": []
      },
      {
        "name": "Czech",
        "score": 34,
        "aliases": []
      },
      {
        "name": "Slovak",
        "score": 34,
        "aliases": []
      },
      {
        "name": "Slovenian",
        "score": 34,
        "aliases": [
          "Slovene"
        ]
      },
      {
        "name": "Croatian",
        "score": 35,
        "aliases": []
      },
      {
        "name": "Serbian",
        "score": 35,
        "aliases": []
      },
      {
        "name": "Bosnian",
        "score": 36,
        "aliases": []
      },
      {
        "name": "Albanian",
        "score": 36,
        "aliases": []
      },
      {
        "name": "Bulgarian",
        "score": 36,
        "aliases": []
      },
      {
        "name": "Macedonian",
        "score": 37,
        "aliases": []
      },
      {
        "name": "Ukrainian",
        "score": 37,
        "aliases": []
      },
      {
        "name": "Belarusian",
        "score": 38,
        "aliases": []
      },
      {
        "name": "Lithuanian",
        "score": 38,
        "aliases": []
      },
      {
        "name": "Latvian",
        "score": 38,
        "aliases": []
      },
      {
        "name": "Estonian",
        "score": 39,
        "aliases": []
      },
      {
        "name": "Georgian",
        "score": 39,
        "aliases": []
      },
      {
        "name": "Armenian",
        "score": 40,
        "aliases": []
      },
      {
        "name": "Azerbaijani",
        "score": 40,
        "aliases": [
          "Azeri"
        ]
      },
      {
        "name": "Kazakh",
        "score": 40,
        "aliases": []
      },
      {
        "name": "Uzbek",
        "score": 41,
        "aliases": []
      },
      {
        "name": "Mongolian",
        "score": 41,
        "aliases": []
      },
      {
        "name": "Kurdish",
        "score": 41,
        "aliases": []
      },
      {
        "name": "Pashto",
        "score": 42,
        "aliases": []
      },
      {
        "name": "Somali",
        "score": 42,
        "aliases": []
      },
      {
        "name": "Amharic",
        "score": 43,
        "aliases": []
      },
      {
        "name": "Hausa",
        "score": 43,
        "aliases": []
      },
      {
        "name": "Yoruba",
        "score": 43,
        "aliases": []
      },
      {
        "name": "Igbo",
        "score": 44,
        "aliases": []
      },
      {
        "name": "Zulu",
        "score": 44,
        "aliases": [
          "isiZulu"
        ]
      },
      {
        "name": "Xhosa",
        "score": 45,
        "aliases": [
          "isiXhosa"
        ]
      },
      {
        "name": "Afrikaans",
        "score": 45
      },
      {
        "name": "Maori",
        "score": 45,
        "aliases": [
          "Māori"
        ]
      },
      {
        "name": "Hawaiian",
        "score": 46
      },
      {
        "name": "Samoan",
        "score": 46
      },
      {
        "name": "Tongan",
        "score": 47
      },
      {
        "name": "Fijian",
        "score": 47
      },
      {
        "name": "Navajo",
        "score": 47,
        "aliases": [
          "Dine Bizaad"
        ]
      },
      {
        "name": "Cree",
        "score": 48,
        "aliases": []
      },
      {
        "name": "Inuktitut",
        "score": 48,
        "aliases": []
      },
      {
        "name": "Quechua",
        "score": 49,
        "aliases": []
      },
      {
        "name": "Aymara",
        "score": 49,
        "aliases": []
      },
      {
        "name": "Guarani",
        "score": 49,
        "aliases": [
          "Guaraní"
        ]
      },
      {
        "name": "Nahuatl",
        "score": 50,
        "aliases": []
      },
      {
        "name": "Esperanto",
        "score": 50
      },
      {
        "name": "Latin",
        "score": 51
      },
      {
        "name": "Sanskrit",
        "score": 51,
        "aliases": []
      },
      {
        "name": "Maltese",
        "score": 51
      },
      {
        "name": "Sami",
        "score": 52,
        "aliases": [
          "Saami"
        ]
      },
      {
        "name": "Faroese",
        "score": 52
      },
      {
        "name": "Cornish",
        "score": 52
      },
      {
        "name": "Manx",
        "score": 53
      },
      {
        "name": "Occitan",
        "score": 53
      },
      {
        "name": "Romansh",
        "score": 54
      },
      {
        "name": "Montenegrin",
        "score": 54
      },
      {
        "name": "Yiddish",
        "score": 54
      },
      {
        "name": "Ladin",
        "score": 55
      },
      {
        "name": "Friulian",
        "score": 55
      },
      {
        "name": "Sardinian",
        "score": 56
      },
      {
        "name": "Corsican",
        "score": 56
      },
      {
        "name": "Sicilian",
        "score": 56
      },
      {
        "name": "Frisian",
        "score": 57
      },
      {
        "name": "Low German",
        "score": 57
      },
      {
        "name": "Scots",
        "score": 58
      },
      {
        "name": "Luxembourgish",
        "score": 58
      },
      {
        "name": "Oromo",
        "score": 58
      },
      {
        "name": "Shona",
        "score": 59
      },
      {
        "name": "Kinyarwanda",
        "score": 59
      },
      {
        "name": "Kirundi",
        "score": 60
      },
      {
        "name": "Luganda",
        "score": 60
      },
      {
        "name": "Lingala",
        "score": 60
      },
      {
        "name": "Wolof",
        "score": 61
      },
      {
        "name": "Fula",
        "score": 61,
        "aliases": [
          "Fulani"
        ]
      },
      {
        "name": "Bambara",
        "score": 62
      },
      {
        "name": "Twi",
        "score": 62
      },
      {
        "name": "Ewe",
        "score": 62
      },
      {
        "name": "Akan",
        "score": 63
      },
      {
        "name": "Sesotho",
        "score": 63,
        "aliases": [
          "Sotho"
        ]
      },
      {
        "name": "Setswana",
        "score": 63,
        "aliases": [
          "Tswana"
        ]
      },
      {
        "name": "Tigrinya",
        "score": 64
      },
      {
        "name": "Tamazight",
        "score": 64,
        "aliases": [
          "Berber"
        ]
      },
      {
        "name": "Malagasy",
        "score": 65
      },
      {
        "name": "Chichewa",
        "score": 65,
        "aliases": [
          "Nyanja",
          "Chewa"
        ]
      },
      {
        "name": "Mandinka",
        "score": 65
      },
      {
        "name": "Ga",
        "score": 66
      },
      {
        "name": "Kikuyu",
        "score": 66,
        "aliases": [
          "Gikuyu"
        ]
      },
      {
        "name": "Kamba",
        "score": 67
      },
      {
        "name": "Luo",
        "score": 67
      },
      {
        "name": "Kikongo",
        "score": 67
      },
      {
        "name": "Tshiluba",
        "score": 68
      },
      {
        "name": "Ndebele",
        "score": 68
      },
      {
        "name": "Northern Sotho",
        "score": 69,
        "aliases": [
          "Sepedi"
        ]
      },
      {
        "name": "Tsonga",
        "score": 69
      },
      {
        "name": "Venda",
        "score": 69
      },
      {
        "name": "Swati",
        "score": 70,
        "aliases": [
          "siSwati"
        ]
      },
      {
        "name": "Kabyle",
        "score": 70
      },
      {
        "name": "Tamasheq",
        "score": 71
      },
      {
        "name": "Coptic",
        "score": 71
      },
      {
        "name": "Kanuri",
        "score": 71
      },
      {
        "name": "Dinka",
        "score": 72
      },
      {
        "name": "Nuer",
        "score": 72
      },
      {
        "name": "Tibetan",
        "score": 73
      },
      {
        "name": "Dzongkha",
        "score": 73
      },
      {
        "name": "Cantonese",
        "score": 73,
        "aliases": [
          "Yue"
        ]
      },
      {
        "name": "Hokkien",
        "score": 74
      },
      {
        "name": "Hakka",
        "score": 74
      },
      {
        "name": "Shanghainese",
        "score": 74
      },
      {
        "name": "Balinese",
        "score": 75
      },
      {
        "name": "Filipino",
        "score": 75
      },
      {
        "name": "Ilocano",
        "score": 76
      },
      {
        "name": "Odia",
        "score": 76,
        "aliases": [
          "Oriya"
        ]
      },
      {
        "name": "Assamese",
        "score": 76,
        "aliases": []
      },
      {
        "name": "Dhivehi",
        "score": 77
      },
      {
        "name": "Uyghur",
        "score": 77
      },
      {
        "name": "Kyrgyz",
        "score": 78
      },
      {
        "name": "Turkmen",
        "score": 78
      },
      {
        "name": "Tajik",
        "score": 78
      },
      {
        "name": "Dari",
        "score": 79
      },
      {
        "name": "Aramaic",
        "score": 79
      },
      {
        "name": "Cherokee",
        "score": 80
      },
      {
        "name": "Ojibwe",
        "score": 80,
        "aliases": [
          "Anishinaabemowin",
          "Ojibway"
        ]
      },
      {
        "name": "Mohawk",
        "score": 80,
        "aliases": [
          "Kanien’kéha"
        ]
      },
      {
        "name": "Haida",
        "score": 81
      },
      {
        "name": "Tlingit",
        "score": 81
      },
      {
        "name": "Innu",
        "score": 82,
        "aliases": [
          "Innu-aimun"
        ]
      },
      {
        "name": "Mi’kmaq",
        "score": 82
      },
      {
        "name": "Blackfoot",
        "score": 82,
        "aliases": [
          "Siksika"
        ]
      },
      {
        "name": "Lakota",
        "score": 83
      },
      {
        "name": "Dakota",
        "score": 83
      },
      {
        "name": "Hopi",
        "score": 84
      },
      {
        "name": "Zuni",
        "score": 84
      },
      {
        "name": "Yucatec Maya",
        "score": 84
      },
      {
        "name": "Kiche",
        "score": 85,
        "aliases": [
          "K’iche’"
        ]
      },
      {
        "name": "Mapudungun",
        "score": 85,
        "aliases": [
          "Mapuche"
        ]
      },
      {
        "name": "Inuvialuktun",
        "score": 85
      },
      {
        "name": "Gitxsan",
        "score": 86
      },
      {
        "name": "Halkomelem",
        "score": 86,
        "aliases": [
          "hən̓q̓əmin̓əm̓"
        ]
      },
      {
        "name": "Squamish",
        "score": 87,
        "aliases": [
          "Skwxwu7mesh snichim"
        ]
      },
      {
        "name": "Dene Suline",
        "score": 87,
        "aliases": [
          "Chipewyan"
        ]
      },
      {
        "name": "Slavey",
        "score": 87
      },
      {
        "name": "Tłı̨chǫ",
        "score": 88,
        "aliases": [
          "Dogrib"
        ]
      },
      {
        "name": "Gwich’in",
        "score": 88,
        "aliases": [
          "Gwichin"
        ]
      },
      {
        "name": "Tsimshian",
        "score": 89,
        "aliases": [
          "Sm’algyax"
        ]
      },
      {
        "name": "Kwak’wala",
        "score": 89
      },
      {
        "name": "Nuu-chah-nulth",
        "score": 89
      },
      {
        "name": "SENĆOŦEN",
        "score": 90,
        "aliases": [
          "Sencoten"
        ]
      },
      {
        "name": "Okanagan",
        "score": 90,
        "aliases": [
          "Nsyilxcen"
        ]
      },
      {
        "name": "Secwepemctsin",
        "score": 91,
        "aliases": [
          "Shuswap"
        ]
      },
      {
        "name": "Ktunaxa",
        "score": 91,
        "aliases": [
          "Kutenai"
        ]
      },
      {
        "name": "Oneida",
        "score": 91
      },
      {
        "name": "Maliseet",
        "score": 92,
        "aliases": [
          "Wolastoqey"
        ]
      },
      {
        "name": "Passamaquoddy",
        "score": 92
      },
      {
        "name": "Nakota",
        "score": 93
      },
      {
        "name": "Cheyenne",
        "score": 93
      },
      {
        "name": "Arapaho",
        "score": 93
      },
      {
        "name": "Comanche",
        "score": 94
      },
      {
        "name": "Choctaw",
        "score": 94
      },
      {
        "name": "Chickasaw",
        "score": 95
      },
      {
        "name": "Muscogee",
        "score": 95,
        "aliases": [
          "Creek"
        ]
      },
      {
        "name": "Wayuu",
        "score": 95
      },
      {
        "name": "Garifuna",
        "score": 96
      },
      {
        "name": "Taíno",
        "score": 96,
        "aliases": [
          "Taino"
        ]
      },
      {
        "name": "Inupiaq",
        "score": 96
      },
      {
        "name": "Aleut",
        "score": 97,
        "aliases": [
          "Unangam Tunuu"
        ]
      },
      {
        "name": "Kashmiri",
        "score": 97
      },
      {
        "name": "Konkani",
        "score": 98
      },
      {
        "name": "Sindhi",
        "score": 98
      },
      {
        "name": "Manipuri",
        "score": 98,
        "aliases": [
          "Meitei"
        ]
      },
      {
        "name": "Bodo",
        "score": 99
      },
      {
        "name": "Dogri",
        "score": 99
      },
      {
        "name": "Maithili",
        "score": 100
      },
      {
        "name": "Santali",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "Canada",
      "Cyrillic"
    ]
  },
  {
    "id": "play-world-landmarks",
    "category": "world",
    "prompt": "Name a named natural or built landmark anywhere in the world.",
    "answers": [
      {
        "name": "Eiffel Tower",
        "score": 12
      },
      {
        "name": "Great Wall of China",
        "score": 13,
        "aliases": [
          "Great Wall"
        ]
      },
      {
        "name": "Statue of Liberty",
        "score": 15
      },
      {
        "name": "Taj Mahal",
        "score": 16
      },
      {
        "name": "Big Ben",
        "score": 18
      },
      {
        "name": "Sydney Opera House",
        "score": 19
      },
      {
        "name": "CN Tower",
        "score": 20
      },
      {
        "name": "Golden Gate Bridge",
        "score": 22
      },
      {
        "name": "Tower Bridge",
        "score": 23
      },
      {
        "name": "Colosseum",
        "score": 25,
        "aliases": [
          "Coliseum"
        ]
      },
      {
        "name": "Leaning Tower of Pisa",
        "score": 26,
        "aliases": [
          "Tower of Pisa"
        ]
      },
      {
        "name": "Pyramids of Giza",
        "score": 27,
        "aliases": [
          "Giza Pyramids"
        ]
      },
      {
        "name": "Great Pyramid of Giza",
        "score": 29,
        "aliases": [
          "Great Pyramid"
        ]
      },
      {
        "name": "Sphinx",
        "score": 30,
        "aliases": [
          "Great Sphinx of Giza"
        ]
      },
      {
        "name": "Stonehenge",
        "score": 32
      },
      {
        "name": "Machu Picchu",
        "score": 33
      },
      {
        "name": "Christ the Redeemer",
        "score": 34
      },
      {
        "name": "Mount Rushmore",
        "score": 36
      },
      {
        "name": "Empire State Building",
        "score": 37
      },
      {
        "name": "Burj Khalifa",
        "score": 39
      },
      {
        "name": "Petronas Towers",
        "score": 40,
        "aliases": [
          "Petronas Twin Towers"
        ]
      },
      {
        "name": "Tokyo Tower",
        "score": 41
      },
      {
        "name": "Tokyo Skytree",
        "score": 43
      },
      {
        "name": "Sagrada Familia",
        "score": 44
      },
      {
        "name": "Louvre",
        "score": 46
      },
      {
        "name": "Notre Dame",
        "score": 47,
        "aliases": [
          "Notre Dame de Paris"
        ]
      },
      {
        "name": "Arc de Triomphe",
        "score": 48
      },
      {
        "name": "Buckingham Palace",
        "score": 50
      },
      {
        "name": "Tower of London",
        "score": 51
      },
      {
        "name": "London Eye",
        "score": 53
      },
      {
        "name": "Edinburgh Castle",
        "score": 54
      },
      {
        "name": "Windsor Castle",
        "score": 55
      },
      {
        "name": "Neuschwanstein Castle",
        "score": 57
      },
      {
        "name": "Brandenburg Gate",
        "score": 58
      },
      {
        "name": "Berlin Wall",
        "score": 59
      },
      {
        "name": "Acropolis",
        "score": 61
      },
      {
        "name": "Parthenon",
        "score": 62
      },
      {
        "name": "St Peter’s Basilica",
        "score": 64,
        "aliases": [
          "Saint Peter’s Basilica"
        ]
      },
      {
        "name": "Trevi Fountain",
        "score": 65
      },
      {
        "name": "Angkor Wat",
        "score": 66
      },
      {
        "name": "Borobudur",
        "score": 68
      },
      {
        "name": "Petra",
        "score": 69
      },
      {
        "name": "Hagia Sophia",
        "score": 71
      },
      {
        "name": "Blue Mosque",
        "score": 72
      },
      {
        "name": "Grand Canyon",
        "score": 73
      },
      {
        "name": "Niagara Falls",
        "score": 75
      },
      {
        "name": "Victoria Falls",
        "score": 76
      },
      {
        "name": "Iguazu Falls",
        "score": 78,
        "aliases": [
          "Iguaçu Falls"
        ]
      },
      {
        "name": "Mount Everest",
        "score": 79
      },
      {
        "name": "Mount Fuji",
        "score": 80
      },
      {
        "name": "Uluru",
        "score": 82,
        "aliases": [
          "Ayers Rock"
        ]
      },
      {
        "name": "Great Barrier Reef",
        "score": 83
      },
      {
        "name": "Table Mountain",
        "score": 85
      },
      {
        "name": "Matterhorn",
        "score": 86
      },
      {
        "name": "Kilimanjaro",
        "score": 87,
        "aliases": [
          "Mount Kilimanjaro"
        ]
      },
      {
        "name": "Dead Sea",
        "score": 89
      },
      {
        "name": "Easter Island Moai",
        "score": 90,
        "aliases": [
          "Moai"
        ]
      },
      {
        "name": "Chichen Itza",
        "score": 92,
        "aliases": [
          "Chichén Itzá"
        ]
      },
      {
        "name": "Alhambra",
        "score": 93
      },
      {
        "name": "Mont Saint Michel",
        "score": 94
      },
      {
        "name": "Giant’s Causeway",
        "score": 96
      },
      {
        "name": "Cliffs of Moher",
        "score": 97
      },
      {
        "name": "Geysir",
        "score": 99
      },
      {
        "name": "Salar de Uyuni",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "sofa",
      "grocery store"
    ]
  },
  {
    "id": "play-world-town-places",
    "category": "world",
    "prompt": "Name a type of building or public place found in a town or city.",
    "answers": [
      {
        "name": "house",
        "score": 12
      },
      {
        "name": "school",
        "score": 14
      },
      {
        "name": "hospital",
        "score": 16
      },
      {
        "name": "shop",
        "score": 18,
        "aliases": [
          "store"
        ]
      },
      {
        "name": "restaurant",
        "score": 20
      },
      {
        "name": "park",
        "score": 22
      },
      {
        "name": "museum",
        "score": 23
      },
      {
        "name": "library",
        "score": 25
      },
      {
        "name": "bank",
        "score": 27
      },
      {
        "name": "church",
        "score": 29
      },
      {
        "name": "mosque",
        "score": 31
      },
      {
        "name": "temple",
        "score": 33
      },
      {
        "name": "synagogue",
        "score": 35
      },
      {
        "name": "fire station",
        "score": 37
      },
      {
        "name": "police station",
        "score": 39
      },
      {
        "name": "post office",
        "score": 41
      },
      {
        "name": "train station",
        "score": 43,
        "aliases": [
          "railway station"
        ]
      },
      {
        "name": "bus station",
        "score": 45
      },
      {
        "name": "airport",
        "score": 46
      },
      {
        "name": "courthouse",
        "score": 48
      },
      {
        "name": "city hall",
        "score": 50,
        "aliases": [
          "town hall"
        ]
      },
      {
        "name": "university",
        "score": 52
      },
      {
        "name": "hotel",
        "score": 54
      },
      {
        "name": "theatre",
        "score": 56,
        "aliases": [
          "theater"
        ]
      },
      {
        "name": "cinema",
        "score": 58,
        "aliases": [
          "movie theater",
          "movie theatre"
        ]
      },
      {
        "name": "stadium",
        "score": 60
      },
      {
        "name": "sports centre",
        "score": 62,
        "aliases": [
          "sports center"
        ]
      },
      {
        "name": "swimming pool",
        "score": 64
      },
      {
        "name": "cafe",
        "score": 66,
        "aliases": [
          "café"
        ]
      },
      {
        "name": "bakery",
        "score": 67
      },
      {
        "name": "pharmacy",
        "score": 69,
        "aliases": [
          "chemist"
        ]
      },
      {
        "name": "supermarket",
        "score": 71
      },
      {
        "name": "marketplace",
        "score": 73,
        "aliases": [
          "market"
        ]
      },
      {
        "name": "zoo",
        "score": 75
      },
      {
        "name": "aquarium",
        "score": 77
      },
      {
        "name": "shopping mall",
        "score": 79,
        "aliases": [
          "shopping centre",
          "shopping center"
        ]
      },
      {
        "name": "factory",
        "score": 81
      },
      {
        "name": "warehouse",
        "score": 83
      },
      {
        "name": "power station",
        "score": 85,
        "aliases": [
          "power plant"
        ]
      },
      {
        "name": "art gallery",
        "score": 87
      },
      {
        "name": "community centre",
        "score": 89,
        "aliases": [
          "community center"
        ]
      },
      {
        "name": "concert hall",
        "score": 90
      },
      {
        "name": "observatory",
        "score": 92
      },
      {
        "name": "planetarium",
        "score": 94
      },
      {
        "name": "marina",
        "score": 96
      },
      {
        "name": "skatepark",
        "score": 98,
        "aliases": [
          "skate park"
        ]
      },
      {
        "name": "cemetery",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "cloud",
      "shoelace"
    ]
  },
  {
    "id": "play-world-travel-packing",
    "category": "world",
    "prompt": "Name something people commonly pack for a trip.",
    "answers": [
      {
        "name": "clothes",
        "score": 12
      },
      {
        "name": "phone",
        "score": 14
      },
      {
        "name": "toothbrush",
        "score": 16
      },
      {
        "name": "passport",
        "score": 18
      },
      {
        "name": "suitcase",
        "score": 20
      },
      {
        "name": "charger",
        "score": 22,
        "aliases": [
          "phone charger"
        ]
      },
      {
        "name": "ticket",
        "score": 23
      },
      {
        "name": "map",
        "score": 25
      },
      {
        "name": "wallet",
        "score": 27
      },
      {
        "name": "money",
        "score": 29
      },
      {
        "name": "camera",
        "score": 31
      },
      {
        "name": "sunscreen",
        "score": 33,
        "aliases": [
          "sunblock"
        ]
      },
      {
        "name": "sunglasses",
        "score": 35
      },
      {
        "name": "hat",
        "score": 37
      },
      {
        "name": "umbrella",
        "score": 39
      },
      {
        "name": "book",
        "score": 41
      },
      {
        "name": "headphones",
        "score": 43
      },
      {
        "name": "water bottle",
        "score": 45
      },
      {
        "name": "towel",
        "score": 46
      },
      {
        "name": "swimsuit",
        "score": 48,
        "aliases": [
          "swimming costume"
        ]
      },
      {
        "name": "coat",
        "score": 50
      },
      {
        "name": "shoes",
        "score": 52
      },
      {
        "name": "socks",
        "score": 54
      },
      {
        "name": "medication",
        "score": 56,
        "aliases": [
          "medicine"
        ]
      },
      {
        "name": "first aid kit",
        "score": 58
      },
      {
        "name": "travel adapter",
        "score": 60,
        "aliases": [
          "plug adapter"
        ]
      },
      {
        "name": "power bank",
        "score": 62
      },
      {
        "name": "travel pillow",
        "score": 64,
        "aliases": [
          "neck pillow"
        ]
      },
      {
        "name": "earplugs",
        "score": 66
      },
      {
        "name": "eye mask",
        "score": 67,
        "aliases": [
          "sleep mask"
        ]
      },
      {
        "name": "luggage tag",
        "score": 69
      },
      {
        "name": "padlock",
        "score": 71
      },
      {
        "name": "guidebook",
        "score": 73
      },
      {
        "name": "comb",
        "score": 75
      },
      {
        "name": "hairbrush",
        "score": 77
      },
      {
        "name": "shampoo",
        "score": 79
      },
      {
        "name": "soap",
        "score": 81
      },
      {
        "name": "toothpaste",
        "score": 83
      },
      {
        "name": "deodorant",
        "score": 85
      },
      {
        "name": "razor",
        "score": 87
      },
      {
        "name": "contact lenses",
        "score": 89
      },
      {
        "name": "insect repellent",
        "score": 90,
        "aliases": [
          "bug spray"
        ]
      },
      {
        "name": "raincoat",
        "score": 92
      },
      {
        "name": "notebook",
        "score": 94
      },
      {
        "name": "pen",
        "score": 96
      },
      {
        "name": "snacks",
        "score": 98
      },
      {
        "name": "boarding pass",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "refrigerator",
      "washing machine"
    ]
  },
  {
    "id": "play-world-travel-stays",
    "category": "world",
    "prompt": "Name a type of accommodation people use while traveling.",
    "answers": [
      {
        "name": "hotel",
        "score": 12
      },
      {
        "name": "motel",
        "score": 15
      },
      {
        "name": "hostel",
        "score": 18
      },
      {
        "name": "campsite",
        "score": 20,
        "aliases": [
          "campground"
        ]
      },
      {
        "name": "tent",
        "score": 23
      },
      {
        "name": "cabin",
        "score": 26
      },
      {
        "name": "caravan",
        "score": 29
      },
      {
        "name": "RV",
        "score": 31,
        "aliases": [
          "recreational vehicle",
          "motorhome"
        ]
      },
      {
        "name": "bed and breakfast",
        "score": 34,
        "aliases": [
          "B and B",
          "B&B"
        ]
      },
      {
        "name": "guesthouse",
        "score": 37,
        "aliases": [
          "guest house"
        ]
      },
      {
        "name": "inn",
        "score": 40
      },
      {
        "name": "resort",
        "score": 42
      },
      {
        "name": "lodge",
        "score": 45
      },
      {
        "name": "holiday home",
        "score": 48,
        "aliases": [
          "vacation home"
        ]
      },
      {
        "name": "apartment",
        "score": 51
      },
      {
        "name": "vacation rental",
        "score": 53,
        "aliases": [
          "holiday rental"
        ]
      },
      {
        "name": "homestay",
        "score": 56
      },
      {
        "name": "chalet",
        "score": 59
      },
      {
        "name": "yurt",
        "score": 62
      },
      {
        "name": "treehouse",
        "score": 64,
        "aliases": [
          "tree house"
        ]
      },
      {
        "name": "houseboat",
        "score": 67
      },
      {
        "name": "cruise ship",
        "score": 70
      },
      {
        "name": "sleeper train",
        "score": 73,
        "aliases": [
          "sleeping car"
        ]
      },
      {
        "name": "ryokan",
        "score": 75
      },
      {
        "name": "riad",
        "score": 78
      },
      {
        "name": "capsule hotel",
        "score": 81
      },
      {
        "name": "camping pod",
        "score": 84
      },
      {
        "name": "bungalow",
        "score": 86
      },
      {
        "name": "pension",
        "score": 89
      },
      {
        "name": "boarding house",
        "score": 92
      },
      {
        "name": "dormitory",
        "score": 95
      },
      {
        "name": "safari camp",
        "score": 97
      },
      {
        "name": "tepee",
        "score": 100,
        "aliases": [
          "teepee",
          "tipi"
        ]
      }
    ],
    "rejectedInputs": [
      "airport security",
      "roundabout"
    ]
  },
  {
    "id": "play-world-commuting",
    "category": "world",
    "prompt": "Name a way people travel to work or school.",
    "answers": [
      {
        "name": "car",
        "score": 12
      },
      {
        "name": "bus",
        "score": 15
      },
      {
        "name": "walking",
        "score": 17,
        "aliases": [
          "walk"
        ]
      },
      {
        "name": "train",
        "score": 20
      },
      {
        "name": "bicycle",
        "score": 23,
        "aliases": [
          "bike",
          "cycling"
        ]
      },
      {
        "name": "subway",
        "score": 25,
        "aliases": [
          "metro",
          "underground"
        ]
      },
      {
        "name": "tram",
        "score": 28,
        "aliases": [
          "streetcar"
        ]
      },
      {
        "name": "scooter",
        "score": 31
      },
      {
        "name": "motorcycle",
        "score": 33,
        "aliases": [
          "motorbike"
        ]
      },
      {
        "name": "moped",
        "score": 36
      },
      {
        "name": "ferry",
        "score": 39
      },
      {
        "name": "boat",
        "score": 41
      },
      {
        "name": "taxi",
        "score": 44,
        "aliases": [
          "cab"
        ]
      },
      {
        "name": "rideshare",
        "score": 47,
        "aliases": [
          "ride share"
        ]
      },
      {
        "name": "carpool",
        "score": 49,
        "aliases": [
          "car pool"
        ]
      },
      {
        "name": "school bus",
        "score": 52
      },
      {
        "name": "minibus",
        "score": 55
      },
      {
        "name": "coach",
        "score": 57
      },
      {
        "name": "electric bicycle",
        "score": 60,
        "aliases": [
          "e bike",
          "ebike"
        ]
      },
      {
        "name": "electric scooter",
        "score": 63,
        "aliases": [
          "e scooter",
          "escooter"
        ]
      },
      {
        "name": "skateboard",
        "score": 65
      },
      {
        "name": "roller skates",
        "score": 68,
        "aliases": [
          "rollerskates"
        ]
      },
      {
        "name": "wheelchair",
        "score": 71
      },
      {
        "name": "cable car",
        "score": 73
      },
      {
        "name": "monorail",
        "score": 76
      },
      {
        "name": "trolleybus",
        "score": 79,
        "aliases": [
          "trolley bus"
        ]
      },
      {
        "name": "rickshaw",
        "score": 81
      },
      {
        "name": "funicular",
        "score": 84
      },
      {
        "name": "running",
        "score": 87,
        "aliases": [
          "run"
        ]
      },
      {
        "name": "horse",
        "score": 89
      },
      {
        "name": "snowmobile",
        "score": 92
      },
      {
        "name": "golf cart",
        "score": 95
      },
      {
        "name": "dog sled",
        "score": 97
      },
      {
        "name": "helicopter",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "television",
      "teleportation"
    ]
  },
  {
    "id": "play-world-airport-objects",
    "category": "world",
    "prompt": "Name something commonly found at an airport.",
    "answers": [
      {
        "name": "airplane",
        "score": 12,
        "aliases": [
          "aeroplane",
          "plane"
        ]
      },
      {
        "name": "runway",
        "score": 14
      },
      {
        "name": "terminal",
        "score": 17
      },
      {
        "name": "gate",
        "score": 19
      },
      {
        "name": "passport",
        "score": 21
      },
      {
        "name": "suitcase",
        "score": 24,
        "aliases": [
          "luggage",
          "baggage"
        ]
      },
      {
        "name": "baggage carousel",
        "score": 26,
        "aliases": [
          "luggage carousel"
        ]
      },
      {
        "name": "check in desk",
        "score": 28,
        "aliases": [
          "checkin desk"
        ]
      },
      {
        "name": "security checkpoint",
        "score": 31
      },
      {
        "name": "boarding pass",
        "score": 33
      },
      {
        "name": "pilot",
        "score": 35
      },
      {
        "name": "flight attendant",
        "score": 37,
        "aliases": [
          "cabin crew"
        ]
      },
      {
        "name": "control tower",
        "score": 40,
        "aliases": [
          "air traffic control tower"
        ]
      },
      {
        "name": "taxiway",
        "score": 42
      },
      {
        "name": "jet bridge",
        "score": 44,
        "aliases": [
          "jetbridge"
        ]
      },
      {
        "name": "baggage cart",
        "score": 47
      },
      {
        "name": "luggage trolley",
        "score": 49
      },
      {
        "name": "duty free shop",
        "score": 51,
        "aliases": [
          "dutyfree shop"
        ]
      },
      {
        "name": "lounge",
        "score": 54
      },
      {
        "name": "restaurant",
        "score": 56
      },
      {
        "name": "cafe",
        "score": 58,
        "aliases": [
          "café"
        ]
      },
      {
        "name": "ticket counter",
        "score": 61
      },
      {
        "name": "arrivals board",
        "score": 63
      },
      {
        "name": "departures board",
        "score": 65
      },
      {
        "name": "windsock",
        "score": 68
      },
      {
        "name": "hangar",
        "score": 70
      },
      {
        "name": "radar",
        "score": 72
      },
      {
        "name": "beacon",
        "score": 75
      },
      {
        "name": "fire truck",
        "score": 77
      },
      {
        "name": "fuel truck",
        "score": 79
      },
      {
        "name": "aircraft stairs",
        "score": 81,
        "aliases": [
          "boarding stairs"
        ]
      },
      {
        "name": "metal detector",
        "score": 84
      },
      {
        "name": "baggage scanner",
        "score": 86
      },
      {
        "name": "check in kiosk",
        "score": 88,
        "aliases": [
          "checkin kiosk"
        ]
      },
      {
        "name": "baggage scale",
        "score": 91
      },
      {
        "name": "passport control",
        "score": 93,
        "aliases": [
          "immigration"
        ]
      },
      {
        "name": "customs",
        "score": 95
      },
      {
        "name": "information desk",
        "score": 98
      },
      {
        "name": "restroom",
        "score": 100,
        "aliases": [
          "toilet",
          "bathroom"
        ]
      }
    ],
    "rejectedInputs": [
      "submarine",
      "ski lift"
    ]
  },
  {
    "id": "play-world-day-out",
    "category": "world",
    "prompt": "Name a type of place people visit for a day out.",
    "answers": [
      {
        "name": "beach",
        "score": 12
      },
      {
        "name": "park",
        "score": 14
      },
      {
        "name": "museum",
        "score": 16
      },
      {
        "name": "zoo",
        "score": 18
      },
      {
        "name": "aquarium",
        "score": 20
      },
      {
        "name": "theme park",
        "score": 22,
        "aliases": [
          "amusement park"
        ]
      },
      {
        "name": "cinema",
        "score": 25,
        "aliases": [
          "movie theatre",
          "movie theater"
        ]
      },
      {
        "name": "theatre",
        "score": 27,
        "aliases": [
          "theater"
        ]
      },
      {
        "name": "shopping mall",
        "score": 29,
        "aliases": [
          "mall"
        ]
      },
      {
        "name": "swimming pool",
        "score": 31
      },
      {
        "name": "lake",
        "score": 33
      },
      {
        "name": "river",
        "score": 35
      },
      {
        "name": "forest",
        "score": 37
      },
      {
        "name": "mountain",
        "score": 39
      },
      {
        "name": "castle",
        "score": 41
      },
      {
        "name": "palace",
        "score": 43
      },
      {
        "name": "art gallery",
        "score": 46
      },
      {
        "name": "botanical garden",
        "score": 48,
        "aliases": [
          "botanic garden"
        ]
      },
      {
        "name": "farm",
        "score": 50
      },
      {
        "name": "playground",
        "score": 52
      },
      {
        "name": "ice rink",
        "score": 54,
        "aliases": [
          "ice skating rink"
        ]
      },
      {
        "name": "bowling alley",
        "score": 56
      },
      {
        "name": "mini golf course",
        "score": 58,
        "aliases": [
          "miniature golf course"
        ]
      },
      {
        "name": "sports stadium",
        "score": 60,
        "aliases": [
          "stadium"
        ]
      },
      {
        "name": "nature reserve",
        "score": 62
      },
      {
        "name": "water park",
        "score": 64,
        "aliases": [
          "waterpark"
        ]
      },
      {
        "name": "science centre",
        "score": 66,
        "aliases": [
          "science center"
        ]
      },
      {
        "name": "observatory",
        "score": 69
      },
      {
        "name": "planetarium",
        "score": 71
      },
      {
        "name": "national park",
        "score": 73
      },
      {
        "name": "library",
        "score": 75
      },
      {
        "name": "marketplace",
        "score": 77,
        "aliases": [
          "market"
        ]
      },
      {
        "name": "picnic area",
        "score": 79
      },
      {
        "name": "marina",
        "score": 81
      },
      {
        "name": "harbour",
        "score": 83,
        "aliases": [
          "harbor"
        ]
      },
      {
        "name": "waterfront",
        "score": 85
      },
      {
        "name": "garden",
        "score": 87
      },
      {
        "name": "fairground",
        "score": 90
      },
      {
        "name": "vineyard",
        "score": 92
      },
      {
        "name": "orchard",
        "score": 94
      },
      {
        "name": "arboretum",
        "score": 96
      },
      {
        "name": "wildlife sanctuary",
        "score": 98
      },
      {
        "name": "sculpture park",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "office meeting",
      "tax return"
    ]
  },
  {
    "id": "play-world-countries-s",
    "category": "world",
    "prompt": "Name a country whose common English name starts with S.",
    "answers": [
      {
        "name": "Spain",
        "score": 12
      },
      {
        "name": "Sweden",
        "score": 16
      },
      {
        "name": "Switzerland",
        "score": 19
      },
      {
        "name": "South Africa",
        "score": 23
      },
      {
        "name": "South Korea",
        "score": 26
      },
      {
        "name": "Singapore",
        "score": 30
      },
      {
        "name": "Saudi Arabia",
        "score": 33
      },
      {
        "name": "Sri Lanka",
        "score": 37
      },
      {
        "name": "Syria",
        "score": 40
      },
      {
        "name": "Sudan",
        "score": 44
      },
      {
        "name": "South Sudan",
        "score": 47
      },
      {
        "name": "Senegal",
        "score": 51
      },
      {
        "name": "Serbia",
        "score": 54
      },
      {
        "name": "Slovakia",
        "score": 58
      },
      {
        "name": "Slovenia",
        "score": 61
      },
      {
        "name": "Somalia",
        "score": 65
      },
      {
        "name": "Sierra Leone",
        "score": 68
      },
      {
        "name": "Seychelles",
        "score": 72
      },
      {
        "name": "Suriname",
        "score": 75
      },
      {
        "name": "Samoa",
        "score": 79
      },
      {
        "name": "San Marino",
        "score": 82
      },
      {
        "name": "Solomon Islands",
        "score": 86
      },
      {
        "name": "Saint Lucia",
        "score": 89
      },
      {
        "name": "Saint Kitts and Nevis",
        "score": 93
      },
      {
        "name": "Saint Vincent and the Grenadines",
        "score": 96
      },
      {
        "name": "Sao Tome and Principe",
        "score": 100,
        "aliases": [
          "São Tomé and Príncipe"
        ]
      }
    ],
    "rejectedInputs": [
      "Scotland",
      "Sicily"
    ]
  },
  {
    "id": "play-world-coastal-countries",
    "category": "world",
    "prompt": "Name a country with a coastline on an ocean or a sea connected to it.",
    "answers": [
      {
        "name": "Canada",
        "score": 12
      },
      {
        "name": "United States",
        "score": 13,
        "aliases": [
          "USA",
          "US"
        ]
      },
      {
        "name": "United Kingdom",
        "score": 13,
        "aliases": [
          "UK",
          "Britain"
        ]
      },
      {
        "name": "France",
        "score": 14
      },
      {
        "name": "Australia",
        "score": 14
      },
      {
        "name": "Italy",
        "score": 15
      },
      {
        "name": "Spain",
        "score": 16
      },
      {
        "name": "Brazil",
        "score": 16
      },
      {
        "name": "Mexico",
        "score": 17
      },
      {
        "name": "Japan",
        "score": 17
      },
      {
        "name": "China",
        "score": 18
      },
      {
        "name": "India",
        "score": 19
      },
      {
        "name": "Portugal",
        "score": 19
      },
      {
        "name": "Germany",
        "score": 20
      },
      {
        "name": "Netherlands",
        "score": 20,
        "aliases": [
          "Holland"
        ]
      },
      {
        "name": "Belgium",
        "score": 21
      },
      {
        "name": "Denmark",
        "score": 22
      },
      {
        "name": "Norway",
        "score": 22
      },
      {
        "name": "Sweden",
        "score": 23
      },
      {
        "name": "Finland",
        "score": 23
      },
      {
        "name": "Russia",
        "score": 24
      },
      {
        "name": "Pakistan",
        "score": 25
      },
      {
        "name": "Bangladesh",
        "score": 25
      },
      {
        "name": "Sri Lanka",
        "score": 26
      },
      {
        "name": "Myanmar",
        "score": 26,
        "aliases": [
          "Burma"
        ]
      },
      {
        "name": "Thailand",
        "score": 27
      },
      {
        "name": "Cambodia",
        "score": 28
      },
      {
        "name": "Vietnam",
        "score": 28
      },
      {
        "name": "Malaysia",
        "score": 29
      },
      {
        "name": "Singapore",
        "score": 29
      },
      {
        "name": "Indonesia",
        "score": 30
      },
      {
        "name": "Philippines",
        "score": 31
      },
      {
        "name": "South Korea",
        "score": 31
      },
      {
        "name": "North Korea",
        "score": 32
      },
      {
        "name": "New Zealand",
        "score": 32
      },
      {
        "name": "Egypt",
        "score": 33
      },
      {
        "name": "Morocco",
        "score": 34
      },
      {
        "name": "Algeria",
        "score": 34
      },
      {
        "name": "Tunisia",
        "score": 35
      },
      {
        "name": "Libya",
        "score": 35
      },
      {
        "name": "South Africa",
        "score": 36
      },
      {
        "name": "Kenya",
        "score": 37
      },
      {
        "name": "Tanzania",
        "score": 37
      },
      {
        "name": "Mozambique",
        "score": 38
      },
      {
        "name": "Madagascar",
        "score": 38
      },
      {
        "name": "Chile",
        "score": 39
      },
      {
        "name": "Argentina",
        "score": 40
      },
      {
        "name": "Peru",
        "score": 40
      },
      {
        "name": "Ecuador",
        "score": 41
      },
      {
        "name": "Colombia",
        "score": 41
      },
      {
        "name": "Venezuela",
        "score": 42
      },
      {
        "name": "Guyana",
        "score": 43
      },
      {
        "name": "Suriname",
        "score": 43
      },
      {
        "name": "Uruguay",
        "score": 44
      },
      {
        "name": "Costa Rica",
        "score": 44
      },
      {
        "name": "Panama",
        "score": 45
      },
      {
        "name": "Nicaragua",
        "score": 46
      },
      {
        "name": "Honduras",
        "score": 46
      },
      {
        "name": "El Salvador",
        "score": 47
      },
      {
        "name": "Guatemala",
        "score": 47
      },
      {
        "name": "Belize",
        "score": 48
      },
      {
        "name": "Cuba",
        "score": 49
      },
      {
        "name": "Jamaica",
        "score": 49
      },
      {
        "name": "Haiti",
        "score": 50
      },
      {
        "name": "Dominican Republic",
        "score": 50
      },
      {
        "name": "Trinidad and Tobago",
        "score": 51
      },
      {
        "name": "Bahamas",
        "score": 52,
        "aliases": [
          "The Bahamas"
        ]
      },
      {
        "name": "Barbados",
        "score": 52
      },
      {
        "name": "Iceland",
        "score": 53
      },
      {
        "name": "Ireland",
        "score": 53
      },
      {
        "name": "Greece",
        "score": 54
      },
      {
        "name": "Turkey",
        "score": 55,
        "aliases": [
          "Türkiye"
        ]
      },
      {
        "name": "Israel",
        "score": 55
      },
      {
        "name": "Lebanon",
        "score": 56
      },
      {
        "name": "Syria",
        "score": 56
      },
      {
        "name": "Jordan",
        "score": 57
      },
      {
        "name": "Saudi Arabia",
        "score": 57
      },
      {
        "name": "Yemen",
        "score": 58
      },
      {
        "name": "Oman",
        "score": 59
      },
      {
        "name": "United Arab Emirates",
        "score": 59,
        "aliases": [
          "UAE"
        ]
      },
      {
        "name": "Qatar",
        "score": 60
      },
      {
        "name": "Bahrain",
        "score": 60
      },
      {
        "name": "Kuwait",
        "score": 61
      },
      {
        "name": "Iran",
        "score": 62
      },
      {
        "name": "Iraq",
        "score": 62
      },
      {
        "name": "Ukraine",
        "score": 63
      },
      {
        "name": "Romania",
        "score": 63
      },
      {
        "name": "Bulgaria",
        "score": 64
      },
      {
        "name": "Croatia",
        "score": 65
      },
      {
        "name": "Slovenia",
        "score": 65
      },
      {
        "name": "Montenegro",
        "score": 66
      },
      {
        "name": "Albania",
        "score": 66
      },
      {
        "name": "Bosnia and Herzegovina",
        "score": 67
      },
      {
        "name": "Malta",
        "score": 68
      },
      {
        "name": "Cyprus",
        "score": 68
      },
      {
        "name": "Monaco",
        "score": 69
      },
      {
        "name": "Georgia",
        "score": 69
      },
      {
        "name": "Estonia",
        "score": 70
      },
      {
        "name": "Latvia",
        "score": 71
      },
      {
        "name": "Lithuania",
        "score": 71
      },
      {
        "name": "Poland",
        "score": 72
      },
      {
        "name": "Ghana",
        "score": 72
      },
      {
        "name": "Nigeria",
        "score": 73
      },
      {
        "name": "Togo",
        "score": 74
      },
      {
        "name": "Benin",
        "score": 74
      },
      {
        "name": "Cameroon",
        "score": 75
      },
      {
        "name": "Gabon",
        "score": 75
      },
      {
        "name": "Equatorial Guinea",
        "score": 76
      },
      {
        "name": "Angola",
        "score": 77
      },
      {
        "name": "Namibia",
        "score": 77
      },
      {
        "name": "Senegal",
        "score": 78
      },
      {
        "name": "Gambia",
        "score": 78,
        "aliases": [
          "The Gambia"
        ]
      },
      {
        "name": "Guinea",
        "score": 79
      },
      {
        "name": "Guinea Bissau",
        "score": 80
      },
      {
        "name": "Sierra Leone",
        "score": 80
      },
      {
        "name": "Liberia",
        "score": 81
      },
      {
        "name": "Cote d’Ivoire",
        "score": 81,
        "aliases": [
          "Ivory Coast"
        ]
      },
      {
        "name": "Mauritania",
        "score": 82
      },
      {
        "name": "Sudan",
        "score": 83
      },
      {
        "name": "Eritrea",
        "score": 83
      },
      {
        "name": "Djibouti",
        "score": 84
      },
      {
        "name": "Somalia",
        "score": 84
      },
      {
        "name": "Mauritius",
        "score": 85
      },
      {
        "name": "Seychelles",
        "score": 86
      },
      {
        "name": "Comoros",
        "score": 86
      },
      {
        "name": "Cabo Verde",
        "score": 87,
        "aliases": [
          "Cape Verde"
        ]
      },
      {
        "name": "Sao Tome and Principe",
        "score": 87
      },
      {
        "name": "Papua New Guinea",
        "score": 88
      },
      {
        "name": "Fiji",
        "score": 89
      },
      {
        "name": "Samoa",
        "score": 89
      },
      {
        "name": "Tonga",
        "score": 90
      },
      {
        "name": "Vanuatu",
        "score": 90
      },
      {
        "name": "Solomon Islands",
        "score": 91
      },
      {
        "name": "Kiribati",
        "score": 92
      },
      {
        "name": "Tuvalu",
        "score": 92
      },
      {
        "name": "Nauru",
        "score": 93
      },
      {
        "name": "Palau",
        "score": 93
      },
      {
        "name": "Marshall Islands",
        "score": 94
      },
      {
        "name": "Micronesia",
        "score": 95,
        "aliases": [
          "Federated States of Micronesia"
        ]
      },
      {
        "name": "Timor Leste",
        "score": 95,
        "aliases": [
          "East Timor"
        ]
      },
      {
        "name": "Brunei",
        "score": 96
      },
      {
        "name": "Maldives",
        "score": 96
      },
      {
        "name": "Dominica",
        "score": 97
      },
      {
        "name": "Grenada",
        "score": 98
      },
      {
        "name": "Antigua and Barbuda",
        "score": 98
      },
      {
        "name": "Saint Lucia",
        "score": 99
      },
      {
        "name": "Saint Kitts and Nevis",
        "score": 99
      },
      {
        "name": "Saint Vincent and the Grenadines",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "Switzerland",
      "Nepal"
    ]
  },
  {
    "id": "play-everyday-cold-drinks",
    "category": "everyday",
    "prompt": "Name a drink commonly served cold.",
    "answers": [
      {
        "name": "water",
        "score": 12
      },
      {
        "name": "milk",
        "score": 14
      },
      {
        "name": "orange juice",
        "score": 16
      },
      {
        "name": "apple juice",
        "score": 19
      },
      {
        "name": "lemonade",
        "score": 21
      },
      {
        "name": "soda",
        "score": 23,
        "aliases": [
          "pop",
          "soft drink"
        ]
      },
      {
        "name": "iced tea",
        "score": 25
      },
      {
        "name": "iced coffee",
        "score": 27
      },
      {
        "name": "beer",
        "score": 30
      },
      {
        "name": "wine",
        "score": 32
      },
      {
        "name": "cocktail",
        "score": 34
      },
      {
        "name": "smoothie",
        "score": 36
      },
      {
        "name": "milkshake",
        "score": 38
      },
      {
        "name": "slushie",
        "score": 41,
        "aliases": [
          "slushy"
        ]
      },
      {
        "name": "kombucha",
        "score": 43
      },
      {
        "name": "kefir",
        "score": 45
      },
      {
        "name": "lassi",
        "score": 47
      },
      {
        "name": "horchata",
        "score": 49
      },
      {
        "name": "ayran",
        "score": 52
      },
      {
        "name": "coconut water",
        "score": 54
      },
      {
        "name": "ginger beer",
        "score": 56
      },
      {
        "name": "ginger ale",
        "score": 58
      },
      {
        "name": "root beer",
        "score": 60
      },
      {
        "name": "cold brew",
        "score": 63
      },
      {
        "name": "fruit punch",
        "score": 65
      },
      {
        "name": "tonic water",
        "score": 67
      },
      {
        "name": "sparkling water",
        "score": 69,
        "aliases": [
          "seltzer",
          "soda water"
        ]
      },
      {
        "name": "sports drink",
        "score": 71
      },
      {
        "name": "energy drink",
        "score": 74
      },
      {
        "name": "grape juice",
        "score": 76
      },
      {
        "name": "cranberry juice",
        "score": 78
      },
      {
        "name": "bubble tea",
        "score": 80,
        "aliases": [
          "boba tea"
        ]
      },
      {
        "name": "iced latte",
        "score": 82
      },
      {
        "name": "iced mocha",
        "score": 85
      },
      {
        "name": "iced matcha",
        "score": 87
      },
      {
        "name": "chocolate milk",
        "score": 89
      },
      {
        "name": "buttermilk",
        "score": 91
      },
      {
        "name": "falooda",
        "score": 93
      },
      {
        "name": "tamarind juice",
        "score": 96
      },
      {
        "name": "sugarcane juice",
        "score": 98
      },
      {
        "name": "agua fresca",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "soup",
      "coffee beans"
    ]
  },
  {
    "id": "play-everyday-living-room",
    "category": "everyday",
    "prompt": "Name an object commonly found in a living room.",
    "answers": [
      {
        "name": "sofa",
        "score": 12,
        "aliases": [
          "couch"
        ]
      },
      {
        "name": "television",
        "score": 14,
        "aliases": [
          "TV"
        ]
      },
      {
        "name": "chair",
        "score": 17
      },
      {
        "name": "coffee table",
        "score": 19
      },
      {
        "name": "lamp",
        "score": 21
      },
      {
        "name": "rug",
        "score": 23
      },
      {
        "name": "bookcase",
        "score": 26,
        "aliases": [
          "bookshelf"
        ]
      },
      {
        "name": "shelf",
        "score": 28
      },
      {
        "name": "cushion",
        "score": 30,
        "aliases": [
          "throw pillow"
        ]
      },
      {
        "name": "remote control",
        "score": 32,
        "aliases": [
          "remote"
        ]
      },
      {
        "name": "clock",
        "score": 35
      },
      {
        "name": "picture",
        "score": 37
      },
      {
        "name": "mirror",
        "score": 39
      },
      {
        "name": "curtains",
        "score": 41,
        "aliases": [
          "drapes"
        ]
      },
      {
        "name": "blinds",
        "score": 44
      },
      {
        "name": "fireplace",
        "score": 46
      },
      {
        "name": "plant",
        "score": 48,
        "aliases": [
          "houseplant"
        ]
      },
      {
        "name": "vase",
        "score": 50
      },
      {
        "name": "carpet",
        "score": 53
      },
      {
        "name": "side table",
        "score": 55,
        "aliases": [
          "end table"
        ]
      },
      {
        "name": "speaker",
        "score": 57
      },
      {
        "name": "game console",
        "score": 59,
        "aliases": [
          "games console"
        ]
      },
      {
        "name": "DVD player",
        "score": 62
      },
      {
        "name": "ottoman",
        "score": 64
      },
      {
        "name": "blanket",
        "score": 66,
        "aliases": [
          "throw"
        ]
      },
      {
        "name": "magazine",
        "score": 68
      },
      {
        "name": "coaster",
        "score": 71
      },
      {
        "name": "board game",
        "score": 73
      },
      {
        "name": "candle",
        "score": 75
      },
      {
        "name": "photograph",
        "score": 77,
        "aliases": [
          "photo"
        ]
      },
      {
        "name": "ornament",
        "score": 80
      },
      {
        "name": "radiator",
        "score": 82
      },
      {
        "name": "fan",
        "score": 84
      },
      {
        "name": "air conditioner",
        "score": 86
      },
      {
        "name": "armchair",
        "score": 89
      },
      {
        "name": "recliner",
        "score": 91
      },
      {
        "name": "footstool",
        "score": 93
      },
      {
        "name": "mantelpiece",
        "score": 95,
        "aliases": [
          "mantel"
        ]
      },
      {
        "name": "record player",
        "score": 98,
        "aliases": [
          "turntable"
        ]
      },
      {
        "name": "soundbar",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "toilet",
      "oven"
    ]
  },
  {
    "id": "play-everyday-pocket-objects",
    "category": "everyday",
    "prompt": "Name a small item people commonly carry in a pocket.",
    "answers": [
      {
        "name": "keys",
        "score": 12,
        "aliases": [
          "key"
        ]
      },
      {
        "name": "wallet",
        "score": 14
      },
      {
        "name": "phone",
        "score": 17,
        "aliases": [
          "mobile phone",
          "cell phone"
        ]
      },
      {
        "name": "coin",
        "score": 19
      },
      {
        "name": "banknote",
        "score": 22,
        "aliases": [
          "cash",
          "note",
          "bill"
        ]
      },
      {
        "name": "card",
        "score": 24
      },
      {
        "name": "ticket",
        "score": 27
      },
      {
        "name": "receipt",
        "score": 29
      },
      {
        "name": "tissue",
        "score": 32
      },
      {
        "name": "handkerchief",
        "score": 34
      },
      {
        "name": "lip balm",
        "score": 36
      },
      {
        "name": "pen",
        "score": 39
      },
      {
        "name": "pencil",
        "score": 41
      },
      {
        "name": "lighter",
        "score": 44
      },
      {
        "name": "chewing gum",
        "score": 46,
        "aliases": [
          "gum"
        ]
      },
      {
        "name": "mint",
        "score": 49
      },
      {
        "name": "earbuds",
        "score": 51,
        "aliases": [
          "earphones"
        ]
      },
      {
        "name": "pocket knife",
        "score": 54,
        "aliases": [
          "pocketknife"
        ]
      },
      {
        "name": "keyring",
        "score": 56,
        "aliases": [
          "key ring"
        ]
      },
      {
        "name": "pocket watch",
        "score": 58
      },
      {
        "name": "flash drive",
        "score": 61,
        "aliases": [
          "USB drive",
          "memory stick"
        ]
      },
      {
        "name": "snack",
        "score": 63
      },
      {
        "name": "hair tie",
        "score": 66
      },
      {
        "name": "paper clip",
        "score": 68,
        "aliases": [
          "paperclip"
        ]
      },
      {
        "name": "button",
        "score": 71
      },
      {
        "name": "safety pin",
        "score": 73
      },
      {
        "name": "comb",
        "score": 76
      },
      {
        "name": "compact mirror",
        "score": 78
      },
      {
        "name": "matchbox",
        "score": 80
      },
      {
        "name": "cigarette",
        "score": 83
      },
      {
        "name": "inhaler",
        "score": 85
      },
      {
        "name": "business card",
        "score": 88
      },
      {
        "name": "transit pass",
        "score": 90,
        "aliases": [
          "bus pass"
        ]
      },
      {
        "name": "locket",
        "score": 93
      },
      {
        "name": "fob",
        "score": 95,
        "aliases": [
          "key fob"
        ]
      },
      {
        "name": "measuring tape",
        "score": 98,
        "aliases": [
          "tape measure"
        ]
      },
      {
        "name": "seashell",
        "score": 100,
        "aliases": [
          "shell"
        ]
      }
    ],
    "rejectedInputs": [
      "sofa",
      "refrigerator"
    ]
  },
  {
    "id": "play-everyday-wheeled-things",
    "category": "everyday",
    "prompt": "Name an object or vehicle that has wheels.",
    "answers": [
      {
        "name": "car",
        "score": 12
      },
      {
        "name": "bicycle",
        "score": 15,
        "aliases": [
          "bike"
        ]
      },
      {
        "name": "bus",
        "score": 17
      },
      {
        "name": "truck",
        "score": 20,
        "aliases": [
          "lorry"
        ]
      },
      {
        "name": "train",
        "score": 22
      },
      {
        "name": "motorcycle",
        "score": 25,
        "aliases": [
          "motorbike"
        ]
      },
      {
        "name": "shopping cart",
        "score": 28,
        "aliases": [
          "shopping trolley"
        ]
      },
      {
        "name": "stroller",
        "score": 30,
        "aliases": [
          "pushchair",
          "pram"
        ]
      },
      {
        "name": "wheelchair",
        "score": 33
      },
      {
        "name": "skateboard",
        "score": 35
      },
      {
        "name": "roller skates",
        "score": 38,
        "aliases": [
          "rollerskates"
        ]
      },
      {
        "name": "suitcase",
        "score": 40
      },
      {
        "name": "office chair",
        "score": 43,
        "aliases": [
          "desk chair"
        ]
      },
      {
        "name": "wheelbarrow",
        "score": 46
      },
      {
        "name": "wagon",
        "score": 48
      },
      {
        "name": "trolley",
        "score": 51
      },
      {
        "name": "scooter",
        "score": 53
      },
      {
        "name": "moped",
        "score": 56
      },
      {
        "name": "tram",
        "score": 59,
        "aliases": [
          "streetcar"
        ]
      },
      {
        "name": "trailer",
        "score": 61
      },
      {
        "name": "caravan",
        "score": 64
      },
      {
        "name": "golf cart",
        "score": 66
      },
      {
        "name": "go kart",
        "score": 69,
        "aliases": [
          "gokart"
        ]
      },
      {
        "name": "rollerblades",
        "score": 72,
        "aliases": [
          "inline skates"
        ]
      },
      {
        "name": "tractor",
        "score": 74
      },
      {
        "name": "forklift",
        "score": 77
      },
      {
        "name": "ambulance",
        "score": 79
      },
      {
        "name": "fire engine",
        "score": 82,
        "aliases": [
          "fire truck"
        ]
      },
      {
        "name": "luggage cart",
        "score": 84
      },
      {
        "name": "bin",
        "score": 87,
        "aliases": [
          "wheelie bin"
        ]
      },
      {
        "name": "riding mower",
        "score": 90,
        "aliases": [
          "ride on mower"
        ]
      },
      {
        "name": "hand truck",
        "score": 92,
        "aliases": [
          "dolly"
        ]
      },
      {
        "name": "wheelie bag",
        "score": 95
      },
      {
        "name": "rolling ladder",
        "score": 97
      },
      {
        "name": "airplane",
        "score": 100,
        "aliases": [
          "aeroplane"
        ]
      }
    ],
    "rejectedInputs": [
      "canoe",
      "sailboat"
    ]
  },
  {
    "id": "play-everyday-chores",
    "category": "everyday",
    "prompt": "Name a household chore.",
    "answers": [
      {
        "name": "washing dishes",
        "score": 12,
        "aliases": [
          "doing the dishes"
        ]
      },
      {
        "name": "vacuuming",
        "score": 15
      },
      {
        "name": "dusting",
        "score": 17
      },
      {
        "name": "sweeping",
        "score": 20
      },
      {
        "name": "mopping",
        "score": 22
      },
      {
        "name": "laundry",
        "score": 25,
        "aliases": [
          "washing clothes"
        ]
      },
      {
        "name": "ironing",
        "score": 28
      },
      {
        "name": "cooking",
        "score": 30
      },
      {
        "name": "grocery shopping",
        "score": 33
      },
      {
        "name": "taking out the trash",
        "score": 35,
        "aliases": [
          "taking out the rubbish"
        ]
      },
      {
        "name": "recycling",
        "score": 38
      },
      {
        "name": "making the bed",
        "score": 40,
        "aliases": [
          "bed making"
        ]
      },
      {
        "name": "cleaning the bathroom",
        "score": 43
      },
      {
        "name": "washing windows",
        "score": 46,
        "aliases": [
          "window cleaning"
        ]
      },
      {
        "name": "mowing the lawn",
        "score": 48,
        "aliases": [
          "lawn mowing"
        ]
      },
      {
        "name": "weeding",
        "score": 51
      },
      {
        "name": "watering plants",
        "score": 53
      },
      {
        "name": "feeding pets",
        "score": 56
      },
      {
        "name": "walking the dog",
        "score": 59,
        "aliases": [
          "dog walking"
        ]
      },
      {
        "name": "cleaning the oven",
        "score": 61
      },
      {
        "name": "defrosting the freezer",
        "score": 64
      },
      {
        "name": "decluttering",
        "score": 66
      },
      {
        "name": "polishing",
        "score": 69
      },
      {
        "name": "washing the car",
        "score": 72
      },
      {
        "name": "changing bedsheets",
        "score": 74,
        "aliases": [
          "changing sheets"
        ]
      },
      {
        "name": "folding clothes",
        "score": 77,
        "aliases": [
          "folding laundry"
        ]
      },
      {
        "name": "composting",
        "score": 79
      },
      {
        "name": "scrubbing the toilet",
        "score": 82,
        "aliases": [
          "cleaning the toilet"
        ]
      },
      {
        "name": "loading the dishwasher",
        "score": 84
      },
      {
        "name": "unloading the dishwasher",
        "score": 87
      },
      {
        "name": "cleaning gutters",
        "score": 90
      },
      {
        "name": "raking leaves",
        "score": 92
      },
      {
        "name": "shoveling snow",
        "score": 95,
        "aliases": [
          "shovelling snow"
        ]
      },
      {
        "name": "sweeping the chimney",
        "score": 97,
        "aliases": [
          "chimney sweeping"
        ]
      },
      {
        "name": "cleaning the fridge",
        "score": 100,
        "aliases": [
          "cleaning the refrigerator"
        ]
      }
    ],
    "rejectedInputs": [
      "watching television",
      "sleeping"
    ]
  },
  {
    "id": "play-everyday-first-aid-items",
    "category": "everyday",
    "prompt": "Name an item or supply commonly kept in a first-aid kit.",
    "answers": [
      {
        "name": "bandage",
        "score": 12
      },
      {
        "name": "adhesive bandage",
        "score": 15,
        "aliases": [
          "plaster",
          "Band Aid",
          "bandaid"
        ]
      },
      {
        "name": "gauze",
        "score": 18
      },
      {
        "name": "medical tape",
        "score": 21,
        "aliases": [
          "surgical tape"
        ]
      },
      {
        "name": "scissors",
        "score": 23
      },
      {
        "name": "tweezers",
        "score": 26
      },
      {
        "name": "antiseptic wipe",
        "score": 29,
        "aliases": [
          "antiseptic wipes"
        ]
      },
      {
        "name": "gloves",
        "score": 32,
        "aliases": [
          "disposable gloves"
        ]
      },
      {
        "name": "thermometer",
        "score": 35
      },
      {
        "name": "ice pack",
        "score": 38,
        "aliases": [
          "cold pack"
        ]
      },
      {
        "name": "painkiller",
        "score": 40,
        "aliases": [
          "painkillers"
        ]
      },
      {
        "name": "safety pin",
        "score": 43
      },
      {
        "name": "burn gel",
        "score": 46
      },
      {
        "name": "wound wash",
        "score": 49
      },
      {
        "name": "eye wash",
        "score": 52
      },
      {
        "name": "triangular bandage",
        "score": 55
      },
      {
        "name": "roller bandage",
        "score": 57
      },
      {
        "name": "sterile pad",
        "score": 60,
        "aliases": [
          "sterile dressing"
        ]
      },
      {
        "name": "cotton ball",
        "score": 63,
        "aliases": [
          "cotton wool"
        ]
      },
      {
        "name": "cotton swab",
        "score": 66,
        "aliases": [
          "cotton bud"
        ]
      },
      {
        "name": "antihistamine",
        "score": 69
      },
      {
        "name": "sting relief gel",
        "score": 72
      },
      {
        "name": "saline solution",
        "score": 74,
        "aliases": [
          "saline"
        ]
      },
      {
        "name": "rescue breathing mask",
        "score": 77,
        "aliases": [
          "CPR mask"
        ]
      },
      {
        "name": "emergency blanket",
        "score": 80,
        "aliases": [
          "space blanket"
        ]
      },
      {
        "name": "tourniquet",
        "score": 83
      },
      {
        "name": "splint",
        "score": 86
      },
      {
        "name": "antibiotic ointment",
        "score": 89
      },
      {
        "name": "hand sanitizer",
        "score": 91,
        "aliases": [
          "hand sanitiser"
        ]
      },
      {
        "name": "first aid manual",
        "score": 94
      },
      {
        "name": "eye pad",
        "score": 97
      },
      {
        "name": "wound closure strip",
        "score": 100,
        "aliases": [
          "Steri Strip"
        ]
      }
    ],
    "rejectedInputs": [
      "hammer",
      "glue stick"
    ]
  },
  {
    "id": "play-everyday-keeping-warm",
    "category": "everyday",
    "prompt": "Name something people use to keep warm.",
    "answers": [
      {
        "name": "coat",
        "score": 12
      },
      {
        "name": "blanket",
        "score": 14
      },
      {
        "name": "heater",
        "score": 17
      },
      {
        "name": "jacket",
        "score": 19
      },
      {
        "name": "sweater",
        "score": 22,
        "aliases": [
          "jumper"
        ]
      },
      {
        "name": "scarf",
        "score": 24
      },
      {
        "name": "gloves",
        "score": 27
      },
      {
        "name": "hat",
        "score": 29
      },
      {
        "name": "fireplace",
        "score": 32
      },
      {
        "name": "radiator",
        "score": 34
      },
      {
        "name": "hot water bottle",
        "score": 36
      },
      {
        "name": "quilt",
        "score": 39
      },
      {
        "name": "duvet",
        "score": 41
      },
      {
        "name": "sleeping bag",
        "score": 44
      },
      {
        "name": "thermal underwear",
        "score": 46,
        "aliases": [
          "thermals"
        ]
      },
      {
        "name": "socks",
        "score": 49
      },
      {
        "name": "boots",
        "score": 51
      },
      {
        "name": "earmuffs",
        "score": 54,
        "aliases": [
          "ear muffs"
        ]
      },
      {
        "name": "mittens",
        "score": 56
      },
      {
        "name": "hand warmer",
        "score": 58,
        "aliases": [
          "handwarmer"
        ]
      },
      {
        "name": "heat pack",
        "score": 61
      },
      {
        "name": "hot drink",
        "score": 63
      },
      {
        "name": "campfire",
        "score": 66
      },
      {
        "name": "wood stove",
        "score": 68,
        "aliases": [
          "wood burning stove"
        ]
      },
      {
        "name": "electric blanket",
        "score": 71
      },
      {
        "name": "fleece",
        "score": 73
      },
      {
        "name": "hoodie",
        "score": 76
      },
      {
        "name": "cardigan",
        "score": 78
      },
      {
        "name": "balaclava",
        "score": 80
      },
      {
        "name": "poncho",
        "score": 83
      },
      {
        "name": "neck warmer",
        "score": 85
      },
      {
        "name": "shawl",
        "score": 88
      },
      {
        "name": "vest",
        "score": 90
      },
      {
        "name": "woolly hat",
        "score": 93,
        "aliases": [
          "wooly hat"
        ]
      },
      {
        "name": "parka",
        "score": 95
      },
      {
        "name": "anorak",
        "score": 98
      },
      {
        "name": "heated seat",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "ice cube",
      "air conditioner"
    ]
  },
  {
    "id": "play-everyday-battery-handhelds",
    "category": "everyday",
    "prompt": "Name a small battery-powered device people can hold or carry.",
    "answers": [
      {
        "name": "phone",
        "score": 12,
        "aliases": [
          "mobile phone",
          "cell phone"
        ]
      },
      {
        "name": "flashlight",
        "score": 14,
        "aliases": [
          "torch"
        ]
      },
      {
        "name": "remote control",
        "score": 17,
        "aliases": [
          "remote"
        ]
      },
      {
        "name": "camera",
        "score": 19
      },
      {
        "name": "electric toothbrush",
        "score": 22
      },
      {
        "name": "electric shaver",
        "score": 24,
        "aliases": [
          "shaver"
        ]
      },
      {
        "name": "hair trimmer",
        "score": 27,
        "aliases": [
          "trimmer"
        ]
      },
      {
        "name": "calculator",
        "score": 29
      },
      {
        "name": "game controller",
        "score": 32,
        "aliases": [
          "controller"
        ]
      },
      {
        "name": "handheld game console",
        "score": 34
      },
      {
        "name": "walkie talkie",
        "score": 36,
        "aliases": [
          "two way radio"
        ]
      },
      {
        "name": "cordless drill",
        "score": 39
      },
      {
        "name": "electric screwdriver",
        "score": 41
      },
      {
        "name": "toy car",
        "score": 44
      },
      {
        "name": "stopwatch",
        "score": 46
      },
      {
        "name": "digital thermometer",
        "score": 49
      },
      {
        "name": "portable radio",
        "score": 51
      },
      {
        "name": "power bank",
        "score": 54
      },
      {
        "name": "blood pressure monitor",
        "score": 56
      },
      {
        "name": "pulse oximeter",
        "score": 58
      },
      {
        "name": "wireless mouse",
        "score": 61
      },
      {
        "name": "wireless keyboard",
        "score": 63
      },
      {
        "name": "laser pointer",
        "score": 66
      },
      {
        "name": "voice recorder",
        "score": 68,
        "aliases": [
          "dictaphone"
        ]
      },
      {
        "name": "metal detector",
        "score": 71
      },
      {
        "name": "e reader",
        "score": 73,
        "aliases": [
          "ereader"
        ]
      },
      {
        "name": "MP3 player",
        "score": 76
      },
      {
        "name": "Bluetooth speaker",
        "score": 78
      },
      {
        "name": "hearing aid",
        "score": 80
      },
      {
        "name": "earbuds",
        "score": 83,
        "aliases": [
          "earphones"
        ]
      },
      {
        "name": "alarm clock",
        "score": 85
      },
      {
        "name": "bicycle light",
        "score": 88,
        "aliases": [
          "bike light"
        ]
      },
      {
        "name": "fitness tracker",
        "score": 90
      },
      {
        "name": "smartwatch",
        "score": 93,
        "aliases": [
          "smart watch"
        ]
      },
      {
        "name": "digital scale",
        "score": 95
      },
      {
        "name": "electric milk frother",
        "score": 98
      },
      {
        "name": "cordless vacuum cleaner",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "hammer",
      "paper book"
    ]
  },
  {
    "id": "play-everyday-sports-venues",
    "category": "everyday",
    "prompt": "Name a place or playing area used for sport.",
    "answers": [
      {
        "name": "stadium",
        "score": 12
      },
      {
        "name": "gym",
        "score": 14,
        "aliases": [
          "gymnasium"
        ]
      },
      {
        "name": "swimming pool",
        "score": 17,
        "aliases": [
          "pool"
        ]
      },
      {
        "name": "field",
        "score": 19
      },
      {
        "name": "pitch",
        "score": 22
      },
      {
        "name": "court",
        "score": 24
      },
      {
        "name": "running track",
        "score": 26,
        "aliases": [
          "athletics track"
        ]
      },
      {
        "name": "ice rink",
        "score": 29,
        "aliases": [
          "skating rink"
        ]
      },
      {
        "name": "boxing ring",
        "score": 31
      },
      {
        "name": "golf course",
        "score": 33
      },
      {
        "name": "baseball diamond",
        "score": 36,
        "aliases": [
          "diamond"
        ]
      },
      {
        "name": "ballpark",
        "score": 38
      },
      {
        "name": "velodrome",
        "score": 41
      },
      {
        "name": "dojo",
        "score": 43
      },
      {
        "name": "arena",
        "score": 45
      },
      {
        "name": "skatepark",
        "score": 48,
        "aliases": [
          "skate park"
        ]
      },
      {
        "name": "halfpipe",
        "score": 50,
        "aliases": [
          "half pipe"
        ]
      },
      {
        "name": "ski slope",
        "score": 52
      },
      {
        "name": "bowling alley",
        "score": 55
      },
      {
        "name": "badminton court",
        "score": 57
      },
      {
        "name": "tennis court",
        "score": 60
      },
      {
        "name": "basketball court",
        "score": 62
      },
      {
        "name": "football field",
        "score": 64
      },
      {
        "name": "soccer field",
        "score": 67,
        "aliases": [
          "soccer pitch"
        ]
      },
      {
        "name": "fencing piste",
        "score": 69
      },
      {
        "name": "climbing wall",
        "score": 71
      },
      {
        "name": "long jump pit",
        "score": 74
      },
      {
        "name": "diving pool",
        "score": 76
      },
      {
        "name": "rowing course",
        "score": 79
      },
      {
        "name": "cricket oval",
        "score": 81
      },
      {
        "name": "squash court",
        "score": 83
      },
      {
        "name": "racquetball court",
        "score": 86
      },
      {
        "name": "curling rink",
        "score": 88
      },
      {
        "name": "equestrian arena",
        "score": 90
      },
      {
        "name": "bobsleigh track",
        "score": 93,
        "aliases": [
          "bobsled track"
        ]
      },
      {
        "name": "luge track",
        "score": 95
      },
      {
        "name": "shooting range",
        "score": 98
      },
      {
        "name": "archery range",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "library",
      "bakery"
    ]
  },
  {
    "id": "play-everyday-sandwich-fillings",
    "category": "everyday",
    "prompt": "Name a common sandwich filling or spread.",
    "answers": [
      {
        "name": "cheese",
        "score": 12
      },
      {
        "name": "ham",
        "score": 14
      },
      {
        "name": "chicken",
        "score": 16
      },
      {
        "name": "turkey",
        "score": 18
      },
      {
        "name": "tuna",
        "score": 20
      },
      {
        "name": "egg",
        "score": 22
      },
      {
        "name": "peanut butter",
        "score": 25
      },
      {
        "name": "jam",
        "score": 27,
        "aliases": [
          "jelly"
        ]
      },
      {
        "name": "lettuce",
        "score": 29
      },
      {
        "name": "tomato",
        "score": 31
      },
      {
        "name": "bacon",
        "score": 33
      },
      {
        "name": "salami",
        "score": 35
      },
      {
        "name": "cucumber",
        "score": 37
      },
      {
        "name": "beef",
        "score": 39
      },
      {
        "name": "pork",
        "score": 41
      },
      {
        "name": "avocado",
        "score": 43
      },
      {
        "name": "hummus",
        "score": 46,
        "aliases": [
          "houmous"
        ]
      },
      {
        "name": "cream cheese",
        "score": 48
      },
      {
        "name": "smoked salmon",
        "score": 50
      },
      {
        "name": "meatball",
        "score": 52
      },
      {
        "name": "sausage",
        "score": 54
      },
      {
        "name": "pastrami",
        "score": 56
      },
      {
        "name": "corned beef",
        "score": 58
      },
      {
        "name": "mortadella",
        "score": 60
      },
      {
        "name": "bologna",
        "score": 62,
        "aliases": [
          "baloney"
        ]
      },
      {
        "name": "falafel",
        "score": 64
      },
      {
        "name": "tofu",
        "score": 66
      },
      {
        "name": "pickle",
        "score": 69,
        "aliases": [
          "gherkin"
        ]
      },
      {
        "name": "coleslaw",
        "score": 71
      },
      {
        "name": "pesto",
        "score": 73
      },
      {
        "name": "mayonnaise",
        "score": 75,
        "aliases": [
          "mayo"
        ]
      },
      {
        "name": "mustard",
        "score": 77
      },
      {
        "name": "butter",
        "score": 79
      },
      {
        "name": "chocolate spread",
        "score": 81,
        "aliases": [
          "Nutella"
        ]
      },
      {
        "name": "roast vegetables",
        "score": 83
      },
      {
        "name": "egg salad",
        "score": 85
      },
      {
        "name": "tuna salad",
        "score": 87
      },
      {
        "name": "sauerkraut",
        "score": 90
      },
      {
        "name": "chutney",
        "score": 92
      },
      {
        "name": "watercress",
        "score": 94
      },
      {
        "name": "cress",
        "score": 96
      },
      {
        "name": "Brie",
        "score": 98
      },
      {
        "name": "halloumi",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "ice cube",
      "flour"
    ]
  },
  {
    "id": "play-everyday-finger-foods",
    "category": "everyday",
    "prompt": "Name a food commonly eaten with the hands.",
    "answers": [
      {
        "name": "sandwich",
        "score": 12
      },
      {
        "name": "pizza",
        "score": 14
      },
      {
        "name": "burger",
        "score": 16,
        "aliases": [
          "hamburger"
        ]
      },
      {
        "name": "taco",
        "score": 18
      },
      {
        "name": "chips",
        "score": 20,
        "aliases": [
          "crisps"
        ]
      },
      {
        "name": "French fries",
        "score": 22,
        "aliases": [
          "fries"
        ]
      },
      {
        "name": "chicken wing",
        "score": 24
      },
      {
        "name": "chicken drumstick",
        "score": 26
      },
      {
        "name": "ribs",
        "score": 28
      },
      {
        "name": "corn on the cob",
        "score": 30
      },
      {
        "name": "wrap",
        "score": 32
      },
      {
        "name": "burrito",
        "score": 34
      },
      {
        "name": "quesadilla",
        "score": 35
      },
      {
        "name": "samosa",
        "score": 37
      },
      {
        "name": "spring roll",
        "score": 39
      },
      {
        "name": "dumpling",
        "score": 41
      },
      {
        "name": "sushi",
        "score": 43
      },
      {
        "name": "hot dog",
        "score": 45,
        "aliases": [
          "hotdog"
        ]
      },
      {
        "name": "pretzel",
        "score": 47
      },
      {
        "name": "popcorn",
        "score": 49
      },
      {
        "name": "cookie",
        "score": 51,
        "aliases": [
          "biscuit"
        ]
      },
      {
        "name": "doughnut",
        "score": 53,
        "aliases": [
          "donut"
        ]
      },
      {
        "name": "muffin",
        "score": 55
      },
      {
        "name": "scone",
        "score": 57
      },
      {
        "name": "bagel",
        "score": 59
      },
      {
        "name": "bread",
        "score": 61
      },
      {
        "name": "fruit",
        "score": 63
      },
      {
        "name": "croissant",
        "score": 65
      },
      {
        "name": "pakora",
        "score": 67
      },
      {
        "name": "satay",
        "score": 69
      },
      {
        "name": "kebab",
        "score": 71
      },
      {
        "name": "momo",
        "score": 73
      },
      {
        "name": "gyoza",
        "score": 75
      },
      {
        "name": "bao",
        "score": 77,
        "aliases": [
          "bao bun"
        ]
      },
      {
        "name": "arepa",
        "score": 78
      },
      {
        "name": "empanada",
        "score": 80
      },
      {
        "name": "onion ring",
        "score": 82
      },
      {
        "name": "mozzarella stick",
        "score": 84
      },
      {
        "name": "nachos",
        "score": 86
      },
      {
        "name": "pita",
        "score": 88
      },
      {
        "name": "naan",
        "score": 90
      },
      {
        "name": "rice ball",
        "score": 92,
        "aliases": [
          "onigiri"
        ]
      },
      {
        "name": "sausage roll",
        "score": 94
      },
      {
        "name": "pasty",
        "score": 96
      },
      {
        "name": "scotch egg",
        "score": 98
      },
      {
        "name": "falafel",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "soup",
      "porridge"
    ]
  },
  {
    "id": "play-everyday-home-safety",
    "category": "everyday",
    "prompt": "Name an item or device used for safety or security at home.",
    "answers": [
      {
        "name": "smoke alarm",
        "score": 12,
        "aliases": [
          "smoke detector"
        ]
      },
      {
        "name": "fire extinguisher",
        "score": 15
      },
      {
        "name": "lock",
        "score": 17
      },
      {
        "name": "carbon monoxide alarm",
        "score": 20,
        "aliases": [
          "carbon monoxide detector",
          "CO detector"
        ]
      },
      {
        "name": "first aid kit",
        "score": 22
      },
      {
        "name": "deadbolt",
        "score": 25
      },
      {
        "name": "burglar alarm",
        "score": 28,
        "aliases": [
          "security alarm"
        ]
      },
      {
        "name": "security camera",
        "score": 30
      },
      {
        "name": "fire blanket",
        "score": 33
      },
      {
        "name": "sprinkler",
        "score": 35
      },
      {
        "name": "child gate",
        "score": 38,
        "aliases": [
          "baby gate"
        ]
      },
      {
        "name": "window lock",
        "score": 40
      },
      {
        "name": "nightlight",
        "score": 43,
        "aliases": [
          "night light"
        ]
      },
      {
        "name": "flashlight",
        "score": 46,
        "aliases": [
          "torch"
        ]
      },
      {
        "name": "gas detector",
        "score": 48
      },
      {
        "name": "safety goggles",
        "score": 51,
        "aliases": [
          "safety glasses"
        ]
      },
      {
        "name": "protective gloves",
        "score": 53,
        "aliases": [
          "work gloves"
        ]
      },
      {
        "name": "earplugs",
        "score": 56
      },
      {
        "name": "escape ladder",
        "score": 59
      },
      {
        "name": "door chain",
        "score": 61
      },
      {
        "name": "door viewer",
        "score": 64,
        "aliases": [
          "peephole"
        ]
      },
      {
        "name": "anti slip mat",
        "score": 66,
        "aliases": [
          "non slip mat"
        ]
      },
      {
        "name": "stair rail",
        "score": 69,
        "aliases": [
          "handrail",
          "banister"
        ]
      },
      {
        "name": "socket cover",
        "score": 72,
        "aliases": [
          "outlet cover"
        ]
      },
      {
        "name": "cupboard lock",
        "score": 74,
        "aliases": [
          "cabinet lock"
        ]
      },
      {
        "name": "oven mitt",
        "score": 77,
        "aliases": [
          "oven glove"
        ]
      },
      {
        "name": "pot holder",
        "score": 79,
        "aliases": [
          "potholder"
        ]
      },
      {
        "name": "emergency radio",
        "score": 82
      },
      {
        "name": "reflective vest",
        "score": 84,
        "aliases": [
          "high visibility vest"
        ]
      },
      {
        "name": "safety latch",
        "score": 87
      },
      {
        "name": "fire door",
        "score": 90
      },
      {
        "name": "doorbell camera",
        "score": 92
      },
      {
        "name": "motion sensor",
        "score": 95
      },
      {
        "name": "doorstop",
        "score": 97
      },
      {
        "name": "window guard",
        "score": 100
      }
    ],
    "rejectedInputs": [
      "vase",
      "ornament"
    ]
  }
];

// Snapshot of every editable content constant. This is what boots the
// studio shell — a single source of truth passed as props to the client
// wrapper. The literals below are the current canonical strings; edit here
// (or wire this file up to a DB later) to change what the shell prints.

/* eslint-disable */

export const NOTES = {
  sill: 'A windowsill that emails you. One shared collection of plants, a humidity sensor reporting to a home server, and a model that learns how often each plant actually needs water. One quiet email a day tells you what is thirsty.',
  straits:
    'A geopolitical oil dashboard I ran during the 2026 Middle East tensions. Live tanker positions across the Persian Gulf and Suez corridors, cross-referenced against sanctions lists, each vessel scored for dark fleet behavior. Posted to Reddit, ran for a month, shut down when the hosting bill arrived.',
  bode: 'A tool that draws the Bode plot asymptotic approximation for you. Built out of frustration in Circuits II, where hand-deriving the straight-line gain and phase approximation kept going wrong — feed in a transfer function, get the plots instantly.',
  hera: 'A second brain that sits underneath my Claude Code sessions. It reads itself into context before the model answers, and writes back what the session worked out once it ends. Pages that earn citations rise; pages that never do age out. I never file anything, so working is what curates it.',
};

export const MEDIUMS = {
  sill: {
    title: 'SILL',
    year: 2025,
    medium: 'react, supabase, sensor + ml',
    dim: 'one windowsill, many inboxes',
    blurb: 'A windowsill that emails you. A sensor and a learned model decide when to water.',
  },
  straits: {
    title: 'STRAITS',
    year: 2025,
    medium: 'ais, timescaledb, webgl',
    dim: 'six corridors, one risk score',
    blurb:
      'Geopolitical oil dashboard. Live tanker positions, sanctions flags, and dark fleet scoring. Posted to Reddit, ran for a month.',
  },
  bode: {
    title: 'BODE',
    year: 2026,
    medium: 'typescript, react, control theory',
    dim: 'one transfer function, two asymptotic plots',
    blurb: 'Bode plot asymptotic approximation tool. Feed in a transfer function, get the straight-line gain and phase plots.',
  },
  hera: {
    title: 'HERA',
    year: 2026,
    medium: 'python, sqlite fts5 + vec, ollama',
    dim: 'one vault, a hundred eyes',
    blurb:
      'A second brain for Claude Code. It reads itself into every session, and citations decide what it keeps.',
  },
};

export const ORDER = ['sill', 'straits', 'bode', 'hera'];

// Optional per-photo captions, keyed by filename. Sparse on purpose — a
// photo with no entry here still shows its palette, dimensions and paired
// frame on the card verso, so there's no obligation to write all forty.
export const PHOTO_CAPTIONS: Record<string, string> = {};

export const ABOUT_TEXT = `Randy is a design oriented engineer studying at the University of British Columbia. Currently focused on making agents feel like real collaborators; the kind you'd actually want to work with, not the kind that eats your afternoon. Open to roles starting spring 2027.`;

export const CONTACT_TEXT = `email     randyren278@gmail.com
github    randyren278
linkedin  /in/randyren278
location  VANCOUVER, BC, PT/GMT-8`;

export const COLOPHON_TEXT = `fonts     IBM Plex Mono, IBM Plex Serif (italic)
palette   cream, ink, prussian, warm umber
stack     raw HTML, raw CSS, raw JS. no libraries.
built     by hand, in Vancouver.
thanks    to the friends who reviewed this early.`;

export const MAN = {
  pwd: {
    name: 'pwd(1)',
    desc: 'print the name of the current working directory.',
    synopsis: 'pwd',
    see: 'cd, ls',
  },
  ls: {
    name: 'ls(1)',
    desc: 'list directory contents in listing order.',
    synopsis: 'ls [path]',
    see: 'cd, cat',
  },
  cd: {
    name: 'cd(1)',
    desc: 'change directory. accepts absolute, relative, .. and ~.',
    synopsis: 'cd [path]',
    see: 'pwd, ls',
  },
  cat: {
    name: 'cat(1)',
    desc: 'concatenate and print files. studio notes animate on first view.',
    synopsis: 'cat file',
    see: 'open, ls',
  },
  open: {
    name: 'open(1)',
    desc: 'opens the full page for a project.',
    synopsis: 'open project',
    see: 'cat, ls',
  },
  hours: { name: 'hours(1)', desc: 'print hours.', synopsis: 'hours', see: 'contact' },
  contact: {
    name: 'contact(1)',
    desc: 'print ways to reach the artist.',
    synopsis: 'contact',
    see: 'hours',
  },
  whoami: {
    name: 'whoami(1)',
    desc: 'print the user visiting this shell.',
    synopsis: 'whoami',
    see: 'help',
  },
  help: { name: 'help(1)', desc: 'list available commands.', synopsis: 'help', see: 'man' },
  man: {
    name: 'man(1)',
    desc: 'display the manual page for a command.',
    synopsis: 'man command',
    see: 'help',
  },
  history: {
    name: 'history(1)',
    desc: 'print numbered command history for this session.',
    synopsis: 'history',
    see: '!! and !n',
  },
  clear: {
    name: 'clear(1)',
    desc: 'clear the terminal buffer. Ctrl-L is a shortcut.',
    synopsis: 'clear',
    see: 'help',
  },
  latest: {
    name: 'latest(1)',
    desc: 'render the most recent GPS activity as an inline field recording.',
    synopsis: 'latest',
    see: 'open',
  },
  theme: {
    name: 'theme(1)',
    desc: 'switch the shell palette. auto follows the system preference.',
    synopsis: 'theme dark | light | auto',
    see: 'help',
  },
};

export const PLATE_DATA = {
  sill: {
    number: '01',
    title: 'Sill',
    year: 2025,
    marker: 'PLATE',
    meta: [
      { lab: 'YEAR', val: '2025' },
      { lab: 'ROLE', val: 'EVERYTHING' },
      { lab: 'CLIENT', val: 'SELF' },
      { lab: 'DISCIPLINE', val: 'WEB · HARDWARE · ML' },
    ],
    links: [
      { lab: 'LIVE', href: 'https://pleasepleasepleasewater.me' },
      { lab: 'CODE', href: 'https://github.com/randyren278/sill' },
    ],
    essay: [
      "A dynamic and proactive app to track the status of my plants. I water, edit, and add them; everyone else gets a read-only view and can sign up for a single daily email that says what's thirsty. The stack is made up of the following: React and Vite on the front, Supabase for the data, and scheduled functions that assemble the digest and send it through Resend each morning.",
      "There's a feedback loop under the reminder. A humidity sensor on the sill sends readings to a Mac mini I keep running at home as a server, and a machine-learning model I trained on that history sets how often each plant actually needs water. The timing follows the room instead of a fixed schedule, so it shifts on its own when the air dries out or the days get longer.",
    ],
  },
  straits: {
    number: '02',
    title: 'Straits',
    year: 2025,
    marker: 'PLATE',
    meta: [
      { lab: 'YEAR', val: '2025' },
      { lab: 'ROLE', val: 'EVERYTHING' },
      { lab: 'CLIENT', val: 'SELF' },
      { lab: 'DISCIPLINE', val: 'DATA · GEO · WEB' },
    ],
    links: [
      { lab: 'LIVE', href: 'https://straits.randyren.org' },
      { lab: 'CODE', href: 'https://github.com/randyren278/straits' },
    ],
    essay: [
      'I built this during the 2026 Middle East tensions to follow oil tankers through the Persian Gulf, Strait of Hormuz, Red Sea, and Suez Canal. One dashboard: live vessel positions, sanctions flags, route anomalies. I posted it to Reddit when the news cycle picked up and peaked with a few thousand users. It ran for about a month before the always-on hosting got too expensive to justify. Rather than pull it down, I rebuilt it to run for almost nothing, and it is still live.',
      'The live feed comes from a Mac at home. Every ten minutes a launchd process fires to hold a socket open. It streams about ninety seconds of AIS, keeps the latest fix per vessel, writes it to the database, scores the anomalies, drops anything older than a week, and quits. Essentially turning my Mac into a server.',
    ],
  },
  bode: {
    number: '03',
    title: 'Bode',
    year: 2026,
    marker: 'PLATE',
    meta: [
      { lab: 'YEAR', val: '2026' },
      { lab: 'ROLE', val: 'EVERYTHING' },
      { lab: 'CLIENT', val: 'SELF' },
      { lab: 'DISCIPLINE', val: 'CONTROL THEORY · WEB' },
    ],
    links: [
      { lab: 'LIVE', href: 'https://bode.randyren.org' },
      { lab: 'CODE', href: 'https://github.com/randyren278/bodeplotapprox' },
    ],
    essay: [
      "I kept getting Bode plot asymptotic approximations wrong in Circuits II. The gain and phase sketches are mechanical once you see the pattern in a transfer function's poles and zeros, but I could not figure it out to save my life. So instead I built a program that does it for me.",
      "It started as a MATLAB script leaning on the Symbolic Math and Control System toolboxes, then I ported it line-for-line into a TypeScript and React app so anyone can open it in a browser. Now you can estimate bode plots to your heart's content!",
    ],
  },
  hera: {
    number: '04',
    title: 'Hera',
    year: 2026,
    marker: 'PLATE',
    meta: [
      { lab: 'YEAR', val: '2026' },
      { lab: 'ROLE', val: 'EVERYTHING' },
      { lab: 'CLIENT', val: 'SELF' },
      { lab: 'DISCIPLINE', val: 'AGENTS · MEMORY · RETRIEVAL' },
    ],
    links: [{ lab: 'CODE', href: 'https://github.com/randyren278/hera' }],
    essay: [
      'A second brain that reads itself back to you. Hera sits underneath every Claude Code session I run, in any directory. When I type a question the vault searches itself against the prompt and puts the three most relevant pages in front of the model before the answer starts. When the session ends it distills what we worked out back into pages, and flags anything that contradicts what it already believed instead of quietly overwriting it. I never file anything. It closes the loop end to end, agentically.',
      'The intelligence comes from a few things. Every page an answer cites gets recorded, so the vault learns which of its own pages are load-bearing; the ones that keep earning citations rise to the top of future searches and the ones that never do age out to an archive. Underneath is one SQLite file, keyword search and local embeddings fused into a single ranking, and plain Markdown on disk. Nothing leaves the machine.',
    ],
  },
  about: {
    number: null,
    title: 'About',
    year: null,
    marker: 'COLOPHON',
    meta: [
      { lab: 'NAME', val: 'RANDY REN' },
      { lab: 'BASED', val: 'VANCOUVER, BC' },
      { lab: 'FOCUS', val: 'AI × INTERFACE' },
    ],
    plateCap: 'COLOPHON · RANDY REN · YVR',
    motifKind: 'about',
    essay: [
      "Randy is a designer-engineer working at the seam between AI systems and human interfaces. Previously shipped consumer products used by millions; now focused on making agents feel like real collaborators — the kind you'd want in the room, not the kind that eats your afternoon.",
      'Believes the best interfaces disappear until you need them, then arrive already knowing why. The work sits between two disciplines that rarely get invited to the same meeting: the one that decides what a system does, and the one that decides how it feels to use.',
      'Currently open to select client work and staff-plus roles starting fall 2026. Prefers small teams and quiet rooms. Answers his own email.',
    ],
  },
  contact: {
    number: null,
    title: 'Contact',
    year: null,
    marker: 'CORRESPONDENCE',
    meta: [
      { lab: 'EMAIL', val: 'randyren278@gmail.com' },
      { lab: 'GITHUB', val: 'randyren278' },
      { lab: 'LINKEDIN', val: '/in/randyren278' },
    ],
    plateCap: 'CORRESPONDENCE · RANDYREN278@GMAIL.COM',
    motifKind: 'contact',
    essay: [
      'Open to select client work and staff-plus roles. Based in Vancouver but comfortable across time zones. Best reached by email; replies within a day.',
      "I like problems where the interface is doing more than displaying — where the interaction itself changes the shape of the work. If that sounds like what you're building, write.",
    ],
  },
};

// Snapshot of every editable content constant. This is what boots the
// studio shell — a single source of truth passed as props to the client
// wrapper. The literals below are the current canonical strings; edit here
// (or wire this file up to a DB later) to change what the shell prints.

/* eslint-disable */

export const NOTES = {
  oryzo:
    "A room for the awkward pause between a spoken command and a machine's decision to act. What was silence becomes shape — voices scheduled, interruptions honored, latency turned into breath. The 300ms isn't hidden; it's composed.",
  halcyon:
    'A canvas for the way teams actually draw together — pointer trails as choreography, not chatter. Multiplayer at scale, so cursor storms remain legible. Craft, not crowd.',
  aperture:
    "An operating system that starts at the lens. The camera isn't a feature; it is the launcher, the app-store, the file picker. A hypothesis about attention in mobile computing.",
  fieldnote:
    'A CLI companion for people who think in commits and cadence. Not a scribe that writes for you — a partner that keeps the page warm while you decide what to say next.',
  'signal-garden':
    'Small ambient panes that surface status the way a plant surfaces need — quietly, undeniably. E-ink dashboards for teams tired of pinging. Awareness without interruption.',
  loom: 'Rooms of listeners routed peer-to-peer, no servers presiding. An experiment in how music travels when the middle is missing — closer to a house party than a broadcast.',
};

export const MEDIUMS = {
  oryzo: {
    title: 'ORYZO',
    year: 2025,
    medium: 'voice orchestration, latency, code',
    dim: '300ms, dimensions variable',
    blurb:
      'Voice orchestration layer for autonomous agents. Turned 300ms of latency into a feature.',
  },
  halcyon: {
    title: 'HALCYON',
    year: 2025,
    medium: 'multiplayer, canvas, webgl',
    dim: '500,000 cursors',
    blurb:
      'Realtime collaborative canvas for design teams. Half a million multiplayer cursors and counting.',
  },
  aperture: {
    title: 'APERTURE',
    year: 2024,
    medium: 'mobile os, camera, concept',
    dim: '1 device, 100 apps',
    blurb: 'Camera-first mobile OS. The lens is the app launcher.',
  },
  fieldnote: {
    title: 'FIELDNOTE',
    year: 2024,
    medium: 'cli, journaling, ai',
    dim: 'one shell, infinite pages',
    blurb: 'Terminal-native journaling agent. Writes with you, not for you.',
  },
  'signal-garden': {
    title: 'SIGNAL GARDEN',
    year: 2024,
    medium: 'hardware, e-ink, ambient',
    dim: '6 dashboards, 4 offices',
    blurb: 'Ambient e-ink dashboards for distributed teams. Status without Slack.',
  },
  loom: {
    title: 'LOOM',
    year: 2023,
    medium: 'web3, audio, mesh',
    dim: 'no servers, all rooms',
    blurb: 'Peer-to-peer music mesh. No servers, no ads, just rooms.',
  },
};

export const ORDER = ['oryzo', 'halcyon', 'aperture', 'fieldnote', 'signal-garden', 'loom'];

export const ABOUT_TEXT = `Randy is a designer-engineer working at the seam between AI systems and human interfaces. Previously shipped consumer products used by millions; now focused on making agents feel like real collaborators — the kind you'd want in the room, not the kind that eats your afternoon. Believes the best interfaces disappear until you need them, then arrive already knowing why. Currently open to select client work and staff+ roles starting fall 2026.`;

export const CONTACT_TEXT = `hey@randy.sh
twitter   @randyren
github    randyren
linkedin  /in/randyren
location  SAN FRANCISCO, PT/GMT-7`;

export const HOURS_TEXT = `monday      quiet hours
tuesday     10:00–19:00
wednesday   10:00–19:00
thursday    10:00–19:00
friday      10:00–15:00
saturday    by appointment
sunday      closed`;

export const COLOPHON_TEXT = `fonts     IBM Plex Mono, IBM Plex Serif (italic)
palette   cream, ink, prussian, warm umber
stack     raw HTML, raw CSS, raw JS. no libraries.
built     by hand, in San Francisco, 2026.
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
  oryzo: {
    number: '01',
    title: 'Oryzo',
    year: 2025,
    marker: 'PLATE',
    meta: [
      { lab: 'YEAR', val: '2025' },
      { lab: 'ROLE', val: 'DESIGN + ENG LEAD' },
      { lab: 'CLIENT', val: 'STEALTH · SEED' },
      { lab: 'DISCIPLINE', val: 'AI · INTERFACE · WEB' },
    ],
    plateCap: 'PLATE 01 · ORYZO · CMYK · 300 DPI',
    essay: [
      'Voice orchestration layer for autonomous agents. Turned three hundred milliseconds of latency into a feature — the pause the agent takes before answering became the moment you trust it. We stopped hiding the wait. We staged it. A hairline appears; a caret ticks; an intent surfaces. By the time the model speaks, the user has already read its think.',
      'Shipped as a drop-in orchestration primitive. A press mark, not a rewrite. The result was quieter than we expected — the loudest feedback came from the silence between turns.',
    ],
  },
  halcyon: {
    number: '02',
    title: 'Halcyon',
    year: 2025,
    marker: 'PLATE',
    meta: [
      { lab: 'YEAR', val: '2025' },
      { lab: 'ROLE', val: 'PRODUCT + DESIGN' },
      { lab: 'CLIENT', val: 'INTERNAL' },
      { lab: 'DISCIPLINE', val: 'PRODUCT · WEBGL · DESIGN' },
    ],
    plateCap: 'PLATE 02 · HALCYON · CMYK · 300 DPI',
    essay: [
      'A realtime collaborative canvas for design teams. Multiplayer cursors, but softer. We treated presence as a design material — where people were, how they moved, what they hovered — and let those shapes suggest new tools rather than replace old ones.',
      'Half a million cursors and counting. The canvas got smaller as more people joined; the friction went the other way.',
    ],
  },
  aperture: {
    number: '03',
    title: 'Aperture',
    year: 2024,
    marker: 'PLATE',
    meta: [
      { lab: 'YEAR', val: '2024' },
      { lab: 'ROLE', val: 'CONCEPT LEAD' },
      { lab: 'CLIENT', val: 'SELF' },
      { lab: 'DISCIPLINE', val: 'MOBILE · SYSTEM · CONCEPT' },
    ],
    plateCap: 'PLATE 03 · APERTURE · CMYK · 300 DPI',
    essay: [
      'A camera-first mobile OS. The lens is the app launcher. If you point the phone at something the phone knows what you want; the launcher was the least interesting screen on the device, so we removed it.',
      'Concept work. Never shipped as an OS, but the pattern went on to inform how camera-first apps are now built.',
    ],
  },
  fieldnote: {
    number: '04',
    title: 'Fieldnote',
    year: 2024,
    marker: 'PLATE',
    meta: [
      { lab: 'YEAR', val: '2024' },
      { lab: 'ROLE', val: 'DESIGN + ENG' },
      { lab: 'CLIENT', val: 'SELF' },
      { lab: 'DISCIPLINE', val: 'CLI · AI · TOOL' },
    ],
    plateCap: 'PLATE 04 · FIELDNOTE · CMYK · 300 DPI',
    essay: [
      "A terminal-native journaling agent. Writes with you, not for you. The agent knows the shape of your day, the projects you're on, the questions you haven't answered — and it offers rather than solves.",
      'The interface is a single prompt. The interface is also the file. Everything the agent reads or writes is a plaintext file in your directory; version control is git.',
    ],
  },
  'signal-garden': {
    number: '05',
    title: 'Signal Garden',
    year: 2024,
    marker: 'PLATE',
    meta: [
      { lab: 'YEAR', val: '2024' },
      { lab: 'ROLE', val: 'HARDWARE + INTERFACE' },
      { lab: 'CLIENT', val: 'DISTRIBUTED CO.' },
      { lab: 'DISCIPLINE', val: 'HARDWARE · INTERFACE' },
    ],
    plateCap: 'PLATE 05 · SIGNAL GARDEN · CMYK · 300 DPI',
    essay: [
      'Ambient e-ink dashboards for distributed teams. Status without Slack. Six panels around the office, refreshing every few minutes with the state of the work — not the state of the people.',
      'Hardware is cheap. Consistency is expensive. The garden metaphor stuck: things grow, things wither, and it matters when they do.',
    ],
  },
  loom: {
    number: '06',
    title: 'Loom',
    year: 2023,
    marker: 'PLATE',
    meta: [
      { lab: 'YEAR', val: '2023' },
      { lab: 'ROLE', val: 'DESIGN + ENG' },
      { lab: 'CLIENT', val: 'SELF' },
      { lab: 'DISCIPLINE', val: 'WEB3 · AUDIO · EXPERIMENT' },
    ],
    plateCap: 'PLATE 06 · LOOM · CMYK · 300 DPI',
    essay: [
      'A peer-to-peer music mesh. No servers, no ads, just rooms. Anyone can host a listening room; anyone can join with a link. The songs live on the seeds.',
      "An experiment in what a discovery layer looks like when the discovery is another person's ears, not an algorithm.",
    ],
  },
  about: {
    number: null,
    title: 'About',
    year: null,
    marker: 'COLOPHON',
    meta: [
      { lab: 'NAME', val: 'RANDY REN' },
      { lab: 'BASED', val: 'SAN FRANCISCO, CA' },
      { lab: 'FOCUS', val: 'AI × INTERFACE' },
      { lab: 'STATUS', val: 'OPEN FALL 2026' },
    ],
    plateCap: 'COLOPHON · RANDY REN · SF',
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
      { lab: 'EMAIL', val: 'hey@randy.sh' },
      { lab: 'TWITTER', val: '@randyren' },
      { lab: 'GITHUB', val: 'randyren' },
      { lab: 'LINKEDIN', val: '/in/randyren' },
    ],
    plateCap: 'CORRESPONDENCE · HEY@RANDY.SH',
    motifKind: 'contact',
    essay: [
      'Open to select client work and staff-plus roles starting fall 2026. Based in San Francisco but comfortable across time zones. Best reached by email; replies within a day.',
      "I like problems where the interface is doing more than displaying — where the interaction itself changes the shape of the work. If that sounds like what you're building, write.",
    ],
  },
};

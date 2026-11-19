/**
 * Every piece of copy and every contact detail on billobazaar.pk lives here.
 * Values still to be filled in are written in [BRACKETS] and listed at the end of this file.
 */

const EMAIL = '[YOUR EMAIL]';
const WHATSAPP = '[YOUR NUMBER]';
const ADDRESS = '[YOUR ADDRESS]';
const HOURS = '[YOUR HOURS]';
const HANDLE = '[@YOUR HANDLE]';

const mailto = `mailto:${EMAIL}`;

export type MenuLink = { label: string; href: string };
export type PageCopy = { label: string; title: string; em: string; lede: string };
/** The hand-sketched garment flats drawn in components/garments.tsx. */
export type GarmentId = 'kurta' | 'bomber' | 'waistcoat' | 'shalwar' | 'puffer';
export type ShopItem = { id: GarmentId; name: string; price: string; by: string; tag?: string };

export const site = {
  name: 'Billo Bazaar',
  domain: 'billobazaar.pk',
  description:
    "We help Pakistan's fashion students launch their own fabric labels. Manufacturers, customers, marketing, exhibitions and investors, all in one place, so talent doesn't stop at graduation.",

  contact: {
    email: EMAIL,
    mailto,
    whatsapp: WHATSAPP,
    address: ADDRESS,
    country: 'Pakistan',
    hours: HOURS,
  },

  social: [
    { label: 'Instagram', handle: HANDLE },
    { label: 'TikTok', handle: HANDLE },
    { label: 'LinkedIn', handle: HANDLE },
  ],

  loader: {
    skip: 'Skip intro',
  },

  menu: {
    open: 'Menu',
    close: 'Close menu', // the pill shows an X while open; this is its accessible name
    // About opens the Our story page, Join us the join page (components/Join.tsx)
    links: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/story' },
      { label: 'Join us', href: '/join' },
    ] satisfies MenuLink[],
    contactLabels: { whatsapp: 'WhatsApp', email: 'E-mail' },
  },

  // Accounts (components/AuthForm.tsx, app/account): sign up, log in, and the account page,
  // which says "Coming soon" until there's something to show there.
  auth: {
    login: 'Log in',
    signup: 'Sign up',
    account: 'My account',
    roles: { student: 'Student', manufacturer: 'Manufacturer', partner: 'Partner' },
    signupPage: {
      kicker: '( Join Billo Bazaar )',
      heading: ['Make your', 'account.'],
      submit: 'Create my account',
      switchText: 'Already have an account?',
      switchLink: 'Log in',
    },
    loginPage: {
      kicker: '( Welcome back )',
      heading: ['Log', 'in.'],
      submit: 'Log in',
      switchText: 'New here?',
      switchLink: 'Make an account',
    },
    accountPage: {
      kicker: '( Your account )',
      hello: 'Hi',
      heading: ['Coming', 'soon.'],
      back: 'Back',
      logout: 'Log out',
    },
  },

  hero: {
    title: 'From fashion student to',
    em: 'fashion brand.',
    lede: "We help Pakistan's fashion students launch their own fabric labels. Manufacturers, customers, marketing, exhibitions and investors, all in one place, so talent doesn't stop at graduation.",
    videoSrc: '/hero.mp4',
    videoNote: '[ Your full-screen video goes here ]',
  },

  // The home hero (components/Landing.tsx): the video, the logo top centre, the two-line headline
  // bottom left with its button, the glass cards on the right and the row along the bottom.
  // Photos live in /public/img; `pos` is the part of the photo kept in view (object-position).
  landing: {
    videoSrc: '/hero2.mp4',
    lines: ['From fashion student,', 'to fabric label.'],
    cta: { label: 'Start with your design', href: '/signup?as=student' }, // the way to sign up
    cards: {
      how: { label: 'How it works', href: '#how' },
      manufacturer: { label: 'Find your manufacturer', href: '#how', img: '/img/dupatta-tree.jpg', pos: '50% 40%' },
      exhibitions: { label: 'Exhibitions', href: '#how', img: '/img/mirror.jpg', pos: '38% 40%' },
    },
    rowLabel: 'Who we work with',
    // each opens the join page with that option already picked in its form
    row: [
      { label: 'For students', text: 'Launch your own fabric label.', img: '/img/tiled-floor.jpg', pos: '50% 35%', href: '/join#students' },
      { label: 'For manufacturers', text: 'Print and embroider for new labels.', img: '/img/tailor.jpg', pos: '50% 85%', href: '/join#manufacturers' },
      { label: 'For partners', text: 'Stores, investors and exhibitions.', img: '/img/sari.jpg', pos: '50% 70%', href: '/join#partners' },
    ],
  },

  // The about page (/story, components/About.tsx). In headings the last line is heavy and pink.
  about: {
    title: 'About',
    videoSrc: '/hero.mp4', // behind the first screen, washed deep maroon like the join page
    kicker: '( About Billo Bazaar )',
    heading: ["We don't print", 'the fabric,', 'we launch', 'the label.'],
    lede: "Billo Bazaar connects Pakistan's fashion students with the manufacturers, customers and partners who turn a print design into an unstitched collection.",
    why: {
      kicker: '( Why we exist )',
      text: "Every year, fashion students across Pakistan design prints and embroidery good enough for any store shelf. Then the jury leaves, the swatches go into a folder, and most of those designs never reach a single customer. The talent is there. What's missing is a manufacturer and a market.",
      line: ['Billo Bazaar is', 'that bridge.'],
      photos: [
        { img: '/img/tea.jpg', pos: '50% 40%' },
        { img: '/img/sari.jpg', pos: '50% 60%' },
      ],
    },
    // the two lines of big words that slide past each other as you scroll
    bands: [
      ['Print', 'Strike-off', 'Label', 'Bazaar'],
      ['Students', 'Manufacturers', 'Partners', 'Customers'],
    ],
    // how we work: the four promises, each row with the photo shown beside the heading
    what: {
      kicker: '( How we work )',
      heading: ['Four', 'promises.'],
      items: [
        { title: 'The artwork stays theirs.', text: 'We never design for a student. The prints, the label name and the story belong to the person who drew them.', img: '/img/sketches.jpg', pos: '50% 50%' },
        { title: 'Made here.', text: 'Every strike-off and every first run is printed, woven or embroidered by manufacturers in Pakistan.', img: '/img/tailor.jpg', pos: '50% 85%' },
        { title: 'Nothing without a yes.', text: 'A strike-off is just a test until the designer approves it. Nothing is printed in quantity before that.', img: '/img/handshake.jpg', pos: '50% 50%' },
        { title: 'Worn, not filed.', text: 'Designs belong on cloth that people stitch and wear, not in a portfolio. Everything we do is about getting the work bought.', img: '/img/models-arch.jpg', pos: '50% 30%' },
      ],
    },
    cta: {
      kicker: '( Your turn )',
      heading: ['Ready to', 'begin?'],
      button: { label: 'Join us', href: '/join' },
      links: [
        { label: 'For students', href: '/join#students' },
        { label: 'For manufacturers', href: '/join#manufacturers' },
        { label: 'For partners', href: '/join#partners' },
      ] satisfies MenuLink[],
    },
  },

  // The join page (/join, components/Join.tsx): three photo panels to pick your way in (each opens
  // sign up with that choice picked), then "Say salaam." with Sign up and Log in.
  join: {
    title: 'Join us',
    videoSrc: '/hero3.mp4', // behind the first screen, dark and maroon-washed (see .jn-bg)
    kicker: '( Join us )',
    heading: ['Pick your', 'way in.'],
    panelsLabel: 'Ways to join',
    panels: [
      { who: 'student', n: '01', word: 'Student', text: 'Send your print or embroidery artwork, the cloth you have in mind, and the label you want to build.', img: '/img/join-student.jpg', pos: '50% 50%' },
      { who: 'manufacturer', n: '02', word: 'Manufacturer', text: 'Digital, screen or block printing, weaving or embroidery: tell us the cloth you work with and the size of runs you take.', img: '/img/join-maker.jpg', pos: '40% 50%' },
      { who: 'partner', n: '03', word: 'Partner', text: 'Store, investor or exhibition space: tell us who you are and what you have in mind.', img: '/img/join-partner.jpg', pos: '45% 50%' },
    ],
    form: {
      kicker: '( Get in touch )',
      heading: ['Say', 'salaam.'],
      lead: 'Make your free account to get started, whether you’re a fashion student, a manufacturer or a partner.',
      signup: 'Sign up',
      loginText: 'Already have an account?',
      login: 'Log in',
    },
  },

  // "Your print, on real cloth." (components/Intro.tsx): the dark card that slides over the hero
  intro: {
    lines: ['Your', 'Print,', 'on real cloth.'],
    text: "Billo Bazaar helps Pakistan's fashion students turn their prints and embroidery into unstitched collections. You design the fabric. We find the manufacturer to print it, get you a strike-off you are proud of, and launch it under your own label.",
  },

  // "How it works" (components/HowItWorks.tsx): five pinned steps, each with a photo in /public/img
  // (a missing photo shows its note on a placeholder card instead).
  how: {
    label: 'How it works',
    steps: [
      {
        item: 'You design.',
        tags: ['Prints', 'Embroidery', 'Colourways'],
        title: { before: 'You', em: 'design.', after: '' },
        text: 'Send us your artwork: the print, where the embroidery sits and the colourways. Tell us the cloth you have in mind (lawn, cambric, chiffon or khaddar) and who it is for.',
        photo: { src: '/img/sketches.jpg', alt: 'Fashion sketches spread across a table', pos: '50% 50%', note: 'fashion sketches' },
      },
      {
        item: 'We find your manufacturer.',
        tags: ['Printing', 'Embroidery', 'Small runs'],
        title: { before: 'We find your', em: 'manufacturer.', after: '' },
        text: 'We match you with a manufacturer who works with your cloth and your technique (digital, screen or block printing, or embroidery) and can do a small first run that suits a new label.',
        photo: { src: '/img/tailor.jpg', alt: 'A tailor sewing at a machine', pos: '50% 88%', note: 'a tailor at a sewing machine' },
      },
      {
        item: 'You get a strike-off.',
        tags: ['Strike-off', 'Colour check'],
        title: { before: 'You get a', em: 'strike-off.', after: '' },
        text: 'The manufacturer prints a test length of your fabric. You check the colours, the scale of the print, the feel of the cloth and the embroidery, and tell us what to change.',
        photo: { src: '/img/models-arch.jpg', alt: 'Three models in embroidered suits', pos: '50% 30%', note: 'models in embroidered suits' },
      },
      {
        item: 'You approve it.',
        tags: ['Approval', 'Quality check'],
        title: { before: 'You', em: 'approve', after: 'it.' },
        text: 'Nothing is printed in quantity until you are happy. Changes go back to the manufacturer until every colour and every stitch is right.',
        photo: { src: '/img/handshake.jpg', alt: 'Two hands shaking in agreement', pos: '50% 50%', note: 'a handshake' },
      },
      {
        item: 'We launch it.',
        tags: ['Unstitched suits', 'Shoot', 'Exhibitions'],
        title: { before: 'We', em: 'launch', after: 'it.' },
        text: 'Once it is approved, your fabric goes out as unstitched suits under your own label. We shoot it and put it in front of customers, online and at our exhibitions.',
        photo: { src: '/img/tea.jpg', alt: 'Women in embroidered suits sharing tea', pos: '50% 40%', note: 'women sharing tea' },
      },
    ],
  },

  // "The collection" row on the home page (after "How it works"). The pieces are samples for now.
  shop: {
    title: 'The',
    em: 'collection.',
    sub: '[ Preview ]',
    all: { label: 'Shop all', href: '#shop' },
    itemHref: '#shop',
    front: 'Front', // the corner label flips to "Back" with the garment
    back: 'Back',
    items: [
      { id: 'kurta', name: 'Gulabi Kurta', price: 'Rs 14,500', by: 'by Ayesha K.', tag: 'Coming soon' },
      { id: 'bomber', name: 'Neel Bomber', price: 'Rs 22,000', by: 'by Hamza R.' },
      { id: 'waistcoat', name: 'Haveli Waistcoat', price: 'Rs 11,800', by: 'by Zainab M.', tag: 'Coming soon' },
      { id: 'shalwar', name: 'Lilac Shalwar', price: 'Rs 8,900', by: 'by Maham T.' },
      { id: 'puffer', name: 'Sabz Puffer', price: 'Rs 19,500', by: 'by Danish A.', tag: 'Coming soon' },
    ] satisfies ShopItem[],
    apply: { big: 'Your label', em: 'could be here.', name: 'Apply as a designer', price: 'Free', by: 'for fashion students across Pakistan', href: mailto },
    note: 'Sample pieces. Real student labels are on their way.',
    prev: 'Previous pieces',
    next: 'Next pieces',
  },

  // Placeholder pages behind the menu links. The ledes are placeholder copy too.
  pages: {
    labels: { label: 'New labels', title: 'New', em: 'labels.', lede: "New labels from Pakistan's fashion graduates are on their way." },
    designers: { label: 'Designers', title: 'The', em: 'designers.', lede: 'Meet the students behind the labels. Profiles are coming soon.' },
    drops: { label: 'Drops', title: 'Latest', em: 'drops.', lede: 'Small-run collections from new labels. The first drop is coming soon.' },
    exhibitions: { label: 'Exhibitions', title: 'Physical', em: 'exhibitions.', lede: 'Shows where customers meet new labels in person. Dates coming soon.' },
    story: { label: 'Our story', title: 'Our', em: 'story.', lede: 'Why Billo Bazaar exists and where it is going. The full story is coming soon.' },
  } satisfies Record<string, PageCopy>,

  footer: {
    start: '[ Start a conversation ]',
    title: 'Your label',
    em: 'starts here.',
    cta: { label: 'Start with Billo Bazaar', href: mailto },
    whatWeDo: {
      label: '[ What we do ]',
      items: [
        'Manufacturer matching',
        'Strike-offs & sampling',
        'Colour & quality checks',
        'Label launch',
        'Shoots & marketing',
        'Exhibitions',
        'Store & investor introductions',
      ],
    },
    bazaar: {
      label: '[ Bazaar ]',
      links: [
        { label: 'Home', href: '/' },
        { label: 'For students', href: '/join#students' },
        { label: 'For manufacturers', href: '/join#manufacturers' },
        { label: 'For partners', href: '/join#partners' },
      ] satisfies MenuLink[],
    },
    findUs: '[ Find us ]',
    copyright: '© 2026 Billo Bazaar · billobazaar.pk',
    replay: 'Replay intro',
    tagline: 'Fabric by students · Made in Pakistan',
  },
} as const;

/**
 * Still placeholders. Replace the constants at the top of this file:
 *   [YOUR EMAIL]     EMAIL     (every mailto link, the menu and the footer)
 *   [YOUR NUMBER]    WHATSAPP  (menu contact row, footer)
 *   [YOUR ADDRESS]   ADDRESS   (footer)
 *   [YOUR HOURS]     HOURS     (footer)
 *   [@YOUR HANDLE]   HANDLE    (Instagram, TikTok and LinkedIn; shown as plain text for now)
 * Also: the ledes in `pages` above, and the sample pieces in `shop.items` (names, prices,
 * designers) until the real labels are in.
 */
export const PLACEHOLDERS = { EMAIL, WHATSAPP, ADDRESS, HOURS, HANDLE } as const;

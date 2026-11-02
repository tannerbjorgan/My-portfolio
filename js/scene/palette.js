import { darken, ramp } from './pixels.js';

// Colour ramps for the foreground models, the rig and the bird. These don't change with the theme;
// night is handled by the lighting instead.
export const RAMPS = {
  wood: ramp(['#4a2f1d', '#5f3d26', '#764e31', '#8c5f3c', '#a17149', '#b5845a', '#c79a6e']),
  hoodie: ramp(['#4a2013', '#652d1a', '#823b23', '#9f4b2d', '#ba5d38', '#d27347', '#e28f5f']),
  jeans: ramp(['#18202d', '#212c3e', '#2b3a52', '#364a68', '#465e82', '#5a759c']),
  skin: ramp(['#5e3727', '#7a4a35', '#965e44', '#b07455', '#c78c69', '#d9a481']),
  hair: ramp(['#110b08', '#1b130e', '#281c14', '#37271c', '#4a3426', '#5e4433']),
  headphones: ramp(['#0d0d10', '#17171b', '#222228', '#303038', '#44444e', '#5c5c68']),
  charcoal: ramp(['#0f1013', '#17191c', '#202328', '#2b2f35', '#393e46', '#4b515b']),
  chrome: ramp(['#3d4045', '#5d6168', '#83878f', '#aeb2b9', '#d6d9de']),
  lamp: ramp(['#16302a', '#1f4037', '#2a5246', '#376656', '#467b69', '#5a927e']),
  ceramic: ramp(['#7f7d78', '#a3a09a', '#c4c1ba', '#dcd9d2', '#efede8']),
  bookBlue: ramp(['#162843', '#1f3658', '#2b4a6e', '#3a5f8a', '#4d76a6']),
  bookRed: ramp(['#4a1719', '#651f22', '#7f2a2c', '#99393b', '#b24a49']),
  pages: ramp(['#a9a28f', '#c8c1ad', '#e2dccb', '#f1ecdf']),
  pot: ramp(['#5a2a18', '#763621', '#93452a', '#ad5734', '#c56c44']),
  plant: ramp(['#1c3d22', '#255030', '#2f6337', '#3e7a43', '#55944f', '#6aa95e']),
  shoes: ramp(['#121214', '#1c1c20', '#28282e', '#3a3a42', '#4c4c56']),
  dog: ramp(['#4a2a10', '#6a3e16', '#8c561e', '#ae7029', '#c98c3a', '#ddaa58', '#ebc57e']),
  bird: ramp(['#0f1626', '#18233a', '#22324f', '#30466b', '#43608c']),
  rig: ramp(['#4f3d29', '#6b553a', '#8a6f4c', '#a88b61', '#c3a679', '#dbc297']),
  syntax: ramp(['#7fd1b9', '#e6b450', '#c792ea', '#82aaff', '#a6accd', '#f07178'])
};

const CANOPY = [
  ramp(['#3a1410', '#5a1c12', '#7e2616', '#a5351a', '#c84c20', '#e0702c', '#f09a44', '#f8c46a']),
  ramp(['#3d200e', '#5e3010', '#844616', '#ad601c', '#d07e24', '#e89c34', '#f5bc50', '#fbd878']),
  ramp(['#3a2c0e', '#5a4412', '#806218', '#a8821e', '#cca22a', '#e4bf3e', '#f2d460', '#fae88e'])
];

// Red, orange and gold deciduous trees, then an evergreen.
const VALLEY_TREES = [
  ramp(['#5a1c12', '#8a2c18', '#b8441f', '#d9692a', '#ee9a4a']),
  ramp(['#6a3412', '#99521a', '#c97624', '#e89a34', '#f5c25e']),
  ramp(['#6a5014', '#98761c', '#c49e28', '#e2c03e', '#f6dc72']),
  ramp(['#1f3324', '#2b4630', '#3a5c3c', '#4f7548', '#638a55'])
];

export const PALETTES = {
  light: {
    night: false,
    pageBackground: '255,255,255',
    farLit: '#efc9a8', farShade: '#ab9dbd', snowLit: '#fff4e2', snowShade: '#d8cde3',
    ridgeLit: '#c98a4b', ridgeShade: '#9b6040',
    ridgeTrees: ['#b8401f', '#d9692a', '#e89a34', '#f2c14e', '#8a3a1c', '#4f6a3a', '#3f5a34'],
    canopy: CANOPY,
    valleyTrees: VALLEY_TREES,
    water: ramp(['#5f86a3', '#7fa5bd', '#a9c6d6', '#fff0d0']),
    gravel: ['#b5a58c', '#9a8a72', '#cbbda3', '#857660'],
    rock: ramp(['#6e5e52', '#8a7868', '#a8937e', '#c4ae94']),
    grass: ramp(['#3a4219', '#4d5824', '#64702c', '#808534', '#a1983c', '#c0ab4a', '#d8c068']),
    bark: ramp(['#2e1d14', '#45291b', '#5e3a25', '#7a4e31', '#94653f']),
    leaves: ['#c4471f', '#e0782a', '#f0a830', '#b8321e', '#d9952e', '#8f2a1a'],
    cloud: '#f9dcc0', cloudShade: '#e9b08a', cloudLight: '#fff4e4',
    sun: '#fff6dc', sunEdge: '#ffe2a0', halo: '#ffdb9a',
    glow: ['rgba(255,200,120,.65)', 'rgba(255,170,90,.2)'],
    grade: 'rgba(255,150,60,.32)',
    ray: '255,214,150', rayAlpha: 0.08
  },
  dark: {
    night: true,
    pageBackground: '22,21,20',
    farLit: '#4d4569', farShade: '#2c2742', snowLit: '#978aa6', snowShade: '#5a5272',
    ridgeLit: '#3e2b2c', ridgeShade: '#2a1e22',
    ridgeTrees: ['#4a2018', '#5e2c1c', '#6e3e22', '#7a5428', '#3a1814', '#1d2a22', '#18231c'],
    canopy: CANOPY.map((colors) => darken(colors, 0.6)),
    valleyTrees: VALLEY_TREES.map((colors) => darken(colors, 0.6)),
    water: ramp(['#1b2038', '#252c4a', '#343c60', '#f2c27a']),
    gravel: ['#3b3438', '#2f292e', '#4a4146', '#262126'],
    rock: ramp(['#2a2428', '#363036', '#463e44', '#5a5056']),
    grass: ramp(['#12160f', '#191e13', '#212617', '#2a2e1b', '#33361f', '#3e3f24', '#4a4a2a']),
    bark: ramp(['#140d0b', '#1f1410', '#2b1c15', '#3a261b', '#4a3222']),
    leaves: ['#5a2418', '#6e3420', '#7a4a24', '#4a1c14', '#6a2a18', '#3a1810'],
    cloud: '#342b3e', cloudShade: '#271f30', cloudLight: '#4e3f52',
    sun: '#f6d69a', sunEdge: '#e0b56e', halo: '#4a3436',
    glow: ['rgba(255,196,130,.4)', 'rgba(180,120,140,.1)'],
    grade: 'rgba(150,90,150,.28)',
    ray: '255,206,150', rayAlpha: 0.035
  }
};

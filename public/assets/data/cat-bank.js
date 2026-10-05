// Settings and difficulty labels for the adaptive placement test (see assets/js/cat.js for how it works).
//
// Each question has a CEFR level; "+" / "-" after it means harder / easier than the rest of that level.
//   placement.js and extra.js carry their own level - list an id below only to override it
//   grammar.js has no levels, so the grammar questions used by the test are labelled here (n → level)
// These levels are expert ratings, not statistics from real test-takers (that would need a few hundred answers
// per question). If answers are ever collected, replace them with measured difficulties.
window.CEFR_DATA = window.CEFR_DATA || {};
window.CEFR_DATA.cat = {
  // difficulty scale (logits): where the middle of each level sits; "+" / "-" move a question by `step`
  anchors: { A1: -2.4, A2: -1.2, B1: 0, B2: 1.2 },
  step: 0.4,

  // test rules
  start: -0.6,            // first guess of the learner's ability (between A2 and B1)
  priorSd: 1.5,           // how unsure that first guess is
  minItems: 12,           // never stop before this many questions
  minItemsConfident: 15,  // "level is clear" can end the test from here on
  maxItems: 25,
  stopSe: 0.5,            // stop when the estimate is this precise (standard error, logits)
  confidence: 0.85,       // ... or when one CEFR level has this probability
  randomesque: 3,         // pick randomly among the N most informative questions (so tests differ)

  // overrides for questions that carry their own level (none needed yet)
  placement: {
    'B2-20': 'B2+', 'B2-24': 'B2+', 'B2-28': 'B2+', 'B2-16': 'B2+', 'B2-32': 'B2+',
    'B2-33': 'B2-', 'B2-35': 'B2-', 'B2-14': 'B2-',
  },
  extra: {},

  // Grammar questions (n → level). Left out on purpose: repeats of another question (23, 31, 72, 82, 89, 109, 111).
  grammar: {
    1: 'A1', 2: 'B1', 3: 'B1', 4: 'B1', 5: 'A1', 6: 'A1', 7: 'A2', 8: 'A2-', 9: 'A1+', 10: 'A1+',
    11: 'A1', 12: 'A1', 13: 'A2', 14: 'A2-', 15: 'A2', 16: 'A2', 17: 'B1-', 18: 'A2', 19: 'A2', 20: 'A2',
    21: 'B1-', 22: 'A2', 24: 'A2', 25: 'A2-', 26: 'B2', 27: 'B2-', 28: 'A1', 29: 'A1', 30: 'A2',
    32: 'A2', 33: 'A2', 34: 'A1+', 35: 'A2', 36: 'A1+', 37: 'A1', 38: 'A2-', 39: 'A2-', 40: 'A2',
    41: 'B1', 42: 'A2', 43: 'A2', 44: 'B1', 45: 'A2', 46: 'A1', 47: 'A2', 48: 'A2', 49: 'A2+', 50: 'A2-',
    51: 'A1', 52: 'A1', 53: 'A1+', 54: 'B1-', 55: 'A1+', 56: 'A2-', 57: 'A2', 58: 'B1', 59: 'A2', 60: 'A2+',
    61: 'B1', 62: 'A1', 63: 'A1+', 64: 'B2', 65: 'B1-', 66: 'B1', 67: 'B1-', 68: 'B1-', 69: 'B1', 70: 'A1+',
    71: 'B1+', 73: 'A1+', 74: 'B1', 75: 'B1-', 76: 'A2', 77: 'B1+', 78: 'A2', 79: 'B1', 80: 'B1+',
    81: 'B1+', 83: 'B1+', 84: 'A2', 85: 'B1-', 86: 'A2-', 87: 'A2', 88: 'B1', 90: 'B1', 91: 'B1', 92: 'B1+',
    93: 'A2', 94: 'A1+', 95: 'A2+', 96: 'A1+', 97: 'B2', 98: 'A2-', 99: 'A2-', 100: 'B1+',
    101: 'A2-', 102: 'B1-', 103: 'B2', 104: 'A2+', 105: 'B2', 106: 'A2', 107: 'B1', 108: 'B1-',
    110: 'B1', 112: 'A1', 113: 'A2', 114: 'B1-', 115: 'A2-', 116: 'B1-', 117: 'A2', 118: 'B2', 119: 'B1+',
    120: 'B1', 121: 'A2-', 122: 'B2', 123: 'A2-', 124: 'B1-', 125: 'B1-', 126: 'A2+', 127: 'B1+', 128: 'B1+',
    129: 'B1+', 130: 'B2', 131: 'B2-', 132: 'B2', 133: 'B1', 134: 'B1', 135: 'A2', 136: 'A2', 137: 'A2',
    138: 'B1', 139: 'B1-', 140: 'A2+', 141: 'B1-', 142: 'B1-', 143: 'B1', 144: 'B2', 145: 'A2-', 146: 'A2-',
    147: 'B1-', 148: 'B1', 149: 'B2-', 150: 'A2',
  },
};

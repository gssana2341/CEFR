// GET /api/content?set=<grammar|conversations|extra|cloze>      → the questions WITHOUT answers or explanations
// GET /api/content?set=lesson&id=<lesson id>                      → one lesson (text, examples, exercises)
//
// The question banks live in content/ (not in public/), so this is the only way to get them. A members-only set is
// refused (401 not signed in / 402 not a member) before anything is read. Answers are never in these responses:
// they come back from /api/quiz after the learner has picked.
'use strict';
const { send, rateLimited } = require('./_pay');
const { limited } = require('./_ratelimit');
const { who, deny, members } = require('./_entitlements');
const bank = require('./_bank');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  if (rateLimited(req, 'content', 120)) return send(res, 429, { error: 'rate_limited' });

  const q = req.query || {};
  const set = typeof q.set === 'string' ? q.set : '';
  const id = typeof q.id === 'string' ? q.id.slice(0, 80) : '';

  // which feature is this set? (an unknown set is rejected before any lookup)
  let feature = null;
  let lesson = null;
  if (bank.isMcq(set) || set === 'cloze') {
    feature = set === 'grammar' ? 'practice:grammar' : 'practice:' + set;
  } else if (set === 'lesson') {
    lesson = bank.lessons().find((l) => l.id === id);
    if (!lesson) return send(res, 404, { error: 'not_found' });
    feature = 'lesson:' + lesson.level;
  } else {
    return send(res, 400, { error: 'bad_set' });
  }

  const ctx = await who(req);
  const refused = deny(ctx, feature);
  if (refused) return send(res, refused.status, { error: refused.error, feature });
  // one account may not pull the whole library over and over (a member can still copy what they are shown)
  if (await limited(req, 'content-day', 300, { uid: ctx.user && ctx.user.uid, windowMs: 86_400_000 })) return send(res, 429, { error: 'rate_limited' });

  if (set === 'lesson') {
    // the sentence mark-up of the exercises is part of the members' mark-up feature
    const clues = ctx.active || !members('markup') ? bank.clues('lessons')[lesson.id] : undefined;
    return send(res, 200, { lesson, clues });
  }
  if (set === 'cloze') return send(res, 200, { set, passages: bank.bank('cloze').map(bank.publicPassage) });
  return send(res, 200, { set, questions: bank.bank(set).map(bank.publicQuestion) });
};

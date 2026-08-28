// Deterministic berth allocation.
//
// Because the worker is the single writer per train-class, we don't need to
// store a cursor: the atomic decrement tells us this booking's ordinal
// (seatsTotal - newSeatsLeft, 1-based). We build the same ordered berth list
// every time and index into it by that ordinal → fully deterministic and
// race-free.
//
// Ordering: middle-coach-first, then lower-berth-first (LB/SL before MB/UB/SU),
// then berth number. This is a simplified but plausible allocation.

const TYPE_RANK = { LB: 0, SL: 1, MB: 2, UB: 3, SU: 4 };

// Standard sleeper bay of 8: 1=LB 2=MB 3=UB 4=LB 5=MB 6=UB 7=SL 8=SU.
function berthType(berthNo) {
  const m = berthNo % 8;
  return { 1: 'LB', 2: 'MB', 3: 'UB', 4: 'LB', 5: 'MB', 6: 'UB', 7: 'SL', 0: 'SU' }[m];
}

// Order coaches from the middle outward: [C, C+1, C-1, C+2, ...].
function coachesMiddleFirst(coaches) {
  const n = coaches.length;
  const mid = Math.floor((n - 1) / 2);
  const order = [];
  for (let d = 0; d < n; d++) {
    if (mid + d < n) order.push(coaches[mid + d]);
    if (d > 0 && mid - d >= 0) order.push(coaches[mid - d]);
  }
  return order;
}

// Build the full ordered berth sequence for a train-class (cached per key).
const cache = new Map();
function berthSequence(inv) {
  const key = `${inv.trainId}:${inv.class}`;
  if (cache.has(key)) return cache.get(key);

  const coaches = inv.coaches?.length ? inv.coaches : ['C1'];
  const perCoach = inv.berthsPerCoach || 72;
  const rankedCoaches = coachesMiddleFirst(coaches);

  const berths = [];
  rankedCoaches.forEach((coach, coachRank) => {
    for (let b = 1; b <= perCoach; b++) {
      const type = berthType(b);
      berths.push({ coach, coachRank, berthNo: b, berthType: type });
    }
  });
  berths.sort(
    (a, b) =>
      a.coachRank - b.coachRank ||
      TYPE_RANK[a.berthType] - TYPE_RANK[b.berthType] ||
      a.berthNo - b.berthNo
  );

  cache.set(key, berths);
  return berths;
}

/**
 * @param {object} inv   Inventory doc (needs trainId, class, seatsTotal, coaches, berthsPerCoach)
 * @param {number} newSeatsLeft  value AFTER the atomic decrement
 * @returns {{coach:string, berthNo:number, berthType:string}}
 */
export function allocateBerth(inv, newSeatsLeft) {
  const ordinal = inv.seatsTotal - newSeatsLeft; // 1-based: the Nth seat taken
  const seq = berthSequence(inv);
  const pick = seq[(ordinal - 1) % seq.length];
  return { coach: pick.coach, berthNo: pick.berthNo, berthType: pick.berthType };
}

// Display helpers mirrored from the server (shared/constants.js).
export const FARE = { SL: 550, '3A': 1250, '2A': 2100, '1A': 3600 };

export const CLASS_LABEL = {
  SL: 'Sleeper (SL)',
  '3A': 'AC 3-Tier (3A)',
  '2A': 'AC 2-Tier (2A)',
  '1A': 'AC First (1A)',
};

export const BERTH_LABEL = {
  LB: 'Lower', MB: 'Middle', UB: 'Upper', SL: 'Side Lower', SU: 'Side Upper', ANY: 'No preference',
};

export const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

/**
 * Roll number helpers.
 * GGSIPU roll = 11 digits: SSS (serial 3) + III (institution 3) + PPP (programme 3) + BB (batch 2).
 * @example parseRollNumber('00111102022') -> { serial: '001', institutionCode: '111', programmeCode: '020', batch: '22' }
 */

/** @param {string} roll */
export function parseRollNumber(roll: string): {
  serial: string;
  institutionCode: string;
  programmeCode: string;
  batch: string;
  rollNo: string;
} {
  const r = String(roll || '').trim();
  if (!/^\d{11}$/.test(r)) throw new Error('Roll number must be exactly 11 digits');
  return {
    serial: r.slice(0, 3),
    institutionCode: r.slice(3, 6),
    programmeCode: r.slice(6, 9),
    batch: r.slice(9, 11),
    rollNo: r,
  };
}

/** @param {string} roll */
export function isValidRollNumber(roll: string): boolean {
  return /^\d{11}$/.test(String(roll || '').trim());
}

const rollNumber = { parseRollNumber, isValidRollNumber };
export default rollNumber;

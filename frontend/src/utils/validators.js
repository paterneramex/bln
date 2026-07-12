// src/utils/validators.js
//
// Single source of truth for every validation rule used across the
// customers / pools / ipsups CRUD forms. Keeping this separate from the
// components means the exact same regexes/logic can be mirrored 1:1 on the
// Django side (see backend/validators.py) so client and server never
// disagree about what's "valid".

// ---------------------------------------------------------------------
// IPv4
// ---------------------------------------------------------------------

// Strict IPv4: 4 octets, 0-255, no letters, no leading garbage.
const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

export function isValidIPv4(value) {
  if (typeof value !== 'string') return false;
  return IPV4_REGEX.test(value.trim());
}

/**
 * Sanitizes IPv4 keystrokes WITHOUT forcing a fixed 3-digit-per-octet
 * grouping. IPv4 octets are 1-3 digits (1.1.1.1 and 192.168.122.120 are
 * both valid), so the user's own dots are respected rather than
 * re-chunked every 3 digits. This only:
 *   - strips characters that aren't digits or dots
 *   - collapses accidental double dots and a leading dot
 *   - caps the value at 4 octets
 *   - caps each octet at 3 digits, and backs off to 2 digits if the
 *     3-digit value would exceed 255 (so nothing invalid can ever be
 *     produced, without dictating when a dot gets inserted)
 *
 * IMPORTANT: this is the ONLY correct version of this function. A
 * previous variant stripped dots and force-chunked digits into groups
 * of exactly 3 before allowing the next octet — that variant is the
 * one responsible for the "must type 3 digits before advancing to the
 * next octet" bug (it made "1.1.1.1" impossible to type naturally).
 * Do not reintroduce that logic.
 */
export function formatIPv4Typing(raw) {
  let cleaned = String(raw).replace(/[^\d.]/g, '');
  cleaned = cleaned.replace(/\.{2,}/g, '.').replace(/^\./, '');

  const groups = cleaned.split('.').slice(0, 4).map((group) => {
    let digits = group.slice(0, 3);
    if (digits.length === 3 && Number(digits) > 255) {
      digits = digits.slice(0, 2);
    }
    return digits;
  });

  return groups.join('.');
}

// A wildcard mask uses the exact same dotted 4-octet shape as an IP
// address (e.g. 0.0.0.255), so it reuses the IPv4 rules.
export const isValidWildcard = isValidIPv4;
export const formatWildcardTyping = formatIPv4Typing;

// ---------------------------------------------------------------------
// MAC addresses — format enforced: c83a.4578.96f7 (hex, dot-grouped)
// ---------------------------------------------------------------------

const MAC_REGEX = /^[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}$/;

export function isValidMac(value) {
  if (typeof value !== 'string') return false;
  return MAC_REGEX.test(value.trim());
}

/**
 * Strips anything non-hex, groups into 4-4-4, dot-separated, capped at
 * 12 hex characters (matches the char(14) DB column exactly: 12 hex +
 * 2 dots = 14).
 */
export function formatMacTyping(raw) {
  let hex = String(raw).replace(/[^0-9a-fA-F]/g, '');
  if (hex.length > 12) hex = hex.slice(0, 12);
  const groups = [];
  for (let i = 0; i < hex.length; i += 4) groups.push(hex.slice(i, i + 4));
  return groups.join('.');
}

/**
 * Returns true if the raw (unformatted) keystroke stream contains a
 * character that is not a hex digit or a dot — used to fire the
 * "not hexa format" message immediately, instead of waiting for a full
 * 14-char value.
 */
export function containsNonHexChar(raw) {
  return /[^0-9a-fA-F.]/.test(String(raw));
}

// ---------------------------------------------------------------------
// Prefix / mask length — stored as 2-char string, e.g. "08", "24", "32"
// ---------------------------------------------------------------------

export function isValidMaskShort(value, min = 8, max = 32) {
  if (value === '' || value === null || value === undefined) return false;
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max;
}

// Pads to 2 chars to match the char(2) DB column ("8" -> "08").
export function formatMaskShort(raw) {
  const digits = String(raw).replace(/\D/g, '').slice(0, 2);
  return digits;
}

export function padMaskForSubmit(value) {
  const n = Number(value);
  if (!Number.isInteger(n)) return value;
  return String(n).padStart(2, '0');
}

// ---------------------------------------------------------------------
// Plain non-negative integers — produit_level, bw_in, bw_out, bw_rapport,
// pool_num, upgraded, etc.
// ---------------------------------------------------------------------

export function isValidNonNegativeInt(value) {
  if (value === '' || value === null || value === undefined) return false;
  return /^\d+$/.test(String(value));
}

export function formatIntTyping(raw, maxDigits = 15) {
  return String(raw).replace(/\D/g, '').slice(0, maxDigits);
}

// ---------------------------------------------------------------------
// Duplicate / uniqueness helpers
// ---------------------------------------------------------------------

/**
 * Case-insensitive membership check against a list of existing records,
 * optionally excluding the record currently being edited (by id) so an
 * unchanged value doesn't flag itself as a duplicate.
 */
export function isDuplicateValue(value, existingList, field, currentId = null) {
  if (!value) return false;
  const needle = String(value).trim().toLowerCase();
  if (!needle) return false;
  return existingList.some((item) => {
    if (currentId != null && item.id === currentId) return false;
    const existing = item[field];
    return existing != null && String(existing).trim().toLowerCase() === needle;
  });
}

// ---------------------------------------------------------------------
// Cross-table conflicts — e.g. a value typed into customers.customer_ip
// that already exists as ipsups.ipsup_netw. This is deliberately generic
// (a list of {existingList, duplicateField, label} checks) so more pairs
// can be added later (e.g. customer_ip vs pool_host) without touching
// ValidatedField itself — just pass more entries in the `crossChecks`
// array from the form.
//
// No `currentId` exclusion here: the comparison list belongs to a
// DIFFERENT table than the record being edited, so there is no
// "excluding my own row" case — any match is a genuine cross-table hit.
export function findCrossTableConflict(value, crossChecks = []) {
  if (!value) return null;
  for (const check of crossChecks) {
    if (isDuplicateValue(value, check.existingList, check.duplicateField, null)) {
      return check.label || `This value already exists in ${check.duplicateField}`;
    }
  }
  return null;
}

// ---------------------------------------------------------------------
// Payload sanitation — trims leading/trailing whitespace before a
// create/update request ever reaches the API.
// ---------------------------------------------------------------------

/**
 * Returns a shallow copy of `payload` with every string value cleaned up
 * before it reaches the API:
 *   - leading whitespace stripped
 *   - trailing whitespace stripped
 *   - any embedded carriage return / line break (\r, \n, \r\n — common
 *     when a value is copy-pasted from Excel, Word, or a text file)
 *     collapsed to a plain space
 * Internal single spaces are left alone (e.g. "New York" stays intact).
 * Non-string values (numbers, booleans, null) pass through unchanged.
 *
 * This is the single choke point applied right before every create/update
 * request (see App.jsx's createRecord/updateRecord) — it runs for every
 * field of every table (customers/pools/ipsups/hbs) automatically,
 * without each *Form.jsx having to remember to do it. A stray space or a
 * hidden line break is very easy to introduce via copy-paste, and can
 * otherwise break a MySQL UNIQUE constraint match, corrupt an IP/MAC
 * comparison, or trip a CHAR/VARCHAR length limit — so this runs
 * unconditionally on every submit.
 */
export function trimPayload(payload) {
  const trimmed = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value !== 'string') {
      trimmed[key] = value;
      continue;
    }
    trimmed[key] = value.replace(/\r\n|\r|\n/g, ' ').trim();
  }
  return trimmed;
}

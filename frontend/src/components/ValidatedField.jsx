// src/components/ValidatedField.jsx
//
// One input component, driven by a `type` prop, used everywhere across
// customers / pools / ipsups / hbs forms. Formats input as the user
// types (auto-dotting IPs and MACs) and shows an inline message
// immediately — no "Validate" button, no onBlur delay.

import { useMemo } from 'react';
import {
  isValidIPv4,
  formatIPv4Typing,
  isValidMac,
  formatMacTyping,
  containsNonHexChar,
  isValidMaskShort,
  formatMaskShort,
  formatWildcardTyping,
  isValidNonNegativeInt,
  formatIntTyping,
  isDuplicateValue,
  findCrossTableConflict,
} from '../utils/validators';

const FONT_STACK = "Calibri, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

/**
 * @param {string} type - 'ipv4' | 'mac' | 'mask' | 'wildcard' | 'int' | 'select' | 'text'
 * @param {boolean} checkDuplicate - if true, value is checked against existingList
 * @param {Array} existingList - rows already loaded (e.g. dashboardData.customers)
 * @param {string} duplicateField - key on each row to compare against (e.g. 'customer_ip')
 * @param {number|string|null} currentId - id being edited, excluded from its own duplicate check
 * @param {Array<{value:string,label:string}>} options - only for type === 'select'
 */
export default function ValidatedField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  placeholder = '',
  checkDuplicate = false,
  existingList = [],
  duplicateField = null,
  currentId = null,
  maskMin = 8,
  maskMax = 32,
  helpText = '',
  options = [],
  crossChecks = [],
}) {
  const handleChange = (e) => {
    const raw = e.target.value;
    let formatted = raw;

    if (type === 'ipv4') formatted = formatIPv4Typing(raw);
    else if (type === 'mac') formatted = formatMacTyping(raw);
    else if (type === 'wildcard') formatted = formatWildcardTyping(raw);
    else if (type === 'mask') formatted = formatMaskShort(raw);
    else if (type === 'int') formatted = formatIntTyping(raw);

    onChange(name, formatted, raw);
  };

  const status = useMemo(() => {
    if (type === 'select') return { level: 'neutral', msg: '' };

    if (!value) {
      return required ? { level: 'neutral', msg: 'Champ requis' } : { level: 'neutral', msg: '' };
    }

    // Duplicate check takes priority — no point validating format of a
    // value that already exists elsewhere.
    if (checkDuplicate && duplicateField) {
      const dup = isDuplicateValue(value, existingList, duplicateField, currentId);
      if (dup) {
        return { level: 'error', msg: `Ce champ « ${label} » existe déjà` };
      }
    }

    // Cross-table conflicts — e.g. this exact value already exists as an
    // ipsups.ipsup_netw entry, even though it's never been used as a
    // customer IP before. Same priority as the self-duplicate check
    // above: no point validating format once we already know the value
    // collides with something.
    if (crossChecks.length) {
      const conflict = findCrossTableConflict(value, crossChecks);
      if (conflict) {
        return { level: 'error', msg: conflict };
      }
    }

    if (type === 'ipv4' || type === 'wildcard') {
      const parts = value.split('.').filter(Boolean).length;
      if (isValidIPv4(value)) return { level: 'ok', msg: 'Adresse IPv4 valide' };
      if (parts < 4) return { level: 'pending', msg: `${4 - parts} octet(s) restant(s)` };
      return { level: 'error', msg: 'IPv4 invalide — chaque octet doit être entre 0 et 255' };
    }

    if (type === 'mac') {
      if (containsNonHexChar(value)) {
        return { level: 'error', msg: 'Format non hexadécimal — seuls 0-9 et a-f sont autorisés' };
      }
      if (isValidMac(value)) return { level: 'ok', msg: 'Adresse MAC valide' };
      const hexCount = value.replace(/\./g, '').length;
      return { level: 'pending', msg: `${12 - hexCount} caractère(s) hexadécimal(aux) restant(s)` };
    }

    if (type === 'mask') {
      if (isValidMaskShort(value, maskMin, maskMax)) {
        return { level: 'ok', msg: `Préfixe valide /${Number(value)}` };
      }
      return { level: 'error', msg: `Doit être compris entre /${maskMin} et /${maskMax}` };
    }

    if (type === 'int') {
      if (isValidNonNegativeInt(value)) return { level: 'ok', msg: '' };
      return { level: 'error', msg: 'Nombres entiers uniquement' };
    }

    return { level: 'ok', msg: '' };
  }, [value, type, checkDuplicate, duplicateField, existingList, currentId, required, label, maskMin, maskMax, crossChecks]);

  const borderClass = {
    ok: 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200',
    error: 'border-rose-400 focus:border-rose-500 focus:ring-rose-200',
    pending: 'border-amber-400 focus:border-amber-500 focus:ring-amber-200',
    neutral: 'border-blue-200 focus:border-blue-400 focus:ring-blue-200',
  }[status.level];

  const msgClass = {
    ok: 'text-emerald-600',
    error: 'text-rose-600',
    pending: 'text-amber-600',
    neutral: 'text-blue-400',
  }[status.level];

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <label className="block text-xs font-semibold tracking-wide text-blue-800 uppercase">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {type === 'select' ? (
        <select
          name={name}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(name, e.target.value, e.target.value)}
          className={`w-full mt-1 bg-white border rounded-md px-3 py-2 text-sm text-blue-950 shadow-sm focus:outline-none focus:ring-2 transition-colors ${borderClass} ${
            disabled ? 'opacity-50 cursor-not-allowed bg-blue-50' : ''
          }`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          name={name}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={handleChange}
          className={`w-full mt-1 bg-white border rounded-md px-3 py-2 text-sm text-blue-950 placeholder:text-blue-300 shadow-sm focus:outline-none focus:ring-2 transition-colors ${borderClass} ${
            disabled ? 'opacity-50 cursor-not-allowed bg-blue-50' : ''
          }`}
        />
      )}

      {(status.msg || helpText) && (
        <p className={`mt-1 text-xs ${status.msg ? msgClass : 'text-blue-300'}`}>
          {status.msg || helpText}
        </p>
      )}
    </div>
  );
}

/**
 * Exposes the same validity logic used above so parent forms can disable
 * the submit button until every field is genuinely valid, without
 * duplicating the rules.
 */
export function fieldIsValid({
  value,
  type,
  required,
  checkDuplicate,
  existingList,
  duplicateField,
  currentId = null,
  maskMin = 8,
  maskMax = 32,
  crossChecks = [],
}) {
  if (type === 'select') return true;
  if (!value) return !required;
  if (checkDuplicate && duplicateField && isDuplicateValue(value, existingList, duplicateField, currentId)) {
    return false;
  }
  if (crossChecks.length && findCrossTableConflict(value, crossChecks)) {
    return false;
  }
  if (type === 'ipv4' || type === 'wildcard') return isValidIPv4(value);
  if (type === 'mac') return isValidMac(value);
  if (type === 'mask') return isValidMaskShort(value, maskMin, maskMax);
  if (type === 'int') return isValidNonNegativeInt(value);
  return true;
}

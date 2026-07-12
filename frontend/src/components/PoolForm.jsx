// src/components/PoolForm.jsx
import { useState } from 'react';
import ValidatedField, { fieldIsValid } from './ValidatedField';
import { padMaskForSubmit } from '../utils/validators';

const FONT_STACK = "Calibri, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const EMPTY = {
  pool_code: '',       // IPv4-shaped per requirements; auto-mirrored to pool_netw
  pool_netw: '',       // auto-filled from pool_code, never edited directly
  pool_relais: '',
  pool_prod: '',
  pool_prod_name: '',
  pool_num: '0',
  pool_host: '',
  pool_gtw: '',
  pool_mask_long: '',
  pool_mask_court: '',
  pool_deb: '',
  pool_fin: '',
};

const FIELD_SPECS = [
  { name: 'pool_code', label: 'Pool Code', type: 'ipv4', required: true, placeholder: '10.0.1.0' },
  { name: 'pool_relais', label: 'Pool Relay', type: 'text', required: true, placeholder: 'Relay identifier' },
  { name: 'pool_prod', label: 'Product Code', type: 'text', required: true, placeholder: 'e.g. FIBER' },
  { name: 'pool_prod_name', label: 'Product Name', type: 'text', required: true, placeholder: 'e.g. Fiber 10M' },
  { name: 'pool_num', label: 'Pool Number', type: 'int', required: true, placeholder: '0' },
  { name: 'pool_host', label: 'Pool Host', type: 'ipv4', required: true, placeholder: '10.0.1.1' },
  { name: 'pool_gtw', label: 'Gateway', type: 'ipv4', required: true, placeholder: '10.0.1.254' },
  { name: 'pool_mask_long', label: 'Mask (long form)', type: 'ipv4', required: true, placeholder: '255.255.255.0' },
  { name: 'pool_mask_court', label: 'Mask (prefix length)', type: 'mask', required: true, placeholder: '24', helpText: 'Between /8 and /32' },
  { name: 'pool_deb', label: 'Range Start', type: 'ipv4', required: true, placeholder: '10.0.1.10' },
  { name: 'pool_fin', label: 'Range End', type: 'ipv4', required: true, placeholder: '10.0.1.250' },
];

export default function PoolForm({ onSubmit, onCancel, initialData = null, mode = 'create' }) {
  const [form, setForm] = useState(initialData ? { ...EMPTY, ...initialData } : EMPTY);

  const handleFieldChange = (name, formatted) => {
    setForm((prev) => {
      const next = { ...prev, [name]: formatted };
      // Automation: pool_netw always mirrors pool_code.
      if (name === 'pool_code') next.pool_netw = formatted;
      return next;
    });
  };

  const allValid = FIELD_SPECS.every((spec) =>
    fieldIsValid({ value: form[spec.name], type: spec.type, required: spec.required })
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) return;
    const success = await onSubmit({
      ...form,
      pool_mask_court: padMaskForSubmit(form.pool_mask_court),
    });
    if (success && mode === 'create') setForm(EMPTY);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" style={{ fontFamily: FONT_STACK }}>
      {FIELD_SPECS.map((spec) => (
        <ValidatedField
          key={spec.name}
          label={spec.label}
          name={spec.name}
          value={form[spec.name]}
          onChange={handleFieldChange}
          type={spec.type}
          required={spec.required}
          placeholder={spec.placeholder}
          helpText={spec.helpText}
        />
      ))}

      <ValidatedField
        label="Pool Network — auto-filled"
        name="pool_netw"
        value={form.pool_netw}
        onChange={() => {}}
        type="ipv4"
        disabled
        helpText="Automatically duplicated from Pool Code"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!allValid}
          className="flex-1 py-2.5 px-4 mt-2 rounded-lg bg-blue-700 hover:bg-blue-600 active:bg-blue-800 disabled:bg-blue-50 disabled:text-blue-300 disabled:cursor-not-allowed transition font-semibold text-sm text-white shadow-md cursor-pointer"
        >
          {mode === 'edit' ? 'Enregistrer les modifications' : 'Ajouter au registre actif'}
        </button>
        {mode === 'edit' && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 mt-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition font-semibold text-sm text-blue-800 cursor-pointer"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

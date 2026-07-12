// src/components/IpsupForm.jsx
import { useState } from 'react';
import ValidatedField, { fieldIsValid } from './ValidatedField';
import { padMaskForSubmit } from '../utils/validators';

const FONT_STACK = "Calibri, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const EMPTY = {
  ipsup_name: '',
  ipsup_dest: '',
  ipsup_netw: '',
  ipsup_mask_court: '',
  ipsup_mask_long: '',
  ipsup_relais: '',
  ipsup_wildcard: '',
};

const FIELD_SPECS = [
  { name: 'ipsup_name', label: 'Supervision Name', type: 'text', required: false, placeholder: 'e.g. Sambava-Core' },
  { name: 'ipsup_dest', label: 'Destination', type: 'ipv4', required: true, placeholder: '41.204.103.205' },
  { name: 'ipsup_netw', label: 'Network', type: 'ipv4', required: true, placeholder: '41.204.103.0' },
  { name: 'ipsup_mask_court', label: 'Mask (prefix length)', type: 'mask', required: true, placeholder: '24', helpText: 'Between /8 and /32' },
  { name: 'ipsup_mask_long', label: 'Mask (long form)', type: 'ipv4', required: true, placeholder: '255.255.255.0' },
  { name: 'ipsup_relais', label: 'Relay', type: 'text', required: false, placeholder: 'Relay identifier' },
  { name: 'ipsup_wildcard', label: 'Wildcard Mask', type: 'wildcard', required: false, placeholder: '0.0.0.255' },
];

export default function IpsupForm({ onSubmit, onCancel, existingCustomers = [], initialData = null, mode = 'create' }) {
  const [form, setForm] = useState(initialData ? { ...EMPTY, ...initialData } : EMPTY);

  // Reciprocal of the check on CustomerForm's customer_ip field: an
  // ipsups network address can't collide with an existing customer IP
  // either. Same relationship, checked from the other direction.
  const ipsupNetwCrossChecks = [
    {
      existingList: existingCustomers,
      duplicateField: 'customer_ip',
      label: 'Cette adresse réseau est déjà utilisée comme IP client (customers.customer_ip)',
    },
  ];

  const handleFieldChange = (name, formatted) => {
    setForm((prev) => ({ ...prev, [name]: formatted }));
  };

  const allValid = FIELD_SPECS.every((spec) =>
    fieldIsValid({
      value: form[spec.name],
      type: spec.type,
      required: spec.required,
      crossChecks: spec.name === 'ipsup_netw' ? ipsupNetwCrossChecks : [],
    })
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) return;
    const success = await onSubmit({
      ...form,
      ipsup_mask_court: padMaskForSubmit(form.ipsup_mask_court),
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
          crossChecks={spec.name === 'ipsup_netw' ? ipsupNetwCrossChecks : []}
        />
      ))}

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

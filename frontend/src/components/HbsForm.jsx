// src/components/HbsForm.jsx
import { useState } from 'react';
import ValidatedField, { fieldIsValid } from './ValidatedField';

const FONT_STACK = "Calibri, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const EMPTY = {
  secteur_ip: '',
  code_relais: '',
  nom_relai: '',
  producttype: '',
  upgraded: '0',
};

const FIELD_SPECS = [
  { name: 'secteur_ip', label: 'Sector IP', type: 'ipv4', required: false, placeholder: '41.204.103.0' },
  { name: 'code_relais', label: 'Relay Code', type: 'text', required: false, placeholder: 'e.g. RLY-042' },
  { name: 'nom_relai', label: 'Relay Name', type: 'text', required: true, placeholder: 'Relay full name' },
  { name: 'producttype', label: 'Product Type', type: 'text', required: false, placeholder: 'e.g. FIBER' },
  {
    name: 'upgraded',
    label: 'Upgraded',
    type: 'select',
    required: true,
    options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' },
    ],
  },
];

export default function HbsForm({ onSubmit, onCancel, initialData = null, mode = 'create' }) {
  const [form, setForm] = useState(
    initialData ? { ...EMPTY, ...initialData, upgraded: String(initialData.upgraded ?? '0') } : EMPTY
  );

  const handleFieldChange = (name, formatted) => {
    setForm((prev) => ({ ...prev, [name]: formatted }));
  };

  const allValid = FIELD_SPECS.every((spec) =>
    fieldIsValid({ value: form[spec.name], type: spec.type, required: spec.required })
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) return;
    const success = await onSubmit({ ...form, upgraded: Number(form.upgraded) });
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
          options={spec.options}
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

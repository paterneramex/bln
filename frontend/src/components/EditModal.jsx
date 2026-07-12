// src/components/EditModal.jsx
import CustomerForm from './CustomerForm';
import PoolForm from './PoolForm';
import IpsupForm from './IpsupForm';
import HbsForm from './HbsForm';

const FORM_BY_TABLE = {
  customers: CustomerForm,
  pools: PoolForm,
  ipsups: IpsupForm,
  hbs: HbsForm,
};

const FONT_STACK = "Calibri, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

export default function EditModal({ table, record, existingCustomers = [], existingIpsups = [], existingPools = [], onClose, onSubmit }) {
  const FormComponent = FORM_BY_TABLE[table];
  if (!FormComponent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto border border-blue-200 rounded-2xl bg-white p-6 shadow-2xl"
        style={{ fontFamily: FONT_STACK }}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-100">
          <h3 className="text-base font-semibold text-blue-900 capitalize">
            Modifier l'enregistrement {table.slice(0, -1)} #{record.id}
          </h3>
          <button
            onClick={onClose}
            className="text-blue-400 hover:text-blue-700 text-xl leading-none cursor-pointer transition"
          >
            ×
          </button>
        </div>
        <FormComponent
          mode="edit"
          initialData={record}
          existingCustomers={existingCustomers}
          existingIpsups={existingIpsups}
          existingPools={existingPools}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

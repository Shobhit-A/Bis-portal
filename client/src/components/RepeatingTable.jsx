import React from 'react';
import { X, Plus } from 'lucide-react';
import { FileUpload } from './FormField';

// Renders an add/remove-able table of rows for ISI's array sections (product variety,
// raw materials, packaging rows, etc — FMCS has none of these).
//
// Each row MUST carry a stable `id` (crypto.randomUUID()), assigned once at creation.
// A file column's upload fieldKey is `${sectionKey}_${column.fieldKeySuffix}_${row.id}` —
// never derive it from the row's array index, or removing/reordering rows will silently
// reassign an uploaded document to the wrong row.
export function RepeatingTable({ sectionKey, columns, rows, onChange, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const list = rows || [];

  const addRow = () => onChange([...list, { id: crypto.randomUUID() }]);
  const removeRow = (id) => onChange(list.filter(r => r.id !== id));
  const setCell = (id, key, value) => onChange(list.map(r => r.id === id ? { ...r, [key]: value } : r));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-border rounded">
          <thead>
            <tr className="bg-gray-50">
              {columns.map(c => (
                <th key={c.key} className="text-left px-2 py-1.5 font-medium text-gray-500 border-b border-border whitespace-nowrap">{c.label}</th>
              ))}
              {!isSubmitted && <th className="px-2 py-1.5 border-b border-border w-8" />}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="text-center py-4 text-gray-400">No rows added yet</td></tr>
            ) : list.map(row => (
              <tr key={row.id} className="border-b border-border last:border-0">
                {columns.map(c => (
                  <td key={c.key} className="px-2 py-1.5 align-top">
                    {c.type === 'file' ? (
                      <FileUpload
                        fieldKey={`${sectionKey}_${c.fieldKeySuffix}_${row.id}`}
                        fieldLabel={c.label}
                        existingDoc={getDocForField(`${sectionKey}_${c.fieldKeySuffix}_${row.id}`)}
                        onUploaded={onDocUploaded}
                        onRemoved={onDocRemoved}
                      />
                    ) : c.type === 'select' ? (
                      <select className="text-xs border border-border rounded px-1 py-0.5 bg-white w-full" value={row[c.key] || ''}
                        onChange={e => setCell(row.id, c.key, e.target.value)} disabled={isSubmitted}>
                        <option value="">Select</option>
                        {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input className="text-xs border border-border rounded px-1.5 py-1 w-full"
                        type={c.type === 'date' ? 'date' : c.type === 'number' ? 'number' : 'text'}
                        value={row[c.key] || ''} onChange={e => setCell(row.id, c.key, e.target.value)} disabled={isSubmitted} />
                    )}
                  </td>
                ))}
                {!isSubmitted && (
                  <td className="px-2 py-1.5 align-top">
                    <button type="button" onClick={() => removeRow(row.id)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isSubmitted && (
        <button type="button" onClick={addRow} className="text-xs text-primary hover:underline flex items-center gap-1">
          <Plus size={13} /> Add Row
        </button>
      )}
    </div>
  );
}

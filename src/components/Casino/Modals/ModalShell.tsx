import React from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  widthClassName?: string;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  widthClassName = 'max-w-lg',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClassName} rounded-2xl p-5 md:p-6 max-h-[90vh] overflow-y-auto`}
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-primary text-lg font-bold">{title}</h3>
            {subtitle && <p className="text-muted text-xs mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-muted hover:text-primary"
            style={{ backgroundColor: 'var(--color-surface-2)' }}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// --- Champs de formulaire réutilisables, alignés sur le thème ---------------

export const FormField: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({
  label,
  children,
  hint,
}) => (
  <div className="mb-3">
    <label className="block text-xs font-medium text-muted mb-1">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
  </div>
);

const baseInputClass = 'w-full h-10 px-3 rounded-xl text-primary text-sm outline-none';
const baseInputStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
};

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`${baseInputClass} ${props.className || ''}`} style={{ ...baseInputStyle, ...props.style }} />
);

export const SelectInput: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className={`${baseInputClass} ${props.className || ''}`} style={{ ...baseInputStyle, ...props.style }} />
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    className={`w-full px-3 py-2 rounded-xl text-primary text-sm outline-none resize-none ${props.className || ''}`}
    style={{ ...baseInputStyle, ...props.style }}
  />
);

export const ModalActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center justify-end gap-2 mt-5 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
    {children}
  </div>
);

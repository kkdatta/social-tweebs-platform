import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

type Align = 'left' | 'right' | 'center';

interface SortableThProps {
  children: React.ReactNode;
  active: boolean;
  direction: 'asc' | 'desc';
  onClick: () => void;
  align?: Align;
  className?: string;
}

export function SortableTh({
  children,
  active,
  direction,
  onClick,
  align = 'left',
  className = '',
}: SortableThProps) {
  const alignCls =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  const btnCls =
    align === 'right'
      ? 'w-full flex items-center justify-end gap-1'
      : align === 'center'
        ? 'w-full flex items-center justify-center gap-1'
        : 'inline-flex items-center gap-1';

  return (
    <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase ${alignCls} ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className={`${btnCls} hover:text-gray-800 select-none`}
      >
        {children}
        {active ? (
          direction === 'asc' ? (
            <ChevronUp className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          )
        ) : (
          <span className="inline-flex flex-col shrink-0 opacity-35 leading-none" aria-hidden>
            <ChevronUp className="w-2.5 h-2.5 -mb-1" />
            <ChevronDown className="w-2.5 h-2.5" />
          </span>
        )}
      </button>
    </th>
  );
}

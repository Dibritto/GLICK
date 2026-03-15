import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'bottom' }) => {
  const isTop = position === 'top';

  return (
    <div className="group relative inline-flex items-center">
      {children}
      <div className={`
        absolute left-1/2 -translate-x-1/2 px-2 py-1 
        bg-brand-lead text-[10px] text-white rounded border border-brand-blue/30 
        whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none 
        transition-opacity z-[9999] shadow-2xl
        ${isTop ? 'bottom-full mb-2' : 'top-full mt-2'}
      `}>
        {text}
        <div className={`
          absolute left-1/2 -translate-x-1/2 border-4 border-transparent
          ${isTop ? 'top-full border-t-brand-lead' : 'bottom-full border-b-brand-lead'}
        `} />
      </div>
    </div>
  );
};


export default Tooltip;

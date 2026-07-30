import React from 'react';

export default function PageHeader({ title, description, icon: Icon, children }) {
  return (
    <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#3C110D] text-white p-4 sm:p-6 rounded-2xl sm:rounded-[24px] border border-[#F8A324]/20 shadow-lg gap-3 sm:gap-4">
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
        {Icon && (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F8A324]/10 border border-[#F8A324]/20 flex items-center justify-center text-[#F8A324] shrink-0 mt-0.5">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-serif font-black text-sm sm:text-base lg:text-lg text-white tracking-wide leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-[10px] sm:text-[11px] text-amber-100/70 font-medium mt-0.5 leading-snug">{description}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-start sm:justify-end">
          {children}
        </div>
      )}
    </div>
  );
}


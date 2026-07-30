import React from 'react';

export default function SkeletonLoader({ type = 'default' }) {
  const pulseClass = "animate-pulse bg-gray-200 rounded-xl";
  
  if (type === 'dashboard') {
    return (
      <div className="space-y-8 w-full animate-fadeIn">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className={`h-8 w-48 ${pulseClass}`}></div>
            <div className={`h-4 w-64 ${pulseClass}`}></div>
          </div>
          <div className={`h-10 w-24 ${pulseClass}`}></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-gray-200 p-5 rounded-xl h-28 flex flex-col justify-between">
               <div className={`h-3 w-16 ${pulseClass}`}></div>
               <div className={`h-8 w-24 ${pulseClass}`}></div>
               <div className={`h-3 w-32 ${pulseClass}`}></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className={`col-span-1 lg:col-span-2 h-96 ${pulseClass}`}></div>
           <div className={`col-span-1 h-96 ${pulseClass}`}></div>
        </div>
      </div>
    );
  }

  if (type === 'orders') {
    return (
      <div className="space-y-6 w-full animate-fadeIn">
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 mb-6">
           <div className={`h-6 w-32 ${pulseClass}`}></div>
           <div className={`h-6 w-24 ${pulseClass}`}></div>
           <div className={`h-6 w-28 ${pulseClass}`}></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`h-48 ${pulseClass}`}></div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'menu') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-fadeIn">
        <div className={`col-span-1 h-[80vh] ${pulseClass}`}></div>
        <div className="col-span-1 lg:col-span-2 space-y-6">
           <div className="flex justify-between">
              <div className={`h-10 w-64 ${pulseClass}`}></div>
              <div className={`h-10 w-32 ${pulseClass}`}></div>
           </div>
           {[1, 2, 3, 4, 5].map(i => (
             <div key={i} className={`h-24 ${pulseClass}`}></div>
           ))}
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-6 w-full animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
           <div className="space-y-2">
             <div className={`h-8 w-56 ${pulseClass}`}></div>
             <div className={`h-4 w-72 ${pulseClass}`}></div>
           </div>
           <div className={`h-10 w-32 ${pulseClass}`}></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className={`h-32 ${pulseClass}`}></div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-6 w-full animate-fadeIn">
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-100">
           <div className="space-y-2">
             <div className={`h-8 w-48 ${pulseClass}`}></div>
             <div className={`h-4 w-64 ${pulseClass}`}></div>
           </div>
           <div className={`h-10 w-24 ${pulseClass}`}></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <div className={`h-24 ${pulseClass}`}></div>
          <div className={`h-24 ${pulseClass}`}></div>
        </div>
        <div className="bg-white border border-gray-100 p-6 rounded-2xl">
           <div className="flex gap-4 mb-6">
             <div className={`h-10 flex-1 ${pulseClass}`}></div>
             <div className={`h-10 w-48 ${pulseClass}`}></div>
           </div>
           <div className="space-y-4">
             <div className={`h-12 w-full ${pulseClass}`}></div>
             {[1, 2, 3, 4, 5, 6].map(i => (
               <div key={i} className={`h-16 w-full ${pulseClass}`}></div>
             ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      <div className={`h-12 w-full ${pulseClass}`}></div>
      <div className={`h-32 w-full ${pulseClass}`}></div>
    </div>
  );
}

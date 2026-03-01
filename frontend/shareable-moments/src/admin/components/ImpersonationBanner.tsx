import React, { useEffect, useState } from 'react';

const ImpersonationBanner: React.FC = () => {
  const [data, setData] = useState<{ customerId: string; customerName: string } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('shyara_admin_impersonate');
    if (raw) {
      try { setData(JSON.parse(raw)); } catch {}
    }
  }, []);

  if (!data) return null;

  const handleExit = () => {
    sessionStorage.removeItem('shyara_admin_impersonate');
    window.close();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between text-sm font-medium font-body" style={{ userSelect: 'none' }}>
      <span>⚠️ Admin View — You are viewing as <strong>{data.customerName}</strong></span>
      <button onClick={handleExit} className="px-3 py-1 bg-amber-950 text-amber-100 rounded text-xs font-bold hover:bg-amber-900 transition-colors">
        Exit Admin View
      </button>
    </div>
  );
};

export default ImpersonationBanner;

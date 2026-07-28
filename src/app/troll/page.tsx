'use client';

import React, { useEffect } from 'react';
import { AutoTrollTab } from '@/components/tabs/AutoTrollTab';

export default function TrollPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <AutoTrollTab />;
}

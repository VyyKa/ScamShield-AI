'use client';

import React, { useEffect } from 'react';
import { ScanVerifyTab } from '@/components/tabs/ScanVerifyTab';

export default function ScanPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <ScanVerifyTab />;
}

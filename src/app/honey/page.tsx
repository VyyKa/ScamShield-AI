'use client';

import React, { useEffect } from 'react';
import { HoneyChallengeTab } from '@/components/tabs/HoneyChallengeTab';

export default function HoneyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <HoneyChallengeTab />;
}

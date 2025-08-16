
'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

interface GlobalAiStatus {
  disabled: boolean;
  reason: string | null;
}

export function useGlobalAiStatus() {
  const [status, setStatus] = useState<GlobalAiStatus>({ disabled: false, reason: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/global-ai-status`);
        if (!res.ok) {
          throw new Error('Failed to fetch global AI status');
        }
        const data = await res.json();
        setStatus(data);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred");
        setStatus({ disabled: false, reason: null });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // Optional: Poll for changes every minute
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);

  }, []);

  return { status, loading, error };
}

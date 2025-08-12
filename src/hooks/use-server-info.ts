
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

interface ServerInfo {
  id: string;
  name: string;
  icon: string | null;
  isPremium: boolean;
  channels: any[];
  roles: any[];
}

export function useServerInfo() {
  const params = useParams();
  const serverId = params.serverId as string;
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serverId) {
        setLoading(false);
        setError("No server ID provided.");
        return;
    };

    const fetchServerInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/get-server-details/${serverId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch server details');
        }
        const data = await res.json();
        setServerInfo(data);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred");
        setServerInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchServerInfo();
  }, [serverId]);

  return { serverInfo, loading, error };
}

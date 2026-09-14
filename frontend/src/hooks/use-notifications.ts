'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface NotificationItem {
  id: string;
  scheduledAt: string;
  patientName: string;
  procedureName: string;
  status: string;
}

export interface NotificationsData {
  count: number;
  upcoming: NotificationItem[];
}

const POLL_INTERVAL = 60_000; // 60 segundos

export function useNotifications() {
  const [data, setData] = useState<NotificationsData>({
    count: 0,
    upcoming: [],
  });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<NotificationsData>('/api/notifications');
      setData(res);
    } catch {
      // silencioso — não queremos poluir o usuário com erro de notificação
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  return { ...data, loading, refresh: load };
}

import React, { createContext, useContext, useState } from 'react';
import { TraceMeta } from '../types';

// Very small provider-style store (can be swapped for Zustand/Redux)
type TraceContextType = {
  deviceId?: string | null;
  setDeviceId: (id?: string | null) => void;
  traceMeta?: TraceMeta | null;
  setTraceMeta: (m?: TraceMeta | null) => void;
};

const TraceContext = createContext<TraceContextType | undefined>(undefined);

export const TraceProvider: React.FC = ({ children }) => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [traceMeta, setTraceMeta] = useState<TraceMeta | null>(null);

  return (
    <TraceContext.Provider value={{ deviceId, setDeviceId, traceMeta, setTraceMeta }}>
      {children}
    </TraceContext.Provider>
  );
};

export function useTraceStore() {
  const ctx = useContext(TraceContext);
  if (!ctx) throw new Error('useTraceStore must be used inside TraceProvider');
  return ctx;
}

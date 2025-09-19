import { useState, useEffect } from 'react';

// Global event system for forcing updates across components
class GlobalUpdateManager {
  private listeners: Set<() => void> = new Set();
  private updateCount = 0;

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  trigger() {
    this.updateCount++;
    console.log('🔄 Global update triggered:', this.updateCount);
    this.listeners.forEach(callback => callback());
  }

  getCount() {
    return this.updateCount;
  }
}

const globalUpdateManager = new GlobalUpdateManager();

export const useGlobalUpdate = () => {
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const unsubscribe = globalUpdateManager.subscribe(() => {
      setUpdateCount(globalUpdateManager.getCount());
    });
    return unsubscribe;
  }, []);

  const triggerGlobalUpdate = () => {
    globalUpdateManager.trigger();
  };

  return { updateCount, triggerGlobalUpdate };
};

export const triggerGlobalUpdate = () => {
  globalUpdateManager.trigger();
};

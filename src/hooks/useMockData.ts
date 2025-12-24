import { useState, useCallback } from 'react';
import { MockDailyEntry, generateMockData, generateSingleEntry } from '@/lib/mockDataGenerator';
import { format } from 'date-fns';

export function useMockData() {
  const [mockEntries, setMockEntries] = useState<MockDailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateData = useCallback((days: number = 30, trendType: 'improving' | 'declining' | 'stable' | 'random' = 'random') => {
    setIsLoading(true);
    setTimeout(() => {
      const data = generateMockData(days, trendType);
      setMockEntries(data);
      setIsLoading(false);
    }, 500);
  }, []);

  const addEntry = useCallback((entry: MockDailyEntry) => {
    setMockEntries(prev => {
      // Replace if date exists, otherwise add
      const existingIndex = prev.findIndex(e => e.date === entry.date);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = entry;
        return updated.sort((a, b) => b.date.localeCompare(a.date));
      }
      return [entry, ...prev].sort((a, b) => b.date.localeCompare(a.date));
    });
  }, []);

  const updateEntry = useCallback((id: string, updates: Partial<MockDailyEntry>) => {
    setMockEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setMockEntries(prev => prev.filter(entry => entry.id !== id));
  }, []);

  const createNewEntry = useCallback((date?: string) => {
    const entryDate = date || format(new Date(), 'yyyy-MM-dd');
    return generateSingleEntry(entryDate);
  }, []);

  const clearAll = useCallback(() => {
    setMockEntries([]);
  }, []);

  return {
    mockEntries,
    isLoading,
    generateData,
    addEntry,
    updateEntry,
    deleteEntry,
    createNewEntry,
    clearAll,
  };
}

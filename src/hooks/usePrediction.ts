import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MockDailyEntry } from '@/lib/mockDataGenerator';

export interface PredictionResult {
  predictions?: number[];
  confidence?: number;
  trends?: string;
  recommendations?: string;
  clusters?: any;
  anomalies?: any;
  patterns?: any;
  insights?: any;
  raw?: string;
}

export function usePrediction() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const predict = async (data: MockDailyEntry[], analysisType: 'supervised' | 'unsupervised') => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Prepare simplified data for the AI
      const simplifiedData = data.map(entry => ({
        date: entry.date,
        averageScore: entry.averageScore,
        completedCount: entry.completedCount,
        totalHabits: entry.totalHabits,
        completionRate: (entry.completedCount / entry.totalHabits * 100).toFixed(1) + '%',
        habitScores: entry.habitRecords
          .filter(h => h.completed && h.score)
          .map(h => ({ name: h.habitName, score: h.score }))
      }));

      const { data: responseData, error: fnError } = await supabase.functions.invoke('predict-habits', {
        body: { data: simplifiedData, analysisType }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (responseData?.error) {
        throw new Error(responseData.error);
      }

      setResult(responseData?.result || null);
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err instanceof Error ? err.message : '預測失敗');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    predict,
    isLoading,
    result,
    error,
    clearResult: () => setResult(null),
  };
}

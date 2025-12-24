import { format, subDays } from 'date-fns';

export interface MockHabitRecord {
  id: string;
  habitId: string;
  habitName: string;
  completed: boolean;
  score: number | null;
  note: string;
}

export interface MockDailyEntry {
  id: string;
  date: string;
  overallComment: string;
  averageScore: number;
  completedCount: number;
  totalHabits: number;
  habitRecords: MockHabitRecord[];
}

const HABIT_NAMES = [
  '五感恩', '大笑功法', '一日一素食', '自我肯定', '餐前感恩',
  '欣賞身邊的人', '觀心書', '子時入睡', '祝福', '恩啊轟',
  '熱舞', '感恩冥想', '光的冥想', '大悲咒', '心經', '舞之禪'
];

const COMMENTS = [
  '今天感覺很充實，完成了大部分的修行任務。',
  '早起冥想讓我整天都充滿正能量。',
  '雖然有些習慣沒有完成，但我會繼續努力。',
  '今天的感恩練習讓我更珍惜身邊的人事物。',
  '心情平靜，修行讓我找到內心的安寧。',
  '持續進步中，每天都比昨天更好一點。',
  '今天特別有動力，完成了所有的習慣！',
  '需要更加專注於晚間的修行時間。'
];

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function generateMockData(days: number = 30, trendType: 'improving' | 'declining' | 'stable' | 'random' = 'random'): MockDailyEntry[] {
  const entries: MockDailyEntry[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const habitRecords: MockHabitRecord[] = [];
    
    // Calculate base completion probability based on trend
    let baseCompletionProb = 0.6;
    let baseScore = 6;
    
    if (trendType === 'improving') {
      const progress = (days - i) / days;
      baseCompletionProb = 0.4 + progress * 0.5;
      baseScore = 4 + progress * 5;
    } else if (trendType === 'declining') {
      const progress = i / days;
      baseCompletionProb = 0.4 + progress * 0.5;
      baseScore = 4 + progress * 5;
    } else if (trendType === 'stable') {
      baseCompletionProb = 0.65 + getRandomFloat(-0.1, 0.1);
      baseScore = 6.5 + getRandomFloat(-0.5, 0.5);
    }
    
    // Add some weekly patterns (weekends might be different)
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      baseCompletionProb += 0.1;
      baseScore += 0.5;
    }
    
    let totalScore = 0;
    let completedCount = 0;
    
    HABIT_NAMES.forEach((habitName, index) => {
      const completed = Math.random() < baseCompletionProb;
      const score = completed ? Math.min(10, Math.max(1, Math.round(baseScore + getRandomFloat(-2, 2)))) : null;
      
      if (completed) {
        completedCount++;
        totalScore += score!;
      }
      
      habitRecords.push({
        id: generateUUID(),
        habitId: `habit-${index + 1}`,
        habitName,
        completed,
        score,
        note: completed && Math.random() > 0.7 ? `${habitName}今天做得很好` : ''
      });
    });
    
    const averageScore = completedCount > 0 ? totalScore / completedCount : 0;
    
    entries.push({
      id: generateUUID(),
      date,
      overallComment: COMMENTS[getRandomInt(0, COMMENTS.length - 1)],
      averageScore: Math.round(averageScore * 10) / 10,
      completedCount,
      totalHabits: HABIT_NAMES.length,
      habitRecords
    });
  }
  
  return entries;
}

export function generateSingleEntry(date: string): MockDailyEntry {
  const habitRecords: MockHabitRecord[] = [];
  let totalScore = 0;
  let completedCount = 0;
  
  HABIT_NAMES.forEach((habitName, index) => {
    const completed = Math.random() > 0.4;
    const score = completed ? getRandomInt(5, 10) : null;
    
    if (completed) {
      completedCount++;
      totalScore += score!;
    }
    
    habitRecords.push({
      id: generateUUID(),
      habitId: `habit-${index + 1}`,
      habitName,
      completed,
      score,
      note: ''
    });
  });
  
  return {
    id: generateUUID(),
    date,
    overallComment: COMMENTS[getRandomInt(0, COMMENTS.length - 1)],
    averageScore: completedCount > 0 ? Math.round((totalScore / completedCount) * 10) / 10 : 0,
    completedCount,
    totalHabits: HABIT_NAMES.length,
    habitRecords
  };
}

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
  userId?: string;
  userName?: string;
}

export interface MockUser {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface MockAdminData {
  users: MockUser[];
  entries: MockDailyEntry[];
  habitStats: {
    habitId: string;
    habitName: string;
    totalRecords: number;
    completedCount: number;
    completionRate: number;
    avgScore: number;
    scores: number[];
  }[];
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
  '需要更加專注於晚間的修行時間。',
  '感謝這個美好的一天，心中充滿感恩。',
  '冥想後感覺思緒清晰，內心平靜。',
  '今天和家人一起練習，感覺更有動力。',
  '大笑功法讓心情特別好！',
  '素食讓身體輕盈，精神飽滿。'
];

const NAMES = [
  '張小明', '李美麗', '王大華', '陳淑芬', '林志偉',
  '黃雅琪', '劉建國', '吳佳蓉', '蔡宗翰', '楊雅婷',
  '許志明', '鄭美玲', '謝文傑', '周淑惠', '郭俊宏',
  '呂怡君', '朱家豪', '高淑貞', '洪志強', '盧美琪',
  '蕭雅芳', '葉建志', '賴淑娟', '方志遠', '施雅慧',
  '邱文華', '曾淑芬', '傅志豪', '莊雅玲', '韓建明'
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

// Generate mock data for multiple users (for admin dashboard simulation)
export function generateAdminMockData(
  userCount: number = 30,
  daysPerUser: number = 30
): MockAdminData {
  const users: MockUser[] = [];
  const entries: MockDailyEntry[] = [];
  const habitStatsMap: Record<string, {
    totalRecords: number;
    completedCount: number;
    scores: number[];
  }> = {};

  // Initialize habit stats
  HABIT_NAMES.forEach((name, index) => {
    habitStatsMap[`habit-${index + 1}`] = {
      totalRecords: 0,
      completedCount: 0,
      scores: []
    };
  });

  // Shuffle names to pick randomly
  const shuffledNames = [...NAMES].sort(() => Math.random() - 0.5);

  // Generate users
  for (let u = 0; u < userCount; u++) {
    const userId = generateUUID();
    const createdDaysAgo = getRandomInt(1, 60);
    
    users.push({
      id: generateUUID(),
      userId,
      name: shuffledNames[u % shuffledNames.length] + (u >= NAMES.length ? `${u - NAMES.length + 2}` : ''),
      createdAt: format(subDays(new Date(), createdDaysAgo), "yyyy-MM-dd'T'HH:mm:ss")
    });

    // Each user has random number of entries
    const userEntryCount = getRandomInt(Math.floor(daysPerUser * 0.3), daysPerUser);
    const userTrend = ['improving', 'declining', 'stable', 'random'][getRandomInt(0, 3)] as 'improving' | 'declining' | 'stable' | 'random';
    
    // User skill level affects base scores
    const userSkillLevel = getRandomFloat(0.4, 1.0);

    for (let d = 0; d < userEntryCount; d++) {
      const daysAgo = getRandomInt(0, daysPerUser);
      const date = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
      const habitRecords: MockHabitRecord[] = [];
      
      let baseCompletionProb = 0.5 + userSkillLevel * 0.3;
      let baseScore = 4 + userSkillLevel * 4;

      // Apply trend
      const progress = d / userEntryCount;
      if (userTrend === 'improving') {
        baseCompletionProb += progress * 0.2;
        baseScore += progress * 2;
      } else if (userTrend === 'declining') {
        baseCompletionProb -= progress * 0.2;
        baseScore -= progress * 2;
      }

      let totalScore = 0;
      let completedCount = 0;

      HABIT_NAMES.forEach((habitName, index) => {
        const habitId = `habit-${index + 1}`;
        const completed = Math.random() < baseCompletionProb;
        const score = completed ? Math.min(10, Math.max(1, Math.round(baseScore + getRandomFloat(-2, 2)))) : null;

        if (completed) {
          completedCount++;
          totalScore += score!;
          habitStatsMap[habitId].completedCount++;
          if (score) habitStatsMap[habitId].scores.push(score);
        }
        habitStatsMap[habitId].totalRecords++;

        habitRecords.push({
          id: generateUUID(),
          habitId,
          habitName,
          completed,
          score,
          note: completed && Math.random() > 0.8 ? `${habitName}完成得很好` : ''
        });
      });

      const averageScore = completedCount > 0 ? totalScore / completedCount : 0;

      entries.push({
        id: generateUUID(),
        date,
        userId,
        userName: users[u].name,
        overallComment: Math.random() > 0.3 ? COMMENTS[getRandomInt(0, COMMENTS.length - 1)] : '',
        averageScore: Math.round(averageScore * 10) / 10,
        completedCount,
        totalHabits: HABIT_NAMES.length,
        habitRecords
      });
    }
  }

  // Sort entries by date descending
  entries.sort((a, b) => b.date.localeCompare(a.date));

  // Build habit stats
  const habitStats = HABIT_NAMES.map((name, index) => {
    const habitId = `habit-${index + 1}`;
    const stats = habitStatsMap[habitId];
    return {
      habitId,
      habitName: name,
      totalRecords: stats.totalRecords,
      completedCount: stats.completedCount,
      completionRate: stats.totalRecords > 0 ? (stats.completedCount / stats.totalRecords) * 100 : 0,
      avgScore: stats.scores.length > 0 ? stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length : 0,
      scores: stats.scores
    };
  });

  return { users, entries, habitStats };
}

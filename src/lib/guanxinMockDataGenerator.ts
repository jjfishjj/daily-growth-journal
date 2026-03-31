import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const NAMES = [
  '張小明', '李美麗', '王大華', '陳淑芬', '林志偉',
  '黃雅琪', '劉建國', '吳佳蓉', '蔡宗翰', '楊雅婷',
  '許志明', '鄭美玲', '謝文傑', '周淑惠', '郭俊宏',
  '呂怡君', '朱家豪', '高淑貞', '洪志強', '盧美琪',
  '蕭雅芳', '葉建志', '賴淑娟', '方志遠', '施雅慧',
  '邱文華', '曾淑芬', '傅志豪', '莊雅玲', '韓建明'
];

const GUANXIN_TEMPLATES = [
  '今天感恩生命中遇到的每一個人，感謝家人的陪伴與支持。在冥想中感受到內心的平靜，覺察到自己對工作的執著需要放下。',
  '早晨的大笑功法讓我充滿活力，感恩今天的陽光和微風。午餐吃了素食，身體感覺輕盈。晚上和孩子一起誦讀心經，心中充滿喜悅。',
  '今天練習自我肯定，對鏡子說了三次「我是被愛的」。雖然工作壓力很大，但透過感恩冥想找到了內在的力量。',
  '感恩今天遇到的善緣，在公車上幫助了一位老人家。回家後做了光的冥想，感覺能量充沛。持續修行讓我更有耐心。',
  '今天的五感恩：感恩健康的身體、感恩工作機會、感恩家人的愛、感恩美好的天氣、感恩修行的機緣。大悲咒持誦108遍。',
  '素食讓我感受到身心的淨化，今天嘗試了新的蔬菜料理。欣賞了同事的努力，給予真誠的讚美。晚上的舞之禪讓心靈自由飛翔。',
  '今天覺察到自己的情緒波動，透過呼吸練習回到當下。感恩老師的教導，讓我學會用不同的角度看事情。熱舞釋放了壓力。',
  '清晨的感恩冥想讓我看到生命的美好。今天對身邊的人說了感謝的話，看到他們的笑容讓我很開心。恩啊轟修行讓我感到安定。',
  '今天的修行心得：放下不等於放棄，而是不執著於結果。子時入睡讓我精神飽滿，感恩身體的配合。祝福所有眾生平安喜樂。',
  '參加了團體冥想活動，感受到集體修行的力量。每個人都在用自己的方式成長。今天特別感恩修行路上的同修夥伴們。',
  '今天在忙碌中找到平靜，餐前感恩讓我更珍惜每一口食物。光的冥想中看到溫暖的金色光芒，感覺被宇宙所愛。',
  '反思今天的言行，發現自己還有很多需要改進的地方。但修行就是不斷覺察和調整的過程。感恩每一個讓我成長的機會。',
  '今天練習欣賞身邊的人，發現每個人都有值得學習的地方。大笑功法帶來的快樂持續了一整天。素食晚餐簡單卻滿足。',
  '晚上的心經抄寫讓我的心安靜下來。今天工作中遇到挑戰，但想起老師說的「一切都是最好的安排」，心中釋然。',
  '今天的自我肯定練習：我值得被愛、我有能力面對一切、我選擇快樂。感恩冥想讓我看到生命中的豐盛。',
];

const KEYWORDS_POOL = [
  '感恩', '冥想', '修行', '平靜', '覺察', '放下', '素食', '能量',
  '家人', '工作', '壓力', '成長', '喜悅', '愛', '祝福', '光',
  '呼吸', '當下', '心經', '大悲咒', '大笑功法', '舞之禪',
  '自我肯定', '欣賞', '感謝', '快樂', '慈悲', '智慧', '精進',
  '淨化', '釋放', '安定', '內在', '覺醒', '練習', '堅持'
];

export interface MockGuanxinUser {
  userId: string;
  name: string;
}

export interface MockGuanxinEntry {
  id: string;
  userId: string;
  userName: string;
  date: string;
  content: string;
}

export interface MockGuanxinLeave {
  id: string;
  userId: string;
  userName: string;
  date: string;
  reason: string;
}

export interface MockGuanxinUserStat {
  userId: string;
  name: string;
  filledDays: number;
  missedDays: number;
  leaveDays: number;
  totalDaysInMonth: number;
  fillRate: number;
}

export interface KeywordStat {
  keyword: string;
  count: number;
  users: string[];
}

export interface MockGuanxinData {
  users: MockGuanxinUser[];
  entries: MockGuanxinEntry[];
  leaves: MockGuanxinLeave[];
  userStats: MockGuanxinUserStat[];
  keywordStats: KeywordStat[];
  month: string; // yyyy-MM
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const LEAVE_REASONS = [
  '身體不適，需要休息', '出差在外', '家庭事務', '參加培訓課程',
  '旅行中', '感冒發燒', '加班太晚', '個人因素'
];

export function generateGuanxinMockData(
  userCount: number = 30,
  month?: string // yyyy-MM format
): MockGuanxinData {
  const now = new Date();
  const targetMonth = month || format(now, 'yyyy-MM');
  const [year, mon] = targetMonth.split('-').map(Number);
  const monthStart = startOfMonth(new Date(year, mon - 1));
  const monthEnd = endOfMonth(new Date(year, mon - 1));
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDays = daysInMonth.length;

  const users: MockGuanxinUser[] = [];
  const entries: MockGuanxinEntry[] = [];
  const leaves: MockGuanxinLeave[] = [];
  const keywordCountMap = new Map<string, { count: number; users: Set<string> }>();

  const shuffledNames = [...NAMES].sort(() => Math.random() - 0.5);

  for (let u = 0; u < userCount; u++) {
    const userId = generateUUID();
    const name = shuffledNames[u % shuffledNames.length] + (u >= NAMES.length ? `${u - NAMES.length + 2}` : '');
    users.push({ userId, name });

    // Each user has a fill probability (some are diligent, some not)
    const fillProb = 0.4 + Math.random() * 0.5; // 40%-90%
    const leaveProb = 0.05 + Math.random() * 0.1; // 5%-15%

    for (const day of daysInMonth) {
      // Skip future days
      if (day > now) continue;

      const dateStr = format(day, 'yyyy-MM-dd');
      const rand = Math.random();

      if (rand < fillProb) {
        // Generate entry
        const baseContent = GUANXIN_TEMPLATES[getRandomInt(0, GUANXIN_TEMPLATES.length - 1)];
        // Add some variation
        const extraLines = Math.random() > 0.5
          ? `\n\n今天特別想感謝${['媽媽', '爸爸', '老師', '朋友', '同事'][getRandomInt(0, 4)]}的${['關心', '支持', '鼓勵', '陪伴', '教導'][getRandomInt(0, 4)]}。`
          : '';
        const content = baseContent + extraLines;

        entries.push({ id: generateUUID(), userId, userName: name, date: dateStr, content });

        // Extract keywords
        KEYWORDS_POOL.forEach(kw => {
          if (content.includes(kw)) {
            const stat = keywordCountMap.get(kw) || { count: 0, users: new Set<string>() };
            stat.count++;
            stat.users.add(name);
            keywordCountMap.set(kw, stat);
          }
        });
      } else if (rand < fillProb + leaveProb) {
        leaves.push({
          id: generateUUID(),
          userId,
          userName: name,
          date: dateStr,
          reason: LEAVE_REASONS[getRandomInt(0, LEAVE_REASONS.length - 1)],
        });
      }
      // else: missed day
    }
  }

  // Compute per-user stats
  const pastDays = daysInMonth.filter(d => d <= now).length;
  const userEntryMap = new Map<string, Set<string>>();
  const userLeaveMap = new Map<string, Set<string>>();

  entries.forEach(e => {
    const set = userEntryMap.get(e.userId) || new Set();
    set.add(e.date);
    userEntryMap.set(e.userId, set);
  });

  leaves.forEach(l => {
    const set = userLeaveMap.get(l.userId) || new Set();
    set.add(l.date);
    userLeaveMap.set(l.userId, set);
  });

  const userStats: MockGuanxinUserStat[] = users.map(u => {
    const filled = userEntryMap.get(u.userId)?.size || 0;
    const leaved = userLeaveMap.get(u.userId)?.size || 0;
    const missed = pastDays - filled - leaved;
    return {
      userId: u.userId,
      name: u.name,
      filledDays: filled,
      missedDays: Math.max(0, missed),
      leaveDays: leaved,
      totalDaysInMonth: pastDays,
      fillRate: pastDays > 0 ? (filled / pastDays) * 100 : 0,
    };
  });

  userStats.sort((a, b) => b.fillRate - a.fillRate);

  // Build keyword stats sorted by count
  const keywordStats: KeywordStat[] = Array.from(keywordCountMap.entries())
    .map(([keyword, stat]) => ({
      keyword,
      count: stat.count,
      users: Array.from(stat.users),
    }))
    .sort((a, b) => b.count - a.count);

  entries.sort((a, b) => b.date.localeCompare(a.date));

  return { users, entries, leaves, userStats, keywordStats, month: targetMonth };
}

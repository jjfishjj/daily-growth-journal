export const FEELINGS = [
  '歸屬感',
  '成就感',
  '安全感',
  '安定感',
  '自信',
  '同理心',
  '平等心',
  '使命感',
  '影響力',
  '舞台',
] as const;

export type Feeling = typeof FEELINGS[number];

export const FEELING_COLORS: Record<string, string> = {
  '歸屬感': 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-200',
  '成就感': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200',
  '安全感': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200',
  '安定感': 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-200',
  '自信': 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200',
  '同理心': 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-200',
  '平等心': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200',
  '使命感': 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-200',
  '影響力': 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-200',
  '舞台': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 dark:bg-fuchsia-900/30 dark:text-fuchsia-200',
};

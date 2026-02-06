import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Users, Trophy, Clock, TrendingUp, Star, Crown, Flame, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function PlatformStats() {
  const { data: stats, isLoading } = usePlatformStats();

  const timeLabels = useMemo(() => {
    const labels: Record<number, string> = {};
    for (let i = 0; i < 24; i++) {
      if (i < 6) labels[i] = '凌晨';
      else if (i < 12) labels[i] = '上午';
      else if (i < 18) labels[i] = '下午';
      else labels[i] = '晚上';
    }
    return labels;
  }, []);

  const bestTimeSlots = useMemo(() => {
    if (!stats?.bestPracticeTimes.length) return [];
    
    const slotStats: Record<string, number> = { '凌晨': 0, '上午': 0, '下午': 0, '晚上': 0 };
    stats.bestPracticeTimes.forEach(({ hour, count }) => {
      slotStats[timeLabels[hour]] += count;
    });
    
    return Object.entries(slotStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [stats, timeLabels]);

  const topTimeSlot = bestTimeSlots[0]?.name || '-';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          無法載入平台統計資料
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <div className="text-sm text-muted-foreground">平台會員數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-chart-2 mb-2" />
            <div className="text-2xl font-bold">{stats.overallAvgScore.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">全體平均分</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-8 w-8 mx-auto text-chart-3 mb-2" />
            <div className="text-2xl font-bold">{topTimeSlot}</div>
            <div className="text-sm text-muted-foreground">最佳實踐時段</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="h-8 w-8 mx-auto text-chart-4 mb-2" />
            <div className="text-xl font-bold truncate px-2">{stats.topHabit?.name || '-'}</div>
            <div className="text-sm text-muted-foreground">最熱門習慣</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Habits Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              熱門習慣排行榜
            </CardTitle>
            <CardDescription>依完成次數排名</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.popularHabits.slice(0, 5).map((habit, index) => (
                <div key={habit.habitId} className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                    index === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                    index === 1 ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300" :
                    index === 2 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{habit.habitName}</div>
                    <div className="text-xs text-muted-foreground">
                      完成 {habit.completionCount} 次 · 平均 {habit.avgScore.toFixed(1)} 分
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Best Practice Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              最佳實踐時段分佈
            </CardTitle>
            <CardDescription>依填寫時間統計</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bestTimeSlots}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {bestTimeSlots.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              最活躍會員
            </CardTitle>
            <CardDescription>依填寫次數排名（顯示前5名）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.activeMembers.slice(0, 5).map((member, index) => (
                <div key={member.userId} className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                    index === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{member.userName}</div>
                    <div className="text-xs text-muted-foreground">
                      {member.entryCount} 筆紀錄 · 平均 {member.avgScore.toFixed(1)} 分
                    </div>
                  </div>
                  {index === 0 && <Flame className="h-5 w-5 text-orange-500" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Habit Scores Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-chart-3" />
              各習慣平均分數
            </CardTitle>
            <CardDescription>前5個熱門習慣的表現</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={stats.popularHabits.slice(0, 5).map(h => ({
                habit: h.habitName.slice(0, 4),
                分數: Number(h.avgScore.toFixed(1))
              }))}>
                <PolarGrid className="stroke-border" />
                <PolarAngleAxis dataKey="habit" className="text-xs" />
                <PolarRadiusAxis domain={[0, 10]} className="text-xs" />
                <Radar dataKey="分數" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

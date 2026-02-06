import { useState, useMemo } from 'react';
import { format, subDays, startOfDay, getDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStats, useHabits } from '@/hooks/useHabits';
import { PlatformStats } from '@/components/stats/PlatformStats';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { BarChart3, TrendingUp, Target, Flame, Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const timeRanges = [
  { label: '7天', days: 7 },
  { label: '30天', days: 30 },
  { label: '90天', days: 90 },
];

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

export default function Stats() {
  const [selectedRange, setSelectedRange] = useState(7);
  
  const endDate = format(new Date(), 'yyyy-MM-dd');
  const startDate = format(subDays(new Date(), selectedRange - 1), 'yyyy-MM-dd');
  
  const { data: entries } = useStats(startDate, endDate);
  const { data: habits } = useHabits();

  // Daily average scores chart data
  const chartData = useMemo(() => {
    if (!entries) return [];
    return entries.map(entry => {
      const scores = entry.daily_habit_records
        .filter(r => r.completed && r.score)
        .map(r => r.score as number);
      return {
        date: format(new Date(entry.date), 'M/d'),
        avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
        completed: entry.daily_habit_records.filter(r => r.completed).length
      };
    });
  }, [entries]);

  // Habit stats with average scores
  const habitStats = useMemo(() => {
    if (!entries || !habits) return [];
    return habits.map(habit => {
      const records = entries.flatMap(e => e.daily_habit_records).filter(r => r.habit_id === habit.id);
      const completed = records.filter(r => r.completed);
      const scores = completed.filter(r => r.score).map(r => r.score as number);
      return {
        name: habit.name,
        shortName: habit.name.slice(0, 4),
        completionRate: records.length > 0 ? (completed.length / records.length) * 100 : 0,
        avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [entries, habits]);

  // Streak calculation
  const streak = useMemo(() => {
    if (!entries) return 0;
    let count = 0;
    const today = startOfDay(new Date());
    for (let i = 0; i < 365; i++) {
      const date = format(subDays(today, i), 'yyyy-MM-dd');
      if (entries.some(e => e.date === date)) count++;
      else break;
    }
    return count;
  }, [entries]);

  // Weekday performance data
  const weekdayData = useMemo(() => {
    if (!entries) return [];
    
    const stats = WEEKDAYS.map(() => ({ total: 0, completed: 0, totalScore: 0, scoreCount: 0 }));
    
    entries.forEach(entry => {
      const dayIndex = getDay(new Date(entry.date));
      entry.daily_habit_records.forEach(record => {
        stats[dayIndex].total++;
        if (record.completed) {
          stats[dayIndex].completed++;
          if (record.score) {
            stats[dayIndex].totalScore += record.score;
            stats[dayIndex].scoreCount++;
          }
        }
      });
    });

    return WEEKDAYS.map((day, i) => ({
      day,
      完成率: stats[i].total > 0 ? Math.round(stats[i].completed / stats[i].total * 100) : 0,
      平均分: stats[i].scoreCount > 0 ? Number((stats[i].totalScore / stats[i].scoreCount).toFixed(1)) : 0,
      entries: stats[i].total
    }));
  }, [entries]);

  // Score distribution data
  const scoreDistribution = useMemo(() => {
    if (!entries) return [];
    
    const ranges = [
      { range: '1-2分', min: 1, max: 2.9, count: 0 },
      { range: '3-4分', min: 3, max: 4.9, count: 0 },
      { range: '5-6分', min: 5, max: 6.9, count: 0 },
      { range: '7-8分', min: 7, max: 8.9, count: 0 },
      { range: '9-10分', min: 9, max: 10, count: 0 },
    ];

    entries.forEach(entry => {
      entry.daily_habit_records.forEach(record => {
        if (record.score) {
          const range = ranges.find(r => record.score! >= r.min && record.score! <= r.max);
          if (range) range.count++;
        }
      });
    });

    return ranges.map(r => ({ name: r.range, value: r.count }));
  }, [entries]);

  // Individual habit average scores
  const habitAvgScores = useMemo(() => {
    if (!habitStats) return [];
    return habitStats
      .filter(h => h.avgScore > 0)
      .map(h => ({
        name: h.shortName,
        fullName: h.name,
        分數: Number(h.avgScore.toFixed(1))
      }));
  }, [habitStats]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <Tabs defaultValue="my-stats" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <TabsList>
              <TabsTrigger value="my-stats" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                我的數據
              </TabsTrigger>
              <TabsTrigger value="platform" className="gap-2">
                <Users className="h-4 w-4" />
                平台動態
              </TabsTrigger>
            </TabsList>
          </div>

          {/* My Stats Tab */}
          <TabsContent value="my-stats" className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h1 className="font-serif text-2xl md:text-3xl font-semibold flex items-center gap-3">
                <BarChart3 className="h-7 w-7 text-primary" />
                我的數據
              </h1>
              <div className="flex gap-2">
                {timeRanges.map(range => (
                  <Button
                    key={range.days}
                    variant={selectedRange === range.days ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRange(range.days)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-6 text-center">
                <Target className="h-8 w-8 mx-auto text-primary mb-2" />
                <div className="text-2xl font-bold">{entries?.length || 0}</div>
                <div className="text-sm text-muted-foreground">填寫天數</div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <Flame className="h-8 w-8 mx-auto text-accent mb-2" />
                <div className="text-2xl font-bold">{streak}</div>
                <div className="text-sm text-muted-foreground">連續天數</div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-chart-2 mb-2" />
                <div className="text-2xl font-bold">
                  {chartData.length > 0 ? (chartData.reduce((a, b) => a + b.avgScore, 0) / chartData.length).toFixed(1) : '-'}
                </div>
                <div className="text-sm text-muted-foreground">平均分數</div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-primary truncate px-2">{habitStats[0]?.name || '-'}</div>
                <div className="text-sm text-muted-foreground">最佳習慣</div>
              </CardContent></Card>
            </div>

            {/* Daily Average Score Chart */}
            <Card>
              <CardHeader>
                <CardTitle>每日平均分數</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekday Performance Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    星期幾完成率
                  </CardTitle>
                  <CardDescription>各星期的習慣完成表現</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={weekdayData}>
                      <PolarGrid className="stroke-border" />
                      <PolarAngleAxis dataKey="day" className="text-xs" />
                      <PolarRadiusAxis domain={[0, 100]} className="text-xs" />
                      <Radar name="完成率" dataKey="完成率" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Score Distribution Pie */}
              <Card>
                <CardHeader>
                  <CardTitle>分數分佈</CardTitle>
                  <CardDescription>所有評分的分佈情況</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={scoreDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                        outerRadius={90}
                        dataKey="value"
                      >
                        {scoreDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Weekday Average Score Bar */}
              <Card>
                <CardHeader>
                  <CardTitle>週間表現分佈</CardTitle>
                  <CardDescription>各星期的平均分數</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekdayData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis domain={[0, 10]} className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="平均分" fill={CHART_COLORS[1]} radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Individual Habit Average Scores */}
              <Card>
                <CardHeader>
                  <CardTitle>個別習慣平均分數</CardTitle>
                  <CardDescription>各習慣的平均表現</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitAvgScores} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" domain={[0, 10]} className="text-xs" />
                      <YAxis dataKey="name" type="category" width={60} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value, name, props) => [value, props.payload.fullName]}
                      />
                      <Bar dataKey="分數" fill={CHART_COLORS[0]} radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Habit Completion Rate */}
            <Card>
              <CardHeader>
                <CardTitle>習慣完成率</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={habitStats.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="completionRate" fill="hsl(var(--primary))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Stats Tab */}
          <TabsContent value="platform" className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="font-serif text-2xl md:text-3xl font-semibold flex items-center gap-3">
                <Users className="h-7 w-7 text-primary" />
                平台動態
              </h1>
            </div>
            <p className="text-muted-foreground mb-6">
              查看平台整體統計，了解熱門習慣、最佳實踐時段和最活躍的會員們！
            </p>
            <PlatformStats />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

import { useState, useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStats, useHabits } from '@/hooks/useHabits';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { BarChart3, TrendingUp, Target, Flame } from 'lucide-react';

const timeRanges = [
  { label: '7天', days: 7 },
  { label: '30天', days: 30 },
  { label: '90天', days: 90 },
];

export default function Stats() {
  const [selectedRange, setSelectedRange] = useState(7);
  
  const endDate = format(new Date(), 'yyyy-MM-dd');
  const startDate = format(subDays(new Date(), selectedRange - 1), 'yyyy-MM-dd');
  
  const { data: entries } = useStats(startDate, endDate);
  const { data: habits } = useHabits();

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

  const habitStats = useMemo(() => {
    if (!entries || !habits) return [];
    return habits.map(habit => {
      const records = entries.flatMap(e => e.daily_habit_records).filter(r => r.habit_id === habit.id);
      const completed = records.filter(r => r.completed);
      const scores = completed.filter(r => r.score).map(r => r.score as number);
      return {
        name: habit.name,
        completionRate: records.length > 0 ? (completed.length / records.length) * 100 : 0,
        avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [entries, habits]);

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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
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
            <TrendingUp className="h-8 w-8 mx-auto text-zen-water mb-2" />
            <div className="text-2xl font-bold">
              {chartData.length > 0 ? (chartData.reduce((a, b) => a + b.avgScore, 0) / chartData.length).toFixed(1) : '-'}
            </div>
            <div className="text-sm text-muted-foreground">平均分數</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-primary">{habitStats[0]?.name || '-'}</div>
            <div className="text-sm text-muted-foreground">最佳習慣</div>
          </CardContent></Card>
        </div>

        {/* Charts */}
        <Card><CardHeader><CardTitle>每日平均分數</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle>習慣完成率</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitStats.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                <Tooltip />
                <Bar dataKey="completionRate" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAllUsers, useAdminStats, useAllEntries } from '@/hooks/useAdmin';
import { useHabits } from '@/hooks/useHabits';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, Users, FileText, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export default function Admin() {
  const { data: users } = useAllUsers();
  const { data: stats } = useAdminStats();
  const { data: entries } = useAllEntries();
  const { data: habits } = useHabits();

  const habitChartData = stats?.habitStats.map(s => ({
    name: s.habit.name.slice(0, 4),
    completionRate: s.completionRate.toFixed(0),
    avgScore: s.avgScore.toFixed(1)
  })) || [];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          管理後台
        </h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">{stats?.usersCount || 0}</div>
            <div className="text-sm text-muted-foreground">總會員數</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <FileText className="h-8 w-8 mx-auto text-accent mb-2" />
            <div className="text-2xl font-bold">{stats?.entriesCount || 0}</div>
            <div className="text-sm text-muted-foreground">總紀錄數</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-zen-water mb-2" />
            <div className="text-2xl font-bold">{habits?.length || 0}</div>
            <div className="text-sm text-muted-foreground">習慣項目</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-primary">
              {stats?.habitStats[0]?.avgScore.toFixed(1) || '-'}
            </div>
            <div className="text-sm text-muted-foreground">最高平均分</div>
          </CardContent></Card>
        </div>

        {/* Habit Stats Chart */}
        <Card><CardHeader><CardTitle>各習慣完成率 (%)</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="completionRate" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card><CardHeader><CardTitle>最近紀錄</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {entries?.slice(0, 20).map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <span className="font-medium">{format(new Date(entry.date), 'M/d EE', { locale: zhTW })}</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      {entry.daily_habit_records.filter(r => r.completed).length}/{habits?.length} 完成
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground truncate max-w-48">
                    {entry.overall_comment?.slice(0, 30) || '-'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

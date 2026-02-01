import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllUsers, useAdminStats, useAllEntries } from '@/hooks/useAdmin';
import { useHabits } from '@/hooks/useHabits';
import { RoleManagement } from '@/components/admin/RoleManagement';
import { AIAnalysis } from '@/components/admin/AIAnalysis';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { Shield, Users, FileText, TrendingUp, Activity, MessageSquare, Bot, UserCog } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useMemo } from 'react';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function Admin() {
  const { data: users } = useAllUsers();
  const { data: stats } = useAdminStats();
  const { data: entries } = useAllEntries();
  const { data: habits } = useHabits();

  // Habit completion rate chart data
  const habitChartData = stats?.habitStats.map(s => ({
    name: s.habit.name.slice(0, 4),
    fullName: s.habit.name,
    完成率: Number(s.completionRate.toFixed(0)),
    平均分數: Number(s.avgScore.toFixed(1))
  })) || [];

  // User registration timeline
  const userRegistrationData = useMemo(() => {
    if (!users) return [];
    
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = users.filter(u => 
        format(new Date(u.created_at), 'yyyy-MM-dd') === dayStr
      ).length;
      
      return {
        date: format(day, 'MM/dd'),
        新增用戶: count
      };
    });
  }, [users]);

  // Daily activity timeline
  const activityData = useMemo(() => {
    if (!entries) return [];
    
    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date()
    });

    return last14Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayEntries = entries.filter(e => e.date === dayStr);
      const totalRecords = dayEntries.reduce((sum, e) => sum + (e.daily_habit_records?.length || 0), 0);
      const completedRecords = dayEntries.reduce((sum, e) => 
        sum + (e.daily_habit_records?.filter(r => r.completed).length || 0), 0);
      
      return {
        date: format(day, 'MM/dd'),
        紀錄數: dayEntries.length,
        習慣完成數: completedRecords
      };
    });
  }, [entries]);

  // Habit popularity (most tracked habits)
  const habitPopularityData = useMemo(() => {
    if (!entries || !habits) return [];
    
    const habitCounts: Record<string, number> = {};
    entries.forEach(entry => {
      entry.daily_habit_records?.forEach(record => {
        const habit = habits.find(h => h.id === record.habit_id);
        if (habit) {
          habitCounts[habit.name] = (habitCounts[habit.name] || 0) + 1;
        }
      });
    });

    return Object.entries(habitCounts)
      .map(([name, value]) => ({ name: name.slice(0, 6), fullName: name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [entries, habits]);

  // Score distribution
  const scoreDistributionData = useMemo(() => {
    if (!entries) return [];
    
    const ranges = [
      { range: '1-2分', min: 1, max: 2.9, count: 0 },
      { range: '3-4分', min: 3, max: 4.9, count: 0 },
      { range: '5-6分', min: 5, max: 6.9, count: 0 },
      { range: '7-8分', min: 7, max: 8.9, count: 0 },
      { range: '9-10分', min: 9, max: 10, count: 0 },
    ];

    entries.forEach(entry => {
      entry.daily_habit_records?.forEach(record => {
        if (record.score) {
          const range = ranges.find(r => record.score! >= r.min && record.score! <= r.max);
          if (range) range.count++;
        }
      });
    });

    return ranges.map(r => ({ name: r.range, value: r.count }));
  }, [entries]);

  // Weekday performance
  const weekdayData = useMemo(() => {
    if (!entries) return [];
    
    const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    const stats = weekdays.map(() => ({ total: 0, completed: 0 }));
    
    entries.forEach(entry => {
      const dayIndex = new Date(entry.date).getDay();
      entry.daily_habit_records?.forEach(record => {
        stats[dayIndex].total++;
        if (record.completed) stats[dayIndex].completed++;
      });
    });

    return weekdays.map((day, i) => ({
      day,
      完成率: stats[i].total > 0 ? Math.round(stats[i].completed / stats[i].total * 100) : 0
    }));
  }, [entries]);

  // Comments summary with user info and habit scores
  const commentsSummary = useMemo(() => {
    if (!entries || !users || !habits) return { total: 0, withComments: 0, avgLength: 0, recentComments: [] };
    
    const withComments = entries.filter(e => e.overall_comment && e.overall_comment.trim().length > 0);
    const totalLength = withComments.reduce((sum, e) => sum + (e.overall_comment?.length || 0), 0);
    
    return {
      total: entries.length,
      withComments: withComments.length,
      avgLength: withComments.length > 0 ? Math.round(totalLength / withComments.length) : 0,
      recentComments: withComments.slice(0, 20).map(e => {
        const user = users.find(u => u.user_id === e.user_id);
        const habitRecords = e.daily_habit_records?.filter(r => r.completed && r.score !== null) || [];
        const habitScores = habitRecords.map(r => {
          const habit = habits.find(h => h.id === r.habit_id);
          return {
            habitName: habit?.name || '未知習慣',
            score: r.score
          };
        });
        
        return {
          date: e.date,
          comment: e.overall_comment || '',
          userName: user?.name || '未命名用戶',
          userId: e.user_id,
          habitScores
        };
      })
    };
  }, [entries, users, habits]);

  // User engagement stats
  const engagementStats = useMemo(() => {
    if (!users || !entries) return { activeUsers: 0, avgEntriesPerUser: 0 };
    
    const userEntryCount: Record<string, number> = {};
    entries.forEach(e => {
      userEntryCount[e.user_id] = (userEntryCount[e.user_id] || 0) + 1;
    });
    
    const activeUsers = Object.keys(userEntryCount).length;
    const totalEntries = Object.values(userEntryCount).reduce((a, b) => a + b, 0);
    
    return {
      activeUsers,
      avgEntriesPerUser: activeUsers > 0 ? Math.round(totalEntries / activeUsers * 10) / 10 : 0
    };
  }, [users, entries]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          管理後台
        </h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">{stats?.usersCount || 0}</div>
            <div className="text-sm text-muted-foreground">總註冊人數</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <Activity className="h-8 w-8 mx-auto text-chart-2 mb-2" />
            <div className="text-2xl font-bold">{engagementStats.activeUsers}</div>
            <div className="text-sm text-muted-foreground">活躍用戶</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <FileText className="h-8 w-8 mx-auto text-chart-3 mb-2" />
            <div className="text-2xl font-bold">{stats?.entriesCount || 0}</div>
            <div className="text-sm text-muted-foreground">總紀錄數</div>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-chart-4 mb-2" />
            <div className="text-2xl font-bold">{engagementStats.avgEntriesPerUser}</div>
            <div className="text-sm text-muted-foreground">人均紀錄數</div>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">總覽</TabsTrigger>
            <TabsTrigger value="users">用戶</TabsTrigger>
            <TabsTrigger value="habits">習慣</TabsTrigger>
            <TabsTrigger value="comments">評論</TabsTrigger>
            <TabsTrigger value="roles" className="gap-1">
              <UserCog className="h-4 w-4" />
              權限
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1">
              <Bot className="h-4 w-4" />
              AI
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>近兩週活動趨勢</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Legend />
                      <Area type="monotone" dataKey="紀錄數" stackId="1" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.6} />
                      <Area type="monotone" dataKey="習慣完成數" stackId="2" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Habit Completion Rate */}
              <Card>
                <CardHeader>
                  <CardTitle>各習慣完成率 (%)</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" domain={[0, 100]} className="text-xs" />
                      <YAxis dataKey="name" type="category" width={60} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value, name, props) => [value, props.payload.fullName]}
                      />
                      <Bar dataKey="完成率" fill={CHART_COLORS[0]} radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Entries */}
            <Card>
              <CardHeader>
                <CardTitle>最近紀錄</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {entries?.slice(0, 15).map(entry => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{format(new Date(entry.date), 'M/d EE', { locale: zhTW })}</span>
                        <span className="text-muted-foreground text-sm">
                          {entry.daily_habit_records?.filter(r => r.completed).length || 0}/{habits?.length || 0} 完成
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
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Registration Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>用戶註冊趨勢（近30天）</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userRegistrationData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Line type="monotone" dataKey="新增用戶" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ fill: CHART_COLORS[0] }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Weekday Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>各星期習慣完成率</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
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
            </div>

            {/* User List */}
            <Card>
              <CardHeader>
                <CardTitle>用戶列表</CardTitle>
                <CardDescription>所有註冊用戶（共 {users?.length || 0} 位）</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {users?.slice(0, 20).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div>
                        <span className="font-medium">{user.name || '未命名'}</span>
                        <span className="text-muted-foreground text-sm ml-2">ID: {user.user_id.slice(0, 8)}...</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(user.created_at), 'yyyy/MM/dd')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Habits Tab */}
          <TabsContent value="habits" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Habit Popularity */}
              <Card>
                <CardHeader>
                  <CardTitle>最熱門習慣</CardTitle>
                  <CardDescription>被追蹤次數最多的習慣</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitPopularityData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value, name, props) => [value, props.payload.fullName]}
                      />
                      <Bar dataKey="value" fill={CHART_COLORS[2]} radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>分數分佈</CardTitle>
                  <CardDescription>所有評分的分佈情況</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={scoreDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {scoreDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Habit Stats Table */}
            <Card>
              <CardHeader>
                <CardTitle>習慣詳細統計</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium">習慣名稱</th>
                        <th className="text-center p-3 font-medium">總紀錄數</th>
                        <th className="text-center p-3 font-medium">完成數</th>
                        <th className="text-center p-3 font-medium">完成率</th>
                        <th className="text-center p-3 font-medium">平均分數</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.habitStats.map((s, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="p-3">{s.habit.name}</td>
                          <td className="p-3 text-center">{s.totalRecords}</td>
                          <td className="p-3 text-center">{s.completedCount}</td>
                          <td className="p-3 text-center">
                            <span className={`font-semibold ${
                              s.completionRate >= 70 ? 'text-green-600' :
                              s.completionRate >= 50 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {s.completionRate.toFixed(0)}%
                            </span>
                          </td>
                          <td className="p-3 text-center">{s.avgScore.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-primary">{commentsSummary.total}</div>
                <div className="text-sm text-muted-foreground">總紀錄數</div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-chart-2">{commentsSummary.withComments}</div>
                <div className="text-sm text-muted-foreground">有評語紀錄</div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-chart-3">
                  {commentsSummary.total > 0 
                    ? Math.round(commentsSummary.withComments / commentsSummary.total * 100) 
                    : 0}%
                </div>
                <div className="text-sm text-muted-foreground">評語填寫率</div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-chart-4">{commentsSummary.avgLength}</div>
                <div className="text-sm text-muted-foreground">平均評語長度</div>
              </CardContent></Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>近期評語</CardTitle>
                <CardDescription>用戶填寫的日記評語（含用戶與習慣分數）</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {commentsSummary.recentComments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">暫無評語資料</div>
                  ) : (
                    commentsSummary.recentComments.map((item, i) => (
                      <div key={i} className="p-4 bg-secondary/30 rounded-lg space-y-3">
                        {/* Header: User & Date */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{item.userName}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(item.date), 'yyyy/MM/dd (EEE)', { locale: zhTW })}
                          </span>
                        </div>
                        
                        {/* Habit Scores */}
                        {item.habitScores.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.habitScores.map((hs, j) => (
                              <span 
                                key={j} 
                                className={cn(
                                  "text-xs px-2 py-1 rounded-full",
                                  hs.score && hs.score >= 7 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                  hs.score && hs.score >= 5 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                )}
                              >
                                {hs.habitName}: {hs.score}分
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Comment */}
                        <p className="text-foreground whitespace-pre-wrap">{item.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai">
            <AIAnalysis />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

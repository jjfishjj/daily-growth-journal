import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllUsers, useAdminStats, useAllEntries } from '@/hooks/useAdmin';
import { useHabits } from '@/hooks/useHabits';
import { RoleManagement } from '@/components/admin/RoleManagement';
import { AIAnalysis } from '@/components/admin/AIAnalysis';
import { MockDataSimulation } from '@/components/admin/MockDataSimulation';
import GuanxinAdmin from '@/components/admin/GuanxinAdmin';
import { GuanxinMockSimulation } from '@/components/admin/GuanxinMockSimulation';
import { MockUserSeeder } from '@/components/admin/MockUserSeeder';
import { SwitchableChart } from '@/components/charts/SwitchableChart';
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
import { Shield, Users, FileText, TrendingUp, Activity, MessageSquare, Bot, UserCog, Trophy, Star, Award, Database } from 'lucide-react';
import { DataDownload } from '@/components/admin/DownloadButtons';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useMemo, useState, useCallback } from 'react';

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

  // User leaderboard with score analysis
  const userLeaderboard = useMemo(() => {
    if (!users || !entries || !habits) return [];
    
    const userStats: Record<string, {
      userId: string;
      userName: string;
      totalEntries: number;
      totalScore: number;
      scoreCount: number;
      completedHabits: number;
      habitScores: Record<string, { total: number; count: number }>;
    }> = {};

    entries.forEach(entry => {
      const user = users.find(u => u.user_id === entry.user_id);
      if (!userStats[entry.user_id]) {
        userStats[entry.user_id] = {
          userId: entry.user_id,
          userName: user?.name || '未命名用戶',
          totalEntries: 0,
          totalScore: 0,
          scoreCount: 0,
          completedHabits: 0,
          habitScores: {}
        };
      }
      
      userStats[entry.user_id].totalEntries++;
      
      entry.daily_habit_records?.forEach(record => {
        if (record.completed) {
          userStats[entry.user_id].completedHabits++;
          if (record.score !== null) {
            userStats[entry.user_id].totalScore += record.score;
            userStats[entry.user_id].scoreCount++;
            
            // Track per-habit scores
            if (!userStats[entry.user_id].habitScores[record.habit_id]) {
              userStats[entry.user_id].habitScores[record.habit_id] = { total: 0, count: 0 };
            }
            userStats[entry.user_id].habitScores[record.habit_id].total += record.score;
            userStats[entry.user_id].habitScores[record.habit_id].count++;
          }
        }
      });
    });

    return Object.values(userStats)
      .map(stat => ({
        ...stat,
        avgScore: stat.scoreCount > 0 ? stat.totalScore / stat.scoreCount : 0,
        habitDetails: Object.entries(stat.habitScores).map(([habitId, data]) => {
          const habit = habits.find(h => h.id === habitId);
          return {
            habitName: habit?.name || '未知習慣',
            avgScore: data.count > 0 ? data.total / data.count : 0,
            count: data.count
          };
        }).sort((a, b) => b.avgScore - a.avgScore)
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [users, entries, habits]);

  // Score distribution by habit
  const habitScoreDetails = useMemo(() => {
    if (!entries || !habits) return [];
    
    const habitData: Record<string, {
      habitId: string;
      habitName: string;
      scores: number[];
      distribution: Record<string, number>;
    }> = {};

    habits.forEach(habit => {
      habitData[habit.id] = {
        habitId: habit.id,
        habitName: habit.name,
        scores: [],
        distribution: { '1-2': 0, '3-4': 0, '5-6': 0, '7-8': 0, '9-10': 0 }
      };
    });

    entries.forEach(entry => {
      entry.daily_habit_records?.forEach(record => {
        if (record.score !== null && habitData[record.habit_id]) {
          habitData[record.habit_id].scores.push(record.score);
          if (record.score <= 2) habitData[record.habit_id].distribution['1-2']++;
          else if (record.score <= 4) habitData[record.habit_id].distribution['3-4']++;
          else if (record.score <= 6) habitData[record.habit_id].distribution['5-6']++;
          else if (record.score <= 8) habitData[record.habit_id].distribution['7-8']++;
          else habitData[record.habit_id].distribution['9-10']++;
        }
      });
    });

    return Object.values(habitData)
      .filter(h => h.scores.length > 0)
      .map(h => ({
        ...h,
        avgScore: h.scores.reduce((a, b) => a + b, 0) / h.scores.length,
        totalScores: h.scores.length
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [entries, habits]);

  // Enhanced recent records with user and habit info
  const recentRecordsWithDetails = useMemo(() => {
    if (!entries || !users || !habits) return [];
    
    return entries.slice(0, 25).map(entry => {
      const user = users.find(u => u.user_id === entry.user_id);
      const habitRecords = entry.daily_habit_records?.filter(r => r.completed) || [];
      const habitDetails = habitRecords.map(r => {
        const habit = habits.find(h => h.id === r.habit_id);
        return {
          habitName: habit?.name || '未知習慣',
          score: r.score,
          note: r.note
        };
      });
      
      return {
        id: entry.id,
        date: entry.date,
        userName: user?.name || '未命名用戶',
        userId: entry.user_id,
        comment: entry.overall_comment,
        completedCount: habitRecords.length,
        totalHabits: habits.length,
        habitDetails,
        avgScore: habitDetails.filter(h => h.score !== null).length > 0
          ? habitDetails.filter(h => h.score !== null).reduce((sum, h) => sum + (h.score || 0), 0) / 
            habitDetails.filter(h => h.score !== null).length
          : null
      };
    });
  }, [entries, users, habits]);

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
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="overview">總覽</TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1">
              <Trophy className="h-4 w-4" />
              排行榜
            </TabsTrigger>
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
            <TabsTrigger value="mock" className="gap-1">
              <Database className="h-4 w-4" />
              模擬數據
            </TabsTrigger>
            <TabsTrigger value="guanxin" className="gap-1">
              觀心書
            </TabsTrigger>
            <TabsTrigger value="seed" className="gap-1">
              <Users className="h-4 w-4" />
              假用戶
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Timeline - Switchable */}
              <SwitchableChart
                data={activityData}
                dataKey="紀錄數"
                secondaryDataKey="習慣完成數"
                nameKey="date"
                title="近兩週活動趨勢"
                description="紀錄數與習慣完成數對比"
                chartTypes={['area', 'line', 'bar']}
                defaultType="area"
                dataSourceTab="用戶"
                height={280}
                showLegend
              />

              {/* Habit Completion Rate - Switchable */}
              <SwitchableChart
                data={habitChartData}
                dataKey="完成率"
                nameKey="name"
                title="各習慣完成率 (%)"
                description="依習慣類型統計"
                chartTypes={['bar', 'pie', 'radar']}
                defaultType="bar"
                dataSourceTab="習慣"
                height={280}
                layout="vertical"
                domain={[0, 100]}
              />

              {/* Score Distribution - Switchable */}
              <SwitchableChart
                data={scoreDistributionData}
                dataKey="value"
                nameKey="name"
                title="分數分佈"
                description="所有評分的分佈情況"
                chartTypes={['pie', 'bar', 'radar']}
                defaultType="pie"
                dataSourceTab="習慣"
                height={280}
              />

              {/* Weekday Radar - Switchable */}
              <SwitchableChart
                data={weekdayData}
                dataKey="完成率"
                nameKey="day"
                title="各星期習慣完成率"
                description="週間表現分佈"
                chartTypes={['radar', 'bar', 'line']}
                defaultType="radar"
                dataSourceTab="習慣"
                height={280}
                domain={[0, 100]}
              />
            </div>

            {/* Recent Entries with User & Habit Details */}
            <Card>
              <CardHeader>
                <CardTitle>最近紀錄</CardTitle>
                <CardDescription>顯示會員、習慣與分數詳情</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {recentRecordsWithDetails.map(record => (
                    <div key={record.id} className="p-4 bg-secondary/30 rounded-lg space-y-2">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-medium">{record.userName}</span>
                            <span className="text-muted-foreground text-sm ml-2">
                              {format(new Date(record.date), 'M/d (EEE)', { locale: zhTW })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {record.completedCount}/{record.totalHabits} 完成
                          </span>
                          {record.avgScore !== null && (
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full font-medium",
                              record.avgScore >= 7 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              record.avgScore >= 5 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            )}>
                              平均 {record.avgScore.toFixed(1)} 分
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Habit Details */}
                      {record.habitDetails.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {record.habitDetails.map((h, i) => (
                            <span 
                              key={i}
                              className={cn(
                                "text-xs px-2 py-0.5 rounded",
                                h.score !== null && h.score >= 7 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                h.score !== null && h.score >= 5 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                h.score !== null ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                "bg-muted text-muted-foreground"
                              )}
                            >
                              {h.habitName}{h.score !== null ? `: ${h.score}分` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Comment */}
                      {record.comment && (
                        <p className="text-sm text-muted-foreground pt-1 border-t border-border/50">
                          {record.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            {/* Leaderboard Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-6 text-center">
                <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <div className="text-2xl font-bold">{userLeaderboard[0]?.userName || '-'}</div>
                <div className="text-sm text-muted-foreground">最高平均分</div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <Star className="h-8 w-8 mx-auto text-primary mb-2" />
                <div className="text-2xl font-bold">{userLeaderboard[0]?.avgScore.toFixed(1) || '-'}</div>
                <div className="text-sm text-muted-foreground">最高分數</div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <Award className="h-8 w-8 mx-auto text-chart-2 mb-2" />
                <div className="text-2xl font-bold">{userLeaderboard.filter(u => u.avgScore >= 7).length}</div>
                <div className="text-sm text-muted-foreground">優秀用戶數</div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <Activity className="h-8 w-8 mx-auto text-chart-3 mb-2" />
                <div className="text-2xl font-bold">
                  {userLeaderboard.length > 0 
                    ? (userLeaderboard.reduce((sum, u) => sum + u.avgScore, 0) / userLeaderboard.length).toFixed(1) 
                    : '-'}
                </div>
                <div className="text-sm text-muted-foreground">全體平均分</div>
              </CardContent></Card>
            </div>

            {/* User Rankings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    會員排行榜
                  </CardTitle>
                  <DataDownload
                    data={userLeaderboard.map((u, i) => ({
                      排名: i + 1,
                      用戶名稱: u.userName,
                      紀錄數: u.totalEntries,
                      完成習慣數: u.completedHabits,
                      平均分數: u.avgScore.toFixed(1)
                    }))}
                    filename="會員排行榜"
                  />
                </div>
                <CardDescription>依平均分數排名，含各習慣分數細節</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {userLeaderboard.map((user, index) => (
                    <div key={user.userId} className="p-4 bg-secondary/30 rounded-lg space-y-3">
                      {/* Header with Rank */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg",
                            index === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                            index === 1 ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300" :
                            index === 2 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{user.userName}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.totalEntries} 筆紀錄 · {user.completedHabits} 個習慣完成
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "text-2xl font-bold",
                            user.avgScore >= 7 ? "text-green-600 dark:text-green-400" :
                            user.avgScore >= 5 ? "text-amber-600 dark:text-amber-400" :
                            "text-red-600 dark:text-red-400"
                          )}>
                            {user.avgScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground">平均分數</div>
                        </div>
                      </div>
                      
                      {/* Habit Score Details */}
                      {user.habitDetails.length > 0 && (
                        <div className="pt-2 border-t border-border/50">
                          <div className="text-xs text-muted-foreground mb-2">各習慣平均分數：</div>
                          <div className="flex flex-wrap gap-2">
                            {user.habitDetails.slice(0, 8).map((h, i) => (
                              <span 
                                key={i}
                                className={cn(
                                  "text-xs px-2 py-1 rounded-full",
                                  h.avgScore >= 7 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                  h.avgScore >= 5 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                )}
                              >
                                {h.habitName}: {h.avgScore.toFixed(1)}分 ({h.count}次)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {userLeaderboard.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">暫無排行資料</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Score Distribution by Habit */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>各習慣分數分佈</CardTitle>
                  <DataDownload
                    data={habitScoreDetails.map(h => ({
                      習慣名稱: h.habitName,
                      平均分: h.avgScore.toFixed(1),
                      評分次數: h.totalScores,
                      '1-2分': h.distribution['1-2'],
                      '3-4分': h.distribution['3-4'],
                      '5-6分': h.distribution['5-6'],
                      '7-8分': h.distribution['7-8'],
                      '9-10分': h.distribution['9-10']
                    }))}
                    filename="習慣分數分佈"
                  />
                </div>
                <CardDescription>每個習慣的分數細節與分佈</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium">習慣名稱</th>
                        <th className="text-center p-3 font-medium">平均分</th>
                        <th className="text-center p-3 font-medium">評分次數</th>
                        <th className="text-center p-3 font-medium">1-2分</th>
                        <th className="text-center p-3 font-medium">3-4分</th>
                        <th className="text-center p-3 font-medium">5-6分</th>
                        <th className="text-center p-3 font-medium">7-8分</th>
                        <th className="text-center p-3 font-medium">9-10分</th>
                      </tr>
                    </thead>
                    <tbody>
                      {habitScoreDetails.map((habit, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="p-3">{habit.habitName}</td>
                          <td className="p-3 text-center">
                            <span className={cn(
                              "font-semibold",
                              habit.avgScore >= 7 ? "text-green-600 dark:text-green-400" :
                              habit.avgScore >= 5 ? "text-amber-600 dark:text-amber-400" : 
                              "text-red-600 dark:text-red-400"
                            )}>
                              {habit.avgScore.toFixed(1)}
                            </span>
                          </td>
                          <td className="p-3 text-center">{habit.totalScores}</td>
                          <td className="p-3 text-center text-red-600 dark:text-red-400">{habit.distribution['1-2']}</td>
                          <td className="p-3 text-center text-orange-600 dark:text-orange-400">{habit.distribution['3-4']}</td>
                          <td className="p-3 text-center text-amber-600 dark:text-amber-400">{habit.distribution['5-6']}</td>
                          <td className="p-3 text-center text-lime-600 dark:text-lime-400">{habit.distribution['7-8']}</td>
                          <td className="p-3 text-center text-green-600 dark:text-green-400">{habit.distribution['9-10']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                <div className="flex items-center justify-between">
                  <CardTitle>用戶列表</CardTitle>
                  <DataDownload
                    data={(users || []).map(u => ({ 名稱: u.name || '未命名', ID: u.user_id, 註冊日期: u.created_at.slice(0, 10) }))}
                    filename="用戶列表"
                  />
                </div>
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
                <div className="flex items-center justify-between">
                  <CardTitle>習慣詳細統計</CardTitle>
                  <DataDownload
                    data={(stats?.habitStats || []).map(s => ({
                      習慣名稱: s.habit.name,
                      總紀錄數: s.totalRecords,
                      完成數: s.completedCount,
                      完成率: `${s.completionRate.toFixed(0)}%`,
                      平均分數: s.avgScore.toFixed(1)
                    }))}
                    filename="習慣統計"
                  />
                </div>
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
                <div className="flex items-center justify-between">
                  <CardTitle>近期評語</CardTitle>
                  <DataDownload
                    data={commentsSummary.recentComments.map(c => ({
                      用戶: c.userName,
                      日期: c.date,
                      評語: c.comment,
                      習慣分數: c.habitScores.map(hs => `${hs.habitName}:${hs.score}`).join('; ')
                    }))}
                    filename="近期評語"
                  />
                </div>
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

          {/* Mock Data Tab */}
          <TabsContent value="mock">
            <MockDataSimulation />
          </TabsContent>

          {/* Guanxin Tab */}
          <TabsContent value="guanxin">
            <Tabs defaultValue="real" className="space-y-4">
              <TabsList>
                <TabsTrigger value="real">實際數據</TabsTrigger>
                <TabsTrigger value="mock">模擬數據</TabsTrigger>
              </TabsList>
              <TabsContent value="real">
                <GuanxinAdmin />
              </TabsContent>
              <TabsContent value="mock">
                <GuanxinMockSimulation />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Mock User Seeder Tab */}
          <TabsContent value="seed">
            <MockUserSeeder />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend 
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateAdminMockData, MockAdminData } from '@/lib/mockDataGenerator';
import { RefreshCw, Users, FileText, TrendingUp, Trophy, Star, Activity, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function MockDataSimulation() {
  const [mockData, setMockData] = useState<MockAdminData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const data = generateAdminMockData(30, 30);
      setMockData(data);
      setIsGenerating(false);
    }, 500);
  }, []);

  const toggleUserExpand = useCallback((userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  // Leaderboard with habit details
  const userLeaderboard = useMemo(() => {
    if (!mockData) return [];
    
    const userStats: Record<string, {
      userId: string;
      userName: string;
      totalEntries: number;
      totalScore: number;
      scoreCount: number;
      completedHabits: number;
      habitScores: Record<string, { total: number; count: number }>;
    }> = {};

    mockData.entries.forEach(entry => {
      if (!entry.userId) return;
      
      if (!userStats[entry.userId]) {
        userStats[entry.userId] = {
          userId: entry.userId,
          userName: entry.userName || '未知用戶',
          totalEntries: 0,
          totalScore: 0,
          scoreCount: 0,
          completedHabits: 0,
          habitScores: {}
        };
      }
      
      userStats[entry.userId].totalEntries++;
      
      entry.habitRecords.forEach(record => {
        if (record.completed) {
          userStats[entry.userId].completedHabits++;
          if (record.score !== null) {
            userStats[entry.userId].totalScore += record.score;
            userStats[entry.userId].scoreCount++;
            
            if (!userStats[entry.userId].habitScores[record.habitId]) {
              userStats[entry.userId].habitScores[record.habitId] = { total: 0, count: 0 };
            }
            userStats[entry.userId].habitScores[record.habitId].total += record.score;
            userStats[entry.userId].habitScores[record.habitId].count++;
          }
        }
      });
    });

    return Object.values(userStats)
      .map(stat => ({
        ...stat,
        avgScore: stat.scoreCount > 0 ? stat.totalScore / stat.scoreCount : 0,
        habitDetails: Object.entries(stat.habitScores).map(([habitId, data]) => {
          const habitRecord = mockData.entries[0]?.habitRecords.find(h => h.habitId === habitId);
          return {
            habitId,
            habitName: habitRecord?.habitName || '未知習慣',
            avgScore: data.count > 0 ? data.total / data.count : 0,
            count: data.count
          };
        }).sort((a, b) => b.avgScore - a.avgScore)
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [mockData]);

  // Score distribution by habit
  const habitScoreDetails = useMemo(() => {
    if (!mockData) return [];
    
    return mockData.habitStats.map(habit => {
      const distribution: Record<string, number> = { '1-2': 0, '3-4': 0, '5-6': 0, '7-8': 0, '9-10': 0 };
      habit.scores.forEach(score => {
        if (score <= 2) distribution['1-2']++;
        else if (score <= 4) distribution['3-4']++;
        else if (score <= 6) distribution['5-6']++;
        else if (score <= 8) distribution['7-8']++;
        else distribution['9-10']++;
      });
      
      return {
        ...habit,
        distribution
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [mockData]);

  // Activity timeline
  const activityData = useMemo(() => {
    if (!mockData) return [];
    
    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date()
    });

    return last14Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayEntries = mockData.entries.filter(e => e.date === dayStr);
      const completedRecords = dayEntries.reduce((sum, e) => 
        sum + e.habitRecords.filter(r => r.completed).length, 0);
      
      return {
        date: format(day, 'MM/dd'),
        紀錄數: dayEntries.length,
        習慣完成數: completedRecords
      };
    });
  }, [mockData]);

  // Score distribution pie
  const scoreDistributionData = useMemo(() => {
    if (!mockData) return [];
    
    const ranges = [
      { range: '1-2分', min: 1, max: 2.9, count: 0 },
      { range: '3-4分', min: 3, max: 4.9, count: 0 },
      { range: '5-6分', min: 5, max: 6.9, count: 0 },
      { range: '7-8分', min: 7, max: 8.9, count: 0 },
      { range: '9-10分', min: 9, max: 10, count: 0 },
    ];

    mockData.entries.forEach(entry => {
      entry.habitRecords.forEach(record => {
        if (record.score) {
          const range = ranges.find(r => record.score! >= r.min && record.score! <= r.max);
          if (range) range.count++;
        }
      });
    });

    return ranges.map(r => ({ name: r.range, value: r.count }));
  }, [mockData]);

  // Weekday radar
  const weekdayData = useMemo(() => {
    if (!mockData) return [];
    
    const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    const stats = weekdays.map(() => ({ total: 0, completed: 0 }));
    
    mockData.entries.forEach(entry => {
      const dayIndex = new Date(entry.date).getDay();
      entry.habitRecords.forEach(record => {
        stats[dayIndex].total++;
        if (record.completed) stats[dayIndex].completed++;
      });
    });

    return weekdays.map((day, i) => ({
      day,
      完成率: stats[i].total > 0 ? Math.round(stats[i].completed / stats[i].total * 100) : 0
    }));
  }, [mockData]);

  // Recent comments
  const recentComments = useMemo(() => {
    if (!mockData) return [];
    return mockData.entries
      .filter(e => e.overallComment && e.overallComment.trim().length > 0)
      .slice(0, 20)
      .map(e => ({
        date: e.date,
        comment: e.overallComment,
        userName: e.userName || '未知用戶',
        habitScores: e.habitRecords
          .filter(r => r.completed && r.score !== null)
          .map(r => ({ habitName: r.habitName, score: r.score }))
      }));
  }, [mockData]);

  if (!mockData) {
    return (
      <Card className="py-12">
        <CardContent className="flex flex-col items-center justify-center gap-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">模擬數據展示</h3>
            <p className="text-muted-foreground">
              生成 30 位模擬會員及其填寫數據，用於預覽管理後台的排行榜與統計視覺化
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
            <RefreshCw className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
            {isGenerating ? '生成中...' : '生成 30 位會員模擬數據'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">模擬數據展示</h2>
          <p className="text-sm text-muted-foreground">
            共 {mockData.users.length} 位會員、{mockData.entries.length} 筆紀錄
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} variant="outline">
          <RefreshCw className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
          重新生成
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center">
          <Users className="h-8 w-8 mx-auto text-primary mb-2" />
          <div className="text-2xl font-bold">{mockData.users.length}</div>
          <div className="text-sm text-muted-foreground">模擬會員數</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <FileText className="h-8 w-8 mx-auto text-chart-2 mb-2" />
          <div className="text-2xl font-bold">{mockData.entries.length}</div>
          <div className="text-sm text-muted-foreground">總紀錄數</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <TrendingUp className="h-8 w-8 mx-auto text-chart-3 mb-2" />
          <div className="text-2xl font-bold">
            {userLeaderboard.length > 0 
              ? (userLeaderboard.reduce((sum, u) => sum + u.avgScore, 0) / userLeaderboard.length).toFixed(1) 
              : '-'}
          </div>
          <div className="text-sm text-muted-foreground">全體平均分</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <Award className="h-8 w-8 mx-auto text-chart-4 mb-2" />
          <div className="text-2xl font-bold">{userLeaderboard.filter(u => u.avgScore >= 7).length}</div>
          <div className="text-sm text-muted-foreground">優秀用戶數</div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leaderboard" className="gap-1">
            <Trophy className="h-4 w-4" />
            排行榜
          </TabsTrigger>
          <TabsTrigger value="habits">習慣統計</TabsTrigger>
          <TabsTrigger value="charts">視覺化圖表</TabsTrigger>
          <TabsTrigger value="comments">最近評論</TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                會員排行榜
              </CardTitle>
              <CardDescription>依平均分數排名，含各習慣分數細節</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {userLeaderboard.map((user, index) => (
                  <div key={user.userId} className="p-4 bg-secondary/30 rounded-lg space-y-2">
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
                      <div className="flex items-center gap-3">
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleUserExpand(user.userId)}
                        >
                          {expandedUsers.has(user.userId) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Habit Score Details (Expandable) */}
                    {expandedUsers.has(user.userId) && user.habitDetails.length > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="text-xs text-muted-foreground mb-2">各習慣平均分數：</div>
                        <div className="flex flex-wrap gap-2">
                          {user.habitDetails.map((h, i) => (
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Habits Tab */}
        <TabsContent value="habits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>各習慣分數分佈</CardTitle>
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
                        <td className="p-3 text-center">{habit.scores.length}</td>
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

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
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

            {/* Score Distribution Pie */}
            <Card>
              <CardHeader>
                <CardTitle>分數分佈</CardTitle>
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

            {/* Weekday Radar */}
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

            {/* Habit Completion Rate */}
            <Card>
              <CardHeader>
                <CardTitle>各習慣完成率 (%)</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockData.habitStats.map(s => ({
                    name: s.habitName.slice(0, 4),
                    fullName: s.habitName,
                    完成率: Number(s.completionRate.toFixed(0))
                  }))} layout="vertical">
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
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>近期評語</CardTitle>
              <CardDescription>用戶填寫的日記評語（含用戶與習慣分數）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {recentComments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">暫無評語資料</div>
                ) : (
                  recentComments.map((item, i) => (
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
      </Tabs>
    </div>
  );
}
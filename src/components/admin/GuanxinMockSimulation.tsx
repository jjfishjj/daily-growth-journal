import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { RefreshCw, Search, Users, FileText, Calendar, Tag, Eye, Settings } from 'lucide-react';
import { generateGuanxinMockData, MockGuanxinData, THEME_GROUPS, GuanxinGenerateOptions } from '@/lib/guanxinMockDataGenerator';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const d = subMonths(new Date(), i);
  return { value: format(d, 'yyyy-MM'), label: format(d, 'yyyy年MM月') };
});

export function GuanxinMockSimulation() {
  const [mockData, setMockData] = useState<MockGuanxinData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [viewContent, setViewContent] = useState<{ date: string; content: string; userName: string } | null>(null);

  // Settings state
  const [userCount, setUserCount] = useState(30);
  const [durationMonths, setDurationMonths] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [fillRateRange, setFillRateRange] = useState<[number, number]>([40, 90]);
  const [leaveRateRange, setLeaveRateRange] = useState<[number, number]>([5, 15]);
  const [themeWeights, setThemeWeights] = useState<Record<string, number>>({});
  const [showSettings, setShowSettings] = useState(true);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const opts: GuanxinGenerateOptions = {
        userCount,
        month: selectedMonth,
        durationMonths,
        fillRateRange: [fillRateRange[0] / 100, fillRateRange[1] / 100],
        leaveRateRange: [leaveRateRange[0] / 100, leaveRateRange[1] / 100],
        themeWeights: Object.keys(themeWeights).length > 0 ? themeWeights : undefined,
      };
      const data = generateGuanxinMockData(opts);
      setMockData(data);
      setIsGenerating(false);
      setShowSettings(false);
    }, 500);
  };

  const toggleThemeWeight = (theme: string, enabled: boolean) => {
    setThemeWeights(prev => {
      const next = { ...prev };
      if (enabled) {
        next[theme] = 3; // boost weight
      } else {
        delete next[theme];
      }
      return next;
    });
  };

  const updateThemeWeight = (theme: string, weight: number) => {
    setThemeWeights(prev => ({ ...prev, [theme]: weight }));
  };

  // Search results
  const searchResults = useMemo(() => {
    if (!mockData || !searchKeyword.trim()) return [];
    const kw = searchKeyword.trim();
    return mockData.entries
      .filter(e => e.content.includes(kw))
      .slice(0, 50);
  }, [mockData, searchKeyword]);

  // Per-user keyword search count
  const perUserKeywordCount = useMemo(() => {
    if (!mockData || !searchKeyword.trim()) return [];
    const kw = searchKeyword.trim();
    const map = new Map<string, { name: string; count: number }>();
    mockData.entries.forEach(e => {
      if (e.content.includes(kw)) {
        const s = map.get(e.userId) || { name: e.userName, count: 0 };
        s.count++;
        map.set(e.userId, s);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [mockData, searchKeyword]);

  // Fill rate distribution for pie chart
  const fillRateDistribution = useMemo(() => {
    if (!mockData) return [];
    const buckets = [
      { name: '90%以上', range: [90, 101], count: 0 },
      { name: '70-89%', range: [70, 90], count: 0 },
      { name: '50-69%', range: [50, 70], count: 0 },
      { name: '50%以下', range: [0, 50], count: 0 },
    ];
    mockData.userStats.forEach(s => {
      const b = buckets.find(b => s.fillRate >= b.range[0] && s.fillRate < b.range[1]);
      if (b) b.count++;
    });
    return buckets.filter(b => b.count > 0);
  }, [mockData]);

  // Calendar heatmap data
  const calendarData = useMemo(() => {
    if (!mockData) return { days: [] as { date: string; dayNum: number; entryCount: number; leaveCount: number }[], startDow: 0 };
    const [year, mon] = mockData.month.split('-').map(Number);
    const ms = startOfMonth(new Date(year, mon - 1));
    const me = endOfMonth(new Date(year, mon - 1));
    const days = eachDayOfInterval({ start: ms, end: me });
    const entryMap = new Map<string, number>();
    const leaveMap = new Map<string, number>();
    mockData.entries.forEach(e => entryMap.set(e.date, (entryMap.get(e.date) || 0) + 1));
    mockData.leaves.forEach(l => leaveMap.set(l.date, (leaveMap.get(l.date) || 0) + 1));
    return {
      days: days.map(d => {
        const ds = format(d, 'yyyy-MM-dd');
        return { date: ds, dayNum: d.getDate(), entryCount: entryMap.get(ds) || 0, leaveCount: leaveMap.get(ds) || 0 };
      }),
      startDow: getDay(ms),
    };
  }, [mockData]);

  const settingsPanel = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4" /> 模擬參數設定
        </CardTitle>
        <CardDescription>調整以下參數來自訂模擬數據的生成方式</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Row 1: User count & month */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>模擬人數</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[userCount]}
                onValueChange={v => setUserCount(v[0])}
                min={5}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{userCount} 人</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>起始月份</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>時間長度</Label>
            <Select value={String(durationMonths)} onValueChange={v => setDurationMonths(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 6, 12].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} 個月</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Fill rate & leave rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>填寫率範圍（每人隨機）</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={fillRateRange}
                onValueChange={v => setFillRateRange(v as [number, number])}
                min={10}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="text-sm font-medium w-24 text-right">{fillRateRange[0]}%-{fillRateRange[1]}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>請假率範圍（每人隨機）</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={leaveRateRange}
                onValueChange={v => setLeaveRateRange(v as [number, number])}
                min={0}
                max={30}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-24 text-right">{leaveRateRange[0]}%-{leaveRateRange[1]}%</span>
            </div>
          </div>
        </div>

        {/* Row 3: Theme weights */}
        <div className="space-y-2">
          <Label>主題偏好（開啟後該主題的內容出現頻率提高）</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(THEME_GROUPS).map(([theme, keywords]) => {
              const enabled = theme in themeWeights;
              return (
                <div key={theme} className="flex flex-col gap-1.5 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{theme}</span>
                    <Switch checked={enabled} onCheckedChange={v => toggleThemeWeight(theme, v)} />
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{keywords.join('、')}</p>
                  {enabled && (
                    <div className="flex items-center gap-2 mt-1">
                      <Slider
                        value={[themeWeights[theme]]}
                        onValueChange={v => updateThemeWeight(theme, v[0])}
                        min={1}
                        max={10}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-[10px] w-6 text-right">×{themeWeights[theme]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="w-full">
          {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
          {isGenerating ? '生成中...' : `生成模擬數據（${userCount}人 × ${durationMonths}個月）`}
        </Button>
      </CardContent>
    </Card>
  );

  if (!mockData) {
    return settingsPanel;
  }

  const top5Keywords = mockData.keywordStats.slice(0, 5);
  const avgFillRate = mockData.userStats.reduce((s, u) => s + u.fillRate, 0) / mockData.userStats.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">觀心書模擬數據</h3>
          <p className="text-sm text-muted-foreground">
            {mockData.month} · {mockData.users.length} 位會員 · {mockData.entries.length} 筆填寫 · {durationMonths} 個月
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-1" />
            {showSettings ? '隱藏設定' : '調整參數'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
            <RefreshCw className={cn("h-4 w-4 mr-1", isGenerating && "animate-spin")} />
            重新生成
          </Button>
        </div>
      </div>

      {showSettings && settingsPanel}

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{mockData.users.length}</div>
            <div className="text-xs text-muted-foreground">模擬會員</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <div className="text-2xl font-bold">{mockData.entries.length}</div>
            <div className="text-xs text-muted-foreground">總填寫數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <div className="text-2xl font-bold">{mockData.leaves.length}</div>
            <div className="text-xs text-muted-foreground">總請假數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Tag className="h-5 w-5 mx-auto mb-1 text-chart-3" />
            <div className="text-2xl font-bold">{avgFillRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">平均填寫率</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stats">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="stats">會員統計</TabsTrigger>
          <TabsTrigger value="keywords">關鍵字分析</TabsTrigger>
          <TabsTrigger value="calendar">月曆總覽</TabsTrigger>
          <TabsTrigger value="search">搜尋</TabsTrigger>
        </TabsList>

        {/* Stats tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Fill rate chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">填寫率分佈</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fillRateDistribution}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, count }) => `${name}: ${count}人`}
                      >
                        {fillRateDistribution.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top/bottom users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">填寫排行</CardTitle>
                <CardDescription>依填寫率排序</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {mockData.userStats.slice(0, 10).map((u, i) => (
                    <div key={u.userId} className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-bold w-5 text-center",
                        i < 3 && "text-primary"
                      )}>
                        {i + 1}
                      </span>
                      <span className="text-sm flex-1 truncate">{u.name}</span>
                      <Progress value={u.fillRate} className="w-20 h-2" />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {u.fillRate.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full user table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">全部會員填寫情況</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>會員</TableHead>
                      <TableHead className="text-center">已填天數</TableHead>
                      <TableHead className="text-center">請假天數</TableHead>
                      <TableHead className="text-center">缺填天數</TableHead>
                      <TableHead className="text-center">填寫率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockData.userStats.map(u => (
                      <TableRow key={u.userId}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{u.filledDays}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {u.leaveDays > 0 ? <Badge variant="outline">{u.leaveDays}</Badge> : <span className="text-muted-foreground">0</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {u.missedDays > 0 ? (
                            <Badge variant="destructive">{u.missedDays}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "font-medium",
                            u.fillRate >= 80 ? "text-green-600" : u.fillRate >= 50 ? "text-yellow-600" : "text-destructive"
                          )}>
                            {u.fillRate.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords tab */}
        <TabsContent value="keywords" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Top 5 keywords bar chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">前 5 大關鍵字</CardTitle>
                <CardDescription>出現次數最多的關鍵字</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={top5Keywords} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="keyword" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="count" name="出現次數" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Keyword radar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">主題雷達圖</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={top5Keywords}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="keyword" />
                      <PolarRadiusAxis />
                      <Radar name="出現次數" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full keyword table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">關鍵字統計表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>排名</TableHead>
                      <TableHead>關鍵字</TableHead>
                      <TableHead className="text-center">出現次數</TableHead>
                      <TableHead className="text-center">涉及會員數</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockData.keywordStats.map((ks, i) => (
                      <TableRow key={ks.keyword}>
                        <TableCell>
                          <span className={cn("font-bold", i < 5 && "text-primary")}>{i + 1}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={i < 5 ? "default" : "secondary"}>{ks.keyword}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{ks.count}</TableCell>
                        <TableCell className="text-center">{ks.users.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar tab */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {mockData.month} 月曆總覽（全部會員）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 mb-2">
                {WEEKDAY_LABELS.map((label, i) => (
                  <div key={label} className={cn(
                    'text-center text-xs font-medium py-1',
                    i === 0 && 'text-destructive',
                    i === 6 && 'text-muted-foreground'
                  )}>
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: calendarData.startDow }).map((_, i) => (
                  <div key={`e-${i}`} className="h-16" />
                ))}
                {calendarData.days.map(day => {
                  const intensity = Math.min(day.entryCount / mockData.users.length, 1);
                  return (
                    <div
                      key={day.date}
                      className="h-16 flex flex-col items-center justify-center text-xs border border-border/30 rounded"
                    >
                      <span className="font-medium">{day.dayNum}</span>
                      {day.entryCount > 0 && (
                        <span className={cn(
                          "text-[10px] font-medium",
                          intensity >= 0.7 ? "text-green-600" : intensity >= 0.4 ? "text-blue-500" : "text-muted-foreground"
                        )}>
                          {day.entryCount}筆
                        </span>
                      )}
                      {day.leaveCount > 0 && (
                        <span className="text-[10px] text-destructive">{day.leaveCount}假</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />高填寫率</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />中填寫率</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" />請假</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">關鍵字搜尋</CardTitle>
              <CardDescription>搜尋所有會員觀心書內容中的關鍵字</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="輸入關鍵字搜尋..."
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {searchKeyword.trim() && (
                <>
                  <div className="text-sm text-muted-foreground">
                    找到 <span className="font-bold text-foreground">{searchResults.length}</span> 筆包含「{searchKeyword}」的紀錄，
                    來自 <span className="font-bold text-foreground">{perUserKeywordCount.length}</span> 位會員
                  </div>

                  {perUserKeywordCount.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">各會員出現次數</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {perUserKeywordCount.slice(0, 12).map(u => (
                          <div key={u.name} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                            <span className="text-sm truncate">{u.name}</span>
                            <Badge variant="secondary">{u.count}次</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search result entries */}
                  <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日期</TableHead>
                          <TableHead>會員</TableHead>
                          <TableHead>內容預覽</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map(entry => (
                          <TableRow key={entry.id}>
                            <TableCell className="whitespace-nowrap">{entry.date}</TableCell>
                            <TableCell>{entry.userName}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{entry.content.slice(0, 50)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewContent({
                                  date: entry.date,
                                  content: entry.content,
                                  userName: entry.userName,
                                })}
                              >
                                <Eye className="h-3 w-3 mr-1" />查看
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View content dialog */}
      <Dialog open={!!viewContent} onOpenChange={() => setViewContent(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              ✨ {viewContent?.date} 觀心書 · {viewContent?.userName}
            </DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {viewContent?.content}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

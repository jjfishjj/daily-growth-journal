import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Play, 
  Trash2, 
  Edit, 
  Plus, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Brain,
  Sparkles,
  BarChart3,
  LineChart,
  PieChart,
  Loader2
} from 'lucide-react';
import { useMockData } from '@/hooks/useMockData';
import { usePrediction } from '@/hooks/usePrediction';
import { MockDailyEntry, MockHabitRecord } from '@/lib/mockDataGenerator';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import {
  LineChart as ReLineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function Simulation() {
  const { 
    mockEntries, 
    isLoading, 
    generateData, 
    addEntry, 
    updateEntry, 
    deleteEntry, 
    createNewEntry,
    clearAll 
  } = useMockData();
  
  const { predict, isLoading: isPredicting, result: predictionResult, error: predictionError } = usePrediction();
  
  const [days, setDays] = useState('30');
  const [trendType, setTrendType] = useState<'improving' | 'declining' | 'stable' | 'random'>('random');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<MockDailyEntry | null>(null);
  const [activeTab, setActiveTab] = useState('generate');

  const handleGenerate = () => {
    generateData(parseInt(days), trendType);
    toast.success(`已生成 ${days} 天的模擬數據`);
  };

  const handleAddNew = () => {
    const newEntry = createNewEntry();
    addEntry(newEntry);
    toast.success('已新增一筆模擬數據');
  };

  const handleEdit = (entry: MockDailyEntry) => {
    setSelectedEntry(entry);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (selectedEntry) {
      updateEntry(selectedEntry.id, selectedEntry);
      setEditDialogOpen(false);
      toast.success('已更新模擬數據');
    }
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    toast.success('已刪除模擬數據');
  };

  const handlePredict = (type: 'supervised' | 'unsupervised') => {
    if (mockEntries.length < 7) {
      toast.error('需要至少 7 天的數據才能進行預測');
      return;
    }
    predict(mockEntries, type);
  };

  // Chart data preparation
  const scoreTimeSeriesData = mockEntries.map(entry => ({
    date: format(new Date(entry.date), 'MM/dd'),
    平均分數: entry.averageScore,
    完成率: (entry.completedCount / entry.totalHabits * 100).toFixed(1)
  })).reverse();

  const habitCompletionData = (() => {
    const habitStats: Record<string, { completed: number; total: number; totalScore: number }> = {};
    
    mockEntries.forEach(entry => {
      entry.habitRecords.forEach(record => {
        if (!habitStats[record.habitName]) {
          habitStats[record.habitName] = { completed: 0, total: 0, totalScore: 0 };
        }
        habitStats[record.habitName].total++;
        if (record.completed) {
          habitStats[record.habitName].completed++;
          if (record.score) {
            habitStats[record.habitName].totalScore += record.score;
          }
        }
      });
    });

    return Object.entries(habitStats).map(([name, stats]) => ({
      name: name.length > 4 ? name.slice(0, 4) + '..' : name,
      fullName: name,
      完成率: Math.round(stats.completed / stats.total * 100),
      平均分數: stats.completed > 0 ? Math.round(stats.totalScore / stats.completed * 10) / 10 : 0
    }));
  })();

  const weekdayData = (() => {
    const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    const stats = weekdays.map(() => ({ total: 0, score: 0, count: 0 }));
    
    mockEntries.forEach(entry => {
      const dayIndex = new Date(entry.date).getDay();
      stats[dayIndex].total++;
      stats[dayIndex].score += entry.averageScore;
      stats[dayIndex].count++;
    });

    return weekdays.map((day, i) => ({
      day,
      平均分數: stats[i].count > 0 ? Math.round(stats[i].score / stats[i].count * 10) / 10 : 0
    }));
  })();

  const distributionData = (() => {
    const ranges = [
      { range: '1-2', min: 1, max: 2 },
      { range: '3-4', min: 3, max: 4 },
      { range: '5-6', min: 5, max: 6 },
      { range: '7-8', min: 7, max: 8 },
      { range: '9-10', min: 9, max: 10 },
    ];

    return ranges.map(({ range, min, max }) => ({
      range,
      count: mockEntries.filter(e => e.averageScore >= min && e.averageScore <= max).length
    }));
  })();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">數據模擬與預測</h1>
            <p className="text-muted-foreground mt-1">生成模擬數據、進行視覺化分析與 AI 預測</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              共 {mockEntries.length} 筆數據
            </span>
            {mockEntries.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll}>
                <Trash2 className="h-4 w-4 mr-1" />
                清除全部
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generate" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              生成數據
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <Edit className="h-4 w-4" />
              管理數據
            </TabsTrigger>
            <TabsTrigger value="visualize" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              視覺化
            </TabsTrigger>
            <TabsTrigger value="predict" className="gap-2">
              <Brain className="h-4 w-4" />
              AI 預測
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  生成模擬數據
                </CardTitle>
                <CardDescription>
                  選擇天數與趨勢類型來生成模擬的習慣追蹤數據
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>天數</Label>
                    <Input 
                      type="number" 
                      value={days} 
                      onChange={(e) => setDays(e.target.value)}
                      min="7"
                      max="365"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>趨勢類型</Label>
                    <Select value={trendType} onValueChange={(v: any) => setTrendType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="random">
                          <div className="flex items-center gap-2">
                            <Minus className="h-4 w-4" />
                            隨機
                          </div>
                        </SelectItem>
                        <SelectItem value="improving">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            持續進步
                          </div>
                        </SelectItem>
                        <SelectItem value="declining">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            逐漸下滑
                          </div>
                        </SelectItem>
                        <SelectItem value="stable">
                          <div className="flex items-center gap-2">
                            <Minus className="h-4 w-4 text-blue-500" />
                            穩定維持
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      生成數據
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {mockEntries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>快速統計</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-secondary/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">
                        {mockEntries.length}
                      </div>
                      <div className="text-sm text-muted-foreground">總天數</div>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">
                        {(mockEntries.reduce((sum, e) => sum + e.averageScore, 0) / mockEntries.length).toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">平均分數</div>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(mockEntries.reduce((sum, e) => sum + e.completedCount, 0) / mockEntries.length)}
                      </div>
                      <div className="text-sm text-muted-foreground">日均完成數</div>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(mockEntries.reduce((sum, e) => sum + e.completedCount / e.totalHabits * 100, 0) / mockEntries.length)}%
                      </div>
                      <div className="text-sm text-muted-foreground">平均完成率</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>數據管理</CardTitle>
                  <CardDescription>查看、編輯或刪除模擬數據</CardDescription>
                </div>
                <Button onClick={handleAddNew} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  新增一筆
                </Button>
              </CardHeader>
              <CardContent>
                {mockEntries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    尚無數據，請先生成模擬數據
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日期</TableHead>
                          <TableHead>完成數</TableHead>
                          <TableHead>平均分數</TableHead>
                          <TableHead>評語摘要</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockEntries.slice(0, 20).map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">
                              {format(new Date(entry.date), 'yyyy/MM/dd (EEE)', { locale: zhTW })}
                            </TableCell>
                            <TableCell>
                              {entry.completedCount}/{entry.totalHabits}
                            </TableCell>
                            <TableCell>
                              <span className={`font-semibold ${
                                entry.averageScore >= 8 ? 'text-green-600' :
                                entry.averageScore >= 6 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {entry.averageScore.toFixed(1)}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {entry.overallComment}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(entry)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(entry.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {mockEntries.length > 20 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        顯示前 20 筆，共 {mockEntries.length} 筆數據
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visualize Tab */}
          <TabsContent value="visualize" className="space-y-6">
            {mockEntries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  請先生成模擬數據以查看視覺化圖表
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Time Series Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LineChart className="h-5 w-5" />
                        分數趨勢
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={scoreTimeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis domain={[0, 10]} className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))' 
                            }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="平均分數" 
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary) / 0.2)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        各習慣完成率
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={habitCompletionData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" width={50} className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))' 
                            }}
                            formatter={(value, name, props) => [value + '%', props.payload.fullName]}
                          />
                          <Bar dataKey="完成率" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        分數分佈
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RePieChart>
                          <Pie
                            data={distributionData}
                            dataKey="count"
                            nameKey="range"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ range, count }) => `${range}分: ${count}天`}
                          >
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>週間表現分析</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={weekdayData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="day" />
                          <PolarRadiusAxis domain={[0, 10]} />
                          <Radar
                            name="平均分數"
                            dataKey="平均分數"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary) / 0.5)"
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>各習慣平均分數</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={habitCompletionData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))' 
                          }}
                          formatter={(value, name, props) => [value, props.payload.fullName]}
                        />
                        <Bar dataKey="平均分數" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Predict Tab */}
          <TabsContent value="predict" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI 預測分析
                </CardTitle>
                <CardDescription>
                  使用機器學習模型分析數據並預測未來趨勢
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2 border-dashed">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        監督式學習預測
                      </CardTitle>
                      <CardDescription>
                        基於歷史數據訓練模型，預測未來 7 天的習慣表現分數與趨勢
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => handlePredict('supervised')} 
                        disabled={isPredicting || mockEntries.length < 7}
                        className="w-full"
                      >
                        {isPredicting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        開始預測
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                        非監督式學習分析
                      </CardTitle>
                      <CardDescription>
                        自動發現數據中的聚類、異常值與隱藏模式
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => handlePredict('unsupervised')} 
                        disabled={isPredicting || mockEntries.length < 7}
                        variant="secondary"
                        className="w-full"
                      >
                        {isPredicting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Brain className="h-4 w-4 mr-2" />
                        )}
                        開始分析
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {mockEntries.length < 7 && (
                  <p className="text-sm text-amber-600 text-center">
                    需要至少 7 天的數據才能進行預測分析
                  </p>
                )}

                {predictionError && (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
                    {predictionError}
                  </div>
                )}

                {predictionResult && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>預測結果</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {predictionResult.predictions && (
                        <div>
                          <h4 className="font-medium mb-2">未來 7 天預測分數</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <ReLineChart data={predictionResult.predictions.map((score, i) => ({
                              day: `第 ${i + 1} 天`,
                              預測分數: typeof score === 'number' ? score : 0
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                              <XAxis dataKey="day" />
                              <YAxis domain={[0, 10]} />
                              <Tooltip />
                              <Line 
                                type="monotone" 
                                dataKey="預測分數" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                              />
                            </ReLineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {predictionResult.confidence !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">預測信心度：</span>
                          <span className="text-primary font-bold">
                            {(predictionResult.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}

                      {predictionResult.trends && (
                        <div>
                          <h4 className="font-medium mb-1">趨勢分析</h4>
                          <p className="text-muted-foreground">{predictionResult.trends}</p>
                        </div>
                      )}

                      {predictionResult.recommendations && (
                        <div>
                          <h4 className="font-medium mb-1">改進建議</h4>
                          <p className="text-muted-foreground">{predictionResult.recommendations}</p>
                        </div>
                      )}

                      {predictionResult.clusters && (
                        <div>
                          <h4 className="font-medium mb-1">數據聚類</h4>
                          <pre className="text-sm bg-secondary/50 p-3 rounded-lg overflow-x-auto">
                            {JSON.stringify(predictionResult.clusters, null, 2)}
                          </pre>
                        </div>
                      )}

                      {predictionResult.patterns && (
                        <div>
                          <h4 className="font-medium mb-1">發現的模式</h4>
                          <pre className="text-sm bg-secondary/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                            {typeof predictionResult.patterns === 'string' 
                              ? predictionResult.patterns 
                              : JSON.stringify(predictionResult.patterns, null, 2)}
                          </pre>
                        </div>
                      )}

                      {predictionResult.insights && (
                        <div>
                          <h4 className="font-medium mb-1">深度洞察</h4>
                          <pre className="text-sm bg-secondary/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                            {typeof predictionResult.insights === 'string' 
                              ? predictionResult.insights 
                              : Array.isArray(predictionResult.insights)
                                ? predictionResult.insights.join('\n\n')
                                : JSON.stringify(predictionResult.insights, null, 2)}
                          </pre>
                        </div>
                      )}

                      {predictionResult.anomalies && (
                        <div>
                          <h4 className="font-medium mb-1">異常值檢測</h4>
                          <pre className="text-sm bg-secondary/50 p-3 rounded-lg overflow-x-auto">
                            {JSON.stringify(predictionResult.anomalies, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>編輯模擬數據</DialogTitle>
            <DialogDescription>
              修改 {selectedEntry?.date} 的數據
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>完成數</Label>
                  <Input 
                    type="number"
                    value={selectedEntry.completedCount}
                    onChange={(e) => setSelectedEntry({
                      ...selectedEntry,
                      completedCount: parseInt(e.target.value) || 0
                    })}
                    min={0}
                    max={selectedEntry.totalHabits}
                  />
                </div>
                <div className="space-y-2">
                  <Label>平均分數</Label>
                  <Input 
                    type="number"
                    value={selectedEntry.averageScore}
                    onChange={(e) => setSelectedEntry({
                      ...selectedEntry,
                      averageScore: parseFloat(e.target.value) || 0
                    })}
                    min={0}
                    max={10}
                    step={0.1}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>評語</Label>
                <Textarea 
                  value={selectedEntry.overallComment}
                  onChange={(e) => setSelectedEntry({
                    ...selectedEntry,
                    overallComment: e.target.value
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

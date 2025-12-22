import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { HabitCard } from '@/components/habits/HabitCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useHabits, useDailyEntry, useSaveDailyEntry } from '@/hooks/useHabits';
import { toast } from 'sonner';
import { CalendarDays, Save, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

interface HabitState {
  completed: boolean;
  score: number | null;
  note: string;
}

export default function Today() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: existingEntry, isLoading: entryLoading } = useDailyEntry(today);
  const saveMutation = useSaveDailyEntry();

  const [habitStates, setHabitStates] = useState<Record<string, HabitState>>({});
  const [overallComment, setOverallComment] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Initialize states from existing entry or defaults
  useEffect(() => {
    if (habits && !initialized) {
      const initialStates: Record<string, HabitState> = {};
      
      habits.forEach(habit => {
        const existingRecord = existingEntry?.daily_habit_records?.find(
          r => r.habit_id === habit.id
        );

        initialStates[habit.id] = {
          completed: existingRecord?.completed ?? false,
          score: existingRecord?.score ?? null,
          note: existingRecord?.note ?? ''
        };
      });

      setHabitStates(initialStates);
      setOverallComment(existingEntry?.overall_comment ?? '');
      setInitialized(true);
    }
  }, [habits, existingEntry, initialized]);

  // Reset initialized when date changes
  useEffect(() => {
    setInitialized(false);
  }, [today]);

  const updateHabit = (habitId: string, updates: Partial<HabitState>) => {
    setHabitStates(prev => ({
      ...prev,
      [habitId]: {
        ...prev[habitId],
        ...updates,
        // Set default score when completing
        score: updates.completed && !prev[habitId]?.score 
          ? 5 
          : (updates.score ?? prev[habitId]?.score)
      }
    }));
  };

  const handleSave = async () => {
    if (!habits) return;

    const habitRecords = habits.map(habit => ({
      habitId: habit.id,
      completed: habitStates[habit.id]?.completed ?? false,
      score: habitStates[habit.id]?.score ?? null,
      note: habitStates[habit.id]?.note ?? ''
    }));

    try {
      await saveMutation.mutateAsync({
        date: today,
        overallComment,
        habitRecords
      });
      toast.success('儲存成功！', { description: '今日修行紀錄已保存' });
    } catch (error) {
      toast.error('儲存失敗', { description: '請稍後再試' });
    }
  };

  const stats = useMemo(() => {
    if (!habits) return { completed: 0, total: 0, avgScore: 0 };
    
    const completedHabits = habits.filter(h => habitStates[h.id]?.completed);
    const scores = completedHabits
      .map(h => habitStates[h.id]?.score)
      .filter((s): s is number => s !== null);

    return {
      completed: completedHabits.length,
      total: habits.length,
      avgScore: scores.length > 0 
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
        : '0'
    };
  }, [habits, habitStates]);

  const isLoading = habitsLoading || entryLoading;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
              今日修行
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(), 'yyyy年 M月 d日 EEEE', { locale: zhTW })}
            </p>
          </div>

          {existingEntry && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span>已填寫</span>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-border/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-around text-center">
              <div>
                <div className="text-2xl font-semibold text-primary">
                  {stats.completed}/{stats.total}
                </div>
                <div className="text-sm text-muted-foreground">已完成</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <div className="text-2xl font-semibold text-accent flex items-center justify-center gap-1">
                  {stats.avgScore}
                  {Number(stats.avgScore) >= 8 && (
                    <Sparkles className="h-5 w-5 animate-pulse-soft" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">平均分數</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Habits List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            habits?.map((habit, index) => (
              <div
                key={habit.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <HabitCard
                  habit={habit}
                  completed={habitStates[habit.id]?.completed ?? false}
                  score={habitStates[habit.id]?.score ?? null}
                  note={habitStates[habit.id]?.note ?? ''}
                  onCompletedChange={(completed) => 
                    updateHabit(habit.id, { completed })
                  }
                  onScoreChange={(score) => 
                    updateHabit(habit.id, { score })
                  }
                  onNoteChange={(note) => 
                    updateHabit(habit.id, { note })
                  }
                />
              </div>
            ))
          )}
        </div>

        {/* Overall Comment */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">今日總評</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="記錄今天的心得、感悟或反思..."
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              className="min-h-[120px] resize-none bg-background/50"
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending || isLoading}
          className="w-full h-12 text-base"
          size="lg"
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          儲存今日紀錄
        </Button>
      </div>
    </AppLayout>
  );
}

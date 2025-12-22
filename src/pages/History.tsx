import { useState } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useHistory, useHabits } from '@/hooks/useHabits';
import { 
  History as HistoryIcon, 
  ChevronRight, 
  CalendarDays,
  X,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EntryDetailProps {
  entry: {
    id: string;
    date: string;
    overall_comment: string | null;
    daily_habit_records: Array<{
      habit_id: string;
      completed: boolean;
      score: number | null;
      note: string | null;
    }>;
  };
  habits: Array<{ id: string; name: string }>;
  onClose: () => void;
}

function EntryDetail({ entry, habits, onClose }: EntryDetailProps) {
  const completedCount = entry.daily_habit_records.filter(r => r.completed).length;
  
  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          {format(new Date(entry.date), 'yyyy年 M月 d日', { locale: zhTW })}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
          <div className="text-center">
            <div className="text-xl font-semibold text-primary">
              {completedCount}/{habits.length}
            </div>
            <div className="text-xs text-muted-foreground">完成</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-xl font-semibold text-accent">
              {(() => {
                const scores = entry.daily_habit_records
                  .filter(r => r.completed && r.score)
                  .map(r => r.score as number);
                return scores.length > 0 
                  ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
                  : '-';
              })()}
            </div>
            <div className="text-xs text-muted-foreground">平均分</div>
          </div>
        </div>

        {/* Habits */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">習慣紀錄</h4>
          <div className="space-y-2">
            {habits.map(habit => {
              const record = entry.daily_habit_records.find(r => r.habit_id === habit.id);
              return (
                <div
                  key={habit.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    record?.completed 
                      ? "bg-primary/5 border-primary/20" 
                      : "bg-muted/30 border-border/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {record?.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium">{habit.name}</div>
                      {record?.note && (
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {record.note}
                        </div>
                      )}
                    </div>
                  </div>
                  {record?.completed && record.score && (
                    <div className="text-lg font-semibold text-accent">
                      {record.score}分
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Comment */}
        {entry.overall_comment && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">今日總評</h4>
            <div className="p-3 bg-secondary/30 rounded-lg text-foreground">
              {entry.overall_comment}
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

export default function History() {
  const { data: entries, isLoading: entriesLoading } = useHistory();
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const [selectedEntry, setSelectedEntry] = useState<typeof entries[0] | null>(null);

  const isLoading = entriesLoading || habitsLoading;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground flex items-center gap-3">
            <HistoryIcon className="h-7 w-7 text-primary" />
            歷史紀錄
          </h1>
          <p className="text-muted-foreground mt-1">
            查看過去的修行紀錄
          </p>
        </div>

        {/* Entries List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : entries?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-foreground mb-1">尚無紀錄</h3>
                <p className="text-sm text-muted-foreground">
                  開始在「今日填寫」記錄您的修行吧
                </p>
              </CardContent>
            </Card>
          ) : (
            entries?.map((entry, index) => {
              const completedCount = entry.daily_habit_records.filter(r => r.completed).length;
              const scores = entry.daily_habit_records
                .filter(r => r.completed && r.score)
                .map(r => r.score as number);
              const avgScore = scores.length > 0
                ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
                : '-';

              return (
                <Card
                  key={entry.id}
                  className="cursor-pointer hover:shadow-card-zen transition-all border-border/50 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-foreground">
                            {format(new Date(entry.date), 'M月 d日 EE', { locale: zhTW })}
                          </span>
                          <span className="text-sm text-primary font-medium">
                            {completedCount}/{habits?.length || 0} 完成
                          </span>
                          <span className="text-sm text-accent font-medium">
                            {avgScore} 分
                          </span>
                        </div>
                        {entry.overall_comment && (
                          <p className="text-sm text-muted-foreground truncate">
                            {entry.overall_comment}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        {selectedEntry && habits && (
          <EntryDetail
            entry={selectedEntry}
            habits={habits}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </Dialog>
    </AppLayout>
  );
}

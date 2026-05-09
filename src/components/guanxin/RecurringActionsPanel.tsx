import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Repeat2, CheckCircle2, Circle } from 'lucide-react';
import { useGuanxinActions } from '@/hooks/useGuanxinActions';
import { useGuanxinEntryDateMap } from '@/hooks/useGuanxin';
import { clusterBySimilarity } from '@/lib/actionSimilarity';

export function RecurringActionsPanel() {
  const { data: actions = [], isLoading } = useGuanxinActions('all');
  const { data: entryDateMap } = useGuanxinEntryDateMap();

  const clusters = useMemo(() => {
    if (!actions.length) return [];
    const groups = clusterBySimilarity(actions, (a) => a.content);
    return groups
      .filter((g) => g.length >= 2)
      .map((idxs) => {
        const items = idxs.map((i) => actions[i]);
        // representative = shortest content (more general)
        const rep = items.slice().sort((a, b) => a.content.length - b.content.length)[0];
        const dates = items
          .map((it) => {
            if (it.guanxin_entry_id && entryDateMap?.get(it.guanxin_entry_id)) {
              return entryDateMap.get(it.guanxin_entry_id)!;
            }
            return it.created_at.slice(0, 10);
          })
          .sort();
        const completedCount = items.filter((i) => i.is_completed).length;
        return { rep, items, dates, completedCount };
      })
      .sort((a, b) => b.items.length - a.items.length);
  }, [actions, entryDateMap]);

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Repeat2 className="h-4 w-4 text-primary" /> 重複行動方案統整
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          系統自動分析你寫過的所有行動方案，找出曾出現 2 次以上的類似主題，協助你看見反覆需要面對的功課。
        </p>
        {clusters.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            目前還沒有重複出現的行動方案
          </p>
        ) : (
          clusters.map((cluster, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2 bg-muted/20">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-relaxed flex-1">
                  {cluster.rep.content}
                </p>
                <Badge variant="secondary" className="shrink-0">
                  ×{cluster.items.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {cluster.dates.map((d, j) => (
                  <Badge key={j} variant="outline" className="font-normal">
                    {format(parseISO(d), 'MM/dd')}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  完成 {cluster.completedCount}
                </span>
                <span className="flex items-center gap-1">
                  <Circle className="h-3 w-3" />
                  未完成 {cluster.items.length - cluster.completedCount}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

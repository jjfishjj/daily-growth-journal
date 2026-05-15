import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FEELINGS, FEELING_COLORS } from '@/lib/feelings';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2, Heart } from 'lucide-react';

interface Props {
  selected: string[];
  onToggle: (f: string) => void;
  onAiSummarize?: () => void;
  aiLoading?: boolean;
  showAiButton?: boolean;
}

export function FeelingsSelector({ selected, onToggle, onAiSummarize, aiLoading, showAiButton }: Props) {
  return (
    <Card className="border-border/50 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            感覺專區
          </CardTitle>
          {showAiButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAiSummarize}
              disabled={aiLoading}
              className="text-xs h-7"
            >
              {aiLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              AI 摘要感覺
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">點選今日體驗到的感覺</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {FEELINGS.map((f) => {
            const active = selected.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => onToggle(f)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-all',
                  active
                    ? `${FEELING_COLORS[f]} ring-2 ring-offset-1 ring-primary/40 scale-105`
                    : 'bg-background hover:bg-accent/40 border-border text-muted-foreground'
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

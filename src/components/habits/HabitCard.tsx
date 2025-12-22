import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HabitCardProps {
  habit: {
    id: string;
    name: string;
    description: string | null;
  };
  completed: boolean;
  score: number | null;
  note: string;
  onCompletedChange: (completed: boolean) => void;
  onScoreChange: (score: number | null) => void;
  onNoteChange: (note: string) => void;
}

export function HabitCard({
  habit,
  completed,
  score,
  note,
  onCompletedChange,
  onScoreChange,
  onNoteChange
}: HabitCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card 
      className={cn(
        "transition-all duration-300 border-border/50",
        completed && "border-primary/30 bg-primary/5 shadow-glow-zen"
      )}
    >
      <CardContent className="p-4">
        {/* Main Row */}
        <div className="flex items-center gap-4">
          <Switch
            checked={completed}
            onCheckedChange={onCompletedChange}
            className="data-[state=checked]:bg-primary"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "font-medium transition-colors",
                completed && "text-primary"
              )}>
                {habit.name}
              </h3>
              {completed && score && score >= 8 && (
                <Sparkles className="h-4 w-4 text-accent animate-pulse-soft" />
              )}
            </div>
            {habit.description && (
              <p className="text-sm text-muted-foreground truncate">
                {habit.description}
              </p>
            )}
          </div>

          {completed && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-lg font-semibold w-6 text-center",
                  score && score >= 8 ? "text-accent" : "text-primary"
                )}>
                  {score || '-'}
                </span>
                <span className="text-sm text-muted-foreground">分</span>
              </div>
              
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 hover:bg-secondary rounded-md transition-colors"
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {completed && expanded && (
          <div className="mt-4 space-y-4 pt-4 border-t border-border/50 animate-fade-in">
            {/* Score Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">今日分數</span>
                <span className="font-medium text-primary">{score || 5} / 10</span>
              </div>
              <Slider
                value={[score || 5]}
                min={1}
                max={10}
                step={1}
                onValueChange={([value]) => onScoreChange(value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Note Input */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">備註（選填）</label>
              <Input
                placeholder="記錄一些心得..."
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

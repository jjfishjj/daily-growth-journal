import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useHabits, useSaveDailyEntry } from "@/hooks/useHabits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles } from "lucide-react";

const ZenGardenScene = lazy(() => import("@/components/game/ZenGardenScene"));

export default function Game() {
  const { data: habits = [] } = useHabits();
  const save = useSaveDailyEntry();
  const { toast } = useToast();
  const [lit, setLit] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const items = useMemo(() => habits.map((h) => ({ id: h.id, name: h.name, lit: lit.has(h.id) })), [habits, lit]);
  const toggle = (id: string) => setLit((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const submit = async () => {
    if (lit.size === 0) { toast({ title: "請先點亮至少一盞燈籠" }); return; }
    try {
      await save.mutateAsync({
        date: format(new Date(), "yyyy-MM-dd"),
        overallComment: note,
        habitRecords: habits.map((h) => ({ habitId: h.id, completed: lit.has(h.id), score: null, note: "" })),
      });
      toast({ title: "已存入今日功課 🏮", description: `點亮了 ${lit.size} 盞燈籠` });
      setLit(new Set()); setNote("");
    } catch (e) {
      toast({ title: "儲存失敗", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <Suspense fallback={<div className="flex h-full items-center justify-center text-muted-foreground">庭園載入中…</div>}>
        <ZenGardenScene items={items} onToggle={toggle} />
      </Suspense>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <Button asChild variant="secondary" size="sm" className="pointer-events-auto"><Link to="/today"><ArrowLeft className="mr-1 h-4 w-4" />回到平台</Link></Button>
        <div className="pointer-events-auto rounded-lg bg-card/85 px-4 py-2 text-right shadow backdrop-blur">
          <div className="text-sm font-medium text-foreground">觀心庭園</div>
          <div className="text-xs text-muted-foreground">已點亮 {lit.size} / {habits.length}</div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="mx-auto max-w-xl space-y-2 rounded-xl bg-card/90 p-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted-foreground">點擊燈籠代表完成該項功課，拖曳可環視庭園。燈越亮，池中寶石越明亮。</p>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="寫下今日觀心紀錄（選填）" rows={2} />
          <Button className="w-full" onClick={submit} disabled={save.isPending}><Sparkles className="mr-1 h-4 w-4" />{save.isPending ? "儲存中…" : "存入今日功課"}</Button>
        </div>
      </div>
    </div>
  );
}

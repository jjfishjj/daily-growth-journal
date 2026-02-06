import { AppLayout } from '@/components/layout/AppLayout';
import { PlatformStats } from '@/components/stats/PlatformStats';
import { Users } from 'lucide-react';

export default function Community() {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            平台動態
          </h1>
        </div>
        <p className="text-muted-foreground">
          查看平台整體統計，了解熱門習慣、最佳實踐時段和最活躍的會員們！
        </p>
        <PlatformStats />
      </div>
    </AppLayout>
  );
}

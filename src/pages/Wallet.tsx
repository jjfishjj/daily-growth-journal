import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Zap, TrendingUp, TrendingDown, Clock, Sparkles, ShoppingBag } from 'lucide-react';
import { useEnergyBalance, useEnergyTransactions, getSourceLabel } from '@/hooks/useEnergyPoints';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Wallet() {
  const { data: balance, isLoading: balanceLoading } = useEnergyBalance();
  const { data: transactions, isLoading: txLoading } = useEnergyTransactions(50);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-foreground">能量錢包</h1>
          <p className="text-muted-foreground mt-1">管理你的能量點數</p>
        </div>

        {/* Balance Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-bold text-foreground">
                {balanceLoading ? '...' : balance?.balance ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">能量點數</div>
              <div className="flex justify-center gap-6 pt-3">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-emerald-600">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">{balance?.totalEarned ?? 0}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">累計獲得</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-orange-500">
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">{balance?.totalSpent ?? 0}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">累計花費</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/shop">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm">配配幣商城</div>
                  <div className="text-xs text-muted-foreground">兌換道具</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/match">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <div className="font-medium text-sm">每日一抽</div>
                  <div className="text-xs text-muted-foreground">交友配對</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Earning Rules */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">點數獲取規則</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { source: 'daily_checkin', points: 5, desc: '每日登入簽到' },
              { source: 'habit_complete', points: 10, desc: '完成每日修行日誌' },
              { source: 'guanxin_write', points: 10, desc: '填寫觀心書' },
              { source: 'social_interact', points: 3, desc: '回覆留言或互動' },
            ].map(rule => (
              <div key={rule.source} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">{rule.desc}</span>
                <Badge variant="secondary" className="font-mono">+{rule.points}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              交易紀錄
            </CardTitle>
            <CardDescription>最近的能量點數變動</CardDescription>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="text-center py-6 text-muted-foreground">載入中...</div>
            ) : !transactions?.length ? (
              <div className="text-center py-6 text-muted-foreground">尚無交易紀錄</div>
            ) : (
              <div className="space-y-1">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{getSourceLabel(tx.source)}</div>
                      {tx.description && (
                        <div className="text-xs text-muted-foreground truncate">{tx.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), 'MM/dd HH:mm', { locale: zhTW })}
                      </div>
                    </div>
                    <div className={`font-mono text-sm font-medium ${tx.type === 'earn' ? 'text-emerald-600' : 'text-orange-500'}`}>
                      {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

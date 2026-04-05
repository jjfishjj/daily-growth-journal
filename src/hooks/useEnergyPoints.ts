import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface EnergyBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

interface EnergyTransaction {
  id: string;
  amount: number;
  type: 'earn' | 'spend';
  source: string;
  description: string | null;
  created_at: string;
}

const SOURCE_LABELS: Record<string, string> = {
  welcome_bonus: '🎉 新手獎勵',
  daily_checkin: '📅 每日簽到',
  habit_complete: '✅ 完成修行',
  guanxin_write: '📝 填寫觀心書',
  match_draw: '🎯 配對抽取',
  shop_purchase: '🛒 商城購買',
  social_interact: '💬 社交互動',
};

export function getSourceLabel(source: string) {
  return SOURCE_LABELS[source] || source;
}

export function useEnergyBalance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['energy-balance', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('energy_balances')
        .select('balance, total_earned, total_spent')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return { balance: 0, totalEarned: 0, totalSpent: 0 } as EnergyBalance;

      return {
        balance: data.balance,
        totalEarned: data.total_earned,
        totalSpent: data.total_spent,
      } as EnergyBalance;
    },
    enabled: !!user,
    staleTime: 10_000,
  });
}

export function useEnergyTransactions(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['energy-transactions', user?.id, limit],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('energy_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as EnergyTransaction[];
    },
    enabled: !!user,
    staleTime: 10_000,
  });
}

export function useAwardPoints() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ amount, source, description }: { amount: number; source: string; description: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.rpc('award_energy_points', {
        _user_id: user.id,
        _amount: amount,
        _source: source,
        _description: description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-balance'] });
      queryClient.invalidateQueries({ queryKey: ['energy-transactions'] });
    },
  });
}

export function useSpendPoints() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ amount, source, description }: { amount: number; source: string; description: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.rpc('spend_energy_points', {
        _user_id: user.id,
        _amount: amount,
        _source: source,
        _description: description,
      });
      if (error) throw error;
      if (data === false) throw new Error('能量點數不足');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-balance'] });
      queryClient.invalidateQueries({ queryKey: ['energy-transactions'] });
    },
  });
}

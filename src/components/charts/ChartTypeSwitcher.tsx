import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BarChart3, PieChart, LineChart, Activity, Grid3X3, ChevronDown, Link2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, LineChart as RechartsLine, Line,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';

export type ChartType = 'bar' | 'pie' | 'line' | 'area' | 'radar';

interface ChartTypeSwitcherProps {
  data: any[];
  dataKey: string;
  nameKey?: string;
  title: string;
  chartTypes?: ChartType[];
  defaultType?: ChartType;
  onViewData?: () => void;
  height?: number;
  colors?: string[];
  domain?: [number, number];
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const chartTypeIcons: Record<ChartType, React.ReactNode> = {
  bar: <BarChart3 className="h-4 w-4" />,
  pie: <PieChart className="h-4 w-4" />,
  line: <LineChart className="h-4 w-4" />,
  area: <Activity className="h-4 w-4" />,
  radar: <Grid3X3 className="h-4 w-4" />,
};

const chartTypeLabels: Record<ChartType, string> = {
  bar: '長條圖',
  pie: '圓餅圖',
  line: '折線圖',
  area: '區域圖',
  radar: '雷達圖',
};

export function ChartTypeSwitcher({
  data,
  dataKey,
  nameKey = 'name',
  title,
  chartTypes = ['bar', 'pie', 'line', 'area'],
  defaultType = 'bar',
  onViewData,
  height = 280,
  colors = CHART_COLORS,
  domain,
}: ChartTypeSwitcherProps) {
  const [currentType, setCurrentType] = useState<ChartType>(defaultType);

  const renderChart = () => {
    const tooltipStyle = {
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '8px',
    };

    switch (currentType) {
      case 'bar':
        return (
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis type="number" domain={domain} className="text-xs" />
            <YAxis dataKey={nameKey} type="category" width={80} className="text-xs" />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey={dataKey} fill={colors[0]} radius={4} />
          </BarChart>
        );
      case 'pie':
        return (
          <RechartsPie>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={Math.min(height / 3, 100)}
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </RechartsPie>
        );
      case 'line':
        return (
          <RechartsLine data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={nameKey} className="text-xs" />
            <YAxis domain={domain} className="text-xs" />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={2} dot={{ fill: colors[0] }} />
          </RechartsLine>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={nameKey} className="text-xs" />
            <YAxis domain={domain} className="text-xs" />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey={dataKey} stroke={colors[0]} fill={colors[0]} fillOpacity={0.5} />
          </AreaChart>
        );
      case 'radar':
        return (
          <RadarChart data={data} outerRadius={Math.min(height / 3, 100)}>
            <PolarGrid className="stroke-border" />
            <PolarAngleAxis dataKey={nameKey} className="text-xs" />
            <PolarRadiusAxis domain={domain} className="text-xs" />
            <Radar dataKey={dataKey} stroke={colors[0]} fill={colors[0]} fillOpacity={0.5} />
          </RadarChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="flex items-center gap-2">
          {onViewData && (
            <Button variant="ghost" size="sm" onClick={onViewData} className="h-8 gap-1 text-xs">
              <Link2 className="h-3 w-3" />
              查看數據
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                {chartTypeIcons[currentType]}
                <span className="text-xs">{chartTypeLabels[currentType]}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {chartTypes.map(type => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setCurrentType(type)}
                  className={cn(currentType === type && "bg-accent")}
                >
                  {chartTypeIcons[type]}
                  <span className="ml-2">{chartTypeLabels[type]}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

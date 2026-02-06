import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BarChart3, PieChart, LineChart, Activity, Grid3X3, ChevronDown, Link2, Table } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, LineChart as RechartsLine, Line,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';

export type ChartType = 'bar' | 'pie' | 'line' | 'area' | 'radar';

interface SwitchableChartProps {
  data: any[];
  dataKey: string;
  nameKey?: string;
  title: string;
  description?: string;
  chartTypes?: ChartType[];
  defaultType?: ChartType;
  onViewData?: () => void;
  dataSourceTab?: string;
  height?: number;
  colors?: string[];
  domain?: [number, number];
  layout?: 'horizontal' | 'vertical';
  showLegend?: boolean;
  secondaryDataKey?: string;
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

export function SwitchableChart({
  data,
  dataKey,
  nameKey = 'name',
  title,
  description,
  chartTypes = ['bar', 'pie', 'line', 'area'],
  defaultType = 'bar',
  onViewData,
  dataSourceTab,
  height = 280,
  colors = CHART_COLORS,
  domain,
  layout = 'horizontal',
  showLegend = false,
  secondaryDataKey,
}: SwitchableChartProps) {
  const [currentType, setCurrentType] = useState<ChartType>(defaultType);

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
  };

  const renderChart = () => {
    switch (currentType) {
      case 'bar':
        if (layout === 'vertical') {
          return (
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" domain={domain} className="text-xs" />
              <YAxis dataKey={nameKey} type="category" width={60} className="text-xs" />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend />}
              <Bar dataKey={dataKey} fill={colors[0]} radius={4} />
              {secondaryDataKey && <Bar dataKey={secondaryDataKey} fill={colors[1]} radius={4} />}
            </BarChart>
          );
        }
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={nameKey} className="text-xs" />
            <YAxis domain={domain} className="text-xs" />
            <Tooltip contentStyle={tooltipStyle} />
            {showLegend && <Legend />}
            <Bar dataKey={dataKey} fill={colors[0]} radius={4} />
            {secondaryDataKey && <Bar dataKey={secondaryDataKey} fill={colors[1]} radius={4} />}
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
              label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
              outerRadius={Math.min(height / 3, 90)}
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
            {showLegend && <Legend />}
            <Line type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={2} dot={{ fill: colors[0] }} />
            {secondaryDataKey && <Line type="monotone" dataKey={secondaryDataKey} stroke={colors[1]} strokeWidth={2} dot={{ fill: colors[1] }} />}
          </RechartsLine>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={nameKey} className="text-xs" />
            <YAxis domain={domain} className="text-xs" />
            <Tooltip contentStyle={tooltipStyle} />
            {showLegend && <Legend />}
            <Area type="monotone" dataKey={dataKey} stroke={colors[0]} fill={colors[0]} fillOpacity={0.5} />
            {secondaryDataKey && <Area type="monotone" dataKey={secondaryDataKey} stroke={colors[1]} fill={colors[1]} fillOpacity={0.5} />}
          </AreaChart>
        );
      case 'radar':
        return (
          <RadarChart data={data} outerRadius={Math.min(height / 3, 90)}>
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
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription className="text-xs">{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-1">
            {(onViewData || dataSourceTab) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onViewData} 
                className="h-7 gap-1 text-xs px-2"
                title={dataSourceTab ? `查看 ${dataSourceTab} 頁籤的數據` : '查看數據'}
              >
                <Table className="h-3 w-3" />
                {dataSourceTab || '數據'}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 px-2">
                  {chartTypeIcons[currentType]}
                  <span className="text-xs hidden sm:inline">{chartTypeLabels[currentType]}</span>
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
      </CardHeader>
      <CardContent style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, Image } from 'lucide-react';
import { downloadCsv, downloadChartAsPng } from '@/lib/exportUtils';
import { toast } from 'sonner';

interface DataDownloadProps {
  data: Record<string, any>[];
  filename: string;
  headers?: string[];
  chartContainerId?: string;
}

export function DataDownload({ data, filename, headers, chartContainerId }: DataDownloadProps) {
  const handleCsv = () => {
    if (data.length === 0) {
      toast.error('沒有可下載的資料');
      return;
    }
    downloadCsv(data, filename, headers);
    toast.success(`已下載 ${filename}.csv`);
  };

  const handlePng = async () => {
    if (!chartContainerId) return;
    try {
      await downloadChartAsPng(chartContainerId, filename);
      toast.success(`已下載 ${filename}.png`);
    } catch {
      toast.error('圖片下載失敗');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" />
          下載
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCsv} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          CSV 檔案
        </DropdownMenuItem>
        {chartContainerId && (
          <DropdownMenuItem onClick={handlePng} className="gap-2">
            <Image className="h-4 w-4" />
            PNG 圖片
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

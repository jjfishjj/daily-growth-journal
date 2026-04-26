import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Smartphone, Apple, Share2, Plus, Download, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop" | "unknown";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/macintosh|windows|linux/.test(ua)) return "desktop";
  return "unknown";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export default function Install() {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      toast.success("已安裝到主畫面 ✨");
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      toast.info("請依下方步驟手動安裝");
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex h-20 w-20 rounded-3xl overflow-hidden shadow-lg">
            <img
              src="/icons/icon-512.png"
              alt="修行日誌 App icon"
              width={80}
              height={80}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="font-serif text-3xl font-semibold">把修行日誌裝到手機</h1>
          <p className="text-muted-foreground text-sm">
            像原生 App 一樣使用，從主畫面一鍵開啟，全螢幕無干擾
          </p>
          {installed && (
            <Badge className="gap-1">
              <Check className="h-3.5 w-3.5" /> 已安裝
            </Badge>
          )}
        </div>

        {!installed && deferredPrompt && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-sm">你的瀏覽器支援一鍵安裝</div>
                <div className="text-xs text-muted-foreground">點擊右側按鈕立即安裝</div>
              </div>
              <Button onClick={triggerInstall} className="gap-2">
                <Download className="h-4 w-4" /> 立即安裝
              </Button>
            </CardContent>
          </Card>
        )}

        {/* iOS */}
        {(platform === "ios" || platform === "unknown") && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Apple className="h-4 w-4" /> iPhone / iPad（Safari）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Step n={1} icon={<Share2 className="h-4 w-4" />}>
                點擊 Safari 底部的「分享」按鈕
              </Step>
              <Step n={2} icon={<Plus className="h-4 w-4" />}>
                往下捲動，選擇「<b>加入主畫面</b>」
              </Step>
              <Step n={3} icon={<Check className="h-4 w-4" />}>
                點擊右上角「新增」即完成
              </Step>
              <p className="text-xs text-muted-foreground pt-2">
                💡 必須使用 Safari 開啟此頁，Chrome / LINE 內建瀏覽器無法安裝
              </p>
            </CardContent>
          </Card>
        )}

        {/* Android */}
        {(platform === "android" || platform === "unknown") && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> Android（Chrome）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Step n={1}>點擊 Chrome 右上角「⋮」選單</Step>
              <Step n={2}>選擇「<b>安裝應用程式</b>」或「加到主畫面」</Step>
              <Step n={3}>確認後 App 即出現在主畫面</Step>
            </CardContent>
          </Card>
        )}

        {/* Desktop */}
        {platform === "desktop" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4" /> 桌面瀏覽器
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Step n={1}>網址列右側會出現「安裝」圖示</Step>
              <Step n={2}>點擊安裝後可從電腦啟動台直接開啟</Step>
            </CardContent>
          </Card>
        )}

        <Separator />
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to="/today" className="gap-1">
              繼續使用 <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function Step({ n, icon, children }: { n: number; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-medium shrink-0">
        {n}
      </div>
      <div className="flex-1 flex items-center gap-2 pt-0.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span>{children}</span>
      </div>
    </div>
  );
}

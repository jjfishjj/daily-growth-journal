// GA4 Analytics Helper
// 請在 index.html 中將 G-XXXXXXXXXX 替換為你的實際 GA4 Measurement ID

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

// 自訂事件
export const GA_EVENTS = {
  // 點擊 Google 登入/註冊
  CLICK_GOOGLE_SIGNIN: 'click_google_signin',
  // 點擊「還沒有帳號？立即註冊」
  CLICK_SWITCH_TO_SIGNUP: 'click_switch_to_signup',
  // 點擊「已有帳號？立即登入」
  CLICK_SWITCH_TO_LOGIN: 'click_switch_to_login',
  // 提交登入表單
  SUBMIT_LOGIN: 'submit_login',
  // 提交註冊表單
  SUBMIT_SIGNUP: 'submit_signup',
  // 點擊忘記密碼
  CLICK_FORGOT_PASSWORD: 'click_forgot_password',
  // 頁面滾動深度
  SCROLL_DEPTH: 'scroll_depth',
} as const;

// 滾動深度追蹤（25%, 50%, 75%, 100%）
let scrollMilestones = new Set<number>();

export function initScrollTracking() {
  scrollMilestones = new Set<number>();
  
  const handleScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight <= 0) return;
    
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);
    
    const milestones = [25, 50, 75, 100];
    for (const milestone of milestones) {
      if (scrollPercent >= milestone && !scrollMilestones.has(milestone)) {
        scrollMilestones.add(milestone);
        trackEvent(GA_EVENTS.SCROLL_DEPTH, {
          percent_scrolled: milestone,
          page_path: window.location.pathname,
        });
      }
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}

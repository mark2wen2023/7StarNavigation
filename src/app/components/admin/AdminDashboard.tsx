import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Landmark, Ship, Droplets, Anchor, Navigation, AlertTriangle, Cloud, Gauge,
  Plus, Pencil, Trash2, Search, RefreshCw, Database, ChevronDown, ChevronRight,
  X, Save, Loader2, CheckCircle2, XCircle, Route, Waves, Settings, LayoutDashboard,
  Cpu, Zap, Clock, Globe, FileText, Upload, Link2, Radio, Eye, Activity,
  Shield, TrendingUp, Thermometer, Wind, MapPin, Bell, Filter, MoreVertical,
  ArrowUpRight, ExternalLink, ToggleLeft, ToggleRight, Wifi, WifiOff, Compass,
  Users, BarChart3, Layers, Target, Crosshair, Workflow, GitBranch, Sparkles,
  Play, Pause, Copy, Hash, Tag, ChevronUp, ArrowRight, Power, CircleDot,
  Maximize2, Minimize2, FlaskConical, CheckCheck, XOctagon, CalendarClock, Archive,
  BellRing, Timer, SendHorizontal, Sun, Moon, ArrowUpDown, Lock, FileSpreadsheet, FileType,
  Scale, Construction,
} from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete, seed, ensureWeatherSeed, ensureWarningsSeed, ensureNavigationRisksSeed, ensureNavigationRulesSeed } from "./api";
import { Toaster, toast } from "sonner";
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";
import { NavigationRisksPage } from "./NavigationRisksPage";
import { NavigationRulesPage } from "./NavigationRulesPage";

/* ════�������═���══════════════════════════════════════════════════════
   THEME SYSTEM — Auto Dark/Light based on OS preference
   ══════════════════════════════════════════════════════════════ */

function useSystemTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDark;
}

const ThemeCtx = createContext(true);
const useIsDark = () => useContext(ThemeCtx);

/** Build a themed class set */
function makeTheme(dark: boolean) {
  return {
    // Layout
    pageBg: dark
      ? "linear-gradient(135deg, #060b18 0%, #0a1628 40%, #0d1b2a 100%)"
      : "linear-gradient(135deg, #f0f4f8 0%, #e8eef6 40%, #f5f7fa 100%)",
    sidebarBg: dark
      ? "linear-gradient(180deg, rgba(6,11,24,0.95) 0%, rgba(10,22,40,0.98) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.99) 100%)",
    sidebarBorder: dark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.08)",
    topbarBg: dark ? "rgba(6,11,24,0.7)" : "rgba(255,255,255,0.8)",
    topbarBorder: dark ? "border-white/[0.04]" : "border-gray-200/60",

    // Card/Glass
    cardBg: dark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white border-gray-200/60 shadow-sm",
    cardHover: dark ? "hover:bg-white/[0.05]" : "hover:bg-gray-50",

    // Text
    text1: dark ? "text-white/90" : "text-gray-900",
    text2: dark ? "text-white/70" : "text-gray-700",
    text3: dark ? "text-white/50" : "text-gray-500",
    text4: dark ? "text-white/30" : "text-gray-400",
    text5: dark ? "text-white/20" : "text-gray-300",
    text6: dark ? "text-white/15" : "text-gray-300",
    text7: dark ? "text-white/10" : "text-gray-200",

    // Inputs
    inputBg: dark
      ? "bg-white/[0.04] border-white/[0.08] text-white/80 placeholder-white/20 focus:border-cyan-500/40 focus:bg-white/[0.06]"
      : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:bg-white",

    // Buttons
    btnDefault: dark
      ? "bg-white/[0.05] border border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white/80"
      : "bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-800",
    btnGhost: dark
      ? "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",

    // Badges & chips
    chipBg: dark ? "bg-white/[0.04] border-white/[0.06]" : "bg-gray-100 border-gray-200",
    chipText: dark ? "text-white/30" : "text-gray-500",

    // Table / list
    rowHover: dark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/80",
    divider: dark ? "divide-white/[0.03]" : "divide-gray-100",
    borderB: dark ? "border-white/[0.04]" : "border-gray-100",

    // Modal
    modalBg: dark ? "bg-[#0c1222] border-white/[0.08]" : "bg-white border-gray-200",
    modalOverlay: dark ? "bg-black/60" : "bg-black/30",

    // Sidebar nav
    navActive: dark
      ? { background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,102,255,0.06))", borderLeft: "2px solid #00d4ff", boxShadow: "inset 0 0 20px -10px rgba(0,212,255,0.12)" }
      : { background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(37,99,235,0.05))", borderLeft: "2px solid #3b82f6", boxShadow: "inset 0 0 20px -10px rgba(59,130,246,0.1)" },
    navInactiveBg: dark ? "bg-white/[0.03]" : "bg-gray-100",

    // Ambient glow
    glowCyan: dark ? "rgba(0,212,255,0.03)" : "rgba(59,130,246,0.04)",
    glowBlue: dark ? "rgba(0,102,255,0.024)" : "rgba(37,99,235,0.03)",
    glowPurple: dark ? "rgba(139,92,246,0.016)" : "rgba(139,92,246,0.02)",
    gridOpacity: dark ? "opacity-[0.015]" : "opacity-[0.03]",
    gridColor: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",

    // Charts
    chartGrid: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)",
    chartAxis: dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)",
    tooltipBg: dark ? "bg-[#0c1222]/95 border-white/[0.1]" : "bg-white/95 border-gray-200",
    tooltipLabel: dark ? "text-white/40" : "text-gray-400",
    tooltipValue: dark ? "text-white/80" : "text-gray-800",

    // Status dot
    statusDotBorder: dark ? "border-[#060b18]" : "border-white",

    // Fullscreen bar
    fsBarBg: dark ? "bg-[#0c1222]/90 border-white/[0.08]" : "bg-white/90 border-gray-200",

    // Empty state
    emptyIcon: dark ? "text-white/10" : "text-gray-200",
    emptyText: dark ? "text-white/20" : "text-gray-400",
    emptyHint: dark ? "text-white/15" : "text-gray-300",

    // Accent helpers
    cyanChip: dark ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" : "bg-blue-50 text-blue-600 border-blue-200",
    emeraldChip: dark ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" : "bg-emerald-50 text-emerald-600 border-emerald-200",
    amberChip: dark ? "bg-amber-400/10 text-amber-400 border-amber-400/20" : "bg-amber-50 text-amber-600 border-amber-200",
    purpleChip: dark ? "bg-purple-400/10 text-purple-400 border-purple-400/20" : "bg-purple-50 text-purple-600 border-purple-200",
    roseChip: dark ? "bg-rose-400/10 text-rose-400 border-rose-400/20" : "bg-rose-50 text-rose-600 border-rose-200",

    // Misc
    logoBorder: dark ? "border-2 border-[#060b18]" : "border-2 border-white",
    labelCls: dark ? "text-xs text-white/40" : "text-xs text-gray-500",
    hintCls: dark ? "text-[10px] text-white/20" : "text-[10px] text-gray-400",

    // Active filter button
    filterActive: (color: string) => dark
      ? `bg-${color}-500 text-white`
      : `bg-${color}-500 text-white`,
    filterInactive: dark
      ? "bg-white/[0.04] text-white/30 hover:bg-white/[0.06]"
      : "bg-gray-100 text-gray-500 hover:bg-gray-200",

    // Data source status
    dsConnected: dark ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-emerald-600 bg-emerald-50 border-emerald-200",
    dsDisconnected: dark ? "text-white/30 bg-white/[0.04] border-white/[0.06]" : "text-gray-400 bg-gray-50 border-gray-200",
    dsSyncing: dark ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" : "text-blue-600 bg-blue-50 border-blue-200",
    dsError: dark ? "text-red-400 bg-red-400/10 border-red-400/20" : "text-red-600 bg-red-50 border-red-200",

    // Toggle  
    toggleOn: dark ? "text-cyan-400" : "text-blue-500",
    toggleOff: dark ? "text-white/30" : "text-gray-300",

    // Inner card accents for weather, etc
    weatherCard: dark ? "from-cyan-500/10 to-blue-500/10 border-cyan-500/10" : "from-blue-50 to-sky-50 border-blue-200/60",
    hydroCard: dark ? "from-indigo-500/10 to-purple-500/10 border-indigo-500/10" : "from-indigo-50 to-violet-50 border-indigo-200/60",

    // Inner item bg
    innerBg: dark ? "bg-white/[0.02] border-white/[0.04]" : "bg-gray-50 border-gray-100",
    innerBg2: dark ? "bg-white/[0.04]" : "bg-gray-100",

    // Condition tester
    testTriggered: dark ? "bg-red-400/5 border-red-400/20" : "bg-red-50 border-red-200",
    testSafe: dark ? "bg-emerald-400/5 border-emerald-400/20" : "bg-emerald-50 border-emerald-200",
  };
}

/* ─── Types ─── */
type AgentPage = "overview" | "route-analysis" | "bridge-clearance" | "navigation-risks" | "navigation-rules" | "risk-assessment" | "meteo-hydro" | "nav-warnings";
type DataSourceStatus = "connected" | "disconnected" | "syncing" | "error";

interface DataSource {
  id: string; name: string; type: "api" | "manual" | "import" | "realtime";
  endpoint?: string; status: DataSourceStatus; lastSync?: string;
  autoRefresh: boolean; refreshInterval?: number; description: string;
}

const DEFAULT_RULES = [
  { id: "r1", name: "桥梁通航风险评估", description: "评估船舶通过桥梁时的��航安全风险", category: "结构物", factor: "净空高度/净宽/水流", level: "高", conditions: [{ param: "净空高度", operator: "<", value: "15", unit: "m" }, { param: "净宽", operator: "<", value: "120", unit: "m" }], logic: "OR", action: "发出红色预警，建议等待潮位变化", priority: 1, enabled: true, version: "1.0", updatedAt: "2026-03-20" },
  { id: "r2", name: "渡口横越冲突评估", description: "评估渡口区域船舶横越对航行安全的影响", category: "交通流", factor: "横越频率/航道宽度", level: "中", conditions: [{ param: "横越频率", operator: ">", value: "30", unit: "艘/小时" }, { param: "时段", operator: "=", value: "高峰", unit: "" }], logic: "AND", action: "提示加强了望，控制航速", priority: 2, enabled: true, version: "1.0", updatedAt: "2026-03-20" },
  { id: "r3", name: "商渔密集区评估", description: "评估商渔密集水域的通航密度风险", category: "交通流", factor: "船舶密度/时段", level: "中", conditions: [{ param: "在港船舶", operator: ">", value: "150", unit: "艘" }, { param: "时段", operator: "=", value: "高峰", unit: "" }], logic: "AND", action: "建议VHF值守，限速航行", priority: 3, enabled: true, version: "1.0", updatedAt: "2026-03-20" },
  { id: "r4", name: "气象能见度评估", description: "评估恶劣气象条件对航行安全的影响", category: "气象", factor: "能见度/风力", level: "高", conditions: [{ param: "能见度", operator: "<", value: "1", unit: "km" }, { param: "风力", operator: ">", value: "6", unit: "级" }], logic: "OR", action: "建议暂停航行，就近锚泊", priority: 1, enabled: true, version: "1.0", updatedAt: "2026-03-20" },
  { id: "r5", name: "水位安全评估", description: "评估水位条件对船舶安全吃水的影响", category: "水文", factor: "水位/���水", level: "高", conditions: [{ param: "富余水深", operator: "<", value: "0.5", unit: "m" }], logic: "AND", action: "禁止通航，等待水位上涨", priority: 1, enabled: true, version: "1.2", updatedAt: "2026-03-22" },
  { id: "r6", name: "潮汐窗口评估", description: "评估潮汐变化对航行时间窗口的影响", category: "水文", factor: "潮汐/航行时间", level: "低", conditions: [{ param: "到达时潮汐", operator: "=", value: "落潮低水位", unit: "" }], logic: "AND", action: "建议���整出发时间", priority: 4, enabled: true, version: "1.0", updatedAt: "2026-03-20" },
];

const ELEMENT_TYPES = ["桥梁", "渡口", "取水口", "商渔密集区", "临时锚泊区", "横越水域", "水工水域"];
const WARNING_LEVELS = ["紧急", "管制", "一般", "信息"];
const SKILL_CATEGORIES = ["结构物", "交通流", "气象", "水文", "综合"];
const OPERATORS = ["<", "<=", "=", ">=", ">", "!=", "contains"];

const typeIcons: Record<string, any> = {
  "桥梁": Landmark, "渡口": Ship, "取水口": Droplets,
  "商渔密集区": Anchor, "临时锚泊区": Anchor, "横越水域": Navigation,
  "水工水域": Construction,
};

/* ─── Color Palette (accent colors — same for both themes) ─── */
const C = {
  cyan: "#00d4ff",
  blue: "#0066ff",
  purple: "#8b5cf6",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  rose: "#f43f5e",
};

/* ─── Query History Simulation ─── */
function getQueryStats() {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, "0") + ":00";
    const base = i >= 6 && i <= 20 ? 15 : 3;
    return { hour: h, queries: Math.floor(base + Math.random() * base * 1.5), id: `hour-${i}` };
  });
  const todayTotal = hours.reduce((s, h) => s + h.queries, 0);
  const yesterdayTotal = Math.floor(todayTotal * (0.85 + Math.random() * 0.3));
  const weekData = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((d, i) => ({
    day: d, queries: Math.floor(120 + Math.random() * 180), id: `day-${i}`,
  }));
  const routeHot = [
    { route: "肇庆港→广州港", count: 87, id: "r1" },
    { route: "肇庆港→佛山港", count: 45, id: "r2" },
    { route: "德庆港→广州港", count: 32, id: "r3" },
    { route: "三水港→肇庆港", count: 28, id: "r4" },
    { route: "高要港→广州港", count: 19, id: "r5" },
  ];
  return { hours, todayTotal, yesterdayTotal, weekData, routeHot };
}

/* ═══════════════════════════════════════════════════════���═══
   SHARED UI COMPONENTS — Theme-Aware
   ═══════════════════════════════════════════════════════════ */

function useT() {
  const isDark = useIsDark();
  return useMemo(() => makeTheme(isDark), [isDark]);
}

function Glass({ children, className = "", glow }: { children: React.ReactNode; className?: string; glow?: string }) {
  const T = useT();
  const isDark = useIsDark();
  return (
    <div
      className={`backdrop-blur-xl rounded-2xl border ${T.cardBg} ${className}`}
      style={glow && isDark ? { boxShadow: `0 0 30px -10px ${glow}` } : undefined}
    >
      {children}
    </div>
  );
}

function PageHeader({ icon: Icon, title, subtitle, gradient, actions }: {
  icon: any; title: string; subtitle: string; gradient: string; actions?: React.ReactNode;
}) {
  const T = useT();
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg`}
          style={{ boxShadow: `0 8px 32px -8px rgba(0,212,255,0.3)` }}>
          <Icon size={22} className="text-white" />
        </div>
        <div>
          <h2 className={`text-xl ${T.text1}`}>{title}</h2>
          <p className={`text-sm ${T.text4} mt-0.5`}>{subtitle}</p>
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gradient, trend, glow, sub }: {
  icon: any; label: string; value: string | number; gradient: string; trend?: string; glow?: string; sub?: string;
}) {
  const T = useT();
  const isDark = useIsDark();
  return (
    <Glass className="p-5 relative overflow-hidden group" glow={glow}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04] group-hover:opacity-[0.08] transition-opacity"
        style={{ background: `radial-gradient(circle, ${glow || C.cyan}, transparent)` }} />
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend && (
          <span className={`text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 border ${T.emeraldChip}`}>
            <TrendingUp size={8} /> {trend}
          </span>
        )}
      </div>
      <p className={`text-2xl ${T.text1} mt-1`}>{value}</p>
      <p className={`text-xs ${T.text4} mt-1`}>{label}</p>
      {sub && <p className={`text-[10px] ${T.text5} mt-0.5`}>{sub}</p>}
    </Glass>
  );
}

function SectionTitle({ title, count, icon: Icon, action }: {
  title: string; count?: number; icon?: any; action?: React.ReactNode;
}) {
  const T = useT();
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={14} className={T.text4} />}
        <h3 className={`text-sm ${T.text3}`}>{title}</h3>
        {count !== undefined && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${T.chipBg} ${T.chipText}`}>{count}</span>
        )}
      </div>
      {action}
    </div>
  );
}

function DarkButton({ children, onClick, variant = "default", disabled, className = "", size = "md" }: {
  children: React.ReactNode; onClick?: () => void; variant?: "default" | "primary" | "danger" | "ghost";
  disabled?: boolean; className?: string; size?: "sm" | "md";
}) {
  const T = useT();
  const base = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  const variants: Record<string, string> = {
    default: T.btnDefault,
    primary: `bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20`,
    danger: "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20",
    ghost: T.btnGhost,
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-2 ${base} rounded-xl transition-all disabled:opacity-40 ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function FormModal({ open, title, onClose, children, width = "max-w-lg" }: {
  open: boolean; title: string; onClose: () => void; children: React.ReactNode; width?: string;
}) {
  const T = useT();
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 ${T.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4`}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`${T.modalBg} border rounded-2xl shadow-2xl w-full ${width} max-h-[85vh] overflow-y-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`flex items-center justify-between px-6 py-4 border-b ${T.borderB}`}>
            <h3 className={`text-base ${T.text2}`}>{title}</h3>
            <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${T.btnGhost}`}>
              <X size={16} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  const T = useT();
  return (
    <div>
      <label className={`${T.labelCls} mb-1.5 block`}>{label}{required && <span className="text-cyan-400 ml-0.5">*</span>}</label>
      {children}
      {hint && <p className={`${T.hintCls} mt-1`}>{hint}</p>}
    </div>
  );
}

function useInputCls() {
  const T = useT();
  return `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${T.inputBg}`;
}

function DataSourceCard({ source, onToggle, onConfirm, onEdit, editing }: {
  source: DataSource; onToggle: (id: string) => void;
  onConfirm?: (id: string) => void; onEdit?: (id: string) => void; editing?: boolean;
}) {
  const T = useT();
  const inputCls = useInputCls();
  const [localEndpoint, setLocalEndpoint] = useState(source.endpoint || "");
  const [localInterval, setLocalInterval] = useState(String(source.refreshInterval || ""));

  const statusConfig: Record<DataSourceStatus, { color: string; text: string; icon: any }> = {
    connected: { color: T.dsConnected, text: "已连接", icon: CheckCircle2 },
    disconnected: { color: T.dsDisconnected, text: "未连接", icon: WifiOff },
    syncing: { color: T.dsSyncing, text: "同步中", icon: RefreshCw },
    error: { color: T.dsError, text: "异常", icon: XCircle },
  };
  const typeConfig: Record<string, { icon: any; label: string }> = {
    api: { icon: Globe, label: "API接口" }, manual: { icon: FileText, label: "人工录入" },
    import: { icon: Upload, label: "批量导入" }, realtime: { icon: Radio, label: "实时遥测" },
  };
  const st = statusConfig[source.status];
  const tp = typeConfig[source.type];
  const StIcon = st.icon;

  return (
    <Glass className="p-4">
      <div className="flex items-center gap-4">
        {/* Left: icon + info */}
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${T.chipBg}`}>
          <tp.icon size={18} className={T.text4} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <p className={`text-sm ${T.text2}`}>{source.name}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.color} flex items-center gap-1`}>
              <StIcon size={9} className={source.status === "syncing" ? "animate-spin" : ""} /> {st.text}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md border ${T.chipBg} ${T.chipText}`}>{tp.label}</span>
          </div>
          <p className={`text-xs ${T.text5} line-clamp-1`}>{source.description}</p>
        </div>

        {/* Middle: endpoint + meta */}
        <div className="flex-1 min-w-0 hidden lg:block">
          {editing ? (
            <div className="space-y-1.5">
              {source.endpoint !== undefined && (
                <input value={localEndpoint} onChange={(e) => setLocalEndpoint(e.target.value)}
                  placeholder="接口地址" className={inputCls + " !py-1.5 !text-xs font-mono"} />
              )}
              {source.autoRefresh && (
                <div className="flex items-center gap-2">
                  <input value={localInterval} onChange={(e) => setLocalInterval(e.target.value)}
                    placeholder="刷新间隔(分钟)" className={inputCls + " !py-1.5 !text-xs !w-36"} />
                  <span className={`text-[10px] ${T.text5}`}>分钟/次</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {source.endpoint && (
                <div className={`flex items-center gap-1.5 text-[10px] border rounded-lg px-2.5 py-1.5 font-mono ${T.chipBg} ${T.text5} mb-1`}>
                  <Link2 size={9} /> <span className="truncate">{source.endpoint}</span>
                </div>
              )}
              <div className={`flex items-center gap-3 text-[10px] ${T.text5}`}>
                {source.lastSync && <span className="flex items-center gap-1"><Clock size={9} /> {source.lastSync}</span>}
                {source.refreshInterval && <span className="flex items-center gap-1"><RefreshCw size={9} /> 每{source.refreshInterval}分钟</span>}
              </div>
            </>
          )}
        </div>

        {/* Right: auto-refresh toggle + action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onToggle(source.id)} className="transition-colors" title={source.autoRefresh ? "关闭自动刷新" : "开启自动刷新"}>
            {source.autoRefresh ? <ToggleRight size={22} className={T.toggleOn} /> : <ToggleLeft size={22} className={T.toggleOff} />}
          </button>
          <div className={`w-px h-6 ${T.borderB} border-l`} />
          {editing ? (
            <DarkButton onClick={() => onConfirm?.(source.id)} variant="primary" size="sm">
              <CheckCircle2 size={13} /> 确定
            </DarkButton>
          ) : (
            <DarkButton onClick={() => onEdit?.(source.id)} size="sm">
              <Pencil size={13} /> 修改
            </DarkButton>
          )}
        </div>
      </div>
    </Glass>
  );
}

function DataTable({ items, loading, search, setSearch, onEdit, onDelete, onCreate, renderItem, createLabel }: {
  items: any[]; loading: boolean; search: string; setSearch: (s: string) => void;
  onEdit: (item: any) => void; onDelete: (id: string) => void; onCreate: () => void;
  renderItem: (item: any, idx?: number) => React.ReactNode; createLabel: string;
}) {
  const T = useT();
  const isDark = useIsDark();
  const filtered = search
    ? items.filter((item) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <Glass className="overflow-hidden">
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${T.borderB}`}>
        <div className={`flex-1 flex items-center gap-2 border rounded-xl px-3 py-2 ${T.chipBg}`}>
          <Search size={14} className={T.text5} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索..."
            className={`flex-1 bg-transparent text-sm outline-none ${isDark ? "text-white/70 placeholder-white/20" : "text-gray-700 placeholder-gray-400"}`} />
        </div>
        <DarkButton onClick={onCreate} variant="primary"><Plus size={14} /> {createLabel}</DarkButton>
      </div>
      <div className={T.divider}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-cyan-400/40" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-12 gap-1 ${T.emptyText}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 border ${T.innerBg}`}>
              <Database size={24} className={T.emptyIcon} />
            </div>
            <p className={`text-sm ${T.text4}`}>暂无数��</p>
            <p className={`text-xs ${T.emptyHint} text-center max-w-[220px] leading-relaxed`}>
              收到气象局报文或水文遥测数据后，<br />可由值班员手动录入本系统
            </p>
            <p className={`text-xs ${T.emptyHint} mt-2`}>点击右上角「新增气象」按钮手动录入</p>
          </div>
        ) : (
          filtered.map((item, idx) => (
            <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`flex items-center px-4 py-3 ${T.rowHover} transition-colors group border-b ${T.borderB} last:border-b-0`}>
              <div className="flex-1 min-w-0">{renderItem(item, idx + 1)}</div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${T.chipBg} ${T.text4} flex items-center gap-1 shrink-0`}>
                  <Users size={9} />
                  {item.recorder ? item.recorder : <span className="opacity-40">—</span>}
                </span>
                <button onClick={() => onEdit(item)} className={`p-1.5 hover:bg-cyan-400/10 rounded-lg ${T.text5} hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100`}>
                  <Pencil size={13} />
                </button>
                <button onClick={() => onDelete(item.id)} className={`p-1.5 hover:bg-red-400/10 rounded-lg ${T.text4} hover:text-red-400 transition-colors`}>
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
      {filtered.length > 0 && (
        <div className={`px-4 py-2.5 border-t ${T.borderB} text-xs ${T.text5}`}>
          共 {filtered.length} 条{search && `（筛选自 ${items.length} 条）`}
        </div>
      )}
    </Glass>
  );
}

/* ─── Custom Chart Tooltip ─── */
function ChartTooltip({ active, payload, label }: any) {
  const T = useT();
  if (!active || !payload?.length) return null;
  return (
    <div className={`${T.tooltipBg} border rounded-xl px-3 py-2 shadow-xl backdrop-blur`}>
      <p className={`text-[10px] ${T.tooltipLabel} mb-1`}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className={`text-xs ${T.tooltipValue}`}>{p.name}: <span className="text-cyan-500">{p.value}</span></p>
      ))}
    </div>
  );
}

/* ═══════════════════��═══════════════════════════════════════
   PAGE: 总览 Dashboard — Command Center
   ═══════════════════════════════════════════════════���═══════ */
function OverviewPage({ data, rules, onSeed, seeding, loading, onRefresh, fullscreen, onToggleFullscreen }: {
  data: Record<string, any[]>; rules: any[]; onSeed: () => void; seeding: boolean; loading: boolean; onRefresh: () => void;
  fullscreen?: boolean; onToggleFullscreen?: () => void;
}) {
  const T = useT();
  const isDark = useIsDark();
  const stats = useMemo(() => getQueryStats(), []);
  const totalData = (data.elements?.length || 0) + (data.warnings?.length || 0) +
    (data.weather?.length || 0) + (data.hydro?.length || 0) + (data.routes?.length || 0);
  const activeWarnings = (data.warnings || []).filter((w: any) => w.status === "active").length;

  const nowHour = new Date().getHours();

  const agents = [
    { name: "通航要素", icon: Navigation, gradient: "from-cyan-500 to-blue-600", data: data.elements?.length || 0, label: "要素", status: "online" },
    { name: "风险评估", icon: Shield, gradient: "from-amber-500 to-orange-500", data: rules.length, label: "规则", status: "online" },
    { name: "气象水文", icon: Cloud, gradient: "from-teal-500 to-cyan-600", data: (data.weather?.length || 0) + (data.hydro?.length || 0), label: "站点", status: "online" },
    { name: "航警播报", icon: AlertTriangle, gradient: "from-rose-500 to-red-600", data: data.warnings?.length || 0, label: "警告", status: "online" },
  ];

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    (data.elements || []).forEach((el: any) => { counts[el.type] = (counts[el.type] || 0) + 1; });
    const colors = ["#00d4ff", "#0066ff", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
    return Object.entries(counts).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length], id: `pie-${i}-${name}` }));
  }, [data.elements]);

  const currentWeather = data.weather?.[0];
  const currentHydro = data.hydro?.[0];

  return (
    <div>
      <PageHeader icon={LayoutDashboard} title="指挥中心总览"
        subtitle="七星北导 · 海事端通航风险智能监控平台" gradient="from-cyan-500 to-blue-600"
        actions={
          <>
            <DarkButton onClick={onSeed} disabled={seeding}>
              {seeding ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
              初始化数据
            </DarkButton>
            <DarkButton onClick={onRefresh} disabled={loading} variant="primary">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 刷新全部
            </DarkButton>
            {onToggleFullscreen && (
              <DarkButton onClick={onToggleFullscreen}>
                {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {fullscreen ? "退出大屏" : "投屏模式"}
              </DarkButton>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Users} label="今日查询量" value={stats.todayTotal} gradient="from-cyan-500 to-blue-600"
          trend={`${stats.todayTotal > stats.yesterdayTotal ? "+" : ""}${Math.round((stats.todayTotal / stats.yesterdayTotal - 1) * 100)}%`}
          glow={C.cyan} sub={`昨日 ${stats.yesterdayTotal}`} />
        <StatCard icon={Database} label="知识库总量" value={totalData} gradient="from-blue-500 to-indigo-600" glow={C.blue} />
        <StatCard icon={Shield} label="风险规则" value={rules.filter(r => r.enabled).length + "/" + rules.length} gradient="from-amber-500 to-orange-500" glow={C.amber} sub="已启用/总数" />
        <StatCard icon={AlertTriangle} label="生效航警" value={activeWarnings} gradient="from-rose-500 to-red-600" glow={C.red} />
        <StatCard icon={Cpu} label="智能体状态" value="4/4" gradient="from-emerald-500 to-teal-600" trend="在线" glow={C.green} sub="全部正常运行" />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Glass className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm ${T.text3}`}>今日查询趋势</p>
              <p className={`text-[10px] ${T.text5} mt-0.5`}>船员端「七星北导」使用量（按小时）</p>
            </div>
            <div className={`flex items-center gap-1 text-[10px] ${T.text5}`}>
              <CircleDot size={8} className="text-cyan-400" /> 实时
            </div>
          </div>
          <ResponsiveContainer width="100%" height={fullscreen ? 320 : 200}>
            <AreaChart data={stats.hours}>
              <defs>
                <linearGradient id="queryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.cyan} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.chartGrid} />
              <XAxis dataKey="hour" stroke={T.chartAxis} tick={{ fontSize: 10 }} interval={3} />
              <YAxis stroke={T.chartAxis} tick={{ fontSize: 10 }} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="queries" name="查询量" stroke={C.cyan} fill="url(#queryGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Glass>

        <Glass className="p-5">
          <p className={`text-sm ${T.text3} mb-1`}>本周查询统计</p>
          <p className={`text-[10px] ${T.text5} mb-4`}>近7天使用量分布</p>
          <ResponsiveContainer width="100%" height={fullscreen ? 320 : 200}>
            <BarChart data={stats.weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.chartGrid} />
              <XAxis dataKey="day" stroke={T.chartAxis} tick={{ fontSize: 10 }} />
              <YAxis stroke={T.chartAxis} tick={{ fontSize: 10 }} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="queries" name="查询量" fill={C.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Glass>
      </div>

      {/* ── Middle Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Glass className="p-5">
          <SectionTitle title="智能体矩阵" icon={Cpu} count={4} />
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.name} className={`flex items-center gap-3 p-3 rounded-xl border ${T.innerBg} ${T.cardHover} transition-colors`}>
                <div className={`w-10 h-10 bg-gradient-to-br ${agent.gradient} rounded-xl flex items-center justify-center`}>
                  <agent.icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${T.text2}`}>{agent.name}</p>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className={`text-[10px] ${T.text5}`}>{agent.data} {agent.label}</p>
                </div>
                <Activity size={14} className={T.text7} />
              </div>
            ))}
          </div>
        </Glass>

        <Glass className="p-5">
          <SectionTitle title="实时环境态势" icon={Cloud} />
          {currentWeather ? (
            <div className="space-y-3">
              <div className={`p-4 rounded-xl bg-gradient-to-br border ${T.weatherCard}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Cloud size={16} className="text-cyan-400" />
                  <span className={`text-sm ${T.text3}`}>{currentWeather.area} · 气象</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Thermometer, label: "气温", value: currentWeather.temp },
                    { icon: Wind, label: "风力", value: currentWeather.wind },
                    { icon: Eye, label: "能见度", value: currentWeather.visibility },
                  ].map((m) => (
                    <div key={m.label} className="text-center">
                      <m.icon size={14} className="text-cyan-400/60 mx-auto mb-1" />
                      <p className={`text-xs ${T.text2}`}>{m.value}</p>
                      <p className={`text-[9px] ${T.text5}`}>{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              {currentHydro && (
                <div className={`p-4 rounded-xl bg-gradient-to-br border ${T.hydroCard}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Waves size={16} className="text-indigo-400" />
                    <span className={`text-sm ${T.text3}`}>{currentHydro.station} · 水文</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "水位", value: currentHydro.waterLevel },
                      { label: "流量", value: currentHydro.flow },
                      { label: "潮汐", value: currentHydro.tide?.slice(0, 6) || "-" },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <p className={`text-xs ${T.text2}`}>{m.value}</p>
                        <p className={`text-[9px] ${T.text5}`}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.weather?.length > 1 && (
                <p className={`text-[10px] ${T.text5} text-center`}>
                  + {data.weather.length - 1} 个区域 · {data.hydro?.length || 0} 个水文站
                </p>
              )}
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center py-12 ${T.emptyHint}`}>
              <Cloud size={32} className="mb-2" />
              <p className="text-xs">暂无气象数据</p>
            </div>
          )}
        </Glass>

        <Glass className="p-5">
          <SectionTitle title="热门航线 TOP5" icon={Route} />
          <div className="space-y-2 mb-6">
            {stats.routeHot.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                  i === 0 ? "bg-cyan-400/20 text-cyan-400" : i === 1 ? "bg-blue-400/20 text-blue-400" : i === 2 ? "bg-purple-400/20 text-purple-400" : `${T.innerBg2} ${T.text5}`
                }`}>{i + 1}</span>
                <span className={`flex-1 text-xs ${T.text3} truncate`}>{r.route}</span>
                <span className={`text-xs ${T.text4}`}>{r.count}</span>
                <div className={`w-16 h-1.5 rounded-full overflow-hidden ${T.innerBg2}`}>
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${(r.count / stats.routeHot[0].count) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <SectionTitle title="要素类型分布" icon={Layers} />
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} dataKey="value" stroke="none">
                      {pieData.map((entry) => <Cell key={entry.id} fill={entry.fill} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {pieData.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                    <span className={`${T.text4} flex-1`}>{d.name}</span>
                    <span className={T.text3}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className={`text-xs ${T.text5} text-center py-4`}>暂无要素数据</p>
          )}
        </Glass>
      </div>

      {/* ── Recent Activity ── */}
      <Glass className="p-5">
        <SectionTitle title="系统事件日志" icon={Clock} />
        <div className="space-y-2.5">
          {[
            { time: "刚刚", text: "值班员进入指挥中心总览", color: "bg-cyan-400", icon: Eye },
            { time: "2分钟前", text: "通航要素智能体完成数据同步", color: "bg-blue-400", icon: Navigation },
            { time: "5分钟前", text: "气象水文智能体自动更新天气数据", color: "bg-teal-400", icon: Cloud },
            { time: "10分钟前", text: "航警播报智能体接收新航行警告1条", color: "bg-rose-400", icon: AlertTriangle },
            { time: "15分钟前", text: "风险评估Skill「水位安全评估」版本更新至v1.2", color: "bg-amber-400", icon: Shield },
            { time: "30分钟前", text: "船员「粤肇货2088」��询肇庆→广州航线风险", color: "bg-purple-400", icon: Ship },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 py-2 px-3 rounded-xl ${T.rowHover} transition-colors`}>
              <span className={`text-[10px] ${T.text5} w-16 shrink-0 text-right`}>{item.time}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
              <item.icon size={12} className={T.text5} />
              <span className={`text-xs ${T.text4}`}>{item.text}</span>
            </motion.div>
          ))}
        </div>
      </Glass>
    </div>
  );
}

/* ═══════════════════════════════════��═══════════════════════
   PAGE: 通航要素智能体
   ═══════════════════════════════════════════════════════════ */
function RouteAnalysisPage({ elements, routes, loading, onReload }: {
  elements: any[]; routes: any[]; loading: boolean; onReload: () => void;
}) {
  const T = useT();
  const isDark = useIsDark();
  const inputCls = useInputCls();
  const [tab, setTab] = useState<"elements" | "routes">("elements");
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showImportModal, setShowImportModal] = useState(false);

  const filteredElements = elements.filter((el) => {
    const matchType = typeFilter === "all" || el.type === typeFilter;
    const matchStatus = statusFilter === "all" || el.status === statusFilter;
    const matchSearch = !search || JSON.stringify(el).toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  }).sort((a, b) => {
    // 按公里标排序（从上游到下游，数字越小越上游）
    const kmA = parseFloat(a.km) || 0;
    const kmB = parseFloat(b.km) || 0;
    return kmA - kmB;
  });

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    elements.forEach((el) => { c[el.type] = (c[el.type] || 0) + 1; });
    return c;
  }, [elements]);

  const handleSave = async (formData: any) => {
    try {
      const apiPath = tab === "elements" ? "elements" : "routes";
      if (editItem?.id) { await apiPut(`${apiPath}/${editItem.id}`, formData); toast.success("更新成功"); }
      else { await apiPost(apiPath, formData); toast.success("创建成功"); }
      setEditItem(null); setCreating(false); onReload();
    } catch (e: any) { toast.error("保存失败: " + e.message); }
  };

  const handleDelete = async (id: string) => {
    const apiPath = tab === "elements" ? "elements" : "routes";
    try { await apiDelete(`${apiPath}/${id}`); toast.success("删除成功"); onReload(); }
    catch (e: any) { toast.error("删除失败: " + e.message); }
  };

  return (
    <div>
      <PageHeader icon={Navigation} title="通航要素智能体"
        subtitle="管理通航要素和推荐航路，为航线风险查询提供基础空间数据"
        gradient="from-cyan-500 to-blue-600"
        actions={
          <div className="flex items-center gap-2">
            <DarkButton onClick={onReload} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 刷新
            </DarkButton>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Navigation} label="通航要素总数" value={elements.length} gradient="from-cyan-500 to-blue-600" glow={C.cyan} />
        <StatCard icon={Route} label="推荐航路" value={routes.length} gradient="from-emerald-500 to-teal-600" glow={C.green} />
        <StatCard icon={XCircle} label="受限/关闭" value={elements.filter((e: any) => e.status !== "正常").length} gradient="from-amber-500 to-orange-600" glow={C.amber} />
      </div>

      <div className="flex gap-2 mb-5">
        {([{ key: "elements" as const, label: "通航要素", count: elements.length },
          { key: "routes" as const, label: "推荐航路", count: routes.length }]).map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
              tab === t.key
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                : `${T.btnDefault}`
            }`}>
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20" : T.innerBg2}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "elements" && (
        <>
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            <button onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${typeFilter === "all" ? "bg-cyan-500 text-white" : T.filterInactive}`}>
              全部 ({elements.length})
            </button>
            {ELEMENT_TYPES.map((t) => {
              const Icon = typeIcons[t] || Anchor;
              return (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                    typeFilter === t ? "bg-cyan-500 text-white" : T.filterInactive
                  }`}><Icon size={10} /> {t} ({typeCounts[t] || 0})</button>
              );
            })}
          </div>
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs ${T.text4}`}>状态：</span>
              {["all", "正常", "受限", "关闭"].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all ${
                    statusFilter === s ? (s === "关闭" ? "bg-red-500 text-white" : s === "受限" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white") : T.filterInactive
                  }`}>{s === "all" ? "全部" : s}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "elements" ? (
        <DataTable items={filteredElements} loading={loading} search={search} setSearch={setSearch}
          onEdit={(item) => setEditItem(item)} onDelete={handleDelete}
          onCreate={() => { setEditItem(null); setCreating(true); }} createLabel="新增要素"
          renderItem={(item, idx) => {
            const Icon = typeIcons[item.type] || Anchor;
            const statusColors = { "正常": "bg-emerald-500/10 text-emerald-600", "受限": "bg-amber-500/10 text-amber-600", "关闭": "bg-red-500/10 text-red-600" };
            return (
              <div className="flex items-center gap-3 min-w-0">
                {/* 序号 - 基于公里标排序的唯一编号 */}
                <span className={`text-xs font-mono ${T.text5} shrink-0 w-10 text-center`}>
                  {String(idx).padStart(3, '0')}
                </span>
                <span className={`w-px h-4 bg-current opacity-10 shrink-0`} />
                
                {/* 类型标签 */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border ${T.cyanChip} font-medium`}>
                    <Icon size={10} className="inline mr-1" />{item.type}
                  </span>
                  {item.subType && <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${T.chipBg} ${T.chipText}`}>{item.subType}</span>}
                </div>
                <span className={`w-px h-4 bg-current opacity-10 shrink-0`} />
                
                {/* 名称 */}
                <span className={`text-sm ${T.text2} shrink-0 min-w-[180px]`}>{item.name}</span>
                <span className={`w-px h-4 bg-current opacity-10 shrink-0`} />
                
                {/* 公里标 */}
                <span className={`text-xs ${T.text5} shrink-0 w-20`}>KM {item.km}</span>
                
                {/* 状态 */}
                {item.status && item.status !== "正常" && (
                  <>
                    <span className={`w-px h-4 bg-current opacity-10 shrink-0`} />
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${statusColors[item.status] || ""} shrink-0`}>{item.status}</span>
                  </>
                )}
                
                {/* 备注 */}
                <span className={`text-xs ${T.text5} truncate flex-1 min-w-0`}>{item.note}</span>
                
                {/* 状态备注 */}
                {item.statusNote && <span className={`text-[10px] ${T.text4} shrink-0`}>⚠️ {item.statusNote}</span>}
              </div>
            );
          }}
        />
      ) : (
        <DataTable items={routes} loading={loading} search={search} setSearch={setSearch}
          onEdit={(item) => setEditItem(item)} onDelete={handleDelete}
          onCreate={() => { setEditItem(null); setCreating(true); }} createLabel="新增航路"
          renderItem={(item) => (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center shrink-0">
                <Route size={16} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <span className={`text-sm ${T.text2}`}>{item.name}</span>
                <div className={`flex gap-2 mt-0.5 text-xs ${T.text5}`}>
                  <span>{item.origin} → {item.destination}</span>
                  {item.distance && <span>· {item.distance}</span>}
                </div>
              </div>
            </div>
          )}
        />
      )}

      <FormModal open={creating || !!editItem}
        title={tab === "elements" ? (editItem?.id ? "编辑通航要素" : "新增通航要素") : (editItem?.id ? "编辑推荐航路" : "新增推荐航路")}
        onClose={() => { setCreating(false); setEditItem(null); }}>
        {tab === "elements"
          ? <ElementFormInner item={editItem} onSave={handleSave} onCancel={() => { setCreating(false); setEditItem(null); }} />
          : <RouteFormInner item={editItem} onSave={handleSave} onCancel={() => { setCreating(false); setEditItem(null); }} />
        }
      </FormModal>

      {/* 批量导入弹窗 */}
      <FormModal open={showImportModal} title="批量导入通航要素" width="max-w-3xl"
        onClose={() => setShowImportModal(false)}>
        <ImportModalContent onClose={() => setShowImportModal(false)} onSuccess={onReload} />
      </FormModal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT: 批量导入组件
   ═══════════════════════════════════════════════════════════ */
function ImportModalContent({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const T = useT();
  const isDark = useIsDark();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 配置 PDF.js worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
  }, []);

  // 下载Excel模板
  const downloadTemplate = () => {
    const templateData = [
      {
        '名称': '封开长���综合码头',
        '类型': '码头',
        '子类型': '散货',
        '公里标': 'KM 268',
        '注意事项': '主要货物类型：砂石',
        '风险等级': '低',
        '状态': '正常',
        '生效日期': '2024-01-01',
        '纬度': 23.26083,
        '经度': 111.57750
      },
      {
        '名称': '德庆县石井水泥厂码头',
        '类型': '码头',
        '子类型': '散货',
        '公里标': 'KM 305',
        '注意事项': '主要货物类型：水泥',
        '风险等级': '中',
        '状态': '正常',
        '生效日期': '2024-01-01',
        '纬度': 23.08278,
        '经度': 112.15222
      },
      {
        '名称': '肇庆港务有限公司三榕港码头',
        '类型': '码头',
        '子类型': '集装箱、散货',
        '公里标': 'KM 323',
        '注意事项': '主要货物类型：集装箱、散货',
        '风险等级': '高',
        '状态': '正常',
        '生效日期': '2024-01-01',
        '纬度': 23.58361,
        '经度': 112.39694
      },
      {
        '名称': '料塘渡口',
        '类型': '渡口',
        '子类型': '',
        '公里标': 'KM 270',
        '注意事项': '位置：封开县江川镇料塘村；航线：料塘渡口—江口渡口',
        '风险等级': '低',
        '状态': '正常',
        '生效日期': '2024-01-01',
        '纬度': 23.25000,
        '经度': 111.60000
      },
      {
        '名称': '江口渡口',
        '类型': '渡口',
        '子类型': '',
        '公里标': 'KM 275',
        '注意事项': '位置：封开县江川镇翠星路科；航线：江口渡口—新兴、料塘、豆腐坊渡口',
        '风险等级': '低',
        '状态': '正常',
        '生效日期': '2024-01-01',
        '纬度': 23.24500,
        '经度': 111.65000
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '通航要素模板');
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 25 }, // 名称
      { wch: 10 }, // 类型
      { wch: 15 }, // 子类型
      { wch: 12 }, // 公里标
      { wch: 50 }, // 注意事项
      { wch: 10 }, // 风险等级
      { wch: 10 }, // 状态
      { wch: 12 }, // 生效日期
      { wch: 12 }, // 纬度
      { wch: 12 }, // 经度
    ];

    XLSX.writeFile(wb, '肇庆辖区通航要素导入模板.xlsx');
    toast.success('模板已下载');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setError("");
    setParsedData([]);
    
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const validExts = ['xlsx', 'xls', 'csv', 'doc', 'docx', 'pdf'];
    
    if (!ext || !validExts.includes(ext)) {
      setError("不支持的文件格式，请上传 Excel、Word 或 PDF 文件");
      return;
    }
    
    setFile(selectedFile);
  };

  const parseExcel = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          // 转换为标准格式 - 支持多种字段名称变体
          const formatted = jsonData.map((row: any) => {
            // 提取名称
            const name = row['名称'] || row['要素名称'] || row['渡口名称'] || row['码头名称'] || row['name'] || '';
            
            // 提取类型（码头/渡口等）
            let type = row['类型'] || row['type'] || row['码头类型'] || '';
            if (!type && (row['码头类别'] || row['散货'] || row['集装箱'])) {
              type = '码头';
            }
            if (!type && (row['渡口位置'] || row['通运航线'])) {
              type = '渡口';
            }
            if (!type) type = '其他';
            
            // 提取子类型
            const subType = row['子类型'] || row['subType'] || row['码头类别'] || row['主要货物类型'] || '';
            
            // 提取公里标
            const km = row['公里标'] || row['km'] || row['KM'] || '';
            
            // 提取坐标 - 支持度分秒格式解析
            let lat = 0, lng = 0;
            const coordStr = row['坐标'] || row['位置'] || '';
            if (coordStr) {
              // 尝试解析类似 "111°34'39" E 23°15'39"N" 格式
              const match = coordStr.match(/(\d+)[°\s]+(\d+)['\s]+(\d+).*?[EW].*?(\d+)[°\s]+(\d+)['\s]+(\d+)/);
              if (match) {
                lng = parseFloat(match[1]) + parseFloat(match[2])/60 + parseFloat(match[3])/3600;
                lat = parseFloat(match[4]) + parseFloat(match[5])/60 + parseFloat(match[6])/3600;
              }
            }
            if (!lat) lat = parseFloat(row['纬度'] || row['lat'] || 0);
            if (!lng) lng = parseFloat(row['经度'] || row['lng'] || row['lon'] || 0);
            
            // 提取注意事项/备注
            let note = row['注意事项'] || row['备注'] || row['note'] || '';
            if (row['渡口位置']) note += (note ? '；' : '') + '位置：' + row['渡口位置'];
            if (row['通运航线']) note += (note ? '；' : '') + '航线：' + row['通运航线'];
            if (row['主要货物类型']) note += (note ? '；' : '') + '货物：' + row['主要货物类型'];
            
            // 风险等级判断
            let riskLevel = row['风险等级'] || row['riskLevel'] || '中';
            if (type === '码头' && (subType.includes('集装箱') || subType.includes('危险品'))) {
              riskLevel = '高';
            }
            
            return {
              name,
              type,
              subType,
              km,
              note,
              riskLevel,
              status: row['状态'] || row['status'] || '正常',
              validFrom: row['生效日期'] || row['validFrom'] || new Date().toISOString().split('T')[0],
              coordinates: { lat, lng }
            };
          }).filter(item => item.name); // 过滤掉没有名称的空行
          
          resolve(formatted);
        } catch (err: any) {
          reject(new Error('Excel 解析失败：' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsBinaryString(file);
    });
  };

  const parseWord = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;
          
          // 简单的文本解析逻辑：按行分割，尝试提取结构化信息
          const lines = text.split('\n').filter(line => line.trim());
          const elements: any[] = [];
          
          let currentElement: any = null;
          for (const line of lines) {
            // 匹配包含"名称"、"类型"等关键词的行
            if (line.includes('名称：') || line.includes('要素：')) {
              if (currentElement) elements.push(currentElement);
              currentElement = {
                name: line.split('：')[1]?.trim() || '',
                type: '其他',
                riskLevel: '中',
                status: '正常',
                validFrom: new Date().toISOString().split('T')[0],
                coordinates: { lat: 0, lng: 0 }
              };
            } else if (currentElement) {
              if (line.includes('类型：')) currentElement.type = line.split('：')[1]?.trim() || '其他';
              if (line.includes('公里标：')) currentElement.km = line.split('：')[1]?.trim() || '';
              if (line.includes('注意事项：') || line.includes('备注：')) {
                currentElement.note = line.split('：')[1]?.trim() || '';
              }
            }
          }
          if (currentElement) elements.push(currentElement);
          
          if (elements.length === 0) {
            reject(new Error('Word 文档中未找到有效的通航要素数据。请确保文档包含"名称："等标记'));
          } else {
            resolve(elements);
          }
        } catch (err: any) {
          reject(new Error('Word 解析失败：' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parsePDF = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          
          // 提取所有页面的文本
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }
          
          // 解析文本（与Word解���类似）
          const lines = fullText.split('\n').filter(line => line.trim());
          const elements: any[] = [];
          
          let currentElement: any = null;
          for (const line of lines) {
            if (line.includes('名称：') || line.includes('要素：') || line.includes('名称:') || line.includes('要素:')) {
              if (currentElement) elements.push(currentElement);
              const namePart = line.split(/[：:]/)[1]?.trim() || '';
              currentElement = {
                name: namePart,
                type: '其他',
                riskLevel: '中',
                status: '正常',
                validFrom: new Date().toISOString().split('T')[0],
                coordinates: { lat: 0, lng: 0 }
              };
            } else if (currentElement) {
              if (line.includes('类型：') || line.includes('类型:')) {
                currentElement.type = line.split(/[：:]/)[1]?.trim() || '其他';
              }
              if (line.includes('公里标：') || line.includes('公里标:')) {
                currentElement.km = line.split(/[：:]/)[1]?.trim() || '';
              }
              if (line.includes('注意事项：') || line.includes('备注：') || line.includes('注意事项:') || line.includes('备注:')) {
                currentElement.note = line.split(/[：:]/)[1]?.trim() || '';
              }
            }
          }
          if (currentElement) elements.push(currentElement);
          
          if (elements.length === 0) {
            reject(new Error('PDF 中未找到有效的通航要素数据。请确保文档包含"名称："等标记'));
          } else {
            resolve(elements);
          }
        } catch (err: any) {
          reject(new Error('PDF 解析失败：' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleParse = async () => {
    if (!file) return;
    
    setParsing(true);
    setError("");
    
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let data: any[] = [];
      
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        data = await parseExcel(file);
      } else if (ext === 'docx' || ext === 'doc') {
        data = await parseWord(file);
      } else if (ext === 'pdf') {
        data = await parsePDF(file);
      }
      
      if (data.length === 0) {
        throw new Error('未能从文件中提取到有效数据');
      }
      
      setParsedData(data);
      toast.success(`成功解析 ${data.length} 条数据`);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    
    try {
      // 批量创建通航要素
      for (const item of parsedData) {
        await apiPost('elements', item);
      }
      
      toast.success(`成功导入 ${parsedData.length} 条通航要素`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('导入失败：' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* 说明和模板下载 */}
      <div className={`p-4 rounded-xl border ${isDark ? "bg-cyan-400/5 border-cyan-400/20" : "bg-cyan-50 border-cyan-200"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet size={16} className="text-cyan-400" />
              <span className={`text-sm font-medium ${T.text2}`}>批量导入说明</span>
            </div>
            <ul className={`text-xs ${T.text4} space-y-1 ml-6 list-disc`}>
              <li>支持 Excel (.xlsx, .xls, .csv)、Word (.docx, .doc)、PDF (.pdf) 格式</li>
              <li>Excel格式：需包含"名称"、"类型"、"公里标"等字段（中英文均可）</li>
              <li>Word/PDF格式：需使用"名称："、"类型："等标记分隔数据</li>
              <li>建议下载模板填写，确保字段格式正确</li>
            </ul>
          </div>
          <DarkButton onClick={downloadTemplate} size="sm" variant="primary">
            <FileSpreadsheet size={14} /> 下载模板
          </DarkButton>
        </div>
      </div>

      {/* 文件上传区域 */}
      {!file && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
            dragActive
              ? isDark ? "border-cyan-400 bg-cyan-400/10" : "border-cyan-500 bg-cyan-50"
              : isDark ? "border-gray-700 hover:border-cyan-400/50" : "border-gray-300 hover:border-cyan-400"
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? "bg-cyan-400/10" : "bg-cyan-50"}`}>
              <Upload size={32} className="text-cyan-400" />
            </div>
            <div className="text-center">
              <p className={`text-sm ${T.text2} mb-1`}>拖拽文件到此处，或点击选择文件</p>
              <p className={`text-xs ${T.text5}`}>支持 Excel (.xlsx, .xls, .csv)、Word (.docx, .doc)、PDF (.pdf)</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.doc,.docx,.pdf"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
        </div>
      )}

      {/* 已选择文件 */}
      {file && !parsedData.length && (
        <Glass className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? "bg-cyan-400/10" : "bg-cyan-50"}`}>
              {file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv') ? (
                <FileSpreadsheet size={20} className="text-cyan-400" />
              ) : file.name.endsWith('.pdf') ? (
                <FileText size={20} className="text-red-400" />
              ) : (
                <FileType size={20} className="text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${T.text2} truncate`}>{file.name}</p>
              <p className={`text-xs ${T.text5}`}>{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className={`p-2 rounded-lg transition-colors ${T.btnGhost}`}
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <DarkButton
              onClick={handleParse}
              disabled={parsing}
              variant="primary"
              className="flex-1 justify-center"
            >
              {parsing ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              {parsing ? '解析中...' : '开始解析'}
            </DarkButton>
            <DarkButton onClick={() => setFile(null)}>取消</DarkButton>
          </div>
        </Glass>
      )}

      {/* 错误提示 */}
      {error && (
        <div className={`p-3 rounded-xl border ${isDark ? "bg-red-400/10 border-red-400/20" : "bg-red-50 border-red-200"}`}>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 数据预览 */}
      {parsedData.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className={`text-sm ${T.text2}`}>
              解析成功，共 <span className="text-cyan-400 font-medium">{parsedData.length}</span> 条数据
            </p>
            <DarkButton onClick={() => { setFile(null); setParsedData([]); }} size="sm">
              重新上传
            </DarkButton>
          </div>
          
          <div className={`border rounded-xl overflow-hidden ${T.chipBg}`}>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className={`sticky top-0 ${isDark ? "bg-gray-800/80" : "bg-gray-100/80"} backdrop-blur-sm`}>
                  <tr className={T.text4}>
                    <th className="text-left p-2 font-medium">名称</th>
                    <th className="text-left p-2 font-medium">类型</th>
                    <th className="text-left p-2 font-medium">公里标</th>
                    <th className="text-left p-2 font-medium">风险</th>
                    <th className="text-left p-2 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody className={T.text3}>
                  {parsedData.map((item, idx) => (
                    <tr key={idx} className={`border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                      <td className="p-2">{item.name || '-'}</td>
                      <td className="p-2">{item.type || '-'}</td>
                      <td className="p-2">{item.km || '-'}</td>
                      <td className="p-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          item.riskLevel === '高' ? 'bg-red-500/20 text-red-400' :
                          item.riskLevel === '中' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {item.riskLevel}
                        </span>
                      </td>
                      <td className="p-2">{item.status || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <DarkButton onClick={handleImport} variant="primary" className="flex-1 justify-center">
              <CheckCircle2 size={14} /> 确认导入 ({parsedData.length} 条)
            </DarkButton>
            <DarkButton onClick={onClose}>取消</DarkButton>
          </div>
        </div>
      )}
    </div>
  );
}

function ElementFormInner({ item, onSave, onCancel }: { item?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const T = useT();
  const inputCls = useInputCls();
  const [form, setForm] = useState(item || { 
    name: "", type: "桥梁", subType: "", km: "", note: "", params: {},
    riskLevel: "中", status: "正常", statusNote: "",
    validFrom: new Date().toISOString().split('T')[0], validUntil: "",
    coordinates: { lat: 0, lng: 0 }
  });
  const [pk, setPk] = useState(""); const [pv, setPv] = useState("");
  const addParam = () => { if (!pk.trim()) return; setForm({ ...form, params: { ...form.params, [pk]: pv } }); setPk(""); setPv(""); };
  const rmParam = (k: string) => { const p = { ...form.params }; delete p[k]; setForm({ ...form, params: p }); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="名称" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
        <Field label="类型">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls + " appearance-none"}>
            {ELEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="子类型"><input value={form.subType} onChange={(e) => setForm({ ...form, subType: e.target.value })} className={inputCls} /></Field>
        <Field label="公里标"><input value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} className={inputCls} placeholder="218.5" /></Field>
        <Field label="状态">
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls + " appearance-none"}>
            <option value="正常">正常</option>
            <option value="受限">受限</option>
            <option value="关闭">关闭</option>
          </select>
        </Field>
      </div>
      <Field label="注意事项"><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} className={inputCls + " resize-none"} /></Field>
      {(form.status === "受限" || form.status === "关闭") && (
        <Field label="状态说明"><input value={form.statusNote || ""} onChange={(e) => setForm({ ...form, statusNote: e.target.value })} className={inputCls} placeholder="说明受限/关闭原因" /></Field>
      )}
      
      {/* 桥梁专项字段 */}
      {form.type === "桥梁" && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center">
              <Gauge size={12} className="text-blue-500" />
            </div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">桥梁净空参数</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="基准水位（米）">
              <input 
                type="number" 
                step="0.1" 
                value={parseFloat(form.params?.["基准水位"]?.replace("m", "") || "3.8")} 
                onChange={(e) => setForm({ ...form, params: { ...form.params, "基准水位": e.target.value + "m" } })} 
                className={inputCls} 
                placeholder="3.8" 
              />
            </Field>
            <Field label="关联水文站">
              <select 
                value={form.params?.["关联水文站"] || "hy_1"} 
                onChange={(e) => setForm({ ...form, params: { ...form.params, "关联水文站": e.target.value } })} 
                className={inputCls + " appearance-none"}
              >
                <option value="hy_1">高要站</option>
                <option value="hy_2">三水站（马口）</option>
                <option value="hy_3">甘竹溪站</option>
                <option value="hy_4">天河站（广州）</option>
              </select>
            </Field>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        <Field label="生效日期"><input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className={inputCls} /></Field>
        <Field label="失效日期"><input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className={inputCls} placeholder="留空表示长期有效" /></Field>
        <Field label="纬度"><input type="number" step="0.0001" value={form.coordinates?.lat || 0} onChange={(e) => setForm({ ...form, coordinates: { ...form.coordinates, lat: parseFloat(e.target.value) } })} className={inputCls} placeholder="23.0458" /></Field>
        <Field label="经度"><input type="number" step="0.0001" value={form.coordinates?.lng || 0} onChange={(e) => setForm({ ...form, coordinates: { ...form.coordinates, lng: parseFloat(e.target.value) } })} className={inputCls} placeholder="112.4625" /></Field>
      </div>
      <Field label="技术参数">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {Object.entries(form.params || {}).map(([k, v]) => (
            <span key={k} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${T.cyanChip}`}>
              {k}: {v as string}
              <button onClick={() => rmParam(k)} className="hover:text-red-400"><X size={10} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={pk} onChange={(e) => setPk(e.target.value)} placeholder="参数名" className={inputCls} />
          <input value={pv} onChange={(e) => setPv(e.target.value)} placeholder="参数值" className={inputCls} />
          <DarkButton onClick={addParam} size="sm">添加</DarkButton>
        </div>
      </Field>
      <div className="flex gap-2 pt-2">
        <DarkButton onClick={() => onSave(form)} variant="primary" className="flex-1 justify-center"><Save size={14} /> 保存</DarkButton>
        <DarkButton onClick={onCancel}>取消</DarkButton>
      </div>
    </div>
  );
}

function RouteFormInner({ item, onSave, onCancel }: { item?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const inputCls = useInputCls();
  const [form, setForm] = useState(item || { name: "", origin: "", destination: "", distance: "", time: "", status: "active" });
  return (
    <div className="space-y-4">
      <Field label="航路名称" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="始发港" required><input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} className={inputCls} /></Field>
        <Field label="目的港" required><input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className={inputCls} /></Field>
        <Field label="航程"><input value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} className={inputCls} placeholder="约110公里" /></Field>
        <Field label="航时"><input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputCls} placeholder="约6-8小时" /></Field>
      </div>
      <div className="flex gap-2 pt-2">
        <DarkButton onClick={() => onSave(form)} variant="primary" className="flex-1 justify-center"><Save size={14} /> 保存</DarkButton>
        <DarkButton onClick={onCancel}>取消</DarkButton>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════���════════════��════════
   PAGE: 风险评估智能体 — Skills Creator
   ═══════════════════════════════════════════════════════════ */
function RiskAssessmentPage({ rules, setRules, loading, onReload }: {
  rules: any[]; setRules: (r: any[]) => void; loading: boolean; onReload: () => void;
}) {
  const T = useT();
  const isDark = useIsDark();
  const [editItem, setEditItem] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const handleSave = (formData: any) => {
    if (editItem?.id) {
      setRules(rules.map((r) => r.id === editItem.id ? { ...formData, id: editItem.id, updatedAt: new Date().toISOString().slice(0, 10) } : r));
      toast.success("Skill 更新成功");
    } else {
      const id = "r" + Date.now();
      setRules([...rules, { ...formData, id, updatedAt: new Date().toISOString().slice(0, 10) }]);
      toast.success("Skill 创建成功");
    }
    setEditItem(null); setCreating(false);
  };

  const handleDelete = (id: string) => { setRules(rules.filter((r) => r.id !== id)); toast.success("已删除"); };
  const handleToggle = (rule: any) => {
    setRules(rules.map((r) => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
    toast.success(rule.enabled ? "已禁用" : "已启用");
  };
  const handleDuplicate = (rule: any) => {
    const newRule = { ...rule, id: "r" + Date.now(), name: rule.name + " (副本)", updatedAt: new Date().toISOString().slice(0, 10) };
    setRules([...rules, newRule]);
    toast.success("已复制");
  };

  const levelColors: Record<string, { bg: string; text: string; border: string }> = {
    "高": { bg: isDark ? "bg-red-400/10" : "bg-red-50", text: "text-red-400", border: isDark ? "border-red-400/20" : "border-red-200" },
    "中": { bg: isDark ? "bg-amber-400/10" : "bg-amber-50", text: "text-amber-500", border: isDark ? "border-amber-400/20" : "border-amber-200" },
    "低": { bg: isDark ? "bg-blue-400/10" : "bg-blue-50", text: "text-blue-400", border: isDark ? "border-blue-400/20" : "border-blue-200" },
  };

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    rules.forEach((r) => { c[r.category || "未分类"] = (c[r.category || "未分类"] || 0) + 1; });
    return c;
  }, [rules]);

  const filtered = rules.filter((r) => {
    const matchCat = categoryFilter === "all" || r.category === categoryFilter;
    const matchSearch = !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const enabledCount = rules.filter((r) => r.enabled).length;
  const highCount = rules.filter((r) => r.level === "高").length;

  return (
    <div>
      <PageHeader icon={Shield} title="风险评估智能体"
        subtitle="Skills Creator · 配置和管理风险评估技能，驱动智能化的航行风险判定"
        gradient="from-amber-500 to-orange-500"
        actions={<DarkButton onClick={onReload} disabled={loading}><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 刷新</DarkButton>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Sparkles} label="Skills 总数" value={rules.length} gradient="from-amber-500 to-orange-500" glow={C.amber} />
        <StatCard icon={Power} label="已激活" value={enabledCount + "/" + rules.length} gradient="from-emerald-500 to-teal-600" glow={C.green} />
        <StatCard icon={Target} label="高优先级" value={highCount} gradient="from-rose-500 to-red-600" glow={C.red} />
        <StatCard icon={Tag} label="分类" value={Object.keys(categoryCounts).length} gradient="from-purple-500 to-indigo-600" glow={C.purple} />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1.5 flex-1 overflow-x-auto pb-1">
          <button onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${categoryFilter === "all" ? "bg-amber-500 text-white" : T.filterInactive}`}>
            全部 ({rules.length})
          </button>
          {SKILL_CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                categoryFilter === cat ? "bg-amber-500 text-white" : T.filterInactive
              }`}>{cat} ({categoryCounts[cat] || 0})</button>
          ))}
        </div>
        <DarkButton onClick={() => { setEditItem(null); setCreating(true); }} variant="primary">
          <Sparkles size={14} /> 创建 Skill
        </DarkButton>
      </div>

      <div className="mb-4">
        <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 max-w-md ${T.chipBg}`}>
          <Search size={14} className={T.text5} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索 Skill..."
            className={`flex-1 bg-transparent text-sm outline-none ${isDark ? "text-white/70 placeholder-white/20" : "text-gray-700 placeholder-gray-400"}`} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-amber-400/40" /></div>
      ) : filtered.length === 0 ? (
        <Glass className="p-16 flex flex-col items-center justify-center">
          <Sparkles size={40} className={T.emptyIcon + " mb-3"} />
          <p className={`text-sm ${T.emptyText}`}>暂无 Skill</p>
          <p className={`text-xs ${T.emptyHint} mt-1`}>点击「创建 Skill」开始构建风险评估能力</p>
        </Glass>
      ) : (
        <div className="space-y-3">
          {filtered.map((rule, idx) => {
            const lc = levelColors[rule.level] || levelColors["中"];
            return (
              <motion.div key={rule.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                <Glass className={`p-5 transition-all group`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl ${lc.bg} border ${lc.border} flex items-center justify-center shrink-0`}>
                      <Shield size={18} className={lc.text} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-sm ${T.text1}`}>{rule.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border ${lc.bg} ${lc.text} ${lc.border}`}>{rule.level}风险</span>
                        {rule.category && <span className={`text-[10px] px-2 py-0.5 rounded-md border ${T.chipBg} ${T.chipText}`}>{rule.category}</span>}
                        {rule.version && <span className={`text-[10px] ${T.text6}`}>v{rule.version}</span>}
                        <button onClick={() => handleToggle(rule)}
                          className={`text-[10px] px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                            rule.enabled ? T.emeraldChip + " border"
                              : `${T.chipBg} ${T.chipText} border`
                          }`}>
                          {rule.enabled ? "● 已激活" : "○ 已禁用"}
                        </button>
                      </div>

                      {rule.description && <p className={`text-xs ${T.text5} mb-3`}>{rule.description}</p>}

                      <div className="flex flex-wrap gap-2 mb-3">
                        {(rule.conditions || []).map((cond: any, ci: number) => (
                          <div key={ci} className="flex items-center gap-1.5">
                            {ci > 0 && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${T.purpleChip}`}>
                                {rule.logic || "AND"}
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 text-[11px] border rounded-lg px-2.5 py-1 ${T.chipBg} ${T.text3}`}>
                              <Crosshair size={9} className="text-cyan-400/60" />
                              <span className={T.text2}>{cond.param}</span>
                              <span className="text-amber-400">{cond.operator}</span>
                              <span className="text-cyan-500">{cond.value}</span>
                              {cond.unit && <span className={T.text5}>{cond.unit}</span>}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className={`flex items-start gap-2 p-2.5 rounded-xl border ${T.innerBg}`}>
                        <ArrowRight size={12} className="text-emerald-400/60 mt-0.5 shrink-0" />
                        <span className={`text-xs ${T.text4}`}>{rule.action}</span>
                      </div>

                      <div className={`flex items-center gap-3 mt-2 text-[10px] ${T.text6}`}>
                        {rule.priority && <span>优先级 P{rule.priority}</span>}
                        {rule.updatedAt && <span>更新于 {rule.updatedAt}</span>}
                        <span>因子: {rule.factor}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => setEditItem(rule)} className={`p-2 hover:bg-cyan-400/10 rounded-lg ${T.text6} hover:text-cyan-400 transition-colors`} title="编辑 & 测试">
                        <FlaskConical size={13} />
                      </button>
                      <button onClick={() => handleDuplicate(rule)} className={`p-2 rounded-lg ${T.text6} ${T.btnGhost} transition-colors`} title="复制">
                        <Copy size={13} />
                      </button>
                      <button onClick={() => setEditItem(rule)} className={`p-2 hover:bg-cyan-400/10 rounded-lg ${T.text6} hover:text-cyan-400 transition-colors`} title="编��">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(rule.id)} className={`p-2 hover:bg-red-400/10 rounded-lg ${T.text6} hover:text-red-400 transition-colors`} title="删除">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </Glass>
              </motion.div>
            );
          })}
        </div>
      )}

      <FormModal open={creating || !!editItem}
        title={editItem?.id ? "编辑 Skill" : "创建新 Skill"}
        onClose={() => { setCreating(false); setEditItem(null); }}
        width="max-w-2xl">
        <SkillFormInner item={editItem} onSave={handleSave} onCancel={() => { setCreating(false); setEditItem(null); }} />
      </FormModal>
    </div>
  );
}

/* ─── Skill Creator Form ─── */
function SkillFormInner({ item, onSave, onCancel }: { item?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const T = useT();
  const inputCls = useInputCls();
  const [form, setForm] = useState(item || {
    name: "", description: "", category: "结构物", factor: "", level: "中",
    conditions: [{ param: "", operator: "<", value: "", unit: "" }],
    logic: "AND", action: "", priority: 2, enabled: true, version: "1.0",
  });

  const addCondition = () => setForm({ ...form, conditions: [...(form.conditions || []), { param: "", operator: "<", value: "", unit: "" }] });
  const removeCondition = (i: number) => setForm({ ...form, conditions: form.conditions.filter((_: any, idx: number) => idx !== i) });
  const updateCondition = (i: number, field: string, val: string) => {
    const conditions = [...form.conditions];
    conditions[i] = { ...conditions[i], [field]: val };
    setForm({ ...form, conditions });
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${T.cyanChip}`}>
            <Hash size={12} />
          </div>
          <span className={`text-sm ${T.text3}`}>基本信息</span>
        </div>
        <div className="space-y-3 pl-8">
          <Field label="Skill 名称" required hint="简洁描述该技能的评估对象">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="如: 桥梁通航风险评估" />
          </Field>
          <Field label="描述" hint="详细说明该 Skill 的评估逻辑和适用场景">
            <textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls + " resize-none"} placeholder="评估船舶通过桥梁时的通航安全风险..." />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="分类">
              <select value={form.category || "结构物"} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls + " appearance-none"}>
                {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="风险等级">
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputCls + " appearance-none"}>
                <option value="高">高</option><option value="中">中</option><option value="低">低</option>
              </select>
            </Field>
            <Field label="优先级">
              <select value={form.priority || 2} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className={inputCls + " appearance-none"}>
                {[1, 2, 3, 4, 5].map((p) => <option key={p} value={p}>P{p}</option>)}
              </select>
            </Field>
          </div>
          <Field label="评估因子" required hint="该 Skill 关注的核心参数">
            <input value={form.factor} onChange={(e) => setForm({ ...form, factor: e.target.value })} className={inputCls} placeholder="如: 净空高度/净宽/水流" />
          </Field>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${T.amberChip}`}>
            <Crosshair size={12} />
          </div>
          <span className={`text-sm ${T.text3}`}>触发条件</span>
          <span className={`text-[10px] ${T.text5} ml-auto`}>条件逻辑：</span>
          <div className="flex gap-1">
            {["AND", "OR"].map((l) => (
              <button key={l} onClick={() => setForm({ ...form, logic: l })}
                className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                  form.logic === l ? T.purpleChip + " border" : `${T.chipBg} ${T.chipText} border`
                }`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2 pl-8">
          {(form.conditions || []).map((cond: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${T.purpleChip}`}>{form.logic}</span>}
              {i === 0 && <span className={`text-[9px] ${T.text6} px-1.5 py-0.5 shrink-0`}>IF</span>}
              <input value={cond.param} onChange={(e) => updateCondition(i, "param", e.target.value)} placeholder="参数" className={inputCls + " !py-2"} />
              <select value={cond.operator} onChange={(e) => updateCondition(i, "operator", e.target.value)} className={inputCls + " !py-2 !w-20 shrink-0 appearance-none"}>
                {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
              </select>
              <input value={cond.value} onChange={(e) => updateCondition(i, "value", e.target.value)} placeholder="值" className={inputCls + " !py-2 !w-24 shrink-0"} />
              <input value={cond.unit || ""} onChange={(e) => updateCondition(i, "unit", e.target.value)} placeholder="单位" className={inputCls + " !py-2 !w-16 shrink-0"} />
              {form.conditions.length > 1 && (
                <button onClick={() => removeCondition(i)} className={`p-1.5 hover:bg-red-400/10 rounded-lg ${T.text6} hover:text-red-400 transition-colors shrink-0`}>
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addCondition} className="flex items-center gap-1.5 text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors py-1">
            <Plus size={12} /> 添加条件
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${T.emeraldChip}`}>
            <ArrowRight size={12} />
          </div>
          <span className={`text-sm ${T.text3}`}>处置输出</span>
        </div>
        <div className="pl-8">
          <Field label="处置建议" required hint="当条件触发时，系统应给出的操作建议">
            <textarea value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} rows={2} className={inputCls + " resize-none"} placeholder="如: 发出红色预警，建议等待潮位变化" />
          </Field>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${T.chipBg}`}>
            <Settings size={12} className={T.text4} />
          </div>
          <span className={`text-sm ${T.text3}`}>版本与状态</span>
        </div>
        <div className="grid grid-cols-2 gap-3 pl-8">
          <Field label="版本号">
            <input value={form.version || "1.0"} onChange={(e) => setForm({ ...form, version: e.target.value })} className={inputCls} />
          </Field>
          <Field label="状态">
            <select value={form.enabled ? "true" : "false"} onChange={(e) => setForm({ ...form, enabled: e.target.value === "true" })} className={inputCls + " appearance-none"}>
              <option value="true">激活</option><option value="false">禁用</option>
            </select>
          </Field>
        </div>
      </div>

      <SkillConditionTester conditions={form.conditions || []} logic={form.logic || "AND"} action={form.action} level={form.level} />

      <div className={`flex gap-3 pt-3 border-t ${T.borderB}`}>
        <DarkButton onClick={() => onSave(form)} variant="primary" className="flex-1 justify-center">
          <Sparkles size={14} /> {item?.id ? "保存更改" : "创建 Skill"}
        </DarkButton>
        <DarkButton onClick={onCancel}>取消</DarkButton>
      </div>
    </div>
  );
}

/* ─── Skill Condition Tester ─── */
function SkillConditionTester({ conditions, logic, action, level }: {
  conditions: { param: string; operator: string; value: string; unit: string }[];
  logic: string; action: string; level: string;
}) {
  const T = useT();
  const inputCls = useInputCls();
  const [expanded, setExpanded] = useState(false);
  const [testInputs, setTestInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ triggered: boolean; details: { param: string; pass: boolean; reason: string }[] } | null>(null);

  const runTest = () => {
    const validConditions = conditions.filter(c => c.param && c.value);
    if (validConditions.length === 0) {
      setResult({ triggered: false, details: [{ param: "-", pass: false, reason: "未配置有效条件" }] });
      return;
    }

    const details = validConditions.map((cond) => {
      const inputVal = parseFloat(testInputs[cond.param] || "0");
      const thresholdVal = parseFloat(cond.value);
      let pass = false;

      if (isNaN(inputVal) || isNaN(thresholdVal)) {
        const inputStr = (testInputs[cond.param] || "").trim();
        pass = cond.operator === "=" ? inputStr === cond.value :
               cond.operator === "!=" ? inputStr !== cond.value :
               cond.operator === "contains" ? inputStr.includes(cond.value) : false;
      } else {
        switch (cond.operator) {
          case "<": pass = inputVal < thresholdVal; break;
          case "<=": pass = inputVal <= thresholdVal; break;
          case "=": pass = inputVal === thresholdVal; break;
          case ">=": pass = inputVal >= thresholdVal; break;
          case ">": pass = inputVal > thresholdVal; break;
          case "!=": pass = inputVal !== thresholdVal; break;
          default: pass = false;
        }
      }

      return {
        param: cond.param,
        pass,
        reason: `${testInputs[cond.param] || "未输入"} ${cond.operator} ${cond.value}${cond.unit ? " " + cond.unit : ""} → ${pass ? "命中" : "未命中"}`,
      };
    });

    const triggered = logic === "OR" ? details.some(d => d.pass) : details.every(d => d.pass);
    setResult({ triggered, details });
  };

  const validConditions = conditions.filter(c => c.param && c.value);

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 text-sm ${T.text4} hover:text-cyan-400 transition-colors w-full`}>
        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${T.purpleChip}`}>
          <FlaskConical size={12} />
        </div>
        <span className={`text-sm ${T.text3}`}>条件模拟测试</span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} className="ml-auto">
          <ChevronDown size={14} className={T.text5} />
        </motion.div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="pl-8 pt-3 space-y-3">
              <p className={`text-[10px] ${T.text5}`}>输入模拟参数值，测试该 Skill 是否会被触发</p>
              {validConditions.length === 0 ? (
                <p className={`text-xs ${T.text6} py-3`}>请先配置触发���件</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {validConditions.map((cond, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`text-xs ${T.text4} w-24 shrink-0 truncate`}>{cond.param}</span>
                        <input
                          value={testInputs[cond.param] || ""}
                          onChange={(e) => setTestInputs({ ...testInputs, [cond.param]: e.target.value })}
                          placeholder={`输入${cond.param}的值`}
                          className={inputCls + " !py-1.5 !text-xs"}
                        />
                        <span className={`text-[10px] ${T.text6} shrink-0 w-20`}>{cond.operator} {cond.value}{cond.unit}</span>
                      </div>
                    ))}
                  </div>
                  <DarkButton onClick={runTest} variant="primary" size="sm">
                    <Play size={12} /> 运行测试
                  </DarkButton>

                  <AnimatePresence>
                    {result && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className={`p-3 rounded-xl border ${
                          result.triggered ? T.testTriggered : T.testSafe
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {result.triggered
                              ? <><XOctagon size={14} className="text-red-400" /><span className="text-xs text-red-400">触发 — {level}风险预警</span></>
                              : <><CheckCheck size={14} className="text-emerald-400" /><span className="text-xs text-emerald-400">未触发 — 条件不满足</span></>
                            }
                            <span className={`text-[10px] ${T.text6} ml-auto`}>逻辑: {logic}</span>
                          </div>
                          <div className="space-y-1">
                            {result.details.map((d, i) => (
                              <div key={i} className="flex items-center gap-2 text-[10px]">
                                {d.pass
                                  ? <div className="w-3 h-3 rounded-full bg-red-400/20 flex items-center justify-center"><XOctagon size={7} className="text-red-400" /></div>
                                  : <div className="w-3 h-3 rounded-full bg-emerald-400/20 flex items-center justify-center"><CheckCheck size={7} className="text-emerald-400" /></div>
                                }
                                <span className={T.text4}>{d.reason}</span>
                              </div>
                            ))}
                          </div>
                          {result.triggered && action && (
                            <div className={`flex items-start gap-2 mt-2 p-2 rounded-lg border ${T.testTriggered}`}>
                              <ArrowRight size={10} className="text-red-400/60 mt-0.5 shrink-0" />
                              <span className="text-[10px] text-red-400/60">{action}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE: 气象水文智能体
   ═══════════════════════════════════════════════════════════ */
function MeteoHydroPage({ weather, hydro, loading, onReload }: {
  weather: any[]; hydro: any[]; loading: boolean; onReload: () => void;
}) {
  const T = useT();
  const inputCls = useInputCls();
  const [tab, setTab] = useState<"weather" | "hydro">("weather");
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [editingDsId, setEditingDsId] = useState<string | null>(null);


  const DEFAULT_METEO_SOURCES: DataSource[] = [
    { id: "ds-m1", name: "广东省气象局API", type: "api", endpoint: "https://weather.gd.gov.cn/api/v3/forecast", status: "connected", lastSync: "10分钟前", autoRefresh: true, refreshInterval: 30, description: "实时气象数据接口，���气温、风力、能见度、降水预报" },
    { id: "ds-m2", name: "珠江水利委遥测系统", type: "realtime", endpoint: "wss://hydro.pearlwater.gov.cn/ws/stations", status: "connected", lastSync: "实时", autoRefresh: true, refreshInterval: 15, description: "水文遥测站实时数据，高要站、三水站、甘竹溪站" },
    { id: "ds-m3", name: "潮汐预报系统", type: "api", endpoint: "https://tide.nmdis.org.cn/api/predict", status: "connected", lastSync: "��日00:00", autoRefresh: true, refreshInterval: 1440, description: "国家海洋信息中心潮汐预报，提前72小时逐小时预报" },

  ];
  const [dataSources, setDataSources] = useState<DataSource[]>(() => {
    try {
      const saved = localStorage.getItem("qxbd_meteo_sources");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_METEO_SOURCES;
  });

  const handleSave = async (formData: any) => {
    try {
      const apiPath = tab === "weather" ? "weathers" : "hydros";
      if (editItem?.id) { await apiPut(`${apiPath}/${editItem.id}`, formData); toast.success("更新成功"); }
      else { await apiPost(apiPath, formData); toast.success("创建成功"); }
      setEditItem(null); setCreating(false); onReload();
    } catch (e: any) { toast.error("保存失败: " + e.message); }
  };

  const handleDelete = async (id: string) => {
    const apiPath = tab === "weather" ? "weathers" : "hydros";
    try { await apiDelete(`${apiPath}/${id}`); toast.success("删���成功"); onReload(); }
    catch (e: any) { toast.error("删除失败: " + e.message); }
  };

  return (
    <div>
      <PageHeader icon={Cloud} title="气象水文智能体"
        subtitle="管理气象观测和水文站点数据，为航行安全提供环境态势感知"
        gradient="from-teal-500 to-cyan-600"
        actions={<DarkButton onClick={onReload} disabled={loading}><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 刷新</DarkButton>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Thermometer}
          label={weather[0]?.area || "气��"}
          value={weather[0]?.temp || "--"}
          gradient="from-teal-500 to-cyan-600"
          trend="实时"
          glow={C.cyan}
          sub={weather.length > 1 ? `另有 ${weather.length - 1} 个区域` : "当前观测值"}
        />
        <StatCard
          icon={Wind}
          label="风力 / 能见度"
          value={weather[0]?.wind || "--"}
          gradient="from-blue-500 to-indigo-600"
          glow={C.blue}
          sub={weather[0]?.visibility ? `能见度 ${weather[0].visibility}` : "当前观测值"}
        />
        <StatCard
          icon={Waves}
          label={hydro[0]?.station || "水位"}
          value={hydro[0]?.waterLevel || "--"}
          gradient="from-indigo-500 to-purple-600"
          trend="实时"
          glow={C.purple}
          sub={hydro[0]?.flow ? `流量 ${hydro[0].flow}` : "当前观测值"}
        />
        <StatCard
          icon={Navigation}
          label="潮汐态势"
          value={hydro[0]?.tide?.slice(0, 6) || "--"}
          gradient="from-emerald-500 to-teal-600"
          glow={C.green}
          sub={hydro.length > 1 ? `共 ${hydro.length} 个站点在线` : "当前观测值"}
        />
      </div>

      <div className="flex gap-2 mb-5">
        {([
          { key: "weather" as const, label: "气象信息", count: weather.length, icon: Cloud },
          { key: "hydro" as const, label: "水文站点", count: hydro.length, icon: Waves },
        ]).map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
              tab === t.key
                ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20"
                : T.btnDefault
            }`}>
            <t.icon size={14} /> {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20" : T.innerBg2}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "weather" ? (
        <DataTable items={weather} loading={loading} search={search} setSearch={setSearch}
          onEdit={(item) => setEditItem(item)} onDelete={handleDelete}
          onCreate={() => { setEditItem(null); setCreating(true); }} createLabel="新增气象"
          renderItem={(item, idx) => (
            <div className="flex items-center min-w-0">
              <span className={`text-xs tabular-nums w-7 shrink-0 ${T.text5}`}>#{idx}</span>
              <span className={`w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5`} />
              <span className={`flex items-center gap-1 text-xs ${T.text5} shrink-0 w-28`}>
                <Clock size={10} className="shrink-0" />
                {item.reportedAt ? item.reportedAt.slice(5) : "--"}
              </span>
              <span className={`w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5`} />
              <span className={`flex items-center gap-1 text-xs ${T.text2} shrink-0 w-36 truncate`}>
                <MapPin size={10} className="text-teal-400 shrink-0" />
                {item.area}
              </span>
              <span className={`w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5`} />
              <span className={`flex items-center gap-1 text-xs ${T.text4} shrink-0 w-20`}>
                <Thermometer size={10} className="text-orange-400 shrink-0" />
                {item.temp || "--"}
              </span>
              <span className={`w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5`} />
              <span className={`flex items-center gap-1 text-xs ${T.text4} shrink-0 w-24`}>
                <Wind size={10} className="text-cyan-400 shrink-0" />
                {item.wind || "--"}
              </span>
              <span className={`w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5`} />
              <span className={`flex items-center gap-1 text-xs ${T.text4} shrink-0`}>
                <Eye size={10} className="text-blue-400 shrink-0" />
                {item.visibility || "--"}
              </span>
            </div>
          )}
        />
      ) : (
        <DataTable items={hydro} loading={loading} search={search} setSearch={setSearch}
          onEdit={(item) => setEditItem(item)} onDelete={handleDelete}
          onCreate={() => { setEditItem(null); setCreating(true); }} createLabel="新增站点"
          renderItem={(item, idx) => (
            <div className="flex items-center min-w-0">
              <span className={`text-xs tabular-nums w-7 shrink-0 ${T.text5}`}>#{idx}</span>
              <span className={`w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5`} />
              <span className={`flex items-center gap-1 text-xs ${T.text5} shrink-0 w-28`}>
                <Clock size={10} className="shrink-0" />
                {item.reportedAt ? item.reportedAt.slice(5) : "--"}
              </span>
              <span className={`w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5`} />
              <span className={`flex items-center gap-1 text-xs ${T.text2} shrink-0 w-32 truncate`}>
                <Waves size={10} className="text-indigo-400 shrink-0" />
                {item.station}
              </span>
              <span className={`w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5`} />
              <span className={`flex items-center gap-1 text-xs ${T.text5} shrink-0 w-24 truncate`}>
                <Navigation size={10} className="text-teal-400 shrink-0" />
                {item.river || "--"}
              </span>
              <span className={`w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5`} />
              <span className={`flex items-center gap-1 text-xs ${T.text4} shrink-0 w-20`}>
                <Gauge size={10} className="text-blue-400 shrink-0" />
                {item.waterLevel || "--"}
              </span>
              <span className={`w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5`} />
              <span className={`flex items-center gap-1 text-xs ${T.text4} shrink-0 w-28`}>
                <Wind size={10} className="text-cyan-400 shrink-0" />
                {item.flow || "--"}
              </span>
              <span className={`w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5`} />
              <span className={`flex items-center gap-1 text-xs ${T.text4} shrink-0`}>
                <ArrowUpDown size={10} className="text-violet-400 shrink-0" />
                {item.tide || "--"}
              </span>
            </div>
          )}
        />
      )}

      <FormModal open={creating || !!editItem}
        title={tab === "weather" ? (editItem?.id ? "编辑气象" : "新增气象") : (editItem?.id ? "编辑水文站点" : "新增水文站点")}
        onClose={() => { setCreating(false); setEditItem(null); }}>
        {tab === "weather"
          ? <WeatherFormInner item={editItem} onSave={handleSave} onCancel={() => { setCreating(false); setEditItem(null); }} />
          : <HydroFormInner item={editItem} onSave={handleSave} onCancel={() => { setCreating(false); setEditItem(null); }} />
        }
      </FormModal>

      {/* ── 数据来源配置 ── */}
      <div className="mt-10">
        <div className={`flex items-center gap-2.5 px-1 mb-3`}>
          <Link2 size={15} className={T.text3} />
          <span className={`text-sm ${T.text2}`}>数据来源配置</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${T.innerBg2} ${T.text4}`}>{dataSources.filter(d => d.type !== "manual").length} 个来源</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20`}>
            {dataSources.filter(d => d.status === "connected" && d.type !== "manual").length} 已连接
          </span>
        </div>
        <div>
          <div className="grid grid-cols-1 gap-3">
                {dataSources.filter(ds => ds.type !== "manual").map((ds) => (
                  <DataSourceCard
                    key={ds.id}
                    source={ds}
                    onToggle={(id) => {
                      const updated = dataSources.map(d => d.id === id ? { ...d, autoRefresh: !d.autoRefresh } : d);
                      setDataSources(updated);
                      localStorage.setItem("qxbd_meteo_sources", JSON.stringify(updated));
                      toast.info(`「${ds.name}」自动刷新已${ds.autoRefresh ? "关闭" : "开启"}`);
                    }}
                    editing={editingDsId === ds.id}
                    onEdit={(id) => setEditingDsId(id)}
                    onConfirm={() => {
                      setEditingDsId(null);
                      localStorage.setItem("qxbd_meteo_sources", JSON.stringify(dataSources));
                      toast.success(`「${ds.name}」配置已保存`);
                    }}
                  />
                ))}
          </div>
          <p className={`text-[11px] ${T.text5} mt-3 pl-1`}>
            数据来源配置修改后自动保存至本地，一般无需频繁变更。
          </p>
        </div>
      </div>
    </div>
  );
}

function WeatherFormInner({ item, onSave, onCancel }: { item?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const inputCls = useInputCls();
  const now = new Date();
  const defaultTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const [form, setForm] = useState(item || { area: "", temp: "", wind: "", visibility: "", reportedAt: defaultTime, source: "", recorder: "" });
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="区域" required><input value={form.area} onChange={f("area")} className={inputCls} placeholder="如：高要段（高要大桥附近）" /></Field>
        <Field label="报告时间"><input value={form.reportedAt} onChange={f("reportedAt")} className={inputCls} placeholder="2026-03-24 06:00" /></Field>
        <Field label="气温"><input value={form.temp} onChange={f("temp")} className={inputCls} placeholder="18-26°C" /></Field>
        <Field label="风力"><input value={form.wind} onChange={f("wind")} className={inputCls} placeholder="东南风3级" /></Field>
        <Field label="能见度（视距）"><input value={form.visibility} onChange={f("visibility")} className={inputCls} placeholder="8km" /></Field>
        <Field label="数据来源"><input value={form.source} onChange={f("source")} className={inputCls} placeholder="气象局电话报 / 自动采集" /></Field>
      </div>
      <Field label="记录人">
        <input value={form.recorder} onChange={f("recorder")} className={inputCls} placeholder="值班员姓名（选填）" />
      </Field>
      <div className="flex gap-2 pt-2">
        <DarkButton onClick={() => onSave(form)} variant="primary" className="flex-1 justify-center"><Save size={14} /> 保存</DarkButton>
        <DarkButton onClick={onCancel}>取消</DarkButton>
      </div>
    </div>
  );
}

function HydroFormInner({ item, onSave, onCancel }: { item?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const inputCls = useInputCls();
  const now = new Date();
  const defaultTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const [form, setForm] = useState(item || { station: "", river: "", county: "", authority: "", waterLevel: "", flow: "", tide: "", warnLevel: "", baseWaterLevel: "", reportedAt: defaultTime, source: "", recorder: "" });
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="测站名称" required><input value={form.station} onChange={f("station")} className={inputCls} placeholder="如：高要站" /></Field>
        <Field label="河流名称"><input value={form.river} onChange={f("river")} className={inputCls} placeholder="如：西江" /></Field>
        <Field label="所在县市"><input value={form.county} onChange={f("county")} className={inputCls} placeholder="如：肇庆市高要区" /></Field>
        <Field label="管理机构"><input value={form.authority} onChange={f("authority")} className={inputCls} placeholder="如：广东省水文局肇庆分局" /></Field>
        <Field label="报告时间"><input value={form.reportedAt} onChange={f("reportedAt")} className={inputCls} placeholder="2026-03-24 06:00" /></Field>
        <Field label="警戒水位"><input value={form.warnLevel} onChange={f("warnLevel")} className={inputCls} placeholder="如：4.8m" /></Field>
        <Field label="基准水位"><input value={form.baseWaterLevel} onChange={f("baseWaterLevel")} className={inputCls} placeholder="如：3.8m" /></Field>
        <Field label="水位"><input value={form.waterLevel} onChange={f("waterLevel")} className={inputCls} placeholder="如：5.2m" /></Field>
        <Field label="流量"><input value={form.flow} onChange={f("flow")} className={inputCls} placeholder="如：18000m³/s" /></Field>
        <Field label="潮汐状态"><input value={form.tide} onChange={f("tide")} className={inputCls} placeholder="如：落潮中，低潮预计16:00" /></Field>
        <Field label="数据来源"><input value={form.source} onChange={f("source")} className={inputCls} placeholder="如：珠江水利委遥测" /></Field>
      </div>
      <Field label="记录人">
        <input value={form.recorder} onChange={f("recorder")} className={inputCls} placeholder="值班员姓名（选填）" />
      </Field>
      <div className="flex gap-2 pt-2">
        <DarkButton onClick={() => onSave(form)} variant="primary" className="flex-1 justify-center"><Save size={14} /> 保存</DarkButton>
        <DarkButton onClick={onCancel}>取消</DarkButton>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE: 桥梁净空监控
   ═══════════════════════════════════════════════════════════ */
function BridgeClearancePage({ elements, hydros, loading, onReload }: {
  elements: any[]; hydros: any[]; loading: boolean; onReload: () => void;
}) {
  const T = useT();
  const isDark = useIsDark();
  const [bridgeClearances, setBridgeClearances] = useState<any[]>([]);
  const [calculating, setCalculating] = useState(false);

  const bridges = elements.filter((e: any) => e.type === "桥梁");

  useEffect(() => {
    if (bridges.length > 0) {
      calculateAllBridges();
    }
  }, [bridges.length, hydros.length]);

  const calculateAllBridges = async () => {
    setCalculating(true);
    try {
      const { getAllBridgesWithClearance } = await import("./api");
      const results = await getAllBridgesWithClearance();
      setBridgeClearances(results);
    } catch (e) {
      console.error("计算桥梁净空失败", e);
    } finally {
      setCalculating(false);
    }
  };

  const safeCount = bridgeClearances.filter((b) => b.safetyStatus === "安全").length;
  const warningCount = bridgeClearances.filter((b) => b.safetyStatus === "警告").length;
  const dangerCount = bridgeClearances.filter((b) => b.safetyStatus === "危险").length;

  return (
    <div>
      <PageHeader 
        icon={Gauge} 
        title="桥梁净空监控" 
        subtitle="实时计算桥梁净空高度，基于水位动态评估通航安全" 
        gradient="from-teal-500 to-emerald-600"
        actions={
          <div className="flex items-center gap-2">
            <DarkButton onClick={calculateAllBridges} disabled={calculating}>
              <RefreshCw size={14} className={calculating ? "animate-spin" : ""} /> 重新计算
            </DarkButton>
            <DarkButton onClick={onReload} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 刷新数据
            </DarkButton>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Gauge} label="桥梁总数" value={bridges.length} gradient="from-teal-500 to-cyan-600" glow={C.cyan} />
        <StatCard icon={CheckCircle2} label="安全" value={safeCount} gradient="from-emerald-500 to-green-600" glow={C.green} />
        <StatCard icon={AlertTriangle} label="警告" value={warningCount} gradient="from-amber-500 to-yellow-600" glow={C.amber} />
        <StatCard icon={XOctagon} label="危险" value={dangerCount} gradient="from-rose-500 to-red-600" glow={C.red} />
      </div>

      {calculating ? (
        <div className={`rounded-2xl p-16 flex flex-col items-center justify-center ${T.cardBg} ${T.cardBorder}`}>
          <Loader2 size={40} className="animate-spin text-teal-500 mb-4" />
          <p className={`text-sm ${T.text3}`}>正在计算所有桥梁的实时净空...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bridgeClearances.map((bridge) => (
            <div key={bridge.bridgeId} className={`rounded-2xl p-5 ${T.cardBg} ${T.cardBorder} hover:shadow-lg transition-all`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    bridge.safetyStatus === "安全" ? "bg-emerald-500/10" :
                    bridge.safetyStatus === "警告" ? "bg-amber-500/10" :
                    "bg-red-500/10"
                  }`}>
                    <Gauge size={20} className={
                      bridge.safetyStatus === "安全" ? "text-emerald-500" :
                      bridge.safetyStatus === "警告" ? "text-amber-500" :
                      "text-red-500"
                    } />
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${T.text1}`}>{bridge.bridgeName}</h3>
                    <p className={`text-xs ${T.text5}`}>公里标 {bridge.bridgeKm} · 关联{bridge.nearestHydroStation}</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  bridge.safetyStatus === "安全" ? "bg-emerald-500/10 text-emerald-600" :
                  bridge.safetyStatus === "警告" ? "bg-amber-500/10 text-amber-600" :
                  "bg-red-500/10 text-red-600"
                }`}>{bridge.safetyStatus}</span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className={`rounded-lg p-3 ${T.innerBg1}`}>
                  <p className={`text-xs ${T.text5} mb-1`}>设计净空</p>
                  <p className={`text-lg font-medium ${T.text1}`}>{bridge.designClearance.toFixed(1)}m</p>
                </div>
                <div className={`rounded-lg p-3 ${T.innerBg1}`}>
                  <p className={`text-xs ${T.text5} mb-1`}>实时净空</p>
                  <p className={`text-lg font-medium ${T.text1}`}>{bridge.actualClearance.toFixed(1)}m</p>
                </div>
                <div className={`rounded-lg p-3 ${T.innerBg1}`}>
                  <p className={`text-xs ${T.text5} mb-1`}>富裕净空要求</p>
                  <p className={`text-lg font-medium ${T.text1}`}>{bridge.requiredReserve}m</p>
                </div>
                <div className={`rounded-lg p-3 ${
                  bridge.safetyStatus === "安全" ? "bg-emerald-500/10" :
                  bridge.safetyStatus === "警告" ? "bg-amber-500/10" :
                  "bg-red-500/10"
                }`}>
                  <p className={`text-xs ${T.text5} mb-1`}>可通过船高</p>
                  <p className={`text-lg font-medium ${
                    bridge.safetyStatus === "安全" ? "text-emerald-600" :
                    bridge.safetyStatus === "警告" ? "text-amber-600" :
                    "text-red-600"
                  }`}>≤{bridge.maxShipHeight.toFixed(1)}m</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`rounded-lg p-3 ${T.innerBg1}`}>
                  <p className={`text-xs ${T.text5} mb-1`}>基准水位</p>
                  <p className={`text-sm ${T.text2}`}>{bridge.baseWaterLevel.toFixed(1)}m</p>
                </div>
                <div className={`rounded-lg p-3 ${T.innerBg1}`}>
                  <p className={`text-xs ${T.text5} mb-1`}>实时水位</p>
                  <p className={`text-sm ${T.text2}`}>{bridge.currentWaterLevel.toFixed(1)}m 
                    <span className={`ml-2 text-xs ${
                      bridge.waterLevelDelta > 0 ? "text-red-500" : "text-blue-500"
                    }`}>
                      ({bridge.waterLevelDelta > 0 ? "+" : ""}{bridge.waterLevelDelta.toFixed(1)}m)
                    </span>
                  </p>
                </div>
              </div>

              <div className={`rounded-lg p-3 border-l-4 ${
                bridge.safetyStatus === "安全" ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500" :
                bridge.safetyStatus === "警告" ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-500" :
                "bg-red-50/50 dark:bg-red-900/10 border-red-500"
              }`}>
                <p className={`text-xs ${T.text3} leading-relaxed`}>{bridge.recommendation}</p>
              </div>

              {bridge.relatedRules && bridge.relatedRules.length > 0 && (
                <div className="mt-4">
                  <p className={`text-xs font-medium ${T.text3} mb-2`}>相关规则 ({bridge.relatedRules.length}条)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {bridge.relatedRules.map((rule: any, i: number) => (
                      <span key={i} className={`text-[10px] px-2 py-1 rounded ${T.cyanChip}`}>
                        {rule.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NAV DOC LIBRARY — Document upload, AI parse & vector store
   ═══════════════════════════════════════════════════════════ */

/** In-memory blob URLs (current session only) */
const blobStore = new Map<string, string>();

const MOCK_NAV_DOCS: NavDoc[] = [
  {
    id: "doc_mock_001", name: "西江肇庆航段临时禁行通告（2026年3月）.pdf",
    size: 245760, mimeType: "application/pdf", uploadedAt: "2026-03-20T09:00:00.000Z",
    aiTitle: "西江肇庆航段K102-K105临时禁止通航通告",
    aiCategory: ["通行管制", "施工水域"], aiLocation: "西江肇庆航段 K102~K105",
    aiTags: ["#临时禁航", "#施工", "#肇庆", "#西江", "#绕行"],
    aiSummary: "因端州���桥桥墩检修施工，西江肇庆K102~K105段自2026年3月22日至4月10日临时禁止通航，所有船舶须提前联系VTS中心办理绕行手续。",
    vectorized: true, vectorKeywords: ["肇庆", "禁航", "西江K102", "桥墩检修", "施工水域", "绕行", "端州大桥", "VTS"], vectorDim: 1536,
    status: "ready", progress: 100, locked: true,
  },
  {
    id: "doc_mock_002", name: "珠江三角洲大雾天气航行安全通告.docx",
    size: 183296, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploadedAt: "2026-03-19T14:30:00.000Z",
    aiTitle: "珠三角水域大雾低能见度航行安全警示",
    aiCategory: ["气象预警", "能见度管制"], aiLocation: "珠江三角洲全域",
    aiTags: ["#大雾", "#低能见度", "#限速", "#雷达", "#VHF"],
    aiSummary: "因持续性大雾，珠三角主要航道能见度低于500米，要求所有船舶降速至安全航速，开启雷达和AIS，保���VHF16频道值守，并向VTS报告位置。",
    vectorized: true, vectorKeywords: ["大雾", "能见度", "珠三角", "限速", "雷达值守", "AIS", "VHF16", "珠江"], vectorDim: 1536,
    status: "ready", progress: 100, locked: true,
  },
  {
    id: "doc_mock_003", name: "广州港南沙区���轮锚地调整公告.pdf",
    size: 312832, mimeType: "application/pdf", uploadedAt: "2026-03-18T08:15:00.000Z",
    aiTitle: "广州港南沙港区外轮锚地范围调整公告",
    aiCategory: ["锚地管理", "港口通告"], aiLocation: "广州港南沙港区 外轮锚地",
    aiTags: ["#锚地调整", "#南沙", "#外轮", "#航道", "#广州港"],
    aiSummary: "南沙港区外轮锚地1~3号泊位范围调整，因港区扩建工程，原划定锚地向西偏移约300米，外轮进港前须向引航站确认最新锚泊坐标。",
    vectorized: true, vectorKeywords: ["南沙", "锚地调整", "外轮", "广州港", "引航站", "泊位", "扩建"], vectorDim: 1536,
    status: "ready", progress: 100, locked: true,
  },
  {
    id: "doc_mock_004", name: "西江洪水期船舶限速限载管理规定2026.pdf",
    size: 198144, mimeType: "application/pdf", uploadedAt: "2026-03-15T10:00:00.000Z",
    aiTitle: "西江干流汛期船舶限速限载管理规定（2026年度）",
    aiCategory: ["水文管制", "汛期管理"], aiLocation: "西江干流 肇庆至广州段",
    aiTags: ["#汛期", "#限速", "#限载", "#洪水", "#西江", "#水位"],
    aiSummary: "西江干流水位超警戒线时自动触发限速8节、限载300吨管制，适用肇庆至广州全段，船公司须提前申报航次计���。",
    vectorized: true, vectorKeywords: ["汛期", "西江", "限速8节", "水位警戒", "洪水", "肇庆广州", "航次申报"], vectorDim: 1536,
    status: "ready", progress: 100, locked: true,
  },
  {
    id: "doc_mock_005", name: "海警2026第012号-高要水道施工碍航警告.pdf",
    size: 127488, mimeType: "application/pdf", uploadedAt: "2026-03-24T08:00:00.000Z",
    aiTitle: "海警2026第012号：肇庆高要水道施工碍航警告",
    aiCategory: ["海警通告", "施工碍航"], aiLocation: "高要水道 K88~K91",
    aiTags: ["#海警", "#碍航", "#高要", "#施工船", "#让路"],
    aiSummary: "高要水道K88~K91因管道铺设作业，3艘施工船舶占据主航道北侧，过往船舶须靠南侧行驶并降速，预计作业至4月底。",
    vectorized: true, vectorKeywords: ["海警通告", "高要水道", "施工碍航", "管道铺设", "让路", "K88", "肇庆"], vectorDim: 1536,
    status: "ready", progress: 100, locked: true,
  },
];

interface NavDoc {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  aiTitle: string;
  aiCategory: string[];
  aiLocation: string;
  aiTags: string[];
  aiSummary: string;
  vectorized: boolean;
  vectorKeywords: string[];
  vectorDim: number;
  status: "uploading" | "parsing" | "ai-processing" | "vectorizing" | "ready" | "error";
  progress: number;
  locked?: boolean;
}

function fmtSize(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}

function aiExtract(filename: string) {
  const n = filename.toLowerCase();
  const cats: string[] = [];
  const rawTags: string[] = [];

  if (/施工|爆破|疏浚|作业/.test(n)) { cats.push("施工作业"); rawTags.push("施工", "临时限制"); }
  if (/台风|大风|气象|暴雨|能见度/.test(n)) { cats.push("气象预警"); rawTags.push("恶劣天气", "气象"); }
  if (/水位|��水|汛期|高水/.test(n)) { cats.push("水文预警"); rawTags.push("高水位", "汛情"); }
  if (/航道|通航|疏航|浅滩/.test(n)) { cats.push("航道变更"); rawTags.push("航道", "通航限制"); }
  if (/演习|军事|禁航|管制/.test(n)) { cats.push("军事管制"); rawTags.push("演习", "禁止通航"); }
  if (/测量|勘测|科考/.test(n)) { cats.push("测量作业"); rawTags.push("测量船", "注意避让"); }
  if (cats.length === 0) { cats.push("一般通告"); rawTags.push("航行警告"); }

  const locs = ["西江", "北江", "东江", "珠江", "肇庆水道", "佛山水道", "广州水道", "思贤滘", "高要水道", "三水水道"];
  const loc = locs.find(l => n.includes(l.toLowerCase())) ||
    (n.includes("肇庆") ? "肇庆水道" : n.includes("���州") ? "广州水道" : n.includes("佛山") ? "佛山水道" : "肇庆辖区水域");

  const baseTitle = filename.replace(/\.[^.]+$/, "").slice(0, 28);
  const title = baseTitle.length >= 5 ? baseTitle : `${loc}${cats[0]}航行警告`;
  const summary = `本警告涉及${loc}水域${cats.join("/")}事项，请过往船舶注意规避，加强值守了望，做好安全防范工作。`;
  const tags = rawTags.map(t => `#${t}`);
  const keywords = [...rawTags, ...cats, loc, "航警", "海事局", "通航安全"];
  const dim = 128 + Math.floor(Math.random() * 384);

  return { title, cats, loc, tags, summary, keywords, dim };
}

function NavDocViewer({ doc, isDark, T }: { doc: NavDoc; isDark: boolean; T: ReturnType<typeof makeTheme> }) {
  const blobUrl = blobStore.get(doc.id);
  const isImg = /image/.test(doc.mimeType) || /\.(png|jpe?g)$/i.test(doc.name);
  const isPdf = /pdf/.test(doc.mimeType) || doc.name.endsWith(".pdf");
  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap items-center gap-2 p-3 rounded-xl border ${T.innerBg}`}>
        <span className={`text-[10px] flex items-center gap-1 ${T.text4}`}>
          <MapPin size={9} className="text-rose-400/60" /> {doc.aiLocation}
        </span>
        {doc.aiCategory.map(c => (
          <span key={c} className={`text-[10px] px-2 py-0.5 rounded-md border ${T.purpleChip}`}>{c}</span>
        ))}
        {doc.aiTags.map(t => (
          <span key={t} className={`text-[10px] px-2 py-0.5 rounded-md border ${T.chipBg} ${T.chipText}`}>{t}</span>
        ))}
        <span className="ml-auto text-[10px] flex items-center gap-1 text-emerald-400/70">
          <CheckCircle2 size={9} /> 已向量化 {doc.vectorDim} 维
        </span>
      </div>
      {doc.aiSummary && (
        <div className={`flex items-start gap-2 p-3 rounded-xl border ${T.innerBg}`}>
          <Sparkles size={12} className="text-cyan-400/60 mt-0.5 shrink-0" />
          <p className={`text-xs ${T.text4} leading-relaxed`}>{doc.aiSummary}</p>
        </div>
      )}
      <div className={`rounded-xl overflow-hidden border ${T.borderB}`} style={{ minHeight: 400 }}>
        {blobUrl ? (
          isImg ? (
            <img src={blobUrl} alt={doc.name} className="w-full max-h-[540px] object-contain bg-black/20" />
          ) : isPdf ? (
            <iframe src={blobUrl} className="w-full border-0" style={{ height: 540 }} title={doc.name} />
          ) : (
            <div className={`flex flex-col items-center justify-center py-16 ${T.text5}`}>
              <FileText size={48} className={`mb-4 ${T.emptyIcon}`} />
              <p className={`text-sm ${T.text3} mb-1`}>{doc.name}</p>
              <p className={`text-xs ${T.text5} mb-4`}>Word 文档请下载后用 Office 打开</p>
              <a href={blobUrl} download={doc.name}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-colors ${isDark ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20" : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"}`}>
                <Upload size={13} /> 下载文件
              </a>
            </div>
          )
        ) : (
          <div className={`flex flex-col items-center justify-center py-16 ${T.text5}`}>
            <FileText size={48} className={`mb-4 ${T.emptyIcon}`} />
            <p className="text-sm">预览不可用</p>
            <p className={`text-xs ${T.text6} mt-1`}>本次会话未保留文件，请重新上传以预览</p>
          </div>
        )}
      </div>
      <div>
        <p className={`text-[10px] ${T.text5} mb-2 flex items-center gap-1.5`}>
          <Cpu size={9} className="text-cyan-400/60" /> 向量检索关键词
          <span className={T.text6}>— 船���端查询航线时自动语义匹配并推送此文档</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {doc.vectorKeywords.map((kw, i) => (
            <span key={i} className={`text-[10px] px-2 py-0.5 rounded-lg border ${T.chipBg} ${T.chipText}`}>{kw}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

interface NavDocLibraryHandle { processFile: (file: File) => void; }

const NavDocLibrary = forwardRef<NavDocLibraryHandle>(function NavDocLibrary(_, ref) {
  const T = useT();
  const isDark = useIsDark();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [docs, setDocs] = useState<NavDoc[]>(() => {
    try {
      const stored: NavDoc[] = JSON.parse(localStorage.getItem("qxbd_nav_docs") || "[]");
      const mockIds = new Set(MOCK_NAV_DOCS.map(d => d.id));
      const userDocs = stored.filter(d => !mockIds.has(d.id) && !d.name.includes("智数端研"));
      return [...MOCK_NAV_DOCS, ...userDocs];
    } catch { return MOCK_NAV_DOCS; }
  });
  const [viewDoc, setViewDoc] = useState<NavDoc | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("qxbd_nav_docs", JSON.stringify(docs));
  }, [docs]);

  const processFile = (file: File) => {
    const allowed = ["pdf", "doc", "docx", "png", "jpg", "jpeg"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowed.includes(ext)) { toast.error(`不支持 .${ext} 格式`); return; }

    const id = "doc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    const blobUrl = URL.createObjectURL(file);
    blobStore.set(id, blobUrl);

    const newDoc: NavDoc = {
      id, name: file.name, size: file.size,
      mimeType: file.type || `application/${ext}`,
      uploadedAt: new Date().toISOString(),
      aiTitle: "", aiCategory: [], aiLocation: "", aiTags: [], aiSummary: "",
      vectorized: false, vectorKeywords: [], vectorDim: 0,
      status: "uploading", progress: 0,
    };
    setDocs(prev => [newDoc, ...prev]);

    // Animate progress bar
    let p = 0;
    const tick = setInterval(() => {
      p += Math.random() * 20 + 8;
      if (p >= 95) { clearInterval(tick); }
      setDocs(prev => prev.map(d => d.id === id ? { ...d, progress: Math.min(p, 95) } : d));
    }, 180);

    setTimeout(() => setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "parsing" } : d)), 900);
    setTimeout(() => setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "ai-processing" } : d)), 2200);
    setTimeout(() => {
      const ai = aiExtract(file.name);
      setDocs(prev => prev.map(d => d.id === id ? {
        ...d, status: "vectorizing",
        aiTitle: ai.title, aiCategory: ai.cats, aiLocation: ai.loc,
        aiTags: ai.tags, aiSummary: ai.summary,
      } : d));
    }, 3800);
    setTimeout(() => {
      clearInterval(tick);
      const ai = aiExtract(file.name);
      setDocs(prev => prev.map(d => d.id === id ? {
        ...d, status: "ready", progress: 100,
        vectorized: true, vectorKeywords: ai.keywords, vectorDim: ai.dim,
      } : d));
      toast.success(`「${file.name}」处理完成，已加入向量知识库`);
    }, 5600);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(f => processFile(f));
  };

  useImperativeHandle(ref, () => ({ processFile }));

  const handleDelete = (id: string) => {
    const doc = docs.find(d => d.id === id);
    if (doc?.locked) { toast.info("内置文档已锁定，不可删除"); return; }
    const url = blobStore.get(id);
    if (url) { URL.revokeObjectURL(url); blobStore.delete(id); }
    setDocs(prev => prev.filter(d => d.id !== id));
    if (viewDoc?.id === id) setViewDoc(null);
    toast.success("已删除");
  };

  const statusCfg: Record<string, { label: string; color: string; spin: boolean }> = {
    uploading:       { label: "上传中",      color: isDark ? "text-cyan-400"    : "text-blue-500",   spin: true },
    parsing:         { label: "解析文档",    color: isDark ? "text-blue-400"    : "text-indigo-500", spin: true },
    "ai-processing": { label: "AI提取信息",  color: isDark ? "text-purple-400"  : "text-purple-600", spin: true },
    vectorizing:     { label: "生成向量嵌入", color: isDark ? "text-amber-400"   : "text-amber-600",  spin: true },
    ready:           { label: "已就绪",      color: isDark ? "text-emerald-400" : "text-emerald-600", spin: false },
    error:           { label: "处理失败",    color: "text-red-400",             spin: false },
  };

  const fileIconCfg = (mimeType: string, name: string) => {
    if (mimeType.includes("pdf") || name.endsWith(".pdf"))
      return { color: isDark ? "text-red-400" : "text-red-500", bg: isDark ? "bg-red-400/10" : "bg-red-50", label: "PDF" };
    if (mimeType.includes("word") || /\.docx?$/.test(name))
      return { color: isDark ? "text-blue-400" : "text-blue-500", bg: isDark ? "bg-blue-400/10" : "bg-blue-50", label: "DOC" };
    if (mimeType.includes("image") || /\.(png|jpe?g)$/i.test(name))
      return { color: isDark ? "text-purple-400" : "text-purple-500", bg: isDark ? "bg-purple-400/10" : "bg-purple-50", label: "IMG" };
    return { color: T.text4, bg: T.innerBg, label: "FILE" };
  };

  const readyDocs = docs.filter(d => d.status === "ready");

  return (
    <div>
      {/* ── Summary banner ── */}
      {readyDocs.length > 0 && (
        <div className={`flex items-center gap-4 mb-5 p-3 rounded-xl border ${T.innerBg} text-[10px] ${T.text5} overflow-x-auto`}>
          <span className="flex items-center gap-1.5 text-emerald-400/80 shrink-0">
            <CheckCircle2 size={10} /> {readyDocs.length} 个文档已向量化
          </span>
          <span className={`w-px h-4 ${isDark ? "bg-white/10" : "bg-gray-200"} shrink-0`} />
          <span className="flex items-center gap-1.5 shrink-0">
            <Cpu size={9} /> 关键词索引：{[...new Set(readyDocs.flatMap(d => d.vectorKeywords))].slice(0, 8).join(" · ")}
          </span>
          <span className={`ml-auto flex items-center gap-1.5 text-cyan-400/60 shrink-0`}>
            <Wifi size={9} /> 船员端语义检索已激活
          </span>
        </div>
      )}

      {/* ── Upload zone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative mb-6 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none ${
          dragging
            ? isDark ? "border-cyan-400/60 bg-cyan-400/[0.04] shadow-lg shadow-cyan-500/10"
                     : "border-blue-400 bg-blue-50"
            : isDark ? "border-white/[0.07] hover:border-cyan-400/30 hover:bg-white/[0.02]"
                     : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/20"
        }`}
      >
        <input ref={fileInputRef} type="file" multiple
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          className="hidden" onChange={(e) => handleFiles(e.target.files)} />

        <div className="flex flex-col items-center justify-center py-12 gap-3 pointer-events-none">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            dragging
              ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl shadow-cyan-500/30 scale-110"
              : isDark ? "bg-white/[0.04] border border-white/[0.08]"
                       : "bg-white border border-gray-200 shadow-sm"
          }`}>
            <Upload size={24} className={dragging ? "text-white" : T.text4} />
          </div>
          <div className="text-center space-y-1">
            <p className={`text-sm ${T.text2}`}>
              {dragging ? "松开上传文件" : "拖拽文件至此，或点击选择"}
            </p>
            <p className={`text-xs ${T.text5}`}>
              PDF · Word (.docx) · 图片 (PNG/JPG) — 上传后自动 AI 解析并向量化
            </p>
          </div>
          {/* Format badges */}
          <div className="flex items-center gap-2">
            {[
              { label: "PDF", color: "text-red-400",    bg: isDark ? "bg-red-400/10 border-red-400/20"    : "bg-red-50 border-red-200" },
              { label: "DOCX", color: "text-blue-400",  bg: isDark ? "bg-blue-400/10 border-blue-400/20"  : "bg-blue-50 border-blue-200" },
              { label: "PNG/JPG", color: "text-purple-400", bg: isDark ? "bg-purple-400/10 border-purple-400/20" : "bg-purple-50 border-purple-200" },
            ].map(f => (
              <span key={f.label} className={`text-[10px] px-2 py-0.5 rounded-lg border ${f.bg} ${f.color}`}>{f.label}</span>
            ))}
          </div>
        </div>

        {/* Drag overlay pulse ring */}
        {dragging && <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/40 pointer-events-none animate-pulse" />}
      </div>

      {/* ── Processing pipeline indicator ── */}
      {docs.some(d => d.status !== "ready" && d.status !== "error") && (
        <div className={`flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl border ${T.innerBg} text-[10px] ${T.text5} overflow-x-auto`}>
          <Cpu size={10} className="text-cyan-400/70 shrink-0 animate-pulse" />
          <span className="shrink-0 mr-1">AI 处理流水线：</span>
          {["上传文���", "文档解析", "AI提取信息", "生成向量嵌入", "就绪检索"].map((step, i) => (
            <span key={step} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && <ChevronRight size={9} className={T.text7} />}
              <span className={step === "上传文件" ? "text-cyan-400/80" : step === "文档解析" ? "text-blue-400/80" : step === "AI提取信息" ? "text-purple-400/80" : step === "生���向量嵌入" ? "text-amber-400/80" : "text-emerald-400/80"}>{step}</span>
            </span>
          ))}
        </div>
      )}

      {/* ── Document list ── */}
      {docs.length === 0 ? (
        <Glass className="flex flex-col items-center justify-center py-20">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? "bg-white/[0.03] border border-white/[0.06]" : "bg-gray-50 border border-gray-100"}`}>
            <FileText size={28} className={T.emptyIcon} />
          </div>
          <p className={`text-sm ${T.emptyText}`}>暂无航警文档</p>
          <p className={`text-xs ${T.emptyHint} mt-1.5`}>上传 PDF/Word/图片，系统自动解析并向量化入库</p>
        </Glass>
      ) : (
        <div className="space-y-3">
          {docs.map((doc, idx) => {
            const st = statusCfg[doc.status] || statusCfg.ready;
            const fi = fileIconCfg(doc.mimeType, doc.name);
            const isProcessing = doc.status !== "ready" && doc.status !== "error";
            const isExpanded = expandedId === doc.id;

            return (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                <Glass className="overflow-hidden group">
                  {/* Progress bar */}
                  <div className={`h-[3px] w-full ${isDark ? "bg-white/[0.04]" : "bg-gray-100"}`}>
                    <motion.div
                      className={`h-full ${doc.status === "ready" ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${doc.status === "ready" ? 100 : doc.progress}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* File type icon */}
                      <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${fi.bg}`}>
                        <FileText size={16} className={fi.color} />
                        <span className={`text-[8px] ${fi.color} mt-0.5`}>{fi.label}</span>
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        {/* Row 1: filename + status + meta */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={`text-sm ${T.text2} truncate max-w-[220px]`}>{doc.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            doc.status === "ready" ? T.emeraldChip : `${T.chipBg} ${T.chipText}`
                          }`}>
                            {st.spin && <Loader2 size={8} className="animate-spin" />}
                            <span className={st.color}>{st.label}</span>
                          </span>
                          <span className={`text-[10px] ${T.text6}`}>{fmtSize(doc.size)}</span>
                          <span className={`text-[10px] ${T.text6}`}>
                            {new Date(doc.uploadedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        {/* AI metadata block (appears after ai-processing) */}
                        {doc.aiTitle && (
                          <div className={`p-3 rounded-xl border mb-2 ${T.innerBg}`}>
                            <div className="flex items-start gap-2">
                              <Sparkles size={11} className="text-cyan-400/60 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0 space-y-2">
                                {/* AI title */}
                                <p className={`text-xs ${T.text2}`}>{doc.aiTitle}</p>
                                {/* Location */}
                                <div className={`flex items-center gap-1.5 text-[10px] ${T.text4}`}>
                                  <MapPin size={9} className="text-rose-400/60 shrink-0" />
                                  <span>{doc.aiLocation}</span>
                                </div>
                                {/* Category + tags chips */}
                                <div className="flex flex-wrap gap-1">
                                  {doc.aiCategory.map(c => (
                                    <span key={c} className={`text-[10px] px-2 py-0.5 rounded-md border ${T.purpleChip}`}>{c}</span>
                                  ))}
                                  {doc.aiTags.slice(0, 5).map(t => (
                                    <span key={t} className={`text-[10px] px-2 py-0.5 rounded-md border ${T.chipBg} ${T.chipText}`}>{t}</span>
                                  ))}
                                </div>
                                {/* Summary */}
                                <p className={`text-[10px] ${T.text5} leading-relaxed`}>{doc.aiSummary}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Vector status row */}
                        {doc.status === "ready" && (
                          <div className={`flex items-center gap-4 flex-wrap text-[10px] ${T.text5}`}>
                            <span className="flex items-center gap-1 text-emerald-400/70">
                              <CheckCircle2 size={9} /> 向量化完成 · {doc.vectorDim} 维
                            </span>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                              className={`flex items-center gap-1 hover:text-cyan-400 transition-colors`}
                            >
                              <Tag size={9} />
                              <span>{doc.vectorKeywords.slice(0, 5).join(" · ")}</span>
                              {doc.vectorKeywords.length > 5 && <span>+{doc.vectorKeywords.length - 5}</span>}
                              <ChevronDown size={8} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                            <span className="flex items-center gap-1 text-cyan-400/50">
                              <Globe size={9} /> 船员端检索就绪
                            </span>
                          </div>
                        )}

                        {/* Expanded vector keywords */}
                        <AnimatePresence>
                          {isExpanded && doc.status === "ready" && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden">
                              <div className={`mt-2 p-3 rounded-xl border ${T.innerBg}`}>
                                <p className={`text-[10px] ${T.text5} mb-2 flex items-center gap-1`}>
                                  <Cpu size={9} className="text-cyan-400/60" /> 语义向量关键词（供船员端航线查询时自动匹配）
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {doc.vectorKeywords.map((kw, ki) => (
                                    <span key={ki} className={`text-[10px] px-2 py-0.5 rounded-lg border ${T.chipBg} ${T.chipText}`}>{kw}</span>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Processing state text */}
                        {isProcessing && (
                          <div className={`flex items-center gap-2 mt-1.5 text-[10px] ${T.text5}`}>
                            <Loader2 size={9} className={`animate-spin ${st.color}`} />
                            <span>{st.label}中…  {doc.progress < 99 ? Math.floor(doc.progress) + "%" : ""}</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {doc.status === "ready" && (
                          <DarkButton onClick={() => setViewDoc(doc)} size="sm">
                            <Eye size={12} /> 查看
                          </DarkButton>
                        )}
                        {doc.locked ? (
                          <div className={`p-2 rounded-lg ${T.text7}`} title="内置文档已锁定">
                            <Lock size={12} />
                          </div>
                        ) : (
                          <button onClick={() => handleDelete(doc.id)}
                            className={`p-2 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${T.text6} hover:text-red-400`}
                            title="删除">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Glass>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Count footer */}
      {docs.length > 0 && (
        <div className={`mt-4 flex items-center justify-between text-xs ${T.text5}`}>
          <span>共 {docs.length} 个文档 · {readyDocs.length} 个已就绪 · {docs.filter(d => d.vectorized).reduce((s, d) => s + d.vectorKeywords.length, 0)} 个向量关键词</span>
          {readyDocs.length > 0 && (
            <span className="flex items-center gap-1.5 text-emerald-400/60">
              <Wifi size={10} /> 知识库已激活
            </span>
          )}
        </div>
      )}

      {/* ── Document Viewer Modal ── */}
      <FormModal
        open={!!viewDoc}
        title={viewDoc ? (viewDoc.aiTitle || viewDoc.name) : "文档预览"}
        onClose={() => setViewDoc(null)}
        width="max-w-4xl"
      >
        {viewDoc ? <NavDocViewer doc={viewDoc} isDark={isDark} T={T} /> : null}
      </FormModal>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   PAGE: 航警播报智能体
   ══════════���════════════════════════════════════════════════ */
function NavWarningsPage({ warnings, loading, onReload }: {
  warnings: any[]; loading: boolean; onReload: () => void;
}) {
  const T = useT();
  const isDark = useIsDark();
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingDsId, setEditingDsId] = useState<string | null>(null);

  const dataSources: DataSource[] = [
    { id: "ds-w1", name: "智慧海事系统", type: "api", endpoint: "https://ntm.msa.gov.cn/api/v2/notices", status: "connected", lastSync: "30分钟前", autoRefresh: true, refreshInterval: 60, description: "中国海事局航行警告系统" },
    { id: "ds-w2", name: "海警航行警告", type: "manual", status: "connected", lastSync: "实时通报", autoRefresh: false, description: "肇庆VTS中心值班人员通报" },
    { id: "ds-w3", name: "应急指挥平台", type: "api", endpoint: "https://emergency.msa.gov.cn/api/alerts", status: "disconnected", autoRefresh: true, refreshInterval: 5, description: "海事应急指挥平台推送" },
  ];

  const activeCount = warnings.filter((w: any) => w.status === "active").length;
  const urgentCount = warnings.filter((w: any) => w.level === "紧急" && w.status === "active").length;

  const expiredButActive = warnings.filter((w: any) => {
    if (w.status !== "active" || !w.expiresAt) return false;
    return new Date(w.expiresAt) < new Date();
  });

  const handleAutoArchive = async () => {
    let count = 0;
    for (const w of expiredButActive) {
      try { await apiPut(`warnings/${w.id}`, { ...w, status: "expired" }); count++; } catch {}
    }
    if (count > 0) { toast.success(`已归档 ${count} 条到期航警`); onReload(); }
    else { toast.info("暂无需要归档的航警"); }
  };

  const filteredWarnings = warnings.filter((w) => {
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    const matchSearch = !search || JSON.stringify(w).toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleSave = async (formData: any) => {
    try {
      if (editItem?.id) { await apiPut(`warnings/${editItem.id}`, formData); toast.success("更��成功"); }
      else { await apiPost("warnings", formData); toast.success("发布成功"); }
      setEditItem(null); setCreating(false); onReload();
    } catch (e: any) { toast.error("保存失败: " + e.message); }
  };

  const handleDelete = async (id: string) => {
    try { await apiDelete(`warnings/${id}`); toast.success("删除成功"); onReload(); }
    catch (e: any) { toast.error("删除失败: " + e.message); }
  };

  const handleToggleNotify = async (item: any) => {
    try {
      await apiPut(`warnings/${item.id}`, { ...item, notifyCrewSide: !item.notifyCrewSide });
      toast.success(!item.notifyCrewSide ? "已推送至船员端" : "已取消船员端推送");
      onReload();
    } catch (e: any) { toast.error("操作失败: " + e.message); }
  };

  const levelColors: Record<string, { bg: string; text: string }> = {
    "紧急": { bg: "bg-red-500", text: "text-white" },
    "管制": { bg: "bg-purple-500", text: "text-white" },
    "一般": { bg: "bg-amber-500", text: "text-white" },
    "信息": { bg: "bg-blue-500", text: "text-white" },
  };

  return (
    <div>
      <PageHeader icon={AlertTriangle} title="航警播报智能体"
        subtitle="管理航行警告全生命周期���确保船员及时获取最新安全信息"
        gradient="from-rose-500 to-red-600"
        actions={
          <div className="flex items-center gap-2">
            {expiredButActive.length > 0 && (
              <DarkButton onClick={handleAutoArchive} variant="danger" size="sm">
                <Archive size={14} /> 归档到期 ({expiredButActive.length})
              </DarkButton>
            )}
            <DarkButton onClick={onReload} disabled={loading}><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 刷新</DarkButton>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={AlertTriangle} label="航行警告总数" value={warnings.length} gradient="from-rose-500 to-red-600" glow={C.red} />
        <StatCard icon={Bell} label="生效中" value={activeCount} gradient="from-orange-500 to-amber-600" glow={C.amber} />
        <StatCard icon={Zap} label="紧急警告" value={urgentCount} gradient="from-red-600 to-red-700" glow={C.red} />
      </div>

      <>
      <div className="flex gap-1.5 mb-4">
        {[
          { key: "all", label: `全部 (${warnings.length})` },
          { key: "active", label: `生效中 (${activeCount})` },
          { key: "expired", label: `已过期 (${warnings.filter((w) => w.status === "expired").length})` },
          { key: "draft", label: `草稿 (${warnings.filter((w) => w.status === "draft").length})` },
        ].map((f) => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
              statusFilter === f.key ? "bg-rose-500 text-white" : T.filterInactive
            }`}>{f.label}</button>
        ))}
      </div>

      {/* ── Search + Create Bar ── */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex-1 flex items-center gap-2 border rounded-xl px-3 py-2 ${T.chipBg}`}>
          <Search size={14} className={T.text5} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索航行警告标题或内容..."
            className={`flex-1 bg-transparent text-sm outline-none ${isDark ? "text-white/70 placeholder-white/20" : "text-gray-700 placeholder-gray-400"}`} />
          {search && (
            <button onClick={() => setSearch("")} className={`${T.text6} hover:${T.text4} transition-colors`}><X size={12} /></button>
          )}
        </div>
        <DarkButton onClick={() => { setEditItem(null); setCreating(true); }} variant="primary">
          <Plus size={14} /> 发布警告
        </DarkButton>
      </div>

      {/* ── Warning Cards ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-rose-400/40" />
        </div>
      ) : filteredWarnings.length === 0 ? (
        <Glass className="p-16 flex flex-col items-center justify-center">
          <AlertTriangle size={40} className={`mb-3 ${T.emptyIcon}`} />
          <p className={`text-sm ${T.emptyText}`}>暂无航行警告</p>
          <p className={`text-xs ${T.emptyHint} mt-1`}>{search ? "尝试修改搜索词" : "点击「发布警告」添加"}</p>
        </Glass>
      ) : (
        <>
          <Glass className="overflow-hidden">
            {/* 列头 */}
            <div className={`flex items-center px-4 py-2 border-b ${T.borderB} ${isDark ? "bg-white/[0.02]" : "bg-gray-50/60"}`}>
              <span className={`text-[10px] w-6 shrink-0 ${T.text5}`}>#</span>
              <span className="w-px h-3 bg-current opacity-10 shrink-0 mx-2.5" />
              <span className={`text-[10px] w-12 shrink-0 ${T.text5}`}>级别</span>
              <span className="w-px h-3 bg-current opacity-10 shrink-0 mx-2.5" />
              <span className={`text-[10px] w-16 shrink-0 ${T.text5}`}>状态</span>
              <span className="w-px h-3 bg-current opacity-10 shrink-0 mx-2.5" />
              <span className={`text-[10px] flex-1 ${T.text5}`}>标题</span>
              <span className="w-px h-3 bg-current opacity-10 shrink-0 mx-2.5" />
              <span className={`text-[10px] w-24 shrink-0 ${T.text5}`}>发布时间</span>
              <span className="w-px h-3 bg-current opacity-10 shrink-0 mx-2.5" />
              <span className={`text-[10px] w-28 shrink-0 ${T.text5}`}>到期时间</span>
              <span className="w-px h-3 bg-current opacity-10 shrink-0 mx-2.5" />
              <span className={`text-[10px] w-14 shrink-0 ${T.text5}`}>标记</span>
              <span className="w-20 shrink-0" />
            </div>
            {/* 可滚动列表，固定显示约5行 */}
            <div className="overflow-y-auto max-h-[220px]">
              {filteredWarnings.map((item, idx) => {
                const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
                const levelCfg: Record<string, { stripe: string; badge: string }> = {
                  "紧急": { stripe: "from-red-500 to-red-600", badge: "bg-red-500 text-white" },
                  "管制": { stripe: "from-purple-500 to-purple-600", badge: "bg-purple-500 text-white" },
                  "一般": { stripe: "from-amber-500 to-amber-600", badge: "bg-amber-500 text-white" },
                  "信息": { stripe: "from-blue-500 to-blue-600", badge: "bg-blue-500 text-white" },
                };
                const cfg = levelCfg[item.level] || levelCfg["信息"];
                return (
                  <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`flex items-center border-b ${T.borderB} last:border-b-0 ${T.rowHover} transition-colors group`}>
                    {/* 级别色条 */}
                    <div className={`w-[3px] bg-gradient-to-b ${cfg.stripe} shrink-0 self-stretch`} />
                    {/* 行内容 */}
                    <div className="flex-1 px-4 py-[10px]">
                      <div className="flex items-center min-w-0">
                        <span className={`text-xs tabular-nums w-6 shrink-0 ${T.text5}`}>#{idx + 1}</span>
                        <span className="w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5" />
                        <span className={`text-[10px] px-2 py-0.5 rounded-md shrink-0 ${cfg.badge}`}>{item.level}</span>
                        <span className="w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5" />
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${
                          item.status === "active" ? T.emeraldChip
                            : item.status === "draft" ? T.amberChip
                            : `${T.chipBg} ${T.chipText}`
                        }`}>
                          {item.status === "active" ? "生效中" : item.status === "draft" ? "草稿" : "已过期"}
                        </span>
                        {isExpired && item.status === "active" && (
                          <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${T.roseChip}`}>待归档</span>
                        )}
                        <span className="w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5" />
                        <span className={`flex-1 text-xs ${T.text2} truncate min-w-0`}>{item.title}</span>
                        <span className="w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5" />
                        <span className={`flex items-center gap-1 text-[11px] ${T.text5} shrink-0 w-24`}>
                          <CalendarClock size={9} className="shrink-0" />
                          {item.publishedAt ? new Date(item.publishedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "--"}
                        </span>
                        <span className="w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5" />
                        <span className={`flex items-center gap-1 text-[11px] shrink-0 w-28 ${isExpired ? "text-rose-400/60" : T.text5}`}>
                          <Timer size={9} className="shrink-0" />
                          {item.expiresAt
                            ? isExpired ? "已到期" : `至 ${new Date(item.expiresAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                            : <span className="opacity-30">—</span>}
                        </span>
                        <span className="w-px h-3.5 bg-current opacity-10 shrink-0 mx-2.5" />
                        <div className="flex items-center gap-2 shrink-0 w-14 justify-end">
                          {item.attachments?.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-violet-400/60">
                              <FileText size={9} />{item.attachments.length}
                            </span>
                          )}
                          {item.notifyCrewSide && <BellRing size={10} className="text-cyan-400/60" />}
                        </div>
                        <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => handleToggleNotify(item)}
                            className={`p-1.5 rounded-lg transition-colors ${item.notifyCrewSide ? "text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20" : `${T.text6} hover:bg-cyan-400/10 hover:text-cyan-400`}`}
                            title={item.notifyCrewSide ? "取消推送至船员端" : "推送至船员端"}>
                            <BellRing size={12} />
                          </button>
                          <button onClick={() => setEditItem(item)}
                            className={`p-1.5 hover:bg-cyan-400/10 rounded-lg ${T.text6} hover:text-cyan-400 transition-colors`} title="编辑">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => handleDelete(item.id)}
                            className={`p-1.5 hover:bg-red-400/10 rounded-lg ${T.text6} hover:text-red-400 transition-colors`} title="删除">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Glass>
          <div className={`mt-3 px-1 text-xs ${T.text5}`}>
            共 {filteredWarnings.length} 条{search && `（筛选自 ${warnings.length} 条）`}
          </div>
        </>
      )}

      <FormModal open={creating || !!editItem}
        title={editItem?.id ? "编辑航行警告" : "发布航行警告"}
        width="max-w-2xl"
        onClose={() => { setCreating(false); setEditItem(null); }}>
        <WarningFormInner item={editItem} onSave={handleSave} onCancel={() => { setCreating(false); setEditItem(null); }} />
      </FormModal>

      </>

      <SectionTitle title="数据来源配置" icon={Link2} count={dataSources.length} />
      <div className="grid grid-cols-1 gap-3 mb-8">
        {dataSources.map((ds) => (
          <DataSourceCard
            key={ds.id}
            source={ds}
            onToggle={() => toast.info("已切换")}
            editing={editingDsId === ds.id}
            onEdit={(id) => setEditingDsId(id)}
            onConfirm={() => { setEditingDsId(null); toast.success(`「${ds.name}」配置已保存`); }}
          />
        ))}
      </div>
    </div>
  );
}

function WarningFormInner({ item, onSave, onCancel }: { item?: any; onSave: (d: any) => void; onCancel: () => void }) {
  const T = useT();
  const isDark = useSystemTheme();
  const inputCls = useInputCls();
  const [form, setForm] = useState(item || { level: "一般", title: "", content: "", status: "active", expiresAt: "", publishedAt: new Date().toISOString().slice(0, 16) });
  const [attachments, setAttachments] = useState<{ name: string; size: number; type: string }[]>(item?.attachments || []);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docLibRef = useRef<NavDocLibraryHandle>(null);

  const ACCEPTED = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];
  const MAX_MB = 20;

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const next = [...attachments];
    Array.from(fileList).forEach((f) => {
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      if (!ACCEPTED.includes(ext)) { toast.error(`不支持的格式：${f.name}`); return; }
      if (f.size > MAX_MB * 1024 * 1024) { toast.error(`文件过大（最大 ${MAX_MB}MB）：${f.name}`); return; }
      if (next.find((a) => a.name === f.name)) { toast.info(`已存在同名文件：${f.name}`); return; }
      next.push({ name: f.name, size: f.size, type: f.type });
      // 同步导入文档知识库进行 AI 解析向量化
      docLibRef.current?.processFile(f);
    });
    setAttachments(next);
  };

  const removeFile = (name: string) => setAttachments((prev) => prev.filter((a) => a.name !== name));

  const fileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <span className="text-red-400 text-[10px] font-medium">PDF</span>;
    if (ext === "doc" || ext === "docx") return <span className="text-blue-400 text-[10px] font-medium">DOC</span>;
    return <span className="text-amber-400 text-[10px] font-medium">IMG</span>;
  };

  const fmtSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
  return (
    <div className="space-y-4">
      <Field label="标题" required><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></Field>
      <Field label="内容" required><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} className={inputCls + " resize-none"} /></Field>

      {/* ── 附件上传 ── */}
      <div>
        <label className={`${T.labelCls} mb-1.5 block`}>附件文件
          <span className={`ml-1.5 text-[10px] ${T.text5} font-normal`}>PDF / Word / 图片，单文件 ≤ {MAX_MB}MB</span>
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all py-6
            ${dragging
              ? "border-cyan-400/60 bg-cyan-400/5 scale-[1.01]"
              : isDark
                ? "border-white/10 bg-white/[0.02] hover:border-cyan-400/30 hover:bg-cyan-400/[0.03]"
                : "border-gray-200 bg-gray-50 hover:border-cyan-400/40 hover:bg-cyan-50/50"
            }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
            <Upload size={16} className={dragging ? "text-cyan-400" : T.text4} />
          </div>
          <div className="text-center">
            <p className={`text-xs ${T.text3}`}>{dragging ? "松开以上传" : "拖拽文件到此处，或点击选择"}</p>
            <p className={`text-[10px] mt-0.5 ${T.text5}`}>{ACCEPTED.join(" · ")}</p>
          </div>
          <input ref={fileInputRef} type="file" multiple accept={ACCEPTED.join(",")}
            className="hidden" onChange={(e) => addFiles(e.target.files)} />
        </div>
        {attachments.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {attachments.map((a) => (
              <div key={a.name} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${T.innerBg}`}>
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                  {fileIcon(a.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${T.text3}`}>{a.name}</p>
                  <p className={`text-[10px] ${T.text5}`}>{fmtSize(a.size)}</p>
                </div>
                <button onClick={() => removeFile(a.name)}
                  className={`p-1 rounded-md transition-colors ${T.text6} hover:text-red-400 hover:bg-red-400/10`}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="发布时间" hint="留空则立即发布">
          <input type="datetime-local" value={form.publishedAt || ""} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} className={inputCls} />
        </Field>
        <Field label="到期时间" hint="到期后自动归档为「已过期」">
          <input type="datetime-local" value={form.expiresAt || ""} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputCls} />
        </Field>
      </div>
      {/* ── 警告文档知识库 ── */}
      <div className={`border-t pt-5 mt-2 ${T.borderB}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-cyan-400/10" : "bg-cyan-50"}`}>
            <Cpu size={13} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
          </div>
          <div>
            <p className={`text-xs ${T.text2}`}>航警文档知识库</p>
            <p className={`text-[10px] ${T.text5}`}>上传附件后自动 AI 解析 · 向量化入库 · 供船员端语义检索</p>
          </div>
          <span className={`ml-auto text-[10px] flex items-center gap-1 text-emerald-400/70`}>
            <Wifi size={9} /> 船员端已激活
          </span>
        </div>
        <NavDocLibrary ref={docLibRef} />
      </div>

      <div className="flex gap-2 pt-2">
        <DarkButton onClick={() => onSave({ ...form, attachments })} variant="primary" className="flex-1 justify-center"><Save size={14} /> 保存</DarkButton>
        <DarkButton onClick={onCancel}>取消</DarkButton>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR CONFIG
   ═══════════════════════════════════════════════════════════ */
const sidebarItems: { key: AgentPage; label: string; icon: any; gradient: string; desc: string }[] = [
  { key: "overview", label: "指挥总览", icon: LayoutDashboard, gradient: "from-cyan-500 to-blue-600", desc: "监控面板 · 查询统计" },
  { key: "meteo-hydro", label: "气象水文", icon: Cloud, gradient: "from-teal-500 to-cyan-600", desc: "气象信息 · 水文站点" },
  { key: "nav-warnings", label: "航警播报", icon: BellRing, gradient: "from-purple-500 to-pink-600", desc: "航行警告 · 通告管理" },
  { key: "route-analysis", label: "通航要素", icon: Navigation, gradient: "from-cyan-500 to-blue-600", desc: "通航要素 · 推荐航路" },
  { key: "bridge-clearance", label: "桥梁净空", icon: Gauge, gradient: "from-teal-500 to-emerald-600", desc: "实时净空 · 安全监控" },
  { key: "navigation-rules", label: "航行规则", icon: Scale, gradient: "from-indigo-500 to-violet-600", desc: "航行规则 · 违规处罚" },
  { key: "navigation-risks", label: "通航风险", icon: XOctagon, gradient: "from-rose-500 to-red-600", desc: "历史案例 · 风险结论" },
  { key: "risk-assessment", label: "风险评估", icon: Shield, gradient: "from-amber-500 to-orange-500", desc: "Skills · 风险规则" },
];

/* ═══════════════════════════════════════════════════════════
   MAIN: AdminDashboard
   ═══════════════════════════════════════════════════════════ */
export function AdminDashboard() {
  const isDark = useSystemTheme();
  const T = useMemo(() => makeTheme(isDark), [isDark]);
  const [activePage, setActivePage] = useState<AgentPage>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [data, setData] = useState<Record<string, any[]>>({ elements: [], warnings: [], navigationRisks: [], navigationRules: [], weather: [], hydro: [], routes: [] });
  const [rules, setRules] = useState<any[]>(() => {
    try { const saved = localStorage.getItem("qxbd_risk_rules"); if (saved) return JSON.parse(saved); } catch {}
    return DEFAULT_RULES;
  });
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => { localStorage.setItem("qxbd_risk_rules", JSON.stringify(rules)); }, [rules]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 检查elements集合是否为空，如果为空则初始化所有mock数据
      const existingElements = await apiGet("elements");
      if (existingElements.length === 0) {
        const msg = await seed();
        console.log("✅ Mock数据初始化完成:", msg);
      }
      
      await ensureWeatherSeed();
      await ensureWarningsSeed();
      await ensureNavigationRisksSeed();
      await ensureNavigationRulesSeed();
      const [elements, warnings, navigationRisks, navigationRules, weather, hydro, routes] = await Promise.all([
        apiGet("elements"), apiGet("warnings"), apiGet("navigationRisks"), apiGet("navigationRules"), apiGet("weathers"), apiGet("hydros"), apiGet("routes"),
      ]);
      setData({ elements, warnings, navigationRisks, navigationRules, weather, hydro, routes });
    } catch (e: any) { toast.error("数据加载失败: " + e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen]);

  const handleSeed = async () => {
    setSeeding(true);
    try { const msg = await seed(); toast.success(msg); await loadData(); }
    catch (e: any) { toast.error("初始化失败: " + e.message); }
    setSeeding(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case "overview": return <OverviewPage data={data} rules={rules} onSeed={handleSeed} seeding={seeding} loading={loading} onRefresh={loadData} fullscreen={fullscreen} onToggleFullscreen={() => setFullscreen(!fullscreen)} />;
      case "route-analysis": return <RouteAnalysisPage elements={data.elements} routes={data.routes} loading={loading} onReload={loadData} />;
      case "navigation-risks": return <NavigationRisksPage 
        risks={data.navigationRisks || []} 
        loading={loading} 
        onReload={loadData}
        T={T}
        isDark={isDark}
        PageHeader={PageHeader}
        StatCard={StatCard}
        Glass={Glass}
        DarkButton={DarkButton}
        FormModal={FormModal}
        C={C}
      />;
      case "navigation-rules": return <NavigationRulesPage rules={data.navigationRules || []} onRefresh={loadData} />;
      case "bridge-clearance": return <BridgeClearancePage elements={data.elements} hydros={data.hydro} loading={loading} onReload={loadData} />;
      case "risk-assessment": return <RiskAssessmentPage rules={rules} setRules={setRules} loading={loading} onReload={loadData} />;
      case "meteo-hydro": return <MeteoHydroPage weather={data.weather} hydro={data.hydro} loading={loading} onReload={loadData} />;
      case "nav-warnings": return <NavWarningsPage warnings={data.warnings} loading={loading} onReload={loadData} />;
    }
  };

  const currentTime = new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <ThemeCtx.Provider value={isDark}>
      <div className="min-h-screen flex" style={{ background: T.pageBg }}>
        <Toaster position="top-center" richColors theme={isDark ? "dark" : "light"} />

        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: `radial-gradient(circle, ${T.glowCyan}, transparent)` }} />
          <div className="absolute top-1/2 -left-32 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: `radial-gradient(circle, ${T.glowBlue}, transparent)` }} />
          <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: `radial-gradient(circle, ${T.glowPurple}, transparent)` }} />
          <div className={`absolute inset-0 ${T.gridOpacity}`}
            style={{ backgroundImage: `linear-gradient(${T.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${T.gridColor} 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        </div>

        {/* ── Sidebar ── */}
        <motion.aside
          animate={{ width: fullscreen ? 0 : (sidebarCollapsed ? 72 : 264), opacity: fullscreen ? 0 : 1 }}
          transition={{ duration: 0.25 }}
          className={`fixed left-0 top-0 h-screen z-30 flex flex-col ${fullscreen ? "pointer-events-none" : ""}`}
          style={{ background: T.sidebarBg, borderRight: T.sidebarBorder }}
        >
          {/* Logo */}
          <div className={`px-4 pt-5 pb-4 border-b ${T.borderB}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative"
                style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`, boxShadow: `0 4px 20px -4px ${C.cyan}60` }}>
                <Compass size={18} className="text-white" />
                <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ${T.logoBorder}`} />
              </div>
              {!sidebarCollapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className={`text-sm ${T.text1}`}>七星北导</p>
                  <p className={`text-[10px] ${T.text5}`}>海事指挥中心 · v2.0</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
            {!sidebarCollapsed && <p className={`text-[9px] ${T.text6} uppercase tracking-widest px-3 mb-3`}>智���体</p>}
            {sidebarItems.map((item) => {
              const isActive = activePage === item.key;
              return (
                <button key={item.key} onClick={() => setActivePage(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left relative ${
                    isActive ? T.text1 : `${T.text4} ${T.cardHover}`
                  }`}
                  style={isActive ? T.navActive : undefined}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? `bg-gradient-to-br ${item.gradient}` : T.navInactiveBg
                  }`}>
                    <item.icon size={16} className={isActive ? "text-white" : T.text4} />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${isActive ? T.text1 : ""}`}>{item.label}</p>
                      <p className={`text-[10px] truncate ${isActive ? T.text4 : T.text6}`}>{item.desc}</p>
                    </div>
                  )}
                  {isActive && !sidebarCollapsed && (
                    <div className="w-1 h-1 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className={`px-3 pb-4 border-t ${T.borderB} pt-3 space-y-1.5`}>
            <a href="/" target="_blank" rel="noopener noreferrer"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors text-sm ${T.text4} hover:text-cyan-400`}>
              <Ship size={16} />
              {!sidebarCollapsed && (
                <><span className="flex-1">船员端入口</span><ExternalLink size={12} className={T.text6} /></>
              )}
            </a>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm ${T.text5} ${T.cardHover}`}>
              <motion.div animate={{ rotate: sidebarCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
                <ChevronRight size={16} />
              </motion.div>
              {!sidebarCollapsed && <span>收起</span>}
            </button>
          </div>
        </motion.aside>

        {/* ── Main Content ── */}
        <motion.main
          animate={{ marginLeft: fullscreen ? 0 : (sidebarCollapsed ? 72 : 264) }}
          transition={{ duration: 0.25 }}
          className="flex-1 relative z-10"
        >
          {/* Top bar */}
          <AnimatePresence>
            {!fullscreen && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className={`sticky top-0 z-20 backdrop-blur-xl border-b ${T.topbarBorder} px-6 py-3 flex items-center justify-between`}
                style={{ background: T.topbarBg }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className={`text-xs ${T.text4}`}>系统运行正常</span>
                </div>
                <div className={`flex items-center gap-4 text-xs ${T.text5}`}>
                  <span className="flex items-center gap-1.5"><Clock size={12} /> {currentTime}</span>
                  <span className="flex items-center gap-1.5"><Users size={12} /> 值班员</span>
                  <span className="flex items-center gap-1.5">
                    {isDark ? <Moon size={12} /> : <Sun size={12} />}
                    {isDark ? "深色" : "浅色"}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`mx-auto px-6 py-8 ${fullscreen ? "max-w-full" : "max-w-[1280px]"}`}>
            <AnimatePresence>
              {fullscreen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-2 rounded-xl border backdrop-blur-xl shadow-2xl ${T.fsBarBg}`}>
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className={`text-xs ${T.text4}`}>投屏模式</span>
                  <span className={`text-[10px] ${T.text5}`}>·</span>
                  <span className={`text-xs ${T.text4}`}>{new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  <button onClick={() => setFullscreen(false)} className={`ml-2 p-1.5 rounded-lg transition-colors ${T.btnGhost}`} title="ESC 退出">
                    <Minimize2 size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div key={activePage}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}>
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </ThemeCtx.Provider>
  );
}

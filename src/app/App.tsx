import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send, Bot, Sparkles, Ship, MapPin, Anchor,
  AlertTriangle, Cloud, Navigation, Landmark, ChevronDown, ChevronUp,
  Waves, Wind, ThermometerSun, Eye, Gauge, Droplets, User, Mic
} from "lucide-react";
import avatarImg from "figma:asset/ca8a37f0563d82a26b9475bd87394c3fbee9f641.png";

/* ─── Types ─── */
interface Message {
  id: string;
  role: "user" | "agent";
  content?: string;
  type?: "text" | "risk-report";
  report?: RiskReport;
  agents?: AgentInfo[];
}
interface AgentInfo { name: string; status: "working" | "done" }
interface RiskReport {
  shipName: string;
  origin: string;
  destination: string;
  elements: { type: string; count: number; items: { name: string; km: string; note: string; subType?: string; params?: { label: string; value: string }[]; photo?: string }[] }[];
  warnings: { level: string; title: string; content: string }[];
  weather: { area: string; temp: string; wind: string; visibility: string }[];
  hydro: { station: string; waterLevel: string; flow: string; tide: string }[];
  route: { distance: string; time: string; waypoints: { label: string; type?: string; note?: string }[] };
}

/* ─── Mock Data ─── */
const mockReport: RiskReport = {
  shipName: "鲁枣庄货3738",
  origin: "南京港",
  destination: "上海港",
  elements: [
    { type: "桥梁", count: 3, items: [
      { name: "南京长江大桥", km: "318.2", note: "双层公铁两用桥，注意桥墩水流", subType: "公铁两用梁桥", params: [{ label: "通航孔", value: "3#~5#孔" }, { label: "净空", value: "24m" }, { label: "净宽", value: "190m" }], photo: "https://images.unsplash.com/photo-1766223676058-1f8f4e47a003?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXJnZSUyMGJyaWRnZSUyMHJpdmVyJTIwQ2hpbmF8ZW58MXx8fHwxNzczOTA5MjMzfDA&ixlib=rb-4.1.0&q=80&w=1080" },
      { name: "润扬大桥", km: "274.5", note: "南汊悬索桥+北汊斜拉桥组合", subType: "悬索桥", params: [{ label: "通航孔", value: "主通航孔" }, { label: "净空", value: "50m" }, { label: "净宽", value: "760m" }], photo: "https://images.unsplash.com/photo-1686074097829-a9788748a8e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWJsZSUyMHN0YXllZCUyMGJyaWRnZSUyMHJpdmVyfGVufDF8fHx8MTc3MzkwOTIzM3ww&ixlib=rb-4.1.0&q=80&w=1080" },
      { name: "江阴长江大桥", km: "233.0", note: "主航道通航，注意限速规定", subType: "悬索桥", params: [{ label: "通航孔", value: "主通航孔" }, { label: "净空", value: "50m" }, { label: "净宽", value: "760m" }], photo: "https://images.unsplash.com/photo-1743605819403-0b7b402ff6d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxKaWFuZ3lpbiUyMHN1c3BlbnNpb24lMjBicmlkZ2UlMjBDaGluYXxlbnwxfHx8fDE3NzM5MDkyMjl8MA&ixlib=rb-4.1.0&q=80&w=1080" },
    ]},
    { type: "渡口", count: 2, items: [
      { name: "栖霞山渡口", km: "310.5", note: "客渡频繁横越航道，注意避让，鸣笛示警", subType: "客渡", params: [{ label: "航班", value: "每15分钟" }, { label: "横越宽度", value: "1.2km" }, { label: "高峰时段", value: "7-9时" }], photo: "https://images.unsplash.com/photo-1706014286788-47ee401b525b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXZlciUyMGZlcnJ5JTIwY3Jvc3NpbmclMjBkb2NrJTIwQ2hpbmF8ZW58MXx8fHwxNzczOTEwNDk2fDA&ixlib=rb-4.1.0&q=80&w=1080" },
      { name: "浦口渡口", km: "305.8", note: "汽渡横越，大型车辆运输频繁", subType: "汽渡", params: [{ label: "航班", value: "每30分钟" }, { label: "横越宽度", value: "1.5km" }, { label: "载重", value: "60吨" }], photo: "https://images.unsplash.com/photo-1706014286788-47ee401b525b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXZlciUyMGZlcnJ5JTIwY3Jvc3NpbmclMjBkb2NrJTIwQ2hpbmF8ZW58MXx8fHwxNzczOTEwNDk2fDA&ixlib=rb-4.1.0&q=80&w=1080" },
    ]},
    { type: "取水口", count: 2, items: [
      { name: "城北水厂取水口", km: "312.8", note: "禁止锚泊、排污，保持足够横距", subType: "工业取水", params: [{ label: "管道深度", value: "8m" }, { label: "禁锚范围", value: "上下各200m" }, { label: "标志", value: "白色灯桩" }], photo: "https://images.unsplash.com/photo-1762478153928-53e0c30e1e82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMGludGFrZSUyMHBpcGUlMjByaXZlciUyMGluZHVzdHJpYWx8ZW58MXx8fHwxNzczOTEwNDk3fDA&ixlib=rb-4.1.0&q=80&w=1080" },
      { name: "下关水厂取水口", km: "308.3", note: "禁止锚泊，注意灯标标识", subType: "市政取水", params: [{ label: "管道深度", value: "6m" }, { label: "禁锚范围", value: "上下各150m" }, { label: "标志", value: "红色灯桩" }], photo: "https://images.unsplash.com/photo-1762478153928-53e0c30e1e82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlciUyMGludGFrZSUyMHBpcGUlMjByaXZlciUyMGluZHVzdHJpYWx8ZW58MXx8fHwxNzczOTEwNDk3fDA&ixlib=rb-4.1.0&q=80&w=1080" },
    ]},
    { type: "商渔密集区", count: 2, items: [
      { name: "龙潭水域", km: "315-312", note: "商船及渔船密集，控制航速，加强VHF值守", subType: "商渔混合", params: [{ label: "日均船舶", value: "350+艘" }, { label: "高峰时段", value: "6-10时" }, { label: "限速", value: "8节" }], photo: "https://images.unsplash.com/photo-1695732807321-e99c6525e1cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXN5JTIwc2hpcHBpbmclMjByaXZlciUyMGNhcmdvJTIwYm9hdHN8ZW58MXx8fHwxNzczOTEwNDk3fDA&ixlib=rb-4.1.0&q=80&w=1080" },
      { name: "仪征水域", km: "290-285", note: "渔船作业密集，注意避让渔网", subType: "渔船作业区", params: [{ label: "渔船数量", value: "约60艘" }, { label: "作业方式", value: "定置网" }, { label: "密集时段", value: "凌晨4-8时" }], photo: "https://images.unsplash.com/photo-1695732807321-e99c6525e1cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXN5JTIwc2hpcHBpbmclMjByaXZlciUyMGNhcmdvJTIwYm9hdHN8ZW58MXx8fHwxNzczOTEwNDk3fDA&ixlib=rb-4.1.0&q=80&w=1080" },
    ]},
    { type: "临时锚泊区", count: 2, items: [
      { name: "栖霞山临时锚泊区", km: "311.0", note: "限制锚泊船舶数量，注意走锚风险", subType: "临时锚地", params: [{ label: "容量", value: "15艘" }, { label: "水深", value: "12-15m" }, { label: "底质", value: "泥沙" }], photo: "https://images.unsplash.com/photo-1630437261590-63c33ea54bd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaGlwcyUyMGFuY2hvcmVkJTIwaGFyYm9yJTIwcG9ydCUyMGFlcmlhbHxlbnwxfHx8fDE3NzM5MTA1MDF8MA&ixlib=rb-4.1.0&q=80&w=1080" },
      { name: "仪征锚泊区", km: "288.5", note: "大风天气需加强锚泊措施", subType: "待泊锚地", params: [{ label: "容量", value: "20艘" }, { label: "水深", value: "10-13m" }, { label: "底质", value: "泥质" }], photo: "https://images.unsplash.com/photo-1630437261590-63c33ea54bd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaGlwcyUyMGFuY2hvcmVkJTIwaGFyYm9yJTIwcG9ydCUyMGFlcmlhbHxlbnwxfHx8fDE3NzM5MTA1MDF8MA&ixlib=rb-4.1.0&q=80&w=1080" },
    ]},
    { type: "横越水域", count: 2, items: [
      { name: "龙潭横越水域", km: "313.0", note: "船舶横越频繁，加强了望，控制航速", subType: "港区横越", params: [{ label: "横越船舶", value: "日均80艘" }, { label: "横越宽度", value: "2.1km" }, { label: "管制", value: "VTS监控" }], photo: "https://images.unsplash.com/photo-1700129939400-a2849fd92b34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXZlciUyMGNyb3NzaW5nJTIwd2F0ZXJ3YXklMjBib2F0cyUyMHRyYWZmaWN8ZW58MXx8fHwxNzczOTEwNDk4fDA&ixlib=rb-4.1.0&q=80&w=1080" },
      { name: "江阴横越水域", km: "234.0", note: "大型船舶横越，需提前与VTS联系", subType: "航道横越", params: [{ label: "横越船舶", value: "日均120艘" }, { label: "横越宽度", value: "2.8km" }, { label: "管制", value: "报告制" }], photo: "https://images.unsplash.com/photo-1700129939400-a2849fd92b34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXZlciUyMGNyb3NzaW5nJTIwd2F0ZXJ3YXklMjBib2F0cyUyMHRyYWZmaWN8ZW58MXx8fHwxNzczOTEwNDk4fDA&ixlib=rb-4.1.0&q=80&w=1080" },
    ]},
  ],
  warnings: [
    { level: "紧急", title: "长江南京段#15浮标临时调整", content: "#15红浮调整至北偏50米位置，航经船舶注意辨识。" },
    { level: "管制", title: "江阴大桥段单向通航管制", content: "3月20日08:00-12:00实施单向通航管制。" },
  ],
  weather: [
    { area: "南京段", temp: "12-18°C", wind: "东南风3级", visibility: "8km" },
    { area: "江阴段", temp: "10-16°C", wind: "东南风4级", visibility: "5km" },
  ],
  hydro: [
    { station: "高要站", waterLevel: "5.2m", flow: "18000m³/s", tide: "落潮中，低潮预16:00" },
    { station: "封开站", waterLevel: "6.1m", flow: "22000m³/s", tide: "涨潮中，高潮预计14:30" },
    { station: "三水站", waterLevel: "4.8m", flow: "15000m³/s", tide: "平潮，转涨预计17:00" },
  ],
  route: {
    distance: "约320公里",
    time: "约18-22小时",
    waypoints: [
      { label: "南京港出发" },
      { label: "南京长江大桥", type: "桥梁", note: "通过3#~5#通航孔，净空24m，注意桥墩水流变化，保持安全航速。" },
      { label: "栖霞山渡口", type: "渡口", note: "客渡船频繁横越航道，加强了望，鸣笛示警，避免追越。" },
      { label: "龙潭水域", type: "商渔密集区", note: "商船及渔船密集，控制航速，加强VHF值守，保持安全距离。" },
      { label: "城北水厂取水口", type: "取水口", note: "禁止锚泊、排污，保持足够横距通过。" },
      { label: "润扬大桥", type: "桥梁", note: "主通航孔通过，净空50m，净宽760m，注意桥区水流偏压。" },
      { label: "江阴长江大桥", type: "桥梁", note: "主航道通航，3月20日08:00-12:00单向通航管制，提前联系VTS。" },
      { label: "安全抵达上海港" },
    ],
  },
};

const quickQuestions = [
  { icon: Ship, text: "查询南京到海航线风险" },
  { icon: AlertTriangle, text: "今日长江航行警告" },
  { icon: Cloud, text: "南京段气象水文" },
];

const typeIcons: Record<string, typeof Landmark> = {
  "桥梁": Landmark, "渡口": Ship, "取水口": Droplets, "商渔密集区": Anchor, "临时锚泊区": Anchor, "横越水域": Navigation,
};

/* ─── Glass Card Wrapper ─── */
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

/* ─── Typing Dots ─── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[5px] h-[5px] rounded-full bg-[#1677ff]/50"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

/* ─── Agent Status Pills ─── */
function AgentStatus({ agents }: { agents: AgentInfo[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-2.5">
      {agents.map((a, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-md border transition-all duration-500 ${
            a.status === "done"
              ? "bg-[#1677ff]/10 border-[#1677ff]/20"
              : "bg-white/40 border-white/30"
          }`}
        >
          <Bot size={10} className={a.status === "done" ? "text-[#1677ff]" : "text-gray-400"} />
          <span className={`text-[10px] ${a.status === "done" ? "text-[#1677ff]" : "text-gray-500"}`}>{a.name}</span>
          {a.status === "done" ? (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Sparkles size={9} className="text-amber-400" />
            </motion.span>
          ) : (
            <span className="flex gap-0.5">
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="w-1 h-1 rounded-full bg-[#1677ff]/40"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                />
              ))}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ── Risk Report Card ─── */
function RiskReportCard({ report }: { report: RiskReport }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [expandedWaypoint, setExpandedWaypoint] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-2.5 mt-1"
    >
      {/* Ship summary */}
      <div className="bg-gradient-to-br from-[#1677ff]/80 to-[#4d9fff]/70 backdrop-blur-xl rounded-2xl p-3.5 border border-white/20">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Ship size={16} className="text-white" />
          </div>
          <span className="text-white text-[14px]">{report.shipName}</span>
        </div>
        <div className="flex items-center gap-2 text-white/80 text-[12px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            {report.origin}
          </div>
          <div className="flex-1 border-t border-dashed border-white/30 mx-1 relative">
            <Navigation size={10} className="text-white/60 absolute -top-[5px] left-1/2 -translate-x-1/2" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            {report.destination}
          </div>
        </div>
      </div>

      {/* Nav Elements */}
      <GlassCard>
        <div className="px-3.5 py-3 flex items-center gap-2.5 border-b border-black/[0.04]">
          <div className="w-7 h-7 rounded-lg bg-[#1677ff]/10 flex items-center justify-center">
            <Navigation size={14} className="text-[#1677ff]" />
          </div>
          <span className="text-[13px] text-gray-800">通航要素</span>
          <span className="text-[10px] text-gray-400 ml-auto">{report.elements.reduce((s, e) => s + e.count, 0)}处风险点</span>
        </div>
        {report.elements.map((el) => {
          const expanded = expandedSection === el.type;
          const Icon = typeIcons[el.type] || Anchor;
          return (
            <div key={el.type} className="border-b border-black/[0.03] last:border-0">
              <button
                onClick={() => setExpandedSection(expanded ? null : el.type)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 active:bg-black/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#1677ff]/[0.07] flex items-center justify-center">
                    <Icon size={12} className="text-[#1677ff]" />
                  </div>
                  <span className="text-[12px] text-gray-700">{el.type}</span>
                  <span className="bg-[#1677ff]/8 text-[#1677ff] text-[10px] px-2 py-[1px] rounded-full">{el.count}</span>
                </div>
                <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} className="text-gray-300" />
                </motion.div>
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3.5 pb-2.5 space-y-1.5">
                      {el.items.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="bg-black/[0.02] backdrop-blur rounded-xl p-2.5 overflow-hidden"
                        >
                          {item.photo && (
                            <div className="relative -mx-2.5 -mt-2.5 mb-2 h-28 overflow-hidden rounded-t-xl">
                              <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                              {item.subType && (
                                <span className="absolute bottom-1.5 left-2 text-[9px] text-white/90 bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded-md">{item.subType}</span>
                              )}
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-[12px] text-gray-800">{item.name}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-100/60 px-1.5 py-0.5 rounded">KM {item.km}</span>
                          </div>
                          {item.params && item.params.length > 0 && (
                            <div className={`grid gap-1.5 mt-1.5 ${item.params.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                              {item.params.map((p, pi) => (
                                <div key={pi} className="bg-[#1677ff]/[0.05] rounded-lg px-2 py-1.5 text-center">
                                  <p className="text-[9px] text-gray-400">{p.label}</p>
                                  <p className="text-[11px] text-[#1677ff]">{p.value}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] text-gray-500 mt-1.5">{item.note}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </GlassCard>

      {/* Warnings */}
      <GlassCard>
        <div className="px-3.5 py-3 flex items-center gap-2.5 border-b border-black/[0.04]">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <AlertTriangle size={14} className="text-orange-500" />
          </div>
          <span className="text-[13px] text-gray-800">航行警告</span>
          <span className="ml-auto bg-red-500/10 text-red-500 text-[10px] px-2 py-0.5 rounded-full">{report.warnings.length}条</span>
        </div>
        <div className="p-3 space-y-2">
          {report.warnings.map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl p-3 border border-black/[0.04]"
              style={{ background: w.level === "紧急" ? "rgba(239,68,68,0.04)" : "rgba(147,51,234,0.04)" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] text-white px-2 py-0.5 rounded-md ${
                  w.level === "紧急" ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-purple-500 to-purple-400"
                }`}>{w.level}</span>
                <span className="text-[12px] text-gray-800">{w.title}</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{w.content}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Weather & Hydro */}
      <GlassCard>
        <div className="px-3.5 py-3 flex items-center gap-2.5 border-b border-black/[0.04]">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Cloud size={14} className="text-cyan-500" />
          </div>
          <span className="text-[13px] text-gray-800">气象水文</span>
          <span className="text-[10px] text-gray-400 ml-auto">{report.weather[0]?.wind} · 能见度{report.weather[0]?.visibility} · {report.weather[0]?.temp}</span>
        </div>
        <div className="p-3 space-y-2">
          {report.weather.map((seg, i) => (
            <div key={i} className="rounded-xl p-2.5 bg-gradient-to-br from-cyan-50/60 to-blue-50/40 border border-cyan-100/40">
              <span className="text-[12px] text-[#1677ff] block mb-1.5">{seg.area}</span>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[10px] text-gray-600">
                <span className="flex items-center gap-1.5"><ThermometerSun size={10} className="text-orange-400" /> {seg.temp}</span>
                <span className="flex items-center gap-1.5"><Wind size={10} className="text-blue-400" /> {seg.wind}</span>
                <span className="flex items-center gap-1.5"><Eye size={10} className="text-gray-400" /> 能见度 {seg.visibility}</span>
                <span className="flex items-center gap-1.5"><Waves size={10} className="text-cyan-400" /> 浮浪 0.5-1.0m</span>
              </div>
            </div>
          ))}
          {(Array.isArray(report.hydro) ? report.hydro : []).map((h, i) => (
            <div key={i} className="rounded-xl p-2.5 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100/40">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Gauge size={11} className="text-indigo-400" />
                <span className="text-[12px] text-indigo-500">{h.station}</span>
              </div>
              <div className="grid grid-cols-2 gap-y-1 gap-x-3 text-[10px] text-gray-600">
                <span className="flex items-center gap-1.5"><Waves size={10} className="text-blue-400" /> 水位 {h.waterLevel}</span>
                <span className="flex items-center gap-1.5"><Gauge size={10} className="text-indigo-400" /> 流量 {h.flow}</span>
                <span className="col-span-2 flex items-center gap-1.5"><Navigation size={10} className="text-cyan-400" /> {h.tide}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Route */}
      <GlassCard>
        <div className="px-3.5 py-3 flex items-center gap-2.5 border-b border-black/[0.04]">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Navigation size={14} className="text-emerald-500" />
          </div>
          <span className="text-[13px] text-gray-800">推荐航路</span>
          <div className="ml-auto flex gap-2 text-[10px] text-gray-400">
            <span>{report.route.distance}</span>
            <span>·</span>
            <span>{report.route.time}</span>
          </div>
        </div>
        <div className="p-3.5 pl-8 relative">
          <div className="absolute left-[27px] top-5 bottom-5 w-[1.5px] bg-gradient-to-b from-emerald-400 via-[#1677ff] to-red-400" />
          {report.route.waypoints.map((wp, i) => {
            const isFirst = i === 0;
            const isLast = i === report.route.waypoints.length - 1;
            const hasNote = !!wp.type && !!wp.note;
            const isExpanded = expandedWaypoint === i;
            const WpIcon = wp.type ? (typeIcons[wp.type] || Anchor) : Navigation;
            const typeColors: Record<string, string> = {
              "桥梁": "bg-indigo-500", "渡口": "bg-amber-500", "取水口": "bg-cyan-500", "商渔密集区": "bg-orange-500",
            };
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="relative pb-4 last:pb-0"
              >
                {/* Node dot */}
                <div className={`absolute left-[-17px] w-5 h-5 rounded-full flex items-center justify-center shadow-md ${
                  isFirst
                    ? "bg-gradient-to-br from-emerald-400 to-emerald-500"
                    : isLast
                    ? "bg-gradient-to-br from-red-400 to-red-500"
                    : wp.type
                    ? (typeColors[wp.type] || "bg-[#1677ff]")
                    : "bg-gradient-to-br from-[#1677ff] to-[#4d9fff]"
                }`}>
                  <WpIcon size={10} className="text-white" />
                </div>
                {/* Content */}
                <div className="ml-2.5">
                  {hasNote ? (
                    <button
                      onClick={() => setExpandedWaypoint(isExpanded ? null : i)}
                      className="w-full text-left active:opacity-70 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-gray-800">{wp.label}</span>
                        {wp.type && (
                          <span className={`ml-auto text-[9px] text-white px-1.5 py-[1px] rounded-md ${typeColors[wp.type] || "bg-gray-400"}`}>{wp.type}</span>
                        )}
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={12} className="text-gray-300" />
                        </motion.div>
                      </div>
                    </button>
                  ) : (
                    <span className="text-[12px] text-gray-700">{wp.label}</span>
                  )}
                  <AnimatePresence>
                    {isExpanded && wp.note && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1.5 bg-black/[0.03] rounded-lg px-3 py-2">
                          <div className="flex items-start gap-1.5">
                            <AlertTriangle size={10} className="text-amber-500 mt-[2px] shrink-0" />
                            <p className="text-[10px] text-gray-600 leading-relaxed">{wp.note}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ─── Main App ─── */
export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      type: "text",
      content: "您好，我是海青君，您的通航风险查询助。请输入船名、始发港和目的港，我将协调四个智能体为您分析航线上的通航要素、航行警告、气象水文和推荐航路。\n\n例如：「鲁枣庄货3738，南京港到上海港」",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const simulateAgentResponse = (userText: string) => {
    setIsLoading(true);
    const agentMsgId = "agent-" + Date.now();
    const isRiskQuery = /到|航线|风险|查询/.test(userText);

    if (isRiskQuery) {
      const allAgents: AgentInfo[] = [
        { name: "航线分析", status: "working" },
        { name: "风险评估", status: "working" },
        { name: "气象水文", status: "working" },
        { name: "航警播报", status: "working" },
      ];

      setMessages((prev) => [
        ...prev,
        { id: agentMsgId, role: "agent", type: "text", content: "__loading__", agents: [...allAgents] },
      ]);

      const agentTimers = [800, 1500, 2200, 2800];
      agentTimers.forEach((delay, idx) => {
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentMsgId
                ? { ...m, agents: m.agents?.map((a, i) => i <= idx ? { ...a, status: "done" as const } : a) }
                : m
            )
          );
        }, delay);
      });

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMsgId
              ? { ...m, type: "risk-report", content: undefined, report: mockReport, agents: m.agents?.map((a) => ({ ...a, status: "done" as const })) }
              : m
          )
        );
        setIsLoading(false);
      }, 3200);
    } else {
      // Normal chat - no agents, just a text reply
      setMessages((prev) => [
        ...prev,
        { id: agentMsgId, role: "agent", type: "text", content: "__loading__" },
      ]);

      setTimeout(() => {
        const replies: Record<string, string> = {
          "default": "目前我可以帮您查询航线通航风险。请提供船名、始发港和目的港，例如：「鲁枣庄货3738，南京港到上海港」",
        };
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMsgId
              ? { ...m, content: replies["default"] }
              : m
          )
        );
        setIsLoading(false);
      }, 800);
    }
  };

  const handleSend = (text?: string) => {
    const content = text || input.trim();
    if (!content || isLoading) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: "user-" + Date.now(), role: "user", type: "text", content },
    ]);
    simulateAgentResponse(content);
  };

  const showWelcome = messages.length <= 1;

  return (
    <div className="h-screen flex flex-col max-w-md mx-auto relative overflow-hidden bg-[#f0f3f8]">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#1677ff]/[0.08] rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-64 h-64 bg-cyan-400/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-0 w-48 h-48 bg-purple-400/[0.05] rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative shrink-0 z-10">
        <div className="bg-gradient-to-br from-[#1060e0] via-[#1677ff] to-[#5a9fff] px-5 pt-7 pb-2.5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-white text-[17px] tracking-tight">七星北导</h1>
              <p className="text-white/50 text-[11px] mt-0.5">你的通航安全航行助手</p>
            </div>
          </div>
        </div>
        {/* Soft edge fade */}
        <div className="h-6 bg-gradient-to-b from-[#1677ff]/10 to-transparent" />
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 pb-4 relative z-10">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className={`flex mb-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "agent" && (
                <div className="w-8 h-8 rounded-xl overflow-hidden mr-2.5 mt-1 shrink-0 shadow-md shadow-blue-500/20 border border-white/30">
                  <img src={avatarImg} alt="海青君" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="max-w-[82%]">
                {msg.agents && <AgentStatus agents={msg.agents} />}
                {msg.type === "risk-report" && msg.report ? (
                  <RiskReportCard report={msg.report} />
                ) : (
                  <div
                    className={`rounded-[18px] px-4 py-3 text-[13px] leading-[1.65] ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-[#1677ff] to-[#3d8eff] text-white rounded-br-md shadow-lg shadow-blue-500/15"
                        : "bg-white/70 backdrop-blur-xl text-gray-700 rounded-bl-md shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-white/60"
                    }`}
                  >
                    {msg.content === "__loading__" ? <TypingDots /> : msg.content?.split("\n").map((line, i) => (
                      <span key={i}>{line}{i < (msg.content?.split("\n").length ?? 1) - 1 && <br />}</span>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center ml-2.5 mt-1 shrink-0">
                  <User size={14} className="text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Quick questions on welcome */}
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2 space-y-2"
          >
            <p className="text-[11px] text-gray-400 px-1 mb-2">快速开始</p>
            {quickQuestions.map((q, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                onClick={() => handleSend(q.text)}
                className="w-full flex items-center gap-3 bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl px-4 py-3 text-left active:scale-[0.98] transition-transform shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
              >
                <div className="w-8 h-8 rounded-xl bg-[#1677ff]/[0.08] flex items-center justify-center shrink-0">
                  <q.icon size={14} className="text-[#1677ff]" />
                </div>
                <span className="text-[13px] text-gray-700">{q.text}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative shrink-0 z-10">
        <div className="h-4 bg-gradient-to-t from-white/80 to-transparent" />
        <div className="bg-white/70 backdrop-blur-2xl border-t border-white/50 px-4 pb-8 pt-3">
          <div className="flex items-center gap-2.5">
            <div className="flex-1 flex items-center bg-black/[0.04] backdrop-blur rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#1677ff]/20 transition-shadow border border-black/[0.03]">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="输入船名、始发港和目的港..."
                className="flex-1 bg-transparent text-[13px] text-gray-800 placeholder-gray-400 outline-none"
                disabled={isLoading}
              />
              <button className="ml-2 text-gray-300 active:text-gray-500 transition-colors">
                <Mic size={18} />
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="w-11 h-11 bg-gradient-to-br from-[#1677ff] to-[#3d8eff] rounded-2xl flex items-center justify-center disabled:opacity-30 shadow-lg shadow-blue-500/25 shrink-0 active:shadow-sm transition-shadow"
            >
              <Send size={17} className="text-white -translate-x-[1px]" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
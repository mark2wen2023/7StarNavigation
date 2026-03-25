import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send, Bot, Sparkles, Ship, Anchor,
  AlertTriangle, Cloud, Navigation, Landmark, ChevronDown,
  Waves, Wind, ThermometerSun, Eye, Gauge, Droplets, User, Mic, Construction, MessageSquare, Map
} from "lucide-react";
import { createBrowserRouter, RouterProvider } from "react-router";
import avatarImg from "figma:asset/ca8a37f0563d82a26b9475bd87394c3fbee9f641.png";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { MapView } from "./components/MapView";

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
  elements: { type: string; count: number; items: { name: string; km: string; note: string; subType?: string; params?: { label: string; value: string }[]; photo?: string; bridgeClearance?: any }[] }[];
  warnings: { level: string; title: string; content: string }[];
  weather: { area: string; temp: string; wind: string; visibility: string }[];
  hydro: { station: string; waterLevel: string; flow: string; tide: string }[];
  route: { 
    distance: string; 
    time: string; 
    waypoints: { 
      label: string; 
      type?: string; 
      note?: string;
      relatedWarnings?: { level: string; title: string; content: string }[];
      relatedRules?: { title: string; category: string; content: string; priority: string }[];
      relatedRisks?: { title: string; riskLevel: string; location: string; description: string; mitigation: string }[];
    }[] 
  };
  relatedRules?: { title: string; category: string; content: string; priority: string }[];
  relatedRisks?: { title: string; riskLevel: string; location: string; description: string; mitigation: string }[];
  msaOffices?: { name: string; level: string; dutyPhone: string; emergencyPhone: string; kmRange: string; note: string }[];
}

/* ─── Photo map for element types (frontend enrichment) ─── */
const typePhotoMap: Record<string, string[]> = {
  "桥梁": [
    "https://images.unsplash.com/photo-1773634743995-6ed31e95f730?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    "https://images.unsplash.com/photo-1686074097829-a9788748a8e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    "https://images.unsplash.com/photo-1763865454238-ecfd105986c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  ],
  "渡口": [
    "https://images.unsplash.com/photo-1688880733698-47eb42a96f88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    "https://images.unsplash.com/photo-1661105665021-f9e8ef9cf6d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  ],
  "取水口": [
    "https://images.unsplash.com/photo-1666413767635-78c79a06b4db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    "https://images.unsplash.com/photo-1762885745196-4df6e915a678?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  ],
  "商渔密集区": [
    "https://images.unsplash.com/photo-1689701692313-601c6e782f94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    "https://images.unsplash.com/photo-1766744257228-dc1cd055045c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  ],
  "临时锚泊区": [
    "https://images.unsplash.com/photo-1640269892407-ebc38e0f0c54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    "https://images.unsplash.com/photo-1647278706706-c3ffd820ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  ],
  "横越水域": [
    "https://images.unsplash.com/photo-1765321264162-4f76fb89ff64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    "https://images.unsplash.com/photo-1731662333563-ec92fbf087b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
  ],
};

/** Enrich report from API with photos */
function enrichReportWithPhotos(report: RiskReport): RiskReport {
  return {
    ...report,
    elements: report.elements.map((el) => ({
      ...el,
      items: el.items.map((item, idx) => ({
        ...item,
        photo: (typePhotoMap[el.type] || [])[idx % (typePhotoMap[el.type]?.length || 1)] || undefined,
      })),
    })),
  };
}

/** Parse user input to extract ship name, origin, destination */
function parseRouteQuery(text: string): { ship: string; origin: string; dest: string } {
  // Try common patterns: "船名，始发港到目的港" or "船名 始发港到目的港"
  const match = text.match(/(.+?)[，,\s]+(.+?)(到|→|->|至)(.+)/);
  if (match) {
    return { ship: match[1].trim(), origin: match[2].trim(), dest: match[4].trim() };
  }
  // Default
  return { ship: "未知船舶", origin: "肇庆港", dest: "广州港" };
}

/* ─── Local fallback data (used when backend API is unavailable) ─── */
function getLocalFallbackReport(ship: string, origin: string, dest: string): RiskReport {
  return {
    shipName: ship,
    origin,
    destination: dest,
    elements: [
      { type: "桥梁", count: 3, items: [
        { name: "肇庆西江大桥", km: "218.5", note: "公路桥，注意桥墩水流变化和限速规定", subType: "公路梁桥", params: [{ label: "通航孔", value: "2#~4#孔" }, { label: "净空", value: "18m" }, { label: "净宽", value: "150m" }] },
        { name: "高要大桥", km: "195.0", note: "注意桥区水流偏压，限速通行", subType: "公路桥", params: [{ label: "通航孔", value: "主通航孔" }, { label: "净空", value: "20m" }, { label: "净宽", value: "180m" }] },
        { name: "三水大桥", km: "128.0", note: "临近北江汇流区，水流复杂，加强了望", subType: "公路桥", params: [{ label: "通航孔", value: "主通航孔" }, { label: "净空", value: "22m" }, { label: "净宽", value: "200m" }] },
      ]},
      { type: "渡口", count: 2, items: [
        { name: "德庆渡口", km: "185.5", note: "客渡频繁横越航道，注意避让，鸣笛示警", subType: "客渡", params: [{ label: "航班", value: "每20分钟" }, { label: "横越宽度", value: "0.8km" }, { label: "高峰时段", value: "7-9时" }] },
        { name: "高要渡口", km: "192.0", note: "汽渡横越，大型车辆运输频繁", subType: "汽渡", params: [{ label: "航班", value: "每30分钟" }, { label: "横越宽度", value: "1.0km" }, { label: "载重", value: "50吨" }] },
      ]},
      { type: "取水口", count: 2, items: [
        { name: "肇庆水厂取水口", km: "215.3", note: "禁止锚泊、排污，保持足够横距", subType: "市政取水", params: [{ label: "管道深度", value: "6m" }, { label: "禁锚范围", value: "上下各200m" }, { label: "标志", value: "白色灯桩" }] },
        { name: "三水水厂取水口", km: "130.5", note: "禁止锚泊，注意灯标标识", subType: "工业取水", params: [{ label: "管道深度", value: "7m" }, { label: "禁锚范围", value: "上下各150m" }, { label: "标志", value: "红色灯桩" }] },
      ]},
      { type: "商渔密集区", count: 2, items: [
        { name: "高要水域", km: "200-195", note: "商船及渔船密集，控制航速，加强VHF值守", subType: "商渔混合", params: [{ label: "日均船舶", value: "200+艘" }, { label: "高峰时段", value: "6-10时" }, { label: "限速", value: "8节" }] },
        { name: "三水汇流水域", km: "130-125", note: "北江西江汇流处，船舶交汇密集，注意避让", subType: "汇流交汇区", params: [{ label: "渔船数量", value: "约40艘" }, { label: "作业方式", value: "定置网" }, { label: "密集时段", value: "凌晨4-8时" }] },
      ]},
      { type: "临时锚泊区", count: 2, items: [
        { name: "肇庆临时锚泊区", km: "210.0", note: "限制锚泊船舶数量，注意走锚风险", subType: "临时锚地", params: [{ label: "容量", value: "12艘" }, { label: "水深", value: "8-12m" }, { label: "底质", value: "泥沙" }] },
        { name: "高要锚泊区", km: "198.0", note: "大风天气需加强锚泊措施", subType: "待泊锚地", params: [{ label: "容量", value: "15艘" }, { label: "水深", value: "7-10m" }, { label: "底质", value: "泥质" }] },
      ]},
      { type: "横越水域", count: 2, items: [
        { name: "德庆横越水域", km: "186.0", note: "船舶横越频繁，加强了望，控制航速", subType: "港区横越", params: [{ label: "横越船舶", value: "日均50艘" }, { label: "横越宽度", value: "1.2km" }, { label: "管制", value: "VTS监控" }] },
        { name: "三水横越水域", km: "129.0", note: "北江西江交汇，大型船舶横越需提前与VTS联系", subType: "航道横越", params: [{ label: "横越船舶", value: "日均80艘" }, { label: "横越宽度", value: "1.8km" }, { label: "管制", value: "报告制" }] },
      ]},
    ],
    warnings: [
      { level: "紧急", title: "西江肇庆段#12浮标临时调整", content: "#12红浮调整至南偏30米位置，航经船舶注意辨识。" },
      { level: "管制", title: "高要大桥段单向通航管制", content: "3月20日08:00-12:00实施单向通航管制。" },
    ],
    weather: [
      { area: "肇庆段", temp: "18-26°C", wind: "东南风3级", visibility: "8km" },
      { area: "三水段", temp: "19-27°C", wind: "南风3-4级", visibility: "6km" },
    ],
    hydro: [
      { station: "高���站", waterLevel: "5.2m", flow: "18000m³/s", tide: "落潮中，预计低潮时间16:00" },
      { station: "三水站", waterLevel: "4.8m", flow: "15000m³/s", tide: "平潮，预计转涨潮时间17:00" },
    ],
    route: {
      distance: "约110公里",
      time: "约6-8小时",
      waypoints: [
        { label: `${origin}出发` },
        { label: "肇庆西江大桥", type: "桥梁", note: "通航孔2#~4#孔，净空18m，净宽150m。公路桥，注意桥墩水流变化和限速规定" },
        { label: "肇庆水厂取水口", type: "取水口", note: "管道深度6m，禁锚范围上下各200m。禁止锚泊、排污，保持足够横距" },
        { label: "肇庆临时锚泊区", type: "临时锚泊区", note: "容量12艘，水深8-12m。限制锚泊船舶数量，注意走锚风险" },
        { label: "高要水域", type: "商渔密集区", note: "日均船舶200+艘，限速8节。商船及渔船密集，控制航速" },
        { label: "高要锚泊区", type: "临时锚泊区", note: "容量15艘，水深7-10m。大风天气需加强锚泊措施" },
        { label: "高要大桥", type: "桥梁", note: "通航孔主通航孔，净空20m，净宽180m。注意桥区水流偏压，限速通行" },
        { label: "高要渡口", type: "渡口", note: "航班每30分钟，横越���度1.0km。��渡横越，大型车辆运输频繁" },
        { label: "德庆横越水域", type: "横越水域", note: "横越船舶日均50艘。船舶横越频繁，加强了望，控制航速" },
        { label: "德庆渡口", type: "渡口", note: "航班每20分钟，横越宽度0.8km。客渡频繁横越航道，注意避让" },
        { label: "三水水厂取水口", type: "取水口", note: "管道深度7m，禁锚范围上下各150m。禁止锚泊，注意灯标标识" },
        { label: "三水汇流水域", type: "商渔密集区", note: "渔船约40艘，定置网作业。北江西江汇流处，船舶交汇密集" },
        { label: "三水横越水域", type: "横越水域", note: "横越船舶日均80艘。北江西江交汇，大型船舶横越需提前与VTS联系" },
        { label: "三水大桥", type: "桥梁", note: "通航孔主通航孔，净空22m，净宽200m。临近北江汇流区，水流复杂" },
        { label: `安全抵达${dest}` },
      ],
    },
    relatedRules: [
      { title: "桥梁水域富裕净空高度规定", category: "通航要求", content: "船舶通过设计净空高度18米及以上的内河桥梁水域，应保留2米以上富裕净空高度；通过其他内河桥梁水域，应保留1米以上富裕净空高度。", priority: "强制" },
      { title: "西江干线桥区限速规定", category: "速度管理", content: "船舶通过桥梁桥区��，必须减速至8节以下；能见度小于2公里时，限速6节；夜间通过桥区限速6节。严禁在桥区追越、并行。", priority: "强制" },
      { title: "商渔密集区航行规范", category: "通航要求", content: "船舶进入商渔密集区前，应提前降速至8节以下；保持VHF 16频道值守，与渔船保持有效沟通；夜间航行开启所有航行灯和探照灯。", priority: "强制" },
    ],
    relatedRisks: [
      { title: "高要大桥桥墩追越碰撞高风险点", riskLevel: "高", location: "西江高要大桥桥区（K342-K343）", description: "2015-2025年间统计，高要大桥桥区发生6起船舶碰撞桥墩事故，其中4起为追越不当导致。主要原因：桥区水域狭窄、商渔船混合交通流量大。", mitigation: "建议措施：1）桥区全面禁止追越；2）能见度<2km时限速6节；3）夜间加强桥墩灯光标识。" },
      { title: "德庆渡口横越冲突风险", riskLevel: "高", location: "德庆渡口（K312）", description: "德庆渡口是西江干线客流量最大的渡口，日均横越120艘次。渡口航线与��航道垂直交叉，高峰时段每5分钟就有一艘渡船横越。", mitigation: "建议措施：1）高峰时段渡船与主航道船舶VHF实时沟通；2）渡船等��主航���船舶先行后再横越；3）主航道船舶经过渡口时减速至8节以下。" },
      { title: "商渔密集区碰撞风险", riskLevel: "高", location: "高要水域商渔密集区（K340-K345）", description: "该水域商船和渔船混合作业，日均船舶200+艘。高峰时段船舶密度极大，加之部分渔船VHF未开启，碰撞风险高。", mitigation: "建议措施：1）商船控制航速≤8节；2）加强VHF值守；3）夜间加强瞭望；4）渔船强制开启AIS或VHF。" },
    ],
    msaOffices: [
      { name: "肇庆海事局", level: "分局", dutyPhone: "0758-2833110", emergencyPhone: "0758-2833119", kmRange: "K260-K350", note: "负责肇庆市辖区内河航道监督管理、船舶交通安全、防污染监督等工作" },
      { name: "封开海事处", level: "海事处", dutyPhone: "0758-6689110", emergencyPhone: "0758-6689119", kmRange: "K260-K295", note: "负责封开县辖���水域，包括长岗码头、大洲镇水域、金装镇水域等" },
      { name: "德庆海事处", level: "海事处", dutyPhone: "0758-7766110", emergencyPhone: "0758-7766119", kmRange: "K295-K322", note: "负责德庆县辖区水域，包括德庆石井码头、德庆渡口、悦城水域等" },
      { name: "高要海事处", level: "海事处", dutyPhone: "0758-8383110", emergencyPhone: "0758-8383119", kmRange: "K322-K350", note: "负责高要区辖区水域，包括肇庆西江大桥、高要大桥、三榕港、高要港区等重点区域" },
    ],
  };
}

function getLocalFallbackWarnings(): string {
  return "1. 【紧急】西江肇庆段#12浮标临时调整\n   #12红浮调整至南偏30米位置，航经船舶注意辨识。\n\n2. 【管制】高要大桥段单向通航管制\n   3月20日08:00-12:00实施单向通航管制。";
}

function getLocalFallbackWeather(): string {
  return "气象信息：\n肇庆段：18-26°C，东南风3级，能见度8km\n三水段：19-27°C，南风3-4级，能见度6km\n\n水文信息：\n高要站：水位5.2m，流量18000m³/s，落潮中，预计低潮时间16:00\n三水站：水位4.8m，流量15000m³/s，平潮，预计转涨潮时间17:00";
}

/** Fetch report from backend API with local fallback */
async function fetchReport(ship: string, origin: string, dest: string): Promise<RiskReport> {
  try {
    // 从 localStorage 读取所有真实数据
    const elementsRaw = localStorage.getItem("qxbd_elements");
    const rulesRaw = localStorage.getItem("qxbd_navigationRules");
    const risksRaw = localStorage.getItem("qxbd_navigationRisks");
    const routesRaw = localStorage.getItem("qxbd_routes");
    const msaRaw = localStorage.getItem("qxbd_msaOffices");
    const hydrosRaw = localStorage.getItem("qxbd_hydros");
    const weathersRaw = localStorage.getItem("qxbd_weathers");
    const warningsRaw = localStorage.getItem("qxbd_warnings");

    const elements = elementsRaw ? JSON.parse(elementsRaw) : [];
    const navigationRules = rulesRaw ? JSON.parse(rulesRaw) : [];
    const navigationRisks = risksRaw ? JSON.parse(risksRaw) : [];
    const routes = routesRaw ? JSON.parse(routesRaw) : [];
    const msaOffices = msaRaw ? JSON.parse(msaRaw) : [];
    const hydros = hydrosRaw ? JSON.parse(hydrosRaw) : [];
    const weathers = weathersRaw ? JSON.parse(weathersRaw) : [];
    const warnings = warningsRaw ? JSON.parse(warningsRaw) : [];

    // 如果没有数据，使用硬编码fallback
    if (elements.length === 0) {
      console.warn("⚠️ 未找到通航要素数据，使用演示数据。请访问 /admin 初始化数据。");
      return enrichReportWithPhotos(getLocalFallbackReport(ship, origin, dest));
    }

    // 按类型分组通航要素，并添加桥梁净空信息
    const elementsByType: Record<string, any[]> = {};
    for (const el of elements) {
      if (!elementsByType[el.type]) elementsByType[el.type] = [];
      
      // 如果是桥梁，计算实时净空
      if (el.type === "桥梁") {
        try {
          const { calculateBridgeClearance } = await import("./components/admin/api");
          const clearance = await calculateBridgeClearance(el.id);
          elementsByType[el.type].push({
            name: el.name,
            km: el.km || "",
            note: el.note || "",
            subType: el.subType || "",
            params: el.params ? Object.entries(el.params).map(([label, value]) => ({ label, value: value as string })) : [],
            bridgeClearance: clearance, // 附加净空信息
          });
        } catch (e) {
          console.warn(`桥梁 ${el.name} 净空计算失败`, e);
          elementsByType[el.type].push({
            name: el.name,
            km: el.km || "",
            note: el.note || "",
            subType: el.subType || "",
            params: el.params ? Object.entries(el.params).map(([label, value]) => ({ label, value: value as string })) : [],
          });
        }
      } else {
        elementsByType[el.type].push({
          name: el.name,
          km: el.km || "",
          note: el.note || "",
          subType: el.subType || "",
          params: el.params ? Object.entries(el.params).map(([label, value]) => ({ label, value: value as string })) : [],
        });
      }
    }

    const elementGroups = Object.entries(elementsByType).map(([type, items]) => ({
      type,
      count: items.length,
      items,
    }));

    // 构建航行警告（只显示active状态）
    const activeWarnings = warnings
      .filter((w: any) => w.status === "active")
      .slice(0, 5)
      .map((w: any) => ({
        level: w.level || "通知",
        title: w.title || "",
        content: w.content || "",
      }));

    // 构建推荐航路waypoints
    const selectedRoute = routes.find((r: any) => 
      (r.origin === origin && r.destination === dest) ||
      (r.name && r.name.includes(origin) && r.name.includes(dest))
    );

    // 从elements中筛选重要通航要素（桥梁、渡口、取水口等）
    const importantTypes = ["桥梁", "渡口", "取水口", "横越区", "商渔密集区", "锚泊区", "水工水域", "码头"];
    const importantElements = elements
      .filter((el: any) => importantTypes.includes(el.type))
      .sort((a: any, b: any) => {
        // 按公里数排序（如果有的话）
        const kmA = parseFloat(a.km) || 0;
        const kmB = parseFloat(b.km) || 0;
        return kmA - kmB;
      })
      .map((el: any) => ({
        label: el.name,
        type: el.type,
        note: el.note,
        km: el.km,
      }));

    // 构建完整waypoints：起点 + 重要要素 + 终点
    let baseWaypoints = [
      { label: `${origin}出发`, type: "起点" },
      ...importantElements,
      { label: `安全抵达${dest}`, type: "终点" },
    ];

    // 为每个waypoint匹配相关的警告、规则和风��
    const waypoints = baseWaypoints.map((wp: any) => {
      const wpLabel = wp.label || "";
      const wpType = wp.type || "";
      
      // 匹配相关航行警告（location或title包含waypoint名称）
      const relatedWarnings = warnings
        .filter((w: any) => w.status === "active" && (
          (w.location && w.location.includes(wpLabel)) ||
          (w.title && w.title.includes(wpLabel)) ||
          (wpType && w.title && w.title.includes(wpType))
        ))
        .map((w: any) => ({
          level: w.level || "通知",
          title: w.title || "",
          content: w.content || "",
        }));

      // 匹配相关航行规则（applicableArea包含waypoint名称或类型）
      const relatedRules = navigationRules
        .filter((r: any) => r.status === "生效中" && (
          (r.applicableArea && r.applicableArea.includes(wpLabel)) ||
          (wpType && r.applicableArea && r.applicableArea.includes(wpType)) ||
          (wpType && r.ruleType && r.ruleType.includes(wpType))
        ))
        .map((r: any) => ({
          title: r.title || "",
          category: r.category || "",
          content: r.content || "",
          priority: r.priority || "建议",
        }));

      // 匹配相关通航风险（location包含waypoint名称）
      const relatedRisks = navigationRisks
        .filter((risk: any) => 
          (risk.location && risk.location.includes(wpLabel)) ||
          (wpType && risk.location && risk.location.includes(wpType))
        )
        .map((risk: any) => ({
          title: risk.title || "",
          riskLevel: risk.riskLevel || "中",
          location: risk.location || "",
          description: risk.description || "",
          mitigation: risk.mitigation || "",
        }));

      return {
        ...wp,
        relatedWarnings: relatedWarnings.length > 0 ? relatedWarnings : undefined,
        relatedRules: relatedRules.length > 0 ? relatedRules : undefined,
        relatedRisks: relatedRisks.length > 0 ? relatedRisks : undefined,
      };
    });

    // 过滤相关航行规则（根据applicableArea匹配）- 保留全局展示
    const relatedRules = navigationRules
      .filter((r: any) => r.status === "生效中")
      .slice(0, 5)
      .map((r: any) => ({
        title: r.title || "",
        category: r.category || "",
        content: r.content || "",
        priority: r.priority || "建议",
      }));

    // 过滤相关通航风险（根据location匹配）- 保留全局展示
    const relatedRisks = navigationRisks
      .slice(0, 5)
      .map((risk: any) => ({
        title: risk.title || "",
        riskLevel: risk.riskLevel || "中",
        location: risk.location || "",
        description: risk.description || "",
        mitigation: risk.mitigation || "",
      }));

    // 构建气象水文信息
    const weatherData = weathers.slice(0, 3).map((w: any) => ({
      area: w.area || "",
      temp: w.temp || "",
      wind: w.wind || "",
      visibility: w.visibility || "",
    }));

    const hydroData = hydros.slice(0, 3).map((h: any) => ({
      station: h.station || "",
      waterLevel: h.waterLevel || "",
      flow: h.flow || "",
      tide: h.tide || "",
    }));

    // 海事处信息（根据航线过滤相关的海事处）
    const relatedMsa = msaOffices.slice(0, 4).map((msa: any) => ({
      name: msa.name || "",
      level: msa.level || "",
      dutyPhone: msa.dutyPhone || "",
      emergencyPhone: msa.emergencyPhone || "",
      kmRange: msa.kmRange || "",
      note: msa.note || "",
    }));

    const report: RiskReport = {
      shipName: ship,
      origin,
      destination: dest,
      elements: elementGroups,
      warnings: activeWarnings,
      weather: weatherData,
      hydro: hydroData,
      route: {
        distance: selectedRoute?.distance || "约110公里",
        time: selectedRoute?.time || "约6-8小时",
        waypoints,
      },
      relatedRules,
      relatedRisks,
      msaOffices: relatedMsa,
    };

    return enrichReportWithPhotos(report);
  } catch (e) {
    console.error("读取数据失败，使用演示数据", e);
    return enrichReportWithPhotos(getLocalFallbackReport(ship, origin, dest));
  }
}

/** Fetch warnings from localStorage */
async function fetchWarnings(): Promise<string> {
  try {
    const raw = localStorage.getItem("qxbd_warnings");
    const warnings = raw ? JSON.parse(raw) : [];
    const active = warnings.filter((w: any) => w.status === "active");
    if (active.length === 0) return getLocalFallbackWarnings();
    return active.map((w: any, i: number) =>
      `${i + 1}. 【${w.level}】${w.title}\n   ${w.content}`
    ).join("\n\n");
  } catch {
    return getLocalFallbackWarnings();
  }
}

/** Fetch weather from localStorage */
async function fetchWeather(): Promise<string> {
  try {
    const rawW = localStorage.getItem("qxbd_weathers");
    const rawH = localStorage.getItem("qxbd_hydros");
    const weather = rawW ? JSON.parse(rawW) : [];
    const hydro = rawH ? JSON.parse(rawH) : [];
    if (weather.length === 0 && hydro.length === 0) return getLocalFallbackWeather();
    let result = "象信息：\n";
    weather.forEach((w: any) => {
      result += `${w.area}：${w.temp}，${w.wind}，能见度${w.visibility}\n`;
    });
    if (hydro.length > 0) {
      result += "\n水文信息：\n";
      hydro.forEach((h: any) => {
        result += `${h.station}：���位${h.waterLevel}，流量${h.flow}，${h.tide}\n`;
      });
    }
    return result.trim();
  } catch {
    return getLocalFallbackWeather();
  }
}

const quickQuestions = [
  { icon: Ship, text: "查询肇庆到广州航线风险" },
  { icon: AlertTriangle, text: "今日西江航行警告" },
  { icon: Cloud, text: "肇庆段气象水文" },
];

const typeIcons: Record<string, typeof Landmark> = {
  "桥梁": Landmark, "渡口": Ship, "取水口": Droplets, "商渔密集区": Anchor, "临时锚泊区": Anchor, 
  "横越区": Navigation, "横越水域": Navigation, "锚泊区": Anchor, "水工水域": Construction, "码头": Anchor,
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

/* ── Agent Status Pills ─── */
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
                  <span className="bg-[#1677ff]/[0.08] text-[#1677ff] text-[10px] px-2 py-[1px] rounded-full">{el.count}</span>
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
        <div className="p-3.5 relative">
          <div className="absolute left-12 top-5 bottom-5 w-[1.5px] bg-gradient-to-b from-emerald-400 via-[#1677ff] to-red-400" />
          {report.route.waypoints.map((wp, i) => {
            const isFirst = i === 0;
            const isLast = i === report.route.waypoints.length - 1;
            const hasContent = !!wp.note || (wp.relatedWarnings && wp.relatedWarnings.length > 0) || (wp.relatedRules && wp.relatedRules.length > 0) || (wp.relatedRisks && wp.relatedRisks.length > 0);
            const isExpanded = expandedWaypoint === i;
            const WpIcon = wp.type ? (typeIcons[wp.type] || Anchor) : Navigation;
            const typeColors: Record<string, string> = {
              "桥梁": "bg-indigo-500", "渡口": "bg-amber-500", "取水口": "bg-cyan-500", "商渔密集区": "bg-orange-500",
              "横越区": "bg-red-500", "锚泊区": "bg-blue-500", "水工水域": "bg-purple-500", "码头": "bg-teal-500",
            };
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="relative pb-4 last:pb-0"
              >
                {/* KM number on the left of vertical line */}
                {wp.km && (
                  <span className="absolute left-0 text-[9px] text-gray-400 bg-gray-100/60 px-1.5 py-0.5 rounded">{wp.km}km</span>
                )}
                {/* Node dot - centered on vertical line */}
                <div className={`absolute left-[38.25px] w-5 h-5 rounded-full flex items-center justify-center shadow-md ${
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
                {/* Content on the right of vertical line */}
                <div className="ml-[68px]">
                  {hasContent ? (
                    <button
                      onClick={() => setExpandedWaypoint(isExpanded ? null : i)}
                      className="w-full text-left active:opacity-70 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-gray-800">{wp.label}</span>
                        {/* 显示关联内容计数 */}
                        {(wp.relatedWarnings || wp.relatedRules || wp.relatedRisks) && (
                          <span className="bg-red-500/10 text-red-600 text-[8px] px-1.5 py-0.5 rounded-full">
                            {(wp.relatedWarnings?.length || 0) + (wp.relatedRules?.length || 0) + (wp.relatedRisks?.length || 0)}
                          </span>
                        )}
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={12} className="text-gray-300" />
                        </motion.div>
                        {/* Type tag aligned to the right */}
                        {wp.type && wp.type !== "起点" && wp.type !== "终点" && (
                          <span className={`ml-auto text-[9px] text-white px-1.5 py-[1px] rounded-md ${typeColors[wp.type] || "bg-gray-400"}`}>{wp.type}</span>
                        )}
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-gray-700">{wp.label}</span>
                      {/* Type tag aligned to the right */}
                      {wp.type && wp.type !== "起点" && wp.type !== "终点" && (
                        <span className={`ml-auto text-[9px] text-white px-1.5 py-[1px] rounded-md ${typeColors[wp.type] || "bg-gray-400"}`}>{wp.type}</span>
                      )}
                    </div>
                  )}
                  <AnimatePresence>
                    {isExpanded && hasContent && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1.5 space-y-1.5">
                          {/* 基本注意事项 */}
                          {wp.note && (
                            <div className="bg-black/[0.03] rounded-lg px-3 py-2">
                              <div className="flex items-start gap-1.5">
                                <AlertTriangle size={10} className="text-amber-500 mt-[2px] shrink-0" />
                                <p className="text-[10px] text-gray-600 leading-relaxed">{wp.note}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* 航行警告 */}
                          {wp.relatedWarnings && wp.relatedWarnings.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 px-2">
                                <AlertTriangle size={9} className="text-red-500" />
                                <span className="text-[9px] text-gray-500">航行警告 ({wp.relatedWarnings.length})</span>
                              </div>
                              {wp.relatedWarnings.map((warning, wi) => (
                                <div key={wi} className="bg-red-50/60 border border-red-100/60 rounded-lg px-2.5 py-2">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className={`text-[8px] text-white px-1.5 py-0.5 rounded ${
                                      warning.level === "紧急" ? "bg-red-500" : "bg-purple-500"
                                    }`}>{warning.level}</span>
                                    <span className="text-[10px] text-gray-800 font-medium">{warning.title}</span>
                                  </div>
                                  <p className="text-[9px] text-gray-600 leading-relaxed">{warning.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* 航行规则 */}
                          {wp.relatedRules && wp.relatedRules.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 px-2">
                                <Gauge size={9} className="text-amber-600" />
                                <span className="text-[9px] text-gray-500">航行规则 ({wp.relatedRules.length})</span>
                              </div>
                              {wp.relatedRules.map((rule, ri) => (
                                <div key={ri} className="bg-amber-50/60 border border-amber-100/60 rounded-lg px-2.5 py-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-gray-800 font-medium">{rule.title}</span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                                      rule.priority === "强制" ? "bg-red-500/20 text-red-700" : "bg-blue-500/20 text-blue-700"
                                    }`}>{rule.priority}</span>
                                  </div>
                                  <div className="text-[8px] text-gray-500 mb-1">{rule.category}</div>
                                  <p className="text-[9px] text-gray-600 leading-relaxed">{rule.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* 通航风险 */}
                          {wp.relatedRisks && wp.relatedRisks.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 px-2">
                                <AlertTriangle size={9} className="text-red-600" />
                                <span className="text-[9px] text-gray-500">历史风险 ({wp.relatedRisks.length})</span>
                              </div>
                              {wp.relatedRisks.map((risk, rki) => (
                                <div key={rki} className="bg-red-50/60 border border-red-100/60 rounded-lg px-2.5 py-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-gray-800 font-medium">{risk.title}</span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                                      risk.riskLevel === "高" ? "bg-red-500/20 text-red-700" : 
                                      risk.riskLevel === "中" ? "bg-yellow-500/20 text-yellow-700" : 
                                      "bg-green-500/20 text-green-700"
                                    }`}>{risk.riskLevel}风险</span>
                                  </div>
                                  <p className="text-[9px] text-gray-600 leading-relaxed mb-1.5">{risk.description}</p>
                                  <div className="bg-white/60 rounded px-2 py-1.5 border border-black/[0.03]">
                                    <p className="text-[8px] text-gray-700 leading-relaxed"><span className="text-blue-600">建议：</span>{risk.mitigation}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
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

      {/* MSA Offices */}
      {report.msaOffices && report.msaOffices.length > 0 && (
        <GlassCard>
          <div className="px-3.5 py-3 flex items-center gap-2.5 border-b border-black/[0.04]">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Landmark size={14} className="text-blue-500" />
            </div>
            <span className="text-[13px] text-gray-800">海事管理机构</span>
            <span className="text-[10px] text-gray-400 ml-auto">{report.msaOffices.length}个</span>
          </div>
          <div className="p-3.5 space-y-2">
            {report.msaOffices.map((office, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-blue-50/50 backdrop-blur rounded-xl p-3 border border-blue-100/50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] text-gray-800 font-medium">{office.name}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                    office.level === "市级" ? "bg-red-500/10 text-red-600" : 
                    office.level === "县级" ? "bg-yellow-500/10 text-yellow-600" : 
                    "bg-green-500/10 text-green-600"
                  }`}>{office.level}海事处</span>
                </div>
                <div className="text-[9px] text-gray-500 mb-1.5 flex items-center gap-1">
                  <Landmark size={9} className="text-gray-400" />
                  {office.kmRange}公里
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed mb-2">{office.note}</p>
                <div className="bg-white/60 backdrop-blur rounded-lg px-2.5 py-2 border border-black/[0.03]">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle size={10} className="text-blue-500 mt-[2px] shrink-0" />
                    <p className="text-[10px] text-gray-700 leading-relaxed">值班电话: {office.dutyPhone}</p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle size={10} className="text-blue-500 mt-[2px] shrink-0" />
                    <p className="text-[10px] text-gray-700 leading-relaxed">应急电话: {office.emergencyPhone}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}
    </motion.div>
  );
}

/* ─── Router (created once at module level) ─── */
const router = createBrowserRouter([
  { path: "/", Component: QixingApp },
  { path: "/admin", Component: AdminDashboard },
]);

/* ─── Main App ─── */
export default function App() {
  return <RouterProvider router={router} />;
}

/* ─── Chatbot Page (七星北导) ─── */
function QixingApp() {
  const [currentTab, setCurrentTab] = useState<"chat" | "map">("chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      type: "text",
      content: "您好，我是海青君，您的通航风险查询助手。请输入船名、始发港和目的港，我将协调四个智能体为您分析航线上的通航要素、航行警告、气象水文和推荐航路。\n\n例如：「鲁枣庄货3738，肇庆港到广州港」",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAgentResponse = async (userText: string) => {
    setIsLoading(true);
    const agentMsgId = "agent-" + Date.now();
    const isRiskQuery = /到|航线|风险|查询/.test(userText);
    const isWarningQuery = /航行警告|航警|警告/.test(userText);
    const isWeatherQuery = /气象|水文|天气/.test(userText);

    if (isRiskQuery && !isWarningQuery && !isWeatherQuery) {
      // Full route risk query with agent animation
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

      // Animate agents completing while fetching data
      const agentTimers = [600, 1200, 1800, 2400];
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

      try {
        const { ship, origin, dest } = parseRouteQuery(userText);
        const report = await fetchReport(ship, origin, dest);
        // Ensure minimum animation time
        await new Promise((r) => setTimeout(r, Math.max(0, 2800 - Date.now())));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMsgId
              ? { ...m, type: "risk-report", content: undefined, report, agents: m.agents?.map((a) => ({ ...a, status: "done" as const })) }
              : m
          )
        );
      } catch (e: any) {
        console.log("Report fetch error:", e);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMsgId
              ? { ...m, content: `数据获取失败: ${e.message}\n\n��确保已在后台初始化数据（访问 /admin 点击「初始化数据」）`, agents: m.agents?.map((a) => ({ ...a, status: "done" as const })) }
              : m
          )
        );
      }
      setIsLoading(false);
    } else if (isWarningQuery) {
      // Warning query
      setMessages((prev) => [
        ...prev,
        { id: agentMsgId, role: "agent", type: "text", content: "__loading__" },
      ]);
      try {
        const text = await fetchWarnings();
        setMessages((prev) =>
          prev.map((m) => m.id === agentMsgId ? { ...m, content: text } : m)
        );
      } catch (e: any) {
        setMessages((prev) =>
          prev.map((m) => m.id === agentMsgId ? { ...m, content: `获取航行警告失败: ${e.message}` } : m)
        );
      }
      setIsLoading(false);
    } else if (isWeatherQuery) {
      // Weather query
      setMessages((prev) => [
        ...prev,
        { id: agentMsgId, role: "agent", type: "text", content: "__loading__" },
      ]);
      try {
        const text = await fetchWeather();
        setMessages((prev) =>
          prev.map((m) => m.id === agentMsgId ? { ...m, content: text } : m)
        );
      } catch (e: any) {
        setMessages((prev) =>
          prev.map((m) => m.id === agentMsgId ? { ...m, content: `获取气象水文失败: ${e.message}` } : m)
        );
      }
      setIsLoading(false);
    } else {
      // Normal chat
      setMessages((prev) => [
        ...prev,
        { id: agentMsgId, role: "agent", type: "text", content: "__loading__" },
      ]);
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMsgId
              ? { ...m, content: "目前我可以帮您查询航线通航风险。请提供船名、始发港和目的港，例如：「鲁枣庄货3738，肇庆港到广州港」\n\n您也可以直接询问「今日西江航行警告」或「肇庆段气象水文」。" }
              : m
          )
        );
        setIsLoading(false);
      }, 600);
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
    handleAgentResponse(content);
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
            <div className="flex items-center gap-2">
              <h1 className="text-white text-[17px] tracking-tight">七星北导</h1>
              <p className="text-white/50 text-[11px]">你的通航安全航行助手</p>
            </div>
          </div>
        </div>
        {/* Soft edge fade */}
        <div className="h-6 bg-gradient-to-b from-[#1677ff]/10 to-transparent" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 overflow-hidden">
        {currentTab === "chat" ? (
          <>
            {/* Messages */}
            <div ref={scrollContainerRef} className="h-full overflow-y-auto px-4 pb-4">
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

            {/* Input Area for Chat */}
            <div className="absolute bottom-0 left-0 right-0 shrink-0">
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
          </>
        ) : (
          /* Map View */
          <div className="h-full w-full p-4">
            <MapView />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="relative shrink-0 z-20 bg-white/80 backdrop-blur-xl border-t border-white/50 px-4 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around gap-2">
          <button
            onClick={() => setCurrentTab("chat")}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
              currentTab === "chat"
                ? "bg-[#1677ff]/10 text-[#1677ff]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <MessageSquare size={20} />
            <span className="text-[10px] font-medium">智能助手</span>
          </button>
          <button
            onClick={() => setCurrentTab("map")}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
              currentTab === "map"
                ? "bg-[#1677ff]/10 text-[#1677ff]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Map size={20} />
            <span className="text-[10px] font-medium">通航地图</span>
          </button>
        </div>
      </div>
    </div>
  );
}
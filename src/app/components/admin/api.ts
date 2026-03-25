/**
 * Local Storage CRUD API
 * Replaces Supabase Edge Function backend with localStorage persistence.
 * All data is stored locally under the key prefix "qxbd_".
 */

const STORAGE_PREFIX = "qxbd_";

function getStore(collection: string): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + collection);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStore(collection: string, data: any[]): void {
  localStorage.setItem(STORAGE_PREFIX + collection, JSON.stringify(data));
}

function resolveCollection(path: string): { collection: string; id?: string } {
  const parts = path.split("/").filter(Boolean);
  if (parts.length >= 2) return { collection: parts[0], id: parts[1] };
  return { collection: parts[0] };
}

// Simulate async for consistency
const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

export async function apiGet<T = any>(path: string): Promise<T[]> {
  await delay();
  const { collection } = resolveCollection(path);
  return getStore(collection) as T[];
}

export async function apiGetOne<T = any>(path: string): Promise<T> {
  await delay();
  const { collection, id } = resolveCollection(path);
  const items = getStore(collection);
  const item = items.find((i: any) => i.id === id);
  if (!item) throw new Error("Not found");
  return item as T;
}

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  await delay();
  const { collection } = resolveCollection(path);
  const items = getStore(collection);
  const newItem = { ...body, id: body.id || `${collection.slice(0, 2)}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
  items.push(newItem);
  setStore(collection, items);
  return newItem as T;
}

export async function apiPut<T = any>(path: string, body: any): Promise<T> {
  await delay();
  const { collection, id } = resolveCollection(path);
  const items = getStore(collection);
  const idx = items.findIndex((i: any) => i.id === id);
  if (idx === -1) throw new Error("Not found");
  items[idx] = { ...items[idx], ...body, id };
  setStore(collection, items);
  return items[idx] as T;
}

export async function apiDelete(path: string): Promise<void> {
  await delay();
  const { collection, id } = resolveCollection(path);
  const items = getStore(collection);
  setStore(collection, items.filter((i: any) => i.id !== id));
}

/* ─── Mock data constants ─── */

const MOCK_WARNINGS = [
  /* ──────── 紧急 ──────── */
  {
    id: "wn_001",
    level: "紧急",
    title: "西江高要水道K195碍航物清除作业紧急警告",
    content: "2026年3月24日，西江高要水道K195浮标附近发现沉没砂船碍航，已启动紧急清障作业。清障期间约占用航道右侧约60米水域，过往船舶务必保持充足瞭望，航速不超过6节，保持VHF 16频道值守，服从VTS指挥。预计作业持续至4月10日。",
    status: "active",
    publishedAt: "2026-03-24T07:30:00",
    expiresAt: "2026-04-10T18:00:00",
    notifyCrewSide: true,
    attachments: [
      { name: "高要K195碍航物示意图.pdf", size: 312400, type: "application/pdf" },
    ],
  },
  {
    id: "wn_002",
    level: "紧急",
    title: "西江肇庆段洪水橙色预警·船舶限速限载紧急令",
    content: "受上游强降雨影响，高要站水位已达4.9m并持续上涨，超过警戒水位。即日起对西江肇庆至三水全线实施橙色洪水紧急预案：所有船舶限速8节以下航行；载重超过2000吨散货船须向VTS申报方可进港；高要K198–K190锚泊区临时关闭，船舶须驶离或转移至指定待泊区。",
    status: "active",
    publishedAt: "2026-03-23T14:00:00",
    expiresAt: "2026-03-28T23:59:00",
    notifyCrewSide: true,
    attachments: [],
  },
  /* ──────── 管制 ──────── */
  {
    id: "wn_003",
    level: "管制",
    title: "高要大桥桥区单向通航管制（3月25日08:00–12:00）",
    content: "因高要大桥#3桥墩定期检修养护作业，2026年3月25日08:00至12:00对高要大桥桥区实施单向通航管制：上行船舶优先，下行船舶须在K193等候区待命，待VTS通知后方可通行。检修期间禁止超过200总吨船舶靠近施工船50米范围内。",
    status: "active",
    publishedAt: "2026-03-24T08:00:00",
    expiresAt: "2026-03-25T12:00:00",
    notifyCrewSide: false,
    attachments: [
      { name: "高要大桥管制方案.docx", size: 204800, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    ],
  },
  {
    id: "wn_004",
    level: "管制",
    title: "珠江前航道广州段22:00—次日06:00禁航管制令",
    content: "自2026年3月1日起，广州市依据《广州市珠江游船管理办法》，对珠江前航道广州中心城区段（天字码头至黄沙大道）实施每日22:00—次日06:00禁止商业游览船舶通行管制。货船及客渡不受影响。执行期间VTS将对违规船舶进行记录并移交海事执法。",
    status: "active",
    publishedAt: "2026-03-01T00:00:00",
    expiresAt: "",
    notifyCrewSide: false,
    attachments: [],
  },
  {
    id: "wn_005",
    level: "管制",
    title: "西江德庆段K185~K182天然气管道穿越施工封航（已解除）",
    content: "德庆天然气管道穿越西江工程已于2026年3月20日竣工，原K185~K182段封航管制解除。施工期间共累计封航12天，感谢广大船员的配合与理解。本通告同步作废2026年3月8日发布的施工封航警告。",
    status: "expired",
    publishedAt: "2026-03-08T09:00:00",
    expiresAt: "2026-03-20T18:00:00",
    notifyCrewSide: false,
    attachments: [],
  },
  /* ──────── 一般 ──────── */
  {
    id: "wn_006",
    level: "一般",
    title: "西江K212红#12浮标临时移位通告",
    content: "因上游洪水冲击，西江K212处红#12浮标已向南偏移约35米至K211+850位置。海事局已组织拖轮于2026年3月24日上午完成浮标复位作业，复位后坐标为北纬23°12′28.6″，东经112°34′56.1″。过往船舶请核对最新航行参考图，避免依赖旧浮标位置航行。",
    status: "active",
    publishedAt: "2026-03-24T06:00:00",
    expiresAt: "",
    notifyCrewSide: true,
    attachments: [
      { name: "K212浮标复位通知单.pdf", size: 98304, type: "application/pdf" },
    ],
  },
  {
    id: "wn_007",
    level: "一般",
    title: "德庆渡口3月25日至27日夜间停运通知",
    content: "德庆县政府通知，德庆汽渡因渡口设备年度大修，自2026年3月25日20:00至3月27日06:00暂停夜间渡运服务，期间旅客及车辆请绕行德庆大桥。白天运营间照常（06:00–20:00）。紧急情况联系德庆渡口管理处：0758-5211888。",
    status: "active",
    publishedAt: "2026-03-23T10:00:00",
    expiresAt: "2026-03-27T06:00:00",
    notifyCrewSide: false,
    attachments: [],
  },
  {
    id: "wn_008",
    level: "一般",
    title: "南沙水道锚地调整及指定过驳作业区域变更公告",
    content: "广州港南沙港区扩建工程影响，南沙水道锚地#3、#4泊位自2026年4月1日起向东调整约500米。同期，油品过驳作业区由原K42北侧调整至K43南侧指定水域，过驳作业船舶须提前48小时向VTS申请。",
    status: "active",
    publishedAt: "2026-03-22T11:30:00",
    expiresAt: "2026-06-30T23:59:00",
    notifyCrewSide: false,
    attachments: [
      { name: "南沙锚地调整示意图.png", size: 1572864, type: "image/png" },
      { name: "过驳作业申请须知.pdf", size: 143360, type: "application/pdf" },
    ],
  },
  {
    id: "wn_009",
    level: "一般",
    title: "肇庆港区及西江干线春季灯标设备检修通知",
    content: "广东省海事局肇庆支局定于2026年3月28日至4月3日对西江干线K230至K180段共计47座灯浮标实施春季集中检修养护。检修船舶将陆续在各灯标附近作业，作业时悬挂\"A\"旗，过往船舶应提前减速、宽让，与检修船保持100米以上安全距离。",
    status: "active",
    publishedAt: "2026-03-21T09:00:00",
    expiresAt: "2026-04-03T18:00:00",
    notifyCrewSide: false,
    attachments: [],
  },
  /* ──────── 信息 ──────── */
  {
    id: "wn_010",
    level: "信息",
    title: "三水大桥桥区水深测量作业公告（草稿待审）",
    content: "计划于2026年3月26日至28日在三水大桥桥区上下游各500米水域开展年度水深测量作业，测量船\"粤海测2号\"将全程在测量区域慢速往返作业。过往船舶需减速至4节以下，与测量船保持200米以上距离，VHF 16频道实时协调。",
    status: "draft",
    publishedAt: "2026-03-24T09:00:00",
    expiresAt: "2026-03-28T18:00:00",
    notifyCrewSide: false,
    attachments: [],
  },
  {
    id: "wn_011",
    level: "信息",
    title: "西江干线AIS基站升级维护公告（已完成）",
    content: "西江干线高要、肇庆、封开三处AIS岸基基站已于2026年3月15日完成设备升级，新设备支持AIS Class B扩展帧，覆盖范围由原40km提升至62km，并新增VHF数据链路冗余。升级期间（3月14日06:00–22:00）各基站轮流重启，期间AIS监控出现约2小时覆盖空白，感谢各船员配合。",
    status: "expired",
    publishedAt: "2026-03-12T10:00:00",
    expiresAt: "2026-03-15T22:00:00",
    notifyCrewSide: false,
    attachments: [],
  },
  {
    id: "wn_012",
    level: "信息",
    title: "2026年汛期值班船员水上应急演练通知（草稿）",
    content: "广东省海事局拟定于2026年4月15日在高要水道组织开展汛期综合水上应急演练，科目涵盖遇险报警、搜救协调、防洪避险、无线电应急通信等。请辖区船公司提前安排船员出勤并配合演练指令。详细方案另行下发，请关注VTS播报。",
    status: "draft",
    publishedAt: "2026-03-24T10:00:00",
    expiresAt: "",
    notifyCrewSide: false,
    attachments: [],
  },
];

const MOCK_NAVIGATION_RISKS = [
  {
    id: "nr_001",
    title: "高要大桥桥墩追越碰撞高风险点",
    category: "碰撞风险",
    riskLevel: "高",
    location: "西江高要大桥桥区（K342-K343）",
    relatedElements: ["桥梁", "商渔密集区"],
    description: "2015-2025年间统计，高要大桥桥区发生6起船���碰撞桥墩事故，其中4起为追越不当导致。主要原因：1）桥区水域狭窄（桥孔净宽110米）；2）商渔船混合交通流量大；3）部分船员桥区违规追越。",
    historicalCases: [
      { date: "2023-08-15", vessel: "粤肇货1688", incident: "追越时转向不及撞击3#桥墩", casualties: "轻微船损，无人员伤亡" },
      { date: "2021-05-22", vessel: "桂江运352", incident: "雾天能见度低碰撞桥墩", casualties: "中度船损，2人轻伤" },
      { date: "2019-11-03", vessel: "闽货2314", incident: "夜间追越失控碰撞", casualties: "重度船损，1人重伤" },
    ],
    mitigation: "建议措施：1）桥区全面禁止追越；2）能见度<2km时限速6节；3）夜间加强桥墩灯光标识；4）VTS实时监控桥区交通流。",
    status: "active",
    severity: 9,
    probability: "中",
    impact: "重大",
    lastUpdated: "2026-03-20",
    reviewedBy: "肇庆海事局航安处",
    attachments: [
      { name: "高要大桥事故统计2015-2025.xlsx", size: 245760, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    ],
  },
  {
    id: "nr_002",
    title: "德庆渡口横越冲突风险",
    category: "交通冲突",
    riskLevel: "高",
    location: "德庆渡口（K312）",
    relatedElements: ["渡口"],
    description: "德庆渡口是西江干线客流量最大的渡口，日均横越120艘次。渡口航线与主航道垂直交叉，高峰时段（7-9时、17-19时）每5分钟就有一艘渡船横越，极易与主航道直行船舶发生冲突。历史上曾发生3起险情。",
    historicalCases: [
      { date: "2024-06-10", vessel: "德庆客渡3号 vs 粤广货225", incident: "早高峰横越时险情避让", casualties: "无" },
      { date: "2022-09-18", vessel: "德庆客渡1号 vs 桂货1132", incident: "渡船突然横越导致货船紧急倒车", casualties: "渡客2人摔伤" },
    ],
    mitigation: "建议措施：1）高峰时段渡船与主航道船舶VHF实时沟通；2）渡船等待主航道船舶先行后再横越；3）主航道船舶经过渡口时减速至8节以下；4）设置渡口警示灯。",
    status: "active",
    severity: 8,
    probability: "高",
    impact: "较大",
    lastUpdated: "2026-03-18",
    reviewedBy: "德庆海事处",
    attachments: [],
  },
  {
    id: "nr_003",
    title: "肇庆水道低水位搁浅风险",
    category: "搁浅风险",
    riskLevel: "中",
    location: "西江肇庆水道（K328-K332）",
    relatedElements: ["水文"],
    description: "每年枯水期（11月-次年2月），肇庆水道部分河段水位降至历史低点，最浅处仅3.2米。重载货船（吃水>2.5m）存在搁浅风险。2018-2025年共发生11起搁浅事故，均在枯水期。",
    historicalCases: [
      { date: "2025-01-12", vessel: "粤肇运1255", incident: "枯水期满载搁浅K330浅滩", casualties: "船舶搁浅48小时，货物转载后脱浅" },
      { date: "2023-12-20", vessel: "湘货8821", incident: "吃水2.8米搁浅", casualties: "等待涨潮后脱浅" },
      { date: "2020-02-05", vessel: "粤佛货536", incident: "低水位搁浅K329", casualties: "拖轮协助脱浅" },
    ],
    mitigation: "建议措施：1）枯水期发布水深预警公告；2）重载船舶（吃水>2.5m）须等待高水位时段通过；3）VTS实时播报水位信息；4）建议分批次转载减载。",
    status: "active",
    severity: 6,
    probability: "中",
    impact: "一般",
    lastUpdated: "2026-03-15",
    reviewedBy: "肇庆海事局",
    attachments: [
      { name: "肇庆水道历史水位统计.pdf", size: 512000, type: "application/pdf" },
    ],
  },
  {
    id: "nr_004",
    title: "三水大桥强风偏航风险",
    category: "气象风险",
    riskLevel: "中",
    location: "三水大桥（K380）",
    relatedElements: ["桥梁", "气象"],
    description: "三水大桥地处开阔水域，横风影响显著。当西北风≥6级时，轻载船舶（空载或半��）通过桥区易发生偏航。2019��台风天曾发生1起偏航撞桥事故。",
    historicalCases: [
      { date: "2019-09-16", vessel: "粤顺货1125（空载）", incident: "台风外围7级横风导致偏航撞桥", casualties: "船舶重度损坏，桥墩轻微损伤" },
    ],
    mitigation: "建议措施：1）风力≥6级时，轻载船舶暂停通航或等待风力减弱；2）加强桥区VHF引导；3）桥区设置风速风向实时播报装置。",
    status: "active",
    severity: 7,
    probability: "低",
    impact: "较大",
    lastUpdated: "2026-03-10",
    reviewedBy: "三水海事处",
    attachments: [],
  },
  {
    id: "nr_005",
    title: "K195沉船碍航区域风险",
    category: "碍航物风险",
    riskLevel: "高",
    location: "西江高要水道K195",
    relatedElements: ["其他"],
    description: "2026年3月24日新发现沉船碍航，占用航道右侧约60米水域。清障作业预计持续至4月10日。该区域航道变窄，船舶会遇风险增大。",
    historicalCases: [
      { date: "2026-03-24", vessel: "未知沉船", incident: "沉没砂船碍航", casualties: "航道通航能力下降50%" },
    ],
    mitigation: "建议措施：1）过往船舶减速至6节；2）保持VHF 16频道值守；3）服从VTS指挥；4）夜间加强瞭望。",
    status: "active",
    severity: 8,
    probability: "高",
    impact: "较大",
    lastUpdated: "2026-03-24",
    reviewedBy: "高要海事处",
    attachments: [],
  },
  {
    id: "nr_006",
    title: "商渔密集区碰撞风险",
    category: "交通冲突",
    riskLevel: "高",
    location: "高要水域商渔密集区（K340-K345）",
    relatedElements: ["商渔密集区"],
    description: "该水域商船和渔船混合作业，日均船舶200+艘。高峰时段船舶密度极大，加之部分渔船VHF未开启，碰撞风险高。2020-2025年发生5起碰撞事故。",
    historicalCases: [
      { date: "2024-03-08", vessel: "粤高货552 vs 渔船粤肇渔1203", incident: "商船与作业渔船碰撞", casualties: "渔船沉没，3人落水获救" },
      { date: "2022-11-15", vessel: "桂货2214 vs 渔船", incident: "夜间碰撞渔船", casualties: "渔船重度损坏" },
    ],
    mitigation: "建议措施：1）商船控制航速≤8节；2）加强VHF值守；3）夜间加强瞭望；4）渔船强制开启AIS或VHF。",
    status: "active",
    severity: 8,
    probability: "高",
    impact: "较大",
    lastUpdated: "2026-03-12",
    reviewedBy: "高要海事处",
    attachments: [],
  },
  {
    id: "nr_007",
    title: "洪水期流速过快失控风险",
    category: "水文风险",
    riskLevel: "中",
    location: "西江全线",
    relatedElements: ["水文"],
    description: "汛期（6-9月）强降雨导致西江水位暴涨，流速可达2.5m/s。船舶操纵困难，易发生失控、走锚等险情。历史上曾发生多起洪水期失控事故。",
    historicalCases: [
      { date: "2023-07-22", vessel: "粤肇货1888", incident: "洪水期流速过快，锚泊失效走锚", casualties: "走锚漂移3公里后重新抛锚" },
      { date: "2021-08-10", vessel: "桂货5521", incident: "洪水期上行困难失控", casualties: "倒退漂移后触底轻微损坏" },
    ],
    mitigation: "建议措施：1）洪水期限速8节；2）加强锚泊措施（双锚）；3）重载船舶提前驶离或待泊；4）VTS实时播报水位流速。",
    status: "active",
    severity: 7,
    probability: "中",
    impact: "较大",
    lastUpdated: "2026-03-08",
    reviewedBy: "肇庆海事局",
    attachments: [],
  },
  {
    id: "nr_008",
    title: "雾天能见度低碰撞风险（已归档）",
    category: "气象风险",
    riskLevel: "低",
    location: "西江德庆段",
    relatedElements: ["气象"],
    description: "历史上德庆段冬季多雾，能见度<500米时曾发生碰撞事故。近年来AIS和雷达设备普及，此类事故显著减少。本风险已降级为低风险。",
    historicalCases: [
      { date: "2018-01-15", vessel: "粤德货225 vs 桂货1552", incident: "大雾天碰撞", casualties: "两船轻微损坏" },
    ],
    mitigation: "建议措施：1）能见度<1km时减速至4节；2）开启雾号；3）VHF值守；4）依赖雷达和AIS导航。",
    status: "archived",
    severity: 4,
    probability: "低",
    impact: "较小",
    lastUpdated: "2025-12-01",
    reviewedBy: "德庆海事处",
    attachments: [],
  },
];

const MOCK_WEATHERS = [
  { id: "we_1", area: "肇庆段（肇庆港附近）", temp: "18-26°C", wind: "东南风3级", visibility: "8km", humidity: "72%", pressure: "1012hPa", source: "气象局电话报", reportedAt: "2026-03-24 06:00", recorder: "李海文" },
  { id: "we_2", area: "德庆段（德庆县城附近）", temp: "17-25°C", wind: "东风2-3级", visibility: "10km", humidity: "68%", pressure: "1013hPa", source: "气象局传真报", reportedAt: "2026-03-24 06:00", recorder: "李海文" },
  { id: "we_3", area: "高要段（高要大桥附近）", temp: "18-25°C", wind: "西南风2级", visibility: "12km", humidity: "65%", pressure: "1014hPa", source: "自动采集", reportedAt: "2026-03-24 06:30", recorder: "" },
  { id: "we_4", area: "三水段（三水大桥附近）", temp: "19-27°C", wind: "南风3-4级", visibility: "6km", humidity: "80%", pressure: "1010hPa", source: "气象局短信报", reportedAt: "2026-03-24 06:00", recorder: "张明远" },
  { id: "we_5", area: "顺德段（容桂水道）", temp: "20-27°C", wind: "东南风3级", visibility: "7km", humidity: "78%", pressure: "1011hPa", source: "自动采集", reportedAt: "2026-03-24 06:30", recorder: "" },
  { id: "we_6", area: "佛山段（佛山水道）", temp: "20-28°C", wind: "东南风4级", visibility: "5km", humidity: "85%", pressure: "1009hPa", source: "气象局电话报", reportedAt: "2026-03-24 06:00", recorder: "张明远" },
  { id: "we_7", area: "广州段（莲花山航道）", temp: "21-29°C", wind: "东南风4-5级", visibility: "4km", humidity: "88%", pressure: "1008hPa", source: "气象局传真报", reportedAt: "2026-03-24 06:00", recorder: "陈志强" },
  { id: "we_8", area: "中山段（横门水道）", temp: "22-30°C", wind: "西南风3-4级", visibility: "8km", humidity: "76%", pressure: "1012hPa", source: "自动采集", reportedAt: "2026-03-24 06:30", recorder: "" },
];

const MOCK_HYDROS = [
  { id: "hy_1", station: "高要站", river: "西江", county: "肇庆市高要区", authority: "广东省水文局肇庆分局", waterLevel: "5.2m", flow: "18000m³/s", tide: "落潮中，预计低潮时间16:00", warnLevel: "4.8m", baseWaterLevel: "3.8m", reportedAt: "2026-03-24 06:00", source: "珠江水利委遥测", recorder: "李海文" },
  { id: "hy_2", station: "三水站（马口）", river: "北江", county: "佛山市三水区", authority: "广东省水文局佛山分局", waterLevel: "4.8m", flow: "15000m³/s", tide: "平潮，预计转涨潮时间17:00", warnLevel: "4.5m", baseWaterLevel: "3.5m", reportedAt: "2026-03-24 06:00", source: "珠江水利委遥测", recorder: "张明远" },
  { id: "hy_3", station: "甘竹溪站", river: "西江支流甘竹溪", county: "佛山市顺德区", authority: "广东省水文局佛山分局", waterLevel: "2.1m", flow: "3200m³/s", tide: "落潮，预计低潮时间15:30", warnLevel: "2.8m", baseWaterLevel: "1.5m", reportedAt: "2026-03-24 06:00", source: "珠江水利委遥测", recorder: "" },
  { id: "hy_4", station: "天河站（广州）", river: "珠江前航道", county: "广州市天河区", authority: "广东省水文局广州分局", waterLevel: "3.8m", flow: "9500m³/s", tide: "涨潮中，预计高潮时间10:20", warnLevel: "5.0m", baseWaterLevel: "2.8m", reportedAt: "2026-03-24 06:30", source: "珠江水利委遥测", recorder: "王建国" },
];

const MOCK_MSA_OFFICES = [
  { 
    id: "msa_001", 
    name: "肇庆海事局", 
    level: "分局", 
    jurisdiction: "肇庆市全境水域", 
    address: "肇庆市端州区江滨路138号", 
    dutyPhone: "0758-2833110", 
    emergencyPhone: "0758-2833119", 
    fax: "0758-2833120",
    email: "zqmsa@msa.gov.cn",
    workingHours: "周一至周五 8:30-12:00, 14:30-17:30（法定节假日除外）",
    dutyHours: "24小时值班",
    kmRange: "K260-K350",
    note: "负责肇庆市辖区内河航道监督管理、船舶交通安全、防污染监督等工作"
  },
  { 
    id: "msa_002", 
    name: "封开海事处", 
    level: "海事处", 
    jurisdiction: "封开县水域、贺江封开段", 
    address: "封开县江口街道沿江路28号", 
    dutyPhone: "0758-6689110", 
    emergencyPhone: "0758-6689119", 
    fax: "0758-6689120",
    email: "fkmsa@msa.gov.cn",
    workingHours: "周一至周五 8:30-12:00, 14:30-17:30",
    dutyHours: "24小时值班",
    kmRange: "K260-K295",
    note: "负责封开县辖区水域，包括长岗码头、大洲镇水域、金装镇水域等"
  },
  { 
    id: "msa_003", 
    name: "德庆海事处", 
    level: "海事处", 
    jurisdiction: "德庆县水域、西江德庆段", 
    address: "德庆县德城街道朝阳西路56号", 
    dutyPhone: "0758-7766110", 
    emergencyPhone: "0758-7766119", 
    fax: "0758-7766120",
    email: "dqmsa@msa.gov.cn",
    workingHours: "周一至周五 8:30-12:00, 14:30-17:30",
    dutyHours: "24小时值班",
    kmRange: "K295-K322",
    note: "负责德庆县辖区水域，包括德庆石井码头、德庆渡口、悦城水域等"
  },
  { 
    id: "msa_004", 
    name: "高要海事处", 
    level: "海事处", 
    jurisdiction: "高要区水域、西江高要段", 
    address: "肇庆市高要区南岸街道沿江一路118号", 
    dutyPhone: "0758-8383110", 
    emergencyPhone: "0758-8383119", 
    fax: "0758-8383120",
    email: "gymsa@msa.gov.cn",
    workingHours: "周一至周五 8:30-12:00, 14:30-17:30",
    dutyHours: "24小时值班",
    kmRange: "K322-K350",
    note: "负责高要区辖区水域，包括肇庆西江大桥、高要大桥、三榕港、高要港区等重点区域"
  },
];

const MOCK_NAVIGATION_RULES = [
  {
    id: "rule_001",
    title: "西江干线桥区限速规定",
    category: "速度管理",
    ruleType: "速度限制",
    applicableArea: "西江干线所有桥梁桥区（上下游各500米范围）",
    content: "船舶通过桥梁桥区时，必须减速至8节以下；能见度小于2公里时，限速6节；夜间通过桥区限速6节。严禁在桥区追越、并行。",
    legalBasis: "《中华人民共和国内河交通安全管理条例》第二十八条、《广东省西江航道管理规定》第十五条",
    penalty: "违反限速规定的，处以警告或500-2000元罚款；造成事故的，吊销船员适任证书，并依法追究刑事责任。",
    effectiveDate: "2020-01-01",
    status: "生效中",
    priority: "强制",
    enforcementUnit: "肇庆海事局",
  },
  {
    id: "rule_002",
    title: "取水口保护区禁航规定",
    category: "禁航管制",
    ruleType: "禁止通航",
    applicableArea: "肇庆水厂取水口上下游各200米水域",
    content: "禁止任何船舶进入取水口保护区水域。禁止在保护区内锚泊、捕鱼、排放污水、倾倒垃圾等一切可能污染水源的行为。",
    legalBasis: "《中华人民共和国水污染防治法》第六十五条、《饮用水水源保护区污染防治管理规定》",
    penalty: "违反规定的，处以2000-10000元罚款；造成水源污染的，处以10000-50000元罚款，并承担清污费用；构成犯罪的，依法追究刑事责任。",
    effectiveDate: "2016-06-01",
    status: "生效中",
    priority: "强制",
    enforcementUnit: "肇庆海事局、肇庆生态环境局",
  },
  {
    id: "rule_003",
    title: "商渔密集区航行规范",
    category: "通航要求",
    ruleType: "操作规范",
    applicableArea: "高要水域商渔密集区（K340-K345）",
    content: "1）船舶进入商渔密集区前，应提前降速至8节以下；2）保持VHF 16频道值守，与渔船保持有效沟通；3）夜间航行开启所有航行灯和探照灯；4）加强瞭望，发现渔船作业时应提前避让。",
    legalBasis: "《中华人民共和国内河避碰规则》第五条、第八条",
    penalty: "违反规定的，给予警告或500-1000元罚款；造成碰撞事故的，承担相应民事赔偿责任，并处以2000-10000元罚款。",
    effectiveDate: "2018-03-01",
    status: "生效中",
    priority: "强制",
    enforcementUnit: "高要海事处",
  },
  {
    id: "rule_004",
    title: "渡口横越优先通行规定",
    category: "通航要求",
    ruleType: "限制通航",
    applicableArea: "西江干线所有客渡、汽渡横越航线",
    content: "渡船横越主航道时享有优先通行权，但须遵守以下规则：1）横越前通过VHF通知主航道船舶；2）确认安全后快速横越，横越时间不得超过5分钟；3）主航道船舶应减速避让，不得抢行；4）高峰时段（7-9时、17-19时）渡船应加强与主航道船舶的协调。",
    legalBasis: "《中华人民共和国内河避碰规则》第九条（渡船特别规定）",
    penalty: "渡船违规横越的，处以警告或1000-3000元罚款；主航道船舶拒不避让渡船的，处以500-2000元罚款。",
    effectiveDate: "2015-07-01",
    status: "生效中",
    priority: "强制",
    enforcementUnit: "德庆海事处、高要海事处",
  },
  {
    id: "rule_005",
    title: "锚泊区管理规定",
    category: "锚泊规定",
    ruleType: "锚泊管理",
    applicableArea: "西江干线所有指定锚泊区",
    content: "1）船舶应在指定锚泊区内锚泊，不得在航道、桥区、码头前沿锚泊；2）锚泊时应悬挂锚泊信号，夜间显示锚泊灯；3）锚泊船舶应保持VHF值守，服从VTS调度；4）大风、洪水期应加强锚泊措施，必要时双锚；5）严禁锚泊区超载，超载时服从VTS指挥转移至其他锚地。",
    legalBasis: "《中华人民共和国内河交通安全管理条例》第三十三条",
    penalty: "违反锚泊规定的，处以警告或300-1000元罚款；在禁锚区锚泊的，处以1000-5000元罚款。",
    effectiveDate: "2014-01-01",
    status: "生效中",
    priority: "强制",
    enforcementUnit: "肇庆海事局",
  },
  {
    id: "rule_006",
    title: "船舶VHF强制值守规定",
    category: "安全规范",
    ruleType: "设备要求",
    applicableArea: "西江干线全线",
    content: "所有航行船舶必须安装VHF无线电设备，并在VHF 16频道保持24小时值守。船舶应在以下情况及时通过VHF通报：1）进出港口；2）通过桥区、渡口；3）遇险或发现他船遇险；4）接到VTS呼叫。",
    legalBasis: "《中华人民共和国内河交通安全管理条例》第二十条",
    penalty: "未按规定安装或值守VHF的，处以警告或500-2000元罚款；因VHF失联导致事故的，从重处罚。",
    effectiveDate: "2012-01-01",
    status: "生效中",
    priority: "强制",
    enforcementUnit: "肇庆海事局",
  },
  {
    id: "rule_007",
    title: "夜间航行灯光管理规定",
    category: "安全规范",
    ruleType: "设备要求",
    applicableArea: "西江干线全线",
    content: "所有船舶夜间航行必须按规定开启航行灯：1）左舷红灯、右舷绿灯、桅灯、尾灯；2）灯光设备故障的船舶禁止夜间航行；3）渔船作业时必须开启作业灯；4）锚泊船舶悬挂锚泊球，夜间显示锚泊灯。",
    legalBasis: "《中华人民共和国内河避碰规则》第二十条至第三十条（号灯规定）",
    penalty: "未按规定显示灯光的，处以警告或500-2000元罚款；造成碰撞事故的，承担主要或全部责任。",
    effectiveDate: "2010-01-01",
    status: "生效中",
    priority: "强制",
    enforcementUnit: "肇庆海事局",
  },
  {
    id: "rule_008",
    title: "洪水期航行安全管理规定",
    category: "安全规范",
    ruleType: "限制通航",
    applicableArea: "西江干线全线",
    content: "当水位超过警戒水位或流速超过2m/s时，启动洪水期航行管制：1）所有船舶限速8节；2）重载船舶（吃水>2.5m）须向VTS申报；3）锚泊船舶加强锚泊措施或驶离；4）禁止小型船舶、无动力船舶航行；5）必要时实施临时封航。",
    legalBasis: "《中华人民共和国防洪法》第四十七条、《内河交通安全管理条例》第五十二条",
    penalty: "违反洪水期管制规定的，处以1000-5000元罚款；拒不执行封航命令的，处以5000-20000元罚款，强制拖离并追究相关责任。",
    effectiveDate: "2013-05-01",
    status: "生效中",
    priority: "强制",
    enforcementUnit: "肇庆海事局",
  },
  {
    id: "rule_009",
    title: "船舶污染物排放管理规定",
    category: "环保要求",
    ruleType: "环保标准",
    applicableArea: "西江干线全线",
    content: "严禁向水域排放油类、有毒有害物质、生活污水、垃圾等污染物。船舶应：1）安装油水分离器、生活污水处理装置；2）在指定接收点交付污染物；3）保存污染物接收记录；4）发生污染事故立即报告并采取应急措施。",
    legalBasis: "《中华人民共和国水污染防治法》第五十九条、《船舶水污染物排放控制标准》",
    penalty: "违法排放污染物的，处以10000-100000元罚款；造成严重污染的，处以100000-500000元罚款，并承担清污费用；构成犯罪的，依法追究刑事责任。",
    effectiveDate: "2019-01-01",
    status: "生效中",
    priority: "强制",
    enforcementUnit: "肇庆海事局、肇庆生态环境局",
  },
  {
    id: "rule_010",
    title: "枯水期重载船舶限航建议",
    category: "通航要求",
    ruleType: "限制通航",
    applicableArea: "肇庆水道（K328-K332）",
    content: "枯水期（11月-次年2月）当水深低于3.5米时，建议：1）吃水>2.5m的重载船舶等待高水位时段通过；2）必须通过时，提前向VTS申报，获取实时水深信息；3）减速慢行，加强水深探测；4）必要时分批卸载或转载。本规定为建议性规定，船舶可自主决策，但后果自负。",
    legalBasis: "《广东省西江航道管理规定》第十八条（枯水期管理）",
    penalty: "本规定为建议性规定，不设处罚，但违反建议导致搁浅的，船舶承担全部救助费用和航道疏通费用。",
    effectiveDate: "2017-11-01",
    status: "生效中",
    priority: "建议",
    enforcementUnit: "肇庆海事局",
  },
  {
    id: "rule_011",
    title: "老旧船舶禁航规定（草稿）",
    category: "通航要求",
    ruleType: "禁止通航",
    applicableArea: "西江干线全线",
    content: "拟定自2027年1月1日起，禁止船龄超过30年、未通过特别检验的老旧船舶在西江干线航行。老旧船舶定义：1）船龄≥30年；2）未按规定进行特别检验或检验不合格；3）安全设备不符合现行标准。本规定尚在征求意见阶段。",
    legalBasis: "《中华人民共和国船舶检验条例》（草案）",
    penalty: "（草案阶段，处罚标准待定）",
    effectiveDate: "2027-01-01",
    status: "草稿",
    priority: "强制",
    enforcementUnit: "广东海事局",
  },
  {
    id: "rule_012",
    title: "船舶装载限制规定（已废止）",
    category: "通航要求",
    ruleType: "限制通航",
    applicableArea: "西江干线全线",
    content: "（已废止）原规定：船舶装载不得超过核定载重量，超载10%以上禁止航行。本规定已于2025年12月31日废止，新规定见《船舶载运管理办法》（2026版）。",
    legalBasis: "《船舶载运管理办法》（2015版，已废止）",
    penalty: "（已废止）",
    effectiveDate: "2015-01-01",
    status: "已废止",
    priority: "强制",
    enforcementUnit: "肇庆海事局",
  },
];

/* ─── Auto-seed weathers & hydros only if collections are empty ─── */
export async function ensureWeatherSeed(): Promise<void> {
  await delay(30);
  if (getStore("weathers").length === 0) setStore("weathers", MOCK_WEATHERS);
  // 版本迁移：若旧水文数据缺少 river 或 baseWaterLevel 字段，强制刷新为新结构
  const hydros = getStore("hydros");
  if (hydros.length === 0 || !hydros[0]?.river || !hydros[0]?.baseWaterLevel) setStore("hydros", MOCK_HYDROS);
}

/* ─── Auto-seed warnings only if collection is empty ─── */
export async function ensureWarningsSeed(): Promise<void> {
  await delay(30);
  const stored = getStore("warnings");
  // 若为空，或仍是旧版4条简短数据（无 publishedAt 字段），强制刷新为新结构
  if (stored.length === 0 || !stored[0]?.publishedAt) {
    setStore("warnings", MOCK_WARNINGS);
  }
}

/* ─── Auto-seed navigation risks only if collection is empty ─── */
export async function ensureNavigationRisksSeed(): Promise<void> {
  await delay(30);
  const stored = getStore("navigationRisks");
  // 若为空，强制刷新为新结构
  if (stored.length === 0) {
    setStore("navigationRisks", MOCK_NAVIGATION_RISKS);
  }
}

/* ─── Auto-seed navigation rules only if collection is empty ─── */
export async function ensureNavigationRulesSeed(): Promise<void> {
  await delay(30);
  const stored = getStore("navigationRules");
  // 若为空，强制刷新为新结构
  if (stored.length === 0) {
    setStore("navigationRules", MOCK_NAVIGATION_RULES);
  }
}

/* ─── Seed: populate default data into localStorage ─── */
export async function seed(): Promise<string> {
  await delay(200);

  const elements = [
    /* ══════════════════════════════════════════════════════════
       肇庆辖区码头（23个）- 基于实际清单数据
       ══════════════════════════════════════════════════════════ */
    { 
      id: "el_wharf_01", name: "封开长岗综合码头", type: "码头", subType: "散货", km: "268",
      note: "主要货物类型：砂石",
      params: { "泊位数": "2个", "年吞吐量": "50万吨", "货物类型": "砂石" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.26083, lng: 111.57750 },
      validFrom: "2015-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_02", name: "封开县大洲镇广信码头", type: "码头", subType: "散货", km: "270",
      note: "主要货物类型：砂石",
      params: { "泊位数": "1个", "货物类型": "砂石" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.25500, lng: 111.59000 },
      validFrom: "2016-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_03", name: "封开县金装镇金鸡码头", type: "码头", subType: "散货", km: "273",
      note: "主要货物类型：砂石",
      params: { "泊位数": "1个", "货物类型": "砂石" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.27000, lng: 111.54000 },
      validFrom: "2017-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_04", name: "封开县渔涝镇七星综合码头", type: "码头", subType: "散货", km: "285",
      note: "主要货物类型：砂石",
      params: { "泊位数": "2个", "货物类型": "砂石" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.30000, lng: 111.45000 },
      validFrom: "2016-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_05", name: "封开县白垢镇龙皇码头", type: "码头", subType: "散货", km: "292",
      note: "主要货物类型：砂石",
      params: { "泊位数": "1个", "货物类型": "砂石" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.32000, lng: 111.38000 },
      validFrom: "2018-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_06", name: "德庆县石井水泥厂码头", type: "码头", subType: "散货", km: "305",
      note: "主要货物类型：水泥",
      params: { "泊位数": "2个", "年吞吐量": "80万吨", "货物类型": "水泥" },
      riskLevel: "中", status: "正常",
      coordinates: { lat: 23.08278, lng: 112.15222 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_07", name: "德庆金海湾石材加工厂码头", type: "码头", subType: "散货", km: "308",
      note: "主要货物类型：石材",
      params: { "泊位数": "1个", "货物类型": "石材" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.09000, lng: 112.13000 },
      validFrom: "2015-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_08", name: "德庆县恒丰实业有限公司码头", type: "码头", subType: "散货", km: "310",
      note: "主要货物类型：砂石",
      params: { "泊位数": "2个", "货物类型": "砂石" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.09500, lng: 112.11000 },
      validFrom: "2014-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_09", name: "德庆县官圩镇金林砂石码头", type: "码头", subType: "散货", km: "315",
      note: "主要货物类型：砂石",
      params: { "泊位数": "1个", "货物类型": "砂石" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.11000, lng: 112.08000 },
      validFrom: "2016-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_10", name: "德庆县悦城镇罗洪码头", type: "码头", subType: "散货", km: "318",
      note: "主要货物类型：砂石",
      params: { "泊位数": "1个", "货物类型": "砂石" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.12000, lng: 112.05000 },
      validFrom: "2017-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_11", name: "肇庆港务有限公司三榕港码头", type: "码头", subType: "集装箱、散货", km: "323",
      note: "主要货物类型：集装箱、散货，大型综合码头",
      params: { "泊位数": "8个", "年吞吐量": "500万吨", "货物类型": "集装箱、散货" },
      riskLevel: "高", status: "正常",
      coordinates: { lat: 23.05833, lng: 112.43972 },
      validFrom: "2008-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_12", name: "肇庆港国际集装箱码头有限公司（二期）", type: "码头", subType: "集装箱", km: "324",
      note: "主要货物类型：集装箱，现代化集装箱专用码头",
      params: { "泊位数": "4个", "年吞吐量": "50万标箱", "货物类型": "集装箱" },
      riskLevel: "高", status: "正常",
      coordinates: { lat: 23.06000, lng: 112.44500 },
      validFrom: "2012-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_13", name: "肇庆新港码头有限公司码头", type: "码头", subType: "散货", km: "326",
      note: "主要货物类型：散货",
      params: { "泊位数": "6个", "年吞吐量": "300万吨", "货物类型": "散货" },
      riskLevel: "中", status: "正常",
      coordinates: { lat: 23.06500, lng: 112.46000 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_14", name: "肇庆市端州黄岗鹏程码头", type: "码头", subType: "散货", km: "328",
      note: "主要货物类型：建材",
      params: { "泊位数": "2个", "货物类型": "建材" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.07000, lng: 112.47000 },
      validFrom: "2013-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_15", name: "肇庆市端州黄岗东升综合码头", type: "码头", subType: "散货", km: "329",
      note: "主要货物类型：建材、砂石",
      params: { "泊位数": "3个", "货物类型": "建材、砂石" },
      riskLevel: "中", status: "正常",
      coordinates: { lat: 23.07500, lng: 112.47500 },
      validFrom: "2014-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_16", name: "肇庆市高要区金利镇德海码头", type: "码头", subType: "散货", km: "335",
      note: "主要货物类型：砂石",
      params: { "泊位数": "2个", "货物类型": "砂石" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.08000, lng: 112.52000 },
      validFrom: "2015-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_17", name: "肇庆市高要区金利镇超华码头", type: "码头", subType: "散货", km: "337",
      note: "主要货物类型：砂石",
      params: { "泊位数": "2个", "货物类型": "砂石" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.08500, lng: 112.53000 },
      validFrom: "2016-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_18", name: "肇庆市高要区金利镇文沙码头", type: "码头", subType: "散货", km: "339",
      note: "主要货物类型：砂石",
      params: { "泊位数": "1个", "货物类型": "砂石" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.09000, lng: 112.54000 },
      validFrom: "2017-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_19", name: "肇庆市高要区白土镇德兴码头", type: "码头", subType: "散货", km: "342",
      note: "主要货物类型：砂石",
      params: { "泊位数": "1个", "货物类型": "砂石" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.09500, lng: 112.56000 },
      validFrom: "2018-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_20", name: "肇庆市高要区白土镇裕昌混凝土搅拌站码头", type: "码头", subType: "散货", km: "344",
      note: "主要货物类型：混凝土原料",
      params: { "泊位数": "1个", "货物类型": "混凝土原料" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.10000, lng: 112.57000 },
      validFrom: "2016-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_21", name: "肇庆市高要区莲塘镇神华粤电码头", type: "码头", subType: "散货", km: "348",
      note: "主要货物类型：煤炭",
      params: { "泊位数": "4个", "年吞吐量": "200万吨", "货物类型": "煤炭" },
      riskLevel: "中", status: "正常",
      coordinates: { lat: 23.11000, lng: 112.60000 },
      validFrom: "2011-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_22", name: "肇庆市高要区南岸路南兴码头", type: "码头", subType: "散货", km: "350",
      note: "主要货物类型：建材",
      params: { "泊位数": "2个", "货物类型": "建材" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.11500, lng: 112.61000 },
      validFrom: "2014-01-01", validUntil: ""
    },
    { 
      id: "el_wharf_23", name: "肇庆市高要区禄步镇昌大昌砂石码头", type: "码头", subType: "散货", km: "355",
      note: "主要货物类型：砂石",
      params: { "泊位数": "2个", "货物类型": "砂石" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.12000, lng: 112.64000 },
      validFrom: "2015-01-01", validUntil: ""
    },

    /* ══════════════════════════════════════════════════════════
       肇庆辖区渡口（12个）- 基于实际清单数据
       ══════════════════════════════════════════════════════════ */
    { 
      id: "el_ferry_01", name: "料塘渡口", type: "渡口", subType: "客渡", km: "270",
      note: "位置：封开县江川镇料塘村；通运航线：料塘渡口—江口渡口",
      params: { "航班频率": "每30分钟", "运营时间": "06:00-20:00", "载客量": "50人" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.25000, lng: 111.60000 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_ferry_02", name: "江口渡口", type: "渡口", subType: "客渡", km: "275",
      note: "位置：封开县江川镇翠星路科；通运航线：江口渡口—新兴、料塘、豆腐坊渡口",
      params: { "航班频率": "每30分钟", "运营时间": "06:00-20:00", "载客量": "50人" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.24500, lng: 111.65000 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_ferry_03", name: "新兴渡口", type: "渡口", subType: "客渡", km: "277",
      note: "位置：封开县江川镇新兴村；通运航线：新兴渡口—江口渡口",
      params: { "航班频率": "每40分钟", "运营时间": "06:00-19:00", "载客量": "40人" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.24000, lng: 111.66000 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_ferry_04", name: "豆腐坊渡口", type: "渡口", subType: "客渡", km: "279",
      note: "位置：封开县江川镇豆腐坊村；通运航线：豆腐坊渡口—江口渡口",
      params: { "航班频率": "每40分钟", "运营时间": "06:00-19:00", "载客量": "40人" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.23500, lng: 111.67000 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_ferry_05", name: "勒竹渡口", type: "渡口", subType: "客渡", km: "288",
      note: "位置：封开县渔涝镇勒竹村；通运航线：勒竹渡口—湴塘渡口",
      params: { "航班频率": "每40分钟", "运营时间": "06:00-19:00", "载��量": "40人" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.29000, lng: 111.47000 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_ferry_06", name: "湴塘渡口", type: "渡口", subType: "客渡", km: "290",
      note: "位置：封开县渔涝镇湴塘村；通运航线：湴塘渡口—勒竹渡口",
      params: { "航班频率": "每40分钟", "运营时间": "06:00-19:00", "载客量": "40人" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.30500, lng: 111.43000 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_ferry_07", name: "桂圩渡口", type: "渡口", subType: "客渡", km: "298",
      note: "位置：德庆县九市镇桂圩；通运航线：桂圩渡口—陈村渡口",
      params: { "航班频率": "每30分钟", "运营时间": "06:00-20:00", "载客量": "60人" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.06000, lng: 112.20000 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_ferry_08", name: "陈村渡口", type: "渡口", subType: "客渡", km: "300",
      note: "位置：德庆县九市镇陈村；通运航线：陈村渡口—桂圩渡口",
      params: { "航班频率": "每30分钟", "运营时间": "06:00-20:00", "载客量": "60人" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.07000, lng: 112.18000 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_ferry_09", name: "德庆渡口", type: "渡口", subType: "汽渡", km: "312",
      note: "位置：德庆县德城镇；通运航线：德庆渡口往返对岸，客渡频繁横越航道，注意避让",
      params: { "航班频率": "每20分钟", "运营时间": "06:00-22:00", "载重": "40吨", "载客量": "80人" },
      riskLevel: "高", status: "正常",
      coordinates: { lat: 23.14450, lng: 111.78560 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_ferry_10", name: "悦城渡口", type: "渡口", subType: "客渡", km: "318",
      note: "位置：德庆县悦城镇；通运航线：悦城渡口往返对岸",
      params: { "航班频率": "每30分钟", "运营时间": "06:00-20:00", "载客量": "50人" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.12000, lng: 112.05000 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_ferry_11", name: "高要渡口", type: "渡口", subType: "汽渡", km: "340",
      note: "位置：肇庆市高要区；通运航线：高要渡口往返对岸，汽渡横越，大型车辆运输频繁",
      params: { "航班频率": "每30分钟", "运营时间": "06:00-22:00", "载重": "50吨", "载客量": "100人" },
      riskLevel: "中", status: "正常",
      coordinates: { lat: 23.02890, lng: 112.45120 },
      validFrom: "2012-01-01", validUntil: ""
    },
    { 
      id: "el_ferry_12", name: "莲塘渡口", type: "渡口", subType: "客渡", km: "348",
      note: "位置：肇庆市高要区莲塘镇；通运航线：莲塘渡口往返对岸",
      params: { "航班频率": "每40分钟", "运营时间": "06:00-19:00", "载客量": "40人" },
      riskLevel: "低", status: "正常",
      coordinates: { lat: 23.11000, lng: 112.60000 },
      validFrom: "2010-01-01", validUntil: ""
    },

    /* ══════════════════════════════════════════════════════════
       其他重要通航要素（桥梁、取水口等）
       ══════════════════════════════════════════════════════════ */
    { 
      id: "el_bridge_01", name: "肇庆西江大桥", type: "桥梁", subType: "公路梁桥", km: "327",
      note: "公路桥，注意桥墩水流变化和限速规定",
      params: { "通航孔": "2#~4#孔", "净空": "18m", "净宽": "150m", "基准水位": "3.8m", "关联水文站": "hy_1" },
      riskLevel: "中", status: "正常",
      coordinates: { lat: 23.0458, lng: 112.4625 },
      validFrom: "2020-01-01", validUntil: ""
    },
    { 
      id: "el_bridge_02", name: "高要大桥", type: "桥梁", subType: "公路桥", km: "341",
      note: "注意桥区水流偏压，限速通行",
      params: { "通航孔": "主通航孔", "净空": "20m", "净宽": "180m", "基准水位": "3.8m", "关联水文站": "hy_1" },
      riskLevel: "中", status: "正常",
      coordinates: { lat: 23.0312, lng: 112.4589 },
      validFrom: "2018-06-01", validUntil: ""
    },
    { 
      id: "el_intake_01", name: "肇庆水厂取水口", type: "取水口", subType: "市政取水", km: "325",
      note: "禁止锚泊、排污，保持足够横距",
      params: { "管道深度": "6m", "禁锚范围": "上下各200m", "标志": "白色灯桩" },
      riskLevel: "高", status: "正常",
      coordinates: { lat: 23.0512, lng: 112.4689 },
      validFrom: "2016-01-01", validUntil: ""
    },
    { 
      id: "el_area_01", name: "高要水域商渔密集区", type: "商渔密集区", subType: "商渔混合", km: "340-345",
      note: "商船及渔船密集，控制航速，加强VHF值守",
      params: { "日均船舶": "200+艘", "高峰时段": "6-10时", "限速": "8节" },
      riskLevel: "高", status: "正常",
      coordinates: { lat: 23.0345, lng: 112.4556 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_anchor_01", name: "肇庆临时锚泊区", type: "临时锚泊区", subType: "临时锚地", km: "330",
      note: "限制锚泊船舶数量，注意走锚风险",
      params: { "容量": "12艘", "水深": "8-12m", "底质": "泥沙" },
      riskLevel: "中", status: "正常",
      coordinates: { lat: 23.0478, lng: 112.4656 },
      validFrom: "2015-01-01", validUntil: ""
    },
    { 
      id: "el_anchor_02", name: "高要锚泊区", type: "临时锚泊区", subType: "待泊锚地", km: "343",
      note: "大风天气需加强锚泊措施",
      params: { "容量": "15艘", "水深": "7-10m", "底质": "泥质" },
      riskLevel: "中", status: "受限",
      coordinates: { lat: 23.0323, lng: 112.4578 },
      validFrom: "2014-01-01", validUntil: "",
      statusNote: "汛期受限，需VTS批准方可锚泊"
    },

    /* ══════════════════════════════════════════════════════════
       横越水域（6个）- 船舶频繁横越的高风险区域
       ══════════════════════════════════════════════════════════ */
    { 
      id: "el_cross_01", name: "贺江汇入口横越水域", type: "横越水域", subType: "支流汇入", km: "282",
      note: "贺江主支流交汇处，小型船舶频繁横越进出贺江，注意避让",
      params: { "横越频率": "15-20艘次/小时", "高峰时段": "07:00-18:00", "主要船型": "小型货船、渔船", "建议措施": "减速慢行，加强瞭望" },
      riskLevel: "中", status: "正常",
      coordinates: { lat: 23.28000, lng: 111.52000 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_cross_02", name: "德庆渡口横越密集区", type: "横越水域", subType: "渡口横越", km: "310-314",
      note: "德庆渡口、悦城渡口集中区域，客渡、汽渡频繁横越主航道",
      params: { "横越频率": "30-40艘次/小时", "高峰时段": "06:30-09:00, 17:00-19:30", "主要船型": "客渡、汽渡", "建议措施": "VHF 16频道值守，主动避让渡船" },
      riskLevel: "高", status: "正常",
      coordinates: { lat: 23.13000, lng: 111.80000 },
      validFrom: "2010-01-01", validUntil: ""
    },
    { 
      id: "el_cross_03", name: "肇庆港区横越水域", type: "横越水域", subType: "港区作业", km: "323-327",
      note: "肇庆港三榕港、国际集装箱码头作业区，拖轮、驳船频繁横越调头",
      params: { "横越频率": "40-60艘次/小时", "高峰时段": "全天", "主要船型": "拖轮、驳船、集装箱船", "建议措施": "强制VTS报告，服从港区调度" },
      riskLevel: "高", status: "正常",
      coordinates: { lat: 23.06000, lng: 112.45000 },
      validFrom: "2015-01-01", validUntil: ""
    },
    { 
      id: "el_cross_04", name: "金利工业区横越水域", type: "横越水域", subType: "码头密集", km: "335-340",
      note: "金利镇多个砂石码头作业区，砂石船频繁横越装卸",
      params: { "横越频率": "25-35艘次/小时", "高峰时段": "08:00-17:00", "主要船型": "砂石船、散货船", "建议措施": "注意码头进出船舶动态" },
      riskLevel: "中", status: "正常",
      coordinates: { lat: 23.08500, lng: 112.53000 },
      validFrom: "2016-01-01", validUntil: ""
    },
    { 
      id: "el_cross_05", name: "高要渡口横越水域", type: "横越水域", subType: "渡口横越", km: "340",
      note: "高要汽渡横越作业区，大型车辆运输频繁，横越时间较长",
      params: { "横越频率": "20-25艘次/小时", "高峰时段": "07:00-09:00, 17:00-19:00", "主要船型": "汽渡", "横越时间": "8-12分钟", "建议措施": "避开高峰时段，主动避让汽渡" },
      riskLevel: "中", status: "正常",
      coordinates: { lat: 23.02890, lng: 112.45120 },
      validFrom: "2012-01-01", validUntil: ""
    },
    { 
      id: "el_cross_06", name: "莲塘作业区横越水域", type: "横越水域", subType: "渔船横越", km: "348",
      note: "莲塘渡口及渔船作业区，小型渔船频繁横越捕鱼",
      params: { "横越频率": "10-15艘次/小时", "高峰时段": "凌晨04:00-06:00, 傍晚17:00-19:00", "主要船型": "小型渔船、客渡", "建议措施": "夜间航行加强探照，注意无灯渔船" },
      riskLevel: "中", status: "正常",
      coordinates: { lat: 23.11000, lng: 112.60000 },
      validFrom: "2010-01-01", validUntil: ""
    },

    /* ══════════════════════════════════════════════════════════
       水工水域（5个）- 水上施工作业区域
       ══════════════════════════════════════════════════════════ */
    { 
      id: "el_work_01", name: "封开大桥维修施工区", type: "水工水域", subType: "桥梁维护", km: "275-276",
      note: "封开大桥主桥墩维护加固施工，单侧通航，通航宽度受限",
      params: { "施工单位": "广东省交通集团", "施工时段": "2026-03-01至2026-06-30", "作业范围": "主桥墩周边100米水域", "通航限制": "单侧通航，限速8km/h", "联系方式": "VHF 09频道" },
      riskLevel: "高", status: "受限", statusNote: "施工期间单侧通航，限速8km/h",
      coordinates: { lat: 23.24800, lng: 111.48500 },
      validFrom: "2026-03-01", validUntil: "2026-06-30"
    },
    { 
      id: "el_work_02", name: "航道清淤作业区", type: "水工水域", subType: "航道疏浚", km: "295-297",
      note: "航道维护性清淤作业，疏浚船、泥驳作业中，航道宽度临时缩减",
      params: { "施工单位": "肇庆航道局", "施工时段": "2026-04-10至2026-05-20", "作业范围": "主航道南侧300米范围", "通航限制": "北侧航道通行，限宽80米", "作业船舶": "3艘疏浚船、5艘泥驳" },
      riskLevel: "中", status: "受限", statusNote: "清淤期间航道宽度缩减至80米",
      coordinates: { lat: 23.16000, lng: 111.68000 },
      validFrom: "2026-04-10", validUntil: "2026-05-20"
    },
    { 
      id: "el_work_03", name: "德庆水文站水下缆线铺设区", type: "水工水域", subType: "水下施工", km: "312",
      note: "水文监测设备升级，水下光缆铺设作业，禁止抛锚",
      params: { "施工单位": "肇庆水文局", "施工时段": "2026-03-20至2026-04-05", "作业范围": "水文站两侧各200米", "通航限制": "禁止抛锚，减速慢行", "水下设施": "光缆、传感器阵列" },
      riskLevel: "中", status: "受限", statusNote: "水下光缆施工区，禁止抛锚",
      coordinates: { lat: 23.13500, lng: 111.81000 },
      validFrom: "2026-03-20", validUntil: "2026-04-05"
    },
    { 
      id: "el_work_04", name: "肇庆新港码头扩建区", type: "水工水域", subType: "码头建设", km: "325-327",
      note: "肇庆新港二期码头扩建工程，打桩船、起重船作业，主航道局部占用",
      params: { "施工单位": "肇庆港务集团", "施工时段": "2026-01-01至2027-12-31", "作业范围": "主航道东侧500米水域", "通航限制": "西侧航道通行，避让施工船舶", "作业时间": "06:00-22:00" },
      riskLevel: "高", status: "受限", statusNote: "码头扩建施工，避让作业船舶",
      coordinates: { lat: 23.06500, lng: 112.46000 },
      validFrom: "2026-01-01", validUntil: "2027-12-31"
    },
    { 
      id: "el_work_05", name: "羚羊峡水电站大坝定期检修区", type: "水工水域", subType: "水工维护", km: "355",
      note: "羚羊峡水电站大坝年度例行检修，闸门调试可能引起水位波动",
      params: { "施工单位": "广东电网肇庆分公司", "施工时段": "2026-03-25至2026-04-10", "作业范围": "大坝上下游各1公里", "通航限制": "注意水位变化，服从水电站调度", "水位影响": "水位可能突升/突降0.5-1.0米" },
      riskLevel: "中", status: "正常", statusNote: "",
      coordinates: { lat: 23.08000, lng: 112.55000 },
      validFrom: "2026-03-25", validUntil: "2026-04-10"
    },
  ];

  const warnings = MOCK_WARNINGS;
  const navigationRisks = MOCK_NAVIGATION_RISKS;
  const navigationRules = MOCK_NAVIGATION_RULES;

  const weathers = MOCK_WEATHERS;
  const hydros = MOCK_HYDROS;

  const routes = [
    { id: "rt_1", name: "肇庆-广州主航路", origin: "肇庆港", destination: "广州港", distance: "约110公里", time: "约6-8小时", status: "active" },
    { id: "rt_2", name: "肇庆-佛山支线航路", origin: "肇庆港", destination: "佛山港", distance: "约85公里", time: "约5-6小时", status: "active" },
  ];

  setStore("elements", elements);
  setStore("warnings", warnings);
  setStore("navigationRisks", navigationRisks);
  setStore("navigationRules", navigationRules);
  setStore("weathers", weathers);
  setStore("hydros", hydros);
  setStore("routes", routes);
  setStore("msaOffices", MOCK_MSA_OFFICES);

  return "初始化完成！已写入 " + (elements.length + warnings.length + navigationRisks.length + navigationRules.length + weathers.length + hydros.length + routes.length + MOCK_MSA_OFFICES.length) + " 条数据";
}

/* ═══════════════════════════════════════════════════════════
   桥梁实时净空计算 API
   Bridge Real-time Clearance Calculation
   ═══════════════════════════════════════════════════════════ */

export interface BridgeClearanceResult {
  bridgeId: string;
  bridgeName: string;
  bridgeKm: string;
  
  // 设计参数
  designClearance: number;        // 设计净空高度（米）
  baseWaterLevel: number;         // 基准水位（米）
  navigationSpanWidth: number;    // 通航孔净宽（米）
  
  // 实时数据
  nearestHydroStation: string;    // 最近水文站名称
  currentWaterLevel: number;      // 实时水位（米）
  waterLevelDelta: number;        // 水位差 = 实时水位 - 基准水位
  
  // 计算结果
  actualClearance: number;        // 实际净空 = 设计净空 - 水位差
  requiredReserve: number;        // 要求富裕净空（米）
  maxShipHeight: number;          // 可通过最大船高 = 实际净空 - 富裕净空
  
  // 安全评估
  safetyStatus: "安全" | "警告" | "危险";
  safetyColor: "green" | "yellow" | "red";
  recommendation: string;
  
  // 相关规则和风险
  relatedRules: any[];
  relatedRisks: any[];
}

/**
 * 计算桥梁实时净空高度
 * @param bridgeId 桥梁ID
 * @returns 桥梁净空计算结果
 */
export async function calculateBridgeClearance(bridgeId: string): Promise<BridgeClearanceResult> {
  await delay();
  
  // 获取桥梁数据
  const bridge = await apiGetOne<any>(`elements/${bridgeId}`);
  if (bridge.type !== "桥梁") {
    throw new Error("该要素不是桥梁类型");
  }
  
  // 解析桥梁参数
  const designClearance = parseFloat(bridge.params?.["净空"]?.replace("m", "") || bridge.params?.["设计净空"]?.replace("m", "") || "18");
  const baseWaterLevel = parseFloat(bridge.params?.["基准水位"]?.replace("m", "") || "3.8");
  const navigationSpanWidth = parseFloat(bridge.params?.["净宽"]?.replace("m", "") || "150");
  const nearestStationId = bridge.params?.["关联水文站"] || "hy_1"; // 默认高要站
  
  // 获取实时水文数据
  let currentWaterLevel = baseWaterLevel; // 默认值
  let nearestHydroStation = "高要站";
  try {
    const hydros = await apiGet<any>("hydros");
    const nearestStation = hydros.find((h: any) => h.id === nearestStationId) || hydros[0];
    if (nearestStation) {
      currentWaterLevel = parseFloat(nearestStation.waterLevel?.replace("m", "") || baseWaterLevel.toString());
      nearestHydroStation = nearestStation.station;
    }
  } catch (e) {
    console.warn("获取水文数据失败，使用基准水位", e);
  }
  
  // 计算实际净空
  const waterLevelDelta = currentWaterLevel - baseWaterLevel;
  const actualClearance = designClearance - waterLevelDelta;
  
  // 富裕净空要求：设计净空≥18m的保留2m，否则保留1m
  const requiredReserve = designClearance >= 18 ? 2 : 1;
  const maxShipHeight = actualClearance - requiredReserve;
  
  // 安全评估
  let safetyStatus: "安全" | "警告" | "危险";
  let safetyColor: "green" | "yellow" | "red";
  let recommendation: string;
  
  if (maxShipHeight >= 15) {
    safetyStatus = "安全";
    safetyColor = "green";
    recommendation = `当前水位${currentWaterLevel.toFixed(1)}m，实际净空${actualClearance.toFixed(1)}m。扣除富裕净空${requiredReserve}m后，船舶高度不超过${maxShipHeight.toFixed(1)}m可安全通过。通航条件良好。`;
  } else if (maxShipHeight >= 10) {
    safetyStatus = "警告";
    safetyColor = "yellow";
    recommendation = `当前水位${currentWaterLevel.toFixed(1)}m，实际净空${actualClearance.toFixed(1)}m。扣除富裕净空${requiredReserve}m后，船舶高度不超过${maxShipHeight.toFixed(1)}m可通过。请谨慎评估船舶高度，建议联系VTS确认。`;
  } else {
    safetyStatus = "危险";
    safetyColor = "red";
    recommendation = `⚠️ 警告：当前水位${currentWaterLevel.toFixed(1)}m（${waterLevelDelta > 0 ? '超' : '低于'}基准水位${Math.abs(waterLevelDelta).toFixed(1)}m），实际净空仅${actualClearance.toFixed(1)}m。高度超过${maxShipHeight.toFixed(1)}m的船舶禁止通过！建议等待水位下降或改航。`;
  }
  
  // 查询相关规则和风险
  const allRules = await apiGet<any>("navigationRules");
  const allRisks = await apiGet<any>("navigationRisks");
  
  const relatedRules = allRules.filter((r: any) => 
    r.status === "生效中" && 
    (r.title.includes("桥梁") || r.title.includes("净空") || r.title.includes("富裕") || 
     r.applicableArea.includes(bridge.name) || r.content.includes("桥区"))
  );
  
  const relatedRisks = allRisks.filter((r: any) => 
    r.status === "active" && 
    r.relatedElements?.includes("桥梁") &&
    (r.title.includes(bridge.name) || r.location.includes(bridge.name) || r.title.includes("桥"))
  );
  
  return {
    bridgeId: bridge.id,
    bridgeName: bridge.name,
    bridgeKm: bridge.km,
    designClearance,
    baseWaterLevel,
    navigationSpanWidth,
    nearestHydroStation,
    currentWaterLevel,
    waterLevelDelta,
    actualClearance,
    requiredReserve,
    maxShipHeight,
    safetyStatus,
    safetyColor,
    recommendation,
    relatedRules,
    relatedRisks,
  };
}

/**
 * 批量计算航线上所有桥梁的净空
 * @param bridgeIds 桥梁ID数组
 */
export async function calculateRouteBridgesClearance(bridgeIds: string[]): Promise<BridgeClearanceResult[]> {
  const results: BridgeClearanceResult[] = [];
  for (const id of bridgeIds) {
    try {
      const result = await calculateBridgeClearance(id);
      results.push(result);
    } catch (e) {
      console.warn(`计算桥梁${id}净空失败`, e);
    }
  }
  return results;
}

/**
 * 获取所有桥梁及其实时净空状态
 */
export async function getAllBridgesWithClearance(): Promise<BridgeClearanceResult[]> {
  const elements = await apiGet<any>("elements");
  const bridges = elements.filter((e: any) => e.type === "桥梁");
  const results: BridgeClearanceResult[] = [];
  
  for (const bridge of bridges) {
    try {
      const result = await calculateBridgeClearance(bridge.id);
      results.push(result);
    } catch (e) {
      console.warn(`计算桥梁${bridge.name}净空失败`, e);
    }
  }
  
  return results;
}
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const PREFIX = "/make-server-662cbb26";

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

/* ─── Generic CRUD helpers ─── */
const collections = ["element", "warning", "weather", "hydro", "route", "route_waypoint"] as const;

// LIST all items in a collection
collections.forEach((col) => {
  app.get(`${PREFIX}/api/${col}s`, async (c) => {
    try {
      const items = await kv.getByPrefix(`${col}:`);
      // Sort by updatedAt descending
      items.sort((a: any, b: any) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
      return c.json({ data: items });
    } catch (e: any) {
      console.log(`Error listing ${col}s: ${e.message}`);
      return c.json({ error: `Failed to list ${col}s: ${e.message}` }, 500);
    }
  });

  // GET single
  app.get(`${PREFIX}/api/${col}s/:id`, async (c) => {
    try {
      const id = c.req.param("id");
      const item = await kv.get(`${col}:${id}`);
      if (!item) return c.json({ error: `${col} not found` }, 404);
      return c.json({ data: item });
    } catch (e: any) {
      console.log(`Error getting ${col}: ${e.message}`);
      return c.json({ error: `Failed to get ${col}: ${e.message}` }, 500);
    }
  });

  // CREATE
  app.post(`${PREFIX}/api/${col}s`, async (c) => {
    try {
      const body = await c.req.json();
      const id = body.id || crypto.randomUUID();
      const now = new Date().toISOString();
      const item = { ...body, id, createdAt: now, updatedAt: now };
      await kv.set(`${col}:${id}`, item);
      return c.json({ data: item }, 201);
    } catch (e: any) {
      console.log(`Error creating ${col}: ${e.message}`);
      return c.json({ error: `Failed to create ${col}: ${e.message}` }, 500);
    }
  });

  // UPDATE
  app.put(`${PREFIX}/api/${col}s/:id`, async (c) => {
    try {
      const id = c.req.param("id");
      const existing = await kv.get(`${col}:${id}`);
      if (!existing) return c.json({ error: `${col} not found` }, 404);
      const body = await c.req.json();
      const now = new Date().toISOString();
      const updated = { ...existing, ...body, id, updatedAt: now };
      await kv.set(`${col}:${id}`, updated);
      return c.json({ data: updated });
    } catch (e: any) {
      console.log(`Error updating ${col}: ${e.message}`);
      return c.json({ error: `Failed to update ${col}: ${e.message}` }, 500);
    }
  });

  // DELETE
  app.delete(`${PREFIX}/api/${col}s/:id`, async (c) => {
    try {
      const id = c.req.param("id");
      await kv.del(`${col}:${id}`);
      return c.json({ success: true });
    } catch (e: any) {
      console.log(`Error deleting ${col}: ${e.message}`);
      return c.json({ error: `Failed to delete ${col}: ${e.message}` }, 500);
    }
  });
});

/* ─── Seed default data endpoint ─── */
app.post(`${PREFIX}/api/seed`, async (c) => {
  try {
    // Check if already seeded
    const existing = await kv.get("meta:seeded");
    if (existing) return c.json({ message: "Already seeded" });

    const now = new Date().toISOString();
    const makeItem = (col: string, data: any) => {
      const id = crypto.randomUUID();
      return { key: `${col}:${id}`, value: { ...data, id, createdAt: now, updatedAt: now } };
    };

    const items: { key: string; value: any }[] = [];

    // Elements - bridges
    [
      { name: "肇庆西江大桥", type: "桥梁", subType: "公路梁桥", km: "218.5", note: "公路桥，注意桥墩水流变化和限速规定", params: {通航孔: "2#~4#孔", 净空: "18m", 净宽: "150m" } },
      { name: "高要大桥", type: "桥梁", subType: "公路桥", km: "195.0", note: "注意桥区水流偏压，限速通行", params: { 通航孔: "主通航孔", 净空: "20m", 净宽: "180m" } },
      { name: "三水大桥", type: "桥梁", subType: "公路桥", km: "128.0", note: "临近北江汇流区，水流复杂，加强了望", params: { 通航孔: "主通航孔", 净空: "22m", 净宽: "200m" } },
    ].forEach((d) => items.push(makeItem("element", d)));

    // Elements - ferries
    [
      { name: "德庆渡口", type: "渡口", subType: "客渡", km: "185.5", note: "客渡频繁横越航道，注意避让，鸣笛示警", params: { 航班: "每20分钟", 横越宽度: "0.8km", 高峰时段: "7-9时" } },
      { name: "高要渡口", type: "渡口", subType: "汽渡", km: "192.0", note: "汽渡横越，大型车辆运输频繁", params: { 航班: "每30分钟", 横越宽度: "1.0km", 载重: "50吨" } },
    ].forEach((d) => items.push(makeItem("element", d)));

    // Elements - water intakes
    [
      { name: "肇庆水厂取水口", type: "取水口", subType: "市政取水", km: "215.3", note: "禁止锚泊、排污，持足够横距", params: { 管道深度: "6m", 禁锚范围: "上下各200m", 标志: "白色灯桩" } },
      { name: "三水水厂取水口", type: "取水口", subType: "工业取水", km: "130.5", note: "禁止锚泊，注意灯标标识", params: { 管道深度: "7m", 禁锚范围: "上下各150m", 标志: "红色灯桩" } },
    ].forEach((d) => items.push(makeItem("element", d)));

    // Elements - dense areas
    [
      { name: "高要水域", type: "商渔密集区", subType: "商渔混合", km: "200-195", note: "商船及渔船密集，控制航速，加强VHF值守", params: { 日均船舶: "200+艘", 高峰时段: "6-10时", 限速: "8节" } },
      { name: "三水汇流水域", type: "商渔密集区", subType: "汇流交汇区", km: "130-125", note: "北江西江汇流处，船舶交汇密集，注意避让", params: { 渔船数量: "约40艘", 作业方式: "定置网", 密集时段: "凌晨4-8时" } },
    ].forEach((d) => items.push(makeItem("element", d)));

    // Elements - anchorages
    [
      { name: "肇庆临时锚泊区", type: "临时锚泊区", subType: "临时锚地", km: "210.0", note: "限制锚泊船舶数量，注意走锚风险", params: { 容量: "12艘", 水深: "8-12m", 底质: "泥沙" } },
      { name: "高要锚泊区", type: "临时锚泊区", subType: "待泊锚地", km: "198.0", note: "大风天气需加强锚泊措施", params: { 容量: "15艘", 水深: "7-10m", 底质: "泥质" } },
    ].forEach((d) => items.push(makeItem("element", d)));

    // Elements - crossing areas
    [
      { name: "德庆横越水域", type: "横越水域", subType: "港区横越", km: "186.0", note: "船舶横越频繁，加强了望，控制航速", params: { 横越船舶: "日均50艘", 横越宽度: "1.2km", 管制: "VTS监控" } },
      { name: "三水横越水域", type: "横越水域", subType: "航道横越", km: "129.0", note: "北江西江交汇，大型船舶横越需提前与VTS联系", params: { 横越船舶: "日均80艘", 横越宽度: "1.8km", 管制: "报告制" } },
    ].forEach((d) => items.push(makeItem("element", d)));

    // Warnings
    [
      { level: "紧急", title: "西江肇庆段#12浮标临时调整", content: "#12红浮调整至南偏30米位置，航经船舶注意辨识。", status: "active" },
      { level: "管制", title: "高要大桥段单向通航管制", content: "3月20日08:00-12:00实施单向通航管制。", status: "active" },
    ].forEach((d) => items.push(makeItem("warning", d)));

    // Weather
    [
      { area: "肇庆段", temp: "18-26°C", wind: "东南风3级", visibility: "8km" },
      { area: "三水段", temp: "19-27°C", wind: "南风3-4级", visibility: "6km" },
    ].forEach((d) => items.push(makeItem("weather", d)));

    // Hydro
    [
      { station: "高要站", waterLevel: "5.2m", flow: "18000m³/s", tide: "落潮中，低潮预计16:00" },
      { station: "三水站", waterLevel: "4.8m", flow: "15000m³/s", tide: "平潮，转涨预计17:00" },
    ].forEach((d) => items.push(makeItem("hydro", d)));

    // Route
    const routeId = crypto.randomUUID();
    items.push({
      key: `route:${routeId}`,
      value: {
        id: routeId,
        name: "肇庆港→广州港",
        origin: "肇庆港",
        destination: "广州港",
        distance: "约110公里",
        time: "约6-8小时",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    });

    // Batch write
    await kv.mset(
      items.map((i) => i.key),
      items.map((i) => i.value)
    );
    await kv.set("meta:seeded", { seeded: true, at: now });

    return c.json({ message: "Seed complete", count: items.length });
  } catch (e: any) {
    console.log(`Error seeding: ${e.message}`);
    return c.json({ error: `Failed to seed: ${e.message}` }, 500);
  }
});

/* ─── Report assembly endpoint ─── */
app.get(`${PREFIX}/api/report`, async (c) => {
  try {
    const shipName = c.req.query("ship") || "未知船舶";
    const origin = c.req.query("origin") || "肇庆港";
    const destination = c.req.query("dest") || "广州港";

    const [elements, warnings, weathers, hydros, routes] = await Promise.all([
      kv.getByPrefix("element:"),
      kv.getByPrefix("warning:"),
      kv.getByPrefix("weather:"),
      kv.getByPrefix("hydro:"),
      kv.getByPrefix("route:"),
    ]);

    // Group elements by type
    const typeMap: Record<string, any[]> = {};
    for (const el of elements) {
      if (!typeMap[el.type]) typeMap[el.type] = [];
      typeMap[el.type].push({
        name: el.name,
        km: el.km,
        note: el.note,
        subType: el.subType,
        params: el.params
          ? Object.entries(el.params).map(([label, value]) => ({ label, value }))
          : [],
      });
    }
    const groupedElements = Object.entries(typeMap).map(([type, items]) => ({
      type,
      count: items.length,
      items,
    }));

    // Warnings - only active
    const activeWarnings = warnings
      .filter((w: any) => w.status === "active")
      .map((w: any) => ({ level: w.level, title: w.title, content: w.content }));

    // Weather
    const weatherData = weathers.map((w: any) => ({
      area: w.area, temp: w.temp, wind: w.wind, visibility: w.visibility,
    }));

    // Hydro
    const hydroData = hydros.map((h: any) => ({
      station: h.station, waterLevel: h.waterLevel, flow: h.flow, tide: h.tide,
    }));

    // Route - pick first active or first available
    const activeRoute = routes.find((r: any) => r.status === "active") || routes[0];

    // Build waypoints from elements sorted by km (descending for 肇庆→广州)
    const allElements = [...elements].sort((a: any, b: any) => {
      const kmA = parseFloat(String(a.km).split("-")[0]) || 0;
      const kmB = parseFloat(String(b.km).split("-")[0]) || 0;
      return kmB - kmA; // descending km = order along route
    });

    const waypoints: any[] = [{ label: `${origin}出发` }];
    for (const el of allElements) {
      const paramsStr = el.params
        ? Object.entries(el.params).map(([k, v]) => `${k}${v}`).join("，")
        : "";
      waypoints.push({
        label: el.name,
        type: el.type,
        note: `${paramsStr ? paramsStr + "。" : ""}${el.note}`,
      });
    }
    waypoints.push({ label: `安全抵达${destination}` });

    const report = {
      shipName,
      origin,
      destination,
      elements: groupedElements,
      warnings: activeWarnings,
      weather: weatherData,
      hydro: hydroData,
      route: {
        distance: activeRoute?.distance || "数据待更新",
        time: activeRoute?.time || "数据待更新",
        waypoints,
      },
    };

    return c.json({ data: report });
  } catch (e: any) {
    console.log(`Error assembling report: ${e.message}`);
    return c.json({ error: `Failed to assemble report: ${e.message}` }, 500);
  }
});

/* ─── Quick query endpoints ─── */
app.get(`${PREFIX}/api/query/warnings`, async (c) => {
  try {
    const warnings = await kv.getByPrefix("warning:");
    const active = warnings.filter((w: any) => w.status === "active");
    return c.json({ data: active });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/api/query/weather`, async (c) => {
  try {
    const [weathers, hydros] = await Promise.all([
      kv.getByPrefix("weather:"),
      kv.getByPrefix("hydro:"),
    ]);
    return c.json({ data: { weather: weathers, hydro: hydros } });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

Deno.serve(app.fetch);
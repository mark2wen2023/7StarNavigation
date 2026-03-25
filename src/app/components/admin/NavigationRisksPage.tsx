import React, { useState } from "react";
import {
  XOctagon, Plus, RefreshCw, Search, Loader2, Database, AlertTriangle,
  Gauge, Pencil, Trash2, Save, Ship, GitBranch, Anchor, Cloud, Droplets,
  XCircle, MapPin, TrendingUp, FileText
} from "lucide-react";
import { apiPost, apiPut, apiDelete } from "./api";
import { toast } from "sonner";

// Import shared components - these will be passed as props
export function NavigationRisksPage({ risks, loading, onReload, T, isDark, PageHeader, StatCard, Glass, DarkButton, FormModal, C }: {
  risks: any[];
  loading: boolean;
  onReload: () => void;
  T: any;
  isDark: boolean;
  PageHeader: any;
  StatCard: any;
  Glass: any;
  DarkButton: any;
  FormModal: any;
  C: any;
}) {
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [riskLevelFilter, setRiskLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const activeRisks = risks.filter((r: any) => r.status === "active");
  const highRisks = activeRisks.filter((r: any) => r.riskLevel === "高");
  const avgSeverity = activeRisks.length > 0 
    ? (activeRisks.reduce((s: number, r: any) => s + (r.severity || 0), 0) / activeRisks.length).toFixed(1)
    : "0.0";

  const categories = ["碰撞风险", "交通冲突", "搁浅风险", "气象风险", "水文风险", "碍航物风险"];
  
  const filteredRisks = risks.filter((r) => {
    const matchCategory = categoryFilter === "all" || r.category === categoryFilter;
    const matchRiskLevel = riskLevelFilter === "all" || r.riskLevel === riskLevelFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchSearch = !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchRiskLevel && matchStatus && matchSearch;
  });

  const handleSave = async (formData: any) => {
    try {
      if (editItem?.id) { 
        await apiPut(`navigationRisks/${editItem.id}`, formData); 
        toast.success("更新成功"); 
      } else { 
        await apiPost("navigationRisks", formData); 
        toast.success("添加成功"); 
      }
      setEditItem(null); 
      setCreating(false); 
      onReload();
    } catch (e: any) { 
      toast.error("保存失败: " + e.message); 
    }
  };

  const handleDelete = async (id: string) => {
    try { 
      await apiDelete(`navigationRisks/${id}`); 
      toast.success("删除成功"); 
      onReload(); 
    } catch (e: any) { 
      toast.error("删除失败: " + e.message); 
    }
  };

  const riskLevelColor = (level: string) => {
    switch (level) {
      case "高": return "text-red-400 bg-red-400/10";
      case "中": return "text-amber-400 bg-amber-400/10";
      case "低": return "text-blue-400 bg-blue-400/10";
      default: return T.text5;
    }
  };

  const categoryIcon = (category: string) => {
    switch (category) {
      case "碰撞风险": return Ship;
      case "交通冲突": return GitBranch;
      case "搁浅风险": return Anchor;
      case "气象风险": return Cloud;
      case "水文风险": return Droplets;
      case "碍航物风险": return XCircle;
      default: return AlertTriangle;
    }
  };

  return (
    <div>
      <PageHeader
        icon={XOctagon}
        title="通航风险知识库"
        subtitle="基于历史案例和专家评估的结论性风险数据管理"
        gradient="from-rose-500 to-red-600"
        actions={
          <div className="flex items-center gap-2">
            <DarkButton onClick={() => setCreating(true)} variant="primary">
              <Plus size={14} /> 新增风险
            </DarkButton>
            <DarkButton onClick={onReload} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 刷新
            </DarkButton>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={Database} 
          label="风险总数" 
          value={risks.length} 
          gradient="from-rose-500 to-red-600" 
          glow={C.red} 
        />
        <StatCard 
          icon={AlertTriangle} 
          label="活跃风险" 
          value={activeRisks.length} 
          gradient="from-amber-500 to-orange-600" 
          glow={C.amber} 
        />
        <StatCard 
          icon={XOctagon} 
          label="高风险点" 
          value={highRisks.length} 
          gradient="from-red-500 to-rose-600" 
          glow={C.rose} 
        />
        <StatCard 
          icon={Gauge} 
          label="平均严重度" 
          value={avgSeverity} 
          gradient="from-purple-500 to-pink-600" 
          glow={C.purple} 
        />
      </div>

      {/* Filters */}
      <Glass className="p-5 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${T.inputBg}`}>
              <Search size={16} className={T.text5} />
              <input
                type="text"
                placeholder="搜索风险标题、位置、措施..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`flex-1 bg-transparent text-sm ${T.text2} placeholder:${T.text6} outline-none`}
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-sm ${T.inputBg} ${T.text3} outline-none`}
          >
            <option value="all">全部类别</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={riskLevelFilter}
            onChange={(e) => setRiskLevelFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-sm ${T.inputBg} ${T.text3} outline-none`}
          >
            <option value="all">全部等级</option>
            <option value="高">高风险</option>
            <option value="中">中风险</option>
            <option value="低">低风险</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-sm ${T.inputBg} ${T.text3} outline-none`}
          >
            <option value="all">全部状态</option>
            <option value="active">活跃</option>
            <option value="archived">已归档</option>
          </select>
        </div>
      </Glass>

      {/* Risks List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className={`${T.text5} animate-spin`} />
        </div>
      ) : filteredRisks.length === 0 ? (
        <Glass className="p-12 text-center">
          <Database size={48} className={`${T.text6} mx-auto mb-4`} />
          <p className={`${T.text4} mb-2`}>暂无风险数据</p>
          <p className={`text-xs ${T.text6}`}>点击"新增风险"开始录入历史案例</p>
        </Glass>
      ) : (
        <div className="space-y-4">
          {filteredRisks.map((risk) => {
            const Icon = categoryIcon(risk.category);
            return (
              <Glass key={risk.id} className="p-5 group">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shrink-0`}>
                    <Icon size={20} className="text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-base ${T.text1} font-medium mb-1`}>{risk.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${riskLevelColor(risk.riskLevel)}`}>
                            {risk.riskLevel}风险
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${T.innerBg2} ${T.text5}`}>
                            {risk.category}
                          </span>
                          <span className={`text-xs ${T.text5} flex items-center gap-1`}>
                            <MapPin size={12} /> {risk.location}
                          </span>
                          {risk.status === "archived" && (
                            <span className={`px-2 py-0.5 rounded text-[10px] bg-gray-400/10 text-gray-400`}>
                              已归档
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <DarkButton onClick={() => setEditItem(risk)} size="sm">
                          <Pencil size={13} />
                        </DarkButton>
                        <DarkButton onClick={() => handleDelete(risk.id)} size="sm">
                          <Trash2 size={13} />
                        </DarkButton>
                      </div>
                    </div>

                    <p className={`text-sm ${T.text3} mb-3`}>{risk.description}</p>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 mb-3 text-xs">
                      <div className={`flex items-center gap-1 ${T.text4}`}>
                        <Gauge size={12} />
                        严重度: <span className="text-rose-400">{risk.severity}/10</span>
                      </div>
                      <div className={`flex items-center gap-1 ${T.text4}`}>
                        <TrendingUp size={12} />
                        发生概率: {risk.probability}
                      </div>
                      <div className={`flex items-center gap-1 ${T.text4}`}>
                        <XCircle size={12} />
                        影响程度: {risk.impact}
                      </div>
                      {risk.historicalCases && (
                        <div className={`flex items-center gap-1 ${T.text4}`}>
                          <FileText size={12} />
                          历史案例: {risk.historicalCases.length}起
                        </div>
                      )}
                    </div>

                    {/* Historical Cases Preview */}
                    {risk.historicalCases && risk.historicalCases.length > 0 && (
                      <div className={`p-3 rounded-lg ${T.innerBg2} mb-3`}>
                        <p className={`text-[10px] ${T.text6} uppercase tracking-wide mb-2`}>历史案例</p>
                        <div className="space-y-2">
                          {risk.historicalCases.slice(0, 2).map((c: any, i: number) => (
                            <div key={i} className={`text-xs ${T.text4}`}>
                              <span className={T.text5}>{c.date}</span> · {c.vessel} · {c.incident}
                            </div>
                          ))}
                          {risk.historicalCases.length > 2 && (
                            <p className={`text-[10px] ${T.text6}`}>
                              ... 还有 {risk.historicalCases.length - 2} 起案例
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mitigation */}
                    <div className={`p-3 rounded-lg ${T.innerBg2}`}>
                      <p className={`text-[10px] ${T.text6} uppercase tracking-wide mb-1`}>应对措施</p>
                      <p className={`text-xs ${T.text4}`}>{risk.mitigation}</p>
                    </div>

                    {/* Footer */}
                    <div className={`flex items-center justify-between mt-3 pt-3 border-t ${T.borderT} text-[10px] ${T.text6}`}>
                      <div className="flex items-center gap-3">
                        <span>审核: {risk.reviewedBy}</span>
                        <span>更新: {risk.lastUpdated}</span>
                      </div>
                      {risk.attachments && risk.attachments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText size={10} />
                          {risk.attachments.length} 个附件
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Glass>
            );
          })}
        </div>
      )}

      {/* Results Count */}
      {filteredRisks.length > 0 && (
        <div className={`mt-4 text-xs ${T.text5} text-center`}>
          共 {filteredRisks.length} 条风险记录
        </div>
      )}

      {/* Create/Edit Modal */}
      <FormModal
        open={creating || !!editItem}
        title={editItem ? "编辑风险" : "新增风险"}
        onClose={() => { setCreating(false); setEditItem(null); }}
      >
        <NavigationRiskForm
          initialData={editItem}
          onSave={handleSave}
          onCancel={() => { setCreating(false); setEditItem(null); }}
          T={T}
          DarkButton={DarkButton}
        />
      </FormModal>
    </div>
  );
}

/* ─── Navigation Risk Form ─── */
function NavigationRiskForm({ initialData, onSave, onCancel, T, DarkButton }: {
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  T: any;
  DarkButton: any;
}) {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    category: initialData?.category || "碰撞风险",
    riskLevel: initialData?.riskLevel || "中",
    location: initialData?.location || "",
    relatedElements: initialData?.relatedElements || [],
    description: initialData?.description || "",
    mitigation: initialData?.mitigation || "",
    status: initialData?.status || "active",
    severity: initialData?.severity || 5,
    probability: initialData?.probability || "中",
    impact: initialData?.impact || "较大",
    reviewedBy: initialData?.reviewedBy || "肇庆海事局",
    lastUpdated: initialData?.lastUpdated || new Date().toISOString().split("T")[0],
    historicalCases: initialData?.historicalCases || [],
    attachments: initialData?.attachments || [],
  });

  const categories = ["碰撞风险", "交通冲突", "搁浅风险", "气象风险", "水文风险", "碍航物风险"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-xs ${T.text4} mb-1.5`}>风险标题 *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg text-sm ${T.inputBg} ${T.text2} outline-none`}
            placeholder="例如：高要大桥桥墩追越碰撞高风险点"
          />
        </div>
        <div>
          <label className={`block text-xs ${T.text4} mb-1.5`}>位置 *</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg text-sm ${T.inputBg} ${T.text2} outline-none`}
            placeholder="例如：西江高要大桥桥区（K342-K343）"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={`block text-xs ${T.text4} mb-1.5`}>风险类别 *</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg text-sm ${T.inputBg} ${T.text2} outline-none`}
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={`block text-xs ${T.text4} mb-1.5`}>风险等级 *</label>
          <select
            value={form.riskLevel}
            onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg text-sm ${T.inputBg} ${T.text2} outline-none`}
          >
            <option value="高">高</option>
            <option value="中">中</option>
            <option value="低">低</option>
          </select>
        </div>
        <div>
          <label className={`block text-xs ${T.text4} mb-1.5`}>状态</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg text-sm ${T.inputBg} ${T.text2} outline-none`}
          >
            <option value="active">活跃</option>
            <option value="archived">已归档</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={`block text-xs ${T.text4} mb-1.5`}>严重度 (1-10)</label>
          <input
            type="number"
            min="1"
            max="10"
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: parseInt(e.target.value) || 5 })}
            className={`w-full px-3 py-2 rounded-lg text-sm ${T.inputBg} ${T.text2} outline-none`}
          />
        </div>
        <div>
          <label className={`block text-xs ${T.text4} mb-1.5`}>发生概率</label>
          <select
            value={form.probability}
            onChange={(e) => setForm({ ...form, probability: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg text-sm ${T.inputBg} ${T.text2} outline-none`}
          >
            <option value="高">高</option>
            <option value="中">中</option>
            <option value="低">低</option>
          </select>
        </div>
        <div>
          <label className={`block text-xs ${T.text4} mb-1.5`}>影响程度</label>
          <select
            value={form.impact}
            onChange={(e) => setForm({ ...form, impact: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg text-sm ${T.inputBg} ${T.text2} outline-none`}
          >
            <option value="重大">重大</option>
            <option value="较大">较大</option>
            <option value="一般">一般</option>
            <option value="较小">较小</option>
          </select>
        </div>
      </div>

      <div>
        <label className={`block text-xs ${T.text4} mb-1.5`}>风险描述 *</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          className={`w-full px-3 py-2 rounded-lg text-sm ${T.inputBg} ${T.text2} outline-none resize-none`}
          placeholder="详细描述风险情况、统计数据、主要原因等..."
        />
      </div>

      <div>
        <label className={`block text-xs ${T.text4} mb-1.5`}>应对措施 *</label>
        <textarea
          value={form.mitigation}
          onChange={(e) => setForm({ ...form, mitigation: e.target.value })}
          rows={3}
          className={`w-full px-3 py-2 rounded-lg text-sm ${T.inputBg} ${T.text2} outline-none resize-none`}
          placeholder="建议的预防和应对措施..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`block text-xs ${T.text4} mb-1.5`}>审核单位</label>
          <input
            type="text"
            value={form.reviewedBy}
            onChange={(e) => setForm({ ...form, reviewedBy: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg text-sm ${T.inputBg} ${T.text2} outline-none`}
          />
        </div>
        <div>
          <label className={`block text-xs ${T.text4} mb-1.5`}>更新日期</label>
          <input
            type="date"
            value={form.lastUpdated}
            onChange={(e) => setForm({ ...form, lastUpdated: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg text-sm ${T.inputBg} ${T.text2} outline-none`}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <DarkButton onClick={() => onSave(form)} variant="primary" className="flex-1 justify-center">
          <Save size={14} /> 保存
        </DarkButton>
        <DarkButton onClick={onCancel}>取消</DarkButton>
      </div>
    </div>
  );
}

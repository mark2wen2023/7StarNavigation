import { useState, useMemo } from "react";
import { Search, Plus, Edit2, Trash2, BookOpen, AlertCircle, CheckCircle, Scale, FileText, Shield, BookOpenCheck, Archive, TrendingUp, Upload, FileUp, Sparkles } from "lucide-react";
import { apiPost, apiPut, apiDelete } from "./api";
import { toast } from "sonner";
import { RuleDocumentUploader } from "./RuleDocumentUploader";

interface NavigationRule {
  id: string;
  title: string;
  category: string;
  ruleType: string;
  applicableArea: string;
  content: string;
  legalBasis: string;
  penalty: string;
  effectiveDate: string;
  status: string;
  priority: string;
  enforcementUnit: string;
  attachments?: Array<{ name: string; size: number; type: string }>;
}

interface Props {
  rules: NavigationRule[];
  onRefresh: () => void;
}

export function NavigationRulesPage({ rules, onRefresh }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [typeFilter, setTypeFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [priorityFilter, setPriorityFilter] = useState("全部");
  const [showModal, setShowModal] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [editingRule, setEditingRule] = useState<NavigationRule | null>(null);
  const [selectedRule, setSelectedRule] = useState<NavigationRule | null>(null);

  // 统计数据 - 优化为更符合"法规知识库"特点
  const stats = useMemo(() => {
    const total = rules.length;
    const active = rules.filter(r => r.status === "生效中").length;
    const mandatory = rules.filter(r => r.priority === "强制").length;
    
    // 按分类统计
    const categoryStats = rules.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // 统计覆盖水域数量（去重）
    const uniqueAreas = new Set(rules.map(r => r.applicableArea)).size;
    
    return { total, active, mandatory, categoryStats, uniqueAreas };
  }, [rules]);

  // 筛选规则
  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      const matchesSearch = rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           rule.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           rule.applicableArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           rule.legalBasis.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "全部" || rule.category === categoryFilter;
      const matchesType = typeFilter === "全部" || rule.ruleType === typeFilter;
      const matchesStatus = statusFilter === "全部" || rule.status === statusFilter;
      const matchesPriority = priorityFilter === "全部" || rule.priority === priorityFilter;
      return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesPriority;
    });
  }, [rules, searchTerm, categoryFilter, typeFilter, statusFilter, priorityFilter]);

  const categories = ["全部", ...Array.from(new Set(rules.map(r => r.category)))];
  const types = ["全部", ...Array.from(new Set(rules.map(r => r.ruleType)))];
  const statuses = ["全部", "生效中", "草稿", "已废止"];
  const priorities = ["全部", "强制", "建议", "参考"];

  const handleAdd = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const handleEdit = (rule: NavigationRule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除此航行规则？")) return;
    try {
      await apiDelete(`navigationRules/${id}`);
      toast.success("删除成功");
      onRefresh();
    } catch (e: any) {
      toast.error("删除失败: " + e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      title: formData.get("title"),
      category: formData.get("category"),
      ruleType: formData.get("ruleType"),
      applicableArea: formData.get("applicableArea"),
      content: formData.get("content"),
      legalBasis: formData.get("legalBasis"),
      penalty: formData.get("penalty"),
      effectiveDate: formData.get("effectiveDate"),
      status: formData.get("status"),
      priority: formData.get("priority"),
      enforcementUnit: formData.get("enforcementUnit"),
    };

    try {
      if (editingRule) {
        await apiPut(`navigationRules/${editingRule.id}`, data);
        toast.success("更新成功");
      } else {
        await apiPost("navigationRules", data);
        toast.success("新增成功");
      }
      setShowModal(false);
      onRefresh();
    } catch (e: any) {
      toast.error("操作失败: " + e.message);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "速度管理": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      "禁航管制": "bg-red-500/10 text-red-600 dark:text-red-400",
      "锚泊规定": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      "通航要求": "bg-green-500/10 text-green-600 dark:text-green-400",
      "安全规范": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      "环保要求": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    };
    return colors[category] || "bg-gray-500/10 text-gray-600 dark:text-gray-400";
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "强制") return <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-600 dark:text-red-400">强制</span>;
    if (priority === "建议") return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">建议</span>;
    return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/10 text-gray-600 dark:text-gray-400">参考</span>;
  };

  const getStatusBadge = (status: string) => {
    if (status === "生效中") return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-600 dark:text-green-400"><CheckCircle className="w-3 h-3" />生效中</span>;
    if (status === "草稿") return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-500/10 text-gray-600 dark:text-gray-400"><FileText className="w-3 h-3" />草稿</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-600 dark:text-red-400"><AlertCircle className="w-3 h-3" />已废止</span>;
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">航行规则管理</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">管理西江干线航行规则、限制措施及处罚标准</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            <span>上传文档</span>
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增规则
          </button>
        </div>
      </div>

      {/* 统计卡片 - 优化为更符合"法规知识库"特点 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">规则总数</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">法规知识库</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">生效规则</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">{stats.active}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">现行有效</p>
            </div>
            <BookOpenCheck className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">强制规则</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">{stats.mandatory}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">须严格执行</p>
            </div>
            <Shield className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">规则分类</p>
              <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400 mt-1">{Object.keys(stats.categoryStats).length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">类别数量</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">覆盖水域</p>
              <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400 mt-1">{stats.uniqueAreas}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">适用范围</p>
            </div>
            <Archive className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* 搜索和筛选 - 增加优先级筛选 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索规则、法律依据..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {types.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {priorities.map(priority => <option key={priority} value={priority}>{priority}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
      </div>

      {/* 规则列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">规则名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">分类</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">适用水域</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">优先级</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">生效日期</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{rule.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{rule.content}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(rule.category)}`}>
                      {rule.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{rule.ruleType}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{rule.applicableArea}</td>
                  <td className="px-4 py-3">{getPriorityBadge(rule.priority)}</td>
                  <td className="px-4 py-3">{getStatusBadge(rule.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{rule.effectiveDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRules.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无符合条件的航行规则</p>
          </div>
        )}
      </div>

      {/* 新增/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingRule ? "编辑航行规则" : "新增航行规则"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">规则名称 *</label>
                  <input
                    name="title"
                    defaultValue={editingRule?.title}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">分类 *</label>
                  <select
                    name="category"
                    defaultValue={editingRule?.category}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="速度管理">速度管理</option>
                    <option value="禁航管制">禁航管制</option>
                    <option value="锚泊规定">锚泊规定</option>
                    <option value="通航要求">通航要求</option>
                    <option value="安全规范">安全规范</option>
                    <option value="环保要求">环保要求</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">规则类型 *</label>
                  <select
                    name="ruleType"
                    defaultValue={editingRule?.ruleType}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="速度限制">速度限制</option>
                    <option value="禁止通航">禁止通航</option>
                    <option value="限制通航">限制通航</option>
                    <option value="锚泊管理">锚泊管理</option>
                    <option value="设备要求">设备要求</option>
                    <option value="操作规范">操作规范</option>
                    <option value="环保标准">环保标准</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">适用水域 *</label>
                  <input
                    name="applicableArea"
                    defaultValue={editingRule?.applicableArea}
                    required
                    placeholder="例如：西江全线、肇庆段等"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">优先级 *</label>
                  <select
                    name="priority"
                    defaultValue={editingRule?.priority || "强制"}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="强制">强制</option>
                    <option value="建议">建议</option>
                    <option value="参考">参考</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">规则内容 *</label>
                  <textarea
                    name="content"
                    defaultValue={editingRule?.content}
                    required
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">法律依据</label>
                  <input
                    name="legalBasis"
                    defaultValue={editingRule?.legalBasis}
                    placeholder="例如：《中华人民共和国内河交通安全管理条例》第XX条"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">违规处罚</label>
                  <textarea
                    name="penalty"
                    defaultValue={editingRule?.penalty}
                    rows={2}
                    placeholder="例如：警告；罚款500-2000元；情节严重者吊销证书"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">生效日期 *</label>
                  <input
                    name="effectiveDate"
                    type="date"
                    defaultValue={editingRule?.effectiveDate}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态 *</label>
                  <select
                    name="status"
                    defaultValue={editingRule?.status || "生效中"}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="生效中">生效中</option>
                    <option value="草稿">草稿</option>
                    <option value="已废止">已废止</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">执法单位</label>
                  <input
                    name="enforcementUnit"
                    defaultValue={editingRule?.enforcementUnit}
                    placeholder="例如：肇庆海事局"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingRule ? "更新" : "新增"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 文档上传组件 */}
      {showUploader && (
        <RuleDocumentUploader
          onClose={() => setShowUploader(false)}
          onSuccess={() => {
            setShowUploader(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
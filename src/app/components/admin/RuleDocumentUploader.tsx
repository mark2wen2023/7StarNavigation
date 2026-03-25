import { useState } from "react";
import { Upload, FileUp, Sparkles, Loader2, CheckCircle2, AlertCircle, X, FileText, Copy } from "lucide-react";
import { toast } from "sonner";
import mammoth from 'mammoth';
import { apiPost } from "./api";

interface ExtractedRule {
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
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function RuleDocumentUploader({ onClose, onSuccess }: Props) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedRules, setExtractedRules] = useState<ExtractedRule[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['.docx', '.doc', '.txt'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      toast.error("仅支持 Word (.docx, .doc) 和文本 (.txt) 格式");
      return;
    }

    setSelectedFile(file);
  };

  const parseTextContent = (text: string): ExtractedRule[] => {
    const rules: ExtractedRule[] = [];
    
    // 智能解析文本，提取航行规则
    // 使用简单的规则匹配模式
    const sections = text.split(/\n\s*\n/); // 按空行分段
    
    for (const section of sections) {
      if (section.trim().length < 20) continue; // 忽略太短的段落
      
      // 检测是否包含规则关键词
      const ruleKeywords = ['禁止', '限制', '应当', '不得', '必须', '规定', '要求', '标准'];
      const hasRuleKeyword = ruleKeywords.some(kw => section.includes(kw));
      
      if (!hasRuleKeyword) continue;
      
      // 提取标题（第一行或包含"第X条"的行）
      const lines = section.split('\n').filter(l => l.trim());
      let title = lines[0]?.trim() || '未命名规则';
      
      // 查找"第X条"模式
      const articleMatch = section.match(/第[一二三四五六七八九十百\d]+条[：:\s]*(.*?)(?:\n|$)/);
      if (articleMatch) {
        title = articleMatch[1]?.trim() || articleMatch[0].trim();
      }
      
      // 智能分类
      let category = "通航要求";
      let ruleType = "操作规范";
      let priority = "强制";
      
      if (section.includes('速度') || section.includes('航速') || section.includes('限速')) {
        category = "速度管理";
        ruleType = "速度限制";
      } else if (section.includes('禁止通航') || section.includes('禁航')) {
        category = "禁航管制";
        ruleType = "禁止通航";
        priority = "强制";
      } else if (section.includes('限制通航')) {
        category = "禁航管制";
        ruleType = "限制通航";
      } else if (section.includes('锚泊') || section.includes('抛锚')) {
        category = "锚泊规定";
        ruleType = "锚泊管理";
      } else if (section.includes('污染') || section.includes('排放') || section.includes('环保')) {
        category = "环保要求";
        ruleType = "环保标准";
      } else if (section.includes('设备') || section.includes('仪') || section.includes('装置')) {
        category = "安全规范";
        ruleType = "设备要求";
      }
      
      // 提取适用水域
      let applicableArea = "西江肇庆段";
      const areaMatch = section.match(/(西江|肇庆|封开|德庆|高要|羚羊峡)[段水域域区]*/);
      if (areaMatch) {
        applicableArea = areaMatch[0];
      }
      
      // 提取法律依据
      let legalBasis = "";
      const legalMatch = section.match(/《.*?》.*?第.*?条/);
      if (legalMatch) {
        legalBasis = legalMatch[0];
      }
      
      // 提取处罚内容
      let penalty = "";
      const penaltyMatch = section.match(/(罚款|警告|吊销|处.*?元|处.*?罚).*?[。；]/);
      if (penaltyMatch) {
        penalty = penaltyMatch[0];
      }
      
      // 提取生效日期
      let effectiveDate = new Date().toISOString().split('T')[0];
      const dateMatch = section.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        effectiveDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // 提取执法单位
      let enforcementUnit = "肇庆海事局";
      const unitMatch = section.match(/(海事局|交通[运输]*局|港航局)/);
      if (unitMatch) {
        enforcementUnit = unitMatch[0].includes('海事') ? "肇庆海事局" : unitMatch[0];
      }
      
      rules.push({
        title: title.substring(0, 100), // 限制长度
        category,
        ruleType,
        applicableArea,
        content: section.trim().substring(0, 1000), // 限制长度
        legalBasis,
        penalty,
        effectiveDate,
        status: "生效中",
        priority,
        enforcementUnit,
      });
    }
    
    return rules;
  };

  const handleExtract = async () => {
    if (!selectedFile && !pastedText) {
      toast.error("请先选择文件或粘贴文本");
      return;
    }

    setExtracting(true);
    
    try {
      let textContent = "";
      
      // 根据文件类型解析
      if (selectedFile) {
        if (selectedFile.name.endsWith('.txt')) {
          textContent = await selectedFile.text();
        } else if (selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc')) {
          const arrayBuffer = await selectedFile.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          textContent = result.value;
        }
      } else if (pastedText) {
        textContent = pastedText;
      }
      
      if (!textContent.trim()) {
        toast.error("文档内容为空");
        setExtracting(false);
        return;
      }
      
      // 解析提取规则
      const rules = parseTextContent(textContent);
      
      if (rules.length === 0) {
        toast.error("未能从文档中识别出航行规则，请确保文档包含规则相关内容");
        setExtracting(false);
        return;
      }
      
      setExtractedRules(rules);
      toast.success(`成功识别 ${rules.length} 条航行规则`);
    } catch (error: any) {
      console.error("文档解析失败:", error);
      toast.error("文档解析失败: " + error.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleImport = async () => {
    if (extractedRules.length === 0) {
      toast.error("没有可导入的规则");
      return;
    }

    setImporting(true);
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const rule of extractedRules) {
        try {
          await apiPost("navigationRules", rule);
          successCount++;
        } catch (e) {
          failCount++;
          console.error("导入规则失败:", rule.title, e);
        }
      }
      
      if (successCount > 0) {
        toast.success(`成功导入 ${successCount} 条规则${failCount > 0 ? `，失败 ${failCount} 条` : ''}`);
        onSuccess();
        onClose();
      } else {
        toast.error("规则导入全部失败");
      }
    } catch (error: any) {
      toast.error("导入失败: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  const updateRule = (index: number, field: keyof ExtractedRule, value: string) => {
    setExtractedRules(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeRule = (index: number) => {
    setExtractedRules(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-semibold">智能文档解析</h3>
              <p className="text-sm text-indigo-100">上传航行规则文档，自动提取结构化规则</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 上传区域 */}
          {extractedRules.length === 0 && (
            <div className="space-y-4">
              {/* 模式切换 */}
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <button
                  onClick={() => setInputMode('file')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    inputMode === 'file'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <FileUp className="w-4 h-4" />
                  <span>文件上传</span>
                </button>
                <button
                  onClick={() => setInputMode('paste')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    inputMode === 'paste'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>文本粘贴</span>
                </button>
              </div>

              {/* 文件上传模式 */}
              {inputMode === 'file' && (
                <>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      id="ruleFile"
                      accept=".docx,.doc,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="ruleFile"
                      className="cursor-pointer flex flex-col items-center gap-4"
                    >
                      <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                        <FileUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          点击上传规则文档
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          支持 Word (.docx, .doc) 和文本 (.txt) 格式
                        </p>
                      </div>
                      {selectedFile && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm">{selectedFile.name}</span>
                        </div>
                      )}
                    </label>
                  </div>

                  {selectedFile && (
                    <button
                      onClick={handleExtract}
                      disabled={extracting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      {extracting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>AI 解析中...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>开始智能解析</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {/* 文本粘贴模式 */}
              {inputMode === 'paste' && (
                <>
                  <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-900 px-4 py-2 border-b border-gray-300 dark:border-gray-600 flex items-center gap-2">
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">粘贴规则文本（支持从PDF/网页/文档复制）</span>
                    </div>
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="请粘贴航行规则文本内容...\n\n示例：\n第一条 本办法适用于西江肇庆段...\n第二条 船舶航行速度不得超过...\n..."
                      className="w-full h-64 px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none"
                    />
                    <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{pastedText.length} 字符</span>
                      <span>支持从任何来源复制粘贴文本</span>
                    </div>
                  </div>

                  {pastedText.trim().length > 0 && (
                    <button
                      onClick={handleExtract}
                      disabled={extracting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      {extracting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>AI 解析中...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>开始智能解析</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {/* 使用说明 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-100 space-y-2">
                    <p className="font-medium">使用说明：</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                      <li>支持上传包含航行规则的完整文档（如《西江肇庆段通航管理办法》）</li>
                      <li>系统将自动识别规则标题、内容、分类、法律依据、处罚标准等信息</li>
                      <li>解析完成后可预览和编辑每条规则，确认无误后批量导入</li>
                      <li>建议文档格式规范，包含明确的条款编号和结构</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 解析结果 */}
          {extractedRules.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    已识别 {extractedRules.length} 条规则
                  </span>
                </div>
                <button
                  onClick={() => setExtractedRules([])}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  重新上传
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {extractedRules.map((rule, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <input
                          value={rule.title}
                          onChange={(e) => updateRule(index, 'title', e.target.value)}
                          className="w-full font-medium text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-indigo-500 outline-none px-1 py-1"
                        />
                      </div>
                      <button
                        onClick={() => removeRule(index)}
                        className="text-gray-400 hover:text-red-600 ml-2"
                        title="移除"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <select
                        value={rule.category}
                        onChange={(e) => updateRule(index, 'category', e.target.value)}
                        className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                      >
                        <option>速度管理</option>
                        <option>禁航管制</option>
                        <option>锚泊规定</option>
                        <option>通航要求</option>
                        <option>安全规范</option>
                        <option>环保要求</option>
                      </select>
                      <select
                        value={rule.priority}
                        onChange={(e) => updateRule(index, 'priority', e.target.value)}
                        className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                      >
                        <option>强制</option>
                        <option>建议</option>
                        <option>参考</option>
                      </select>
                      <input
                        value={rule.applicableArea}
                        onChange={(e) => updateRule(index, 'applicableArea', e.target.value)}
                        placeholder="适用水域"
                        className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                      />
                      <input
                        value={rule.effectiveDate}
                        onChange={(e) => updateRule(index, 'effectiveDate', e.target.value)}
                        type="date"
                        className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                      />
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {rule.content}
                    </p>

                    {rule.legalBasis && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        📄 {rule.legalBasis}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        {extractedRules.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>导入中...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>批量导入 ({extractedRules.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

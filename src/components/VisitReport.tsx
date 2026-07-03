import React, { useState } from "react";
import { VisitEvaluation, OMANI_INDICATORS, EvaluationRating } from "../types";
import { 
  Printer, 
  ArrowLeft, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  FileDown, 
  Loader2,
  School,
  User,
  Calendar,
  BookOpen,
  Clock,
  ShieldCheck,
  BadgeCheck,
  FileText,
  Bookmark,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  Activity,
  HeartHandshake,
  CalendarDays,
  UserCheck,
  Zap
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface VisitReportProps {
  visit: VisitEvaluation;
  onClose?: () => void;
  isWizardMode?: boolean;
  onPrevStep?: () => void;
  onSave?: () => void;
}

export const VisitReport: React.FC<VisitReportProps> = ({ 
  visit, 
  onClose,
  isWizardMode = false,
  onPrevStep,
  onSave
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [viewMode, setViewMode] = useState<"modern" | "official">("modern");

  // Calculate overall metrics
  const totalIndicators = OMANI_INDICATORS.length;
  const scoresArray = OMANI_INDICATORS.map(ind => visit.scores[ind.id] || EvaluationRating.SUITABLE);
  
  const counts = {
    outstanding: scoresArray.filter(s => s === EvaluationRating.OUTSTANDING).length,
    good: scoresArray.filter(s => s === EvaluationRating.GOOD).length,
    suitable: scoresArray.filter(s => s === EvaluationRating.SUITABLE).length,
    unsuitable: scoresArray.filter(s => s === EvaluationRating.UNSUITABLE).length,
    intervention: scoresArray.filter(s => s === EvaluationRating.NEEDS_INTERVENTION).length,
  };

  // Average Score Calculation
  const numericValues = {
    [EvaluationRating.OUTSTANDING]: 1,
    [EvaluationRating.GOOD]: 2,
    [EvaluationRating.SUITABLE]: 3,
    [EvaluationRating.UNSUITABLE]: 4,
    [EvaluationRating.NEEDS_INTERVENTION]: 5,
  };

  const totalSum = scoresArray.reduce((acc, score) => acc + numericValues[score], 0);
  const averageScore = Number((totalSum / totalIndicators).toFixed(1));

  const getOverallPerformanceLabel = (avg: number) => {
    if (avg <= 1.5) return { text: "متميز جداً", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    if (avg <= 2.5) return { text: "جيد جداً", color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20" };
    if (avg <= 3.5) return { text: "أداء ملائم ومستقر", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    if (avg <= 4.5) return { text: "يحتاج تطوير وتركيز", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" };
    return { text: "يتطلب تدخل عاجل ومتابعة", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };
  };

  const performance = getOverallPerformanceLabel(averageScore);

  const getRatingLabel = (rating: EvaluationRating) => {
    switch (rating) {
      case EvaluationRating.OUTSTANDING:
        return "متميز (1)";
      case EvaluationRating.GOOD:
        return "جيد (2)";
      case EvaluationRating.SUITABLE:
        return "ملائم (3)";
      case EvaluationRating.UNSUITABLE:
        return "غير ملائم (4)";
      case EvaluationRating.NEEDS_INTERVENTION:
        return "يحتاج إلى تدخل (5)";
      default:
        return "-";
    }
  };

  const getRatingBadgeClass = (rating: EvaluationRating) => {
    switch (rating) {
      case EvaluationRating.OUTSTANDING:
        return "bg-emerald-50/80 text-emerald-700 border-emerald-200/80 shadow-sm shadow-emerald-100/30";
      case EvaluationRating.GOOD:
        return "bg-sky-50/80 text-sky-700 border-sky-200/80 shadow-sm shadow-sky-100/30";
      case EvaluationRating.SUITABLE:
        return "bg-amber-50/80 text-amber-700 border-amber-200/80 shadow-sm shadow-amber-100/30";
      case EvaluationRating.UNSUITABLE:
        return "bg-orange-50/80 text-orange-700 border-orange-200/80 shadow-sm shadow-orange-100/30";
      case EvaluationRating.NEEDS_INTERVENTION:
        return "bg-rose-50/80 text-rose-700 border-rose-200/80 shadow-sm shadow-rose-100/30";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getIndicatorColor = (rating: EvaluationRating) => {
    switch (rating) {
      case EvaluationRating.OUTSTANDING:
        return "border-emerald-500 bg-emerald-500/5";
      case EvaluationRating.GOOD:
        return "border-sky-500 bg-sky-500/5";
      case EvaluationRating.SUITABLE:
        return "border-amber-500 bg-amber-500/5";
      case EvaluationRating.UNSUITABLE:
        return "border-orange-500 bg-orange-500/5";
      case EvaluationRating.NEEDS_INTERVENTION:
        return "border-rose-500 bg-rose-500/5";
      default:
        return "border-slate-300 bg-slate-50";
    }
  };

  const handlePrint = () => {
    // Force switch to official view prior to printing to guarantee maximum printable fidelity
    const prevMode = viewMode;
    setViewMode("official");
    setTimeout(() => {
      window.print();
      // Restore mode
      setViewMode(prevMode);
    }, 150);
  };

  const handleExportPDF = async () => {
    // Force switch to official view to ensure standard high-quality document render for PDF output
    const prevMode = viewMode;
    setViewMode("official");
    
    setIsGeneratingPDF(true);
    try {
      // Small delay to ensure render tree has stabilized
      await new Promise((resolve) => setTimeout(resolve, 400));
      
      const element = document.getElementById("print-report-area");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2, // high-res crisp typography
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add other pages if necessary
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const rawName = visit.teacherName || "المعلم";
      const cleanName = rawName.trim().replace(/\s+/g, "_");
      const formattedDate = (visit.date || "").replace(/[/]/g, "-");
      const fileName = `تقرير_زيارة_${cleanName}_${formattedDate}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("حدث خطأ أثناء تصدير ملف PDF. يرجى المحاولة مرة أخرى أو استخدام ميزة طباعة الصفحة وحفظها كـ PDF.");
    } finally {
      setIsGeneratingPDF(false);
      setViewMode(prevMode); // Restore the modern view
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Action and Navigation Header bar (hidden during printing) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl print:hidden">
        
        {/* Navigation & Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {isWizardMode ? (
            <button
              onClick={onPrevStep}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans"
            >
              <ArrowLeft className="h-4 w-4 rotate-180" />
              <span>السابق: التقرير الختامي للبوابة</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-xs font-bold self-start cursor-pointer bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>العودة إلى السجل</span>
            </button>
          )}

          {/* Dual-Mode Layout Toggle (Reflecting App Spirit) */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex">
            <button
              type="button"
              onClick={() => setViewMode("modern")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "modern" 
                  ? "bg-gradient-to-r from-teal-500 to-sky-600 text-white shadow" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>لوحة العرض الحديثة</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("official")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "official" 
                  ? "bg-gradient-to-r from-teal-500 to-sky-600 text-white shadow" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>الاستمارة الرسمية للطباعة</span>
            </button>
          </div>
        </div>

        {/* Action buttons (Print/PDF export) */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-xl shadow-sm font-bold text-xs transition-all duration-150 border border-white/10 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-sky-400" />
            <span>طباعة الاستمارة الرسمية</span>
          </button>
          
          <button
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-xl shadow-md font-bold text-xs transition-all duration-150 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جاري تصدير PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 text-sky-200" />
                <span>تصدير كـ PDF رسمي</span>
              </>
            )}
          </button>

          {isWizardMode && onSave && (
            <button
              onClick={onSave}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl shadow-md font-bold text-xs transition-all duration-150 cursor-pointer border border-emerald-500/20"
            >
              <BadgeCheck className="h-4 w-4 text-emerald-200" />
              <span>اعتماد الاستمارة في الأرشيف</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: MODERN PRESENTATION VIEW (REFLECTS THE SPIRIT OF THE APPLICATION) */}
      {viewMode === "modern" && (
        <div className="space-y-6 animate-fade-in print:hidden">
          
          {/* Welcome Dashboard Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <Activity className="h-3 w-3 animate-pulse" />
                  <span>لوحة قياس الأداء التعليمي المتقدمة</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-100">
                  تقويم الأداء الفعلي: {visit.teacherName}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {visit.schoolName || "مدرسة الباسط للتعليم الأساسي"} • موضوع الحصة: <strong className="text-teal-400">{visit.lessonTopic}</strong>
                </p>
              </div>

              {/* Overall Performance Circle Indicator */}
              <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
                <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-slate-900 border-2 border-slate-800">
                  <div className="absolute inset-0 rounded-full border-2 border-sky-500/40 animate-ping" />
                  <span className="text-lg font-black text-white font-mono">{averageScore}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold block">معدل تقييم المؤشرات الـ13</span>
                  <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold ${performance.bg} ${performance.color} ${performance.border} border`}>
                    <span>{performance.text}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Grid: Basic Info with Premium Accent Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-bold text-[9px] block">المعلم المستهدف</span>
                <span className="font-extrabold text-slate-800 text-xs truncate block">{visit.teacherName}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-bold text-[9px] block">الرقم المدني / الوظيفي</span>
                <span className="font-bold text-slate-800 text-xs font-mono block">{visit.civilId || "16143978"}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-bold text-[9px] block">الصف والشعبة</span>
                <span className="font-bold text-slate-800 text-xs block">الصف {visit.grade} • شعبة ({visit.classroom})</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-bold text-[9px] block">تاريخ الزيارة والحصة</span>
                <span className="font-bold text-slate-800 text-xs block">{visit.date} • حصة {visit.period}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all col-span-2 sm:col-span-1 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-bold text-[9px] block">رقم الزيارة</span>
                <span className="font-extrabold text-slate-800 text-xs block">الزيارة رقم ({visit.visitNumber || 1})</span>
              </div>
            </div>

          </div>

          {/* Quick Metrics Bar Chart Distribution */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>مخطط توزيع المؤشرات الـ13 عبر مستويات التقييم الخمسة</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              
              <div className="bg-emerald-500/5 border border-emerald-500/15 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-emerald-800 text-[10px] font-bold block">متميز (1)</span>
                  <span className="text-[9px] text-slate-400">تطبيق مثالي</span>
                </div>
                <span className="text-base font-black text-emerald-700">{counts.outstanding}</span>
              </div>

              <div className="bg-sky-500/5 border border-sky-500/15 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-sky-800 text-[10px] font-bold block">جيد (2)</span>
                  <span className="text-[9px] text-slate-400">مهارات قوية</span>
                </div>
                <span className="text-base font-black text-sky-700">{counts.good}</span>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/15 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-amber-800 text-[10px] font-bold block">ملائم (3)</span>
                  <span className="text-[9px] text-slate-400">مستوى مقبول</span>
                </div>
                <span className="text-base font-black text-amber-700">{counts.suitable}</span>
              </div>

              <div className="bg-orange-500/5 border border-orange-500/15 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-orange-800 text-[10px] font-bold block">غير ملائم (4)</span>
                  <span className="text-[9px] text-slate-400">يحتاج تركيز</span>
                </div>
                <span className="text-base font-black text-orange-700">{counts.unsuitable}</span>
              </div>

              <div className="bg-rose-500/5 border border-rose-500/15 p-3 rounded-xl flex items-center justify-between col-span-2 sm:col-span-1">
                <div>
                  <span className="text-rose-800 text-[10px] font-bold block">تدخل عاجل (5)</span>
                  <span className="text-[9px] text-slate-400">أولوية فورية</span>
                </div>
                <span className="text-base font-black text-rose-700">{counts.intervention}</span>
              </div>

            </div>
          </div>

          {/* Interactive Indicators Dashboard Card Stack */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-r-4 border-teal-500 pr-2.5">
              <h3 className="font-black text-slate-900 text-sm">تفصيل الشواهد الميدانية والدرجات للمؤشرات الـ 13</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OMANI_INDICATORS.map((ind, index) => {
                const score = visit.scores[ind.id] || EvaluationRating.SUITABLE;
                const evidenceText = visit.evidence[ind.id] || "لم تُرصد شواهد محددة خلال الزيارة.";
                
                const scoreDetails = {
                  [EvaluationRating.OUTSTANDING]: { color: "from-emerald-500 to-teal-600", text: "متميز", num: 1, width: "w-full" },
                  [EvaluationRating.GOOD]: { color: "from-sky-500 to-indigo-600", text: "جيد", num: 2, width: "w-4/5" },
                  [EvaluationRating.SUITABLE]: { color: "from-amber-500 to-orange-600", text: "ملائم", num: 3, width: "w-3/5" },
                  [EvaluationRating.UNSUITABLE]: { color: "from-orange-500 to-rose-600", text: "غير ملائم", num: 4, width: "w-2/5" },
                  [EvaluationRating.NEEDS_INTERVENTION]: { color: "from-rose-600 to-red-700", text: "يحتاج تدخل", num: 5, width: "w-1/5" },
                }[score];

                return (
                  <div 
                    key={ind.id}
                    className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden group"
                  >
                    {/* Glowing highlight sidebar matching the score level */}
                    <div className={`absolute top-0 right-0 bottom-0 w-1.5 bg-gradient-to-b ${scoreDetails.color}`} />
                    
                    <div className="flex items-start justify-between gap-4 pr-1.5">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400">مؤشر {index + 1} • {ind.areaTitle}</span>
                        <h4 className="font-extrabold text-slate-800 text-xs sm:text-xs leading-normal">{ind.title}</h4>
                      </div>
                      
                      {/* Premium rating pill */}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg border ${getRatingBadgeClass(score)}`}>
                        <span className="text-[9px] opacity-70">درجة</span>
                        <span>{scoreDetails.num}</span>
                      </span>
                    </div>

                    {/* Performance Progress Track */}
                    <div className="space-y-1 pr-1.5">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400">
                        <span>مستوى التمكن: <strong className="text-slate-700">{scoreDetails.text}</strong></span>
                        <span>مؤشر الكفاءة</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${scoreDetails.color} ${scoreDetails.width} rounded-full transition-all duration-500`} />
                      </div>
                    </div>

                    {/* Descriptive Evidence text block in speech bubble style */}
                    <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 text-xs leading-relaxed font-bold text-slate-700 relative pr-1.5 mt-2 group-hover:bg-slate-50 transition-colors">
                      <div className="absolute top-3 right-0 w-1 h-6 bg-slate-200 group-hover:bg-teal-400 rounded-full transition-colors" />
                      <p className="italic">"{evidenceText}"</p>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Ministry of Education Portal Content Blocks (Sleek Bento layout) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-r-4 border-teal-500 pr-2.5">
              <h3 className="font-black text-slate-900 text-sm">حقول استمارة البوابة التعليمية (مُلخّصة ومُنسّقة)</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Card 1: Strengths */}
              <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-xl">
                      <Award className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">جوانب الإجادة والتميز</h4>
                      <p className="text-[10px] text-slate-400">الممارسات النموذجية الحالية للمعلم</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-500/20">جاهز للبوابة</span>
                </div>

                <div className="bg-white/80 border border-emerald-500/5 rounded-xl p-4 text-xs leading-relaxed font-bold text-slate-700 whitespace-pre-wrap shadow-inner">
                  {visit.generalStrengthsText || "لم تُرصد جوانب إجادة محددة خلال هذه الزيارة."}
                </div>
              </div>

              {/* Card 2: Areas for Development */}
              <div className="bg-gradient-to-br from-rose-500/5 to-red-500/5 border border-rose-500/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-rose-500/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-rose-500/10 text-rose-700 rounded-xl">
                      <TrendingUp className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">جوانب التمكين والتطوير</h4>
                      <p className="text-[10px] text-slate-400">الأولويات التدريسية التي تحتاج تركيز</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-rose-500/10 text-rose-800 px-2 py-0.5 rounded-lg border border-rose-500/20">جاهز للبوابة</span>
                </div>

                <div className="bg-white/80 border border-rose-500/5 rounded-xl p-4 text-xs leading-relaxed font-bold text-slate-700 whitespace-pre-wrap shadow-inner">
                  {visit.generalDevelopmentsText || "لم تُرصد أولويات تطوير محددة خلال هذه الزيارة."}
                </div>
              </div>

              {/* Card 3: Support Provided */}
              <div className="bg-gradient-to-br from-indigo-500/5 to-blue-500/5 border border-indigo-500/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-500/10 text-indigo-700 rounded-xl">
                      <HeartHandshake className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">الدعم والمساندة المقدمة للمعلم</h4>
                      <p className="text-[10px] text-slate-400">الإجراءات والبدائل المقدمة ميدانياً</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-800 px-2 py-0.5 rounded-lg border border-indigo-500/20">جاهز للبوابة</span>
                </div>

                <div className="bg-white/80 border border-indigo-500/5 rounded-xl p-4 text-xs leading-relaxed font-bold text-slate-700 whitespace-pre-wrap shadow-inner">
                  {visit.supportProvided || "تقديم التغذية الراجعة والبدائل التدريسية المباشرة وجلسة توجيهية ثنائية بعد الحصة الدراسية."}
                </div>
              </div>

              {/* Card 4: General Recommendations */}
              <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-amber-500/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/10 text-amber-700 rounded-xl">
                      <AlertTriangle className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">التوصيات والخطوات الإجرائية العامة</h4>
                      <p className="text-[10px] text-slate-400">التوصيات الإجرائية المعتمدة للمشرف والمدير</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-500/10 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-500/20">جاهز للبوابة</span>
                </div>

                <div className="bg-white/80 border border-amber-500/5 rounded-xl p-4 text-xs leading-relaxed font-bold text-slate-700 whitespace-pre-wrap shadow-inner">
                  {visit.recommendationsText || "الاستمرار في العطاء وتطبيق استراتيجيات التعلم النشط لتعظيم الأثر التحصيلي."}
                </div>
              </div>

            </div>
          </div>

          {/* Structured Action Recommendations List */}
          {visit.recommendations && visit.recommendations.length > 0 && (
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xl space-y-4 border border-slate-800">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
                <div>
                  <h4 className="font-extrabold text-xs">خطة التوصيات الإجرائية المجدولة وشركاء التنفيذ</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">خطوات تنفيذية واضحة ومسندة زمنياً لضمان التحسن المستمر والمتابعة الميدانية</p>
                </div>
              </div>

              <div className="space-y-3">
                {visit.recommendations.map((rec, i) => (
                  <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                          rec.type === "enrichment" 
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                            : rec.type === "remedial"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        }`}>
                          {rec.type === "enrichment" ? "إثرائية" : rec.type === "remedial" ? "علاجية" : "تطويرية"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">توصية رقم ({i + 1})</span>
                      </div>
                      <p className="text-xs font-bold text-slate-200">{rec.text}</p>
                    </div>

                    <div className="flex items-center gap-4 border-t md:border-t-0 md:border-r border-slate-800 pt-3 md:pt-0 pr-0 md:pr-4 min-w-[150px] text-[10px] text-slate-400 font-semibold">
                      <div className="space-y-1">
                        <div>زمن التنفيذ: <strong className="text-slate-200">{rec.timeframe}</strong></div>
                        <div>الجهة المسؤولة: <strong className="text-slate-200">{rec.responsibility}</strong></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* VIEW MODE 2 & PRINT: THE TRADITIONAL OFFICIAL MINISTRY FORMSHEET (A4 STRICT FORMAT) */}
      <div 
        id="print-report-area" 
        className={`bg-white p-8 md:p-14 rounded-3xl border border-slate-100 shadow-md relative overflow-hidden print:shadow-none print:border-none print:p-0 print:bg-white print:text-black ${
          viewMode === "official" ? "block" : "hidden"
        }`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        
        {/* Subtle Ornamental Background Header Accent (Watermark/Border - Hidden in prints for pure contrast) */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-l from-emerald-600 via-teal-500 to-amber-500 print:hidden" />

        {/* Printable Header - Ministry of Education Sultanate of Oman */}
        <div className="border-b-[3px] border-double border-slate-800 pb-6 mb-8 relative">
          <div className="flex justify-between items-center text-center">
            
            {/* Arabic Ministry Info */}
            <div className="text-right space-y-1 w-1/3">
              <h2 className="font-extrabold text-[15px] tracking-tight text-slate-950 print:text-black">سلطنة عمان</h2>
              <h3 className="font-bold text-xs text-slate-800 print:text-black">وزارة التربية والتعليم</h3>
              <p className="text-[10px] text-slate-500 font-medium print:text-black">المديرية العامة للإشراف التربوي</p>
              <p className="text-[10px] text-slate-500 font-medium print:text-black">دائرة إشراف العلوم الإنسانية والطبيعية</p>
            </div>

            {/* Emblem / Royal Seal Silhouette */}
            <div className="flex flex-col items-center justify-center space-y-1.5 w-1/3">
              <div className="w-16 h-16 border-2 border-slate-200 rounded-full flex items-center justify-center bg-slate-50 p-2 shadow-inner print:border-slate-300 print:bg-white">
                <svg className="w-11 h-11 text-amber-600 print:text-black" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 5 L55 22 H73 L58 32 L63 50 L50 39 L37 50 L42 32 L27 22 H45 L50 5 Z" fill="currentColor"/>
                  <path d="M50 45 C40 45 32 53 32 63 C32 75 42 85 50 85 C58 85 68 75 68 63 C68 53 60 45 50 45 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="50" cy="63" r="8" fill="currentColor"/>
                </svg>
              </div>
              <span className="text-[9px] text-slate-400 print:text-black font-bold tracking-widest uppercase">شعار الوزارة</span>
            </div>

            {/* English Ministry Info */}
            <div className="text-left space-y-1 w-1/3" dir="ltr">
              <h2 className="font-extrabold text-[13px] tracking-tight text-slate-950 print:text-black">Sultanate of Oman</h2>
              <h3 className="font-bold text-[11px] text-slate-800 print:text-black">Ministry of Education</h3>
              <p className="text-[9px] text-slate-500 font-semibold print:text-black">Directorate General of Educational Supervision</p>
              <p className="text-[9px] text-slate-500 font-semibold print:text-black">Supervisory Evaluation Form</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <h1 className="font-black text-lg md:text-xl text-slate-900 border-y-2 border-slate-300 py-3 leading-relaxed print:text-black">
              استمارة الزيارة الإشرافية والتقويم الفعلي للأداء التعليمي
              <br />
              <span className="text-xs font-bold text-teal-600 print:text-black">العام الدراسي الحالي: {visit.academicYear || "2025 / 2026 م"}</span>
            </h1>
          </div>
        </div>

        {/* Lesson & Teacher Metadata Card */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 border-r-4 border-emerald-600 pr-2.5 print:border-black">
            <h3 className="font-black text-slate-900 text-sm print:text-black">أولاً: البيانات الأساسية للزيارة الإشرافية</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 print:bg-white print:border-slate-300 print:grid-cols-2 text-xs">
            {/* Box: Teacher */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 print:shadow-none print:border-none print:p-1">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 print:hidden flex-shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[10px]">المعلم المستهدف (الموظف)</span>
                <p className="font-extrabold text-slate-800 print:text-black text-[13px]">{visit.teacherName || "غير محدد"}</p>
              </div>
            </div>

            {/* Box: CivilID */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 print:shadow-none print:border-none print:p-1">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600 print:hidden flex-shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[10px]">الرقم الوظيفي / المدني</span>
                <p className="font-bold text-slate-800 print:text-black text-[13px] font-mono">{visit.civilId || "16143978"}</p>
              </div>
            </div>

            {/* Box: School */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 print:shadow-none print:border-none print:p-1">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600 print:hidden flex-shrink-0">
                <School className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[10px]">المؤسسة التعليمية (المدرسة)</span>
                <p className="font-bold text-slate-800 print:text-black text-[13px] leading-snug">{visit.schoolName || "مدرسة الباسط للتعليم الأساسي"}</p>
              </div>
            </div>

            {/* Box: Date */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 print:shadow-none print:border-none print:p-1">
              <div className="p-2 bg-sky-50 rounded-lg text-sky-600 print:hidden flex-shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[10px]">تاريخ رصد الحصة</span>
                <p className="font-bold text-slate-800 print:text-black text-[13px]">{visit.date}</p>
              </div>
            </div>

            {/* Box: Visit Num */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 print:shadow-none print:border-none print:p-1">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600 print:hidden flex-shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[10px]">رقم الزيارة الحالية</span>
                <p className="font-bold text-slate-800 print:text-black text-[13px]">الزيارة رقم ({visit.visitNumber || 1})</p>
              </div>
            </div>

            {/* Box: Class / Section */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 print:shadow-none print:border-none print:p-1">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 print:hidden flex-shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[10px]">الصف والشعبة</span>
                <p className="font-bold text-slate-800 print:text-black text-[13px]">الصف {visit.grade || "غير محدد"} / شعبة ({visit.classroom || "1"})</p>
              </div>
            </div>

            {/* Box: Period */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 print:shadow-none print:border-none print:p-1">
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600 print:hidden flex-shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[10px]">الحصة الدراسية</span>
                <p className="font-bold text-slate-800 print:text-black text-[13px]">الحصة ({visit.period || 1})</p>
              </div>
            </div>

            {/* Box: Lesson Topic */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 print:shadow-none print:border-none print:p-1 sm:col-span-2 lg:col-span-1">
              <div className="p-2 bg-teal-50 rounded-lg text-teal-600 print:hidden flex-shrink-0">
                <Bookmark className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[10px]">موضوع الدرس الإشرافي</span>
                <p className="font-extrabold text-teal-800 print:text-black text-[13px]">{visit.lessonTopic || "غير محدد"}</p>
              </div>
            </div>

            {/* Box: Observer */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 print:shadow-none print:border-none print:p-1">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700 print:hidden flex-shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[10px]">منفذ الزيارة (المعلم الأول)</span>
                <p className="font-bold text-slate-800 print:text-black text-[13px]">{visit.observerName || "غير محدد"}</p>
              </div>
            </div>

            {/* Box: Portal Status */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 print:shadow-none print:border-none print:p-1 sm:col-span-2 lg:col-span-3">
              <div className="p-2 bg-teal-50 rounded-lg text-teal-600 print:hidden flex-shrink-0">
                <BadgeCheck className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[10px]">حالة التسجيل والاعتماد في البوابة التعليمية</span>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-200 print:border-slate-300 print:bg-white print:text-black">
                    {visit.approved ? "مُعتمد ومُسجل رسمياً بملف الموظف بالبوابة" : "مسودة محلية جاهزة للمراجعة والاعتماد"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The 13 Indicators Table of scores */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 border-r-4 border-sky-600 pr-2.5 print:border-black">
            <h3 className="font-black text-slate-900 text-sm print:text-black">ثانياً: جدول رصد درجات مؤشرات الأداء الـ 13 المعتمدة</h3>
          </div>
          
          <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm print:border-slate-300">
            <table className="w-full text-right text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold text-xs print:bg-white print:text-black print:border-b-2 print:border-slate-300">
                  <th className="p-3 w-10 text-center border-l border-slate-800 print:border-slate-200">م</th>
                  <th className="p-3 border-l border-slate-800 print:border-slate-200">مجال التقييم الرئيسي</th>
                  <th className="p-3 border-l border-slate-800 print:border-slate-200">مؤشر الأداء المرصود</th>
                  <th className="p-3 w-36 text-center">التقدير الرقمي المعتمد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                {OMANI_INDICATORS.map((ind, index) => {
                  const score = visit.scores[ind.id] || EvaluationRating.SUITABLE;
                  return (
                    <tr key={ind.id} className="hover:bg-slate-50/50 transition-colors print:hover:bg-transparent odd:bg-white even:bg-slate-50/30">
                      <td className="p-3 text-center font-black text-slate-600 border-l border-slate-100 print:border-slate-200 print:text-black">{index + 1}</td>
                      <td className="p-3 font-semibold text-slate-500 border-l border-slate-100 print:border-slate-200 print:text-black">{ind.areaTitle}</td>
                      <td className="p-3 font-bold text-slate-800 border-l border-slate-100 print:border-slate-200 print:text-black">{ind.title}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-extrabold border ${getRatingBadgeClass(score)} print:text-black print:bg-white print:border-slate-300`}>
                          {getRatingLabel(score)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Page break for printing beautifully */}
        <div className="print:page-break-before mb-10" />

        {/* Descriptive Evidence Block */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5 border-r-4 border-amber-500 pr-2.5 print:border-black">
            <h3 className="font-black text-slate-900 text-sm print:text-black">ثالثاً: التفصيل والعبارات الوصفية للشواهد الميدانية المرصودة</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {OMANI_INDICATORS.map((ind, index) => {
              const evidenceText = visit.evidence[ind.id] || "لم تُرصد شواهد محددة خلال الزيارة.";
              const score = visit.scores[ind.id] || EvaluationRating.SUITABLE;
              return (
                <div 
                  key={ind.id} 
                  className={`border-l-4 rounded-2xl p-4.5 shadow-sm bg-white print:shadow-none print:border print:border-slate-300 print:p-3 space-y-2.5 ${getIndicatorColor(score)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-900 print:text-black text-xs">
                        {index + 1}. {ind.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold print:hidden">المجال: {ind.areaTitle}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border whitespace-nowrap ${getRatingBadgeClass(score)} print:text-black print:bg-white`}>
                      {getRatingLabel(score)}
                    </span>
                  </div>
                  <p className="text-slate-700 print:text-black text-xs leading-relaxed border-r-[3px] border-slate-200 pr-3.5 italic bg-slate-50/50 p-3 rounded-xl border border-slate-100/60 print:bg-transparent print:border-none print:p-0">
                    "{evidenceText}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ministry of Education Portal Content Blocks */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5 border-r-4 border-teal-600 pr-2.5 print:border-black">
            <h3 className="font-black text-slate-900 text-sm print:text-black">رابعاً: حقول استمارة البوابة التعليمية المعتمدة</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 text-xs font-semibold">
            {/* Box 1: Strengths */}
            <div className="border border-emerald-100 p-5 rounded-2xl bg-emerald-50/10 print:bg-white print:border-slate-300 space-y-2.5 shadow-sm">
              <h4 className="font-extrabold text-emerald-950 print:text-black text-xs mb-2 border-b border-emerald-100 pb-2.5 flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700 print:hidden">
                  <Award className="h-4 w-4" />
                </div>
                <span>جوانب الإجادة وأدلتها من واقع الموقف التعليمي *</span>
              </h4>
              <p className="text-slate-700 print:text-black leading-relaxed whitespace-pre-wrap font-bold bg-white p-3.5 rounded-xl border border-emerald-50/40 print:p-0 print:border-none print:bg-transparent">
                {visit.generalStrengthsText || "لم تُرصد جوانب إجادة محددة خلال هذه الزيارة."}
              </p>
            </div>

            {/* Box 2: Developments */}
            <div className="border border-rose-100 p-5 rounded-2xl bg-rose-50/10 print:bg-white print:border-slate-300 space-y-2.5 shadow-sm">
              <h4 className="font-extrabold text-rose-950 print:text-black text-xs mb-2 border-b border-rose-100 pb-2.5 flex items-center gap-2">
                <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700 print:hidden">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span>الجوانب التي تحتاج إلى تطوير وأدلتها *</span>
              </h4>
              <p className="text-slate-700 print:text-black leading-relaxed whitespace-pre-wrap font-bold bg-white p-3.5 rounded-xl border border-rose-50/40 print:p-0 print:border-none print:bg-transparent">
                {visit.generalDevelopmentsText || "لم تُرصد أولويات تطوير محددة خلال هذه الزيارة."}
              </p>
            </div>

            {/* Box 3: Support Provided */}
            <div className="border border-indigo-100 p-5 rounded-2xl bg-indigo-50/10 print:bg-white print:border-slate-300 space-y-2.5 shadow-sm">
              <h4 className="font-extrabold text-indigo-950 print:text-black text-xs mb-2 border-b border-indigo-100 pb-2.5 flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-700 print:hidden">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span>الدعم المقدم للمعلم من المشرف التربوي *</span>
              </h4>
              <p className="text-slate-700 print:text-black leading-relaxed whitespace-pre-wrap font-bold bg-white p-3.5 rounded-xl border border-indigo-50/40 print:p-0 print:border-none print:bg-transparent">
                {visit.supportProvided || "تقديم التغذية الراجعة والملاحظات الفورية بعد الحصة لمناقشة البدائل والأنشطة الإبداعية وتعديل الأثر الميداني."}
              </p>
            </div>

            {/* Box 4: Recommendations */}
            <div className="border border-amber-100 p-5 rounded-2xl bg-amber-50/10 print:bg-white print:border-slate-300 space-y-2.5 shadow-sm">
              <h4 className="font-extrabold text-amber-950 print:text-black text-xs mb-2 border-b border-amber-100 pb-2.5 flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 print:hidden">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <span>التوصيات المسجلة في استمارة البوابة *</span>
              </h4>
              <p className="text-slate-700 print:text-black leading-relaxed whitespace-pre-wrap font-bold bg-white p-3.5 rounded-xl border border-amber-50/40 print:p-0 print:border-none print:bg-transparent">
                {visit.recommendationsText || "الاستمرار في العطاء وتطوير التدريس الإبداعي وتفعيل المجموعات الصفية."}
              </p>
            </div>
          </div>
        </div>

        {/* Structured recommendations list if available */}
        {visit.recommendations && visit.recommendations.length > 0 && (
          <div className="mb-10 border border-slate-100 rounded-2xl p-6 bg-slate-50/40 print:bg-white print:border-slate-300">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-5">
              <div className="p-1.5 bg-sky-500 text-white rounded-lg print:hidden">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="font-black text-slate-950 text-xs print:text-black">خامساً: خطة التوصيات الإجرائية المجدولة وفترة تنفيذها</h3>
            </div>

            <div className="space-y-4">
              {visit.recommendations.map((rec, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4.5 rounded-2xl border border-slate-100/80 shadow-sm print:border-slate-200 print:p-3">
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold border ${
                        rec.type === "enrichment"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 print:text-black"
                          : rec.type === "remedial"
                          ? "bg-rose-50 text-rose-800 border-rose-200 print:text-black"
                          : "bg-amber-50 text-amber-800 border-amber-200 print:text-black"
                      }`}>
                        {rec.type === "enrichment" ? "إثرائية" : rec.type === "remedial" ? "علاجية" : "تطويرية"}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-800 print:text-black">توصية رقم ({i + 1})</span>
                    </div>
                    <p className="text-xs text-slate-700 print:text-black font-extrabold leading-relaxed">
                      {rec.text}
                    </p>
                  </div>
                  <div className="flex flex-col justify-center space-y-1.5 text-[10px] text-slate-500 print:text-black border-t md:border-t-0 md:border-r border-slate-100 pr-0 md:pr-4 font-bold">
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] mb-0.5">الفترة الزمنية المقترحة</span>
                      <p className="text-slate-800 font-extrabold">{rec.timeframe}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] mb-0.5">مسؤولية المتابعة والتنفيذ</span>
                      <p className="text-slate-800 font-extrabold">{rec.responsibility}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature Box (صندوق التوقيعات الرسمي المعتمد في سلطنة عمان) */}
        <div className="mt-14 border-t-2 border-slate-800 pt-8 print:mt-16">
          <div className="grid grid-cols-3 gap-6 text-center text-xs print:grid-cols-3 print:gap-4 font-bold">
            <div className="space-y-4">
              <p className="font-extrabold text-slate-900 print:text-black">توقيع المعلم المزار:</p>
              <div className="h-12 border-b border-dashed border-slate-300 w-3/4 mx-auto"></div>
              <p className="text-[10px] text-slate-400">التاريخ:      /      / 2026 م</p>
            </div>
            <div className="space-y-4">
              <p className="font-extrabold text-slate-900 print:text-black">توقيع المعلم الأول (المشرف):</p>
              <div className="h-12 border-b border-dashed border-slate-300 w-3/4 mx-auto"></div>
              <p className="text-[10px] text-slate-400">الصفة: معلم أول {visit.scores[1] ? "فيزياء" : "مادة"}</p>
            </div>
            <div className="space-y-4 relative">
              <p className="font-extrabold text-slate-900 print:text-black">اعتماد مدير المدرسة:</p>
              <div className="h-12 border-b border-dashed border-slate-300 w-3/4 mx-auto"></div>
              <p className="text-[10px] text-slate-400">الختم الرسمي للمدرسة</p>
              
              {/* Seal Watermark decoration - hidden on printing */}
              <div className="absolute right-2 -bottom-4 w-16 h-16 rounded-full border border-teal-500/10 flex items-center justify-center opacity-40 text-[9px] font-black text-teal-600/30 select-none print:hidden pointer-events-none border-dashed transform rotate-12">
                وزارة التربية
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

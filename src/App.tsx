import React, { useState, useEffect } from "react";
import {
  Teacher,
  VisitEvaluation,
  EvaluationRating,
  OMANI_INDICATORS,
  IndicatorDefinition,
  Recommendation,
  GuidedQuestion
} from "./types";
import {
  OMANI_SUBJECTS,
  SCHOOL_LEVELS,
  GRADES_BY_LEVEL,
  INITIAL_TEACHERS,
  INITIAL_VISITS,
  GUIDED_QUESTIONS
} from "./data";
import { VisitReport } from "./components/VisitReport";
import {
  Users,
  ClipboardList,
  Plus,
  Sparkles,
  Award,
  TrendingUp,
  AlertTriangle,
  Calendar,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Loader2,
  Save,
  Trash2,
  FileText,
  Clock,
  Printer,
  Edit2,
  ChevronRight,
  ChevronLeft,
  Search,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from "recharts";

// Custom Tooltip for the Omani Radar Chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs max-w-xs space-y-1 dir-rtl text-right">
        <p className="font-bold text-sky-400">{data.fullTitle}</p>
        <p className="text-slate-300">الرمز: {data.code}</p>
        <p className="text-slate-100 flex items-center gap-1">
          <span>المستوى المتوسط:</span>
          <span className="font-extrabold text-amber-400">{data.average} / 5</span>
        </p>
        <p className="text-[10px] text-slate-400">
          (5: متميز، 4: جيد، 3: ملائم، 2: غير ملائم، 1: يحتاج لتدخل)
        </p>
      </div>
    );
  }
  return null;
};


export default function App() {
  // --- Core State with LocalStorage Persistence ---
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem("omani_teachers");
    return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
  });

  const [visits, setVisits] = useState<VisitEvaluation[]>(() => {
    const saved = localStorage.getItem("omani_visits");
    return saved ? JSON.parse(saved) : INITIAL_VISITS;
  });

  useEffect(() => {
    localStorage.setItem("omani_teachers", JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem("omani_visits", JSON.stringify(visits));
  }, [visits]);

  // --- UI Navigation State ---
  const [activeTab, setActiveTab] = useState<"teachers" | "visits" | "evaluate" | "report">("teachers");
  const [selectedVisit, setSelectedVisit] = useState<VisitEvaluation | null>(null);

  // --- Create/Edit Visit Form State ---
  const [targetTeacherId, setTargetTeacherId] = useState("");
  const [lessonTopic, setLessonTopic] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [classroom, setClassroom] = useState("1");
  const [lessonDate, setLessonDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [observerName, setObserverName] = useState("المعلم الأول");
  
  // Omani Portal Specific States
  const [visitNumber, setVisitNumber] = useState(1);
  const [period, setPeriod] = useState(1);
  const [approved, setApproved] = useState(false);
  const [schoolName, setSchoolName] = useState("الباسط للبنين الصفوف (8-10)");
  const [civilId, setCivilId] = useState("16143978");
  const [academicYear, setAcademicYear] = useState("2025/2026");

  const [generalStrengthsText, setGeneralStrengthsText] = useState("");
  const [generalDevelopmentsText, setGeneralDevelopmentsText] = useState("");
  const [supportProvided, setSupportProvided] = useState("");
  const [recommendationsText, setRecommendationsText] = useState("");

  const [evalSubTab, setEvalSubTab] = useState<"items" | "fields">("items");
  const [evalWizardStep, setEvalWizardStep] = useState<number>(1);
  
  // Evaluation elements
  const [scores, setScores] = useState<Record<number, EvaluationRating>>({});
  const [evidence, setEvidence] = useState<Record<number, string>>({});
  const [selectedIndicators, setSelectedIndicators] = useState<Record<number, boolean>>({});
  const [generalStrengths, setGeneralStrengths] = useState<string[]>([]);
  const [generalDevelopments, setGeneralDevelopments] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summaryNotes, setSummaryNotes] = useState("");

  // AI State
  const [rawNotes, setRawNotes] = useState("");
  const [notesMethod, setNotesMethod] = useState<"freeform" | "guided">("freeform");
  const [guidedAnswers, setGuidedAnswers] = useState<Record<number, number>>({});
  const [currentGuidedStep, setCurrentGuidedStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // --- Add/Edit Teacher Modal/Form State ---
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherSubject, setNewTeacherSubject] = useState(OMANI_SUBJECTS[0]);
  const [newTeacherExperience, setNewTeacherExperience] = useState(3);
  const [newTeacherLevel, setNewTeacherLevel] = useState(SCHOOL_LEVELS[0]);
  const [newTeacherEmail, setNewTeacherEmail] = useState("");

  // --- Helper state for manual adjustments ---
  const [newStrengthInput, setNewStrengthInput] = useState("");
  const [newDevelopmentInput, setNewDevelopmentInput] = useState("");
  const [newRecText, setNewRecText] = useState("");
  const [newRecType, setNewRecType] = useState<"enrichment" | "remedial" | "developmental">("developmental");
  const [newRecTimeframe, setNewRecTimeframe] = useState("خلال أسبوعين");
  const [newRecResponsibility, setNewRecResponsibility] = useState("المعلم بالتنسيق مع المعلم الأول");

  // Filter state for teachers
  const [subjectFilter, setSubjectFilter] = useState("الكل");

  // Filter and search states for visits
  const [visitSearchQuery, setVisitSearchQuery] = useState("");
  const [visitGradeFilter, setVisitGradeFilter] = useState("الكل");

  // --- Actions ---
  const handleBulkFillScores = (rating: EvaluationRating) => {
    const newScores: Record<number, EvaluationRating> = {};
    const newEvidence: Record<number, string> = {};
    
    OMANI_INDICATORS.forEach(ind => {
      newScores[ind.id] = rating;
      const rubric = ind.rubrics[rating];
      const prefix = " ويظهر ذلك من خلال الشواهد التالية:";
      const existingText = evidence[ind.id] || "";
      let customSuffix = ind.suggestedEvidence[0] || "تطبيق استراتيجيات التعلم بفعالية.";
      
      const transitionText = "ويظهر ذلك من خلال الشواهد التالية:";
      if (existingText.includes(transitionText)) {
        const idx = existingText.indexOf(transitionText);
        const suffix = existingText.substring(idx + transitionText.length).trim();
        if (suffix) {
          customSuffix = suffix;
        }
      } else if (existingText.trim()) {
        customSuffix = existingText.trim();
      }

      newEvidence[ind.id] = `${rubric}${prefix} ${customSuffix}`;
    });

    setScores(newScores);
    setEvidence(newEvidence);
  };

  const handleExportVisitsCSV = () => {
    if (visits.length === 0) {
      alert("لا توجد زيارات لتصديرها.");
      return;
    }
    
    const headers = [
      "اسم المعلم",
      "تاريخ الزيارة",
      "الصف الدراسي",
      "الشعبة",
      "موضوع الدرس",
      "رقم الحصة",
      "اسم المقيم",
      "المدرسة",
      "الرقم المدني",
      "العام الدراسي",
      "رقم الزيارة",
      "متوسط التقييم"
    ];

    const rows = visits.map(v => [
      v.teacherName,
      v.date,
      v.grade,
      v.classroom,
      v.lessonTopic,
      v.period,
      v.observerName,
      v.schoolName,
      v.civilId,
      v.academicYear,
      v.visitNumber,
      getAverageScore(v.scores)
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `سجل_الزيارات_الإشرافية_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleAddNewTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;

    const newTeacher: Teacher = {
      id: "tech_" + Date.now(),
      name: newTeacherName.trim(),
      subject: newTeacherSubject,
      experienceYears: Number(newTeacherExperience),
      schoolLevel: newTeacherLevel,
      email: newTeacherEmail.trim() || undefined,
    };

    setTeachers([...teachers, newTeacher]);
    setShowAddTeacherModal(false);
    
    // Reset form
    setNewTeacherName("");
    setNewTeacherExperience(3);
    setNewTeacherEmail("");
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المعلم؟ سيؤدي ذلك لحذفه من قائمة القسم.")) {
      setTeachers(teachers.filter((t) => t.id !== id));
      setVisits(visits.filter((v) => v.teacherId !== id));
    }
  };

  const handleStartNewVisit = (teacher: Teacher) => {
    setTargetTeacherId(teacher.id);
    const availableGrades = GRADES_BY_LEVEL[teacher.schoolLevel] || [];
    setGradeLevel(availableGrades[0] || "");
    setLessonTopic("");
    setClassroom("1");
    setRawNotes("");
    setNotesMethod("freeform");
    setGuidedAnswers({});
    setCurrentGuidedStep(0);
    setScores({});
    setEvidence({});
    setSelectedIndicators({});
    setGeneralStrengths([]);
    setGeneralDevelopments([]);
    setRecommendations([]);
    setSummaryNotes("");
    setAnalysisError("");
    
    // Omani Portal Specific fields reset
    setVisitNumber(3);
    setPeriod(1);
    setApproved(false);
    setSchoolName("الباسط للبنين الصفوف (8-10)");
    setCivilId("16143978");
    setAcademicYear("2025/2026");
    setGeneralStrengthsText("");
    setGeneralDevelopmentsText("");
    setSupportProvided("");
    setRecommendationsText("");
    setEvalSubTab("items");
    setEvalWizardStep(1);

    setActiveTab("evaluate");
  };

  const compileGuidedNotes = (answers: Record<number, number>) => {
    const selectedTexts: string[] = [];
    GUIDED_QUESTIONS.forEach((q) => {
      const ansIdx = answers[q.id];
      if (ansIdx !== undefined && q.options[ansIdx]) {
        selectedTexts.push(`- ${q.options[ansIdx].text}`);
      }
    });
    return selectedTexts.join("\n");
  };

  const handleSelectGuidedAnswer = (questionId: number, optionIdx: number) => {
    const updated = { ...guidedAnswers, [questionId]: optionIdx };
    setGuidedAnswers(updated);
    
    // Automatically compile notes
    const compiled = compileGuidedNotes(updated);
    setRawNotes(compiled);
  };

  // Trigger Gemini AI Analysis via Server API
  const handleAiAnalysis = async () => {
    if (!rawNotes.trim() || rawNotes.trim().length < 10) {
      setAnalysisError("الرجاء إدخال ملاحظات وشواهد ميدانية كافية (على الأقل 10 أحرف) ليتمكن الذكاء الاصطناعي من تحليلها.");
      return;
    }

    const teacherObj = teachers.find((t) => t.id === targetTeacherId);
    if (!teacherObj) return;

    setIsAnalyzing(true);
    setAnalysisError("");

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: rawNotes,
          subject: teacherObj.subject,
          grade: gradeLevel,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "فشل الاتصال بخادم التحليل الذكي.");
      }

      const result = await response.json();

      // Set scores and evidence
      const parsedScores: Record<number, EvaluationRating> = {};
      const parsedEvidence: Record<number, string> = {};

      Object.entries(result.scores).forEach(([key, val]) => {
        parsedScores[Number(key)] = val as EvaluationRating;
      });

      Object.entries(result.evidence).forEach(([key, val]) => {
        parsedEvidence[Number(key)] = val as string;
      });

      setScores(parsedScores);
      setEvidence(parsedEvidence);
      setGeneralStrengths(result.generalStrengths || []);
      setGeneralDevelopments(result.generalDevelopments || []);
      setRecommendations(result.recommendations || []);

      // Compile strengths & developments based on scores and evidence
      const strengthsList: string[] = [];
      const developmentsList: string[] = [];

      OMANI_INDICATORS.forEach(ind => {
        const score = parsedScores[ind.id] || EvaluationRating.SUITABLE;
        const evText = parsedEvidence[ind.id] || "";
        
        if (score === EvaluationRating.OUTSTANDING || score === EvaluationRating.GOOD) {
          if (evText.trim()) {
            strengthsList.push(`مؤشر ${ind.id} (${ind.title}): ${evText.trim()}`);
          }
        } else {
          if (evText.trim()) {
            developmentsList.push(`مؤشر ${ind.id} (${ind.title}): ${evText.trim()}`);
          }
        }
      });

      const finalStrengths = strengthsList.map(s => `• ${s}`).join("\n") || (result.generalStrengths || []).map((s: string) => `• ${s}`).join("\n");
      const finalDevelopments = developmentsList.map(d => `• ${d}`).join("\n") || (result.generalDevelopments || []).map((d: string) => `• ${d}`).join("\n");

      setGeneralStrengthsText(finalStrengths.slice(0, 1000));
      setGeneralDevelopmentsText(finalDevelopments.slice(0, 1000));

      // Get overall evaluation details for Support and Recommendations based on parsedScores
      const vals = Object.values(parsedScores);
      let avg = 3.0;
      if (vals.length > 0) {
        const sum = vals.reduce((acc, score) => acc + (6 - score), 0);
        avg = parseFloat((sum / vals.length).toFixed(1));
      }

      let details;
      if (avg >= 4.5) {
        details = {
          support: "تقديم التهنئة والتقدير المباشر للمعلم على الأداء الاستثنائي المتميز في الحصة الصفية وتفاعل الطلاب المبدع. تم توجيه المعلم لنقل أثر تجربته الرائدة وبطاقات التعلم النشط المبتكرة لزملائه في القسم، والتنسيق لتقديم حصة تطبيقية نموذجية على مستوى المدرسة والمحافظة لتعميم الفائدة من ممارساته المتميزة.",
          recommendations: "• الاستمرار في توظيف أدوات التقويم الرقمية التفاعلية ومحاكاة PhET لتعزيز دافعية التعلم.\n• تقديم ورشة عمل إنمائية لزملائه المعلمين حول 'توظيف استراتيجيات التفكير العليا والتعلم الذاتي بتميز'.\n• توثيق ونشر المبادرات الصفية والمختبر الافتراضي المطبق في الفصل لتعميم الاستفادة عبر منصة البوابة التعليمية."
        };
      } else if (avg >= 3.5) {
        details = {
          support: "تقديم التغذية الراجعة الإيجابية البناءة بعد الزيارة مباشرة ومناقشة المعلم في مواطن القوة وأثرها على دافعية الطلاب. تم دعم المعلم بمجموعة من نماذج وأوراق العمل المستندة للتفكير الناقد، والتوجيه للمشاركة النشطة في تفعيل الأنشطة الصفية والمبادرات الإيجابية داخل المجتمع المدرسي.",
          recommendations: "• تفعيل أدوات وأساليب تقويم تكويني سريعة وأكثر شمولية (تذاكر الخروج والبطاقات الملونة) للتحقق من فهم جميع الطلبة.\n• حضور حصص مشاهدة لدى الزملاء المتميزين في توظيف مهارات التعلم الذاتي وحل المشكلات.\n• المشاركة الفعالة في تقديم المبادرات المنهجية واللاصفية الداعمة لرفع التحصيل الدراسي للطلاب."
        };
      } else if (avg >= 2.5) {
        details = {
          support: "عقد جلسة توجيهية حوارية مركزة لتوضيح الشواهد الميدانية المرصودة ومواضع القصور الطفيفة. تم تزويد المعلم بالدليل الإرشادي للمؤشرات وتوفير حقيبة تدريبية حول 'التقويم المستمر ومراعاة الفروق الفردية والتمايز'، مع الاتفاق على تنفيذ زيارات تبادلية داعمة تحت إشراف المعلم الأول لتعديل وتجويد الممارسات.",
          recommendations: "• التخطيط المتكامل والمسبق للأنشطة الصفية لضمان مراعاة التمايز والفروق الفردية وتفريد التعليم.\n• ضبط زمن التعلم بدقة وتوزيع الوقت بين العرض والأنشطة الفردية والجماعية وغلق الحصة بفعالية.\n• معالجة جوانب الأمن والسلامة بالمختبر والالتزام التام بالتعليمات المنظمة وتوجيه الطلاب للمخاطر بشكل مستمر."
        };
      } else if (avg >= 1.5) {
        details = {
          support: "تشخيص أسباب القصور في الأداء التدريسي والتقويمي وتوجيه إرشادات توجيهية مهنية بضرورة معالجة الثغرات. تم إعداد خطة تمكين علاجية مكثفة بالتعاون مع المشرف التربوي للمادة، وإلحاق المعلم ببرنامج تدريبي صفّي مصغر وتنسيق زيارة مساندة أسبوعية مباشرة من المعلم الأول لمتابعة أثر التحسن والتقدم.",
          recommendations: "• مراجعة وبناء خطط كتابية يومية دقيقة تتسق أهدافها بوضوح مع نواتج التعلم واللوائح الوزارية.\n• التركيز التام على أساسيات الإدارة الصفية السليمة واستثارة دافعية الطلاب وتجنب الإلقاء الجاف التقليدي.\n• توظيف مصادر وأدوات تعلم مبسطة وتجهيزها مسبقاً لخدمة أهداف الدرس الأساسية وتلافي العشوائية."
        };
      } else {
        details = {
          support: "عقد اجتماع طارئ مع إدارة المدرسة والمشرف التربوي لإعداد خطة تدخل فوري عاجلة ومحكمة لتمكين المعلم ورفع كفايته المهنية الأساسية. سيتم إخضاع ممارسات المعلم لمراقبة صفية شبه يومية مستمرة، مع تقديم الدعم المباشر والشرح الميداني لأساليب الإعداد والتقويم والتعامل الإداري التربوي السليم.",
          recommendations: "• الالتزام الصارم باللوائح والسياسات المنظمة للعمل التربوي والشفافية التامة في رصد وتوثيق أعمال الطلبة.\n• الحضور والمشاهدة اليومية الكاملة لحصص المعلمين ذوي الخبرة والريادة لاكتساب مهارات التعليم الأساسية.\n• إعادة بناء وتخطيط أوراق العمل والأنشطة الصفية وتصميمها وتدقيقها مسبقاً مع المعلم الأول قبل تقديمها."
        };
      }

      setSupportProvided(details.support.slice(0, 1000));
      setRecommendationsText(details.recommendations.slice(0, 1000));

      setSummaryNotes("تم تحليل الشواهد وصياغة التقرير تلقائياً بواسطة المساعد الذكي. يمكنك مراجعة الدرجات والعبارات الوصفية الـ13 في الخطوة التالية.");
      setEvalWizardStep(3);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "حدث خطأ غير متوقع أثناء تحليل الملاحظات.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveVisitEvaluation = () => {
    if (!targetTeacherId) return;
    if (!lessonTopic.trim()) {
      alert("الرجاء كتابة موضوع الدرس أولاً.");
      return;
    }

    const selectedTeacher = teachers.find((t) => t.id === targetTeacherId);
    if (!selectedTeacher) return;

    // Build the final evaluation object
    const finalVisit: VisitEvaluation = {
      id: "visit_" + Date.now(),
      teacherId: targetTeacherId,
      teacherName: selectedTeacher.name,
      date: lessonDate,
      grade: gradeLevel,
      classroom,
      lessonTopic: lessonTopic.trim(),
      observerName,
      scores: OMANI_INDICATORS.reduce((acc, ind) => {
        acc[ind.id] = scores[ind.id] || EvaluationRating.SUITABLE;
        return acc;
      }, {} as Record<number, EvaluationRating>),
      evidence: OMANI_INDICATORS.reduce((acc, ind) => {
        const score = scores[ind.id] || EvaluationRating.SUITABLE;
        acc[ind.id] = evidence[ind.id] || `${ind.rubrics[score]} ويظهر ذلك من خلال الشواهد التالية: `;
        return acc;
      }, {} as Record<number, string>),
      generalStrengths,
      generalDevelopments,
      recommendations,
      summaryNotes,

      // Omani Portal Specific fields
      visitNumber,
      period,
      approved,
      schoolName,
      civilId,
      generalStrengthsText: generalStrengthsText || generalStrengths.map(s => `• ${s}`).join("\n"),
      generalDevelopmentsText: generalDevelopmentsText || generalDevelopments.map(d => `• ${d}`).join("\n"),
      supportProvided: supportProvided || "تقديم التغذية الراجعة الفورية وجلسة توجيهية بعد الحصة.",
      recommendationsText: recommendationsText || recommendations.map(r => `• ${r.text}`).join("\n"),
      selectedIndicators,
    };

    // Update teacher last visit date
    setTeachers(
      teachers.map((t) =>
        t.id === targetTeacherId ? { ...t, lastVisitDate: lessonDate } : t
      )
    );

    setVisits([finalVisit, ...visits]);
    setSelectedVisit(finalVisit);
    setActiveTab("report");
  };

  const handleDeleteVisit = (id: string) => {
    if (confirm("هل أنت متأكد من حذف تقرير هذه الزيارة نهائياً من الأرشيف؟")) {
      setVisits(visits.filter((v) => v.id !== id));
    }
  };

  const getAverageScore = (visitScores: Record<number, EvaluationRating>) => {
    const vals = Object.values(visitScores);
    if (vals.length === 0) return 0;
    const sum = vals.reduce((acc, score) => acc + (6 - score), 0); // Convert rating 1-5 (where 1 is best) to scale 1-5 (where 5 is best)
    return (sum / vals.length).toFixed(1);
  };

  const getRadarDataAndAnalysis = () => {
    if (visits.length === 0) {
      return {
        chartData: OMANI_INDICATORS.map(ind => ({
          id: ind.id,
          code: `مؤشر ${ind.id}`,
          fullTitle: ind.title,
          shortTitle: `مؤشر ${ind.id}`,
          average: 0,
        })),
        avgScore: 0,
        strengths: [],
        developments: [],
      };
    }

    const chartData = OMANI_INDICATORS.map(ind => {
      const scoresForIndicator = visits.map(v => v.scores[ind.id]).filter((x) => x !== undefined && x !== null);
      let avg = 0;
      if (scoresForIndicator.length > 0) {
        const sum = scoresForIndicator.reduce((acc, score) => acc + (6 - score), 0);
        avg = sum / scoresForIndicator.length;
      }
      return {
        id: ind.id,
        code: `مؤشر ${ind.id}`,
        fullTitle: ind.title,
        shortTitle: `مـ ${ind.id}`,
        average: parseFloat(avg.toFixed(2)),
      };
    });

    const sortedData = [...chartData].sort((a, b) => b.average - a.average);
    const strengths = sortedData.slice(0, 3);
    const developments = [...sortedData].reverse().slice(0, 3);
    const totalAvg = chartData.reduce((acc, d) => acc + d.average, 0) / chartData.length;

    return {
      chartData,
      avgScore: parseFloat(totalAvg.toFixed(2)),
      strengths,
      developments,
    };
  };

  const { chartData, avgScore, strengths, developments } = getRadarDataAndAnalysis();

  const getOverallEvaluationDetails = () => {
    const avgStr = getAverageScore(scores);
    const avg = parseFloat(avgStr.toString());
    
    if (avg >= 4.5) {
      return {
        level: "متميز",
        support: "تقديم التهنئة والتقدير المباشر للمعلم على الأداء الاستثنائي المتميز في الحصة الصفية وتفاعل الطلاب المبدع. تم توجيه المعلم لنقل أثر تجربته الرائدة وبطاقات التعلم النشط المبتكرة لزملائه في القسم، والتنسيق لتقديم حصة تطبيقية نموذجية على مستوى المدرسة والمحافظة لتعميم الفائدة من ممارساته المتميزة.",
        recommendations: "• الاستمرار في توظيف أدوات التقويم الرقمية التفاعلية ومحاكاة PhET لتعزيز دافعية التعلم.\n• تقديم ورشة عمل إنمائية لزملائه المعلمين حول 'توظيف استراتيجيات التفكير العليا والتعلم الذاتي بتميز'.\n• توثيق ونشر المبادرات الصفية والمختبر الافتراضي المطبق في الفصل لتعميم الاستفادة عبر منصة البوابة التعليمية."
      };
    } else if (avg >= 3.5) {
      return {
        level: "جيد",
        support: "تقديم التغذية الراجعة الإيجابية البناءة بعد الزيارة مباشرة ومناقشة المعلم في مواطن القوة وأثرها على دافعية الطلاب. تم دعم المعلم بمجموعة من نماذج وأوراق العمل المستندة للتفكير الناقد، والتوجيه للمشاركة النشطة في تفعيل الأنشطة الصفية والمبادرات الإيجابية داخل المجتمع المدرسي.",
        recommendations: "• تفعيل أدوات وأساليب تقويم تكويني سريعة وأكثر شمولية (تذاكر الخروج والبطاقات الملونة) للتحقق من فهم جميع الطلبة.\n• حضور حصص مشاهدة لدى الزملاء المتميزين في توظيف مهارات التعلم الذاتي وحل المشكلات.\n• المشاركة الفعالة في تقديم المبادرات المنهجية واللاصفية الداعمة لرفع التحصيل الدراسي للطلاب."
      };
    } else if (avg >= 2.5) {
      return {
        level: "ملائم",
        support: "عقد جلسة توجيهية حوارية مركزة لتوضيح الشواهد الميدانية المرصودة ومواضع القصور الطفيفة. تم تزويد المعلم بالدليل الإرشادي للمؤشرات وتوفير حقيبة تدريبية حول 'التقويم المستمر ومراعاة الفروق الفردية والتمايز'، مع الاتفاق على تنفيذ زيارات تبادلية داعمة تحت إشراف المعلم الأول لتعديل وتجويد الممارسات.",
        recommendations: "• التخطيط المتكامل والمسبق للأنشطة الصفية لضمان مراعاة التمايز والفروق الفردية وتفريد التعليم.\n• ضبط زمن التعلم بدقة وتوزيع الوقت بين العرض والأنشطة الفردية والجماعية وغلق الحصة بفعالية.\n• معالجة جوانب الأمن والسلامة بالمختبر والالتزام التام بالتعليمات المنظمة وتوجيه الطلاب للمخاطر بشكل مستمر."
      };
    } else if (avg >= 1.5) {
      return {
        level: "غير ملائم",
        support: "تشخيص أسباب القصور في الأداء التدريسي والتقويمي وتوجيه إرشادات توجيهية مهنية بضرورة معالجة الثغرات. تم إعداد خطة تمكين علاجية مكثفة بالتعاون مع المشرف التربوي للمادة، وإلحاق المعلم ببرنامج تدريبي صفّي مصغر وتنسيق زيارة مساندة أسبوعية مباشرة من المعلم الأول لمتابعة أثر التحسن والتقدم.",
        recommendations: "• مراجعة وبناء خطط كتابية يومية دقيقة تتسق أهدافها بوضوح مع نواتج التعلم واللوائح الوزارية.\n• التركيز التام على أساسيات الإدارة الصفية السليمة واستثارة دافعية الطلاب وتجنب الإلقاء الجاف التقليدي.\n• توظيف مصادر وأدوات تعلم مبسطة وتجهيزها مسبقاً لخدمة أهداف الدرس الأساسية وتلافي العشوائية."
      };
    } else {
      return {
        level: "يحتاج إلى تدخل",
        support: "عقد اجتماع طارئ مع إدارة المدرسة والمشرف التربوي لإعداد خطة تدخل فوري عاجلة ومحكمة لتمكين المعلم ورفع كفايته المهنية الأساسية. سيتم إخضاع ممارسات المعلم لمراقبة صفية شبه يومية مستمرة، مع تقديم الدعم المباشر والشرح الميداني لأساليب الإعداد والتقويم والتعامل الإداري التربوي السليم.",
        recommendations: "• الالتزام الصارم باللوائح والسياسات المنظمة للعمل التربوي والشفافية التامة في رصد وتوثيق أعمال الطلبة.\n• الحضور والمشاهدة اليومية الكاملة لحصص المعلمين ذوي الخبرة والريادة لاكتساب مهارات التعليم الأساسية.\n• إعادة بناء وتخطيط أوراق العمل والأنشطة الصفية وتصميمها وتدقيقها مسبقاً مع المعلم الأول قبل تقديمها."
      };
    }
  };

  const handleAddStrength = () => {
    if (newStrengthInput.trim()) {
      setGeneralStrengths([...generalStrengths, newStrengthInput.trim()]);
      setNewStrengthInput("");
    }
  };

  const handleAddDevelopment = () => {
    if (newDevelopmentInput.trim()) {
      setGeneralDevelopments([...generalDevelopments, newDevelopmentInput.trim()]);
      setNewDevelopmentInput("");
    }
  };

  const handleAddRecommendation = () => {
    if (newRecText.trim()) {
      const newRec: Recommendation = {
        type: newRecType,
        text: newRecText.trim(),
        timeframe: newRecTimeframe,
        responsibility: newRecResponsibility,
      };
      setRecommendations([...recommendations, newRec]);
      setNewRecText("");
    }
  };

  const handleRemoveRecommendation = (index: number) => {
    setRecommendations(recommendations.filter((_, i) => i !== index));
  };

  const updateEvidenceWithNewScore = (
    indId: number,
    oldScore: EvaluationRating,
    newScore: EvaluationRating,
    currentText: string
  ): string => {
    const indicator = OMANI_INDICATORS.find((i) => i.id === indId);
    if (!indicator) return currentText;

    const newRubric = indicator.rubrics[newScore];
    const prefix = " ويظهر ذلك من خلال الشواهد التالية:";

    if (!currentText || !currentText.trim()) {
      return `${newRubric}${prefix} `;
    }

    // If it already starts with some rubric from this indicator, swap it
    for (const ratingStr of Object.keys(indicator.rubrics)) {
      const rating = Number(ratingStr) as EvaluationRating;
      const otherRubric = indicator.rubrics[rating];
      if (currentText.startsWith(otherRubric)) {
        let remainingText = currentText.substring(otherRubric.length).trim();
        if (remainingText.startsWith("ويظهر ذلك من خلال الشواهد التالية:")) {
          return `${newRubric} ${remainingText}`;
        } else {
          remainingText = remainingText.replace(/^[:\s،,\-•]+/g, "").trim();
          return `${newRubric}${prefix} ${remainingText}`;
        }
      }
    }

    // If it contains the prefix but doesn't start with any known rubric
    const transitionText = "ويظهر ذلك من خلال الشواهد التالية:";
    if (currentText.includes(transitionText)) {
      const index = currentText.indexOf(transitionText);
      const remainingText = currentText
        .substring(index + transitionText.length)
        .trim()
        .replace(/^[:\s،,\-•]+/g, "")
        .trim();
      return `${newRubric}${prefix} ${remainingText}`;
    }

    // Otherwise, prepend new rubric and prefix
    const cleanedText = currentText.replace(/^[:\s،,\-•]+/g, "").trim();
    return `${newRubric}${prefix} ${cleanedText}`;
  };

  const handleInsertSuggestedEvidence = (indId: number, tagText: string) => {
    const currentScore = scores[indId] || EvaluationRating.SUITABLE;
    const indicator = OMANI_INDICATORS.find((i) => i.id === indId);
    if (!indicator) return;

    const rubric = indicator.rubrics[currentScore];
    const prefixText = "ويظهر ذلك من خلال الشواهد التالية:";
    const fullPrefix = `${rubric} ${prefixText}`;

    let currentText = evidence[indId] || "";

    if (!currentText.trim()) {
      setEvidence({
        ...evidence,
        [indId]: `${fullPrefix} ${tagText}`,
      });
      return;
    }

    if (currentText.includes(prefixText)) {
      const index = currentText.indexOf(prefixText);
      const contentAfter = currentText.substring(index + prefixText.length).trim();
      const contentAfterCleaned = contentAfter.replace(/^[:\s،,\-•]+/g, "").trim();

      if (contentAfterCleaned) {
        setEvidence({
          ...evidence,
          [indId]: `${currentText}، و${tagText}`,
        });
      } else {
        setEvidence({
          ...evidence,
          [indId]: `${currentText.substring(0, index + prefixText.length)} ${tagText}`,
        });
      }
    } else {
      // If no prefix is present, prepend it
      const cleanedText = currentText.replace(/^[:\s،,\-•]+/g, "").trim();
      if (cleanedText) {
        setEvidence({
          ...evidence,
          [indId]: `${fullPrefix} ${cleanedText}، و${tagText}`,
        });
      } else {
        setEvidence({
          ...evidence,
          [indId]: `${fullPrefix} ${tagText}`,
        });
      }
    }
  };

  const filteredTeachers = subjectFilter === "الكل" 
    ? teachers 
    : teachers.filter(t => t.subject === subjectFilter);

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = visit.teacherName.toLowerCase().includes(visitSearchQuery.toLowerCase()) ||
                          visit.lessonTopic.toLowerCase().includes(visitSearchQuery.toLowerCase()) ||
                          (visit.observerName || "").toLowerCase().includes(visitSearchQuery.toLowerCase());
    const matchesGrade = visitGradeFilter === "الكل" || visit.grade === visitGradeFilter;
    return matchesSearch && matchesGrade;
  });

  const distinctGrades = Array.from(new Set(visits.map(v => v.grade).filter(Boolean)));

  // Stats for the widgets
  const totalTeachersCount = teachers.length;
  const newTeachersCount = teachers.filter(t => t.experienceYears <= 3).length;
  const totalCompletedVisits = visits.length;

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-slate-50/50" dir="rtl">
      
      {/* Upper Navigation Header (Ministry styled) */}
      <header className="bg-gradient-to-l from-slate-900 via-sky-950 to-slate-900 text-white shadow-md border-b-4 border-amber-500">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {/* National emblem emblem mockup */}
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2 text-amber-400">
              <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 15 L53 30 L68 30 L56 40 L60 55 L50 45 L40 55 L44 40 L32 30 L47 30 Z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-lg md:text-xl tracking-tight text-white flex items-center gap-2">
                شواهد للزيارات الأشرافية
                <span className="bg-amber-500 text-slate-950 text-[10px] px-2 py-0.5 rounded font-bold">2025/2026</span>
              </h1>
              <p className="text-xs text-sky-200/80 mt-0.5 font-medium">بوابة الإشراف التربوي - المعلم الأول المشرف المقيم - سلطنة عمان</p>
            </div>
          </div>

          {/* Tab switches */}
          <nav className="flex items-center gap-1.5 bg-sky-900/40 p-1 rounded-xl border border-sky-800/30">
            <button
              onClick={() => { setActiveTab("teachers"); setSelectedVisit(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-150 ${
                activeTab === "teachers"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-sky-100 hover:bg-sky-900/60"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>معلمو القسم</span>
            </button>
            <button
              onClick={() => { setActiveTab("visits"); setSelectedVisit(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-150 ${
                activeTab === "visits"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-sky-100 hover:bg-sky-900/60"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>أرشيف الزيارات</span>
              {visits.length > 0 && (
                <span className="bg-sky-800 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {visits.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* TAB 1: TEACHER DIRECTORY */}
        {activeTab === "teachers" && (
          <div className="space-y-6 animate-fade-in">
            {/* Welcome banner and stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-white to-sky-50/30 p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-bold">إجمالي معلمي المادة</span>
                  <p className="text-3xl font-extrabold text-slate-900">{totalTeachersCount}</p>
                  <p className="text-[10px] text-slate-400 font-medium">المقيدين في سجلات القسم بالمدرسة</p>
                </div>
                <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-amber-50/20 p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-amber-800 font-bold">حديثو التعيين (1 - 3 سنوات خبرة)</span>
                  <p className="text-3xl font-extrabold text-amber-700">{newTeachersCount}</p>
                  <p className="text-[10px] text-amber-600 font-semibold">أولوية الدعم: زيارتان كحد أدنى في الفصل</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                  <Clock className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-emerald-50/20 p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-emerald-800 font-bold">الزيارات المنفذة هذا العام</span>
                  <p className="text-3xl font-extrabold text-emerald-700">{totalCompletedVisits}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">تقارير إشرافية ورصد الشواهد معتمدة</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Department Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">تصفية حسب التخصص:</span>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="الكل">كل التخصصات</option>
                  {OMANI_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowAddTeacherModal(true)}
                className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all duration-150"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة معلم جديد للقسم</span>
              </button>
            </div>

            {/* Grid of Teachers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTeachers.map((teacher) => {
                const isNew = teacher.experienceYears <= 3;
                return (
                  <div
                    key={teacher.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition-all duration-200"
                  >
                    <div className="p-6 space-y-4">
                      {/* Name and badge */}
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{teacher.name}</h4>
                          <p className="text-xs text-slate-400 font-semibold mt-1">{teacher.schoolLevel}</p>
                        </div>
                        {isNew ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            حديث تعيين
                          </span>
                        ) : (
                          <span className="bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-medium px-2 py-0.5 rounded-full">
                            معلم خبرة
                          </span>
                        )}
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">التخصص التدريسي:</span>
                          <p className="font-bold text-slate-700">{teacher.subject}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">سنوات الخبرة:</span>
                          <p className="font-bold text-slate-700">{teacher.experienceYears} سنوات</p>
                        </div>
                        <div className="col-span-2 space-y-0.5 border-t border-slate-200/50 pt-2">
                          <span className="text-[10px] text-slate-400 font-medium">آخر زيارة ميدانية:</span>
                          <p className="font-bold text-slate-700">
                            {teacher.lastVisitDate ? (
                              <span className="flex items-center gap-1 text-emerald-600">
                                <CheckCircle className="h-3.5 w-3.5" />
                                {teacher.lastVisitDate}
                              </span>
                            ) : (
                              <span className="text-orange-500 italic">لم تُجرى زيارة هذا العام بعد</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick actions bar */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="حذف من القسم"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleStartNewVisit(teacher)}
                        className="flex items-center gap-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-100 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>تقييم زيارة صفية جديدة</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredTeachers.length === 0 && (
                <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-500">
                  <HelpCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="font-bold">لا يوجد معلمين مطابقين لهذا التصفية.</p>
                  <p className="text-xs text-slate-400 mt-1">الرجاء إضافة معلم جديد أو تغيير تصفية التخصص.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VISITS ARCHIVE */}
        {activeTab === "visits" && (
          <div className="space-y-6 animate-fade-in">
            {/* Radar Chart & Section Performance Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Radar Chart Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="bg-sky-50 text-sky-600 p-1.5 rounded-lg">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">مخطط أداء القسم الشامل (Radar Chart)</h4>
                  </div>
                  <p className="text-xs text-slate-400">تحليل راداري لمتوسط درجات الأداء عبر المؤشرات الوزارية الـ 13 لتشخيص واقع التحصيل والتدريس بالقسم.</p>
                </div>

                <div className="h-[320px] w-full mt-4 flex items-center justify-center">
                  {visits.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs italic py-12">
                      <p>لا توجد بيانات كافية لعرض المخطط الراداري.</p>
                      <p className="mt-1">يرجى تسجيل زيارات معتمدة أولاً لتظهر هنا.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis 
                          dataKey="shortTitle" 
                          tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 5]} 
                          tick={{ fill: '#94a3b8', fontSize: 9 }}
                          tickCount={6}
                        />
                        <Radar
                          name="متوسط الأداء"
                          dataKey="average"
                          stroke="#0284c7"
                          fill="#38bdf8"
                          fillOpacity={0.3}
                        />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-slate-400 border-t border-slate-50 pt-3 mt-2">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-sky-400/30 border border-sky-500 rounded-full inline-block"></span>متوسط التقييم العام للقسم (على مقياس 1-5 حيث 5 هو الأفضل)</span>
                </div>
              </div>

              {/* Analysis Results Card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="bg-amber-50 text-amber-600 p-1.5 rounded-lg">
                      <Award className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">تقرير تشخيص نقاط القوة والضعف</h4>
                  </div>
                  <p className="text-xs text-slate-400">ملخص تحليلي يستند على متوسط زيارات القسم الـ {visits.length} المعتمدة.</p>
                </div>

                <div className="space-y-4 my-4 flex-1 flex flex-col justify-center">
                  {/* Total score box */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">متوسط أداء القسم العام</p>
                      <h5 className="text-2xl font-black text-slate-800 mt-1">{avgScore} <span className="text-xs text-slate-400 font-normal">/ 5.0</span></h5>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      avgScore >= 4.0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      avgScore >= 3.0 ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                      'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {avgScore >= 4.0 ? 'أداء متميز جداً' :
                       avgScore >= 3.0 ? 'أداء جيد ومستقر' :
                       'يحتاج لمتابعة وتطوير'}
                    </div>
                  </div>

                  {/* Top Strengths */}
                  <div>
                    <h5 className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>أعلى 3 نقاط قوة في القسم:</span>
                    </h5>
                    {strengths.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">لا توجد شواهد كافية للتحليل بعد.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {strengths.map((str) => (
                          <div key={str.id} className="bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-100/50 p-2 rounded-lg text-xs transition-colors">
                            <div className="flex items-center justify-between font-bold text-slate-700 gap-2">
                              <span className="truncate" title={str.fullTitle}>{str.fullTitle}</span>
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0">{str.average}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                              <span>الرمز: {str.code}</span>
                              <span>•</span>
                              <span>المستوى: متميز/جيد</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Areas for Development */}
                  <div>
                    <h5 className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <span>أكثر 3 مجالات بحاجة لتطوير:</span>
                    </h5>
                    {developments.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">لا توجد شواهد كافية للتحليل بعد.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {developments.map((dev) => (
                          <div key={dev.id} className="bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100/50 p-2 rounded-lg text-xs transition-colors">
                            <div className="flex items-center justify-between font-bold text-slate-700 gap-2">
                              <span className="truncate" title={dev.fullTitle}>{dev.fullTitle}</span>
                              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0">{dev.average}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                              <span>الرمز: {dev.code}</span>
                              <span>•</span>
                              <span>يحتاج لإنماء مهني</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[9px] text-slate-400 text-center border-t border-slate-50 pt-2 leading-relaxed">
                  * تستند هذه التحليلات على استمارات التقييم الـ 13 المعتمدة بالبوابة التعليمية لسلطنة عمان.
                </p>
              </div>
            </div>

            {/* List of visits */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">سجل وأرشيف الزيارات الإشرافية المعتمدة</h3>
                    <p className="text-xs text-slate-400 mt-1">قائمة بالتقارير الرسمية التي تم رصدها وحفظها مع درجات المؤشرات الـ13 والشواهد والتوصيات الإجرائية.</p>
                  </div>
                  <button
                    onClick={handleExportVisitsCSV}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-center"
                  >
                    <Download className="h-4 w-4" />
                    <span>تصدير السجل كـ CSV/Excel</span>
                  </button>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="ابحث باسم المعلم، موضوع الدرس، أو المشرف..."
                      value={visitSearchQuery}
                      onChange={(e) => setVisitSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700 text-right"
                      dir="rtl"
                    />
                  </div>

                  {distinctGrades.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">الصف:</span>
                      <select
                        value={visitGradeFilter}
                        onChange={(e) => setVisitGradeFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700"
                      >
                        <option value="الكل">كل الصفوف</option>
                        {distinctGrades.map((g) => (
                          <option key={g} value={g}>الصف {g}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="p-4">اسم المعلم</th>
                      <th className="p-4">تاريخ الزيارة</th>
                      <th className="p-4">الصف / الفصل</th>
                      <th className="p-4">موضوع الدرس</th>
                      <th className="p-4 text-center">متوسط التقييم</th>
                      <th className="p-4 text-center">التوصيات الإجرائية</th>
                      <th className="p-4 text-center">الخيارات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVisits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{visit.teacherName}</td>
                        <td className="p-4 text-slate-500">{visit.date}</td>
                        <td className="p-4 text-slate-500">صف ({visit.grade}) - شعبة {visit.classroom}</td>
                        <td className="p-4 font-semibold text-slate-700">{visit.lessonTopic}</td>
                        <td className="p-4 text-center">
                          <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-bold border border-sky-100">
                            {getAverageScore(visit.scores)} / 5.0
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                            {visit.recommendations.length} توصيات
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedVisit(visit);
                                setActiveTab("report");
                              }}
                              className="flex items-center gap-1 bg-sky-50 text-sky-700 hover:bg-sky-100 px-3 py-1.5 rounded-lg font-bold cursor-pointer"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>التقرير والطباعة</span>
                            </button>
                            <button
                              onClick={() => handleDeleteVisit(visit.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                              title="حذف الزيارة"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredVisits.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                          <ClipboardList className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                          <p className="font-bold">لا توجد زيارات تطابق البحث والخيارات المحددة.</p>
                          <p className="text-xs text-slate-400 mt-1">امسح خيار البحث أو ابدأ برصد زيارة صفية جديدة للمعلم.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WORKSPACE / INTERACTIVE EVALUATION */}
        {activeTab === "evaluate" && (
          <div className="space-y-6 animate-fade-in">
            {/* Title section */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <button
                  onClick={() => setActiveTab("teachers")}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-semibold"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span>إلغاء والعودة للرئيسية</span>
                </button>
                <h2 className="font-extrabold text-xl text-slate-900 mt-2">موقف رصد الشواهد والتقييم الذكي</h2>
                <p className="text-xs text-slate-400 mt-1">قم بتعبئة معلومات الدرس ثم استخدم المساعد الذكي أو سجل درجات التقييم والعبارات الوصفية الـ13 يدوياً.</p>
              </div>
            </div>

            {/* PROGRESS WIZARD BAR */}
            <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="bg-teal-600 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm">
                    {evalWizardStep}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {evalWizardStep === 1 && "الخطوة الأولى: بيانات الحصة والزيارة الميدانية"}
                      {evalWizardStep === 2 && "الخطوة الثانية: دفتر رصد الشواهد والتحليل الذكي"}
                      {evalWizardStep === 3 && "الخطوة الثالثة: بنود التقييم وتفاصيل الـ 13 مؤشراً"}
                      {evalWizardStep === 4 && "الخطوة الرابعة: التقرير الختامي للبوابة التعليمية"}
                      {evalWizardStep === 5 && "الخطوة الخامسة: نموذج استمارة التقييم والاعتماد الختامي"}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {evalWizardStep === 1 && "تعبئة البيانات العامة للمعلم والصف والدرس والمشرف"}
                      {evalWizardStep === 2 && "رصد الملاحظات الصفية وتصنيفها وربطها بالمؤشرات تلقائياً بالذكاء الاصطناعي"}
                      {evalWizardStep === 3 && "تقييم أداء المعلم في كل بند وتدقيق الأدلة المرصودة وتضمين الشواهد المعتمدة"}
                      {evalWizardStep === 4 && "تجميع الشواهد وصياغة حقول التقرير الأربعة الكبرى للبوابة التعليمية"}
                      {evalWizardStep === 5 && "معاينة التقرير الختامي لملف الزيارة الإشرافية المعتمد وطباعته أو حفظه بالأرشيف"}
                    </p>
                  </div>
                </div>

                {/* Progress bar and buttons */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex-1 md:w-48 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-2 transition-all duration-300"
                      style={{ width: `${(evalWizardStep / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                    الخطوة {evalWizardStep} من 5
                  </span>
                </div>
              </div>

              {/* Step Navigation Pill buttons */}
              <div className="grid grid-cols-5 gap-1.5 border-t border-slate-100 mt-4 pt-3">
                {[
                  { id: 1, label: "بيانات الحصة", icon: BookOpen },
                  { id: 2, label: "دفتر الرصد", icon: Sparkles },
                  { id: 3, label: "الـ 13 مؤشراً", icon: ClipboardList },
                  { id: 4, label: "التقرير الكبرى", icon: FileText },
                  { id: 5, label: "استمارة التقييم", icon: Save },
                ].map((step) => {
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setEvalWizardStep(step.id)}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-bold text-[11px] transition-all border ${
                        evalWizardStep === step.id
                          ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                          : "bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 1: Lesson Details Card - Styled like Ministry Portal */}
            {evalWizardStep === 1 && (
              <div className="bg-slate-50 border-t-4 border-teal-600 rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-bold text-teal-800 text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-teal-600"></span>
                  بيانات الزيارة الإشرافية المعتمدة بالبوابة التعليمية
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="approved_checkbox"
                    checked={approved}
                    onChange={(e) => setApproved(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4 border-slate-300"
                  />
                  <label htmlFor="approved_checkbox" className="font-bold text-xs text-slate-700 cursor-pointer select-none">
                    زيارة معتمدة رسمياً
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">العام الدراسي:</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2025/2026"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">رقم الزيارة:</label>
                  <input
                    type="number"
                    value={visitNumber}
                    onChange={(e) => setVisitNumber(Number(e.target.value))}
                    min={1}
                    max={10}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">المدرسة:</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="اسم المدرسة والصفوف"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">منفذ الزيارة (المقيم):</label>
                  <input
                    type="text"
                    value={observerName}
                    onChange={(e) => setObserverName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">المعلم المستهدف (الموظف):</label>
                  <select
                    value={targetTeacherId}
                    onChange={(e) => {
                      setTargetTeacherId(e.target.value);
                      const t = teachers.find((tech) => tech.id === e.target.value);
                      if (t) {
                        const grades = GRADES_BY_LEVEL[t.schoolLevel] || [];
                        setGradeLevel(grades[0] || "");
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">الرقم الوظيفي / المدني:</label>
                  <input
                    type="text"
                    value={civilId}
                    onChange={(e) => setCivilId(e.target.value)}
                    placeholder="الرقم الوظيفي للموظف"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">تاريخ الزيارة*:</label>
                  <input
                    type="date"
                    value={lessonDate}
                    onChange={(e) => setLessonDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">نوع الاستمارة:</label>
                  <input
                    type="text"
                    value="استمارة الزيارة الإشرافية لمعلم مجال/ مادة"
                    disabled
                    className="w-full bg-slate-100/75 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">موضوع / عنوان الدرس*:</label>
                  <input
                    type="text"
                    value={lessonTopic}
                    onChange={(e) => setLessonTopic(e.target.value)}
                    placeholder="مثال: الضغط وتأثيره على الأسطح"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">الحصة*:</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                      <option key={p} value={p}>الحصة {p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">الصف الدراسي:</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700"
                  >
                    {targetTeacherId && teachers.find((t) => t.id === targetTeacherId) && 
                      (GRADES_BY_LEVEL[teachers.find((t) => t.id === targetTeacherId)!.schoolLevel] || []).map((grade) => (
                        <option key={grade} value={grade}>الصف {grade}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">الشعبة / الفصل:</label>
                  <input
                    type="text"
                    value={classroom}
                    onChange={(e) => setClassroom(e.target.value)}
                    placeholder="مثال: 1"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setEvalWizardStep(2)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition-colors flex items-center gap-1.5 font-sans"
                >
                  <span>الانتقال لدفتر الرصد الآني</span>
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

            {/* Step 2: Classroom Realtime Observation Notebook with AI mapping */}
            {evalWizardStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-sky-950 rounded-2xl text-white shadow-md p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>المساعد الرقمي لوزارة التربية: دفتر رصد الشواهد المباشر (رصد آني)</span>
                  </h3>
                  <p className="text-[11px] text-sky-200/80">اختر طريقة رصد الملاحظات الصفية وتصنيفها وربطها بالـ13 مؤشراً بالذكاء الاصطناعي.</p>
                </div>

                {/* Toggle tab buttons */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setNotesMethod("freeform")}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                      notesMethod === "freeform"
                        ? "bg-amber-500 text-slate-950 shadow font-extrabold"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>📝 تدوين حر مباشر</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotesMethod("guided")}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                      notesMethod === "guided"
                        ? "bg-amber-500 text-slate-950 shadow font-extrabold"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>❓ استبيان خيارات ذكي</span>
                  </button>
                </div>
              </div>

              {notesMethod === "freeform" ? (
                <div className="space-y-4 animate-fade-in">
                  <textarea
                    value={rawNotes}
                    onChange={(e) => setRawNotes(e.target.value)}
                    rows={6}
                    placeholder="مثال للتوضيح أثناء رصد الحصة:
- بدأ المعلم بتهيئة ممتازة عن طريق ربط درس الفيزياء بحوادث السير في عمان ومحاضرة للشرطة.
- وزع المعلم الطلاب إلى 4 مجموعات عمل تعاونية ووزع بطاقات المهام بامتياز، والطلاب تفاعلوا جداً.
- تم استخدام شاشة الفصل التفاعلية لتشغيل محاكاة PhET الرقمية للضغط مما عمق الفهم لدى الطلاب.
- الطلاب حلوا ورقة العمل التكوينية الأولى، لكن المعلم لم يسعفه وقت الحصة لحل النشاط الختامي وغلق الحصة، وكان هناك تشتت لطالبين في الخلف."
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-xs font-medium text-white placeholder-slate-400/70 focus:outline-none focus:ring-1 focus:ring-amber-400 leading-relaxed"
                  />

                  {analysisError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs font-bold text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{analysisError}</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleAiAnalysis}
                      disabled={isAnalyzing || !rawNotes.trim()}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 font-bold text-xs px-6 py-3 rounded-xl shadow transition-all duration-150"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>جاري قراءة الشواهد وربطها بالمؤشرات الـ13...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>تحليل الشواهد وتصنيف التقرير بالذكاء الاصطناعي ✨</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  {/* Step indicators */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400 text-slate-950 font-extrabold px-2.5 py-0.5 rounded-full">
                        {currentGuidedStep + 1} / {GUIDED_QUESTIONS.length}
                      </span>
                      <span className="font-bold text-amber-300">
                        {GUIDED_QUESTIONS[currentGuidedStep].category}
                      </span>
                    </div>
                    <div className="text-slate-400 font-bold">
                      نسبة تعبئة الاستبيان: {Math.round((Object.keys(guidedAnswers).length / GUIDED_QUESTIONS.length) * 100)}%
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-1.5 transition-all duration-300"
                      style={{ width: `${((currentGuidedStep + 1) / GUIDED_QUESTIONS.length) * 100}%` }}
                    ></div>
                  </div>

                  {/* Question & Options Panel */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-amber-400" />
                      <span>{GUIDED_QUESTIONS[currentGuidedStep].questionText}</span>
                    </h4>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-3">
                      {GUIDED_QUESTIONS[currentGuidedStep].options.map((opt, oIdx) => {
                        const isSelected = guidedAnswers[GUIDED_QUESTIONS[currentGuidedStep].id] === oIdx;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelectGuidedAnswer(GUIDED_QUESTIONS[currentGuidedStep].id, oIdx)}
                            className={`text-right p-4 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer ${
                              isSelected
                                ? "bg-amber-400/10 border-amber-400 shadow-md"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? "border-amber-400" : "border-slate-500"
                                }`}>
                                  {isSelected && <div className="h-2 w-2 rounded-full bg-amber-400"></div>}
                                </div>
                                <span className="font-bold text-xs sm:text-sm text-white">{opt.label}</span>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                                isSelected
                                  ? "bg-amber-400/20 text-amber-300 border-amber-400/30"
                                  : "bg-white/5 text-slate-400 border-white/5"
                              }`}>
                                {opt.impact}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                              {opt.text}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Error display inside wizard */}
                  {analysisError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs font-bold text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{analysisError}</span>
                    </div>
                  )}

                  {/* Navigation Actions */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-4">
                    <button
                      type="button"
                      disabled={currentGuidedStep === 0}
                      onClick={() => setCurrentGuidedStep(prev => prev - 1)}
                      className="bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs px-4 py-2.5 rounded-lg border border-white/10 transition-colors"
                    >
                      السابق
                    </button>

                    <div className="flex items-center gap-2">
                      {currentGuidedStep < GUIDED_QUESTIONS.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setCurrentGuidedStep(prev => prev + 1)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-lg shadow transition-colors"
                        >
                          التالي
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleAiAnalysis}
                          disabled={isAnalyzing || Object.keys(guidedAnswers).length === 0}
                          className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-950 font-bold text-xs px-6 py-2.5 rounded-lg shadow transition-all flex items-center gap-1.5"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>جاري تقييم الاستبيان بالذكاء الاصطناعي...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>تقييم الإجابات بالذكاء الاصطناعي وإصدار التقرير 🚀</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Compiled Summary Notes Live Preview */}
                  {rawNotes.trim() && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h5 className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          <span>الشواهد والتقرير المجمّع من خياراتك (رصد آني تراكمي):</span>
                        </h5>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("هل تريد الانتقال لوضع التدوين الحر لتعديل هذه الملاحظات يدوياً؟")) {
                              setNotesMethod("freeform");
                            }
                          }}
                          className="text-[10px] text-amber-400/80 hover:text-amber-400 font-bold hover:underline"
                        >
                          تعديل النص حرّاً
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-semibold whitespace-pre-wrap">
                        {rawNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

                <div className="flex justify-between pt-4 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setEvalWizardStep(1)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl border border-slate-200 transition-colors font-sans"
                  >
                    السابق: بيانات الحصة
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvalWizardStep(3)}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition-colors flex items-center gap-1.5 font-sans"
                  >
                    <span>التالي: الـ 13 مؤشراً والتقييم</span>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: بنود التقييم وتفاصيل الـ 13 مؤشراً */}
            {evalWizardStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-teal-900 text-xs sm:text-sm">بنود استمارة الزيارة والتقييم (الـ 13 مؤشراً المعتمدة والتقديرات فقط)</h4>
                      <p className="text-[11px] text-slate-400 font-semibold">حدد المؤشرات والتقييمات التي ترغب بإدراجها وتضمينها في التقرير الختامي للبوابة التعليمية.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allChecked: Record<number, boolean> = {};
                          OMANI_INDICATORS.forEach(ind => {
                            allChecked[ind.id] = true;
                          });
                          setSelectedIndicators(allChecked);
                        }}
                        className="bg-teal-50 hover:bg-teal-100 text-teal-800 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                      >
                        تحديد الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const noneChecked: Record<number, boolean> = {};
                          OMANI_INDICATORS.forEach(ind => {
                            noneChecked[ind.id] = false;
                          });
                          setSelectedIndicators(noneChecked);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                      >
                        إلغاء تحديد الكل
                      </button>
                    </div>
                  </div>

                  {/* Bulk Fill Shortcuts Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
                        <span>اختصارات التعبئة السريعة للـ 13 مؤشراً (توفير وقت المشرف)</span>
                      </p>
                      <p className="text-[10px] text-amber-800 font-medium">يمكنك بنقرة واحدة تعبئة الدرجات والشواهد الوزارية الافتراضية لكافة المؤشرات وتعديلها يدوياً لاحقاً:</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleBulkFillScores(EvaluationRating.OUTSTANDING)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        تعبئة الكل: متميز (1)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkFillScores(EvaluationRating.GOOD)}
                        className="bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        تعبئة الكل: جيد (2)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkFillScores(EvaluationRating.SUITABLE)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        تعبئة الكل: ملائم (3)
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {OMANI_INDICATORS.map((ind, index) => {
                      const currentScore = scores[ind.id] || EvaluationRating.SUITABLE;
                      const isSelected = selectedIndicators[ind.id] !== false;
                      
                      return (
                        <div
                          key={ind.id}
                          className={`border rounded-2xl p-5 transition-all space-y-4 text-xs font-sans ${
                            isSelected
                              ? "border-slate-150 bg-slate-50/40 hover:bg-slate-50/80"
                              : "border-slate-250 bg-slate-100/40 opacity-70"
                          }`}
                        >
                          {/* Title and score select */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                id={`check-ind-${ind.id}`}
                                checked={isSelected}
                                onChange={(e) => {
                                  setSelectedIndicators({
                                    ...selectedIndicators,
                                    [ind.id]: e.target.checked,
                                  });
                                }}
                                className="mt-1 h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600 flex-shrink-0"
                              />
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">{ind.areaTitle}</span>
                                  {!isSelected && (
                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">
                                      غير مدرج في التقرير الختامي
                                    </span>
                                  )}
                                </div>
                                <h4 className={`font-bold text-sm transition-colors ${isSelected ? "text-slate-950" : "text-slate-500 line-through"}`}>
                                  {index + 1}. {ind.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed max-w-3xl font-medium">{ind.description}</p>
                              </div>
                            </div>

                            {/* Dropdown Score Selector */}
                            <div className="flex items-center gap-2 self-start sm:self-center">
                              <label className="text-[11px] text-slate-500 font-bold whitespace-nowrap">التقدير:</label>
                              <select
                                value={currentScore}
                                disabled={!isSelected}
                                onChange={(e) => {
                                  const newScore = Number(e.target.value) as EvaluationRating;
                                  setScores({ ...scores, [ind.id]: newScore });
                                  const updatedText = updateEvidenceWithNewScore(ind.id, currentScore, newScore, evidence[ind.id] || "");
                                  setEvidence({ ...evidence, [ind.id]: updatedText });
                                }}
                                className={`text-xs font-extrabold rounded-lg px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                  currentScore === EvaluationRating.OUTSTANDING
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : currentScore === EvaluationRating.GOOD
                                    ? "bg-sky-50 text-sky-800 border-sky-200"
                                    : currentScore === EvaluationRating.SUITABLE
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : currentScore === EvaluationRating.UNSUITABLE
                                    ? "bg-orange-50 text-orange-800 border-orange-200"
                                    : "bg-rose-50 text-rose-800 border-rose-200"
                                }`}
                              >
                                <option value={EvaluationRating.OUTSTANDING}>متميز (1)</option>
                                <option value={EvaluationRating.GOOD}>جيد (2)</option>
                                <option value={EvaluationRating.SUITABLE}>ملائم (3)</option>
                                <option value={EvaluationRating.UNSUITABLE}>غير ملائم (4)</option>
                                <option value={EvaluationRating.NEEDS_INTERVENTION}>يحتاج إلى تدخل (5)</option>
                              </select>
                            </div>
                          </div>

                          {/* Evidence Textarea & Suggested Pills inside Step 3 Card when selected */}
                          {isSelected && (
                            <div className="space-y-3 pt-3 border-t border-slate-200/50">
                              <div className="space-y-1.5">
                                <label className="text-[11px] text-slate-600 font-bold flex items-center gap-1">
                                  <span>الشواهد والأدلة المرصودة للمؤشر*:</span>
                                  <span className="text-[10px] text-slate-400 font-medium">(تبدأ بالصياغة الرسمية المحددة للدرجة وتليها الشواهد الميدانية)</span>
                                </label>
                                <textarea
                                  value={evidence[ind.id] || ""}
                                  onChange={(e) => setEvidence({ ...evidence, [ind.id]: e.target.value })}
                                  rows={2}
                                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed shadow-sm font-sans"
                                  placeholder="اكتب أدلتك الميدانية وشواهدك للمؤشر..."
                                />
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold block">شواهد مقترحة شائعة (اضغط للإضافة الفورية):</span>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {ind.suggestedEvidence.map((evTag, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleInsertSuggestedEvidence(ind.id, evTag)}
                                      className="bg-teal-50 hover:bg-teal-100 text-teal-850 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-teal-100 transition-colors cursor-pointer"
                                    >
                                      + {evTag}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setEvalWizardStep(2)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl border border-slate-200 transition-colors font-sans"
                  >
                    السابق: دفتر الرصد الآني
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvalWizardStep(4)}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition-colors flex items-center gap-1.5 font-sans"
                  >
                    <span>التالي: التقرير الختامي للبوابة</span>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: التقرير الختامي للبوابة التعليمية */}
            {evalWizardStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-6 space-y-6">
                  
                  {/* Compilation Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                    <div>
                      <h4 className="font-extrabold text-teal-900 text-sm">تجميع وتوليد التقرير الختامي للبوابة</h4>
                      <p className="text-[11px] text-slate-400 font-semibold">يقوم بدمج كافة الشواهد المرصودة في بنود الاستمارة وتطبيق الدعم والتوصيات الذكية المقترحة تلقائياً بضغطة زر واحدة.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // 1. Compile manual strengths & developments
                        const strengthsList: string[] = [];
                        const developmentsList: string[] = [];

                        OMANI_INDICATORS.forEach(ind => {
                          const score = scores[ind.id] || EvaluationRating.SUITABLE;
                          const evText = evidence[ind.id] || "";
                          
                          if (score === EvaluationRating.OUTSTANDING || score === EvaluationRating.GOOD) {
                            if (evText.trim()) {
                              strengthsList.push(`مؤشر ${ind.id} (${ind.title}): ${evText.trim()}`);
                            }
                          } else {
                            if (evText.trim()) {
                              developmentsList.push(`مؤشر ${ind.id} (${ind.title}): ${evText.trim()}`);
                            }
                          }
                        });

                        const finalStrengths = strengthsList.map(s => `• ${s}`).join("\n");
                        const finalDevelopments = developmentsList.map(d => `• ${d}`).join("\n");

                        // 2. Get overall evaluation details for Support and Recommendations
                        const details = getOverallEvaluationDetails();

                        setGeneralStrengthsText(finalStrengths.slice(0, 1000));
                        setGeneralDevelopmentsText(finalDevelopments.slice(0, 1000));
                        setSupportProvided(details.support.slice(0, 1000));
                        setRecommendationsText(details.recommendations.slice(0, 1000));
                      }}
                      className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-sky-700 hover:from-teal-700 hover:to-sky-800 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all self-start shadow-md cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                      <span>تجميع الشواهد والتوصيات تلقائياً بناءً على التقييم الكلي ✨</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* تجميع الشواهد (جوانب الإجادة والتطوير الإجمالية للمشرف) */}
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-teal-800 text-xs sm:text-sm border-r-4 border-teal-500 pr-2 flex items-center gap-2 bg-teal-50/40 p-2 rounded-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                        <span>تجميع الشواهد (جوانب الإجادة والتطوير الإجمالية للمشرف)</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-6 text-xs font-semibold">
                        {/* Field 1: Strengths */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="font-extrabold text-slate-800 flex items-center gap-1">
                              <span>جوانب الإجادة في الأداء وأدلتها (الإجمالي)*</span>
                              <span className="text-[10px] text-rose-500 font-bold">*</span>
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              أقصى عدد للحروف (1000) حرف | المتبقي: {Math.max(0, 1000 - generalStrengthsText.length)}
                            </span>
                          </div>
                          <textarea
                            value={generalStrengthsText}
                            onChange={(e) => setGeneralStrengthsText(e.target.value.slice(0, 1000))}
                            rows={4}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed shadow-inner"
                            placeholder="اكتب جوانب الإجادة المتميزة التي ظهرت في ممارسات المعلم مع أدلتها وشواهدها بالتفصيل..."
                          />
                        </div>

                        {/* Field 2: Areas for Development */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="font-extrabold text-slate-800 flex items-center gap-1">
                              <span>الجوانب التي تحتاج إلى تطوير في الأداء وأدلتها (الإجمالي)*</span>
                              <span className="text-[10px] text-rose-500 font-bold">*</span>
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              أقصى عدد للحروف (1000) حرف | المتبقي: {Math.max(0, 1000 - generalDevelopmentsText.length)}
                            </span>
                          </div>
                          <textarea
                            value={generalDevelopmentsText}
                            onChange={(e) => setGeneralDevelopmentsText(e.target.value.slice(0, 1000))}
                            rows={4}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed shadow-inner"
                            placeholder="اكتب أولويات التطوير والمهارات التدريسية التي تحتاج إلى تمكين وصقل مع أدلتها وشواهدها..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* الدعم */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h3 className="font-extrabold text-teal-800 text-xs sm:text-sm border-r-4 border-sky-500 pr-2 flex items-center gap-2 bg-sky-50/40 p-2 rounded-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                        <span>الدعم (الدعم والمساندة المقدمة للمعلم)</span>
                      </h3>
                      <div className="space-y-2 text-xs font-semibold">
                        <div className="flex justify-between items-center">
                          <label className="font-extrabold text-slate-800 flex items-center gap-1">
                            <span>الدعم والمساندة المقدمة للمعلم (مستمد تلقائياً من التقييم الكلي)*</span>
                            <span className="text-[10px] text-rose-500 font-bold">*</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            أقصى عدد للحروف (1000) حرف | المتبقي: {Math.max(0, 1000 - supportProvided.length)}
                          </span>
                        </div>
                        <textarea
                          value={supportProvided}
                          onChange={(e) => setSupportProvided(e.target.value.slice(0, 1000))}
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed shadow-inner"
                          placeholder="صف الدعم المهني المباشر الذي قدمته للمعلم لمساندة ممارساته الفورية أو الخطوات المتفق عليها..."
                        />
                      </div>
                    </div>

                    {/* التوصيات */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h3 className="font-extrabold text-teal-800 text-xs sm:text-sm border-r-4 border-amber-500 pr-2 flex items-center gap-2 bg-amber-50/40 p-2 rounded-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>التوصيات (التوصيات الإجرائية للمشرف والمدرسة)</span>
                      </h3>
                      <div className="space-y-2 text-xs font-semibold">
                        <div className="flex justify-between items-center">
                          <label className="font-extrabold text-slate-800 flex items-center gap-1">
                            <span>التوصيات الإجرائية للمشرف والمدرسة (مستمدة تلقائياً من التقييم الكلي)*</span>
                            <span className="text-[10px] text-rose-500 font-bold">*</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            أقصى عدد للحروف (1000) حرف | المتبقي: {Math.max(0, 1000 - recommendationsText.length)}
                          </span>
                        </div>
                        <textarea
                          value={recommendationsText}
                          onChange={(e) => setRecommendationsText(e.target.value.slice(0, 1000))}
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed shadow-inner"
                          placeholder="اكتب التوصيات الإجرائية المحددة والقابلة للتطبيق والمربوطة بفترات زمنية ومسؤوليات تحقق..."
                        />
                      </div>
                    </div>

                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setEvalWizardStep(3)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl border border-slate-200 transition-colors font-sans cursor-pointer"
                  >
                    السابق: الـ 13 مؤشراً والتقييم
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvalWizardStep(5)}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition-colors flex items-center gap-1.5 font-sans cursor-pointer"
                  >
                    <span>التالي: استمارة التقييم والاعتماد</span>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: التقرير الختامي واستمارة تقويم الأداء الفعلي */}
            {evalWizardStep === 5 && (
              <div className="space-y-6 animate-fade-in print:p-0">
                
                {/* Real-time Compiled Official Visit Evaluation Report */}
                {(() => {
                  const selectedTeacher = teachers.find((t) => t.id === targetTeacherId);
                  const liveVisitObj: VisitEvaluation = {
                    id: "temp_preview",
                    teacherId: targetTeacherId || "",
                    teacherName: selectedTeacher?.name || "المعلم المستهدف",
                    date: lessonDate,
                    grade: gradeLevel,
                    classroom,
                    lessonTopic: lessonTopic.trim(),
                    observerName,
                    scores: OMANI_INDICATORS.reduce((acc, ind) => {
                      acc[ind.id] = scores[ind.id] || EvaluationRating.SUITABLE;
                      return acc;
                    }, {} as Record<number, EvaluationRating>),
                    evidence: OMANI_INDICATORS.reduce((acc, ind) => {
                      const score = scores[ind.id] || EvaluationRating.SUITABLE;
                      acc[ind.id] = evidence[ind.id] || `${ind.rubrics[score]} ويظهر ذلك من خلال الشواهد التالية: `;
                      return acc;
                    }, {} as Record<number, string>),
                    generalStrengths,
                    generalDevelopments,
                    recommendations,
                    summaryNotes,

                    // Omani Portal Specific fields
                    visitNumber,
                    period,
                    approved,
                    schoolName,
                    civilId,
                    generalStrengthsText: generalStrengthsText || generalStrengths.map(s => `• ${s}`).join("\n"),
                    generalDevelopmentsText: generalDevelopmentsText || generalDevelopments.map(d => `• ${d}`).join("\n"),
                    supportProvided: supportProvided || "تقديم التغذية الراجعة المباشرة وجلسة توجيهية بعد الحصة.",
                    recommendationsText: recommendationsText || recommendations.map(r => `• ${r.text}`).join("\n"),
                    selectedIndicators,
                  };

                  return (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs font-semibold text-amber-900 flex items-center gap-2 print:hidden leading-relaxed">
                        <Sparkles className="h-4 w-4 text-amber-600 flex-shrink-0 animate-pulse" />
                        <span>أنت الآن تستعرض <strong>نموذج استمارة تقويم الأداء الفعلي</strong> (ملف الزيارة الإشرافية المعتمد). يمكنك معاينة التقرير ومراجعته، طباعته أو تصديره كـ PDF رسمي، ثم اعتماده ختامياً لحفظه بالأرشيف.</span>
                      </div>

                      <VisitReport
                        visit={liveVisitObj}
                        isWizardMode={true}
                        onPrevStep={() => setEvalWizardStep(4)}
                        onSave={handleSaveVisitEvaluation}
                      />
                    </div>
                  );
                })()}

              </div>
            )}

          </div>
        )}

        {/* TAB 4: OFFICIAL VISIT REPORT TEMPLATE WITH PRINTING */}
        {activeTab === "report" && selectedVisit && (
          <VisitReport
            visit={selectedVisit}
            onClose={() => {
              setSelectedVisit(null);
              setActiveTab("visits");
            }}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-12 bg-slate-900 text-slate-400 py-6 border-t border-slate-800 print:hidden text-center text-xs space-y-1">
        <p className="font-semibold text-slate-300">نظام رصد الشواهد الميدانية والتقييم الذكي للمعلم الأول</p>
        <p className="text-slate-500">تم التطوير لتلبية موجهات الإشراف التربوي - وزارة التربية والتعليم - سلطنة عمان 2025/2026</p>
      </footer>

      {/* ADD TEACHER MODAL DIALOG */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">إضافة معلم جديد للقسم</h3>
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddNewTeacher} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1.5">
                <label className="font-bold">اسم المعلم الثلاثي والقبيلة:</label>
                <input
                  type="text"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="مثال: أ. يوسف بن سليمان الريامي"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold">التخصص / المادة:</label>
                  <select
                    value={newTeacherSubject}
                    onChange={(e) => setNewTeacherSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  >
                    {OMANI_SUBJECTS.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold">سنوات الخبرة بالميدان:</label>
                  <input
                    type="number"
                    value={newTeacherExperience}
                    onChange={(e) => setNewTeacherExperience(Number(e.target.value))}
                    min={0}
                    max={40}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold">الحلقة التدريسية للمدرسة:</label>
                <select
                  value={newTeacherLevel}
                  onChange={(e) => setNewTeacherLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                >
                  {SCHOOL_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold">البريد الإلكتروني للوزارة (إن وجد):</label>
                <input
                  type="email"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  placeholder="user@edu.om"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-left font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg font-bold shadow-sm"
                >
                  حفظ وتسجيل المعلم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

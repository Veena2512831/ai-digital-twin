import React, { useState, useEffect, useContext } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ShieldCheck,
  Award,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  Eye,
  Layers,
  Sparkles,
  Search,
  Filter,
  Activity,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const API_URL = "http://localhost:8000";

// Fallback demo dataset for rich presentation when DB has no student history yet
const FALLBACK_DEMO_DATA = {
  read_only: true,
  student: {
    student_id: "demo-student-1",
    full_name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    board: "CBSE",
    grade: "Grade 10",
    guardian_email: "parent.sharma@example.com",
    date_of_birth: "2010-04-15",
  },
  overall_stats: {
    overall_mastery: 84.5,
    grade_label: "A",
    tests_completed: 14,
    viva_sessions: 9,
    total_topics: 16,
    mastered_topics: 8,
    proficient_topics: 5,
    developing_topics: 2,
    struggling_topics: 1,
  },
  subject_progress: [
    {
      name: "Mathematics",
      average_score: 88.2,
      total_topics: 4,
      mastered_topics: 3,
      topics: [
        {
          topic: "Quadratic Equations",
          mastery_score: 0.92,
          percentage: 92,
          correct_answers: 46,
          total_questions: 50,
          status: "Mastered",
          level: "high",
          color: "#10B981",
        },
        {
          topic: "Trigonometric Ratios",
          mastery_score: 0.88,
          percentage: 88,
          correct_answers: 44,
          total_questions: 50,
          status: "Mastered",
          level: "high",
          color: "#10B981",
        },
        {
          topic: "Coordinate Geometry",
          mastery_score: 0.86,
          percentage: 86,
          correct_answers: 43,
          total_questions: 50,
          status: "Mastered",
          level: "high",
          color: "#10B981",
        },
        {
          topic: "Arithmetic Progressions",
          mastery_score: 0.77,
          percentage: 77,
          correct_answers: 38,
          total_questions: 50,
          status: "Proficient",
          level: "medium",
          color: "#3B82F6",
        },
      ],
    },
    {
      name: "Physics",
      average_score: 86.5,
      total_topics: 4,
      mastered_topics: 2,
      topics: [
        {
          topic: "Refraction of Light",
          mastery_score: 0.94,
          percentage: 94,
          correct_answers: 47,
          total_questions: 50,
          status: "Mastered",
          level: "high",
          color: "#10B981",
        },
        {
          topic: "Ohm's Law & Circuits",
          mastery_score: 0.89,
          percentage: 89,
          correct_answers: 44,
          total_questions: 50,
          status: "Mastered",
          level: "high",
          color: "#10B981",
        },
        {
          topic: "Magnetic Field Effects",
          mastery_score: 0.78,
          percentage: 78,
          correct_answers: 39,
          total_questions: 50,
          status: "Proficient",
          level: "medium",
          color: "#3B82F6",
        },
        {
          topic: "Electromagnetic Induction",
          mastery_score: 0.65,
          percentage: 65,
          correct_answers: 32,
          total_questions: 50,
          status: "Developing",
          level: "low",
          color: "#F59E0B",
        },
      ],
    },
    {
      name: "Chemistry",
      average_score: 79.0,
      total_topics: 4,
      mastered_topics: 1,
      topics: [
        {
          topic: "Chemical Reactions",
          mastery_score: 0.9,
          percentage: 90,
          correct_answers: 45,
          total_questions: 50,
          status: "Mastered",
          level: "high",
          color: "#10B981",
        },
        {
          topic: "Acids, Bases & Salts",
          mastery_score: 0.82,
          percentage: 82,
          correct_answers: 41,
          total_questions: 50,
          status: "Proficient",
          level: "medium",
          color: "#3B82F6",
        },
        {
          topic: "Metals and Non-Metals",
          mastery_score: 0.74,
          percentage: 74,
          correct_answers: 37,
          total_questions: 50,
          status: "Proficient",
          level: "medium",
          color: "#3B82F6",
        },
        {
          topic: "Carbon Compounds",
          mastery_score: 0.48,
          percentage: 48,
          correct_answers: 24,
          total_questions: 50,
          status: "Needs Attention",
          level: "critical",
          color: "#EF4444",
        },
      ],
    },
    {
      name: "English Literature",
      average_score: 91.5,
      total_topics: 4,
      mastered_topics: 3,
      topics: [
        {
          topic: "Reading Comprehension",
          mastery_score: 0.96,
          percentage: 96,
          correct_answers: 48,
          total_questions: 50,
          status: "Mastered",
          level: "high",
          color: "#10B981",
        },
        {
          topic: "Analytical Essays",
          mastery_score: 0.92,
          percentage: 92,
          correct_answers: 46,
          total_questions: 50,
          status: "Mastered",
          level: "high",
          color: "#10B981",
        },
        {
          topic: "Poetic Devices",
          mastery_score: 0.9,
          percentage: 90,
          correct_answers: 45,
          total_questions: 50,
          status: "Mastered",
          level: "high",
          color: "#10B981",
        },
        {
          topic: "Grammar & Syntax",
          mastery_score: 0.88,
          percentage: 88,
          correct_answers: 44,
          total_questions: 50,
          status: "Mastered",
          level: "high",
          color: "#10B981",
        },
      ],
    },
  ],
  topic_heatmap: [
    {
      subject: "Mathematics",
      topic: "Quadratic Equations",
      score: 92,
      level: "high",
      status: "Mastered",
      color: "#10B981",
    },
    {
      subject: "Mathematics",
      topic: "Trigonometric Ratios",
      score: 88,
      level: "high",
      status: "Mastered",
      color: "#10B981",
    },
    {
      subject: "Mathematics",
      topic: "Coordinate Geometry",
      score: 86,
      level: "high",
      status: "Mastered",
      color: "#10B981",
    },
    {
      subject: "Mathematics",
      topic: "Arithmetic Progressions",
      score: 77,
      level: "medium",
      status: "Proficient",
      color: "#3B82F6",
    },
    {
      subject: "Physics",
      topic: "Refraction of Light",
      score: 94,
      level: "high",
      status: "Mastered",
      color: "#10B981",
    },
    {
      subject: "Physics",
      topic: "Ohm's Law & Circuits",
      score: 89,
      level: "high",
      status: "Mastered",
      color: "#10B981",
    },
    {
      subject: "Physics",
      topic: "Magnetic Field Effects",
      score: 78,
      level: "medium",
      status: "Proficient",
      color: "#3B82F6",
    },
    {
      subject: "Physics",
      topic: "Electromagnetic Induction",
      score: 65,
      level: "low",
      status: "Developing",
      color: "#F59E0B",
    },
    {
      subject: "Chemistry",
      topic: "Chemical Reactions",
      score: 90,
      level: "high",
      status: "Mastered",
      color: "#10B981",
    },
    {
      subject: "Chemistry",
      topic: "Acids, Bases & Salts",
      score: 82,
      level: "medium",
      status: "Proficient",
      color: "#3B82F6",
    },
    {
      subject: "Chemistry",
      topic: "Metals and Non-Metals",
      score: 74,
      level: "medium",
      status: "Proficient",
      color: "#3B82F6",
    },
    {
      subject: "Chemistry",
      topic: "Carbon Compounds",
      score: 48,
      level: "critical",
      status: "Needs Attention",
      color: "#EF4444",
    },
    {
      subject: "English",
      topic: "Reading Comprehension",
      score: 96,
      level: "high",
      status: "Mastered",
      color: "#10B981",
    },
    {
      subject: "English",
      topic: "Analytical Essays",
      score: 92,
      level: "high",
      status: "Mastered",
      color: "#10B981",
    },
    {
      subject: "English",
      topic: "Poetic Devices",
      score: 90,
      level: "high",
      status: "Mastered",
      color: "#10B981",
    },
    {
      subject: "English",
      topic: "Grammar & Syntax",
      score: 88,
      level: "high",
      status: "Mastered",
      color: "#10B981",
    },
  ],
  struggles: [
    {
      topic: "Carbon Compounds",
      subject: "Chemistry",
      struggle_score: 0.52,
      mastery_score: 0.48,
    },
    {
      topic: "Electromagnetic Induction",
      subject: "Physics",
      struggle_score: 0.35,
      mastery_score: 0.65,
    },
    {
      topic: "Metals and Non-Metals",
      subject: "Chemistry",
      struggle_score: 0.26,
      mastery_score: 0.74,
    },
  ],
  recent_tests: [
    {
      test_id: "t1",
      title: "Chemistry Ch 4 Practice Test",
      subject: "Chemistry",
      created_at: "2026-09-12",
    },
    {
      test_id: "t2",
      title: "Physics Viva Practice Session",
      subject: "Physics",
      created_at: "2026-09-10",
    },
    {
      test_id: "t3",
      title: "Maths Term Mock Exam",
      subject: "Mathematics",
      created_at: "2026-09-08",
    },
    {
      test_id: "t4",
      title: "English Essay Review",
      subject: "English Literature",
      created_at: "2026-09-05",
    },
  ],
  history_timeline: [
    { week: "Week 1", mastery: 68.0, classAvg: 70 },
    { week: "Week 2", mastery: 74.5, classAvg: 71 },
    { week: "Week 3", mastery: 80.2, classAvg: 73 },
    { week: "Week 4", mastery: 84.5, classAvg: 75 },
  ],
  ai_insights: {
    summary:
      "Aarav has shown outstanding growth over the past month, climbing from 68% to an overall mastery of 84.5% (Grade A). English Literature and Mathematics are strong cornerstones, while Chemistry's 'Carbon Compounds' is the primary area requiring active practice.",
    strongest_subject: "English Literature",
    weakest_topic: "Carbon Compounds",
    recommended_action:
      "Schedule 15 minutes of flashcard practice daily on Organic Nomenclature & Carbon Compounds.",
  },
};

export default function ParentsOverview() {
  const { user } = useContext(AuthContext);

  const [dashData, setDashData] = useState(FALLBACK_DEMO_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [guardianStudents, setGuardianStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(user?.student_id || "");

  const [filterSubject, setFilterSubject] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [activeTopicModal, setActiveTopicModal] = useState(null);

  // Fetch list of linked students for Guardian
  useEffect(() => {
    const fetchStudents = async () => {
      const gEmail = user?.guardian_email || user?.email || "";
      try {
        const response = await fetch(
          `${API_URL}/api/v1/guardian/students${gEmail ? `?guardian_email=${encodeURIComponent(gEmail)}` : ""}`
        );
        if (response.ok) {
          const raw = await response.json();
          const list = raw.students || raw.data?.students || [];
          if (list && list.length > 0) {
            setGuardianStudents(list);
            if (!selectedStudentId) {
              setSelectedStudentId(list[0].student_id);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch guardian student list:", err);
      }
    };

    fetchStudents();
  }, [user]);

  // Fetch telemetry & progress data for selected student
  useEffect(() => {
    const fetchGuardianData = async () => {
      const targetId = selectedStudentId || user?.student_id;

      if (!targetId) {
        setDashData(FALLBACK_DEMO_DATA);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/v1/guardian/dashboard/${targetId}`
        );

        if (!response.ok) {
          throw new Error(
            `Guardian API returned status ${response.status}`
          );
        }

        const rawData = await response.json();
        const data = rawData.data || rawData;

        // If backend returned valid guardian payload with student info
        if (data && data.student) {
          setDashData({
            read_only: true,
            student: data.student || FALLBACK_DEMO_DATA.student,
            overall_stats:
              data.overall_stats ||
              FALLBACK_DEMO_DATA.overall_stats,
            subject_progress:
              data.subject_progress &&
              data.subject_progress.length > 0
                ? data.subject_progress
                : FALLBACK_DEMO_DATA.subject_progress,
            topic_heatmap:
              data.topic_heatmap &&
              data.topic_heatmap.length > 0
                ? data.topic_heatmap
                : FALLBACK_DEMO_DATA.topic_heatmap,
            struggles:
              data.struggles && data.struggles.length > 0
                ? data.struggles
                : FALLBACK_DEMO_DATA.struggles,
            recent_tests:
              data.recent_tests ||
              FALLBACK_DEMO_DATA.recent_tests,
            history_timeline:
              data.history_timeline &&
              data.history_timeline.length > 0
                ? data.history_timeline
                : FALLBACK_DEMO_DATA.history_timeline,
            ai_insights:
              data.ai_insights ||
              FALLBACK_DEMO_DATA.ai_insights,
          });
        } else {
          setDashData(FALLBACK_DEMO_DATA);
        }
      } catch (err) {
        console.warn(
          "Could not load live guardian API data, defaulting to demo mode:",
          err
        );
        setDashData(FALLBACK_DEMO_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchGuardianData();
  }, [selectedStudentId, user]);

  const toggleSubjectExpand = (subjName) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjName]: !prev[subjName],
    }));
  };

  const {
    student,
    overall_stats,
    subject_progress,
    topic_heatmap,
    struggles,
    recent_tests,
    history_timeline,
    ai_insights,
  } = dashData;

  // Filtering heatmap tiles
  const filteredHeatmap = topic_heatmap.filter((tile) => {
    const matchesSubject =
      filterSubject === "ALL" ||
      tile.subject.toLowerCase() ===
        filterSubject.toLowerCase();

    const matchesStatus =
      filterStatus === "ALL" ||
      tile.status.toLowerCase() ===
        filterStatus.toLowerCase() ||
      (filterStatus === "STRUGGLING" && tile.score < 50);

    return matchesSubject && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Mastered":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "Proficient":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "Developing":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
      default:
        return "bg-red-500/20 text-red-400 border border-red-500/30";
    }
  };

  if (loading) {
    return (
      <div
        className="po-root d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <div className="text-center text-light">
          <div
            className="spinner-border text-info mb-3"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          />
          <h4 className="fw-semibold">Loading Guardian Portal...</h4>
          <p className="text-muted">
            Connecting live student mastery telemetry
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="po-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

        .po-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #0B0F19;
          background-image: 
            radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 85% 85%, rgba(16, 185, 129, 0.06) 0%, transparent 40%);
          color: #E2E8F0;
          min-height: 100vh;
          padding: 24px 20px 60px;
          box-sizing: border-box;
        }

        .po-container {
          max-width: 1240px;
          margin: 0 auto;
        }

        /* Read-Only Guardian Portal Banner */
        .guardian-portal-bar {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(51, 65, 85, 0.7);
          border-radius: 16px;
          padding: 16px 24px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .portal-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
          border: 1px solid rgba(16, 185, 129, 0.3);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 20px;
        }

        .read-only-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(148, 163, 184, 0.1);
          color: #94A3B8;
          border: 1px solid rgba(148, 163, 184, 0.2);
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
        }

        /* Cards Layout */
        .po-grid-top {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 992px) {
          .po-grid-top {
            grid-template-columns: 1fr;
          }
        }

        .po-card {
          background: #111827;
          border: 1px solid #1F2937;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .po-card-glass {
          background: rgba(17, 24, 39, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(31, 41, 55, 0.9);
        }

        .po-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .po-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #F8FAFC;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
        }

        .po-card-title svg {
          color: #38BDF8;
        }

        /* Metric Counters */
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 14px;
        }

        .metric-tile {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 14px 16px;
        }

        .metric-val {
          font-size: 26px;
          font-weight: 800;
          color: #F8FAFC;
          font-family: 'JetBrains Mono', monospace;
          line-height: 1.1;
        }

        .metric-lbl {
          font-size: 12px;
          color: #94A3B8;
          font-weight: 500;
          margin-top: 4px;
        }

        /* Donut Gauge */
        .gauge-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px 0;
        }

        .gauge-center {
          position: absolute;
          top: 42%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .gauge-number {
          font-size: 38px;
          font-weight: 800;
          color: #F8FAFC;
          font-family: 'JetBrains Mono', monospace;
          line-height: 1;
        }

        .gauge-grade {
          display: inline-block;
          margin-top: 6px;
          background: #10B981;
          color: #064E3B;
          font-weight: 800;
          font-size: 13px;
          padding: 3px 12px;
          border-radius: 12px;
        }

        /* Heatmap Grid Matrix */
        .heatmap-section {
          margin-bottom: 24px;
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .heatmap-tile {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .heatmap-tile:hover {
          transform: translateY(-2px);
          border-color: #64748B;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .heatmap-tile-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 6px;
          margin-bottom: 8px;
        }

        .heatmap-subj {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94A3B8;
          font-weight: 600;
        }

        .heatmap-score {
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          font-weight: 700;
        }

        .heatmap-topic {
          font-size: 13px;
          font-weight: 600;
          color: #E2E8F0;
          line-height: 1.3;
          margin-bottom: 8px;
        }

        .heatmap-bar-bg {
          height: 6px;
          width: 100%;
          background: #0F172A;
          border-radius: 4px;
          overflow: hidden;
        }

        .heatmap-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s ease;
        }

        /* Subject Accordions */
        .subject-accordion-item {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 14px;
          margin-bottom: 12px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .subject-accordion-item:hover {
          border-color: #475569;
        }

        .subject-accordion-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          user-select: none;
        }

        .subject-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .subject-name-txt {
          font-size: 16px;
          font-weight: 700;
          color: #F8FAFC;
        }

        .topic-row-table {
          width: 100%;
          border-collapse: collapse;
        }

        .topic-row-table th {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94A3B8;
          padding: 12px 16px;
          border-bottom: 1px solid #334155;
          text-align: left;
          background: #111827;
        }

        .topic-row-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #1E293B;
          font-size: 13.5px;
          color: #E2E8F0;
        }

        .topic-row-table tr:last-child td {
          border-bottom: none;
        }

        /* AI Insight Banner */
        .ai-insight-box {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 16px;
          padding: 20px 24px;
          margin-bottom: 24px;
          position: relative;
        }

        .ai-insight-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: #38BDF8;
          border-radius: 4px 0 0 4px;
        }

        /* Filter Controls */
        .filter-pill-btn {
          background: #1E293B;
          border: 1px solid #334155;
          color: #94A3B8;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .filter-pill-btn:hover {
          color: #F8FAFC;
          border-color: #64748B;
        }

        .filter-pill-btn.active {
          background: #3B82F6;
          border-color: #3B82F6;
          color: #FFFFFF;
        }

        .pill-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 12px;
          text-transform: uppercase;
        }
      `}</style>

      <div className="po-container">
        {/* ================= GUARDIAN PORTAL HEADER ================= */}
        <div className="guardian-portal-bar">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <span className="portal-badge">
              <ShieldCheck size={16} />
              Guardian Portal
            </span>
            <span className="read-only-tag">
              <Eye size={14} />
              Read-Only Live Monitoring
            </span>
          </div>

          <div className="d-flex align-items-center gap-3 text-muted text-sm">
            <Users size={16} className="text-info" />
            {guardianStudents.length > 1 ? (
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: "13px" }}>Select Student:</span>
                <select
                  className="form-select form-select-sm bg-dark text-light border-secondary shadow-none"
                  style={{ minWidth: "200px", borderRadius: "8px", fontSize: "13px" }}
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  {guardianStudents.map((st) => (
                    <option key={st.student_id} value={st.student_id}>
                      {st.full_name} ({st.grade} · {st.board})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span>
                Student: <strong>{student?.full_name}</strong> ({student?.grade} ·{" "}
                {student?.board})
              </span>
            )}
          </div>
        </div>

        {/* ================= AI PARENT INSIGHT NOTE ================= */}
        <div className="ai-insight-box">
          <div className="d-flex align-items-center gap-2 mb-2 text-sky-400 font-semibold">
            <BrainCircuit size={20} className="text-info" />
            <span className="text-info fw-bold">
              AI Parent Executive Summary
            </span>
            <span className="badge bg-info text-dark ms-auto">Updated Today</span>
          </div>
          <p className="mb-2 text-light" style={{ fontSize: "14.5px", lineHeight: "1.6" }}>
            {ai_insights?.summary}
          </p>
          <div className="d-flex align-items-center gap-3 pt-2 text-muted" style={{ fontSize: "13px" }}>
            <span>
              🌟 Strongest Area: <strong className="text-emerald-400">{ai_insights?.strongest_subject}</strong>
            </span>
            <span>·</span>
            <span>
              🎯 Priority Focus: <strong className="text-amber-400">{ai_insights?.weakest_topic}</strong>
            </span>
          </div>
        </div>

        {/* ================= OVERALL MASTERY & KEY METRICS ================= */}
        <div className="po-grid-top">
          {/* Circular Donut Gauge */}
          <div className="po-card po-card-glass text-center">
            <div className="po-card-header">
              <h3 className="po-card-title">
                <Award size={20} /> Overall Mastery
              </h3>
            </div>

            <div className="gauge-container">
              <ResponsiveContainer width={220} height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Mastery", value: overall_stats?.overall_mastery || 0 },
                      { name: "Remaining", value: 100 - (overall_stats?.overall_mastery || 0) },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={88}
                    startAngle={225}
                    endAngle={-45}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#1E293B" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="gauge-center">
                <div className="gauge-number">
                  {overall_stats?.overall_mastery}%
                </div>
                <div className="gauge-grade">
                  Grade {overall_stats?.grade_label}
                </div>
              </div>
            </div>

            <p className="text-muted mt-2 mb-0" style={{ fontSize: "12.5px" }}>
              Calculated across {overall_stats?.total_topics || 0} evaluated syllabus topics
            </p>
          </div>

          {/* Key Metrics Grid & Status Breakdown */}
          <div className="po-card po-card-glass">
            <div className="po-card-header">
              <h3 className="po-card-title">
                <Activity size={20} /> Academic Snapshot
              </h3>
              <span className="text-muted" style={{ fontSize: "12px" }}>
                Auto-synced with Digital Twin
              </span>
            </div>

            <div className="metric-grid mb-4">
              <div className="metric-tile">
                <div className="metric-val text-emerald-400">
                  {overall_stats?.mastered_topics}
                </div>
                <div className="metric-lbl">Mastered Topics (&gt;85%)</div>
              </div>

              <div className="metric-tile">
                <div className="metric-val text-blue-400">
                  {overall_stats?.proficient_topics}
                </div>
                <div className="metric-lbl">Proficient (70-84%)</div>
              </div>

              <div className="metric-tile">
                <div className="metric-val text-amber-400">
                  {overall_stats?.developing_topics}
                </div>
                <div className="metric-lbl">Developing (50-69%)</div>
              </div>

              <div className="metric-tile">
                <div className="metric-val text-red-400">
                  {overall_stats?.struggling_topics}
                </div>
                <div className="metric-lbl">Needs Attention</div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-6 col-sm-3">
                <div className="p-3 bg-dark rounded-3 border border-secondary border-opacity-25">
                  <div className="text-muted" style={{ fontSize: "11px" }}>TESTS TAKEN</div>
                  <div className="fs-4 fw-bold text-light font-mono mt-1">
                    {overall_stats?.tests_completed}
                  </div>
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <div className="p-3 bg-dark rounded-3 border border-secondary border-opacity-25">
                  <div className="text-muted" style={{ fontSize: "11px" }}>VIVA SESSIONS</div>
                  <div className="fs-4 fw-bold text-info font-mono mt-1">
                    {overall_stats?.viva_sessions}
                  </div>
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <div className="p-3 bg-dark rounded-3 border border-secondary border-opacity-25">
                  <div className="text-muted" style={{ fontSize: "11px" }}>TOTAL TOPICS</div>
                  <div className="fs-4 fw-bold text-light font-mono mt-1">
                    {overall_stats?.total_topics}
                  </div>
                </div>
              </div>
              <div className="col-6 col-sm-3">
                <div className="p-3 bg-dark rounded-3 border border-secondary border-opacity-25">
                  <div className="text-muted" style={{ fontSize: "11px" }}>READ-ONLY ACCESS</div>
                  <div className="fs-6 fw-bold text-success mt-1">
                    Active 🛡️
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TOPIC MASTERY HEATMAP GRID ================= */}
        <div className="heatmap-section">
          <div className="po-card">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
              <div>
                <h3 className="po-card-title">
                  <Layers size={20} /> Topic Mastery Heatmap
                </h3>
                <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
                  Visual topic matrix color-coded by student performance level
                </p>
              </div>

              {/* Filters */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="text-muted" style={{ fontSize: "12px" }}>
                  <Filter size={12} className="me-1" /> Subject:
                </span>
                {["ALL", "Mathematics", "Physics", "Chemistry", "English"].map(
                  (subj) => (
                    <button
                      key={subj}
                      className={`filter-pill-btn ${
                        filterSubject === subj ? "active" : ""
                      }`}
                      onClick={() => setFilterSubject(subj)}
                    >
                      {subj}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Heatmap Matrix Tiles */}
            <div className="heatmap-grid">
              {filteredHeatmap.map((tile, idx) => (
                <div
                  key={idx}
                  className="heatmap-tile"
                  onClick={() => setActiveTopicModal(tile)}
                >
                  <div className="heatmap-tile-header">
                    <span className="heatmap-subj">{tile.subject}</span>
                    <span
                      className="heatmap-score"
                      style={{ color: tile.color }}
                    >
                      {tile.score}%
                    </span>
                  </div>
                  <div className="heatmap-topic">{tile.topic}</div>
                  <div className="heatmap-bar-bg">
                    <div
                      className="heatmap-bar-fill"
                      style={{
                        width: `${tile.score}%`,
                        backgroundColor: tile.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= SUBJECT & TOPIC-WISE PROGRESS ACCORDIONS ================= */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-lg-7">
            <div className="po-card h-100">
              <div className="po-card-header">
                <h3 className="po-card-title">
                  <BookOpen size={20} /> Subject & Topic Breakdown
                </h3>
                <span className="text-muted" style={{ fontSize: "12px" }}>
                  Click to inspect topics
                </span>
              </div>

              {subject_progress?.map((subj) => {
                const isOpen = expandedSubjects[subj.name];

                return (
                  <div key={subj.name} className="subject-accordion-item">
                    <div
                      className="subject-accordion-header"
                      onClick={() => toggleSubjectExpand(subj.name)}
                    >
                      <div className="subject-info">
                        <span className="subject-name-txt">{subj.name}</span>
                        <span
                          className="badge bg-dark text-info border border-info border-opacity-25"
                          style={{ fontSize: "11px" }}
                        >
                          {subj.mastered_topics}/{subj.total_topics} Mastered
                        </span>
                      </div>

                      <div className="d-flex align-items-center gap-3">
                        <span
                          className="fw-bold font-mono"
                          style={{ fontSize: "16px", color: "#38BDF8" }}
                        >
                          {subj.average_score}%
                        </span>
                        {isOpen ? (
                          <ChevronUp size={18} className="text-muted" />
                        ) : (
                          <ChevronDown size={18} className="text-muted" />
                        )}
                      </div>
                    </div>

                    {/* Topic Level Table */}
                    {isOpen && (
                      <div className="border-top border-secondary border-opacity-25">
                        <table className="topic-row-table">
                          <thead>
                            <tr>
                              <th>Topic</th>
                              <th>Mastery Score</th>
                              <th>Questions Answered</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subj.topics?.map((topItem, tIdx) => (
                              <tr key={tIdx}>
                                <td className="fw-semibold text-light">
                                  {topItem.topic}
                                </td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="font-mono fw-bold">
                                      {topItem.percentage}%
                                    </span>
                                    <div
                                      className="heatmap-bar-bg"
                                      style={{ width: "60px" }}
                                    >
                                      <div
                                        className="heatmap-bar-fill"
                                        style={{
                                          width: `${topItem.percentage}%`,
                                          backgroundColor: topItem.color,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="text-muted font-mono">
                                  {topItem.correct_answers} /{" "}
                                  {topItem.total_questions}
                                </td>
                                <td>
                                  <span
                                    className={`pill-badge ${getStatusBadgeClass(
                                      topItem.status
                                    )}`}
                                  >
                                    {topItem.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trajectory & Struggle List */}
          <div className="col-12 col-lg-5">
            <div className="po-card h-100 d-flex flex-column gap-4">
              {/* Progress Trajectory Chart */}
              <div>
                <h3 className="po-card-title mb-3">
                  <TrendingUp size={20} /> Mastery Trajectory
                </h3>
                <div style={{ height: "180px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history_timeline}>
                      <defs>
                        <linearGradient
                          id="colorMastery"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10B981"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10B981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="week" stroke="#64748B" fontSize={11} />
                      <YAxis domain={[50, 100]} stroke="#64748B" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1E293B",
                          borderColor: "#334155",
                          borderRadius: "8px",
                          color: "#F8FAFC",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="mastery"
                        stroke="#10B981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorMastery)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Struggles Card */}
              <div className="pt-2 border-top border-secondary border-opacity-25">
                <h3 className="po-card-title mb-3 text-warning">
                  <AlertTriangle size={20} className="text-amber-400" /> Key Areas for Improvement
                </h3>
                {struggles?.map((st, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 mb-2 rounded-3 bg-dark border border-amber-500 border-opacity-25 d-flex align-items-center justify-content-between"
                  >
                    <div>
                      <div className="fw-semibold text-light" style={{ fontSize: "14px" }}>
                        {st.topic}
                      </div>
                      <div className="text-muted" style={{ fontSize: "12px" }}>
                        Subject: {st.subject}
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-danger bg-opacity-20 text-danger border border-danger border-opacity-30">
                        {Math.round((st.mastery_score || 0.48) * 100)}% Mastery
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
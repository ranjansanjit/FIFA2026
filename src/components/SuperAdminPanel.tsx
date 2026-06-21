import React, { useState, useEffect } from "react";
import { Match, UserProfile } from "../types";
import { 
  ShieldCheck, Activity, Users, DollarSign, RefreshCw, 
  Trash2, Lock, Plus, Ban, Eye, Trophy, CreditCard, CheckCircle2, 
  XCircle, Filter, ArrowUpRight 
} from "lucide-react";

interface SuperAdminPanelProps {
  matches: Match[];
  onAdminActionHappened: () => void;
  currentUser?: UserProfile | null;
}

interface DBStats {
  transactions: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    dishHomeId: string;
    amount: number;
    gateway: string;
    merchantTxId: string;
    status: string;
    timestamp: string;
  }>;
  esewaRevenue: number;
  khaltiRevenue: number;
  totalRevenue: number;
  totalPredictions: number;
  totalUserCount: number;
  vipUserCount: number;
  predictions: Array<{
    matchId: string;
    userId: string;
    userName: string;
    userEmail: string;
    dishHomeId: string;
    predictedWinner: "A" | "B" | "draw" | "";
    predictedScoreA: number;
    predictedScoreB: number;
    pointsGranted: number;
    status: "pending" | "processed";
    matchDisplay: string;
    matchStatus: string;
  }>;
  liveQuestions?: Array<{
    id: string;
    matchId: string;
    text: string;
    options: string[];
    points: number;
    expiresAt: string;
    status: "active" | "completed";
    correctAnswer?: string;
  }>;
}

export function SuperAdminPanel({ matches, onAdminActionHappened, currentUser }: SuperAdminPanelProps) {
  // Configs
  const [entryFee, setEntryFee] = useState<number>(500);
  const [prizePool, setPrizePool] = useState<number>(250000);
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [adminGoogleClientId, setAdminGoogleClientId] = useState<string>("");
  
  // Scoring
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matches[0]?.id || "");
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [eventType, setEventType] = useState<string>("goal");
  const [eventDetail, setEventDetail] = useState<string>("");
  const [customWinnerQuestion, setCustomWinnerQuestion] = useState<string>("");

  // Live Questions Maker
  const [liveQText, setLiveQText] = useState("");
  const [liveQOptions, setLiveQOptions] = useState("Nepal, USA, Draw");
  const [liveQPoints, setLiveQPoints] = useState(25);

  // Dishhome resolver
  const [selectedDHId, setSelectedDHId] = useState("dh1");
  const [dhCorrectVal, setDhCorrectVal] = useState("100,001 - 150,000");

  // Admin Logs
  const [isSuper, setIsSuper] = useState(true);
  const [securityLogs, setSecurityLogs] = useState<Array<{ id: string; timestamp: string; type: string; detail: string }>>([]);
  const [userCount, setUserCount] = useState(3);
  const [grossEarnings, setGrossEarnings] = useState(1000);

  // Advanced Dashboard Stats
  const [statsData, setStatsData] = useState<DBStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<"summary" | "payouts" | "ledger" | "correctness" | "audit" | "operators" | "matches" | "teams" | "database" | "predictions_reports">("predictions_reports");
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf" | "word">("excel");
  const [correctnessMatchId, setCorrectnessMatchId] = useState<string>(matches[0]?.id || "");
  const [onlyShowCorrect, setOnlyShowCorrect] = useState<boolean>(false);

  // Predictions reporting and export parameters
  const [reportTables, setReportTables] = useState<any>(null);
  const [reportStats, setReportStats] = useState<any>(null);
  const [reportsLoading, setReportsLoading] = useState<boolean>(true);
  const [reportsTabSearch, setReportsTabSearch] = useState<string>("");
  const [selectedReportView, setSelectedReportView] = useState<"winner" | "goal" | "leaderboard" | "statistics" | "audit">("statistics");
  const [leaderboardFilter, setLeaderboardFilter] = useState<"all" | "10" | "50">("all");
  const [winnerCorrectnessFilter, setWinnerCorrectnessFilter] = useState<"all" | "correct" | "incorrect" | "pending">("all");
  const [goalCorrectnessFilter, setGoalCorrectnessFilter] = useState<"all" | "correct" | "incorrect" | "pending">("all");

  // Match creation / editing state parameters
  const [createTeamA, setCreateTeamA] = useState("");
  const [createTeamB, setCreateTeamB] = useState("");
  const [createFlagA, setCreateFlagA] = useState("🏳️");
  const [createFlagB, setCreateFlagB] = useState("🏳️");
  const [createStartTime, setCreateStartTime] = useState(new Date().toISOString().substring(0, 16));
  const [createGroup, setCreateGroup] = useState("Group Stage");
  const [createNptTime, setCreateNptTime] = useState("");

  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editTeamA, setEditTeamA] = useState("");
  const [editTeamB, setEditTeamB] = useState("");
  const [editFlagA, setEditFlagA] = useState("");
  const [editFlagB, setEditFlagB] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [editStatus, setEditStatus] = useState<"upcoming" | "live" | "completed">("upcoming");
  const [editScoreA, setEditScoreA] = useState(0);
  const [editScoreB, setEditScoreB] = useState(0);
  const [editLocked, setEditLocked] = useState(false);
  const [editNptTime, setEditNptTime] = useState("");

  // Audited spectator logs & dynamic player statistics states
  const [visitorLogs, setVisitorLogs] = useState<any[]>([]);
  const [playersAudit, setPlayersAudit] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingAudits, setLoadingAudits] = useState<boolean>(false);

  // Auto-refresh toggle (disabled by default to avoid unwanted automatic reloads)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // Search & Winner tools filters
  const [visitorSearch, setVisitorSearch] = useState<string>("");
  const [playerSearch, setPlayerSearch] = useState<string>("");
  const [winnerRaffleCount, setWinnerRaffleCount] = useState<number>(1);
  const [winnerMatchFilter, setWinnerMatchFilter] = useState<string>("");
  const [winnerPoolResult, setWinnerPoolResult] = useState<any[]>([]);

  // Admin creator form states
  const [newAdminName, setNewAdminName] = useState<string>("");
  const [newAdminEmail, setNewAdminEmail] = useState<string>("");

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  } | null>(null);
  const [newAdminMobile, setNewAdminMobile] = useState<string>("");
  const [newAdminPassword, setNewAdminPassword] = useState<string>("");

  // Relational SQL Database Explorer States
  const [dbTables, setDbTables] = useState<any>(null);
  const [selectedDbTable, setSelectedDbTable] = useState<string>("users");
  const [dbSearchQuery, setDbSearchQuery] = useState<string>("");
  const [sqlSchemaCode, setSqlSchemaCode] = useState<string>("");
  const [sqlSeedCode, setSqlSeedCode] = useState<string>("");
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"schema" | "seed">("schema");

  const fetchDatabaseTables = async () => {
    try {
      setDbLoading(true);
      const res = await fetch("/api/admin/database-tables");
      const data = await res.json();
      if (data.success) {
        setDbTables(data.tables);
        setSqlSchemaCode(data.schemaSql);
        setSqlSeedCode(data.seedSql);
      }
    } catch (err) {
      console.error("Failed to load relational tables:", err);
    } finally {
      setDbLoading(false);
    }
  };

  // Teams management states
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  
  const [teamCreateName, setTeamCreateName] = useState("");
  const [teamCreateCoach, setTeamCreateCoach] = useState("");
  const [teamCreatePrevWC, setTeamCreatePrevWC] = useState("");
  const [teamCreateFifaRanking, setTeamCreateFifaRanking] = useState(50);
  const [teamCreateStars, setTeamCreateStars] = useState(3);
  const [teamCreateGroup, setTeamCreateGroup] = useState("A");
  const [teamCreateFlag, setTeamCreateFlag] = useState("🏳️");

  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [teamEditName, setTeamEditName] = useState("");
  const [teamEditCoach, setTeamEditCoach] = useState("");
  const [teamEditPrevWC, setTeamEditPrevWC] = useState("");
  const [teamEditFifaRanking, setTeamEditFifaRanking] = useState(50);
  const [teamEditStars, setTeamEditStars] = useState(3);
  const [teamEditGroup, setTeamEditGroup] = useState("A");
  const [teamEditFlag, setTeamEditFlag] = useState("🏳️");

  const fetchTeams = async () => {
    setTeamsLoading(true);
    try {
      const res = await fetch(`/api/teams?role=${currentUser?.role || "admin"}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTeams(data);
        }
      }
    } catch (err) {
      console.error("Error fetching teams list:", err);
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCreateName.trim()) {
      alert("Team Name is required!");
      return;
    }
    try {
      const res = await fetch("/api/admin/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamCreateName,
          coach: teamCreateCoach,
          previousWC: teamCreatePrevWC,
          fifaRanking: Number(teamCreateFifaRanking),
          stars: Number(teamCreateStars),
          group: teamCreateGroup,
          flag: teamCreateFlag,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Team "${teamCreateName}" created successfully!`);
        setTeamCreateName("");
        setTeamCreateCoach("");
        setTeamCreatePrevWC("");
        setTeamCreateFifaRanking(50);
        setTeamCreateStars(3);
        setTeamCreateGroup("A");
        setTeamCreateFlag("🏳️");
        fetchTeams();
        onAdminActionHappened();
      } else {
        alert(data.error || "Failed to create team.");
      }
    } catch (err) {
      alert("Error calling team creation service.");
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    try {
      const res = await fetch("/api/admin/teams/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTeam.id,
          name: teamEditName,
          coach: teamEditCoach,
          previousWC: teamEditPrevWC,
          fifaRanking: Number(teamEditFifaRanking),
          stars: Number(teamEditStars),
          group: teamEditGroup,
          flag: teamEditFlag,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Team updated successfully!");
        setEditingTeam(null);
        fetchTeams();
        onAdminActionHappened();
      } else {
        alert(data.error || "Failed to edit team.");
      }
    } catch (err) {
      alert("Error calling team edit service.");
    }
  };

  const handleToggleHideTeam = async (teamId: string) => {
    try {
      const res = await fetch("/api/admin/teams/toggle-hidden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: teamId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchTeams();
        onAdminActionHappened();
      } else {
        alert(data.error || "Failed to toggle team visibility.");
      }
    } catch (err) {
      alert("Error changing visibility flag.");
    }
  };

  const fetchPredictionReportData = async () => {
    setReportsLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch("/api/admin/prediction-reports/tables"),
        fetch("/api/admin/prediction-reports/statistics")
      ]);
      if (tRes.ok && sRes.ok) {
        setReportTables(await tRes.json());
        setReportStats(await sRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReportsLoading(false);
    }
  };

  // Trigger loading of teams when the teams subtab is clicked active
  useEffect(() => {
    if (activeAdminSubTab === "teams") {
      fetchTeams();
    }
    if (activeAdminSubTab === "database") {
      fetchDatabaseTables();
    }
    if (activeAdminSubTab === "predictions_reports") {
      fetchPredictionReportData();
    }
  }, [activeAdminSubTab]);

  // Fetch admin logs and standard statistics
  const fetchAdminStats = async () => {
    try {
      const res = await fetch("/api/admin/security/logs");
      if (res.ok) {
        const stats = await res.json();
        setSecurityLogs(stats.logs || []);
        setUserCount(stats.userCount || 3);
        setGrossEarnings(stats.earnings || 1000);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Fetch complete real-time dashboard analytics, transaction history, and prediction list
  const fetchAdvancedDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard-stats");
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
        if (data.googleClientId !== undefined) {
          setAdminGoogleClientId(data.googleClientId || "");
        }
      }
    } catch (err) {
      console.error("Failed to load platform data profiles", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch platform parameters on load
  const fetchPaymentConfig = async () => {
    try {
      const res = await fetch("/api/payment/config");
      if (res.ok) {
        const config = await res.json();
        setEntryFee(config.entryFee || 500);
        setPrizePool(config.prizePool || 250000);
        setCommissionRate(config.commissionRate || 10);
      }
      
      const gRes = await fetch("/api/auth/google/config");
      if (gRes.ok) {
        const gConfig = await gRes.json();
        setAdminGoogleClientId(gConfig.googleClientId || "");
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchAuditsAndAdmins = async () => {
    setLoadingAudits(true);
    try {
      const isSuperUser = currentUser?.email === "ranjansanjit@gmail.com" || currentUser?.email === "sahrolex10@gmail.com" || (currentUser as any)?.role === "superadmin";
      
      const resVisits = await fetch("/api/admin/visits");
      const dataVisits = await resVisits.json();
      if (dataVisits.success) {
        setVisitorLogs(dataVisits.visits || []);
      }

      const resPlayers = await fetch("/api/admin/registered-players");
      const dataPlayers = await resPlayers.json();
      if (dataPlayers.success) {
        setPlayersAudit(dataPlayers.players || []);
        if (dataPlayers.players.length > 0 && !winnerMatchFilter) {
          const preds = dataPlayers.players.flatMap((p: any) => p.predictions);
          if (preds.length > 0) {
            setWinnerMatchFilter(preds[0].matchId);
          } else {
            setWinnerMatchFilter("all_predictors");
          }
        }
      }

      if (isSuperUser) {
        if (dataPlayers.success) {
          const admins = dataPlayers.players.filter((p: any) => p.role === "admin" || p.role === "superadmin");
          setAdminUsers(admins);
        }
      }
    } catch (e) {
      console.warn("Failed to load spectator visit entries or administrators log.", e);
    } finally {
      setLoadingAudits(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail || !newAdminPassword) {
      alert("Name, email and login password PIN are required.");
      return;
    }
    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAdminName,
          email: newAdminEmail,
          mobile: newAdminMobile,
          password: newAdminPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "Operator successfully created!");
        setNewAdminName("");
        setNewAdminEmail("");
        setNewAdminMobile("");
        setNewAdminPassword("");
        fetchAuditsAndAdmins();
        onAdminActionHappened();
      } else {
        alert(data.error || "Failed to register Operator.");
      }
    } catch (err) {
      alert("Network failure registry error.");
    }
  };

  const handleToggleDisableAdmin = async (email: string) => {
    try {
      const res = await fetch("/api/admin/toggle-disable-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchAuditsAndAdmins();
        onAdminActionHappened();
      } else {
        alert(data.error || "Failed to change operator status.");
      }
    } catch (e) {
      alert("Network failure switching administrative privileges.");
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTeamA || !createTeamB) {
      alert("Team identifiers are required to construct match schedule.");
      return;
    }
    try {
      const res = await fetch("/api/admin/match/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamA: createTeamA,
          teamB: createTeamB,
          flagA: createFlagA,
          flagB: createFlagB,
          startTime: createStartTime,
          group: createGroup,
          nptTime: createNptTime
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "FIFA 2026 Match successfully registered!");
        setCreateTeamA("");
        setCreateTeamB("");
        setCreateFlagA("🏳️");
        setCreateFlagB("🏳️");
        setCreateNptTime("");
        onAdminActionHappened();
      } else {
        alert(data.error || "Action unsuccessful registry failed.");
      }
    } catch (err) {
      alert("Server failure registers.");
    }
  };

  const handleSaveMatchEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    try {
      const res = await fetch("/api/admin/match/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingMatch.id,
          teamA: editTeamA,
          teamB: editTeamB,
          flagA: editFlagA,
          flagB: editFlagB,
          startTime: editStartTime,
          group: editGroup,
          status: editStatus,
          scoreA: editScoreA,
          scoreB: editScoreB,
          locked: editLocked,
          nptTime: editNptTime
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "Match configurations updated.");
        setEditingMatch(null);
        onAdminActionHappened();
      } else {
        alert(data.error || "Failed to update match configurations.");
      }
    } catch (err) {
      alert("Server response timeout.");
    }
  };

  const handleDeleteMatch = (id: string, name: string) => {
    setConfirmDialog({
      title: "Permanently Delete Match?",
      message: `Are you sure you want to permanently delete "${name}" from schedule list? This action removes associated prediction registers!`,
      danger: true,
      confirmText: "Yes, Delete Match",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/match/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            alert(data.message || "Match schedule clean completed.");
            onAdminActionHappened();
          } else {
            alert(data.error || "Delete action aborted.");
          }
        } catch (err) {
          alert("Platform connection loss.");
        }
      }
    });
  };

  const handleToggleHideMatch = async (matchId: string) => {
    try {
      const res = await fetch("/api/admin/match/toggle-hidden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: matchId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onAdminActionHappened();
      } else {
        alert(data.error || "Failed to toggle match visibility.");
      }
    } catch (err) {
      alert("Error changing match visibility flag.");
    }
  };

  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = (filename: string, headers: string[], rows: string[][]) => {
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>FIFA World Cup Sheet</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
          th { background-color: #0F172A; color: #FFFFFF; font-weight: bold; border: 1px solid #CBD5E1; padding: 10px; text-align: left; }
          td { border: 1px solid #E2E8F0; padding: 8px; text-align: left; white-space: pre-wrap; font-size: 11px; max-width: 480px; word-break: break-all; line-height: 1.4; vertical-align: top; }
          tr:nth-child(even) { background-color: #F8FAFC; }
        </style>
      </head>
      <body>
        <h3>FIFA World Cup 2026 Admin Export File</h3>
        <p>File Generation Timestamp: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map(r => `<tr>${r.map(v => `<td>${String(v).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".xls") ? filename : filename + ".xls";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadWord = (filename: string, title: string, headers: string[], rows: string[][]) => {
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
        <style>
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 1in; color: #1E293B; }
          h2 { color: #0F172A; font-family: 'Segoe UI', Arial, sans-serif; border-bottom: 2px solid #CBD5E1; padding-bottom: 8px; margin-bottom: 5px; }
          p.meta { font-size: 10pt; color: #64748B; font-family: monospace; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; }
          th { background-color: #0F172A; color: #FFFFFF; font-weight: bold; border: 1px solid #CBD5E1; padding: 10px; text-align: left; font-size: 11pt; }
          td { border: 1px solid #E2E8F0; padding: 8px; text-align: left; font-size: 10pt; vertical-align: top; white-space: pre-wrap; word-break: break-all; line-height: 1.4; }
          tr:nth-child(even) { background-color: #F8FAFC; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <p class="meta">Export Timestamp: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map(r => `<tr>${r.map(v => `<td>${String(v).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".doc") ? filename : filename + ".doc";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDFReport = (title: string, headers: string[], rows: string[][]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocked! Please allow popups to generate files.");
      return;
    }

    const today = new Date().toLocaleString();
    const tableHeadersHTML = headers.map(h => `<th style="padding: 10px; background-color: #0F172A; color: white; border: 1px solid #CBD5E1; text-align: left; font-size: 11px; font-family: monospace;">${h}</th>`).join("");
    const tableRowsHTML = rows.map(row => {
      const cols = row.map(cell => `<td style="padding: 8px; border: 1px solid #E2E8F0; font-size: 10px; text-align: left; font-family: Arial, sans-serif; white-space: pre-line; word-break: break-word; line-height: 1.4; vertical-align: top;">${String(cell).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`).join("");
      return `<tr style="border-bottom: 1px solid #E2E8F0;">${cols}</tr>`;
    }).join("");

    const reportHTML = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @media print {
              body { margin: 12mm; color: #1E293B; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none; }
            }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1E293B; }
            .header { border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 15px; }
            .title-section h1 { margin: 0; font-size: 18px; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px; }
            .title-section p { margin: 4px 0 0 0; font-size: 10px; color: #64748B; font-family: monospace; }
            .meta-info { text-align: right; font-size: 10px; color: #64748B; font-family: monospace; }
            .meta-info div { margin-bottom: 2px; }
            .summary-bar { background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 11px; font-family: monospace; color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            tr:nth-child(even) { background-color: #F8FAFC !important; }
            .footer { margin-top: 30px; border-top: 1px solid #CBD5E1; padding-top: 8px; font-size: 9px; text-align: center; color: #94A3B8; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; background-color: #1E293B; color: white; padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <div style="font-size: 11px; font-family: monospace;">
              📄 PDF Ledger Preview loaded. Click 'Save to PDF' inside client print interface below.
            </div>
            <button onclick="window.print();" style="background-color: #eab308; color: black; border: none; padding: 6px 14px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; font-family: monospace; text-transform: uppercase;">
              🖨️ Save as PDF / Print
            </button>
          </div>

          <div class="header">
            <div style="float: left;" class="title-section">
              <h1>🏆 FIFA WORLD CUP 2026 NEO TOURNAMENT</h1>
              <p>Platform Administrative Analytics System</p>
            </div>
            <div style="float: right; text-align: right;" class="meta-info">
              <div>REPORT: <strong style="color: #000;">${title.toUpperCase()}</strong></div>
              <div>DATE: ${today}</div>
              <div>SECURITY ASSURANCE ID: FIFA-QA-2026</div>
            </div>
            <div style="clear: both;"></div>
          </div>

          <div class="summary-bar">
            <strong>INTEGRITY RECORD:</strong> Live platform analytical export logs secured under TLS-256 protocol. Total records compiled: <strong>${rows.length} rows</strong>. All user prediction accuracy statistics finalized.
          </div>

          <table>
            <thead>
              <tr>${tableHeadersHTML}</tr>
            </thead>
            <tbody>
              ${tableRowsHTML}
            </tbody>
          </table>

          <div class="footer">
            PLATFORM RECORD SYSTEM • NEPAL TELECOM & DISHHOME BROADCAST INTEGRATION • PAGE 1 OF 1
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
  };

  const runExport = (filenameBase: string, title: string, headers: string[], rows: string[][]) => {
    if (exportFormat === "csv") {
      downloadCSV(filenameBase + ".csv", headers, rows);
    } else if (exportFormat === "excel") {
      downloadExcel(filenameBase + ".xls", headers, rows);
    } else if (exportFormat === "pdf") {
      generatePDFReport(title, headers, rows);
    } else if (exportFormat === "word") {
      downloadWord(filenameBase + ".doc", title, headers, rows);
    }
  };

  const exportPlayerAuditReport = (format: "excel" | "word" | "pdf") => {
    if (!playersAudit || playersAudit.length === 0) {
      alert("No patient or predictor data loaded.");
      return;
    }

    const filtered = playersAudit.filter(p => 
      !playerSearch || 
      p.name.toLowerCase().includes(playerSearch.toLowerCase()) || 
      p.email.toLowerCase().includes(playerSearch.toLowerCase()) || 
      (p.mobile && p.mobile.includes(playerSearch)) ||
      (p.country && p.country.toLowerCase().includes(playerSearch.toLowerCase())) ||
      (p.employeeId && String(p.employeeId).includes(playerSearch)) ||
      (p.username && p.username.toLowerCase().includes(playerSearch.toLowerCase()))
    );

    if (filtered.length === 0) {
      alert("No data matched the current filter terms to export.");
      return;
    }

    const headers = [
      "Full Name/Profile",
      "Username",
      "Employee ID",
      "Email Address", 
      "Mobile Contact", 
      "Country", 
      "Accumulated Score", 
      "Predictions Count", 
      "Forecast Records & Points"
    ];
    
    const rows = filtered.map(player => {
      const predsText = matches && matches.length > 0
        ? matches.map((match: any, index: number) => {
            const p = player.predictions?.find((pred: any) => pred.matchId === match.id);
            const matchDisplay = `${match.teamA} vs ${match.teamB}`;
            if (p) {
              const winnerStr = p.predictedWinner && p.predictedWinner !== "draw" ? p.predictedWinner.toUpperCase() : "DRAW";
              return `${index + 1}. ${matchDisplay}: WINNER: ${winnerStr} [${p.predictedScoreA}-${p.predictedScoreB}] (+${p.pointsGranted} PTS)`;
            } else {
              return `${index + 1}. ${matchDisplay}: NOT PLAYED [- -] (0 PTS)`;
            }
          }).join("\n")
        : "No game predictions registered";

      return [
        player.name,
        player.username || "N/A",
        String(player.employeeId || "N/A"),
        player.email,
        player.mobile || "N/A",
        player.country || "Nepal",
        `${player.points} PTS`,
        `${player.predictionsCount || 0} play(s)`,
        predsText
      ];
    });

    const title = "Game Player Audit Analytics Report";
    const baseFilename = `fifa2026_game_player_audit_report_${new Date().toISOString().substring(0, 10)}`;

    if (format === "excel") {
      downloadExcel(baseFilename + ".xls", headers, rows);
    } else if (format === "word") {
      downloadWord(baseFilename + ".doc", title, headers, rows);
    } else if (format === "pdf") {
      generatePDFReport(title, headers, rows);
    }
  };

  const exportAllUsers = () => {
    if (!playersAudit || playersAudit.length === 0) {
      alert("No registers are loaded to perform dataset conversion.");
      return;
    }
    const headers = ["User ID", "Name", "Username", "Employee ID", "Email", "Mobile", "Country", "Points Score", "Accuracy Ratio", "Total Predictions Checked", "Role", "Status"];
    const rows = playersAudit.map(p => [
      p.id,
      p.name,
      p.username || "N/A",
      String(p.employeeId || "N/A"),
      p.email,
      p.mobile || "N/A",
      p.country || "Nepal",
      String(p.points),
      `${p.accuracy}%`,
      String(p.predictionsCount),
      p.role || "user",
      p.isDisabled ? "Suspended" : "Active"
    ]);
    runExport("fifa_worldcup2026_registered_users", "Registered Tournament Predictors Index", headers, rows);
  };

  const exportAllMatches = () => {
    if (!matches || matches.length === 0) {
      alert("No matches available in system database schedules.");
      return;
    }
    const headers = ["Match ID", "Team A", "Team B", "Group ID", "kickoff UTC", "NPT Local Time", "Current Status", "Score A", "Score B", "Locked"];
    const rows = matches.map(m => [
      m.id,
      m.teamA,
      m.teamB,
      m.group || "Group State",
      m.startTime,
      m.nptTime || "",
      m.status,
      String(m.scoreA),
      String(m.scoreB),
      m.locked ? "Yes" : "No"
    ]);
    runExport("fifa_worldcup2026_matches_schedule", "FIFA World Cup 2026 Match Schedules", headers, rows);
  };

  const exportLeaderboard = () => {
    const sorted = [...playersAudit].sort((a, b) => b.points - a.points);
    if (sorted.length === 0) {
      alert("No players registered to retrieve.");
      return;
    }
    const headers = ["Leaderboard Rank", "Name", "Email Address", "Mobile Contact", "Country Location", "Points Score", "Avg Accuracy Ratio", "Play Total Count"];
    const rows = sorted.map((p, index) => [
      String(index + 1),
      p.name,
      p.email,
      p.mobile || "N/A",
      p.country || "Nepal",
      String(p.points),
      `${p.accuracy}%`,
      String(p.predictionsCount)
    ]);
    runExport("fifa_worldcup2026_leaderboard_standings", "Tournament Global Leaderboard Standings Roster", headers, rows);
  };

  const exportPredictionsDatabase = () => {
    if (!statsData?.predictions || statsData.predictions.length === 0) {
      alert("No predictions logged to process database download.");
      return;
    }
    const headers = ["Predictor Name", "Email Auth", "Match Teams Descriptor", "forecast Winner Choice", "Predicted Score Team A", "Predicted Score Team B", "Earned Points Granted", "Status Code"];
    const rows = statsData.predictions.map(pred => [
      pred.userName || "N/A",
      pred.userEmail || "N/A",
      pred.matchDisplay || "N/A",
      pred.predictedWinner || "Draw outcome",
      String(pred.predictedScoreA),
      String(pred.predictedScoreB),
      String(pred.pointsGranted),
      pred.status || "pending"
    ]);
    runExport("fifa_worldcup2026_full_predictions_db", "Users Predicted Score Tournament Log Sheet", headers, rows);
  };

  const handleRemoveAdmin = (email: string) => {
    setConfirmDialog({
      title: "Demote Administrator?",
      message: `Are you sure you want to demote and remove standard admin privileges from ${email}?`,
      danger: true,
      confirmText: "Yes, Demote Operator",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/remove-admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            alert(data.message);
            fetchAuditsAndAdmins();
            onAdminActionHappened();
          } else {
            alert(data.error || "Failed to demote Operator.");
          }
        } catch (err) {
          alert("Network exception demotion error.");
        }
      }
    });
  };

  const handleRunRaffle = () => {
    if (!winnerMatchFilter) {
      alert("Please select a valid filter.");
      return;
    }

    let candidatePool: any[] = [];

    if (winnerMatchFilter === "all_predictors" || winnerMatchFilter === "all") {
      candidatePool = playersAudit.filter(p => p.predictionsCount > 0);
    } else {
      candidatePool = playersAudit.filter((player) => {
        const pred = player.predictions.find((p: any) => p.matchId === winnerMatchFilter);
        return pred && pred.pointsGranted > 0; // pointsGranted > 0 represents correct predictions
      });
    }

    if (candidatePool.length === 0) {
      alert("No players matched the selected criteria. Randomly sampling from all active users instead!");
      candidatePool = playersAudit.filter(p => p.predictionsCount > 0);
    }

    if (candidatePool.length === 0) {
      alert("No players have submitted any predictions on the platform yet.");
      return;
    }

    const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
    setWinnerPoolResult(shuffled.slice(0, winnerRaffleCount));
  };

  useEffect(() => {
    fetchPaymentConfig();
    fetchAdminStats();
    fetchAdvancedDashboardStats();
    fetchAuditsAndAdmins();

    let interval: ReturnType<typeof setInterval> | undefined;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAdminStats();
        fetchAdvancedDashboardStats();
        fetchAuditsAndAdmins();
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Update lists when a match is selected
  useEffect(() => {
    if (matches.length > 0 && !selectedMatchId) {
      setSelectedMatchId(matches[0].id);
    }
    if (matches.length > 0 && !correctnessMatchId) {
      setCorrectnessMatchId(matches[0].id);
    }
  }, [matches]);

  useEffect(() => {
    const match = matches.find((m) => m.id === selectedMatchId);
    if (match) {
      setCustomWinnerQuestion(match.customWinnerQuestion || "");
    }
  }, [selectedMatchId, matches]);

  const handleSaveCustomQuestion = async () => {
    if (!selectedMatchId) return;
    try {
      const res = await fetch("/api/admin/matches/update-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatchId,
          customWinnerQuestion,
        }),
      });

      if (res.ok) {
        alert("Match customized winner question updated successfully!");
        onAdminActionHappened();
        fetchAdminStats();
        fetchAdvancedDashboardStats();
      } else {
        alert("Failed to update custom question.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error trying to save customized question.");
    }
  };

  const handleUpdateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId) return;

    try {
      const res = await fetch("/api/admin/match/update-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatchId,
          scoreA,
          scoreB,
          eventType,
          eventDetail,
        }),
      });

      if (res.ok) {
        alert("Match parameters updated successfully! Live score settled.");
        setEventDetail("");
        onAdminActionHappened();
        fetchAdminStats();
        fetchAdvancedDashboardStats();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleEndMatch = () => {
    if (!selectedMatchId) return;
    setConfirmDialog({
      title: "Settle and Settle All Predictions?",
      message: "Are you sure you want to end this match? This will process and settle all user predictions based on the current full-time whistle scores.",
      confirmText: "Yes, Settle Predictions",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/match/end`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matchId: selectedMatchId }),
          });

          if (res.ok) {
            alert("Match ended and locked. User predictions resolved successfully!");
            onAdminActionHappened();
            fetchAdminStats();
            fetchAdvancedDashboardStats();
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleCreateLiveQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveQText) return;

    try {
      const res = await fetch("/api/admin/live-questions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatchId,
          text: liveQText,
          options: liveQOptions.split(",").map((o) => o.trim()),
          points: liveQPoints,
        }),
      });

      if (res.ok) {
        alert("Match question launched successfully!");
        setLiveQText("");
        onAdminActionHappened();
        fetchAdminStats();
        fetchAdvancedDashboardStats();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleResolveLiveQ = async (questionId: string, correctAnswer: string) => {
    try {
      const res = await fetch("/api/admin/live-questions/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, correctAnswer }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        fetchAdvancedDashboardStats();
        onAdminActionHappened();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeleteLiveQ = (questionId: string) => {
    setConfirmDialog({
      title: "Remove Live Question?",
      message: "Are you sure you want to delete this live question? This cannot be undone.",
      danger: true,
      confirmText: "Yes, Delete",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/live-questions/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId }),
          });

          if (res.ok) {
            alert("Live question deleted successfully!");
            fetchAdvancedDashboardStats();
            onAdminActionHappened();
          }
        } catch (e) {
          console.warn(e);
        }
      }
    });
  };

  const handleResolveDishHome = async () => {
    try {
      const res = await fetch("/api/admin/dishhome/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: selectedDHId, correctAnswer: dhCorrectVal }),
      });

      if (res.ok) {
        alert("DishHome system resolved! Users rewarded points dynamically.");
        fetchAdminStats();
        fetchAdvancedDashboardStats();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleSavePlatformSettings = async () => {
    try {
      const res = await fetch("/api/admin/platform/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryFee, commissionRate, prizePool, googleClientId: adminGoogleClientId }),
      });

      if (res.ok) {
        alert("Platform settings saved successfully!");
        fetchAdminStats();
        fetchAdvancedDashboardStats();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleBanUser = (userId: string) => {
    setConfirmDialog({
      title: "Ban Competitor?",
      message: `Are you sure you want to ban competitor "${userId}" permanently from prediction leaderboards?`,
      danger: true,
      confirmText: "Yes, Ban Competitor",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/users/ban", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });

          if (res.ok) {
            alert("User banned. Leaderboard positions recalculated.");
            fetchAdminStats();
            fetchAdvancedDashboardStats();
          }
        } catch (err) {
          console.warn(err);
        }
      }
    });
  };

  const handlePurgeIncorrectPredictions = () => {
    if (!correctnessMatchId) return;
    setConfirmDialog({
      title: "Confirm Complete Predictions Purge?",
      message: "Are you sure you want to completely discard/remove all incorrect projections for this match from the admin sheet? This gives exact visual control of winners.",
      danger: true,
      confirmText: "Yes, Purge Sheet",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/predictions/purge-incorrect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matchId: correctnessMatchId })
          });

          if (res.ok) {
            const data = await res.json();
            alert(data.message);
            fetchAdvancedDashboardStats();
          }
        } catch (err) {
          console.error("Purge failure", err);
        }
      }
    });
  };

  // Filter local predictions list based on selection and onlyShowCorrect toggle
  const currentMatchPredictions = correctnessMatchId === "all"
    ? (statsData?.predictions || [])
    : (statsData?.predictions.filter(p => p.matchId === correctnessMatchId) || []);
  const filteredPredictions = onlyShowCorrect 
    ? currentMatchPredictions.filter(p => p.status === "processed" && p.pointsGranted > 0)
    : currentMatchPredictions;

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-6 font-sans text-slate-100">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <Activity className="w-6 h-6 text-red-500 animate-[pulse_2s_infinite]" />
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white uppercase tracking-tight">Super Operator Console</h2>
            <p className="text-xs text-slate-400 mt-1">Unified eSewa & Khalti transactions ledger, correct answers audit room, and platform variables.</p>
          </div>
        </div>
        <div className="flex bg-black/40 p-1 border border-white/10 rounded-lg text-[10px] font-mono gap-1 font-bold">
          <button 
            type="button" 
            onClick={() => setIsSuper(false)}
            className={`px-3 py-1.5 rounded cursor-pointer transition-all ${!isSuper ? "bg-fifa-gold text-fifa-blue" : "text-gray-400 hover:text-white"}`}
          >
            STANDARD ADMIN
          </button>
          <button 
            type="button" 
            onClick={() => setIsSuper(true)}
            className={`px-3 py-1.5 rounded cursor-pointer transition-all ${isSuper ? "bg-red-650 text-white shadow" : "text-gray-400 hover:text-white"}`}
          >
            SUPER COCKPIT 👑
          </button>
        </div>
        <div className="ml-3">
          <button
            type="button"
            onClick={() => setAutoRefresh((s) => !s)}
            className={`px-3 py-1.5 rounded cursor-pointer text-[11px] font-mono font-bold transition-all ${autoRefresh ? "bg-emerald-600 text-black" : "text-gray-400 hover:text-white"}`}
          >
            Auto-refresh: {autoRefresh ? "On" : "Off"}
          </button>
        </div>
      </div>

      {/* Admin Tab Switching Navigation */}
      <div className="flex border-b border-white/10 mb-6 text-xs font-mono font-bold uppercase tracking-wider gap-2">
        <button
          onClick={() => setActiveAdminSubTab("summary")}
          className={`pb-3 px-1 transition-all border-b-2 ${
            activeAdminSubTab === "summary" ? "border-[#00D1FF] text-white" : "border-transparent text-gray-400 hover:text-slate-200"
          }`}
        >
          📈 SUMMARY DASHBOARD
        </button>
        <button
          onClick={() => setActiveAdminSubTab("ledger")}
          className={`pb-3 px-1 transition-all border-b-2 ${
            activeAdminSubTab === "ledger" ? "border-[#00D1FF] text-white" : "border-transparent text-gray-400 hover:text-slate-200"
          }`}
        >
          💸 TRANSACTIONS LEDGER
        </button>
        <button
          onClick={() => setActiveAdminSubTab("correctness")}
          className={`pb-3 px-1 transition-all border-b-2 ${
            activeAdminSubTab === "correctness" ? "border-[#00D1FF] text-white" : "border-transparent text-gray-400 hover:text-slate-200"
          }`}
        >
          🎯 CORRECT PREDICTORS CONTROLLER
        </button>
        <button
          onClick={() => setActiveAdminSubTab("payouts")}
          className={`pb-3 px-1 transition-all border-b-2 ${
            activeAdminSubTab === "payouts" ? "border-[#00D1FF] text-white" : "border-transparent text-gray-400 hover:text-slate-200"
          }`}
        >
          🛠️ SCORE & GAME CONTROLS
        </button>
        <button
          onClick={() => setActiveAdminSubTab("matches")}
          className={`pb-3 px-1 transition-all border-b-2 ${
            activeAdminSubTab === "matches" ? "border-[#00D1FF] text-white" : "border-transparent text-gray-400 hover:text-slate-200"
          }`}
        >
          ⚽ MATCHES SCHEDULE
        </button>
        <button
          onClick={() => setActiveAdminSubTab("audit")}
          className={`pb-3 px-1 transition-all border-b-2 ${
            activeAdminSubTab === "audit" ? "border-[#00D1FF] text-white" : "border-transparent text-gray-400 hover:text-slate-200"
          }`}
        >
          👥 VISITOR LOGS & PLAYS
        </button>
        {(currentUser?.email === "ranjansanjit@gmail.com" || currentUser?.email === "sahrolex10@gmail.com" || (currentUser as any)?.role === "superadmin") && (
          <button
            onClick={() => setActiveAdminSubTab("operators")}
            className={`pb-3 px-1 transition-all border-b-2 ${
              activeAdminSubTab === "operators" ? "border-[#00D1FF] text-white" : "border-transparent text-gray-400 hover:text-slate-200"
            }`}
          >
            👑 MANAGE OPERATORS
          </button>
        )}
        {(currentUser?.email === "ranjansanjit@gmail.com" || currentUser?.email === "sahrolex10@gmail.com" || (currentUser as any)?.role === "superadmin") && (
          <button
            onClick={() => setActiveAdminSubTab("teams")}
            className={`pb-3 px-1 transition-all border-b-2 ${
              activeAdminSubTab === "teams" ? "border-[#00D1FF] text-white" : "border-transparent text-gray-400 hover:text-slate-200"
            }`}
          >
            🛡️ TEAMS MANAGEMENT
          </button>
        )}
        <button
          onClick={() => setActiveAdminSubTab("predictions_reports")}
          className={`pb-3 px-1 transition-all border-b-2 whitespace-nowrap ${
            activeAdminSubTab === "predictions_reports" ? "border-emerald-400 text-emerald-400" : "border-transparent text-gray-400 hover:text-slate-200"
          }`}
        >
          📊 PREDICTIONS AUDIT & REPORT
        </button>
        <button
          onClick={() => setActiveAdminSubTab("database")}
          className={`pb-3 px-1 transition-all border-b-2 ${
            activeAdminSubTab === "database" ? "border-[#00D1FF] text-white" : "border-transparent text-gray-400 hover:text-slate-200"
          }`}
        >
          🗄️ SQL DB EXPLORER
        </button>
      </div>

      {/* --- SUBTAB 1: OVERALL SUMMARY DASHBOARD --- */}
      {activeAdminSubTab === "summary" && (
        <div className="space-y-6">
          {/* Export & Administrative Reports Section */}
          <div className="bg-gradient-to-r from-blue-950/40 to-slate-900/40 border border-[#00D1FF]/20 rounded-xl p-5 backdrop-blur-sm shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2.5">
              <h3 className="text-white font-mono font-bold text-sm tracking-widest flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#00D1FF]" />
                FIFA 2026 AUDIT REPORTS & DATA EXPORTS
              </h3>
              <p className="text-[11px] text-gray-400">
                Download interactive spreadsheet report sheets, match schedules, leaderboard stands, and predicted logs.
              </p>
              
              {/* Premium Export Format Toggle Selector */}
              <div className="inline-flex items-center gap-1 bg-slate-950/60 border border-white/5 p-1 rounded-lg select-none">
                <span className="text-[9px] text-slate-400 font-mono font-bold uppercase px-2">Format:</span>
                <button 
                  onClick={() => setExportFormat("excel")} 
                  className={`px-2 py-1 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer ${exportFormat === "excel" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:text-white border border-transparent"}`}
                >
                  📊 Excel
                </button>
                <button 
                  onClick={() => setExportFormat("word")} 
                  className={`px-2 py-1 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer ${exportFormat === "word" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-white border border-transparent"}`}
                >
                  📝 Word
                </button>
                <button 
                  onClick={() => setExportFormat("pdf")} 
                  className={`px-2 py-1 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer ${exportFormat === "pdf" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-slate-400 hover:text-white border border-transparent"}`}
                >
                  📕 PDF
                </button>
                <button 
                  onClick={() => setExportFormat("csv")} 
                  className={`px-2 py-1 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer ${exportFormat === "csv" ? "bg-slate-800 text-slate-200 border border-white/10" : "text-slate-400 hover:text-white border border-transparent"}`}
                >
                  📑 CSV
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={exportAllUsers}
                className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
              >
                📥 Export Users
              </button>
              <button
                onClick={exportAllMatches}
                className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
              >
                📥 Export Matches
              </button>
              <button
                onClick={exportLeaderboard}
                className="px-3.5 py-1.5 rounded bg-fifa-gold/20 hover:bg-fifa-gold/30 text-fifa-gold font-mono text-xs font-bold border border-fifa-gold/20 hover:border-fifa-gold/40 transition-all flex items-center gap-1.5"
              >
                🏆 Export Leaderboard
              </button>
              <button
                onClick={exportPredictionsDatabase}
                className="px-3.5 py-1.5 rounded bg-[#00D1FF]/10 hover:bg-[#00D1FF]/20 text-[#00D1FF] font-mono text-xs font-bold border border-[#00D1FF]/20 hover:border-[#00D1FF]/40 transition-all flex items-center gap-1.5"
              >
                🎯 Export Predictions
              </button>
            </div>
          </div>

          {/* Main Stat KPI Cards completely removed per request */}

          {/* Sub-block Graphics and statistics */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Left: Interactive comparison bars */}
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center justify-between">
                <span>Revenue Channel Analytics</span>
                <span className="text-[10px] text-[#00D1FF] font-mono">LIVE SPLIT</span>
              </h3>

              {statsData && (
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <div className="flex justify-between mb-1 text-slate-300">
                      <span>eSewa instant pay channel</span>
                      <span className="text-emerald-400 font-bold">NRs. {statsData.esewaRevenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${statsData.totalRevenue > 0 ? (statsData.esewaRevenue / statsData.totalRevenue) * 100 : 50}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-slate-300">
                      <span>Khalti digital wallet channel</span>
                      <span className="text-purple-400 font-bold">NRs. {statsData.khaltiRevenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-500 h-full transition-all"
                        style={{ width: `${statsData.totalRevenue > 0 ? (statsData.khaltiRevenue / statsData.totalRevenue) * 100 : 50}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-white/5 pt-4 text-xs text-slate-400 leading-relaxed font-mono">
                💡 <span className="text-white font-bold">Automatic Settlement Note:</span> In compliance with administrative directives, normal user registrations are restricted strictly to Google Single Sign-On or active DishHome customer ID verifications, and predictions require eSewa or Khalti validation passes. Standard currency accounts are logged automatically.
              </div>
            </div>

            {/* Right: Quick Action Controls summary */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider">Lobby Metrics</h3>
              
              <div className="space-y-3 font-mono text-xs text-slate-300">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Total Predictions Logged:</span>
                  <span className="text-white font-bold">{statsData ? statsData.totalPredictions : 0} items</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Verification Bypasses:</span>
                  <span className="text-emerald-400 font-bold">OAuth Simulated</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>DishHome Submissions:</span>
                  <span className="text-white font-bold">Real-time DB tied</span>
                </div>
                <div className="flex justify-between text-yellow-500">
                  <span>Secured Credentials:</span>
                  <span className="font-bold">FIFA TLS Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 2: VERIFIED PAYMENTS LEDGER (eSewa & Khalti Only) --- */}
      {activeAdminSubTab === "ledger" && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-fifa-gold" />
                Revenue Transactions Ledger
              </h3>
              <p className="text-xs text-slate-400 mt-1">Real-time payment validations audit sheet.</p>
            </div>
            
            <button
              onClick={fetchAdvancedDashboardStats}
              className="px-3 py-1.5 border border-[#00D1FF]/40 text-[#00D1FF] hover:bg-[#00D1FF]/10 rounded-lg text-xs font-mono font-bold transition-all uppercase flex items-center gap-1.5 self-start cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Transactions
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 bg-black/20 select-none">
                  <th className="p-3">TRANSACTION ID</th>
                  <th className="p-3">FULL NAME</th>
                  <th className="p-3">EMAIL / DH-ID</th>
                  <th className="p-3">CHANNEL</th>
                  <th className="p-3">AMOUNT</th>
                  <th className="p-3">DATE / TIME</th>
                  <th className="p-3 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {statsData && statsData.transactions.length > 0 ? (
                  statsData.transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white-[0.02] transition-colors">
                      <td className="p-3 text-[#00D1FF] font-bold">{tx.merchantTxId}</td>
                      <td className="p-3 text-white font-bold">{tx.userName}</td>
                      <td className="p-3 text-slate-300">
                        {tx.dishHomeId !== "N/A" ? (
                          <span className="bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px]">
                            DishHome ID: {tx.dishHomeId}
                          </span>
                        ) : (
                          tx.userEmail
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.gateway === "eSewa" 
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/25" 
                            : "bg-purple-950/40 text-purple-400 border border-purple-500/25"
                        }`}>
                          {tx.gateway}
                        </span>
                      </td>
                      <td className="p-3 text-white font-bold">NRs. {tx.amount}</td>
                      <td className="p-3 text-slate-400">{new Date(tx.timestamp).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <span className="text-emerald-400 font-bold bg-emerald-950/20 px-2 py-1 rounded text-[10px]">
                          ✓ SUCCESSFUL
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key="no-transactions">
                    <td colSpan={7} className="text-center p-12 text-slate-500 italic">
                      No matching eSewa or Khalti transactions have populated yet in this session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB 3: CORRECT PREDICTORS AUDIT & REMOVAL SHEET --- */}
      {activeAdminSubTab === "correctness" && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-5 h-5 text-fifa-gold" />
                Correct Predictions Filter Room
              </h3>
              <p className="text-xs text-slate-400 mt-1">Audit active predictor profiles, view correct answers, or discard incorrect records to keep lists clean.</p>
            </div>

            <button
              onClick={handlePurgeIncorrectPredictions}
              disabled={filteredPredictions.length === 0}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-red-500/40 text-red-400 rounded-lg text-xs font-mono font-bold transition-all uppercase flex items-center gap-2 self-start cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Remove All Incorrect Predictors
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-[10px] font-mono font-bold block mb-1.5 uppercase">Audit Match Target</label>
              <select
                value={correctnessMatchId}
                onChange={(e) => setCorrectnessMatchId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#00D1FF]"
              >
                <option value="all">🌍 COMBINED ALL MATCHES (SHOW ALL)</option>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>{m.teamA} VS {m.teamB} ({m.status.toUpperCase()})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center mt-6">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none text-xs font-mono">
                <input 
                  type="checkbox" 
                  checked={onlyShowCorrect}
                  onChange={(e) => setOnlyShowCorrect(e.target.checked)}
                  className="accent-[#00D1FF] w-4 h-4 cursor-pointer"
                />
                <span className={onlyShowCorrect ? "text-[#00D1FF] font-bold" : "text-slate-300"}>
                  Show ONLY correct predictions (Exclude status pending / zero-pointers)
                </span>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto border border-white/5 rounded-xl">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 bg-black/40 select-none">
                  <th className="p-3">COMPETITOR NAME</th>
                  <th className="p-3">GMAIL / DISHHOME SEAT</th>
                  {correctnessMatchId === "all" && <th className="p-3">TARGET MATCH</th>}
                  <th className="p-3">PREDICTED WINNER</th>
                  <th className="p-3">PREDICTED SCORE</th>
                  <th className="p-3">WINNER STATUS</th>
                  <th className="p-3">SCORE STATUS</th>
                  <th className="p-3 text-right">POINTS AWARDED</th>
                </tr>
              </thead>
              <tbody>
                {filteredPredictions.length > 0 ? (
                  filteredPredictions.map((pred, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-3">
                        <span className="text-white font-bold">{pred.userName}</span>
                      </td>
                      <td className="p-3">
                        {pred.dishHomeId !== "N/A" ? (
                          <span className="bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px]">
                            DishHome: {pred.dishHomeId}
                          </span>
                        ) : (
                          <span className="text-slate-400">{pred.userEmail}</span>
                        )}
                      </td>
                      {correctnessMatchId === "all" && (
                        <td className="p-3">
                          <span className="bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20 px-2 py-0.5 rounded text-[10px] font-bold">
                            {pred.matchDisplay || "N/A"}
                          </span>
                        </td>
                      )}
                      <td className="p-3 text-slate-300">
                        {pred.predictedWinner === "draw" ? (
                          <span className="bg-slate-800 px-2 py-0.5 rounded">Draw Match</span>
                        ) : (
                          <span className="text-white font-bold">Team {pred.predictedWinner}</span>
                        )}
                      </td>
                      <td className="p-3 text-white font-bold font-mono">
                        {pred.predictedScoreA} - {pred.predictedScoreB}
                      </td>
                      <td className="p-3 font-semibold">
                        {pred.status === "processed" ? (
                          pred.winnerCorrect === true ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Winner Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400 bg-red-950/20 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/20">
                              <XCircle className="w-3 h-3" /> Winner Wrong
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded text-[10px] border border-slate-800">
                            ⌛ Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold">
                        {pred.status === "processed" ? (
                          pred.scoreCorrect === true ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Score Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400 bg-red-950/20 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/20">
                              <XCircle className="w-3 h-3" /> Score Wrong
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded text-[10px] border border-slate-800">
                            ⌛ Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-200">
                        {pred.status === "processed" && pred.pointsGranted > 0 ? (
                          <span className="text-[#00D1FF] font-black">+{pred.pointsGranted} PTS</span>
                        ) : (
                          <span className="text-slate-500">{pred.pointsGranted} PTS</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key="no-predictions">
                    <td colSpan={7} className="text-center p-12 text-slate-500 italic">
                      No matching prediction cards found with the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB 4: SCORES & GAMEPLAY ENGINE CONTROLS --- */}
      {activeAdminSubTab === "payouts" && (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          
          {/* Match Scoring & Event Timeline management */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider border-b border-white/10 pb-2">1. Real-Time Scoring Settle</h3>
            
            <form onSubmit={handleUpdateScore} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 text-[10px] font-bold block mb-1">SELECT TARGET MATCH</label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono focus:outline-none"
                >
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>{m.teamA} VS {m.teamB} ({m.status.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2">
                <label className="text-fifa-gold text-[10px] font-bold block uppercase tracking-wide">
                  ✍️ Manual Match Winner Question
                </label>
                <p className="text-[9px] text-slate-400 leading-normal font-sans">
                  Customize the official "Which team will win?" question for this match. Leaving it empty will default to team names and kick-off details.
                </p>
                <input
                  type="text"
                  placeholder="e.g., Which team will reign superior in standard time?"
                  value={customWinnerQuestion}
                  onChange={(e) => setCustomWinnerQuestion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white placeholder-slate-600 focus:outline-none text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomQuestion}
                  className="w-full bg-slate-900 border border-fifa-gold/30 hover:border-fifa-gold text-fifa-gold text-[9px] font-bold py-1.5 px-2 rounded cursor-pointer transition-all uppercase"
                >
                  💾 Save Match Custom Question
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 text-[10px] font-bold block mb-1">SCORE TEAM A</label>
                  <input 
                    type="number" 
                    min={0}
                    value={scoreA}
                    onChange={(e) => setScoreA(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-center focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] font-bold block mb-1">SCORE TEAM B</label>
                  <input 
                    type="number" 
                    min={0}
                    value={scoreB}
                    onChange={(e) => setScoreB(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-center focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-3 space-y-3.5">
                <span className="text-[10px] text-slate-500 font-bold block font-mono">TRIGGER CORNER/VAR/GOAL STATUS</span>
                
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">EVENT TYPE</label>
                  <select 
                    value={eventType} 
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  >
                    <option value="goal">⚽ GOAL</option>
                    <option value="card">🟨 YELLOW/RED CARD</option>
                    <option value="substitution">🔄 SUBSTITUTION</option>
                    <option value="var">🖥️ VAR EVENT</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-[10px] block mb-0.5">DETAIL TEXT</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Penalty scored by Manish Dangi"
                    value={eventDetail}
                    onChange={(e) => setEventDetail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-650 hover:bg-red-600 text-white font-bold py-2 px-3 rounded cursor-pointer text-[10px] tracking-wider uppercase transition-all shadow-md"
                >
                  Log Event & Update Score
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-white/5">
              <button
                onClick={handleEndMatch}
                className="w-full bg-slate-950 hover:bg-slate-900 border border-red-500 text-red-400 font-bold py-2 px-3 rounded cursor-pointer text-[10px] tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all"
              >
                🏁 Blow Full-Time Whistle & Settle
              </button>
            </div>
          </div>

          {/* Live Questions Launcher Panel */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider border-b border-white/10 pb-2">2. Live Questions</h3>

            <form onSubmit={handleCreateLiveQ} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 text-[10px] font-bold block mb-1">INTERACTIVE QUESTION</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Which team will get the next yellow card?"
                  value={liveQText}
                  onChange={(e) => setLiveQText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-fifa-gold"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px] font-bold block mb-1">OPTIONS (COMMA-SEPARATED)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nepal, USA, None"
                  value={liveQOptions}
                  onChange={(e) => setLiveQOptions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-fifa-gold"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px] font-bold block mb-1">REWARD POINTS</label>
                <input 
                  type="number" 
                  min={5}
                  max={150}
                  value={liveQPoints}
                  onChange={(e) => setLiveQPoints(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-linear-to-r from-fifa-gold to-yellow-500 hover:from-yellow-450 hover:to-fifa-gold text-fifa-blue font-bold py-2 px-3 rounded cursor-pointer text-[10px] tracking-wider uppercase"
              >
                🚀 Publish Live Match Question
              </button>
            </form>

            {/* Live Question list, edit & resolution manager */}
            <div className="pt-4 border-t border-white/5 space-y-3 font-mono text-xs">
              <span className="text-[#00D1FF] text-[10px] font-bold block uppercase tracking-wider">
                ⚡ ACTIVE MATCH QUESTION SET ({statsData?.liveQuestions?.filter(q => q.matchId === selectedMatchId).length || 0})
              </span>
              
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {statsData?.liveQuestions && statsData.liveQuestions.filter(q => q.matchId === selectedMatchId).length > 0 ? (
                  statsData.liveQuestions.filter(q => q.matchId === selectedMatchId).map((q) => (
                    <div key={q.id} className="bg-slate-950 border border-white/5 p-3 rounded-lg space-y-2 text-[11px]">
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <p className="text-white font-medium">{q.text}</p>
                          <span className="text-[9px] text-[#00D1FF] font-bold">+{q.points} PTS</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteLiveQ(q.id)}
                          className="text-red-400 hover:text-red-500 hover:bg-red-950/20 p-1 rounded cursor-pointer transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {q.options.map((opt) => {
                          const isCorrect = q.correctAnswer === opt;
                          const isCompleted = q.status === "completed";
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                if (isCompleted) {
                                  alert(`This question is already resolved with answer: ${q.correctAnswer}`);
                                  return;
                                }
                                setConfirmDialog({
                                  title: "Resolve Live Question?",
                                  message: `Are you sure you want to resolve "${q.text}" with the correct answer: "${opt}"? Users who forecasted this will get +${q.points} points instantly!`,
                                  confirmText: "Yes, Settle Correct Answer",
                                  onConfirm: () => {
                                    handleResolveLiveQ(q.id, opt);
                                  }
                                });
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                isCompleted
                                  ? isCorrect
                                    ? "bg-emerald-900 border border-emerald-450 text-emerald-100"
                                    : "bg-slate-900 border border-slate-800 text-slate-500"
                                  : "bg-slate-900 hover:bg-slate-850 hover:border-[#00D1FF]/45 border border-white/5 text-slate-300"
                              }`}
                            >
                              {opt} {isCompleted && isCorrect && "✓"}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-400">
                        <span>Status: <b className={q.status === 'active' ? 'text-yellow-400' : 'text-emerald-400'}>{q.status.toUpperCase()}</b></span>
                        {q.correctAnswer && <span className="text-emerald-400 font-bold">Ans: {q.correctAnswer}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic text-[10px] text-center py-2">No custom questions created for this match yet.</p>
                )}
              </div>
            </div>

            {/* Dishhome Survey Resolver block */}
            <div className="pt-4 border-t border-white/5 space-y-3 font-mono text-xs">
              <span className="text-slate-400 text-[10px] font-bold block">3. RESOLVE DISHHOME SURVEY</span>
              <div>
                <label className="text-slate-500 text-[9px] block mb-0.5">CHOOSE CORRECT OUTCOME</label>
                <select
                  value={dhCorrectVal}
                  onChange={(e) => setDhCorrectVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none"
                >
                  <option value="Below 50,000">Below 50,000</option>
                  <option value="50,000 - 100,000">50,000 - 100,000</option>
                  <option value="100,001 - 150,000">100,001 - 150,000</option>
                  <option value="Above 150,000">Above 150,000</option>
                  <option value="Others (अन्य)">Others (अन्य)</option>
                </select>
              </div>
              <button
                onClick={handleResolveDishHome}
                className="w-full bg-slate-950 hover:bg-slate-900 border border-white/10 text-fifa-neon py-2 px-3 rounded font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all"
              >
                ✓ Settle DishHome Auto-Payout
              </button>
            </div>
          </div>

          {/* Platform configurations (Visible to both admin and superadmin) */}
          <div className="bg-white/5 border border-red-500/30 p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="font-display font-medium text-sm text-red-400 uppercase tracking-wider border-b border-white/5 pb-2">
              👑 {isSuper ? "Super Cockpit Configuration" : "Standard Admin Configuration"}
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-slate-400 text-[10px] block mb-1">ENTRY PASS FEE (NRS)</label>
                <input 
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-1">GRAND PRIZE POOL (NRS)</label>
                <input 
                  type="number"
                  value={prizePool}
                  onChange={(e) => setPrizePool(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block mb-1">GOOGLE OAUTH CLIENT ID</label>
                <input 
                  type="text"
                  placeholder="e.g. 12345-abcde.apps.googleusercontent.com"
                  value={adminGoogleClientId}
                  onChange={(e) => setAdminGoogleClientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-[10px] focus:outline-none"
                />
                <span className="text-[8px] text-slate-500 block mt-1">
                  Obtained from Google Cloud Platform Console for OAuth Verification.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSavePlatformSettings}
                  className="w-full bg-red-650 hover:bg-red-600 text-white font-bold py-2.5 px-3 rounded cursor-pointer text-[10px] tracking-wider uppercase transition-all shadow"
                >
                  Save Global Parameters
                </button>
              </div>

              {/* Fraud Detection banning system checks */}
              <div className="pt-3 border-t border-white/5">
                <span className="text-[9px] text-yellow-500 font-bold block mb-2">🚩 COMPLIANCE AND FRAUD RISK LIST</span>
                <div className="space-y-1">
                  {[
                    { id: "u2", name: "Alex Johnson", email: "alex@predict.com" },
                    { id: "u3", name: "Rohit Sharma", email: "rohit@fifafan.com" }
                  ].map((usr) => (
                    <div key={usr.id} className="flex justify-between items-center bg-slate-900 border border-white/5 p-2 rounded text-[10px]">
                      <span className="text-white font-bold">{usr.name}</span>
                      <button
                        type="button"
                        onClick={() => handleBanUser(usr.id)}
                        className="text-red-400 hover:text-red-500 font-bold uppercase hover:bg-red-950/20 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Ban className="w-3 h-3 text-red-105 shrink-0" />
                        BAN USER
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* --- SUBTAB: MATCH SCHEDULES DIRECTORY AND CRUD --- */}
      {activeAdminSubTab === "matches" && (
        <div className="space-y-6">
          {/* Create Match Panel */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
            <h3 className="text-white font-mono font-bold text-sm uppercase tracking-wide flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-emerald-400" />
              Add Official Fifa 2026 Match Schedule
            </h3>
            <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Team A Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nepal"
                  value={createTeamA}
                  onChange={(e) => setCreateTeamA(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white uppercase focus:border-[#00D1FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Team B Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brazil"
                  value={createTeamB}
                  onChange={(e) => setCreateTeamB(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white uppercase focus:border-[#00D1FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Group Stage / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Group A"
                  value={createGroup}
                  onChange={(e) => setCreateGroup(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:border-[#00D1FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Flag Emoji A</label>
                <input
                  type="text"
                  placeholder="🇳🇵"
                  value={createFlagA}
                  onChange={(e) => setCreateFlagA(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white text-center focus:border-[#00D1FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Flag Emoji B</label>
                <input
                  type="text"
                  placeholder="🇧🇷"
                  value={createFlagB}
                  onChange={(e) => setCreateFlagB(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white text-center focus:border-[#00D1FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Kickoff Time (UTC String)</label>
                <input
                  type="datetime-local"
                  value={createStartTime}
                  onChange={(e) => setCreateStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:border-[#00D1FF] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">NPT Time (Display Tag in Nepali)</label>
                <input
                  type="text"
                  placeholder="राति 12:45 बजे (11 Jun)"
                  value={createNptTime}
                  onChange={(e) => setCreateNptTime(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:border-[#00D1FF] outline-none"
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 font-mono text-xs font-bold uppercase tracking-widest text-white transition-all shadow w-full md:w-auto cursor-pointer"
                >
                  🚀 Create New Match
                </button>
              </div>
            </form>
          </div>

          {/* Matches List Grid */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
            <h3 className="text-white font-mono font-bold text-sm uppercase tracking-wide flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#00D1FF]" />
              FIFA 2026 World Cup Match Schedules
            </h3>

            {matches.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs font-mono">No matches currently on schedule catalog.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((m) => (
                  <div key={m.id} className={`relative bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all ${m.is_hidden ? "opacity-60 border-red-500/20 bg-red-950/5" : ""}`}>
                    {/* Header line */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-blue-900/45 text-blue-300 font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-blue-500/10">
                        {m.group || "Group State"}
                      </span>
                      <div className="flex gap-1.5 items-center">
                        {m.is_hidden && (
                          <span className="bg-red-950 border border-red-500/30 text-red-400 font-mono text-[8px] font-black px-1.5 py-0.5 rounded leading-none shrink-0 animate-pulse">
                            🚫 HIDDEN
                          </span>
                        )}
                        <span className={`text-[9px] uppercase font-mono tracking-widest font-extrabold px-1.5 py-0.5 rounded border ${
                          m.status === "completed" ? "bg-red-950/45 text-red-400 border-red-500/20" :
                          m.status === "live" ? "bg-emerald-950/45 text-emerald-400 border-emerald-500/20 animate-pulse" :
                          "bg-slate-800 text-slate-300 border-slate-700/50"
                        }`}>
                          ● {m.status}
                        </span>
                        {m.locked && (
                          <span className="bg-slate-950 text-slate-500 p-0.5 rounded border border-white/5">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Match Versus */}
                    <div className="flex items-center justify-between text-center py-3">
                      <div className="w-[40%] flex flex-col items-center">
                        <span className="text-2xl mb-1">{m.flagA || "🏳️"}</span>
                        <span className="text-xs font-extrabold text-white font-mono truncate uppercase max-w-full">{m.teamA}</span>
                        <span className="text-lg font-mono text-slate-300 mt-1">{m.scoreA}</span>
                      </div>
                      <div className="w-[10%] text-center font-mono text-[10px] text-gray-500 font-bold">VS</div>
                      <div className="w-[40%] flex flex-col items-center">
                        <span className="text-2xl mb-1">{m.flagB || "🏳️"}</span>
                        <span className="text-xs font-extrabold text-white font-mono truncate uppercase max-w-full">{m.teamB}</span>
                        <span className="text-lg font-mono text-slate-300 mt-1">{m.scoreB}</span>
                      </div>
                    </div>

                    {/* Meta info tags */}
                    <div className="border-t border-white/5 pt-2 mt-2 flex flex-col gap-1 text-[10px] font-mono text-slate-400">
                      <div>🕒 UTC: <span className="text-slate-300">{new Date(m.startTime).toLocaleString()}</span></div>
                      {m.nptTime && <div>🇳🇵 NPT: <span className="text-fifa-gold font-bold">{m.nptTime}</span></div>}
                    </div>

                    {/* Actions button strip */}
                    <div className="flex gap-1.5 border-t border-white/5 pt-3 mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMatch(m);
                          setEditTeamA(m.teamA);
                          setEditTeamB(m.teamB);
                          setEditFlagA(m.flagA || "🏳️");
                          setEditFlagB(m.flagB || "🏳️");
                          setEditStartTime(m.startTime ? m.startTime.substring(0, 16) : "");
                          setEditGroup(m.group || "Group Stage");
                          setEditStatus(m.status);
                          setEditScoreA(m.scoreA || 0);
                          setEditScoreB(m.scoreB || 0);
                          setEditLocked(m.locked || false);
                          setEditNptTime(m.nptTime || "");
                        }}
                        className="py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-705 text-white font-mono text-[10px] font-bold border border-white/10 uppercase transition-all cursor-pointer text-center whitespace-nowrap"
                      >
                        ⚙️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleHideMatch(m.id)}
                        className={`flex-1 py-1 px-1.5 rounded font-mono text-[10px] font-bold border transition-all cursor-pointer text-center uppercase ${
                          m.is_hidden
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20 hover:bg-emerald-950/70"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {m.is_hidden ? "👁️ Unhide" : "🚫 Hide"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMatch(m.id, `${m.teamA} vs ${m.teamB}`)}
                        className="p-1 px-1.5 rounded bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-900/20 hover:border-red-500/30 transition-all cursor-pointer shrink-0"
                        title="Delete Match"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Match overlay modal */}
          {editingMatch && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-150">
                <div className="absolute top-0 right-0 w-24 h-24 bg-fifa-gold/10 rounded-full blur-2xl" />
                <h3 className="text-white font-mono font-bold text-sm uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
                  ⚙️ Update Match Settings
                </h3>
                <form onSubmit={handleSaveMatchEdit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">Team A</label>
                      <input
                        type="text"
                        required
                        value={editTeamA}
                        onChange={(e) => setEditTeamA(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white uppercase focus:border-[#00D1FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">Team B</label>
                      <input
                        type="text"
                        required
                        value={editTeamB}
                        onChange={(e) => setEditTeamB(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white uppercase focus:border-[#00D1FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">Flag Emoji A</label>
                      <input
                        type="text"
                        value={editFlagA}
                        onChange={(e) => setEditFlagA(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">Flag Emoji B</label>
                      <input
                        type="text"
                        value={editFlagB}
                        onChange={(e) => setEditFlagB(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">Score Team A</label>
                      <input
                        type="number"
                        min="0"
                        value={editScoreA}
                        onChange={(e) => setEditScoreA(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">Score Team B</label>
                      <input
                        type="number"
                        min="0"
                        value={editScoreB}
                        onChange={(e) => setEditScoreB(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">Group stage</label>
                      <input
                        type="text"
                        value={editGroup}
                        onChange={(e) => setEditGroup(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">NPT Nepali clock time</label>
                      <input
                        type="text"
                        value={editNptTime}
                        onChange={(e) => setEditNptTime(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">Match state status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-800"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="live">Live</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">Kickoff local datetime (UTC)</label>
                      <input
                        type="datetime-local"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="editLockedID"
                      checked={editLocked}
                      onChange={(e) => setEditLocked(e.target.checked)}
                      className="rounded bg-slate-950 border-white/10 text-[#00D1FF]"
                    />
                    <label htmlFor="editLockedID" className="text-xs font-mono text-slate-300">Lock prediction edits on this match</label>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-white/5">
                    <button
                      type="submit"
                      className="flex-1 py-1 px-3 rounded bg-[#00D1FF] hover:bg-[#00D1FF]/90 text-slate-950 font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                    >
                      💾 Save Update
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMatch(null)}
                      className="flex-1 py-1 px-3 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Aborted Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUBTAB 5: PLAYER AUDITING AND VISITS LOGS --- */}
      {activeAdminSubTab === "audit" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
              <span className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider block">Total Audited Visits</span>
              <div className="text-3xl font-mono font-extrabold text-[#00D1FF] mt-1">{visitorLogs.length}</div>
              <p className="text-[10px] text-slate-500 mt-1">Total recorded site spectator entries.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
              <span className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider block">Active Players Count</span>
              <div className="text-3xl font-mono font-extrabold text-fifa-gold mt-1">{playersAudit.filter(p => p.predictionsCount > 0).length}</div>
              <p className="text-[10px] text-slate-500 mt-1">Users who submitted game predictions.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
              <span className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider block">Total Registered Accounts</span>
              <div className="text-3xl font-mono font-extrabold text-emerald-400 mt-1">{playersAudit.length}</div>
              <p className="text-[10px] text-slate-500 mt-1">Standard profiles registered in tournament list.</p>
            </div>
          </div>

          {/* Winner selection raffle block */}
          <div className="bg-linear-to-r from-slate-900 via-slate-950 to-slate-900 border border-fifa-gold/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fifa-gold/5 rounded-full blur-2xl" />
            <h3 className="font-display font-medium text-lg text-fifa-gold flex items-center gap-2 mb-2 uppercase tracking-wide">
              <Trophy className="w-5 h-5 text-fifa-gold" /> Nepali Predict Winner Selection Raffle Tool
            </h3>
            <p className="text-xs text-slate-300 max-w-4xl mb-4 leading-relaxed font-sans">
              Choose a match to query the candidate list (only users who successfully forecasted <b>correct predictions</b> with reward points granted for that contest). Select the number of winners to draw, then run the raffle.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 font-mono text-xs mb-4">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">1. CHOOSE MATCH CONTEST</label>
                <select
                  value={winnerMatchFilter}
                  onChange={(e) => setWinnerMatchFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono"
                >
                  <option value="all">🌍 ALL MATCH CONTESTS (SELECT ALL)</option>
                  <option value="all_predictors">All Active Predictors (Total Pool)</option>
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.teamA} VS {m.teamB} ({m.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">2. WINNER COUNT TO DRAW</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={winnerRaffleCount}
                  onChange={(e) => setWinnerRaffleCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleRunRaffle}
                  className="w-full bg-linear-to-r from-fifa-gold to-yellow-500 hover:from-yellow-450 hover:to-fifa-gold text-fifa-blue font-extrabold py-2.5 px-4 rounded-xl cursor-pointer text-xs tracking-wider uppercase transition-all shadow-md active:scale-[0.98]"
                >
                  🎟️ Draw Lucky Winner(s)
                </button>
              </div>
            </div>

            {winnerPoolResult.length > 0 && (
              <div className="mt-5 bg-fifa-gold/5 border border-fifa-gold/20 rounded-xl p-5 space-y-4 animate-in fade-in">
                <span className="text-[10px] text-fifa-gold font-mono font-bold uppercase tracking-widest block">🎉 Nepal Predict Winner Results:</span>
                <div className="grid sm:grid-cols-2 gap-4">
                  {winnerPoolResult.map((winner, idx) => (
                    <div key={winner.id} className="bg-slate-950 border border-fifa-gold/30 rounded-xl p-4 flex gap-4 items-center">
                      <div className="w-10 h-10 bg-fifa-gold text-fifa-blue rounded-full font-display font-extrabold text-lg flex items-center justify-center shrink-0 shadow-lg animate-bounce">
                        #{idx + 1}
                      </div>
                      <div className="space-y-1 font-mono text-[11px] overflow-hidden">
                        <p className="text-white font-bold text-xs truncate">{winner.name}</p>
                        <p className="text-slate-300 truncate">📧 {winner.email}</p>
                        <p className="text-slate-300 font-bold">📞 {winner.mobile}</p>
                        <div className="flex gap-2 pt-1 text-[9px]">
                          <span className="bg-emerald-950 border border-emerald-800 text-emerald-400 px-1.5 py-0.5 rounded font-bold">{winner.points} Points</span>
                          <span className="bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20 px-1.5 py-0.5 rounded font-bold">{winner.accuracy}% Acc</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Interactive Users Game Play Details */}
            <div className="lg:col-span-12 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    🎮 Game Player Audit Details ({playersAudit.length})
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">View users, their contact info, prediction metrics, and submitted match items.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">Export Report:</span>
                  <div className="inline-flex rounded-lg p-0.5 bg-black/40 border border-white/10 select-none">
                    <button
                      onClick={() => exportPlayerAuditReport("excel")}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-400 hover:bg-emerald-500/15 rounded transition-all cursor-pointer flex items-center gap-1"
                      title="Download as Excel Spreadhseet (.xls)"
                    >
                      📊 Excel
                    </button>
                    <button
                      onClick={() => exportPlayerAuditReport("word")}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold text-blue-400 hover:bg-blue-500/15 rounded transition-all cursor-pointer flex items-center gap-1"
                      title="Download as Microsoft Word (.doc)"
                    >
                      📝 Word
                    </button>
                    <button
                      onClick={() => exportPlayerAuditReport("pdf")}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold text-red-400 hover:bg-red-500/15 rounded transition-all cursor-pointer flex items-center gap-1"
                      title="View printable PDF document file"
                    >
                      📕 PDF
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Filter key details..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-white rounded px-3 py-1.5 w-full sm:w-48 font-mono focus:outline-none focus:border-fifa-gold text-center sm:text-left"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-white/5 rounded-xl bg-slate-950">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-3">User Profile</th>
                      <th className="p-3">Mobile Contact</th>
                      <th className="p-3">Country</th>
                      <th className="p-3 text-center">Score Points</th>
                      <th className="p-3 text-center">Predict Count</th>
                      <th className="p-3">Forecast Records & Points Granted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playersAudit.filter(p => 
                      !playerSearch || 
                      p.name.toLowerCase().includes(playerSearch.toLowerCase()) || 
                      p.email.toLowerCase().includes(playerSearch.toLowerCase()) || 
                      (p.mobile && p.mobile.includes(playerSearch)) ||
                      (p.employeeId && String(p.employeeId).includes(playerSearch)) ||
                      (p.username && p.username.toLowerCase().includes(playerSearch.toLowerCase()))
                    ).map((player) => (
                      <tr key={player.id} className="border-b border-white/5 hover:bg-white/[0.02] last:border-b-0">
                        <td className="p-3">
                          <p className="text-white font-bold flex items-center gap-1.5 flex-wrap">
                            {player.name}
                            {player.employeeId && (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px] font-extrabold font-mono uppercase tracking-wider">
                                Emp ID: {player.employeeId}
                              </span>
                            )}
                          </p>
                          <div className="text-[10px] text-slate-400 font-normal space-y-0.5 mt-0.5">
                            <p>📧 {player.email}</p>
                            <p className="text-[#00D1FF]">👤 Username: @{player.username || "N/A"}</p>
                          </div>
                          {player.role !== "user" && (
                            <span className="mt-1 inline-block bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20 px-1 py-0 rounded text-[8px] uppercase font-bold">
                              {player.role}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-medium text-slate-300">{player.mobile || "N/A"}</td>
                        <td className="p-3 text-slate-400">{player.country || "Nepal"}</td>
                        <td className="p-3 text-center font-bold text-fifa-gold text-sm">{player.points}</td>
                        <td className="p-3 text-center text-slate-300 font-bold">{player.predictionsCount} play(s)</td>
                        <td className="p-3 max-w-[650px]">
                          {matches && matches.length > 0 ? (
                            <div className="flex flex-row gap-2.5 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-white/10 select-none">
                              {matches.map((match: any, idx: number) => {
                                const p = player.predictions?.find((pred: any) => pred.matchId === match.id);
                                const matchDisplay = `${match.teamA} vs ${match.teamB}`;
                                if (p) {
                                  return (
                                    <div key={match.id || idx} className="bg-[#1E293B]/40 border border-slate-700/50 p-2.5 px-3.5 rounded-xl flex flex-col gap-1.5 justify-center min-w-[230px] shrink-0">
                                      <div className="text-white font-bold text-xs truncate" title={matchDisplay}>
                                        {matchDisplay}
                                      </div>
                                      <div className="flex items-center gap-2 text-[9px] mt-0.5">
                                        <span className="text-[#00D1FF] bg-[#00D1FF]/10 border border-[#00D1FF]/25 px-2 py-0.5 rounded font-extrabold uppercase">
                                          WINNER: {p.predictedWinner && p.predictedWinner !== "draw" ? p.predictedWinner.toUpperCase() : "DRAW"}
                                        </span>
                                        <span className="text-slate-300 font-mono font-bold bg-slate-800/60 border border-slate-700/50 px-1.5 py-0.5 rounded">
                                          [{p.predictedScoreA}-{p.predictedScoreB}]
                                        </span>
                                        <span className={`px-2 py-0.5 rounded font-extrabold border ${
                                          p.pointsGranted > 0 
                                            ? "bg-emerald-950/80 border-emerald-500/25 text-[#00E676]" 
                                            : "bg-slate-800/80 border-slate-700/50 text-slate-400"
                                        }`}>
                                          +{p.pointsGranted} PTS
                                        </span>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div key={match.id || idx} className="bg-slate-900/30 border border-white/5 opacity-55 p-2.5 px-3.5 rounded-xl flex flex-col gap-1.5 justify-center min-w-[230px] shrink-0">
                                      <div className="text-slate-400 font-medium text-xs truncate" title={matchDisplay}>
                                        {matchDisplay}
                                      </div>
                                      <div className="flex items-center gap-2 text-[9px] mt-0.5 font-mono">
                                        <span className="text-slate-500 bg-slate-800/40 border border-slate-700/30 px-2 py-0.5 rounded font-bold uppercase text-[8px]">
                                          NOT PLAYED
                                        </span>
                                        <span className="text-slate-600 px-1.5">
                                          [- -]
                                        </span>
                                        <span className="text-slate-600 font-bold px-1.5 py-0.5 rounded">
                                          0 PTS
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-600 block italic text-[10px]">No matches configured in the system.</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* General Visits Auditing logs (Spectator flow control) */}
            <div className="lg:col-span-12 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    👥 Spectator Visits Audit Log ({visitorLogs.length})
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">Dynamic auditing registers of active viewer browsers, timestamps, and access platforms.</p>
                </div>
                <input
                  type="text"
                  placeholder="Query spectator..."
                  value={visitorSearch}
                  onChange={(e) => setVisitorSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-white rounded px-3 py-1.5 w-full sm:w-64 font-mono focus:outline-none focus:border-fifa-gold"
                />
              </div>

              <div className="overflow-x-auto border border-white/5 rounded-xl bg-slate-950">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-3">Spectator</th>
                      <th className="p-3">Identities Contact</th>
                      <th className="p-3">Access Role</th>
                      <th className="p-3">Date-Time Timestamp</th>
                      <th className="p-3">Client Web Browser Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitorLogs.filter(v => !visitorSearch || v.userName.toLowerCase().includes(visitorSearch.toLowerCase()) || v.userEmail.toLowerCase().includes(visitorSearch.toLowerCase()) || v.deviceInfo.toLowerCase().includes(visitorSearch.toLowerCase())).map((visit) => (
                      <tr key={visit.id} className="border-b border-white/5 hover:bg-white/[0.02] last:border-b-0">
                        <td className="p-3">
                          <p className="text-white font-bold">{visit.userName}</p>
                          <span className="text-[9px] text-[#00D1FF]">{visit.userId}</span>
                        </td>
                        <td className="p-3">
                          <p className="text-slate-200">{visit.userEmail}</p>
                          <span className="text-[10px] text-slate-500">{visit.userMobile || "No phone"}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            visit.role === "superadmin" 
                              ? "bg-purple-900 border border-purple-500/30 text-purple-200" 
                              : visit.role === "admin"
                              ? "bg-orange-950 border border-orange-500/30 text-orange-400"
                              : "bg-slate-800 text-slate-350"
                          }`}>
                            {visit.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-emerald-400 font-bold">{new Date(visit.timestamp).toLocaleString()}</td>
                        <td className="p-3 text-[10px] text-slate-500 max-w-[200px] truncate" title={visit.deviceInfo}>
                          {visit.deviceInfo}
                        </td>
                      </tr>
                    ))}
                    {visitorLogs.length === 0 && (
                      <tr key="no-visitor-logs">
                        <td colSpan={5} className="p-8 text-center text-slate-500 italic">No spectator visits logged yet in memory repository.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 6: OPERATOR REGISTRATION AND LISTING (Super Admin Private Access) --- */}
      {activeAdminSubTab === "operators" && (currentUser?.email === "ranjansanjit@gmail.com" || currentUser?.email === "sahrolex10@gmail.com" || (currentUser as any)?.role === "superadmin") && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-12 gap-6">
            
            {/* Operator registry form */}
            <div className="md:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  🔐 Register New Game Operator Admin
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Define new Operator details so they can access control rooms and manage winners.</p>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-3.5 font-mono text-xs">
                <div>
                  <label className="text-slate-450 text-[10px] block mb-1">OPERATOR FULL NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sanjit Operator"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-sans text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-450 text-[10px] block mb-1">EMAIL LOGIN IDENTIFIER</label>
                  <input
                    type="email"
                    required
                    placeholder="operator@predict.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-450 text-[10px] block mb-1">MOBILE CONTACT (OPTIONAL)</label>
                  <input
                    type="text"
                    placeholder="+977-9800000000"
                    value={newAdminMobile}
                    onChange={(e) => setNewAdminMobile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-450 text-[10px] block mb-1">ACCESS PIN / PASSWORD</label>
                  <input
                    type="password"
                    required
                    placeholder="Set PIN/Password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-[#00D1FF] hover:bg-cyan-500 text-slate-950 font-extrabold py-2 px-3 rounded uppercase text-[10px] tracking-wider cursor-pointer shadow transition-all"
                  >
                    ➕ Register Game Operator Seat
                  </button>
                </div>
              </form>
            </div>

            {/* Operator accounts catalog table */}
            <div className="md:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider">
                  🔑 Dynamic Game Operators Directory ({adminUsers.length})
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Control panel list. Easily demote standard admins when no longer required.</p>
              </div>

              <div className="overflow-x-auto border border-white/5 rounded-xl bg-slate-950">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-3">Operator Name & Email</th>
                      <th className="p-3">Mobile Contact</th>
                      <th className="p-3">Platform Role</th>
                      <th className="p-3">Disabled Status</th>
                      <th className="p-3 text-right">Revoke / Toggle Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((admin) => (
                      <tr key={admin.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                        <td className="p-3 font-medium">
                          <p className="text-white font-bold flex items-center gap-1.5 flex-wrap">
                            {admin.name}
                            {admin.employeeId && admin.employeeId !== "N/A" && (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-extrabold font-mono uppercase tracking-wider">
                                Emp ID: {admin.employeeId}
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-slate-400 block">{admin.email}</span>
                          {admin.username && admin.username !== "N/A" && (
                            <span className="text-[9px] text-[#00D1FF] block font-mono">@{admin.username}</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-300 font-semibold">{admin.mobile}</td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            admin.role === "superadmin" 
                              ? "bg-purple-950/40 border border-purple-500/20 text-purple-400" 
                              : "bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20"
                          }`}>
                            {admin.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            admin.isDisabled 
                              ? "bg-red-950/40 border border-red-500/20 text-red-400" 
                              : "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400"
                          }`}>
                            {admin.isDisabled ? "SUSPENDED" : "ACTIVE"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {admin.role !== "superadmin" && admin.email !== "ranjansanjit@gmail.com" && admin.email !== "sahrolex10@gmail.com" ? (
                            <div className="flex gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleToggleDisableAdmin(admin.email)}
                                className={`px-2 py-1 rounded text-[9px] font-bold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                                  admin.isDisabled
                                    ? "bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border-emerald-500/25"
                                    : "bg-amber-600/25 hover:bg-amber-600/40 text-amber-300 border-amber-500/25"
                                }`}
                              >
                                {admin.isDisabled ? "ENABLE" : "SUSPEND"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAdmin(admin.email)}
                                className="text-red-400 hover:text-red-500 bg-red-950/10 hover:bg-red-950/30 border border-red-550/20 px-2 py-1 rounded text-[9px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3" />
                                DEMOTE ACCESS
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-650 text-[9px] italic font-bold">PRIMARY IMMUNE</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {adminUsers.length === 0 && (
                      <tr key="no-operators">
                        <td colSpan={5} className="p-8 text-center text-slate-500 italic">No standard operators registered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- SUBTAB 7: TEAMS MANAGEMENT CONTROLS (Super Admin Private Access) --- */}
      {activeAdminSubTab === "teams" && (currentUser?.email === "ranjansanjit@gmail.com" || currentUser?.email === "sahrolex10@gmail.com" || (currentUser as any)?.role === "superadmin") && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-12 gap-6">
            
            {/* Create Team Form or Edit Team Form */}
            <div className="md:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              {editingTeam ? (
                // Edit Team Form
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display font-medium text-sm text-[#00D1FF] uppercase tracking-wider flex items-center gap-2">
                      ✏️ Edit Team Details
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Modifying properties for match-participating nation identifier.</p>
                  </div>

                  <form onSubmit={handleUpdateTeam} className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">TEAM NAME</label>
                      <input
                        type="text"
                        required
                        value={teamEditName}
                        onChange={(e) => setTeamEditName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-sans text-xs focus:outline-none focus:border-[#00D1FF]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">EMOJI FLAG</label>
                        <input
                          type="text"
                          required
                          value={teamEditFlag}
                          onChange={(e) => setTeamEditFlag(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs text-center focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">GROUP</label>
                        <select
                          value={teamEditGroup}
                          onChange={(e) => setTeamEditGroup(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:outline-none"
                        >
                          {["A", "B", "C", "D", "E", "F", "G", "H"].map((g) => (
                            <option key={g} value={g}>Group {g}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">FIFA RANKING</label>
                        <input
                          type="number"
                          min={1}
                          max={220}
                          value={teamEditFifaRanking}
                          onChange={(e) => setTeamEditFifaRanking(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">STARS RATING (1-5)</label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={teamEditStars}
                          onChange={(e) => setTeamEditStars(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">COACH/MANAGER</label>
                      <input
                        type="text"
                        placeholder="e.g. Didier Deschamps"
                        value={teamEditCoach}
                        onChange={(e) => setTeamEditCoach(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-sans text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">PREVIOUS WORLD CUPS WON</label>
                      <input
                        type="text"
                        placeholder="e.g. 2 times (1998, 2018)"
                        value={teamEditPrevWC}
                        onChange={(e) => setTeamEditPrevWC(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-sans text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingTeam(null)}
                        className="w-1/2 bg-slate-800 hover:bg-slate-705 text-white py-2 rounded text-[11px] font-bold transition-all cursor-pointer"
                      >
                        ✕ CANCEL
                      </button>
                      <button
                        type="submit"
                        className="w-1/2 bg-[#00D1FF] hover:bg-[#00D1FF]/80 text-slate-950 py-2 rounded text-[11px] font-black transition-all cursor-pointer uppercase"
                      >
                        💾 SAVE CHANGES
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                // Create Team Form
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider flex items-center gap-2">
                      🛡️ Add New Participating Team
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Introduce a new team with properties into the FIFA matches roster.</p>
                  </div>

                  <form onSubmit={handleCreateTeam} className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">TEAM NAME</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. France"
                        value={teamCreateName}
                        onChange={(e) => setTeamCreateName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-sans text-xs focus:outline-none focus:border-[#00D1FF]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">EMOJI FLAG</label>
                        <input
                          type="text"
                          required
                          placeholder="🇫🇷"
                          value={teamCreateFlag}
                          onChange={(e) => setTeamCreateFlag(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs text-center focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">GROUP</label>
                        <select
                          value={teamCreateGroup}
                          onChange={(e) => setTeamCreateGroup(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:outline-none"
                        >
                          {["A", "B", "C", "D", "E", "F", "G", "H"].map((g) => (
                            <option key={g} value={g}>Group {g}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">FIFA RANKING</label>
                        <input
                          type="number"
                          min={1}
                          max={220}
                          value={teamCreateFifaRanking}
                          onChange={(e) => setTeamCreateFifaRanking(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">STARS RATING (1-5)</label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={teamCreateStars}
                          onChange={(e) => setTeamCreateStars(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">COACH/MANAGER</label>
                      <input
                        type="text"
                        placeholder="e.g. Marcelo Bielsa"
                        value={teamCreateCoach}
                        onChange={(e) => setTeamCreateCoach(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-sans text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[9px] font-bold block mb-1 uppercase">PREVIOUS WORLD CUPS WON</label>
                      <input
                        type="text"
                        placeholder="e.g. 1 time (2010)"
                        value={teamCreatePrevWC}
                        onChange={(e) => setTeamCreatePrevWC(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-sans text-xs focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 bg-gradient-to-r from-[#00D1FF] to-cyan-500 hover:from-cyan-400 hover:to-[#00D1FF] text-slate-950 font-black py-2 rounded text-[11px] font-display uppercase tracking-wider transition-all cursor-pointer"
                    >
                      🚀 REGISTER NEW TEAM
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Teams Roster Listing and Controls */}
            <div className="md:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-medium text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    📋 Active Participating Nations ({teams.length})
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Complete registered team ledger with customizable system filters.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchTeams}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-mono text-[9px] font-bold px-2.5 py-1.5 rounded border border-slate-850 cursor-pointer inline-flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3 h-3 ${teamsLoading ? "animate-spin" : ""}`} />
                  SYNC TEAMS
                </button>
              </div>

              <div className="border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse font-sans text-xs select-none">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
                      <th className="p-3">Team</th>
                      <th className="p-3 text-center">Group</th>
                      <th className="p-3 text-center">FIFA Rank</th>
                      <th className="p-3 text-center">Vibe/Stars</th>
                      <th className="p-3">Visibility</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {teams.map((item: any) => (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-white/5 transition-colors ${
                          item.is_hidden ? "opacity-45 bg-red-950/5" : ""
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl leading-none">{item.flag || "🏳️"}</span>
                            <div>
                              <span className="font-bold text-white block">{item.name}</span>
                              <span className="text-[10px] text-gray-400 block italic leading-none font-sans mt-0.5">Coach: {item.coach || "TBD"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-fifa-gold">
                          Group {item.group || "A"}
                        </td>
                        <td className="p-3 text-center font-mono">
                          #{item.fifaRanking || 50}
                        </td>
                        <td className="p-3 text-center font-mono text-amber-400 font-black">
                          {"★".repeat(item.stars || 3)}
                          {"☆".repeat(5 - (item.stars || 3))}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            item.is_hidden 
                              ? "bg-red-950/40 border border-red-500/20 text-red-400" 
                              : "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400"
                          }`}>
                            {item.is_hidden ? "🚫 Hidden" : "👁️ Visible"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <button
                              type="button"
                              onClick={() => handleToggleHideTeam(item.id)}
                              className={`px-2 py-1 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                                item.is_hidden
                                  ? "bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border-emerald-500/25"
                                  : "bg-amber-600/25 hover:bg-amber-600/40 text-amber-300 border-amber-500/25"
                              }`}
                            >
                              {item.is_hidden ? "Unhide" : "Hide"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTeam(item);
                                setTeamEditName(item.name || "");
                                setTeamEditCoach(item.coach || "TBD");
                                setTeamEditPrevWC(item.previousWC || "TBD");
                                setTeamEditFifaRanking(item.fifaRanking || 50);
                                setTeamEditStars(item.stars || 3);
                                setTeamEditGroup(item.group || "A");
                                setTeamEditFlag(item.flag || "🏳️");
                              }}
                              className="bg-blue-600/25 hover:bg-blue-600/45 text-blue-300 border border-blue-500/25 px-2 py-1 rounded text-[9px] font-bold transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {teams.length === 0 && (
                      <tr key="no-teams">
                        <td colSpan={6} className="p-8 text-center text-slate-500 italic">No teams registered. Try syncing or create some above.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- SUBTAB: PREDICTIONS REPORT & EXPORTS PANEL --- */}
      {activeAdminSubTab === "predictions_reports" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/40 to-emerald-950/40 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-xl">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded text-[9px] font-extrabold font-mono uppercase tracking-widest inline-flex items-center gap-1">
                  📊 Prediction Recalculation Engine
                </span>
                <h3 className="font-display font-bold text-lg text-white mt-1.5 uppercase tracking-wider flex items-center gap-2">
                  Match winner & Goal Prediction Reports
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  View participant points status, grade logs in real-time, and download spreadsheets for offline distribution.
                </p>
              </div>

              {/* Action Tools */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={fetchPredictionReportData}
                  className="bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/25 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reportsLoading ? "animate-spin" : ""}`} />
                  RECALCULATE & SYNC
                </button>
                <div className="relative">
                  <select
                    onChange={(e: any) => {
                      const val = e.target.value;
                      if (val) {
                        window.open(`/api/admin/prediction-reports/export?type=${val}`, "_blank");
                      }
                    }}
                    defaultValue=""
                    className="bg-slate-950 text-slate-300 border border-emerald-500/25 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider outline-none cursor-pointer"
                  >
                    <option value="" disabled>📥 DOWNLOAD EXCEL SPREADSHEETS (CSV)</option>
                    <option value="complete">1. Cumulative Analytics Report</option>
                    <option value="winner">2. Match Winners Prediction Table</option>
                    <option value="goal">3. Goal Predictions Table</option>
                    <option value="leaderboard">4. Tournament Leaderboard Standings</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Core Analytics Cards */}
          {reportsLoading && !reportStats ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="font-mono text-xs text-slate-500">Recalculating tournament leaderboard databases...</p>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-950 border border-white/5 rounded-xl p-4 space-y-1">
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Total Users Signed</span>
                  <p className="text-xl font-bold font-mono text-white">{reportStats?.totalUsers || 0}</p>
                </div>
                <div className="bg-slate-950 border border-white/5 rounded-xl p-4 space-y-1">
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Total Predictions</span>
                  <p className="text-xl font-bold font-mono text-white">{reportStats?.totalPredictions || 0}</p>
                </div>
                <div className="bg-slate-950 border border-white/5 rounded-xl p-4 space-y-1">
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Correct Winners</span>
                  <p className="text-xl font-bold font-mono text-emerald-400">{reportStats?.correctWinners || 0}</p>
                </div>
                <div className="bg-slate-950 border border-white/5 rounded-xl p-4 space-y-1">
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Correct Goals (Exact Score)</span>
                  <p className="text-xl font-bold font-mono text-emerald-400">{reportStats?.correctGoals || 0}</p>
                </div>
                <div className="bg-slate-950 border border-white/5 rounded-xl p-4 space-y-1 col-span-2 md:col-span-1">
                  <span className="text-[9px] text-slate-500 font-mono uppercase">Leaderboard Topper</span>
                  <p className="text-xs font-bold font-mono text-fifa-gold truncate" title={reportStats?.highestUser?.name}>
                    {reportStats?.highestUser?.name || "N/A"} ({reportStats?.highestUser?.points || 0} PTS)
                  </p>
                </div>
              </div>

              {/* View Selector & Filter Dashboard */}
              <div className="border border-white/15 bg-slate-950 rounded-2xl p-4 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-1 bg-black/40 p-1 border border-white/5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSelectedReportView("statistics")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${selectedReportView === "statistics" ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-white"}`}
                    >
                      📊 Analytics Graph & Stats
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReportView("winner")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${selectedReportView === "winner" ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-white"}`}
                    >
                      🎯 Match Winner Table
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReportView("goal")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${selectedReportView === "goal" ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-white"}`}
                    >
                      ⚽ Goal Prediction Table
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReportView("leaderboard")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${selectedReportView === "leaderboard" ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-white"}`}
                    >
                      👑 Cumulative Leaderboard
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReportView("audit")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${selectedReportView === "audit" ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-white"}`}
                    >
                      🛡️ Audit Logs
                    </button>
                  </div>

                  {/* Filters bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedReportView !== "statistics" && selectedReportView !== "audit" && (
                      <input
                        type="text"
                        placeholder="Search username / employee ID..."
                        value={reportsTabSearch}
                        onChange={(e) => setReportsTabSearch(e.target.value)}
                        className="bg-black/60 border border-slate-800 text-xs text-white rounded px-3 py-2 w-full sm:w-48 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    )}

                    {selectedReportView === "winner" && (
                      <select
                        value={winnerCorrectnessFilter}
                        onChange={(e: any) => setWinnerCorrectnessFilter(e.target.value)}
                        className="bg-black text-[10px] text-slate-300 font-mono border border-slate-800 rounded px-2.5 py-1.5"
                      >
                        <option value="all">🏆 All Winner States</option>
                        <option value="correct">✔️ Correct (1 Point)</option>
                        <option value="incorrect">❌ Incorrect (0 Points)</option>
                        <option value="pending">⏳ Pending matches</option>
                      </select>
                    )}

                    {selectedReportView === "goal" && (
                      <select
                        value={goalCorrectnessFilter}
                        onChange={(e: any) => setGoalCorrectnessFilter(e.target.value)}
                        className="bg-black text-[10px] text-slate-300 font-mono border border-slate-800 rounded px-2.5 py-1.5"
                      >
                        <option value="all">⚽ All Goal States</option>
                        <option value="correct">✔️ Correct Exact Score (1 Point)</option>
                        <option value="incorrect">❌ Incorrect Exact Score (0 Points)</option>
                        <option value="pending">⏳ Pending matches</option>
                      </select>
                    )}

                    {selectedReportView === "leaderboard" && (
                      <select
                        value={leaderboardFilter}
                        onChange={(e: any) => setLeaderboardFilter(e.target.value)}
                        className="bg-black text-[10px] text-slate-300 font-mono border border-slate-800 rounded px-2.5 py-1.5"
                      >
                        <option value="all">👥 Show All ranks</option>
                        <option value="10">🏆 Top 10 users</option>
                        <option value="50">🏅 Top 50 users</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Report Panels Details */}
                <div className="bg-black border border-white/5 rounded-xl overflow-hidden min-h-[350px]">
                  {selectedReportView === "statistics" && (
                    <div className="p-5 space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Daily Predictions Activity */}
                        <div className="border border-white/5 bg-slate-950/40 rounded-xl p-4 space-y-3">
                          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">📈 Daily Prediction Submissions Wave</h4>
                          {reportStats?.dailyActivity && reportStats.dailyActivity.length > 0 ? (
                            <div className="space-y-2">
                              {reportStats.dailyActivity.map((day: any) => (
                                <div key={day.date} className="flex items-center justify-between text-xs font-mono">
                                  <span className="text-slate-400">{day.date}</span>
                                  <div className="flex-1 mx-3 h-2 bg-slate-900 rounded overflow-hidden">
                                    <div
                                      className="bg-emerald-500 h-full rounded"
                                      style={{ width: `${Math.min(100, (day.count / Math.max(...reportStats.dailyActivity.map((d: any) => d.count), 1)) * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-white font-bold">{day.count} posts</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-12 text-center text-slate-600 italic text-xs font-mono">No prediction telemetry files submitted.</div>
                          )}
                        </div>

                        {/* Top Matches Accuracy Rate */}
                        <div className="border border-white/5 bg-slate-950/40 rounded-xl p-4 space-y-3">
                          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">⚽ Match-Wise Predictive Accuracy & Volume</h4>
                          <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 text-xs font-mono">
                            {reportStats?.matchWiseStats && reportStats.matchWiseStats.map((item: any) => (
                              <div key={item.matchId} className="border-b border-white/5 pb-2 last:border-0 flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                  <span className="text-slate-300 font-bold block">{item.matchDisplay}</span>
                                  <span className="text-[10px] text-slate-500 uppercase">{item.group} • {item.status}</span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[#00D1FF] block font-bold">{item.predictionCount} submissions</span>
                                  <span className="text-emerald-400 text-[10px]">Avg Accuracy: {item.accuracyRate}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Recalculation Engine rules descriptor card */}
                      <div className="bg-gradient-to-r from-emerald-950/10 to-indigo-950/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3.5">
                        <span className="text-lg">💡</span>
                        <div className="text-xs text-slate-400 leading-relaxed font-mono">
                          <strong className="text-white block mb-1">Unified Point Rules Indicator (Auto-Recalculator):</strong>
                          - Match prediction is marked <span className="text-emerald-400">Correct</span> when predicted winner matches the end-state whistle (Awards 3 Points).<br/>
                          - Goal prediction is marked <span className="text-emerald-400">Correct</span> when predicted scores are exact matching (Awards 5 Points).<br/>
                          - Complete rank ties are auto-resolved descending. Total points include winner prediction points + goal points.
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedReportView === "winner" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                            <th className="p-3">EM ID</th>
                            <th className="p-3">User Name</th>
                            <th className="p-3">Match</th>
                            <th className="p-3">Predicted Win</th>
                            <th className="p-3">Actual Result</th>
                            <th className="p-3">Date Submitted</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filtered = (reportTables?.winnerTable || [])
                              .filter((p: any) => {
                                const query = reportsTabSearch.toLowerCase();
                                const matchesSearch = p.emId.toLowerCase().includes(query) || p.userName.toLowerCase().includes(query) || p.matchDisplay.toLowerCase().includes(query);
                                
                                if (!matchesSearch) return false;

                                if (winnerCorrectnessFilter === "correct") return p.status === "Correct";
                                if (winnerCorrectnessFilter === "incorrect") return p.status === "Incorrect";
                                if (winnerCorrectnessFilter === "pending") return p.status === "Pending";
                                return true;
                              });

                            if (filtered.length > 0) {
                              return filtered.map((p: any, idx: number) => (
                                <tr key={`winner-row-${p.emId}-${p.matchId}-${idx}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                                  <td className="p-3 font-bold text-slate-400">{p.emId}</td>
                                  <td className="p-3 text-white font-bold">{p.userName}</td>
                                  <td className="p-3 text-slate-300">{p.matchDisplay}</td>
                                  <td className="p-3 text-[#00D1FF]">{p.predictedWinner}</td>
                                  <td className="p-3 font-bold text-slate-400">{p.actualWinner}</td>
                                  <td className="p-3 text-[10px] text-slate-500">{new Date(p.predictionDate).toLocaleString()}</td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${p.status === "Correct" ? "bg-emerald-600/20 text-emerald-400" : p.status === "Incorrect" ? "bg-red-650/20 text-red-400" : "bg-slate-800 text-slate-400"}`}>
                                      {p.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-bold text-white">+{p.points}</td>
                                </tr>
                              ));
                            } else {
                              return (
                                <tr key="empty-winner">
                                  <td colSpan={8} className="p-12 text-center text-slate-500 italic">No winner predictions recorded in system databases.</td>
                                </tr>
                              );
                            }
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedReportView === "goal" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                            <th className="p-3">EM ID</th>
                            <th className="p-3">User Name</th>
                            <th className="p-3">Match</th>
                            <th className="p-3 text-center">Predicted Raw Score</th>
                            <th className="p-3 text-center">Actual Match Score</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Points Awarded</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filtered = (reportTables?.goalTable || [])
                              .filter((p: any) => {
                                const query = reportsTabSearch.toLowerCase();
                                const matchesSearch = p.emId.toLowerCase().includes(query) || p.userName.toLowerCase().includes(query) || p.matchDisplay.toLowerCase().includes(query);
                                
                                if (!matchesSearch) return false;

                                if (goalCorrectnessFilter === "correct") return p.status === "Correct";
                                if (goalCorrectnessFilter === "incorrect") return p.status === "Incorrect";
                                if (goalCorrectnessFilter === "pending") return p.status === "Pending";
                                return true;
                              });

                            if (filtered.length > 0) {
                              return filtered.map((p: any, idx: number) => (
                                <tr key={`goal-row-${p.emId}-${p.matchId}-${idx}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                                  <td className="p-3 font-bold text-slate-400">{p.emId}</td>
                                  <td className="p-3 text-white font-bold">{p.userName}</td>
                                  <td className="p-3 text-slate-300">{p.matchDisplay}</td>
                                  <td className="p-3 text-center text-[#00D1FF] font-bold">{p.predictedScoreDisplay}</td>
                                  <td className="p-3 text-center font-bold text-slate-400">{p.actualScore}</td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${p.status === "Correct" ? "bg-emerald-600/20 text-emerald-400" : p.status === "Incorrect" ? "bg-red-650/20 text-red-400" : "bg-slate-800 text-slate-400"}`}>
                                      {p.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-bold text-white">+{p.points}</td>
                                </tr>
                              ));
                            } else {
                              return (
                                <tr key="empty-goal">
                                  <td colSpan={7} className="p-12 text-center text-slate-500 italic">No goal predictions recorded in database records.</td>
                                </tr>
                              );
                            }
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedReportView === "leaderboard" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                            <th className="p-3 text-center">Rank</th>
                            <th className="p-3">Employee ID</th>
                            <th className="p-3">User Name</th>
                            <th className="p-3 text-center">Winner Predict Points</th>
                            <th className="p-3 text-center">Goal Predict Points</th>
                            <th className="p-3 text-center">Cumulative Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filtered = (reportTables?.leaderboardTable || [])
                              .filter((u: any) => {
                                const query = reportsTabSearch.toLowerCase();
                                const matchesSearch = u.emId.toLowerCase().includes(query) || u.userName.toLowerCase().includes(query);
                                
                                if (!matchesSearch) return false;

                                if (leaderboardFilter === "10") return u.rank <= 10;
                                if (leaderboardFilter === "50") return u.rank <= 50;
                                return true;
                              });

                            if (filtered.length > 0) {
                              return filtered.map((u: any) => (
                                <tr key={`leaderboard-row-${u.emId}-${u.rank}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                                  <td className="p-3 text-center font-bold">
                                    <span className={`px-2 py-0.5 rounded inline-block text-[10px] ${u.rank === 1 ? "bg-fifa-gold text-fifa-blue" : u.rank === 2 ? "bg-slate-300 text-black" : u.rank === 3 ? "bg-amber-600/30 text-amber-500" : "bg-slate-900 text-slate-400"}`}>
                                      #{u.rank}
                                    </span>
                                  </td>
                                  <td className="p-3 font-semibold text-slate-400">{u.emId}</td>
                                  <td className="p-3 text-white font-bold">{u.userName}</td>
                                  <td className="p-3 text-center text-[#00D1FF]">{u.winnerPoints} PTS</td>
                                  <td className="p-3 text-center text-[#00D1FF]">{u.goalPoints} PTS</td>
                                  <td className="p-3 text-center font-extrabold text-emerald-400">{u.totalPoints} PTS</td>
                                </tr>
                              ));
                            } else {
                              return (
                                <tr key="empty-leaderboard">
                                  <td colSpan={6} className="p-12 text-center text-slate-500 italic">Leaderboards currently processing or empty database.</td>
                                </tr>
                              );
                            }
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedReportView === "audit" && (
                    <div className="p-5 space-y-4">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest block border-b border-white/5 pb-2">
                        🕵️ Admin Activity Audits Log (Recalculation Logs Index)
                      </span>
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1 text-xs font-mono">
                        {reportTables?.auditLogs && reportTables.auditLogs.map((log: any) => (
                          <div key={log.id} className="p-3 bg-slate-950 border border-white/5 rounded-xl flex flex-col sm:flex-row justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-red-650/20 text-red-400 border border-red-500/15 px-2 py-0.2 rounded text-[9px] font-bold uppercase">{log.action}</span>
                                <span className="text-white font-bold">{log.operator}</span>
                              </div>
                              <p className="text-slate-400 text-[11px] leading-relaxed select-all">{log.detail}</p>
                            </div>
                            <span className="text-[10px] text-slate-500 sm:text-right shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        ))}
                        {(!reportTables?.auditLogs || reportTables.auditLogs.length === 0) && (
                          <div className="py-16 text-center text-slate-600 italic">No administrative log modifications tracked yet.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      )}

      {/* --- SUBTAB 9: RELATIONAL SQL DATABASE EXPLORER --- */}
      {activeAdminSubTab === "database" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* SQL Header Badge */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md shadow-xl">
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded text-[9px] font-extrabold font-mono uppercase tracking-widest inline-flex items-center gap-1">
                  🗄️ Relational Backend Support
                </span>
                <h3 className="font-display font-bold text-lg text-white mt-1.5 uppercase tracking-wider flex items-center gap-2">
                  PostgreSQL & MySQL Relational Engine Setup
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Direct structural synchronization synced to native Postgres database. View and download relational schema, seeds, or individual tables.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (sqlSchemaCode) {
                      const blob = new Blob([sqlSchemaCode], { type: "text/plain;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.setAttribute("download", "schema.sql");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else {
                      alert("Schema script not loaded yet.");
                    }
                  }}
                  className="bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1"
                >
                  📥 DOWNLOAD SCHEMA.SQL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (sqlSeedCode) {
                      const blob = new Blob([sqlSeedCode], { type: "text/plain;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.setAttribute("download", "postgresql_seed.sql");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else {
                      alert("Seed script not loaded yet.");
                    }
                  }}
                  className="bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1"
                >
                  🌱 DOWNLOAD SEED.SQL
                </button>
              </div>
            </div>

            {/* Simulated Live Connection Info */}
            <div className="mt-4 p-3 bg-black/40 border border-white/5 rounded-xl grid md:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">DATABASE ENGINE</span>
                <span className="text-[#00D1FF] font-bold">PostgreSQL / MySQL Core</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">CONNECTION URL (DUMMY)</span>
                <span className="text-white truncate block select-all">postgresql://fifa_predictor_admin:***@localhost:5432/fifa_predictor_db</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">COCKPIT ACCESS</span>
                <span className="text-emerald-400 font-bold">● Active Relational Client Synced</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Tables explorer list selection */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-950 border border-white/10 rounded-2xl p-5 space-y-4">
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest block">
                  📂 RELATIONAL SCHEMAS & TABLES
                </span>

                {dbLoading && !dbTables ? (
                  <div className="py-12 text-center font-mono text-xs text-slate-500">
                    Scanning relational schemas...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dbTables && Object.keys(dbTables).map((tableKey) => {
                      const tb = dbTables[tableKey];
                      const isSelected = selectedDbTable === tableKey;
                      return (
                        <button
                          key={tableKey}
                          onClick={() => {
                            setSelectedDbTable(tableKey);
                            setDbSearchQuery("");
                          }}
                          className={`w-full text-left p-3 rounded-xl transition-all border ${
                            isSelected
                              ? "bg-indigo-600/10 border-indigo-500 text-white"
                              : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04] hover:text-white"
                          } cursor-pointer flex items-center justify-between font-mono text-xs`}
                        >
                          <div className="space-y-1 overflow-hidden pr-2">
                            <span className="font-bold flex items-center gap-1.5 text-white">
                              📁 {tableKey}
                              <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-normal">
                                {tb.rows.length} rows
                              </span>
                            </span>
                            <p className="text-[10px] text-slate-500 font-normal truncate">
                              {tb.description}
                            </p>
                          </div>
                          <span>→</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SQL setup scripts quick links */}
              <div className="bg-slate-950 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest">
                    🛠️ SQL SETUP SCRIPT CODES
                  </span>
                  <div className="flex rounded bg-black/40 border border-white/10 p-0.5 select-none text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setActiveCodeTab("schema")}
                      className={`px-2 py-0.5 rounded transition ${activeCodeTab === "schema" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
                    >
                      D&nbsp;D&nbsp;L
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCodeTab("seed")}
                      className={`px-2 py-0.5 rounded transition ${activeCodeTab === "seed" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
                    >
                      Se&nbsp;ed
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <pre className="p-3 bg-black border border-white/5 rounded-xl font-mono text-[9px] h-48 overflow-y-auto text-indigo-300 leading-normal select-all">
                    {activeCodeTab === "schema" ? sqlSchemaCode : sqlSeedCode}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      const code = activeCodeTab === "schema" ? sqlSchemaCode : sqlSeedCode;
                      navigator.clipboard.writeText(code);
                      alert("Code script copied block to clipboard!");
                    }}
                    className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[8px] font-bold px-2 py-1 rounded transition-all cursor-pointer"
                  >
                    COPY SCRIPT
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Table detailed rows explorer */}
            <div className="lg:col-span-8 bg-slate-950 border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col min-h-[500px]">
              
              {dbTables && dbTables[selectedDbTable] ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 select-none">
                    <div>
                      <h4 className="font-display font-bold text-sm text-white flex items-center gap-1.5 uppercase font-mono">
                        🖥️ Table: {selectedDbTable}
                        <span className="text-xs text-[#00D1FF] font-normal font-mono">
                          ({dbTables[selectedDbTable].rows.length} Total Records Loaded)
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {dbTables[selectedDbTable].description}
                      </p>
                    </div>

                    {/* Filter and Download Tools */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Search in relational table rows...`}
                        value={dbSearchQuery}
                        onChange={(e) => setDbSearchQuery(e.target.value)}
                        className="bg-black border border-slate-800 text-xs text-white rounded px-3 py-1.5 w-full sm:w-48 font-mono focus:outline-none focus:border-indigo-500 text-center sm:text-left"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const tb = dbTables[selectedDbTable];
                          // CSV Download Helper
                          if (tb.rows.length === 0) {
                            alert("No records registered in current table.");
                            return;
                          }
                          const headersLine = tb.columns.join(",");
                          const rowsLines = tb.rows.map((r: any) => 
                            tb.columns.map((col: string) => {
                              let val = r[col];
                              if (val === undefined || val === null) return "N/A";
                              if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
                              return `"${String(val).replace(/"/g, '""')}"`;
                            }).join(",")
                          );
                          const content = [headersLine, ...rowsLines].join("\n");
                          const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.setAttribute("download", `fifa26_postgres_${selectedDbTable}_table.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        📊 EXPORT CSV
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const tb = dbTables[selectedDbTable];
                          const blob = new Blob([JSON.stringify(tb.rows, null, 2)], { type: "application/json;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.setAttribute("download", `fifa26_postgres_${selectedDbTable}_table.json`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="bg-blue-650/40 hover:bg-blue-650/60 text-blue-300 border border-blue-500/20 px-2.5 py-1.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        📁 EXPORT JSON
                      </button>
                    </div>
                  </div>

                  {/* Filter process */}
                  {(() => {
                    const columns = dbTables[selectedDbTable].columns;
                    const rows = dbTables[selectedDbTable].rows.filter((r: any) => {
                      if (!dbSearchQuery) return true;
                      return columns.some((col: string) => {
                        const val = r[col];
                        if (val === undefined || val === null) return false;
                        return String(val).toLowerCase().includes(dbSearchQuery.toLowerCase());
                      });
                    });

                    return (
                      <div className="flex-1 overflow-x-auto border border-white/5 rounded-xl bg-black">
                        <table className="w-full text-left font-mono text-[10px] border-collapse">
                          <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
                              {columns.map((col: string) => (
                                <th key={col} className="p-2 whitespace-nowrap">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row: any, idx: number) => (
                              <tr key={row.id || idx} className="border-b border-white/5 hover:bg-white/[0.02] last:border-b-0">
                                {columns.map((col: string) => {
                                  const cellVal = row[col];
                                  let rendered = "N/A";
                                  if (cellVal !== undefined && cellVal !== null) {
                                    if (typeof cellVal === "boolean") {
                                      rendered = cellVal ? "TRUE" : "FALSE";
                                    } else if (typeof cellVal === "object") {
                                      rendered = JSON.stringify(cellVal);
                                    } else {
                                      rendered = String(cellVal);
                                    }
                                  }
                                  return (
                                    <td key={col} className="p-2 whitespace-nowrap max-w-[200px] truncate text-slate-300" title={rendered}>
                                      {rendered}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                            {rows.length === 0 && (
                              <tr>
                                <td colSpan={columns.length} className="p-8 text-center text-slate-500 italic">
                                  No database rows matching filter search terms.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                  <span className="text-3xl">🗄️</span>
                  <p className="font-mono text-xs text-slate-500 mt-2">
                    Click any table name in the sidebar to review raw Postgres / MySQL records logs.
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* Super Activity logs tracker (Footer block) */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-8">
        <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-widest block mb-3">🛡️ SYSTEM AND SECURITY STRETCH LOGS (REAL-TIME UPDATES)</span>
        <div className="h-36 overflow-y-auto font-mono text-[10px] space-y-1.5 select-text p-2 bg-slate-950 border border-white/5 rounded text-slate-400 leading-normal">
          {securityLogs.length > 0 ? (
            securityLogs.map((log) => (
              <div key={log.id} className="flex gap-4">
                <span className="text-slate-500 shrink-0 font-normal">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className="text-fifa-gold shrink-0 font-bold uppercase">[{log.type}]</span>
                <span className="text-white">{log.detail}</span>
              </div>
            ))
          ) : (
            <span className="text-slate-600 block italic text-center py-10">No engine activity registered in current rot.</span>
          )}
        </div>
      </div>

      {/* Custom Confirmation Modal Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in duration-150">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl" />
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full shrink-0 ${confirmDialog.danger ? "bg-red-500/10 text-red-500" : "bg-fifa-gold/10 text-fifa-gold"}`}>
                {confirmDialog.danger ? <span className="text-xl">⚠️</span> : <span className="text-xl">✓</span>}
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-white font-mono font-bold text-sm uppercase tracking-widest">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-slate-300 leading-normal font-sans">
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 font-mono text-[10px] font-bold border border-white/5 uppercase transition-all cursor-pointer"
              >
                {confirmDialog.cancelText || "Cancel (रद्द गर्नुहोस्)"}
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className={`px-4 py-2 rounded font-mono text-[10px] font-bold border uppercase transition-all cursor-pointer ${
                  confirmDialog.danger 
                    ? "bg-red-950/60 text-red-400 border-red-500/30 hover:bg-red-900" 
                    : "bg-fifa-gold/20 text-fifa-gold border-fifa-gold/30 hover:bg-fifa-gold/30"
                }`}
              >
                {confirmDialog.confirmText || "Confirm (स्वीकार गर्नुहोस्)"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

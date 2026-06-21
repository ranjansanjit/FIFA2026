import React, { useState, useEffect } from "react";
import { UserProfile, Match, Prediction, DishHomeQuestion, LiveQuestion, Team } from "./types";
import { StadiumLights } from "./components/StadiumLights";
import { LandingHero } from "./components/LandingHero";
import { UserDashboard } from "./components/UserDashboard";
import { MatchPredictionModule } from "./components/MatchPredictionModule";
import { LiveScoreTimeline } from "./components/LiveScoreTimeline";
import { FifaTeamDatabase } from "./components/FifaTeamDatabase";
import { SuperAdminPanel } from "./components/SuperAdminPanel";
import { DishHomeLogo } from "./components/DishHomeLogo";
import { TournamentWinners } from "./components/TournamentWinners";
import { 
  Trophy, User, LogIn, Award, Heart, Sun, Moon, 
  ChevronRight, Languages, AlertCircle, RefreshCw, BarChart2, ShieldCheck, Mail,
  Chrome, Tv, CheckCircle
} from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

export default function App() {
  // Theme and language
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [language, setLanguage] = useState<"EN" | "NP" | "HI">("EN");

  // Core App states
  const [activeMainTab, setActiveMainTab] = useState<"home" | "leaderboard" | "teams" | "admin">("home");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [dishHomeQuestions, setDishHomeQuestions] = useState<DishHomeQuestion[]>([]);
  const [liveQuestions, setLiveQuestions] = useState<LiveQuestion[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [winnersTicker, setWinnersTicker] = useState<any[]>([]);
  const [paymentConfig, setPaymentConfig] = useState({ entryFee: 500, acceptedMethods: ["eSewa", "Khalti", "PayPal", "Credit Card"] });
  const [googleConfig, setGoogleConfig] = useState({ googleClientId: "", appUrl: "" });

  // Modals / Overlays
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<"login" | "register">("login");
  
  // Registration form parameters
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regCountry, setRegCountry] = useState("Nepal");
  const [regUsername, setRegUsername] = useState("");
  const [regEmployeeId, setRegEmployeeId] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [otpVerificationStep, setOtpVerificationStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Custom OAuth Authentication states (Google & DishHome ID)
  const [authMethod, setAuthMethod] = useState<"google" | "dishhome" | "admin" | "mobile_email">("mobile_email");
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [dishHomeId, setDishHomeId] = useState("");
  const [dishHomeName, setDishHomeName] = useState("");
  const [dishHomePhone, setDishHomePhone] = useState("");

  // Login form parameters
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Predict sheet trigger state
  const [predictingMatch, setPredictingMatch] = useState<Match | null>(null);
  
  // Live score event trigger state
  const [activeLiveMatch, setActiveLiveMatch] = useState<Match | null>(null);

  // Checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Sorting leaderboard options
  const [leadCountryFilter, setLeadCountryFilter] = useState("");

  // Loading state
  const [globalLoading, setGlobalLoading] = useState(true);

  // Sync / Poll app data from Express Server
  const fetchAllServerData = async () => {
    try {
      let role = "user";
      const saved = localStorage.getItem("fifa_user_session");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.role) {
            role = parsed.role;
          }
        } catch (e) {}
      }

      const mRes = await fetch(`/api/matches?role=${role}`);
      if (mRes.ok) setMatches(await mRes.json());

      const tRes = await fetch(`/api/teams?role=${role}`);
      if (tRes.ok) setTeams(await tRes.json());

      const lRes = await fetch(`/api/leaderboard?country=${leadCountryFilter}`);
      if (lRes.ok) setLeaderboard(await lRes.json());

      const pRes = await fetch("/api/payment/config");
      if (pRes.ok) setPaymentConfig(await pRes.json());

      const dhRes = await fetch("/api/dishhome-questions");
      if (dhRes.ok) setDishHomeQuestions(await dhRes.json());

      const qRes = await fetch("/api/live-questions");
      if (qRes.ok) setLiveQuestions(await qRes.json());

      const prizeRes = await fetch("/api/prizes");
      if (prizeRes.ok) {
        const pz = await prizeRes.json();
        setWinnersTicker(pz.winners || []);
      }

      // Sync active user's points & credentials seamlessly in real-time
      const activeSession = localStorage.getItem("fifa_user_session");
      if (activeSession) {
        try {
          const parsed = JSON.parse(activeSession);
          if (parsed && parsed.id) {
            const userRes = await fetch(`/api/users/${parsed.id}`);
            if (userRes.ok) {
              const uData = await userRes.json();
              if (uData && uData.user) {
                setCurrentUser(uData.user);
                localStorage.setItem("fifa_user_session", JSON.stringify(uData.user));
              }
            }
          }
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Express API fetch failed. Checking fallback states.");
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchAllServerData();
    // Poll the server state every 3.5 seconds
    const interval = setInterval(fetchAllServerData, 3500);

    // Automatic seamless premium lobby access (No login portal required if registered)
    const saved = localStorage.getItem("fifa_user_session");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.warn(e);
      }
    }

    return () => clearInterval(interval);
  }, [leadCountryFilter, currentUser?.role]);

  // Synchronize automated visit tracking event
  useEffect(() => {
    const trackVisitorActivity = async () => {
      try {
        await fetch("/api/analytics/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser ? currentUser.id : "guest_anonymous",
            userName: currentUser ? currentUser.name : "Anonymous Fan",
            userEmail: currentUser ? currentUser.email : "guest@predictor.com",
            userMobile: currentUser ? currentUser.mobile || "" : "",
            userCountry: currentUser ? currentUser.country || "Nepal" : "Nepal",
            role: currentUser ? (currentUser as any).role || "user" : "guest",
            deviceInfo: navigator.userAgent
          })
        });
      } catch (err) {
        console.warn("Visitor analytics tracking offline.", err);
      }
    };
    trackVisitorActivity();
  }, [currentUser?.id]);

  // Load Google Console parameters on mount
  useEffect(() => {
    const fetchGoogleConfig = async () => {
      try {
        const res = await fetch("/api/auth/google/config");
        if (res.ok) {
          const data = await res.json();
          setGoogleConfig(data);
        }
      } catch (e) {
        console.warn("Could not retrieve Google Console Client configurations:", e);
      }
    };
    fetchGoogleConfig();
  }, []);

  // Synchronize dynamic Google SSO button callback
  useEffect(() => {
    if (showAuthModal && authMethod === "google") {
      const handleCredentialResponse = async (response: any) => {
        try {
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: response.credential }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setCurrentUser(data.user);
            setShowAuthModal(false);
            alert("🔒 Real Google Account logged in & verified successfully via Google OAuth Console!");
          } else {
            alert(data.error || "Google Identity login failed.");
          }
        } catch (e) {
          console.error("Google SSO verification exception:", e);
        }
      };

      const initGoogleButton = () => {
        if (window.google?.accounts?.id && googleConfig.googleClientId) {
          try {
            window.google.accounts.id.initialize({
              client_id: googleConfig.googleClientId,
              callback: handleCredentialResponse,
            });
            
            const targetDiv = document.getElementById("google-official-sso-container");
            if (targetDiv) {
              window.google.accounts.id.renderButton(targetDiv, {
                theme: "filled_blue",
                size: "large",
                text: "signin_with",
                width: 320,
              });
            }
          } catch (err) {
            console.warn("Google GIS initialization error:", err);
          }
        }
      };

      const timer = setTimeout(initGoogleButton, 300);
      return () => clearTimeout(timer);
    }
  }, [showAuthModal, authMethod, googleConfig.googleClientId]);

  // Fetch logged user specific database fields (like predictions list)
  useEffect(() => {
    if (currentUser) {
      const fetchUserPreds = async () => {
        try {
          const res = await fetch(`/api/predictions/${currentUser.id}`);
          if (res.ok) setPredictions(await res.json());
        } catch (e) {
          console.warn(e);
        }
      };
      fetchUserPreds();
    } else {
      setPredictions([]);
    }
  }, [currentUser]);

  // Handle Authentication
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authType === "register") {
      if (regPassword !== regConfirmPassword) {
        alert("Passwords do not match!");
        return;
      }
      // OTP Verification Simulation Step
      setOtpVerificationStep(true);
      alert("🔐 MOCK OTP CODE SENT!\n\nUse sandbox code '1234' (or any 4-digit code) to immediately complete standard user verification.");
    } else {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrMobile: loginEmail, password: loginPassword }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setCurrentUser(data.user);
          localStorage.setItem("fifa_user_session", JSON.stringify(data.user)); // PERSIST FOR AUTOMATIC LOGIN
          setShowAuthModal(false);
          setLoginEmail("");
          setLoginPassword("");
          alert(`Welcome back! Logged in as ${data.user.name}.`);
        } else {
          alert(data.error || "Authentication failure.");
        }
      } catch (err) {
        alert("OAuth gateway failure.");
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      alert("Please specify the 4-digit verification code sent to your number.");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          mobile: regMobile,
          country: regCountry,
          password: regPassword,
          username: regUsername,
          employeeId: regEmployeeId,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCurrentUser(data.user);
        localStorage.setItem("fifa_user_session", JSON.stringify(data.user)); // PERSIST REGISTRATION FOR AUTOMATIC LOGIN
        setShowAuthModal(false);
        setOtpVerificationStep(false);
        setRegName("");
        setRegEmail("");
        setRegMobile("");
        setRegUsername("");
        setRegEmployeeId("");
        setRegPassword("");
        setRegConfirmPassword("");
        setOtpCode("");
        alert("Registration validated! Automatic login activated for future visits.");
      } else {
        alert(data.error || "Invalid registration values.");
      }
    } catch (err) {
      alert("Error submitting OTP verification values.");
    }
  };

  const handleGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail) {
      alert("Please provide a valid Gmail address.");
      return;
    }
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: googleEmail, name: googleName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        setShowAuthModal(false);
        setGoogleEmail("");
        setGoogleName("");
        alert("Google account logged in successfully!");
      } else {
        alert(data.error || "Google authentication failed.");
      }
    } catch (err) {
      alert("Network error connecting to Google Auth servers.");
    }
  };

  const handleDishHomeSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishHomeId) {
      alert("Please enter your DishHome smart card or user ID.");
      return;
    }
    try {
      const res = await fetch("/api/auth/dishhome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishHomeId,
          name: dishHomeName,
          phone: dishHomePhone,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        setShowAuthModal(false);
        setDishHomeId("");
        setDishHomeName("");
        setDishHomePhone("");
        alert("DishHome account verified successfully!");
      } else {
        alert(data.error || "DishHome subscriber verification failed.");
      }
    } catch (err) {
      alert("Network connection error to DishHome registry.");
    }
  };

  const handleManualCheckIn = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/auth/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setCurrentUser(data.user);
        alert(data.message);
      } else {
        alert(data.error || "Check-In error.");
      }
    } catch (err) {
      console.warn("Streak error");
    }
  };

  const handleAnswerDishHome = async (ans: string) => {
    if (!currentUser) return;
    try {
      await fetch("/api/dishhome-questions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, questionId: "dh1", submittedAnswer: ans }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpinWheelRewardPoints = async (points: number) => {
    if (!currentUser) return;
    try {
      // Add points directly to client profile and update Express state mock-free
      const res = await fetch("/api/users/add-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, points }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = {
          ...currentUser,
          points: data.points,
        };
        setCurrentUser(updatedUser);
        // Refresh leaderboard stands so user can see their rank shift instantly
        fetchAllServerData();
      }
    } catch (e) {
      console.error("Failed to sync spin wheel points:", e);
    }
  };

  const handlePaidCheckoutSuccess = (userId: string, amount: number, gateway: string) => {
    if (currentUser && currentUser.id === userId) {
      setCurrentUser({
        ...currentUser,
        isPaid: true,
      });
    }
    setShowCheckoutModal(false);
    alert(`Success! Entry pass approved via secure ${gateway}. Enjoy forecasting!`);
    fetchAllServerData();
  };

  const exportPublicLeaderboard = (format: "excel" | "pdf" | "csv") => {
    if (!leaderboard || leaderboard.length === 0) {
      alert("No leaderboard standings loaded to download.");
      return;
    }

    const headers = ["Rank #", "User Predictor", "Nation Flag", "Accumulator Points", "Avg Accuracy Ratio", "Badge Honor"];
    const rows = leaderboard.map((lead, idx) => [
      `#${idx + 1}`,
      lead.name,
      lead.country,
      `${lead.points} PTS`,
      `${lead.accuracy}%`,
      lead.badge || "Bronze"
    ]);

    const title = leadCountryFilter 
      ? `Tournament Leaderboard Stands - ${leadCountryFilter} Region` 
      : "Tournament Global Leaderboard Standings";

    const filename = leadCountryFilter
      ? `fifa_worldcup2026_leaderboard_${leadCountryFilter.toLowerCase()}`
      : "fifa_worldcup2026_leaderboard_global";

    if (format === "csv") {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename + ".csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "excel") {
      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Leaderboardstands</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th { background-color: #0F172A; color: white; font-weight: bold; border: 1px solid #CBD5E1; padding: 10px; text-align: left; }
            td { border: 1px solid #E2E8F0; padding: 8px; text-align: left; }
            tr:nth-child(even) { background-color: #F8FAFC; }
          </style>
        </head>
        <body>
          <h3>${title}</h3>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
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
      link.download = filename + ".xls";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Popup blocked! Please allow popups to generate files.");
        return;
      }
      const today = new Date().toLocaleString();
      const tableHeadersHTML = headers.map(h => `<th style="padding: 10px; background-color: #0F172A; color: white; border: 1px solid #CBD5E1; text-align: left; font-size: 11px; font-family: monospace;">${h}</th>`).join("");
      const tableRowsHTML = rows.map(row => {
        const cols = row.map(cell => `<td style="padding: 8px; border: 1px solid #E2E8F0; font-size: 11px; text-align: left; font-family: Arial, sans-serif;">${String(cell).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`).join("");
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
              .meta-info { text-align: right; font-size: 10px; color: #64748B; font-family: monospace; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              tr:nth-child(even) { background-color: #F8FAFC !important; }
              .footer { margin-top: 30px; border-top: 1px solid #CBD5E1; padding-top: 8px; font-size: 9px; text-align: center; color: #94A3B8; font-family: monospace; }
            </style>
          </head>
          <body>
            <div class="no-print" style="margin-bottom: 20px; background-color: #1E293B; color: white; padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
              <div style="font-size: 11px; font-family: monospace;">📄 Leaderboard Stands Printable. Click 'Save to PDF' below.</div>
              <button onclick="window.print();" style="background-color: #eab308; color: black; border: none; padding: 6px 14px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; font-family: monospace; text-transform: uppercase;">🖨️ Save as PDF</button>
            </div>
            <div class="header">
              <div style="float: left;" class="title-section">
                <h1>🏆 FIFA WORLD CUP 2026 LEADERBOARD</h1>
                <p>Public Standings Ledger</p>
              </div>
              <div style="float: right; text-align: right;" class="meta-info">
                <div>STANDINGS: <strong>${title.toUpperCase()}</strong></div>
                <div>GENERATED: ${today}</div>
              </div>
              <div style="clear: both;"></div>
            </div>
            <table>
              <thead><tr>${tableHeadersHTML}</tr></thead>
              <tbody>${tableRowsHTML}</tbody>
            </table>
            <div class="footer">STATED ON LIVE PLATFORM RECORDS • TOTAL PREDICTIONS • PAGE 1 OF 1</div>
            <script>
              window.onload = function() { setTimeout(function() { window.print(); }, 400); };
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(reportHTML);
      printWindow.document.close();
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem("fifa_user_session");
    setActiveMainTab("home");
  };

  const handleAutoLoginGuest = () => {
    const defaultGuest: UserProfile = {
      id: "u_guest_shrestha",
      name: "Sanjit Guest Fan",
      email: "ranjansanjit2023@gmail.com",
      mobile: "+977-9800000001",
      country: "Nepal",
      isPaid: true,
      points: 2500,
      accuracy: 94,
      predictionsCompleted: 12,
      badge: "Gold Predictor",
      rank: 2,
      referralCode: "SANJIT88",
      referredCount: 5,
      dailyCheckInChain: 4,
      googleVerified: true
    };
    setCurrentUser(defaultGuest);
    localStorage.setItem("fifa_user_session", JSON.stringify(defaultGuest));
  };

  // Translations Map
  const translations = {
    EN: {
      tag: "FIFA World Cup Predictor Arena",
      navHome: "Game Lobby",
      navLeaderboard: "Leaderboards",
      navTeams: "Nations standing",
      navAdmin: "Admin center",
      btnIn: "Access Lobby",
      btnOut: "Log out",
      leadTitle: "Predictors Global Rankings",
      leadDesc: "Track point accumulations updated live. Correct winner grants +10; exact scores grant +50!",
      countryFilter: "Filter Country",
      emptyLead: "Gathering rankings feed from MetLife Stadium databases...",
    },
    NP: {
      tag: "फिफा विश्वकप २०२६ पोर्टल",
      navHome: "नयाँ खेलकुद लबी",
      navLeaderboard: "लीडरबोर्ड",
      navTeams: "राष्ट्रिय टोली",
      navAdmin: "सञ्चालक प्यानल",
      btnIn: "खाता खोल्नुहोस्",
      btnOut: "बाहिर निस्कनुहोस्",
      leadTitle: "वैश्विक भविष्यवाणी रैंकिंग",
      leadDesc: "लाइभ अंक तालिका ट्र्याक गर्नुहोस्। सही विजेताको प्राप्त +१० र सही गोलको +५० अंक हुनेछ!",
      countryFilter: "देश छनोट",
      emptyLead: "स्टेडियम नेटवर्कबाट रैंकिंग तालिका प्राप्त गर्दै...",
    },
    HI: {
      tag: "फीफा विश्व कप भविष्यवाणी अखाड़ा",
      navHome: "दांव लॉबी",
      navLeaderboard: "लीडरबोर्ड",
      navTeams: "राष्ट्रीय टीम",
      navAdmin: "ऑपरेटर केंद्र",
      btnIn: "प्रवेश करें",
      btnOut: "लॉग आउट करें",
      leadTitle: "भविष्यवक्ता वैश्विक रैंकिंग",
      leadDesc: "लाइव अंक संचय को ट्रैक करें। सही विजेता को +10; सटीक स्कोर से +50 अंक मिलते हैं!",
      countryFilter: "देश फ़िल्टर",
      emptyLead: "स्टेडियम डेटाबेस से रैंकिंग फीड एकत्रित की जा रही है...",
    }
  };

  const uiText = translations[language] || translations.EN;
  const isTournamentCompleted = matches.length > 0 && matches.every(m => m.status === "completed" || m.status === "finished");

  return (
    <div className={`min-h-screen relative flex flex-col font-sans transition-all duration-300 ${
      theme === "light" 
        ? "bg-slate-100 text-slate-900 border-slate-200" 
        : "bg-[#050A18] text-white"
    }`}>
      
      {/* Stadium backdrop neon lines */}
      {theme === "dark" && <StadiumLights />}

      {/* Global Navbar header */}
      <header className="relative z-20 w-full bg-black/40 backdrop-blur-md border-b border-[#00D1FF]/20 shrink-0 select-none">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Logo Group */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveMainTab("home")}>
            <DishHomeLogo size="sm" showText={false} className="shrink-0" />
            <div className="h-6 w-px bg-slate-800" />
            <Trophy className="w-5 h-5 text-fifa-gold shrink-0" />
            <div className="leading-none">
              <span className="font-display font-black text-xs sm:text-sm tracking-wide text-white uppercase block">FIFA 2026 GAME</span>
              <span className="text-[9px] font-mono text-white/50 tracking-wider uppercase font-bold block">{uiText.tag}</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
            <button 
              onClick={() => setActiveMainTab("home")}
              className={`hover:text-white cursor-pointer flex items-center gap-1.5 ${activeMainTab === "home" ? "text-fifa-gold font-bold border-b-2 border-fifa-gold pb-1" : ""}`}
            >
              <span>{uiText.navHome}</span>
              {isTournamentCompleted && (
                <span className="bg-red-600 text-white font-sans text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tight animate-bounce leading-none">
                  Winners Live
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveMainTab("leaderboard")}
              className={`hover:text-white cursor-pointer ${activeMainTab === "leaderboard" ? "text-fifa-gold font-bold border-b-2 border-fifa-gold pb-1" : ""}`}
            >
              {uiText.navLeaderboard}
            </button>
            <button 
              onClick={() => setActiveMainTab("teams")}
              className={`hover:text-white cursor-pointer ${activeMainTab === "teams" ? "text-fifa-gold font-bold border-b-2 border-fifa-gold pb-1" : ""}`}
            >
              {uiText.navTeams}
            </button>
            {currentUser && (currentUser.email === "ranjansanjit@gmail.com" || currentUser.email === "ranjansanjit2023@gmail.com" || (currentUser as any).role === "admin" || (currentUser as any).role === "superadmin") && (
              <button 
                onClick={() => setActiveMainTab("admin")}
                className={`hover:text-white cursor-pointer ${activeMainTab === "admin" ? "text-fifa-gold font-bold border-b-2 border-fifa-gold pb-1" : ""}`}
              >
                {uiText.navAdmin}
              </button>
            )}
          </nav>

          {/* Action Row Actions */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
            
            {/* Multi-language local toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 gap-0.5">
              {(["EN", "NP", "HI"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-1.5 py-1 rounded text-[9px] font-bold cursor-pointer transition-all ${
                    language === lang ? "bg-fifa-gold text-fifa-blue" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Dark/Light template theme switcher */}
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-gray-400 hover:text-white p-1.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer transition-all"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-orange-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Account authentication state */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full border border-fifa-gold object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 font-bold text-[10px] text-slate-300 flex items-center justify-center uppercase">
                    {currentUser.name.slice(0, 1)}
                  </div>
                )}
                <div className="hidden sm:block text-right">
                  <div className="text-[10px] font-bold text-white uppercase flex items-center justify-end gap-1">
                    {currentUser.name}
                    {currentUser.googleVerified && (
                      <span className="inline-flex w-3.5 h-3.5 bg-blue-500 rounded-full items-center justify-center text-white text-[9px] font-bold" title="Google Certified Account">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-fifa-gold font-bold flex items-center gap-1 justify-end">
                    {currentUser.points} PTS
                    {currentUser.googleVerified && (
                      <span className="text-[7px] tracking-wider bg-blue-950/80 text-blue-400 border border-blue-800/60 px-1 rounded font-bold uppercase transition-all">
                        Google Verified
                      </span>
                    )}
                  </div>
                </div>
                <button
                  id="btn_signout"
                  onClick={handleSignOut}
                  className="bg-slate-900 border border-slate-800 hover:text-white hover:bg-slate-800 text-gray-300 font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all uppercase text-[10px]"
                >
                  {uiText.btnOut}
                </button>
              </div>
            ) : (
              <button
                id="btn_signin"
                onClick={() => {
                  setAuthType("register");
                  setShowAuthModal(true);
                }}
                className="bg-gradient-to-r from-fifa-gold to-yellow-500 hover:from-yellow-400 hover:to-fifa-gold text-fifa-blue font-bold px-4 py-2 rounded-lg cursor-pointer transition-all uppercase tracking-wider text-[10px] shadow flex items-center gap-1 shrink-0 animate-pulse"
              >
                <LogIn className="w-3.5 h-3.5 text-fifa-blue" />
                REGISTER / LOGIN
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Mobile Nav Links drawer row */}
      <div className="relative z-20 md:hidden bg-slate-900 flex justify-around border-b border-slate-800 py-2.5 text-[10px] font-mono font-bold uppercase select-none shrink-0">
        <button onClick={() => setActiveMainTab("home")} className={`hover:text-white flex items-center gap-1 ${activeMainTab === "home" ? "text-fifa-gold" : "text-gray-400"}`}>
          <span>Lobby Match</span>
          {isTournamentCompleted && <span className="text-[7px] text-red-500 font-bold">&#9679;</span>}
        </button>
        <button onClick={() => setActiveMainTab("leaderboard")} className={`hover:text-white ${activeMainTab === "leaderboard" ? "text-fifa-gold" : "text-gray-400"}`}>Leaderboard</button>
        <button onClick={() => setActiveMainTab("teams")} className={`hover:text-white ${activeMainTab === "teams" ? "text-fifa-gold" : "text-gray-400"}`}>Nations List</button>
        {currentUser && (currentUser.email === "ranjansanjit@gmail.com" || currentUser.email === "ranjansanjit2023@gmail.com" || (currentUser as any).role === "admin" || (currentUser as any).role === "superadmin") && (
          <button onClick={() => setActiveMainTab("admin")} className={`hover:text-white ${activeMainTab === "admin" ? "text-fifa-gold" : "text-gray-400"}`}>Operators</button>
        )}
      </div>

      {/* Unified Global Loading bar loader */}
      {globalLoading && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 select-none font-mono">
          <RefreshCw className="w-10 h-10 text-fifa-gold animate-spin mb-4" />
          <p className="text-xs text-slate-400 tracking-wider">Syncing real-time MetLife stadium scores database. Please wait...</p>
        </div>
      )}

      {/* --- CONTENT CONTROLLERS --- */}
      {!globalLoading && (
        <main className="flex-1 flex flex-col relative z-10">
          
          {/* --- TAB: HOME / LOBBY --- */}
          {activeMainTab === "home" && (
            <div className="flex-1 flex flex-col space-y-6 pb-12">
              {isTournamentCompleted && (
                <TournamentWinners 
                  leaderboard={leaderboard}
                  prizePool={250000}
                  language={language}
                />
              )}
              {currentUser ? (
                <UserDashboard 
                  user={currentUser}
                  matches={matches}
                  predictions={predictions}
                  dishHomeQuestions={dishHomeQuestions}
                  liveQuestions={liveQuestions}
                  onOpenPrediction={(match) => setPredictingMatch(match)}
                  onOpenLiveScore={(match) => setActiveLiveMatch(match)}
                  onCheckIn={handleManualCheckIn}
                  onAnswerDishHome={handleAnswerDishHome}
                  onSpinWheelReward={handleSpinWheelRewardPoints}
                  language={language}
                />
              ) : (
                <LandingHero 
                  onJoinClick={() => {
                    setAuthType("register");
                    setShowAuthModal(true);
                  }}
                  registeredUsersCount={leaderboard.length || 3}
                  winnersTicker={winnersTicker}
                />
              )}
            </div>
          )}

          {/* --- TAB: LEADERBOARD --- */}
          {activeMainTab === "leaderboard" && (
            <div className="w-full max-w-4xl mx-auto px-4 py-8 font-sans">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-fifa-gold/5 rounded-full blur-3xl text-none shrink-0" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-800 pb-4 shrink-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-tight">{uiText.leadTitle}</h2>
                    <p className="text-xs text-gray-400 mt-1">{uiText.leadDesc}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3.5 font-mono text-xs select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[10px] font-bold uppercase">{uiText.countryFilter}:</span>
                      <select
                        value={leadCountryFilter}
                        onChange={(e) => setLeadCountryFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-white rounded p-1.5 focus:outline-none focus:border-fifa-gold text-xs"
                      >
                        <option value="">Global List</option>
                        <option value="Nepal">Nepal Only</option>
                        <option value="USA">USA Only</option>
                        <option value="India">India Only</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3.5">
                      <button 
                        onClick={() => exportPublicLeaderboard("excel")}
                        className="px-2 py-1.5 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/45 border border-emerald-500/20 rounded font-bold uppercase text-[9px] flex items-center gap-1 transition-all cursor-pointer"
                        title="Download as Excel Spreadsheet"
                      >
                        📊 Excel
                      </button>
                      <button 
                        onClick={() => exportPublicLeaderboard("pdf")}
                        className="px-2 py-1.5 bg-red-950/40 text-red-400 hover:bg-red-900/45 border border-red-500/20 rounded font-bold uppercase text-[9px] flex items-center gap-1 transition-all cursor-pointer"
                        title="Download as PDF Document Ledger"
                      >
                        📕 PDF
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table details */}
                <div className="overflow-x-auto rounded-xl border border-slate-850">
                  <table className="w-full text-left font-mono text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                      <tr>
                        <th className="p-3">Rank #</th>
                        <th className="p-3">User Predictor</th>
                        <th className="p-3">Nation Flag</th>
                        <th className="p-3">Accumulator Points</th>
                        <th className="p-3">Accuracy Ratio</th>
                        <th className="p-3">Badge Honor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-semibold">
                      {leaderboard.length > 0 ? (
                        leaderboard.map((lead, idx) => (
                          <tr key={lead.userId || idx} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3 text-fifa-neon font-extrabold font-mono text-sm">#{idx + 1}</td>
                            <td className="p-3 text-white uppercase tracking-wide font-display">{lead.name}</td>
                            <td className="p-3 filter drop-shadow-sm uppercase text-sm font-bold">{lead.country}</td>
                            <td className="p-3 text-fifa-gold font-bold text-sm">{lead.points} PTS</td>
                            <td className="p-3 text-slate-400">{lead.accuracy}%</td>
                            <td className="p-3 text-xs text-slate-300">{lead.badge}</td>
                          </tr>
                        ))
                      ) : (
                        <tr key="leaderboard-empty-state">
                          <td colSpan={6} className="text-center p-12 text-slate-500 italic">
                            {uiText.emptyLead}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* --- TAB: TEAMS Standing database --- */}
          {activeMainTab === "teams" && (
            <FifaTeamDatabase teams={teams} />
          )}

          {/* --- TAB: OPERATORS ADMIN --- */}
          {activeMainTab === "admin" && (
            <SuperAdminPanel 
              matches={matches} 
              onAdminActionHappened={fetchAllServerData} 
              currentUser={currentUser}
            />
          )}

        </main>
      )}

      {/* footer block */}
      <footer className="bg-slate-950 p-6 border-t border-slate-900/90 text-center text-xs text-slate-500 select-none relative z-10 shrink-0 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="uppercase text-[10px] tracking-wider">&copy; 2026 FIFA World Cup Game Predict Platform Nepal Corp. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white">eSewa Terms</a>
            <a href="#" className="hover:text-white">Khalti Payouts Rules</a>
            <a href="#" className="hover:text-white font-bold text-fifa-gold">DishHome Package Survey</a>
          </div>
        </div>
      </footer>

      {/* --- AUTH REGISTRATION / SECURED ADMIN OVERLAY MODAL --- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl my-8 font-sans">
            
            <button 
              id="btn_auth_close"
              onClick={() => {
                setShowAuthModal(false);
                setOtpVerificationStep(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xs font-mono bg-slate-950 px-2 py-1 rounded-md border border-slate-800 cursor-pointer transition-all"
            >
              ✕ CLOSE
            </button>

            {otpVerificationStep ? (
              /* Simulated phone/mobile OTP verification sheet */
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
                <div className="text-center mb-6">
                  <Mail className="w-10 h-10 text-fifa-gold mx-auto mb-2 font-black shrink-0 animate-bounce" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">SMS OTP Verification Check</h3>
                  <p className="text-gray-400 mt-1 leading-normal text-[11px]">We simulated a 4-digit verification code sent to your phone number {regMobile || "+977-xxxxx"}.</p>
                </div>

                <div className="p-3 bg-gradient-to-r from-emerald-950/40 to-slate-950/70 border border-emerald-500/30 rounded-xl text-center space-y-1">
                  <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide">🔓 SANDBOX MOCK CODE:</p>
                  <p className="text-2xl font-black text-white tracking-widest font-mono animate-pulse">1234</p>
                  <p className="text-[9px] text-slate-400">(सजिलै दर्ता गर्नको लागि '1234' टाईप गर्नुहोस्)</p>
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-widest block mb-1 text-[10px] font-bold">ENTER verification PIN</label>
                  <input 
                    type="text" 
                    placeholder="Enter 1234"
                    maxLength={4}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-center text-lg font-bold font-mono tracking-widest focus:outline-none focus:border-fifa-gold"
                  />
                  <div className="flex justify-between items-center mt-1.5 text-[9px] text-gray-500 font-normal">
                    <span>Valid for 3:00 minutes.</span>
                    <button 
                      type="button" 
                      onClick={() => alert("Simulated code 1234 has been resent to your input!")}
                      className="text-fifa-gold font-bold hover:underline"
                    >
                      Resend SMS PIN
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-linear-to-r from-fifa-gold to-yellow-500 hover:from-yellow-450 hover:to-fifa-gold text-fifa-blue font-bold py-3 px-4 rounded-xl cursor-pointer uppercase text-xs tracking-wider"
                >
                  Verify Code & Settle Profile
                </button>
              </form>
            ) : (
              /* Toggle Form: Register Form for standard user vs Admin Login form */
              <div className="space-y-4 text-left">
                
                {authType === "register" ? (
                  /* USER REGISTER FORM (ONE-TIME REGISTER EXPERIENCE) */
                  <div className="space-y-4">
                    <div className="text-center mb-4 select-none">
                      <Trophy className="w-10 h-10 text-fifa-gold mx-auto mb-2" />
                      <h3 className="text-base font-bold text-white uppercase tracking-wider font-display">One-Time Player Registration</h3>
                      <p className="text-xs text-slate-400 mt-1">Register once to submit predictions and auto-save your session!</p>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                      <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl text-[11px] text-emerald-400 leading-normal">
                        ✍️ Fill your name and phone number once. After verification, you are automatically logged in for all subsequent visits.
                      </div>

                      <div>
                        <label className="text-slate-400 text-[10px] font-bold block mb-1 uppercase tracking-wider">FullName (पुरा नाम)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sanjit Kumar Shrestha"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 text-[10px] font-bold block mb-1 uppercase tracking-wider">Unique Username (युजरनेम)</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. sanjit_std"
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px] font-bold block mb-1 uppercase tracking-wider">Employee ID (कर्मचारी ID)</label>
                          <input
                            type="text"
                            required
                            placeholder="Numeric e.g. 104"
                            value={regEmployeeId}
                            onChange={(e) => setRegEmployeeId(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 text-[10px] font-bold block mb-1 uppercase tracking-wider">Mobile Number (फोन)</label>
                          <input
                            type="tel"
                            required
                            placeholder="98XXXXXXXX"
                            value={regMobile}
                            onChange={(e) => setRegMobile(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px] font-bold block mb-1 uppercase tracking-wider">Email Address (इमेल)</label>
                          <input
                            type="email"
                            required
                            placeholder="name@email.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 text-[10px] font-bold block mb-1 uppercase tracking-wider">Choose PIN / Password</label>
                          <input
                            type="password"
                            required
                            placeholder="Password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px] font-bold block mb-1 uppercase tracking-wider">Confirm PIN / Password</label>
                          <input
                            type="password"
                            required
                            placeholder="Confirm PIN"
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-450 hover:to-teal-500 text-slate-950 font-black py-2.5 px-4 rounded-xl cursor-pointer uppercase text-xs tracking-wider transition-all"
                      >
                        🚀 REGISTER NOW & START (दर्ता गर्नुहोस्)
                      </button>
                    </form>
                  </div>
                ) : (
                  /* ADMINISTRATOR SECURE LOGIN FORM (ONLY ADMIN LOGIN OPTION AVAILABLE) */
                  <div className="space-y-4">
                    <div className="text-center mb-4 select-none">
                      <ShieldCheck className="w-10 h-10 text-fifa-gold mx-auto mb-2" />
                      <h3 className="text-base font-bold text-white uppercase tracking-wider font-display">Secured Operator Seat</h3>
                      <p className="text-xs text-slate-400 mt-1">Authorized system administrator credentials verification console.</p>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                      <div className="bg-slate-950 text-slate-400 px-3 py-2.5 border border-white/5 rounded-xl text-[10px] leading-relaxed animate-pulse">
                        🔑 <span className="text-fifa-gold font-bold">Fast Logins:</span> Enter Username, Employee ID, Mobile, or Email to sign in.
                      </div>

                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1 font-bold uppercase tracking-wider">Username, Employee ID, Mobile, or Email</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. sanjit_std, 104, 9800000001, etc."
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-fifa-gold"
                        />
                      </div>
                      
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1 font-bold uppercase tracking-wider">ADMIN PASSWORD / PIN</label>
                        <input 
                          type="password" 
                          required
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-fifa-gold"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-fifa-gold to-yellow-500 hover:from-yellow-400 hover:to-fifa-gold text-fifa-blue font-bold py-2.5 px-4 rounded-xl cursor-pointer uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 shadow transition-all"
                      >
                        <LogIn className="w-3.5 h-3.5 shrink-0" />
                        Verify Administrator Credentials
                      </button>
                    </form>
                  </div>
                )}

                {/* Secure administrative gate switcher */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-gray-500 font-sans select-none">
                  <span>{authType === "register" ? "Are you an operator?" : "Are you a classic player?"} </span>
                  <button
                    type="button"
                    onClick={() => setAuthType(authType === "login" ? "register" : "login")}
                    className="text-fifa-gold font-bold hover:underline transition-all cursor-pointer decoration-dotted underline-offset-2"
                  >
                    {authType === "login" ? "Register Player account (दर्ता)" : "Secured Admin Login"}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* --- INJECT PREDICT MODAL FORM SHEET --- */}
      {predictingMatch && currentUser && (
        <MatchPredictionModule
          userId={currentUser.id}
          match={predictingMatch}
          onPredictionSubmitted={() => {
            setPredictingMatch(null);
            fetchAllServerData();
          }}
          onClose={() => setPredictingMatch(null)}
        />
      )}

      {/* --- INJECT LIVE INTERACTION SCORE TIMELINE --- */}
      {activeLiveMatch && currentUser && (
        <LiveScoreTimeline
          userId={currentUser.id}
          userName={currentUser.name}
          userCountry={currentUser.country}
          match={activeLiveMatch}
          onClose={() => setActiveLiveMatch(null)}
        />
      )}

    </div>
  );
}

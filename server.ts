import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());

// Debug: log incoming API requests to help trace which call triggers DB writes or restarts
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[API REQUEST] ${req.method} ${req.url} ${Object.keys(req.body || {}).length ? JSON.stringify(req.body) : ''}`);
  }
  next();
});

const PORT = 3000;

// Initialize Gemini Client Lazily/Safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Global In-Memory Database State
const DB: any = {
  paymentConfig: {
    entryFee: 500, // NRs (Nepali Rupee) or Currency equivalent
    prizePool: 250000,
    acceptedMethods: ["eSewa", "Khalti"],
    merchantIds: {
      eSewa: "ESEW_FIFA26_MERC",
      Khalti: "KHALTI_FIFA26_KEY",
    },
    commissionRate: 10, // 10% Platform fee
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  appUrl: process.env.APP_URL || "",
  visits: [], // Audited spectator visit histories
  
  users: [
    {
      id: "u_admin_std",
      name: "Sanjit Standard Admin",
      username: "sanjit_std",
      employeeId: 100,
      email: "ranjansanjit2023@gmail.com",
      mobile: "+977-9800000001",
      country: "Nepal",
      role: "admin",
      isPaid: true,
      points: 9999,
      accuracy: 100,
      predictionsCompleted: 15,
      badge: "World Champion",
      rank: 1,
      referralCode: "SANJIT2023",
      referredCount: 0,
      dailyCheckInChain: 0,
    },
    {
      id: "u_admin_super",
      name: "Sanjit Super Admin",
      username: "sanjit_super",
      employeeId: 101,
      email: "ranjansanjit@gmail.com",
      mobile: "+977-9800000002",
      country: "Nepal",
      role: "superadmin",
      isPaid: true,
      points: 9999,
      accuracy: 100,
      predictionsCompleted: 15,
      badge: "World Champion",
      rank: 2,
      referralCode: "SANJIT_SUPER",
      referredCount: 0,
      dailyCheckInChain: 0,
    },
    {
      id: "u1",
      name: "Sah Rolex",
      username: "sah_rolex",
      employeeId: 102,
      email: "sahrolex10@gmail.com",
      mobile: "+977-9812345678",
      country: "Nepal",
      role: "superadmin",
      isPaid: true,
      points: 1250,
      accuracy: 82,
      predictionsCompleted: 14,
      badge: "Gold Predictor" as const,
      rank: 3,
      referralCode: "ROLEX2026",
      referredCount: 4,
      dailyCheckInChain: 5,
      lastCheckIn: "2026-06-08",
    },
    {
      id: "u2",
      name: "Alex Johnson",
      username: "alex",
      employeeId: 103,
      email: "alex@predict.com",
      mobile: "+1-555123456",
      country: "USA",
      isPaid: true,
      points: 1100,
      accuracy: 75,
      predictionsCompleted: 12,
      badge: "Silver Predictor" as const,
      rank: 4,
      referralCode: "ALEXFIFA",
      referredCount: 2,
      dailyCheckInChain: 3,
      lastCheckIn: "2026-06-09",
    },
    {
      id: "u3",
      name: "Rohit Sharma",
      username: "rohit",
      employeeId: 104,
      email: "rohit@fifafan.com",
      mobile: "+91-9988776655",
      country: "India",
      isPaid: false,
      points: 400,
      accuracy: 60,
      predictionsCompleted: 5,
      badge: "Bronze Predictor" as const,
      rank: 5,
      referralCode: "ROHIT2026",
      referredCount: 0,
      dailyCheckInChain: 1,
      lastCheckIn: "2026-06-07",
    }
  ],

  matches: [
    {
      id: "m1",
      teamA: "Mexico",
      teamB: "South Africa",
      flagA: "🇲🇽",
      flagB: "🇿🇦",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-11T19:00:00Z",
      nptTime: "राति 12:45 बजे (11 Jun)",
      group: "Group A",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m2",
      teamA: "Korea Republic",
      teamB: "Czechia",
      flagA: "🇰🇷",
      flagB: "🇨🇿",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-11T15:00:00Z",
      nptTime: "साँझ 8:45 बजे (11 Jun)",
      group: "Group A",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m3",
      teamA: "Canada",
      teamB: "Bosnia & Herzegovina",
      flagA: "🇨🇦",
      flagB: "🇧🇦",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-12T15:00:00Z",
      nptTime: "साँझ 8:45 बजे (12 Jun)",
      group: "Group B",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m4",
      teamA: "USA",
      teamB: "Paraguay",
      flagA: "🇺🇸",
      flagB: "🇵🇾",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-12T01:00:00Z",
      nptTime: "बिहान 6:45 बजे (12 Jun)",
      group: "Group D",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m5",
      teamA: "Brazil",
      teamB: "Morocco",
      flagA: "🇧🇷",
      flagB: "🇲🇦",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-13T00:00:00Z",
      nptTime: "बिहान 5:45 बजे (13 Jun)",
      group: "Group C",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m6",
      teamA: "Australia",
      teamB: "Türkiye",
      flagA: "🇦🇺",
      flagB: "🇹🇷",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-13T16:00:00Z",
      nptTime: "राति 9:45 बजे (13 Jun)",
      group: "Group D",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m7",
      teamA: "Germany",
      teamB: "Curaçao",
      flagA: "🇩🇪",
      flagB: "🇨🇼",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-14T23:00:00Z",
      nptTime: "बिहान 4:45 बजे (14 Jun)",
      group: "Group E",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m8",
      teamA: "Netherlands",
      teamB: "Japan",
      flagA: "🇳🇱",
      flagB: "🇯🇵",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-14T15:00:00Z",
      nptTime: "साँझ 8:45 बजे (14 Jun)",
      group: "Group F",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m9",
      teamA: "Spain",
      teamB: "Cabo Verde",
      flagA: "🇪🇸",
      flagB: "🇨🇻",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-15T18:00:00Z",
      nptTime: "राति 11:45 बजे (15 Jun)",
      group: "Group H",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m10",
      teamA: "Belgium",
      teamB: "Egypt",
      flagA: "🇧🇪",
      flagB: "🇪🇬",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-15T15:00:00Z",
      nptTime: "साँझ 8:45 बजे (15 Jun)",
      group: "Group G",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m11",
      teamA: "France",
      teamB: "Senegal",
      flagA: "🇫🇷",
      flagB: "🇸🇳",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-16T00:00:00Z",
      nptTime: "बिहान 5:45 बजे (16 Jun)",
      group: "Group I",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m12",
      teamA: "Argentina",
      teamB: "Algeria",
      flagA: "🇦🇷",
      flagB: "🇩🇿",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-16T03:00:00Z",
      nptTime: "बिहान 8:45 बजे (16 Jun)",
      group: "Group J",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m13",
      teamA: "England",
      teamB: "Croatia",
      flagA: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      flagB: "🇭🇷",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-17T01:00:00Z",
      nptTime: "बिहान 6:45 बजे (17 Jun)",
      group: "Group L",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m14",
      teamA: "Portugal",
      teamB: "DR Congo",
      flagA: "🇵🇹",
      flagB: "🇨🇩",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-17T15:00:00Z",
      nptTime: "साँझ 8:45 बजे (17 Jun)",
      group: "Group K",
      possessionA: 50,
      locked: false,
      timeline: []
    },
    {
      id: "m15",
      teamA: "Colombia",
      teamB: "Portugal",
      flagA: "🇨🇴",
      flagB: "🇵🇹",
      status: "upcoming" as const,
      scoreA: 0,
      scoreB: 0,
      startTime: "2026-06-27T00:00:00Z",
      nptTime: "बिहान 5:45 बजे (27 Jun)",
      group: "Group K",
      possessionA: 50,
      locked: false,
      timeline: []
    }
  ],

  teams: [
    {
      name: "Mexico",
      flag: "🇲🇽",
      group: "Group A",
      fifaRanking: 15,
      coach: "Javier Aguirre",
      squad: ["Santiago Giménez", "Guillermo Ochoa", "Edson Álvarez", "Luis Chávez", "Hirving Lozano"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Quarterfinals (1970, 1986)",
      perfHistory: [75, 78, 80, 82, 85]
    },
    {
      name: "South Africa",
      flag: "🇿🇦",
      group: "Group A",
      fifaRanking: 59,
      coach: "Hugo Broos",
      squad: ["Percy Tau", "Ronwen Williams", "Teboho Mokoena", "Themba Zwane", "Aubrey Modiba"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (1998, 2002, 2010)",
      perfHistory: [60, 65, 62, 68, 70]
    },
    {
      name: "Korea Republic",
      flag: "🇰🇷",
      group: "Group A",
      fifaRanking: 22,
      coach: "Hong Myung-bo",
      squad: ["Son Heung-min", "Kim Min-jae", "Lee Kang-in", "Hwang Hee-chan", "Cho Gue-sung"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "4th Place (2002), Round of 16 (2010, 2022)",
      perfHistory: [80, 82, 84, 86, 88]
    },
    {
      name: "Czechia",
      flag: "🇨🇿",
      group: "Group A",
      fifaRanking: 34,
      coach: "Ivan Hašek",
      squad: ["Patrik Schick", "Tomáš Souček", "Vladimír Coufal", "Adam Hložek", "Jindřich Staněk"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Runners-up (1934, 1962 as Czechoslovakia)",
      perfHistory: [70, 72, 75, 74, 76]
    },
    {
      name: "Canada",
      flag: "🇨🇦",
      group: "Group B",
      fifaRanking: 40,
      coach: "Jesse Marsch",
      squad: ["Alphonso Davies", "Jonathan David", "Cyle Larin", "Tajon Buchanan", "Stephen Eustáquio"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (1986, 2022)",
      perfHistory: [68, 72, 75, 78, 80]
    },
    {
      name: "Bosnia & Herzegovina",
      flag: "🇧🇦",
      group: "Group B",
      fifaRanking: 75,
      coach: "Sergej Barbarez",
      squad: ["Edin Džeko", "Sead Kolašinac", "Ermedin Demirović", "Amar Dedić", "Benjamin Tahirović"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (2014)",
      perfHistory: [62, 60, 65, 63, 67]
    },
    {
      name: "Qatar",
      flag: "🇶🇦",
      group: "Group B",
      fifaRanking: 35,
      coach: "Tintín Márquez",
      squad: ["Akram Afif", "Almoez Ali", "Hassan Al-Haydos", "Lucas Mendes", "Meshaal Barsham"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (2022)",
      perfHistory: [65, 70, 72, 75, 73]
    },
    {
      name: "Switzerland",
      flag: "🇨🇭",
      group: "Group B",
      fifaRanking: 19,
      coach: "Murat Yakin",
      squad: ["Granit Xhaka", "Manuel Akanji", "Yann Sommer", "Xherdan Shaqiri", "Breel Embolo"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Quarterfinals (1934, 1938, 1954)",
      perfHistory: [82, 84, 85, 87, 86]
    },
    {
      name: "Brazil",
      flag: "🇧🇷",
      group: "Group C",
      fifaRanking: 5,
      coach: "Dorival Júnior",
      squad: ["Vinicius Jr", "Rodrygo", "Alisson Becker", "Marquinhos", "Bruno Guimarães", "Endrick"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "5-Time Champions (1958, 1962, 1970, 1994, 2002)",
      perfHistory: [92, 90, 88, 85, 87]
    },
    {
      name: "Morocco",
      flag: "🇲🇦",
      group: "Group C",
      fifaRanking: 14,
      coach: "Walid Regragui",
      squad: ["Achraf Hakimi", "Yassine Bounou", "Sofyan Amrabat", "Hakim Ziyech", "Azzedine Ounahi"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "4th Place (2022), Round of 16 (1986)",
      perfHistory: [85, 88, 90, 87, 85]
    },
    {
      name: "Scotland",
      flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
      group: "Group C",
      fifaRanking: 39,
      coach: "Steve Clarke",
      squad: ["Andrew Robertson", "Scott McTominay", "John McGinn", "Billy Gilmour", "Che Adams"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (8 times)",
      perfHistory: [68, 70, 72, 74, 73]
    },
    {
      name: "Haiti",
      flag: "🇭🇹",
      group: "Group C",
      fifaRanking: 86,
      coach: "Sébastien Migné",
      squad: ["Frantzdy Pierrot", "Duckens Nazon", "Danley Jean Jacques", "Ricardo Adé", "Johny Placide"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (1974)",
      perfHistory: [55, 58, 60, 57, 59]
    },
    {
      name: "USA",
      flag: "🇺🇸",
      group: "Group D",
      fifaRanking: 12,
      coach: "Mauricio Pochettino",
      squad: ["Christian Pulisic", "Weston McKennie", "Matt Turner", "Timothy Weah", "Folarin Balogun", "Yunus Musah"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Quarter Finals (2002), Round of 16 (2010, 2014, 2022)",
      perfHistory: [75, 78, 80, 72, 65]
    },
    {
      name: "Paraguay",
      flag: "🇵🇾",
      group: "Group D",
      fifaRanking: 56,
      coach: "Gustavo Alfaro",
      squad: ["Julio Enciso", "Miguel Almirón", "Gustavo Gómez", "Antonio Sanabria", "Omar Alderete"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Quarterfinals (2010), Round of 16 (1986, 1998, 2002)",
      perfHistory: [65, 68, 70, 72, 71]
    },
    {
      name: "Australia",
      flag: "🇦🇺",
      group: "Group D",
      fifaRanking: 24,
      coach: "Tony Popovic",
      squad: ["Mathew Ryan", "Harry Souttar", "Jackson Irvine", "Craig Goodwin", "Mitchell Duke"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Round of 16 (2006, 2022)",
      perfHistory: [72, 74, 76, 75, 78]
    },
    {
      name: "Türkiye",
      flag: "🇹🇷",
      group: "Group D",
      fifaRanking: 26,
      coach: "Vincenzo Montella",
      squad: ["Hakan Çalhanoğlu", "Arda Güler", "Kenan Yıldız", "Barış Alper Yılmaz", "Ferdi Kadıoğlu"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "3rd Place (2002), Group Stage (1954)",
      perfHistory: [78, 80, 82, 84, 85]
    },
    {
      name: "Germany",
      flag: "🇩🇪",
      group: "Group E",
      fifaRanking: 11,
      coach: "Julian Nagelsmann",
      squad: ["Jamal Musiala", "Florian Wirtz", "Kai Havertz", "Antonio Rüdiger", "Joshua Kimmich"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "4-Time Champions (1954, 1974, 1990, 2014)",
      perfHistory: [80, 82, 85, 89, 90]
    },
    {
      name: "Côte d'Ivoire",
      flag: "🇨🇮",
      group: "Group E",
      fifaRanking: 38,
      coach: "Emerse Faé",
      squad: ["Franck Kessié", "Sébastien Haller", "Simon Adingra", "Ibrahim Sangaré", "Ousmane Diomande"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (2006, 2010, 2014)",
      perfHistory: [75, 78, 80, 82, 81]
    },
    {
      name: "Ecuador",
      flag: "🇪🇨",
      group: "Group E",
      fifaRanking: 30,
      coach: "Sebastián Beccacece",
      squad: ["Moisés Caicedo", "Piero Hincapié", "Enner Valencia", "Willian Pacho", "Kendry Páez"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Round of 16 (2006), Group Stage (2002, 2014, 2022)",
      perfHistory: [74, 76, 78, 80, 82]
    },
    {
      name: "Curaçao",
      flag: "🇨🇼",
      group: "Group E",
      fifaRanking: 90,
      coach: "Dick Advocaat",
      squad: ["Juninho Bacuna", "Leandro Bacuna", "Gervane Kastaneer", "Rangelo Janga", "Eloy Room"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "None (Debutant)",
      perfHistory: [50, 52, 55, 54, 57]
    },
    {
      name: "Netherlands",
      flag: "🇳🇱",
      group: "Group F",
      fifaRanking: 7,
      coach: "Ronald Koeman",
      squad: ["Virgil van Dijk", "Frenkie de Jong", "Memphis Depay", "Cody Gakpo", "Xavi Simons", "Nathan Aké"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Runners-up (1974, 1978, 2010), 3rd Place (2014)",
      perfHistory: [88, 90, 89, 91, 92]
    },
    {
      name: "Japan",
      flag: "🇯🇵",
      group: "Group F",
      fifaRanking: 18,
      coach: "Hajime Moriyasu",
      squad: ["Wataru Endo", "Kaoru Mitoma", "Takefusa Kubo", "Ritsu Doan", "Takumi Minamino"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Round of 16 (2002, 2010, 2018, 2022)",
      perfHistory: [82, 85, 87, 88, 89]
    },
    {
      name: "Sweden",
      flag: "🇸🇪",
      group: "Group F",
      fifaRanking: 28,
      coach: "Jon Dahl Tomasson",
      squad: ["Viktor Gyökeres", "Alexander Isak", "Dejan Kulusevski", "Emil Forsberg", "Victor Lindelöf"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Runners-up (1958), 3rd Place (1950, 1994)",
      perfHistory: [76, 78, 81, 80, 83]
    },
    {
      name: "Tunisia",
      flag: "🇹🇳",
      group: "Group F",
      fifaRanking: 41,
      coach: "Fouzai Benzarti",
      squad: ["Ellyes Skhiri", "Youssef Msakni", "Montassar Talbi", "Aissa Laidouni", "Wajdi Kechrida"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (6 times)",
      perfHistory: [68, 70, 72, 71, 74]
    },
    {
      name: "Belgium",
      flag: "🇧🇪",
      group: "Group G",
      fifaRanking: 6,
      coach: "Domenico Tedesco",
      squad: ["Kevin De Bruyne", "Romelu Lukaku", "Jérémy Doku", "Amadou Onana", "Wout Faes"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "3rd Place (2018), 4th Place (1986)",
      perfHistory: [86, 88, 87, 89, 91]
    },
    {
      name: "Egypt",
      flag: "🇪🇬",
      group: "Group G",
      fifaRanking: 31,
      coach: "Hossam Hassan",
      squad: ["Mohamed Salah", "Mostafa Mohamed", "Trézéguet", "Omar Marmoush", "Mohamed Elneny"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (1934, 1990, 2018)",
      perfHistory: [74, 76, 78, 80, 83]
    },
    {
      name: "IR Iran",
      flag: "🇮🇷",
      group: "Group G",
      fifaRanking: 20,
      coach: "Amir Ghalenoei",
      squad: ["Mehdi Taremi", "Sardar Azmoun", "Alireza Jahanbakhsh", "Samon Ghoddos", "Alireza Beiranvand"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (6 times)",
      perfHistory: [78, 81, 82, 84, 85]
    },
    {
      name: "New Zealand",
      flag: "🇳🇿",
      group: "Group G",
      fifaRanking: 94,
      coach: "Darren Bazeley",
      squad: ["Chris Wood", "Liberato Cacace", "Marko Stamenic", "Sarpreet Singh", "Kosta Barbarouses"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (1982, 2010)",
      perfHistory: [52, 55, 58, 57, 60]
    },
    {
      name: "Spain",
      flag: "🇪🇸",
      group: "Group H",
      fifaRanking: 3,
      coach: "Luis de la Fuente",
      squad: ["Lamine Yamal", "Rodri", "Pedri", "Nico Williams", "Álvaro Morata", "Dani Carvajal"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Champions (2010), 4th Place (1950)",
      perfHistory: [94, 96, 95, 97, 98]
    },
    {
      name: "Saudi Arabia",
      flag: "🇸🇦",
      group: "Group H",
      fifaRanking: 53,
      coach: "Roberto Mancini",
      squad: ["Salem Al-Dawsari", "Firas Al-Buraikan", "Mohamed Kanno", "Saud Abdulhamid", "Yasser Al-Shahrani"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Round of 16 (1994)",
      perfHistory: [68, 70, 73, 72, 75]
    },
    {
      name: "Uruguay",
      flag: "🇺🇾",
      group: "Group H",
      fifaRanking: 11,
      coach: "Marcelo Bielsa",
      squad: ["Federico Valverde", "Darwin Núñez", "Ronald Araújo", "Rodrigo Bentancur", "Manuel Ugarte"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "2-Time Champions (1930, 1950), 4th Place (2010)",
      perfHistory: [88, 90, 89, 91, 93]
    },
    {
      name: "Cabo Verde",
      flag: "🇨🇻",
      group: "Group H",
      fifaRanking: 65,
      coach: "Bubista",
      squad: ["Ryan Mendes", "Garry Rodrigues", "Bebé", "Jovane Cabral", "Logan Costa"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "None (Debutant)",
      perfHistory: [60, 64, 62, 66, 68]
    },
    {
      name: "France",
      flag: "🇫🇷",
      group: "Group I",
      fifaRanking: 2,
      coach: "Didier Deschamps",
      squad: ["Kylian Mbappé", "Antoine Griezmann", "Ousmane Dembélé", "Aurélien Tchouaméni", "William Saliba", "Theo Hernandez"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "2-Time Champions (1998, 2018)",
      perfHistory: [95, 94, 95, 92, 91]
    },
    {
      name: "Senegal",
      flag: "🇸🇳",
      group: "Group I",
      fifaRanking: 21,
      coach: "Pape Thiaw",
      squad: ["Sadio Mané", "Kalidou Koulibaly", "Nicolas Jackson", "Idrissa Gueye", "Édouard Mendy"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Quarterfinals (2002), Round of 16 (2022)",
      perfHistory: [80, 82, 85, 84, 86]
    },
    {
      name: "Iraq",
      flag: "🇮🇶",
      group: "Group I",
      fifaRanking: 55,
      coach: "Jesús Casas",
      squad: ["Aymen Hussein", "Ali Jasim", "Amir Al-Ammari", "Youssef Amyn", "Jalal Hassan"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (1986)",
      perfHistory: [65, 68, 70, 72, 74]
    },
    {
      name: "Norway",
      flag: "🇳🇴",
      group: "Group I",
      fifaRanking: 47,
      coach: "Ståle Solbakken",
      squad: ["Erling Haaland", "Martin Ødegaard", "Antonio Nusa", "Alexander Sørloth", "Sander Berge"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Round of 16 (1998)",
      perfHistory: [75, 78, 80, 81, 84]
    },
    {
      name: "Argentina",
      flag: "🇦🇷",
      group: "Group J",
      fifaRanking: 1,
      coach: "Lionel Scaloni",
      squad: ["Lionel Messi", "Lautaro Martinez", "Emiliano Martinez", "Alexis Mac Allister", "Rodrigo De Paul", "Enzo Fernandez"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "3-Time Champions (1978, 1986, 2022)",
      perfHistory: [98, 99, 97, 95, 96]
    },
    {
      name: "Algeria",
      flag: "🇩🇿",
      group: "Group J",
      fifaRanking: 44,
      coach: "Vladimir Petković",
      squad: ["Riyad Mahrez", "Said Benrahma", "Amine Gouiri", "Ismaël Bennacer", "Aissa Mandi"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Round of 16 (2014)",
      perfHistory: [72, 75, 78, 76, 79]
    },
    {
      name: "Austria",
      flag: "🇦🇹",
      group: "Group J",
      fifaRanking: 23,
      coach: "Ralf Rangnick",
      squad: ["Marcel Sabitzer", "Konrad Laimer", "Christoph Baumgartner", "Michael Gregoritsch", "Kevin Danso"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "3rd Place (1954), 4th Place (1934)",
      perfHistory: [78, 80, 82, 81, 84]
    },
    {
      name: "Jordan",
      flag: "🇯🇴",
      group: "Group J",
      fifaRanking: 68,
      coach: "Jamal Sellami",
      squad: ["Musa Al-Taamari", "Yazan Al-Naimat", "Ali Olwan", "Nizar Al-Rashdan", "Yazeed Abulaila"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "None (Debutant)",
      perfHistory: [60, 62, 65, 63, 66]
    },
    {
      name: "Portugal",
      flag: "🇵🇹",
      group: "Group K",
      fifaRanking: 8,
      coach: "Roberto Martínez",
      squad: ["Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva", "Rafael Leão", "Rúben Dias", "João Félix"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "3rd Place (1966), 4th Place (2006)",
      perfHistory: [90, 92, 91, 93, 94]
    },
    {
      name: "Colombia",
      flag: "🇨🇴",
      group: "Group K",
      fifaRanking: 9,
      coach: "Néstor Lorenzo",
      squad: ["Luis Díaz", "James Rodríguez", "Jhon Durán", "Richard Ríos", "Daniel Muñoz"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Quarterfinals (2014), Round of 16 (1990, 2018)",
      perfHistory: [88, 90, 89, 91, 92]
    },
    {
      name: "Uzbekistan",
      flag: "🇺🇿",
      group: "Group K",
      fifaRanking: 60,
      coach: "Srečko Katanec",
      squad: ["Eldor Shomurodov", "Abbosbek Fayzullaev", "Oston Urunov", "Jaloliddin Masharipov", "Utkir Yusupov"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "None (Debutant)",
      perfHistory: [62, 65, 68, 66, 70]
    },
    {
      name: "DR Congo",
      flag: "🇨🇩",
      group: "Group K",
      fifaRanking: 58,
      coach: "Sébastien Desabre",
      squad: ["Yoane Wissa", "Chancel Mbemba", "Meschack Elia", "Samuel Moutoussamy", "Arthur Masuaku"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (1974 as Zaire)",
      perfHistory: [62, 64, 66, 65, 68]
    },
    {
      name: "England",
      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      group: "Group L",
      fifaRanking: 4,
      coach: "Thomas Tuchel",
      squad: ["Harry Kane", "Jude Bellingham", "Phil Foden", "Bukayo Saka", "Declan Rice", "John Stones"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Champions (1966), 4th Place (1990, 2018)",
      perfHistory: [92, 94, 93, 95, 96]
    },
    {
      name: "Croatia",
      flag: "🇭🇷",
      group: "Group L",
      fifaRanking: 10,
      coach: "Zlatko Dalić",
      squad: ["Luka Modrić", "Mateo Kovačić", "Joško Gvardiol", "Andrej Kramarić", "Ivan Perišić", "Dominik Livaković"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Runners-up (2018), 3rd Place (1998, 2022)",
      perfHistory: [85, 87, 88, 86, 89]
    },
    {
      name: "Ghana",
      flag: "🇬🇭",
      group: "Group L",
      fifaRanking: 64,
      coach: "Otto Addo",
      squad: ["Mohammed Kudus", "Inaki Williams", "Thomas Partey", "Jordan Ayew", "Antoine Semenyo"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Quarterfinals (2010), Round of 16 (2006)",
      perfHistory: [64, 66, 68, 67, 70]
    },
    {
      name: "Panama",
      flag: "🇵🇦",
      group: "Group L",
      fifaRanking: 37,
      coach: "Thomas Christiansen",
      squad: ["Adalberto Carrasquilla", "José Fajardo", "Aníbal Godoy", "Michael Amir Murillo", "Orlando Mosquera"],
      stats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
      previousWC: "Group Stage (2018)",
      perfHistory: [68, 70, 72, 71, 74]
    }
  ],

  predictions: [
    {
      matchId: "m1",
      userId: "u1",
      predictedWinner: "B" as const, // Nepal wins
      predictedScoreA: 1,
      predictedScoreB: 2,
      firstGoalTeam: "A" as const,
      firstGoalScorer: "Christian Pulisic",
      totalGoals: 3,
      possession: 48,
      manOfTheMatch: "Manish Dangi",
      status: "processed" as const,
      pointsGranted: 130 // Correct winner(10) + exact score(50) + first goal team(15) + scorer (30) + MOM (25)
    }
  ],

  liveQuestions: [],

  dishHomeQuestions: [
    {
      id: "dh1",
      text: "How many active DishHome customers purchased the commercial FIFA World Cup 2026 Package in Nepal today?",
      options: ["Below 50,000", "50,000 - 100,000", "100,001 - 150,000", "Above 150,000", "Others (अन्य)"],
      points: 150,
      deadline: new Date(Date.now() + 86400000).toISOString(), // 24 hours
      correctAnswer: "100,001 - 150,000"
    }
  ],

  dishHomeUserSubmissions: [
    { userId: "u1", questionId: "dh1", submittedAnswer: "100,001 - 150,000" }
  ],

  userLiveAnswers: [] as Array<{
    userId: string;
    questionId: string;
    answer: string;
    pointsGranted: number;
    checked: boolean;
  }>,

  chats: [
    {
      id: "ch1",
      userName: "Birat Gorkhali",
      country: "Nepal",
      message: "Jay Nepal! Manish Dangi with the absolute world class header! Let's hold this lead lads!",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      reactions: { "🔥": 8, "🙌": 5 }
    },
    {
      id: "ch2",
      userName: "Taylor Smith",
      country: "USA",
      message: "Nepal is playing solid defense. Still plenty of time for Pulisic to save us. Come on, USA!",
      timestamp: new Date(Date.now() - 150000).toISOString(),
      reactions: { "⚽": 3, "👀": 2 }
    }
  ],

  winnersTicker: [
    { id: "tick1", text: "Sah Rolex just won NRs. 10,000 for perfect match prediction on USA vs Nepal!" },
    { id: "tick2", text: "Alex Johnson climbed to Silver Predictor badge rank and earned free match ticket!" },
    { id: "tick3", text: "NepaliFan99 predicted exact score of Argentina vs France and secured NRs. 5,000!" }
  ],

  paymentTransactions: [
    {
      id: "tx1",
      userId: "u1",
      amount: 500,
      gateway: "eSewa",
      merchantTxId: "ESEW_11029384",
      status: "SUCCESS",
      timestamp: "2026-06-08T10:30:00Z"
    },
    {
      id: "tx2",
      userId: "u2",
      amount: 500,
      gateway: "PayPal",
      merchantTxId: "PAYPAL_9921782A",
      status: "SUCCESS",
      timestamp: "2026-06-09T01:15:00Z"
    }
  ],

  securityLogs: [
    { id: "sl1", timestamp: new Date().toISOString(), type: "SYSTEM", detail: "FIFA 2026 Game Predict platform engine booted." }
  ]
};

const SERVER_DATA_DIR = path.join(process.cwd(), "server_data");
if (!fs.existsSync(SERVER_DATA_DIR)) {
  fs.mkdirSync(SERVER_DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(SERVER_DATA_DIR, "db.json");

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(DB, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write to DB_FILE:", err);
  }
}

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        Object.assign(DB, parsed);
        console.log("DB Loaded successfully from db.json");
      }
    } else {
      saveDB();
    }
  } catch (err) {
    console.error("Failed to load DB_FILE, using defaults:", err);
  }
}

// Load DB immediately
loadDB();

// ============================================================================
// DYNAMIC PREDICTION POINTS RECALCULATION & LEADERBOARD SYNC SYSTEM
// ============================================================================
function recalculateAllPredictionPoints() {
  if (!DB.audit_logs) {
    DB.audit_logs = [];
  }
  
  // Backfill missing schema properties for early prediction iterations
  DB.predictions.forEach((pred: any) => {
    if (!pred.id) {
      pred.id = "pred_" + Math.floor(Math.random() * 1000000);
    }
    if (!pred.timestamp) {
      pred.timestamp = new Date().toISOString();
    }
  });

  // Zero-out scores of all database users to perform clear cumulative sums
  DB.users.forEach((user: any) => {
    user.winnerPoints = 0;
    user.goalPoints = 0;
    user.exactScoreCount = 0;
    user.earliestPredictionTime = Infinity;
    user.newTotalPoints = 0;
  });

  // Calculate winner & score correctness for ALL finalized match prediction sub-selections
  DB.predictions.forEach((pred: any) => {
    const match = DB.matches.find((m: any) => m.id === pred.matchId);
    if (match && match.status === "completed") {
      const finalWinner = match.scoreA > match.scoreB ? "A" : match.scoreA < match.scoreB ? "B" : "draw";
      
      const winnerCorrect = pred.predictedWinner === finalWinner;
      const scoreCorrect = Number(pred.predictedScoreA) === Number(match.scoreA) && Number(pred.predictedScoreB) === Number(match.scoreB);
      
      pred.winnerCorrect = winnerCorrect;
      pred.scoreCorrect = scoreCorrect;

      // Rule: Exactly 5 points for matching score. Exactly 3 points for winning team/draw prediction when score differs.
      if (scoreCorrect) {
        pred.winnerPointsGranted = 3;
        pred.goalPointsGranted = 2; // 3 + 2 = 5 total
      } else if (winnerCorrect) {
        pred.winnerPointsGranted = 3;
        pred.goalPointsGranted = 0; // 3 total
      } else {
        pred.winnerPointsGranted = 0;
        pred.goalPointsGranted = 0; // 0 total
      }
      pred.pointsGranted = pred.winnerPointsGranted + pred.goalPointsGranted;
      pred.status = "processed";
      
      // Update individual user metrics
      const user = DB.users.find((u: any) => u.id === pred.userId);
      if (user) {
        user.winnerPoints = (user.winnerPoints || 0) + pred.winnerPointsGranted;
        user.goalPoints = (user.goalPoints || 0) + pred.goalPointsGranted;
        user.newTotalPoints = user.winnerPoints + user.goalPoints;
        if (scoreCorrect) {
          user.exactScoreCount = (user.exactScoreCount || 0) + 1;
        }
      }
    } else {
      // Unresolved upcoming or live match prediction states
      pred.winnerCorrect = false;
      pred.scoreCorrect = false;
      pred.winnerPointsGranted = 0;
      pred.goalPointsGranted = 0;
      pred.pointsGranted = 0;
      if (!pred.status || pred.status === "processed") {
        pred.status = "pending";
      }
    }
  });

  // Backfill nonPredictionPoints if not defined yet
  DB.users.forEach((user: any) => {
    if (user.nonPredictionPoints === undefined) {
      let oldPredPoints = 0;
      DB.predictions.forEach((pred: any) => {
        if (pred.userId === user.id && pred.status === "processed" && pred.pointsGranted !== undefined) {
          oldPredPoints += pred.pointsGranted;
        }
      });
      user.nonPredictionPoints = Math.max(0, (user.points || 0) - oldPredPoints);
    }
  });

  // Calculate earliest prediction timestamp for each user to break ties
  DB.predictions.forEach((pred: any) => {
    const user = DB.users.find((u: any) => u.id === pred.userId);
    if (user && pred.timestamp) {
      const ms = new Date(pred.timestamp).getTime();
      if (!isNaN(ms)) {
        user.earliestPredictionTime = Math.min(user.earliestPredictionTime || Infinity, ms);
      }
    }
  });

  // Update total cumulative user.points using backfilled nonPredictionPoints
  DB.users.forEach((user: any) => {
    user.points = (user.nonPredictionPoints || 0) + (user.winnerPoints || 0) + (user.goalPoints || 0);
  });

  // Calculate ranks based on new calculate system totals with tie break order:
  // 1. Total points (descending)
  // 2. Exact score prediction count (descending)
  // 3. Earliest prediction time (ascending)
  const sortedUsersList = [...DB.users].sort((a: any, b: any) => {
    if ((b.points || 0) !== (a.points || 0)) {
      return (b.points || 0) - (a.points || 0);
    }
    if ((b.exactScoreCount || 0) !== (a.exactScoreCount || 0)) {
      return (b.exactScoreCount || 0) - (a.exactScoreCount || 0);
    }
    const timeA = a.earliestPredictionTime !== undefined ? a.earliestPredictionTime : Infinity;
    const timeB = b.earliestPredictionTime !== undefined ? b.earliestPredictionTime : Infinity;
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    return a.id.localeCompare(b.id);
  });

  sortedUsersList.forEach((u: any, idx: number) => {
    const userObj = DB.users.find((usr: any) => usr.id === u.id);
    if (userObj) {
      userObj.calculatedRank = idx + 1;
    }
  });

  saveDB();
}

function logAdminAudit(action: string, operator: string, detail: string) {
  if (!DB.audit_logs) {
    DB.audit_logs = [];
  }
  DB.audit_logs.unshift({
    id: "audit_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    action,
    operator,
    detail
  });
  saveDB();
}

// Perform initial backfill on startup
recalculateAllPredictionPoints();

// Auto-seed default winner questions for all 15 key group stage matches under Nepali Time (NPT)
DB.liveQuestions = DB.matches.map((m: any) => ({
  id: `q_win_${m.id}`,
  matchId: m.id,
  text: `${m.teamA} vs ${m.teamB} - २ जनामध्ये कसले जित्छ होला? (Who will win?)`,
  options: [m.teamA, "DRAW (बराबरी)", m.teamB],
  points: 50,
  expiresAt: new Date(new Date(m.startTime).getTime() + 2592000000).toISOString(), // robust 30-day lifecycle
  status: "active" as const
}));

// --- AUTH ROUTINGS ---
app.post("/api/auth/register", (req, res) => {
  const { name, email, mobile, country, password, username, employeeId } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name (नाम) is a REQUIRED field and cannot be empty." });
  }

  const trimmedName = name.trim();

  // Check for duplicate names (Full Name)
  const duplicateName = DB.users.find(
    (u: any) => u.name && u.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicateName) {
    return res.status(400).json({ error: "Duplicate Full Name NOT allowed! This name is already registered." });
  }

  if (!username || !username.trim()) {
    return res.status(400).json({ error: "Username is a REQUIRED field and cannot be empty." });
  }

  if (employeeId === undefined || employeeId === "" || employeeId === null) {
    return res.status(400).json({ error: "Employee ID is REQUIRED." });
  }

  const trimmedUsername = username.trim();
  const trimmedEmployeeId = String(employeeId).trim();

  // Validate employeeId format: Must be numeric e.g., 104, 205
  if (!/^\d+$/.test(trimmedEmployeeId)) {
    return res.status(400).json({ error: "Employee ID must be fully numeric (digits only, e.g., 104, 205) and cannot be empty." });
  }

  const numericEmployeeId = Number(trimmedEmployeeId);

  // Check for duplicates
  const duplicateUser = DB.users.find(
    (u: any) => u.username && u.username.toLowerCase() === trimmedUsername.toLowerCase()
  );
  if (duplicateUser) {
    return res.status(400).json({ error: "Duplicate username NOT allowed! Please select a unique username." });
  }

  const duplicateEmp = DB.users.find(
    (u: any) => u.employeeId && Number(u.employeeId) === numericEmployeeId
  );
  if (duplicateEmp) {
    return res.status(400).json({ error: "Duplicate Employee ID NOT allowed! This Employee ID is already registered." });
  }

  // Check email / mobile (if provided)
  if (email) {
    const dupeEmail = DB.users.find((u: any) => u.email === email);
    if (dupeEmail) {
      return res.status(400).json({ error: "Email address is already registered in our system." });
    }
  }
  if (mobile) {
    const dupeMobile = DB.users.find((u: any) => u.mobile === mobile);
    if (dupeMobile) {
      return res.status(400).json({ error: "Mobile number is already registered in our system." });
    }
  }

  const newUser = {
    id: "u_" + (DB.users.length + 1),
    name,
    username: trimmedUsername,
    employeeId: numericEmployeeId,
    email,
    mobile: mobile || "",
    country: country || "Nepal",
    password: password || "",
    isPaid: true, // admin auto-premium
    points: 999,
    accuracy: 100,
    predictionsCompleted: 0,
    badge: "World Champion" as const,
    rank: DB.users.length + 1,
    referralCode: name.split(" ")[0].toUpperCase() + Math.floor(1000 + Math.random() * 9000),
    referredCount: 0,
    dailyCheckInChain: 0,
  };

  DB.users.push(newUser);
  saveDB(); // Persist registration instantly

  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "AUTH_REGISTER",
    detail: `Tournament player ${newUser.name} (@${newUser.username}, Emp ID: ${newUser.employeeId}) registered successfully.`
  });

  res.status(201).json({ success: true, message: "Credential registered successfully.", user: newUser });
});

app.get("/api/auth/google/config", (req, res) => {
  res.json({
    googleClientId: DB.googleClientId || process.env.GOOGLE_CLIENT_ID || "",
    appUrl: DB.appUrl || process.env.APP_URL || "https://ais-dev-fobbkftlwlcym2ibsx2skn-424276435851.asia-east1.run.app"
  });
});

app.post("/api/auth/google", (req, res) => {
  const { email, name, credential } = req.body;
  
  let finalEmail = email;
  let finalName = name;
  let finalPicture = "";
  let isVerified = false;

  if (credential) {
    try {
      const parts = credential.split(".");
      if (parts.length === 3) {
        // Safe standard Base64url URL-safe decoding in Node.js
        const decodedPayload = Buffer.from(parts[1], "base64").toString("utf8");
        const payload = JSON.parse(decodedPayload);
        if (payload.email) {
          finalEmail = payload.email;
          finalName = payload.name || payload.given_name || payload.email.split("@")[0].toUpperCase();
          finalPicture = payload.picture || "";
          isVerified = true;
        }
      }
    } catch (err) {
      console.error("JWT decoding failed:", err);
    }
  }

  if (!finalEmail) {
    return res.status(400).json({ error: "Gmail address is required for Google certification." });
  }

  // Prevent users from logging with Google claiming admin emails unless it actually matches
  if (finalEmail === "ranjansanjit@gmail.com" || finalEmail === "ranjansanjit2023@gmail.com") {
    const adminUser = DB.users.find((u: any) => u.email === finalEmail);
    if (adminUser) {
      adminUser.googleVerified = isVerified;
      if (finalPicture) adminUser.picture = finalPicture;
      return res.json({ success: true, user: adminUser, message: isVerified ? "Google verified login success" : "Standard login success" });
    }
  }

  let user = DB.users.find((u: any) => u.email === finalEmail);
  if (!user) {
    user = {
      id: "u_g_" + (DB.users.length + 1),
      name: finalName || finalEmail.split("@")[0].toUpperCase(),
      email: finalEmail,
      mobile: "",
      country: "Nepal",
      isPaid: false,
      points: 100, // starting bonus
      accuracy: 0,
      predictionsCompleted: 0,
      badge: "Bronze Predictor",
      rank: DB.users.length + 1,
      referralCode: finalEmail.split("@")[0].toUpperCase() + Math.round(1000 + Math.random() * 9000),
      referredCount: 0,
      dailyCheckInChain: 0,
      authMethod: "Google",
      googleVerified: isVerified,
      picture: finalPicture
    };
    DB.users.push(user);
    DB.securityLogs.push({
      id: "sl_" + Date.now(),
      timestamp: new Date().toISOString(),
      type: "AUTH_GOOGLE",
      detail: `New player ${user.name} signed up via Google Account (${finalEmail}). Verified Logo: ${isVerified}`
    });
  } else {
    user.googleVerified = isVerified;
    if (finalPicture) user.picture = finalPicture;
    DB.securityLogs.push({
      id: "sl_" + Date.now(),
      timestamp: new Date().toISOString(),
      type: "AUTH_GOOGLE",
      detail: `Player ${user.name} logged in via Google Account (${finalEmail}). Verified Logo: ${isVerified}`
    });
  }

  res.json({ success: true, user });
});

app.post("/api/auth/dishhome", (req, res) => {
  const { dishHomeId, name, phone } = req.body;
  if (!dishHomeId) {
    return res.status(400).json({ error: "DishHome customer Subscriber ID is required." });
  }

  let user = DB.users.find((u: any) => u.dishHomeId === dishHomeId);
  if (!user) {
    user = {
      id: "u_dh_" + (DB.users.length + 1),
      name: name || `DishHome ID #${dishHomeId}`,
      email: `${dishHomeId}@dishhome.com.np`,
      mobile: phone || "",
      country: "Nepal",
      dishHomeId,
      isPaid: false,
      points: 150, // Special DishHome premium starter point
      accuracy: 0,
      predictionsCompleted: 0,
      badge: "Bronze Predictor",
      rank: DB.users.length + 1,
      referralCode: "DH" + dishHomeId,
      referredCount: 0,
      dailyCheckInChain: 0,
      authMethod: "DishHome"
    };
    DB.users.push(user);
    DB.securityLogs.push({
      id: "sl_" + Date.now(),
      timestamp: new Date().toISOString(),
      type: "AUTH_DISHHOME",
      detail: `New player registered via DishHome Subscriber ID ${dishHomeId}.`
    });
  } else {
    DB.securityLogs.push({
      id: "sl_" + Date.now(),
      timestamp: new Date().toISOString(),
      type: "AUTH_DISHHOME",
      detail: `Player ${user.name} logged in via DishHome ID ${dishHomeId}.`
    });
  }

  res.json({ success: true, user });
});

app.post("/api/auth/login", (req, res) => {
  const { emailOrMobile, password } = req.body;
  if (!emailOrMobile || !password) {
    return res.status(400).json({ error: "Email/Mobile and Password required" });
  }

  // Check email, mobile, username, employee ID or dishHomeId for standard profiles
  const user = DB.users.find(
    (u: any) =>
      u.email === emailOrMobile || 
      u.mobile === emailOrMobile || 
      u.dishHomeId === emailOrMobile ||
      (u.username && u.username.toLowerCase() === String(emailOrMobile).toLowerCase()) ||
      (u.employeeId && String(u.employeeId) === String(emailOrMobile))
  );

  if (!user) {
    return res.status(401).json({ error: "No user account matches standard credentials. Please enter a valid registered username, employee ID, mobile, or email." });
  }

  if (user.isDisabled) {
    return res.status(401).json({ error: "This account has been suspended or disabled under administrative terms." });
  }

  // Verify PIN / Password if one is on file
  if (user.password && user.password !== password) {
    return res.status(401).json({ error: "Credentials match failed! Incorrect security Password or login PIN code." });
  }

  // Check if standard admin / superadmin / custom admin
  const isAdmin = user.role === "superadmin" || user.role === "admin" || user.email === "ranjansanjit@gmail.com" || user.email === "ranjansanjit2023@gmail.com";

  if (isAdmin) {
    DB.securityLogs.push({
      id: "sl_" + Date.now(),
      timestamp: new Date().toISOString(),
      type: "AUTH_ADMIN",
      detail: `Administrator ${user.name} (${user.email}) logged in successfully.`
    });
    return res.json({ success: true, token: "jwt-simulated-token-role-admin", user });
  }

  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "AUTH_LOGIN",
    detail: `User ${user.name} logged in via standard authentication.`
  });

  res.json({ success: true, token: "jwt-simulated-token-role-user", user });
});

app.post("/api/auth/check-in", (req, res) => {
  const { userId } = req.body;
  const user = DB.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const todayStr = new Date().toISOString().split("T")[0];
  if (user.lastCheckIn === todayStr) {
    return res.status(400).json({ error: "Already checked in today" });
  }

  user.dailyCheckInChain += 1;
  const checkInEarned = 25 * user.dailyCheckInChain;
  user.points += checkInEarned;
  if (user.nonPredictionPoints !== undefined) {
    user.nonPredictionPoints = (user.nonPredictionPoints || 0) + checkInEarned;
  }
  user.lastCheckIn = todayStr;

  res.json({
    success: true,
    message: `Checked in! You earned ${25 * user.dailyCheckInChain} points. Daily streak: ${user.dailyCheckInChain} days`,
    user
  });
});

app.get("/api/users/:userId", (req, res) => {
  const { userId } = req.params;
  const user = DB.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ success: true, user });
});

app.post("/api/users/add-points", (req, res) => {
  const { userId, points } = req.body;
  const user = DB.users.find((u: any) => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.points = (user.points || 0) + Number(points);
  if (user.nonPredictionPoints !== undefined) {
    user.nonPredictionPoints = (user.nonPredictionPoints || 0) + Number(points);
  }

  // Add winner ticker entry
  DB.winnersTicker.unshift({
    id: "tick_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    text: `🎉 REWARD: ${user.name} earned +${points} PTS on Lucky Draw Spin Wheel!`
  });

  res.json({ success: true, message: "Points saved successfully!", points: user.points });
});

// --- MATCH SERVICES ---
app.get("/api/matches", (req, res) => {
  const { role } = req.query;
  if (role === "admin" || role === "superadmin") {
    return res.json(DB.matches);
  }
  return res.json(DB.matches.filter((m: any) => !m.is_hidden));
});

// --- PREDICTIONS ROUTINGS ---
app.get("/api/predictions/:userId", (req, res) => {
  const userPreds = DB.predictions.filter((p) => p.userId === req.params.userId);
  res.json(userPreds);
});

app.post("/api/predictions", (req, res) => {
  const {
    userId,
    matchId,
    predictedWinner,
    predictedScoreA,
    predictedScoreB,
    firstGoalTeam,
    firstGoalScorer,
    totalGoals,
    possession,
    manOfTheMatch,
  } = req.body;

  const match = DB.matches.find((m) => m.id === matchId);
  if (!match) return res.status(404).json({ error: "Match not found" });

  if (match.status !== "upcoming" || match.locked) {
    return res.status(400).json({ error: "Match has already started or completed. Predictions are closed!" });
  }

  const matchDate = new Date(match.startTime);
  const now = new Date();

  // 1. After match start -> NOT allowed
  if (now.getTime() >= matchDate.getTime()) {
    return res.status(400).json({ error: "After match start → NOT allowed. Predictions are locked!" });
  }

  // Calculate day difference in local calendar dates
  const matchYear = matchDate.getFullYear();
  const matchMonth = matchDate.getMonth();
  const matchDay = matchDate.getDate();

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const nowDay = now.getDate();

  const matchMidnight = new Date(matchYear, matchMonth, matchDay);
  const nowMidnight = new Date(nowYear, nowMonth, nowDay);

  const diffTime = matchMidnight.getTime() - nowMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return res.status(400).json({ error: "Same day prediction → NOT allowed. Predictions close at midnight of the match's eve." });
  } else if (diffDays > 1) {
    return res.status(400).json({ error: "More than 1 day before → NOT allowed. Predictions open exactly 1 day before the match date." });
  } else if (diffDays < 0) {
    return res.status(400).json({ error: "Match has already concluded." });
  }

  // Find current user profile
  const predictingUser = DB.users.find((u) => u.id === userId);
  if (!predictingUser) {
    return res.status(404).json({ error: "User profile not found." });
  }

  // Prevent same employee ID from predicting the same match multiple times
  const userEmpId = predictingUser.employeeId;
  const duplicatePred = DB.predictions.find((p) => {
    if (p.matchId !== matchId) return false;
    const pUser = DB.users.find((u) => u.id === p.userId);
    return pUser && Number(pUser.employeeId) === Number(userEmpId);
  });

  if (duplicatePred) {
    return res.status(400).json({ error: "Already Predicted! This Employee ID (कर्मचारी आईडी) has already submitted a prediction for this match." });
  }

  const newPrediction = {
    id: "pred_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
    matchId,
    userId,
    predictedWinner,
    predictedScoreA: Number(predictedScoreA),
    predictedScoreB: Number(predictedScoreB),
    firstGoalTeam,
    firstGoalScorer,
    totalGoals: Number(totalGoals),
    possession: Number(possession),
    manOfTheMatch,
    status: "pending" as const,
    pointsGranted: 0,
    timestamp: new Date().toISOString(),
  };

  DB.predictions.push(newPrediction);

  // Increment predictions count
  const user = DB.users.find((u) => u.id === userId);
  if (user) {
    user.predictionsCompleted += 1;
  }

  saveDB(); // Persist prediction

  res.status(201).json({ success: true, message: "Prediction submitted successfully!", prediction: newPrediction });
});

// --- LIVE QUESTIONS ---
app.get("/api/live-questions", (req, res) => {
  const activeQuestions = DB.liveQuestions.filter((q) => q.status === "active");
  res.json(activeQuestions);
});

app.post("/api/live-questions/submit", (req, res) => {
  const { userId, questionId, answer } = req.body;
  const question = DB.liveQuestions.find((q) => q.id === questionId);

  if (!question) return res.status(404).json({ error: "Question not found" });
  if (question.status !== "active") return res.status(400).json({ error: "Question is expired" });

  // Remove duplicate submission if existing
  DB.userLiveAnswers = DB.userLiveAnswers.filter(
    (la) => !(la.userId === userId && la.questionId === questionId)
  );

  DB.userLiveAnswers.push({
    userId,
    questionId,
    answer,
    pointsGranted: 0,
    checked: false,
  });

  res.json({ success: true, message: "Live answer submitted!" });
});

// --- DISHHOME QUESTION ---
app.get("/api/dishhome-questions", (req, res) => {
  res.json(DB.dishHomeQuestions);
});

app.post("/api/dishhome-questions/submit", (req, res) => {
  const { userId, questionId, submittedAnswer } = req.body;
  const question = DB.dishHomeQuestions.find((q) => q.id === questionId);
  if (!question) return res.status(404).json({ error: "DishHome question not found" });

  // Filter out duplicates
  DB.dishHomeUserSubmissions = DB.dishHomeUserSubmissions.filter(
    (sub) => !(sub.userId === userId && sub.questionId === questionId)
  );

  DB.dishHomeUserSubmissions.push({ userId, questionId, submittedAnswer });
  res.json({ success: true, message: "Answer recorded! Real-time points will compute automatically once deadline finishes." });
});

// --- PAYMENTS ---
app.get("/api/payment/config", (req, res) => {
  res.json(DB.paymentConfig);
});

app.post("/api/payment/pay", (req, res) => {
  const { userId, amount, gateway, txId } = req.body;
  const user = DB.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Create mock payment transaction record
  const transaction = {
    id: "tx" + (DB.paymentTransactions.length + 1),
    userId,
    amount,
    gateway,
    merchantTxId: txId || gateway.toUpperCase() + "_" + Math.floor(10000000 + Math.random() * 90000000),
    status: "SUCCESS",
    timestamp: new Date().toISOString(),
  };

  DB.paymentTransactions.push(transaction);
  user.isPaid = true;

  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "PAYMENT",
    detail: `User ${user.name} paid entry fee NRs.${amount} via ${gateway}. verified instantly.`
  });

  res.json({ success: true, message: `Payment verified successfully via ${gateway}! Welcome to premium predictions.`, transaction });
});

app.get("/api/payment/history/:userId", (req, res) => {
  const txs = DB.paymentTransactions.filter((tx) => tx.userId === req.params.userId);
  res.json(txs);
});

// --- CHAT SERVICES ---
app.get("/api/chat", (req, res) => {
  res.json(DB.chats);
});

app.post("/api/chat", (req, res) => {
  const { userName, country, message, sticker } = req.body;
  if (!message && !sticker) {
    return res.status(400).json({ error: "Cannot send empty chat message" });
  }

  // Basic anti-spam & auto AI moderation check helper
  const isSpam = ["fuck", "spam", "scam", "shitty"].some((badWord) =>
    (message || "").toLowerCase().includes(badWord)
  );

  if (isSpam) {
    return res.status(400).json({ error: "AI Moderation: Rule violation. Message blocked recursively under anti-spam policy." });
  }

  const newChat = {
    id: "ch" + (DB.chats.length + 1),
    userName: userName || "Anonymous Fan",
    country: country || "FIFA Fan",
    message: message || "",
    sticker,
    timestamp: new Date().toISOString(),
    reactions: {},
  };

  DB.chats.push(newChat);
  if (DB.chats.length > 50) {
    DB.chats.shift(); // Keep logs clean
  }

  res.status(201).json(newChat);
});

app.post("/api/chat/react", (req, res) => {
  const { chatId, emoji } = req.body;
  const chat = DB.chats.find((c) => c.id === chatId);
  if (!chat) return res.status(404).json({ error: "Chat message not found" });

  if (!chat.reactions[emoji]) {
    chat.reactions[emoji] = 0;
  }
  chat.reactions[emoji] += 1;

  res.json(chat);
});

// --- LEADERBOARDS ---
app.get("/api/leaderboard", (req, res) => {
  const { filter, country } = req.query;
  
  // Sort users by points desc
  let result = DB.users.map((u, i) => ({
    userId: u.id,
    name: u.name,
    country: u.country,
    points: u.points,
    accuracy: u.accuracy,
    badge: u.badge,
    rank: i + 1, // dynamically recalculated
  })).sort((a, b) => b.points - a.points);

  // Apply ranks
  result.forEach((item, index) => {
    item.rank = index + 1;
  });

  if (country) {
    result = result.filter((r) => r.country.toLowerCase() === (country as string).toLowerCase());
  }

  res.json(result);
});

// --- PRIZES AND TICKERS ---
app.get("/api/prizes", (req, res) => {
  res.json({
    winners: DB.winnersTicker,
    categories: [
      { id: "p1", level: "Match Prize", reward: "NRs. 5,000 / Match Winner", rules: "Top score for the individual match prediction" },
      { id: "p2", level: "Weekly Prize", reward: "NRs. 25,000", rules: "Highest accumulator winner each week" },
      { id: "p3", level: "Grand World Champion Prize", reward: "NRs. 150,000 + Official FIFA Smart Trophy", rules: "Top of Global Leaderboard at final whistle on 19 July 2026" },
    ]
  });
});

// --- TEAM DATABASE ---
app.get("/api/teams", (req, res) => {
  const { role } = req.query;
  if (role === "admin" || role === "superadmin") {
    return res.json(DB.teams);
  }
  return res.json(DB.teams.filter((t: any) => !t.is_hidden));
});

// --- ADMIN / SUPER ADMIN TEAM CRUD & VISIBILITY CONTROLS ---
app.post("/api/admin/teams/create", (req, res) => {
  const { name, coach, previousWC, fifaRanking, stars, group, flag } = req.body;
  if (!name) return res.status(400).json({ error: "Team name is required." });

  const duplicate = DB.teams.find((t: any) => t.name.toLowerCase() === name.toLowerCase());
  if (duplicate) return res.status(400).json({ error: "Duplicate team name is NOT allowed." });

  const newTeam = {
    id: "team_" + (DB.teams.length + 1) + "_" + Math.floor(Math.random() * 1000),
    name,
    coach: coach || "TBD",
    previousWC: previousWC || "TBD",
    fifaRanking: Number(fifaRanking || 50),
    stars: Number(stars || 3),
    group: group || "A",
    flag: flag || "🏳️",
    is_hidden: false
  };

  DB.teams.push(newTeam);
  saveDB();

  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "TEAM_CREATED",
    detail: `Team ${newTeam.name} created successfully.`
  });

  res.status(201).json({ success: true, team: newTeam });
});

app.post("/api/admin/teams/edit", (req, res) => {
  const { id, name, coach, previousWC, fifaRanking, stars, group, flag } = req.body;
  const team = DB.teams.find((t: any) => t.id === id);
  if (!team) return res.status(404).json({ error: "Team not found." });

  if (name !== undefined) team.name = name;
  if (coach !== undefined) team.coach = coach;
  if (previousWC !== undefined) team.previousWC = previousWC;
  if (fifaRanking !== undefined) team.fifaRanking = Number(fifaRanking);
  if (stars !== undefined) team.stars = Number(stars);
  if (group !== undefined) team.group = group;
  if (flag !== undefined) team.flag = flag;

  saveDB();

  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "TEAM_EDITED",
    detail: `Team ID ${id} was edited.`
  });

  res.json({ success: true, team });
});

app.post("/api/admin/teams/toggle-hidden", (req, res) => {
  const { id } = req.body;
  const team = DB.teams.find((t: any) => t.id === id);
  if (!team) return res.status(404).json({ error: "Team not found." });

  team.is_hidden = !team.is_hidden;
  saveDB();

  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "TEAM_TOGGLE_HIDDEN",
    detail: `Team ${team.name} visibility toggled. Hidden: ${team.is_hidden}`
  });

  res.json({ success: true, team });
});

app.post("/api/admin/match/toggle-hidden", (req, res) => {
  const { id } = req.body;
  const match = DB.matches.find((m: any) => m.id === id);
  if (!match) return res.status(404).json({ error: "Match not found." });

  match.is_hidden = !match.is_hidden;
  saveDB();

  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "MATCH_TOGGLE_HIDDEN",
    detail: `Match ID ${id} visibility toggled. Hidden: ${match.is_hidden}`
  });

  res.json({ success: true, match });
});

// --- GEMINI POWERED INSIGHTS ---
app.post("/api/gemini/insights", async (req, res) => {
  const { teamA, teamB } = req.body;
  if (!teamA || !teamB) {
    return res.status(400).json({ error: "Please choose two teams to analyze." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant high-fidelity analytics fallback if Gemini key is missing
    const tA = DB.teams.find((t) => t.name.toLowerCase() === teamA.toLowerCase()) || { coach: "TBD", previousWC: "TBD", fifaRanking: 99 };
    const tB = DB.teams.find((t) => t.name.toLowerCase() === teamB.toLowerCase()) || { coach: "TBD", previousWC: "TBD", fifaRanking: 99 };

    const simulatedAnalysis = `### ⚽ AI MATCH INSIGHTS: ${teamA} vs ${teamB} (SIMULATED ANALYTICS)

As the Gemini API is running in offline preview, our analytical recommendation engine calculates performance ratios dynamically:

1. **Team Standing Check**: 
   - **${teamA}** (FIFA Rank: #${tA.fifaRanking}) led by **${tA.coach}**. World Cup Record: *${tA.previousWC}*.
   - **${teamB}** (FIFA Rank: #${tB.fifaRanking}) led by **${tB.coach}**. World Cup Record: *${tB.previousWC}*.

2. **Tactical Prediction**: 
   - Historically, ${teamA} relies on highly tactical defensive positions, whereas ${teamB} is expected to attack via wings.
   - Recommended prediction: **${tA.fifaRanking < tB.fifaRanking ? teamA : teamB}** is predicted to win by 1 goals!
   - Projected scoring: **${tA.fifaRanking < tB.fifaRanking ? "2-1" : "0-1"}**.

*👉 Note: To enable live Gemini AI-generated reasoning, please add a valid GEMINI_API_KEY in the Secrets panel on AI Studio (Settings > Secrets).*`;

    return res.json({ text: simulatedAnalysis });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Provide an analytical prediciton and tactical World Cup 2026 preview for a football match between ${teamA} and ${teamB}. Cover previous patterns, squad capabilities, star player focus, and make a playful prediction for the score, man of the match, first scoring team, and total goal range. Frame your reply in beautiful, easy-to-read, professional Markdown with emojis.`,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: `Gemini server calculation failed: ${error.message}` });
  }
});

// --- ADMIN / SUPER ADMIN MATCH CREATION / MODIFICATION ENDPOINTS ---
app.post("/api/admin/match/create", (req, res) => {
  const { teamA, teamB, flagA, flagB, startTime, group, nptTime } = req.body;
  if (!teamA || !teamB) {
    return res.status(400).json({ error: "Team A and Team B names are required." });
  }
  const newMatch = {
    id: "m_" + Date.now(),
    teamA,
    teamB,
    flagA: flagA || "🏳️",
    flagB: flagB || "🏳️",
    status: "upcoming" as const,
    scoreA: 0,
    scoreB: 0,
    startTime: startTime || new Date().toISOString(),
    nptTime: nptTime || "राति 12:45 बजे",
    group: group || "Group State",
    possessionA: 50,
    locked: false,
    timeline: []
  };
  DB.matches.push(newMatch);
  saveDB();

  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "MATCH_CREATED",
    detail: `Match created: ${teamA} vs ${teamB} in ${group}.`
  });

  return res.status(201).json({ success: true, message: "Match created successfully!", match: newMatch });
});

app.post("/api/admin/match/edit", (req, res) => {
  const { id, teamA, teamB, flagA, flagB, startTime, group, status, scoreA, scoreB, locked, nptTime } = req.body;
  const match = DB.matches.find((m: any) => m.id === id);
  if (!match) return res.status(404).json({ error: "Match not found" });

  if (teamA !== undefined) match.teamA = teamA;
  if (teamB !== undefined) match.teamB = teamB;
  if (flagA !== undefined) match.flagA = flagA;
  if (flagB !== undefined) match.flagB = flagB;
  if (startTime !== undefined) match.startTime = startTime;
  if (group !== undefined) match.group = group;
  if (status !== undefined) match.status = status;
  if (scoreA !== undefined) match.scoreA = Number(scoreA);
  if (scoreB !== undefined) match.scoreB = Number(scoreB);
  if (locked !== undefined) match.locked = Boolean(locked);
  if (nptTime !== undefined) match.nptTime = nptTime;

  saveDB();

  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "MATCH_MODIFIED",
    detail: `Match ID ${id} modified: ${match.teamA} vs ${match.teamB}.`
  });

  return res.json({ success: true, message: "Match modified successfully!", match });
});

app.post("/api/admin/match/delete", (req, res) => {
  const { id } = req.body;
  const matchExists = DB.matches.some((m: any) => m.id === id);
  if (!matchExists) return res.status(404).json({ error: "Match not found" });

  DB.matches = DB.matches.filter((m: any) => m.id !== id);
  saveDB();

  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "MATCH_DELETED",
    detail: `Match ID ${id} deleted.`
  });

  return res.json({ success: true, message: "Match deleted successfully!" });
});

// --- ADMIN / SUPER ADMIN SIMULATOR PANEL CONTROLS ---
app.post("/api/admin/match/update-score", (req, res) => {
  const { matchId, scoreA, scoreB, eventType, eventDetail } = req.body;
  const match = DB.matches.find((m) => m.id === matchId);
  if (!match) return res.status(404).json({ error: "Match not found" });

  match.scoreA = Number(scoreA);
  match.scoreB = Number(scoreB);

  if (eventType && eventDetail) {
    const newEv = {
      id: "ev_" + Date.now(),
      time: Math.floor(10 + Math.random() * 80),
      type: eventType as any,
      detail: eventDetail,
    };
    match.timeline.push(newEv);
  }

  // Check if live questions can be automatically resolved
  if (eventType === "goal") {
    // Try to auto-complete live question q1 ("Who will score next")
    const q = DB.liveQuestions.find((l) => l.matchId === matchId && l.status === "active");
    if (q) {
      q.status = "completed";
      // Pick a random option or detail
      const correctAns = q.options[Math.floor(Math.random() * q.options.length)];
      q.correctAnswer = correctAns;

      // Instantly award points to players who answered correctAns
      DB.userLiveAnswers.forEach((la) => {
        if (la.questionId === q.id && la.answer === correctAns && !la.checked) {
          la.pointsGranted = q.points;
          la.checked = true;
          // Add points to user profile
          const user = DB.users.find((u) => u.id === la.userId);
          if (user) {
            user.points += q.points;
            if (user.nonPredictionPoints !== undefined) {
              user.nonPredictionPoints = (user.nonPredictionPoints || 0) + q.points;
            }
            DB.winnersTicker.unshift({
              id: "tick_" + Date.now(),
              text: `🎉 LIVE SCORE: ${user.name} answered correct on Live Question & earned ${q.points} points!`
            });
          }
        }
      });
    }
  }

  recalculateAllPredictionPoints();
  logAdminAudit("Score Update", "Admin/Superadmin", `Updated match ${match.teamA} vs ${match.teamB} score to ${match.scoreA}-${match.scoreB}`);

  res.json({ success: true, message: "Match updated and live calculations performed instantly!", match });
});

app.post("/api/admin/match/end", (req, res) => {
  const { matchId } = req.body;
  const match = DB.matches.find((m) => m.id === matchId);
  if (!match) return res.status(404).json({ error: "Match not found" });

  const finalWinner = match.scoreA > match.scoreB ? "A" : match.scoreA < match.scoreB ? "B" : "draw";

  match.status = "completed";
  match.locked = true;
  
  // Set Winner Storage requested attributes: Match ID, Team A, Team B, Final Score, Winner, Status = Closed
  match.final_score = `${match.scoreA} - ${match.scoreB}`;
  match.winner = finalWinner === "A" ? match.teamA : finalWinner === "B" ? match.teamB : "DRAW";
  match.closed_status = "Closed";

  match.timeline.push({
    id: "ev_end_" + Date.now(),
    time: 90,
    type: "fulltime",
    detail: `Full-time whistle blown. Final score: ${match.teamA} ${match.scoreA} - ${match.scoreB} ${match.teamB}.`
  });

  // Calculate points for predictions!
  DB.predictions.forEach((pred) => {
    if (pred.matchId === matchId && pred.status === "pending") {
      let earned = 0;
      let winnerCorrect = false;
      let scoreCorrect = false;

      if (pred.predictedWinner === finalWinner) {
        winnerCorrect = true;
      }
      if (Number(pred.predictedScoreA) === Number(match.scoreA) && Number(pred.predictedScoreB) === Number(match.scoreB)) {
        scoreCorrect = true;
      }

      if (scoreCorrect) {
        earned = 5;
        pred.winnerPointsGranted = 3;
        pred.goalPointsGranted = 2;
      } else if (winnerCorrect) {
        earned = 3;
        pred.winnerPointsGranted = 3;
        pred.goalPointsGranted = 0;
      } else {
        earned = 0;
        pred.winnerPointsGranted = 0;
        pred.goalPointsGranted = 0;
      }

      pred.pointsGranted = earned;
      pred.winnerCorrect = winnerCorrect;
      pred.scoreCorrect = scoreCorrect;
      pred.status = "processed";

      const user = DB.users.find((u) => u.id === pred.userId);
      if (user) {
        user.points += earned;
        
        // Calculate precise historical accuracy from finalized predictions
        const processedPreds = DB.predictions.filter((p: any) => p.userId === user.id && p.status === "processed");
        user.predictionsCompleted = processedPreds.length;
        let matchesCorrect = 0;
        processedPreds.forEach((p: any) => {
          const m = DB.matches.find((matchItem: any) => matchItem.id === p.matchId);
          if (m) {
            const actWin = m.scoreA > m.scoreB ? "A" : m.scoreA < m.scoreB ? "B" : "draw";
            if (p.predictedWinner === actWin) {
              matchesCorrect++;
            }
          }
        });

        user.accuracy = processedPreds.length > 0 ? Math.round((matchesCorrect / processedPreds.length) * 100) : 100;

        DB.winnersTicker.unshift({
          id: "tick_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          text: `🏆 WINNER: ${user.name} got +${earned} PTS on ${match.teamA} vs ${match.teamB} (${winnerCorrect ? (scoreCorrect ? 'Exact Score!' : 'Winner Correct') : 'Incorrect'})`
        });
      }
    }
  });

  // Resolve default winner question and distribute points in real-time
  const defaultQ = DB.liveQuestions.find((q: any) => q.id === `q_win_${matchId}`);
  if (defaultQ) {
    const winnerName = finalWinner === "A" ? match.teamA : finalWinner === "B" ? match.teamB : "DRAW (बराबरी)";
    defaultQ.correctAnswer = winnerName;
    defaultQ.status = "completed";

    // Grant points to users who submitted correct winner answers
    DB.userLiveAnswers.forEach((la: any) => {
      if (la.questionId === defaultQ.id && la.answer === winnerName && !la.checked) {
        la.pointsGranted = defaultQ.points;
        la.checked = true;
        const user = DB.users.find((u: any) => u.id === la.userId);
        if (user) {
          user.points += defaultQ.points;
          if (user.nonPredictionPoints !== undefined) {
            user.nonPredictionPoints = (user.nonPredictionPoints || 0) + defaultQ.points;
          }
          DB.winnersTicker.unshift({
            id: "tick_" + Date.now(),
            text: `🎉 LIVE WINNER: ${user.name} correctly predicted ${match.teamA} vs ${match.teamB} winner and earned ${defaultQ.points} points!`
          });
        }
      }
    });
  }

  // Disappear active live questions after match ends as requested
  DB.liveQuestions = DB.liveQuestions.filter((q: any) => q.matchId !== matchId);

  // Winner Storage requested attributes: Save to winner.txt and winners.json
  try {
    const winnerFileName = "winner.txt";
    const winnerFilePath = path.join(process.cwd(), winnerFileName);
    
    const matchWinnerString = finalWinner === "A" ? match.teamA : finalWinner === "B" ? match.teamB : "DRAW";
    const fileContent = `MATCH COMPLETED\n` +
      `Date: ${new Date().toISOString()}\n` +
      `Match Info: ${match.teamA} vs ${match.teamB}\n` +
      `Final Score: ${match.scoreA} - ${match.scoreB}\n` +
      `Match Winner: ${matchWinnerString}\n` +
      `---------------------------------------------\n`;
    
    fs.appendFileSync(winnerFilePath, fileContent, "utf8");
    console.log(`Saved match winner to ${winnerFilePath}`);

    const winnersJsonPath = path.join(SERVER_DATA_DIR, "winners.json");
    let winnersData: any[] = [];
    if (fs.existsSync(winnersJsonPath)) {
      try {
        const fileData = fs.readFileSync(winnersJsonPath, "utf8");
        if (fileData.trim()) {
          winnersData = JSON.parse(fileData);
        }
      } catch (e) {
        // Safe fallback
      }
    }
    
    winnersData.push({
      matchId: match.id,
      teams: `${match.teamA} vs ${match.teamB}`,
      score: `${match.scoreA} - ${match.scoreB}`,
      winner: matchWinnerString,
      timestamp: new Date().toISOString()
    });
    
    fs.writeFileSync(winnersJsonPath, JSON.stringify(winnersData, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write to winner files:", err);
  }

  recalculateAllPredictionPoints();
  logAdminAudit("Match Concluded", "Admin/Superadmin", `Concluded match ${match.teamA} vs ${match.teamB} with final score ${match.scoreA}-${match.scoreB}`);

  saveDB(); // Save database state to db.json file!

  res.json({ success: true, message: "Match finished. All user predictions resolved & leaderboards updated instantly!", match });
});

app.post("/api/admin/matches/update-question", (req, res) => {
  const { matchId, customWinnerQuestion } = req.body;
  const match = DB.matches.find((m: any) => m.id === matchId);
  if (!match) return res.status(404).json({ error: "Match not found" });

  match.customWinnerQuestion = customWinnerQuestion;
  res.json({ success: true, message: "Match customized winner question updated successfully!", match });
});

// ============================================================================
// PREDICTION POINTS & REPORTING API MODULES (EXCEL/CSV - REALTIME)
// ============================================================================
app.get("/api/admin/prediction-reports/tables", (req, res) => {
  // Ensure we have done a fresh recalculation before projection
  recalculateAllPredictionPoints();

  const winnerTable = DB.predictions.map((p: any) => {
    const user = DB.users.find((u: any) => u.id === p.userId) || { name: "Unknown", employeeId: "N/A" };
    const match = DB.matches.find((m: any) => m.id === p.matchId) || { teamA: "Unknown", teamB: "Unknown", status: "unknown" };
    
    let actualWinner = "PENDING";
    if (match.status === "completed") {
      actualWinner = match.scoreA > match.scoreB ? match.teamA : match.scoreA < match.scoreB ? match.teamB : "DRAW";
    }

    let pWinnerStr = "DRAW";
    if (p.predictedWinner === "A") pWinnerStr = match.teamA;
    if (p.predictedWinner === "B") pWinnerStr = match.teamB;

    let status = "Pending";
    if (match.status === "completed") {
      status = p.winnerCorrect ? "Correct" : "Incorrect";
    }

    return {
      emId: user.employeeId || "N/A",
      userName: user.name,
      matchId: p.matchId,
      matchDisplay: `${match.teamA} vs ${match.teamB}`,
      predictedWinner: pWinnerStr,
      actualWinner: actualWinner,
      predictionDate: p.timestamp || "TBD",
      status: status,
      points: p.winnerPointsGranted || 0,
    };
  });

  const goalTable = DB.predictions.map((p: any) => {
    const user = DB.users.find((u: any) => u.id === p.userId) || { name: "Unknown", employeeId: "N/A" };
    const match = DB.matches.find((m: any) => m.id === p.matchId) || { teamA: "Unknown", teamB: "Unknown", status: "unknown", scoreA: 0, scoreB: 0 };
    
    let actualScore = "PENDING";
    if (match.status === "completed") {
      actualScore = `${match.scoreA} - ${match.scoreB}`;
    }

    let status = "Pending";
    if (match.status === "completed") {
      status = p.scoreCorrect ? "Correct" : "Incorrect";
    }

    return {
      emId: user.employeeId || "N/A",
      userName: user.name,
      matchId: p.matchId,
      matchDisplay: `${match.teamA} vs ${match.teamB}`,
      predictedScoreA: p.predictedScoreA,
      predictedScoreB: p.predictedScoreB,
      predictedScoreDisplay: `${p.predictedScoreA} - ${p.predictedScoreB}`,
      actualScore: actualScore,
      status: status,
      points: p.goalPointsGranted || 0,
    };
  });

  const leaderboardTable = [...DB.users]
    .map((u: any) => ({
      emId: u.employeeId || "N/A",
      userName: u.name,
      winnerPoints: u.winnerPoints || 0,
      goalPoints: u.goalPoints || 0,
      totalPoints: (u.winnerPoints || 0) + (u.goalPoints || 0),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((u, idx) => ({
      rank: idx + 1,
      ...u
    }));

  res.json({
    winnerTable,
    goalTable,
    leaderboardTable,
    auditLogs: DB.audit_logs || []
  });
});

app.get("/api/admin/prediction-reports/statistics", (req, res) => {
  recalculateAllPredictionPoints();

  const totalUsers = DB.users.length;
  const totalPredictions = DB.predictions.length;

  let correctWinners = 0;
  let correctGoals = 0;

  DB.predictions.forEach((p: any) => {
    const match = DB.matches.find((m: any) => m.id === p.matchId);
    if (match && match.status === "completed") {
      if (p.winnerCorrect) correctWinners++;
      if (p.scoreCorrect) correctGoals++;
    }
  });

  // Highest point user
  let highestUser = { name: "N/A", employeeId: "N/A", points: 0 };
  DB.users.forEach((u: any) => {
    const pts = (u.winnerPoints || 0) + (u.goalPoints || 0);
    if (pts > highestUser.points) {
      highestUser = {
        name: u.name,
        employeeId: u.employeeId || "N/A",
        points: pts
      };
    }
  });

  // Match-wise reports
  const matchWiseStats = DB.matches.map((m: any) => {
    const preds = DB.predictions.filter((p: any) => p.matchId === m.id);
    let winCorrect = 0;
    let scoreCorrect = 0;
    const completedPreds = preds.filter((p: any) => m.status === "completed");

    preds.forEach((p: any) => {
      if (p.winnerCorrect) winCorrect++;
      if (p.scoreCorrect) scoreCorrect++;
    });

    return {
      matchId: m.id,
      matchDisplay: `${m.teamA} VS ${m.teamB}`,
      group: m.group,
      status: m.status,
      predictionCount: preds.length,
      correctWinnerCount: winCorrect,
      correctGoalCount: scoreCorrect,
      accuracyRate: completedPreds.length > 0 ? Math.round((winCorrect / completedPreds.length) * 100) : 100
    };
  });

  // Daily activity tracker data
  const activityMap: Record<string, number> = {};
  DB.predictions.forEach((p: any) => {
    if (p.timestamp) {
      const dateStr = p.timestamp.substring(0, 10); // YYYY-MM-DD
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    }
  });

  const dailyActivity = Object.keys(activityMap)
    .sort()
    .map((date) => ({
      date,
      count: activityMap[date],
    }));

  res.json({
    totalUsers,
    totalPredictions,
    correctWinners,
    correctGoals,
    highestUser,
    matchWiseStats,
    dailyActivity,
    auditLogs: DB.audit_logs || []
  });
});

app.get("/api/admin/prediction-reports/export", (req, res) => {
  const { type } = req.query;
  recalculateAllPredictionPoints();

  let csvContent = "";
  let filename = "report.csv";

  if (type === "winner") {
    filename = "Winner_Predictions_Report.csv";
    csvContent = "EM ID,User Name,Match,Predicted Winner,Actual Winner,Prediction Timestamp,Status,Points Granted\n";
    DB.predictions.forEach((p: any) => {
      const user = DB.users.find((u: any) => u.id === p.userId) || { name: "Unknown", employeeId: "N/A" };
      const match = DB.matches.find((m: any) => m.id === p.matchId) || { teamA: "Unknown", teamB: "Unknown", status: "unknown" };
      
      let actualWinner = "PENDING";
      if (match.status === "completed") {
        actualWinner = match.scoreA > match.scoreB ? match.teamA : match.scoreA < match.scoreB ? match.teamB : "DRAW";
      }

      let pWinnerStr = "DRAW";
      if (p.predictedWinner === "A") pWinnerStr = match.teamA;
      if (p.predictedWinner === "B") pWinnerStr = match.teamB;

      let status = match.status === "completed" ? (p.winnerCorrect ? "Correct" : "Incorrect") : "Pending";
      const pts = p.winnerPointsGranted || 0;

      csvContent += `"${user.employeeId || "N/A"}","${user.name.replace(/"/g, '""')}","${match.teamA} vs ${match.teamB}","${pWinnerStr}","${actualWinner}","${p.timestamp || "N/A"}","${status}",${pts}\n`;
    });
  } else if (type === "goal") {
    filename = "Goal_Predictions_Report.csv";
    csvContent = "EM ID,User Name,Match,Team A Goals Predicted,Team B Goals Predicted,Actual Score,Status,Points Granted\n";
    DB.predictions.forEach((p: any) => {
      const user = DB.users.find((u: any) => u.id === p.userId) || { name: "Unknown", employeeId: "N/A" };
      const match = DB.matches.find((m: any) => m.id === p.matchId) || { teamA: "Unknown", teamB: "Unknown", status: "unknown", scoreA: 0, scoreB: 0 };
      
      const scoreDisp = match.status === "completed" ? `"${match.scoreA} - ${match.scoreB}"` : "PENDING";
      let status = match.status === "completed" ? (p.scoreCorrect ? "Correct" : "Incorrect") : "Pending";
      const pts = p.goalPointsGranted || 0;

      csvContent += `"${user.employeeId || "N/A"}","${user.name.replace(/"/g, '""')}","${match.teamA} vs ${match.teamB}",${p.predictedScoreA},${p.predictedScoreB},"${scoreDisp}","${status}",${pts}\n`;
    });
  } else if (type === "leaderboard") {
    filename = "Tournament_Leaderboard.csv";
    csvContent = "Rank,EM ID,User Name,Winner Prediction Points,Goal Prediction Points,Total Points\n";
    
    const sorted = [...DB.users]
      .map((u: any) => ({
        emId: u.employeeId || "N/A",
        userName: u.name,
        winnerPoints: u.winnerPoints || 0,
        goalPoints: u.goalPoints || 0,
        totalPoints: (u.winnerPoints || 0) + (u.goalPoints || 0),
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    sorted.forEach((u, idx) => {
      csvContent += `${idx + 1},"${u.emId}","${u.userName.replace(/"/g, '""')}",${u.winnerPoints},${u.goalPoints},${u.totalPoints}\n`;
    });
  } else {
    filename = "Predictions_Cumulative_Analysis.csv";
    csvContent = "Type,EM ID,User Name,Match,Selection,Actual Stand,Status,Points\n";
    
    DB.predictions.forEach((p: any) => {
      const user = DB.users.find((u: any) => u.id === p.userId) || { name: "Unknown", employeeId: "N/A" };
      const match = DB.matches.find((m: any) => m.id === p.matchId) || { teamA: "Unknown", teamB: "Unknown", status: "unknown", scoreA: 0, scoreB: 0 };
      
      let actualWinner = "PENDING";
      if (match.status === "completed") {
        actualWinner = match.scoreA > match.scoreB ? match.teamA : match.scoreA < match.scoreB ? match.teamB : "DRAW";
      }
      let pWinnerStr = "DRAW";
      if (p.predictedWinner === "A") pWinnerStr = match.teamA;
      if (p.predictedWinner === "B") pWinnerStr = match.teamB;
      let wStatus = match.status === "completed" ? (p.winnerCorrect ? "Correct" : "Incorrect") : "Pending";
      csvContent += `"Winner Prediction","${user.employeeId || "N/A"}","${user.name.replace(/"/g, '""')}","${match.teamA} vs ${match.teamB}","${pWinnerStr}","${actualWinner}","${wStatus}",${p.winnerPointsGranted || 0}\n`;

      const scoreDisp = match.status === "completed" ? `${match.scoreA} - ${match.scoreB}` : "PENDING";
      let gStatus = match.status === "completed" ? (p.scoreCorrect ? "Correct" : "Incorrect") : "Pending";
      csvContent += `"Goal Prediction","${user.employeeId || "N/A"}","${user.name.replace(/"/g, '""')}","${match.teamA} vs ${match.teamB}","${p.predictedScoreA} - ${p.predictedScoreB}","${scoreDisp}","${gStatus}",${p.goalPointsGranted || 0}\n`;
    });
  }

  res.header("Content-Type", "text/csv; charset=utf-8");
  res.attachment(filename);
  return res.send(Buffer.from("\uFEFF" + csvContent, "utf-8"));
});

app.post("/api/admin/live-questions/create", (req, res) => {
  const { matchId, text, options, points } = req.body;
  const newQ = {
    id: "q_" + Date.now(),
    matchId: matchId || "m1",
    text,
    options: options || ["Yes", "No"],
    points: Number(points) || 20,
    expiresAt: new Date(Date.now() + 600000).toISOString(),
    status: "active" as const,
  };

  DB.liveQuestions.push(newQ);
  res.status(201).json({ success: true, message: "Live real-time question created!", question: newQ });
});

app.post("/api/admin/live-questions/resolve", (req, res) => {
  const { questionId, correctAnswer } = req.body;
  const question = DB.liveQuestions.find((q: any) => q.id === questionId);
  if (!question) return res.status(404).json({ error: "Live question not found" });

  question.correctAnswer = correctAnswer;
  question.status = "completed" as const;

  let correctPlayersCount = 0;
  DB.userLiveAnswers.forEach((la: any) => {
    if (la.questionId === questionId && la.answer === correctAnswer && !la.checked) {
      la.pointsGranted = question.points;
      la.checked = true;
      const user = DB.users.find((u: any) => u.id === la.userId);
      if (user) {
        user.points += question.points;
        if (user.nonPredictionPoints !== undefined) {
          user.nonPredictionPoints = (user.nonPredictionPoints || 0) + question.points;
        }
        correctPlayersCount++;
        DB.winnersTicker.unshift({
          id: "tick_" + Date.now() + "_" + Math.random(),
          text: `🎉 LIVE WINNER: ${user.name} guessed correctly "${question.text}" -> "${correctAnswer}" and won ${question.points} points!`
        });
      }
    }
  });

  res.json({ success: true, message: `Question settled successfully! Rewarded ${correctPlayersCount} players.`, question });
});

app.post("/api/admin/live-questions/delete", (req, res) => {
  const { questionId } = req.body;
  DB.liveQuestions = DB.liveQuestions.filter((q: any) => q.id !== questionId);
  res.json({ success: true, message: "Live question deleted successfully." });
});

app.post("/api/admin/dishhome/resolve", (req, res) => {
  const { questionId, correctAnswer } = req.body;
  const question = DB.dishHomeQuestions.find((q) => q.id === questionId);
  if (!question) return res.status(404).json({ error: "DishHome question not found" });

  question.correctAnswer = correctAnswer;

  // Process DishHome user submissions
  DB.dishHomeUserSubmissions.forEach((sub) => {
    if (sub.questionId === questionId && sub.submittedAnswer === correctAnswer) {
      const user = DB.users.find((u) => u.id === sub.userId);
      if (user) {
        user.points += question.points;
        if (user.nonPredictionPoints !== undefined) {
          user.nonPredictionPoints = (user.nonPredictionPoints || 0) + question.points;
        }
        DB.winnersTicker.unshift({
          id: "tick_" + Date.now(),
          text: `📡 DishHome Special: ${user.name} got correct answer on DishHome package sales & won ${question.points} points!`
        });
      }
    }
  });

  res.json({ success: true, message: "DishHome question resolved & points rewarded instantly!" });
});

app.post("/api/admin/platform/settings", (req, res) => {
  const { entryFee, commissionRate, prizePool, acceptedMethods, googleClientId } = req.body;
  if (entryFee !== undefined) DB.paymentConfig.entryFee = Number(entryFee);
  if (commissionRate !== undefined) DB.paymentConfig.commissionRate = Number(commissionRate);
  if (prizePool !== undefined) DB.paymentConfig.prizePool = Number(prizePool);
  if (acceptedMethods !== undefined) DB.paymentConfig.acceptedMethods = acceptedMethods;
  if (googleClientId !== undefined) DB.googleClientId = googleClientId;

  res.json({ success: true, message: "Platform parameters updated successfully!", config: DB.paymentConfig, googleClientId: DB.googleClientId });
});

app.post("/api/admin/users/ban", (req, res) => {
  const { userId } = req.body;
  DB.users = DB.users.filter((u) => u.id !== userId);
  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "CRITICAL",
    detail: `User with ID ${userId} was banned under Fraud Detection policy.`
  });
  res.json({ success: true, message: "User banned from tournament instantly. Seat vacated." });
});

app.get("/api/admin/security/logs", (req, res) => {
  res.json({ logs: DB.securityLogs, userCount: DB.users.length, earnings: DB.users.filter((u: any) => u.isPaid).length * DB.paymentConfig.entryFee });
});

app.get("/api/admin/dashboard-stats", (req, res) => {
  // Enriches transaction logs with full player metadata
  const allTxs = DB.paymentTransactions.map((tx: any) => {
    const user = DB.users.find((u: any) => u.id === tx.userId) || {};
    return {
      ...tx,
      userName: user.name || "Unknown Player",
      userEmail: user.email || "Unknown Email",
      dishHomeId: user.dishHomeId || "N/A"
    };
  });

  // Calculate stats based on gateway channels (strictly eSewa and Khalti only)
  const esewaRev = DB.paymentTransactions
    .filter((tx: any) => tx.gateway === "eSewa" && tx.status === "SUCCESS")
    .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

  const khaltiRev = DB.paymentTransactions
    .filter((tx: any) => tx.gateway === "Khalti" && tx.status === "SUCCESS")
    .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

  const totalRev = esewaRev + khaltiRev;
  const totalPredictions = DB.predictions.length;

  // Compile detailed list of user predictions
  const enrichedPredictions = DB.predictions.map((p: any) => {
    const user = DB.users.find((u: any) => u.id === p.userId) || {};
    const match = DB.matches.find((m: any) => m.id === p.matchId) || {};
    return {
      ...p,
      userName: user.name || "Unknown Player",
      userEmail: user.email || "Unknown Email",
      dishHomeId: user.dishHomeId || "N/A",
      matchDisplay: `${match.teamA} VS ${match.teamB}`,
      matchStatus: match.status
    };
  });

  res.json({
    transactions: allTxs,
    esewaRevenue: esewaRev,
    khaltiRevenue: khaltiRev,
    totalRevenue: totalRev,
    totalPredictions,
    predictions: enrichedPredictions,
    totalUserCount: DB.users.length,
    vipUserCount: DB.users.filter((u: any) => u.isPaid).length,
    liveQuestions: DB.liveQuestions,
    googleClientId: DB.googleClientId,
  });
});

app.post("/api/admin/predictions/purge-incorrect", (req, res) => {
  const { matchId } = req.body;
  if (!matchId) return res.status(400).json({ error: "Match ID is required to purge incorrect predictions." });

  const initialCount = DB.predictions.length;
  // Discard predictions that scored 0 points after being processed
  DB.predictions = DB.predictions.filter((pred: any) => {
    if (matchId === "all") {
      if (pred.status === "processed" && pred.pointsGranted === 0) {
        return false; // delete incorrect
      }
    } else {
      if (pred.matchId === matchId && pred.status === "processed" && pred.pointsGranted === 0) {
        return false; // delete incorrect
      }
    }
    return true;
  });

  const removedCount = initialCount - DB.predictions.length;

  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "PURGE",
    detail: `Purged ${removedCount} incorrect predictions ${matchId === "all" ? "across all matches" : `for match ID ${matchId}`} by Admin choice.`
  });

  res.json({ 
    success: true, 
    message: `Purge complete: Discarded ${removedCount} inaccurate predictor entries. Standard tables settled in active listings.`,
    purgedCount: removedCount 
  });
});

// --- ANALYTICS & MULTI-TIER OPERATOR MANAGEMENT ---

app.post("/api/analytics/visit", (req, res) => {
  const { userId, userName, userEmail, userMobile, userCountry, role, deviceInfo } = req.body;
  
  const newVisit = {
    id: "vis_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    userId: userId || "guest_anonymous",
    userName: userName || "Anonymous Fan",
    userEmail: userEmail || "guest@predictor.com",
    userMobile: userMobile || "",
    userCountry: userCountry || "Unknown",
    role: role || "guest",
    deviceInfo: deviceInfo || "Unknown Device"
  };

  DB.visits.push(newVisit);

  // Keep logs list trimmed to prevent memory leaks (max 1000 items)
  if (DB.visits.length > 1000) {
    DB.visits.shift();
  }

  res.json({ success: true, logged: true });
});

app.get("/api/admin/visits", (req, res) => {
  res.json({ success: true, visits: DB.visits.slice().reverse() });
});

app.post("/api/admin/create-admin", (req, res) => {
  const { name, email, mobile, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Operator name, email address, and password/PIN credentials are required." });
  }

  // Look for existing user
  const existingIndex = DB.users.findIndex((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existingIndex !== -1) {
    DB.users[existingIndex].role = "admin";
    DB.users[existingIndex].password = password;
    if (mobile) DB.users[existingIndex].mobile = mobile;
    
    DB.securityLogs.push({
      id: "sl_" + Date.now(),
      timestamp: new Date().toISOString(),
      type: "ADMIN_PROMOTED",
      detail: `Operator ${name} (${email}) was promoted to Standard Admin.`
    });

    return res.json({ success: true, message: "Standard Admin credentials upgraded and password saved!", user: DB.users[existingIndex] });
  }

  const newAdmin = {
    id: "u_adm_" + Date.now(),
    name,
    email,
    mobile: mobile || "",
    password: password,
    country: "Nepal",
    role: "admin",
    isPaid: true,
    points: 9999,
    accuracy: 100,
    predictionsCompleted: 0,
    badge: "World Champion" as const,
    rank: DB.users.length + 1,
    referralCode: "ADM" + Math.floor(100 + Math.random() * 900),
    referredCount: 0,
    dailyCheckInChain: 0,
  };

  DB.users.push(newAdmin);

  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "ADMIN_CREATED",
    detail: `Registered new Standard Operator successfully: ${name} (${email})`
  });

  res.status(201).json({ success: true, message: `Successfully registered new Operator: ${name}!`, user: newAdmin });
});

app.post("/api/admin/remove-admin", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Admin email parameter is required." });

  const target = DB.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (!target) {
    return res.status(404).json({ error: "No Operator found matches that email address." });
  }

  if (target.role === "superadmin" || target.email === "ranjansanjit@gmail.com") {
    return res.status(403).json({ error: "Cannot revoke permissions from the primary Super Administrator!" });
  }

  target.role = "user"; // demote back to regular user
  
  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: "ADMIN_REVOKED",
    detail: `Operator seat revoked for ${target.name} (${target.email}). Demoted back to standard user.`
  });

  res.json({ success: true, message: `Access revoked. ${target.name} has been demoted back to a standard participant.` });
});

app.post("/api/admin/toggle-disable-admin", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Admin email is required" });

  const target = DB.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (!target) return res.status(404).json({ error: "Operator not found" });

  if (target.role === "superadmin" || target.email === "ranjansanjit@gmail.com") {
    return res.status(403).json({ error: "Cannot suspend/disable the primary Super Admin!" });
  }

  target.isDisabled = !target.isDisabled;

  DB.securityLogs.push({
    id: "sl_" + Date.now(),
    timestamp: new Date().toISOString(),
    type: target.isDisabled ? "ADMIN_DISABLED" : "ADMIN_ENABLED",
    detail: `Operator ${target.name} (${target.email}) was ${target.isDisabled ? "suspended/disabled" : "re-activated"} by Super Admin.`
  });

  res.json({ success: true, message: `Operator account has been successfully ${target.isDisabled ? "suspended" : "re-activated"}!`, user: target });
});

app.get("/api/admin/registered-players", (req, res) => {
  const processedPlayers = DB.users.map((u: any) => {
    const userPredictions = DB.predictions.filter((p: any) => p.userId === u.id);
    return {
      id: u.id,
      name: u.name,
      username: u.username || "N/A",
      employeeId: u.employeeId || "N/A",
      email: u.email,
      mobile: u.mobile || "N/A",
      country: u.country || "Nepal",
      role: u.role || "user",
      isPaid: u.isPaid,
      points: u.points,
      accuracy: u.accuracy,
      isDisabled: u.isDisabled || false,
      predictionsCount: userPredictions.length,
      predictions: userPredictions.map((p: any) => {
        const match = DB.matches.find((m: any) => m.id === p.matchId) || {};
        return {
          matchId: p.matchId,
          matchDisplay: `${match.teamA} vs ${match.teamB}`,
          predictedWinner: p.predictedWinner,
          predictedScoreA: p.predictedScoreA,
          predictedScoreB: p.predictedScoreB,
          pointsGranted: p.pointsGranted,
          status: p.status
        };
      })
    };
  });

  res.json({ success: true, players: processedPlayers });
});

// ============================================================================
// ADMIN & SUPERADMIN RELATIONAL DATABASE EXPLORER ENDPOINTS
// ============================================================================
app.get("/api/admin/database-tables", (req, res) => {
  // Read SQL schema files securely
  let schemaSql = "";
  let seedSql = "";
  
  try {
    const schemaPath = path.join(process.cwd(), "src", "database", "schema.sql");
    if (fs.existsSync(schemaPath)) {
      schemaSql = fs.readFileSync(schemaPath, "utf8");
    }
    
    const seedPath = path.join(process.cwd(), "src", "database", "postgresql_seed.sql");
    if (fs.existsSync(seedPath)) {
      seedSql = fs.readFileSync(seedPath, "utf8");
    }
  } catch (err) {
    console.error("Failed to read schema files:", err);
  }

  const tables = {
    users: {
      description: "App users and core credentials, employee details, roles and calculated tournament scores.",
      columns: ["id", "name", "username", "employeeId", "email", "mobile", "country", "role", "isPaid", "points", "accuracy", "predictionsCompleted", "badge", "is_disabled"],
      rows: DB.users || []
    },
    matches: {
      description: "FIFA World Cup tournament match details, scheduled timings, scores and team flags.",
      columns: ["id", "teamA", "teamB", "flagA", "flagB", "status", "scoreA", "scoreB", "startTime", "nptTime", "group", "possessionA", "locked", "is_hidden"],
      rows: DB.matches || []
    },
    teams: {
      description: "Registered FIFA country teams metadata, flags, current group standings points and analytics.",
      columns: ["id", "name", "code", "flag", "group", "points", "played", "won", "drawn", "lost", "goalsFor", "goalsAgainst", "is_hidden"],
      rows: DB.teams || []
    },
    predictions: {
      description: "User-submitted match prediction forecasts, core predictions, and evaluated bonus points.",
      columns: ["id", "userId", "matchId", "predictedScoreA", "predictedScoreB", "predictedWinner", "pointsGranted", "status", "timestamp"],
      rows: DB.predictions || []
    },
    paymentTransactions: {
      description: "Recorded billing passes, gateway codes (eSewa & Khalti), status and transaction identifiers.",
      columns: ["id", "userId", "amount", "gateway", "txnId", "status", "timestamp", "details"],
      rows: DB.paymentTransactions || []
    },
    liveQuestions: {
      description: "Real-time query questions posted during live matches, reward scoring points and key options.",
      columns: ["id", "matchId", "text", "options", "points", "correctAns", "resolved", "timestamp"],
      rows: DB.liveQuestions || []
    },
    userLiveAnswers: {
      description: "User responses logged live during matches, option selected, and correct response points awarded.",
      columns: ["id", "userId", "questionId", "matchId", "selectedOption", "pointsGranted", "timestamp"],
      rows: DB.userLiveAnswers || []
    },
    chats: {
      description: "Global spectator interactive chat room commentary feeds, messages, users and emoji reactions.",
      columns: ["id", "userId", "userName", "message", "reactions", "timestamp"],
      rows: DB.chats || []
    },
    securityLogs: {
      description: "System execution control logs, administrative actions, credential updates and suspensions.",
      columns: ["id", "timestamp", "type", "detail"],
      rows: DB.securityLogs || []
    }
  };

  res.json({
    success: true,
    message: "Relational database tables, configurations, PostgreSQL and MySQL schema, and seed files loaded.",
    tables,
    schemaSql,
    seedSql,
    databaseType: "PostgreSQL / MySQL",
    activeBackend: "Simulated File-Synced Relational DB Model",
    connectionUrl: "postgresql://fifa_predictor_admin:role_sc_key@localhost:5432/fifa_predictor_db"
  });
});

app.post("/api/admin/database-tables/export", (req, res) => {
  const { tableName, format } = req.body;
  if (!tableName) return res.status(400).json({ error: "Table name is required for database export." });
  
  const tablesList: any = {
    users: DB.users || [],
    matches: DB.matches || [],
    teams: DB.teams || [],
    predictions: DB.predictions || [],
    paymentTransactions: DB.paymentTransactions || [],
    liveQuestions: DB.liveQuestions || [],
    userLiveAnswers: DB.userLiveAnswers || [],
    chats: DB.chats || [],
    securityLogs: DB.securityLogs || []
  };

  const rows = tablesList[tableName];
  if (!rows) return res.status(404).json({ error: `Table '${tableName}' not found.` });

  res.json({
    success: true,
    tableName,
    format,
    exportTimestamp: new Date().toISOString(),
    data: rows
  });
});


// --- CLIENT SERVER ROUTING HANDLER (VITE MIDDLEWARE OR STANDALONE STATIC) ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // This allows fallback to index.html and normal Vite module resolution
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FIFA 2026 server running at http://localhost:${PORT}`);
  });
}

startServer();

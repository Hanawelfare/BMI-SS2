/**
 * app.js - Client-side Logic for 90-Day BMI Tracker System
 */

// Application State
const STATE = {
  apiSettings: {
    apiUrl: "https://script.google.com/macros/s/AKfycbxOPvQGwoLlkIBwI_HQwooFS2PHMZWXTBmxbyKeznm0_szDhsbkZsqwsx5Ij3t_sNNH/exec", // Put Web App URL here. If blank, systems operates in Mock Mode.
    isMockMode: false
  },
  project: {
    startDate: "2026-07-01",
    endDate: "",
    adminPassword: "ad2026",
    durationDays: 90,
    hideFinalResults: false,
    closeRegistration: false,
    measureStartA: "2026-07-09",
    measureStartB: "2026-07-13",
    measureEndA: "",
    measureEndB: "",
    measureStartA_LPN1: "2026-07-09",
    measureStartA_LPN2: "2026-07-09",
    measureStartB_LPN1: "2026-07-13",
    measureStartB_LPN2: "2026-07-13",
    measureEndA_LPN1: "",
    measureEndA_LPN2: "",
    measureEndB_LPN1: "",
    measureEndB_LPN2: "",
    locationTextLPN1: "LPN1 ณ ห้อง Old lobby Plant2 เวลา 9.00 - 11.30 น.",
    locationTextLPN2: "LPN2 ณ ห้อง Locker ชั้น 2 เวลา 13.30 - 15.30 น."
  },
  currentUser: null, // Logged in employee (for reporting)
  currentDbUser: null, // Logged in employee (for dashboard)
  adminAuthenticated: false,
  questions: [], // Dynamic questions list
  employees: [], // Pre-existing database
  registrations: [], // Registered employees
  weeklyData: [], // Weekly submission logs
  charts: {} // Chart instances
};

// Default Pre-existing Employee list (Admin reference)
const DEFAULT_EMPLOYEE_DB = [
  { EmployeeID: "0001", FirstName: "สมชาย", LastName: "รักดี", Department: "ฝ่ายผลิต", Height: 170 },
  { EmployeeID: "0002", FirstName: "สมหญิง", LastName: "เรียนดี", Department: "ฝ่ายขาย", Height: 162 },
  { EmployeeID: "0003", FirstName: "กิตติ", LastName: "มุ่งมั่น", Department: "ไอที", Height: 175 },
  { EmployeeID: "0004", FirstName: "นภา", LastName: "สว่างไสว", Department: "บัญชี", Height: 155 },
  { EmployeeID: "0005", FirstName: "วิทยา", LastName: "ก้าวหน้า", Department: "ฝ่ายผลิต", Height: 168 },
  { EmployeeID: "0006", FirstName: "เบญจวรรณ", LastName: "สิริกุล", Department: "ฝ่ายขาย", Height: 159 },
  { EmployeeID: "0007", FirstName: "ประวิทย์", LastName: "ทุ่มเท", Department: "บริหาร", Height: 172 },
  { EmployeeID: "0008", FirstName: "สุนิสา", LastName: "งามเพ็ญ", Department: "การตลาด", Height: 160 }
];

// Default Dynamic Questionnaire configurations
const DEFAULT_INITIAL_QUESTIONS = [
  { QuestionID: 1, id: "init_life_1", section: "lifestyle", text: "1. ท่านกินผักและผลไม้รสหวานน้อยในมื้ออาหารเป็นประจำหรือไม่", type: "select", options: ["เป็นประจำ", "2-3 วันครั้ง", "ไม่เลย"] },
  { QuestionID: 2, id: "init_life_2", section: "lifestyle", text: "2. ท่านสามารถควบคุมปริมาณข้าวหรือแป้งในแต่ละมื้อได้หรือไม่", type: "select", options: ["เป็นประจำ", "2-3 วันครั้ง", "ไม่เลย"] },
  { QuestionID: 3, id: "init_life_3", section: "lifestyle", text: "3. ท่านหลีกเลี่ยงน้ำหวาน ขนมกรุบกรอบ และอาหารทอด/ผัดน้ำมันเยิ้มหรือไม่", type: "select", options: ["เป็นประจำ", "2-3 วันครั้ง", "ไม่เลย"] },
  { QuestionID: 4, id: "init_life_4", section: "lifestyle", text: "4. ท่านดื่มน้ำเปล่าอย่างน้อย 8 แก้วต่อวัน และงดเครื่องดื่มแอลกอฮอล์หรือไม่", type: "select", options: ["เป็นประจำ", "2-3 วันครั้ง", "ไม่เลย"] },
  { QuestionID: 5, id: "init_life_5", section: "lifestyle", text: "5. ท่านมีการออกกำลังกาย (เช่น เดินเร็ว, วิ่ง, ว่ายน้ำ) อย่างน้อย 150 นาทีต่อสัปดาห์หรือไม่", type: "select", options: ["เป็นประจำ", "2-3 วันครั้ง", "ไม่เลย"] },
  { QuestionID: 6, id: "init_life_6", section: "lifestyle", text: "6. ในชีวิตประจำวัน ท่านมีกิจกรรมขยับร่างกาย เช่น การเดินขึ้นบันได แทนการใช้ลิฟต์ หรือทำงานบ้าน เป็นประจำหรือไม่", type: "select", options: ["เป็นประจำ", "2-3 วันครั้ง", "ไม่เลย"] },
  { QuestionID: 7, id: "init_life_7", section: "lifestyle", text: "7. ท่านมีความตั้งใจจริงและมั่นใจว่าจะทำตามแผนการลดน้ำหนักนี้ให้สำเร็จได้มากน้อยเพียงใด? (เลือกคะแนนตอบระดับ 1-10)", type: "scale_1_10" },
  { QuestionID: 8, id: "init_goal_1", section: "goal", text: "1. ท่านจะออกกำลังกายให้ได้ 3-5 วันต่อสัปดาห์", type: "boolean" },
  { QuestionID: 9, id: "init_goal_2", section: "goal", text: "2. ท่านจะควบคุมปริมาณข้าวหรือแป้งในแต่ละมื้อ", type: "boolean" },
  { QuestionID: 10, id: "init_goal_3", section: "goal", text: "3. ท่านจะใช้ยา/ปากกา เพื่อให้ลดความอ้วนได้ไวขึ้นในช่วง 3 เดือนนี้", type: "boolean" },
  { QuestionID: 11, id: "init_goal_4", section: "goal", text: "4. ท่านจะทานอาหารมื้อเย็นก่อนนอนอย่างน้อย 3 ชั่วโมง", type: "boolean" },
  { QuestionID: 12, id: "init_goal_5", section: "goal", text: "5. ท่านจะทานโปรตีน(มีโปรตีนทุกมื้อ) ให้ครบตามที่ร่างกายควรได้รับ", type: "boolean" }
];

const DEFAULT_WEEKLY_QUESTIONS = [
  { QuestionID: 1, id: "weekly_protein", text: "1. อาทิตย์นี้ท่านทานโปรตีนได้ครบสัดส่วนตามปริมาณที่ร่างกายควรได้รับ", type: "boolean" },
  { QuestionID: 2, id: "weekly_exercise", text: "2. อาทิตย์นี้ออกกำลังกายให้ได้ 3-5 วันต่อสัปดาห์", type: "boolean" },
  { QuestionID: 3, id: "weekly_avoid", text: "3. อาทิตย์นี้ท่านหลีกเลี่ยงน้ำหวาน ขนมกรุบกรอบ ลดแป้งในมื้ออาหารและอาหารทอด", type: "boolean" },
  { QuestionID: 4, id: "weekly_dinner", text: "4. กินอาหารมื้อเย็นห่างจากเวลานอนไม่น้อยกว่า 3 ชั่วโมง", type: "boolean" }
];

function getInitialQuestions() {
  const raw = localStorage.getItem('bmi_initial_questions');
  if (!raw) {
    localStorage.setItem('bmi_initial_questions', JSON.stringify(DEFAULT_INITIAL_QUESTIONS));
    return DEFAULT_INITIAL_QUESTIONS;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    localStorage.setItem('bmi_initial_questions', JSON.stringify(DEFAULT_INITIAL_QUESTIONS));
    return DEFAULT_INITIAL_QUESTIONS;
  }
}

function setInitialQuestions(questions) {
  localStorage.setItem('bmi_initial_questions', JSON.stringify(questions));
}

function getDailyQuestions() {
  const raw = localStorage.getItem('bmi_weekly_questions');
  if (!raw) {
    localStorage.setItem('bmi_weekly_questions', JSON.stringify(DEFAULT_WEEKLY_QUESTIONS));
    return DEFAULT_WEEKLY_QUESTIONS;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    localStorage.setItem('bmi_weekly_questions', JSON.stringify(DEFAULT_WEEKLY_QUESTIONS));
    return DEFAULT_WEEKLY_QUESTIONS;
  }
}

function setDailyQuestions(questions) {
  localStorage.setItem('bmi_weekly_questions', JSON.stringify(questions));
}

// Mock Data for Demo/Mock Mode
const MOCK_QUESTIONS = DEFAULT_WEEKLY_QUESTIONS;

const MOCK_REGISTRATIONS = [
  { EmployeeID: "0001", Password: "123", FirstName: "สมชาย", LastName: "รักดี", Department: "ฝ่ายผลิต", Height: 170, TargetWeightLoss: 8, RegistrationDate: "2026-07-01 09:00:00", AssessmentJson: '{"init_life_1":"เป็นประจำ","init_life_2":"เป็นประจำ","init_life_3":"2-3 วันครั้ง","init_life_4":"เป็นประจำ","init_life_5":"ไม่เลย","init_life_6":"2-3 วันครั้ง","init_life_7":"8","init_goal_1":"ใช่","init_goal_2":"ใช่","init_goal_3":"ไม่ใช่","init_goal_4":"ใช่","init_goal_5":"ใช่"}' },
  { EmployeeID: "0002", Password: "123", FirstName: "สมหญิง", LastName: "เรียนดี", Department: "ฝ่ายขาย", Height: 162, TargetWeightLoss: 6, RegistrationDate: "2026-07-01 09:15:00", AssessmentJson: '{"init_life_1":"เป็นประจำ","init_life_2":"เป็นประจำ","init_life_3":"เป็นประจำ","init_life_4":"เป็นประจำ","init_life_5":"2-3 วันครั้ง","init_life_6":"เป็นประจำ","init_life_7":"9","init_goal_1":"ใช่","init_goal_2":"ใช่","init_goal_3":"ไม่ใช่","init_goal_4":"ใช่","init_goal_5":"ใช่"}' },
  { EmployeeID: "0003", Password: "123", FirstName: "กิตติ", LastName: "มุ่งมั่น", Department: "ไอที", Height: 175, TargetWeightLoss: 10, RegistrationDate: "2026-07-01 10:00:00", AssessmentJson: '{"init_life_1":"ไม่เลย","init_life_2":"ไม่เลย","init_life_3":"ไม่เลย","init_life_4":"2-3 วันครั้ง","init_life_5":"ไม่เลย","init_life_6":"ไม่เลย","init_life_7":"5","init_goal_1":"ไม่ใช่","init_goal_2":"ไม่ใช่","init_goal_3":"ใช่","init_goal_4":"ไม่ใช่","init_goal_5":"ไม่ใช่"}' },
  { EmployeeID: "0004", Password: "123", FirstName: "นภา", LastName: "สว่างไสว", Department: "บัญชี", Height: 155, TargetWeightLoss: 5, RegistrationDate: "2026-07-01 10:30:00", AssessmentJson: '{"init_life_1":"2-3 วันครั้ง","init_life_2":"2-3 วันครั้ง","init_life_3":"2-3 วันครั้ง","init_life_4":"เป็นประจำ","init_life_5":"ไม่เลย","init_life_6":"2-3 วันครั้ง","init_life_7":"7","init_goal_1":"ใช่","init_goal_2":"ใช่","init_goal_3":"ไม่ใช่","init_goal_4":"ใช่","init_goal_5":"ใช่"}' },
  { EmployeeID: "0009", Password: "123", FirstName: "พาริส", LastName: "สมบัติ", Department: "ไอที", Height: 180, TargetWeightLoss: 12, RegistrationDate: "2026-07-01 11:00:00", AssessmentJson: '{"init_life_1":"เป็นประจำ","init_life_2":"เป็นประจำ","init_life_3":"เป็นประจำ","init_life_4":"เป็นประจำ","init_life_5":"เป็นประจำ","init_life_6":"เป็นประจำ","init_life_7":"10","init_goal_1":"ใช่","init_goal_2":"ใช่","init_goal_3":"ใช่","init_goal_4":"ใช่","init_goal_5":"ใช่"}' }
];

const MOCK_WEEKLY_DATA = [
  // Week 1 (Admin Input for Initial)
  { EmployeeID: "0001", Week: 1, Weight: 85, Waist: 38, Hip: 42, AnswersJson: "[]", SubmitDate: "2026-07-02 08:00:00" },
  { EmployeeID: "0002", Week: 1, Weight: 68, Waist: 32, Hip: 38, AnswersJson: "[]", SubmitDate: "2026-07-02 08:15:00" },
  { EmployeeID: "0003", Week: 1, Weight: 95, Waist: 40, Hip: 44, AnswersJson: "[]", SubmitDate: "2026-07-02 08:30:00" },
  { EmployeeID: "0004", Week: 1, Weight: 60, Waist: 30, Hip: 36, AnswersJson: "[]", SubmitDate: "2026-07-02 08:45:00" },
  { EmployeeID: "0009", Week: 1, Weight: 100, Waist: 42, Hip: 46, AnswersJson: "[]", SubmitDate: "2026-07-02 09:00:00" },

  // Week 2 (Submissions)
  { EmployeeID: "0001", Week: 2, Weight: 84.2, Waist: 37.5, Hip: 41.5, AnswersJson: '[{"qId":"weekly_protein","answer":"ใช่"},{"qId":"weekly_exercise","answer":"ใช่"},{"qId":"weekly_avoid","answer":"ไม่ใช่"},{"qId":"weekly_dinner","answer":"ใช่"}]', SubmitDate: "2026-07-09 12:00:00" },
  { EmployeeID: "0002", Week: 2, Weight: 67.5, Waist: 31.8, Hip: 37.8, AnswersJson: '[{"qId":"weekly_protein","answer":"ใช่"},{"qId":"weekly_exercise","answer":"ไม่ใช่"},{"qId":"weekly_avoid","answer":"ไม่ใช่"},{"qId":"weekly_dinner","answer":"ใช่"}]', SubmitDate: "2026-07-09 12:15:00" },
  { EmployeeID: "0003", Week: 2, Weight: 93.8, Waist: 39.5, Hip: 43.5, AnswersJson: '[{"qId":"weekly_protein","answer":"ใช่"},{"qId":"weekly_exercise","answer":"ใช่"},{"qId":"weekly_avoid","answer":"ไม่ใช่"},{"qId":"weekly_dinner","answer":"ใช่"}]', SubmitDate: "2026-07-09 12:30:00" },
  { EmployeeID: "0004", Week: 2, Weight: 59.5, Waist: 29.8, Hip: 35.8, AnswersJson: '[{"qId":"weekly_protein","answer":"ไม่ใช่"},{"qId":"weekly_exercise","answer":"ไม่ใช่"},{"qId":"weekly_avoid","answer":"ไม่ใช่"},{"qId":"weekly_dinner","answer":"ใช่"}]', SubmitDate: "2026-07-09 12:45:00" },
  // Employee 0009 missed Week 2! (Will be carried forward by LOCF)

  // Week 3 (Submissions)
  { EmployeeID: "0001", Week: 3, Weight: 83.5, Waist: 37.0, Hip: 41.0, AnswersJson: '[{"qId":"weekly_protein","answer":"ใช่"},{"qId":"weekly_exercise","answer":"ใช่"},{"qId":"weekly_avoid","answer":"ไม่ใช่"},{"qId":"weekly_dinner","answer":"ใช่"}]', SubmitDate: "2026-07-16 12:00:00" },
  { EmployeeID: "0002", Week: 3, Weight: 67.8, Waist: 32.0, Hip: 38.0, AnswersJson: '[{"qId":"weekly_protein","answer":"ใช่"},{"qId":"weekly_exercise","answer":"ไม่ใช่"},{"qId":"weekly_avoid","answer":"ใช่"},{"qId":"weekly_dinner","answer":"ไม่ใช่"}]', SubmitDate: "2026-07-16 12:15:00" }, // Weight increased!
  { EmployeeID: "0003", Week: 3, Weight: 92.5, Waist: 39.0, Hip: 43.0, AnswersJson: '[{"qId":"weekly_protein","answer":"ใช่"},{"qId":"weekly_exercise","answer":"ใช่"},{"qId":"weekly_avoid","answer":"ไม่ใช่"},{"qId":"weekly_dinner","answer":"ใช่"}]', SubmitDate: "2026-07-16 12:30:00" },
  { EmployeeID: "0004", Week: 3, Weight: 59.0, Waist: 29.5, Hip: 35.5, AnswersJson: '[{"qId":"weekly_protein","answer":"ใช่"},{"qId":"weekly_exercise","answer":"ใช่"},{"qId":"weekly_avoid","answer":"ไม่ใช่"},{"qId":"weekly_dinner","answer":"ใช่"}]', SubmitDate: "2026-07-16 12:45:00" },
  { EmployeeID: "0009", Week: 3, Weight: 98.2, Waist: 41.2, Hip: 45.2, AnswersJson: '[{"qId":"weekly_protein","answer":"ใช่"},{"qId":"weekly_exercise","answer":"ใช่"},{"qId":"weekly_avoid","answer":"ไม่ใช่"},{"qId":"weekly_dinner","answer":"ใช่"}]', SubmitDate: "2026-07-16 13:00:00" }
];

// Generic JSONP Request Client helper to bypass browser file:// CORS issues
function callApiJSONP(action, payload) {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonp_cb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    
    window[callbackName] = function(data) {
      cleanup();
      resolve(data);
    };
    
    let url = STATE.apiSettings.apiUrl;
    let queryParams = `action=${action}`;
    
    if (payload) {
      queryParams += `&payload=${encodeURIComponent(JSON.stringify(payload))}`;
    }
    
    const separator = url.indexOf('?') !== -1 ? '&' : '?';
    const fullUrl = `${url}${separator}${queryParams}&prefix=${callbackName}`;
    
    const script = document.createElement("script");
    script.src = fullUrl;
    script.id = callbackName;
    
    function cleanup() {
      delete window[callbackName];
      const s = document.getElementById(callbackName);
      if (s) {
        document.body.removeChild(s);
      }
    }
    
    script.onerror = function() {
      cleanup();
      reject(new Error("การเชื่อมต่อฐานข้อมูลล้มเหลว (JSONP connection failed)"));
    };
    
    document.body.appendChild(script);
  });
}

// Document Load Listener
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

// App Initializer
async function initApp() {
  // Load API URL from LocalStorage if available
  const storedUrl = localStorage.getItem("bmi_api_url");
  if (storedUrl) {
    STATE.apiSettings.apiUrl = storedUrl;
    STATE.apiSettings.isMockMode = false;
    document.getElementById("api-url-input").value = storedUrl;
  }
  
  // Initialize local storage questions config
  getInitialQuestions();
  getDailyQuestions();
  
  setupNavigation();
  setupEventListeners();
  await loadData();
  
  // Render dynamic questions
  renderInitialSurvey();
  renderWeeklyQuestions();
  
  // Show active page (default page is Page 1: registration)
  showPage("register-page");
}

// Clean Employee ID helper: trim, strip leading quotes, pad to 6 digits if numeric
function cleanEmployeeId(id) {
  if (id === null || id === undefined) return "";
  const s = id.toString().trim().replace(/^'/, '');
  if (/^\d+$/.test(s) && s.length < 6) {
    return s.padStart(6, '0');
  }
  return s;
}

// Normalize all EmployeeID fields in state arrays
function normalizeStateEmployeeIds() {
  if (Array.isArray(STATE.employees)) {
    STATE.employees.forEach(e => {
      if (e.EmployeeID !== undefined) e.EmployeeID = cleanEmployeeId(e.EmployeeID);
    });
  }
  if (Array.isArray(STATE.registrations)) {
    STATE.registrations.forEach(r => {
      if (r.EmployeeID !== undefined) r.EmployeeID = cleanEmployeeId(r.EmployeeID);
      if (r.employeeId !== undefined) r.employeeId = cleanEmployeeId(r.employeeId);
    });
  }
  if (Array.isArray(STATE.weeklyData)) {
    STATE.weeklyData.forEach(w => {
      if (w.EmployeeID !== undefined) w.EmployeeID = cleanEmployeeId(w.EmployeeID);
      if (w.employeeId !== undefined) w.employeeId = cleanEmployeeId(w.employeeId);
    });
  }
}

// Thai date formatting helper
function formatThaiDate(dateStr) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0]) + 543; // Buddhist Era
      const monthIndex = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      return `${day} ${months[monthIndex]} ${year}`;
    }
  } catch(e) {}
  return dateStr;
}

// Robust helper to parse Assessment JSON with case-insensitivity and object fallbacks
function getParsedAssessment(user) {
  if (!user) return {};
  const raw = user.AssessmentJson || user.assessmentJson || "{}";
  let assessment = {};
  if (typeof raw === "object") {
    assessment = { ...raw };
  } else {
    try {
      assessment = JSON.parse(raw);
    } catch(e) {
      console.error("Failed to parse assessment JSON", e);
      assessment = {};
    }
  }
  
  // Merge direct sheet columns if present
  if (user.init_shift || user.InitShift) {
    assessment.init_shift = user.init_shift || user.InitShift;
  }
  if (user.first_measure_date || user.FirstMeasureDate) {
    assessment.first_measure_date = user.first_measure_date || user.FirstMeasureDate;
  }
  if (user.final_measure_date || user.FinalMeasureDate) {
    assessment.final_measure_date = user.final_measure_date || user.FinalMeasureDate;
  }
  if (user.init_location || user.InitLocation) {
    assessment.init_location = user.init_location || user.InitLocation;
  }
  
  return assessment;
}

// Show/Hide Pages Routing
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active");
  }

  // Update navigation items active state
  document.querySelectorAll(".nav-item").forEach(item => {
    if (item.getAttribute("data-page") === pageId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  document.querySelectorAll(".mobile-nav-item").forEach(item => {
    if (item.getAttribute("data-page") === pageId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Page Specific Init
  if (pageId === "register-page") {
    const regClosedSec = document.getElementById("reg-closed-section");
    const regForm = document.getElementById("reg-form");
    if (regClosedSec && regForm) {
      if (STATE.project.closeRegistration) {
        regClosedSec.style.display = "flex";
        regForm.style.display = "none";
      } else {
        regClosedSec.style.display = "none";
        regForm.style.display = "block";
        
        // Populate first measurement appointment dates dropdown dynamically
        populateRegistrationDates();
      }
    }
  } else if (pageId === "leaderboard-page") {
    renderLeaderboard();
  } else if (pageId === "dashboard-page") {
    checkDashboardLogin();
  } else if (pageId === "admin-page") {
    checkAdminAuth();
  } else if (pageId === "report-page") {
    checkReportLogin();
  }
}

// Setup Nav Event Listeners
function setupNavigation() {
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const pageId = item.getAttribute("data-page");
      showPage(pageId);
    });
  });
}

// Refresh UI for the active tab/page
function refreshActivePageUI() {
  const activePage = document.querySelector(".page.active");
  if (!activePage) return;
  const pageId = activePage.id;
  if (pageId === "leaderboard-page") {
    renderLeaderboard();
  } else if (pageId === "dashboard-page") {
    if (STATE.currentDbUser) {
      renderEmployeeDashboard();
    }
  } else if (pageId === "admin-page") {
    if (STATE.adminAuthenticated) {
      renderAdminPanel();
    }
  } else if (pageId === "report-page") {
    if (STATE.currentUser) {
      renderWeeklyReport();
    }
  }
}

// Load Settings and Sheet Data
async function loadData() {
  const cacheKey = "bmi_api_cache_data";
  const cachedDataStr = localStorage.getItem(cacheKey);
  const cachedSettingsStr = localStorage.getItem("bmi_api_cache_settings");
  
  let hasCache = false;
  if (cachedDataStr && cachedSettingsStr && STATE.apiSettings.apiUrl !== "") {
    try {
      const cached = JSON.parse(cachedDataStr);
      const cachedSettings = JSON.parse(cachedSettingsStr);
      
      STATE.employees = cached.employees || [];
      STATE.registrations = cached.registrations || [];
      STATE.weeklyData = cached.weeklyData || [];
      normalizeStateEmployeeIds();
      STATE.questions = cached.questions || [];
      STATE.project = { ...STATE.project, ...cachedSettings };
      hasCache = true;
      
      // Render immediate UI from cache
      renderInitialSurvey();
      renderWeeklyQuestions();
      refreshActivePageUI();
    } catch(e) {
      console.warn("Failed to parse cached API data", e);
    }
  }

  // Only show spinner loader if cache is empty
  if (!hasCache) {
    toggleLoader(true);
  }
  
  if (STATE.apiSettings.apiUrl === "") {
    // RUNNING IN MOCK MODE
    STATE.apiSettings.isMockMode = true;
    
    // Load setting data from localStorage or fallback to defaults
    const localSettings = localStorage.getItem("bmi_local_settings");
    if (localSettings) {
      const parsed = JSON.parse(localSettings);
      STATE.project = {
        ...STATE.project,
        ...parsed
      };
    }
    
    // Fetch mock database
    STATE.employees = JSON.parse(localStorage.getItem("bmi_local_employees")) || DEFAULT_EMPLOYEE_DB;
    STATE.registrations = JSON.parse(localStorage.getItem("bmi_local_regs")) || MOCK_REGISTRATIONS;
    STATE.weeklyData = JSON.parse(localStorage.getItem("bmi_local_weekly")) || MOCK_WEEKLY_DATA;
    normalizeStateEmployeeIds();
    STATE.questions = getDailyQuestions();
    
    console.log("App running in MOCK mode. Data loaded from localStorage/mock variables.");
    updateMockBadge(true);
  } else {
    // RUNNING IN GOOGLE SHEETS LIVE API MODE
    STATE.apiSettings.isMockMode = false;
    updateMockBadge(false);
    
    try {
      const result = await callApiJSONP("getAllData");
      
      if (result.success) {
        STATE.employees = result.data.employees;
        STATE.registrations = result.data.registrations;
        STATE.weeklyData = result.data.weeklyData;
        normalizeStateEmployeeIds();
        
        // Refresh active user references from the newly loaded dataset to prevent stale cache bugs
        if (STATE.currentDbUser) {
          const freshDbUser = STATE.registrations.find(r => String(r.EmployeeID).trim() === String(STATE.currentDbUser.EmployeeID).trim());
          if (freshDbUser) STATE.currentDbUser = freshDbUser;
        }
        if (STATE.currentUser) {
          const freshUser = STATE.registrations.find(r => String(r.EmployeeID).trim() === String(STATE.currentUser.EmployeeID).trim());
          if (freshUser) STATE.currentUser = freshUser;
        }
        
        STATE.questions = result.data.questions.length > 0 ? result.data.questions.map(q => {
          return {
            QuestionID: parseInt(q.QuestionID),
            id: q.id || `weekly_${q.QuestionID}`,
            text: q.QuestionText || q.text || "",
            type: (q.Type || q.type || "boolean").toLowerCase(),
            options: q.Options ? q.Options.split(",").map(s => s.trim()).filter(Boolean) : (q.options || [])
          };
        }) : getDailyQuestions();
        setDailyQuestions(STATE.questions);
        if (result.data.settings.StartDate !== undefined) STATE.project.startDate = result.data.settings.StartDate;
        if (result.data.settings.EndDate !== undefined) STATE.project.endDate = result.data.settings.EndDate;
        if (result.data.settings.HideFinalResults !== undefined) STATE.project.hideFinalResults = (result.data.settings.HideFinalResults === "true" || result.data.settings.HideFinalResults === true);
        if (result.data.settings.CloseRegistration !== undefined) STATE.project.closeRegistration = (result.data.settings.CloseRegistration === "true" || result.data.settings.CloseRegistration === true);
        if (result.data.settings.MeasureStartA !== undefined) STATE.project.measureStartA = result.data.settings.MeasureStartA;
        if (result.data.settings.MeasureStartB !== undefined) STATE.project.measureStartB = result.data.settings.MeasureStartB;
        if (result.data.settings.MeasureEndA !== undefined) STATE.project.measureEndA = result.data.settings.MeasureEndA;
        if (result.data.settings.MeasureEndB !== undefined) STATE.project.measureEndB = result.data.settings.MeasureEndB;
        if (result.data.settings.MeasureStartA_LPN1 !== undefined) STATE.project.measureStartA_LPN1 = result.data.settings.MeasureStartA_LPN1;
        if (result.data.settings.MeasureStartA_LPN2 !== undefined) STATE.project.measureStartA_LPN2 = result.data.settings.MeasureStartA_LPN2;
        if (result.data.settings.MeasureStartB_LPN1 !== undefined) STATE.project.measureStartB_LPN1 = result.data.settings.MeasureStartB_LPN1;
        if (result.data.settings.MeasureStartB_LPN2 !== undefined) STATE.project.measureStartB_LPN2 = result.data.settings.MeasureStartB_LPN2;
        if (result.data.settings.MeasureEndA_LPN1 !== undefined) STATE.project.measureEndA_LPN1 = result.data.settings.MeasureEndA_LPN1;
        if (result.data.settings.MeasureEndA_LPN2 !== undefined) STATE.project.measureEndA_LPN2 = result.data.settings.MeasureEndA_LPN2;
        if (result.data.settings.MeasureEndB_LPN1 !== undefined) STATE.project.measureEndB_LPN1 = result.data.settings.MeasureEndB_LPN1;
        if (result.data.settings.MeasureEndB_LPN2 !== undefined) STATE.project.measureEndB_LPN2 = result.data.settings.MeasureEndB_LPN2;
        if (result.data.settings.AdminPassword !== undefined) STATE.project.adminPassword = result.data.settings.AdminPassword;
        if (result.data.settings.LocationTextLPN1 !== undefined) STATE.project.locationTextLPN1 = result.data.settings.LocationTextLPN1;
        if (result.data.settings.LocationTextLPN2 !== undefined) STATE.project.locationTextLPN2 = result.data.settings.LocationTextLPN2;
        
        // Cache data for future loads
        localStorage.setItem(cacheKey, JSON.stringify({
          employees: STATE.employees,
          registrations: STATE.registrations,
          weeklyData: STATE.weeklyData,
          questions: STATE.questions
        }));
        localStorage.setItem("bmi_api_cache_settings", JSON.stringify(STATE.project));
        
        // Update UI
        renderInitialSurvey();
        renderWeeklyQuestions();
        refreshActivePageUI();
      } else {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลจาก Google Sheets: " + result.error);
      }
    } catch (err) {
      console.warn("ไม่สามารถเชื่อมต่อกับ Google Apps Script Web App ได้ ระบบจะเปลี่ยนไปใช้งาน Mock Mode ชั่วคราว", err);
      STATE.apiSettings.isMockMode = true;
      updateMockBadge(true);
      
      STATE.employees = DEFAULT_EMPLOYEE_DB;
      STATE.registrations = MOCK_REGISTRATIONS;
      STATE.weeklyData = MOCK_WEEKLY_DATA;
      normalizeStateEmployeeIds();
      STATE.questions = getDailyQuestions();
    }
  }
  populateRegistrationLocationDropdown();
  toggleLoader(false);
}

function populateRegistrationLocationDropdown() {
  const select = document.getElementById("reg-location");
  if (select) {
    const text1 = STATE.project.locationTextLPN1 || "LPN1 ณ ห้อง Old lobby Plant2 เวลา 9.00 - 11.30 น.";
    const text2 = STATE.project.locationTextLPN2 || "LPN2 ณ ห้อง Locker ชั้น 2 เวลา 13.30 - 15.30 น.";
    const currentVal = select.value;
    
    select.innerHTML = `
      <option value="" disabled selected>-- เลือกสถานที่ตรวจ --</option>
      <option value="LPN1">${text1}</option>
      <option value="LPN2">${text2}</option>
    `;
    
    if (currentVal) {
      select.value = currentVal;
    }
  }
}

function populateRegistrationDates() {
  const measureDateSelect = document.getElementById("reg-measure-date");
  if (!measureDateSelect) return;

  const locSelect = document.getElementById("reg-location");
  const selectedLoc = locSelect ? locSelect.value : "";

  if (!selectedLoc) {
    measureDateSelect.innerHTML = `<option value="" disabled selected>-- กรุณาเลือกสถานที่ตรวจก่อน --</option>`;
    measureDateSelect.disabled = true;
    return;
  }

  let dateA = STATE.project.measureStartA;
  let dateB = STATE.project.measureStartB;

  if (selectedLoc === "LPN1") {
    dateA = STATE.project.measureStartA_LPN1 || STATE.project.measureStartA;
    dateB = STATE.project.measureStartB_LPN1 || STATE.project.measureStartB;
  } else if (selectedLoc === "LPN2") {
    dateA = STATE.project.measureStartA_LPN2 || STATE.project.measureStartA;
    dateB = STATE.project.measureStartB_LPN2 || STATE.project.measureStartB;
  }

  const dateAStr = formatThaiDate(dateA);
  const dateBStr = formatThaiDate(dateB);

  const prevVal = measureDateSelect.value;

  measureDateSelect.innerHTML = `
    <option value="" disabled selected>-- เลือกวันนัดหมายครั้งแรก --</option>
    <option value="ทีม A: ${dateAStr}">ทีม A: วัดน้ำหนัก รอบเอว รอบสะโพก วันที่ ${dateAStr}</option>
    <option value="ทีม B: ${dateBStr}">ทีม B: วัดน้ำหนัก รอบเอว รอบสะโพก วันที่ ${dateBStr}</option>
  `;

  measureDateSelect.disabled = false;

  if (prevVal) {
    const exists = Array.from(measureDateSelect.options).some(opt => opt.value === prevVal);
    if (exists) {
      measureDateSelect.value = prevVal;
    }
  }
}

// Update Mode indicator UI
function updateMockBadge(isMock) {
  const badge = document.getElementById("mock-badge");
  if (badge) {
    if (isMock) {
      badge.style.display = "inline-flex";
      badge.innerText = "โหมดทดสอบ (Mock Data)";
    } else {
      badge.style.display = "none";
    }
  }
}

// Save mock data state to localstorage for demo persistence
function saveMockState() {
  if (STATE.apiSettings.isMockMode) {
    localStorage.setItem("bmi_local_settings", JSON.stringify(STATE.project));
    localStorage.setItem("bmi_local_employees", JSON.stringify(STATE.employees));
    localStorage.setItem("bmi_local_regs", JSON.stringify(STATE.registrations));
    localStorage.setItem("bmi_local_weekly", JSON.stringify(STATE.weeklyData));
    localStorage.setItem("bmi_weekly_questions", JSON.stringify(STATE.questions));
    localStorage.setItem("bmi_initial_questions", JSON.stringify(getInitialQuestions()));
  }
}

// Global Loader Spinner Toggle
function toggleLoader(show) {
  const loader = document.getElementById("global-loader");
  if (loader) {
    loader.style.display = show ? "flex" : "none";
  }
}

// Calculate Project timeline metrics
function getTimelineMetrics() {
  if (STATE.project.startDate) {
    if (!STATE.project.endDate) {
      // Calculate end date based on start date + durationDays (90 days)
      const start = new Date(STATE.project.startDate);
      const end = new Date(start.getTime() + STATE.project.durationDays * 24 * 60 * 60 * 1000);
      const y = end.getFullYear();
      const m = String(end.getMonth() + 1).padStart(2, '0');
      const d = String(end.getDate()).padStart(2, '0');
      STATE.project.endDate = `${y}-${m}-${d}`;
    } else {
      // Calculate durationDays based on startDate and endDate
      const start = new Date(STATE.project.startDate);
      const end = new Date(STATE.project.endDate);
      const diffTime = end - start;
      STATE.project.durationDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    }
  }

  const start = new Date(STATE.project.startDate);
  const today = new Date();
  
  // Calculate difference in days
  const diffTime = today - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate max weeks (e.g. 90 days = 13 weeks)
  const maxWeeks = Math.ceil(STATE.project.durationDays / 7) || 13;
  
  // Calculate current week (Week 1 = Day 0 to 6, Week 2 = Day 7 to 13, etc.)
  let currentWeek = Math.floor(diffDays / 7) + 1;
  
  // Bound week number between 1 and maxWeeks
  if (currentWeek < 1) currentWeek = 1;
  
  const daysLeft = Math.max(0, STATE.project.durationDays - diffDays);
  
  return {
    diffDays,
    currentWeek,
    maxWeeks,
    daysLeft,
    isExpired: diffDays >= STATE.project.durationDays
  };
}

// Safety target loss evaluation helper
function evaluateWeightLossSafety(weight, target) {
  const kg = parseFloat(target);
  const wt = parseFloat(weight);
  
  if (isNaN(kg) || kg <= 0) {
    return { valid: false, message: "กรุณาระบุเป้าหมายตัวเลขน้ำหนักที่ถูกต้อง" };
  }
  
  const timeline = getTimelineMetrics();
  const weeks = timeline.maxWeeks;
  const kgPerWeek = kg / weeks;
  const percentLoss = (kg / wt) * 100;
  
  if (kgPerWeek <= 0.5) {
    return {
      valid: true,
      class: "alert-info",
      message: `เป้าหมายนี้ปลอดภัยและทำได้จริงอย่างแน่นอน! คุณต้องการลดเฉลี่ยเพียง ${kgPerWeek.toFixed(2)} กก./สัปดาห์ (คิดเป็น ${percentLoss.toFixed(1)}% ของน้ำหนักตัว)`
    };
  } else if (kgPerWeek <= 1.0) {
    return {
      valid: true,
      class: "alert-info",
      message: `เป้าหมายยอดเยี่ยม! อยู่ในเกณฑ์มาตรฐานเพื่อสุขภาพที่ดี (ลดเฉลี่ย ${kgPerWeek.toFixed(2)} กก./สัปดาห์ คิดเป็น ${percentLoss.toFixed(1)}% ของน้ำหนักตัว)`
    };
  } else if (percentLoss <= 15.0) {
    return {
      valid: true,
      class: "alert-warning",
      message: `⚠️ เป้าหมายนี้ค่อนข้างท้าทายมาก (ลดเฉลี่ย ${kgPerWeek.toFixed(2)} กก./สัปดาห์ คิดเป็น ${percentLoss.toFixed(1)}% ของน้ำหนักตัว) ต้องใช้ระเบียบวินัยและโภชนาการที่เข้มงวด โปรดระวังอย่าหักโหมจนเสียสุขภาพ!`
    };
  } else {
    return {
      valid: false,
      class: "alert-danger",
      message: `❌ เป้าหมายนี้อันตรายเกินไป! การลดน้ำหนักมากกว่า 15% ของน้ำหนักตัว (${kg.toFixed(1)} กก.) ภายใน ${STATE.project.durationDays} วัน เสี่ยงต่อการโยโย่และกล้ามเนื้อสลายตัวสูง แนะนำให้ระบุเป้าหมายลดไม่เกิน 10% หรือประมาณ ${(wt * 0.1).toFixed(1)} กิโลกรัมก่อนในระยะแรก`
    };
  }
}

// ----------------------------------------------------
// PAGE 1: REGISTRATION LOGIC
// ----------------------------------------------------

// Auto search and load pre-existing employee data
function handleSearchEmployee() {
  const empIdInput = document.getElementById("reg-empid");
  const empId = empIdInput.value.toString().trim();
  
  // Preserve leading zeros: pad to 6 digits if numeric and less than 6 digits (e.g. 089235)
  let searchId = empId;
  if (/^\d+$/.test(searchId) && searchId.length < 6) {
    searchId = searchId.padStart(6, '0');
    empIdInput.value = searchId;
  }
  
  // Clear fields and hide details form by default
  document.getElementById("reg-name").value = "";
  document.getElementById("reg-surname").value = "";
  document.getElementById("reg-dept").value = "";
  document.getElementById("reg-phone").value = "";
  document.getElementById("reg-height").value = "";
  
  const regLocationSelect = document.getElementById("reg-location");
  if (regLocationSelect) {
    regLocationSelect.value = "";
  }
  const regMeasureDateSelect = document.getElementById("reg-measure-date");
  if (regMeasureDateSelect) {
    regMeasureDateSelect.value = "";
    regMeasureDateSelect.innerHTML = `<option value="" disabled selected>-- กรุณาเลือกสถานที่ตรวจก่อน --</option>`;
    regMeasureDateSelect.disabled = true;
  }
  
  // Search registrations first to prevent duplicates
  const alreadyReg = STATE.registrations.find(r => String(r.EmployeeID).trim() === String(searchId).trim());
  if (alreadyReg) {
    document.getElementById("reg-details-fields").style.display = "none";
    showRegAlert("รหัสพนักงานนี้สมัครเข้าร่วมโครงการแล้ว ไม่สามารถสมัครซ้ำได้ คุณสามารถไปที่หน้าแดชบอร์ดเพื่อเข้าสู่ระบบ", "alert-danger");
    return;
  } else {
    clearRegAlert();
  }
  
  // Always open the fields container
  document.getElementById("reg-details-fields").style.display = "block";
  
  // Search in pre-existing database
  const employee = STATE.employees.find(e => String(e.EmployeeID).trim() === String(searchId).trim());
  if (employee) {
    document.getElementById("reg-name").value = employee.FirstName || "";
    document.getElementById("reg-surname").value = employee.LastName || "";
    document.getElementById("reg-dept").value = employee.Department || "";
    
    // Disable inputs as data is official
    document.getElementById("reg-name").disabled = true;
    document.getElementById("reg-surname").disabled = true;
    document.getElementById("reg-dept").disabled = true;
    document.getElementById("reg-phone").disabled = false; // Always keep phone enabled
    
    // Check if height exists and is valid
    const heightVal = parseFloat(employee.Height);
    if (!isNaN(heightVal) && heightVal > 0) {
      document.getElementById("reg-height").value = heightVal;
      document.getElementById("reg-height").disabled = true;
      showRegAlert("ดึงข้อมูลพนักงานสำเร็จ ข้อมูลหลักของท่านถูกล็อกไว้ กรุณากรอกเบอร์โทรภายใน สัดส่วนและเป้าหมายที่เหลือเพื่อดำเนินการต่อค่ะ", "alert-info");
    } else {
      document.getElementById("reg-height").value = "";
      document.getElementById("reg-height").disabled = false; // Allow manual entry
      showRegAlert("ดึงข้อมูลพนักงานสำเร็จ แต่ไม่พบข้อมูลส่วนสูงในระบบ กรุณากรอกเบอร์โทรภายใน ส่วนสูงของท่าน และเป้าหมายเพื่อดำเนินการต่อค่ะ", "alert-info");
    }
  } else {
    // Enable inputs for manual registration entry
    document.getElementById("reg-name").disabled = false;
    document.getElementById("reg-surname").disabled = false;
    document.getElementById("reg-dept").disabled = false;
    document.getElementById("reg-phone").disabled = false;
    document.getElementById("reg-height").disabled = false;
    
    showRegAlert("ไม่พบข้อมูลรหัสพนักงานนี้ในฐานข้อมูลระบบของโครงการ ท่านสามารถกรอกข้อมูลประวัติและสัดส่วนด้วยตนเองเพื่อสมัครเข้าร่วมได้เลยค่ะ", "alert-warning");
  }
}

// Live weight loss evaluation check
function handleTargetWeightEvaluation() {
  const heightVal = parseFloat(document.getElementById("reg-height").value);
  const weightVal = parseFloat(document.getElementById("reg-weight").value);
  const targetVal = parseFloat(document.getElementById("reg-target-loss").value);
  const feedbackDiv = document.getElementById("target-feedback");
  
  if (isNaN(weightVal) || isNaN(targetVal)) {
    feedbackDiv.style.display = "none";
    return;
  }
  
  // Calculate BMI first to check if they qualify
  if (!isNaN(heightVal) && heightVal > 0) {
    const bmi = parseFloat((weightVal / Math.pow(heightVal / 100, 2)).toFixed(1));
    if (bmi < 23.0) {
      feedbackDiv.style.display = "flex";
      feedbackDiv.className = "alert alert-warning";
      feedbackDiv.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> <span><strong>หมายเหตุ:</strong> ดัชนีมวลกาย (BMI) ของท่านคือ ${bmi.toFixed(1)} (ต่ำกว่า 23.0) ท่านสามารถเข้าร่วมติดตามสุขภาพส่วนตัวได้ แต่จะไม่ได้รับสิทธิ์จัดอันดับชิงรางวัลค่ะ</span>`;
      document.getElementById("reg-submit-btn").disabled = false;
      return;
    }
  }
  
  const evalResult = evaluateWeightLossSafety(weightVal, targetVal);
  feedbackDiv.style.display = "flex";
  feedbackDiv.className = `alert ${evalResult.class}`;
  feedbackDiv.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> <span>${evalResult.message}</span>`;
  
  // Disable submit if safety limit exceeded
  document.getElementById("reg-submit-btn").disabled = !evalResult.valid;
}

function showRegAlert(msg, className) {
  const box = document.getElementById("reg-alert-box");
  box.style.display = "flex";
  box.className = `alert ${className}`;
  box.innerHTML = `<span>${msg}</span>`;
}

function clearRegAlert() {
  const box = document.getElementById("reg-alert-box");
  box.style.display = "none";
}

// Register Submission Action
async function handleRegistrationSubmit(e) {
  e.preventDefault();
  
  const employeeId = cleanEmployeeId(document.getElementById("reg-empid").value);
  const firstName = document.getElementById("reg-name").value.trim();
  const lastName = document.getElementById("reg-surname").value.trim();
  const department = document.getElementById("reg-dept").value.trim();
  const phone = document.getElementById("reg-phone").value.trim();
  const height = parseFloat(document.getElementById("reg-height").value);
  const weight = parseFloat(document.getElementById("reg-weight").value);
  const targetWeightLoss = parseFloat(document.getElementById("reg-target-loss").value);
  const password = document.getElementById("reg-password").value;
  const shift = document.getElementById("reg-shift").value;
  const firstMeasureDate = document.getElementById("reg-measure-date").value;
  const location = document.getElementById("reg-location").value;
  
  if (!employeeId || !firstName || !lastName || !department || !phone || isNaN(height) || isNaN(weight) || isNaN(targetWeightLoss) || !password || !shift || !firstMeasureDate || !location) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง");
    return;
  }
  
  // Validate PDPA checkbox
  const pdpaChecked = document.getElementById("reg-pdpa").checked;
  if (!pdpaChecked) {
    alert("กรุณากดเลือกเครื่องหมายยอมรับข้อตกลงนโยบายข้อมูลส่วนบุคคล (PDPA) เพื่อสมัครเข้าร่วมโครงการค่ะ");
    return;
  }
  
  // Validate Phone Extension is 1-4 digits
  if (!/^\d{1,4}$/.test(phone)) {
    alert("กรุณากรอกเบอร์โทรภายในเป็นตัวเลข 1 ถึง 4 หลักค่ะ");
    return;
  }
  
  const evalResult = evaluateWeightLossSafety(weight, targetWeightLoss);
  if (!evalResult.valid) {
    alert("เป้าหมายน้ำหนักที่ต้องการลดไม่ผ่านเกณฑ์ความปลอดภัย กรุณาปรับเปลี่ยนให้เหมาะสม");
    return;
  }

  // Prevent double registration check on client-side
  const alreadyReg = STATE.registrations.find(r => String(r.EmployeeID).trim() === String(employeeId).trim());
  if (alreadyReg) {
    alert("รหัสพนักงานนี้สมัครเข้าร่วมโครงการแล้ว ไม่สามารถสมัครซ้ำได้");
    return;
  }
  
  // Gather registration questionnaire answers
  const initialQuestions = getInitialQuestions();
  const assessment = {};
  for (let q of initialQuestions) {
    const key = `reg-q-${q.id || q.QuestionID}`;
    const selectEl = document.getElementById(key);
    if (selectEl) {
      if (!selectEl.value) {
        alert("กรุณาตอบคำถามแบบประเมินก่อนเข้าร่วมโครงการให้ครบถ้วนทุกข้อ");
        return;
      }
      assessment[q.id || q.QuestionID] = selectEl.value;
    } else {
      const checkedEl = document.querySelector(`input[name="${key}"]:checked`);
      if (!checkedEl) {
        alert("กรุณาตอบคำถามแบบประเมินก่อนเข้าร่วมโครงการให้ครบถ้วนทุกข้อ");
        return;
      }
      assessment[q.id || q.QuestionID] = checkedEl.value;
    }
  }
  
  // Add shift and first measurement appointment information to assessment JSON
  assessment["init_shift"] = shift;
  assessment["first_measure_date"] = firstMeasureDate;
  assessment["init_location"] = location;
  
  const assessmentJson = JSON.stringify(assessment);
  
  const payload = {
    action: "register",
    employeeId,
    password,
    firstName,
    lastName,
    department,
    phone,
    height,
    targetWeightLoss,
    assessmentJson,
    weight
  };
  
  // Intercept submit and display assessment feedback summary modal
  showRegistrationSummaryModal(payload);
}

// Global state holding payload for registration confirmation
let TEMP_REGISTRATION_PAYLOAD = null;

// Display the registration feedback summary modal
function showRegistrationSummaryModal(payload) {
  TEMP_REGISTRATION_PAYLOAD = payload;
  
  const height = payload.height;
  const weight = payload.weight;
  const targetWeightLoss = payload.targetWeightLoss;
  const assessment = JSON.parse(payload.assessmentJson);
  
  // Calculate BMI
  const bmi = parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1));
  let bmiClass = "";
  let bmiColor = "";
  
  if (bmi < 18.5) {
    bmiClass = "น้ำหนักน้อยกว่าเกณฑ์ (Underweight)";
    bmiColor = "#0284c7"; // Blue
  } else if (bmi < 23.0) {
    bmiClass = "น้ำหนักปกติสุขภาพดี (Normal Weight)";
    bmiColor = "#10b981"; // Emerald
  } else if (bmi < 25.0) {
    bmiClass = "น้ำหนักเกินเกณฑ์ (Overweight)";
    bmiColor = "#f59e0b"; // Orange
  } else if (bmi < 30.0) {
    bmiClass = "โรคอ้วนระดับ 1 (Obese Class 1)";
    bmiColor = "#ef4444"; // Red
  } else {
    bmiClass = "โรคอ้วนระดับ 2 (Obese Class 2)";
    bmiColor = "#b91c1c"; // Dark Red
  }
  
  // Render Group eligibility badge
  let eligibilityHtml = "";
  if (bmi < 23.0) {
    eligibilityHtml = `
      <div class="alert alert-warning" style="margin-top: 10px; font-size: 0.82rem; padding: 8px 12px; margin-bottom: 0;">
        ⚠️ <strong>ผู้เข้าร่วมทั่วไป:</strong> ค่า BMI แรกรับของท่านคือ <strong>${bmi.toFixed(1)}</strong> (ต่ำกว่า 23.0) ท่านเข้าร่วมเพื่อติดตามสุขภาพส่วนบุคคลได้ตามปกติ แต่จะไม่มีสิทธิ์ชิงรางวัลลดน้ำหนักในทำเนียบอันดับค่ะ
      </div>
    `;
  } else {
    eligibilityHtml = `
      <div class="alert alert-success" style="margin-top: 10px; font-size: 0.82rem; padding: 8px 12px; margin-bottom: 0;">
        🏆 <strong>กลุ่มชิงรางวัล:</strong> ค่า BMI แรกรับของท่านคือ <strong>${bmi.toFixed(1)}</strong> ผ่านเกณฑ์เข้าร่วมแข่งขันลดน้ำหนักเพื่อชิงรางวัลของโครงการค่ะ!
      </div>
    `;
  }
  
  // Render Health section
  const healthContainer = document.getElementById("reg-summary-health");
  healthContainer.innerHTML = `
    <div style="background-color: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 1.25rem; margin-top: 10px;">
      <h4 style="margin-top:0; margin-bottom: 0.75rem; color:var(--dark-slate); font-weight:800;">📊 ผลการวิเคราะห์ดัชนีมวลกาย (BMI)</h4>
      <div class="grid-3" style="gap:15px; margin-bottom:0.75rem;">
        <div>น้ำหนักแรกรับ: <strong style="font-size:1.05rem; color:var(--dark-slate);">${weight.toFixed(1)} กก.</strong></div>
        <div>ส่วนสูง: <strong style="font-size:1.05rem; color:var(--dark-slate);">${height.toFixed(1)} ซม.</strong></div>
        <div>ค่า BMI: <strong style="color:${bmiColor}; font-size:1.15rem;">${bmi.toFixed(1)}</strong></div>
      </div>
      <div style="font-size:0.9rem; border-top: 1px dashed #e2e8f0; padding-top:8px; margin-top:8px;">
        สถานะสุขภาพของท่าน: <span class="badge" style="background-color:${bmiColor}; color:#fff; font-weight:700; font-size:0.8rem; display:inline-block; padding: 4px 10px; border-radius:4px; margin-left: 5px;">${bmiClass}</span>
      </div>
      ${eligibilityHtml}
    </div>
  `;
  
  // Analyze behaviors
  const behaviors = [
    { key: "init_life_1", label: "กินผักผลไม้รสหวานน้อย", defaultGoodVal: "เป็นประจำ", defaultWarningVal: "ไม่เลย", advice: "ควรทานผักผลไม้เพิ่มในมื้ออาหารเพื่อเพิ่มกากใย" },
    { key: "init_life_2", label: "ควบคุมปริมาณข้าวหรือแป้ง", defaultGoodVal: "เป็นประจำ", defaultWarningVal: "ไม่เลย", advice: "ควรลดสัดส่วนแป้งขัดสีลง" },
    { key: "init_life_3", label: "หลีกเลี่ยงของหวาน/ขนม/ของทอด", defaultGoodVal: "เป็นประจำ", defaultWarningVal: "ไม่เลย", advice: "ควรระวังการสะสมพลังงานส่วนเกินจากไขมันและน้ำตาล" },
    { key: "init_life_4", label: "ดื่มน้ำเปล่า 8 แก้ว/งดแอลกอฮอล์", defaultGoodVal: "เป็นประจำ", defaultWarningVal: "ไม่เลย", advice: "ควรดื่มน้ำเปล่าเพิ่มขึ้นเพื่อช่วยการเผาผลาญ" },
    { key: "init_life_5", label: "ออกกำลังกาย 150 นาที/สัปดาห์", defaultGoodVal: "เป็นประจำ", defaultWarningVal: "ไม่เลย", advice: "ควรจัดเวลาออกกำลังกายแบบคาร์ดิโอเพิ่มขึ้น" },
    { key: "init_life_6", label: "ขยับร่างกายระหว่างวันสม่ำเสมอ", defaultGoodVal: "เป็นประจำ", defaultWarningVal: "ไม่เลย", advice: "ควรเพิ่มกิจกรรมขยับร่างกายระหว่างวัน เช่น เดินขึ้นบันได" }
  ];
  
  let improvementsList = [];
  let goodsList = [];
  let behaviorHtml = "";
  
  const questions = getInitialQuestions();
  
  behaviors.forEach(b => {
    const q = questions.find(item => (item.id || item.QuestionID) === b.key);
    const text = q ? (q.text || q.QuestionText) : "";
    
    let goodVal = b.defaultGoodVal;
    let warningVal = b.defaultWarningVal;
    let label = b.label;
    
    // Invert logic dynamically if question changed from "avoid" to "consume" unhealthy items
    if (b.key === "init_life_3") {
      if (text.includes("ทาน") || text.includes("กิน") || text.includes("ดื่ม")) {
        if (!text.includes("หลีกเลี่ยง") && !text.includes("เลี่ยง") && !text.includes("งด")) {
          goodVal = "ไม่เลย";
          warningVal = "เป็นประจำ";
          label = "การกินของหวาน/ขนม/ของทอด";
        }
      }
    }
    
    const ans = assessment[b.key];
    const isGood = ans === goodVal;
    const isCritical = ans === warningVal;
    
    let statusText = "";
    let statusColor = "";
    if (isGood) {
      statusText = "เหมาะสมดีมาก 🟢";
      statusColor = "var(--primary-dark)";
      goodsList.push(label);
    } else {
      statusText = isCritical ? "ควรปรับปรุงอย่างยิ่ง 🔴" : "ควรปรับปรุง 🟡";
      statusColor = isCritical ? "#b91c1c" : "#d97706";
      improvementsList.push(label);
    }
    
    behaviorHtml += `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; font-size:0.85rem; color:var(--dark-slate); font-weight:600;">${label}</td>
        <td style="padding: 10px 0; font-size:0.85rem; color:var(--gray-text); text-align:center;">${ans || "-"}</td>
        <td style="padding: 10px 0; font-size:0.85rem; font-weight:700; color:${statusColor}; text-align:right;">${statusText}</td>
      </tr>
    `;
  });
  
  const behaviorsContainer = document.getElementById("reg-summary-behaviors");
  behaviorsContainer.innerHTML = `
    <h4 style="margin-bottom:0.5rem; color:var(--dark-slate); font-weight:800;">🥗 ผลการประเมินพฤติกรรมเดิมของท่าน</h4>
    <table style="width:100%; border-collapse:collapse; margin-bottom:0.5rem;">
      <thead>
        <tr style="border-bottom: 2px solid #e2e8f0; text-align:left; color:var(--gray-text); font-size:0.8rem;">
          <th style="padding-bottom:6px; font-weight:700;">พฤติกรรม</th>
          <th style="padding-bottom:6px; font-weight:700; text-align:center;">คำตอบของท่าน</th>
          <th style="padding-bottom:6px; font-weight:700; text-align:right;">สถานะประเมิน</th>
        </tr>
      </thead>
      <tbody>
        ${behaviorHtml}
      </tbody>
    </table>
  `;
  
  // Render Achievability and target section
  const safety = evaluateWeightLossSafety(weight, targetWeightLoss);
  let feedbackText = "";
  let feedbackClass = "";
  
  if (improvementsList.length === 0) {
    feedbackClass = "alert-success";
    feedbackText = `🎉 <strong>ยอดเยี่ยมมากค่ะ!</strong> ท่านมีพฤติกรรมสุขภาพที่ดีมากอยู่แล้วทุกด้าน เป้าหมายลดน้ำหนัก <strong>${targetWeightLoss} กก.</strong> ของท่านมีโอกาสสำเร็จสูงมาก หากท่านใช้โครงการนี้เป็นตัวช่วยรักษาความสม่ำเสมอและติดตามผลค่ะ!`;
  } else if (improvementsList.length <= 2) {
    feedbackClass = "alert-info";
    feedbackText = `👍 <strong>มีโอกาสสำเร็จสูงมาก!</strong> พฤติกรรมส่วนใหญ่ของท่านดีแล้ว มีพฤติกรรมที่แนะนำให้ปรับปรุงเพิ่มเติมเพียงเล็กน้อย คือ <strong>${improvementsList.join(" และ ")}</strong> หากปรับปรุงตามแผนของโครงการ 90 วันนี้จะส่งเสริมให้บรรลุเป้าหมาย <strong>${targetWeightLoss} กก.</strong> ได้สำเร็จอย่างมีประสิทธิภาพค่ะ`;
  } else {
    feedbackClass = "alert-warning";
    feedbackText = `⚠️ <strong>เป้าหมายนี้จะสำเร็จได้หากมีความมุ่งมั่นตั้งใจปรับเปลี่ยนพฤติกรรม!</strong> เนื่องจากพฤติกรรมเดิมของท่านมีหลายส่วนที่ควรปรับปรุง (รวม ${improvementsList.length} ด้าน เช่น ${improvementsList.slice(0, 3).join(", ")}) การจะลดน้ำหนักได้ <strong>${targetWeightLoss} กก.</strong> ท่านจึงต้องจริงจังในการปฏิบัติตามวินัยของโครงการ 90 วันนี้ เพื่อสุขภาพที่ดีของตัวท่านเองค่ะ`;
  }
  
  const achievabilityContainer = document.getElementById("reg-summary-achievability");
  achievabilityContainer.innerHTML = `
    <h4 style="margin-bottom:0.5rem; color:var(--dark-slate); font-weight:800;">🎯 บทวิเคราะห์เป้าหมายและความเป็นไปได้</h4>
    <div class="alert ${feedbackClass}" style="margin-bottom: 0.75rem; padding: 0.85rem 1.25rem;">
      <span>${feedbackText}</span>
    </div>
    <div class="alert ${safety.class}" style="padding: 0.85rem 1.25rem; font-size:0.8rem; margin-bottom:0;">
      <span>${safety.message}</span>
    </div>
  `;
  
  // Open modal
  const modal = document.getElementById("reg-summary-modal");
  modal.classList.add("active");
}

// Actual submission logic called after clicking confirm in summary modal
async function executeRegistrationSubmit() {
  const modal = document.getElementById("reg-summary-modal");
  modal.classList.remove("active");
  
  if (!TEMP_REGISTRATION_PAYLOAD) return;
  
  toggleLoader(true);
  
  const employeeId = TEMP_REGISTRATION_PAYLOAD.employeeId;
  const password = TEMP_REGISTRATION_PAYLOAD.password;
  const firstName = TEMP_REGISTRATION_PAYLOAD.firstName;
  const lastName = TEMP_REGISTRATION_PAYLOAD.lastName;
  const department = TEMP_REGISTRATION_PAYLOAD.department;
  const phone = TEMP_REGISTRATION_PAYLOAD.phone;
  const height = TEMP_REGISTRATION_PAYLOAD.height;
  const targetWeightLoss = TEMP_REGISTRATION_PAYLOAD.targetWeightLoss;
  const assessmentJson = TEMP_REGISTRATION_PAYLOAD.assessmentJson;
  const weight = TEMP_REGISTRATION_PAYLOAD.weight;
  
  const payload = {
    action: "register",
    employeeId,
    password,
    firstName,
    lastName,
    department,
    phone,
    height,
    targetWeightLoss,
    assessmentJson
  };
  
  if (STATE.apiSettings.isMockMode) {
    // Save to local Mock Array
    const newReg = {
      EmployeeID: employeeId,
      Password: password,
      FirstName: firstName,
      LastName: lastName,
      Department: department,
      Phone: phone,
      Height: height,
      TargetWeightLoss: targetWeightLoss,
      RegistrationDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      AssessmentJson: assessmentJson
    };
    STATE.registrations.push(newReg);
    
    // In Mock Mode, also write Week 1 (Initial Data) automatically as if Admin did it,
    // so charts will start displaying right away!
    STATE.weeklyData.push({
      EmployeeID: employeeId,
      Week: 1,
      Weight: weight,
      Waist: 32, // dummy waist
      Hip: 38,   // dummy hip
      AnswersJson: "[]",
      SubmitDate: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    
    STATE.currentDbUser = null;
    saveMockState();
    
    toggleLoader(false);
    alert("สมัครเข้าร่วมโครงการสำเร็จแล้ว!");
    document.getElementById("reg-form").reset();
    document.getElementById("reg-details-fields").style.display = "none";
    document.getElementById("target-feedback").style.display = "none";
    clearRegAlert();
    
    // Rerender surveys
    renderInitialSurvey();
    
    // Redirect to dashboard login form
    checkDashboardLogin();
    showPage("dashboard-page");
  } else {
    try {
      const res = await callApiJSONP("registerJSONP", payload);
      
      toggleLoader(false);
      if (res.success) {
        alert(res.message || "สมัครเข้าร่วมโครงการสำเร็จ!");
        
        // Push locally for references
        const newReg = {
          EmployeeID: employeeId,
          Password: password,
          FirstName: firstName,
          LastName: lastName,
          Department: department,
          Phone: phone,
          Height: height,
          TargetWeightLoss: targetWeightLoss,
          RegistrationDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
          AssessmentJson: assessmentJson
        };
        STATE.registrations.push(newReg);
        
        // Reset form UI
        document.getElementById("reg-form").reset();
        document.getElementById("reg-details-fields").style.display = "none";
        document.getElementById("target-feedback").style.display = "none";
        clearRegAlert();
        
        // Force logged-out state to show login form
        STATE.currentDbUser = null;
        checkDashboardLogin();
        showPage("dashboard-page");
        
        // Run loadData in background to update spreadsheet data cache silently
        loadData().catch(err => console.warn("Background loadData failed", err));
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (err) {
      toggleLoader(false);
      alert("การเชื่อมต่อเครือข่ายล้มเหลว กรุณาลองใหม่อีกครั้ง");
      console.error(err);
    }
  }
}

// ----------------------------------------------------
// PAGE 2: WEEKLY SUBMISSION LOGIC
// ----------------------------------------------------

function checkReportLogin() {
  const loginSection = document.getElementById("report-login-section");
  const formSection = document.getElementById("report-form-section");
  
  if (STATE.currentUser) {
    loginSection.style.display = "none";
    formSection.style.display = "block";
    setupWeeklyReportForm();
  } else {
    loginSection.style.display = "block";
    formSection.style.display = "none";
  }
}

// Handle login for report submission (No password required)
function handleReportLogin(e) {
  e.preventDefault();
  const empId = cleanEmployeeId(document.getElementById("report-login-empid").value);
  
  const registration = STATE.registrations.find(r => 
    String(r.EmployeeID).trim() === empId
  );
  
  if (registration) {
    STATE.currentUser = registration;
    checkReportLogin();
  } else {
    alert("ไม่พบข้อมูลรหัสพนักงานนี้ที่ได้ลงทะเบียนเข้าร่วมโครงการ");
  }
}

// Build Submission form based on settings and dynamic questions
function setupWeeklyReportForm() {
  const user = STATE.currentUser;
  const metrics = getTimelineMetrics();
  
  // Set User Profile Card
  document.getElementById("report-user-name").innerText = `${user.FirstName} ${user.LastName}`;
  document.getElementById("report-user-dept").innerText = user.Department;
  document.getElementById("report-user-id").innerText = user.EmployeeID;
  
  // Render User Goals
  const goalsContainer = document.getElementById("report-user-goals");
  if (goalsContainer) {
    goalsContainer.innerHTML = "";
    
    let assessment = getParsedAssessment(user);
    
    const initialQuestions = getInitialQuestions();
    const goalQuestions = initialQuestions.filter(q => q.section === "goal");
    
    let goalsHtml = "";
    goalQuestions.forEach(q => {
      const answer = assessment[q.id || q.QuestionID];
      if (answer === "ใช่") {
        let cleanText = q.text || q.QuestionText;
        cleanText = cleanText.replace(/^\d+\.\s*/, ""); // remove index number
        goalsHtml += `
          <div style="background-color: var(--primary-light); color: var(--primary-dark); font-weight: 600; font-size: 0.8rem; padding: 4px 10px; border-radius: 4px; display: inline-flex; align-items: center; gap: 6px;">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2.5" style="color:var(--primary-dark);"><polyline points="20 6 9 17 4 12"/></svg>
            <span>${cleanText}</span>
          </div>
        `;
      }
    });
    
    if (goalsHtml) {
      goalsContainer.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--primary-dark); font-weight: 700; margin-top: 8px; margin-bottom: 4px;">เป้าหมายสุขภาพที่คุณตั้งไว้:</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">${goalsHtml}</div>
      `;
    }
  }
  
  const timelineInfo = document.getElementById("report-timeline-info");
  const fieldsContainer = document.getElementById("report-fields-container");
  const submitBtn = document.getElementById("report-submit-btn");
  
  // Determine if submission is valid (Week 2-12)
  let validationMessage = "";
  let allowSubmit = true;
  
  if (metrics.currentWeek === 1) {
    allowSubmit = false;
    validationMessage = `ขณะนี้อยู่ในสัปดาห์ที่ 1 ซึ่งแอดมินเป็นคนจัดการกรอกข้อมูลแรกรับใน Google Sheets พนักงานเริ่มลงข้อมูลสัปดาห์ที่ 2 เป็นต้นไปค่ะ`;
  } else if (metrics.currentWeek >= metrics.maxWeeks) {
    allowSubmit = false;
    validationMessage = `ขณะนี้ถึงสัปดาห์สุดท้าย (สัปดาห์ที่ ${metrics.maxWeeks}) แล้ว ผลการวัดสุดท้ายจะคัดกรองโดยแอดมินเท่านั้นเพื่อความโปร่งใส พนักงานไม่ต้องส่งข้อมูลรอบสุดท้ายเองค่ะ`;
  } else {
    // Check if already submitted this week
    const alreadySubmitted = STATE.weeklyData.some(d => d.EmployeeID === user.EmployeeID && parseInt(d.Week) === metrics.currentWeek);
    if (alreadySubmitted) {
      allowSubmit = false;
      validationMessage = `คุณได้ส่งรายงานความก้าวหน้าสำหรับ **สัปดาห์ที่ ${metrics.currentWeek}** เรียบร้อยแล้วค่ะ ระบบเปิดให้ลงข้อมูลสัปดาห์ละ 1 ครั้งเท่านั้น`;
    }
  }
  
  if (!allowSubmit) {
    timelineInfo.className = "alert alert-warning";
    timelineInfo.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> <span>${validationMessage}</span>`;
    fieldsContainer.style.display = "none";
    submitBtn.style.display = "none";
  } else {
    timelineInfo.className = "alert alert-info";
    timelineInfo.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> <span>ขณะนี้อยู่ใน **สัปดาห์ที่ ${metrics.currentWeek}** ของโครงการ ท่านสามารถลงข้อมูลความก้าวหน้าของสัปดาห์นี้ได้เลยค่ะ</span>`;
    fieldsContainer.style.display = "block";
    submitBtn.style.display = "flex";
    
    // Render dynamic questionnaire
    renderWeeklyQuestions();
  }
  
  // Final Week Booking Container setup
  const bookingContainer = document.getElementById("report-final-booking-container");
  const optionsGroup = document.getElementById("final-booking-options-group");
  
  if (bookingContainer && optionsGroup) {
    const assessment = getParsedAssessment(user);
    const selectedLoc = assessment.init_location || "";
    
    let endA = STATE.project.measureEndA;
    let endB = STATE.project.measureEndB;
    
    if (selectedLoc === "LPN1") {
      endA = STATE.project.measureEndA_LPN1 || STATE.project.measureEndA;
      endB = STATE.project.measureEndB_LPN1 || STATE.project.measureEndB;
    } else if (selectedLoc === "LPN2") {
      endA = STATE.project.measureEndA_LPN2 || STATE.project.measureEndA;
      endB = STATE.project.measureEndB_LPN2 || STATE.project.measureEndB;
    }
    
    if (endA || endB) {
      bookingContainer.style.display = "block";
      optionsGroup.innerHTML = "";
      
      let userChoice = assessment.final_measure_date || "";
      
      if (endA) {
        const formattedA = formatThaiDate(endA);
        const valA = `ทีม A: ${formattedA}`;
        const isChecked = userChoice === valA ? "checked" : "";
        optionsGroup.innerHTML += `
          <label style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9rem; cursor: pointer; color: #78350f;">
            <input type="radio" name="final-booking-date-option" value="${valA}" ${isChecked} required>
            <span>ทีม A: วัดน้ำหนัก รอบเอว รอบสะโพก วันที่ ${formattedA}</span>
          </label>
        `;
      }
      
      if (endB) {
        const formattedB = formatThaiDate(endB);
        const valB = `ทีม B: ${formattedB}`;
        const isChecked = userChoice === valB ? "checked" : "";
        optionsGroup.innerHTML += `
          <label style="display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 0.9rem; cursor: pointer; color: #78350f;">
            <input type="radio" name="final-booking-date-option" value="${valB}" ${isChecked} required>
            <span>ทีม B: วัดน้ำหนัก รอบเอว รอบสะโพก วันที่ ${formattedB}</span>
          </label>
        `;
      }
    } else {
      bookingContainer.style.display = "none";
    }
  }
}

// Render Questionnaire for Registration Page (Lifestyle & Goals)
function renderInitialSurvey() {
  const container = document.getElementById("dynamic-initial-survey");
  if (!container) return;
  
  container.innerHTML = "";
  const questions = getInitialQuestions();
  
  const sections = {
    lifestyle: { title: "1. พฤติกรรมเดิมและข้อมูลสุขภาพเบื้องต้น", icon: "" },
    goal: { title: "2. เป้าหมายเพื่อปรับเปลี่ยนพฤติกรรมในโครงการนี้", icon: "" }
  };
  
  let html = "";
  for (const [secKey, secInfo] of Object.entries(sections)) {
    const secQuestions = questions.filter(q => q.section === secKey);
    if (secQuestions.length === 0) continue;
    
    html += `
      <div class="survey-card" style="margin-top: 1rem; margin-bottom: 1.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 1.25rem; background-color: #f8fafc;">
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--primary-dark); margin-bottom: 1rem;">
          ${secInfo.title}
        </h4>
        <div class="survey-questions-list" style="display: flex; flex-direction: column; gap: 1rem;">
    `;
    
    secQuestions.forEach(q => {
      const qKey = q.id || q.QuestionID;
      const text = q.text || q.QuestionText;
      const name = `reg-q-${qKey}`;
      
      if (q.type === "boolean") {
        const yesId = `reg-q-${qKey}-yes`;
        const noId = `reg-q-${qKey}-no`;
        
        html += `
          <div class="survey-question-item" id="item-${qKey}" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border-color); padding-bottom: 0.75rem;">
            <div class="survey-question-text" style="font-size: 0.9rem; font-weight: 500; color: var(--dark-slate);">${text}</div>
            <div class="survey-options-group" style="display: flex; gap: 0.5rem;">
              <label style="margin-bottom:0; cursor: pointer;">
                <input type="radio" name="${name}" id="${yesId}" value="ใช่" class="survey-option-input">
                <span class="survey-option-btn btn-yes">ใช่</span>
              </label>
              <label style="margin-bottom:0; cursor: pointer;">
                <input type="radio" name="${name}" id="${noId}" value="ไม่ใช่" class="survey-option-input">
                <span class="survey-option-btn btn-no">ไม่ใช่</span>
              </label>
            </div>
          </div>
        `;
      } else if (q.type === "select") {
        html += `
          <div class="survey-question-item" id="item-${qKey}" style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; border-bottom: 1px dashed var(--border-color); padding-bottom: 0.75rem;">
            <div class="survey-question-text" style="font-size: 0.9rem; font-weight: 500; color: var(--dark-slate);">${text}</div>
            <select id="reg-q-${qKey}" name="${name}" class="form-control" style="max-width: 320px; font-size: 0.9rem; padding: 0.5rem;" required>
              <option value="" disabled selected>-- เลือกคำตอบ --</option>
              ${(q.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join("")}
            </select>
          </div>
        `;
      } else if (q.type === "scale_1_10") {
        let scaleButtons = "";
        for (let i = 1; i <= 10; i++) {
          scaleButtons += `
            <label style="margin-bottom:0; cursor: pointer;">
              <input type="radio" name="${name}" value="${i}" class="survey-option-input">
              <span class="survey-scale-btn">${i}</span>
            </label>
          `;
        }
        html += `
          <div class="survey-question-item" id="item-${qKey}" style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; border-bottom: 1px dashed var(--border-color); padding-bottom: 0.75rem;">
            <div class="survey-question-text" style="font-size: 0.9rem; font-weight: 500; color: var(--dark-slate);">${text}</div>
            <div class="survey-options-group" style="display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: flex-start;">
              ${scaleButtons}
            </div>
          </div>
        `;
      }
    });
    
    html += `
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// Render Questionnaire managed by Admin
function renderWeeklyQuestions() {
  const container = document.getElementById("dynamic-questions-container");
  container.innerHTML = "";
  
  const questions = getDailyQuestions();
  
  if (questions.length === 0) {
    container.innerHTML = `<p class="gray-text">ไม่มีแบบประเมินพฤติกรรมในสัปดาห์นี้</p>`;
    return;
  }
  
  questions.forEach((q) => {
    const div = document.createElement("div");
    div.className = "survey-question-item";
    
    const name = `q_${q.QuestionID}`;
    const text = q.text || q.QuestionText;
    
    if (q.type === "select") {
      div.innerHTML = `
        <div class="survey-question-text" data-qid="${q.QuestionID}">${text}</div>
        <select name="${name}" required style="max-width: 300px;">
          <option value="" disabled selected>-- เลือกคำตอบ --</option>
          ${(q.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join("")}
        </select>
      `;
    } else if (q.type === "scale_1_10") {
      let scaleButtons = "";
      for (let i = 1; i <= 10; i++) {
        scaleButtons += `
          <label style="margin-bottom:0;">
            <input type="radio" name="${name}" value="${i}" class="survey-option-input">
            <span class="survey-scale-btn">${i}</span>
          </label>
        `;
      }
      div.innerHTML = `
        <div class="survey-question-text" data-qid="${q.QuestionID}">${text}</div>
        <div class="survey-options-group" style="flex-wrap: wrap; gap: 6px;">
          ${scaleButtons}
        </div>
      `;
    } else {
      // Default to boolean
      div.innerHTML = `
        <div class="survey-question-text" data-qid="${q.QuestionID}">${text}</div>
        <div class="survey-options-group">
          <label style="margin-bottom:0;">
            <input type="radio" name="${name}" value="ใช่" class="survey-option-input">
            <span class="survey-option-btn btn-yes">ใช่</span>
          </label>
          <label style="margin-bottom:0;">
            <input type="radio" name="${name}" value="ไม่ใช่" class="survey-option-input">
            <span class="survey-option-btn btn-no">ไม่ใช่</span>
          </label>
        </div>
      `;
    }
    container.appendChild(div);
  });
}

// Log Out Employee session
function handleLogout() {
  STATE.currentUser = null;
  STATE.currentDbUser = null;
  // Reset passwords inputs
  const dbPassEl = document.getElementById("dashboard-login-password");
  if (dbPassEl) dbPassEl.value = "";
  checkReportLogin();
  checkDashboardLogin();
}

// Handle Weekly Submission
async function handleWeeklySubmitAction(e) {
  e.preventDefault();
  
  const user = STATE.currentUser;
  const metrics = getTimelineMetrics();
  const weight = parseFloat(document.getElementById("rep-weight").value);
  const waist = parseFloat(document.getElementById("rep-waist").value);
  const hip = parseFloat(document.getElementById("rep-hip").value);
  
  if (isNaN(weight) || isNaN(waist) || isNaN(hip)) {
    alert("กรุณากรอกตัวเลขน้ำหนัก รอบเอว และรอบสะโพกให้ถูกต้อง");
    return;
  }
  
  // Build Answers JSON
  const answers = [];
  let questionsAnswered = true;
  
  const weeklyQuestions = getDailyQuestions();
  
  for (let q of weeklyQuestions) {
    const key = `q_${q.QuestionID}`;
    const selectEl = document.querySelector(`select[name="${key}"]`);
    if (selectEl) {
      if (!selectEl.value) {
        questionsAnswered = false;
        break;
      }
      answers.push({
        qId: q.id || q.QuestionID,
        answer: selectEl.value
      });
    } else {
      const checkedEl = document.querySelector(`input[name="${key}"]:checked`);
      if (!checkedEl) {
        questionsAnswered = false;
        break;
      }
      answers.push({
        qId: q.id || q.QuestionID,
        answer: checkedEl.value
      });
    }
  }
  
  if (!questionsAnswered) {
    alert("กรุณาตอบคำถามแบบประเมินให้ครบถ้วนทุกข้อ");
    return;
  }
  
  toggleLoader(true);
  
  const payload = {
    action: "submitWeekly",
    employeeId: user.EmployeeID,
    week: metrics.currentWeek,
    weight,
    waist,
    hip,
    answers
  };
  
  if (STATE.apiSettings.isMockMode) {
    // Add submission locally
    STATE.weeklyData.push({
      EmployeeID: user.EmployeeID,
      Week: metrics.currentWeek,
      Weight: weight,
      Waist: waist,
      Hip: hip,
      AnswersJson: JSON.stringify(answers),
      SubmitDate: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    
    saveMockState();
    toggleLoader(false);
    alert("บันทึกผลสัปดาห์ที่ " + metrics.currentWeek + " สำเร็จแล้วค่ะ!");
    document.getElementById("weekly-report-form").reset();
    await loadData();
    showPage("dashboard-page");
  } else {
    try {
      const res = await callApiJSONP("submitWeeklyJSONP", payload);
      
      toggleLoader(false);
      if (res.success) {
        alert(res.message || "บันทึกข้อมูลเรียบร้อย!");
        document.getElementById("weekly-report-form").reset();
        await loadData();
        showPage("dashboard-page");
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (err) {
      toggleLoader(false);
      alert("เครือข่ายขัดข้อง กรุณาส่งข้อมูลใหม่อีกครั้ง");
      console.error(err);
    }
  }
}

// Handle Final Measurement Appointment Booking Submission
async function handleFinalBookingSubmit(e) {
  e.preventDefault();
  const selectedRadio = document.querySelector('input[name="final-booking-date-option"]:checked');
  if (!selectedRadio) {
    alert("กรุณาเลือกวันนัดหมายก่อนกดยืนยันครับ");
    return;
  }
  
  const chosenDateStr = selectedRadio.value;
  const user = STATE.currentUser || STATE.currentDbUser;
  if (!user) return;
  
  toggleLoader(true);
  
  // Parse old assessment and set new final_measure_date
  let assessment = getParsedAssessment(user);
  
  assessment["final_measure_date"] = chosenDateStr;
  const newAssessmentJson = JSON.stringify(assessment);
  
  if (STATE.apiSettings.isMockMode) {
    // Update local registrations array
    const reg = STATE.registrations.find(r => String(r.EmployeeID).trim() === String(user.EmployeeID).trim());
    if (reg) {
      reg.AssessmentJson = newAssessmentJson;
    }
    
    // Also update current state user
    user.AssessmentJson = newAssessmentJson;
    
    saveMockState();
    toggleLoader(false);
    alert("บันทึกคิวจองตรวจวัดวันสุดท้ายสำเร็จแล้วครับ");
    setupWeeklyReportForm();
  } else {
    try {
      const res = await callApiJSONP("updateRegistrationJSONP", {
        action: "updateRegistration",
        employeeId: user.EmployeeID,
        assessmentJson: newAssessmentJson
      });
      
      if (res.success) {
        // Update local state
        const reg = STATE.registrations.find(r => String(r.EmployeeID).trim() === String(user.EmployeeID).trim());
        if (reg) {
          reg.AssessmentJson = newAssessmentJson;
        }
        user.AssessmentJson = newAssessmentJson;
        
        toggleLoader(false);
        alert("บันทึกคิวจองตรวจวัดวันสุดท้ายสำเร็จแล้วครับ");
        setupWeeklyReportForm();
      } else {
        throw new Error(res.error);
      }
    } catch(err) {
      toggleLoader(false);
      alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
    }
  }
}

// ----------------------------------------------------
// PAGE 3: LEADERBOARD LOGIC
// ----------------------------------------------------

function renderLeaderboard() {
  const annBox = document.getElementById("leaderboard-announcement-box");
  const mainCard = document.getElementById("leaderboard-main-card");
  
  if (STATE.project.hideFinalResults) {
    if (annBox) annBox.style.display = "flex";
    if (mainCard) mainCard.style.display = "none";
    return;
  } else {
    if (annBox) annBox.style.display = "none";
    if (mainCard) mainCard.style.display = "block";
  }

  const container = document.getElementById("leaderboard-body");
  const deptFilter = document.getElementById("leader-dept-filter");
  const searchInput = document.getElementById("leader-search");
  
  // Clear table
  container.innerHTML = "";
  
  // Collect all registered employees
  const participants = [];
  
  // Fill department filter list dynamically
  const departments = new Set(STATE.registrations.map(r => r.Department));
  const currentDeptFilterVal = deptFilter.value;
  deptFilter.innerHTML = '<option value="all">ทุกแผนก (ทั้งหมด)</option>';
  departments.forEach(dept => {
    if(dept) {
      const opt = document.createElement("option");
      opt.value = dept;
      opt.innerText = dept;
      deptFilter.appendChild(opt);
    }
  });
  deptFilter.value = currentDeptFilterVal; // Keep previous filter selection if any
  
  // Loop through each registered employee to compute % BMI reduction
  STATE.registrations.forEach(user => {
    // Get all submissions for this user
    const userSubmissions = STATE.weeklyData.filter(d => d.EmployeeID === user.EmployeeID);
    if (userSubmissions.length === 0) return; // No initial data from admin yet
    
    // Find initial (Week 1)
    const initialRecord = userSubmissions.find(s => parseInt(s.Week) === 1);
    if (!initialRecord) return; // Wait for admin to fill initial Week 1
    
    const initialWeight = parseFloat(initialRecord.Weight);
    const heightMeters = parseFloat(user.Height) / 100;
    const initialBMI = parseFloat((initialWeight / (heightMeters * heightMeters)).toFixed(1));
    
    // Only include competitors on the leaderboard (Initial BMI >= 23.0)
    if (initialBMI < 23.0) return;
    
    // Check if the user is using weight loss medication/pens (init_goal_3 === "ใช่")
    // Prioritize the direct column value so Admin can easily override it in Google Sheets by changing it to "ไม่ใช่"
    let isUsingMeds = false;
    if (user.init_goal_3 !== undefined && user.init_goal_3 !== null && user.init_goal_3 !== "") {
      isUsingMeds = (user.init_goal_3 === "ใช่");
    } else {
      const assessment = getParsedAssessment(user);
      isUsingMeds = (assessment.init_goal_3 === "ใช่");
    }
    if (isUsingMeds) return;
    
    // Find latest submission week
    let latestWeek = 1;
    let latestWeight = initialWeight;
    let latestWaist = parseFloat(initialRecord.Waist);
    let latestHip = parseFloat(initialRecord.Hip);
    let latestSubmitDate = initialRecord.SubmitDate || "";
    
    userSubmissions.forEach(s => {
      const w = parseInt(s.Week);
      if (w > latestWeek) {
        latestWeek = w;
        latestWeight = parseFloat(s.Weight);
        latestWaist = parseFloat(s.Waist);
        latestHip = parseFloat(s.Hip);
        latestSubmitDate = s.SubmitDate || "";
      }
    });
    
    const latestBMI = latestWeight / (heightMeters * heightMeters);
    
    // Compute % BMI reduction (equal to % weight reduction)
    const bmiReductionPercent = ((initialBMI - latestBMI) / initialBMI) * 100;
    const weightLostKg = initialWeight - latestWeight;
    
    participants.push({
      id: user.EmployeeID,
      name: `${user.FirstName} ${user.LastName}`,
      department: user.Department,
      height: user.Height,
      initialWeight,
      latestWeight,
      weightLostKg,
      initialBMI,
      latestBMI,
      bmiReductionPercent,
      latestWeek,
      latestSubmitDate
    });
  });
  
  // Sort participants by % BMI reduction descending. If equal, sort by latestSubmitDate ascending (earlier submission gets higher rank)
  participants.sort((a, b) => {
    if (b.bmiReductionPercent !== a.bmiReductionPercent) {
      return b.bmiReductionPercent - a.bmiReductionPercent;
    }
    const parseDate = (dStr) => {
      if (!dStr) return new Date(0);
      return new Date(dStr.replace(" ", "T"));
    };
    return parseDate(a.latestSubmitDate) - parseDate(b.latestSubmitDate);
  });
  
  // Filter participants
  const searchVal = searchInput.value.toLowerCase().trim();
  const selectedDept = deptFilter.value;
  
  let rank = 1;
  
  participants.forEach(p => {
    // Search match
    const matchesSearch = p.id.includes(searchVal) || p.name.toLowerCase().includes(searchVal);
    const matchesDept = selectedDept === "all" || p.department === selectedDept;
    
    if (matchesSearch && matchesDept) {
      let rankClass = "rank-other";
      if (rank === 1) rankClass = "rank-1";
      else if (rank === 2) rankClass = "rank-2";
      else if (rank === 3) rankClass = "rank-3";
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="rank-badge ${rankClass}">${rank}</span></td>
        <td><strong>${p.id}</strong></td>
        <td>${p.name}</td>
        <td><span class="badge badge-info">${p.department}</span></td>
        <td>${p.initialWeight.toFixed(1)} กก.</td>
        <td>${p.latestWeight.toFixed(1)} กก.</td>
        <td style="color: ${p.weightLostKg >= 0 ? 'var(--primary-dark)' : 'var(--danger)'}; font-weight: 700;">
          ${p.weightLostKg >= 0 ? '-' : '+'}${Math.abs(p.weightLostKg).toFixed(1)} กก.
        </td>
        <td>${p.initialBMI.toFixed(1)}</td>
        <td>${p.latestBMI.toFixed(1)}</td>
        <td style="color: var(--primary-dark); font-weight: 700;">
          ${p.bmiReductionPercent.toFixed(2)}%
        </td>
        <td><span class="badge badge-success">สัปดาห์ ${p.latestWeek}</span></td>
      `;
      container.appendChild(tr);
      rank++;
    }
  });
  
  if (container.children.length === 0) {
    if (searchVal) {
      // Find if this employee exists in registrations
      const regUser = STATE.registrations.find(r => 
        r.EmployeeID.includes(searchVal) || 
        `${r.FirstName} ${r.LastName}`.toLowerCase().includes(searchVal)
      );
      if (regUser) {
        // Find if they have week 1 data
        const userSubmissions = STATE.weeklyData.filter(d => d.EmployeeID === regUser.EmployeeID);
        const hasWeek1 = userSubmissions.some(s => parseInt(s.Week) === 1);
        if (!hasWeek1) {
          container.innerHTML = `<tr><td colspan="11" class="text-center text-warning" style="font-weight: 600; padding: 1.5rem 0;">ไม่พบรหัสพนักงานนี้ในทำเนียบ เนื่องจากผู้ดูแลระบบยังไม่ได้กรอกข้อมูลสัปดาห์เริ่มต้น (สัปดาห์ที่ 1) ในระบบค่ะ</td></tr>`;
          return;
        }
        
        const initialRecord = userSubmissions.find(s => parseInt(s.Week) === 1);
        const initialWeight = parseFloat(initialRecord.Weight);
        const heightMeters = parseFloat(regUser.Height) / 100;
        const initialBMI = parseFloat((initialWeight / (heightMeters * heightMeters)).toFixed(1));
        if (initialBMI < 23.0) {
          container.innerHTML = `<tr><td colspan="11" class="text-center text-warning" style="font-weight: 600; padding: 1.5rem 0;">ไม่พบข้อมูลในตารางอันดับ เนื่องจากมีค่า BMI แรกรับ (${initialBMI.toFixed(1)}) ต่ำกว่าเกณฑ์ชิงรางวัล (BMI ต้อง >= 23.0) พนักงานท่านนี้จึงถูกจัดอยู่ในกลุ่มผู้เข้าร่วมทั่วไปค่ะ</td></tr>`;
          return;
        }
        
        let isUsingMeds = false;
        if (regUser.init_goal_3 !== undefined && regUser.init_goal_3 !== null && regUser.init_goal_3 !== "") {
          isUsingMeds = (regUser.init_goal_3 === "ใช่");
        } else {
          const assessment = getParsedAssessment(regUser);
          isUsingMeds = (assessment.init_goal_3 === "ใช่");
        }
        if (isUsingMeds) {
          container.innerHTML = `<tr><td colspan="11" class="text-center text-warning" style="font-weight: 600; padding: 1.5rem 0;">ไม่พบข้อมูลในตารางอันดับ เนื่องจากพนักงานท่านนี้ระบุว่ามีการใช้ยา/ปากกาลดน้ำหนัก (ไม่ได้รับสิทธิ์จัดอันดับชิงรางวัลตามเกณฑ์โครงการ) ค่ะ หากต้องการเปลี่ยนสิทธิ์ ให้ผู้ดูแลระบบแก้ไขคอลัมน์ init_goal_3 ในชีต Registrations เป็น "ไม่ใช่" ได้ค่ะ</td></tr>`;
          return;
        }
      }
    }
    container.innerHTML = `<tr><td colspan="11" class="text-center gray-text">ไม่พบข้อมูลรายชื่อผลการจัดอันดับ</td></tr>`;
  }
}

// ----------------------------------------------------
// PAGE 4: EMPLOYEE DASHBOARD LOGIC
// ----------------------------------------------------

function checkDashboardLogin() {
  const loginDiv = document.getElementById("dashboard-login-section");
  const mainDiv = document.getElementById("dashboard-main-section");
  
  if (STATE.currentDbUser) {
    loginDiv.style.display = "none";
    mainDiv.style.display = "block";
    renderEmployeeDashboard();
  } else {
    loginDiv.style.display = "block";
    mainDiv.style.display = "none";
    
    // Clear password input value to prevent prefill
    const passInput = document.getElementById("dashboard-login-password");
    if (passInput) passInput.value = "";
  }
}

// Handle login for dashboard view (Requires password)
function handleDashboardLogin(e) {
  e.preventDefault();
  const empId = cleanEmployeeId(document.getElementById("dashboard-login-empid").value);
  const password = document.getElementById("dashboard-login-password").value;
  
  const registration = STATE.registrations.find(r => 
    String(r.EmployeeID).trim() === empId && 
    String(r.Password).trim() === String(password).trim()
  );
  
  if (registration) {
    STATE.currentDbUser = registration;
    checkDashboardLogin();
  } else {
    alert("รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง");
  }
}

// Build Employee Dashboard Components
function renderEmployeeDashboard() {
  const user = STATE.currentDbUser;
  
  // Profile Info
  document.getElementById("db-user-name").innerText = `${user.FirstName} ${user.LastName}`;
  
  let shiftText = "";
  const assessment = getParsedAssessment(user);
  if (assessment.init_shift) {
    shiftText = ` (กะ: ${assessment.init_shift})`;
  }
  document.getElementById("db-user-dept").innerText = `${user.Department}${shiftText}`;
  
  document.getElementById("db-user-id").innerText = user.EmployeeID;
  document.getElementById("db-user-height").innerText = user.Height;
  
  // Render appointments on dashboard profile card
  const dbUserAppts = document.getElementById("db-user-appointments");
  const dbUserFirstDate = document.getElementById("db-user-first-date");
  const dbUserFinalDateWrapper = document.getElementById("db-user-final-date-wrapper");
  const dbUserFinalDate = document.getElementById("db-user-final-date");
  
  if (dbUserAppts && dbUserFirstDate) {
    let firstDate = "-";
    let finalDate = "";
    const assessment = getParsedAssessment(user);
    firstDate = assessment.first_measure_date || "-";
    finalDate = assessment.final_measure_date || "";
    
    dbUserFirstDate.innerText = firstDate;
    dbUserAppts.style.display = "block";
    const dbUserLocationTimeWrapper = document.getElementById("db-user-location-time-wrapper");
    if (dbUserLocationTimeWrapper) {
      const loc = (assessment.init_location || "").toString().trim();
      if (loc) {
        let fullText = "";
        if (loc === "LPN1") {
          fullText = STATE.project.locationTextLPN1 || "LPN1 ณ ห้อง Old lobby Plant2 เวลา 9.00 - 11.30 น.";
        } else if (loc === "LPN2") {
          fullText = STATE.project.locationTextLPN2 || "LPN2 ณ ห้อง Locker ชั้น 2 เวลา 13.30 - 15.30 น.";
        } else {
          fullText = loc;
        }
        dbUserLocationTimeWrapper.innerHTML = ` (<strong>สถานที่/เวลา:</strong> <span style="color:var(--dark-slate); font-weight:600;">${fullText}</span>)`;
        dbUserLocationTimeWrapper.style.display = "inline";
      } else {
        dbUserLocationTimeWrapper.style.display = "none";
      }
    }
    
    if (finalDate) {
      dbUserFinalDate.innerText = finalDate;
      dbUserFinalDateWrapper.style.display = "inline";
    } else {
      dbUserFinalDateWrapper.style.display = "none";
    }
  }
  
  // Parse submissions for user
  const rawSubmissions = STATE.weeklyData.filter(d => d.EmployeeID === user.EmployeeID);
  
  // Set alert default states
  const encourageBox = document.getElementById("db-encourage-box");
  encourageBox.style.display = "none";
  
  if (rawSubmissions.length === 0) {
    // Show empty profile stats
    document.getElementById("db-bmi-current").innerText = "-";
    document.getElementById("db-weight-current").innerText = "-";
    document.getElementById("db-waist-current").innerText = "-";
    document.getElementById("db-hip-current").innerText = "-";
    
    document.getElementById("db-weight-diff").innerHTML = "-";
    document.getElementById("db-bmi-diff").innerHTML = "-";
    document.getElementById("db-waist-diff").innerHTML = "-";
    
    encourageBox.className = "alert alert-warning";
    encourageBox.style.display = "flex";
    encourageBox.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> <span>อยู่ระหว่างรอแอดมินนำเข้าข้อมูลการวัดเริ่มต้น (สัปดาห์ที่ 1) ของท่านลงใน Google Sheet ค่ะ หลังจากแอดมินกรอกเรียบร้อยแล้ว กราฟและข้อมูลจะเริ่มแสดงผลที่นี่</span>`;
    
    // Clear chart
    if (STATE.charts.employeeMain) {
      STATE.charts.employeeMain.destroy();
    }
    return;
  }
  
  // Interpolate Data (LOCF) for all weeks 1 to 13 (or current week)
  const timeline = getTimelineMetrics();
  const maxWeeksToProcess = Math.min(timeline.maxWeeks, Math.max(1, timeline.currentWeek));
  
  const initialRecord = rawSubmissions.find(s => parseInt(s.Week) === 1);
  if (!initialRecord) {
    encourageBox.className = "alert alert-warning";
    encourageBox.style.display = "flex";
    encourageBox.innerHTML = `<span>รอแอดมินระบุน้ำหนัก สัดส่วนแรกรับ (สัปดาห์ที่ 1) ของคุณค่ะ</span>`;
    return;
  }
  
  const heightMeters = parseFloat(user.Height) / 100;
  
  // Build continuous weekly profile array using Last Observation Carried Forward (LOCF)
  const weeklyDataArray = [];
  
  let currentLocfWeight = parseFloat(initialRecord.Weight);
  let currentLocfWaist = parseFloat(initialRecord.Waist);
  let currentLocfHip = parseFloat(initialRecord.Hip);
  
  for (let w = 1; w <= maxWeeksToProcess; w++) {
    const actualSub = rawSubmissions.find(s => parseInt(s.Week) === w);
    
    if (actualSub) {
      currentLocfWeight = parseFloat(actualSub.Weight);
      currentLocfWaist = parseFloat(actualSub.Waist);
      currentLocfHip = parseFloat(actualSub.Hip);
      weeklyDataArray.push({
        week: w,
        weight: currentLocfWeight,
        waist: currentLocfWaist,
        hip: currentLocfHip,
        bmi: currentLocfWeight / (heightMeters * heightMeters),
        isMocked: false
      });
    } else {
      // LOCF carry forward
      weeklyDataArray.push({
        week: w,
        weight: currentLocfWeight,
        waist: currentLocfWaist,
        hip: currentLocfHip,
        bmi: currentLocfWeight / (heightMeters * heightMeters),
        isMocked: true // Mark as carried forward (forgot to submit)
      });
    }
  }
  
  // Load Stats Card (Latest Week Values)
  const latestData = weeklyDataArray[weeklyDataArray.length - 1];
  const initialData = weeklyDataArray[0];
  
  document.getElementById("db-weight-current").innerText = `${latestData.weight.toFixed(1)} กก.`;
  document.getElementById("db-bmi-current").innerText = latestData.bmi.toFixed(1);
  document.getElementById("db-waist-current").innerText = latestData.waist ? `${latestData.waist.toFixed(1)} นิ้ว` : "-";
  document.getElementById("db-hip-current").innerText = latestData.hip ? `${latestData.hip.toFixed(1)} นิ้ว` : "-";
  
  // Compare to Initial
  const weightChange = latestData.weight - initialData.weight;
  const bmiChange = latestData.bmi - initialData.bmi;
  const waistChange = latestData.waist - initialData.waist;
  
  setDiffCardUI("db-weight-diff", weightChange, "กก.");
  setDiffCardUI("db-bmi-diff", bmiChange, "");
  setDiffCardUI("db-waist-diff", waistChange, "นิ้ว");
  
  // Check weight increase vs previous week to show warning/encouraging alert
  if (weeklyDataArray.length > 1) {
    const lastIdx = weeklyDataArray.length - 1;
    const currentWeekVal = weeklyDataArray[lastIdx].weight;
    const prevWeekVal = weeklyDataArray[lastIdx - 1].weight;
    const isMocked = weeklyDataArray[lastIdx].isMocked;
    
    encourageBox.style.display = "flex";
    
    if (isMocked) {
      encourageBox.className = "alert alert-warning";
      encourageBox.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> <span>ในสัปดาห์นี้ท่านยังไม่มีการส่งผลส่งตัว ระบบได้นำผลการวัดล่าสุดของคุณมาคิดอัตโนมัติ อย่าลืมส่งผลในช่วง จ-ศ สัปดาห์ถัดไปนะคะ!</span>`;
    } else if (currentWeekVal > prevWeekVal) {
      // Weight increased!
      const gain = currentWeekVal - prevWeekVal;
      encourageBox.className = "alert alert-warning";
      encourageBox.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span><strong>น้ำหนักคุณเพิ่มขึ้น +${gain.toFixed(1)} กก.</strong> จากสัปดาห์ที่แล้ว แต่อย่าเพิ่งถอดใจนะคะ! การลดน้ำหนักเป็นกระบวนการระยะยาว ร่างกายอาจมีน้ำหนักเพิ่มได้จากหลายปัจจัย เช่น การกักเก็บน้ำหรือมวลกล้ามเนื้อ ขอส่งพลังใจให้ลุยต่อ คุมอาหารที่มีประโยชน์และดื่มน้ำเยอะๆ สู้ๆ นะคะ ✌️</span>
      `;
    } else if (currentWeekVal < prevWeekVal) {
      // Weight decreased
      const loss = prevWeekVal - currentWeekVal;
      encourageBox.className = "alert alert-info";
      encourageBox.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span><strong>เยี่ยมยอดมากค่ะ! น้ำหนักคุณลดลง -${loss.toFixed(1)} กก.</strong> จากสัปดาห์ที่แล้ว ร่างกายกำลังตอบสนองต่อสิ่งที่คุณทำได้เป็นอย่างดี รักษาวินัยแบบนี้ต่อไปเรื่อยๆ สุขภาพดีขึ้นใกล้แค่เอื้อมค่ะ! 🌟</span>
      `;
    } else {
      // Weight steady
      encourageBox.className = "alert alert-info";
      encourageBox.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span><strong>น้ำหนักของคุณคงที่จากสัปดาห์ที่แล้ว!</strong> การรักษาน้ำหนักไม่ให้เพิ่มก็ถือเป็นก้าวที่ดีค่ะ ลุยทำพฤติกรรมสุขภาพดีต่อไป สัปดาห์หน้าเจอกันใหม่! 💪</span>
      `;
    }
  }
  
  // Render Comparison Selector Choices
  setupComparisonOptions(weeklyDataArray);
  
  // Draw combined 4-line chart
  drawCombinedEmployeeChart(weeklyDataArray);
}

function setDiffCardUI(elementId, value, unit) {
  const el = document.getElementById(elementId);
  if (value < 0) {
    el.className = "stat-change good";
    el.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" stroke-width="3"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg> ลดลง ${Math.abs(value).toFixed(1)} ${unit}`;
  } else if (value > 0) {
    el.className = "stat-change bad";
    el.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" stroke-width="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> เพิ่มขึ้น +${value.toFixed(1)} ${unit}`;
  } else {
    el.className = "stat-change";
    el.style.color = "var(--gray-text)";
    el.innerHTML = `คงที่ 0.0 ${unit}`;
  }
}

// Draw the unified 4-line graph with toggle options
function drawCombinedEmployeeChart(weeklyData) {
  const ctx = document.getElementById("employeeCombinedChart").getContext("2d");
  
  const labels = weeklyData.map(d => `สัปดาห์ ${d.week}`);
  
  const datasetBmi = {
    label: "BMI",
    data: weeklyData.map(d => parseFloat(d.bmi.toFixed(2))),
    borderColor: "#10b981", // Emerald
    backgroundColor: "transparent",
    yAxisID: "y-bmi",
    borderWidth: 3,
    pointRadius: 4,
    tension: 0.1,
    hidden: !document.getElementById("chk-bmi").checked
  };
  
  const datasetWeight = {
    label: "น้ำหนัก (กก.)",
    data: weeklyData.map(d => d.weight),
    borderColor: "#3b82f6", // Blue
    backgroundColor: "transparent",
    yAxisID: "y-weight",
    borderWidth: 3,
    pointRadius: 4,
    tension: 0.1,
    hidden: !document.getElementById("chk-weight").checked
  };
  
  const datasetWaist = {
    label: "รอบเอว (นิ้ว)",
    data: weeklyData.map(d => d.waist),
    borderColor: "#ec4899", // Pink
    backgroundColor: "transparent",
    yAxisID: "y-weight", // Can share scale with weight
    borderWidth: 2,
    borderDash: [5, 5],
    pointRadius: 4,
    tension: 0.1,
    hidden: !document.getElementById("chk-waist").checked
  };
  
  const datasetHip = {
    label: "รอบสะโพก (นิ้ว)",
    data: weeklyData.map(d => d.hip),
    borderColor: "#8b5cf6", // Purple
    backgroundColor: "transparent",
    yAxisID: "y-weight", // Can share scale with weight
    borderWidth: 2,
    borderDash: [5, 5],
    pointRadius: 4,
    tension: 0.1,
    hidden: !document.getElementById("chk-hip").checked
  };
  
  if (STATE.charts.employeeMain) {
    STATE.charts.employeeMain.destroy();
  }
  
  STATE.charts.employeeMain = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [datasetBmi, datasetWeight, datasetWaist, datasetHip]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // We use our own custom checkboxes for legend to align nicely
        },
        tooltip: {
          mode: "index",
          intersect: false
        }
      },
      scales: {
        "y-weight": {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: "น้ำหนัก (กก.) / สัดส่วน (นิ้ว)"
          },
          grid: {
            drawOnChartArea: true
          }
        },
        "y-bmi": {
          type: "linear",
          position: "right",
          title: {
            display: true,
            text: "BMI"
          },
          grid: {
            drawOnChartArea: false // prevent overlapping gridlines
          }
        }
      }
    }
  });
}

// Bind custom chart legends checkboxes
function toggleChartLine(id, checkbox) {
  const lbl = checkbox.closest("label");
  if (checkbox.checked) {
    lbl.classList.add("active");
  } else {
    lbl.classList.remove("active");
  }
  
  // Re-render dashboard dashboard stats
  if (STATE.currentDbUser) {
    const rawSubmissions = STATE.weeklyData.filter(d => d.EmployeeID === STATE.currentDbUser.EmployeeID);
    if(rawSubmissions.length > 0) {
      const heightMeters = parseFloat(STATE.currentDbUser.Height) / 100;
      const timeline = getTimelineMetrics();
      const maxWeeksToProcess = Math.min(timeline.maxWeeks, Math.max(1, timeline.currentWeek));
      
      const initialRecord = rawSubmissions.find(s => parseInt(s.Week) === 1);
      if (initialRecord) {
        const weeklyDataArray = [];
        let currentLocfWeight = parseFloat(initialRecord.Weight);
        let currentLocfWaist = parseFloat(initialRecord.Waist);
        let currentLocfHip = parseFloat(initialRecord.Hip);
        
        for (let w = 1; w <= maxWeeksToProcess; w++) {
          const actualSub = rawSubmissions.find(s => parseInt(s.Week) === w);
          if (actualSub) {
            currentLocfWeight = parseFloat(actualSub.Weight);
            currentLocfWaist = parseFloat(actualSub.Waist);
            currentLocfHip = parseFloat(actualSub.Hip);
          }
          weeklyDataArray.push({
            week: w,
            weight: currentLocfWeight,
            waist: currentLocfWaist,
            hip: currentLocfHip,
            bmi: currentLocfWeight / (heightMeters * heightMeters)
          });
        }
        drawCombinedEmployeeChart(weeklyDataArray);
      }
    }
  }
}

// Side-by-side week comparison selector builder
function setupComparisonOptions(weeklyData) {
  const comp1 = document.getElementById("comp-week-1");
  const comp2 = document.getElementById("comp-week-2");
  
  // Save selections
  const prevVal1 = comp1.value;
  const prevVal2 = comp2.value;
  
  comp1.innerHTML = "";
  comp2.innerHTML = "";
  
  weeklyData.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.week;
    opt.innerText = `สัปดาห์ที่ ${d.week}`;
    
    comp1.appendChild(opt.cloneNode(true));
    comp2.appendChild(opt);
  });
  
  // Restore or default selections (Default: Initial vs Latest)
  comp1.value = prevVal1 || (weeklyData.length > 0 ? "1" : "");
  comp2.value = prevVal2 || (weeklyData.length > 0 ? weeklyData[weeklyData.length - 1].week.toString() : "");
  
  // Perform immediate run
  executeWeekComparison(weeklyData);
}

// Compare two chosen weeks side-by-side
function executeWeekComparison(weeklyData) {
  const w1 = parseInt(document.getElementById("comp-week-1").value);
  const w2 = parseInt(document.getElementById("comp-week-2").value);
  const container = document.getElementById("comparison-result");
  
  if (isNaN(w1) || isNaN(w2)) {
    container.innerHTML = `<p class="text-center gray-text">กรุณากรอกข้อมูลเปรียบเทียบสัปดาห์</p>`;
    return;
  }
  
  const d1 = weeklyData.find(d => d.week === w1);
  const d2 = weeklyData.find(d => d.week === w2);
  
  if (!d1 || !d2) {
    container.innerHTML = `<p class="text-center gray-text">ข้อมูลยังไม่ครบถ้วนสำหรับการเปรียบเทียบ</p>`;
    return;
  }
  
  const weightDiff = d2.weight - d1.weight;
  const bmiDiff = d2.bmi - d1.bmi;
  const waistDiff = d2.waist - d1.waist;
  const hipDiff = d2.hip - d1.hip;
  
  container.innerHTML = `
    <div class="comparison-container">
      <!-- Weight Comparison Card -->
      <div class="comp-box">
        <div class="comp-title">น้ำหนัก (กิโลกรัม)</div>
        <div class="flex justify-between align-center">
          <div>
            <span class="comp-metric">${d1.weight.toFixed(1)}</span>
            <span style="font-size:0.8rem;color:var(--gray-text);">➔</span>
            <span class="comp-metric" style="color:var(--primary-dark);">${d2.weight.toFixed(1)}</span>
          </div>
          <div>
            ${getDiffBadge(weightDiff, "กก.")}
          </div>
        </div>
      </div>
      
      <!-- BMI Comparison Card -->
      <div class="comp-box">
        <div class="comp-title">ค่า BMI</div>
        <div class="flex justify-between align-center">
          <div>
            <span class="comp-metric">${d1.bmi.toFixed(1)}</span>
            <span style="font-size:0.8rem;color:var(--gray-text);">➔</span>
            <span class="comp-metric" style="color:var(--primary-dark);">${d2.bmi.toFixed(1)}</span>
          </div>
          <div>
            ${getDiffBadge(bmiDiff, "")}
          </div>
        </div>
      </div>
      
      <!-- Waist Comparison Card -->
      <div class="comp-box">
        <div class="comp-title">รอบเอว (นิ้ว)</div>
        <div class="flex justify-between align-center">
          <div>
            <span class="comp-metric">${d1.waist.toFixed(1)}</span>
            <span style="font-size:0.8rem;color:var(--gray-text);">➔</span>
            <span class="comp-metric" style="color:var(--primary-dark);">${d2.waist.toFixed(1)}</span>
          </div>
          <div>
            ${getDiffBadge(waistDiff, "นิ้ว")}
          </div>
        </div>
      </div>
      
      <!-- Hip Comparison Card -->
      <div class="comp-box">
        <div class="comp-title">รอบสะโพก (นิ้ว)</div>
        <div class="flex justify-between align-center">
          <div>
            <span class="comp-metric">${d1.hip.toFixed(1)}</span>
            <span style="font-size:0.8rem;color:var(--gray-text);">➔</span>
            <span class="comp-metric" style="color:var(--primary-dark);">${d2.hip.toFixed(1)}</span>
          </div>
          <div>
            ${getDiffBadge(hipDiff, "นิ้ว")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function getDiffBadge(val, unit) {
  if (val < 0) {
    return `<span class="badge badge-success">ลดลง ${Math.abs(val).toFixed(1)} ${unit}</span>`;
  } else if (val > 0) {
    return `<span class="badge badge-danger">เพิ่มขึ้น +${val.toFixed(1)} ${unit}</span>`;
  } else {
    return `<span class="badge badge-info" style="background-color:#e2e8f0;color:var(--gray-text);">คงที่</span>`;
  }
}

// Trigger comparison calculation when dropdown updates
function handleComparisonWeekChange() {
  if (!STATE.currentDbUser) return;
  
  const user = STATE.currentDbUser;
  const rawSubmissions = STATE.weeklyData.filter(d => d.EmployeeID === user.EmployeeID);
  if (rawSubmissions.length === 0) return;
  
  const heightMeters = parseFloat(user.Height) / 100;
  const timeline = getTimelineMetrics();
  const maxWeeks = Math.min(timeline.maxWeeks, Math.max(1, timeline.currentWeek));
  
  const initial = rawSubmissions.find(s => parseInt(s.Week) === 1);
  if (!initial) return;
  
  const weeklyDataArray = [];
  let wVal = parseFloat(initial.Weight);
  let waVal = parseFloat(initial.Waist);
  let hVal = parseFloat(initial.Hip);
  
  for (let w = 1; w <= maxWeeks; w++) {
    const actualSub = rawSubmissions.find(s => parseInt(s.Week) === w);
    if (actualSub) {
      wVal = parseFloat(actualSub.Weight);
      waVal = parseFloat(actualSub.Waist);
      hVal = parseFloat(actualSub.Hip);
    }
    weeklyDataArray.push({
      week: w,
      weight: wVal,
      waist: waVal,
      hip: hVal,
      bmi: wVal / (heightMeters * heightMeters)
    });
  }
  
  executeWeekComparison(weeklyDataArray);
}

// ----------------------------------------------------
// PAGE 5: ADMIN PANEL LOGIC
// ----------------------------------------------------

function checkAdminAuth() {
  const loginDiv = document.getElementById("admin-login-section");
  const mainDiv = document.getElementById("admin-main-section");
  
  if (STATE.adminAuthenticated) {
    loginDiv.style.display = "none";
    mainDiv.style.display = "block";
    renderAdminPanel();
  } else {
    loginDiv.style.display = "block";
    mainDiv.style.display = "none";
    
    // Clear password input value to prevent prefill
    const passInput = document.getElementById("admin-password-input");
    if (passInput) passInput.value = "";
  }
}

// Handle login for Admin
function handleAdminLogin(e) {
  e.preventDefault();
  const password = document.getElementById("admin-password-input").value;
  
  if (String(password).trim() === String(STATE.project.adminPassword).trim()) {
    STATE.adminAuthenticated = true;
    checkAdminAuth();
  } else {
    alert("รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง");
  }
}

// Log Out Admin Session
function handleAdminLogout() {
  STATE.adminAuthenticated = false;
  document.getElementById("admin-password-input").value = "";
  checkAdminAuth();
}

// Build Admin Panel Screens
function renderAdminPanel() {
  // Set Configuration Dates
  let startDtVal = STATE.project.startDate || "";
  if (startDtVal.includes("T")) {
    const d = new Date(startDtVal);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    startDtVal = `${y}-${m}-${day}`;
  } else if (startDtVal.includes(" ")) {
    startDtVal = startDtVal.split(" ")[0];
  }
  document.getElementById("admin-config-start-date").value = startDtVal;
  
  let endDtVal = STATE.project.endDate || "";
  if (endDtVal.includes("T")) {
    const d = new Date(endDtVal);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    endDtVal = `${y}-${m}-${day}`;
  } else if (endDtVal.includes(" ")) {
    endDtVal = endDtVal.split(" ")[0];
  }
  document.getElementById("admin-config-end-date").value = endDtVal;
  
  // Set leaderboard hide option check status
  document.getElementById("admin-config-hide-results").checked = !!STATE.project.hideFinalResults;
  document.getElementById("admin-config-close-registration").checked = !!STATE.project.closeRegistration;
  
  // Set measurement dates values
  document.getElementById("admin-config-measure-start-a-lpn1").value = STATE.project.measureStartA_LPN1 || STATE.project.measureStartA || "";
  document.getElementById("admin-config-measure-start-a-lpn2").value = STATE.project.measureStartA_LPN2 || STATE.project.measureStartA || "";
  document.getElementById("admin-config-measure-start-b-lpn1").value = STATE.project.measureStartB_LPN1 || STATE.project.measureStartB || "";
  document.getElementById("admin-config-measure-start-b-lpn2").value = STATE.project.measureStartB_LPN2 || STATE.project.measureStartB || "";
  document.getElementById("admin-config-measure-end-a-lpn1").value = STATE.project.measureEndA_LPN1 || STATE.project.measureEndA || "";
  document.getElementById("admin-config-measure-end-a-lpn2").value = STATE.project.measureEndA_LPN2 || STATE.project.measureEndA || "";
  document.getElementById("admin-config-measure-end-b-lpn1").value = STATE.project.measureEndB_LPN1 || STATE.project.measureEndB || "";
  document.getElementById("admin-config-measure-end-b-lpn2").value = STATE.project.measureEndB_LPN2 || STATE.project.measureEndB || "";
  
  // Set location text settings values
  const locLpn1Input = document.getElementById("admin-config-loc-lpn1");
  const locLpn2Input = document.getElementById("admin-config-loc-lpn2");
  if (locLpn1Input) locLpn1Input.value = STATE.project.locationTextLPN1 || "";
  if (locLpn2Input) locLpn2Input.value = STATE.project.locationTextLPN2 || "";
  
  // Dynamically populate week options
  const timeline = getTimelineMetrics();
  const maxWeeks = timeline.maxWeeks;
  
  // 1. Populate bulk-week-select dynamically
  const bulkWeekSelect = document.getElementById("bulk-week-select");
  if (bulkWeekSelect) {
    const prevVal = bulkWeekSelect.value;
    bulkWeekSelect.innerHTML = `
      <option value="1">สัปดาห์ที่ 1 (เริ่มต้น/แอดมินวัด)</option>
      <option value="${maxWeeks}">สัปดาห์ที่ ${maxWeeks} (สัปดาห์สุดท้าย/แอดมินยืนยันผล)</option>
    `;
    bulkWeekSelect.value = prevVal || "1";
  }
  
  // 2. Populate admin-single-week dynamically
  const adminSingleWeek = document.getElementById("admin-single-week");
  if (adminSingleWeek) {
    const prevVal = adminSingleWeek.value;
    adminSingleWeek.innerHTML = "";
    for (let w = 1; w <= maxWeeks; w++) {
      const opt = document.createElement("option");
      opt.value = w.toString();
      if (w === 1) {
        opt.innerText = "สัปดาห์ที่ 1 (แรกรับ)";
      } else if (w === maxWeeks) {
        opt.innerText = `สัปดาห์ที่ ${w} (สุดท้าย)`;
      } else {
        opt.innerText = `สัปดาห์ที่ ${w}`;
      }
      adminSingleWeek.appendChild(opt);
    }
    adminSingleWeek.value = prevVal || "1";
  }
  
  // Render lists and grids
  renderLateSubmissionsAlert();
  renderAdminQManager();
  renderAdminOverviewMetrics();
  renderAdminTrendCorrelation();
  renderAdminParticipantsTable();
  
  // Draw summary charts
  drawAdminExecutiveCharts();
}

// Render dynamic behavioral correlation analysis table for HR Admin
function renderAdminTrendCorrelation() {
  const container = document.getElementById("admin-correlation-table-body");
  if (!container) return;
  
  container.innerHTML = "";
  
  const weeklyQuestions = getDailyQuestions();
  const participants = STATE.registrations;
  const submissions = STATE.weeklyData;
  
  if (participants.length === 0 || weeklyQuestions.length === 0) {
    container.innerHTML = `<tr><td colspan="4" class="text-center gray-text">ยังไม่มีข้อมูลเพียงพอสำหรับการคำนวณสหสัมพันธ์</td></tr>`;
    return;
  }
  
  // 1. Compute success map for registered users (success = BMI loss percent >= 3%)
  const successMap = {};
  participants.forEach(user => {
    const userSubs = submissions.filter(s => s.EmployeeID === user.EmployeeID);
    const initial = userSubs.find(s => parseInt(s.Week) === 1);
    if (!initial) {
      successMap[user.EmployeeID] = false;
      return;
    }
    
    let latestWeight = parseFloat(initial.Weight);
    let latestWeek = 1;
    userSubs.forEach(s => {
      if (parseInt(s.Week) > latestWeek) {
        latestWeek = parseInt(s.Week);
        latestWeight = parseFloat(s.Weight);
      }
    });
    
    const initialWeight = parseFloat(initial.Weight);
    const percentLoss = ((initialWeight - latestWeight) / initialWeight) * 100;
    successMap[user.EmployeeID] = percentLoss >= 3.0; // standard 3% BMI success boundary
  });
  
  // 2. Classify and calculate success rates for each behavior question
  weeklyQuestions.forEach(q => {
    let countRegular = 0;   // compliance rate >= 50%
    let successRegular = 0;
    let countRare = 0;      // compliance rate < 50%
    let successRare = 0;
    
    participants.forEach(user => {
      const userSubs = submissions.filter(s => s.EmployeeID === user.EmployeeID && parseInt(s.Week) > 1);
      if (userSubs.length === 0) return;
      
      let totalQ = 0;
      let yesCount = 0;
      
        userSubs.forEach(s => {
          let answers = [];
          try { answers = JSON.parse(s.AnswersJson || "[]"); } catch(e){}
          const ans = answers.find(a => 
            String(a.qId) === String(q.QuestionID) || 
            String(a.qId) === String(q.id) ||
            (String(q.id) === "weekly_protein" && String(a.qId) === "weekly_1") ||
            (String(q.id) === "weekly_exercise" && String(a.qId) === "weekly_2") ||
            (String(q.id) === "weekly_avoid" && String(a.qId) === "weekly_3") ||
            (String(q.id) === "weekly_dinner" && String(a.qId) === "weekly_4") ||
            (String(q.id) === "weekly_1" && String(a.qId) === "weekly_protein") ||
            (String(q.id) === "weekly_2" && String(a.qId) === "weekly_exercise") ||
            (String(q.id) === "weekly_3" && String(a.qId) === "weekly_avoid") ||
            (String(q.id) === "weekly_4" && String(a.qId) === "weekly_dinner")
          );
          if (ans) {
            totalQ++;
            if (ans.answer === "ใช่") yesCount++;
          }
        });
      
      const compliance = totalQ > 0 ? (yesCount / totalQ) : 0;
      const isSuccess = successMap[user.EmployeeID];
      
      if (compliance >= 0.50) {
        countRegular++;
        if (isSuccess) successRegular++;
      } else {
        countRare++;
        if (isSuccess) successRare++;
      }
    });
    
    const rateRegular = countRegular > 0 ? (successRegular / countRegular) * 100 : 0;
    const rateRare = countRare > 0 ? (successRare / countRare) * 100 : 0;
    const diff = rateRegular - rateRare;
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${q.text || q.QuestionText}</strong></td>
      <td style="font-weight:700; color:var(--primary-dark);">${rateRegular.toFixed(1)}% <span style="font-size:0.75rem; color:var(--gray-text); font-weight:400;">(${successRegular}/${countRegular} คน)</span></td>
      <td style="font-weight:700; color:#b91c1c;">${rateRare.toFixed(1)}% <span style="font-size:0.75rem; color:var(--gray-text); font-weight:400;">(${successRare}/${countRare} คน)</span></td>
      <td style="font-weight:800; color: ${diff >= 0 ? 'var(--primary-dark)' : 'var(--danger)'};">
        ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% อัตราสำเร็จ
      </td>
    `;
    container.appendChild(tr);
  });
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const startDate = document.getElementById("admin-config-start-date").value;
  const endDate = document.getElementById("admin-config-end-date").value;
  const hideFinal = document.getElementById("admin-config-hide-results").checked;
  const closeReg = document.getElementById("admin-config-close-registration").checked;
  
  const measureStartA_LPN1 = document.getElementById("admin-config-measure-start-a-lpn1").value;
  const measureStartA_LPN2 = document.getElementById("admin-config-measure-start-a-lpn2").value;
  const measureStartB_LPN1 = document.getElementById("admin-config-measure-start-b-lpn1").value;
  const measureStartB_LPN2 = document.getElementById("admin-config-measure-start-b-lpn2").value;
  const measureEndA_LPN1 = document.getElementById("admin-config-measure-end-a-lpn1").value;
  const measureEndA_LPN2 = document.getElementById("admin-config-measure-end-a-lpn2").value;
  const measureEndB_LPN1 = document.getElementById("admin-config-measure-end-b-lpn1").value;
  const measureEndB_LPN2 = document.getElementById("admin-config-measure-end-b-lpn2").value;
  
  const locationTextLPN1 = document.getElementById("admin-config-loc-lpn1").value.trim();
  const locationTextLPN2 = document.getElementById("admin-config-loc-lpn2").value.trim();
  
  if (!startDate || !endDate || !measureStartA_LPN1 || !measureStartA_LPN2 || !measureStartB_LPN1 || !measureStartB_LPN2) {
    alert("กรุณาระบุวันเริ่มต้น วันสิ้นสุด และวันวัดเริ่มต้นสำหรับ LPN1/LPN2");
    return;
  }
  
  if (new Date(startDate) > new Date(endDate)) {
    alert("วันเริ่มต้นโครงการต้องอยู่ก่อนหรือเป็นวันเดียวกับวันสิ้นสุดโครงการ");
    return;
  }
  
  toggleLoader(true);
  
  if (STATE.apiSettings.isMockMode) {
    STATE.project.startDate = startDate;
    STATE.project.endDate = endDate;
    STATE.project.hideFinalResults = hideFinal;
    STATE.project.closeRegistration = closeReg;
    
    // Fallbacks for compatibility
    STATE.project.measureStartA = measureStartA_LPN1;
    STATE.project.measureStartB = measureStartB_LPN1;
    STATE.project.measureEndA = measureEndA_LPN1;
    STATE.project.measureEndB = measureEndB_LPN1;
    
    STATE.project.measureStartA_LPN1 = measureStartA_LPN1;
    STATE.project.measureStartA_LPN2 = measureStartA_LPN2;
    STATE.project.measureStartB_LPN1 = measureStartB_LPN1;
    STATE.project.measureStartB_LPN2 = measureStartB_LPN2;
    STATE.project.measureEndA_LPN1 = measureEndA_LPN1;
    STATE.project.measureEndA_LPN2 = measureEndA_LPN2;
    STATE.project.measureEndB_LPN1 = measureEndB_LPN1;
    STATE.project.measureEndB_LPN2 = measureEndB_LPN2;
    
    STATE.project.locationTextLPN1 = locationTextLPN1;
    STATE.project.locationTextLPN2 = locationTextLPN2;
    
    // Recalculate durationDays
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    STATE.project.durationDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    
    saveMockState();
    toggleLoader(false);
    alert("บันทึกการตั้งค่าโครงการจำลองสำเร็จ");
    renderAdminPanel();
    populateRegistrationLocationDropdown();
  } else {
    try {
      // Save StartDate
      const resStart = await callApiJSONP("updateSettingsJSONP", {
        action: "updateSettings",
        key: "StartDate",
        value: startDate
      });
      if (!resStart.success) throw new Error("ไม่สามารถบันทึกวันเริ่มต้นได้: " + resStart.error);

      // Save EndDate
      const resEnd = await callApiJSONP("updateSettingsJSONP", {
        action: "updateSettings",
        key: "EndDate",
        value: endDate
      });
      if (!resEnd.success) throw new Error("ไม่สามารถบันทึกวันสิ้นสุดได้: " + resEnd.error);

      // Save HideFinalResults
      const resHide = await callApiJSONP("updateSettingsJSONP", {
        action: "updateSettings",
        key: "HideFinalResults",
        value: hideFinal.toString()
      });
      if (!resHide.success) throw new Error("ไม่สามารถบันทึกสถานะการแสดงผลได้: " + resHide.error);

      // Save CloseRegistration
      const resClose = await callApiJSONP("updateSettingsJSONP", {
        action: "updateSettings",
        key: "CloseRegistration",
        value: closeReg.toString()
      });
      if (!resClose.success) throw new Error("ไม่สามารถบันทึกสถานะการรับสมัครได้: " + resClose.error);

      // Save new start dates
      await callApiJSONP("updateSettingsJSONP", { action: "updateSettings", key: "MeasureStartA_LPN1", value: measureStartA_LPN1 });
      await callApiJSONP("updateSettingsJSONP", { action: "updateSettings", key: "MeasureStartA_LPN2", value: measureStartA_LPN2 });
      await callApiJSONP("updateSettingsJSONP", { action: "updateSettings", key: "MeasureStartB_LPN1", value: measureStartB_LPN1 });
      await callApiJSONP("updateSettingsJSONP", { action: "updateSettings", key: "MeasureStartB_LPN2", value: measureStartB_LPN2 });
      
      // Save new end dates
      await callApiJSONP("updateSettingsJSONP", { action: "updateSettings", key: "MeasureEndA_LPN1", value: measureEndA_LPN1 });
      await callApiJSONP("updateSettingsJSONP", { action: "updateSettings", key: "MeasureEndA_LPN2", value: measureEndA_LPN2 });
      await callApiJSONP("updateSettingsJSONP", { action: "updateSettings", key: "MeasureEndB_LPN1", value: measureEndB_LPN1 });
      await callApiJSONP("updateSettingsJSONP", { action: "updateSettings", key: "MeasureEndB_LPN2", value: measureEndB_LPN2 });

      // Save compatible old fields too
      await callApiJSONP("updateSettingsJSONP", { action: "updateSettings", key: "MeasureStartA", value: measureStartA_LPN1 });
      await callApiJSONP("updateSettingsJSONP", { action: "updateSettings", key: "MeasureStartB", value: measureStartB_LPN1 });
      await callApiJSONP("updateSettingsJSONP", { action: "updateSettings", key: "MeasureEndA", value: measureEndA_LPN1 });
      await callApiJSONP("updateSettingsJSONP", { action: "updateSettings", key: "MeasureEndB", value: measureEndB_LPN1 });

      // Save LocationTextLPN1
      const resLoc1 = await callApiJSONP("updateSettingsJSONP", {
        action: "updateSettings",
        key: "LocationTextLPN1",
        value: locationTextLPN1
      });
      if (!resLoc1.success) throw new Error("ไม่สามารถบันทึกข้อความสถานที่ LPN1 ได้: " + resLoc1.error);

      // Save LocationTextLPN2
      const resLoc2 = await callApiJSONP("updateSettingsJSONP", {
        action: "updateSettings",
        key: "LocationTextLPN2",
        value: locationTextLPN2
      });
      if (!resLoc2.success) throw new Error("ไม่สามารถบันทึกข้อความสถานที่ LPN2 ได้: " + resLoc2.error);

      toggleLoader(false);
      alert("บันทึกการตั้งค่าโครงการเรียบร้อยแล้ว");
      await loadData();
      renderAdminPanel();
      populateRegistrationLocationDropdown();
    } catch (err) {
      toggleLoader(false);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + err.message);
    }
  }
}

// 1. Show alert on Thursday/Friday for missing registrations submissions
function renderLateSubmissionsAlert() {
  const container = document.getElementById("admin-late-submission-container");
  container.innerHTML = "";
  
  const metrics = getTimelineMetrics();
  
  // Only show alerts in Week 2-12 and on Thursday (4) or Friday (5)
  const today = new Date();
  const day = today.getDay();
  const isThuOrFri = day === 4 || day === 5;
  
  if (metrics.currentWeek >= 2 && metrics.currentWeek <= 12 && isThuOrFri) {
    // Find who HAS NOT submitted for the current week
    const missingEmployees = [];
    
    STATE.registrations.forEach(user => {
      const submitted = STATE.weeklyData.some(d => d.EmployeeID === user.EmployeeID && parseInt(d.Week) === metrics.currentWeek);
      if (!submitted) {
        missingEmployees.push(user);
      }
    });
    
    if (missingEmployees.length > 0) {
      let listHtml = missingEmployees.map(u => `<li><strong>${u.EmployeeID}</strong>: ${u.FirstName} ${u.LastName} (${u.Department})</li>`).join("");
      container.innerHTML = `
        <div class="alert alert-warning flex-col">
          <div class="flex align-center gap-2 m-b-0" style="font-weight: 700;">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>แจ้งเตือนพนักงานยังไม่ส่งรายงานความก้าวหน้า (สัปดาห์ที่ ${metrics.currentWeek})</span>
          </div>
          <p class="m-t-2" style="font-size: 0.85rem;">กรุณาติดตามพนักงานต่อไปนี้ให้ส่งผลน้ำหนัก/สัดส่วนภายในวันนี้ (ศุกร์):</p>
          <ul class="m-t-2" style="font-size: 0.85rem; padding-left: 1.5rem; text-align: left; width: 100%;">
            ${listHtml}
          </ul>
        </div>
      `;
    }
  }
}

let activeSurveyTab = "initial";

window.switchSurveyManagerTab = function(tab) {
  activeSurveyTab = tab;
  document.getElementById("survey-tab-initial").classList.toggle("active", tab === "initial");
  document.getElementById("survey-tab-weekly").classList.toggle("active", tab === "weekly");
  
  // Toggle section group view
  document.getElementById("survey-q-section-group").style.display = tab === "initial" ? "block" : "none";
  
  resetSurveyQuestionForm();
  renderAdminQManager();
};

window.handleSurveyTypeChange = function(type) {
  const optionsGroup = document.getElementById("survey-q-options-group");
  if (type === "select") {
    optionsGroup.style.display = "block";
    document.getElementById("survey-q-options").setAttribute("required", "required");
  } else {
    optionsGroup.style.display = "none";
    document.getElementById("survey-q-options").removeAttribute("required");
  }
};

window.resetSurveyQuestionForm = function() {
  document.getElementById("survey-question-form").reset();
  document.getElementById("survey-q-id").value = "";
  document.getElementById("survey-form-title").innerText = "+ เพิ่มคำถามใหม่";
  document.getElementById("survey-q-save-btn").innerText = "บันทึกคำถาม";
  document.getElementById("survey-q-options-group").style.display = "none";
  document.getElementById("survey-q-options").removeAttribute("required");
};

window.editSurveyQuestion = function(id) {
  const questions = activeSurveyTab === "initial" ? getInitialQuestions() : getDailyQuestions();
  const q = questions.find(item => String(item.id || item.QuestionID) === String(id));
  if (!q) return;
  
  document.getElementById("survey-q-id").value = q.id || q.QuestionID;
  document.getElementById("survey-q-text").value = q.text || q.QuestionText;
  document.getElementById("survey-q-type").value = q.type || "boolean";
  
  if (activeSurveyTab === "initial") {
    document.getElementById("survey-q-section").value = q.section || "lifestyle";
  }
  
  handleSurveyTypeChange(q.type || "boolean");
  if (q.type === "select") {
    document.getElementById("survey-q-options").value = (q.options || []).join(", ");
  } else {
    document.getElementById("survey-q-options").value = "";
  }
  
  document.getElementById("survey-form-title").innerText = "📝 แก้ไขคำถาม";
  document.getElementById("survey-q-save-btn").innerText = "บันทึกการแก้ไข";
  
  // Scroll to editor
  document.getElementById("survey-q-editor-card").scrollIntoView({ behavior: 'smooth' });
};

window.deleteSurveyQuestion = async function(id) {
  if (!confirm("คุณต้องการลบข้อคำถามประเมินนี้ใช่หรือไม่?")) return;
  
  if (activeSurveyTab === "initial") {
    let questions = getInitialQuestions();
    questions = questions.filter(q => String(q.id || q.QuestionID) !== String(id));
    setInitialQuestions(questions);
    alert("ลบคำถามคัดกรองแรกรับสำเร็จ");
  } else {
    let questions = getDailyQuestions();
    questions = questions.filter(q => String(q.id || q.QuestionID) !== String(id));
    // Re-index weekly questions QuestionID
    questions.forEach((q, idx) => {
      q.QuestionID = idx + 1;
    });
    setDailyQuestions(questions);
    STATE.questions = questions;
    await saveQuestionsList();
  }
  
  resetSurveyQuestionForm();
  renderAdminQManager();
  renderWeeklyQuestions();
  renderInitialSurvey();
};

window.saveSurveyQuestion = async function(e) {
  e.preventDefault();
  
  const qIdInput = document.getElementById("survey-q-id").value;
  const qText = document.getElementById("survey-q-text").value.trim();
  const qType = document.getElementById("survey-q-type").value;
  const qSection = document.getElementById("survey-q-section").value;
  const qOptionsText = document.getElementById("survey-q-options").value;
  
  const options = qType === "select" ? qOptionsText.split(",").map(s => s.trim()).filter(Boolean) : [];
  
  if (activeSurveyTab === "initial") {
    const questions = getInitialQuestions();
    if (qIdInput) {
      // Edit
      const q = questions.find(item => String(item.id || item.QuestionID) === String(qIdInput));
      if (q) {
        q.text = qText;
        q.QuestionText = qText;
        q.type = qType;
        q.section = qSection;
        q.options = options;
      }
    } else {
      // Add
      const newId = `init_${Date.now()}`;
      questions.push({
        id: newId,
        QuestionID: questions.length + 1,
        text: qText,
        QuestionText: qText,
        type: qType,
        section: qSection,
        options: options
      });
    }
    setInitialQuestions(questions);
    alert("บันทึกข้อมูลคำถามแรกรับสำเร็จ");
  } else {
    const questions = getDailyQuestions();
    if (qIdInput) {
      // Edit
      const q = questions.find(item => String(item.id || item.QuestionID) === String(qIdInput));
      if (q) {
        q.text = qText;
        q.QuestionText = qText;
        q.type = qType;
        q.options = options;
      }
    } else {
      // Add
      const newNumId = questions.length > 0 ? Math.max(...questions.map(q => q.QuestionID)) + 1 : 1;
      questions.push({
        id: `weekly_${Date.now()}`,
        QuestionID: newNumId,
        text: qText,
        QuestionText: qText,
        type: qType,
        options: options
      });
    }
    setDailyQuestions(questions);
    STATE.questions = questions;
    await saveQuestionsList();
  }
  
  resetSurveyQuestionForm();
  renderAdminQManager();
  renderWeeklyQuestions();
  renderInitialSurvey();
};

// 2. Admin Questionnaire management interface
function renderAdminQManager() {
  const container = document.getElementById("admin-questions-list");
  if (!container) return;
  container.innerHTML = "";
  
  const questions = activeSurveyTab === "initial" ? getInitialQuestions() : getDailyQuestions();
  
  if (questions.length === 0) {
    container.innerHTML = `<p class="gray-text text-center" style="grid-column: 1/-1;">ไม่มีข้อคำถามในแบบประเมินส่วนนี้</p>`;
    return;
  }
  
  questions.forEach((q, idx) => {
    const div = document.createElement("div");
    div.className = "q-manager-item";
    
    let typeLabel = "ใช่/ไม่ใช่";
    if (q.type === "select") typeLabel = "ตัวเลือก";
    else if (q.type === "scale_1_10") typeLabel = "ระดับ 1-10";
    
    const textLabel = q.text || q.QuestionText;
    const identifier = q.id || q.QuestionID;
    
    div.innerHTML = `
      <div class="flex-col" style="gap: 4px; align-items: flex-start; text-align: left;">
        <span class="badge badge-info" style="font-size:0.65rem;">${typeLabel} ${q.section ? `(${q.section})` : ''}</span>
        <span class="q-manager-text" style="font-weight:600;">${q.QuestionID || idx + 1}. ${textLabel}</span>
      </div>
      <div class="q-manager-actions">
        <button class="btn btn-secondary btn-sm" onclick="editSurveyQuestion('${identifier}')">แก้ไข</button>
        <button class="btn btn-danger btn-sm" onclick="deleteSurveyQuestion('${identifier}')">ลบ</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// Push saved questions list to Server
async function saveQuestionsList() {
  toggleLoader(true);
  
  const payload = {
    action: "updateQuestions",
    questions: STATE.questions.map(q => ({ text: q.text || q.QuestionText, type: q.type, options: q.options }))
  };
  
  if (STATE.apiSettings.isMockMode) {
    saveMockState();
    toggleLoader(false);
    alert("บันทึกการเปลี่ยนแปลงแบบประเมินสำเร็จ");
    renderAdminPanel();
  } else {
    try {
      const res = await callApiJSONP("updateQuestionsJSONP", payload);
      toggleLoader(false);
      if (res.success) {
        alert("อัปเดตแบบประเมินลง Google Sheet สำเร็จ");
        await loadData();
        renderAdminPanel();
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (err) {
      toggleLoader(false);
      alert("การเชื่อมต่อเซิร์ฟเวอร์ผิดพลาด");
    }
  }
}

// 3. Render Admin overall statistics cards
function renderAdminOverviewMetrics() {
  const totalRegistered = STATE.registrations.length;
  
  // Calculate average % BMI reduction
  let sumBmiPercent = 0;
  let activeUsersCount = 0;
  let totalWeightLost = 0;
  let competitorsCount = 0;
  
  STATE.registrations.forEach(user => {
    const userSubmissions = STATE.weeklyData.filter(d => d.EmployeeID === user.EmployeeID);
    const initialRecord = userSubmissions.find(s => parseInt(s.Week) === 1);
    const heightM = parseFloat(user.Height) / 100;
    
    let isCompetitor = true;
    if (initialRecord && heightM > 0) {
      const initialBMI = parseFloat((parseFloat(initialRecord.Weight) / (heightM * heightM)).toFixed(1));
      if (initialBMI < 23.0) {
        isCompetitor = false;
      }
    }
    if (isCompetitor) {
      competitorsCount++;
    }
    
    if (userSubmissions.length === 0 || !initialRecord) return;
    
    // Only count competitors for average statistics (starting BMI >= 23.0)
    if (heightM > 0) {
      const initialBMI = parseFloat((parseFloat(initialRecord.Weight) / (heightM * heightM)).toFixed(1));
      if (initialBMI < 23.0) return;
    }
    
    // Find latest weight
    let latestWeight = parseFloat(initialRecord.Weight);
    userSubmissions.forEach(s => {
      if (parseFloat(s.Weight) > 0) {
        latestWeight = parseFloat(s.Weight);
      }
    });
    
    const weightLost = parseFloat(initialRecord.Weight) - latestWeight;
    const currentPercent = (weightLost / parseFloat(initialRecord.Weight)) * 100;
    
    sumBmiPercent += currentPercent;
    totalWeightLost += weightLost;
    activeUsersCount++;
  });
  
  document.getElementById("admin-stat-total").innerText = `${totalRegistered} คน (มีสิทธิ์ชิงรางวัล ${competitorsCount} คน)`;
  
  const avgReduction = activeUsersCount > 0 ? (sumBmiPercent / activeUsersCount) : 0;
  
  document.getElementById("admin-stat-avg-loss").innerText = `${avgReduction.toFixed(2)}%`;
  document.getElementById("admin-stat-total-lost").innerText = `${totalWeightLost.toFixed(1)} กก.`;
}

// 4. Render interactive participants list for Admin
function renderAdminParticipantsTable() {
  const container = document.getElementById("admin-participants-table");
  container.innerHTML = "";
  
  const competitors = [];
  const generalParticipants = [];
  const pendingParticipants = [];
  
  STATE.registrations.forEach(user => {
    // Get latest submission
    const subs = STATE.weeklyData.filter(d => d.EmployeeID === user.EmployeeID);
    const initial = subs.find(s => parseInt(s.Week) === 1);
    
    let wText = "-";
    let bText = "-";
    let compText = "-";
    let initialBMI = 0;
    
    if (initial) {
      // Find latest weight using LOCF
      let latestWeight = parseFloat(initial.Weight);
      let latestWaist = parseFloat(initial.Waist);
      let latestHip = parseFloat(initial.Hip);
      let latestWeekNum = 1;
      
      subs.forEach(s => {
        const wNum = parseInt(s.Week);
        if (wNum > latestWeekNum) {
          latestWeekNum = wNum;
          latestWeight = parseFloat(s.Weight);
          latestWaist = parseFloat(s.Waist);
          latestHip = parseFloat(s.Hip);
        }
      });
      
      const heightM = parseFloat(user.Height) / 100;
      initialBMI = parseFloat((parseFloat(initial.Weight) / (heightM * heightM)).toFixed(1));
      const latestBMI = latestWeight / (heightM * heightM);
      
      wText = `${parseFloat(initial.Weight).toFixed(1)} ➔ ${latestWeight.toFixed(1)} กก.`;
      bText = `${initialBMI.toFixed(1)} ➔ ${latestBMI.toFixed(1)}`;
      compText = `<button class="btn btn-secondary btn-sm" onclick="showIndividualReport('${user.EmployeeID}')">ดูผลเส้นกราฟ</button>`;
      
      const record = { user, wText, bText, compText, initialBMI };
      if (initialBMI >= 23.0) {
        competitors.push(record);
      } else {
        generalParticipants.push(record);
      }
    } else {
      pendingParticipants.push({ user, wText, bText, compText, initialBMI: 0 });
    }
  });
  
  const renderRow = (r) => {
    let shiftText = "";
    const assessment = getParsedAssessment(r.user);
    if (assessment.init_shift) {
      shiftText = ` <span class="badge" style="background-color: #64748b; color: #fff; font-size: 0.75rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">${assessment.init_shift}</span>`;
    }
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${r.user.EmployeeID}</strong></td>
      <td>${r.user.FirstName} ${r.user.LastName}</td>
      <td>${r.user.Department}${shiftText}</td>
      <td>${r.user.Height} ซม.</td>
      <td>${r.wText}</td>
      <td>${r.bText}</td>
      <td>${r.compText}</td>
    `;
    container.appendChild(tr);
  };
  
  if (competitors.length > 0) {
    const headerTr = document.createElement("tr");
    headerTr.innerHTML = `<td colspan="7" style="background-color: #ecfdf5; color: #065f46; font-weight: 800; padding: 10px 15px; border-bottom: 2px solid #a7f3d0; font-size: 0.9rem;">🏆 กลุ่มพนักงานที่มีสิทธิ์ลุ้นรางวัล (ดัชนีมวลกาย BMI แรกรับ >= 23.0) - จำนวน ${competitors.length} คน</td>`;
    container.appendChild(headerTr);
    competitors.forEach(renderRow);
  }
  
  if (generalParticipants.length > 0) {
    const headerTr = document.createElement("tr");
    headerTr.innerHTML = `<td colspan="7" style="background-color: #fffbeb; color: #92400e; font-weight: 800; padding: 10px 15px; border-bottom: 2px solid #fde68a; font-size: 0.9rem; margin-top: 10px;">👥 กลุ่มพนักงานเข้าร่วมทั่วไปเพื่อสุขภาพ (ดัชนีมวลกาย BMI แรกรับ < 23.0) - จำนวน ${generalParticipants.length} คน</td>`;
    container.appendChild(headerTr);
    generalParticipants.forEach(renderRow);
  }
  
  if (pendingParticipants.length > 0) {
    const headerTr = document.createElement("tr");
    headerTr.innerHTML = `<td colspan="7" style="background-color: #f1f5f9; color: #475569; font-weight: 800; padding: 10px 15px; border-bottom: 2px solid #cbd5e1; font-size: 0.9rem; margin-top: 10px;">⏳ พนักงานสมัครใหม่ (รอแอดมินบันทึกน้ำหนักสัปดาห์ที่ 1) - จำนวน ${pendingParticipants.length} คน</td>`;
    container.appendChild(headerTr);
    pendingParticipants.forEach(renderRow);
  }
  
  if (container.children.length === 0) {
    container.innerHTML = `<tr><td colspan="7" class="text-center gray-text">ยังไม่มีพนักงานสมัครเข้าร่วมโครงการ</td></tr>`;
  }
}

// Detail View Modal of individual employee details
window.showIndividualReport = function(empId) {
  const user = STATE.registrations.find(u => String(u.EmployeeID).trim() === String(empId).trim());
  if (!user) return;
  
  const rawSubmissions = STATE.weeklyData.filter(d => d.EmployeeID === user.EmployeeID);
  const initial = rawSubmissions.find(s => parseInt(s.Week) === 1);
  if (!initial) {
    alert("ไม่มีข้อมูลสัปดาห์ที่ 1 สำหรับพนักงานท่านนี้");
    return;
  }
  
  const timeline = getTimelineMetrics();
  const maxWeeks = Math.min(timeline.maxWeeks, Math.max(1, timeline.currentWeek));
  const heightM = parseFloat(user.Height) / 100;
  
  // Interpolate LOCF data
  const dataPoints = [];
  let currentW = parseFloat(initial.Weight);
  let currentWaist = parseFloat(initial.Waist);
  let currentHip = parseFloat(initial.Hip);
  
  for (let w = 1; w <= maxWeeks; w++) {
    const sub = rawSubmissions.find(s => parseInt(s.Week) === w);
    if (sub) {
      currentW = parseFloat(sub.Weight);
      currentWaist = parseFloat(sub.Waist);
      currentHip = parseFloat(sub.Hip);
    }
    dataPoints.push({
      week: w,
      weight: currentW,
      waist: currentWaist,
      hip: currentHip,
      bmi: currentW / (heightM * heightM)
    });
  }
  
  // Build Modal UI
  document.getElementById("modal-user-title").innerText = `รายละเอียดกราฟความก้าวหน้า: ${user.FirstName} ${user.LastName} (รหัส ${user.EmployeeID})`;
  
  // Open modal
  const modal = document.getElementById("details-modal");
  modal.classList.add("active");
  
  // Calculate Success Prediction Score
  let score = 0;
  let text = "";
  let barColor = "var(--primary)";
  
  // 1. Habit compliance (up to 50 points)
  const habitWeeks = rawSubmissions.filter(s => parseInt(s.Week) > 1);
  let totalHabitYes = 0;
  let totalHabitQ = 0;
  habitWeeks.forEach(s => {
    let answers = [];
    try { answers = JSON.parse(s.AnswersJson || "[]"); } catch(e){}
    answers.forEach(a => {
      totalHabitQ++;
      if (a.answer === "ใช่") totalHabitYes++;
    });
  });
  
  const complianceRate = totalHabitQ > 0 ? (totalHabitYes / totalHabitQ) : 0;
  const complianceScore = complianceRate * 50; // max 50 points
  
  // 2. Initial Assessment & Confidence (up to 40 points)
  let initialAssessment = getParsedAssessment(user);
  
  let baselineScore = 0;
  // lifestyle questions 1-6 (each is เป็นประจำ=4, 2-3 วันครั้ง=2, ไม่เลย=0)
  for (let i = 1; i <= 6; i++) {
    const ans = initialAssessment[`init_life_${i}`];
    if (ans === "เป็นประจำ") baselineScore += 4;
    else if (ans === "2-3 วันครั้ง") baselineScore += 2;
  }
  // lifestyle question 7 (scale 1-10, worth 1-10 points, scaled to 16 max)
  const confidence = parseInt(initialAssessment.init_life_7) || 5;
  baselineScore += confidence * 1.6; // max 16 points, total baseline max 40 points
  
  // 3. Safety goal targets (up to 10 points)
  const initialWeight = parseFloat(initial.Weight);
  const targetLoss = parseFloat(user.TargetWeightLoss);
  const isTargetSafe = evaluateWeightLossSafety(initialWeight, targetLoss).valid;
  const safetyScore = isTargetSafe ? 10 : 0;
  
  const totalPredictiveScore = Math.min(100, Math.round(complianceScore + baselineScore + safetyScore));
  
  // Advice text
  if (totalPredictiveScore >= 80) {
    text = `โอกาสสำเร็จสูงมากค่ะ (${totalPredictiveScore}%) พนักงานมีวินัยการส่งผลที่ดีเลิศและมีเป้าหมายที่ปลอดภัย รวมถึงมีพฤติกรรมพื้นฐานที่ดี ขอแนะนำให้ปฏิบัติตามแผนงานนี้อย่างต่อเนื่องจนสิ้นสุด 90 วันค่ะ`;
    barColor = "var(--primary)";
  } else if (totalPredictiveScore >= 50) {
    text = `โอกาสสำเร็จปานกลาง (${totalPredictiveScore}%) พนักงานยังปรับพฤติกรรมบางด้านได้ไม่เต็มร้อย หรือความสม่ำเสมอในสัปดาห์ยังขาดหาย แนะนำเพิ่มความถี่การออกกำลังกายและคุมแป้งในมื้ออาหารเพิ่มขึ้นค่ะ`;
    barColor = "var(--secondary)";
  } else {
    text = `โอกาสสำเร็จค่อนข้างต่ำ (${totalPredictiveScore}%) เนื่องจากวินัยพฤติกรรมสะสมยังต่ำ หรือเป้าหมายแรกรับหักโหมเกินไป แนะนำให้ปรึกษา HR เพื่อวางแผนความเข้มข้นของการออกกำลังกายและการทานโปรตีนเพื่อความสำเร็จที่ปลอดภัยค่ะ`;
    barColor = "var(--danger)";
  }
  
  // Render predictive widget dynamically inside the modal content
  let predictionContainer = document.getElementById("modal-prediction-score-container");
  if (!predictionContainer) {
    predictionContainer = document.createElement("div");
    predictionContainer.id = "modal-prediction-score-container";
    predictionContainer.style.marginTop = "1.5rem";
    predictionContainer.style.borderTop = "1px solid var(--border-color)";
    predictionContainer.style.paddingTop = "1.5rem";
    const footerDiv = modal.querySelector(".flex.justify-between") || modal.querySelector("button.btn-secondary").parentNode;
    if (footerDiv) {
      footerDiv.parentNode.insertBefore(predictionContainer, footerDiv);
    }
  }
  
  predictionContainer.innerHTML = `
    <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--dark-slate); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; text-align: left;">
      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2.5" style="color: var(--primary-dark);"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
      การประเมินอัตราความสำเร็จ (BMI Success Prediction Score)
    </h4>
    <div style="background-color: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; font-size: 0.85rem; line-height: 1.5; text-align: left;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px; font-weight:700;">
        <span>คะแนนความพร้อมสะสม:</span>
        <span style="color: ${barColor};">${totalPredictiveScore}%</span>
      </div>
      <div style="width: 100%; height: 8px; background-color: #e2e8f0; border-radius: 9999px; overflow: hidden; margin-bottom: 10px;">
        <div style="width: ${totalPredictiveScore}%; height: 100%; background-color: ${barColor}; transition: width 0.5s ease-in-out;"></div>
      </div>
      <p style="margin: 0; color: var(--gray-text); font-size: 0.8rem;">${text}</p>
    </div>
  `;
  
  // Render Modal Chart
  setTimeout(() => {
    drawIndividualModalChart(dataPoints);
  }, 100);
};

function drawIndividualModalChart(dataPoints) {
  const ctx = document.getElementById("modalIndividualChart").getContext("2d");
  const labels = dataPoints.map(d => `สัปดาห์ ${d.week}`);
  
  if (STATE.charts.modalIndividual) {
    STATE.charts.modalIndividual.destroy();
  }
  
  STATE.charts.modalIndividual = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "น้ำหนัก (กก.)",
          data: dataPoints.map(d => d.weight),
          borderColor: "#3b82f6",
          backgroundColor: "transparent",
          yAxisID: "y-main",
          borderWidth: 3,
          tension: 0.1
        },
        {
          label: "BMI",
          data: dataPoints.map(d => parseFloat(d.bmi.toFixed(2))),
          borderColor: "#10b981",
          backgroundColor: "transparent",
          yAxisID: "y-bmi",
          borderWidth: 3,
          tension: 0.1
        },
        {
          label: "รอบเอว (นิ้ว)",
          data: dataPoints.map(d => d.waist),
          borderColor: "#ec4899",
          backgroundColor: "transparent",
          yAxisID: "y-main",
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.1
        },
        {
          label: "รอบสะโพก (นิ้ว)",
          data: dataPoints.map(d => d.hip),
          borderColor: "#8b5cf6",
          backgroundColor: "transparent",
          yAxisID: "y-main",
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        "y-main": {
          type: "linear",
          position: "left",
          title: { display: true, text: "น้ำหนัก / สัดส่วน" }
        },
        "y-bmi": {
          type: "linear",
          position: "right",
          title: { display: true, text: "BMI" },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

// Close Modal helper
window.closeDetailsModal = function() {
  document.getElementById("details-modal").classList.remove("active");
};

// ----------------------------------------------------
// ADMIN COPY-PASTE BULK EXCEL UPLOADER
// ----------------------------------------------------

async function handleBulkUploadAction() {
  const week = parseInt(document.getElementById("bulk-week-select").value);
  const text = document.getElementById("bulk-copy-paste-area").value;
  
  if (isNaN(week)) {
    alert("กรุณาเลือกสัปดาห์ที่นำเข้าข้อมูล");
    return;
  }
  
  if (!text.trim()) {
    alert("กรุณาวางข้อมูลดิบที่คัดลอกจาก Excel หรือ Google Sheets");
    return;
  }
  
  // Parse Tab-separated values (TSV) or Comma-separated (CSV)
  const rows = [];
  const lines = text.trim().split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by tabs, commas, or spaces (whitespace)
    const parts = line.split(/\t|,|\s+/);
    if (parts.length < 4) {
      alert(`แถวที่ ${i + 1} รูปแบบข้อมูลไม่ถูกต้อง! ต้องมี 4 คอลัมน์ (รหัสพนักงาน, น้ำหนัก, รอบเอว, รอบสะโพก)`);
      return;
    }
    
    const rawId = parts[0].trim();
    // Preserve leading zeros: If it's a numeric string, ensure it has proper padding or is treated as string
    let employeeId = rawId;
    if (/^\d+$/.test(employeeId) && employeeId.length < 6) {
      employeeId = employeeId.padStart(6, '0');
    }
    
    const weight = parseFloat(parts[1]);
    const waist = parseFloat(parts[2]);
    const hip = parseFloat(parts[3]);
    
    if (isNaN(weight) || isNaN(waist) || isNaN(hip)) {
      alert(`แถวที่ ${i + 1} (พนักงาน ${rawId}) มีค่าตัวเลขที่ไม่ถูกต้อง!`);
      return;
    }
    
    rows.push({
      employeeId,
      week,
      weight,
      waist,
      hip
    });
  }
  
  if (rows.length === 0) {
    alert("ไม่มีแถวข้อมูลที่ถูกต้องให้บันทึก");
    return;
  }
  
  if (!confirm(`ยืนยันการนำเข้าข้อมูลสัปดาห์ที่ ${week} จำนวนทั้งหมด ${rows.length} คน หรือไม่? (ระบบจะเพิ่มคนใหม่และเขียนทับข้อมูลเดิมหาซ้ำ)`)) {
    return;
  }
  
  toggleLoader(true);
  
  const payload = {
    action: "adminBulkUpload",
    week,
    rows
  };
  
  if (STATE.apiSettings.isMockMode) {
    // Write local mock updates
    let added = 0;
    let updated = 0;
    
    rows.forEach(row => {
      const matchIdx = STATE.weeklyData.findIndex(d => d.EmployeeID === row.employeeId && parseInt(d.Week) === week);
      
      if (matchIdx !== -1) {
        STATE.weeklyData[matchIdx].Weight = row.weight;
        STATE.weeklyData[matchIdx].Waist = row.waist;
        STATE.weeklyData[matchIdx].Hip = row.hip;
        STATE.weeklyData[matchIdx].SubmitDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
        updated++;
      } else {
        STATE.weeklyData.push({
          EmployeeID: row.employeeId,
          Week: week,
          Weight: row.weight,
          Waist: row.waist,
          Hip: row.hip,
          AnswersJson: "[]",
          SubmitDate: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
        added++;
      }
    });
    
    saveMockState();
    toggleLoader(false);
    alert(`นำเข้าข้อมูลจำลองสัปดาห์ที่ ${week} เรียบร้อย (เพิ่มใหม่ ${added} รายการ, เขียนทับ ${updated} รายการ)`);
    document.getElementById("bulk-copy-paste-area").value = "";
    renderAdminPanel();
  } else {
    try {
      const res = await callApiJSONP("adminBulkUploadJSONP", payload);
      
      toggleLoader(false);
      if (res.success) {
        alert(res.message || "นำเข้าข้อมูลลง Google Sheets เรียบร้อยแล้วค่ะ!");
        document.getElementById("bulk-copy-paste-area").value = "";
        await loadData();
        renderAdminPanel();
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก: " + res.error);
      }
    } catch (err) {
      toggleLoader(false);
      alert("ไม่สามารถสื่อสารกับเครือข่ายได้");
      console.error(err);
    }
  }
}

// ----------------------------------------------------
// EXECUTIVE REPORT CHARTS & COMPARISONS FOR ADMIN
// ----------------------------------------------------

function drawAdminExecutiveCharts() {
  const deptSelect = document.getElementById("admin-exec-dept");
  const compWeek1Select = document.getElementById("admin-exec-week-1");
  const compWeek2Select = document.getElementById("admin-exec-week-2");
  
  // Fill department options
  const depts = new Set(STATE.registrations.map(r => r.Department));
  const currentDeptVal = deptSelect.value;
  deptSelect.innerHTML = '<option value="all">ทุกแผนก (ภาพรวม)</option>';
  depts.forEach(d => {
    if (d) {
      const opt = document.createElement("option");
      opt.value = d;
      opt.innerText = d;
      deptSelect.appendChild(opt);
    }
  });
  deptSelect.value = currentDeptVal || "all";
  
  // Get active registered users
  const activeRegs = STATE.registrations.filter(r => {
    return currentDeptVal === "all" || currentDeptVal === "" || r.Department === currentDeptVal;
  });
  
  // Find valid weeks for dropdowns
  const weeksAvailable = new Set();
  STATE.weeklyData.forEach(d => weeksAvailable.add(parseInt(d.Week)));
  
  const sortedWeeks = Array.from(weeksAvailable).sort((a,b) => a - b);
  
  // Save selections
  const prevComp1 = compWeek1Select.value;
  const prevComp2 = compWeek2Select.value;
  
  compWeek1Select.innerHTML = "";
  compWeek2Select.innerHTML = "";
  
  sortedWeeks.forEach(w => {
    const opt = document.createElement("option");
    opt.value = w;
    opt.innerText = `สัปดาห์ที่ ${w}`;
    compWeek1Select.appendChild(opt.cloneNode(true));
    compWeek2Select.appendChild(opt);
  });
  
  compWeek1Select.value = prevComp1 || (sortedWeeks.length > 0 ? "1" : "");
  compWeek2Select.value = prevComp2 || (sortedWeeks.length > 0 ? sortedWeeks[sortedWeeks.length - 1].toString() : "");
  
  // Process stats for Admin charts
  renderExecutiveReportsData();
}

// Compute executive statistics and render Chart.js items
function renderExecutiveReportsData() {
  const selectedDept = document.getElementById("admin-exec-dept").value;
  const w1 = parseInt(document.getElementById("admin-exec-week-1").value);
  const w2 = parseInt(document.getElementById("admin-exec-week-2").value);
  
  // Filter registered employees
  const targetUsers = STATE.registrations.filter(r => selectedDept === "all" || r.Department === selectedDept);
  
  if (targetUsers.length === 0) {
    clearAdminCharts();
    document.getElementById("admin-comp-stat-results").innerHTML = `<p class="gray-text text-center">ไม่มีข้อมูลพนักงานสำหรับกลุ่มตัวกรองนี้</p>`;
    return;
  }
  
  // Compute department pie distribution
  renderDepartmentPieChart();
  
  // Compile progress weeks lists
  // Find highest week submitted
  let maxWeekAvailable = 1;
  STATE.weeklyData.forEach(d => {
    const wNum = parseInt(d.Week);
    if (wNum > maxWeekAvailable) maxWeekAvailable = wNum;
  });
  
  const timeline = getTimelineMetrics();
  const lastWeekIdx = Math.min(timeline.maxWeeks, maxWeekAvailable);
  
  // Compute average metrics for each week (using LOCF interpolation for participants)
  const weeksLabels = [];
  const avgWeightLossPerWeek = [];
  const avgBmiLossPerWeek = [];
  const avgWaistLossPerWeek = [];
  const avgHipLossPerWeek = [];
  
  for (let w = 1; w <= lastWeekIdx; w++) {
    weeksLabels.push(`สัปดาห์ ${w}`);
    
    let sumWeightLossPercent = 0;
    let sumBmiLossPercent = 0;
    let sumWaistLossPercent = 0;
    let sumHipLossPercent = 0;
    
    let validCount = 0;
    
    targetUsers.forEach(user => {
      const userSubs = STATE.weeklyData.filter(d => d.EmployeeID === user.EmployeeID);
      const initial = userSubs.find(s => parseInt(s.Week) === 1);
      if (!initial) return; // Skip if no Week 1 data
      
      // Interpolate for week w
      let currentWWeight = parseFloat(initial.Weight);
      let currentWWaist = parseFloat(initial.Waist);
      let currentWHip = parseFloat(initial.Hip);
      
      // Find latest submission <= w
      let foundSub = initial;
      userSubs.forEach(s => {
        const sW = parseInt(s.Week);
        if (sW <= w && sW > parseInt(foundSub.Week)) {
          foundSub = s;
        }
      });
      
      currentWWeight = parseFloat(foundSub.Weight);
      currentWWaist = parseFloat(foundSub.Waist);
      currentWHip = parseFloat(foundSub.Hip);
      
      const initW = parseFloat(initial.Weight);
      const initWaist = parseFloat(initial.Waist);
      const initHip = parseFloat(initial.Hip);
      
      // Calc reduction percent
      const wLossPercent = ((initW - currentWWeight) / initW) * 100;
      const bLossPercent = wLossPercent; // Math identical
      const waistLossPercent = initWaist > 0 ? (((initWaist - currentWWaist) / initWaist) * 100) : 0;
      const hipLossPercent = initHip > 0 ? (((initHip - currentWHip) / initHip) * 100) : 0;
      
      sumWeightLossPercent += wLossPercent;
      sumBmiLossPercent += bLossPercent;
      sumWaistLossPercent += waistLossPercent;
      sumHipLossPercent += hipLossPercent;
      validCount++;
    });
    
    if (validCount > 0) {
      avgWeightLossPerWeek.push(sumWeightLossPercent / validCount);
      avgBmiLossPerWeek.push(sumBmiLossPercent / validCount);
      avgWaistLossPerWeek.push(sumWaistLossPercent / validCount);
      avgHipLossPerWeek.push(sumHipLossPercent / validCount);
    } else {
      avgWeightLossPerWeek.push(0);
      avgBmiLossPerWeek.push(0);
      avgWaistLossPerWeek.push(0);
      avgHipLossPerWeek.push(0);
    }
  }
  
  // Draw weekly average percent reduction line charts
  drawAdminWeeklyAveragesChart(weeksLabels, avgWeightLossPerWeek, avgBmiLossPerWeek, avgWaistLossPerWeek, avgHipLossPerWeek);
  
  // Render chosen week-vs-week comparison cards
  renderSelectedWeeksComparison(targetUsers, w1, w2);
}

// Admin Chart: Department participants pie breakdown
function renderDepartmentPieChart() {
  const ctx = document.getElementById("adminDeptPieChart").getContext("2d");
  
  // Count departments
  const deptCounts = {};
  STATE.registrations.forEach(r => {
    if (r.Department) {
      deptCounts[r.Department] = (deptCounts[r.Department] || 0) + 1;
    }
  });
  
  const labels = Object.keys(deptCounts);
  const data = Object.values(deptCounts);
  const bgColors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6", "#64748b"];
  
  if (STATE.charts.adminDeptPie) {
    STATE.charts.adminDeptPie.destroy();
  }
  
  STATE.charts.adminDeptPie = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: bgColors.slice(0, labels.length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

// Admin Chart: Average % weight/waist/hip reduction weekly trends
function drawAdminWeeklyAveragesChart(labels, weights, bmis, waists, hips) {
  const ctx = document.getElementById("adminWeeklyAvgChart").getContext("2d");
  
  if (STATE.charts.adminWeeklyAvg) {
    STATE.charts.adminWeeklyAvg.destroy();
  }
  
  STATE.charts.adminWeeklyAvg = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "% น้ำหนักลดลง (เฉลี่ย)",
          data: weights.map(v => parseFloat(v.toFixed(2))),
          borderColor: "#3b82f6",
          backgroundColor: "transparent",
          borderWidth: 3,
          pointRadius: 4,
          tension: 0.1
        },
        {
          label: "% BMI ลดลง (เฉลี่ย)",
          data: bmis.map(v => parseFloat(v.toFixed(2))),
          borderColor: "#10b981",
          backgroundColor: "transparent",
          borderWidth: 3,
          borderDash: [5, 5],
          pointRadius: 4,
          tension: 0.1
        },
        {
          label: "% รอบเอวลดลง (เฉลี่ย)",
          data: waists.map(v => parseFloat(v.toFixed(2))),
          borderColor: "#ec4899",
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 4,
          tension: 0.1
        },
        {
          label: "% รอบสะโพกลดลง (เฉลี่ย)",
          data: hips.map(v => parseFloat(v.toFixed(2))),
          borderColor: "#8b5cf6",
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 4,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.raw}%`;
            }
          }
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "% การลดลงสะสมจากสัปดาห์ที่ 1"
          },
          ticks: {
            callback: function(value) {
              return value + "%";
            }
          }
        }
      }
    }
  });
}

// Compare week w1 vs w2 across selected employee groups
function renderSelectedWeeksComparison(users, w1, w2) {
  const container = document.getElementById("admin-comp-stat-results");
  
  if (isNaN(w1) || isNaN(w2)) {
    container.innerHTML = `<p class="gray-text text-center">ไม่มีข้อมูลสำหรับสัปดาห์เปรียบเทียบที่ระบุ</p>`;
    return;
  }
  
  let sumW1Weight = 0, sumW2Weight = 0;
  let sumW1Waist = 0, sumW2Waist = 0;
  let sumW1Hip = 0, sumW2Hip = 0;
  let countWeight = 0, countWaist = 0, countHip = 0;
  
  users.forEach(user => {
    const userSubs = STATE.weeklyData.filter(d => d.EmployeeID === user.EmployeeID);
    const initial = userSubs.find(s => parseInt(s.Week) === 1);
    if (!initial) return;
    
    // LOCF interpolation
    const getWeekData = (targetWeek) => {
      let latestSub = initial;
      userSubs.forEach(s => {
        const wNum = parseInt(s.Week);
        if (wNum <= targetWeek && wNum > parseInt(latestSub.Week)) {
          latestSub = s;
        }
      });
      return latestSub;
    };
    
    const rec1 = getWeekData(w1);
    const rec2 = getWeekData(w2);
    
    sumW1Weight += parseFloat(rec1.Weight);
    sumW2Weight += parseFloat(rec2.Weight);
    countWeight++;
    
    if (parseFloat(rec1.Waist) > 0 && parseFloat(rec2.Waist) > 0) {
      sumW1Waist += parseFloat(rec1.Waist);
      sumW2Waist += parseFloat(rec2.Waist);
      countWaist++;
    }
    
    if (parseFloat(rec1.Hip) > 0 && parseFloat(rec2.Hip) > 0) {
      sumW1Hip += parseFloat(rec1.Hip);
      sumW2Hip += parseFloat(rec2.Hip);
      countHip++;
    }
  });
  
  if (countWeight === 0) {
    container.innerHTML = `<p class="gray-text text-center">ไม่พบผลการวัดในกลุ่มคนและสัปดาห์ที่เลือก</p>`;
    return;
  }
  
  const avgW1Weight = sumW1Weight / countWeight;
  const avgW2Weight = sumW2Weight / countWeight;
  const weightRedPercent = ((avgW1Weight - avgW2Weight) / avgW1Weight) * 100;
  
  const avgW1Waist = countWaist > 0 ? (sumW1Waist / countWaist) : 0;
  const avgW2Waist = countWaist > 0 ? (sumW2Waist / countWaist) : 0;
  const waistRedPercent = avgW1Waist > 0 ? (((avgW1Waist - avgW2Waist) / avgW1Waist) * 100) : 0;
  
  const avgW1Hip = countHip > 0 ? (sumW1Hip / countHip) : 0;
  const avgW2Hip = countHip > 0 ? (sumW2Hip / countHip) : 0;
  const hipRedPercent = avgW1Hip > 0 ? (((avgW1Hip - avgW2Hip) / avgW1Hip) * 100) : 0;
  
  container.innerHTML = `
    <div style="font-weight: 700; margin-bottom: 0.5rem; font-size: 0.95rem;">
      เปรียบเทียบค่าเฉลี่ย: สัปดาห์ ${w1} ➔ สัปดาห์ ${w2} (พนักงานเข้าร่วม ${countWeight} คน)
    </div>
    <div class="comparison-container">
      <div class="comp-box">
        <div class="comp-title">น้ำหนักเฉลี่ย</div>
        <div class="comp-metric">${avgW1Weight.toFixed(1)} ➔ ${avgW2Weight.toFixed(1)} กก.</div>
        ${getDiffBadge(-weightRedPercent, "%")}
      </div>
      
      <div class="comp-box">
        <div class="comp-title">รอบเอวเฉลี่ย</div>
        <div class="comp-metric">${avgW1Waist > 0 ? `${avgW1Waist.toFixed(1)} ➔ ${avgW2Waist.toFixed(1)} นิ้ว` : "-"}</div>
        ${countWaist > 0 ? getDiffBadge(-waistRedPercent, "%") : ""}
      </div>
      
      <div class="comp-box">
        <div class="comp-title">รอบสะโพกเฉลี่ย</div>
        <div class="comp-metric">${avgW1Hip > 0 ? `${avgW1Hip.toFixed(1)} ➔ ${avgW2Hip.toFixed(1)} นิ้ว` : "-"}</div>
        ${countHip > 0 ? getDiffBadge(-hipRedPercent, "%") : ""}
      </div>
    </div>
  `;
}

function clearAdminCharts() {
  if (STATE.charts.adminDeptPie) STATE.charts.adminDeptPie.destroy();
  if (STATE.charts.adminWeeklyAvg) STATE.charts.adminWeeklyAvg.destroy();
}

// Save Google Sheets API Settings
function handleSaveApiSettings(e) {
  e.preventDefault();
  const url = document.getElementById("api-url-input").value.trim();
  
  if (url === "") {
    localStorage.removeItem("bmi_api_url");
    STATE.apiSettings.apiUrl = "";
    STATE.apiSettings.isMockMode = true;
    alert("ระบบเปลี่ยนเป็นโหมดจำลอง (Mock Data Mode)");
  } else {
    localStorage.setItem("bmi_api_url", url);
    STATE.apiSettings.apiUrl = url;
    STATE.apiSettings.isMockMode = false;
    alert("บันทึกที่อยู่ Google Sheets Web App สำเร็จแล้ว ระบบจะรีโหลดข้อมูลใหม่");
  }
  
  location.reload();
}

// ----------------------------------------------------
// BIND EVENTS UI TO PAGE ACTIONS
// ----------------------------------------------------

function setupEventListeners() {
  // Page 1 Forms
  const btnSearch = document.getElementById("reg-search-btn");
  if(btnSearch) btnSearch.addEventListener("click", handleSearchEmployee);
  
  const regHeight = document.getElementById("reg-height");
  if(regHeight) regHeight.addEventListener("input", handleTargetWeightEvaluation);
  
  const regWeight = document.getElementById("reg-weight");
  if(regWeight) regWeight.addEventListener("input", handleTargetWeightEvaluation);
  
  const regTargetLoss = document.getElementById("reg-target-loss");
  if(regTargetLoss) regTargetLoss.addEventListener("input", handleTargetWeightEvaluation);
  
  const regForm = document.getElementById("reg-form");
  if(regForm) regForm.addEventListener("submit", handleRegistrationSubmit);
  
  const regLocation = document.getElementById("reg-location");
  if(regLocation) regLocation.addEventListener("change", populateRegistrationDates);
  
  // Page 2 Forms
  const repLoginForm = document.getElementById("report-login-form");
  if(repLoginForm) repLoginForm.addEventListener("submit", handleReportLogin);
  
  const repForm = document.getElementById("weekly-report-form");
  if(repForm) repForm.addEventListener("submit", handleWeeklySubmitAction);
  
  const finalBookingForm = document.getElementById("final-booking-form");
  if(finalBookingForm) finalBookingForm.addEventListener("submit", handleFinalBookingSubmit);
  
  const reportLogoutBtn = document.getElementById("report-logout-btn");
  if(reportLogoutBtn) reportLogoutBtn.addEventListener("click", handleLogout);
  
  // Page 3 Leaderboard filters
  const leaderDept = document.getElementById("leader-dept-filter");
  if(leaderDept) leaderDept.addEventListener("change", renderLeaderboard);
  
  const leaderSearch = document.getElementById("leader-search");
  if(leaderSearch) leaderSearch.addEventListener("input", renderLeaderboard);
  
  // Page 4 Dashboard login/controls
  const dbLoginForm = document.getElementById("dashboard-login-form");
  if(dbLoginForm) dbLoginForm.addEventListener("submit", handleDashboardLogin);
  
  const dashboardLogoutBtn = document.getElementById("dashboard-logout-btn");
  if(dashboardLogoutBtn) dashboardLogoutBtn.addEventListener("click", handleLogout);
  
  const compWeek1 = document.getElementById("comp-week-1");
  if(compWeek1) compWeek1.addEventListener("change", handleComparisonWeekChange);
  
  const compWeek2 = document.getElementById("comp-week-2");
  if(compWeek2) compWeek2.addEventListener("change", handleComparisonWeekChange);
  
  // Dynamic Chart toggles binding
  document.querySelectorAll(".chart-controls input").forEach(chk => {
    chk.addEventListener("change", (e) => {
      toggleChartLine(chk.id, chk);
    });
  });
  
  // Page 5 Admin Actions
  const adminLoginForm = document.getElementById("admin-login-form");
  if(adminLoginForm) adminLoginForm.addEventListener("submit", handleAdminLogin);
  
  const adminLogoutBtn = document.getElementById("admin-logout-btn");
  if(adminLogoutBtn) adminLogoutBtn.addEventListener("click", handleAdminLogout);
  
  const settingsForm = document.getElementById("admin-settings-form");
  if(settingsForm) settingsForm.addEventListener("submit", handleSaveSettings);
  
  const apiSettingsForm = document.getElementById("api-settings-form");
  if(apiSettingsForm) apiSettingsForm.addEventListener("submit", handleSaveApiSettings);
  
  const bulkUploadBtn = document.getElementById("admin-bulk-upload-btn");
  if(bulkUploadBtn) bulkUploadBtn.addEventListener("click", handleBulkUploadAction);
  
  const execDept = document.getElementById("admin-exec-dept");
  if(execDept) execDept.addEventListener("change", renderExecutiveReportsData);
  
  const execWeek1 = document.getElementById("admin-exec-week-1");
  if(execWeek1) execWeek1.addEventListener("change", renderExecutiveReportsData);
  
  const execWeek2 = document.getElementById("admin-exec-week-2");
  if(execWeek2) execWeek2.addEventListener("change", renderExecutiveReportsData);
  
  // Bind single-entry logger elements
  const singleSearchBtn = document.getElementById("admin-single-search-btn");
  if (singleSearchBtn) singleSearchBtn.addEventListener("click", handleAdminSingleEntrySearch);
  
  const singleWeekSelect = document.getElementById("admin-single-week");
  if (singleWeekSelect) singleWeekSelect.addEventListener("change", handleAdminSingleEntryWeekChange);
  
  const singleEmpId = document.getElementById("admin-single-empid");
  if (singleEmpId) singleEmpId.addEventListener("change", handleAdminSingleEntrySearch);
  
  const singleForm = document.getElementById("admin-single-entry-form");
  if (singleForm) singleForm.addEventListener("submit", handleAdminSingleEntrySubmit);
  
  // Bind registration summary modal controls
  const regModalEdit = document.getElementById("reg-modal-edit-btn");
  if (regModalEdit) regModalEdit.addEventListener("click", () => {
    document.getElementById("reg-summary-modal").classList.remove("active");
  });
  
  const regModalCloseIcon = document.getElementById("reg-modal-close-icon");
  if (regModalCloseIcon) regModalCloseIcon.addEventListener("click", () => {
    document.getElementById("reg-summary-modal").classList.remove("active");
  });
  
  const regModalConfirm = document.getElementById("reg-modal-confirm-btn");
  if (regModalConfirm) regModalConfirm.addEventListener("click", executeRegistrationSubmit);
}

// Search employee for single entry measurement in Admin Panel
function handleAdminSingleEntrySearch() {
  const empIdInput = document.getElementById("admin-single-empid");
  let empId = empIdInput.value.toString().trim();
  
  if (!empId) return;
  
  // Pad ID
  if (/^\d+$/.test(empId) && empId.length < 6) {
    empId = empId.padStart(6, '0');
    empIdInput.value = empId;
  }
  
  // Search in registrations first (priority) or employee database
  let employee = STATE.registrations.find(r => String(r.EmployeeID).trim() === empId);
  if (!employee) {
    employee = STATE.employees.find(e => String(e.EmployeeID).trim() === empId);
  }
  
  const nameLabel = document.getElementById("admin-single-empname");
  const deptLabel = document.getElementById("admin-single-empdept");
  
  if (employee) {
    nameLabel.innerText = `${employee.FirstName} ${employee.LastName}`;
    deptLabel.innerText = employee.Department || "-";
    
    // Auto-fill existing measurement if already entered for this week
    handleAdminSingleEntryWeekChange();
  } else {
    nameLabel.innerText = "ไม่พบรหัสพนักงานนี้";
    deptLabel.innerText = "-";
    document.getElementById("admin-single-weight").value = "";
    document.getElementById("admin-single-waist").value = "";
    document.getElementById("admin-single-hip").value = "";
  }
}

// Pre-fill measurements if employee has already submitted for the selected week
function handleAdminSingleEntryWeekChange() {
  const empId = document.getElementById("admin-single-empid").value.toString().trim();
  const week = parseInt(document.getElementById("admin-single-week").value);
  
  if (!empId) return;
  
  const existingRecord = STATE.weeklyData.find(d => 
    String(d.EmployeeID).trim() === empId && parseInt(d.Week) === week
  );
  
  const weightInput = document.getElementById("admin-single-weight");
  const waistInput = document.getElementById("admin-single-waist");
  const hipInput = document.getElementById("admin-single-hip");
  
  if (existingRecord) {
    weightInput.value = existingRecord.Weight || "";
    waistInput.value = existingRecord.Waist || "";
    hipInput.value = existingRecord.Hip || "";
  } else {
    // Check if Week 1 exists to auto-fill waist/hip as fallback for convenience
    const w1Record = STATE.weeklyData.find(d => 
      String(d.EmployeeID).trim() === empId && parseInt(d.Week) === 1
    );
    weightInput.value = "";
    waistInput.value = w1Record ? (w1Record.Waist || "") : "";
    hipInput.value = w1Record ? (w1Record.Hip || "") : "";
  }
}

// Submit single entry measurement by Admin
async function handleAdminSingleEntrySubmit(e) {
  e.preventDefault();
  
  const empIdInput = document.getElementById("admin-single-empid");
  let empId = empIdInput.value.toString().trim();
  const week = parseInt(document.getElementById("admin-single-week").value);
  const weight = parseFloat(document.getElementById("admin-single-weight").value);
  const waist = parseFloat(document.getElementById("admin-single-waist").value);
  const hip = parseFloat(document.getElementById("admin-single-hip").value);
  
  if (!empId || isNaN(weight) || isNaN(waist) || isNaN(hip)) {
    alert("กรุณากรอกข้อมูลรหัสพนักงาน น้ำหนัก รอบเอว และรอบสะโพกให้ถูกต้องครบถ้วน");
    return;
  }
  
  // Pad ID
  if (/^\d+$/.test(empId) && empId.length < 6) {
    empId = empId.padStart(6, '0');
    empIdInput.value = empId;
  }
  
  // Verify employee is registered
  const isRegistered = STATE.registrations.some(r => String(r.EmployeeID).trim() === empId);
  if (!isRegistered) {
    const confirmCreate = confirm(`ไม่พบการลงทะเบียนรหัสพนักงาน ${empId} ในหน้าสมัครโครงการ คุณแน่ใจหรือไม่ว่าต้องการบันทึกข้อมูลสัดส่วนโดยตรงลงระบบชีต?`);
    if (!confirmCreate) return;
  }
  
  toggleLoader(true);
  
  const payload = {
    action: "submitWeekly",
    employeeId: empId,
    week: week,
    weight: weight,
    waist: waist,
    hip: hip,
    answers: [] // Admin entry doesn't submit questionnaire answers
  };
  
  if (STATE.apiSettings.isMockMode) {
    // 1. Mock Mode: Save locally
    const existingIdx = STATE.weeklyData.findIndex(d => 
      String(d.EmployeeID).trim() === empId && parseInt(d.Week) === week
    );
    
    const record = {
      EmployeeID: empId,
      Week: week,
      Weight: weight,
      Waist: waist,
      Hip: hip,
      AnswersJson: "[]",
      SubmitDate: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    
    if (existingIdx !== -1) {
      STATE.weeklyData[existingIdx] = record;
    } else {
      STATE.weeklyData.push(record);
    }
    
    saveMockState();
    toggleLoader(false);
    alert(`บันทึกข้อมูลสัดส่วนสัปดาห์ที่ ${week} ของพนักงานรหัส ${empId} สำเร็จ (ระบบจำลอง)`);
    
    // Clear and refresh
    document.getElementById("admin-single-entry-form").reset();
    document.getElementById("admin-single-empname").innerText = "-";
    document.getElementById("admin-single-empdept").innerText = "-";
    renderAdminPanel();
  } else {
    // 2. Google Sheets API Mode
    try {
      const res = await callApiJSONP("submitWeeklyJSONP", payload);
      toggleLoader(false);
      
      if (res.success) {
        alert(res.message || `บันทึกข้อมูลสัดส่วนสัปดาห์ที่ ${week} สำเร็จ`);
        document.getElementById("admin-single-entry-form").reset();
        document.getElementById("admin-single-empname").innerText = "-";
        document.getElementById("admin-single-empdept").innerText = "-";
        await loadData();
        renderAdminPanel();
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch(err) {
      toggleLoader(false);
      alert("การบันทึกข้อมูลล้มเหลว กรุณาตรวจสอบการเชื่อมต่อเครือข่าย");
      console.error(err);
    }
  }
}


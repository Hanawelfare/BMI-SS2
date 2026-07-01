/**
 * google_script.js - Google Apps Script Backend for 90-Day BMI Tracker System
 * 
 * Instructions:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1ARI5modgryZUL5xCdQcfupE-5YCh2F4lkY3z_QxqUys/edit
 * 2. Go to Extensions > Apps Script
 * 3. Delete any code in the editor and paste this code.
 * 4. Click the Save icon (floppy disk).
 * 5. Click "Deploy" (top right) > "New deployment"
 * 6. Select Type: "Web app" (เว็บแอป)
 * 7. Set:
 *    - Description: BMI Tracker API
 *    - Execute as (เรียกใช้งานในฐานะ): "Me" (ฉัน - บัญชีอีเมลของคุณ)
 *    - Who has access (ผู้มีสิทธิ์เข้าถึง): "Anyone" (ทุกคน) *** ห้ามเลือกเป็นอย่างอื่น
 * 8. Click "Deploy". Grant permissions if requested (กด Review Permissions แล้วเลือกบัญชีเพื่ออนุญาต).
 * 9. Copy the "Web app URL" (ที่ลงท้ายด้วย /exec) และนำมาใส่ในหน้าเว็บแอดมินเพื่อเชื่อมต่อ
 */

// Helper function to get Spreadsheet (bound or standalone)
function getSS() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {}
  if (!ss) {
    // Fallback: Open by ID directly if deployed as a standalone script
    ss = SpreadsheetApp.openById("1ARI5modgryZUL5xCdQcfupE-5YCh2F4lkY3z_QxqUys");
  }
  return ss;
}

// Parse employee database from Employee_Master sheet (supports Thai column headers and splits full name)
function getEmployeeMasterData(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var result = [];
  
  // Find column indices based on Thai headers
  var colEmpId = headers.indexOf("รหัสพนักงาน");
  var colFullName = headers.indexOf("ชื่อ-นามสกุล");
  var colDept = headers.indexOf("แผนก");
  var colHeight = headers.indexOf("ส่วนสูง");
  
  // Fallbacks if header names are in English
  if (colEmpId === -1) colEmpId = headers.indexOf("EmployeeID");
  if (colFullName === -1) {
    colFullName = headers.indexOf("FirstName") !== -1 ? headers.indexOf("FirstName") : headers.indexOf("Name");
  }
  if (colDept === -1) colDept = headers.indexOf("Department");
  if (colHeight === -1) colHeight = headers.indexOf("Height");
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var empId = colEmpId !== -1 ? row[colEmpId].toString().replace(/^'/, '').trim() : "";
    if (!empId) continue;
    
    // Preserve leading zeros: pad to 4 digits if numeric and less than 4 digits (e.g. 26 -> 0026)
    if (/^\d+$/.test(empId) && empId.length < 4) {
      empId = empId.padStart(4, '0');
    }
    
    // Split full name into FirstName and LastName
    var fullName = colFullName !== -1 ? row[colFullName].toString().trim() : "";
    var nameParts = fullName.split(/\s+/);
    var firstName = nameParts[0] || "";
    var lastName = nameParts.slice(1).join(" ") || "";
    
    var dept = colDept !== -1 ? row[colDept].toString().trim() : "";
    var height = colHeight !== -1 ? parseFloat(row[colHeight]) : 0;
    
    result.push({
      EmployeeID: empId,
      FirstName: firstName,
      LastName: lastName,
      Department: dept,
      Height: isNaN(height) ? 0 : height
    });
  }
  return result;
}

// Initialize Spreadsheet and Sheets
function initSheets() {
  var ss = getSS();
  if (!ss) return "Error: Spreadsheet not found!";
  
  // 1. Employee_Master Sheet (Pre-existing list)
  var employeeSheet = ss.getSheetByName("Employee_Master");
  if (!employeeSheet) {
    // If they have "Employees" instead, rename or copy. Otherwise make fresh.
    var oldEmployees = ss.getSheetByName("Employees");
    if (oldEmployees) {
      // Just use the existing Employees sheet
      employeeSheet = oldEmployees;
    } else {
      employeeSheet = ss.insertSheet("Employee_Master");
      employeeSheet.appendRow(["รหัสพนักงาน", "ชื่อ-นามสกุล", "แผนก", "ส่วนสูง", "น้ำหนัก", "รอบเอว", "รอบสะโพก"]);
      employeeSheet.appendRow(["'0001", "สมชาย รักดี", "ฝ่ายผลิต", 170, 85, 38, 42]);
      employeeSheet.appendRow(["'0002", "สมหญิง เรียนดี", "ฝ่ายขาย", 162, 68, 32, 38]);
      employeeSheet.appendRow(["'0003", "กิตติ มุ่งมั่น", "ไอที", 175, 95, 40, 44]);
      employeeSheet.appendRow(["'0004", "นภา สว่างไสว", "บัญชี", 155, 60, 30, 36]);
    }
  }
  
  // 2. Registrations Sheet (Registered Employees)
  // Columns: EmployeeID, Password, FirstName, LastName, Department, Height, TargetWeightLoss, RegistrationDate, AssessmentJson
  var regSheet = ss.getSheetByName("Registrations");
  if (!regSheet) {
    regSheet = ss.insertSheet("Registrations");
    regSheet.appendRow(["EmployeeID", "Password", "FirstName", "LastName", "Department", "Phone", "Height", "TargetWeightLoss", "RegistrationDate", "AssessmentJson", "init_life_1", "init_life_2", "init_life_3", "init_life_4", "init_life_5", "init_life_6", "init_life_7", "init_goal_1", "init_goal_2", "init_goal_3", "init_goal_4", "init_goal_5"]);
  } else {
    var regHeaders = regSheet.getRange(1, 1, 1, regSheet.getLastColumn() || 1).getValues()[0];
    if (regHeaders.indexOf("Phone") === -1) {
      regSheet.insertColumnAfter(5);
      regSheet.getRange(1, 6).setValue("Phone");
      // Reload headers after insert
      regHeaders = regSheet.getRange(1, 1, 1, regSheet.getLastColumn() || 1).getValues()[0];
    }
    if (regHeaders.indexOf("init_life_1") === -1) {
      var newRegHeaders = ["init_life_1", "init_life_2", "init_life_3", "init_life_4", "init_life_5", "init_life_6", "init_life_7", "init_goal_1", "init_goal_2", "init_goal_3", "init_goal_4", "init_goal_5"];
      regSheet.getRange(1, regHeaders.length + 1, 1, newRegHeaders.length).setValues([newRegHeaders]);
    }
  }
  
  // 3. WeeklyData Sheet (Submission logs)
  // Columns: EmployeeID, Week, Weight, Waist, Hip, AnswersJson, SubmitDate
  var dataSheet = ss.getSheetByName("WeeklyData");
  if (!dataSheet) {
    dataSheet = ss.insertSheet("WeeklyData");
    dataSheet.appendRow(["EmployeeID", "Week", "Weight", "Waist", "Hip", "AnswersJson", "SubmitDate", "BMI", "BMIDiffPercent"]);
  } else {
    var dataHeaders = dataSheet.getRange(1, 1, 1, dataSheet.getLastColumn() || 1).getValues()[0];
    if (dataHeaders.indexOf("BMI") === -1) {
      var newDataHeaders = ["BMI", "BMIDiffPercent"];
      dataSheet.getRange(1, dataHeaders.length + 1, 1, newDataHeaders.length).setValues([newDataHeaders]);
    }
  }
  
  // 4. Questions Sheet (Dynamic questions for weekly assessment)
  // Columns: QuestionID, QuestionText, Type, Options
  var qSheet = ss.getSheetByName("Questions");
  if (!qSheet) {
    qSheet = ss.insertSheet("Questions");
    qSheet.appendRow(["QuestionID", "QuestionText", "Type", "Options"]);
    // Default Weekly Questions for 90-Day BMI Tracker
    qSheet.appendRow([1, "อาทิตย์นี้ท่านทานโปรตีนได้ครบสัดส่วนตามปริมาณที่ร่างกายควรได้รับ", "boolean", ""]);
    qSheet.appendRow([2, "อาทิตย์นี้ออกกำลังกายให้ได้ 3-5 วันต่อสัปดาห์", "boolean", ""]);
    qSheet.appendRow([3, "อาทิตย์นี้ท่านหลีกเลี่ยงน้ำหวาน ขนมกรุบกรอบ ลดแป้งในมื้ออาหารและอาหารทอด", "boolean", ""]);
    qSheet.appendRow([4, "กินอาหารมื้อเย็นห่างจากเวลานอนไม่น้อยกว่า 3 ชั่วโมง", "boolean", ""]);
  }
  
  // 5. Settings Sheet (General project settings)
  // Columns: Key, Value
  var settingsSheet = ss.getSheetByName("Settings");
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet("Settings");
    settingsSheet.appendRow(["Key", "Value"]);
    settingsSheet.appendRow(["StartDate", "2026-07-01"]);
    settingsSheet.appendRow(["AdminPassword", "ad2026"]);
  }
  
  return "Initialization Complete!";
}

// Helper to format response as JSON with CORS headers
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle GET requests (JSONP support to bypass file:// origin blocks on browsers)
function doGet(e) {
  // Always initialize sheets to ensure they exist
  initSheets();
  
  var ss = getSS();
  var action = e.parameter.action;
  var callback = e.parameter.prefix || e.parameter.callback;
  
  var responseData;
  try {
    if (action === "getAllData") {
      var employeeMasterSheet = ss.getSheetByName("Employee_Master") || ss.getSheetByName("Employees");
      responseData = {
        success: true,
        data: {
          employees: getEmployeeMasterData(employeeMasterSheet),
          registrations: getSheetDataAsObjects(ss.getSheetByName("Registrations")),
          weeklyData: getSheetDataAsObjects(ss.getSheetByName("WeeklyData")),
          questions: getSheetDataAsObjects(ss.getSheetByName("Questions")),
          settings: getSettingsAsObject(ss.getSheetByName("Settings"))
        }
      };
    } else if (action === "registerJSONP") {
      var payload = JSON.parse(decodeURIComponent(e.parameter.payload));
      responseData = handleRegister(ss, payload);
    } else if (action === "updateRegistrationJSONP") {
      var payload = JSON.parse(decodeURIComponent(e.parameter.payload));
      responseData = handleUpdateRegistration(ss, payload);
    } else if (action === "submitWeeklyJSONP") {
      var payload = JSON.parse(decodeURIComponent(e.parameter.payload));
      responseData = handleWeeklySubmit(ss, payload);
    } else if (action === "updateSettingsJSONP") {
      var payload = JSON.parse(decodeURIComponent(e.parameter.payload));
      responseData = handleUpdateSettings(ss, payload);
    } else if (action === "updateQuestionsJSONP") {
      var payload = JSON.parse(decodeURIComponent(e.parameter.payload));
      responseData = handleUpdateQuestions(ss, payload);
    } else if (action === "adminBulkUploadJSONP") {
      var payload = JSON.parse(decodeURIComponent(e.parameter.payload));
      responseData = handleAdminBulkUpload(ss, payload);
    } else {
      responseData = { success: false, error: "Invalid GET Action" };
    }
  } catch (err) {
    responseData = { success: false, error: err.toString() };
  }
  
  // JSONP support
  if (callback) {
    var output = callback + "(" + JSON.stringify(responseData) + ")";
    return ContentService.createTextOutput(output)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // Standard CORS JSON
    return jsonResponse(responseData);
  }
}

// Handle POST requests
function doPost(e) {
  initSheets();
  
  var ss = getSS();
  var postData;
  
  try {
    postData = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ success: false, error: "Invalid JSON format: " + err.toString() });
  }
  
  var action = postData.action;
  var responseData = { success: false, error: "Invalid POST Action" };
  
  if (action === "register") {
    responseData = handleRegister(ss, postData);
  } else if (action === "updateRegistration") {
    responseData = handleUpdateRegistration(ss, postData);
  } else if (action === "submitWeekly") {
    responseData = handleWeeklySubmit(ss, postData);
  } else if (action === "updateSettings") {
    responseData = handleUpdateSettings(ss, postData);
  } else if (action === "updateQuestions") {
    responseData = handleUpdateQuestions(ss, postData);
  } else if (action === "adminBulkUpload") {
    responseData = handleAdminBulkUpload(ss, postData);
  }
  
  return jsonResponse(responseData);
}

// Retrieve Sheet data as JSON Objects
function getSheetDataAsObjects(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      // Format Dates cleanly
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      }
      // Force EmployeeID to remain string
      if (headers[j] === "EmployeeID") {
        val = val.toString().replace(/^'/, ''); // strip leading apostrophe
      }
      obj[headers[j]] = val;
    }
    result.push(obj);
  }
  return result;
}

// Get Settings as key-value Object
function getSettingsAsObject(sheet) {
  if (!sheet) return {};
  var data = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 1; i < data.length; i++) {
    var val = data[i][1];
    if (val instanceof Date) {
      val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }
    settings[data[i][0]] = val;
  }
  return settings;
}

// 1. Handle Employee Registration
function handleRegister(ss, postData) {
  var sheet = ss.getSheetByName("Registrations");
  var empId = postData.employeeId.toString().trim();
  
  // Format Employee ID with leading single quote to force text formatting in Google Sheets
  var formattedEmpId = "'" + empId;
  
  // Check for duplicate registration
  var registrations = getSheetDataAsObjects(sheet);
  for (var i = 0; i < registrations.length; i++) {
    if (registrations[i].EmployeeID === empId) {
      return { success: false, error: "รหัสพนักงานนี้ได้ทำการสมัครเข้าร่วมโครงการแล้ว ไม่สามารถสมัครซ้ำได้" };
    }
  }
  
  // Append new registration
  var assessment = {};
  try {
    assessment = JSON.parse(postData.assessmentJson || "{}");
  } catch(e) {}
  
  // Append new registration with individual question answers
  sheet.appendRow([
    formattedEmpId,
    postData.password,
    postData.firstName,
    postData.lastName,
    postData.department,
    postData.phone || "",
    parseFloat(postData.height),
    parseFloat(postData.targetWeightLoss),
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
    postData.assessmentJson || "[]",
    assessment["init_life_1"] || "",
    assessment["init_life_2"] || "",
    assessment["init_life_3"] || "",
    assessment["init_life_4"] || "",
    assessment["init_life_5"] || "",
    assessment["init_life_6"] || "",
    assessment["init_life_7"] || "",
    assessment["init_goal_1"] || "",
    assessment["init_goal_2"] || "",
    assessment["init_goal_3"] || "",
    assessment["init_goal_4"] || "",
    assessment["init_goal_5"] || ""
  ]);
  
  return { success: true, message: "ลงทะเบียนเข้าร่วมโครงการสำเร็จแล้ว" };
}

// 1.1 Handle Update Registration (For saving final measurement booking choice)
function handleUpdateRegistration(ss, postData) {
  var sheet = ss.getSheetByName("Registrations");
  var empId = postData.employeeId.toString().trim();
  
  var data = getSheetDataAsObjects(sheet);
  for (var i = 0; i < data.length; i++) {
    if (data[i].EmployeeID === empId) {
      // Column 10 is AssessmentJson (index is 10, i.e., column J, so row index + 2, column 10)
      sheet.getRange(i + 2, 10).setValue(postData.assessmentJson);
      return { success: true, message: "อัปเดตข้อมูลการนัดหมายสำเร็จ" };
    }
  }
  return { success: false, error: "ไม่พบรหัสพนักงานในการนัดหมาย" };
}

// 2. Handle Weekly Progress Submission (Weeks 2-12)
function handleWeeklySubmit(ss, postData) {
  var sheet = ss.getSheetByName("WeeklyData");
  var empId = postData.employeeId.toString().trim();
  var week = parseInt(postData.week);
  
  // Verify double submission in same week
  var data = getSheetDataAsObjects(sheet);
  for (var i = 0; i < data.length; i++) {
    if (data[i].EmployeeID === empId && parseInt(data[i].Week) === week) {
      return { success: false, error: "คุณได้ส่งผลของสัปดาห์ที่ " + week + " ไปแล้วในระบบ" };
    }
  }
  
  var formattedEmpId = "'" + empId;
  
  var stats = calculateBmiAndDiff(ss, empId, week, parseFloat(postData.weight));
  
  // Append submission row
  sheet.appendRow([
    formattedEmpId,
    week,
    parseFloat(postData.weight),
    parseFloat(postData.waist),
    parseFloat(postData.hip),
    JSON.stringify(postData.answers), // Save dynamic questions responses as JSON
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
    stats.bmi,
    stats.bmiDiffPercent
  ]);
  
  return { success: true, message: "บันทึกผลสัปดาห์ที่ " + week + " สำเร็จ" };
}

// 3. Handle Settings Update (Start Date, Admin Password)
function handleUpdateSettings(ss, postData) {
  var sheet = ss.getSheetByName("Settings");
  var key = postData.key;
  var value = postData.value;
  
  var data = sheet.getDataRange().getValues();
  var found = false;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow([key, value]);
  }
  
  return { success: true, message: "อัปเดตการตั้งค่าสำเร็จ" };
}

// 4. Handle Weekly Questions Management (Add/Edit/Delete)
function handleUpdateQuestions(ss, postData) {
  var sheet = ss.getSheetByName("Questions");
  
  // Clear all question rows except header
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  // Write updated questions list
  var list = postData.questions;
  for (var i = 0; i < list.length; i++) {
    sheet.appendRow([
      i + 1,
      list[i].text,
      list[i].type || "boolean",
      (list[i].options || []).join(",")
    ]);
  }
  
  return { success: true, message: "อัปเดตแบบประเมินเรียบร้อย" };
}

// 5. Handle Admin Bulk Upload (Excel/Sheets TSV Copy-Paste)
function handleAdminBulkUpload(ss, postData) {
  var sheet = ss.getSheetByName("WeeklyData");
  var rows = postData.rows; // Array of objects: { employeeId, week, weight, waist, hip }
  var week = parseInt(postData.week);
  
  var existingData = getSheetDataAsObjects(sheet);
  var updatedCount = 0;
  var insertedCount = 0;
  
  // Loop through rows to insert or update
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var empId = row.employeeId.toString().trim();
    if (!empId) continue;
    
    var formattedEmpId = "'" + empId;
    var foundIndex = -1;
    
    // Search in existing records
    for (var j = 0; j < existingData.length; j++) {
      if (existingData[j].EmployeeID === empId && parseInt(existingData[j].Week) === week) {
        foundIndex = j;
        break;
      }
    }
    
    var stats = calculateBmiAndDiff(ss, empId, week, parseFloat(row.weight));
    
    if (foundIndex !== -1) {
      // Row to update is at index (foundIndex + 2) in Spreadsheet
      var rowIndex = foundIndex + 2;
      sheet.getRange(rowIndex, 3).setValue(parseFloat(row.weight));
      sheet.getRange(rowIndex, 4).setValue(parseFloat(row.waist));
      sheet.getRange(rowIndex, 5).setValue(parseFloat(row.hip));
      sheet.getRange(rowIndex, 7).setValue(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"));
      sheet.getRange(rowIndex, 8).setValue(stats.bmi);
      sheet.getRange(rowIndex, 9).setValue(stats.bmiDiffPercent);
      updatedCount++;
    } else {
      // Insert new row
      sheet.appendRow([
        formattedEmpId,
        week,
        parseFloat(row.weight),
        parseFloat(row.waist),
        parseFloat(row.hip),
        "[]", // Admin upload doesn't answer questionnaire
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
        stats.bmi,
        stats.bmiDiffPercent
      ]);
      insertedCount++;
    }
  }
  
  return { 
    success: true, 
    message: "นำเข้าข้อมูลสัปดาห์ที่ " + week + " สำเร็จ (เพิ่มใหม่ " + insertedCount + " รายการ, อัปเดต " + updatedCount + " รายการ)" 
  };
}

// Helper to calculate BMI and cumulative % BMI reduction
function calculateBmiAndDiff(ss, empId, week, weight) {
  var height = 170; // default height fallback
  var initialWeight = weight; // default initial weight fallback
  
  // 1. Try to find height in Registrations
  var regSheet = ss.getSheetByName("Registrations");
  if (regSheet) {
    var regs = getSheetDataAsObjects(regSheet);
    var reg = regs.find(function(r) { return String(r.EmployeeID).trim() === empId; });
    if (reg) {
      height = parseFloat(reg.Height) || 170;
    }
  }
  
  // If not found in Registrations, fallback to Employee_Master
  if (height === 170) {
    var masterSheet = ss.getSheetByName("Employee_Master") || ss.getSheetByName("Employees");
    if (masterSheet) {
      var masters = getEmployeeMasterData(masterSheet);
      var master = masters.find(function(m) { return String(m.EmployeeID).trim() === empId; });
      if (master) {
        height = parseFloat(master.Height) || 170;
      }
    }
  }
  
  // 2. Find Week 1 weight to compute % BMI reduction
  var weeklyDataSheet = ss.getSheetByName("WeeklyData");
  if (weeklyDataSheet) {
    var weeklyRows = getSheetDataAsObjects(weeklyDataSheet);
    var week1Record = weeklyRows.find(function(w) {
      return String(w.EmployeeID).trim() === empId && parseInt(w.Week) === 1;
    });
    if (week1Record) {
      initialWeight = parseFloat(week1Record.Weight) || weight;
    }
  }
  
  // Calculate absolute BMI
  var bmi = weight / Math.pow(height / 100, 2);
  
  // Calculate % BMI reduction (mathematically identical to % weight reduction)
  var bmiDiffPercent = 0.0;
  if (initialWeight > 0) {
    bmiDiffPercent = ((initialWeight - weight) / initialWeight) * 100;
  }
  
  return {
    bmi: parseFloat(bmi.toFixed(2)),
    bmiDiffPercent: parseFloat(bmiDiffPercent.toFixed(2))
  };
}

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
    
    // Preserve leading zeros: pad to 6 digits if numeric and less than 6 digits (e.g. 26 -> 000026)
    if (/^\d+$/.test(empId) && empId.length < 6) {
      empId = empId.padStart(6, '0');
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
    regSheet.appendRow(["EmployeeID", "Password", "FirstName", "LastName", "Department", "Phone", "Height", "TargetWeightLoss", "RegistrationDate", "AssessmentJson", "init_shift", "first_measure_date", "final_measure_date", "init_location", "init_life_1", "init_life_2", "init_life_3", "init_life_4", "init_life_5", "init_life_6", "init_life_7", "init_goal_1", "init_goal_2", "init_goal_3", "init_goal_4", "init_goal_5"]);
  } else {
    var regHeaders = regSheet.getRange(1, 1, 1, regSheet.getLastColumn() || 1).getValues()[0];
    
    // Auto-repair shifted headers (where AssessmentJson is missing but init_life_1 is column 10/J)
    var colInitLife1Index = regHeaders.indexOf("init_life_1");
    if (regHeaders.indexOf("AssessmentJson") === -1 && colInitLife1Index !== -1) {
      // 1. Rename column J to AssessmentJson
      regSheet.getRange(1, colInitLife1Index + 1).setValue("AssessmentJson");
      
      // 2. Insert new appointment columns after AssessmentJson
      regSheet.insertColumnsAfter(colInitLife1Index + 1, 4);
      regSheet.getRange(1, colInitLife1Index + 2).setValue("init_shift");
      regSheet.getRange(1, colInitLife1Index + 3).setValue("first_measure_date");
      regSheet.getRange(1, colInitLife1Index + 4).setValue("final_measure_date");
      regSheet.getRange(1, colInitLife1Index + 5).setValue("init_location");
      
      // 3. Insert init_life_1 column after init_location
      regSheet.insertColumnAfter(colInitLife1Index + 5);
      regSheet.getRange(1, colInitLife1Index + 6).setValue("init_life_1");
      
      // Reload headers
      regHeaders = regSheet.getRange(1, 1, 1, regSheet.getLastColumn() || 1).getValues()[0];
      
      // 4. Update the existing rows: parse JSON and write to separate columns
      var lastRow = regSheet.getLastRow();
      if (lastRow >= 2) {
        var jsonValues = regSheet.getRange(2, colInitLife1Index + 1, lastRow - 1, 1).getValues();
        for (var r = 0; r < jsonValues.length; r++) {
          var rowIndex = r + 2;
          var jsonStr = jsonValues[r][0].toString();
          var assessment = {};
          try {
            assessment = JSON.parse(jsonStr || "{}");
          } catch(e) {}
          
          if (assessment.init_shift) regSheet.getRange(rowIndex, colInitLife1Index + 2).setValue(assessment.init_shift);
          if (assessment.first_measure_date) regSheet.getRange(rowIndex, colInitLife1Index + 3).setValue(assessment.first_measure_date);
          if (assessment.final_measure_date) regSheet.getRange(rowIndex, colInitLife1Index + 4).setValue(assessment.final_measure_date);
          if (assessment.init_location) regSheet.getRange(rowIndex, colInitLife1Index + 5).setValue(assessment.init_location);
          if (assessment.init_life_1) regSheet.getRange(rowIndex, colInitLife1Index + 6).setValue(assessment.init_life_1);
        }
      }
    }

    if (regHeaders.indexOf("Phone") === -1) {
      regSheet.insertColumnAfter(5);
      regSheet.getRange(1, 6).setValue("Phone");
      // Reload headers after insert
      regHeaders = regSheet.getRange(1, 1, 1, regSheet.getLastColumn() || 1).getValues()[0];
    }
    
    // Add new appointment columns
    if (regHeaders.indexOf("init_shift") === -1) {
      var idx = regHeaders.indexOf("AssessmentJson");
      if (idx !== -1) {
        regSheet.insertColumnAfter(idx + 1);
        regSheet.getRange(1, idx + 2).setValue("init_shift");
        regHeaders = regSheet.getRange(1, 1, 1, regSheet.getLastColumn() || 1).getValues()[0];
      }
    }
    if (regHeaders.indexOf("first_measure_date") === -1) {
      var idx = regHeaders.indexOf("init_shift");
      if (idx !== -1) {
        regSheet.insertColumnAfter(idx + 1);
        regSheet.getRange(1, idx + 2).setValue("first_measure_date");
        regHeaders = regSheet.getRange(1, 1, 1, regSheet.getLastColumn() || 1).getValues()[0];
      }
    }
    if (regHeaders.indexOf("final_measure_date") === -1) {
      var idx = regHeaders.indexOf("first_measure_date");
      if (idx !== -1) {
        regSheet.insertColumnAfter(idx + 1);
        regSheet.getRange(1, idx + 2).setValue("final_measure_date");
        regHeaders = regSheet.getRange(1, 1, 1, regSheet.getLastColumn() || 1).getValues()[0];
      }
    }
    if (regHeaders.indexOf("init_location") === -1) {
      var idx = regHeaders.indexOf("final_measure_date");
      if (idx !== -1) {
        regSheet.insertColumnAfter(idx + 1);
        regSheet.getRange(1, idx + 2).setValue("init_location");
        regHeaders = regSheet.getRange(1, 1, 1, regSheet.getLastColumn() || 1).getValues()[0];
      }
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
    settingsSheet.appendRow(["LocationTextLPN1", "LPN1 ณ ห้อง Old lobby Plant2 เวลา 9.00 - 11.30 น."]);
    settingsSheet.appendRow(["LocationTextLPN2", "LPN2 ณ ห้อง Locker ชั้น 2 เวลา 13.30 - 15.30 น."]);
    settingsSheet.appendRow(["MeasureStartA_LPN1", "2026-07-09"]);
    settingsSheet.appendRow(["MeasureStartA_LPN2", "2026-07-09"]);
    settingsSheet.appendRow(["MeasureStartB_LPN1", "2026-07-13"]);
    settingsSheet.appendRow(["MeasureStartB_LPN2", "2026-07-13"]);
    settingsSheet.appendRow(["MeasureEndA_LPN1", ""]);
    settingsSheet.appendRow(["MeasureEndA_LPN2", ""]);
    settingsSheet.appendRow(["MeasureEndB_LPN1", ""]);
    settingsSheet.appendRow(["MeasureEndB_LPN2", ""]);
  } else {
    var sData = settingsSheet.getDataRange().getValues();
    var existingKeys = sData.map(function(row) { return row[0].toString().trim(); });
    if (existingKeys.indexOf("LocationTextLPN1") === -1) {
      settingsSheet.appendRow(["LocationTextLPN1", "LPN1 ณ ห้อง Old lobby Plant2 เวลา 9.00 - 11.30 น."]);
    }
    if (existingKeys.indexOf("LocationTextLPN2") === -1) {
      settingsSheet.appendRow(["LocationTextLPN2", "LPN2 ณ ห้อง Locker ชั้น 2 เวลา 13.30 - 15.30 น."]);
    }
    if (existingKeys.indexOf("MeasureStartA_LPN1") === -1) settingsSheet.appendRow(["MeasureStartA_LPN1", "2026-07-09"]);
    if (existingKeys.indexOf("MeasureStartA_LPN2") === -1) settingsSheet.appendRow(["MeasureStartA_LPN2", "2026-07-09"]);
    if (existingKeys.indexOf("MeasureStartB_LPN1") === -1) settingsSheet.appendRow(["MeasureStartB_LPN1", "2026-07-13"]);
    if (existingKeys.indexOf("MeasureStartB_LPN2") === -1) settingsSheet.appendRow(["MeasureStartB_LPN2", "2026-07-13"]);
    if (existingKeys.indexOf("MeasureEndA_LPN1") === -1) settingsSheet.appendRow(["MeasureEndA_LPN1", ""]);
    if (existingKeys.indexOf("MeasureEndA_LPN2") === -1) settingsSheet.appendRow(["MeasureEndA_LPN2", ""]);
    if (existingKeys.indexOf("MeasureEndB_LPN1") === -1) settingsSheet.appendRow(["MeasureEndB_LPN1", ""]);
    if (existingKeys.indexOf("MeasureEndB_LPN2") === -1) settingsSheet.appendRow(["MeasureEndB_LPN2", ""]);
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
  var ss = getSS();
  // Lazy initialize sheets ONLY if a core sheet is missing to optimize speed by 2-3x
  if (ss && (!ss.getSheetByName("Registrations") || !ss.getSheetByName("WeeklyData"))) {
    initSheets();
  }
  
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
  var ss = getSS();
  // Lazy initialize sheets ONLY if a core sheet is missing to optimize speed by 2-3x
  if (ss && (!ss.getSheetByName("Registrations") || !ss.getSheetByName("WeeklyData"))) {
    initSheets();
  }
  
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
      // Force EmployeeID to remain string and standardize to 6-digit padding
      if (headers[j] === "EmployeeID") {
        var s = val.toString().trim().replace(/^'/, '');
        if (/^\d+$/.test(s) && s.length < 6) {
          s = s.padStart(6, '0');
        }
        val = s;
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
  
  var assessment = {};
  try {
    assessment = JSON.parse(postData.assessmentJson || "{}");
  } catch(e) {}
  
  // Get all headers to map columns dynamically
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = new Array(headers.length);
  
  // Map fields to headers
  var fieldMap = {
    "EmployeeID": "'" + formattedEmpId,
    "Password": postData.password,
    "FirstName": postData.firstName,
    "LastName": postData.lastName,
    "Department": postData.department,
    "Phone": postData.phone || "",
    "Height": parseFloat(postData.height),
    "TargetWeightLoss": parseFloat(postData.targetWeightLoss),
    "RegistrationDate": Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
    "AssessmentJson": postData.assessmentJson || "{}",
    "init_shift": assessment.init_shift || "",
    "first_measure_date": assessment.first_measure_date || "",
    "final_measure_date": assessment.final_measure_date || ""
  };
  
  // Map init survey questions
  for (var k in assessment) {
    if (k.indexOf("init_") === 0) {
      fieldMap[k] = assessment[k];
    }
  }
  
  // Populate row based on headers
  for (var j = 0; j < headers.length; j++) {
    var header = headers[j];
    newRow[j] = fieldMap[header] !== undefined ? fieldMap[header] : "";
  }
  
  sheet.appendRow(newRow);
  
  return { success: true, message: "ลงทะเบียนเข้าร่วมโครงการสำเร็จแล้ว" };
}

function handleUpdateRegistration(ss, postData) {
  var sheet = ss.getSheetByName("Registrations");
  var empId = postData.employeeId.toString().trim();
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colAssessment = headers.indexOf("AssessmentJson") + 1;
  var colFirstMeasure = headers.indexOf("first_measure_date") + 1;
  var colFinalMeasure = headers.indexOf("final_measure_date") + 1;
  var colInitShift = headers.indexOf("init_shift") + 1;
  var colInitLocation = headers.indexOf("init_location") + 1;
  
  var assessment = {};
  try {
    assessment = JSON.parse(postData.assessmentJson || "{}");
  } catch(e) {}
  
  var data = getSheetDataAsObjects(sheet);
  for (var i = 0; i < data.length; i++) {
    if (data[i].EmployeeID === empId) {
      var rowIndex = i + 2;
      if (colAssessment > 0) {
        sheet.getRange(rowIndex, colAssessment).setValue(postData.assessmentJson);
      }
      if (colFirstMeasure > 0 && assessment.first_measure_date) {
        sheet.getRange(rowIndex, colFirstMeasure).setValue(assessment.first_measure_date);
      }
      if (colFinalMeasure > 0) {
        sheet.getRange(rowIndex, colFinalMeasure).setValue(assessment.final_measure_date || "");
      }
      if (colInitShift > 0 && assessment.init_shift) {
        sheet.getRange(rowIndex, colInitShift).setValue(assessment.init_shift);
      }
      if (colInitLocation > 0 && assessment.init_location) {
        sheet.getRange(rowIndex, colInitLocation).setValue(assessment.init_location);
      }
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
  
  // Recalculate history for this employee to keep out-of-order records synced
  recalculateEmployeeBmiHistory(ss, empId);
  
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
  
  var uniqueEmpIds = {};
  
  // Loop through rows to insert or update
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var empId = row.employeeId.toString().trim();
    if (!empId) continue;
    
    uniqueEmpIds[empId] = true;
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
  
  // Recalculate BMI history for all uploaded employees
  for (var empId in uniqueEmpIds) {
    recalculateEmployeeBmiHistory(ss, empId);
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

// Add custom menu to Google Sheets for Admin conveniences
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("📊 ระบบ BMI 90 วัน")
    .addItem("🔄 คำนวณ BMI และ % ลดลงของทุกคนใหม่", "recalculateAllBmiHistory")
    .addToUi();
}

// Recalculate BMI and % BMI Diff for all weeks of a specific employee to keep out-of-order records synced
function recalculateEmployeeBmiHistory(ss, empId) {
  var sheet = ss.getSheetByName("WeeklyData");
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  var headers = data[0];
  var colEmpId = headers.indexOf("EmployeeID");
  var colWeek = headers.indexOf("Week");
  var colWeight = headers.indexOf("Weight");
  var colBmi = headers.indexOf("BMI");
  var colBmiDiff = headers.indexOf("BMIDiffPercent");
  
  if (colEmpId === -1 || colWeight === -1) return;
  
  // 1. Get height for the employee
  var height = 170; // fallback
  var regSheet = ss.getSheetByName("Registrations");
  if (regSheet) {
    var regs = getSheetDataAsObjects(regSheet);
    var reg = regs.find(function(r) { return String(r.EmployeeID).trim() === empId; });
    if (reg) {
      height = parseFloat(reg.Height) || 170;
    }
  }
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
  
  // 2. Find Week 1 weight for this employee
  var initialWeight = 0;
  for (var i = 1; i < data.length; i++) {
    var rowEmpId = data[i][colEmpId].toString().replace(/^'/, '').trim();
    var rowWeek = parseInt(data[i][colWeek]);
    if (rowEmpId === empId && rowWeek === 1) {
      initialWeight = parseFloat(data[i][colWeight]);
      break;
    }
  }
  
  // 3. Loop and update cells
  for (var i = 1; i < data.length; i++) {
    var rowEmpId = data[i][colEmpId].toString().replace(/^'/, '').trim();
    if (rowEmpId === empId) {
      var weight = parseFloat(data[i][colWeight]);
      if (isNaN(weight) || weight <= 0) continue;
      
      var bmi = weight / Math.pow(height / 100, 2);
      var bmiDiffPercent = 0.0;
      
      if (initialWeight > 0) {
        bmiDiffPercent = ((initialWeight - weight) / initialWeight) * 100;
      }
      
      var rowIndex = i + 1; // 1-based index in sheet
      if (colBmi !== -1) {
        sheet.getRange(rowIndex, colBmi + 1).setValue(parseFloat(bmi.toFixed(2)));
      }
      if (colBmiDiff !== -1) {
        sheet.getRange(rowIndex, colBmiDiff + 1).setValue(parseFloat(bmiDiffPercent.toFixed(2)));
      }
    }
  }
}

// Recalculate BMI and % BMI Diff for all rows in WeeklyData (for all employees)
function recalculateAllBmiHistory() {
  var ss = getSS();
  var sheet = ss.getSheetByName("WeeklyData");
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  var headers = data[0];
  var colEmpId = headers.indexOf("EmployeeID");
  var colWeek = headers.indexOf("Week");
  var colWeight = headers.indexOf("Weight");
  var colBmi = headers.indexOf("BMI");
  var colBmiDiff = headers.indexOf("BMIDiffPercent");
  var colSubmitDate = headers.indexOf("SubmitDate");
  
  if (colEmpId === -1 || colWeight === -1) return;
  
  // 1. Load heights from Registrations and Employee_Master
  var heightMap = {};
  var regSheet = ss.getSheetByName("Registrations");
  if (regSheet) {
    var regs = getSheetDataAsObjects(regSheet);
    regs.forEach(function(r) {
      heightMap[String(r.EmployeeID).trim()] = parseFloat(r.Height) || 170;
    });
  }
  var masterSheet = ss.getSheetByName("Employee_Master") || ss.getSheetByName("Employees");
  if (masterSheet) {
    var masters = getEmployeeMasterData(masterSheet);
    masters.forEach(function(m) {
      var id = String(m.EmployeeID).trim();
      if (!heightMap[id]) {
        heightMap[id] = parseFloat(m.Height) || 170;
      }
    });
  }
  
  // 2. Find Week 1 weight for each employee
  var initialWeightMap = {};
  for (var i = 1; i < data.length; i++) {
    var empId = data[i][colEmpId].toString().replace(/^'/, '').trim();
    var week = parseInt(data[i][colWeek]);
    if (week === 1) {
      initialWeightMap[empId] = parseFloat(data[i][colWeight]);
    }
  }
  
  // 3. Recalculate and update
  for (var i = 1; i < data.length; i++) {
    var empId = data[i][colEmpId].toString().replace(/^'/, '').trim();
    var week = parseInt(data[i][colWeek]);
    var weight = parseFloat(data[i][colWeight]);
    
    if (isNaN(weight) || weight <= 0) continue;
    
    var height = heightMap[empId] || 170;
    var bmi = weight / Math.pow(height / 100, 2);
    
    var initialWeight = initialWeightMap[empId];
    var bmiDiffPercent = 0.0;
    if (initialWeight > 0) {
      bmiDiffPercent = ((initialWeight - weight) / initialWeight) * 100;
    }
    
    var rowIndex = i + 1;
    if (colBmi !== -1) {
      sheet.getRange(rowIndex, colBmi + 1).setValue(parseFloat(bmi.toFixed(2)));
    }
    if (colBmiDiff !== -1) {
      sheet.getRange(rowIndex, colBmiDiff + 1).setValue(parseFloat(bmiDiffPercent.toFixed(2)));
    }
    // Also, if SubmitDate is empty, write current date formatted to help clean manually entered rows
    if (colSubmitDate !== -1 && !data[i][colSubmitDate]) {
      sheet.getRange(rowIndex, colSubmitDate + 1).setValue(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"));
    }
  }
  
  try {
    SpreadsheetApp.getUi().alert("คำนวณและอัปเดตข้อมูล BMI และ % ลดลงของทุกคนเรียบร้อยแล้วค่ะ!");
  } catch(e) {}
}

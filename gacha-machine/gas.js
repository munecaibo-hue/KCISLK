function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var className = params.className;
    var action = params.action; // "reset" 或者是一般抽籤

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = className || "未分班";
    var sheet = ss.getSheetByName(sheetName);

    if (action === "reset") {
      if (sheet) {
        // 清除除了標題列以外的所有資料
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "已重置 " + className + " 班級的資料"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var seatNumber = params.seatNumber;
    var studentName = params.studentName;
    var color = params.color;

    // 如果工作表不存在，建立並加入標題
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["班級", "座號", "姓名", "情緒角色顏色", "組別"]);
    } else {
      // 確保第一列有抬頭 (防呆)
      var firstCell = sheet.getRange("A1").getValue();
      if (firstCell !== "班級") {
        sheet.insertRowBefore(1);
        sheet.getRange("A1:E1").setValues([["班級", "座號", "姓名", "情緒角色顏色", "組別"]]);
      }
    }

    // 請在這裡設定各班的總人數，用於判斷分3隊或4隊
    var classSizes = {
      "701": 30, "702": 30, "703": 30, "704": 30,
      "7A": 28, "7B": 28, "7C": 28, "7D": 28, "7E": 28, "7F": 28
    };

    var totalStudents = classSizes[className] || 30; // 找不到預設為 30
    var numberOfTeams = totalStudents <= 28 ? 3 : 4;

    // 取得目前工作表的所有資料
    var data = sheet.getDataRange().getValues();

    // 統計該班級目前各組的人數與各組中該顏色的數量
    var teamStats = {};
    for (var i = 1; i <= numberOfTeams; i++) {
      teamStats[i] = { total: 0, colorCount: 0 };
    }

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowColor = String(row[3]);
      var rowTeam = parseInt(row[4], 10);

      // 不需要再判斷 rowClass === className，因為這整張表就是這個班級的
      if (teamStats[rowTeam]) {
        teamStats[rowTeam].total += 1;
        if (rowColor === String(color)) {
          teamStats[rowTeam].colorCount += 1;
        }
      }
    }

    // 尋找最適合的組別 (異質性分組邏輯)
    var bestTeam = 1;
    var minColorCount = Infinity;
    var minTotal = Infinity;

    for (var i = 1; i <= numberOfTeams; i++) {
      if (teamStats[i].colorCount < minColorCount) {
        minColorCount = teamStats[i].colorCount;
        minTotal = teamStats[i].total;
        bestTeam = i;
      } else if (teamStats[i].colorCount === minColorCount) {
        if (teamStats[i].total < minTotal) {
          minTotal = teamStats[i].total;
          bestTeam = i;
        }
      }
    }

    // 寫入資料
    sheet.appendRow([className, seatNumber, studentName, color, bestTeam]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      team: bestTeam
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 提供前端讀取特定班級分組狀況的 API
function doGet(e) {
  try {
    var className = e.parameter.className;
    if (!className) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Missing className parameter"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var sheetName = className;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    // 如果工作表不存在，回傳空陣列
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    var result = [];

    // data[0] 是標題列 ["班級", "座號", "姓名", "情緒角色顏色", "組別"]
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      result.push({
        seatNumber: row[1],
        studentName: row[2],
        color: row[3],
        team: parseInt(row[4], 10)
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: result
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

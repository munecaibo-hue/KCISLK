function processRequest(params) {
  var className = params.className;
  var action = params.action;

  var callback = params.callback;
  function outputResult(obj) {
    var jsonStr = JSON.stringify(obj);
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + jsonStr + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(jsonStr)
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (!className) {
    return outputResult({
      status: "error",
      message: "Missing className parameter"
    });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = className;
  var sheet = ss.getSheetByName(sheetName);

  if (action === "reset") {
    if (sheet) {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
      }
    }
    return outputResult({
      status: "success",
      message: "已重置 " + className + " 班級的資料"
    });
  }

  if (action === "draw") {
    var seatNumber = params.seatNumber;
    var studentName = params.studentName;
    var color = params.color;

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["班級", "座號", "姓名", "情緒角色顏色", "組別"]);
    } else {
      var firstCell = sheet.getRange("A1").getValue();
      if (firstCell !== "班級") {
        sheet.insertRowBefore(1);
        sheet.getRange("A1:E1").setValues([["班級", "座號", "姓名", "情緒角色顏色", "組別"]]);
      }
    }

    var classSizes = {
      "701": 30, "702": 30, "703": 30, "704": 30,
      "7A": 28, "7B": 28, "7C": 28, "7D": 28, "7E": 28, "7F": 28
    };

    var totalStudents = classSizes[className] || 30;
    var numberOfTeams = totalStudents <= 28 ? 3 : 4;

    var data = sheet.getDataRange().getValues();

    var teamStats = {};
    for (var i = 1; i <= numberOfTeams; i++) {
      teamStats[i] = { total: 0, colorCount: 0 };
    }

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowColor = String(row[3]);
      var rowTeam = parseInt(row[4], 10);

      if (teamStats[rowTeam]) {
        teamStats[rowTeam].total += 1;
        if (rowColor === String(color)) {
          teamStats[rowTeam].colorCount += 1;
        }
      }
    }

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

    sheet.appendRow([className, seatNumber, studentName, color, bestTeam]);

    return outputResult({
      status: "success",
      team: bestTeam
    });
  }

  if (!sheet) {
    return outputResult({
      status: "success",
      data: []
    });
  }

  var data = sheet.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    result.push({
      seatNumber: row[1],
      studentName: row[2],
      color: row[3],
      team: parseInt(row[4], 10)
    });
  }

  return outputResult({
    status: "success",
    data: result
  });
}

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    return processRequest(params);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    return processRequest(e.parameter);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

var token = ""; // 1. Telegram API KEY
var telegramUrl = "https://api.telegram.org/bot" + token; // 2. Telegram URL for setting up Telegram Bot
var webAppUrl = ""; // 2. FILL IN YOUR GOOGLE WEB APP ADDRESS you only get it after Google WEB app is deployed
var ssId = "";      // 3. FILL IN THE ID OF YOUR GOOGLE SPREADSHEET
var adminID = "";   // 4. Fill in your own Telegram ID for debugging - Telegram -> userinfobot

// Function to get chat info - debug
function getMe() {
  var url = telegramUrl + "/getMe";
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

// Function to set Telegram Webhook
function setWebhook() {
  var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

// Function to trigger prompt to give script permissions to edit sheets
function sheetPermisions() {
  var sheet = SpreadsheetApp.openById(ssId)
}

// Function to send text message to telegram
function sendText(id,text) {
  var url = telegramUrl + "/sendMessage?chat_id=" + id + "&text=" + encodeURIComponent(text);
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

// Function to send google drive image to chat
function sendImage(id,imgId){
  var directDownloadUrl = "https://drive.google.com/uc?id=" + imgId + "&export=download";
  Logger.log(directDownloadUrl)
  var url = telegramUrl + "/sendPhoto?chat_id=" + id + "&photo=" + encodeURIComponent(directDownloadUrl);
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

// Function to concentrate two arrays into string for monthly statistic
function concatenateArraysAsColumns(arr1, arr2) {
  var result = "";
  var maxLength = Math.max(arr1.length, arr2.length);

  for (var i = 0; i < maxLength; i++) {
    var value1 = arr1[i] || ""; // If value doesn't exist in arr1, use an empty string
    var value2 = parseFloat(arr2[i].toFixed(2)) || ""; // If value doesn't exist in arr2, use an empty string, round floats to two decimals
    result += value1 + "\t" + value2 + "\n"; // Separate values by a tab and add a newline character at the end
  }

  return result;
}

// Function to send Monthly statistic to chat - Graph + Text
function sendChartToTelegram(chatId) {
  var date = new Date()
  var currentYear = date.getFullYear();
  var currentMonth = date.getMonth() + 1;
  var currentMonthString = Utilities.formatDate(date, Session.getScriptTimeZone(), "MMMM");
  var sheetName = currentYear.toString();
  var sheet = SpreadsheetApp.openById(ssId).getSheetByName(sheetName);

  if (!sheet) {
    Logger.log("Sheet for the current year not found: " + sheetName);
    sendText(chatId, "Sheet for the current year not found: " + sheetName);
    return;
  }

  var range = sheet.getRange('B20:R32');
  var headersArray = range.getValues()[0];
  var valuesArray = range.getValues()[currentMonth];

  // Create a new data table
  var dataTable = Charts.newDataTable()
      .addColumn(Charts.ColumnType.STRING, "Category")
      .addColumn(Charts.ColumnType.NUMBER, "Amount");

  // Add rows to the data table
  for (var i = 0; i < headersArray.length; i++) {
    dataTable.addRow([headersArray[i], valuesArray[i]]);
  }

  var pieChart = Charts.newPieChart()
    .setTitle("Expenses for " + currentMonthString)
    .setOption('pieSliceText', 'value') // This sets the text to be the value of each slice
    .setDimensions(600, 600)
    .setDataTable(dataTable)
    .build();

  var imageBlob = pieChart.getAs('image/png').setName(currentMonth + "_Expenses.png");
  // Save the image to Google Drive
  var folder = DriveApp.getFolderById("19hRmBuBmYCxPCYxHoyH-0ZPT5kjJ5ZKs"); // Replace with your folder ID
  var fileName = currentMonth + "_Expenses.png";
  var file = folder.createFile(imageBlob).setName(fileName);
  var imgId= file.getId();
  var monthlyData = concatenateArraysAsColumns(headersArray, valuesArray);
  Logger.log(monthlyData)
  sendText(chatId,monthlyData.toString());
  sendImage(chatId,imgId);
}

// Function to get Expense categories for categories help
function getExpenseCategoriesFromSheet() {
  // Get the spreadsheet by ID
  var ss = SpreadsheetApp.openById(ssId);
  
  // Get the sheet by name
  var sheet = ss.getSheetByName("Categories");
  
  // Get the range H37:H49
  var expenseRange = sheet.getRange("A2:A17");
  
  // Get the values in the range
  var values = expenseRange.getValues();

  // Filter out empty cells
  var nonEmptyValues = values.filter(function(row) {
    return row[0] !== ""; // Assuming you want to filter based on the first column in the range
  });
  
  // Initialize an empty string to store the formatted values
  var formattedValues = "";
  
  // Loop through the non-empty values and concatenate them with a hyphen and newline
  for (var i = 0; i < nonEmptyValues.length; i++) {
    formattedValues += "- " + nonEmptyValues[i][0] + "\n";
  }
  Logger.log(formattedValues)
  return formattedValues;
}

// Function to get Income categories for categories help
function getIncomeCategoriesFromSheet() {
  // Get the spreadsheet by ID
  var ss = SpreadsheetApp.openById(ssId);
  
  // Get the sheet by name
  var sheet = ss.getSheetByName("Categories");
  
  // Get the range B2:B11
  var incomeRange = sheet.getRange("B2:B11");
  
  // Get the values in the range
  var values = incomeRange.getValues();
  
  // Filter out empty cells
  var nonEmptyValues = values.filter(function(row) {
    return row[0] !== ""; // Assuming you want to filter based on the first column in the range
  });
  
  // Initialize an empty string to store the formatted values
  var formattedValues = "";
  
  // Loop through the non-empty values and concatenate them with a hyphen and newline
  for (var i = 0; i < nonEmptyValues.length; i++) {
    formattedValues += "- " + nonEmptyValues[i][0] + "\n";
  }
  Logger.log(formattedValues)
  return formattedValues;
}

// Function that prints Monthly repeat data to chat
function fetchRepeatData() {
  var sheetName = "repeatData";
  var sheet = SpreadsheetApp.openById(ssId).getSheetByName(sheetName);
  
  // Get the last row and column with data
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  // Define the start column and number of columns to select
  var startCol = 3; // Column C
  var numCols = 4;  // Columns C, D, E, F
  
  // Get the data range
  var range = sheet.getRange(1, startCol, lastRow, numCols);
  
  // Get the values from the range
  var data = range.getValues();
  
  // Initialize an empty string to store TSV data
  var tsvData = "";
  
  // Loop through each row
  for (var i = 0; i < data.length; i++) {
    // Loop through each column in the row
    for (var j = 0; j < data[i].length; j++) {
      // Check if the cell is not empty
      if (data[i][j] !== "") {
        // Append the value to the TSV data string
        tsvData += data[i][j];
      }
      // Add a tab character if it's not the last column
      if (j < data[i].length - 1) {
        tsvData += "\t";
      }
    }
    // Add a new line character if it's not the last row
    if (i < data.length - 1) {
      tsvData += "\n";
    }
  }
  
  // Log the TSV data
  Logger.log(tsvData);
  return tsvData
}


// Function that copies monthly reoccuring expenses from repeatData spreadsheet to WebHookData
function logRepeatData() {
  // Open the spreadsheet and get the sheets
  var spreadsheet = SpreadsheetApp.openById(ssId);
  var repeatDataSheet = spreadsheet.getSheetByName("repeatData");
  var webHookDataSheet = spreadsheet.getSheetByName("WebHookData");

  // Get today's date
  var today = new Date();
  var dayOfMonth = today.getDate();
  var todayString = Utilities.formatDate(today, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");

  // Get all the data from Repeatdata sheet
  var repeatDataRange = repeatDataSheet.getDataRange();
  var repeatDataValues = repeatDataRange.getValues();

  // Find the data rows that need to be logged
  var dataToLog = [];
  for (var i = 1; i < repeatDataValues.length; i++) {
    var row = repeatDataValues[i];
    var loggingDay = row[6]; // assuming "dayOfLogging" is the 7th column (index 6)

    // If the "dayOfLogging" matches today's date
    if (loggingDay == dayOfMonth) {
      // Modify the row to change the date in the first column
      var newRow = row.slice(0, 6); // Copy columns A to F
      newRow[0] = todayString; // Update the date in the first column
      dataToLog.push(newRow);
    }
  }

  // If there are rows to log
  if (dataToLog.length > 0) {
    // Append data to WebHookData sheet
    webHookDataSheet.getRange(webHookDataSheet.getLastRow() + 1, 1, dataToLog.length, dataToLog[0].length).setValues(dataToLog);
  }

}

// Function that handles input and points to correct handler
function doPost(e) {
  try {
    // Parse incoming data
    var data = JSON.parse(e.postData.contents);
    var text = data.message.text.trim();
    var id = data.message.chat.id;
    var name = data.message.chat.first_name + " " + data.message.chat.last_name;
    
    // Define regex patterns
    var patterns = {
      help: /\bhelp\b/i,
      categories: /\bcategories\b/i,
      report: /\breport\b/i,
      listRepeat: /\blist\s+repeat\b/i,
      expense: /^(\w+)\s+(\d+(?:\.\d+)?)(?:\s+(.*))?$/,
      income: /^in\s+(\w+)\s+(\d+(?:\.\d+)?)(?:\s+(.*))?$/i,
      repeatIn: /^repeat\s+in\s+(\w+)\s+(\d+(?:\.\d+)?)(?:\s+(\d{1,2}))?\s*(.*)?$/i,
      repeatEx: /^repeat\s+(\w+)\s+(\d+(?:\.\d+)?)(?:\s+(\d{1,2}))?\s*(.*)?$/i

    };

    // Define command handlers
    var handlers = {
      help: handleHelp,
      categories: handleCategories,
      report: handleReport,
      listRepeat: handleListRepeat,
      expense: handleExpense,
      income: handleIncome,
      repeatIn: handleRepeatIncome,
      repeatEx: handleRepeatExpense
    };

    // Match and handle command
    for (var key in patterns) {
      var match = patterns[key].exec(text);
      if (match) {
        handlers[key](id, name, match);
        return;
      }
    }

    // If no match, send error
    sendText(id, "Wrong Format, write\"help\" if you need help ;)");

  } catch (e) {
    sendText(adminID, JSON.stringify(e, null, 4));
  }
}

// Command handler functions
function handleHelp(id) {
  var answer = `Options:\n\n - help\n - categories\n - report\n - list repeat (List repeat monthly incomes/expenses)\n\nEnter expense in form:\n\nCATEGORY X.XX COMMENT\nFood 5.5 Jurman\n\nFor income just add "in" phrase e.g\n\nIN CATEGORY X.XX COMMENT\nIN Salary 500 Company\n\nFor entering monthly repeat expenses (DAY is day of the month expense will be logged):\n\nREPEAT (in) CATEGORY X.XX DAY COMMENT\nREPEAT in salary 1000 15 company `;
  sendText(id, answer);
}

function handleCategories(id) {
  var expenseCategories = getExpenseCategoriesFromSheet();
  var incomeCategories = getIncomeCategoriesFromSheet();
  var answer = "Currently configured expense categories are:\n" + expenseCategories +
               "\nCurrently configured income categories are:\n" + incomeCategories;
  sendText(id, answer);
}

function handleReport(id) {
  sendChartToTelegram(id);
}

function handleExpense(id, name, match) {
  var category = match[1];
  var price = match[2];
  var comment = match[3] || '';
  var income = false;
  var answer = `Expense received and stored (${category}, ${price}, ${comment}) Thanks ${name}`;
  SpreadsheetApp.openById(ssId).getSheetByName("webHookData").appendRow([new Date(), name, price, category, comment, income]);
  sendText(id, answer);
}

function handleIncome(id, name, match) {
  var category = match[1];
  var price = match[2];
  var comment = match[3] || '';
  var income = true;
  var answer = `Income received and stored (${category}, ${price}, ${comment}) Thanks ${name}`;
  SpreadsheetApp.openById(ssId).getSheetByName("webHookData").appendRow([new Date(), name, price, category, comment, income]);
  sendText(id, answer);
}

function handleRepeatIncome(id, name, match) {
  var category = match[1];
  var price = match[2];
  var repeatDay = match[3];
  if (!repeatDay || repeatDay < 1 || repeatDay > 30) {
    // Handle error: invalid or missing repeat day
    var answer = "After amount, specify day of month when repeat expense will be logged (1-30) e.g.:\n\nrepeat in salary 600 10 comment"
    sendText(id, answer);
    return
  }
  var comment = match[4] || '';
  var income = true;
  var answer = `Repeat income stored (${category}, ${price}, ${comment}, Repeat day in month: ${repeatDay}) Thanks ${name}`;
  SpreadsheetApp.openById(ssId).getSheetByName("repeatData").appendRow([new Date(), name, price, category, comment, income, repeatDay]);
  sendText(id, answer);
}

function handleRepeatExpense(id, name, match) {
  var category = match[1];
  var price = match[2];
  var repeatDay = match[3];
  if (!repeatDay || repeatDay < 1 || repeatDay > 30) {
    // Handle error: invalid or missing repeat day
    var answer = "After amount, specify day of month when repeat expense will be logged (1-30) e.g.:\n\nrepeat Food 5.5 10 comment"
    sendText(id, answer);
    return
  }
  var comment = match[4] || '';
  var income = false;
  var answer = `Repeat expense stored (${category}, ${price}, ${comment}, Repeat day in month: ${repeatDay}) Thanks ${name}`;
  SpreadsheetApp.openById(ssId).getSheetByName("repeatData").appendRow([new Date(), name, price, category, comment, income, repeatDay]);
  sendText(id, answer);
}

function handleListRepeat(id) {
  var repeatString = fetchRepeatData();
  var repeatHelp = "Repeat flows can be only deleted directly in your spreadsheet by deleting the row for certain reoccuring expense."
  sendText(id,repeatHelp)
  sendText(id, repeatString);
}

var token = ""; // 1. Telegram API KEY
var telegramUrl = "https://api.telegram.org/bot" + token; // 2. Telegram URL for setting up Telegram Bot
var webAppUrl = ""; // 2. FILL IN YOUR GOOGLE WEB APP ADDRESS you only get it after Google WEB app is deployed
var ssId = "";      // 3. FILL IN THE ID OF YOUR GOOGLE SPREADSHEET
var adminID = "";   // 4. Fill in your own Telegram ID for debugging - Telegram -> userinfobot


// Function for debugging reasons - to see if Telegram API key is correct
function getMe() {
  var url = telegramUrl + "/getMe";
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}


// Function for setting where Telegram is sending messages -> Google Web App
function setWebhook() {
  
  var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

// Function for sending
function sendText(id,text) {
  var url = telegramUrl + "/sendMessage?chat_id=" + id + "&text=" + encodeURIComponent(text);
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

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

function doPost(e) {
  try {
    // this is where telegram works
    var data = JSON.parse(e.postData.contents);
    var text = data.message.text;
    var id = data.message.chat.id;
    var name = data.message.chat.first_name + " " + data.message.chat.last_name;
    

    // REGEX check for format
    var match_expense = /^(\w+)\s+(\d+(?:\.\d+)?)(?:\s+(.*))?/.exec(text);
    var match_income = /^(in\s+)(\w+)\s+(\d+(?:\.\d+)?)(?:\s+(.*))?/i.exec(text);
    var match_help = /\bhelp\b/i.exec(text);


    if (match_help){
      var expenseCategories = getExpenseCategoriesFromSheet()
      var incomeCategories = getIncomeCategoriesFromSheet()
      var answer = "Enter expense in form \n" +
             "CATEGORY X.XX COMMENT\n" +
             "For income just add \"in\" phrase e.g.\n" +
             "IN CATEGORY X.XX COMMENT\n" +
             "Currently configured expense categories are:\n" + expenseCategories + "\n" +
             "Currently configured income categories are:\n" + incomeCategories;

      sendText(id,answer);
    } else if (match_expense) {
      var income = false;
      var category = match_expense[1];
      var price = match_expense[2];
      var comment = match_expense[3] || '';
      var answer = "Expense received and stored ("+ category +", "+ price +
               ", " + comment + ") Thanks " + name;
      SpreadsheetApp.openById(ssId).getSheets()[0].appendRow([new Date(),name, price, category, comment, income]);
      sendText(id,answer);
    } else if (match_income) {
      var income = true;
      var category = match_income[2];
      var price = match_income[3];
      var comment = match_income[4] || '';
      var answer = "Income received and stored ("+ category +", "+ price +
                ", " + comment + ") Thanks " + name;
      SpreadsheetApp.openById(ssId).getSheets()[0].appendRow([new Date(),name, price, category, comment, income]);
      sendText(id,answer);
    } else {
      sendText(id,"Wrong Format");
    }
    
  } catch(e) {
    sendText(adminID, JSON.stringify(e,null,4));
  }
}
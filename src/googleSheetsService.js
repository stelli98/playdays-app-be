const e = require("express");
const { google } = require("googleapis");

async function _getGoogleSheetClient() {
  const configAuth = {
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  };
  if (process.env.NODE_ENV === "development") {
    configAuth["keyFilename"] = "./service_account_credentials.json";
  } else {
    configAuth["credentials"] = JSON.parse(
      process.env.GOOGLE_SHEETS_CREDENTIALS
    );
  }
  const auth = new google.auth.GoogleAuth(configAuth);
  const authClient = await auth.getClient();
  return google.sheets({
    version: "v4",
    auth: authClient,
  });
}

async function _readGoogleSheet(googleSheetClient, sheetId, tabName, range) {
  const res = await googleSheetClient.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!${range}`,
  });

  return res.data.values;
}

async function _writeGoogleSheet(
  googleSheetClient,
  sheetId,
  tabName,
  range,
  data
) {
  await googleSheetClient.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tabName}!${range}`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    resource: {
      majorDimension: "ROWS",
      values: data,
    },
  });
}

module.exports = {
  _getGoogleSheetClient,
  _readGoogleSheet,
  _writeGoogleSheet,
};

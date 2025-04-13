import { google } from "googleapis";

export async function POST(req) {
  try {
    const bodyText = await req.text();
    const { email } = JSON.parse(bodyText);

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:F",
    });

    const rows = response.data.values;
    if (!rows) {
      return new Response(JSON.stringify({ error: "No data found in the sheet" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rowIndex = rows.findIndex((row) => row[2] === email);
    if (rowIndex === -1) {
      return new Response(JSON.stringify({ error: "Email not found in the sheet" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Google Sheets API Error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to delete from Google Sheet" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
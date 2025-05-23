import { google } from "googleapis";

export async function POST(req) {
  try {
    const bodyText = await req.text();
    const { luckyNumber, name, email, phone, isAuthor, isDonor, isVolunteer, slot, remarks, guestCount } = JSON.parse(bodyText);

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:J",
      valueInputOption: "RAW",
      requestBody: {
        values: [[luckyNumber, name, email, phone, isAuthor, isDonor, isVolunteer, slot, remarks, guestCount]],
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Google Sheets API Error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to write to Google Sheet" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

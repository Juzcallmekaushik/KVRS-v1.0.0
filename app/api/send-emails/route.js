import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { users } = body;

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ error: "No users provided" }), { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NEXT_PUBLIC_HOST_EMAIL,
        pass: process.env.GMAIL_PASS,
      },
    });

    for (const user of users) {
      const roles = [];
      if (user.is_donor) roles.push("Donor");
      if (user.is_author) roles.push("Author");
      if (user.is_volunteer) roles.push("Volunteer");

      const mailOptions = {
        from: '"KVRS Bot" <host.kvrs@gmail.com>',
        to: user.email,
        subject: "Event Reminder!",
        html: `
          <p style="color: #000000;">Hello <strong style="color: #000000;">${user.name}</strong>,</p>
          <p style="color: #000000;">Hope you are doing well. The following are your registration details:</p>
          <ul style="padding-left: 16px;">
            <li><strong style="color: #000000;">Name:</strong> <span style="color: #000000;">${user.name}</span></li>
            <li><strong style="color: #000000;">Email:</strong> <a href="mailto:${user.email}" style="color: #007bff; text-decoration: none;">${user.email}</a></li>
            <li><strong style="color: #000000;">Phone:</strong> <span style="color: #000000;">${user.phone}</span></li>
            <li><strong style="color: #000000;">Lucky Number:</strong> <span style="color: #000000;">${user.lucky_number}</span></li>
            <li><strong style="color: #000000;">Guest Count:</strong> <span style="color: #000000;">${user.guestcount || "None"}</span></li>
            <li><strong style="color: #000000;">Roles:</strong> <span style="color: #000000;">${roles.length > 0 ? roles.join(" & ") : "None"}</span></li>
            <li><strong style="color: #000000;">Slot Booked:</strong> <span style="color: #000000;">${user.slot }</span></li>
            <li><strong style="color: #000000;">Remarks:</strong> <span style="color: #000000;">${user.remarks || "None provided"}</span></li>
            
          </ul>
          <p style="color: #000000;">
            Tap <a href="https://registration.kasturivijayam.com/" target="_blank" style="color: #007bff; text-decoration: none;">here</a> to access the registration portal. 
            Please show the registration summary at the registration counter on the date of the event!
          </p>
        <div style="margin-top: 16px; line-height: 1.5;">
            <span style="color: #000000;">Best Regards,&nbsp;</span><br>
            <strong style="color: #000000;">Kasturi Vijayam Registration Bot</strong><br>
            <span style="font-size: 0px;">${Math.random()}</span>
        </div>

        `
      };      

      await transporter.sendMail(mailOptions);
    }

    return new Response(JSON.stringify({ message: "Emails sent successfully" }), { status: 200 });
  } catch (error) {
    console.error("Error sending emails:", error);
    return new Response(JSON.stringify({ error: "Failed to send emails" }), { status: 500 });
  }
}
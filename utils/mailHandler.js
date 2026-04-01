const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "3571088e7366c6",
        pass: "80130115fcc55f"
    }
});

module.exports = {
    sendMail: async (to, url) => {
        const info = await transporter.sendMail({
            from: 'admin@haha.com',
            to: to,
            subject: "RESET PASSWORD REQUEST",
            text: "lick vo day de doi pass", // Plain-text version of the message
            html: "lick vo <a href=" + url + ">day</a> de doi pass", // HTML version of the message
        });

        console.log("Message sent:", info.messageId);
    },
    sendPasswordMail: async (to, username, password) => {
        const info = await transporter.sendMail({
            from: '"Admin" <admin@haha.com>',
            to: to,
            subject: "Your New Account Credentials",
            text: `Hello ${username},\n\nYour account has been created.\nUsername: ${username}\nPassword: ${password}\n\nPlease keep this secure.`,
            html: `<p>Hello <b>${username}</b>,</p><p>Your account has been created.</p><p>Username: <b>${username}</b></p><p>Password: <b>${password}</b></p><p>Please keep this secure.</p>`,
        });

        console.log("Password email sent to:", to, "MessageID:", info.messageId);
    }
}
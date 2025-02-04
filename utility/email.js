// // //
const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text"); // ⏺ html-to-text is an npm package that converts HTML into plain text, preserving readability while removing HTML tags

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `MD JOY <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // ⏺ brevo
      return nodemailer.createTransport({
        host: process.env.BREVO_HOST,
        port: process.env.BREVO_PORT,
        auth: {
          user: process.env.BREVO_LOGIN,
          pass: process.env.BREVO_PASSWORD,
        },
      });
    }

    // ⏺ for developing we use nodemailer
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // ⏺ send the actual email
  async send(template, subject) {
    // 1) ⏺ render html based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    }); // ⏺ renderFile() is a method/function that render a template file and return HTML output

    // 2) ⏺ define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html), // ⏺ convert() method/function is coming form `html-to-text` for convert HTML to plain text
    };

    // ⏺ 3) create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the natours family!");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token! (valid for only 10 minutes)"
    );
  }
};

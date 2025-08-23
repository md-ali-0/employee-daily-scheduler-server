import env from '@config/env'
import logger from '@config/winston'
import fs from 'fs'
import handlebars from 'handlebars'
import nodemailer from 'nodemailer'
import path from 'path'

export interface EmailData {
  to: string
  subject: string
  template: string
  context: Record<string, any>
}

export interface EmailTemplate {
  subject: string
  template: string
}

export class EmailService {
  private transporter?: nodemailer.Transporter
  private templates: Map<string, EmailTemplate> = new Map()

  constructor() {
    this.initializeTransporter()
    this.loadTemplates()
  }

  private initializeTransporter() {
    if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASS) {
      logger.warn('Email configuration incomplete. Email service will not be available.')
      return
    }

    this.transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_SECURE,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    })

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error('Email transporter verification failed:', error)
      } else {
        logger.info('Email service is ready')
      }
    })
  }

  private loadTemplates() {
    const templatesDir = path.join(__dirname, '../templates/emails')
    
    try {
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true })
      }

      const templateFiles = fs.readdirSync(templatesDir)
      
      templateFiles.forEach(file => {
        if (file.endsWith('.json')) {
          const templateName = path.basename(file, '.json')
          const templatePath = path.join(templatesDir, file)
          const templateContent = fs.readFileSync(templatePath, 'utf-8')
          const template = JSON.parse(templateContent)
          
          this.templates.set(templateName, template)
        }
      })
      
      logger.info(`Loaded ${this.templates.size} email templates from JSON files`)
    } catch (error) {
      logger.error('Error loading email templates:', error)
    }
  }


  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!this.transporter) {
        logger.error('Email transporter not initialized')
        return false
      }

      const template = this.templates.get(emailData.template)
      if (!template) {
        logger.error(`Email template '${emailData.template}' not found`)
        return false
      }

      const compiledTemplate = handlebars.compile(template.template)
      const html = compiledTemplate(emailData.context)

      const mailOptions = {
        from: `"${env.EMAIL_FROM_NAME || 'Blog Platform'}" <${env.EMAIL_FROM || env.EMAIL_USER}>`,
        to: emailData.to,
        subject: emailData.subject || template.subject,
        html: html,
      }

      const result = await this.transporter.sendMail(mailOptions)
      logger.info(`Email sent successfully to ${emailData.to}: ${result.messageId}`)
      return true
    } catch (error) {
      logger.error('Error sending email:', error)
      return false
    }
  }

  // Convenience methods for different email types
  async sendWelcomeEmail(userEmail: string, userName: string, userRole: string): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to Our Blog Platform!',
      template: 'welcome',
      context: {
        name: userName,
        email: userEmail,
        role: userRole,
        joinDate: new Date().toLocaleDateString(),
        loginUrl: `${env.CORS_ORIGIN || 'http://localhost:3000'}/login`
      }
    })
  }

  async sendLoginNotification(userEmail: string, userName: string, loginData: any): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'New Login Detected',
      template: 'login-notification',
      context: {
        name: userName,
        loginDate: new Date().toLocaleString(),
        ipAddress: loginData.ipAddress || 'Unknown',
        userAgent: loginData.userAgent || 'Unknown',
        location: loginData.location || 'Unknown'
      }
    })
  }

  async sendPostApprovedEmail(userEmail: string, authorName: string, postData: any): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Your Post Has Been Approved!',
      template: 'post-approved',
      context: {
        authorName,
        postTitle: postData.title,
        publishDate: new Date().toLocaleDateString(),
        category: postData.category?.name || 'General',
        postUrl: `${env.CORS_ORIGIN || 'http://localhost:3000'}/posts/${postData.slug}`
      }
    })
  }

  async sendPostRejectedEmail(userEmail: string, authorName: string, postData: any, feedback: string): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Post Review Update',
      template: 'post-rejected',
      context: {
        authorName,
        postTitle: postData.title,
        submitDate: new Date(postData.createdAt).toLocaleDateString(),
        category: postData.category?.name || 'General',
        feedback,
        editUrl: `${env.CORS_ORIGIN || 'http://localhost:3000'}/posts/${postData.id}/edit`
      }
    })
  }

  async sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        name: userName,
        resetUrl: `${env.CORS_ORIGIN || 'http://localhost:3000'}/reset-password?token=${resetToken}`,
        expiryTime: '60'
      }
    })
  }

  async sendCommentNotification(userEmail: string, authorName: string, commentData: any): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'New Comment on Your Post',
      template: 'comment-notification',
      context: {
        authorName,
        commenterName: commentData.commenterName,
        postTitle: commentData.postTitle,
        commentDate: new Date().toLocaleDateString(),
        commentText: commentData.commentText,
        postUrl: `${env.CORS_ORIGIN || 'http://localhost:3000'}/posts/${commentData.postSlug}`
      }
    })
  }
  async sendForgotPasswordOtpEmail(userEmail: string, authorName: string, otp: any): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Password Reset OTP',
      template: 'forgot-password-otp',
      context: {
        name: authorName,
        otp: otp, // commentData is actually the OTP here
        expiryTime: '10' // OTP expiry time in minutes
      }
    })
  }
  async sendForgotPasswordLinkEmail(userEmail: string, authorName: string, link: any): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Password Reset Link',
      template: 'forgot-password-link',
      context: {
        name: authorName,
        resetLink: link, // commentData is actually the OTP here
        expiryTime: '10' // OTP expiry time in minutes
      }
    })
  }

  async sendForgotPasswordBothEmail(userEmail: string, authorName: string, otp: string, resetLink: string): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Password Reset - OTP & Link',
      template: 'forgot-password-both',
      context: {
        name: authorName,
        otp: otp,
        resetLink: resetLink,
        expiryTime: '10' // OTP expiry time in minutes
      }
    })
  }
}


export default new EmailService() 
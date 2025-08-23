import logger from '@config/winston'
import emailService from '@services/email.service'

export async function testEmailService() {
  try {
    logger.info('Testing email service...')
    
    // Test welcome email
    const welcomeResult = await emailService.sendWelcomeEmail(
      'test@example.com',
      'Test User',
      'USER'
    )
    logger.info(`Welcome email test: ${welcomeResult ? 'SUCCESS' : 'FAILED'}`)
    
    // Test login notification
    const loginResult = await emailService.sendLoginNotification(
      'test@example.com',
      'Test User',
      {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        location: 'Test Location'
      }
    )
    logger.info(`Login notification test: ${loginResult ? 'SUCCESS' : 'FAILED'}`)
    
    // Test post approval
    const approvalResult = await emailService.sendPostApprovedEmail(
      'test@example.com',
      'Test Author',
      {
        title: 'Test Post Title',
        slug: 'test-post-slug',
        category: { name: 'Technology' },
        createdAt: new Date()
      }
    )
    logger.info(`Post approval test: ${approvalResult ? 'SUCCESS' : 'FAILED'}`)
    
    // Test post rejection
    const rejectionResult = await emailService.sendPostRejectedEmail(
      'test@example.com',
      'Test Author',
      {
        title: 'Test Post Title',
        id: 'test-post-id',
        category: { name: 'Technology' },
        createdAt: new Date()
      },
      'This post needs more detail and better formatting.'
    )
    logger.info(`Post rejection test: ${rejectionResult ? 'SUCCESS' : 'FAILED'}`)
    
    // Test password reset
    const resetResult = await emailService.sendPasswordResetEmail(
      'test@example.com',
      'Test User',
      'test-reset-token-123'
    )
    logger.info(`Password reset test: ${resetResult ? 'SUCCESS' : 'FAILED'}`)
    
    // Test comment notification
    const commentResult = await emailService.sendCommentNotification(
      'test@example.com',
      'Test Author',
      {
        commenterName: 'Test Commenter',
        postTitle: 'Test Post Title',
        postSlug: 'test-post-slug',
        commentText: 'This is a test comment!'
      }
    )
    logger.info(`Comment notification test: ${commentResult ? 'SUCCESS' : 'FAILED'}`)
    
    logger.info('Email service testing completed!')
    return true
  } catch (error) {
    logger.error('Email service test failed:', error)
    return false
  }
} 
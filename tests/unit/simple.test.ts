describe('Simple Test', () => {
  it('should pass', () => {
    expect(true).toBe(true)
  })

  it('should have test utilities available', () => {
    const { testUtils } = require('../setup')
    expect(testUtils.mockUser).toBeDefined()
    expect(testUtils.mockUser.email).toBe('test@example.com')
  })
}) 
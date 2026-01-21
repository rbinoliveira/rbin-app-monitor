describe('Project Creation E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/projects/new')
  })

  it('should display project creation form', () => {
    cy.contains('Create Project').should('be.visible')
    cy.get('input[name="name"]').should('be.visible')
    cy.get('input[name="baseUrl"]').should('be.visible')
  })

  it('should show validation errors for empty form', () => {
    cy.get('button[type="submit"]').click()

    cy.contains('Project name is required').should('be.visible')
    cy.contains('Base URL is required').should('be.visible')
    cy.contains('At least one monitoring type must be selected').should(
      'be.visible',
    )
  })

  it('should validate project name length', () => {
    cy.get('input[name="name"]').type('ab')
    cy.get('input[name="baseUrl"]').type('https://example.com')
    cy.get('button[type="submit"]').click()

    cy.contains('Project name must be at least 3 characters').should(
      'be.visible',
    )
  })

  it('should validate URL format', () => {
    cy.get('input[name="name"]').type('Test Project')
    cy.get('input[name="baseUrl"]').type('invalid-url')
    cy.get('button[type="submit"]').click()

    cy.contains('Base URL must be a valid URL').should('be.visible')
  })

  it('should allow selecting monitoring types', () => {
    cy.get('input[name="name"]').type('Test Project')
    cy.get('input[name="baseUrl"]').type('https://example.com')

    cy.get('input[type="checkbox"][value="web"]').check()
    cy.get('input[type="checkbox"][value="rest"]').check()

    cy.get('input[type="checkbox"][value="web"]').should('be.checked')
    cy.get('input[type="checkbox"][value="rest"]').should('be.checked')
  })

  it('should submit form with valid data', () => {
    cy.intercept('POST', '/api/projects', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 'test-id',
          name: 'Test Project',
          baseUrl: 'https://example.com',
          monitoringTypes: ['web'],
          status: 'unknown',
          isActive: true,
        },
      },
    }).as('createProject')

    cy.get('input[name="name"]').type('Test Project')
    cy.get('input[name="baseUrl"]').type('https://example.com')
    cy.get('input[type="checkbox"][value="web"]').check()
    cy.get('button[type="submit"]').click()

    cy.wait('@createProject')
  })
})

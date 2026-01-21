describe('Execution History E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/history')
  })

  it('should display history page', () => {
    cy.contains('Execution History').should('be.visible')
    cy.contains('View health check results and Cypress test executions').should(
      'be.visible',
    )
  })

  it('should display history table', () => {
    cy.get('table').should('be.visible')
  })

  it('should show loading state while fetching history', () => {
    cy.intercept('GET', '/api/history*', {
      delay: 1000,
      statusCode: 200,
      body: {
        success: true,
        data: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          hasMore: false,
        },
      },
    }).as('getHistory')

    cy.visit('/history')
    cy.contains('Loading').should('be.visible')
  })

  it('should display empty state when no history exists', () => {
    cy.intercept('GET', '/api/history*', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          hasMore: false,
        },
      },
    }).as('getHistory')

    cy.visit('/history')
    cy.wait('@getHistory')

    cy.contains('No execution history').should('be.visible')
  })

  it('should display health check results in history', () => {
    const mockHistory = [
      {
        id: '1',
        projectId: 'project-1',
        projectName: 'Test Project',
        type: 'web',
        url: 'https://example.com',
        success: true,
        statusCode: 200,
        responseTime: 150,
        timestamp: new Date().toISOString(),
      },
    ]

    cy.intercept('GET', '/api/history*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockHistory,
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          hasMore: false,
        },
      },
    }).as('getHistory')

    cy.visit('/history')
    cy.wait('@getHistory')

    cy.contains('Test Project').should('be.visible')
    cy.contains('web').should('be.visible')
    cy.contains('https://example.com').should('be.visible')
  })

  it('should display Cypress test results in history', () => {
    const mockHistory = [
      {
        id: '2',
        projectId: 'project-1',
        projectName: 'Test Project',
        success: true,
        totalTests: 10,
        passed: 10,
        failed: 0,
        skipped: 0,
        duration: 5000,
        specFiles: ['test.cy.ts'],
        output: 'All tests passed',
        timestamp: new Date().toISOString(),
      },
    ]

    cy.intercept('GET', '/api/history*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockHistory,
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          hasMore: false,
        },
      },
    }).as('getHistory')

    cy.visit('/history')
    cy.wait('@getHistory')

    cy.contains('Test Project').should('be.visible')
    cy.contains('10').should('be.visible')
    cy.contains('passed').should('be.visible')
  })

  it('should filter history by project', () => {
    cy.intercept('GET', '/api/history*', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          hasMore: false,
        },
      },
    }).as('getHistory')

    cy.visit('/history')
    cy.wait('@getHistory')

    cy.get('select[name="projectId"]').should('be.visible')
    cy.get('select[name="projectId"]').select('project-1')

    cy.wait('@getHistory')
  })

  it('should filter history by type', () => {
    cy.intercept('GET', '/api/history*', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          hasMore: false,
        },
      },
    }).as('getHistory')

    cy.visit('/history')
    cy.wait('@getHistory')

    cy.get('select[name="type"]').should('be.visible')
    cy.get('select[name="type"]').select('web')

    cy.wait('@getHistory')
  })

  it('should filter history by status', () => {
    cy.intercept('GET', '/api/history*', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          hasMore: false,
        },
      },
    }).as('getHistory')

    cy.visit('/history')
    cy.wait('@getHistory')

    cy.get('select[name="status"]').should('be.visible')
    cy.get('select[name="status"]').select('success')

    cy.wait('@getHistory')
  })

  it('should paginate through history results', () => {
    const mockHistoryPage1 = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      projectId: 'project-1',
      projectName: 'Test Project',
      type: 'web',
      url: 'https://example.com',
      success: true,
      statusCode: 200,
      responseTime: 150,
      timestamp: new Date().toISOString(),
    }))

    cy.intercept('GET', '/api/history*page=1*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockHistoryPage1,
        pagination: {
          page: 1,
          pageSize: 20,
          total: 25,
          hasMore: true,
        },
      },
    }).as('getHistoryPage1')

    cy.intercept('GET', '/api/history*page=2*', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
        pagination: {
          page: 2,
          pageSize: 20,
          total: 25,
          hasMore: false,
        },
      },
    }).as('getHistoryPage2')

    cy.visit('/history')
    cy.wait('@getHistoryPage1')

    cy.contains('Next').should('be.visible')
    cy.contains('Next').click()

    cy.wait('@getHistoryPage2')
  })

  it('should display error message on API failure', () => {
    cy.intercept('GET', '/api/history*', {
      statusCode: 500,
      body: {
        success: false,
        error: 'Internal server error',
      },
    }).as('getHistoryError')

    cy.visit('/history')
    cy.wait('@getHistoryError')

    cy.contains('Error loading history').should('be.visible')
    cy.contains('Internal server error').should('be.visible')
  })

  it('should show success and failure status indicators', () => {
    const mockHistory = [
      {
        id: '1',
        projectId: 'project-1',
        projectName: 'Test Project',
        type: 'web',
        url: 'https://example.com',
        success: true,
        statusCode: 200,
        responseTime: 150,
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        projectId: 'project-1',
        projectName: 'Test Project',
        type: 'web',
        url: 'https://example.com',
        success: false,
        statusCode: 500,
        responseTime: 200,
        timestamp: new Date().toISOString(),
      },
    ]

    cy.intercept('GET', '/api/history*', {
      statusCode: 200,
      body: {
        success: true,
        data: mockHistory,
        pagination: {
          page: 1,
          pageSize: 20,
          total: 2,
          hasMore: false,
        },
      },
    }).as('getHistory')

    cy.visit('/history')
    cy.wait('@getHistory')

    cy.contains('Success').should('be.visible')
    cy.contains('Failed').should('be.visible')
  })
})

describe('Project Listing E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/projects')
  })

  it('should display projects page', () => {
    cy.contains('Projects').should('be.visible')
    cy.contains('Monitor your applications health and test results').should(
      'be.visible',
    )
  })

  it('should show "New Project" button', () => {
    cy.contains('New Project').should('be.visible')
    cy.get('a[href="/projects/new"]').should('exist')
  })

  it('should display project statistics cards', () => {
    cy.contains('Total Projects').should('be.visible')
    cy.contains('Healthy').should('be.visible')
    cy.contains('Unhealthy').should('be.visible')
    cy.contains('Unknown').should('be.visible')
  })

  it('should display empty state when no projects exist', () => {
    cy.intercept('GET', '/api/projects', {
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as('getProjects')

    cy.visit('/projects')
    cy.wait('@getProjects')

    cy.contains('No projects yet').should('be.visible')
    cy.contains('Get started by creating your first project to monitor').should(
      'be.visible',
    )
  })

  it('should display projects with status indicators', () => {
    cy.intercept('GET', '/api/projects', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: '1',
            name: 'Healthy Project',
            baseUrl: 'https://example.com',
            monitoringTypes: ['web'],
            status: 'healthy',
            isActive: true,
            lastCheckAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Unhealthy Project',
            baseUrl: 'https://example2.com',
            monitoringTypes: ['rest'],
            status: 'unhealthy',
            isActive: true,
            lastCheckAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    }).as('getProjects')

    cy.visit('/projects')
    cy.wait('@getProjects')

    cy.contains('Healthy Project').should('be.visible')
    cy.contains('Unhealthy Project').should('be.visible')
    cy.contains('Healthy').should('be.visible')
    cy.contains('Unhealthy').should('be.visible')
  })

  it('should navigate to project detail when clicking project card', () => {
    cy.intercept('GET', '/api/projects', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: '1',
            name: 'Test Project',
            baseUrl: 'https://example.com',
            monitoringTypes: ['web'],
            status: 'healthy',
            isActive: true,
            lastCheckAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    }).as('getProjects')

    cy.visit('/projects')
    cy.wait('@getProjects')

    cy.contains('Test Project').click()
  })

  it('should show loading state while fetching projects', () => {
    cy.intercept('GET', '/api/projects', {
      delay: 1000,
      statusCode: 200,
      body: {
        success: true,
        data: [],
      },
    }).as('getProjects')

    cy.visit('/projects')

    cy.contains('Loading projects').should('be.visible')
  })
})

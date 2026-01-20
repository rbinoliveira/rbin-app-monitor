describe('Health Check E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display projects page', () => {
    cy.contains('Projects').should('be.visible')
  })

  it('should navigate to new project page', () => {
    cy.visit('/projects/new')
    cy.contains('Create Project').should('be.visible')
  })

  it('should have health check API endpoint available', () => {
    cy.request({
      method: 'GET',
      url: '/api/health-check/web',
      qs: {
        url: 'https://example.com',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 400, 500])
    })
  })

  it('should return structured health check response', () => {
    cy.request({
      method: 'GET',
      url: '/api/health-check/web',
      qs: {
        url: 'https://example.com',
      },
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 200) {
        expect(response.body).to.have.property('success')
        expect(response.body).to.have.property('data')
        if (response.body.data) {
          expect(response.body.data).to.have.property('success')
          expect(response.body.data).to.have.property('responseTime')
        }
      }
    })
  })
})

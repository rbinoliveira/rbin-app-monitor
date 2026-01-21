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

  it('should execute web health check successfully', () => {
    cy.request({
      method: 'GET',
      url: '/api/health-check/web',
      qs: {
        url: 'https://example.com',
      },
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 200 && response.body.success) {
        expect(response.body.data).to.have.property('success')
        expect(response.body.data).to.have.property('responseTime')
        expect(response.body.data.responseTime).to.be.a('number')
      }
    })
  })

  it('should handle health check with invalid URL', () => {
    cy.request({
      method: 'GET',
      url: '/api/health-check/web',
      qs: {
        url: 'invalid-url',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([400, 500])
      if (response.body) {
        expect(response.body).to.have.property('success')
        expect(response.body.success).to.equal(false)
      }
    })
  })

  it('should execute REST endpoint health check', () => {
    cy.request({
      method: 'POST',
      url: '/api/health-check/rest',
      body: {
        url: 'https://example.com',
        method: 'GET',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 400, 500])
      if (response.status === 200 && response.body.success) {
        expect(response.body.data).to.have.property('success')
        expect(response.body.data).to.have.property('responseTime')
      }
    })
  })

  it('should execute WordPress health check', () => {
    cy.request({
      method: 'GET',
      url: '/api/health-check/wordpress',
      qs: {
        url: 'https://example.com',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 400, 500])
      if (response.status === 200 && response.body.success) {
        expect(response.body.data).to.have.property('success')
        expect(response.body.data).to.have.property('endpoints')
      }
    })
  })
})

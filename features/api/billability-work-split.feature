@api @billability
Feature: Billability Work Split API

  As a consumer of the Vantage Dashboard API
  I want to retrieve billability work-split data for business units and employees
  So that I can verify both endpoints return valid, schema-conformant data within acceptable performance limits

  Scenario: POST work-split business returns a valid JSON response within SLA
    When I send a POST request to the billability work-split business endpoint
    Then the response status code should be 200
    Then the response content type should be "application/json"
    Then the response body should be valid JSON
    Then the response body should match the "billability-work-split-business" schema
    Then the response time should be under 10000 ms

  Scenario: POST work-split employee returns a valid paginated JSON response within SLA
    When I send a POST request to the billability work-split employee endpoint
    Then the response status code should be 200
    Then the response content type should be "application/json"
    Then the response body should be valid JSON
    Then the response body should match the "billability-work-split-employee" schema
    Then the response time should be under 8000 ms

  Scenario: POST work-split employee supports pagination via request overrides
    When I send a POST request to the billability work-split employee endpoint for page 2
    Then the response status code should be 200
    Then the response body should be valid JSON
    Then the response body should match the "billability-work-split-employee" schema

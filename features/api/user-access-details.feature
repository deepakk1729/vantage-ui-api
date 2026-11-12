@api @smoke
Feature: User Access Details API

  As a consumer of the Vantage Dashboard API
  I want to retrieve user access details
  So that I can verify the endpoint returns valid data within acceptable performance limits

  Scenario: GET user access details returns a valid JSON response within SLA
    When I send a GET request to the user access details endpoint
    Then the response status code should be 200
    Then the response content type should be "application/json"
    Then the response body should be valid JSON
    Then the response body should match the "user-access-details" schema
    Then the response time should be under 7000 ms

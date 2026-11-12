@api @userfilter
Feature: User Filter API

  As a consumer of the Vantage Dashboard API
  I want to create and delete a saved "Name" filter collection (userfilter)
  So that I can verify both endpoints return the expected status, content type, and response time

  # Each scenario is self-cleaning: it creates a disposable filter collection and deletes it
  # again before the scenario ends, so no test data is left behind in the real system.
  #
  # NOTE: on this environment (api-kd-test.integration) both endpoints genuinely return a bare,
  # UNQUOTED plain-text confirmation message with content-type "text/plain" — not JSON — confirmed
  # via live capture. The shared "response body should be valid JSON" / "match schema" Then steps
  # do not apply here and are intentionally omitted (they require a JSON-parseable body).

  Scenario: POST create a user filter collection returns the expected response within SLA
    When I send a POST request to create a user filter collection
    Then the response status code should be 201
    Then the response content type should be "text/plain"
    Then the response time should be under 5000 ms
    And I delete the user filter collection created in this scenario

  Scenario: DELETE a freshly created user filter collection returns the expected response within SLA
    When I create a disposable user filter collection and then delete it
    Then the response status code should be 200
    Then the response content type should be "text/plain"
    Then the response time should be under 5000 ms

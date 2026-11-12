@home @login

Feature: Home Page Login

  As a Vantage Dashboard user
  I want to log in and land on the Home page with the expected header elements
  So that I can confirm the dashboard has loaded correctly and impersonation controls are available

  Background:
    Given I am logged into Vantage Dashboard

  # CSV Summary: "Home Page Login"
  Scenario: User lands on the Home Page when logged in to the dashboard
    When I navigate to the Home page
    Then I should land on the Home Page of the Vantage Dashboard

  Scenario: BCG Vantage Dashboard logo is present on the page header
    When I navigate to the Home page
    Then the BCG Vantage Dashboard logo should be visible on the top left side of the page header

  Scenario: User Validation Select dropdown is present on the page header for impersonation
    When I navigate to the Home page
    Then the "User Validation" Select dropdown should be visible on the top right side of the page header
    And the "User Validation" Select dropdown should allow the user to select a team member for impersonation

  # Live-confirmed discrepancy: the refreshed-data timestamp ("Data as of <date>") is displayed
  # at the bottom of the left navigation sidebar (below "Contact Support"), not in the top page
  # header beside the "User Validation" dropdown as described in the CSV step. Scenario below
  # reflects the live app behaviour.
  Scenario: Timestamp of the refreshed data is present on the page
    When I navigate to the Home page
    Then the "Data as of" timestamp of the refreshed data should be visible at the bottom of the left navigation sidebar

@home @filters

Feature: Home Page Filter Section

  As a Vantage Dashboard user
  I want to verify the filter categories present in the Home page FILTERS panel
  So that I can confirm all expected filters are available for narrowing dashboard data

  Background:
    Given I am logged into Vantage Dashboard

  # ── Home Page Filter Section ────────────────────────────────────────────────

  @practice-area @geoBusiness @status
  Scenario: All expected filter categories are present in the Home page filters section
    When I navigate to the Home page
    Then the FILTERS panel should be visible on the left side of the page
    And the filter panel should contain a "Reset" button
    And the filter panel should contain the following filters:
      | Filter           |
      | Date Range       |
      | Months           |
      | Name             |
      | Practice Area    |
      | Geo Business     |
      | Path             |
      | Management Model |
      | Job Title        |
      | Location         |
      | Status           |

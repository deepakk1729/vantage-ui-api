@home @filters

Feature: Home Page Filter Section

  As a Vantage Dashboard user
  I want to verify the filter section on the Home page
  So that I can confirm the Date Range and Months filters are available

  Background:
    Given I am logged into Vantage Dashboard

  # Analyst has only 2 filters: Date Range + Months. No Name/Path/Location/Status/etc.
  Scenario: Filter panel shows Date Range and Months options
    When I navigate to the Home page
    Then the FILTERS panel should be visible on the left side of the page
    And the filter panel should contain a "Reset" button
    And the Date Range filter should show "the calendar-year-to-date default" as the default selection
    And the Date Range options should be visible with "Last 12 months" selected by default
    And the "Months" section should be visible in the filter panel with month checkboxes
    When I select the month "the most recently available month" in the Months filter
    And I click the "Apply" button in the analyst filter panel
    Then the filter panel should reflect the selected month
    When I click the "Reset" button in the analyst filter panel
    Then the Date Range filter should revert to the default selection

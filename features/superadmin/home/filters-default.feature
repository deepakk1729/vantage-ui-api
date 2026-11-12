@home @filters

Feature: Home Page - All Filters Default Validation

  As a Vantage Dashboard user
  I want to verify the default state and global behaviour of all filters on the Home page
  So that I can confirm filters start correctly, reset properly, clear per-filter, survive refresh as expected,
  and carry applied selections across all pages

  Background:
    Given I am logged into Vantage Dashboard

  # Default date range is calendar-year-to-date (live-confirmed, computed from the "Data as of"
  # header date, not a true trailing-12-month window); apply MM "PA Managed" → badge → Reset → all cleared + date reverted;
  # apply MM "PA Managed" → Clear within filter → all options deselected
  @defaultState @reset @clear
  Scenario: Default date range is correct, Reset clears all filters, and Clear deselects within a filter
    When I navigate to the Home page
    Then the Date Range filter should show "the calendar-year-to-date default" as the default selection
    When I open the "Management Model" filter
    And I select the "PA Managed" option in the "Management Model" filter on the Home page
    And I click the "Apply" button in the filter panel
    Then the "Management Model" filter button should display a selection count badge
    When I click the "Reset" button in the filter panel
    Then all filter selections should be cleared
    And the Date Range filter should revert to "Jan 2025 to Dec 2025"
    When I open the "Management Model" filter
    And I select the "PA Managed" option in the "Management Model" filter on the Home page
    And I click "Clear" within the "Management Model" filter panel
    Then all options within the "Management Model" filter should be deselected

  # Apply MM "PA Managed" → badge → reload → all filters reset + date default;
  # Apply MM "PA Managed" → badge → navigate to BC Billability → badge still visible
  @refresh @carryOver
  Scenario: Applied filters reset on page reload and carry over when navigating to another page
    When I navigate to the Home page
    And I open the "Management Model" filter
    And I select the "PA Managed" option in the "Management Model" filter on the Home page
    And I click the "Apply" button in the filter panel
    Then the "Management Model" filter button should display a selection count badge
    When I reload the Home page
    Then all filters should be reset to their default selections
    And the Date Range filter should show "the calendar-year-to-date default" as the default selection
    When I open the "Management Model" filter
    And I select the "PA Managed" option in the "Management Model" filter on the Home page
    And I click the "Apply" button in the filter panel
    Then the "Management Model" filter button should display a selection count badge
    When I click the "Business Comparison" button in the left sidebar
    And I click the "Billability" sub-menu option
    Then the applied "Management Model" filter should still be shown on the "Business Comparison Billability" page

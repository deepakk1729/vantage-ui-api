@home

Feature: Home Page - Login landing and Tiles validation

  As a Vantage Dashboard user
  I want to land on the Home page after login and see all expected tiles
  So that I can review key metrics at a glance

  Background:
    Given I am logged into Vantage Dashboard

  # Team Manager has no Business Comparison. Sidebar shows only Home + People.
  # 8 tiles (no Vantage Pulse Check, no Team Size; RMS CT Satisfaction was removed
  # from the app - live-confirmed, no matching DOM element anywhere on the Home page).
  Scenario: Home page loads with all expected header elements, navigation, tiles and filter panel
    When I navigate to the Home page
    Then I should land on the Home page of the Vantage Dashboard
    And the BCG Vantage Dashboard logo should be visible on the top left of the page header
    And the User Validation Select dropdown should be visible on the top right of the page header
    And the refreshed data timestamp should be visible on the page header after the User Validation Select dropdown
    And the following page options should be available on the left side of the page:
      | Home Page |
      | People    |
    And the Filters panel should be visible on the left side of the page below the page options
    And the following tiles should be displayed on the Home page:
      | Billability Trend    |
      | Vantage Averages     |
      | Timesheet            |
      | Case Engagement Depth|
      | Top Projects         |
      | Top Clients          |
      | Top Downloads        |
      | KN Material          |
    And the Billability Trend tile should display months within the default Last 12 Months range
    And the Vantage Averages tile should reflect the default utilization category "Client"
    And the Top Projects tile should reflect the default utilization category "Client"

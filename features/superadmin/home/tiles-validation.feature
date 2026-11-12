@home @tiles

Feature: Home Page Tiles Validation

  Background:
    Given I am logged into Vantage Dashboard

  # All 10 tiles visible (RMS CT Satisfaction was removed from the app - live-confirmed,
  # no matching DOM element anywhere on the Home page), Billability Trend/Team Size/
  # Vantage Pulse Check show LTM months, Vantage Averages/Top Projects reflect "Client" utilization,
  # sidebar nav options, filters panel below nav
  @team-size-tile @vantage-pulse-check @businessComparison
  Scenario: All tiles, sidebar navigation and filters panel are correctly displayed on the Home page
    When I navigate to the Home page
    Then the following tiles should be visible:
      | BILLABILITY TREND      |
      | VANTAGE AVERAGES       |
      | TIMESHEET              |
      | CASE ENGAGEMENT DEPTH  |
      | TOP PROJECTS           |
      | TOP CLIENTS            |
      | VANTAGE PULSE CHECK    |
      | TEAM SIZE              |
      | TOP DOWNLOADS          |
      | KN MATERIAL            |
    And the "BILLABILITY TREND" tile should display months within the default LTM date range
    And the "TEAM SIZE" tile should display months within the default LTM date range
    And the "VANTAGE PULSE CHECK" tile should display months within the default LTM date range
    And the "VANTAGE AVERAGES" tile should reflect the default utilization category "Client"
    And the "TOP PROJECTS" tile should reflect the default utilization category "Client"
    And the sidebar should display the following page options:
      | Home                |
      | Business Comparison |
      | People              |
    And the filters panel should be visible on the left side of the page
    And the filters panel should appear below the page navigation options

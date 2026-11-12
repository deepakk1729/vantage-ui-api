@home @tiles

Feature: Home Page Tiles Validation

  Background:
    Given I am logged into Vantage Dashboard

  # Analyst: 11 tiles including 3 personal tiles (Case Billability, CD Billability, Hourly Bill Rate).
  # RMS CT Satisfaction was removed from the app - live-confirmed, no matching DOM element
  # anywhere on the Home page. Sidebar shows Home and Reports only (no Business Comparison).
  Scenario: All tiles, sidebar navigation and filters panel are correctly displayed on the Home page
    When I navigate to the Home page
    Then the following tiles should be visible:
      | CASE BILLABILITY      |
      | CD BILLABILITY        |
      | HOURLY BILL RATE      |
      | BILLABILITY TREND     |
      | VANTAGE AVERAGES      |
      | TIMESHEET             |
      | CASE ENGAGEMENT DEPTH |
      | TOP PROJECTS          |
      | TOP CLIENTS           |
      | TOP DOWNLOADS         |
      | KN MATERIAL           |
    And the "BILLABILITY TREND" tile should display months within the default LTM date range
    And the "VANTAGE AVERAGES" tile should reflect the default utilization category "Client"
    And the "TOP PROJECTS" tile should reflect the default utilization category "Client"
    And the sidebar should display the following page options:
      | Home    |
      | Reports |
    And the filters panel should be visible on the left side of the page
    And the filters panel should appear below the page navigation options

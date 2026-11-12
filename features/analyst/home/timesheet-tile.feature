@home @timesheetTile
Feature: Home Page - Timesheet Tile

  Background:
    Given I am logged into Vantage Dashboard

  # Tile visible; tile loaded; On Time/Late/Missing status labels; stacked bar 3 color-coded segments;
  # On Time % visible; Late % visible; Missing % visible; sum of all percentages = 100%
  Scenario: Timesheet tile displays status labels, stacked bar and all percentages sum to 100%
    When I navigate to the Home page
    And I scroll to the "TIMESHEET" tile
    Then the "TIMESHEET" tile should be visible on the page
    And the "TIMESHEET" tile has loaded
    And the tile should display the following submission status labels
      | Status   |
      | On Time  |
      | Late     |
      | Missing  |
    And the tile should contain a stacked bar with three color-coded segments
    And each segment should correspond to a submission status row in the legend
    And if the "TIMESHEET" tile contains data the "On Time" value should display the percentage of timesheets submitted on time during the selected time period
    And if the "TIMESHEET" tile contains data the "Late" value should display the percentage of timesheets submitted late during the selected time period
    And if the "TIMESHEET" tile contains data the "Missing" value should display the percentage of timesheets that were not submitted during the selected time period
    And if the "TIMESHEET" tile contains data the sum of the "On Time" percentage and the "Late" percentage should equal 100%

@home @timesheetTile
Feature: Home Page - Timesheet Tile

  Background:
    Given I am logged into Vantage Dashboard

  # Tile visible; tile loaded; On Time/Late/Missing status labels; stacked bar 3 color-coded segments + match legend rows;
  # On Time % visible; Late % visible; Missing % visible; sum of all percentages = 100%;
  # Path "Client Focus" filter → tile remains rendered
  Scenario: Timesheet tile displays status labels, stacked bar, all percentages sum to 100% and reacts to filters
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
    When I note the current state of the "TIMESHEET" tile
    And I open the "Path" filter
    And I select the "Client Focus" option
    And I apply the filter
    Then the "TIMESHEET" tile should reflect data for the applied filter selection

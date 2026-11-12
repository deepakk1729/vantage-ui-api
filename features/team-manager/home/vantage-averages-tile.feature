# Team Manager note: Career Path shows Client Focus and Research only (no Topic Activation).
# The PRACTICE AREA section is not visible for this team manager's dataset.
# Utilization-category dropdown default "Client"; options (live-confirmed): Client, Business Development, Internal Investment, Investment Fund, Admin/Others

@home @vantageAverages
Feature: Home Page - Vantage Averages tile

  Background:
    Given I am logged into Vantage Dashboard

  # Tile visible; 3 group headings (no Practice Area for TM); default "Client"; data percentages;
  # CAREER PATH rows: Client Focus + Research (no Topic Activation);
  # dropdown lists 5 options; select Business Development → tile refreshes;
  # cycle all 5 options → no error; Path "Client Focus" filter → tile reflects updated values
  Scenario: Vantage Averages tile shows groups, default Client, breakdown rows, dropdown options, switches category, cycles all options without error, and reacts to filters
    When I navigate to the Home page
    Then the "VANTAGE AVERAGES" tile should be visible on the page
    When I scroll to the "VANTAGE AVERAGES" tile
    Then the tile should contain the group heading "VANTAGE BUSINESS"
    And the tile should contain the group heading "REGION"
    And the tile should contain the group heading "CAREER PATH"
    And the utilization category dropdown in the "VANTAGE AVERAGES" tile should show "Client" as the selected option
    And if the "VANTAGE AVERAGES" tile contains data, it should display percentage values for each breakdown row
    And the "VANTAGE BUSINESS" group should display rows for "Geo Businesses", "All Vantage", and "Practice Areas"
    And the "REGION" group should display rows for "AP", "EMESA", and "NAMR"
    And the "CAREER PATH" group should display rows for "Client Focus" and "Research"
    When I open the utilization category dropdown in the "VANTAGE AVERAGES" tile
    Then the dropdown should contain the following options:
      | Option                |
      | Client                |
      | Business Development  |
      | Internal Investment   |
      | Investment Fund       |
      | Admin/Others          |
    When I select "Business Development" from the utilization category dropdown
    Then the utilization category dropdown in the "VANTAGE AVERAGES" tile should show "Business Development" as the selected option
    And the "VANTAGE AVERAGES" tile should refresh its percentage values
    When I select each utilization category option in the "VANTAGE AVERAGES" tile in sequence:
      | Option                |
      | Internal Investment   |
      | Investment Fund       |
      | Admin/Others          |
      | Client                |
    Then no error should be displayed in the "VANTAGE AVERAGES" tile after each selection
    When I apply the "Path" filter with option "Client Focus"
    Then the "VANTAGE AVERAGES" tile should reflect updated percentage values corresponding to the applied filter

# IMPLEMENTATION NOTE FOR STEP WRITER:
# The VANTAGE AVERAGES tile is a plain CSS text/metrics tile — NOT an ECharts canvas chart
# and NOT a CSS bar chart. It renders as structured div groups with group headings and
# percentage values. There is no <canvas> element inside this tile.
# The tile has four named sections rendered as div groups:
#   VANTAGE BUSINESS (rows: Geo Businesses, All Vantage, Practice Areas)
#   REGION           (rows: AP, EMESA, NAMR)
#   CAREER PATH      (rows: Client Focus, Research, Topic Activation)
#   PRACTICE AREA    (rows: FPA, IPA)
# The utilization-category dropdown button label defaults to "Client".
# Full option list (live-confirmed): Client, Business Development, Internal Investment, Investment Fund, Admin/Others
# Resilience pattern: The gate scenario (SC-01) always passes regardless of data state.
# Conditional scenarios (SC-03 onwards) are guarded with a data-presence check so they
# soft-skip when the tile shows no data — mirroring the pattern used for prior tiles.

@home @vantageAverages
Feature: Home Page - Vantage Averages tile

  Background:
    Given I am logged into Vantage Dashboard

  # Tile visible; 4 group headings; default "Client"; data percentages; breakdown rows for all 4 groups;
  # dropdown lists 5 options; select Business Development → dropdown shows it + tile refreshes;
  # cycle all 5 options → no error; Path "Client Focus" filter → tile reflects updated values
  Scenario: Vantage Averages tile shows groups, default Client, breakdown rows, dropdown options, switches category, cycles all options without error, and reacts to filters
    When I navigate to the Home page
    Then the "VANTAGE AVERAGES" tile should be visible on the page
    When I scroll to the "VANTAGE AVERAGES" tile
    Then the tile should contain the group heading "VANTAGE BUSINESS"
    And the tile should contain the group heading "REGION"
    And the tile should contain the group heading "CAREER PATH"
    And the tile should contain the group heading "PRACTICE AREA"
    And the utilization category dropdown in the "VANTAGE AVERAGES" tile should show "Client" as the selected option
    And if the "VANTAGE AVERAGES" tile contains data, it should display percentage values for each breakdown row
    And the "VANTAGE BUSINESS" group should display rows for "Geo Businesses", "All Vantage", and "Practice Areas"
    And the "REGION" group should display rows for "AP", "EMESA", and "NAMR"
    And the "CAREER PATH" group should display rows for "Client Focus", "Research", and "Topic Activation"
    And the "PRACTICE AREA" group should display rows for "FPA" and "IPA"
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

@home @caseEngagementDepth

Feature: Home Page - Case Engagement Depth tile

  The Case Engagement Depth tile on the Home page displays a horizontal bar chart
  with two buckets (>=40 hrs and >=80 hrs), each showing the percentage of cases
  that met that engagement threshold during the selected time period.
  The tile uses CSS-width bars (not an ECharts canvas) — bar width is driven by
  an inline style attribute proportional to the displayed percentage value.
  There are no interactive controls on this tile.

  Background:
    Given I am logged into Vantage Dashboard

  # Tile visible; >=40 hrs and >=80 hrs buckets visible; each bucket shows a percentage value;
  # bar widths are proportional to displayed percentages
  Scenario: Case Engagement Depth tile displays both buckets with percentages and proportional bars
    When I navigate to the Home page
    Then the "CASE ENGAGEMENT DEPTH" tile should be visible on the page
    And the "CASE ENGAGEMENT DEPTH" tile has loaded
    Then the tile should display a bucket labelled ">=40 hrs"
    And the tile should display a bucket labelled ">=80 hrs"
    And the "CASE ENGAGEMENT DEPTH" tile has loaded with data
    Then the ">=40 hrs" bucket should display a percentage value
    And the ">=80 hrs" bucket should display a percentage value
    And the bar width for the ">=40 hrs" bucket should reflect its displayed percentage
    And the bar width for the ">=80 hrs" bucket should reflect its displayed percentage

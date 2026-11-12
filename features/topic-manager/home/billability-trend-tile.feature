@home @billability-trend-tile

Feature: Home Page - Billability Trend Tile

  As a Vantage Dashboard user
  I want the Billability Trend tile to display billability data correctly
  So that I can monitor billability percentages by utilization category over time

  Background:
    Given I am logged into Vantage Dashboard

  # Tile visible, stacked bar chart rendered, bar totals rendered, month labels rendered,
  # legend visible + 6 categories + colors match bars, hover segment → canvas still rendered + highlighting,
  # apply Path filter → tile + canvas still rendered
  @display @interaction @filters
  Scenario: Billability Trend tile chart, legend, hover interaction and filter update all work correctly
    When I navigate to the Home page
    Then the Billability Trend tile should be visible
    And the stacked bar graph should display billability percentage by utilization category
    And each monthly stacked bar should display the total billability percentage at the top of the bar
    And each stacked bar in the Billability Trend tile should display the corresponding month label beneath it
    And the legend should display the aggregated billability percentage for each utilization category
    And the legend should show the following utilization categories:
      | Utilization Category |
      | Client               |
      | Business Development |
      | Internal Investment  |
      | Investment Fund      |
      | Admin/Others         |
    And the legend colors should match the corresponding utilization category colors on the stacked bar graph
    And when I hover over a segment in the Billability Trend stacked bar graph
    Then a tooltip should appear displaying the billability percentage for that month's utilization category
    And all bars of the same utilization category should be highlighted
    When I apply a filter on the Home page
    Then the Billability Trend tile should reflect data corresponding to the applied filter

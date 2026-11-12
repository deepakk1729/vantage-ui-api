@home @vantage-pulse-check
Feature: Home Page - Vantage Pulse Check

  Background:
    Given I am logged into Vantage Dashboard

  # Scroll to tile → visible + stacked bar graph + month labels; legend visible + 5 response types + percentages sum 100%;
  # hover segment → tooltip visible + chart still rendered;
  # dropdown default "Overall Satisfaction" + 7 questions; select "Doing interesting work & learning" → graph updates
  Scenario: Vantage Pulse Check tile chart, legend, hover interaction and question dropdown all work correctly
    When I scroll to view the Vantage Pulse Check tile
    Then the Vantage Pulse Check tile should be visible
    And the stacked bar graph should display the number of responses by response type for each month
    And each bar should display the response count at the top with the corresponding month label beneath it
    And the legend should display the aggregated percentage for each response type
    And the legend should show the following response types:
      | Response Type     |
      | Very Satisfied    |
      | Satisfied         |
      | Neutral           |
      | Dissatisfied      |
      | Very Dissatisfied |
    And the percentages displayed in the legend should sum to 100%
    When I hover over a segment in the stacked bar graph
    Then a tooltip should appear displaying the response type and number of responses for that month
    And all segments of the same response type across other months should be highlighted
    Then the survey question dropdown should default to "Overall Satisfaction"
    And the dropdown should contain the following survey questions:
      | Question                              |
      | Overall Satisfaction                  |
      | Doing interesting work & learning     |
      | Have impact on business               |
      | Workload is sustainable               |
      | Experience good team camaraderie      |
      | Acknowledgement from CTs/MDPs        |
      | Supported by my line manager          |
    When I select "Doing interesting work & learning" from the survey question dropdown
    Then the Vantage Pulse Check graph should update to reflect responses for the selected question

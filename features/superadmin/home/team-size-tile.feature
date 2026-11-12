@home @team-size-tile
Feature: Home Page - Team Size Tile

  Background:
    Given I am logged into Vantage Dashboard

  Scenario: Team Size tile displays stacked bar graph with headcount per month by career type
    When I scroll to view the Team Size tile
    Then the Team Size tile should display a stacked bar graph showing headcount per month by career type
    And the total headcount for each month should be displayed at the top of the bar
    And each stacked bar should display the corresponding month label beneath it

  Scenario: Team Size tile legend displays aggregated headcount percentage by career type
    When I scroll to view the Team Size tile
    Then the Team Size tile legend should display the aggregated percentage of total headcount by career type
    And the legend should show the following career types:
      | Career Type       |
      | Topic Activation  |
      | Client Focus      |
      | Research          |
    And the legend colors should match the career type colors used in the stacked bar graph

  Scenario: Team Size tile highlights matching career type segments across months on hover
    Given the Team Size tile has loaded
    When I hover over a segment in the Team Size stacked bar graph
    Then all segments of the same career type across other months should be highlighted

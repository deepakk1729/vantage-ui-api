@home @team-size-tile
Feature: Home Page - Team Size Tile

  As a Vantage Dashboard user
  I want the Team Size tile to display headcount data correctly
  So that I can monitor team composition by career type over time

  Background:
    Given I am logged into Vantage Dashboard

  # Stacked bar + legend + hover tooltip merged into one scenario.
  Scenario: Team Size tile shows stacked bar graph with month labels, legend percentages, and hover highlight
    When I navigate to the Home page
    Then the Team Size tile should display a stacked bar graph showing headcount per month by career type
    And the total headcount for each month should be displayed at the top of the bar
    And each stacked bar should display the corresponding month label beneath it
    And the Team Size tile legend should display the aggregated percentage of total headcount by career type
    And the legend colors should match the career type colors used in the stacked bar graph
    When I hover over a segment in the Team Size stacked bar graph
    Then all segments of the same career type across other months should be highlighted

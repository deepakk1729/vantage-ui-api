@home @filters-location
Feature: Home Page Filters - Location
  As a Vantage Dashboard user
  I want to filter the Home page tiles using the Location filter
  So that I can view data scoped to specific location(s)

  Background:
    Given I am logged into Vantage Dashboard

  # Options + select merged into one scenario.
  Scenario: Location filter shows all options and selecting one updates all tiles
    When I expand the Location filter
    Then the following Location options should be displayed:
      | AP    |
      | EMESA |
      | NAMR  |
    When I select "AP" from the Location options
    And I click Apply in the Location filter
    Then all Home page tiles should display data for the selected Location

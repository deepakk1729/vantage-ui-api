@home @filters-location
Feature: Home Page Filters - Location
  As a Vantage Dashboard user
  I want to filter the Home page tiles using the Location filter
  So that I can view data scoped to specific location(s)

  Background:
    Given I am logged into Vantage Dashboard

  # Expand Location filter → 3 options visible (AP, EMESA, NAMR); panel stays open;
  # select AP + Apply → Billability Trend tile remains visible (tiles updated for selected location)
  Scenario: Location filter shows all options and selecting a location updates all tiles
    When I expand the Location filter
    Then the following Location options should be displayed:
      | AP    |
      | EMESA |
      | NAMR  |
    When I select "AP" from the Location options
    And I click Apply in the Location filter
    Then all Home page tiles should display data for the selected Location

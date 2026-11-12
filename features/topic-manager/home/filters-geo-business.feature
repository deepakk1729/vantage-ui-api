@home @geoBusiness
Feature: Home Page Filters - Geo Business

  Background:
    Given I am logged into Vantage Dashboard

  # Open Geo Business panel → options visible (GRC, LATAM, SEA for this user scope);
  # select GRC + Apply → tiles update (single);
  # re-expand → add LATAM + Apply → tiles update (multi)
  Scenario: Geo Business filter shows all options and single and multi-select both update tiles correctly
    Given I am on the Home page
    When I expand the "Geo Business" filter
    Then the following Geo Business options should be available:
      | option |
      | GRC    |
      | LATAM  |
      | SEA    |
    When I select the option "GRC"
    And I click "Apply"
    Then all tiles should display data values for the selected Geo Business "GRC"
    When I expand the "Geo Business" filter
    And I select the following Geo Business options:
      | option |
      | LATAM  |
      | SEA    |
    And I click "Apply"
    Then all tiles should display data values for the selected Geo Businesses

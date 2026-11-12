@home @geoBusiness
Feature: Home Page Filters - Geo Business

  Background:
    Given I am logged into Vantage Dashboard

  # Options available + single select + multi-select merged into one scenario to
  # share a single browser session and avoid repeated page navigations.
  Scenario: Geo Business filter shows all options and single and multi-select both update tiles correctly
    Given I am on the Home page
    When I expand the "Geo Business" filter
    Then the following Geo Business options should be available:
      | option  |
      | Geo ME  |
      | GRC     |
      | IND     |
      | LATAM   |
      | NEA     |
      | SEA     |
    When I select the option "Geo ME"
    And I click "Apply"
    Then all tiles should display data values for the selected Geo Business "Geo ME"
    When I expand the "Geo Business" filter
    And I select the following Geo Business options:
      | option |
      | GRC    |
      | IND    |
      | LATAM  |
    And I click "Apply"
    Then all tiles should display data values for the selected Geo Businesses

@home @filters-management-model
Feature: Home Page Filters - Management Model
  As a Vantage Dashboard user
  I want to filter the Home page tiles using the Management Model filter
  So that I can view data scoped to specific management model(s)

  Background:
    Given I am logged into Vantage Dashboard

  # Options + single select + multi-select merged into one scenario.
  Scenario: Management Model filter shows all options and single and multi-select both update tiles correctly
    When I expand the Management Model filter
    Then the following Management Model options should be displayed:
      | PA Managed  |
      | Geo Managed |
      | Co Managed  |
    When I select "PA Managed" from the Management Model options
    And I click Apply
    Then all Home page tiles should display data for the selected Management Model
    When I expand the Management Model filter
    And I select "PA Managed" from the Management Model options
    And I select "Geo Managed" from the Management Model options
    And I click Apply
    Then all Home page tiles should display data for the selected Management Models

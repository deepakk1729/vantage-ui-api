@home @filters @path
Feature: Home Page Filters - Path
  As a logged-in user of BCG Vantage Dashboard
  I want to filter the home page data by Path
  So that I can view data specific to one or more paths

  Background:
    Given I am logged into Vantage Dashboard

  # Expand Path filter → 3 options visible (panel stays open);
  # select Client Focus + Apply → panel closes + badge shows count + tiles show filtered data
  Scenario: Path filter shows all options and selecting a path updates all home page tiles
    When I expand the "Path" filter
    Then the following path options should be available:
      | Client Focus     |
      | Research         |
      | Topic Activation |
    When I select the path "Client Focus"
    And I click "Apply" in the Path filter
    Then the Path filter should close
    And the Path filter button should display the count of selected options
    And all home page tiles should display data for the selected path

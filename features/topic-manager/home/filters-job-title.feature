@home @job-title

Feature: Home Page Filters - Job Title

  Background:
    Given I am logged into Vantage Dashboard

  @selection
  Scenario: Selecting a Job Title updates all dashboard tiles
    When I navigate to the Home page
    And I open the "Job Title" filter
    And I select the "Manager" option in the "Job Title" filter on the Home page
    And I click the "Apply" button in the filter panel
    Then the "Job Title" filter button should display a selection count badge
    And all dashboard tiles should display data reflecting the selected Job Title

@people @navigation
Feature: People Tab Navigation

  Background:
    Given I am logged into Vantage Dashboard

  Scenario: Verify People icon expands to show all sub-menu options
    When I click on the "People" button in the left sidebar
    Then a dropdown should appear with the following menu options:
      | Billability   |
      | Timesheets    |
      | Charges/Hours |
      | Bill Rate     |

  Scenario: Verify all People menu options are displayed as tabs on the People page
    When I click on the "People" button in the left sidebar
    And I click on the "Billability" sub-menu option under People
    Then the People page should display all menu options as tabs:
      | Billability   |
      | Timesheets    |
      | Charges/Hours |
      | Bill Rate     |
    And the "Billability" tab should be active

@home @status

Feature: Home Page Filters - Status

  As a Vantage Dashboard user
  I want to filter the Home page tiles using the Status filter
  So that I can view data scoped to specific employee status(es)

  Background:
    Given I am logged into Vantage Dashboard

  # Panel visible + options or "No Record"; Active/LOA/Inactive options present; single select "Active" + Apply → closes + tiles visible;
  # multi select LOA+Inactive + Apply → closes + tiles visible; Select all → all checked; Clear → panel closed
  Scenario: Status filter panel, all options, single/multi select, Select all and Clear all work correctly
    When I expand the "Status" filter
    Then the Status filter panel should be visible
    And the Status filter should display either a list of options or a "No Record" message
    And the Status filter contains at least one option
    Then the following Status options should be available:
      | Active   |
      | LOA      |
      | Inactive |
    When I select a single option from the Status filter
    And I click "Apply" in the Status filter
    Then the Status filter should close
    And all Home page tiles should display data for the selected Status
    When I expand the "Status" filter
    And the Status filter contains at least one option
    And I select multiple options from the Status filter
    And I click "Apply" in the Status filter
    Then the Status filter should close
    And all Home page tiles should display data for the selected Statuses
    When I click the "Reset" button in the filter panel
    And I expand the "Status" filter
    And the Status filter contains at least one option
    And I click "Select all" in the Status filter
    Then all Status options should be checked
    When I click "Clear" in the Status filter
    Then no Status options should be checked

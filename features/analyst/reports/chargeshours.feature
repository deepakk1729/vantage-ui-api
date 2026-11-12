@reports @chargeshours

Feature: Reports - Charges/Hours Page (Personal View)

  As a Vantage Dashboard analyst
  I want to view the Reports Charges/Hours page
  So that I can see my personal charges and hours data

  Background:
    Given I am logged into Vantage Dashboard

  Scenario: Charges/Hours page navigates correctly and displays the full table with all columns
    When I click on the "Reports" icon in the sidebar
    And I click on the "Charges/Hours" menu option
    Then the People Charges Hours header should be visible
    And the page URL should contain "chargesHours"
    And a table of all the users Charges/Hours data should be displayed on the Charges/Hours page
    And the Charges/Hours table should display the following columns:
      | Column               |
      | Name                 |
      | Utilization Category |
      | Project Type         |
      | Project Name         |
      | Client Name          |
      | Charges ($)          |
      | Hours                |
      | Theo Cap Chgs ($)    |

  @filter
  Scenario: Filter panel on Charges/Hours page shows Date Range and Months
    When I navigate to the Reports Charges/Hours page
    Then the FILTERS panel should be visible on the left side of the page
    And the filter panel should contain a "Reset" button
    And the Date Range filter should show "the calendar-year-to-date default" as the default selection
    When I select the month "the most recently available month" in the Months filter
    And I click the "Apply" button in the analyst filter panel
    Then the filter panel should reflect the selected month
    And the Charges/Hours table should still be visible after the filter is applied
    When I click the "Reset" button in the analyst filter panel
    Then the Date Range filter should revert to the default selection

  @export
  Scenario: Export button downloads a valid xlsx file
    When I navigate to the Reports Charges/Hours page
    Then the "Export" button should not be disabled
    When I click the "Export" button on the Charges/Hours page
    Then a file download should be initiated
    And the downloaded file should have the "xlsx" extension
    And the downloaded file should be a non-empty Excel file containing charges/hours data

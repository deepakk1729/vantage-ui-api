@reports @billability

Feature: Reports - Billability Page (Personal View)

  As a Vantage Dashboard analyst
  I want to view the Reports Billability page
  So that I can see my personal monthly billability data

  Background:
    Given I am logged into Vantage Dashboard

  Scenario: Billability page navigates correctly and shows personal monthly data
    When I click on the "Reports" icon in the sidebar
    And I click on the "Billability" menu option
    Then the Billability by Month header should be visible
    And the page URL should contain "billing"
    And the Export button should be visible on the Billability page
    And a table of monthly billability data should be displayed
    And the table should display the following columns on the Billability page:
      | Column             |
      | Month              |
      | Client Billability |
      | CD Billability     |
      | Client Chgs ($K)   |
      | Theo Cap Chgs ($K) |
    And the Billability chart legend should display the following categories:
      | Category              |
      | Client                |
      | Business Development  |
      | Internal Investment   |
      | Investment Fund       |
      | Admin/Others          |

  @filter
  Scenario: Filter panel on Billability page shows Date Range and Months
    When I navigate to the Reports Billability page
    Then the FILTERS panel should be visible on the left side of the page
    And the filter panel should contain a "Reset" button
    And the Date Range filter should show "the calendar-year-to-date default" as the default selection
    When I select the month "the most recently available month" in the Months filter
    And I click the "Apply" button in the analyst filter panel
    Then the filter panel should reflect the selected month
    And the monthly billability table should still be visible
    When I click the "Reset" button in the analyst filter panel
    Then the Date Range filter should revert to the default selection

  @export
  Scenario: Export button downloads a valid xlsx file
    When I navigate to the Reports Billability page
    Then the "Export" button should not be disabled
    When I click the "Export" button on the Billability page
    Then a file download should be initiated
    And the downloaded file should have the "xlsx" extension
    And the downloaded file should be a non-empty Excel file containing billability data

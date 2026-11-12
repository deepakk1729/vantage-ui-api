@people @chargeshours

Feature: People - Charges Hours Page

  As a Vantage Dashboard user
  I want to view the People Charges Hours page
  So that I can analyze charges and hours data by team member

  Background:
    Given I am logged into Vantage Dashboard

  # Sidebar click nav, header, URL, table, all 8 columns
  # ("Non-Converted Hours" column was removed from the app - live-confirmed)

  Scenario: Charges/Hours page navigates correctly and displays the full table with all columns
    When I click on the "People" icon in the sidebar
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

  # Sort By button visible, both options listed, default checked, each option reorders table

  @sort
  Scenario: Sort By control shows both options and each selection correctly reorders the Charges/Hours table
    When I navigate to the People Charges Hours page
    Then the sort button should be displayed above the table on the right side of the Charges/Hours page
    When I click the sort button on the Charges/Hours page
    Then the Charges/Hours sort dropdown should include the following options:
      | Option                      |
      | Charges (highest → lowest)  |
      | Charges (lowest → highest)  |
    And the Charges/Hours sort dropdown should display "Charges (highest → lowest)" as the active selection
    When I select "Charges (highest → lowest)" from the Charges/Hours sort dropdown
    Then the Charges/Hours table should be sorted with the highest charges at the top
    When I click the sort button on the Charges/Hours page
    And I select "Charges (lowest → highest)" from the Charges/Hours sort dropdown
    Then the Charges/Hours table should be sorted with the lowest charges at the top

  # Filter panel: 7 filters (no Practice Area, Geo Business, Status for team manager)

  @filter
  Scenario: Filter panel structure, filter application and Reset all work correctly on the Charges/Hours page
    When I navigate to the People Charges Hours page
    Then the FILTERS panel should be visible on the left side of the page
    And the filter panel should contain a "Reset" button
    And the filter panel should contain the following filters:
      | Filter           |
      | Date Range       |
      | Months           |
      | Name             |
      | Path             |
      | Management Model |
      | Job Title        |
      | Location         |
    And the Date Range filter should revert to "Last 12 Months"
    When I open the "Management Model" filter
    And I select the "PA Managed" option within the "Management Model" filter on the Charges/Hours page
    And I click the "Apply" button in the filter panel
    Then the "Management Model" filter button should display a selection count badge
    And the Charges/Hours table should update to reflect the applied filter
    When I open the "Path" filter
    And I select the "Client Focus" option within the "Path" filter on the Charges/Hours page
    And I click the "Apply" button in the filter panel
    Then the "Path" filter button should display a selection count badge
    And the Charges/Hours table should update to reflect the applied filter
    When I click the "Reset" button in the filter panel
    Then all filter selections should be cleared
    And the Date Range filter should revert to "Last 12 Months"

  # Export button visible and enabled, unfiltered download, with sidebar filter, with column filters

  @export
  Scenario: Export button is enabled and downloads valid xlsx file unfiltered, with sidebar filter and with column filters
    When I navigate to the People Charges Hours page
    Then the "Export" button should be visible above the table on the Charges/Hours page
    And the "Export" button should not be disabled
    When I click the "Export" button on the Charges/Hours page
    Then a file download should be initiated
    And the downloaded file should have the "xlsx" extension
    And the downloaded file should be a non-empty Excel file containing charges/hours data
    When I open the "Management Model" filter
    And I select the "PA Managed" option within the "Management Model" filter on the Charges/Hours page
    And I click the "Apply" button in the filter panel
    Then the "Management Model" filter button should display a selection count badge
    When I click the "Export" button on the Charges/Hours page
    Then a file download should be initiated
    And the downloaded file should have the "xlsx" extension
    And the downloaded file should be a non-empty Excel file containing charges/hours data
    When I click the "Reset" button in the filter panel
    And I apply the "Utilization Category" column filter on the Charges/Hours table
    And I apply the "Project Type" column filter on the Charges/Hours table
    And I click the "Export" button on the Charges/Hours page
    Then a file download should be initiated
    And the downloaded file should have the "xlsx" extension
    And the downloaded file should be a non-empty Excel file containing charges/hours data

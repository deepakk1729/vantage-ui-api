@people @billability

Feature: People - Billability Page

  As a Vantage Dashboard user
  I want to navigate to the People Billability page
  So that I can analyse team member billability data

  Background:
    Given I am logged into Vantage Dashboard

  # Sidebar link, header before/after nav, hover+click nav, URL

  Scenario: Sidebar navigation to People Billability page works correctly
    Then the Billability menu link should be visible in the sidebar
    And the "Billability by Team Member" header should not be visible
    When I hover over the People icon in the sidebar
    And I click on the "Billability" menu option
    Then the Billability page should be displayed with the "Billability by Team Member" header
    And the page URL should contain "billing"

  # Table, 5 columns, bar graph, color indicators, Export button, info tooltip, expand/collapse all, individual row expand

  Scenario: People Billability page layout, expand/collapse and individual row expand all work correctly
    When I navigate to the People Billability page
    Then a table of all team members should be displayed below the header
    And the table should display the following columns:
      | Column             |
      | Name               |
      | Client Billability |
      | CD Billability     |
      | Client Chgs ($K)   |
      | Theo Cap Chgs ($K) |
    And the table should display a billability bar graph column representing the percentage of different billability components
    And the color indicators for all billability components should be displayed above the table on the right side
    And the "Export" button should be displayed above the table on the right side
    When I hover over the info icon next to the "Billability by Team Member" header
    Then a tooltip should be displayed with the message "Billability is calculated using timesheets submitted within the selected date range, regardless of when the corresponding work was performed."
    Then the "Expand all rows" button should be displayed below the header
    When I click the "Expand all rows" button on the Billability by Team Member page
    Then all team member rows in the table should be expanded showing their respective monthly totals
    And the team member table expand button label should change to "Collapse all rows"
    And the month details for each expanded team member row should be displayed in descending order from the latest month to the oldest month of the selected date range
    When I click the "Collapse all rows" button on the Billability by Team Member page
    Then all expanded team member rows should collapse back to the default view
    When I click the expand icon on any team member row
    Then that team member row should expand showing its monthly breakdown
    And the total charges for that team member should be displayed correctly in the expanded view

  # Filter panel structure, Management Model / Path / Status applied, Reset clears and reverts date range

  @filter
  Scenario: Filter panel structure, filter application and Reset all work correctly
    When I navigate to the People Billability page
    Then the FILTERS panel should be visible on the left side of the page
    And the filter panel should contain a "Reset" button
    And the filter panel should contain the following filters:
      | Filter           |
      | Date Range       |
      | Months           |
      | Name             |
      | Practice Area    |
      | Geo Business     |
      | Path             |
      | Management Model |
      | Job Title        |
      | Location         |
      | Status           |
    When I open the "Management Model" filter
    And I click "Clear" within the "Management Model" filter panel
    And I select the "PA Managed" option within the "Management Model" filter on the People Billability page
    And I click the "Apply" button in the filter panel
    Then the "Management Model" filter button should display a selection count badge
    And the team member table should update to reflect the applied filter
    When I open the "Path" filter
    And I click "Clear" within the "Path" filter panel
    And I select the "Client Focus" option within the "Path" filter on the People Billability page
    And I click the "Apply" button in the filter panel
    Then the "Path" filter button should display a selection count badge
    And the team member table should update to reflect the applied filter
    When I open the "Status" filter
    And I click "Clear" within the "Status" filter panel
    And I select the "Active" option within the "Status" filter on the People Billability page
    And I click the "Apply" button in the filter panel
    Then the "Status" filter button should display a selection count badge
    And the team member table should update to reflect the applied filter
    When I click the "Reset" button in the filter panel
    Then all filter selections should be cleared
    And the Date Range filter should revert to "Jan 2025 to Dec 2025"

  # Export button visible and enabled (@gate smoke check)

  @export @gate
  Scenario: Export button is interactable on the Billability by Team Member page
    When I navigate to the People Billability page
    Then the "Export" button should be displayed above the table on the right side
    And the "Export" button should not be disabled

  # Unfiltered download (filename, extension, non-empty), then Management Model / Path / Status filtered downloads

  @export
  Scenario: Export downloads valid xlsx file unfiltered and with each filter applied
    When I navigate to the People Billability page
    And I click the "Export" button on the Billability by Team Member page
    Then a file download should be initiated
    And the downloaded file should have the name "Billability by Team Member.xlsx"
    And the downloaded file should have the ".xlsx" extension
    And the downloaded file should be a non-empty Excel file containing billability data
    When I open the "Management Model" filter
    And I click "Clear" within the "Management Model" filter panel
    And I select the "PA Managed" option within the "Management Model" filter on the People Billability page
    And I click the "Apply" button in the filter panel
    Then the "Management Model" filter button should display a selection count badge
    When I click the "Export" button on the Billability by Team Member page
    Then a file download should be initiated
    And the downloaded file should be a non-empty Excel file containing billability data
    When I click the "Reset" button in the filter panel
    And I open the "Path" filter
    And I click "Clear" within the "Path" filter panel
    And I select the "Client Focus" option within the "Path" filter on the People Billability page
    And I click the "Apply" button in the filter panel
    Then the "Path" filter button should display a selection count badge
    When I click the "Export" button on the Billability by Team Member page
    Then a file download should be initiated
    And the downloaded file should be a non-empty Excel file containing billability data
    When I click the "Reset" button in the filter panel
    And I open the "Status" filter
    And I click "Clear" within the "Status" filter panel
    And I select the "Active" option within the "Status" filter on the People Billability page
    And I click the "Apply" button in the filter panel
    Then the "Status" filter button should display a selection count badge
    When I click the "Export" button on the Billability by Team Member page
    Then a file download should be initiated
    And the downloaded file should be a non-empty Excel file containing billability data

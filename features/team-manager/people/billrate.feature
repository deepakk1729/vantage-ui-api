@people @billrate

Feature: People - Bill Rate Page

  As a Vantage Dashboard user
  I want to view the People Bill Rate page
  So that I can analyze bill rate data by team member

  Background:
    Given I am logged into Vantage Dashboard

  # Sidebar click nav, header, URL, Sort By button visible, table, all 6 columns

  Scenario: Bill Rate page navigates correctly and displays the full table with all columns
    When I click on the "People" icon in the sidebar
    And I click on the "Bill Rate" menu option
    Then the Bill Rate page should be displayed with the "Bill Rate by Team Member" header
    And the page URL should contain "billrate"
    And the Sort By button should be visible on the Bill Rate page
    And a table of all team members Bill Rate data should be displayed on the Bill Rate page
    And the table should display the following columns on the Bill Rate page:
      | Column                   |
      | Name                     |
      | Job Title                |
      | Home Office              |
      | Hourly Bill Rate (USD)   |
      | Hourly Bill Rate (Local) |
      | Local Currency           |

  # Sort By label, default selection, all 6 options listed, each option reorders table

  @sort
  Scenario: Sort By control shows all options and each selection correctly reorders the Bill Rate table
    When I navigate to the People Bill Rate page
    Then the "Sort By:" label should be visible on the Bill Rate page
    And the Bill Rate sort dropdown should display "Bill Rate (highest → lowest)" as the active selection
    When I click the Sort By button on the Bill Rate page
    Then the Bill Rate sort dropdown should include the following options:
      | Option                       |
      | Bill Rate (highest → lowest) |
      | Bill Rate (lowest → highest) |
      | Job Title (Descending)       |
      | Job Title (Ascending)        |
      | Home Office (Descending)     |
      | Home Office (Ascending)      |
    And the Bill Rate sort dropdown should display "Bill Rate (highest → lowest)" as the active selection
    When I select "Job Title (Descending)" from the Bill Rate sort dropdown
    Then the Bill Rate table should be sorted with Job Title in descending order
    When I click the Sort By button on the Bill Rate page
    And I select "Job Title (Ascending)" from the Bill Rate sort dropdown
    Then the Bill Rate table should be sorted with Job Title in ascending order
    When I click the Sort By button on the Bill Rate page
    And I select "Home Office (Descending)" from the Bill Rate sort dropdown
    Then the Bill Rate table should be sorted with Home Office in descending order
    When I click the Sort By button on the Bill Rate page
    And I select "Home Office (Ascending)" from the Bill Rate sort dropdown
    Then the Bill Rate table should be sorted with Home Office in ascending order
    When I click the Sort By button on the Bill Rate page
    And I select "Bill Rate (lowest → highest)" from the Bill Rate sort dropdown
    Then the Bill Rate table should be sorted with the lowest Hourly Bill Rate at the top
    When I click the Sort By button on the Bill Rate page
    And I select "Bill Rate (highest → lowest)" from the Bill Rate sort dropdown
    Then the Bill Rate table should be sorted with the highest Hourly Bill Rate at the top

  # Export button visible and enabled, unfiltered download (filename, extension, non-empty), Management Model filtered download

  @export
  Scenario: Export button is enabled and downloads a valid xlsx file both unfiltered and with a filter applied
    When I navigate to the People Bill Rate page
    Then the "Export" button should be visible above the table on the Bill Rate page
    And the "Export" button should not be disabled
    When I click the "Export" button on the Bill Rate page
    Then a file download should be initiated
    And the downloaded file should have the name "Bill Rate.xlsx"
    And the downloaded file should have the "xlsx" extension
    And the downloaded file should be a non-empty Excel file containing bill rate data
    When I open the "Management Model" filter
    And I click "Clear" within the "Management Model" filter panel
    And I select the "PA Managed" option within the "Management Model" filter on the Bill Rate page
    And I click the "Apply" button in the filter panel
    Then the "Management Model" filter button should display a selection count badge
    When I click the "Export" button on the Bill Rate page
    Then a file download should be initiated
    And the downloaded file should have the "xlsx" extension
    And the downloaded file should be a non-empty Excel file containing bill rate data

  # Filter panel: 5 filters (no Date Range, Months, Practice Area, Geo Business, Status for team manager)

  @filter
  Scenario: Filter panel shows all filters, apply and reset work correctly, clicking outside closes the panel
    When I navigate to the People Bill Rate page
    Then the FILTERS panel should be visible on the left side of the page
    And the filter panel should contain a "Reset" button
    And the filter panel should contain the following filters:
      | Filter           |
      | Name             |
      | Path             |
      | Management Model |
      | Job Title        |
      | Location         |
    And all filter selections should be cleared
    When I open the "Management Model" filter
    And I click "Clear" within the "Management Model" filter panel
    And I select the "PA Managed" option within the "Management Model" filter on the Bill Rate page
    And I click the "Apply" button in the filter panel
    Then the "Management Model" filter button should display a selection count badge
    And the Bill Rate table should update to reflect the applied filter
    When I click the "Reset" button in the filter panel
    Then all filter selections should be cleared
    When I open the "Path" filter
    And I click on the "People" icon in the sidebar
    Then the FILTERS panel should be visible on the left side of the page

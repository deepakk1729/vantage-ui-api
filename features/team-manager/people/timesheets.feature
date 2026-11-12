@people @timesheets

Feature: People - Timesheets Page

  As a Vantage Dashboard user
  I want to view the People Timesheets page
  So that I can review timesheet submission data by team member

  Background:
    Given I am logged into Vantage Dashboard

  # Sidebar nav, header, URL, toggle options, Export visible, Submission Status active by default,
  # data loaded, Name + weekly date columns, On Time/Late/Missing options and rows

  Scenario: Timesheets page navigates correctly and Submission Status view displays with full table
    When I click on the "People" icon in the sidebar
    And I click on the "Timesheets" menu option
    Then the Timesheets page should be displayed on the People Timesheets page
    And the People Timesheets header should be visible
    And the page URL should contain "timesheet"
    And the toggle button on the Timesheets page should display "Submission Status" and "Hours Submitted" options
    And the Export button should be visible on the Timesheets page
    And the "Submission Status" toggle should be active by default on the Timesheets page
    And the Submission Status view should be active with data loaded
    And the Timesheets Submission Status page should display the "Name" column and weekly date columns
    And the "Submission Status" column on the Timesheets Submission Status page should contain the options "On Time", "Late" and "Missing"
    And the Timesheets Submission Status page table should display rows with "On Time", "Late" and "Missing" statuses

  # Switch to Hours Submitted, data loaded, hover tooltip, click cell popup,
  # select different week updates table, dismiss popup with X

  @hoursSubmitted
  Scenario: Hours Submitted view displays correctly with tooltip, popup, week change and dismiss
    When I navigate to the People Timesheets page
    And I click on the "Hours Submitted" toggle on the Timesheets Hours Submitted page
    Then the Hours Submitted view should be displayed on the Timesheets Hours Submitted page
    And the Hours Submitted view should be active with data loaded
    When I hover over a weekly cell on the Timesheets Hours Submitted page
    Then the tooltip should display "View chgs/hrs" on the Timesheets Hours Submitted page
    When I click on a weekly cell on the Timesheets Hours Submitted page
    Then the charges/hours pop-up should appear showing charges and hours for the selected individual
    When I select a different week from the "Week Posted Date" dropdown in the charges/hours pop-up
    Then the charges/hours table in the pop-up should display data for the selected week
    When I click the "X" button to close the charges/hours pop-up
    Then the charges/hours pop-up should disappear

  # Filter panel: 7 filters (no Practice Area, Geo Business, Status for team manager),
  # Management Model on Submission Status and Hours Submitted,
  # Path filter persists on view switch, Reset clears + reverts, click outside closes

  @filter
  Scenario: Filter panel structure, filters on both views, persistence across toggle and Reset all work correctly
    When I click on the "People" icon in the sidebar
    And I click on the "Timesheets" menu option
    Then the FILTERS panel should be visible on the left side of the page
    And the filter panel should contain a "Reset" button
    And the filter panel should contain the following filters:
      | Date Range       |
      | Months           |
      | Name             |
      | Path             |
      | Management Model |
      | Job Title        |
      | Location         |
    And the Date Range filter should show "Jan 2025 to Dec 2025" as the default selection
    When I open the "Management Model" filter
    And I select the "PA Managed" option within the "Management Model" filter on the Timesheets page
    And I click the "Apply" button in the filter panel
    Then the "Management Model" filter button should display a selection count badge
    And the Submission Status table should update to reflect the applied filter
    When I click on the "Hours Submitted" toggle on the Timesheets Hours Submitted page
    Then the "Management Model" filter button should display a selection count badge
    And the Hours Submitted table should update to reflect the applied filter
    When I navigate to the People Timesheets page
    And I open the "Path" filter
    And I select the "Client Focus" option within the "Path" filter on the Timesheets page
    And I click the "Apply" button in the filter panel
    And I click on the "Hours Submitted" toggle on the Timesheets Hours Submitted page
    Then the "Path" filter button should display a selection count badge
    And the Hours Submitted table should update to reflect the applied filter
    When I click the "Reset" button in the filter panel
    Then all filter selections should be cleared
    And the Date Range filter should revert to "Last 12 Months"
    When I open the "Path" filter
    And I click outside the filter panel on the Timesheets page
    Then the "Path" filter panel should be closed on the Timesheets page

  # Export not disabled, Submission Status download (filename + extension),
  # Hours Submitted download, with Management Model filter on both views

  @export
  Scenario: Export button downloads valid xlsx on Submission Status and Hours Submitted views both filtered and unfiltered
    When I click on the "People" icon in the sidebar
    And I click on the "Timesheets" menu option
    Then the "Export" button should not be disabled
    When I click the "Export" button on the Timesheets page
    Then a file download should be initiated
    And the downloaded file should have the name "Timesheet.xlsx"
    And the downloaded file should have the "xlsx" extension
    When I click on the "Hours Submitted" toggle on the Timesheets Hours Submitted page
    And I click the "Export" button on the Timesheets page
    Then a file download should be initiated
    And the downloaded file should have the name "Timesheet.xlsx"
    And the downloaded file should have the "xlsx" extension
    When I navigate to the People Timesheets page
    And I open the "Management Model" filter
    And I select the "PA Managed" option within the "Management Model" filter on the Timesheets page
    And I click the "Apply" button in the filter panel
    And I click the "Export" button on the Timesheets page
    Then a file download should be initiated
    And the downloaded file should have the name "Timesheet.xlsx"
    And the downloaded file should be a non-empty Excel file containing filtered timesheet data
    When I navigate to the People Timesheets page
    And I click on the "Hours Submitted" toggle on the Timesheets Hours Submitted page
    And I open the "Management Model" filter
    And I select the "PA Managed" option within the "Management Model" filter on the Timesheets page
    And I click the "Apply" button in the filter panel
    And I click the "Export" button on the Timesheets page
    Then a file download should be initiated
    And the downloaded file should have the name "Timesheet.xlsx"
    And the downloaded file should be a non-empty Excel file containing filtered timesheet data

@reports @timesheets

Feature: Reports - Timesheets Page (Personal View)

  As a Vantage Dashboard analyst
  I want to view the Reports Timesheets page
  So that I can see my personal timesheet submission status

  Background:
    Given I am logged into Vantage Dashboard

  Scenario: Timesheets page navigates correctly and shows personal submission status
    When I click on the "Reports" icon in the sidebar
    And I click on the "Timesheets" menu option
    Then the Submission Status by Timesheet header should be visible
    And the page URL should contain "timesheet"
    And the Export button should be visible on the Timesheets page
    And the personal timesheet submission status row should be visible
    And the submission status row should display weekly date column headers

  @export
  Scenario: Export button downloads a valid xlsx file
    When I navigate to the Reports Timesheets page
    Then the "Export" button should not be disabled
    When I click the "Export" button on the Timesheets page
    Then a file download should be initiated
    And the downloaded file should have the "xlsx" extension
    And the downloaded file should be a non-empty Excel file containing timesheet data

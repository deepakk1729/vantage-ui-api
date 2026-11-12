@businessComparison @billability

Feature: Business Comparison - Billability Page

  As a Vantage Dashboard user
  I want to view the Business Comparison Billability page
  So that I can compare billability across business units

  Background:
    Given I am logged into Vantage Dashboard

  # Sidebar click → BC Billability submenu visible → URL "business/billing", breadcrumb, heading, info icon + tooltip,
  # Sort By default "Client BB (highest → lowest)", Export button, legend 5 categories,
  # 4 table columns + bar chart segments, business rows with values, Practice Area Total / Grand Total (no Geo Business Total —
  # Topic Manager is scoped to a single PA), Expand all rows button, filter panel + Reset + 10 filters
  Scenario: Sidebar navigation, page layout, all columns, summary rows, legend, sort control and filter panel are all correct
    When I click the "Business Comparison" button in the left sidebar
    Then a "Billability" sub-menu option should be visible under Business Comparison
    When I click the "Billability" sub-menu option
    Then the page title should be "Billability by Business"
    And the page URL should contain "business/billing"
    And the breadcrumb should show "Home > Business Comparison > Billability"
    And the heading "Billability by Business" should be visible on the page
    And an info icon should be visible next to the "Billability by Business" heading
    When I hover over the info icon next to the "Billability by Business" heading
    Then a tooltip should appear displaying the text "Billability is calculated using timesheets submitted within the selected date range, regardless of when the corresponding work was performed."
    And the "Sort By:" control should display "Client BB (highest → lowest)" as the active selection
    And an "Export" button should be visible above the table
    And the billability component legend should be displayed above the table
    And the legend should contain the following categories:
      | Category              |
      | Client                |
      | Business Development  |
      | Internal Investment   |
      | Investment Fund       |
      | Admin/Others          |
    And the data table should contain the following columns:
      | Column header         |
      | Business              |
      | Client Billability    |
      | Client Chgs ($K)      |
      | Theo Cap Chgs ($K)    |
    And each row in the table should display a billability bar chart segment representing the percentage breakdown of billability components
    And the data table should contain at least one business row
    And each business row should display a business name, a Client Billability percentage, a Client Chgs value, a Theo Cap Chgs value, and a billability bar
    And the table should contain a "Practice Area Total" summary row
    And the table should contain a "Grand Total" summary row
    And the "Expand all rows" button should be visible in the table toolbar
    And the FILTERS panel should be visible on the left side of the page
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

  # Sort By dropdown 2 options + default; expand all → topics visible + label "Collapse all rows";
  # collapse all → collapsed + label "Expand all rows"; individual row expand → that row expanded, others collapsed;
  # expand all → topic rows with Client Billability/Client Chgs/Theo Cap Chgs values
  # (Topic Manager is scoped to one PA / one topic "Procurement" with no sub-topics — sub-topic assertions omitted)
  @sort @expandCollapse
  Scenario: Sort By control shows all options and Expand/Collapse all and individual row expand work correctly
    When I navigate to the Business Comparison Billability page
    And I click the "Sort By:" dropdown button
    Then the sort options should include:
      | Sort option                    |
      | Client BB (highest → lowest)   |
      | Client BB (lowest → highest)   |
    And the "Sort By:" control should display "Client BB (highest → lowest)" as the active selection
    When I click the "Expand all rows" button
    Then all business rows in the table should be expanded
    And each expanded business row should reveal its topic-level rows with individual totals
    And the button label should change to "Collapse all rows"
    And each expanded business row should display topic-level rows with Client Billability, Client Chgs, and Theo Cap Chgs values
    When I click the "Collapse all rows" button
    Then all business rows should be collapsed back to the default view
    And the button label should change back to "Expand all rows"
    When expandable business rows are present in the table
    And I click the expand icon on any individual business row
    Then that business row should expand to reveal its topic-level rows
    And other business rows should remain in their current collapsed state

  # Default date range is calendar-year-to-date (Jan of the "Data as of" year through that
  # month - live-confirmed, not a true trailing-12-month window); Path "Client Focus" + Apply
  # → badge + table + Grand Total; MM "PA Managed" + Apply → badge; Status "Active" + Apply →
  # badge; Reset → all cleared + date reverts + no badge + unfiltered; Clear within MM →
  # deselected; Date Range Last 6 → Apply → label + closed + table; Last 12 → Apply → label + table;
  # Path Select all → all selected
  @filters
  Scenario: Filter default state, apply Path/MM/Status, Reset, Clear, Date Range Last N and Trailing 12, and Select all all work correctly
    When I navigate to the Business Comparison Billability page
    Then the Date Range filter should show "the calendar-year-to-date default" as the default selection
    When I open the "Path" filter
    And I select the "Client Focus" option
    And I click the "Apply" button in the filter panel
    Then the "Path" filter button should display a selection count badge
    And the table should update to show billability data for the "Client Focus" path only
    And the Grand Total row should reflect the filtered data
    When I open the "Management Model" filter
    And I select the "PA Managed" option
    And I click the "Apply" button in the filter panel
    Then the "Management Model" filter button should display a selection count badge
    And the table should update to show billability data for the "PA Managed" management model only
    When I open the "Status" filter
    And I select the "Active" option
    And I click the "Apply" button in the filter panel
    Then the "Status" filter button should display a selection count badge
    And the table should update to show billability data for "Active" employees only
    When I click the "Reset" button in the filter panel
    Then all filter selections should be cleared
    And the Date Range filter should revert to "Last 12 months"
    And the "Path" filter button should no longer display a selection count badge
    And the table should display unfiltered billability data
    When I open the "Management Model" filter
    And I select the "Geo Managed" option
    And I click "Clear" within the "Management Model" filter panel
    Then all options within the "Management Model" filter should be deselected
    When I open the Date Range filter
    And I select the "Last" months option and enter "6" months
    And I click the "Apply" button in the filter panel
    Then the Date Range filter label should update to reflect a 6-month range
    And the filter panel should close after applying
    And the table should update to show billability data for the last 6 months
    When I open the Date Range filter
    And I select the "Last" months option and enter "12" months
    And I click the "Apply" button in the filter panel
    Then the Date Range filter label should update to reflect a 12-month range
    And the table should update to show billability data for the last 12 months
    When I open the "Path" filter
    And I click "Select all" within the "Path" filter panel
    Then all options in the "Path" filter should be selected

  # Export button visible + enabled; unfiltered download → filename "Billability by Business.xlsx" + ".xlsx" + non-empty;
  # Path "Client Focus" filtered export; Reset + Status "Active" filtered export; Reset + MM "PA Managed" filtered export
  @export
  Scenario: Export button is enabled and downloads valid xlsx file unfiltered and with each filter applied
    When I navigate to the Business Comparison Billability page
    Then the "Export" button should be visible above the table
    And the "Export" button should not be disabled
    When I click the "Export" button
    Then a file download should be initiated
    And the downloaded file should have the name "Billability by Business.xlsx"
    And the downloaded file should have the ".xlsx" extension
    And the downloaded file should be a non-empty Excel file containing billability data
    When I open the "Path" filter
    And I select the "Client Focus" option
    And I click the "Apply" button in the filter panel
    Then the "Path" filter button should display a selection count badge
    When I click the "Export" button
    Then a file download should be initiated
    And the downloaded file should be a non-empty Excel file containing billability data filtered to the "Client Focus" path
    When I click the "Reset" button in the filter panel
    And I open the "Status" filter
    And I select the "Active" option
    And I click the "Apply" button in the filter panel
    Then the "Status" filter button should display a selection count badge
    When I click the "Export" button
    Then a file download should be initiated
    And the downloaded file should be a non-empty Excel file containing billability data filtered to "Active" employees only
    When I click the "Reset" button in the filter panel
    And I open the "Management Model" filter
    And I select the "PA Managed" option
    And I click the "Apply" button in the filter panel
    Then the "Management Model" filter button should display a selection count badge
    When I click the "Export" button
    Then a file download should be initiated
    And the downloaded file should be a non-empty Excel file containing billability data for "PA Managed" employees only

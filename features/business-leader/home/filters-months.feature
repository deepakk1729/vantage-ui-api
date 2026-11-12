@home @months
Feature: Home Page Filters - Months

  Background:
    Given I am logged into Vantage Dashboard

  # ── Date Range - Months: valid inputs ──────────────────────────────────────────
  # Open → Last months → enter 3 → Apply → close + label; open → 3.5 → Apply → close + label
  @date-range
  Scenario: Valid and decimal Last-months inputs are accepted and apply the date range
    When I open the "Date Range" filter
    And I select the "Last" months radio option
    And I enter "3" in the Last months input field
    And I click "Apply" on the Date Range filter
    Then the dashboard should display data from the last 3 months
    And the Date Range filter should close after applying
    And the filter label should update to reflect the selected date range
    When I open the "Date Range" filter
    And I select the "Last" months radio option
    And I enter "3.5" in the Last months input field
    And I click "Apply" on the Date Range filter
    Then the Date Range filter should close after applying
    And the filter label should update to reflect the selected date range

  # ── Date Range - Months: invalid inputs ─────────────────────────────────────────
  # Empty → Apply disabled; then enter 0 / -3 / 25 / abc → inline error each time
  # NOTE: The app shows inline validation errors on input — no Apply click needed.
  # Clicking Apply with an invalid/empty value closes the panel without showing an error.
  @date-range
  Scenario: Empty and out-of-range Last-months inputs are rejected with appropriate feedback
    When I open the "Date Range" filter
    And I select the "Last" months radio option
    And I clear the Last months input field
    Then the Apply button on the Date Range filter should be disabled
    And the Date Range filter should not be applied
    When I enter "0" in the Last months input field
    Then an error message should appear
    And the Date Range filter should not be applied
    When I enter "-3" in the Last months input field
    Then an error message should appear
    And the Date Range filter should not be applied
    When I enter "25" in the Last months input field
    Then an error message should appear
    And the Date Range filter should not be applied
    When I enter "abc" in the Last months input field
    Then an error message should appear
    And the Date Range filter should not be applied

  # ── Date Range - Weeks: valid inputs ──────────────────────────────────────────
  @date-range @weeks-filter
  Scenario: Valid Last-weeks input applies the date range
    When I open the "Date Range" filter
    And I select the "Last" weeks radio option
    And I enter "5" in the Last weeks input field
    And I click "Apply" on the Date Range filter
    Then the dashboard should display data from the last 5 weeks
    And the Date Range filter should close after applying
    And the filter label should update to reflect the selected date range

  @date-range @weeks-filter
  Scenario: Decimal Last-weeks input is accepted and applies the date range
    When I open the "Date Range" filter
    And I select the "Last" weeks radio option
    And I enter "3.5" in the Last weeks input field
    And I click "Apply" on the Date Range filter
    Then the Date Range filter should close after applying
    And the filter label should update to reflect the selected date range

  # ── Date Range - Weeks: invalid inputs ──────────────────────────────────────────
  # Empty → Apply disabled; then enter 0 / -3 / 105 / abc → inline error each time
  @date-range @weeks-filter
  Scenario: Empty and out-of-range Last-weeks inputs are rejected with appropriate feedback
    When I open the "Date Range" filter
    And I select the "Last" weeks radio option
    And I clear the Last weeks input field
    Then the Apply button on the Date Range filter should be disabled
    And the Date Range filter should not be applied
    When I enter "0" in the Last weeks input field
    Then an error message should appear
    And the Date Range filter should not be applied
    When I enter "-3" in the Last weeks input field
    Then an error message should appear
    And the Date Range filter should not be applied
    When I enter "105" in the Last weeks input field
    Then an error message should appear
    And the Date Range filter should not be applied
    When I enter "abc" in the Last weeks input field
    Then an error message should appear
    And the Date Range filter should not be applied

  # ── Date Range - Last 12 months ─────────────────────────────────────────────────
  # "Trailing 12 months" radio was removed from the app (live-confirmed) - only
  # Last months / Last weeks / Custom remain, so this uses "Last" months with 12.
  @date-range @trailing-filter
  Scenario: Last 12 months option applies the date range and updates the filter label
    When I open the "Date Range" filter
    And I select the "Last" months radio option
    And I enter "12" in the Last months input field
    And I click "Apply" on the Date Range filter
    Then the dashboard should display data from the last 12 months
    And the Date Range filter should close after applying
    And the filter label should update to reflect the selected date range

  # ── Date Range - Custom: full flow in one scenario ──────────────────────────────
  # open Custom → pre-filled 12 months; set Mar-Sep → Apply → close + label;
  # reopen → retained Mar-Sep; highlight check;
  # invalid Sep→Jun Apply disabled; invalid Nov→Sep Apply disabled
  @date-range @custom-filter
  Scenario: Custom date range reveals pre-filled pickers, applies valid range, retains values on reopen and rejects invalid ranges
    When I open the "Date Range" filter
    And I select the "Custom" date range option
    Then the Date Range filter should be pre-filled with the last 12 months date range
    When I set the custom start date to "Mar 2025"
    And I set the custom end date to "Sep 2025"
    And I click "Apply" on the Date Range filter
    Then the Date Range filter should close after applying
    And the filter label should update to reflect the selected date range
    When I open the "Date Range" filter
    Then the custom date range should be retained when the Date Range filter is reopened
    And the calendar should highlight the selected months
    When I set the custom start date to "Sep 2025"
    And I set the custom end date to "Jun 2025"
    Then the Apply button on the Date Range filter should be disabled
    And the Date Range filter should not be applied
    When I set the custom start date to "Nov 2025"
    And I set the custom end date to "Sep 2025"
    Then the Apply button on the Date Range filter should be disabled
    And the Date Range filter should not be applied
    When I set the custom start date to "Jan 2025"
    Then the calendar should highlight the selected months

  # ── Months filter: month list and week expansion ─────────────────────────────────
  # Open Months → calendar-year-to-date months listed in descending order (live-confirmed
  # default is Jan-of-year through current month, not a true trailing 12); expand the most
  # recent month → click → all weeks selected
  @months-filter
  Scenario: Months filter lists all months in the default LTM range and week expansion works
    When I open the "Months" filter
    Then the options should display the months within the default LTM date range in descending order
    And the months displayed should be "the calendar-year-to-date list, most recent first"
    When I expand a month option in the Months filter
    And I click on the month option
    Then all weeks that fall under the selected month should be selected

  # ── Months filter: date range update affects month options ───────────────────────
  @months-filter
  Scenario: Months filter options update when the active date range is changed
    When I open the "Date Range" filter
    And I update the date range to a different period
    And I apply the date range filter
    And I open the "Months" filter
    Then the options should display the months within the updated date range in descending order

  # ── Months filter: selecting a month applies filter and updates dashboard ─────────
  # Clear → select the most recently available month → Apply → dashboard shows month data;
  # apply that month → Name filter updates + People pages show only active
  @months-filter
  Scenario: Selecting and applying a month in the Months filter updates the dashboard and related filters
    When I open the "Months" filter
    And I click "Clear" on the Months filter
    And I select the month "the most recently available month"
    And I click "Apply" on the Months filter
    Then the dashboard should display the data corresponding to the selected month
    And the "Name" filter should update to show only options for individuals who were active during the selected month
    And the People pages should only display rows for individuals who were active during the selected month

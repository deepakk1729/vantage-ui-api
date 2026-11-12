@home @practice-area
Feature: Home Page Filters - Practice Area

  Background:
    Given I am logged into Vantage Dashboard

  # Expandable check + select + apply merged into one scenario.
  # BL accounts start with all PAs pre-selected (Hauke's scope = 3 PAs).
  # Deselecting from all-selected does not produce a badge — app only badges when
  # selecting from a zero-selected state.  "Select all" toggles all off (since all start
  # checked), then we check just one PA, which produces a badge reliably.
  @expandable @selection
  Scenario: Practice Area filter options are expandable and selecting one updates all dashboard tiles
    When I navigate to the Home page
    And I open the "Practice Area" filter
    Then each Practice Area option should be expandable to reveal its topics and sub-topics
    When I click "Select all" within the "Practice Area" filter panel
    And I select the "Tech and Digital Advantage" option in the "Practice Area" filter on the Home page
    And I click the "Apply" button in the filter panel
    Then the "Practice Area" filter button should display a selection count badge
    And all dashboard tiles should display data reflecting the selected Practice Area

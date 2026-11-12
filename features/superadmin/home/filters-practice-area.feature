@home @practice-area

Feature: Home Page Filters - Practice Area

  Background:
    Given I am logged into Vantage Dashboard

  # Open PA filter → each top-level option has expand toggle → expand first → child topics visible;
  # reopen PA filter → select Consumer + Apply → badge visible + Billability Trend tile remains visible
  @expandable @selection
  Scenario: Practice Area filter options are expandable and selecting a PA updates all dashboard tiles
    When I navigate to the Home page
    And I open the "Practice Area" filter
    Then each Practice Area option should be expandable to reveal its topics and sub-topics
    And I select the "Consumer" option in the "Practice Area" filter on the Home page
    And I click the "Apply" button in the filter panel
    Then the "Practice Area" filter button should display a selection count badge
    And all dashboard tiles should display data reflecting the selected Practice Area

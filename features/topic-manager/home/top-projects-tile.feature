@home @topProjects
Feature: Home Page - Top Projects Tile

  # Tile type: plain CSS div-based table (NOT an ECharts canvas, NOT a CSS bar chart).
  # Tile container CSS class: "home_page_main_split_row_top_projects main_conatiner"
  # Table wrapper CSS class: "chart__table"
  # Header CSS class: "chart__table__header"
  # Column CSS classes: .topClient (PROJECT NAME), .charges (CHARGES ($K)), .topClienthours (HOURS)
  # Body CSS class: "chart__table__body data_table_body"
  # Row CSS class: "data_table_body_row"
  # Utilization-category dropdown: button.dropdown-toggle.btn.btn-primary inside ".kt-drop-down-container"
  #   Default selected: "Client"
  #   All options (in menu order, live-confirmed): Client (default/selected), Business Development, Internal Investment, Investment Fund, Admin/Others
  # Dropdown items CSS class: "dropdown-item" (anchor tags)
  # Resilience pattern:
  #   - The gate scenario always passes regardless of data state (empty or populated).
  #   - Structure and dropdown scenarios are data-independent.
  #   - Populated-data scenarios are guarded so the implementer can soft-skip them
  #     when the tile renders "No data to display".

  Background:
    Given I am logged into Vantage Dashboard

  # Tile visible; default "Client" dropdown; PROJECT NAME/CHARGES/HOURS columns;
  # open dropdown → 5 options; select Business Development/Internal Investment/Investment Fund/Admin/Others each updates tile;
  # at most 10 rows; sorted highest→lowest by CHARGES; each row has name+charges+hours;
  # CHARGES + HOURS columns numeric; Path "Client Focus" filter → tile remains rendered
  Scenario: Top Projects tile is visible, has correct default, columns, all dropdown options update tile, data rows are correct, and filter reactivity works
    When I navigate to the Home page
    Then the "TOP PROJECTS" tile should be visible on the page
    When I scroll to the "TOP PROJECTS" tile
    Then the utilization category dropdown in the "TOP PROJECTS" tile should show "Client" as the selected option
    And the "TOP PROJECTS" tile should display the following column headers
      | PROJECT NAME |
      | CHARGES ($K) |
      | HOURS        |
    And if the "TOP PROJECTS" tile contains data it should display at most 10 project rows
    And if the "TOP PROJECTS" tile contains data the rows should be sorted from highest to lowest by the "CHARGES ($K)" column
    And if the "TOP PROJECTS" tile contains data each row should display a non-empty project name, a numeric charges value, and a numeric hours value
    And if the "TOP PROJECTS" tile contains data the "CHARGES ($K)" column should display numeric values representing total Client charges for each project
    And if the "TOP PROJECTS" tile contains data the "HOURS" column should display numeric values representing total Client hours worked for each project
    When I open the utilization category dropdown in the "TOP PROJECTS" tile
    Then the dropdown should contain the following options
      | Client                |
      | Business Development  |
      | Internal Investment   |
      | Investment Fund       |
      | Admin/Others          |
    When I select "Business Development" from the utilization category dropdown in the "TOP PROJECTS" tile
    Then the "TOP PROJECTS" tile should display project data for the "Business Development" utilization category
    When I open the utilization category dropdown in the "TOP PROJECTS" tile
    And I select "Internal Investment" from the utilization category dropdown in the "TOP PROJECTS" tile
    Then the "TOP PROJECTS" tile should display project data for the "Internal Investment" utilization category
    When I open the utilization category dropdown in the "TOP PROJECTS" tile
    And I select "Investment Fund" from the utilization category dropdown in the "TOP PROJECTS" tile
    Then the "TOP PROJECTS" tile should display project data for the "Investment Fund" utilization category
    When I open the utilization category dropdown in the "TOP PROJECTS" tile
    And I select "Admin/Others" from the utilization category dropdown in the "TOP PROJECTS" tile
    Then the "TOP PROJECTS" tile should display project data for the "Admin/Others" utilization category
    When I open the utilization category dropdown in the "TOP PROJECTS" tile
    And I select "Client" from the utilization category dropdown in the "TOP PROJECTS" tile
    Then the "TOP PROJECTS" tile should display project data for the "Client" utilization category
    When I note the current project names displayed in the "TOP PROJECTS" tile
    And I apply the "Path" filter selecting "Client Focus"
    And I scroll to the "TOP PROJECTS" tile
    Then the "TOP PROJECTS" tile should refresh and reflect data matching the applied filter

@home @knMaterial
Feature: Home Page - KN Material Tile

  The KN MATERIAL tile on the Home page displays a table of material categories
  alongside the published material count for each category, sorted from highest
  to lowest by count. The tile responds to the active filter context but has no
  interactive controls of its own.

  Background:
    Given I am logged into Vantage Dashboard

  # Tile visible; MATERIAL TYPE + COUNT columns; rows sorted highest→lowest by COUNT;
  # each row has a non-empty category name + numeric count; Path "Client Focus" applied → tile remains rendered
  Scenario: KN MATERIAL tile is visible, has correct columns, sorted data rows and reacts to filters
    When I navigate to the Home page
    And I scroll to the "KN MATERIAL" tile
    Then the "KN MATERIAL" tile should be visible on the page
    And the "KN MATERIAL" tile should display a table with the following columns
      | Column        |
      | MATERIAL TYPE |
      | COUNT         |
    And if the "KN MATERIAL" tile contains data rows the rows should be sorted from highest to lowest by the "COUNT" value
    And if the "KN MATERIAL" tile contains data rows each row should display a material category name in the "MATERIAL TYPE" column and a numeric count in the "COUNT" column
    When I note the current state of the "KN MATERIAL" tile
    And I open the "Path" filter
    And I select the "Client Focus" option
    And I apply the filter
    Then the "KN MATERIAL" tile should reflect data for the applied filter selection

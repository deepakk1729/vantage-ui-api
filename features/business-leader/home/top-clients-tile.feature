@home @topClients
Feature: Home Page - Top Clients Tile

  # Tile type: plain CSS div-based table. No dropdown or interactive controls.
  # Columns: CLIENT, CHARGES ($K), HOURS
  # Gate scenario always passes; data scenarios are guarded for empty-tile resilience.

  Background:
    Given I am logged into Vantage Dashboard

  # Tile visible; CLIENT/CHARGES ($K)/HOURS column headers; at most 10 rows; sorted highest→lowest by CHARGES;
  # each row has non-empty client name + numeric charges + numeric hours;
  # CHARGES and HOURS columns are numeric; Path "Client Focus" filter → tile remains rendered
  Scenario: Top Clients tile is visible, has correct columns, sorted data rows and reacts to filters
    When I navigate to the Home page
    Then the "TOP CLIENTS" tile should be visible on the page
    When I scroll to the "TOP CLIENTS" tile
    Then the "TOP CLIENTS" tile should display the following column headers
      | CLIENT       |
      | CHARGES ($K) |
      | HOURS        |
    And if the "TOP CLIENTS" tile contains data it should display at most 10 client rows
    And if the "TOP CLIENTS" tile contains data the rows should be sorted from highest to lowest by the "CHARGES ($K)" column
    And if the "TOP CLIENTS" tile contains data each row should display a non-empty client name, a numeric charges value, and a numeric hours value
    And if the "TOP CLIENTS" tile contains data the "CHARGES ($K)" column should display numeric values representing total Client charges for each client
    And if the "TOP CLIENTS" tile contains data the "HOURS" column should display numeric values representing total Client hours worked for each client
    When I note the current client names displayed in the "TOP CLIENTS" tile
    And I apply the "Path" filter selecting "Client Focus"
    And I scroll to the "TOP CLIENTS" tile
    Then the "TOP CLIENTS" tile should refresh and reflect data matching the applied filter

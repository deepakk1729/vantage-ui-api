@home @top-downloads

Feature: Home Page - Top Downloads Tile

  As a Vantage Dashboard user
  I want to view the Top Downloads tile on the Home page
  So that I can see the most downloaded KN materials during the selected time period

  Background:
    Given I am logged into Vantage Dashboard

  # Tile visible; top 10 KN materials present; TITLE + DOWNLOAD column headers visible;
  # DOWNLOAD column shows total downloads per material for the selected time period
  @display
  Scenario: Top Downloads tile displays top 10 materials with correct columns and download counts
    When I scroll to the Top Downloads tile on the Home page
    Then the Top Downloads tile should be visible
    And the tile should display the top 10 most downloaded KN materials during the selected time period
    And each row in the Top Downloads table should display the material's Title and Download count
    And the DOWNLOAD column should display the total number of downloads for each material based on the selected time period

  # Click first material link → Knowledge Navigator page opens in a new tab with a valid URL
  @navigation
  Scenario: Clicking a link in the Top Downloads tile opens the corresponding Knowledge Navigator page in a new tab
    When I scroll to the Top Downloads tile on the Home page
    And I click on a material link in the Top Downloads tile
    Then the corresponding Knowledge Navigator page should open in a new tab

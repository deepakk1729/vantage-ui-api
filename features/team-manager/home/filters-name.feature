@home @filters @name
Feature: Home Page Filters - Name
  As a logged-in user of BCG Vantage Dashboard
  I want to filter the home page data by team member Name
  So that I can view data specific to a selected individual

  Background:
    Given I am logged into Vantage Dashboard

  # Expand Name filter → select first user → Apply → panel closes + tiles show user data;
  # re-expand → type "a" in search bar → collection list filters to matching results
  Scenario: Name filter allows user selection with apply and has a dynamic search bar
    When I expand the "Name" filter
    And I select a user from the Name filter collection list
    And I click "Apply" in the Name filter
    Then the Name filter should close
    And all home page tiles should display data for the selected user
    When I expand the "Name" filter
    And I type a partial name into the Name filter search bar
    Then the Name filter collection list should filter results based on each letter typed

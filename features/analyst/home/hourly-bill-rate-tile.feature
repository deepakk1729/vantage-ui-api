@home @hourly-bill-rate

Feature: Home Page - Hourly Bill Rate Personal Tile

  As a Vantage Dashboard user
  I want the Hourly Bill Rate tile to display my personal hourly bill rate
  So that I can quickly see my bill rate

  Background:
    Given I am logged into Vantage Dashboard

  Scenario: Hourly Bill Rate tile is visible and shows a USD value
    When I navigate to the Home page
    Then the Hourly Bill Rate tile should be visible on the Home page
    And the Hourly Bill Rate tile should display a dollar value in USD

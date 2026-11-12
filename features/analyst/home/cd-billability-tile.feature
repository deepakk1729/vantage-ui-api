@home @cd-billability

Feature: Home Page - CD Billability Personal Tile

  As a Vantage Dashboard user
  I want the CD Billability tile to display my personal CD billability percentage
  So that I can quickly see my CD billability

  Background:
    Given I am logged into Vantage Dashboard

  Scenario: CD Billability tile is visible and shows a percentage
    When I navigate to the Home page
    Then the CD Billability tile should be visible on the Home page
    And the CD Billability tile should display a percentage value

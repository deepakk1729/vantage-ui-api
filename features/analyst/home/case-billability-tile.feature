@home @case-billability

Feature: Home Page - Case Billability Personal Tile

  As a Vantage Dashboard user
  I want the Case Billability tile to display my personal billability percentage
  So that I can quickly see my case billability

  Background:
    Given I am logged into Vantage Dashboard

  Scenario: Case Billability tile is visible and shows a percentage
    When I navigate to the Home page
    Then the Case Billability tile should be visible on the Home page
    And the Case Billability tile should display a percentage value

Feature: Sauce Demo catalog
  Shoppers can browse products after signing in.

  @smoke
  Scenario: Successful login shows products
    Given the shopper opens Sauce Demo
    When they sign in as "standard_user"
    Then the products title is shown

  @negative
  Scenario: Locked user cannot sign in
    Given the shopper opens Sauce Demo
    When they sign in as "locked_out_user"
    Then a lockout error is shown

  Scenario: Wrong title expectation fails
    Given the shopper opens Sauce Demo
    When they sign in as "standard_user"
    Then the title is "Inventory"

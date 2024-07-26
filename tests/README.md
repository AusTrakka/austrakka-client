# STRUCTURE AND CONVENTION FOR THE CLIENT TESTS.

The tests have been structured in this way

`tests/unit-tests/<filename of the method>/<name of method>.test.ts`

With this if a test needs some setup of utility function for arranging/orchestrating a test case and it is reused
it may be of use to put it in the test-utils (utility folder I know :grimacing:) this can be changed if a better
solution for organising the setup methods reveals itself.

## Naming

I will be following this [ guide ](https://github.com/mawrkus/js-unit-testing-guide?tab=readme-ov-file#-name-your-tests-properly) in the naming conventions for tests.

#### Example Naming and Format:

A direct excerpt from the document on testing in JavaScript (I assume the format translates heavily to TypeScript)

Is that tests should follow the naming convention of

`Unit of work -> Expected behaviour -> when -> Senario/Context`

A dummy example of this is this:

```javascript
\\ I like this one way better, due to the file structure
describe("The Gallery instance", () => {
  describe("when initialized", () => {
    it("calculates the thumb size", () => {});

    it("calculates the thumbs count", () => {});

    // ...
  });
});
```
Another Format that we could go to in the future is the class method format but I have **NOT** gone with this.
But here is an example if we were wanting to change in the future.

```javascript
describe("Gallery", () => {
  describe("init()", () => {
    it("calculates the thumb size", () => {});

    it("calculates the thumbs count", () => {});
  });

  describe("goTo(index)", () => {});

  // ...
});
```
----------

Discussions also revolve around how tests should not be described or contain the word 'should'
opinionated repo here: [should-up](https://github.com/spotify/should-up)


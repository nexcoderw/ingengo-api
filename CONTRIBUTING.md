# Contributing to Ingengo API

Thanks for helping improve Ingengo. Documentation, bug reports, tests, fixes,
and feature proposals are welcome. You can contribute without access to the
production server, database, or deployment credentials.

## Choose a contribution

- **Report a bug.** Search existing [issues](https://github.com/nexcoderw/ingengo-api/issues).
  Include the commit or version, expected and actual behavior, and a short
  reproduction using synthetic data.
- **Propose a feature.** Open an issue about the problem, who it affects, and
  what would make it better. Discuss API, schema, and security changes early.
- **Improve docs or tests.** Fix an unclear setup step, update a Swagger
  description, or add a regression test using a fake provider.
- **Report a vulnerability.** Use the private route in [SECURITY.md](SECURITY.md).

## Make your first pull request

1. Fork the repository and clone your fork. Run the [local setup](README.md#getting-started)
   with a development database you control.
2. Add the upstream repository and start a task branch from its latest `main`.

   ```bash
   git remote add upstream https://github.com/nexcoderw/ingengo-api.git
   git fetch upstream
   git switch --no-track -c docs/clarify-local-setup upstream/main
   ```

3. Keep the work focused on one outcome. For a behavior change, update its
   nearest test and the affected Swagger DTOs or descriptions. For a
   documentation change, verify commands, links, and examples.
4. Use one changed file per commit as described in the [Git rules](.agents/git.md).
   Write lowercase, imperative Conventional Commit subjects of at most 72
   characters, such as `docs(setup): clarify local database configuration`.

   ```bash
   git add -- README.md
   git diff --cached --name-only
   git diff --cached --check
   git commit -m "docs(setup): clarify local database configuration"
   git push -u origin docs/clarify-local-setup
   ```

5. [Open a pull request](https://github.com/nexcoderw/ingengo-api/compare) against
   upstream `main`. Include the issue link, what changed, which checks actually
   ran, and any API, migration, or Flutter-client dependency. Open a draft when
   there is verification or integration work outstanding. Keep follow-up
   commits for the same PR on its branch.

## Verify your work

Run the [development checks](README.md#development-checks) for code changes.
Use a separate development database for migration and integration checks.
Review generated SQL and describe compatibility with existing data and clients.
If a change also requires a Flutter update, link the app PR and give the merge or
release order.

For changes to auth, payment or income behavior, review ownership checks,
duplicate requests, and retry behavior. Retain the distinction between
user-reported, client-parsed, and provider evidence. Use synthetic amounts,
phone numbers, and message text. A mixed change can contain code, tests,
and docs in the same PR, with one file per commit.

## Work together

Be respectful, explain the reasoning behind feedback, and leave room for
questions. All community spaces follow the [code of conduct](CODE_OF_CONDUCT.md).
After review and required checks pass, a maintainer can merge the PR. Production
deployments and credentials are handled separately by maintainers.

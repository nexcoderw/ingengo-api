# Security policy

## Report a vulnerability privately

Use [GitHub Security Advisories](https://github.com/nexcoderw/ingengo-api/security/advisories/new)
to submit a private report if the form is available. If it is unavailable, reach
[KAJUGA Daniels](https://github.com/kajugadaniels) through a private contact
channel listed on the profile and ask for a secure way to share details. Keep
vulnerability details out of public issues, PRs, and discussions.

Include the affected commit or version, the feature involved, a description of
the impact, and steps to reproduce it safely in a local or explicitly authorized
environment. Use synthetic data and redact credentials, tokens, payment messages,
phone numbers, and account information. Mention any suspected exposure promptly
without copying affected records into the report.

Maintainers will triage the report and coordinate a fix and disclosure with the
reporter. Share public details after the maintainer and reporter agree on timing.

## Security expectations

| Area | Practice |
| --- | --- |
| Secrets | Use separate development and production credentials. Keep actual `.env` files and private keys out of Git, issue attachments, shell output, and logs. Use environment secrets for CI credentials. |
| Authorization | Derive ownership from authenticated context. Cover cross-account rejection and sensitive state transitions when changing protected routes. |
| Financial data | Preserve source and confidence when handling payment evidence. Use synthetic fixtures and scope queries and writes to the account that owns the record. |
| Shortcut imports | Preserve credential revocation, upload limits, deduplication, review, and message retention. Review encryption-key changes for their effect on pending records. |
| Database | Limit access to the permissions each service or migration requires. Use TLS and a separate development database. Review migrations before deployment. |
| Production | Keep HTTPS and strict SSH host verification enabled. Use a dedicated deployment account and rotate exposed credentials promptly. |

For repository administrators, enable
[GitHub private vulnerability reporting](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository)
so reporters can use the private form.

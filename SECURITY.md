# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x     | Yes       |

## Reporting a Vulnerability

Report security vulnerabilities to the maintainer directly:

- **Email**: kathir.kalidass@example.com (replace with actual email before publishing)
- **GitHub Issues**: For non-sensitive security bugs, open a standard issue

Do not report security vulnerabilities via public GitHub issues for critical or high-severity issues.

## Scope

Storia takes the following security measures:

- **Zero runtime dependencies** — no supply chain risk from transitive dependencies
- **Input validation** — all user-facing entry points validate inputs
- **Path traversal prevention** — story IDs are sanitized, `../` and absolute paths rejected
- **State checksums** — SHA-256 checksums verify data integrity on load
- **Size limits** — states >10 MB are rejected
- **npm provenance** — published packages include provenance attestation

## Security Checklist

For each release:

- [ ] No high-severity vulnerabilities in dependencies (`npm audit`)
- [ ] State checksums verified on load
- [ ] Path traversal guards active
- [ ] All public methods validate inputs

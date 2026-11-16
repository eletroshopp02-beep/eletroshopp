# Agency Agents — Eletroshopp

Project-specific agent profiles for safe, incremental e-commerce development. Select the Coordinator in GitHub Copilot Chat or VS Code Agent mode. In VS Code, use its handoff actions to pass work between specialists. On GitHub.com, select each custom agent from the agent picker as needed; IDE handoffs are not supported in the cloud agent.

## Profiles
- `architect.agent.md` — architecture and integration design
- `fullstack.agent.md` — storefront, admin and checkout implementation
- `qa-security.agent.md` — quality, access control and security
- `data.agent.md` — commerce data and accounting integrity

## Working rules
1. Inspect the current code and tests before proposing changes.
2. Keep changes scoped; preserve existing checkout, shipping and payment behavior unless explicitly tasked otherwise.
3. Never commit credentials, tokens, customer secrets or production data.
4. Add tests and document migration/rollback steps for risky changes.
5. Do not deploy or alter production services without explicit approval.
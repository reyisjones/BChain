# 🔄 CI/CD Pipeline Documentation

## Overview

Automated continuous integration and deployment pipeline using **GitHub Actions**.

## Workflows

### 1. Main CI/CD Pipeline (`ci.yml`)

Triggered on: Push to `master`/`develop` or PR to these branches

**Jobs:**

#### Lint (Optional)
- Runs ESLint if configured
- Continues on error (informational)

#### Test
- Compiles Solidity contracts
- Runs all test suites
- Required to pass

#### Coverage
- Generates coverage report
- Uploads to Codecov (optional)
- Archives coverage artifacts (30 days)
- **Threshold: ≥90% statement coverage**

#### Build
- Compiles contracts
- Builds TypeScript (if configured)
- Archives build artifacts (7 days)

#### Security
- Runs `npm audit` for dependency vulnerabilities
- Runs Slither for Solidity static analysis
- Continues on error (informational)

#### Deploy Testnet (Auto)
- **Trigger:** Push to `develop` branch
- Deploys to Polygon Mumbai testnet
- Requires secrets: `POLYGON_MUMBAI_RPC`, `DEPLOYER_KEY`

#### Release (Manual)
- **Trigger:** Push to `master` with commit message starting with `chore(release):`
- Creates GitHub release with version tag
- Publishes release notes

---

### 2. PR Checks (`pr.yml`)

Triggered on: Pull requests to `master`/`develop`

**Jobs:**

#### Validate PR
- Compiles contracts
- Runs all tests
- Checks coverage ≥90%
- Comments on PR with coverage report

**Example Comment:**
```
✅ Coverage Report: 94.29% statement coverage
```

---

## Setup Instructions

### 1. Enable GitHub Actions

GitHub Actions are enabled by default. The workflows will run automatically on push/PR.

### 2. Configure Secrets

Go to **Settings → Secrets and variables → Actions → New repository secret**

**Required Secrets:**

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DEPLOYER_KEY` | Private key for testnet deployment | `0xabc123...` |
| `POLYGON_MUMBAI_RPC` | Mumbai RPC URL | `https://rpc-mumbai.maticvigil.com` |
| `BASE_SEPOLIA_RPC` | Base Sepolia RPC URL | `https://sepolia.base.org` |
| `CODECOV_TOKEN` | Codecov upload token (optional) | `abc123-...` |

**Optional Secrets:**

| Secret Name | Description |
|-------------|-------------|
| `POLYGONSCAN_API_KEY` | For contract verification |
| `BASESCAN_API_KEY` | For contract verification |
| `PINATA_JWT` | For IPFS integration tests |

### 3. Add Status Badge

Add to `README.md`:

```markdown
![CI/CD](https://github.com/reyisjones/BChain/workflows/CI%2FCD%20Pipeline/badge.svg)
[![Coverage](https://codecov.io/gh/reyisjones/BChain/branch/master/graph/badge.svg)](https://codecov.io/gh/reyisjones/BChain)
```

---

## Local Development

### Run Tests Locally

```bash
# All tests
npx hardhat test

# With coverage
npx hardhat coverage

# Specific test file
npx hardhat test test/MediaRegistry.ts
```

### Pre-commit Checks

Install Husky for pre-commit hooks:

```bash
npm install --save-dev husky lint-staged

# Initialize husky
npx husky init

# Add pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
```

Create `.lintstagedrc.json`:

```json
{
  "*.{ts,js}": ["prettier --write"],
  "*.sol": ["prettier --write"],
  "test/**/*.ts": ["npx hardhat test"]
}
```

---

## Deployment Workflows

### Testnet Deployment (Automatic)

**Trigger:** Push to `develop` branch

```bash
git checkout develop
git merge feature/my-feature
git push origin develop
# → CI/CD automatically deploys to Mumbai testnet
```

**Deployment Steps:**
1. Runs all tests
2. Checks coverage ≥90%
3. Compiles contracts
4. Deploys to Mumbai using `DEPLOYER_KEY`
5. Saves deployment address to artifacts

### Production Deployment (Manual)

**Trigger:** Merge to `master` + release commit

```bash
# 1. Update version in package.json
npm version patch  # or minor, major

# 2. Merge to master
git checkout master
git merge develop
git push origin master

# 3. Create release commit
git commit --allow-empty -m "chore(release): v0.2.0"
git push origin master

# → CI/CD creates GitHub release with tag v0.2.0
```

**Manual mainnet deployment:**
```bash
# Deploy to mainnet (not automated for safety)
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network polygon

# Verify on Polygonscan
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

---

## Monitoring & Artifacts

### Viewing Workflow Runs

1. Go to **Actions** tab on GitHub
2. Click on a workflow run
3. View job logs, test results, coverage

### Downloading Artifacts

Build artifacts and coverage reports are stored for 7-30 days:

1. Go to workflow run
2. Scroll to **Artifacts** section
3. Download `build-artifacts` or `coverage-report`

### Coverage Reports

Uploaded to Codecov (if configured):
- View at `https://codecov.io/gh/reyisjones/BChain`
- See coverage trends over time
- File-level coverage breakdown

---

## Advanced Configuration

### Custom Test Networks

Add to `ci.yml` under `deploy-testnet` job:

```yaml
- name: Deploy to Base Sepolia
  env:
    BASE_SEPOLIA_RPC: ${{ secrets.BASE_SEPOLIA_RPC }}
    DEPLOYER_KEY: ${{ secrets.DEPLOYER_KEY }}
  run: npx hardhat run scripts/deploy/deployMediaRegistry.ts --network baseSepolia
```

### Slack Notifications

Add to any job:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Parallel Test Execution

Split tests for faster execution:

```yaml
test:
  strategy:
    matrix:
      test-group: [unit, integration, e2e]
  steps:
    - run: npx hardhat test test/${{ matrix.test-group }}/**
```

---

## Troubleshooting

### ❌ Coverage below threshold

**Error:** `Coverage below 90% threshold`

**Solution:**
- Add more tests to increase coverage
- Check `coverage/lcov-report/index.html` for uncovered lines
- Focus on untested functions and edge cases

### ❌ Deployment failed

**Error:** `insufficient funds for gas`

**Solution:**
- Ensure deployer wallet has testnet ETH/MATIC
- Get funds from faucet
- Verify `DEPLOYER_KEY` secret is correct

### ❌ Tests timeout

**Error:** `Test exceeded timeout of 20000ms`

**Solution:**
- Increase timeout in test file:
  ```typescript
  it('slow test', async function() {
    this.timeout(60000); // 60 seconds
    // ...
  });
  ```

### ❌ Slither analysis failed

**Error:** `Slither found issues`

**Solution:**
- Review Slither output in workflow logs
- Fix high/medium severity issues
- Add `// slither-disable-next-line` for false positives

---

## Best Practices

### 1. Conventional Commits

Use semantic commit messages:

```bash
feat: add new feature
fix: bug fix
docs: documentation update
test: add tests
chore: maintenance tasks
```

### 2. Branch Protection Rules

Configure on GitHub:
- Require PR reviews (≥1 approval)
- Require status checks to pass (CI/CD)
- Require branches to be up to date
- Enforce linear history

### 3. Code Review Checklist

Before merging PR:
- [ ] All tests passing
- [ ] Coverage ≥90%
- [ ] No high-severity security issues
- [ ] Documentation updated
- [ ] Conventional commit format
- [ ] No merge conflicts

### 4. Release Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.2.0): New features, backward compatible
- **PATCH** (0.1.1): Bug fixes

---

## Workflow Examples

### Example 1: Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/ipfs-integration
git push origin feature/ipfs-integration

# 2. Make changes, commit
git add .
git commit -m "feat: integrate IPFS storage"

# 3. Push and create PR
git push origin feature/ipfs-integration
# → Opens PR on GitHub

# 4. CI/CD runs automatically:
#    - Compiles contracts ✅
#    - Runs tests ✅
#    - Checks coverage (94%) ✅
#    - Comments on PR with results

# 5. After review, merge to develop
# → Auto-deploys to Mumbai testnet
```

### Example 2: Hotfix

```bash
# 1. Branch from master
git checkout master
git checkout -b hotfix/critical-bug

# 2. Fix and test
git commit -m "fix: resolve signature validation bug"

# 3. PR to master
git push origin hotfix/critical-bug
# → CI/CD validates

# 4. Merge to master
# → Create release: chore(release): v0.1.1
# → Manual deploy to mainnet
```

---

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Hardhat CI/CD Guide](https://hardhat.org/hardhat-runner/docs/advanced/ci)
- [Codecov Documentation](https://docs.codecov.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Next:** [Security Checklist](./SecurityChecklist.md) | [Deployment Guide](./DEPLOYMENT.md)

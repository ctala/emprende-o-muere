# Spec Delta

## Purpose
Keeps the published artifact honest and recoverable: a single version source, a changelog updated before every tagged release, an MIT license, and a repository tree whose ignore rules guarantee that no local-only or sensitive files ever reach the public history.

## ADDED Requirements

### Requirement: Single version source
The project SHALL expose one authoritative version string: the `version` field of `package.json`. A release SHALL be a git tag named `v<version>` pointing at a commit where the gate passes, and the tag number SHALL equal the `version` field on that exact commit.

#### Scenario: Tag matches declared version
- **WHEN** a tag `v0.1.0` is created
- **THEN** `package.json` on that commit reads `"version": "0.1.0"`

#### Scenario: Mismatched release is impossible to sign off
- **WHEN** the release procedure runs and the tag and `package.json` version differ
- **THEN** the procedure stops before publishing and the repo is left untouched on the remote

### Requirement: Changelog precedes release
`CHANGELOG.md` in Keep a Changelog format SHALL gain a dated section for a version before that version is tagged; the section SHALL name the player-visible and developer-visible changes of that release. Every pushed public tag SHALL have a matching changelog entry and a GitHub Release whose body is that entry.

#### Scenario: Tag without changelog entry fails the check
- **WHEN** a candidate commit is missing a changelog section for the version being tagged
- **THEN** the release procedure refuses to tag it

#### Scenario: Release body mirrors the changelog
- **WHEN** the GitHub Release for `v0.1.0` is created
- **THEN** its notes equal the `CHANGELOG.md` section for 0.1.0

### Requirement: Public artifact is clean by ignore contract
The repository SHALL ship a `.gitignore` that keeps local-only and heavy artifacts out of history: python virtual environments, editor/agent tool caches, node_modules, and `__pycache__`. The MIT license file SHALL be present at the root naming the holder and year, and any vendored third-party skill SHALL keep its own license and provenance intact. Tracked content SHALL contain no credentials and no personal data beyond the maintainer identity already public on GitHub.

#### Scenario: Virtualenv never enters history
- **WHEN** `git add -A` runs at the repository root
- **THEN** nothing under `playtest/.venv/` or any `node_modules/` is staged

#### Scenario: Secrets pre-flight blocks publication
- **WHEN** the release procedure scans tracked files for credential patterns
- **THEN** publication stops on any hit; with the current tree it must pass with zero hits

#### Scenario: Vendored skill stays licensed
- **WHEN** the published tree is inspected
- **THEN** the vendored skill directory still contains its original MIT license text alongside the project's own LICENSE

### Requirement: Publication is idempotent and verified
Publishing SHALL create or reuse a public GitHub repository, push `main`, create the annotated tag, and create the release, failing safely at any step: re-running the procedure on an already-published repo updates nothing destructively (no force-push, no history rewrite) and reports what already exists.

#### Scenario: Second run on a published repo is safe
- **WHEN** the publish procedure runs again after a successful run
- **THEN** it exits without rewriting remote history and lists the existing tag/release instead of duplicating them

#### Scenario: Published page matches the gate
- **WHEN** the release exists on GitHub
- **THEN** the tagged commit's `package.json` version, the tag, and the changelog section all match, and the gate was green on that commit before tagging

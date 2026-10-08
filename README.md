# Contribution Event Tracker

A GitHub Action that reports contribution activity in a repository to
[APICURON](https://apicuron.org) so contributors can be credited for their work.

## What it does

When a tracked item is completed, the Action builds one event describing it and
sends it to APICURON. The event contains:

- the repository and the item (ids, URL, title, labels, dates);
- activities: who did what on the item, and when;
- relationships to other items.

Only metadata is sent. Comment and review bodies, diffs and code are never read
or sent. Bot accounts are excluded, and activity after the item was closed is
ignored.

### Currently tracked

| Item                | Activities                                              | Relationships |
| ------------------- | ------------------------------------------------------- | ------------- |
| Merged pull request | opened, reviewed (with review state), commented, merged | closed issues |

## Prerequisites

1. The APICURON maintainers must link your repository to your resource in
   APICURON. Contact them before installing.
1. You need an APICURON token from a user who manages that resource.

## Setup

1. Add the token as a repository secret: **Settings → Secrets and variables →
   Actions → New repository secret**, named `APICURON_TOKEN`.
1. Create `.github/workflows/contribution-tracker.yml`:

   ```yaml
   name: Track contributions

   on:
     pull_request_target:
       types: [closed]

   permissions:
     pull-requests: read
     issues: read

   jobs:
     track:
       if: github.event.pull_request.merged == true
       runs-on: ubuntu-latest
       steps:
         - uses: Mehdi-SK/contribution-event-tracker@main
           with:
             apicuron-token: ${{ secrets.APICURON_TOKEN }}
   ```

The same file is available in
[`examples/contribution-tracker.yml`](./examples/contribution-tracker.yml).

### Why `pull_request_target`

Pull requests from forks do not receive secrets under `pull_request`, so the
token would be empty. `pull_request_target` runs in the context of your
repository and has the secret. It is safe here because the Action only reads
pull request metadata through the GitHub API: the pull request's code is never
checked out or executed. Do not add an `actions/checkout` of the PR head to this
workflow.

## Inputs

| Input            | Required              | Default                    | Description                                  |
| ---------------- | --------------------- | -------------------------- | -------------------------------------------- |
| `apicuron-token` | yes, unless `dry-run` | none                       | Token of a user managing the linked resource |
| `apicuron-url`   | no                    | `https://apicuron.org/api` | APICURON API base URL                        |
| `dry-run`        | no                    | `false`                    | Build and log the event without sending it   |
| `github-token`   | no                    | `${{ github.token }}`      | Token used to read repository activity       |

`github-token` is filled in automatically with the workflow's own token; you do
not need to set it.

## Testing with dry-run

Set `dry-run: true` (no APICURON token needed). The event is printed in the job
log and nothing is sent. Remove it once the output looks right.

## Backfill (maintainers)

Sends events for activity that happened before the Action was installed.

```bash
cp .env.example .env   # set GITHUB_TOKEN, APICURON_TOKEN, optionally APICURON_URL
yarn install
yarn backfill <owner> <repo> [outFile]
```

Every event is written to `backfill-{owner}-{repo}-{timestamp}.jsonl`. If
`APICURON_TOKEN` is set, events are also sent in batches (up to about 900 KB or
500 events; a batch rejected as too large is split and retried). Without the
token only the file is written.

## Troubleshooting

- **A run failed:** re-run the job. Re-sending is safe; APICURON recognises the
  event as already received.
- **403:** the token's user does not manage the resource linked to this
  repository.
- **422:** the repository is not linked to a resource in APICURON yet.

## Notice for your contributors

> **Draft — pending data-protection review.** This repository reports
> contribution activity to APICURON to credit contributors. For each tracked
> contribution, the GitHub username and numeric id of the people who took part
> are sent, together with what they did, timestamps and links. No comment text
> or code is sent.

## Licence

MIT

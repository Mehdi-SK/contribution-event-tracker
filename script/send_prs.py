#!/usr/bin/env python3
"""
Fetch closed PRs from GitHub, send as PRPayload to the server,
and save all server responses to a JSON file.
Usage:
    python send_prs.py --repo owner/repo --token YOUR_TOKEN --resource-id your-resource-id
Optional: --limit 5, --dry-run, --output responses.json
"""

import argparse
import json
import sys
from datetime import datetime

import requests
from github import Github, GithubException
from github.PullRequest import PullRequest

# --- Configuration ---
SERVER_BASE_URL = "http://localhost:3000/api/software/pull_requests"  # Adjust if different


def fetch_closed_prs(repo_full_name, token, limit=None):
    g = Github(token)
    repo = g.get_repo(repo_full_name)
    prs = repo.get_pulls(state="closed", sort="updated", direction="desc")
    if limit:
        prs = prs[:limit]
    return list(prs)


def get_reviewers(pr):
    reviewers = set()
    for user in pr.requested_reviewers:
        reviewers.add(user.login)
    for review in pr.get_reviews():
        if review.user:
            reviewers.add(review.user.login)
    return list(reviewers)


def build_payload(pr, resource_id):
    # Get the repository full name from the base branch's repo
    repo_full_name = pr.base.repo.full_name

    return {
        "contribution_id": f"{repo_full_name}#{pr.number}",
        "github_login": pr.user.login if pr.user else None,
        "repository": repo_full_name,  # Fixed here
        "timestamp": pr.closed_at.isoformat() if pr.closed_at else datetime.utcnow().isoformat(),
        "resource_id": resource_id,
        "event_type": "pull_request",
        "context": {
            "pr_id": str(pr.number),
            "pr_url": pr.html_url,
            "target_branch": pr.base.ref,
            "labels": [label.name for label in pr.labels],
            "reviewers": get_reviewers(pr),
            "title": pr.title,
        }
    }


def send_payload(payload, resource_id):
    """Send payload and return the server's JSON response (or raise)."""
    url = f"{SERVER_BASE_URL}"
    headers = {"Content-Type": "application/json"}
    # Uncomment if your server expects a version header:
    headers["Version"] = "2"
    resp = requests.post(url, json=payload, headers=headers)
    resp.raise_for_status()
    return resp.json()   # The structured response (e.g., {"data": [...]})


def main():
    parser = argparse.ArgumentParser(description="Fetch closed PRs, send, and save responses.")
    parser.add_argument("--repo", required=True, help="e.g., 'geneontology/go-ontology'")
    parser.add_argument("--token", required=True, help="GitHub personal access token")
    parser.add_argument("--resource-id", required=True, help="Your apicuron resource ID")
    parser.add_argument("--limit", type=int, default=None, help="Max number of PRs (default: all)")
    parser.add_argument("--dry-run", action="store_true", help="Print payloads without sending")
    parser.add_argument("--output", default="responses.json", help="Output JSON file name")
    args = parser.parse_args()

    try:
        prs = fetch_closed_prs(args.repo, args.token, args.limit)
        print(f"Found {len(prs)} closed PRs.")
    except GithubException as e:
        print(f"GitHub API error: {e}")
        sys.exit(1)

    responses = []   # List to store each server response

    for pr in prs:
        payload = build_payload(pr, args.resource_id)
        if args.dry_run:
            print("Payload for PR #{}:\n{}".format(pr.number, json.dumps(payload, indent=2)))
            # In dry-run, we don't send, but we can still add a dummy response to keep structure
            # For simplicity, we'll just print.
            continue

        try:
            response_data = send_payload(payload, args.resource_id)
            # The response might be the entire JSON; we store it verbatim.
            # If you only want the "data" array, you can extract it:
            # response_data = response_data.get("data", [])
            responses.append({
                "pr_number": pr.number,
                "pr_url": pr.html_url,
                "response": response_data
            })
            print(f"✅ PR #{pr.number} processed.")
        except requests.exceptions.RequestException as e:
            error_body = e.response.text if hasattr(e, 'response') and e.response else str(e)
            print(f"❌ PR #{pr.number} failed: {error_body}")
            print(f"Payload was:\n{json.dumps(payload, indent=2)}")
            # Optionally store error information
            responses.append({
                "pr_number": pr.number,
                "pr_url": pr.html_url,
                "error": error_body
            })

    if not args.dry_run:
        with open(args.output, "w") as f:
            json.dump({"responses": responses}, f, indent=2)
        print(f"\n✅ Wrote {len(responses)} responses to {args.output}")


if __name__ == "__main__":
    main()
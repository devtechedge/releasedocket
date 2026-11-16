# GitHub App setup

Create a GitHub App with repository metadata read-only, pull requests read-only, checks read-only, actions read-only, deployments read-only and contents permission set to no access. Subscribe to installation, pull request, pull request review, check run, workflow run, deployment, deployment status and release events. Do not grant contents write, administration or workflow write.

Set `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` and `GITHUB_APP_WEBHOOK_SECRET` in the server environment. Point the webhook URL to `/api/webhooks/github`. The endpoint verifies the raw request body, stores the delivery ID with a unique provider/delivery key, and queues signed event metadata in the database outbox. The current code does not yet exchange installation tokens, synchronize repositories, reconcile event payloads or expose manual sync. Do not treat webhook receipt as verified evidence.

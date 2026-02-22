"""Dapr Secrets service — retrieve secrets from Kubernetes via Dapr HTTP API.

T014: DaprSecretsService reads Kubernetes secrets through the Dapr
secretstores.kubernetes component.
"""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

DAPR_HTTP_PORT = int(os.environ.get("DAPR_HTTP_PORT", "3500"))
SECRET_STORE_NAME = "kubernetes"


class DaprSecretsService:
    """Retrieves secrets from Kubernetes via the Dapr Secrets HTTP API."""

    def __init__(self) -> None:
        self._base_url = f"http://localhost:{DAPR_HTTP_PORT}"

    async def get_secret(self, secret_name: str, key: str) -> str:
        """Retrieve a single secret value from a Kubernetes Secret.

        Args:
            secret_name: Kubernetes Secret resource name
            key: Key within the secret to retrieve

        Returns:
            Secret value as a string

        Raises:
            KeyError: If the key is not found in the secret
            httpx.HTTPStatusError: On Dapr API error
        """
        url = (
            f"{self._base_url}/v1.0/secrets/{SECRET_STORE_NAME}/{secret_name}"
            f"?metadata.namespace=default"
        )
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=5.0)
                response.raise_for_status()
                payload = response.json()
                if key not in payload:
                    raise KeyError(
                        f"Key '{key}' not found in secret '{secret_name}'. "
                        f"Available keys: {list(payload.keys())}"
                    )
                return payload[key]
            except httpx.HTTPStatusError as exc:
                logger.error(
                    "Failed to retrieve secret secret_name=%s key=%s status=%s",
                    secret_name,
                    key,
                    exc.response.status_code,
                )
                raise


# Module-level singleton
dapr_secrets = DaprSecretsService()

import os
import json
import urllib.request

DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")

def send_test_discord_notification(config: dict = None) -> tuple[bool, str]:
    """Sends a test webhook to verify Discord integration."""
    webhook_url = config.get("discord_webhook_url") if config else None
    url = (webhook_url or DISCORD_WEBHOOK_URL or "").strip()

    if not url:
        return False, "Discord Webhook URL is empty."

    data = {
        "content": "🧪 **Minizoom Discord Webhook Test**",
        "embeds": [
            {
                "title": "Discord Integration is Working! 🎉",
                "description": "This is a test notification sent from your Minizoom Video Conferencing system.",
                "color": 3066993, # Emerald / Green
                "fields": [
                    {
                        "name": "Status",
                        "value": "✅ Operational",
                        "inline": True
                    },
                    {
                        "name": "Version",
                        "value": "v1.5.0",
                        "inline": True
                    }
                ],
                "footer": {
                    "text": "Minizoom Admin Notification System"
                }
            }
        ]
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'User-Agent': 'MinizoomBot/1.0', 'Content-Type': 'application/json'},
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status in [200, 204]:
                print("[Discord] Test notification delivered successfully.")
                return True, "Discord webhook delivered successfully!"
            else:
                return False, f"Discord returned status code {response.status}"
    except urllib.error.HTTPError as e:
        return False, f"Discord Webhook HTTP Error: {e.code} {e.reason}"
    except Exception as e:
        return False, f"Discord Error: {str(e)}"


def send_discord_notification(new_user_name: str, new_user_email: str, config: dict = None):
    webhook_url = config.get("discord_webhook_url") if config else None
    url = (webhook_url or DISCORD_WEBHOOK_URL or "").strip()

    if not url:
        return

    data = {
        "content": "🔔 **New User Registration**",
        "embeds": [
            {
                "title": "A new user is waiting for approval!",
                "color": 2449387, # Blue
                "fields": [
                    {
                        "name": "Name",
                        "value": new_user_name,
                        "inline": True
                    },
                    {
                        "name": "Email",
                        "value": new_user_email,
                        "inline": True
                    }
                ],
                "footer": {
                    "text": "Minizoom Admin Notification System"
                }
            }
        ]
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'User-Agent': 'MinizoomBot/1.0', 'Content-Type': 'application/json'},
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            print("[Discord] New user registration notification sent successfully.")
    except Exception as e:
        print(f"[Discord] Failed to send notification: {e}")

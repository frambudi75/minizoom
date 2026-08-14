import os
import json
import urllib.request

DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")

def send_discord_notification(new_user_name: str, new_user_email: str):
    if not DISCORD_WEBHOOK_URL:
        return

    data = {
        "content": "🔔 **New User Registration**",
        "embeds": [
            {
                "title": "A new user is waiting for approval!",
                "color": 5814783, # Purple
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
        DISCORD_WEBHOOK_URL,
        data=json.dumps(data).encode('utf-8'),
        headers={'User-Agent': 'MinizoomBot/1.0', 'Content-Type': 'application/json'},
        method='POST'
    )

    try:
        urllib.request.urlopen(req, timeout=5)
        print("Discord notification sent successfully.")
    except Exception as e:
        print(f"Failed to send Discord notification: {e}")

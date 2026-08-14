import urllib.request
import re
import os

url = 'https://github.com/livekit/livekit/releases/latest'
try:
    html = urllib.request.urlopen(url).read().decode('utf-8')
except Exception as e:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')

match = re.search(r'href=[\'"](.*?(?:livekit|livekit-server)_.*?windows_amd64\.zip)[\'"]', html)
if match:
    download_url = 'https://github.com' + match.group(1)
    print('Downloading:', download_url)
    urllib.request.urlretrieve(download_url, 'livekit.zip')
    print('Downloaded.')
else:
    print('Could not find download URL.')

# Bonnie

Bonnie is a voice-driven web app made for blind users and people with deformed hands. It helps them use the web with less effort by supporting voice input and simple interaction instead of relying heavily on a mouse or keyboard.

## What it does

- accepts spoken prompts
- turns the prompt into a search query
- crawls relevant websites
- summarizes results
- shows the output in a simple Flask web interface

## Setup

```bash
cd "Main"
python3 -m venv myenv
source myenv/bin/activate
pip install -r requirements.txt
```

If the crawler needs browser dependencies:

```bash
crawl4ai-setup
```

## Run the app

```bash
cd Backend
python main.py
```

Then open:

```text
http://127.0.0.1:5000
```

If needed, change the port in [Backend/main.py](Backend/main.py):

```python
if __name__ == "__main__":
    app.run(port=5000, debug=True)
```

## Example flow

```python
from bonnie_voiceAsst import speech_to_text_en

text = speech_to_text_en(0)
print(text)
```

## Why this matters

This project is built to make web access easier for people who cannot use traditional input methods comfortably, without sacrificing usability.

## Quick troubleshooting

```bash
pip install -r requirements.txt
```

If the microphone does not work:
- check system mic permissions
- confirm microphone index in code
- run the app again

If the browser crawler fails:

```bash
crawl4ai-setup
```


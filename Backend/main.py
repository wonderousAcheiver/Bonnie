# Here is the code for the interconnection between the main landing page and other blueprint python files.
from flask import Flask, render_template, request, jsonify
import os
from crawler import one_liner_gen, top_urls
from bonnie_voiceAsst import speech_to_text_en

app = Flask(__name__, static_folder=os.path.abspath(os.path.join(os.path.dirname(__file__), "../static")), template_folder=os.path.abspath(os.path.join(os.path.dirname(__file__), "../templates")))

@app.route("/")
def prompt_page():
    return render_template("prompt.html")

@app.route("/plan_prompt", methods=["POST"])
def handle_prompt():
    data = request.get_json()
    # The one liner data that we use to search the web for results
    one_liner = one_liner_gen(data["user_prompt"])
    links = top_urls(one_liner)
    # Need to take these links and print it out in the canvas
    return jsonify(links)

@app.route("/audio_handler", methods=["GET"])
def handle_record():
    mic_text = speech_to_text_en(6)
    return jsonify(mic_text)


if __name__ == "__main__":
    app.run(port=5000, debug=True)

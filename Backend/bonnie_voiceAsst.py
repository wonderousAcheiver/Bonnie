# The name "Bonnie" is inspired by Bonnie from One piece anime, the chearfull girl, who had in my opinion
# a beautiful & adventurous storyline dedicated just for her by the animators.

import speech_recognition as sr

def print_mic_interfaces() -> None:
    for index, name in enumerate(sr.Microphone.list_microphone_names()):
        print(f"{index}: {name}")

def speech_to_text_en(device_ind: int, lang="en-US"):
    r = sr.Recognizer()
    r.pause_threshold = 1
    text = ""
    with sr.Microphone(device_index=device_ind) as source:
        r.adjust_for_ambient_noise(source, duration=2)
        print("start talking...")
        audio = r.listen(source)
        try:
            text = r.recognize_google(audio, language=lang)
        except Exception as e:
            print(f"Please try again.\nException: {e}")
    return text

if __name__ == "__main__":
    speech_to_text_en(6)
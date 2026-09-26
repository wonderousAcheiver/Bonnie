

const PROMPT_ENDPOINT = "/api/prompt";

const form = document.getElementById("prompt-section");
const input = document.getElementById("prompt-input");
const sendBtn = form.querySelector("button[type='submit']");

const outputPlaceholder = document.getElementById("output-placeholder");
const outputMessage = document.getElementById("output-message");
const outputResults = document.getElementById("output-results");

const detailsPlaceholder = document.getElementById("details-placeholder");
const detailsContent = document.getElementById("details-content");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const prompt = input.value.trim();
  if (!prompt) return;

  setLoading(true);
  clearOutput();

  try {
    const res = await fetch(PROMPT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) throw new Error("Request failed");

    const data = await res.json();
    renderResults(data);
  } catch (err) {
    outputPlaceholder.hidden = true;
    outputMessage.hidden = false;
    outputMessage.textContent = "Something went wrong getting a response. Please try again.";
    outputMessage.classList.add("error-text");
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  sendBtn.disabled = isLoading;
  sendBtn.textContent = isLoading ? "Thinking..." : "Send";
}

function clearOutput() {
  outputPlaceholder.hidden = true;
  outputMessage.hidden = true;
  outputMessage.classList.remove("error-text");
  outputResults.innerHTML = "";
}

function renderResults(data) {
  if (data.message) {
    outputMessage.hidden = false;
    outputMessage.textContent = data.message;
  }

  const options = Array.isArray(data.options) ? data.options : [];
  if (options.length === 0) {
    if (!data.message) {
      outputPlaceholder.hidden = false;
      outputPlaceholder.textContent = "No options came back for that prompt. Try rephrasing it.";
    }
    return;
  }

  options.forEach((option, index) => {
    outputResults.appendChild(buildCard(option, index));
  });
}

function buildCard(option, index) {
  const card = document.createElement("div");
  card.className = "option-card";
  card.dataset.index = index;

  const title = document.createElement("h3");
  title.textContent = option.name || "Untitled option";
  card.appendChild(title);

  if (option.description) {
    const desc = document.createElement("p");
    desc.textContent = option.description;
    card.appendChild(desc);
  }

  if (option.price || option.rating) {
    const meta = document.createElement("div");
    meta.className = "option-meta";
    meta.innerHTML =
      (option.price ? `<span>${escapeHtml(option.price)}</span>` : "<span></span>") +
      (option.rating ? `<span>${escapeHtml(option.rating)}</span>` : "");
    card.appendChild(meta);
  }

  const selectBtn = document.createElement("button");
  selectBtn.type = "button";
  selectBtn.textContent = "Select";
  selectBtn.addEventListener("click", () => selectOption(option, card));
  card.appendChild(selectBtn);

  return card;
}

function selectOption(option, card) {
  document
    .querySelectorAll(".option-card.selected")
    .forEach((el) => el.classList.remove("selected"));
  card.classList.add("selected");

  detailsPlaceholder.hidden = true;
  detailsContent.hidden = false;
  detailsContent.innerHTML = `
    <h3>${escapeHtml(option.name || "")}</h3>
    <p>${escapeHtml(option.description || "")}</p>
    ${option.price ? `<p><strong>Price:</strong> ${escapeHtml(option.price)}</p>` : ""}
    ${option.rating ? `<p><strong>Rating:</strong> ${escapeHtml(option.rating)}</p>` : ""}
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}



const PROMPT_ENDPOINT = "/api/prompt";

const form = document.getElementById("prompt-section");
const input = document.getElementById("prompt-input");
const sendBtn = form.querySelector("button[type='submit']");

const outputPlaceholder = document.getElementById("output-placeholder");
const outputMessage = document.getElementById("output-message");
const outputResults = document.getElementById("output-results");

const detailsPlaceholder = document.getElementById("details-placeholder");
const detailsContent = document.getElementById("details-content");

const micBtn = document.getElementById("mic-btn");
const voiceStatus = document.getElementById("voice-status");


const canSpeak = "speechSynthesis" in window;

function speak(text) {
  if (!canSpeak || !text) return;
  window.speechSynthesis.cancel(); 
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}

 

const WAKE_WORD = "lexar";
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let voiceMode = "idle"; 
let manualStop = false;

if (SpeechRecognitionAPI) {
  recognition = new SpeechRecognitionAPI();
  recognition.lang = document.documentElement.lang || "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.addEventListener("start", () => {
    micBtn.setAttribute("aria-pressed", "true");
    if (voiceMode === "command") {
      voiceStatus.textContent = "Listening. Say your request now.";
    } else {
      voiceStatus.textContent = "Voice assistant on. Say \"Lexar\" anytime, or tap the mic.";
    }
  });

  recognition.addEventListener("result", (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim();

      if (!result.isFinal) {
        if (voiceMode === "command") input.value = transcript;
        continue;
      }

      if (voiceMode === "wake") {
        const lower = transcript.toLowerCase();
        const idx = lower.indexOf(WAKE_WORD);
        if (idx === -1) continue; 

        const remainder = transcript.slice(idx + WAKE_WORD.length).trim();
        if (remainder) {
          input.value = remainder;
          sendCapturedCommand();
        } else {
          voiceMode = "command";
          input.value = "";
          voiceStatus.textContent = "Yes? I'm listening.";
          speak("Yes? Go ahead.");
        }
      } else if (voiceMode === "command") {
        input.value = transcript;
        sendCapturedCommand();
      }
    }
  });

  recognition.addEventListener("end", () => {
    if (manualStop) {
      voiceMode = "idle";
      micBtn.setAttribute("aria-pressed", "false");
      voiceStatus.textContent = "Voice assistant off.";
      return;
    }
   
    try {
      recognition.start();
    } catch (e) {
    
    }
  });

  recognition.addEventListener("error", (event) => {
    if (event.error === "not-allowed") {
      manualStop = true;
      voiceMode = "idle";
      micBtn.setAttribute("aria-pressed", "false");
      const message = "Microphone access was blocked. Please allow it in your browser settings.";
      voiceStatus.textContent = message;
      speak(message);
    }
 
  });

  function sendCapturedCommand() {
    voiceMode = "wake"; 
    voiceStatus.textContent = "Got it. Sending your request.";
    form.requestSubmit();
  }

  micBtn.addEventListener("click", () => {
    if (voiceMode === "idle") {
      manualStop = false;
      voiceMode = "command"; 
      input.value = "";
      recognition.start();
    } else if (voiceMode === "wake") {
      voiceMode = "command"; 
      input.value = "";
      voiceStatus.textContent = "Listening. Say your request now.";
    } else {

      voiceMode = "wake";
      voiceStatus.textContent = "Cancelled. Still listening for \"Lexar\".";
    }
  });
} else {
  micBtn.disabled = true;
  micBtn.title = "Voice input isn't supported in this browser.";
  voiceStatus.textContent = "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const prompt = input.value.trim();
  if (!prompt) return;

  setLoading(true);
  clearOutput();
  voiceStatus.textContent = "Thinking about your request.";

  try {
    const res = await fetch(PROMPT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) throw new Error("Request failed");

    const data = await res.json();
    renderResults(data);
  } catch (err) {
    const errorText = "Something went wrong getting a response. Please try again.";
    outputPlaceholder.hidden = true;
    outputMessage.hidden = false;
    outputMessage.textContent = errorText;
    outputMessage.classList.add("error-text");
    voiceStatus.textContent = errorText;
    speak(errorText);
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  sendBtn.disabled = isLoading;
  sendBtn.textContent = isLoading ? "Thinking..." : "Send";
}

function clearOutput() {
  outputPlaceholder.hidden = true;
  outputMessage.hidden = true;
  outputMessage.classList.remove("error-text");
  outputResults.innerHTML = "";
}

function renderResults(data) {
  if (data.message) {
    outputMessage.hidden = false;
    outputMessage.textContent = data.message;
  }

  const options = Array.isArray(data.options) ? data.options : [];
  if (options.length === 0) {
    const fallback = "No options came back for that prompt. Try rephrasing it.";
    if (!data.message) {
      outputPlaceholder.hidden = false;
      outputPlaceholder.textContent = fallback;
    }
    voiceStatus.textContent = data.message || fallback;
    speak(data.message || fallback);
    return;
  }

  options.forEach((option, index) => {
    outputResults.appendChild(buildCard(option, index));
  });

  voiceStatus.textContent = `${options.length} options ready. Read below.`;
  speak(buildSpokenSummary(data.message, options));
}

function buildSpokenSummary(message, options) {
  const intro = message ? message + " " : "Here are your options. ";
  const list = options
    .map((opt, i) => {
      const price = opt.price ? `, ${opt.price}` : "";
      const rating = opt.rating ? `, rated ${opt.rating}` : "";
      return `Option ${i + 1}: ${opt.name}${price}${rating}.`;
    })
    .join(" ");
  return intro + list;
}

function buildCard(option, index) {
  const card = document.createElement("div");
  card.className = "option-card";
  card.dataset.index = index;

  const title = document.createElement("h3");
  title.textContent = option.name || "Untitled option";
  card.appendChild(title);

  if (option.description) {
    const desc = document.createElement("p");
    desc.textContent = option.description;
    card.appendChild(desc);
  }

  if (option.price || option.rating) {
    const meta = document.createElement("div");
    meta.className = "option-meta";
    meta.innerHTML =
      (option.price ? `<span>${escapeHtml(option.price)}</span>` : "<span></span>") +
      (option.rating ? `<span>${escapeHtml(option.rating)}</span>` : "");
    card.appendChild(meta);
  }

  const selectBtn = document.createElement("button");
  selectBtn.type = "button";
  selectBtn.textContent = "Select";
  selectBtn.addEventListener("click", () => selectOption(option, card));
  card.appendChild(selectBtn);

  return card;
}

function selectOption(option, card) {
  document
    .querySelectorAll(".option-card.selected")
    .forEach((el) => el.classList.remove("selected"));
  card.classList.add("selected");

  detailsPlaceholder.hidden = true;
  detailsContent.hidden = false;
  detailsContent.innerHTML = `
    <h3>${escapeHtml(option.name || "")}</h3>
    <p>${escapeHtml(option.description || "")}</p>
    ${option.price ? `<p><strong>Price:</strong> ${escapeHtml(option.price)}</p>` : ""}
    ${option.rating ? `<p><strong>Rating:</strong> ${escapeHtml(option.rating)}</p>` : ""}
  `;

  voiceStatus.textContent = `Selected ${option.name}.`;
  speak(`You selected ${option.name}. ${option.description || ""}`);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
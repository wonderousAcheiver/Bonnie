// This is the code to handle the prompt requests made in the prompt page
const mic_button = document.getElementById("mic_button");
const prompt_form = document.getElementById("prompt-section");
const prompt_inp = document.getElementById("prompt-input");
let parsed_json = "";
const conversation_out = document.getElementById("output-placeholder");

const setMicListeningState = (state) => {
  if (!mic_button) return;

  mic_button.classList.remove("is-calibrating", "is-listening");

  if (state === "calibrating") {
    mic_button.classList.add("is-calibrating");
  } else if (state === "listening") {
    mic_button.classList.add("is-listening");
  }

  mic_button.setAttribute("aria-pressed", String(state === "listening" || state === "calibrating"));
};

if (prompt_form && prompt_inp) {
  prompt_form.addEventListener("submit", function (event) {
    event.preventDefault();
    fetch("/plan_prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_prompt: prompt_inp.value
      })
    })
      .then((response) => response.text())
      .then((data) => {
        parsed_json = JSON.parse(data);
        console.log(parsed_json);
      })
      .catch((error) => {
        console.error("Prompt submit error:", error);
      });
  });
}

if (mic_button) {
  mic_button.addEventListener("click", () => {
    setMicListeningState("calibrating");

    window.setTimeout(() => {
      setMicListeningState("listening");

      fetch("/audio_handler", {
        method: "GET"
      })
        .then((response) => response.text())
        .then((data) => {
          parsed_json = JSON.parse(data);
          prompt_inp.value = "";
          conversation_out.textContent = `You: ${parsed_json}`;
          setMicListeningState(false);
        })
        .catch((error) => {
          console.error("Mic input error:", error);
          setMicListeningState(false);
        });
    }, 2800);
  });
}

const theme_toggle = document.getElementById("theme-toggle");
if (theme_toggle) {
  const applyTheme = (isDark) => {
    document.body.classList.toggle("dark-theme", isDark);
    theme_toggle.setAttribute("aria-pressed", String(isDark));
    theme_toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  };

  const savedTheme = localStorage.getItem("planet-theme");
  if (savedTheme === "dark") {
    applyTheme(true);
  }

  theme_toggle.addEventListener("click", () => {
    const nextTheme = !document.body.classList.contains("dark-theme");
    applyTheme(nextTheme);
    localStorage.setItem("planet-theme", nextTheme ? "dark" : "light");
  });
}

const earthCanvas = document.getElementById("earth-canvas");
const planetScene = document.getElementById("planet-scene");

if (earthCanvas && planetScene) {
  const ctx = earthCanvas.getContext("2d");
  const state = { spin: 0 };

  const continents = [
    [
      { lat: 72, lon: -168 }, { lat: 68, lon: -140 }, { lat: 58, lon: -110 },
      { lat: 50, lon: -95 }, { lat: 48, lon: -80 }, { lat: 42, lon: -72 },
      { lat: 36, lon: -82 }, { lat: 28, lon: -97 }, { lat: 22, lon: -104 },
      { lat: 18, lon: -122 }, { lat: 30, lon: -150 }, { lat: 48, lon: -167 }
    ],
    [
      { lat: -56, lon: -72 }, { lat: -42, lon: -68 }, { lat: -30, lon: -58 },
      { lat: -15, lon: -50 }, { lat: 1, lon: -45 }, { lat: 8, lon: -38 },
      { lat: 12, lon: -22 }, { lat: 2, lon: -12 }, { lat: -8, lon: -20 },
      { lat: -18, lon: -38 }, { lat: -28, lon: -52 }, { lat: -42, lon: -64 }
    ],
    [
      { lat: 38, lon: -10 }, { lat: 28, lon: 0 }, { lat: 20, lon: 12 },
      { lat: 18, lon: 26 }, { lat: 22, lon: 38 }, { lat: 34, lon: 46 },
      { lat: 46, lon: 30 }, { lat: 50, lon: 18 }, { lat: 48, lon: 2 },
      { lat: 42, lon: -8 }
    ],
    [
      { lat: 18, lon: 15 }, { lat: 10, lon: 18 }, { lat: 2, lon: 24 },
      { lat: -6, lon: 28 }, { lat: -18, lon: 26 }, { lat: -32, lon: 20 },
      { lat: -22, lon: 34 }, { lat: -8, lon: 41 }, { lat: 4, lon: 45 },
      { lat: 12, lon: 40 }, { lat: 20, lon: 30 }
    ],
    [
      { lat: -10, lon: 110 }, { lat: -18, lon: 116 }, { lat: -26, lon: 128 },
      { lat: -18, lon: 138 }, { lat: -8, lon: 146 }, { lat: 0, lon: 150 },
      { lat: 18, lon: 142 }, { lat: 22, lon: 130 }, { lat: 12, lon: 118 },
      { lat: 2, lon: 112 }
    ],
    [
      { lat: 60, lon: 10 }, { lat: 54, lon: 26 }, { lat: 48, lon: 40 },
      { lat: 64, lon: 52 }, { lat: 72, lon: 40 }, { lat: 72, lon: 18 }
    ]
  ];

  function rotatePoint(x, y, z, yaw, pitch) {
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    const y1 = y * cosP - z1 * sinP;
    const z2 = y * sinP + z1 * cosP;

    return { x: x1, y: y1, z: z2 };
  }

  function latLonToVector(lat, lon, radius) {
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    return {
      x: radius * Math.cos(latRad) * Math.cos(lonRad),
      y: radius * Math.sin(latRad),
      z: radius * Math.cos(latRad) * Math.sin(lonRad)
    };
  }

  function projectPoint(point, cx, cy, cameraDistance) {
    const scale = cameraDistance / (cameraDistance + point.z);
    return {
      x: cx + point.x * scale,
      y: cy + point.y * scale,
      scale,
      z: point.z
    };
  }

  function drawEarth() {
    const w = earthCanvas.width;
    const h = earthCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = 170;
    const cameraDistance = 420;

    ctx.clearRect(0, 0, w, h);

    const oceanGrad = ctx.createRadialGradient(cx - 70, cy - 60, 20, cx, cy, radius + 35);
    oceanGrad.addColorStop(0, "#dffaff");
    oceanGrad.addColorStop(0.26, "#8ad7ff");
    oceanGrad.addColorStop(0.58, "#1d79d7");
    oceanGrad.addColorStop(1, "#021d31");

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = oceanGrad;
    ctx.fill();

    const lightVector = { x: 0.8, y: -0.45, z: 1 };

    continents.forEach((shape) => {
      const projected = [];
      let avgNormal = { x: 0, y: 0, z: 0 };

      shape.forEach(({ lat, lon }) => {
        const vector = latLonToVector(lat, lon, radius);
        const rotated = rotatePoint(vector.x, vector.y, vector.z, state.spin, 0.35);
        const projectedPoint = projectPoint(rotated, cx, cy, cameraDistance);
        projected.push(projectedPoint);
        avgNormal.x += rotated.x;
        avgNormal.y += rotated.y;
        avgNormal.z += rotated.z;
      });

      const normalLen = Math.hypot(avgNormal.x, avgNormal.y, avgNormal.z) || 1;
      const normal = {
        x: avgNormal.x / normalLen,
        y: avgNormal.y / normalLen,
        z: avgNormal.z / normalLen
      };
      const lightShade = Math.max(0, (normal.x * lightVector.x + normal.y * lightVector.y + normal.z * lightVector.z) / 1.4);
      const red = Math.round(25 + lightShade * 35);
      const green = Math.round(120 + lightShade * 50);
      const blue = Math.round(62 + lightShade * 28);
      const fill = `rgba(${red}, ${green}, ${blue}, 1)`;

      ctx.beginPath();
      projected.forEach((point, index) => {
        if (!index) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = "rgba(12, 48, 35, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.32)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const atmosphere = ctx.createRadialGradient(cx - 90, cy - 80, 30, cx, cy, radius + 54);
    atmosphere.addColorStop(0, "rgba(255,255,255,0.7)");
    atmosphere.addColorStop(0.2, "rgba(166, 223, 255, 0.4)");
    atmosphere.addColorStop(0.7, "rgba(255,255,255,0.04)");
    atmosphere.addColorStop(1, "rgba(255,255,255,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 30, 0, Math.PI * 2);
    ctx.fillStyle = atmosphere;
    ctx.fill();

    const shadow = ctx.createRadialGradient(cx + 90, cy + 80, 20, cx, cy, radius + 40);
    shadow.addColorStop(0, "rgba(0,0,0,0)");
    shadow.addColorStop(0.5, "rgba(0,0,0,0.12)");
    shadow.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.beginPath();
    ctx.ellipse(cx + 90, cy + 90, radius + 26, radius + 32, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = shadow;
    ctx.fill();
  }

  function animate() {
    state.spin += 0.006;
    drawEarth();
    requestAnimationFrame(animate);
  }

  animate();

  const updateParallax = (event) => {
    const rect = planetScene.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;

    planetScene.style.setProperty("--pointer-y", `${(-py * 28).toFixed(2)}deg`);
    planetScene.style.setProperty("--pointer-x", `${(px * 28).toFixed(2)}deg`);
    planetScene.style.setProperty("--pointer-shift-x", `${(px * 14).toFixed(2)}px`);
    planetScene.style.setProperty("--pointer-shift-y", `${(py * 14).toFixed(2)}px`);
    earthCanvas.style.transform = `rotateX(${(-py * 18).toFixed(2)}deg) rotateY(${(px * 24).toFixed(2)}deg)`;
  };

  planetScene.addEventListener("pointermove", updateParallax);
  planetScene.addEventListener("pointerleave", () => {
    planetScene.style.setProperty("--pointer-y", "0deg");
    planetScene.style.setProperty("--pointer-x", "0deg");
    planetScene.style.setProperty("--pointer-shift-x", "0px");
    planetScene.style.setProperty("--pointer-shift-y", "0px");
    earthCanvas.style.transform = "rotateX(-10deg) rotateY(12deg)";
  });
}
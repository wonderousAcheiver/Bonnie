// This is the code to handle the prompt requests made in the prompt page

const prompt_form = document.getElementById("prompt-section");
const prompt_inp = document.getElementById("prompt-input");

prompt_form.addEventListener("submit", function (event) {
    event.preventDefault();
    fetch("/plan_prompt", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "user_prompt": prompt_inp.value
        })
    })
    .then(response => response.text())
    .then(data => {
        const parsed_json = JSON.parse(data);
        console.log(parsed_json)
    })
    
})
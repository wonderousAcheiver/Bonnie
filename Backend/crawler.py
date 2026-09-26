# to crawl websites
from crawl4ai import AsyncWebCrawler
import asyncio
from crawl4ai.async_configs import BrowserConfig, CrawlerRunConfig

# others
import ollama
import requests
from bs4 import BeautifulSoup
import urllib.parse
from concurrent.futures import ThreadPoolExecutor


# initialization
USER_PROMPT = ""
with open("raw_md.md", "w") as file_raw:
    file_raw.write("")

with open("AI_results.md", "w") as results_file:
    results_file.write("")

# function to generate a one-liner URL statement that can be used to search for stuff
def one_liner_gen(user_prompt: str):
    global USER_PROMPT
    response = ollama.chat("qwen2.5-coder:1.5b",
                        messages = [{
                            "role":"system",
                            "content":(
                                "Convert the user's request into a short lowercase search query "
                                "of no more than 8 words. Output only the query, nothing else."
                                )},
                            {
                            "role":"user",
                            "content":user_prompt
                            }
                        ])

    one_liner = response["message"]["content"].strip()
    USER_PROMPT = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote_plus(one_liner)}"
    return f"https://html.duckduckgo.com/html/?q={urllib.parse.quote_plus(one_liner)}"

# function to take the URL, grab all the result-webaddresses it can find, return top 10 as list
def top_urls(URL: str):
    try:
        Headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive",
        }
        response = requests.get(URL, headers=Headers)
        if response.status_code not in range(200,300,1):
            raise "Response not found"
        
        # Soup object that has the job of parsing html docs
        soup = BeautifulSoup(response.text, "html.parser")
        links= []
        for a_tag in soup.find_all("a", href=True):
            href = a_tag.get("href")
            if "uddg=" in href:
                href_split = href.split("uddg=")[-1]
                href_split = urllib.parse.unquote(href_split).split("&rut=")[0]
                links.append(href_split)

    except "Response not found":
        print(f"Bad response {response.status_code}")

    # Doing multithreaded (3 workers here) to scrape the data of the website passed to the worker
    with ThreadPoolExecutor(max_workers=3) as workers:
        for link in links:
            workers.submit(handle_url, link)

# The function where the worker AI, takes the url, scrapes for content and returns back a json
def handle_url(URL: str):
    print(USER_PROMPT)
    raw_md_file = open("raw_md.md", "a")
    # fit_md_file = open("fit_md.md", "w")

    result = asyncio.run(crawl(URL))
    raw_md_file.write(result)
    response = ollama.chat(
    model="qwen2.5-coder:1.5b",
    messages=[
        {
            "role": "system",
            "content": (
                "Take the content & user_prompt from the user and give a json "
                "formatted result of the content that you think is nearly relevant to "
                "the User's prompt. format of json: "
                "{{'place name': '<name of the place>', 'description': '<description of what activities can be done in the place>'}}"
            )
        },
        {
            "role": "user",
            "content": f"URL content:\n{result.markdown}\nuser_prompt: {USER_PROMPT}"
        }
    ])
    with open("AI_results.md", "a") as results_file:
        results_file.write(response["message"]["content"])
    raw_md_file.close()

async def crawl(URL: str):
    result = ""
    browser_config = BrowserConfig()
    crawler_config = CrawlerRunConfig()
    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(URL, config=crawler_config)
    return result.markdown
    
# Need to make a function or object, whatever that can automatically crawl using the function from here

if __name__ == "__main__":
    one_liner = one_liner_gen("Fine dining restaurants in Rome")
    print(one_liner)
    links = top_urls(one_liner)
    print(links)
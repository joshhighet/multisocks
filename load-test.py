import asyncio
import aiohttp
import aiohttp_socks
import time
import requests
import logging

logging.basicConfig(
    format="%(asctime)s [%(levelname)s]: %(message)s",
    level=logging.INFO
)

def fetch_urls_from_api():
    try:
        response = requests.get("https://ransomwhat.telemetry.ltd/groups")
        response.raise_for_status()
        data = response.json()
        urls = []
        for group in data:
            for location in group.get("locations", []):
                if location.get("available") == True:
                    urls.append(location.get("slug"))
        return urls
    except requests.RequestException as e:
        logging.error(f"An error occurred: {e}")
        return []

async def fetch_url(session, url, semaphore: asyncio.Semaphore):
    async with semaphore:
        start_time = time.time()
        try:
            async with session.get(url, ssl=False) as response:
                duration = time.time() - start_time
                logging.info(f"Fetched {url} with status {response.status}. Time taken: {duration:.2f} seconds")
        except Exception as e:
            logging.error(f"Failed to fetch {url}. Error: {e}")

async def main():
    urls = fetch_urls_from_api()
    semaphore = asyncio.Semaphore(200)
    proxy = "socks5://multisocks.dark:8080"
    connector = aiohttp_socks.ProxyConnector.from_url(proxy)
    timeout = aiohttp.ClientTimeout(total=30)
    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
        tasks = [fetch_url(session, url, semaphore) for url in urls]
        await asyncio.gather(*tasks)

if __name__ == '__main__':
    asyncio.run(main())

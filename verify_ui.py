from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:8000')

        # Scroll down to ensure images or lazy-loaded content might show
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

        # Take a screenshot
        page.screenshot(path='screenshot.png', full_page=True)

        # Check if "To-Do App" is on the page
        content = page.content()
        if "To-Do App" in content:
            print("Successfully found 'To-Do App' on the page.")
        else:
            print("Failed to find 'To-Do App' on the page.")

        browser.close()

if __name__ == '__main__':
    verify_frontend()

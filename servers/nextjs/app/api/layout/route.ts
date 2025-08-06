import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupName = searchParams.get("group");
  console.log("API called with group:", groupName);

  if (!groupName) {
    console.warn("No group name provided in query params");
    return NextResponse.json({ error: "Missing group name" }, { status: 400 });
  }

  const schemaPageUrl = `http://localhost/schema?group=${encodeURIComponent(groupName)}`;
  console.log("Fetching client page:", schemaPageUrl);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-web-security"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(schemaPageUrl, {
      waitUntil: "networkidle0",
      timeout: 80000,
    });

    await page.waitForSelector("[data-layouts]", { timeout: 10000 });

    // Extract both data-layouts and data-group-settings attributes
    const { dataLayouts, dataGroupSettings } = await page.$eval(
      "[data-layouts]",
      (el) => ({
        dataLayouts: el.getAttribute("data-layouts"),
        dataGroupSettings: el.getAttribute("data-group-settings"),
      }),
    );

    let slides, groupSettings;
    try {
      slides = JSON.parse(dataLayouts || "[]");
    } catch (e) {
      console.error("Failed to parse data-layouts JSON:", e);
      slides = [];
    }
    try {
      groupSettings = JSON.parse(dataGroupSettings || "null");
    } catch (e) {
      console.error("Failed to parse data-group-settings JSON:", e);
      groupSettings = null;
    }

    // Compose the response to match PresentationLayoutModel
    const response = {
      name: groupName,
      ordered: groupSettings?.ordered ?? false,
      slides: slides.map((slide: any) => ({
        id: slide.id,
        name: slide.name,
        description: slide.description,
        json_schema: slide.json_schema,
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Error fetching or parsing client page:", err);
    return NextResponse.json(
      { error: "Failed to fetch or parse client page" },
      { status: 500 },
    );
  } finally {
    if (browser) await browser.close();
  }
}

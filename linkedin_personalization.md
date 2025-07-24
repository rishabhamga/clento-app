Personalized LinkedIn Sales Outreach API – Overview

We will build a REST API that accepts a person’s name, LinkedIn profile URL, product/pitch details (all the details generated on website analysis -Core Offering, Ideal Customer Profile, Competitive Advantages,Technology Stack, case studies, lead magnets, social proof, Your Value Proposition, Customer Pain Points, Success Stories & Proof),Campaign Language
, Message Sign Offs In English, tone of voice, Calls To Action,  then returns a highly personalized outbound sales message.  The flow is: (1) scrape or fetch public LinkedIn profile data for the lead, (2) extract key features (current title, company, skills, recent news or posts, etc.), (3) combine those details with our product context and tone into an OpenAI prompt, and (4) call the OpenAI API to generate a customized message. The result is a human-like, relevant sales outreach that goes beyond simple template variables.  The  service can also ingest CSV files of leads and process them in batch.  Throughout, we rely only on publicly visible LinkedIn data (profile info, posts, etc.) and user-provided context (product, tone) for personalization ￼ ￼.


we should scrape person linkedin profile, their company website, find any recent news about that company. and company's linkedin profile to make context for message

The Node.js handler would then scrape or retrieve profile data, assemble a prompt, call OpenAI, and return a response like {"message": "Hi Alice, I noticed... – Personalized message text ..."}.

Extracting Data from LinkedIn Profiles

To personalize effectively, we gather as many relevant facts as possible f  Key fields to scrape or fetch include:
	•	Name, Current Title, and Company: Who they are and where they work (e.g. “Alice Smith, VP of Sales at FinTech Corp”).
	•	Industry and Company Info: The company’s sector, size or recent news (e.g. funding round, product launch) ￼.
	•	Work History and Skills: Past roles or skills listed, which show background and expertise.
	•	Education and Locations: Schools or cities (for rapport or relevant alumni connections).
	•	Mutual Connections or Groups: Shared networks or groups can be a conversation starter.
	•	Recent Activity: Public posts, articles, or comments they made on LinkedIn (topics they care about).
	•	Achievements/News: Any awards, publications, or media mentions (if accessible via Google or LinkedIn search).
    •	News about company, funding announcement etc.

For example, one source notes that a LinkedIn profile scraper can extract “Name, Headline, Company, Designation, Industry, Location, [and] Recent roles” and output structured JSON ￼. Another summary lists profile name, title, company, contact info (if public), education, mutual connections, skills, etc. ￼.  In practice, you might use a Node.js library (like linkedin-profile-scraper) or a headless browser (Puppeteer/Selenium) to load the profile page and read these fields.  (Note: LinkedIn’s official API is restrictive – one must be a partner to access it ￼ – so most solutions use automated scraping of public data.)

For example, using Puppeteer in Node.js you could navigate to the LinkedIn URL and wait for key elements to load (LinkedIn is highly dynamic) ￼.  A workflow example uses Selenium (similar to Puppeteer) because LinkedIn only loads content once it’s scrolled into view ￼.  In Node, you’d do something like:

const puppeteer = require('puppeteer');
// ...
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto(linkedinUrl, { waitUntil: 'networkidle0' });
// Wait for and scrape elements, e.g.:
const name = await page.$eval('.pv-top-card--list li', el => el.innerText);
const title = await page.$eval('.pv-top-card--experience-list', el => el.innerText);
// ...and so on for company, skills, etc.
await browser.close();

Store all scraped facts (as JSON) for the next step.  Important: respect privacy and LinkedIn’s terms – only scrape data that is publicly visible and stay within rate limits ￼ ￼.

Personalization Data Sources

Once we have the raw data, we decide which facts to feed into the message.  Good personalization comes from selecting salient details about the person and their company. Based on best practices:
	•	Mention their role and responsibilities.  Reference their current job title and a key responsibility. E.g. “As the VP of Marketing at X, you’re likely focused on….” ￼.
	•	Reference recent milestones.  If their company had a recent funding round, product launch, or press mention, congratulate or tie it to your pitch. For example: “Congrats on your Series B funding – many companies at that stage use [our solution] to manage growth.” ￼.
	•	Use tech or industry context.  If you know their company’s tech stack or industry (e.g. they use Salesforce, or work in healthcare), mention how your product fits.  Example: “I see your team uses [Tool] – our platform integrates seamlessly with it.” ￼.
	•	Skills and interests.  If they list skills or have posted about certain topics, sprinkle in relevant keywords (e.g. “I noticed you’ve written about machine learning”).  Tools like GPT can integrate these naturally.
	•	Mutual connections/groups.  A line like “I also see we both know [Name]/are in [Group],” can build rapport.
	•	Personal achievements.  If they won an award or published something, mention it.  This shows you did homework.
	•	Product alignment.  Tailor the pitch to their needs. For example, if the product is a finance app and they work in finance, highlight features relevant to finance workflows.
	•	Tone & Message Style.  Always adhere to the requested tone. If “friendly,” use a casual opener. If “formal,” keep it professional. The API input for tone will guide the AI.

Studies and guides emphasize that contextual, data-driven personalization greatly boosts response rates.  One guide notes: “OpenAI leverages data like LinkedIn bios, recent news, and company updates to generate tailored icebreakers,” e.g. a personalized opener: “I noticed you’ve recently scaled your sales team at [Company]…” instead of “Hope you’re doing well.” ￼.  In general, a message that mentions the recipient’s role, achievements or challenges feels much more authentic than a generic template ￼.

In summary, we should feed all useful parameters into our AI prompt: name, title, company, industry, recent news or achievements, common connections, plus the product context and desired tone.  The more relevant facts (ideally one or two strong details) we include, the more personal the output will be ￼ ￼. As one AI outreach example shows, prompt engineering might say: “Given that [Name] is [Job Title] at [Company], and [recent achievement/news], write a personalized LinkedIn connection message in a [tone] style.”

Building the OpenAI Prompt

With all data in hand, we construct a prompt for OpenAI’s language model (e.g. GPT-4 or GPT-3.5 Turbo) to generate the message.  A good prompt clearly instructs the model and provides context. For example, we might build something like:

You are a professional sales outreach writer. 
Target: [Name], [Job Title] at [Company], in the [Industry] industry, located in [Location]. 
Context: We connect on [common factor, e.g. "we both know X"].
Recent news: [If any, e.g. "Their company just raised $50M", or "they published an article on Y"].
Product: [Brief product pitch or value proposition].
Tone: [e.g. "friendly and conversational"].
Task: Write a personalized LinkedIn message to [Name] that references the above details, establishes a connection, and briefly explains how [Product] could benefit them. Keep it concise (2–3 sentences) and authentic.

In code, that might look like:

const prompt = `
You are an expert LinkedIn outreach copywriter.
Recipient: ${name}, ${title} at ${company}.
Industry: ${industry}. Mutual: ${mutualConnection || 'none'}.
Recent milestone: ${milestone || 'none'}.
Product pitch: ${productContext}.
Tone: ${tone}.
Write a personalized connection request or message to ${name} that feels genuine and relevant, using these details.
`;

This prompt mixes user data and scraped info in a structured way.  Alternatively, one could feed an array of messages to the Chat API (system/user roles). For example, using the Node.js OpenAI client:

const completion = await openai.createChatCompletion({
  model: "gpt-4",
  messages: [
    { role: "system", content: "You are a sales outreach specialist." },
    { role: "user", content: prompt }
  ],
  temperature: 0.7
});
const personalizedMessage = completion.data.choices[0].message.content;

The key is that the prompt tells the AI exactly which details to highlight and the tone to adopt.  As one example prompt from a sales automation tool suggests: “Given a person’s name and company, gather key details like job title, achievements, posts, etc., and use them to write a highly personalized LinkedIn connection request that feels genuinely relevant.” ￼.  We emulate that by directly supplying the known details.

By feeding the model this rich context, GPT can produce messages that far outperform basic templates. Studies show AI-generated, context-aware openers can double or triple reply rates compared to generic ones ￼ ￼. In short: the better and more specific the input data, the better the personalization.

Node.js API Implementation

In Node.js, we typically use Express (or a similar framework) to build the API.  We also use the official OpenAI Node client. The high-level steps in our handler are:
	1.	Parse input: Accept JSON (or form-data for CSV). Extract name, linkedinUrl, product, tone, etc.
	2.	Scrape LinkedIn profile: Using a headless browser or API, load the LinkedIn URL and extract fields (see above). For example, use the linkedin-profile-scraper NPM library or a custom Puppeteer script. Collect data into variables like title, company, industry, recentNews, etc.
	3.	(Optional) Enrich data: You may also query third-party services or perform web searches for any additional public info (news articles, social posts) if needed.
	4.	Build OpenAI prompt: Combine all pieces into a formatted prompt string as described above.
	5.	Call OpenAI API: Use openai.createChatCompletion (for GPT-3.5+/GPT-4 chat models) or openai.createCompletion with an instructive prompt. For example, referencing Bits and Pieces blog:

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);
const completion = await openai.createCompletion({
  model: "text-davinci-003",
  prompt: finalPrompt,
  max_tokens: 150
});
const message = completion.data.choices[0].text;

(For chat models you would use createChatCompletion with a messages array as shown earlier ￼.)

	6.	Return result: Send back JSON such as {"personalizedMessage": message}.

A simple Express endpoint might look like this (adapted from example patterns ￼ ￼):

require("dotenv").config();
const express = require("express");
const { Configuration, OpenAIApi } = require("openai");
const app = express();
app.use(express.json());

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

app.post("/personalize", async (req, res) => {
  try {
    const { name, linkedinUrl, product, tone } = req.body;
    // 1. Scrape LinkedIn profile for data (async function)
    const profileData = await scrapeLinkedIn(linkedinUrl);
    // 2. Construct prompt
    const prompt = buildPrompt(name, profileData, product, tone);
    // 3. Call OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You write personalized LinkedIn outreach messages." },
        { role: "user", content: prompt }
      ]
    });
    const personalizedMessage = completion.data.choices[0].message.content.trim();
    // 4. Return the message
    res.json({ success: true, message: personalizedMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));

This skeleton sets up the OpenAI config and an /personalize endpoint. The key parts – scraping and prompt-building – are abstracted into functions (scrapeLinkedIn, buildPrompt) for clarity. The code above is inspired by OpenAI’s Node.js examples ￼ ￼.

CSV Bulk Processing

If you upload a CSV with many leads, you can either loop them in one request or handle them row-by-row. For example, using the csv-parser library, you could read each line and call the API logic sequentially or in parallel (within rate limits). For instance:

const fs = require('fs');
const csv = require('csv-parser');
app.post("/bulk-personalize", (req, res) => {
  // Assume a CSV file path is provided or uploaded
  const results = [];
  fs.createReadStream(req.body.csvFilePath)
    .pipe(csv(['name','linkedinUrl','product','tone']))
    .on('data', async (data) => {
      const { name, linkedinUrl, product, tone } = data;
      const profileData = await scrapeLinkedIn(linkedinUrl);
      const prompt = buildPrompt(name, profileData, product, tone);
      const completion = await openai.createChatCompletion({ /* ... */ });
      results.push(completion.data.choices[0].message.content.trim());
    })
    .on('end', () => {
      res.json({ messages: results });
    });
});

This loops through each CSV row, personalizes it, and collects the messages. (In practice, handle async carefully to avoid overwhelming the API, and consider batching.) Tools like Google Sheets integrations (using Apps Script + GPT) can also do similar batching ￼ ￼.

Putting It All Together

By combining LinkedIn data scraping with OpenAI’s language generation, our API delivers hyper-personalized sales outreach. Unlike basic tools (e.g. Clay, which uses simple placeholders), we drive personalization from many data points: job info, company news, skills, etc. The OpenAI model then weaves these into a fluent message. For instance, an output might say:

“Hi Alice – I saw you just launched FinTech Corp’s new analytics platform. As the VP of Sales, I bet you’re focused on scaling. Our AI sales assistant integrates with your CRM to help teams ramp up outreach during growth. Curious to connect?”

This kind of message references Alice’s recent product launch, her role, and ties in the pitch, all in a friendly tone.

Sources: Data points come from LinkedIn (scraped fields ￼ ￼) and public news; personalization techniques are drawn from outreach best-practices (e.g. referencing role/milestones ￼ ￼); and the Node.js/OpenAI integration follows standard patterns ￼ ￼. Always test and adjust your prompts for best results. With this design, your API will generate very high-quality, AI-crafted personalized messages – surpassing template-based approaches – by leveraging all available parameters about each lead.
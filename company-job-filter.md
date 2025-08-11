Product Requirements Document (PRD)
Product Title:
LinkedIn Job Profile Scanner from CSV

Objective
Build a tool that accepts a CSV file containing LinkedIn company URLs (column: LinkedIn URL) and returns how many people with specific job titles (provided in a predefined list) are found on each company's LinkedIn page.

Scope
This tool is focused on identifying the presence of relevant job titles (related to Sales, Revenue, GTM, etc.) within LinkedIn company profiles. The primary goal is to count and return the number of individuals at each company matching the predefined job roles.

Input
CSV File Format
Required Column: LinkedIn URL
Required Column : company website


Example Value: https://www.linkedin.com/company/legistify-legaltech
https://clento.ai







Accepted Job Titles  Department(to search for):

Sales
Engineering
Product
Marketing
Logistics
Operation
Machine learning 
IT support
Customer support
Etc.


Accepted Job Titles (optional) can be given  along with department examples :
Chief Revenue Officer
CRO
Chief Growth Officer
CGO
Chief Sales Officer
CSO
Chief Commercial Officer
CCO
VP Revenue
VP of Revenue
VP Sales
Vice President Sales
VP of Commercial
Head of Sales
Head of Revenue
Head of Commercial
Head of Growth
Director of Sales
Director Sales
Sales Director
VP Go To Market
Head of GTM
GTM Lead
GTM Manager
Go-to-Market Strategist
Revenue Operations
RevOps
Director RevOps
Sales Operations
Sales Ops


Output
CSV Format
For each row in the input CSV, the output CSV will contain:
LinkedIn URL
Matching Profiles Count
https://www.linkedin.com/company/abc
3
https://www.linkedin.com/company/xyz
0

 Along with company name and website and job match resource link
Features
1. CSV Upload
Allow users to upload a .csv file with desired coloumn
2. LinkedIn Scraping and company career page scraping
For each LinkedIn company page:


Access the active jobs for that company
See it the job matches the department and the title (if provided)
Check if job titles match (exact or fuzzy match) any of the predefined titles.


For each company check their website career page also to find the same or similar job
 
3. Title Matching
Perform case-insensitive matching.


Allow for fuzzy match (e.g., minor typos, different formatting like “VP - Sales”).


Standardize abbreviations (e.g., “CRO” = “Chief Revenue Officer”).


4. Output Generation
Provide downloadable output CSV with:


Original csv data and


Count of matching profiles.


5. Status Handling
If a URL is invalid or inaccessible, return a matching count of 0 with an error note (optional enhancement).



Assumptions and Constraints
LinkedIn may restrict scraping or limit API access — legal or rate-limit considerations must be handled.


Matching is based solely on visible public titles or API-accessible data.


Only one column is required (LinkedIn URL); additional columns are ignored.



Out of Scope
Enrichment of titles beyond predefined list.






Success Metrics
95%+ match rate on valid LinkedIn URLs.


Accurate count of job titles across input dataset.


CSV output delivered with required feilds

Future Enhancements (Optional)
Allow user-defined job title list upload.


Export enriched job title data (names, titles, links) alongside counts.


Support for other social platforms or directories (e.g., Crunchbase, Apollo).


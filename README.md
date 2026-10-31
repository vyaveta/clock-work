# Next.js template

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```
# Job scraper node

The Job Scraper & Matcher node reads resume text from the incoming workflow context (default path: `resumeText`), searches India listings from Adzuna and/or JSearch, ranks the results against resume keywords, and upserts matches into MongoDB's `matched_jobs` collection. Stored job details are optional; the unique `(userId, dedupeKey)` index prevents duplicate records while allowing later runs to fill in missing details.

Manual workflow runs that contain this node ask for resume text. The dialog accepts pasted text or `.txt`/`.md` files; the resume text is passed only with that run and is not saved with the workflow or job records. For external triggers, configure the node's resume context path to the form field or other incoming string value.

Configure these server environment variables:

```text
MONGODB_URI=<MongoDB connection string>
MONGODB_DATABASE=clock_work
ADZUNA_APP_ID=<Adzuna application ID>
ADZUNA_APP_KEY=<Adzuna application key>
JSEARCH_API_KEY=<RapidAPI key for JSearch>
```

At least one job source's credentials must be configured. Adzuna's API is for personal job search and its terms require attribution when listings are displayed. The node uses documented APIs/aggregators and does not scrape LinkedIn directly.

# At a Glance

A serverless daily dashboard for weather, local events, entertainment, and knowledge, built with React, TypeScript, Python, and AWS.

[View Live App](https://d6ul0xqk7ua47.cloudfront.net/)

![At a Glance dashboard](docs/dashboard.png)

## About

At a Glance is a serverless dashboard designed to surface useful daily information in one place, tailored to where you live. It combines weather forecasts, nearby concert events, upcoming movies and music releases, historical events, trivia, and vocabulary across a responsive interface built for desktop, tablet, and mobile.

Rather than using a traditional always-running backend, the application uses EventBridge Scheduler to trigger AWS Lambda functions that periodically fetch and normalize data. Precomputed JSON and static assets are stored in Amazon S3 and delivered through Amazon CloudFront.

## AWS Architecture

![At a Glance AWS architecture](docs/architecture.png)

## Engineering Decisions & Tradeoffs

### Simplifying the Architecture
The original version used a traditional FastAPI and PostgreSQL backend hosted on EC2 and later Lightsail. As the project evolved, it became clear that most data could be fetched ahead of time rather than computed on demand. Moving to scheduled Lambda producers and static S3 data removed the need for an always-running application server and database, reducing both cost and operational complexity.

### Freshness vs. Reliability
Data sources use different refresh and cache intervals based on how quickly their content changes. If an upstream API fails, the system preserves the last successful snapshot, favoring temporary staleness over unavailable or invalid data.

### Failure Isolation
Each external API has an independent Lambda producer and failure boundary. This adds some configuration, but prevents one failing integration from disrupting unrelated data and keeps each producer independently testable.

### Predictable API Usage
External APIs are fetched on scheduled cadences rather than on page views. This makes usage predictable, stays within API limits, and allows refresh frequency to match how quickly each source changes.

### Cost as a Design Constraint
The system was designed for near-zero ongoing cost, using scheduled compute and cached static delivery instead of idle infrastructure. This limits some runtime flexibility in exchange for predictable costs and minimal infrastructure to operate.

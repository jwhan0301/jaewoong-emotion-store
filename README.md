# Jaewoong Emotion Store

An AI-assisted web application for recording emotions, organizing personal thoughts, and reviewing emotional patterns over time.

This project was developed using OpenAI Codex. I defined the emotion categories, recording workflow, screen layout, filtering options, and desired user experience through natural-language instructions, then tested and refined the generated application iteratively.

## Features

- Select an emotion category
- Record the intensity or clarity of an emotion
- Write a personal note about the current state
- Save emotion records by date
- Review weekly emotion patterns
- View frequently selected emotions
- Display average emotion intensity
- Filter records by emotion category
- Organize records using keywords and tags
- Browse previous entries

## Motivation

I wanted to create a more structured alternative to a traditional free-form diary.

Rather than recording only a long paragraph, the application organizes each entry using an emotion category, intensity level, written note, date, and optional keywords.

The basic workflow is:

```text
Select an emotion
        ↓
Record its intensity
        ↓
Write a personal note
        ↓
Save the entry
        ↓
Review weekly patterns
        ↓
Search or filter previous records
```

## Emotion Categories

The application is organized around categories such as:

- Calm
- Energetic
- Low
- Anxious
- Reflective
- Other

Users can select a category and add more detailed information through notes and keywords.

## Tech Stack

The project includes the following technologies:

- Next.js
- React
- TypeScript
- Cloudflare Workers
- Wrangler
- Drizzle ORM
- HTML and CSS

## Development Approach

This project was created through AI-assisted development.

Most of the application code was generated and revised with the help of OpenAI Codex. I did not write the entire codebase from scratch.

My role focused on:

- Defining the purpose of the application
- Deciding how emotions should be categorized
- Planning the recording workflow
- Determining the screen layout and interactions
- Describing requested features in natural language
- Running and testing the application
- Identifying unexpected behavior
- Providing feedback for corrections
- Refining the interface and functionality through repeated testing

Through this process, I gained experience in turning a personal idea into a working application using an AI coding tool.

## Project Structure

The main project structure includes:

```text
app/
├── page.tsx
├── layout.tsx
└── globals.css

db/
drizzle/
public/
worker/

package.json
next.config.ts
vite.config.ts
tsconfig.json
```

## Running Locally

Install the required packages:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Additional configuration may be required depending on the local environment and deployment settings.

## What I Learned

Through this project, I gained experience with:

- AI-assisted web application development
- Converting an abstract idea into specific requirements
- Designing a user-centered recording workflow
- Structuring information using categories, values, notes, and tags
- Testing generated features
- Iteratively refining application behavior
- Understanding the basic structure of a web project
- Managing packages with npm
- Managing a project with Git and GitHub
- Debugging through repeated testing and feedback

## Privacy Note

This repository contains application source code only.

Personal journal entries or other private user data should not be committed to a public repository. Any environment variables, credentials, or private data files should be excluded through `.gitignore`.

## Limitations

This project is a personal learning project rather than a medical or psychological assessment tool.

It is intended only for personal reflection and record keeping. The displayed patterns and statistics should not be interpreted as professional mental-health evaluations.

The code was not written entirely from scratch, and my current focus is on learning how to understand, test, and improve AI-generated applications.

## Project Goal

The goal of this project was to transform a personal emotion-recording idea into a usable web application and to gain practical experience with AI-assisted development.

Rather than only generating an application, I focused on defining the desired behavior, testing the result, identifying problems, and improving the application through repeated feedback.

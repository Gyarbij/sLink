# sLink

sLink is a URL shortener application designed to make long URLs easier to manage and share. This project is built using Node.js and Express, and can be easily run using Docker or npm.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Running with Docker](#running-with-docker)
  - [Building and Running Locally with Docker](#building-and-running-locally-with-docker)
  - [Running with npm](#running-with-npm)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Features

- Shorten long URLs
- Track click statistics
- Simple and easy-to-use dashboard
- API for programmatic access

## Prerequisites

- [Docker](https://www.docker.com/get-started) (for Docker installation)
- [Node.js](https://nodejs.org/en/download/) and npm (for local installation)

## Installation

### Running with Docker

You can quickly get sLink up and running using the pre-built Docker image:

1. **Pull the Docker image from GitHub Container Registry:**

   ```sh
   docker pull ghcr.io/gyarbij/slink:latest
   ```

   Or from Docker Hub:

   ```sh
   docker pull gyarbij/slink:latest
   ```
   
Available tags:
- `latest`: The most recent stable release
- `main`: The current state of the main branch
- `dev`: The development version
- Semantic versioning tags (e.g., `v1.0.0`, `v1.1.0`)

To use a specific version, replace `latest` with the desired tag.

2. **Run the Docker container:**

   ```sh
   docker run --name slink -p 36:36 ghcr.io/gyarbij/slink:latest
   ```

   Or from Docker Hub:

   ```sh
   docker run --name slink -p 36:36 gyarbij/slink:latest
   ```

### Building and Running Locally with Docker

To build and run the sLink application locally using Docker:

1. **Clone the repository:**

   ```sh
   git clone https://github.com/Gyarbij/sLink.git
   cd sLink
   ```

2. **Build the Docker image:**

   ```sh
   docker build -t slink:local .
   ```

3. **Run the Docker container:**

   ```sh
   docker run --name slink -p 36:36 slink:local
   ```

### Running with npm

To run the sLink application locally using npm:

1. **Clone the repository:**

   ```sh
   git clone https://github.com/Gyarbij/sLink.git
   cd sLink
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Run the application:**

   ```sh
   npm start
   ```

   The application will start on the default port 36.

## Usage

Once the application is running, you can access the dashboard by navigating to `http://localhost:36` in your web browser. Use the dashboard to create and manage shortened URLs.

TBD - More advanced usage instructions and screenshots.

## API Endpoints

- **GET /:id** - Redirect to the original URL
- **GET /api/list** - Get a list of shortened URLs
- **DELETE /api/delete/:id** - Delete a shortened URL
- **POST /api/update/:id** - Update a shortened URL
- **POST /api/create** - Create a new shortened URL

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
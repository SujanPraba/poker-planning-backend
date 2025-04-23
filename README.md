# Planning Poker Backend

This is the NestJS backend for the Planning Poker application.

## Description

Backend service providing real-time WebSocket API for Planning Poker sessions with PostgreSQL persistence.

## Features

- Session management
- User authentication (guest mode)
- Voting mechanism (Fibonacci and T-shirt sizing)
- Story management
- Real-time collaboration using WebSockets
- PostgreSQL database integration

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## PostgreSQL Configuration

The application connects to PostgreSQL using the following configuration:
- Host: localhost
- Port: 5432
- Username: postgres
- Password: admin
- Database: planning_poker

Make sure PostgreSQL is installed and running on your system before starting the application.

## API Documentation

The backend exposes WebSocket endpoints for the following operations:

- Create session
- Join session
- Add story
- Start voting
- Submit vote
- Reveal votes
- Finish voting
- Next story
- Timer functionality

## Tech Stack

- NestJS
- PostgreSQL with TypeORM
- Socket.IO for WebSockets
- TypeScript

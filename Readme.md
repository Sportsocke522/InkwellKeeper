# Inkwell Keeper

## About
Inkwell Keeper is a self-hosted solution for digitally managing your Lorcana card collection. It allows users to track their own cards, browse collections of friends and family, and organize decks efficiently. The tool is in an early development stage (v0.1) and continuously improving.

### Features
- Digital collection management for Lorcana cards
- Personal and shared collection browsing
- Deck management (currently only visible to the owner)
- Ability to see which friends own specific cards (for potential trades)
- Self-hosted solution with Docker-based deployment
- Available in **English, German, and Spanish**

## Disclaimer
This project is currently in a very early stage (v0.1). Feature requests and bug reports are highly welcome! Please submit issues on GitHub if you encounter any problems or have suggestions.

## Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/sportsocke522/InkwellKeeper.git
   cd InkwellKeeper
   ```
2. Configure the environment variables:
   - Copy the `.env.example` file and rename it to `.env`.
   - Adjust the ports or other variables if needed.

3. Start the application using Docker:
   ```sh
   docker-compose up -d
   ```
4. Default ports (can be adjusted in `.env`):
   - Backend: `3002`
   - Database: `3003`
   - Frontend: `3001` (access the application via this port)

5. Initial setup:
   - Once all containers are running, open the frontend.
   - Register your first user (this user will automatically be set as admin).
   - After logging in, complete the setup wizard (a popup will guide you through the process).

## Environment Variables
Below are the most relevant environment variables that might need to be adjusted:

### Backend
- `VITE_BACKEND_PORT=3002` – The port on which the backend server runs.
- `VITE_BACKEND_URL=http://localhost` – The address where the backend server is accessible. If using a reverse proxy, you can set this to `https://your-backend-domain.com`.
- `VITE_USE_BACKEND_PORT=true` – If a reverse proxy handles port forwarding, set this to `false`.

### Frontend
- `VITE_FRONTEND_PORT=3001` – The port on which the frontend server runs.
- `VITE_FRONTEND_URL=http://localhost` – The address where the frontend server is accessible. If using a reverse proxy, you can set this to `https://your-frontend-domain.com`.
- `VITE_USE_FRONTEND_PORT=true` – If a reverse proxy handles port forwarding, set this to `false`.
- `REACT_APP_BACKEND_URL=http://localhost:3002` – The full address of the backend. If a port is used, it must be included; otherwise, it can be omitted.

### Database
- `DATABASE_PORT=3003` – The port on which the database runs.

These are not all available environment variables, but they are the most commonly changed ones.

## Detailed Description
Inkwell Keeper enables users to maintain their Lorcana card collection in a structured and accessible way. While each user has their own collection, they can also browse through the collections of their friends, making it easier to track missing cards and consider potential trades. Additionally, the application offers deck-building capabilities, though currently, decks are only visible to their respective owners. Future updates will include features for sharing decks with friends.

### Special Thanks
A huge thanks to [lorcanajson.org](https://lorcanajson.org/) for providing the Lorcana card data.

## Future Plans
### Upcoming Features
- User management system (roles, admin functionality)
- Viewing decks from friends
- More granular settings for visibility of friends' collections

### Long-Term Vision
- The codebase is designed with flexibility in mind, potentially allowing for support of additional trading card games in the future. However, this is a distant goal and not an active development priority at this stage.

## Screenshots
Coming soon.

## Changelog
### v0.13
- fix mobile css
- implement PWA Support

### v0.12
- bugfixes for use with a proxy server

### v0.11
- .env support for port customizations
- update notification

### v0.1
- Initial release with core functionality:
  - Card collection management
  - Viewing friends' collections
  - Deck management (private to the owner)
  - Basic user system

## Contributors
- **sportsocke522** – Main developer

## License
This project is licensed under the **GPL License**.


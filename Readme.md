# Inkwell Keeper

## About
Inkwell Keeper is a self-hosted solution for digitally managing your Lorcana card collection. It allows users to track their own cards, browse collections of friends and family, and organize decks efficiently. The tool is in an early development stage (v0.1) and continuously improving.

### Features
- Digital collection management for Lorcana cards
- Personal and shared collection browsing
- Deck management
- Ability to see which friends own specific cards (for potential trades)
- Self-hosted solution with Docker-based deployment

## Disclaimer
This project is currently in a very early stage (v0.1). Feature requests and bug reports are highly welcome! Please submit issues on GitHub if you encounter any problems or have suggestions.

## Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/sportsocke522/InkwellKeeper.git
   cd InkwellKeeper
   ```
2. Start the application using Docker:
   ```sh
   docker-compose up -d
   ```
3. Default ports:
   - Backend: `3000`
   - Database: `3306`
   - Frontend: `5173` (access the application via this port)
4. Initial setup:
   - Once all containers are running, open the frontend.
   - Register your first user (this user will automatically be set as admin).
   - After logging in, complete the setup wizard (a popup will guide you through the process).

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
### v0.1
- Initial release with core functionality:
  - Card collection management
  - Viewing friends' collections
  - Deck management
  - Basic user system

## Contributors
- **sportsocke522** – Main developer

## License
This project is licensed under the **GPL License**.


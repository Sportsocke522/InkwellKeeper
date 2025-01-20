//importing express for using the express router
const express = require("express")
const router = express.Router()

//importing controller functions from controller directory
const {get_all_cards, 
    get_filtered_cards, 
    add_card_to_collection, 
    get_card_quantity, 
    get_owned_cards, 
    create_deck,
    get_user_decks,
    get_deck_details,
    add_card_to_deck,
    remove_card_from_deck,
    update_deck,
    get_user_collection } = require("../controllers/CardsControllers")
const authenticateToken = require("../middleware/authenticateToken"); // Middleware importieren

router.get("/all", authenticateToken, get_all_cards);
router.get("/filtered", authenticateToken, get_filtered_cards);
router.post("/collection/add", authenticateToken, add_card_to_collection);
router.get("/collection/quantity/:card_id", authenticateToken, get_card_quantity);
router.get("/collection/owned", authenticateToken, get_owned_cards);

router.post("/decks/create", authenticateToken, create_deck);
router.get("/decks", authenticateToken, get_user_decks);
router.get("/decks/:deck_id", authenticateToken, get_deck_details);
router.post("/decks/:deck_id/add_card", authenticateToken, add_card_to_deck);
router.delete("/decks/:deck_id/remove_card/:card_id", authenticateToken, remove_card_from_deck);
router.put("/decks/:deck_id/update", authenticateToken, update_deck);
router.get("/collection", authenticateToken, get_user_collection);




//exporting the routes here
module.exports = router
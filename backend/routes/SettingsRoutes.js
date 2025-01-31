//importing express for using the express router
const express = require("express")
const router = express.Router()

//importing controller functions from controller directory
const { is_ready, 
        is_admin, 
        is_new_reg, 
        set_setup_wizard, 
        set_new_reg, 
        set_language, 
        get_language, 
        get_game, 
        set_game, 
        get_seeFriends, 
        set_seeFriends,
        get_username,
        set_username,
        set_password
    } = require("../controllers/SettingsControllers")
const authenticateToken = require("../middleware/authenticateToken"); // Middleware importieren

//is admin and ready for setup Wizzard

router.get("/is_ready", authenticateToken, is_ready);
router.get("/is_admin", authenticateToken, is_admin)

router.get("/is_new_reg", authenticateToken, is_new_reg)
router.post("/set_new_reg", authenticateToken, set_new_reg)

router.get("/get_language", authenticateToken, get_language)
router.post("/set_language", authenticateToken, set_language)

router.get("/get_game", authenticateToken, get_game)
router.post("/set_game", authenticateToken, set_game)

router.get("/get_seeFriends", authenticateToken, get_seeFriends)
router.post("/set_seeFriends", authenticateToken, set_seeFriends)

router.post("/set_setup_wizard", authenticateToken, set_setup_wizard )

router.get("/get_username", authenticateToken, get_username);
router.post("/set_username", authenticateToken, set_username);
router.post("/set_password", authenticateToken, set_password);


//exporting the routes here
module.exports = router
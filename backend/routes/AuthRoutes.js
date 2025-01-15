//importing express for using the express router
const express = require("express")
const router = express.Router()

//importing controller functions from controller directory
const {SignUpController, LoginController} = require("../controllers/AuthControllers")

//sign up route here
router.post("/auth/signup", (req, res) => {
  //console.log("SignUp route called");  // Überprüfen, ob die Route erreicht wird
  SignUpController(req, res);
});

//login route here
router.post("/auth/login", LoginController)

//exporting the routes here
module.exports = router


  
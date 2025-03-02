const jwt = require("jsonwebtoken");


const authenticateToken = (req, res, next) => {
    const token = req.cookies.token; 
  
    if (!token) {
      return res.status(401).send("Access Denied");
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).send("Token is not valid");
      }
      req.user = user;
      next(); 
    });
  };
  
  
  
module.exports = authenticateToken;


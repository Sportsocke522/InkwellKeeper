//importing json web token to create a token function to be used during login attempt
const jwt = require("jsonwebtoken");

//main token function that will be sending the token with some information init
const token = (foundUser, response) => {
  const jwtToken = jwt.sign(
    {
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d"
    }
  );

  response.cookie("token", jwtToken, {
    httpOnly: true, // Token wird nicht im Browser zugänglich sein
    secure: process.env.NODE_ENV === 'production', // Cookie nur über HTTPS in der Produktion
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Tage Lebensdauer
  });

  return response.status(200).json({ msg: "token received" });
};


//exporting the created token
module.exports = token;